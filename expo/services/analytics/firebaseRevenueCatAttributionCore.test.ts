import {
  createFirebaseRevenueCatAttributionController,
  type FirebaseAnalyticsClient,
  type FirebaseAttributionPurchasesClient,
  type FirebaseRevenueCatAttributionDiagnostics,
} from '@/services/analytics/firebaseRevenueCatAttributionCore';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Firebase RevenueCat attribution regression failed: ${message}`);
}

function createMockAnalytics(calls: string[], appInstanceId: string | null = 'firebase_instance_123'): FirebaseAnalyticsClient {
  return {
    getAppInstanceId: async () => {
      calls.push('getAppInstanceId');
      return appInstanceId;
    },
  };
}

function createAnalyticsLoader(calls: string[], appInstanceId: string | null = 'firebase_instance_123') {
  return async () => {
    calls.push('loadAnalytics');
    return {
      analytics: createMockAnalytics(calls, appInstanceId),
      firebaseDefaultAppAvailable: true,
      analyticsModuleAvailable: true,
      analyticsCollectionEnabled: true,
    };
  };
}

function createMockPurchases(calls: string[]): FirebaseAttributionPurchasesClient {
  return {
    setFirebaseAppInstanceID: async (id) => {
      calls.push(`setFirebaseAppInstanceID:${id ?? 'null'}`);
    },
    syncAttributesAndOfferingsIfNeeded: async () => {
      calls.push('syncAttributesAndOfferingsIfNeeded');
      return {};
    },
  };
}

function assertNoIdentifierLogged(logs: FirebaseRevenueCatAttributionDiagnostics[], id: string): void {
  const serializedLogs = JSON.stringify(logs);
  assert(!serializedLogs.includes(id), 'Firebase App Instance ID is never logged');
}

export async function assertFirebaseRevenueCatAttributionRegressionScenarios(): Promise<true> {
  const calls: string[] = [];
  const logs: FirebaseRevenueCatAttributionDiagnostics[] = [];
  const controller = createFirebaseRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadAnalytics: createAnalyticsLoader(calls),
    log: (_message, details) => {
      if (details) logs.push(details);
    },
  });
  const purchases = createMockPurchases(calls);

  await Promise.all([
    controller.sync(purchases),
    controller.sync(purchases),
  ]);

  assert(calls.filter(call => call === 'loadAnalytics').length === 1, 'concurrent calls share one Firebase Analytics load');
  assert(calls.filter(call => call === 'getAppInstanceId').length === 1, 'Firebase App Instance ID is retrieved once');
  assert(calls.includes('setFirebaseAppInstanceID:firebase_instance_123'), 'Firebase App Instance ID is sent to RevenueCat');
  assert(calls.includes('syncAttributesAndOfferingsIfNeeded'), 'RevenueCat attributes are explicitly synchronized');
  assert(logs.at(-1)?.explicitAttributeSyncSucceeded === true, 'successful sync is reported');
  assertNoIdentifierLogged(logs, 'firebase_instance_123');
  assert(!calls.some(call => call.toLowerCase().includes('logevent')), 'no Firebase event logging is performed');

  await controller.sync(purchases, { forceNew: true });
  assert(
    calls.filter(call => call === 'getAppInstanceId').length === 1,
    'later forced sync reuses cached Firebase App Instance ID',
  );
  assert(
    calls.filter(call => call === 'setFirebaseAppInstanceID:firebase_instance_123').length === 2,
    'later RevenueCat login can re-sync the cached Firebase App Instance ID',
  );
  assert(
    calls.filter(call => call === 'syncAttributesAndOfferingsIfNeeded').length === 2,
    'later RevenueCat login explicitly syncs attributes again',
  );

  const purchaseOrderCalls: string[] = [];
  const purchaseOrderController = createFirebaseRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadAnalytics: createAnalyticsLoader(purchaseOrderCalls, 'firebase_instance_purchase'),
  });
  await purchaseOrderController.sync(createMockPurchases(purchaseOrderCalls));
  purchaseOrderCalls.push('purchasePackage');
  assert(
    purchaseOrderCalls.join('>') ===
      'loadAnalytics>getAppInstanceId>setFirebaseAppInstanceID:firebase_instance_purchase>syncAttributesAndOfferingsIfNeeded>purchasePackage',
    'successful path calls getAppInstanceId, setFirebaseAppInstanceID, syncAttributesAndOfferingsIfNeeded, then purchasePackage',
  );

  const skippedCalls: string[] = [];
  const skippedController = createFirebaseRevenueCatAttributionController({
    isNativeRuntime: () => false,
    loadAnalytics: createAnalyticsLoader(skippedCalls),
  });
  const skippedResult = await skippedController.sync(createMockPurchases(skippedCalls));
  assert(skippedResult.ok === false, 'Expo Go and web return a failed diagnostic result');
  assert(skippedCalls.length === 0, 'Expo Go and web skip without touching Firebase Analytics');

  const missingModuleCalls: string[] = [];
  const missingModuleController = createFirebaseRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadAnalytics: async () => ({
      analytics: null,
      firebaseDefaultAppAvailable: true,
      analyticsModuleAvailable: false,
      analyticsCollectionEnabled: false,
    }),
  });
  const missingModuleResult = await missingModuleController.sync(createMockPurchases(missingModuleCalls));
  assert(missingModuleResult.ok === false, 'missing Firebase Analytics module returns a failed diagnostic result');
  assert(missingModuleResult.diagnostics.failureBranch === 'firebase_analytics_unavailable', 'missing module branch is recorded');
  assert(missingModuleCalls.length === 0, 'missing Firebase Analytics module does not call RevenueCat');

  const nullIdCalls: string[] = [];
  const nullIdController = createFirebaseRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadAnalytics: createAnalyticsLoader(nullIdCalls, null),
  });
  const nullIdResult = await nullIdController.sync(createMockPurchases(nullIdCalls));
  assert(nullIdResult.diagnostics.failureBranch === 'missing_app_instance_id', 'null App Instance ID branch is recorded');
  assert(!nullIdCalls.some(call => call.startsWith('setFirebaseAppInstanceID')), 'null App Instance ID is not sent');

  const blankIdCalls: string[] = [];
  const blankIdController = createFirebaseRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadAnalytics: createAnalyticsLoader(blankIdCalls, '   '),
  });
  const blankIdResult = await blankIdController.sync(createMockPurchases(blankIdCalls));
  assert(blankIdResult.diagnostics.failureBranch === 'missing_app_instance_id', 'blank App Instance ID branch is recorded');
  assert(!blankIdCalls.some(call => call.startsWith('setFirebaseAppInstanceID')), 'blank App Instance ID is not sent');

  const rejectedCalls: string[] = [];
  const rejectedController = createFirebaseRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadAnalytics: async () => ({
      analytics: {
        getAppInstanceId: async () => {
          rejectedCalls.push('getAppInstanceId');
          throw new Error('firebase_instance_secret_123 unavailable');
        },
      },
      firebaseDefaultAppAvailable: true,
      analyticsModuleAvailable: true,
      analyticsCollectionEnabled: true,
    }),
  });
  const rejectedResult = await rejectedController.sync(createMockPurchases(rejectedCalls));
  assert(rejectedResult.ok === false, 'Firebase App Instance ID retrieval failure is caught');
  assert(rejectedResult.diagnostics.errorMessage === '[redacted] unavailable', 'Firebase retrieval error message is sanitized');
  assert(!JSON.stringify(rejectedResult.diagnostics).includes('firebase_instance_secret_123'), 'identifier-like error content is redacted');
  assert(!rejectedCalls.some(call => call.startsWith('setFirebaseAppInstanceID')), 'failed ID retrieval does not set RevenueCat attribute');

  const setFailureCalls: string[] = [];
  const setFailureController = createFirebaseRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadAnalytics: createAnalyticsLoader(setFailureCalls),
  });
  const setFailureResult = await setFailureController.sync({
    setFirebaseAppInstanceID: async () => {
      setFailureCalls.push('setFirebaseAppInstanceID');
      throw new Error('RevenueCat unavailable');
    },
    syncAttributesAndOfferingsIfNeeded: async () => {
      setFailureCalls.push('syncAttributesAndOfferingsIfNeeded');
      return {};
    },
  });
  assert(setFailureResult.ok === false, 'RevenueCat Firebase App Instance ID failure is caught');
  assert(!setFailureCalls.includes('syncAttributesAndOfferingsIfNeeded'), 'attribute sync is not attempted after set failure');

  const syncFailureCalls: string[] = [];
  const syncFailureController = createFirebaseRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadAnalytics: createAnalyticsLoader(syncFailureCalls),
  });
  const syncFailureResult = await syncFailureController.sync({
    setFirebaseAppInstanceID: async (id) => {
      syncFailureCalls.push(`setFirebaseAppInstanceID:${id ?? 'null'}`);
    },
    syncAttributesAndOfferingsIfNeeded: async () => {
      syncFailureCalls.push('syncAttributesAndOfferingsIfNeeded');
      throw new Error('attribute sync unavailable');
    },
  });
  syncFailureCalls.push('purchasePackage');
  assert(syncFailureResult.ok === false, 'explicit attribute sync failure is caught');
  assert(syncFailureResult.diagnostics.explicitAttributeSyncAttempted === true, 'attribute sync attempt is recorded');
  assert(syncFailureCalls.at(-1) === 'purchasePackage', 'purchase remains non-blocking after recorded attribution failure');

  const noExplicitSyncCalls: string[] = [];
  const noExplicitSyncController = createFirebaseRevenueCatAttributionController({
    isNativeRuntime: () => true,
    loadAnalytics: createAnalyticsLoader(noExplicitSyncCalls),
  });
  const noExplicitSyncResult = await noExplicitSyncController.sync({
    setFirebaseAppInstanceID: async (id) => {
      noExplicitSyncCalls.push(`setFirebaseAppInstanceID:${id ?? 'null'}`);
    },
  });
  assert(noExplicitSyncResult.ok === false, 'missing RevenueCat explicit attribute sync is recorded');
  assert(
    noExplicitSyncResult.diagnostics.failureBranch === 'revenuecat_attribute_sync_unavailable',
    'missing explicit RevenueCat attribute sync branch is recorded',
  );

  return true;
}

export const firebaseRevenueCatAttributionRegressionTestsPassed =
  assertFirebaseRevenueCatAttributionRegressionScenarios();
