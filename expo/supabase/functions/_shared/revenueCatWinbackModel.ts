export const WINBACK_SEQUENCE_STEPS = [
  'trial_cancelled_value',
  'trial_cancelled_discount',
  'trial_expiring',
  'trial_expired_lifetime',
] as const;

export type WinbackSequenceStep = typeof WINBACK_SEQUENCE_STEPS[number];

export type NormalizedRevenueCatEvent = {
  eventId: string;
  appUserId: string | null;
  eventType: string;
  periodType: string | null;
  cancelReason: string | null;
  productId: string | null;
  store: string | null;
  purchasedAt: string | null;
  expirationAt: string | null;
  eventAt: string | null;
};

export type RevenueCatWebhookPayload = {
  event?: Record<string, unknown>;
};

export type WinbackQueueCandidate = {
  sequenceStep: WinbackSequenceStep;
  scheduledFor: string;
};

export type WinbackEventDecision =
  | { action: 'cancel_pending_winback'; reason: string }
  | { action: 'stored_only' }
  | { action: 'stored_invalid_app_user_id' }
  | { action: 'stored_unknown_user' }
  | { action: 'stored_no_marketing_consent' }
  | { action: 'stored_no_schedule' }
  | { action: 'queued'; schedule: WinbackQueueCandidate[] };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DISCOUNT_DELAY_MS = 12 * 60 * 60 * 1000;
const EXPIRING_BEFORE_MS = 6 * 60 * 60 * 1000;
const LIFETIME_AFTER_EXPIRATION_MS = 18 * 60 * 60 * 1000;
const MIN_EMAIL_GAP_MS = 3 * 60 * 60 * 1000;

const VOLUNTARY_CANCEL_REASONS = new Set([
  'UNSUBSCRIBE',
  'CUSTOMER_SUPPORT',
  'CANCELLED',
  'USER_CANCELLED',
]);

const BILLING_OR_SYSTEM_CANCEL_REASONS = new Set([
  'BILLING_ERROR',
  'DEVELOPER_INITIATED',
  'PRICE_INCREASE',
  'PRODUCT_NOT_AVAILABLE',
  'UNKNOWN',
]);

const BPD_PRODUCT_IDENTIFIERS = new Set([
  'bpd_monthly',
  'bpd_monthly:monthly',
  'bpd_yearly',
  'bpd_yearly:annual',
  'bpd_lifetime',
  'com.maximebellemare.bpdcompanion.monthly',
  'com.maximebellemare.bpdcompanion.yearly',
  'com.maximebellemare.bpdcompanion.lifetime',
]);

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asUpperString(value: unknown): string | null {
  return asString(value)?.toUpperCase() ?? null;
}

function millisToIso(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function dateLikeToIso(value: unknown): string | null {
  if (typeof value === 'number') return millisToIso(value);
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseTime(value: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function isValidSupabaseUserId(value: string | null): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

export function normalizeRevenueCatWebhookEvent(payload: RevenueCatWebhookPayload): NormalizedRevenueCatEvent | null {
  const event = payload.event;
  if (!event) return null;

  const eventId = asString(event.id) ?? asString(event.event_id);
  const eventType = asUpperString(event.type);
  if (!eventId || !eventType) return null;

  return {
    eventId,
    appUserId: asString(event.app_user_id),
    eventType,
    periodType: asUpperString(event.period_type),
    cancelReason: asUpperString(event.cancel_reason),
    productId: asString(event.product_id),
    store: asUpperString(event.store),
    purchasedAt: millisToIso(event.purchased_at_ms) ?? dateLikeToIso(event.purchased_at),
    expirationAt: millisToIso(event.expiration_at_ms) ?? dateLikeToIso(event.expiration_at),
    eventAt: millisToIso(event.event_timestamp_ms) ?? dateLikeToIso(event.event_timestamp),
  };
}

export function isBpdProductIdentifier(productId: string | null): boolean {
  if (!productId) return false;
  return BPD_PRODUCT_IDENTIFIERS.has(productId);
}

export function isVoluntaryTrialCancellation(event: NormalizedRevenueCatEvent): boolean {
  if (event.eventType !== 'CANCELLATION') return false;
  if (event.periodType !== 'TRIAL') return false;
  if (event.cancelReason && BILLING_OR_SYSTEM_CANCEL_REASONS.has(event.cancelReason)) return false;
  if (event.cancelReason && !VOLUNTARY_CANCEL_REASONS.has(event.cancelReason)) return false;
  if (event.productId && !isBpdProductIdentifier(event.productId)) return false;
  return true;
}

export function shouldCancelPendingWinbackForEvent(event: NormalizedRevenueCatEvent): boolean {
  if (!event.appUserId || !isValidSupabaseUserId(event.appUserId)) return false;
  if (event.productId && !isBpdProductIdentifier(event.productId)) return false;
  if (event.eventType === 'UNCANCELLATION') return true;
  if (event.eventType === 'RENEWAL') return true;
  if (event.eventType === 'NON_RENEWING_PURCHASE') return true;
  if (event.eventType === 'INITIAL_PURCHASE' && event.periodType !== 'TRIAL') return true;
  return false;
}

function pushIfSpaced(
  candidates: WinbackQueueCandidate[],
  sequenceStep: WinbackSequenceStep,
  scheduledAtMs: number,
): void {
  const previous = candidates.at(-1);
  if (previous) {
    const previousTime = new Date(previous.scheduledFor).getTime();
    if (scheduledAtMs - previousTime < MIN_EMAIL_GAP_MS) return;
  }
  candidates.push({
    sequenceStep,
    scheduledFor: new Date(scheduledAtMs).toISOString(),
  });
}

export function buildCancelledTrialWinbackSchedule(
  event: NormalizedRevenueCatEvent,
  nowIso: string,
): WinbackQueueCandidate[] {
  const nowMs = new Date(nowIso).getTime();
  const expirationMs = parseTime(event.expirationAt);
  if (!Number.isFinite(nowMs) || !expirationMs) return [];

  const candidates: WinbackQueueCandidate[] = [];
  const trialStillActive = nowMs < expirationMs;

  if (trialStillActive) {
    candidates.push({
      sequenceStep: 'trial_cancelled_value',
      scheduledFor: new Date(nowMs).toISOString(),
    });

    const discountAt = nowMs + DISCOUNT_DELAY_MS;
    if (discountAt < expirationMs) {
      pushIfSpaced(candidates, 'trial_cancelled_discount', discountAt);
    }

    const expiringAt = expirationMs - EXPIRING_BEFORE_MS;
    if (expiringAt > nowMs) {
      pushIfSpaced(candidates, 'trial_expiring', expiringAt);
    }
  }

  const lifetimeAt = Math.max(nowMs, expirationMs + LIFETIME_AFTER_EXPIRATION_MS);
  pushIfSpaced(candidates, 'trial_expired_lifetime', lifetimeAt);

  return candidates;
}

export function getWinbackEventDecision(input: {
  event: NormalizedRevenueCatEvent;
  nowIso: string;
  appUserIdMapsToUser: boolean;
  hasMarketingConsent: boolean;
}): WinbackEventDecision {
  const { event, nowIso, appUserIdMapsToUser, hasMarketingConsent } = input;

  if (shouldCancelPendingWinbackForEvent(event)) {
    return { action: 'cancel_pending_winback', reason: `revenuecat_${event.eventType.toLowerCase()}` };
  }

  if (!isVoluntaryTrialCancellation(event)) return { action: 'stored_only' };
  if (!event.appUserId || !isValidSupabaseUserId(event.appUserId)) return { action: 'stored_invalid_app_user_id' };
  if (!appUserIdMapsToUser) return { action: 'stored_unknown_user' };
  if (!hasMarketingConsent) return { action: 'stored_no_marketing_consent' };

  const schedule = buildCancelledTrialWinbackSchedule(event, nowIso);
  if (schedule.length === 0) return { action: 'stored_no_schedule' };
  return { action: 'queued', schedule };
}
