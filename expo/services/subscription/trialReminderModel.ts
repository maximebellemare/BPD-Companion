import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';

export const TRIAL_REMINDER_CATEGORY = 'trial_reminder';
export const TRIAL_REMINDER_MS_BEFORE_EXPIRATION = 24 * 60 * 60 * 1000;
export const TRIAL_REMINDER_MIN_DELAY_MS = 60 * 1000;

type TrialReminderEntitlement = {
  expirationDate?: string | null;
  expirationDateMillis?: number | null;
  isActive?: boolean;
  latestPurchaseDate?: string | null;
  latestPurchaseDateMillis?: number | null;
  periodType?: string | null;
  productIdentifier?: string | null;
};

export type TrialReminderCustomerInfo = {
  entitlements?: {
    active?: Record<string, TrialReminderEntitlement>;
  };
};

export type TrialEndingReminderCandidate = {
  dedupeKey: string;
  expirationAt: number;
  productIdentifier: string;
  triggerAt: number;
};

export type TrialEndingReminderReadiness =
  | { status: 'ready'; candidate: TrialEndingReminderCandidate }
  | { status: 'missing_entitlement' }
  | { status: 'inactive_entitlement' }
  | { status: 'waiting_for_period_type' }
  | { status: 'not_trial'; periodType: string }
  | { status: 'waiting_for_expiration' }
  | { status: 'expired' }
  | { status: 'too_close_to_expiration' };

export type TrialEligibilityStatus = 'eligible' | 'ineligible' | 'unknown';

export function getTrialDaysFromIsoPeriod(period: string | null | undefined): number | null {
  if (!period) return null;
  const match = period.trim().toUpperCase().match(/^P(\d+)D$/);
  if (!match) return null;
  const days = Number(match[1]);
  return Number.isFinite(days) && days > 0 ? days : null;
}

export function getTrialLengthLabel(days: number | null | undefined): string {
  return days && Number.isFinite(days) && days > 0 ? `${days}-day free` : 'free';
}

export function getTrialEligibilityCopy(days: number | null | undefined): string {
  const length = getTrialLengthLabel(days);
  return `${length} trial for eligible new subscribers`;
}

function parseTimestamp(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getTrialEndingReminderCandidate(
  info: TrialReminderCustomerInfo | null,
  now: number = Date.now(),
): TrialEndingReminderCandidate | null {
  const readiness = getTrialEndingReminderReadiness(info, now);
  return readiness.status === 'ready' ? readiness.candidate : null;
}

export function getTrialEndingReminderReadiness(
  info: TrialReminderCustomerInfo | null,
  now: number = Date.now(),
): TrialEndingReminderReadiness {
  const entitlement = info?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID] ?? null;
  if (!entitlement) return { status: 'missing_entitlement' };
  if (!entitlement.isActive) return { status: 'inactive_entitlement' };

  const periodType = entitlement.periodType?.trim();
  if (!periodType) return { status: 'waiting_for_period_type' };
  if (periodType.toUpperCase() !== 'TRIAL') {
    return { status: 'not_trial', periodType };
  }

  const expirationAt = parseTimestamp(entitlement.expirationDateMillis) ??
    parseTimestamp(entitlement.expirationDate);
  if (!expirationAt) return { status: 'waiting_for_expiration' };
  if (expirationAt <= now) return { status: 'expired' };

  const productIdentifier = entitlement.productIdentifier?.trim() || 'unknown_product';
  const purchaseTimestamp = parseTimestamp(entitlement.latestPurchaseDateMillis) ??
    parseTimestamp(entitlement.latestPurchaseDate) ??
    expirationAt;
  if (expirationAt <= now + TRIAL_REMINDER_MIN_DELAY_MS) return { status: 'too_close_to_expiration' };
  const triggerAt = Math.max(now + TRIAL_REMINDER_MIN_DELAY_MS, expirationAt - TRIAL_REMINDER_MS_BEFORE_EXPIRATION);

  return {
    status: 'ready',
    candidate: {
      dedupeKey: `${productIdentifier}:${purchaseTimestamp}:${expirationAt}`,
      expirationAt,
      productIdentifier,
      triggerAt,
    },
  };
}

export function getTrialEndingReminderDelaySeconds(
  candidate: TrialEndingReminderCandidate,
  now: number = Date.now(),
): number {
  return Math.max(60, Math.round((candidate.triggerAt - now) / 1000));
}

export function shouldShowTrialCopyForSelectedPlan(params: {
  platform: string;
  androidTrialCopy?: string | null;
  trialEligibilityStatus?: TrialEligibilityStatus | null;
}): boolean {
  if (params.platform === 'android') return !!params.androidTrialCopy;
  return params.trialEligibilityStatus === 'eligible';
}

export function shouldShowTrialEndingReminderCopy(params: {
  hasStoreAccess: boolean;
  inactiveBillingRecovery: boolean;
  shouldShowTrialCopy: boolean;
}): boolean {
  return params.shouldShowTrialCopy && !params.hasStoreAccess && !params.inactiveBillingRecovery;
}
