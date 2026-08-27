import {
  getAndroidActivePeriodFromProductIdentifier,
  getAndroidPlanChangeTimingMessage,
  getIosActivePeriodFromProductIdentifier,
  getIosPlanChangeTimingMessage,
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
  assert(getIosActivePeriodFromProductIdentifier('bpd_monthly:monthly') === 'monthly', 'configured iOS monthly product normalizes');
  assert(getIosActivePeriodFromProductIdentifier('bpd_yearly:annual') === 'yearly', 'configured iOS yearly product normalizes');
  assert(getIosActivePeriodFromProductIdentifier('bpd_monthly') === null, 'unknown iOS product is not guessed');

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
    activeExpirationDateLabel: 'Aug 20, 2026',
    activeWillRenew: true,
    trialDaysRemaining: 0,
    shouldShowTrialCopy: false,
  });
  assert(activeMonthlyStatus.heroTitle === 'Your Membership', 'active subscriber sees membership header');
  assert(activeMonthlyStatus.title === 'Monthly membership active', 'active monthly status identifies current plan');
  assert(activeMonthlyStatus.body.includes('Current plan: Monthly'), 'active monthly body names current plan');
  assert(activeMonthlyStatus.body.includes('Renews on Aug 20, 2026'), 'active renewing membership shows renewal date');

  const rawProductDrivenActiveStatus = getMembershipStatusCopy({
    hasStoreAccess: true,
    isEntitlementActive: true,
    isTrialActive: false,
    currentPeriod: getAndroidActivePeriodFromProductIdentifier('bpd_monthly:monthly'),
    trialDaysRemaining: 0,
    shouldShowTrialCopy: false,
  });
  assert(rawProductDrivenActiveStatus.heroTitle === 'Your Membership', 'raw active entitlement product drives membership header');
  assert(rawProductDrivenActiveStatus.title === 'Monthly membership active', 'raw active entitlement product drives current plan status');

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
    activeExpirationDateLabel: 'Aug 20, 2026',
    activeWillRenew: true,
    trialDaysRemaining: 1,
    shouldShowTrialCopy: false,
  });
  assert(monthlyTrialStatus.title === 'Monthly trial active', 'monthly trial active status');
  assert(monthlyTrialStatus.body.includes('Trial converts on Aug 20, 2026'), 'monthly trial conversion date');

  const yearlyTrialStatus = getMembershipStatusCopy({
    hasStoreAccess: true,
    isEntitlementActive: true,
    isTrialActive: true,
    currentPeriod: 'yearly',
    trialDaysRemaining: 2,
    shouldShowTrialCopy: false,
  });
  assert(yearlyTrialStatus.title === 'Yearly trial active', 'yearly trial active status');

  const cancelledActiveStatus = getMembershipStatusCopy({
    hasStoreAccess: true,
    isEntitlementActive: true,
    isTrialActive: false,
    currentPeriod: 'yearly',
    activeExpirationDateLabel: 'Jul 20, 2027',
    activeWillRenew: false,
    trialDaysRemaining: 0,
    shouldShowTrialCopy: false,
  });
  assert(cancelledActiveStatus.title === 'Yearly membership cancelled', 'cancelled subscription status is explicit');
  assert(cancelledActiveStatus.body.includes('Access ends on Jul 20, 2027'), 'cancelled active subscription shows access end date');

  const billingIssueStatus = getMembershipStatusCopy({
    hasStoreAccess: true,
    isEntitlementActive: true,
    isTrialActive: false,
    currentPeriod: 'monthly',
    billingIssueDateLabel: 'Aug 10, 2026',
    trialDaysRemaining: 0,
    shouldShowTrialCopy: false,
  });
  assert(billingIssueStatus.title === 'Billing issue', 'billing issue status is explicit');
  assert(billingIssueStatus.body.includes('billing issue on Aug 10, 2026'), 'billing issue date is shown when available');

  const expiredStatus = getMembershipStatusCopy({
    hasStoreAccess: false,
    isEntitlementActive: false,
    isTrialActive: false,
    currentPeriod: null,
    inactiveExpirationDateLabel: 'Jul 20, 2026',
    trialDaysRemaining: 0,
    shouldShowTrialCopy: false,
  });
  assert(expiredStatus.title === 'Membership expired', 'expired subscription status is explicit');
  assert(expiredStatus.body.includes('expired on Jul 20, 2026'), 'expired subscription shows expiration date without granting access');

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
  assert(pendingMonthlyStatus.body.includes('Current plan remains active until Jul 21, 2026'), 'pending monthly keeps current plan active until effective date');
  assert(pendingMonthlyStatus.body.includes('Scheduled next plan: Monthly'), 'pending monthly names scheduled target');
  assert(
    pendingMonthlyStatus.body.includes('Your Monthly membership will begin after your current Yearly period ends on Jul 21, 2026'),
    'pending monthly explains deferred start timing',
  );

  const pendingYearlyStatus = getMembershipStatusCopy({
    hasStoreAccess: true,
    isEntitlementActive: true,
    isTrialActive: false,
    currentPeriod: 'monthly',
    pendingTargetPeriod: 'yearly',
    trialDaysRemaining: 0,
    shouldShowTrialCopy: false,
  });
  assert(pendingYearlyStatus.body.includes('Scheduled next plan: Yearly'), 'pending yearly scheduled copy');
  assert(pendingYearlyStatus.body.includes('your renewal date'), 'pending yearly falls back to renewal date copy');

  assert(
    getAndroidPlanChangeTimingMessage({
      platform: 'android',
      hasStoreAccess: true,
      activePeriod: 'monthly',
      selectedPeriod: 'yearly',
      effectiveDateLabel: 'Aug 20, 2026',
    }) === 'You’ll keep your Monthly membership until Aug 20, 2026. Your Yearly membership will begin after that.',
    'monthly to yearly pre-purchase message explains deferred timing',
  );

  assert(
    getAndroidPlanChangeTimingMessage({
      platform: 'android',
      hasStoreAccess: true,
      activePeriod: 'yearly',
      selectedPeriod: 'monthly',
      effectiveDateLabel: 'Jul 20, 2027',
    }) === 'You’ll keep your Yearly membership until Jul 20, 2027. Your Monthly membership will begin after that.',
    'yearly to monthly pre-purchase message explains deferred timing',
  );

  assert(
    getAndroidPlanChangeTimingMessage({
      platform: 'android',
      hasStoreAccess: false,
      activePeriod: null,
      selectedPeriod: 'yearly',
      effectiveDateLabel: 'Aug 20, 2026',
    }) === null,
    'fresh users see no scheduled-change messaging',
  );

  assert(
    getAndroidPlanChangeTimingMessage({
      platform: 'android',
      hasStoreAccess: true,
      activePeriod: 'monthly',
      selectedPeriod: 'yearly',
      effectiveDateLabel: null,
    }) === 'You’ll keep your Monthly membership until your current billing period ends. Your Yearly membership will begin after that.',
    'missing expiration date uses safe generic deferred timing copy',
  );

  assert(
    getAndroidPlanChangeTimingMessage({
      platform: 'android',
      hasStoreAccess: true,
      activePeriod: 'monthly',
      selectedPeriod: 'yearly',
      pendingTargetPeriod: 'yearly',
      effectiveDateLabel: 'Aug 20, 2026',
    }) === null,
    'same scheduled switch cannot be submitted twice from timing prompt',
  );

  assert(
    getIosPlanChangeTimingMessage({
      platform: 'ios',
      hasStoreAccess: true,
      activePeriod: 'monthly',
      selectedPeriod: 'yearly',
    }) === 'Your Yearly membership may begin immediately. Apple will show the exact charge and any applicable adjustment before you confirm.',
    'iOS monthly to yearly uses Apple-aware upgrade copy',
  );

  assert(
    getIosPlanChangeTimingMessage({
      platform: 'ios',
      hasStoreAccess: true,
      activePeriod: 'yearly',
      selectedPeriod: 'monthly',
    }) === 'Your Monthly membership is expected to begin after your current Yearly period ends. Apple will confirm the effective date before you confirm.',
    'iOS yearly to monthly uses Apple-aware downgrade copy',
  );

  assert(
    getIosPlanChangeTimingMessage({
      platform: 'ios',
      hasStoreAccess: false,
      activePeriod: null,
      selectedPeriod: 'yearly',
    }) === null,
    'fresh iOS users see no plan-change timing message',
  );

  const loadingManageStatus = getMembershipStatusCopy({
    hasStoreAccess: false,
    isEntitlementActive: false,
    isTrialActive: false,
    currentPeriod: null,
    trialDaysRemaining: 0,
    shouldShowTrialCopy: false,
    isSubscriptionManagement: true,
    isMembershipLoading: true,
  });
  assert(loadingManageStatus.heroTitle === 'Your Membership', 'manage mode does not show acquisition header while membership loads');
  assert(loadingManageStatus.title === 'Checking membership status', 'manage loading state is explicit');

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
    }).kind === 'switch',
    'iOS active monthly subscriber can switch to yearly in app',
  );

  assert(
    getMembershipPrimaryAction({
      isExpoGo: false,
      platform: 'ios',
      hasStoreAccess: true,
      activePeriod: 'yearly',
      selectedPeriod: 'monthly',
      canSubscribe: true,
      shouldShowTrialCopy: false,
      selectedPriceLabel: '$9.99/mo',
    }).label === 'Switch to Monthly',
    'iOS active yearly subscriber can switch to monthly in app',
  );

  assert(
    getMembershipPrimaryAction({
      isExpoGo: false,
      platform: 'ios',
      hasStoreAccess: true,
      activePeriod: 'monthly',
      selectedPeriod: 'monthly',
      canSubscribe: true,
      shouldShowTrialCopy: false,
      selectedPriceLabel: '$9.99/mo',
    }).kind === 'manage',
    'iOS same-plan selection opens subscription management',
  );

  const freshPurchase = getMembershipPrimaryAction({
    isExpoGo: false,
    platform: 'android',
    hasStoreAccess: false,
    activePeriod: null,
    selectedPeriod: 'monthly',
    canSubscribe: true,
    shouldShowTrialCopy: true,
    trialLengthLabel: '7-day free',
    selectedPriceLabel: '$9.99/mo',
  });
  assert(freshPurchase.kind === 'purchase', 'fresh user uses purchase action');
  assert(freshPurchase.label.includes('7-day free trial'), 'fresh user trial label follows RevenueCat trial metadata');

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
