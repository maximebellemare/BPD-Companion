import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';

export const SINGULAR_START_TRIAL_EVENT = 'sngStartTrial';

export const SINGULAR_TRIAL_DIAGNOSTIC_EVENTS = {
  purchaseSuccess: 'trial_track_purchase_success',
  noEntitlement: 'trial_track_no_entitlement',
  inactive: 'trial_track_inactive',
  notTrial: 'trial_track_not_trial',
  duplicate: 'trial_track_duplicate',
  eventCalled: 'trial_track_event_called',
} as const;

export type SingularTrialDiagnosticEventName =
  typeof SINGULAR_TRIAL_DIAGNOSTIC_EVENTS[keyof typeof SINGULAR_TRIAL_DIAGNOSTIC_EVENTS];

type TrialEntitlement = {
  isActive?: boolean;
  periodType?: string;
  productIdentifier?: string;
  latestPurchaseDateMillis?: number | null;
  isSandbox?: boolean | null;
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
  invokeEvent: (name: typeof SINGULAR_START_TRIAL_EVENT | SingularTrialDiagnosticEventName) => Promise<boolean>;
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

function getConfiguredEntitlement(customerInfo: SingularTrialCustomerInfo | null): TrialEntitlement | undefined {
  return customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID] as TrialEntitlement | undefined;
}

async function trackDiagnostic(
  deps: SingularTrialStartTrackerDependencies,
  name: SingularTrialDiagnosticEventName,
): Promise<void> {
  try {
    await deps.invokeEvent(name);
  } catch (error) {
    devWarn(deps, '[SingularTrial] Singular diagnostic error', error);
  }
}

export function getSingularTrialStartDedupeKey(customerInfo: SingularTrialCustomerInfo | null): string | null {
  const entitlement = getConfiguredEntitlement(customerInfo);
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
      await trackDiagnostic(deps, SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.purchaseSuccess);

      const entitlement = getConfiguredEntitlement(customerInfo);
      if (!entitlement) {
        await trackDiagnostic(deps, SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.noEntitlement);
        devLog(deps, '[SingularTrial] skipped because not a trial', { reason: 'missing_entitlement' });
        return { status: 'not_trial', reason: 'missing_entitlement' };
      }
      if (entitlement.isActive !== true) {
        await trackDiagnostic(deps, SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.inactive);
        devLog(deps, '[SingularTrial] skipped because not a trial', { reason: 'inactive_entitlement' });
        return { status: 'not_trial', reason: 'inactive_entitlement' };
      }
      if (entitlement.periodType?.trim().toUpperCase() !== 'TRIAL') {
        await trackDiagnostic(deps, SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.notTrial);
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
        await trackDiagnostic(deps, SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.duplicate);
        devLog(deps, '[SingularTrial] skipped because already sent');
        return { status: 'already_sent', dedupeKey };
      }

      // Singular.event(...) is a void SDK call. A true result here only means the
      // JavaScript/native invocation did not throw; it is not a server delivery or ingestion receipt.
      const invoked = await deps.invokeEvent(SINGULAR_START_TRIAL_EVENT);
      if (!invoked) {
        return { status: 'error', reason: 'singular_error' };
      }
      await deps.storage.setItem(dedupeKey, '1');
      await trackDiagnostic(deps, SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.eventCalled);
      devLog(deps, '[SingularTrial] event invocation completed');
      return { status: 'sent', dedupeKey };
    } catch (error) {
      devWarn(deps, '[SingularTrial] Singular error', error);
      return { status: 'error', reason: 'singular_error' };
    }
  };
}
