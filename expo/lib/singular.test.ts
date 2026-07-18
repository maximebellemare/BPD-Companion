import {
  createSingularController,
  hasSingularCredentials,
  shouldUseSingularNativeSdk,
  type SingularNativeApi,
} from '@/lib/singularCore';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Singular integration regression failed: ${message}`);
}

function createMockApi(calls: string[]): SingularNativeApi {
  return {
    createConfig: (sdkKey, sdkSecret) => {
      calls.push(`createConfig:${sdkKey}:${sdkSecret}`);
      return { sdkKey, sdkSecret };
    },
    init: () => {
      calls.push('init');
    },
    setCustomUserId: (userId) => {
      calls.push(`setCustomUserId:${userId}`);
    },
    unsetCustomUserId: () => {
      calls.push('unsetCustomUserId');
    },
    event: (name) => {
      calls.push(`event:${name}`);
    },
    enableLogging: () => {
      calls.push('enableLogging');
    },
    attachDiagnostics: (_config, handlers) => {
      calls.push('attachDiagnostics');
      handlers.onDeviceAttribution({
        network: 'test-network',
        campaign_id: 'test-campaign',
      });
      handlers.onSdidReceived('test-sdid');
    },
  };
}

export async function assertSingularIntegrationRegressionScenarios(): Promise<true> {
  assert(hasSingularCredentials({
    EXPO_PUBLIC_SINGULAR_SDK_KEY: 'key',
    EXPO_PUBLIC_SINGULAR_SDK_SECRET: 'secret',
  }), 'credentials are detected');
  assert(!hasSingularCredentials({
    EXPO_PUBLIC_SINGULAR_SDK_KEY: 'key',
    EXPO_PUBLIC_SINGULAR_SDK_SECRET: '',
  }), 'missing secret is detected');
  assert(shouldUseSingularNativeSdk({ platform: 'ios', appOwnership: 'standalone' }), 'native iOS is supported');
  assert(shouldUseSingularNativeSdk({ platform: 'android', appOwnership: 'standalone' }), 'native Android is supported');
  assert(!shouldUseSingularNativeSdk({ platform: 'web', appOwnership: 'standalone' }), 'web is skipped');
  assert(!shouldUseSingularNativeSdk({ platform: 'ios', appOwnership: 'expo' }), 'Expo Go is skipped');

  const calls: string[] = [];
  let loadCount = 0;
  const controller = createSingularController({
    platform: 'ios',
    appOwnership: 'standalone',
    env: {
      EXPO_PUBLIC_SINGULAR_SDK_KEY: 'key',
      EXPO_PUBLIC_SINGULAR_SDK_SECRET: 'secret',
    },
    isDevelopment: true,
    loadNativeApi: async () => {
      loadCount += 1;
      return createMockApi(calls);
    },
  });

  await controller.initialize();
  await controller.initialize();
  const initializedState = controller.getState();
  assert(loadCount === 1, 'initialization loads native API once');
  assert(calls.filter(call => call === 'init').length === 1, 'initialization runs once');
  assert(calls.includes('attachDiagnostics'), 'diagnostic callbacks are attached before init');
  assert(initializedState.initializationAttempted === true, 'diagnostics record initialization attempt');
  assert(initializedState.nativeModuleLoaded === true, 'diagnostics record native module loaded');
  assert(initializedState.initSucceeded === true, 'diagnostics record successful init');
  assert(initializedState.attributionCallbackReceived === true, 'diagnostics record attribution callback receipt');
  assert(
    initializedState.attributionCallbackKeys.includes('campaign_id') && initializedState.attributionCallbackKeys.includes('network'),
    'diagnostics record non-sensitive attribution keys',
  );
  assert(initializedState.sdidReceived === 'test-sdid', 'diagnostics record received SDID');
  assert(initializedState.sdidReceivedCallbackReceived === true, 'diagnostics record SDID callback receipt');

  await controller.setCustomUserId('supabase-user-uuid');
  assert(calls.includes('setCustomUserId:supabase-user-uuid'), 'authenticated user sets Supabase UUID');
  await controller.setCustomUserId('supabase-user-uuid');
  assert(
    calls.filter(call => call === 'setCustomUserId:supabase-user-uuid').length === 1,
    'same custom user ID is not repeatedly set',
  );
  await controller.clearCustomUserId();
  assert(calls.includes('unsetCustomUserId'), 'logout clears Singular user ID');
  await controller.setCustomUserId('first-user');
  await controller.setCustomUserId('second-user');
  const accountSwitchSetIndex = calls.indexOf('setCustomUserId:second-user');
  const lastUnsetBeforeSwitch = calls.lastIndexOf('unsetCustomUserId', accountSwitchSetIndex);
  assert(lastUnsetBeforeSwitch >= 0, 'account switch clears old custom user ID before setting the next one');
  await controller.trackEvent('sign_up');
  await controller.trackEvent('onboarding_complete');
  await controller.trackEvent('paywall_view');
  await controller.trackEvent('singular_diagnostic_test');
  assert(calls.includes('event:sign_up'), 'sign_up event is tracked');
  assert(calls.includes('event:onboarding_complete'), 'onboarding_complete event is tracked');
  assert(calls.includes('event:paywall_view'), 'paywall_view event is tracked');
  assert(calls.includes('event:singular_diagnostic_test'), 'diagnostic test event is tracked');
  assert(controller.getState().eventAttemptCounts.sign_up === 1, 'sign_up attempt is recorded');
  assert(
    controller.getState().eventAttemptCounts.singular_diagnostic_test === 1,
    'diagnostic test event attempt is recorded',
  );

  const missingEnvCalls: string[] = [];
  const missingEnvController = createSingularController({
    platform: 'android',
    appOwnership: 'standalone',
    env: {},
    isDevelopment: true,
    loadNativeApi: async () => createMockApi(missingEnvCalls),
  });
  assert((await missingEnvController.initialize()) === false, 'missing env does not initialize');
  assert(missingEnvController.getState().initializationAttempted === true, 'missing env records initialization attempt');
  assert(missingEnvController.getState().initSucceeded === false, 'missing env records failed init status');
  assert(missingEnvCalls.length === 0, 'missing env does not touch native API');

  const webCalls: string[] = [];
  const webController = createSingularController({
    platform: 'web',
    appOwnership: 'standalone',
    env: {
      EXPO_PUBLIC_SINGULAR_SDK_KEY: 'key',
      EXPO_PUBLIC_SINGULAR_SDK_SECRET: 'secret',
    },
    isDevelopment: true,
    loadNativeApi: async () => createMockApi(webCalls),
  });
  assert((await webController.initialize()) === false, 'web does not initialize');
  assert(webCalls.length === 0, 'web does not touch native API');

  return true;
}

export const singularIntegrationRegressionTestsPassed = assertSingularIntegrationRegressionScenarios();
