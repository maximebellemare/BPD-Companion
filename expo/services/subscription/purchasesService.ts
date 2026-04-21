import { Platform } from 'react-native';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from '@revenuecat/purchases-capacitor';

export const PREMIUM_ENTITLEMENT_ID = 'BPD Companion Pro';
export const DEFAULT_OFFERING_ID = 'default';

let configured = false;
let configurePromise: Promise<void> | null = null;

function getRCToken(): string | undefined {
  if (__DEV__ || Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

export async function configurePurchases(appUserId?: string): Promise<void> {
  if (configured) return;
  if (configurePromise) return configurePromise;

  configurePromise = (async () => {
    try {
      const apiKey = getRCToken();
      if (!apiKey) {
        console.log('[Purchases] No API key found for platform:', Platform.OS);
        return;
      }
      try {
        await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
      } catch (e) {
        console.log('[Purchases] setLogLevel not available', e);
      }
      await Purchases.configure({ apiKey, appUserID: appUserId ?? null });
      configured = true;
      console.log('[Purchases] Configured for', Platform.OS);
    } catch (error) {
      console.log('[Purchases] configure error:', error);
      configurePromise = null;
    }
  })();

  return configurePromise;
}

export async function ensureConfigured(): Promise<void> {
  if (!configured) {
    await configurePurchases();
  }
}

export async function fetchOfferings(): Promise<PurchasesOffering | null> {
  await ensureConfigured();
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current ?? offerings.all[DEFAULT_OFFERING_ID] ?? null;
    console.log('[Purchases] fetched offerings, current:', current?.identifier);
    return current;
  } catch (error) {
    console.log('[Purchases] getOfferings error:', error);
    return null;
  }
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  await ensureConfigured();
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.log('[Purchases] getCustomerInfo error:', error);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  await ensureConfigured();
  const result = await Purchases.purchasePackage({ aPackage: pkg });
  console.log('[Purchases] purchase success:', pkg.identifier);
  return result.customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  await ensureConfigured();
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    console.log('[Purchases] restore success');
    return customerInfo;
  } catch (error) {
    console.log('[Purchases] restorePurchases error:', error);
    throw error;
  }
}

export function hasActiveEntitlement(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return !!info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
}

export function getActiveExpiration(info: CustomerInfo | null): number | null {
  if (!info) return null;
  const ent = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  if (!ent) return null;
  return ent.expirationDate ? new Date(ent.expirationDate).getTime() : null;
}

export function getActivePeriodType(info: CustomerInfo | null): 'monthly' | 'yearly' | null {
  if (!info) return null;
  const ent = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  if (!ent) return null;
  const id = ent.productIdentifier?.toLowerCase() ?? '';
  if (id.includes('year') || id.includes('annual')) return 'yearly';
  if (id.includes('month')) return 'monthly';
  return null;
}

export function isTrialActive(info: CustomerInfo | null): boolean {
  if (!info) return false;
  const ent = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  return ent?.periodType === 'TRIAL';
}
