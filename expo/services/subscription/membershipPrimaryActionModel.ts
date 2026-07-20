import type { SubscriptionPeriod } from '@/types/subscription';
import {
  REVENUECAT_ANDROID_MONTHLY_BASE_PLAN_ID,
  REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID,
  REVENUECAT_ANDROID_YEARLY_BASE_PLAN_ID,
  REVENUECAT_ANDROID_YEARLY_PRODUCT_ID,
  REVENUECAT_MONTHLY_PRODUCT_ID,
  REVENUECAT_YEARLY_PRODUCT_ID,
} from '@/constants/revenuecat';

export type MembershipPrimaryAction =
  | { kind: 'continue'; label: string; requiresPurchasablePlan: false }
  | { kind: 'manage'; label: string; requiresPurchasablePlan: false }
  | { kind: 'switch'; label: string; requiresPurchasablePlan: true }
  | { kind: 'purchase'; label: string; requiresPurchasablePlan: true }
  | { kind: 'loading'; label: string; requiresPurchasablePlan: false };

export function getAndroidActivePeriodFromProductIdentifier(
  productIdentifier: string | null | undefined,
): SubscriptionPeriod | null {
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

export function getInitialManageSelectedPlanId(params: {
  isSubscriptionManagement: boolean;
  hasAppliedInitialSelection: boolean;
  hasUserSelectedPlan: boolean;
  activePeriod: SubscriptionPeriod | null;
  availablePlanIds: string[];
  currentSelectedPlanId: string;
}): string {
  const {
    isSubscriptionManagement,
    hasAppliedInitialSelection,
    hasUserSelectedPlan,
    activePeriod,
    availablePlanIds,
    currentSelectedPlanId,
  } = params;

  if (!isSubscriptionManagement || hasAppliedInitialSelection || hasUserSelectedPlan) {
    return currentSelectedPlanId;
  }

  if (!activePeriod || !availablePlanIds.includes(activePeriod)) {
    return currentSelectedPlanId;
  }

  return activePeriod;
}

export function getMembershipPrimaryAction(params: {
  isExpoGo: boolean;
  platform: 'ios' | 'android' | 'web' | string;
  hasStoreAccess: boolean;
  activePeriod: SubscriptionPeriod | null;
  selectedPeriod: SubscriptionPeriod | null;
  canSubscribe: boolean;
  shouldShowTrialCopy: boolean;
  selectedPriceLabel: string;
}): MembershipPrimaryAction {
  const {
    isExpoGo,
    platform,
    hasStoreAccess,
    activePeriod,
    selectedPeriod,
    canSubscribe,
    shouldShowTrialCopy,
    selectedPriceLabel,
  } = params;

  if (isExpoGo) {
    return { kind: 'continue', label: 'Continue to app', requiresPurchasablePlan: false };
  }

  if (
    hasStoreAccess &&
    platform === 'android' &&
    activePeriod &&
    selectedPeriod &&
    activePeriod !== selectedPeriod
  ) {
    return {
      kind: 'switch',
      label: selectedPeriod === 'yearly' ? 'Switch to Yearly' : 'Switch to Monthly',
      requiresPurchasablePlan: true,
    };
  }

  if (hasStoreAccess) {
    return { kind: 'manage', label: 'Manage existing subscription', requiresPurchasablePlan: false };
  }

  if (!canSubscribe) {
    return { kind: 'loading', label: 'Loading membership options...', requiresPurchasablePlan: false };
  }

  return {
    kind: 'purchase',
    label: shouldShowTrialCopy
      ? `Start your 3-day free trial ${selectedPriceLabel}`
      : `Start membership ${selectedPriceLabel}`,
    requiresPurchasablePlan: true,
  };
}
