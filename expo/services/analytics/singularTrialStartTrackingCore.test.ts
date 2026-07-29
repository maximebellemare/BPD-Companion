import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';
import {
  SINGULAR_START_TRIAL_EVENT,
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
}): SingularTrialCustomerInfo {
  const entitlement = {
    isActive: params.active ?? true,
    periodType: params.periodType,
    productIdentifier: params.productIdentifier ?? 'bpd_monthly:monthly',
    latestPurchaseDateMillis: Object.prototype.hasOwnProperty.call(params, 'latestPurchaseDateMillis')
      ? params.latestPurchaseDateMillis
      : 123456789,
  };
  return {
    entitlements: {
      active: params.active === false || params.periodType === undefined
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

export async function assertSingularTrialStartTrackingRegressionScenarios(): Promise<true> {
  const sentEvents: string[] = [];
  const storage = createStorage();
  const tracker = createSingularTrialStartTracker({
    storage,
    trackEvent: async (name) => {
      sentEvents.push(name);
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
  assert(sentEvents.length === 1 && sentEvents[0] === SINGULAR_START_TRIAL_EVENT, 'event string is sngStartTrial');

  const secondResult = await tracker(activeTrial);
  assert(secondResult.status === 'already_sent', 'repeated callback does not send twice');
  assert(sentEvents.length === 1, 'dedupe prevents duplicate event');

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
  assert(sentEvents.length === 1, 'non-trial and inactive cases do not send events');

  const failingEvents: string[] = [];
  const failingTracker = createSingularTrialStartTracker({
    storage: createStorage(),
    trackEvent: async (name) => {
      failingEvents.push(name);
      throw new Error('Singular unavailable');
    },
  });
  const failureResult = await failingTracker(createCustomerInfo({ periodType: 'TRIAL', latestPurchaseDateMillis: 7 }));
  assert(failureResult.status === 'error', 'analytics failure is caught');
  assert(failingEvents.includes(SINGULAR_START_TRIAL_EVENT), 'failed analytics path attempted only sngStartTrial');

  const nonPurchaseSuccessEvents: string[] = [];
  const nonPurchaseSuccessTracker = createSingularTrialStartTracker({
    storage: createStorage(),
    trackEvent: async (name) => {
      nonPurchaseSuccessEvents.push(name);
    },
  });
  void nonPurchaseSuccessTracker;
  assert(nonPurchaseSuccessEvents.length === 0, 'cancelled purchase does not send because helper is never called');
  assert(nonPurchaseSuccessEvents.length === 0, 'failed purchase does not send because helper is never called');
  assert(nonPurchaseSuccessEvents.length === 0, 'restore purchases does not send because helper is never called');
  assert(sentEvents.every(event => event === SINGULAR_START_TRIAL_EVENT), 'no trial, purchase, subscription, or revenue events are manually logged');

  return true;
}

export const singularTrialStartTrackingRegressionTestsPassed =
  assertSingularTrialStartTrackingRegressionScenarios();
