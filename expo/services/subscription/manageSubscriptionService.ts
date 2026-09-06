import type { PlatformOSType } from 'react-native';

import {
  REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID,
  REVENUECAT_ANDROID_YEARLY_PRODUCT_ID,
  REVENUECAT_MONTHLY_PRODUCT_ID,
  REVENUECAT_YEARLY_PRODUCT_ID,
} from '@/constants/revenuecat';

export const BPD_ANDROID_PACKAGE_NAME = 'com.maximebellemare.bpdcompanion';
export const GOOGLE_PLAY_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions';
export const IOS_SUBSCRIPTIONS_APP_URL = 'itms-apps://apps.apple.com/account/subscriptions';
export const IOS_SUBSCRIPTIONS_WEB_URL = 'https://apps.apple.com/account/subscriptions';
export const IOS_BILLING_MANAGEMENT_URL = 'https://apps.apple.com/account/billing';

type ExternalLinking = {
  canOpenURL: (url: string) => Promise<boolean>;
  openURL: (url: string) => Promise<unknown>;
};

type CustomerCenterPresenter = {
  presentCustomerCenter?: () => Promise<void>;
};

export type SubscriptionManagementOpenResult =
  | { opened: true; url: string }
  | { opened: false; url: string; error: string };

export type CustomerCenterOpenResult =
  | { opened: true; source: 'customer_center' }
  | { opened: true; source: 'store'; url: string }
  | { opened: false; source: 'store'; url: string; error: string };

export type SingleFlightResult<T> =
  | { started: true; result: T }
  | { started: false };

type CustomerCenterFlowLogger = (event: string, metadata?: Record<string, unknown>) => void;

export function createSingleFlightRunner() {
  let inFlight = false;

  return async function runSingleFlight<T>(task: () => Promise<T>): Promise<SingleFlightResult<T>> {
    if (inFlight) {
      return { started: false };
    }
    inFlight = true;
    try {
      return { started: true, result: await task() };
    } finally {
      inFlight = false;
    }
  };
}

export function normalizeAndroidSubscriptionSku(productIdentifier: string | null | undefined): string | null {
  if (!productIdentifier) return null;
  if (
    productIdentifier === REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID ||
    productIdentifier === REVENUECAT_MONTHLY_PRODUCT_ID ||
    productIdentifier.startsWith(`${REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID}:`)
  ) {
    return REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID;
  }
  if (
    productIdentifier === REVENUECAT_ANDROID_YEARLY_PRODUCT_ID ||
    productIdentifier === REVENUECAT_YEARLY_PRODUCT_ID ||
    productIdentifier.startsWith(`${REVENUECAT_ANDROID_YEARLY_PRODUCT_ID}:`)
  ) {
    return REVENUECAT_ANDROID_YEARLY_PRODUCT_ID;
  }
  return null;
}

export function getSubscriptionManagementUrl(
  platform: PlatformOSType | string,
  activeProductIdentifier?: string | null,
  managementUrl?: string | null,
): string {
  const revenueCatManagementUrl = managementUrl?.trim();
  if (revenueCatManagementUrl) {
    return revenueCatManagementUrl;
  }

  if (platform === 'android') {
    const sku = normalizeAndroidSubscriptionSku(activeProductIdentifier);
    if (!sku) return GOOGLE_PLAY_SUBSCRIPTIONS_URL;
    return `${GOOGLE_PLAY_SUBSCRIPTIONS_URL}?sku=${encodeURIComponent(sku)}&package=${encodeURIComponent(BPD_ANDROID_PACKAGE_NAME)}`;
  }

  return platform === 'ios' ? IOS_SUBSCRIPTIONS_APP_URL : GOOGLE_PLAY_SUBSCRIPTIONS_URL;
}

export function getBillingPaymentManagementUrl(
  platform: PlatformOSType | string,
  activeProductIdentifier?: string | null,
  managementUrl?: string | null,
): string {
  const revenueCatManagementUrl = managementUrl?.trim();
  if (revenueCatManagementUrl) {
    return revenueCatManagementUrl;
  }
  if (platform === 'ios') return IOS_BILLING_MANAGEMENT_URL;
  return getSubscriptionManagementUrl(platform, activeProductIdentifier, managementUrl);
}

export async function openSubscriptionManagement(
  platform: PlatformOSType | string,
  linking: ExternalLinking,
  activeProductIdentifier?: string | null,
  managementUrl?: string | null,
): Promise<SubscriptionManagementOpenResult> {
  const primaryUrl = getSubscriptionManagementUrl(platform, activeProductIdentifier, managementUrl);
  const fallbackUrl = platform === 'ios' ? IOS_SUBSCRIPTIONS_WEB_URL : GOOGLE_PLAY_SUBSCRIPTIONS_URL;
  const urlsToTry = primaryUrl === fallbackUrl ? [primaryUrl] : [primaryUrl, fallbackUrl];
  let lastError = 'Could not open subscription management.';

  for (const url of urlsToTry) {
    try {
      const canOpen = await linking.canOpenURL(url).catch(() => true);
      if (!canOpen) {
        lastError = 'Subscription management is not available on this device.';
        continue;
      }
      await linking.openURL(url);
      return { opened: true, url };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Could not open subscription management.';
    }
  }

  return { opened: false, url: primaryUrl, error: lastError };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'RevenueCat Customer Center could not be presented.';
}

function isDevRuntime(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

async function loadRevenueCatCustomerCenter(): Promise<CustomerCenterPresenter> {
  const module = await import('react-native-purchases-ui');
  return (module.default ?? module) as CustomerCenterPresenter;
}

export async function presentRevenueCatCustomerCenter(
  customerCenter?: CustomerCenterPresenter,
): Promise<{ presented: true } | { presented: false; error: string }> {
  try {
    const presenter = customerCenter ?? await loadRevenueCatCustomerCenter();
    if (typeof presenter.presentCustomerCenter !== 'function') {
      throw new Error('RevenueCat Customer Center is unavailable.');
    }
    await presenter.presentCustomerCenter();
    if (isDevRuntime()) {
      console.log('[RevenueCatCustomerCenter] Customer Center presented/dismissed.');
    }
    return { presented: true };
  } catch (error) {
    const message = getErrorMessage(error);
    console.warn('[RevenueCatCustomerCenter] Failed to present Customer Center; falling back to store subscription management.', {
      message,
    });
    return { presented: false, error: message };
  }
}

export async function openCustomerCenterAfterModalDismiss(params: {
  dismissModal: () => void;
  openAfterDismiss: () => Promise<CustomerCenterOpenResult>;
  wait?: (ms: number) => Promise<void>;
  transitionDelayMs?: number;
  onLog?: CustomerCenterFlowLogger;
}): Promise<CustomerCenterOpenResult> {
  const wait = params.wait ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  const transitionDelayMs = params.transitionDelayMs ?? 450;
  params.onLog?.('manage_cta_tapped');
  params.onLog?.('upgrade_modal_dismissal_initiated');
  params.dismissModal();
  await wait(transitionDelayMs);
  params.onLog?.('upgrade_modal_dismissal_completed', { transitionDelayMs });
  params.onLog?.('customer_center_presentation_attempted');
  try {
    const result = await params.openAfterDismiss();
    params.onLog?.(
      result.source === 'customer_center' ? 'customer_center_presented_or_dismissed' : 'store_fallback_result',
      result,
    );
    return result;
  } catch (error) {
    params.onLog?.('customer_center_presentation_error', {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function openCustomerCenterOrSubscriptionManagement(
  platform: PlatformOSType | string,
  linking: ExternalLinking,
  activeProductIdentifier?: string | null,
  managementUrl?: string | null,
  customerCenter?: CustomerCenterPresenter,
): Promise<CustomerCenterOpenResult> {
  const customerCenterResult = await presentRevenueCatCustomerCenter(customerCenter);
  if (customerCenterResult.presented) {
    return { opened: true, source: 'customer_center' };
  }

  if (isDevRuntime()) {
    console.log('[RevenueCatCustomerCenter] Trying store subscription-management fallback.', {
      platform,
      hasActiveProductIdentifier: !!activeProductIdentifier,
      hasManagementUrl: !!managementUrl,
    });
  }

  const storeResult = await openSubscriptionManagement(
    platform,
    linking,
    activeProductIdentifier,
    managementUrl,
  );
  if (!storeResult.opened) {
    console.warn('[RevenueCatCustomerCenter] Store subscription-management fallback failed.', {
      platform,
      url: storeResult.url,
      error: storeResult.error,
    });
  } else if (isDevRuntime()) {
    console.log('[RevenueCatCustomerCenter] Store subscription-management fallback opened.', {
      platform,
      url: storeResult.url,
    });
  }

  return { ...storeResult, source: 'store' };
}

export async function openBillingPaymentManagement(
  platform: PlatformOSType | string,
  linking: ExternalLinking,
  activeProductIdentifier?: string | null,
  managementUrl?: string | null,
): Promise<SubscriptionManagementOpenResult> {
  const primaryUrl = getBillingPaymentManagementUrl(platform, activeProductIdentifier, managementUrl);
  const fallbackUrl = platform === 'ios' ? IOS_BILLING_MANAGEMENT_URL : GOOGLE_PLAY_SUBSCRIPTIONS_URL;
  const urlsToTry = primaryUrl === fallbackUrl ? [primaryUrl] : [primaryUrl, fallbackUrl];
  let lastError = 'Could not open billing management.';

  for (const url of urlsToTry) {
    try {
      const canOpen = await linking.canOpenURL(url).catch(() => true);
      if (!canOpen) {
        lastError = 'Billing management is not available on this device.';
        continue;
      }
      await linking.openURL(url);
      return { opened: true, url };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Could not open billing management.';
    }
  }

  return { opened: false, url: primaryUrl, error: lastError };
}
