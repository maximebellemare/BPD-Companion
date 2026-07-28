import {
  createMetaRevenueCatAttributionController,
  type MetaAttributionFacebookSdk,
  type MetaAttributionPurchasesClient,
} from '@/services/analytics/metaRevenueCatAttributionCore';
import appConfig from '../../app.config';

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

function getMetaPluginConfig(): Record<string, unknown> {
  const resolvedConfig = appConfig({ config: {} } as never) as { plugins?: unknown[] };
  const plugin = resolvedConfig.plugins?.find((entry) => Array.isArray(entry) && entry[0] === 'react-native-fbsdk-next');
  if (!Array.isArray(plugin)) {
    throw new Error('Meta RevenueCat attribution regression failed: react-native-fbsdk-next plugin is configured');
  }
  const pluginConfig = plugin[1];
  if (!pluginConfig || typeof pluginConfig !== 'object' || Array.isArray(pluginConfig)) {
    throw new Error('Meta RevenueCat attribution regression failed: react-native-fbsdk-next plugin options are configured');
  }
  return pluginConfig as Record<string, unknown>;
}

export async function assertMetaRevenueCatAttributionRegressionScenarios(): Promise<true> {
  const metaPluginConfig = getMetaPluginConfig();
  assert(metaPluginConfig.appID === '1546153426837970', 'BPD Meta App ID is configured');
  assert(metaPluginConfig.isAutoInitEnabled === true, 'Android native Meta auto-init is enabled');
  assert(metaPluginConfig.autoLogAppEventsEnabled === false, 'automatic Meta app events are disabled');
  assert(metaPluginConfig.advertiserIDCollectionEnabled === false, 'Meta advertiser ID collection is disabled');
  assert(metaPluginConfig.iosUserTrackingPermission === false, 'ATT prompt remains disabled');

  const calls: string[] = [];
  let loadCount = 0;
  const controller = createMetaRevenueCatAttributionController({
    isNativeRuntime: () => true,
    shouldInitializeFacebookSdkInJs: () => true,
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
    shouldInitializeFacebookSdkInJs: () => false,
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
    shouldInitializeFacebookSdkInJs: () => false,
    loadFacebookSdk: async () => null,
  });
  await missingModuleController.sync(createMockPurchases(missingModuleCalls));
  assert(missingModuleCalls.length === 0, 'missing native module does not call RevenueCat');

  const nullAnonymousCalls: string[] = [];
  const nullAnonymousController = createMetaRevenueCatAttributionController({
    isNativeRuntime: () => true,
    shouldInitializeFacebookSdkInJs: () => false,
    loadFacebookSdk: async () => createMockFacebookSdk(nullAnonymousCalls, null),
  });
  await nullAnonymousController.sync(createMockPurchases(nullAnonymousCalls));
  assert(!nullAnonymousCalls.some(call => call.startsWith('setFBAnonymousID')), 'null anonymous ID is not sent');

  const rejectedCalls: string[] = [];
  const errors: string[] = [];
  const rejectedController = createMetaRevenueCatAttributionController({
    isNativeRuntime: () => true,
    shouldInitializeFacebookSdkInJs: () => false,
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
    shouldInitializeFacebookSdkInJs: () => true,
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

  const androidAutoInitCalls: string[] = [];
  const androidAutoInitController = createMetaRevenueCatAttributionController({
    isNativeRuntime: () => true,
    shouldInitializeFacebookSdkInJs: () => false,
    loadFacebookSdk: async () => createMockFacebookSdk(androidAutoInitCalls),
  });
  await androidAutoInitController.sync(createMockPurchases(androidAutoInitCalls));
  assert(androidAutoInitCalls.includes('setAutoLog:false'), 'Android keeps automatic app events disabled');
  assert(androidAutoInitCalls.includes('setAdvertiserIdCollection:false'), 'Android keeps advertiser ID collection disabled');
  assert(!androidAutoInitCalls.includes('initializeSDK'), 'Android relies on native auto-init before JS package access');
  assert(
    androidAutoInitCalls.indexOf('getAnonymousID') > androidAutoInitCalls.indexOf('setAdvertiserIdCollection:false'),
    'Facebook SDK settings are applied before anonymous ID access',
  );
  assert(androidAutoInitCalls.includes('setFBAnonymousID:fb_anon_123'), 'Android still syncs Facebook anonymous ID to RevenueCat');

  return true;
}

export const metaRevenueCatAttributionRegressionTestsPassed =
  assertMetaRevenueCatAttributionRegressionScenarios();
