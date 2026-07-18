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
import {
  REVENUECAT_IDENTITY_MISMATCH_MESSAGE,
  SUBSCRIPTION_LINKED_TO_ANOTHER_ACCOUNT_MESSAGE,
  hasActiveMembershipEntitlement,
  isRevenueCatOwnershipConflict,
} from '@/services/subscription/restoreSecurityModel';
import {
  selectAndroidSubscriptionOption,
} from '@/services/subscription/androidPurchaseSelector';
import type { SubscriptionPeriod } from '@/types/subscription';
import type {
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

export type {
  GoogleProductChangeInfo,
  PurchasesOffering,
  PurchasesPackage,
  SubscriptionOption,
} from 'react-native-purchases';

export type CustomerInfo = {
  originalAppUserId?: string;
  activeSubscriptions?: string[];
  allPurchasedProductIdentifiers?: string[];
  entitlements: {
    all?: Record<string, {
      expirationDate?: string | null;
      productIdentifier?: string;
      periodType?: string;
    }>;
    active: Record<string, {
      expirationDate?: string | null;
      productIdentifier?: string;
      periodType?: string;
    }>;
  };
};

export type RevenueCatBillingPeriod = string | {
  iso8601?: string;
};

let configured = false;
let configurePromise: Promise<boolean> | null = null;
let configureExceptionMessage: string | null = null;
let appleAdsAttributionEnabled = false;

type PurchasesStatic = typeof import('react-native-purchases').default;

export const PURCHASES_UNAVAILABLE_MESSAGE =
  'Membership options are loading. Please try again in a moment.';

export function isNativePurchasesPlatform(): boolean {
  return !isExpoGoPurchases() && (Platform.OS === 'ios' || Platform.OS === 'android');
}

export function isExpoGoPurchases(): boolean {
  return Constants.appOwnership === 'expo';
}

function getPurchaseErrorMessage(error: unknown): string {
  if (!isNativePurchasesPlatform()) return PURCHASES_UNAVAILABLE_MESSAGE;
  if (isRevenueCatOwnershipConflict(error)) return SUBSCRIPTION_LINKED_TO_ANOTHER_ACCOUNT_MESSAGE;
  if (error instanceof Error && error.message) return error.message;
  return 'Purchase could not be completed. Please try again.';
}

async function syncPurchasesIfAvailable(Purchases: any, context: string): Promise<CustomerInfo | null> {
  if (typeof Purchases.syncPurchases !== 'function') {
    return null;
  }
  void context;
  await Purchases.syncPurchases();
  return await Purchases.getCustomerInfo() as CustomerInfo;
}

function logRestoreTiming(step: string, startedAt: number, extra?: Record<string, unknown>): void {
  console.log('[RestoreFlow]', {
    step,
    elapsedMs: Date.now() - startedAt,
    ...(extra ?? {}),
  });
}

async function getCurrentAppUserId(Purchases: any): Promise<string | null> {
  return typeof Purchases.getAppUserID === 'function'
    ? await Purchases.getAppUserID()
    : null;
}

async function ensureRevenueCatIdentity(Purchases: any, supabaseUserId: string): Promise<void> {
  const startedAt = Date.now();
  if (!supabaseUserId) {
    throw new Error(REVENUECAT_IDENTITY_MISMATCH_MESSAGE);
  }

  const currentAppUserId = await getCurrentAppUserId(Purchases);
  logRestoreTiming('identity:getAppUserID', startedAt, {
    matched: currentAppUserId === supabaseUserId,
  });
  if (currentAppUserId === supabaseUserId) return;

  if (typeof Purchases.logIn !== 'function') {
    throw new Error(REVENUECAT_IDENTITY_MISMATCH_MESSAGE);
  }

  const loginStartedAt = Date.now();
  await Purchases.logIn(supabaseUserId);
  logRestoreTiming('identity:logIn', loginStartedAt);
  const verifiedAppUserId = await getCurrentAppUserId(Purchases);
  logRestoreTiming('identity:verifyAfterLogIn', startedAt, {
    matched: verifiedAppUserId === supabaseUserId,
  });
  if (verifiedAppUserId !== supabaseUserId) {
    throw new Error(REVENUECAT_IDENTITY_MISMATCH_MESSAGE);
  }
}

function shouldAttemptAndroidSync(info: CustomerInfo | null): boolean {
  return Platform.OS === 'android' && !!getEmptyReceiptClassification(info);
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

function getEmptyReceiptClassification(info: CustomerInfo | null): string | null {
  if (hasActiveEntitlement(info)) return null;
  const hasStoreData = (info?.activeSubscriptions?.length ?? 0) > 0 ||
    (info?.allPurchasedProductIdentifiers?.length ?? 0) > 0;
  return hasStoreData ? 'store_purchase_without_entitlement' : 'receipt_not_synced_or_no_active_purchase';
}

async function enableAppleAdsAttribution(Purchases: PurchasesStatic): Promise<void> {
  if (Platform.OS !== 'ios' || appleAdsAttributionEnabled) {
    return;
  }

  try {
    await Purchases.enableAdServicesAttributionTokenCollection();
    appleAdsAttributionEnabled = true;
  } catch (error) {
    console.warn('[RevenueCat] Apple Ads attribution collection failed', error);
  }
}

export async function configurePurchases(appUserId?: string): Promise<boolean> {
  if (isExpoGoPurchases()) {
    configureExceptionMessage = 'RevenueCat disabled in Expo Go.';
    return false;
  }
  if (configured) return true;
  if (configurePromise) return configurePromise;

  configurePromise = (async () => {
    try {
      const apiKey = getRCToken();
      if (!apiKey || Platform.OS === 'web') {
        configureExceptionMessage = !apiKey
          ? `Missing RevenueCat API key: ${getExpectedApiKeyEnvName()}`
          : PURCHASES_UNAVAILABLE_MESSAGE;
        configurePromise = null;
        return false;
      }
      const Purchases = (await import('react-native-purchases')).default;
      Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
      Purchases.configure({ apiKey, appUserID: appUserId ?? null });
      await enableAppleAdsAttribution(Purchases);
      configured = true;
      configureExceptionMessage = null;
      return true;
    } catch (error) {
      configureExceptionMessage = error instanceof Error ? error.message : String(error);
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
    return null;
  }
  const success = await configurePurchases(appUserId);
  if (!success || !isNativePurchasesPlatform()) return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const result = await Purchases.logIn(appUserId);
    let customerInfo = result.customerInfo as CustomerInfo | null;
    if (shouldAttemptAndroidSync(customerInfo)) {
      customerInfo = await syncPurchasesIfAvailable(Purchases, 'android_login_empty_customer_info') ?? customerInfo;
    }
    return customerInfo;
  } catch (error) {
    throw error;
  }
}

export async function logOutPurchases(): Promise<CustomerInfo | null> {
  if (isExpoGoPurchases()) {
    return null;
  }
  if (!configured || !isNativePurchasesPlatform()) return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    return await Purchases.logOut();
  } catch {
    return null;
  }
}

export function arePurchasesAvailable(): boolean {
  return !isExpoGoPurchases() && configured && isNativePurchasesPlatform();
}

export async function fetchOfferings(): Promise<PurchasesOffering | null> {
  if (isExpoGoPurchases()) {
    return null;
  }
  await ensureConfigured();
  if (!isNativePurchasesPlatform()) return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const current = offerings.current ?? offerings.all[REVENUECAT_OFFERING_ID] ?? null;
    return current;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'RevenueCat offerings request failed.');
  }
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  if (isExpoGoPurchases()) {
    return null;
  }
  await ensureConfigured();
  if (!isNativePurchasesPlatform()) return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    let customerInfo = await Purchases.getCustomerInfo() as CustomerInfo;
    if (shouldAttemptAndroidSync(customerInfo)) {
      customerInfo = await syncPurchasesIfAvailable(Purchases, 'android_fetch_customer_info_empty') ?? customerInfo;
    }
    return customerInfo;
  } catch {
    return null;
  }
}

export async function purchasePackage(
  pkg: PurchasesPackage,
  supabaseUserId: string,
  period?: SubscriptionPeriod,
): Promise<CustomerInfo | null> {
  if (isExpoGoPurchases()) {
    return null;
  }
  await ensureConfigured();
  if (!arePurchasesAvailable()) throw new Error(PURCHASES_UNAVAILABLE_MESSAGE);
  const Purchases = (await import('react-native-purchases')).default;
  try {
    await ensureRevenueCatIdentity(Purchases, supabaseUserId);
    let result: { customerInfo?: CustomerInfo | null };
    if (Platform.OS === 'android' && period) {
      const customerInfoBeforePurchase = await Purchases.getCustomerInfo() as CustomerInfo;
      const selection = selectAndroidSubscriptionOption({
        pkg,
        period,
        customerInfo: customerInfoBeforePurchase,
      });
      if (!selection.subscriptionOption) {
        throw new Error(PURCHASES_UNAVAILABLE_MESSAGE);
      }
      result = await Purchases.purchaseSubscriptionOption(
        selection.subscriptionOption,
        selection.googleProductChangeInfo,
      ) as { customerInfo?: CustomerInfo | null };
    } else {
      result = await Purchases.purchasePackage(pkg as never);
    }
    let customerInfo = ((await Purchases.getCustomerInfo()) ?? result.customerInfo ?? null) as CustomerInfo | null;
    const emptyClassification = getEmptyReceiptClassification(customerInfo);
    if ((Platform.OS === 'android' || emptyClassification) && emptyClassification && typeof Purchases.syncPurchases === 'function') {
      customerInfo = await syncPurchasesIfAvailable(Purchases, 'purchase_missing_entitlement') ?? customerInfo;
    }
    return customerInfo;
  } catch (error) {
    let syncedCustomerInfo: CustomerInfo | null = null;
    if (!isRevenueCatOwnershipConflict(error)) {
      try {
        syncedCustomerInfo = await syncPurchasesIfAvailable(Purchases, 'purchase_error_fallback');
      } catch {
        // Best-effort recovery only.
      }
    }
    if (hasActiveEntitlement(syncedCustomerInfo)) {
      return syncedCustomerInfo;
    }
    throw new Error(getPurchaseErrorMessage(error));
  }
}

export async function restorePurchases(supabaseUserId: string): Promise<CustomerInfo | null> {
  if (isExpoGoPurchases()) {
    return null;
  }
  await ensureConfigured();
  if (!arePurchasesAvailable()) throw new Error(PURCHASES_UNAVAILABLE_MESSAGE);
  try {
    const restoreStartedAt = Date.now();
    const Purchases = (await import('react-native-purchases')).default;
    await ensureRevenueCatIdentity(Purchases, supabaseUserId);
    logRestoreTiming('restore:identityPreflightComplete', restoreStartedAt);
    if (Platform.OS === 'android') {
      const androidPreRestoreInfoStartedAt = Date.now();
      const customerInfoBeforeRestore = await Purchases.getCustomerInfo() as CustomerInfo;
      logRestoreTiming('restore:androidPreRestoreGetCustomerInfo', androidPreRestoreInfoStartedAt, {
        hasActiveEntitlement: hasActiveEntitlement(customerInfoBeforeRestore),
      });
      if (shouldAttemptAndroidSync(customerInfoBeforeRestore)) {
        const androidSyncStartedAt = Date.now();
        await syncPurchasesIfAvailable(Purchases, 'android_before_restore_empty_customer_info');
        logRestoreTiming('restore:androidPreRestoreSyncPurchases', androidSyncStartedAt);
      }
    }
    const sdkRestoreStartedAt = Date.now();
    const restoredCustomerInfo = await Purchases.restorePurchases();
    logRestoreTiming('restore:restorePurchases', sdkRestoreStartedAt, {
      hasActiveEntitlement: hasActiveEntitlement(restoredCustomerInfo as CustomerInfo | null),
    });
    const freshInfoStartedAt = Date.now();
    let refreshedCustomerInfo = await Purchases.getCustomerInfo() as CustomerInfo;
    logRestoreTiming('restore:freshGetCustomerInfo', freshInfoStartedAt, {
      hasActiveEntitlement: hasActiveEntitlement(refreshedCustomerInfo),
    });
    if (shouldAttemptAndroidSync(refreshedCustomerInfo)) {
      const androidSyncStartedAt = Date.now();
      refreshedCustomerInfo = await syncPurchasesIfAvailable(Purchases, 'android_after_restore_empty_customer_info') ?? refreshedCustomerInfo;
      logRestoreTiming('restore:androidPostRestoreSyncPurchases', androidSyncStartedAt, {
        hasActiveEntitlement: hasActiveEntitlement(refreshedCustomerInfo),
      });
    }
    const customerInfo = refreshedCustomerInfo ?? restoredCustomerInfo ?? null;
    logRestoreTiming('restore:complete', restoreStartedAt, {
      hasActiveEntitlement: hasActiveEntitlement(customerInfo),
    });
    return customerInfo;
  } catch (error) {
    throw new Error(getPurchaseErrorMessage(error));
  }
}

export function classifyRevenueCatAccessProblem(info: CustomerInfo | null): string | null {
  return getEmptyReceiptClassification(info);
}

export function hasActiveEntitlement(info: CustomerInfo | null): boolean {
  return hasActiveMembershipEntitlement(info);
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
