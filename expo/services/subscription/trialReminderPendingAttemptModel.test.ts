import {
  TRIAL_REMINDER_PENDING_ATTEMPT_WINDOW_MS,
  createPendingTrialReminderAttempt,
  getPendingTrialReminderDecision,
} from '@/services/subscription/trialReminderPendingAttemptModel';
import type { TrialEndingReminderReadiness } from '@/services/subscription/trialReminderModel';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Trial reminder pending-attempt regression failed: ${message}`);
}

const NOW = new Date('2026-08-12T12:00:00.000Z').getTime();

const readyMonthlyCandidate = {
  dedupeKey: 'bpd_monthly:monthly:purchase:expiration',
  expirationAt: NOW + 3 * 24 * 60 * 60 * 1000,
  productIdentifier: 'bpd_monthly:monthly',
  triggerAt: NOW + 2 * 24 * 60 * 60 * 1000,
};

const readyMonthly: TrialEndingReminderReadiness = {
  status: 'ready',
  candidate: readyMonthlyCandidate,
};

export function assertTrialReminderPendingAttemptRegressionScenarios(): true {
  const attempt = createPendingTrialReminderAttempt({
    accountGeneration: 4,
    now: NOW,
    ownerKey: 'owner:abc',
    productIdentifier: 'bpd_monthly',
  });

  assert(attempt.createdAt === NOW, 'pending attempt records creation time');
  assert(
    attempt.expiresAt === NOW + TRIAL_REMINDER_PENDING_ATTEMPT_WINDOW_MS,
    'pending attempt uses the session timeout window',
  );

  const waitingPeriod = getPendingTrialReminderDecision({
    accountGeneration: 4,
    attempt,
    now: NOW + 1000,
    ownerKey: 'owner:abc',
    readiness: { status: 'waiting_for_period_type' },
  });
  assert(waitingPeriod.action === 'wait', 'missing periodType keeps the purchase-scoped attempt alive');

  const waitingExpiration = getPendingTrialReminderDecision({
    accountGeneration: 4,
    attempt,
    now: NOW + 2000,
    ownerKey: 'owner:abc',
    readiness: { status: 'waiting_for_expiration' },
  });
  assert(waitingExpiration.action === 'wait', 'missing expiration keeps the purchase-scoped attempt alive');

  const ready = getPendingTrialReminderDecision({
    accountGeneration: 4,
    attempt,
    now: NOW + 3000,
    ownerKey: 'owner:abc',
    readiness: readyMonthly,
  });
  assert(ready.action === 'retry_schedule', 'later confirmed trial retries reminder scheduling');

  const paid = getPendingTrialReminderDecision({
    accountGeneration: 4,
    attempt,
    now: NOW + 4000,
    ownerKey: 'owner:abc',
    readiness: { status: 'not_trial', periodType: 'NORMAL' },
  });
  assert(paid.action === 'clear' && paid.reason === 'non_trial', 'confirmed paid purchase clears pending attempt');

  const accountChanged = getPendingTrialReminderDecision({
    accountGeneration: 5,
    attempt,
    now: NOW + 5000,
    ownerKey: 'owner:abc',
    readiness: readyMonthly,
  });
  assert(accountChanged.action === 'clear' && accountChanged.reason === 'account_changed', 'account generation change clears pending attempt');

  const ownerChanged = getPendingTrialReminderDecision({
    accountGeneration: 4,
    attempt,
    now: NOW + 6000,
    ownerKey: 'owner:def',
    readiness: readyMonthly,
  });
  assert(ownerChanged.action === 'clear' && ownerChanged.reason === 'account_changed', 'owner change clears pending attempt');

  const expired = getPendingTrialReminderDecision({
    accountGeneration: 4,
    attempt,
    now: NOW + TRIAL_REMINDER_PENDING_ATTEMPT_WINDOW_MS,
    ownerKey: 'owner:abc',
    readiness: { status: 'waiting_for_period_type' },
  });
  assert(expired.action === 'clear' && expired.reason === 'attempt_expired', 'pending attempt timeout clears safely');

  const yearlyReady: TrialEndingReminderReadiness = {
    status: 'ready',
    candidate: {
      ...readyMonthlyCandidate,
      productIdentifier: 'bpd_yearly:annual',
    },
  };
  const productMismatch = getPendingTrialReminderDecision({
    accountGeneration: 4,
    attempt,
    now: NOW + 7000,
    ownerKey: 'owner:abc',
    readiness: yearlyReady,
  });
  assert(productMismatch.action === 'clear' && productMismatch.reason === 'product_mismatch', 'different confirmed product does not reuse a pending attempt');

  return true;
}

export const trialReminderPendingAttemptRegressionTestsPassed =
  assertTrialReminderPendingAttemptRegressionScenarios();
