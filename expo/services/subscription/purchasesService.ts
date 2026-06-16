import { Platform } from 'react-native';
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

let configured = false;
let configurePromise: Promise<void> | null = null;

function getRCToken(): string | undefined {
  if (Platform.OS === 'web') {
    return process.env[REVENUECAT_TEST_API_KEY_ENV];
  }
  return Platform.select({
    ios: process.env[REVENUECAT_IOS_API_KEY_ENV],
    android: process.env[REVENUECAT_ANDROID_API_KEY_ENV],
    default: process.env[REVENUECAT_TEST_API_KEY_ENV],
  });
}

export async function configurePurchases(appUserId?: string): Promise<void> {
  if (configured) return;
  if (configurePromise) return configurePromise;

  configurePromise = (async () => {
    try {
      const apiKey = getRCToken();
      if (!apiKey || Platform.OS === 'web') {
        console.log('[Purchases] No API key found for platform:', Platform.OS);
        return;
      }
      const Purchases = (await import('react-native-purchases')).default;
      Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
      Purchases.configure({ apiKey, appUserID: appUserId ?? null });
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
  if (Platform.OS === 'web') return null;
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

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  await ensureConfigured();
  if (Platform.OS === 'web') return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.log('[Purchases] getCustomerInfo error:', error);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  await ensureConfigured();
  if (Platform.OS === 'web') return null;
  const Purchases = (await import('react-native-purchases')).default;
  const result = await Purchases.purchasePackage(pkg as never);
  console.log('[Purchases] purchase success:', pkg.identifier);
  return result.customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  await ensureConfigured();
  if (Platform.OS === 'web') return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const customerInfo = await Purchases.restorePurchases();
    console.log('[Purchases] restore success');
    return customerInfo;
  } catch (error) {
    console.log('[Purchases] restorePurchases error:', error);
    throw error;
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
