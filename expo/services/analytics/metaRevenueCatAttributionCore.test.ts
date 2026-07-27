import {
  createMetaRevenueCatAttributionController,
  type MetaAttributionFacebookSdk,
  type MetaAttributionPurchasesClient,
} from '@/services/analytics/metaRevenueCatAttributionCore';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Meta RevenueCat attribution regression failed: ${message}`);
}

function createMockFacebookSdk(calls: string[], anonymousId: string | null = 'fb_anon_123'): MetaAttributionFacebookSdk {
  return {
    Settings: {
      setAutoLogAppEventsEnabled: (enabled) => calls.push(`setAutoLog:${enabled}`),
      setAdvertiserIDCollectionEnabled: (enabled) => calls.push(`setAdvertiserIdCollection:${enabled}`),
      initializeSDK: () => calls.push('initializeSDK'),
    },
    AppEventsLogger: {
      getAnonymousID: async () => {
        calls.push('getAnonymousID');
        return anonymousId;
      },
    },
  };
}

function createMockPurchases(calls: string[]): MetaAttributionPurchasesClient {
  return {
    setFBAnonymousID: async (id) => {
      calls.push(`setFBAnonymousID:${id ?? 'null'}`);
    },
  };
}

export async function assertMetaRevenueCatAttributionRegressionScenarios(): Promise<true> {
  const calls: string[] = [];
  let loadCount = 0;
  const controller = createMetaRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadFacebookSdk: async () => {
      loadCount += 1;
      return createMockFacebookSdk(calls);
    },
  });
  const purchases = createMockPurchases(calls);

  await Promise.all([
    controller.sync(purchases),
    controller.sync(purchases),
  ]);

  assert(loadCount === 1, 'concurrent calls share one native SDK load');
  assert(calls.filter(call => call === 'initializeSDK').length === 1, 'Meta SDK initializes once');
  assert(calls.includes('setAutoLog:false'), 'automatic app events are disabled before init');
  assert(calls.includes('setAdvertiserIdCollection:false'), 'advertiser ID collection is disabled before init');
  assert(
    calls.indexOf('setAutoLog:false') < calls.indexOf('initializeSDK') &&
      calls.indexOf('setAdvertiserIdCollection:false') < calls.indexOf('initializeSDK'),
    'Meta settings are applied before initializeSDK',
  );
  assert(calls.includes('getAnonymousID'), 'Facebook anonymous ID is requested');
  assert(calls.includes('setFBAnonymousID:fb_anon_123'), 'Facebook anonymous ID is sent to RevenueCat');

  const secondSyncStart = calls.length;
  await controller.sync(purchases);
  assert(
    calls.slice(secondSyncStart).includes('getAnonymousID') &&
      !calls.slice(secondSyncStart).includes('initializeSDK'),
    'later sync retries handoff without reinitializing Meta',
  );

  const skippedCalls: string[] = [];
  const skippedController = createMetaRevenueCatAttributionController({
    isNativeRuntime: () => false,
    loadFacebookSdk: async () => {
      skippedCalls.push('loadFacebookSdk');
      return createMockFacebookSdk(skippedCalls);
    },
  });
  await skippedController.sync(createMockPurchases(skippedCalls));
  assert(skippedCalls.length === 0, 'Expo Go and web skip without touching native SDK');

  const missingModuleCalls: string[] = [];
  const missingModuleController = createMetaRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadFacebookSdk: async () => null,
  });
  await missingModuleController.sync(createMockPurchases(missingModuleCalls));
  assert(missingModuleCalls.length === 0, 'missing native module does not call RevenueCat');

  const nullAnonymousCalls: string[] = [];
  const nullAnonymousController = createMetaRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadFacebookSdk: async () => createMockFacebookSdk(nullAnonymousCalls, null),
  });
  await nullAnonymousController.sync(createMockPurchases(nullAnonymousCalls));
  assert(!nullAnonymousCalls.some(call => call.startsWith('setFBAnonymousID')), 'null anonymous ID is not sent');

  const rejectedCalls: string[] = [];
  const errors: string[] = [];
  const rejectedController = createMetaRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadFacebookSdk: async () => ({
      ...createMockFacebookSdk(rejectedCalls),
      AppEventsLogger: {
        getAnonymousID: async () => {
          rejectedCalls.push('getAnonymousID');
          throw new Error('anonymous id unavailable');
        },
      },
    }),
    warn: (message) => errors.push(message),
  });
  await rejectedController.sync(createMockPurchases(rejectedCalls));
  assert(errors.length === 1, 'anonymous ID retrieval failure is caught');
  assert(!rejectedCalls.some(call => call.startsWith('setFBAnonymousID')), 'failed anonymous ID retrieval does not set RevenueCat attribute');

  const initFailureCalls: string[] = [];
  const initFailureErrors: string[] = [];
  const initFailureController = createMetaRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadFacebookSdk: async () => ({
      ...createMockFacebookSdk(initFailureCalls),
      Settings: {
        setAutoLogAppEventsEnabled: (enabled) => initFailureCalls.push(`setAutoLog:${enabled}`),
        setAdvertiserIDCollectionEnabled: (enabled) => initFailureCalls.push(`setAdvertiserIdCollection:${enabled}`),
        initializeSDK: () => {
          initFailureCalls.push('initializeSDK');
          throw new Error('missing client token');
        },
      },
    }),
    warn: (message) => initFailureErrors.push(message),
  });
  await initFailureController.sync(createMockPurchases(initFailureCalls));
  assert(initFailureErrors.length === 1, 'SDK init/config failure is caught');
  assert(!initFailureCalls.some(call => call.startsWith('setFBAnonymousID')), 'SDK init/config failure does not set RevenueCat attribute');

  return true;
}

export const metaRevenueCatAttributionRegressionTestsPassed =
  assertMetaRevenueCatAttributionRegressionScenarios();
