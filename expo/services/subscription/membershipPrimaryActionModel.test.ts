import { getMembershipPrimaryAction } from '@/services/subscription/membershipPrimaryActionModel';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Membership primary action regression failed: ${message}`);
}

export function assertMembershipPrimaryActionRegressionScenarios(): true {
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

  return true;
}

export const membershipPrimaryActionRegressionTestsPassed =
  assertMembershipPrimaryActionRegressionScenarios();
