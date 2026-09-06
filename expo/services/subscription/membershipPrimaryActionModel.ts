import type { SubscriptionPeriod, SubscriptionPlanPeriod } from '@/types/subscription';
import type { RevenueCatAccessKind } from '@/services/subscription/purchasesService';
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
  | { kind: 'owned'; label: string; requiresPurchasablePlan: false }
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

export function getIosActivePeriodFromProductIdentifier(
  productIdentifier: string | null | undefined,
): SubscriptionPeriod | null {
  if (!productIdentifier) return null;
  if (productIdentifier === REVENUECAT_MONTHLY_PRODUCT_ID) return 'monthly';
  if (productIdentifier === REVENUECAT_YEARLY_PRODUCT_ID) return 'yearly';
  return null;
}

function getPlanDisplayName(period: SubscriptionPlanPeriod | null | undefined): string | null {
  if (period === 'lifetime') return 'Lifetime';
  if (period === 'yearly') return 'Yearly';
  if (period === 'monthly') return 'Monthly';
  return null;
}

export function getMembershipStatusCopy(params: {
  hasStoreAccess: boolean;
  isEntitlementActive: boolean;
  isTrialActive: boolean;
  currentPeriod: SubscriptionPlanPeriod | null;
  pendingTargetPeriod?: SubscriptionPeriod | null;
  pendingEffectiveDateLabel?: string | null;
  activeExpirationDateLabel?: string | null;
  activeWillRenew?: boolean | null;
  billingIssueDateLabel?: string | null;
  inactiveExpirationDateLabel?: string | null;
  trialDaysRemaining: number;
  shouldShowTrialCopy: boolean;
  trialLengthLabel?: string;
  isSubscriptionManagement?: boolean;
  isMembershipLoading?: boolean;
}): { title: string; body: string; heroTitle: string; plansTitle: string } {
  const currentPlanLabel = getPlanDisplayName(params.currentPeriod);
  const pendingTargetLabel = getPlanDisplayName(params.pendingTargetPeriod);
  const expirationDateText = params.activeExpirationDateLabel ?? null;
  const hasBillingIssue = Boolean(params.billingIssueDateLabel);
  const hasCancelledAutoRenew = params.activeWillRenew === false;
  const trialLengthLabel = params.trialLengthLabel ?? 'free';

  const heroTitle = params.hasStoreAccess
    || (params.isSubscriptionManagement && params.isMembershipLoading)
    ? 'Your Membership'
    : params.shouldShowTrialCopy
      ? `Start your ${trialLengthLabel} trial.`
      : 'Start your membership.';

  const plansTitle = params.hasStoreAccess || params.isSubscriptionManagement ? 'Manage your plan' : 'Choose your plan';

  if (params.isSubscriptionManagement && params.isMembershipLoading && !params.hasStoreAccess) {
    return {
      heroTitle,
      plansTitle,
      title: 'Checking membership status',
      body: 'Loading your current membership before showing plan changes.',
    };
  }

  if (params.hasStoreAccess && currentPlanLabel && pendingTargetLabel) {
    const effectiveDateText = params.pendingEffectiveDateLabel ?? expirationDateText ?? 'your renewal date';
    return {
      heroTitle,
      plansTitle,
      title: params.isTrialActive ? `${currentPlanLabel} trial active` : `${currentPlanLabel} membership active`,
      body: `Current plan: ${currentPlanLabel}. Current plan remains active until ${effectiveDateText}. Scheduled next plan: ${pendingTargetLabel}. Your ${pendingTargetLabel} membership will begin after your current ${currentPlanLabel} period ends on ${effectiveDateText}.`,
    };
  }

  if (params.hasStoreAccess && currentPlanLabel) {
    if (params.currentPeriod === 'lifetime') {
      return {
        heroTitle,
        plansTitle,
        title: 'Membership active',
        body: 'Current plan: Lifetime. You have lifetime access to all BPD Companion features. No recurring payments.',
      };
    }

    if (hasBillingIssue) {
      return {
        heroTitle,
        plansTitle,
        title: 'Billing issue',
        body: `Current plan: ${currentPlanLabel}. We detected a billing issue${params.billingIssueDateLabel ? ` on ${params.billingIssueDateLabel}` : ''}. Manage your store subscription to keep access active.`,
      };
    }

    if (hasCancelledAutoRenew) {
      return {
        heroTitle,
        plansTitle,
        title: `${currentPlanLabel} membership cancelled`,
        body: expirationDateText
          ? `Current plan: ${currentPlanLabel}. Access ends on ${expirationDateText}. You can manage billing or choose another plan anytime.`
          : `Current plan: ${currentPlanLabel}. Access remains active until the current paid period ends.`,
      };
    }

    return {
      heroTitle,
      plansTitle,
      title: params.isTrialActive ? `${currentPlanLabel} trial active` : `${currentPlanLabel} membership active`,
      body: params.isTrialActive
        ? expirationDateText
          ? `Current plan: ${currentPlanLabel}. Trial converts on ${expirationDateText}. Everything is unlocked during your store trial.`
          : `Current plan: ${currentPlanLabel}. ${params.trialDaysRemaining === 1 ? 'Trial ends in 1 day.' : `Trial ends in ${params.trialDaysRemaining} days.`} Everything is unlocked during your store trial.`
        : expirationDateText
          ? `Current plan: ${currentPlanLabel}. Renews on ${expirationDateText}. You have full access to every feature, including Companion, check-ins, tools, insights, and Community.`
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

  if (params.inactiveExpirationDateLabel) {
    return {
      heroTitle,
      plansTitle,
      title: 'Membership expired',
      body: `Your previous membership expired on ${params.inactiveExpirationDateLabel}. Start membership again for full access from day one.`,
    };
  }

  return {
    heroTitle,
    plansTitle,
    title: params.shouldShowTrialCopy ? `Start your ${trialLengthLabel} trial` : 'Start your membership',
    body: params.shouldShowTrialCopy
      ? `Start your ${trialLengthLabel} trial for full access from day one. Cancel anytime before the trial ends.`
      : 'Start membership for full access from day one. Cancel anytime.',
  };
}

export function getAndroidPlanChangeTimingMessage(params: {
  platform: 'ios' | 'android' | 'web' | string;
  hasStoreAccess: boolean;
  activePeriod: SubscriptionPeriod | null;
  selectedPeriod: SubscriptionPlanPeriod | null;
  effectiveDateLabel: string | null;
  pendingTargetPeriod?: SubscriptionPeriod | null;
}): string | null {
  if (params.platform !== 'android') return null;
  if (!params.hasStoreAccess) return null;
  if (!params.activePeriod || !params.selectedPeriod) return null;
  if (params.activePeriod === params.selectedPeriod) return null;
  if (params.pendingTargetPeriod === params.selectedPeriod) return null;

  const currentPlanLabel = getPlanDisplayName(params.activePeriod);
  const selectedPlanLabel = getPlanDisplayName(params.selectedPeriod);
  if (!currentPlanLabel || !selectedPlanLabel) return null;

  if (!params.effectiveDateLabel) {
    return `You’ll keep your ${currentPlanLabel} membership until your current billing period ends. Your ${selectedPlanLabel} membership will begin after that.`;
  }

  return `You’ll keep your ${currentPlanLabel} membership until ${params.effectiveDateLabel}. Your ${selectedPlanLabel} membership will begin after that.`;
}

export function getIosPlanChangeTimingMessage(params: {
  platform: 'ios' | 'android' | 'web' | string;
  hasStoreAccess: boolean;
  activePeriod: SubscriptionPeriod | null;
  selectedPeriod: SubscriptionPlanPeriod | null;
}): string | null {
  if (params.platform !== 'ios') return null;
  if (!params.hasStoreAccess) return null;
  if (!params.activePeriod || !params.selectedPeriod) return null;
  if (params.activePeriod === params.selectedPeriod) return null;

  if (params.activePeriod === 'monthly' && params.selectedPeriod === 'yearly') {
    return 'Your Yearly membership may begin immediately. Apple will show the exact charge and any applicable adjustment before you confirm.';
  }

  if (params.activePeriod === 'yearly' && params.selectedPeriod === 'monthly') {
    return 'Your Monthly membership is expected to begin after your current Yearly period ends. Apple will confirm the effective date before you confirm.';
  }

  return 'Apple will show when the new plan begins and any billing adjustment before you confirm.';
}

export function getInitialManageSelectedPlanId(params: {
  isSubscriptionManagement: boolean;
  hasAppliedInitialSelection: boolean;
  hasUserSelectedPlan: boolean;
  activePeriod: SubscriptionPlanPeriod | null;
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
  activePeriod: SubscriptionPlanPeriod | null;
  selectedPeriod: SubscriptionPlanPeriod | null;
  accessKind?: RevenueCatAccessKind;
  pendingTargetPeriod?: SubscriptionPeriod | null;
  canSubscribe: boolean;
  shouldShowTrialCopy: boolean;
  trialLengthLabel?: string;
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
    trialLengthLabel = 'free',
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

  if (hasStoreAccess && activePeriod === 'lifetime') {
    return {
      kind: 'owned',
      label: 'Lifetime Active',
      requiresPurchasablePlan: false,
    };
  }

  if (selectedPeriod === 'lifetime') {
    return { kind: 'loading', label: 'Loading membership options...', requiresPurchasablePlan: false };
  }

  if (
    hasStoreAccess &&
    (platform === 'android' || platform === 'ios') &&
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
      ? `Start your ${trialLengthLabel} trial ${selectedPriceLabel}`
      : `Start membership ${selectedPriceLabel}`,
    requiresPurchasablePlan: true,
  };
}
