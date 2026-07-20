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
  | { kind: 'scheduled'; label: string; requiresPurchasablePlan: false }
  | { kind: 'switch'; label: string; requiresPurchasablePlan: true }
  | { kind: 'purchase'; label: string; requiresPurchasablePlan: true }
  | { kind: 'loading'; label: string; requiresPurchasablePlan: false };

export function getMembershipManagementRoute(): {
  pathname: '/upgrade';
  params: { mode: 'manage' };
} {
  return {
    pathname: '/upgrade',
    params: { mode: 'manage' },
  };
}

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

function getPlanDisplayName(period: SubscriptionPeriod | null | undefined): string | null {
  if (period === 'yearly') return 'Yearly';
  if (period === 'monthly') return 'Monthly';
  return null;
}

export function getMembershipStatusCopy(params: {
  hasStoreAccess: boolean;
  isEntitlementActive: boolean;
  isTrialActive: boolean;
  currentPeriod: SubscriptionPeriod | null;
  pendingTargetPeriod?: SubscriptionPeriod | null;
  pendingEffectiveDateLabel?: string | null;
  trialDaysRemaining: number;
  shouldShowTrialCopy: boolean;
}): { title: string; body: string; heroTitle: string; plansTitle: string } {
  const currentPlanLabel = getPlanDisplayName(params.currentPeriod);
  const pendingTargetLabel = getPlanDisplayName(params.pendingTargetPeriod);

  const heroTitle = params.hasStoreAccess
    ? 'Your Membership'
    : params.shouldShowTrialCopy
      ? 'Start your 3-day free trial.'
      : 'Start your membership.';

  const plansTitle = params.hasStoreAccess ? 'Manage your plan' : 'Choose your plan';

  if (params.hasStoreAccess && currentPlanLabel && pendingTargetLabel) {
    return {
      heroTitle,
      plansTitle,
      title: params.isTrialActive ? `${currentPlanLabel} trial active` : `${currentPlanLabel} membership active`,
      body: `Current plan: ${currentPlanLabel}. Switching to ${pendingTargetLabel}${params.pendingEffectiveDateLabel ? ` on ${params.pendingEffectiveDateLabel}` : ' at renewal'}. Your current plan stays active until then.`,
    };
  }

  if (params.hasStoreAccess && currentPlanLabel) {
    return {
      heroTitle,
      plansTitle,
      title: params.isTrialActive ? `${currentPlanLabel} trial active` : `${currentPlanLabel} membership active`,
      body: params.isTrialActive
        ? `Current plan: ${currentPlanLabel}. ${params.trialDaysRemaining === 1 ? 'Trial ends in 1 day.' : `Trial ends in ${params.trialDaysRemaining} days.`} Everything is unlocked during your store trial.`
        : `Current plan: ${currentPlanLabel}. You have full access to every feature, including Companion, check-ins, tools, insights, and Community.`,
    };
  }

  if (params.isEntitlementActive) {
    return {
      heroTitle,
      plansTitle,
      title: 'Membership active',
      body: 'You have full access to every feature, including Companion, check-ins, tools, insights, and Community.',
    };
  }

  return {
    heroTitle,
    plansTitle,
    title: params.shouldShowTrialCopy ? 'Start your 3-day free trial' : 'Start your membership',
    body: params.shouldShowTrialCopy
      ? 'Start your 3-day free trial for full access from day one. Cancel anytime before the trial ends.'
      : 'Start membership for full access from day one. Cancel anytime.',
  };
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
  pendingTargetPeriod?: SubscriptionPeriod | null;
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
    pendingTargetPeriod = null,
    canSubscribe,
    shouldShowTrialCopy,
    selectedPriceLabel,
  } = params;

  if (isExpoGo) {
    return { kind: 'continue', label: 'Continue to app', requiresPurchasablePlan: false };
  }

  if (
    hasStoreAccess &&
    pendingTargetPeriod &&
    selectedPeriod === pendingTargetPeriod
  ) {
    return {
      kind: 'scheduled',
      label: `${pendingTargetPeriod === 'yearly' ? 'Yearly' : 'Monthly'} switch scheduled`,
      requiresPurchasablePlan: false,
    };
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
