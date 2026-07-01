import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  REVENUECAT_ANDROID_API_KEY_ENV,
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_IOS_API_KEY_ENV,
  REVENUECAT_MONTHLY_PRODUCT_ID,
  REVENUECAT_OFFERING_ID,
  REVENUECAT_TEST_API_KEY_ENV,
  REVENUECAT_YEARLY_PRODUCT_ID,
} from '@/constants/revenuecat';

export type CustomerInfo = {
  originalAppUserId?: string;
  entitlements: {
    active: Record<string, {
      expirationDate?: string | null;
      productIdentifier?: string;
      periodType?: string;
    }>;
  };
};

export type PurchasesPackage = {
  identifier: string;
  product: {
    identifier?: string;
    priceString: string;
  };
};

export type PurchasesOffering = {
  identifier: string;
  monthly?: PurchasesPackage | null;
  annual?: PurchasesPackage | null;
};

export type RevenueCatDiagnostics = {
  platform: string;
  configured: boolean;
  apiKeyDetected: boolean;
  apiKeyPrefix: string | null;
  configureSucceeded: boolean;
  configureExceptionMessage: string | null;
  initializationCompleted: boolean;
  currentAppUserId: string | null;
  customerInfoOriginalAppUserId: string | null;
  expectedOfferingId: string;
  expectedEntitlementId: string;
  expectedMonthlyProductId: string;
  expectedYearlyProductId: string;
  offeringsFetched: boolean;
  offeringsCurrentExists: boolean;
  offeringsAllKeys: string[];
  packageCount: number;
  currentOfferingIdentifier: string | null;
  monthlyPackageFound: boolean;
  annualPackageFound: boolean;
  monthlyProductIdentifier: string | null;
  annualProductIdentifier: string | null;
  error: string | null;
};

let configured = false;
let configurePromise: Promise<boolean> | null = null;
let initializationCompleted = false;
let configureExceptionMessage: string | null = null;
let expoGoDisabledLogged = false;

export const PURCHASES_UNAVAILABLE_MESSAGE =
  'Purchases are only available in the installed iOS/Android app.';

export function isNativePurchasesPlatform(): boolean {
  return !isExpoGoPurchases() && (Platform.OS === 'ios' || Platform.OS === 'android');
}

export function isExpoGoPurchases(): boolean {
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) logExpoGoRevenueCatDisabled();
  return isExpoGo;
}

function logExpoGoRevenueCatDisabled(): void {
  if (expoGoDisabledLogged) return;
  expoGoDisabledLogged = true;
  console.log('[Purchases] Expo Go detected — RevenueCat disabled for local testing');
}

function getPurchaseErrorMessage(error: unknown): string {
  if (!isNativePurchasesPlatform()) return PURCHASES_UNAVAILABLE_MESSAGE;
  if (error instanceof Error && error.message) return error.message;
  return 'Purchase could not be completed. Please try again.';
}

function getRCToken(): string | undefined {
  if (isExpoGoPurchases()) return undefined;
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

function getExpectedApiKeyEnvName(): string {
  if (Platform.OS === 'ios') return REVENUECAT_IOS_API_KEY_ENV;
  if (Platform.OS === 'android') return REVENUECAT_ANDROID_API_KEY_ENV;
  return REVENUECAT_TEST_API_KEY_ENV;
}

function getApiKeyPrefix(apiKey: string | undefined): string | null {
  return apiKey ? apiKey.slice(0, 8) : null;
}

export async function configurePurchases(appUserId?: string): Promise<boolean> {
  if (isExpoGoPurchases()) {
    initializationCompleted = true;
    configureExceptionMessage = 'RevenueCat disabled in Expo Go.';
    logExpoGoRevenueCatDisabled();
    return false;
  }
  if (configured) return true;
  if (configurePromise) return configurePromise;

  configurePromise = (async () => {
    try {
      const apiKey = getRCToken();
      if (!apiKey || Platform.OS === 'web') {
        initializationCompleted = true;
        configureExceptionMessage = !apiKey
          ? `Missing RevenueCat API key: ${getExpectedApiKeyEnvName()}`
          : PURCHASES_UNAVAILABLE_MESSAGE;
        console.log('[Purchases] configure skipped:', configureExceptionMessage);
        configurePromise = null;
        return false;
      }
      const Purchases = (await import('react-native-purchases')).default;
      Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
      Purchases.configure({ apiKey, appUserID: appUserId ?? null });
      configured = true;
      initializationCompleted = true;
      configureExceptionMessage = null;
      console.log('[Purchases] Configured for', Platform.OS);
      return true;
    } catch (error) {
      initializationCompleted = true;
      configureExceptionMessage = error instanceof Error ? error.message : String(error);
      console.log('[Purchases] configure error:', configureExceptionMessage);
      configurePromise = null;
      return false;
    }
  })();

  return configurePromise;
}

export async function ensureConfigured(): Promise<void> {
  if (!configured) {
    const success = await configurePurchases();
    if (!success || !configured) {
      throw new Error(configureExceptionMessage ?? 'RevenueCat initialization did not complete.');
    }
  }
}

export async function logInPurchases(appUserId: string): Promise<CustomerInfo | null> {
  if (isExpoGoPurchases()) {
    logExpoGoRevenueCatDisabled();
    return null;
  }
  const success = await configurePurchases(appUserId);
  if (!success || !isNativePurchasesPlatform()) return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const result = await Purchases.logIn(appUserId);
    return result.customerInfo;
  } catch (error) {
    console.log('[Purchases] logIn error:', error);
    throw error;
  }
}

export async function logOutPurchases(): Promise<CustomerInfo | null> {
  if (isExpoGoPurchases()) {
    logExpoGoRevenueCatDisabled();
    return null;
  }
  if (!configured || !isNativePurchasesPlatform()) return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    return await Purchases.logOut();
  } catch (error) {
    console.log('[Purchases] logOut error:', error);
    return null;
  }
}

export function arePurchasesAvailable(): boolean {
  return !isExpoGoPurchases() && configured && isNativePurchasesPlatform();
}

export async function fetchOfferings(): Promise<PurchasesOffering | null> {
  if (isExpoGoPurchases()) {
    logExpoGoRevenueCatDisabled();
    return null;
  }
  await ensureConfigured();
  if (!isNativePurchasesPlatform()) return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const current = offerings.current ?? offerings.all[REVENUECAT_OFFERING_ID] ?? null;
    console.log('[Purchases] fetched offerings, current:', current?.identifier);
    return current;
  } catch (error) {
    console.log('[Purchases] getOfferings error:', error);
    return null;
  }
}

export async function fetchRevenueCatDiagnostics(): Promise<RevenueCatDiagnostics> {
  const apiKey = getRCToken();
  const base: RevenueCatDiagnostics = {
    platform: Platform.OS,
    configured,
    apiKeyDetected: Boolean(apiKey),
    apiKeyPrefix: getApiKeyPrefix(apiKey),
    configureSucceeded: configured,
    configureExceptionMessage,
    initializationCompleted,
    currentAppUserId: null,
    customerInfoOriginalAppUserId: null,
    expectedOfferingId: REVENUECAT_OFFERING_ID,
    expectedEntitlementId: REVENUECAT_ENTITLEMENT_ID,
    expectedMonthlyProductId: REVENUECAT_MONTHLY_PRODUCT_ID,
    expectedYearlyProductId: REVENUECAT_YEARLY_PRODUCT_ID,
    offeringsFetched: false,
    offeringsCurrentExists: false,
    offeringsAllKeys: [],
    packageCount: 0,
    currentOfferingIdentifier: null,
    monthlyPackageFound: false,
    annualPackageFound: false,
    monthlyProductIdentifier: null,
    annualProductIdentifier: null,
    error: null,
  };

  try {
    if (isExpoGoPurchases()) {
      logExpoGoRevenueCatDisabled();
      return {
        ...base,
        initializationCompleted: true,
        configureExceptionMessage: 'RevenueCat disabled in Expo Go.',
        error: 'RevenueCat disabled in Expo Go.',
      };
    }

    await configurePurchases();
    base.configured = configured;
    base.configureSucceeded = configured;
    base.configureExceptionMessage = configureExceptionMessage;
    base.initializationCompleted = initializationCompleted;

    if (Platform.OS === 'web') {
      return { ...base, error: PURCHASES_UNAVAILABLE_MESSAGE };
    }

    if (!configured) {
      return { ...base, error: configureExceptionMessage ?? 'RevenueCat is not configured.' };
    }

    const Purchases = (await import('react-native-purchases')).default;
    const currentAppUserId = typeof Purchases.getAppUserID === 'function'
      ? await Purchases.getAppUserID()
      : null;
    const customerInfo = await Purchases.getCustomerInfo();
    const offerings = await Purchases.getOfferings();
    const all = offerings.all ?? {};
    const current = offerings.current ?? all[REVENUECAT_OFFERING_ID] ?? null;
    const availablePackages = Array.isArray((current as any)?.availablePackages)
      ? (current as any).availablePackages
      : [];

    return {
      ...base,
      configured,
      currentAppUserId,
      customerInfoOriginalAppUserId: customerInfo?.originalAppUserId ?? null,
      offeringsFetched: true,
      offeringsCurrentExists: Boolean(offerings.current),
      offeringsAllKeys: Object.keys(all),
      packageCount: availablePackages.length,
      currentOfferingIdentifier: current?.identifier ?? null,
      monthlyPackageFound: Boolean(current?.monthly),
      annualPackageFound: Boolean(current?.annual),
      monthlyProductIdentifier: current?.monthly?.product?.identifier ?? null,
      annualProductIdentifier: current?.annual?.product?.identifier ?? null,
      error: null,
    };
  } catch (error) {
    return {
      ...base,
      configured,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  if (isExpoGoPurchases()) {
    logExpoGoRevenueCatDisabled();
    return null;
  }
  await ensureConfigured();
  if (!isNativePurchasesPlatform()) return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.log('[Purchases] getCustomerInfo error:', error);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  if (isExpoGoPurchases()) {
    logExpoGoRevenueCatDisabled();
    return null;
  }
  await ensureConfigured();
  if (!arePurchasesAvailable()) throw new Error(PURCHASES_UNAVAILABLE_MESSAGE);
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const result = await Purchases.purchasePackage(pkg as never);
    console.log('[Purchases] purchase success:', pkg.identifier);
    return result.customerInfo;
  } catch (error) {
    console.log('[Purchases] purchasePackage error:', error);
    throw new Error(getPurchaseErrorMessage(error));
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (isExpoGoPurchases()) {
    logExpoGoRevenueCatDisabled();
    return null;
  }
  await ensureConfigured();
  if (!arePurchasesAvailable()) throw new Error(PURCHASES_UNAVAILABLE_MESSAGE);
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const customerInfo = await Purchases.restorePurchases();
    console.log('[Purchases] restore success');
    return customerInfo;
  } catch (error) {
    console.log('[Purchases] restorePurchases error:', error);
    throw new Error(getPurchaseErrorMessage(error));
  }
}

export function hasActiveEntitlement(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return !!info.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
}

export function getActiveExpiration(info: CustomerInfo | null): number | null {
  if (!info) return null;
  const ent = info.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
  if (!ent) return null;
  return ent.expirationDate ? new Date(ent.expirationDate).getTime() : null;
}

export function getActivePeriodType(info: CustomerInfo | null): 'monthly' | 'yearly' | null {
  if (!info) return null;
  const ent = info.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
  if (!ent) return null;
  const id = ent.productIdentifier?.toLowerCase() ?? '';
  if (id === REVENUECAT_YEARLY_PRODUCT_ID.toLowerCase()) return 'yearly';
  if (id === REVENUECAT_MONTHLY_PRODUCT_ID.toLowerCase()) return 'monthly';
  if (id.includes('year') || id.includes('annual')) return 'yearly';
  if (id.includes('month')) return 'monthly';
  return null;
}

export function isTrialActive(info: CustomerInfo | null): boolean {
  if (!info) return false;
  const ent = info.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
  return ent?.periodType === 'TRIAL';
}
