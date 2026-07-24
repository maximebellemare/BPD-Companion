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
  loadFacebookSdk: () => Promise<MetaAttributionFacebookSdk | null>;
  warn?: (message: string, error: unknown) => void;
};

export function createMetaRevenueCatAttributionController(
  deps: MetaRevenueCatAttributionDependencies,
) {
  let attributionPromise: Promise<void> | null = null;
  let metaSdkInitialized = false;

  async function ensureMetaSdkInitialized(module: MetaAttributionFacebookSdk): Promise<void> {
    if (metaSdkInitialized) return;

    module.Settings.setAutoLogAppEventsEnabled(false);
    module.Settings.setAdvertiserIDCollectionEnabled(false);
    module.Settings.initializeSDK();
    metaSdkInitialized = true;
  }

  async function sync(Purchases: MetaAttributionPurchasesClient): Promise<void> {
    if (!deps.isNativeRuntime()) return;
    if (attributionPromise) return attributionPromise;

    attributionPromise = (async () => {
      try {
        const facebookSdk = await deps.loadFacebookSdk();
        if (!facebookSdk) return;

        await ensureMetaSdkInitialized(facebookSdk);
        const anonymousId = await facebookSdk.AppEventsLogger.getAnonymousID();
        if (!anonymousId) return;

        await Purchases.setFBAnonymousID(anonymousId);
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
