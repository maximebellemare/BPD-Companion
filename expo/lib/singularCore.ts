export type SingularAppOwnership = 'expo' | 'standalone' | 'guest' | string | null | undefined;

export type SingularPlatform = 'ios' | 'android' | 'web' | string;

export type SingularEnvironment = {
  EXPO_PUBLIC_SINGULAR_SDK_KEY?: string;
  EXPO_PUBLIC_SINGULAR_SDK_SECRET?: string;
};

export type SingularNativeApi = {
  createConfig: (sdkKey: string, sdkSecret: string) => unknown;
  init: (config: unknown) => void | Promise<void>;
  setCustomUserId: (userId: string) => void | Promise<void>;
  unsetCustomUserId: () => void | Promise<void>;
  event: (name: string) => void | Promise<void>;
  enableLogging?: (config: unknown) => void | Promise<void>;
};

export type SingularAppEventName =
  | 'sign_up'
  | 'onboarding_complete'
  | 'paywall_view';

export type SingularControllerDependencies = {
  platform: SingularPlatform;
  appOwnership: SingularAppOwnership;
  env: SingularEnvironment;
  isDevelopment: boolean;
  loadNativeApi: () => Promise<SingularNativeApi>;
  log?: (message: string, details?: Record<string, unknown>) => void;
  warn?: (message: string, error?: unknown) => void;
};

export type SingularRuntimeState = {
  initialized: boolean;
  initializationAttempted: boolean;
  nativeModuleLoaded: boolean | null;
  initSucceeded: boolean | null;
  nativePlatform: boolean;
  expoGo: boolean;
  currentUserId: string | null;
  lastSdkStatus: string | null;
  lastSdkError: string | null;
};

function normalizeEnvValue(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function hasSingularCredentials(env: SingularEnvironment): boolean {
  return (
    normalizeEnvValue(env.EXPO_PUBLIC_SINGULAR_SDK_KEY).length > 0 &&
    normalizeEnvValue(env.EXPO_PUBLIC_SINGULAR_SDK_SECRET).length > 0
  );
}

export function shouldUseSingularNativeSdk(params: {
  platform: SingularPlatform;
  appOwnership: SingularAppOwnership;
}): boolean {
  const nativePlatform = params.platform === 'ios' || params.platform === 'android';
  return nativePlatform && params.appOwnership !== 'expo';
}

export function createSingularController(deps: SingularControllerDependencies) {
  let initialized = false;
  let initializationAttempted = false;
  let initPromise: Promise<boolean> | null = null;
  let nativeApiPromise: Promise<SingularNativeApi> | null = null;
  let nativeModuleLoaded: boolean | null = null;
  let initSucceeded: boolean | null = null;
  let currentUserId: string | null = null;
  let lastSdkStatus: string | null = null;
  let lastSdkError: string | null = null;

  const nativePlatform = shouldUseSingularNativeSdk({
    platform: deps.platform,
    appOwnership: deps.appOwnership,
  });

  const log = (message: string, details?: Record<string, unknown>) => {
    lastSdkStatus = message;
    if (deps.isDevelopment) {
      deps.log?.(message, details);
    }
  };

  const warn = (message: string, error?: unknown) => {
    lastSdkStatus = message;
    lastSdkError = error instanceof Error ? error.message : String(error ?? 'Unknown error');
    if (deps.isDevelopment) {
      deps.warn?.(message, error);
    }
  };

  const loadNativeApi = async (): Promise<SingularNativeApi> => {
    nativeApiPromise ??= deps.loadNativeApi()
      .then((api) => {
        nativeModuleLoaded = true;
        return api;
      })
      .catch((error) => {
        nativeModuleLoaded = false;
        throw error;
      });
    return nativeApiPromise;
  };

  const initialize = async (): Promise<boolean> => {
    if (initialized) {
      return true;
    }

    if (!nativePlatform) {
      initializationAttempted = true;
      initSucceeded = false;
      log('[Singular] Native SDK skipped', {
        platform: deps.platform,
        appOwnership: deps.appOwnership ?? null,
      });
      return false;
    }

    if (!hasSingularCredentials(deps.env)) {
      initializationAttempted = true;
      initSucceeded = false;
      log('[Singular] Missing SDK key or secret; initialization skipped');
      return false;
    }

    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      initializationAttempted = true;
      try {
        const sdkKey = normalizeEnvValue(deps.env.EXPO_PUBLIC_SINGULAR_SDK_KEY);
        const sdkSecret = normalizeEnvValue(deps.env.EXPO_PUBLIC_SINGULAR_SDK_SECRET);
        const api = await loadNativeApi();
        const config = api.createConfig(sdkKey, sdkSecret);

        if (deps.isDevelopment) {
          await api.enableLogging?.(config);
        }

        await api.init(config);
        initialized = true;
        initSucceeded = true;
        log('[Singular] SDK initialized', { platform: deps.platform });
        return true;
      } catch (error) {
        initialized = false;
        initSucceeded = false;
        warn('[Singular] SDK initialization failed', error);
        return false;
      } finally {
        initPromise = null;
      }
    })();

    return initPromise;
  };

  const setCustomUserId = async (userId: string | null | undefined): Promise<void> => {
    const normalizedUserId = userId?.trim() ?? '';
    if (!normalizedUserId) {
      await clearCustomUserId();
      return;
    }

    if (currentUserId === normalizedUserId) {
      return;
    }

    const ready = await initialize();
    if (!ready) {
      return;
    }

    try {
      const api = await loadNativeApi();
      if (currentUserId && currentUserId !== normalizedUserId) {
        await api.unsetCustomUserId();
        log('[Singular] Previous custom user ID cleared before account switch');
      }
      await api.setCustomUserId(normalizedUserId);
      currentUserId = normalizedUserId;
      log('[Singular] Custom user ID set');
    } catch (error) {
      warn('[Singular] Failed to set custom user ID', error);
    }
  };

  const clearCustomUserId = async (): Promise<void> => {
    if (!nativePlatform) {
      currentUserId = null;
      return;
    }

    try {
      if (initialized || initializationAttempted) {
        const api = await loadNativeApi();
        await api.unsetCustomUserId();
      }
      currentUserId = null;
      log('[Singular] Custom user ID cleared');
    } catch (error) {
      currentUserId = null;
      warn('[Singular] Failed to clear custom user ID', error);
    }
  };

  const trackEvent = async (name: SingularAppEventName): Promise<void> => {
    const ready = await initialize();
    if (!ready) {
      return;
    }

    try {
      const api = await loadNativeApi();
      await api.event(name);
      log('[Singular] Event tracked', { name });
    } catch (error) {
      warn('[Singular] Failed to track event', error);
    }
  };

  const getState = (): SingularRuntimeState => ({
    initialized,
    initializationAttempted,
    nativeModuleLoaded,
    initSucceeded,
    nativePlatform,
    expoGo: deps.appOwnership === 'expo',
    currentUserId,
    lastSdkStatus,
    lastSdkError,
  });

  return {
    initialize,
    setCustomUserId,
    clearCustomUserId,
    trackEvent,
    getState,
  };
}
