import {
  REVENUECAT_ANDROID_MONTHLY_BASE_PLAN_ID,
  REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID,
  REVENUECAT_ANDROID_YEARLY_BASE_PLAN_ID,
  REVENUECAT_ANDROID_YEARLY_PRODUCT_ID,
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_MONTHLY_PRODUCT_ID,
  REVENUECAT_YEARLY_PRODUCT_ID,
} from '@/constants/revenuecat';
import type { SubscriptionPeriod } from '@/types/subscription';

const INACTIVE_BILLING_ISSUE_LOOKBACK_MS = 60 * 24 * 60 * 60 * 1000;
const BILLING_RECOVERY_STORES = new Set(['PLAY_STORE', 'APP_STORE']);

export type BillingIssueRecoveryStore = 'PLAY_STORE' | 'APP_STORE';

type RevenueCatEntitlementRecord = {
  expirationDate?: string | null;
  isActive?: boolean;
  productIdentifier?: string;
  productPlanIdentifier?: string | null;
  store?: string | null;
  billingIssueDetectedAt?: string | null;
  billingIssueDetectedAtMillis?: number | null;
  unsubscribeDetectedAt?: string | null;
};

type RevenueCatSubscriptionRecord = {
  productIdentifier?: string;
  expiresDate?: string | null;
  store?: string | null;
  billingIssuesDetectedAt?: string | null;
  gracePeriodExpiresDate?: string | null;
  isActive?: boolean;
};

export type BillingIssueRecoveryCustomerInfo = {
  managementURL?: string | null;
  requestDate?: string | null;
  entitlements?: {
    all?: Record<string, RevenueCatEntitlementRecord>;
    active?: Record<string, RevenueCatEntitlementRecord>;
  };
  subscriptionsByProductIdentifier?: Record<string, RevenueCatSubscriptionRecord>;
};

export type BillingIssueRecoveryState =
  | {
      kind: 'active_grace';
      detectedAt: number;
      expirationAt: number | null;
      productIdentifier: string | null;
      productPeriod: SubscriptionPeriod | null;
      store: string | null;
      managementUrl: string | null;
    }
  | {
      kind: 'inactive_billing_issue';
      detectedAt: number;
      expirationAt: number;
      productIdentifier: string;
      productPeriod: SubscriptionPeriod | null;
      store: BillingIssueRecoveryStore;
      managementUrl: string | null;
    };

function parseTimestamp(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getBillingIssueTimestamp(
  entitlement?: RevenueCatEntitlementRecord | null,
  subscription?: RevenueCatSubscriptionRecord | null,
): number | null {
  return parseTimestamp(entitlement?.billingIssueDetectedAtMillis) ??
    parseTimestamp(entitlement?.billingIssueDetectedAt) ??
    parseTimestamp(subscription?.billingIssuesDetectedAt);
}

function getActiveGracePeriodTimestamp(
  entitlement: RevenueCatEntitlementRecord,
  subscription: RevenueCatSubscriptionRecord | null,
): number | null {
  const billingIssueTimestamp = getBillingIssueTimestamp(entitlement, subscription);
  if (billingIssueTimestamp) return billingIssueTimestamp;

  if (!subscription) return null;
  const subscriptionProductIdentifier = subscription.productIdentifier ?? entitlement.productIdentifier;
  const hasConfiguredBpdSubscription = !!getBpdSubscriptionPeriodFromProductIdentifier(subscriptionProductIdentifier);
  if (
    !hasConfiguredBpdSubscription ||
    subscription.store !== 'PLAY_STORE' ||
    !subscription.gracePeriodExpiresDate ||
    (subscription.isActive !== true && entitlement.isActive !== true)
  ) {
    return null;
  }
  return parseTimestamp(subscription.gracePeriodExpiresDate);
}

export function getBpdSubscriptionPeriodFromProductIdentifier(
  productIdentifier: string | null | undefined,
): SubscriptionPeriod | null {
  if (!productIdentifier) return null;
  if (
    productIdentifier === REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID ||
    productIdentifier === REVENUECAT_MONTHLY_PRODUCT_ID ||
    productIdentifier === `${REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID}:${REVENUECAT_ANDROID_MONTHLY_BASE_PLAN_ID}`
  ) {
    return 'monthly';
  }
  if (
    productIdentifier === REVENUECAT_ANDROID_YEARLY_PRODUCT_ID ||
    productIdentifier === REVENUECAT_YEARLY_PRODUCT_ID ||
    productIdentifier === `${REVENUECAT_ANDROID_YEARLY_PRODUCT_ID}:${REVENUECAT_ANDROID_YEARLY_BASE_PLAN_ID}`
  ) {
    return 'yearly';
  }
  return null;
}

function getMatchingSubscription(
  info: BillingIssueRecoveryCustomerInfo | null,
  productIdentifier: string | null | undefined,
): RevenueCatSubscriptionRecord | null {
  if (!info?.subscriptionsByProductIdentifier || !productIdentifier) return null;
  const direct = info.subscriptionsByProductIdentifier[productIdentifier];
  if (direct) return direct;
  const productPeriod = getBpdSubscriptionPeriodFromProductIdentifier(productIdentifier);
  return Object.entries(info.subscriptionsByProductIdentifier)
    .find(([key, subscription]) => {
      if (key === productIdentifier || subscription.productIdentifier === productIdentifier) return true;
      if (!productPeriod) return false;
      return getBpdSubscriptionPeriodFromProductIdentifier(subscription.productIdentifier ?? key) === productPeriod;
    })?.[1] ?? null;
}

function getBpdSubscriptionEntries(info: BillingIssueRecoveryCustomerInfo | null): RevenueCatSubscriptionRecord[] {
  if (!info?.subscriptionsByProductIdentifier) return [];
  return Object.entries(info.subscriptionsByProductIdentifier)
    .map(([key, subscription]) => ({
      ...subscription,
      productIdentifier: subscription.productIdentifier ?? key,
    }))
    .filter(subscription => !!getBpdSubscriptionPeriodFromProductIdentifier(subscription.productIdentifier));
}

function isRecentInactiveExpiration(expirationAt: number | null, now: number): expirationAt is number {
  if (!expirationAt) return false;
  if (expirationAt > now) return false;
  return now - expirationAt <= INACTIVE_BILLING_ISSUE_LOOKBACK_MS;
}

function isBillingRecoveryStore(store: string | null | undefined): store is BillingIssueRecoveryStore {
  return !!store && BILLING_RECOVERY_STORES.has(store);
}

export function getBillingIssueRecoveryState(
  info: BillingIssueRecoveryCustomerInfo | null,
  now: number = Date.now(),
): BillingIssueRecoveryState | null {
  const activeEntitlement = info?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID] ?? null;
  if (activeEntitlement?.isActive) {
    const subscription = getMatchingSubscription(info, activeEntitlement.productIdentifier);
    const detectedAt = getActiveGracePeriodTimestamp(activeEntitlement, subscription);
    if (!detectedAt) return null;
    return {
      kind: 'active_grace',
      detectedAt,
      expirationAt: parseTimestamp(activeEntitlement.expirationDate ?? subscription?.expiresDate),
      productIdentifier: activeEntitlement.productIdentifier ?? subscription?.productIdentifier ?? null,
      productPeriod: getBpdSubscriptionPeriodFromProductIdentifier(activeEntitlement.productIdentifier ?? subscription?.productIdentifier),
      store: activeEntitlement.store ?? subscription?.store ?? null,
      managementUrl: info?.managementURL?.trim() || null,
    };
  }

  const inactiveEntitlement = info?.entitlements?.all?.[REVENUECAT_ENTITLEMENT_ID] ?? null;
  const inactiveEntitlementSubscription = getMatchingSubscription(info, inactiveEntitlement?.productIdentifier);
  const entitlementDetectedAt = getBillingIssueTimestamp(inactiveEntitlement, inactiveEntitlementSubscription);
  const entitlementExpirationAt = parseTimestamp(inactiveEntitlement?.expirationDate ?? inactiveEntitlementSubscription?.expiresDate);
  const entitlementProductIdentifier = inactiveEntitlement?.productIdentifier ?? inactiveEntitlementSubscription?.productIdentifier ?? null;
  const entitlementStore = inactiveEntitlement?.store ?? inactiveEntitlementSubscription?.store ?? null;

  if (
    inactiveEntitlement &&
    inactiveEntitlement.isActive !== true &&
    entitlementDetectedAt &&
    entitlementProductIdentifier &&
    getBpdSubscriptionPeriodFromProductIdentifier(entitlementProductIdentifier) &&
    isBillingRecoveryStore(entitlementStore) &&
    isRecentInactiveExpiration(entitlementExpirationAt, now)
  ) {
    return {
      kind: 'inactive_billing_issue',
      detectedAt: entitlementDetectedAt,
      expirationAt: entitlementExpirationAt,
      productIdentifier: entitlementProductIdentifier,
      productPeriod: getBpdSubscriptionPeriodFromProductIdentifier(entitlementProductIdentifier),
      store: entitlementStore,
      managementUrl: info?.managementURL?.trim() || null,
    };
  }

  const inactiveBillingSubscription = getBpdSubscriptionEntries(info)
    .find((subscription) => {
      if (!isBillingRecoveryStore(subscription.store)) return false;
      if (subscription.isActive === true) return false;
      if (!subscription.billingIssuesDetectedAt) return false;
      return isRecentInactiveExpiration(parseTimestamp(subscription.expiresDate), now);
    });

  if (!inactiveBillingSubscription?.productIdentifier || !isBillingRecoveryStore(inactiveBillingSubscription.store)) return null;
  return {
    kind: 'inactive_billing_issue',
    detectedAt: parseTimestamp(inactiveBillingSubscription.billingIssuesDetectedAt) ?? now,
    expirationAt: parseTimestamp(inactiveBillingSubscription.expiresDate) ?? now,
    productIdentifier: inactiveBillingSubscription.productIdentifier,
    productPeriod: getBpdSubscriptionPeriodFromProductIdentifier(inactiveBillingSubscription.productIdentifier),
    store: inactiveBillingSubscription.store,
    managementUrl: info?.managementURL?.trim() || null,
  };
}

export function getBillingIssueAnalyticsMetadata(
  state: BillingIssueRecoveryState,
): Record<string, string> {
  return {
    platform_store: state.store ?? 'unknown',
    product_period: state.productPeriod ?? 'unknown',
    recovery_state: state.kind,
  };
}
