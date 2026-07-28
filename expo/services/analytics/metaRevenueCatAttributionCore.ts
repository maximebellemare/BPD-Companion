export type MetaAttributionPurchasesClient = {
  setFBAnonymousID: (fbAnonymousID: string | null) => Promise<void>;
};

export type MetaAttributionFacebookSdk = {
  Settings: {
    setAutoLogAppEventsEnabled: (enabled: boolean) => void;
    setAdvertiserIDCollectionEnabled: (enabled: boolean) => void;
    initializeSDK: () => void;
  };
  AppEventsLogger: {
    getAnonymousID: () => Promise<string | null>;
  };
};

export type MetaRevenueCatAttributionDependencies = {
  isNativeRuntime: () => boolean;
  shouldInitializeFacebookSdkInJs: () => boolean;
  loadFacebookSdk: () => Promise<MetaAttributionFacebookSdk | null>;
  log?: (message: string, details?: Record<string, unknown>) => void;
  warn?: (message: string, error: unknown) => void;
};

export function createMetaRevenueCatAttributionController(
  deps: MetaRevenueCatAttributionDependencies,
) {
  let attributionPromise: Promise<void> | null = null;
  let metaSdkInitialized = false;

  async function ensureMetaSdkInitialized(module: MetaAttributionFacebookSdk): Promise<void> {
    if (metaSdkInitialized) return;

    deps.log?.('[MetaAttribution] Facebook SDK initialization attempted');
    module.Settings.setAutoLogAppEventsEnabled(false);
    module.Settings.setAdvertiserIDCollectionEnabled(false);
    if (deps.shouldInitializeFacebookSdkInJs()) {
      module.Settings.initializeSDK();
    }
    metaSdkInitialized = true;
    deps.log?.('[MetaAttribution] Facebook SDK initialization succeeded');
  }

  async function sync(Purchases: MetaAttributionPurchasesClient): Promise<void> {
    if (!deps.isNativeRuntime()) return;
    if (attributionPromise) return attributionPromise;

    attributionPromise = (async () => {
      try {
        const facebookSdk = await deps.loadFacebookSdk();
        if (!facebookSdk) {
          deps.log?.('[MetaAttribution] Facebook SDK unavailable');
          return;
        }

        await ensureMetaSdkInitialized(facebookSdk);
        const anonymousId = await facebookSdk.AppEventsLogger.getAnonymousID();
        deps.log?.('[MetaAttribution] Facebook anonymous ID read', {
          anonymousIdExists: !!anonymousId,
        });
        if (!anonymousId) return;

        deps.log?.('[MetaAttribution] RevenueCat Facebook anonymous ID sync attempted');
        await Purchases.setFBAnonymousID(anonymousId);
        deps.log?.('[MetaAttribution] RevenueCat Facebook anonymous ID sync succeeded');
      } catch (error) {
        deps.warn?.('[MetaAttribution] RevenueCat Facebook anonymous ID sync failed', error);
      } finally {
        attributionPromise = null;
      }
    })();

    return attributionPromise;
  }

  return {
    sync,
    getState: () => ({
      metaSdkInitialized,
      hasInFlightSync: attributionPromise !== null,
    }),
  };
}
