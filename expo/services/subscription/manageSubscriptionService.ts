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

type ExternalLinking = {
  canOpenURL: (url: string) => Promise<boolean>;
  openURL: (url: string) => Promise<unknown>;
};

export type SubscriptionManagementOpenResult =
  | { opened: true; url: string }
  | { opened: false; url: string; error: string };

export type SingleFlightResult<T> =
  | { started: true; result: T }
  | { started: false };

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
): string {
  if (platform === 'android') {
    const sku = normalizeAndroidSubscriptionSku(activeProductIdentifier);
    if (!sku) return GOOGLE_PLAY_SUBSCRIPTIONS_URL;
    return `${GOOGLE_PLAY_SUBSCRIPTIONS_URL}?sku=${encodeURIComponent(sku)}&package=${encodeURIComponent(BPD_ANDROID_PACKAGE_NAME)}`;
  }

  return platform === 'ios' ? IOS_SUBSCRIPTIONS_APP_URL : GOOGLE_PLAY_SUBSCRIPTIONS_URL;
}

export async function openSubscriptionManagement(
  platform: PlatformOSType | string,
  linking: ExternalLinking,
  activeProductIdentifier?: string | null,
): Promise<SubscriptionManagementOpenResult> {
  const primaryUrl = getSubscriptionManagementUrl(platform, activeProductIdentifier);
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
