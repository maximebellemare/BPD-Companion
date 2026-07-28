import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  createFirebaseRevenueCatAttributionController,
  type FirebaseAnalyticsClient,
  type FirebaseRevenueCatAttributionDiagnostics,
  type FirebaseRevenueCatAttributionSyncOptions,
} from '@/services/analytics/firebaseRevenueCatAttributionCore';

type PurchasesStatic = typeof import('react-native-purchases').default;
type FirebaseAnalyticsModule = typeof import('@react-native-firebase/analytics');
type FirebaseAppModule = typeof import('@react-native-firebase/app');

function isNativeRuntime(): boolean {
  return Constants.appOwnership !== 'expo' && (Platform.OS === 'ios' || Platform.OS === 'android');
}

async function loadAnalytics(): Promise<{
  analytics: FirebaseAnalyticsClient | null;
  firebaseDefaultAppAvailable: boolean;
  analyticsModuleAvailable: boolean;
  analyticsCollectionEnabled: boolean;
  errorName?: string;
  errorMessage?: string;
}> {
  if (!isNativeRuntime()) {
    return {
      analytics: null,
      firebaseDefaultAppAvailable: false,
      analyticsModuleAvailable: false,
      analyticsCollectionEnabled: false,
    };
  }

  let firebaseDefaultAppAvailable = false;

  try {
    const appModule: FirebaseAppModule = await import('@react-native-firebase/app');
    appModule.getApp();
    firebaseDefaultAppAvailable = true;
  } catch {
    firebaseDefaultAppAvailable = false;
  }

  try {
    const module: FirebaseAnalyticsModule = await import('@react-native-firebase/analytics');
    const analytics = module.getAnalytics();
    let analyticsCollectionEnabled = false;
    try {
      await module.setAnalyticsCollectionEnabled(analytics, true);
      analyticsCollectionEnabled = true;
    } catch {
      analyticsCollectionEnabled = false;
    }
    return {
      analytics: {
        getAppInstanceId: () => module.getAppInstanceId(analytics),
      },
      firebaseDefaultAppAvailable,
      analyticsModuleAvailable: true,
      analyticsCollectionEnabled,
    };
  } catch (error) {
    const sanitizeMessage = (message: string) => message.replace(/[A-Za-z0-9._:-]{16,}/g, '[redacted]');
    const normalizedError = error instanceof Error
      ? { errorName: error.name || 'Error', errorMessage: sanitizeMessage(error.message) }
      : { errorName: 'UnknownError', errorMessage: sanitizeMessage(String(error)) };
    return {
      analytics: null,
      firebaseDefaultAppAvailable,
      analyticsModuleAvailable: false,
      analyticsCollectionEnabled: false,
      ...normalizedError,
    };
  }
}

const firebaseRevenueCatAttribution = createFirebaseRevenueCatAttributionController({
  isNativeRuntime,
  loadAnalytics,
  log: (message: string, details?: FirebaseRevenueCatAttributionDiagnostics) => {
    console.info(message, details ?? {});
  },
});

export async function syncFirebaseAppInstanceIdToRevenueCat(
  Purchases: PurchasesStatic,
  options?: FirebaseRevenueCatAttributionSyncOptions,
) {
  return firebaseRevenueCatAttribution.sync(Purchases, options);
}
