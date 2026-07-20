import {
  getAndroidActivePeriodFromProductIdentifier,
  getInitialManageSelectedPlanId,
  getMembershipPrimaryAction,
} from '@/services/subscription/membershipPrimaryActionModel';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Membership primary action regression failed: ${message}`);
}

export function assertMembershipPrimaryActionRegressionScenarios(): true {
  assert(getAndroidActivePeriodFromProductIdentifier('bpd_monthly') === 'monthly', 'raw monthly product normalizes');
  assert(getAndroidActivePeriodFromProductIdentifier('bpd_monthly:monthly') === 'monthly', 'monthly base-plan product normalizes');
  assert(getAndroidActivePeriodFromProductIdentifier('bpd_yearly') === 'yearly', 'raw yearly product normalizes');
  assert(getAndroidActivePeriodFromProductIdentifier('bpd_yearly:annual') === 'yearly', 'yearly base-plan product normalizes');
  assert(getAndroidActivePeriodFromProductIdentifier('rc_promo_BPD Companion Pro_lifetime') === null, 'unknown active product is not guessed');

  assert(
    getMembershipPrimaryAction({
      isExpoGo: false,
      platform: 'android',
      hasStoreAccess: true,
      activePeriod: 'monthly',
      selectedPeriod: 'monthly',
      canSubscribe: true,
      shouldShowTrialCopy: false,
      selectedPriceLabel: '$9.99/mo',
    }).kind === 'manage',
    'active monthly with monthly selected manages existing subscription',
  );

  const monthlyToYearly = getMembershipPrimaryAction({
    isExpoGo: false,
    platform: 'android',
    hasStoreAccess: true,
    activePeriod: 'monthly',
    selectedPeriod: 'yearly',
    canSubscribe: true,
    shouldShowTrialCopy: false,
    selectedPriceLabel: '$59.99/yr',
  });
  assert(monthlyToYearly.kind === 'switch', 'active monthly with yearly selected switches plan');
  assert(monthlyToYearly.label === 'Switch to Yearly', 'monthly to yearly switch label');

  const yearlyToMonthly = getMembershipPrimaryAction({
    isExpoGo: false,
    platform: 'android',
    hasStoreAccess: true,
    activePeriod: 'yearly',
    selectedPeriod: 'monthly',
    canSubscribe: true,
    shouldShowTrialCopy: false,
    selectedPriceLabel: '$9.99/mo',
  });
  assert(yearlyToMonthly.kind === 'switch', 'active yearly with monthly selected switches plan');
  assert(yearlyToMonthly.label === 'Switch to Monthly', 'yearly to monthly switch label');

  const staleStatePlanMonthlyToYearly = getMembershipPrimaryAction({
    isExpoGo: false,
    platform: 'android',
    hasStoreAccess: true,
    activePeriod: getAndroidActivePeriodFromProductIdentifier('bpd_monthly:monthly'),
    selectedPeriod: 'yearly',
    canSubscribe: true,
    shouldShowTrialCopy: false,
    selectedPriceLabel: '$59.99/yr',
  });
  assert(staleStatePlanMonthlyToYearly.kind === 'switch', 'raw active product drives switch when state.plan is stale or missing');
  assert(staleStatePlanMonthlyToYearly.label === 'Switch to Yearly', 'raw active monthly to selected yearly label');

  assert(
    getMembershipPrimaryAction({
      isExpoGo: false,
      platform: 'ios',
      hasStoreAccess: true,
      activePeriod: 'monthly',
      selectedPeriod: 'yearly',
      canSubscribe: true,
      shouldShowTrialCopy: false,
      selectedPriceLabel: '$59.99/yr',
    }).kind === 'manage',
    'iOS active subscriber keeps existing management behavior',
  );

  const freshPurchase = getMembershipPrimaryAction({
    isExpoGo: false,
    platform: 'android',
    hasStoreAccess: false,
    activePeriod: null,
    selectedPeriod: 'monthly',
    canSubscribe: true,
    shouldShowTrialCopy: true,
    selectedPriceLabel: '$9.99/mo',
  });
  assert(freshPurchase.kind === 'purchase', 'fresh user uses purchase action');
  assert(freshPurchase.label.includes('3-day free trial'), 'fresh user trial label');

  assert(
    getMembershipPrimaryAction({
      isExpoGo: false,
      platform: 'android',
      hasStoreAccess: false,
      activePeriod: null,
      selectedPeriod: 'yearly',
      canSubscribe: false,
      shouldShowTrialCopy: false,
      selectedPriceLabel: '$59.99/yr',
    }).kind === 'loading',
    'purchase CTA remains loading without valid package',
  );

  assert(
    getInitialManageSelectedPlanId({
      isSubscriptionManagement: true,
      hasAppliedInitialSelection: false,
      hasUserSelectedPlan: false,
      activePeriod: 'monthly',
      availablePlanIds: ['monthly', 'yearly'],
      currentSelectedPlanId: 'yearly',
    }) === 'monthly',
    'manage mode initializes to active plan before user selection',
  );

  assert(
    getInitialManageSelectedPlanId({
      isSubscriptionManagement: true,
      hasAppliedInitialSelection: false,
      hasUserSelectedPlan: true,
      activePeriod: 'monthly',
      availablePlanIds: ['monthly', 'yearly'],
      currentSelectedPlanId: 'yearly',
    }) === 'yearly',
    'user-selected yearly is not reset by subscription refresh',
  );

  assert(
    getInitialManageSelectedPlanId({
      isSubscriptionManagement: true,
      hasAppliedInitialSelection: false,
      hasUserSelectedPlan: true,
      activePeriod: 'yearly',
      availablePlanIds: ['monthly', 'yearly'],
      currentSelectedPlanId: 'monthly',
    }) === 'monthly',
    'user-selected monthly is not reset by subscription refresh',
  );

  assert(
    getInitialManageSelectedPlanId({
      isSubscriptionManagement: true,
      hasAppliedInitialSelection: false,
      hasUserSelectedPlan: false,
      activePeriod: 'yearly',
      availablePlanIds: ['monthly', 'yearly'],
      currentSelectedPlanId: 'monthly',
    }) === 'yearly',
    'account or product change can reinitialize selected plan',
  );

  return true;
}

export const membershipPrimaryActionRegressionTestsPassed =
  assertMembershipPrimaryActionRegressionScenarios();
