import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  createMetaRevenueCatAttributionController,
  type MetaAttributionFacebookSdk,
} from '@/services/analytics/metaRevenueCatAttributionCore';

type PurchasesStatic = typeof import('react-native-purchases').default;
type FacebookSdkModule = typeof import('react-native-fbsdk-next');

function isNativeRuntime(): boolean {
  return Constants.appOwnership !== 'expo' && (Platform.OS === 'ios' || Platform.OS === 'android');
}

async function loadFacebookSdk(): Promise<MetaAttributionFacebookSdk | null> {
  if (!isNativeRuntime()) return null;

  try {
    const module: FacebookSdkModule = await import('react-native-fbsdk-next');
    return {
      Settings: module.Settings,
      AppEventsLogger: module.AppEventsLogger,
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[MetaAttribution] Facebook SDK unavailable', error);
    }
    return null;
  }
}

const metaRevenueCatAttribution = createMetaRevenueCatAttributionController({
  isNativeRuntime,
  shouldInitializeFacebookSdkInJs: () => Platform.OS === 'ios',
  loadFacebookSdk,
  log: (message, details) => {
    if (__DEV__) {
      console.log(message, details ?? {});
    }
  },
  warn: (message, error) => {
    if (__DEV__) {
      console.warn(message, error);
    }
  },
});

export async function syncMetaAnonymousIdToRevenueCat(Purchases: PurchasesStatic): Promise<void> {
  return metaRevenueCatAttribution.sync(Purchases);
}
