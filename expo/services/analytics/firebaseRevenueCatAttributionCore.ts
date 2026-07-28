export type FirebaseAttributionPurchasesClient = {
  setFirebaseAppInstanceID: (firebaseAppInstanceID: string | null) => Promise<void>;
  syncAttributesAndOfferingsIfNeeded?: () => Promise<unknown>;
};

export type FirebaseAnalyticsClient = {
  getAppInstanceId: () => Promise<string | null>;
};

export type FirebaseRevenueCatAttributionDiagnostics = {
  reached: boolean;
  firebaseDefaultAppAvailable: boolean;
  analyticsModuleAvailable: boolean;
  analyticsCollectionEnabled: boolean;
  appInstanceIdPresent: boolean;
  appInstanceIdFormatValid: boolean;
  revenueCatConfigured: boolean;
  setFirebaseAppInstanceIDCalled: boolean;
  explicitAttributeSyncAttempted: boolean;
  explicitAttributeSyncSucceeded: boolean;
  failureBranch: string | null;
  errorName?: string;
  errorMessage?: string;
};

export type FirebaseRevenueCatAttributionResult = {
  ok: boolean;
  diagnostics: FirebaseRevenueCatAttributionDiagnostics;
};

export type FirebaseRevenueCatAttributionDependencies = {
  isNativeRuntime: () => boolean;
  loadAnalytics: () => Promise<{
    analytics: FirebaseAnalyticsClient | null;
    firebaseDefaultAppAvailable: boolean;
    analyticsModuleAvailable: boolean;
    analyticsCollectionEnabled: boolean;
    errorName?: string;
    errorMessage?: string;
  }>;
  log?: (message: string, details?: FirebaseRevenueCatAttributionDiagnostics) => void;
};

export type FirebaseRevenueCatAttributionSyncOptions = {
  forceNew?: boolean;
};

export function createFirebaseRevenueCatAttributionController(
  deps: FirebaseRevenueCatAttributionDependencies,
) {
  let appInstanceId: string | null = null;
  let syncPromise: Promise<FirebaseRevenueCatAttributionResult> | null = null;

  function createDiagnostics(): FirebaseRevenueCatAttributionDiagnostics {
    return {
      reached: false,
      firebaseDefaultAppAvailable: false,
      analyticsModuleAvailable: false,
      analyticsCollectionEnabled: false,
      appInstanceIdPresent: false,
      appInstanceIdFormatValid: false,
      revenueCatConfigured: false,
      setFirebaseAppInstanceIDCalled: false,
      explicitAttributeSyncAttempted: false,
      explicitAttributeSyncSucceeded: false,
      failureBranch: null,
    };
  }

  function sanitizeError(error: unknown): Pick<FirebaseRevenueCatAttributionDiagnostics, 'errorName' | 'errorMessage'> {
    const sanitizeMessage = (message: string) => message.replace(/[A-Za-z0-9._:-]{16,}/g, '[redacted]');
    if (error instanceof Error) {
      return {
        errorName: error.name || 'Error',
        errorMessage: sanitizeMessage(error.message),
      };
    }
    return {
      errorName: 'UnknownError',
      errorMessage: sanitizeMessage(String(error)),
    };
  }

  function isValidAppInstanceId(id: string): boolean {
    return /^[A-Za-z0-9._:-]{8,256}$/.test(id);
  }

  function finish(
    ok: boolean,
    diagnostics: FirebaseRevenueCatAttributionDiagnostics,
  ): FirebaseRevenueCatAttributionResult {
    deps.log?.('[FirebaseAttribution] RevenueCat Firebase App Instance ID sync result', diagnostics);
    return { ok, diagnostics };
  }

  async function sync(
    Purchases: FirebaseAttributionPurchasesClient,
    options: FirebaseRevenueCatAttributionSyncOptions = {},
  ): Promise<FirebaseRevenueCatAttributionResult> {
    const diagnostics = createDiagnostics();
    diagnostics.reached = true;

    if (!deps.isNativeRuntime()) {
      diagnostics.failureBranch = 'skipped_non_native_runtime';
      return finish(false, diagnostics);
    }
    if (syncPromise) {
      if (!options.forceNew) return syncPromise;
      await syncPromise;
    }

    syncPromise = (async () => {
      try {
        diagnostics.revenueCatConfigured = true;
        const {
          analytics,
          firebaseDefaultAppAvailable,
          analyticsModuleAvailable,
          analyticsCollectionEnabled,
          errorName,
          errorMessage,
        } =
          await deps.loadAnalytics();
        diagnostics.firebaseDefaultAppAvailable = firebaseDefaultAppAvailable;
        diagnostics.analyticsModuleAvailable = analyticsModuleAvailable;
        diagnostics.analyticsCollectionEnabled = analyticsCollectionEnabled;
        if (errorName) diagnostics.errorName = errorName;
        if (errorMessage) diagnostics.errorMessage = errorMessage;

        if (!analytics) {
          diagnostics.failureBranch = 'firebase_analytics_unavailable';
          return finish(false, diagnostics);
        }

        const id = appInstanceId ?? await analytics.getAppInstanceId();
        const normalizedId = typeof id === 'string' ? id.trim() : '';
        appInstanceId = normalizedId || null;
        diagnostics.appInstanceIdPresent = typeof id === 'string' && id.trim().length > 0;
        diagnostics.appInstanceIdFormatValid = diagnostics.appInstanceIdPresent && isValidAppInstanceId(appInstanceId ?? '');

        if (!appInstanceId || !diagnostics.appInstanceIdFormatValid) {
          diagnostics.failureBranch = diagnostics.appInstanceIdPresent
            ? 'invalid_app_instance_id_format'
            : 'missing_app_instance_id';
          return finish(false, diagnostics);
        }

        await Purchases.setFirebaseAppInstanceID(appInstanceId);
        diagnostics.setFirebaseAppInstanceIDCalled = true;

        if (typeof Purchases.syncAttributesAndOfferingsIfNeeded !== 'function') {
          diagnostics.failureBranch = 'revenuecat_attribute_sync_unavailable';
          return finish(false, diagnostics);
        }

        diagnostics.explicitAttributeSyncAttempted = true;
        await Purchases.syncAttributesAndOfferingsIfNeeded();
        diagnostics.explicitAttributeSyncSucceeded = true;
        return finish(true, diagnostics);
      } catch (error) {
        Object.assign(diagnostics, sanitizeError(error));
        diagnostics.failureBranch ??= 'sync_exception';
        return finish(false, diagnostics);
      } finally {
        syncPromise = null;
      }
    })();

    return syncPromise;
  }

  return {
    sync,
    getState: () => ({
      hasCachedAppInstanceId: !!appInstanceId,
      hasInFlightSync: syncPromise !== null,
    }),
  };
}
