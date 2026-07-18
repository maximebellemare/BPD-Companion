import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { createSingularController, type SingularNativeApi } from '@/lib/singularCore';

type SingularModule = typeof import('singular-react-native');

async function loadSingularNativeApi(): Promise<SingularNativeApi> {
  const module: SingularModule = await import('singular-react-native');

  return {
    createConfig: (sdkKey, sdkSecret) => new module.SingularConfig(sdkKey, sdkSecret),
    init: (config) => module.Singular.init(config as InstanceType<typeof module.SingularConfig>),
    setCustomUserId: (userId) => module.Singular.setCustomUserId(userId),
    unsetCustomUserId: () => module.Singular.unsetCustomUserId(),
    event: (name) => module.Singular.event(name),
    enableLogging: (config) => {
      if (config instanceof module.SingularConfig) {
        config.withLoggingEnabled();
      }
    },
  };
}

export const singular = createSingularController({
  platform: Platform.OS,
  appOwnership: Constants.appOwnership,
  env: {
    // Singular mobile SDK credentials are embedded client configuration, not server-side secrets.
    // Keep real values in EAS env/local .env and never print them in logs.
    EXPO_PUBLIC_SINGULAR_SDK_KEY: process.env.EXPO_PUBLIC_SINGULAR_SDK_KEY,
    EXPO_PUBLIC_SINGULAR_SDK_SECRET: process.env.EXPO_PUBLIC_SINGULAR_SDK_SECRET,
  },
  isDevelopment: __DEV__,
  loadNativeApi: loadSingularNativeApi,
  log: (message, details) => console.log(message, details ?? ''),
  warn: (message, error) => console.warn(message, error),
});

export const initializeSingular = singular.initialize;
export const setSingularCustomUserId = singular.setCustomUserId;
export const clearSingularCustomUserId = singular.clearCustomUserId;
export const trackSingularEvent = singular.trackEvent;
export const getSingularRuntimeState = singular.getState;
