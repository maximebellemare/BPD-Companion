import {
  getAndroidActivePeriodFromProductIdentifier,
  getInitialManageSelectedPlanId,
  getMembershipManagementRoute,
  getMembershipPrimaryAction,
  getMembershipStatusCopy,
} from '@/services/subscription/membershipPrimaryActionModel';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Membership primary action regression failed: ${message}`);
}

export function assertMembershipPrimaryActionRegressionScenarios(): true {
  const managementRoute = getMembershipManagementRoute();
  assert(managementRoute.pathname === '/upgrade', 'Profile membership opens upgrade screen');
  assert(managementRoute.params.mode === 'manage', 'Profile membership opens manage mode');

  assert(getAndroidActivePeriodFromProductIdentifier('bpd_monthly') === 'monthly', 'raw monthly product normalizes');
  assert(getAndroidActivePeriodFromProductIdentifier('bpd_monthly:monthly') === 'monthly', 'monthly base-plan product normalizes');
  assert(getAndroidActivePeriodFromProductIdentifier('bpd_yearly') === 'yearly', 'raw yearly product normalizes');
  assert(getAndroidActivePeriodFromProductIdentifier('bpd_yearly:annual') === 'yearly', 'yearly base-plan product normalizes');
  assert(getAndroidActivePeriodFromProductIdentifier('rc_promo_BPD Companion Pro_lifetime') === null, 'unknown active product is not guessed');

  const freshStatus = getMembershipStatusCopy({
    hasStoreAccess: false,
    isEntitlementActive: false,
    isTrialActive: false,
    currentPeriod: null,
    trialDaysRemaining: 0,
    shouldShowTrialCopy: false,
  });
  assert(freshStatus.heroTitle === 'Start your membership.', 'fresh user sees start membership header');
  assert(freshStatus.plansTitle === 'Choose your plan', 'fresh user sees choose plan title');

  const activeMonthlyStatus = getMembershipStatusCopy({
    hasStoreAccess: true,
    isEntitlementActive: true,
    isTrialActive: false,
    currentPeriod: 'monthly',
    trialDaysRemaining: 0,
    shouldShowTrialCopy: false,
  });
  assert(activeMonthlyStatus.heroTitle === 'Your Membership', 'active subscriber sees membership header');
  assert(activeMonthlyStatus.title === 'Monthly membership active', 'active monthly status identifies current plan');
  assert(activeMonthlyStatus.body.includes('Current plan: Monthly'), 'active monthly body names current plan');

  const activeYearlyStatus = getMembershipStatusCopy({
    hasStoreAccess: true,
    isEntitlementActive: true,
    isTrialActive: false,
    currentPeriod: 'yearly',
    trialDaysRemaining: 0,
    shouldShowTrialCopy: false,
  });
  assert(activeYearlyStatus.title === 'Yearly membership active', 'active yearly status identifies current plan');

  const monthlyTrialStatus = getMembershipStatusCopy({
    hasStoreAccess: true,
    isEntitlementActive: true,
    isTrialActive: true,
    currentPeriod: 'monthly',
    trialDaysRemaining: 1,
    shouldShowTrialCopy: false,
  });
  assert(monthlyTrialStatus.title === 'Monthly trial active', 'monthly trial active status');
  assert(monthlyTrialStatus.body.includes('Trial ends in 1 day'), 'monthly trial remaining time');

  const yearlyTrialStatus = getMembershipStatusCopy({
    hasStoreAccess: true,
    isEntitlementActive: true,
    isTrialActive: true,
    currentPeriod: 'yearly',
    trialDaysRemaining: 2,
    shouldShowTrialCopy: false,
  });
  assert(yearlyTrialStatus.title === 'Yearly trial active', 'yearly trial active status');

  const pendingMonthlyStatus = getMembershipStatusCopy({
    hasStoreAccess: true,
    isEntitlementActive: true,
    isTrialActive: false,
    currentPeriod: 'yearly',
    pendingTargetPeriod: 'monthly',
    pendingEffectiveDateLabel: 'Jul 21, 2026',
    trialDaysRemaining: 0,
    shouldShowTrialCopy: false,
  });
  assert(pendingMonthlyStatus.body.includes('Current plan: Yearly'), 'pending monthly keeps yearly as current plan');
  assert(pendingMonthlyStatus.body.includes('Switching to Monthly on Jul 21, 2026'), 'pending monthly scheduled copy');

  const pendingYearlyStatus = getMembershipStatusCopy({
    hasStoreAccess: true,
    isEntitlementActive: true,
    isTrialActive: false,
    currentPeriod: 'monthly',
    pendingTargetPeriod: 'yearly',
    trialDaysRemaining: 0,
    shouldShowTrialCopy: false,
  });
  assert(pendingYearlyStatus.body.includes('Switching to Yearly at renewal'), 'pending yearly scheduled copy');

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

  const yearlyToMonthlyScheduled = getMembershipPrimaryAction({
    isExpoGo: false,
    platform: 'android',
    hasStoreAccess: true,
    activePeriod: 'yearly',
    selectedPeriod: 'monthly',
    pendingTargetPeriod: 'monthly',
    canSubscribe: true,
    shouldShowTrialCopy: false,
    selectedPriceLabel: '$9.99/mo',
  });
  assert(yearlyToMonthlyScheduled.kind === 'scheduled', 'scheduled target does not show Switch again');
  assert(yearlyToMonthlyScheduled.label === 'Monthly switch scheduled', 'scheduled monthly label');

  const monthlyToYearlyScheduled = getMembershipPrimaryAction({
    isExpoGo: false,
    platform: 'android',
    hasStoreAccess: true,
    activePeriod: 'monthly',
    selectedPeriod: 'yearly',
    pendingTargetPeriod: 'yearly',
    canSubscribe: true,
    shouldShowTrialCopy: false,
    selectedPriceLabel: '$59.99/yr',
  });
  assert(monthlyToYearlyScheduled.kind === 'scheduled', 'monthly active + yearly scheduled has scheduled action');
  assert(monthlyToYearlyScheduled.label === 'Yearly switch scheduled', 'scheduled yearly label');

  assert(
    getMembershipPrimaryAction({
      isExpoGo: false,
      platform: 'android',
      hasStoreAccess: true,
      activePeriod: 'yearly',
      selectedPeriod: 'yearly',
      pendingTargetPeriod: 'monthly',
      canSubscribe: true,
      shouldShowTrialCopy: false,
      selectedPriceLabel: '$59.99/yr',
    }).kind === 'manage',
    'current plan remains manageable while another plan is scheduled',
  );

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
