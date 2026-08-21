import assert from 'node:assert/strict';
import {
  buildCancelledTrialWinbackSchedule,
  getWinbackEventDecision,
  isValidSupabaseUserId,
  isVoluntaryTrialCancellation,
  normalizeRevenueCatWebhookEvent,
  shouldCancelPendingWinbackForEvent,
  type NormalizedRevenueCatEvent,
} from '@/supabase/functions/_shared/revenueCatWinbackModel';

const USER_ID = '3f1605fb-a8cf-4c46-83c6-52c5427f8053';
const NOW = '2026-08-15T12:00:00.000Z';
const EXPIRATION = '2026-08-17T12:00:00.000Z';

function event(overrides: Partial<NormalizedRevenueCatEvent> = {}): NormalizedRevenueCatEvent {
  return {
    eventId: 'evt_1',
    appUserId: USER_ID,
    eventType: 'CANCELLATION',
    periodType: 'TRIAL',
    cancelReason: 'UNSUBSCRIBE',
    productId: 'bpd_yearly:annual',
    store: 'PLAY_STORE',
    purchasedAt: '2026-08-14T12:00:00.000Z',
    expirationAt: EXPIRATION,
    eventAt: NOW,
    ...overrides,
  };
}

export function assertRevenueCatWinbackModelScenarios(): true {
  const normalized = normalizeRevenueCatWebhookEvent({
    event: {
      id: 'event-id',
      type: 'CANCELLATION',
      app_user_id: USER_ID,
      period_type: 'TRIAL',
      cancel_reason: 'UNSUBSCRIBE',
      product_id: 'bpd_monthly:monthly',
      store: 'PLAY_STORE',
      purchased_at_ms: Date.parse('2026-08-14T12:00:00.000Z'),
      expiration_at_ms: Date.parse(EXPIRATION),
      event_timestamp_ms: Date.parse(NOW),
    },
  });
  assert.equal(normalized?.eventId, 'event-id', 'RevenueCat event.id is parsed');
  assert.equal(normalized?.periodType, 'TRIAL', 'RevenueCat period_type is parsed');
  assert.equal(normalized?.expirationAt, EXPIRATION, 'RevenueCat expiration_at_ms is parsed');

  assert(isValidSupabaseUserId(USER_ID), 'valid Supabase UUID maps to user id');
  assert(!isValidSupabaseUserId('not-a-uuid'), 'invalid app_user_id is rejected');
  assert(isVoluntaryTrialCancellation(event()), 'voluntary trial cancellation is eligible');
  assert(!isVoluntaryTrialCancellation(event({ periodType: 'NORMAL' })), 'non-trial cancellation does not queue');
  assert(!isVoluntaryTrialCancellation(event({ cancelReason: 'BILLING_ERROR' })), 'billing cancellation does not queue');
  assert(!isVoluntaryTrialCancellation(event({ productId: 'other_product' })), 'unrelated product cancellation does not queue');

  const fullSchedule = buildCancelledTrialWinbackSchedule(event(), NOW);
  assert.deepEqual(
    fullSchedule.map(candidate => candidate.sequenceStep),
    ['trial_cancelled_value', 'trial_cancelled_discount', 'trial_expiring', 'trial_expired_lifetime'],
    'voluntary trial cancellation queues the full sequence when enough time remains',
  );
  assert(fullSchedule.slice(0, 3).every(candidate => candidate.scheduledFor < EXPIRATION), 'pre-expiration steps never schedule after expiration');
  assert(fullSchedule.length > 0, 'full schedule has a final step');
  const fullFinal = fullSchedule[fullSchedule.length - 1];
  assert(fullFinal.scheduledFor > EXPIRATION, 'lifetime step schedules after expiration');

  const delayedSchedule = buildCancelledTrialWinbackSchedule(
    event({ expirationAt: '2026-08-15T15:00:00.000Z' }),
    NOW,
  );
  assert.deepEqual(
    delayedSchedule.map(candidate => candidate.sequenceStep),
    ['trial_cancelled_value', 'trial_expired_lifetime'],
    'delayed webhook skips badly timed middle steps',
  );
  assert(delayedSchedule.length > 0, 'delayed schedule has a first step');
  const delayedFirst = delayedSchedule[0];
  assert(delayedFirst.scheduledFor < '2026-08-15T15:00:00.000Z', 'value email still occurs before expiration');

  const expiredSchedule = buildCancelledTrialWinbackSchedule(
    event({ expirationAt: '2026-08-15T10:00:00.000Z' }),
    NOW,
  );
  assert.deepEqual(
    expiredSchedule.map(candidate => candidate.sequenceStep),
    ['trial_expired_lifetime'],
    'already-expired trial only schedules lifetime step',
  );

  assert(shouldCancelPendingWinbackForEvent(event({ eventType: 'UNCANCELLATION' })), 'UNCANCELLATION cancels pending sequence');
  assert(shouldCancelPendingWinbackForEvent(event({ eventType: 'RENEWAL', periodType: 'NORMAL' })), 'paid renewal cancels pending sequence');
  assert(shouldCancelPendingWinbackForEvent(event({ eventType: 'INITIAL_PURCHASE', periodType: 'NORMAL' })), 'paid conversion cancels pending sequence');
  assert(shouldCancelPendingWinbackForEvent(event({ eventType: 'NON_RENEWING_PURCHASE', productId: 'bpd_lifetime' })), 'lifetime purchase cancels pending sequence');
  assert(!shouldCancelPendingWinbackForEvent(event()), 'original active trial cancellation does not cancel its own sequence');
  assert(!shouldCancelPendingWinbackForEvent(event({ appUserId: 'not-a-uuid', eventType: 'RENEWAL' })), 'invalid app_user_id safely does not cancel');

  assert.equal(
    getWinbackEventDecision({
      event: event(),
      nowIso: NOW,
      appUserIdMapsToUser: true,
      hasMarketingConsent: true,
    }).action,
    'queued',
    'marketing-consented voluntary trial cancellation queues sequence',
  );
  assert.equal(
    getWinbackEventDecision({
      event: event(),
      nowIso: NOW,
      appUserIdMapsToUser: true,
      hasMarketingConsent: false,
    }).action,
    'stored_no_marketing_consent',
    'trial cancellation with no marketing consent does not queue',
  );
  assert.equal(
    getWinbackEventDecision({
      event: event(),
      nowIso: NOW,
      appUserIdMapsToUser: false,
      hasMarketingConsent: true,
    }).action,
    'stored_unknown_user',
    'trial cancellation for non-mapped Supabase user does not queue',
  );
  assert.equal(
    getWinbackEventDecision({
      event: event({ appUserId: 'not-a-uuid' }),
      nowIso: NOW,
      appUserIdMapsToUser: true,
      hasMarketingConsent: true,
    }).action,
    'stored_invalid_app_user_id',
    'invalid app_user_id is stored but not queued',
  );
  assert.equal(
    getWinbackEventDecision({
      event: event({ eventType: 'UNCANCELLATION' }),
      nowIso: NOW,
      appUserIdMapsToUser: true,
      hasMarketingConsent: true,
    }).action,
    'cancel_pending_winback',
    'reactivation event cancels pending queue',
  );

  return true;
}

if (require.main === module) {
  assertRevenueCatWinbackModelScenarios();
}
