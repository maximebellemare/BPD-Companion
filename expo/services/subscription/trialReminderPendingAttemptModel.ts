import { getBpdSubscriptionPeriodFromProductIdentifier } from '@/services/subscription/billingIssueRecoveryModel';
import type { TrialEndingReminderReadiness } from '@/services/subscription/trialReminderModel';

export const TRIAL_REMINDER_PENDING_ATTEMPT_WINDOW_MS = 5 * 60 * 1000;

export type PendingTrialReminderAttempt = {
  accountGeneration: number;
  createdAt: number;
  expiresAt: number;
  ownerKey: string;
  productIdentifier: string | null;
};

export type PendingTrialReminderDecision =
  | { action: 'retry_schedule'; reason: 'trial_ready' }
  | { action: 'wait'; reason: 'waiting_for_period_type' | 'waiting_for_expiration' }
  | {
      action: 'clear';
      reason:
        | 'account_changed'
        | 'attempt_expired'
        | 'entitlement_inactive'
        | 'missing_entitlement'
        | 'non_trial'
        | 'product_mismatch'
        | 'trial_expired'
        | 'too_close_to_expiration';
    };

export function createPendingTrialReminderAttempt(params: {
  accountGeneration: number;
  now: number;
  ownerKey: string;
  productIdentifier?: string | null;
  timeoutMs?: number;
}): PendingTrialReminderAttempt {
  const timeoutMs = params.timeoutMs ?? TRIAL_REMINDER_PENDING_ATTEMPT_WINDOW_MS;
  return {
    accountGeneration: params.accountGeneration,
    createdAt: params.now,
    expiresAt: params.now + timeoutMs,
    ownerKey: params.ownerKey,
    productIdentifier: params.productIdentifier?.trim() || null,
  };
}

export function getPendingTrialReminderDecision(params: {
  accountGeneration: number;
  attempt: PendingTrialReminderAttempt;
  now: number;
  ownerKey: string | null;
  readiness: TrialEndingReminderReadiness;
}): PendingTrialReminderDecision {
  if (!params.ownerKey || params.ownerKey !== params.attempt.ownerKey || params.accountGeneration !== params.attempt.accountGeneration) {
    return { action: 'clear', reason: 'account_changed' };
  }
  if (params.now >= params.attempt.expiresAt) {
    return { action: 'clear', reason: 'attempt_expired' };
  }

  switch (params.readiness.status) {
    case 'ready': {
      const attemptedPeriod = getBpdSubscriptionPeriodFromProductIdentifier(params.attempt.productIdentifier);
      const confirmedPeriod = getBpdSubscriptionPeriodFromProductIdentifier(params.readiness.candidate.productIdentifier);
      if (attemptedPeriod && confirmedPeriod && attemptedPeriod !== confirmedPeriod) {
        return { action: 'clear', reason: 'product_mismatch' };
      }
      return { action: 'retry_schedule', reason: 'trial_ready' };
    }
    case 'waiting_for_period_type':
      return { action: 'wait', reason: 'waiting_for_period_type' };
    case 'waiting_for_expiration':
      return { action: 'wait', reason: 'waiting_for_expiration' };
    case 'missing_entitlement':
      return { action: 'clear', reason: 'missing_entitlement' };
    case 'inactive_entitlement':
      return { action: 'clear', reason: 'entitlement_inactive' };
    case 'not_trial':
      return { action: 'clear', reason: 'non_trial' };
    case 'expired':
      return { action: 'clear', reason: 'trial_expired' };
    case 'too_close_to_expiration':
      return { action: 'clear', reason: 'too_close_to_expiration' };
  }
}
