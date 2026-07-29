import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';

export const SINGULAR_START_TRIAL_EVENT = 'sngStartTrial';

type TrialEntitlement = {
  isActive?: boolean;
  periodType?: string;
  productIdentifier?: string;
  latestPurchaseDateMillis?: number | null;
};

export type SingularTrialCustomerInfo = {
  entitlements?: {
    active?: Record<string, TrialEntitlement | undefined>;
  };
};

export type SingularTrialStartStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export type SingularTrialStartTrackerDependencies = {
  storage: SingularTrialStartStorage;
  trackEvent: (name: typeof SINGULAR_START_TRIAL_EVENT) => Promise<void>;
  isDevelopment?: boolean;
  log?: (message: string, details?: Record<string, unknown>) => void;
  warn?: (message: string, error?: unknown) => void;
};

export type SingularTrialStartResult =
  | { status: 'sent'; dedupeKey: string }
  | { status: 'already_sent'; dedupeKey: string }
  | { status: 'not_trial'; reason: string }
  | { status: 'error'; reason: string };

function devLog(
  deps: SingularTrialStartTrackerDependencies,
  message: string,
  details?: Record<string, unknown>,
): void {
  if (deps.isDevelopment) {
    deps.log?.(message, details);
  }
}

function devWarn(
  deps: SingularTrialStartTrackerDependencies,
  message: string,
  error?: unknown,
): void {
  if (deps.isDevelopment) {
    deps.warn?.(message, error);
  }
}

export function getSingularTrialStartDedupeKey(customerInfo: SingularTrialCustomerInfo | null): string | null {
  const entitlement = customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID] as TrialEntitlement | undefined;
  if (!entitlement?.isActive) return null;

  const periodType = entitlement.periodType?.trim().toUpperCase();
  if (periodType !== 'TRIAL') return null;

  const productIdentifier = entitlement.productIdentifier?.trim();
  const latestPurchaseDateMillis = entitlement.latestPurchaseDateMillis;
  if (!productIdentifier || typeof latestPurchaseDateMillis !== 'number' || !Number.isFinite(latestPurchaseDateMillis)) {
    return null;
  }

  return `singular_trial_started:${productIdentifier}:${latestPurchaseDateMillis}`;
}

export function createSingularTrialStartTracker(deps: SingularTrialStartTrackerDependencies) {
  return async function trackSingularTrialStartedOnce(customerInfo: SingularTrialCustomerInfo | null): Promise<SingularTrialStartResult> {
    try {
      const entitlement = customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID] as TrialEntitlement | undefined;
      if (!entitlement) {
        devLog(deps, '[SingularTrial] skipped because not a trial', { reason: 'missing_entitlement' });
        return { status: 'not_trial', reason: 'missing_entitlement' };
      }
      if (entitlement.isActive !== true) {
        devLog(deps, '[SingularTrial] skipped because not a trial', { reason: 'inactive_entitlement' });
        return { status: 'not_trial', reason: 'inactive_entitlement' };
      }
      if (entitlement.periodType?.trim().toUpperCase() !== 'TRIAL') {
        devLog(deps, '[SingularTrial] skipped because not a trial', { reason: 'non_trial_period' });
        return { status: 'not_trial', reason: 'non_trial_period' };
      }

      const dedupeKey = getSingularTrialStartDedupeKey(customerInfo);
      if (!dedupeKey) {
        devLog(deps, '[SingularTrial] skipped because not a trial', { reason: 'missing_dedupe_fields' });
        return { status: 'not_trial', reason: 'missing_dedupe_fields' };
      }

      const alreadySent = await deps.storage.getItem(dedupeKey);
      if (alreadySent) {
        devLog(deps, '[SingularTrial] skipped because already sent');
        return { status: 'already_sent', dedupeKey };
      }

      await deps.trackEvent(SINGULAR_START_TRIAL_EVENT);
      await deps.storage.setItem(dedupeKey, '1');
      devLog(deps, '[SingularTrial] event sent');
      return { status: 'sent', dedupeKey };
    } catch (error) {
      devWarn(deps, '[SingularTrial] Singular error', error);
      return { status: 'error', reason: 'singular_error' };
    }
  };
}
