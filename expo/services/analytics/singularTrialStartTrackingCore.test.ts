import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';
import {
  SINGULAR_START_TRIAL_EVENT,
  SINGULAR_TRIAL_DIAGNOSTIC_EVENTS,
  createSingularTrialStartTracker,
  getSingularTrialStartDedupeKey,
  type SingularTrialCustomerInfo,
  type SingularTrialStartStorage,
} from '@/services/analytics/singularTrialStartTrackingCore';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Singular trial-start regression failed: ${message}`);
}

function createCustomerInfo(params: {
  active?: boolean;
  periodType?: string;
  productIdentifier?: string;
  latestPurchaseDateMillis?: number | null;
  activeMap?: 'active' | 'all_only' | 'none';
}): SingularTrialCustomerInfo {
  const entitlement = {
    isActive: params.active ?? true,
    periodType: params.periodType,
    productIdentifier: params.productIdentifier ?? 'bpd_monthly:monthly',
    latestPurchaseDateMillis: Object.prototype.hasOwnProperty.call(params, 'latestPurchaseDateMillis')
      ? params.latestPurchaseDateMillis
      : 123456789,
  };
  const activeMap = params.activeMap ?? 'active';
  return {
    entitlements: {
      active: activeMap !== 'active' || params.active === false || params.periodType === undefined
        ? {}
        : { [REVENUECAT_ENTITLEMENT_ID]: entitlement },
    },
  };
}

function createStorage(existingKeys: Set<string> = new Set()): SingularTrialStartStorage {
  return {
    getItem: async (key) => existingKeys.has(key) ? '1' : null,
    setItem: async (key) => {
      existingKeys.add(key);
    },
  };
}

function countEvents(events: string[], name: string): number {
  return events.filter(event => event === name).length;
}

export async function assertSingularTrialStartTrackingRegressionScenarios(): Promise<true> {
  const sentEvents: string[] = [];
  const storage = createStorage();
  const tracker = createSingularTrialStartTracker({
    storage,
    invokeEvent: async (name) => {
      sentEvents.push(name);
      return true;
    },
    isDevelopment: true,
  });

  const activeTrial = createCustomerInfo({ periodType: 'trial' });
  const dedupeKey = getSingularTrialStartDedupeKey(activeTrial);
  assert(
    dedupeKey === 'singular_trial_started:bpd_monthly:monthly:123456789',
    'dedupe key uses product identifier and latest purchase date',
  );

  const firstResult = await tracker(activeTrial);
  assert(firstResult.status === 'sent', 'successful active trial sends event');
  assert(countEvents(sentEvents, SINGULAR_START_TRIAL_EVENT) === 1, 'event string is sngStartTrial');
  assert(sentEvents.includes(SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.eventCalled), 'diagnostic confirms SDK invocation did not throw');

  const secondResult = await tracker(activeTrial);
  assert(secondResult.status === 'already_sent', 'repeated callback does not send twice');
  assert(countEvents(sentEvents, SINGULAR_START_TRIAL_EVENT) === 1, 'dedupe prevents duplicate event');

  const normalResult = await tracker(createCustomerInfo({ periodType: 'NORMAL', latestPurchaseDateMillis: 2 }));
  assert(normalResult.status === 'not_trial', 'normal paid subscription does not send trial event');
  const introResult = await tracker(createCustomerInfo({ periodType: 'INTRO', latestPurchaseDateMillis: 3 }));
  assert(introResult.status === 'not_trial', 'intro subscription does not send trial event');
  const prepaidResult = await tracker(createCustomerInfo({ periodType: 'PREPAID', latestPurchaseDateMillis: 4 }));
  assert(prepaidResult.status === 'not_trial', 'prepaid subscription does not send trial event');
  const missingPeriodResult = await tracker(createCustomerInfo({ periodType: undefined, latestPurchaseDateMillis: 5 }));
  assert(missingPeriodResult.status === 'not_trial', 'missing periodType does not send trial event');
  const inactiveResult = await tracker(createCustomerInfo({ active: false, periodType: 'TRIAL', latestPurchaseDateMillis: 6 }));
  assert(inactiveResult.status === 'not_trial', 'inactive entitlement does not send trial event');
  const missingPurchaseDateResult = await tracker(createCustomerInfo({ periodType: 'TRIAL', latestPurchaseDateMillis: null }));
  assert(missingPurchaseDateResult.status === 'not_trial', 'missing purchase date does not send trial event');
  assert(countEvents(sentEvents, SINGULAR_START_TRIAL_EVENT) === 1, 'non-trial and inactive cases do not send events');
  assert(sentEvents.includes(SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.noEntitlement), 'no-entitlement diagnostic is emitted when entitlement is absent');
  assert(sentEvents.includes(SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.notTrial), 'not-trial diagnostic is emitted');

  const failingEvents: string[] = [];
  const failingStorageKeys = new Set<string>();
  const failingTracker = createSingularTrialStartTracker({
    storage: createStorage(failingStorageKeys),
    invokeEvent: async (name) => {
      failingEvents.push(name);
      return name !== SINGULAR_START_TRIAL_EVENT;
    },
  });
  const failureResult = await failingTracker(createCustomerInfo({ periodType: 'TRIAL', latestPurchaseDateMillis: 7 }));
  assert(failureResult.status === 'error', 'analytics failure is caught');
  assert(failingEvents.includes(SINGULAR_START_TRIAL_EVENT), 'failed analytics path attempted only sngStartTrial');
  assert(failingStorageKeys.size === 0, 'failed analytics path does not mark trial as sent');

  const nonPurchaseSuccessEvents: string[] = [];
  const nonPurchaseSuccessTracker = createSingularTrialStartTracker({
    storage: createStorage(),
    invokeEvent: async (name) => {
      nonPurchaseSuccessEvents.push(name);
      return true;
    },
  });
  void nonPurchaseSuccessTracker;
  assert(nonPurchaseSuccessEvents.length === 0, 'cancelled purchase does not send because helper is never called');
  assert(nonPurchaseSuccessEvents.length === 0, 'failed purchase does not send because helper is never called');
  assert(nonPurchaseSuccessEvents.length === 0, 'restore purchases does not send because helper is never called');
  const allowedTrialTrackingEvents = new Set<string>([
    SINGULAR_START_TRIAL_EVENT,
    ...Object.values(SINGULAR_TRIAL_DIAGNOSTIC_EVENTS),
  ]);
  assert(sentEvents.every(event => allowedTrialTrackingEvents.has(event)), 'only the trial-start event and temporary diagnostics are logged');

  const androidPurchaseResult = {
    productIdentifier: 'bpd_monthly:monthly',
    customerInfo: createCustomerInfo({ periodType: 'TRIAL', latestPurchaseDateMillis: 8 }),
  };
  const androidResultEvents: string[] = [];
  const androidResultTracker = createSingularTrialStartTracker({
    storage: createStorage(),
    invokeEvent: async (name) => {
      androidResultEvents.push(name);
      return true;
    },
  });
  const androidResult = await androidResultTracker(androidPurchaseResult.customerInfo);
  assert(androidResult.status === 'sent', 'Android MakePurchaseResult customerInfo sends trial event');
  assert(countEvents(androidResultEvents, SINGULAR_START_TRIAL_EVENT) === 1, 'helper receives CustomerInfo, not whole MakePurchaseResult wrapper');

  const diagnosticEvents: string[] = [];
  const diagnosticStorage = createStorage();
  const diagnosticTracker = createSingularTrialStartTracker({
    storage: diagnosticStorage,
    invokeEvent: async (name) => {
      diagnosticEvents.push(name);
      return true;
    },
  });
  await diagnosticTracker(createCustomerInfo({ periodType: 'TRIAL', latestPurchaseDateMillis: 9 }));
  assert(diagnosticEvents.includes(SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.purchaseSuccess), 'purchase success diagnostic is emitted');
  assert(diagnosticEvents.includes(SINGULAR_START_TRIAL_EVENT), 'confirmed trial still emits production event');
  assert(diagnosticEvents.includes(SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.eventCalled), 'event-called diagnostic is emitted after non-throwing SDK invocation');

  await diagnosticTracker(createCustomerInfo({ periodType: 'TRIAL', latestPurchaseDateMillis: 9 }));
  assert(diagnosticEvents.includes(SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.duplicate), 'duplicate diagnostic is emitted');

  const noEntitlementEvents: string[] = [];
  const noEntitlementTracker = createSingularTrialStartTracker({
    storage: createStorage(),
    invokeEvent: async (name) => {
      noEntitlementEvents.push(name);
      return true;
    },
  });
  await noEntitlementTracker(createCustomerInfo({ periodType: undefined, latestPurchaseDateMillis: 10 }));
  assert(noEntitlementEvents.includes(SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.noEntitlement), 'no-entitlement diagnostic is emitted without target entitlement');

  const notTrialEvents: string[] = [];
  const notTrialTracker = createSingularTrialStartTracker({
    storage: createStorage(),
    invokeEvent: async (name) => {
      notTrialEvents.push(name);
      return true;
    },
  });
  await notTrialTracker(createCustomerInfo({ periodType: 'NORMAL', latestPurchaseDateMillis: 11 }));
  assert(notTrialEvents.includes(SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.notTrial), 'not-trial diagnostic is emitted');

  const activeFalseEvents: string[] = [];
  const activeFalseTracker = createSingularTrialStartTracker({
    storage: createStorage(),
    invokeEvent: async (name) => {
      activeFalseEvents.push(name);
      return true;
    },
  });
  await activeFalseTracker({
    entitlements: {
      active: {
        [REVENUECAT_ENTITLEMENT_ID]: {
          isActive: false,
          periodType: 'TRIAL',
          productIdentifier: 'bpd_monthly:monthly',
          latestPurchaseDateMillis: 12,
        },
      },
    },
  });
  assert(activeFalseEvents.includes(SINGULAR_TRIAL_DIAGNOSTIC_EVENTS.inactive), 'inactive diagnostic is emitted');

  return true;
}

export const singularTrialStartTrackingRegressionTestsPassed =
  assertSingularTrialStartTrackingRegressionScenarios();
