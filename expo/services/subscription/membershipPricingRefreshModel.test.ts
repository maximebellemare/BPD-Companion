import {
  shouldRefreshMembershipPricingOnAppStateChange,
  shouldRefreshMembershipPricingOnManageOpen,
} from '@/services/subscription/membershipPricingRefreshModel';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Membership pricing refresh regression failed: ${message}`);
}

export function assertMembershipPricingRefreshRegressionScenarios(): true {
  assert(
    shouldRefreshMembershipPricingOnManageOpen({
      isSubscriptionManagement: true,
      hasAlreadyRefreshed: false,
    }) === true,
    'manage mode triggers one fresh offerings refresh',
  );
  assert(
    shouldRefreshMembershipPricingOnManageOpen({
      isSubscriptionManagement: true,
      hasAlreadyRefreshed: true,
    }) === false,
    'manage mode does not loop refreshes',
  );
  assert(
    shouldRefreshMembershipPricingOnManageOpen({
      isSubscriptionManagement: false,
      hasAlreadyRefreshed: false,
    }) === false,
    'normal paywall view does not force manage refresh',
  );
  assert(
    shouldRefreshMembershipPricingOnAppStateChange({
      previousState: 'inactive',
      nextState: 'active',
    }) === true,
    'returning from StoreKit purchase sheet refreshes offerings',
  );
  assert(
    shouldRefreshMembershipPricingOnAppStateChange({
      previousState: 'background',
      nextState: 'active',
    }) === true,
    'returning from subscription management refreshes offerings',
  );
  assert(
    shouldRefreshMembershipPricingOnAppStateChange({
      previousState: 'active',
      nextState: 'active',
    }) === false,
    'active-to-active AppState updates do not refetch repeatedly',
  );

  return true;
}

export const membershipPricingRefreshRegressionTestsPassed =
  assertMembershipPricingRefreshRegressionScenarios();
