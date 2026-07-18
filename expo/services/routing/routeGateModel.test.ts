import { computeRouteGateDecision } from '@/services/routing/routeGateModel';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Route gate regression failed: ${message}`);
}

const base = {
  topRoute: '(tabs)',
  isInitialized: true,
  authLoading: false,
  themeProfileLoading: false,
  isAuthenticated: true,
  profileLoading: false,
  hasProfile: true,
  onboardingCompleted: true,
  subscriptionLoading: false,
  hasPremiumAccess: false,
};

export function assertRouteGateRegressionScenarios(): true {
  const loadingAccessFromTabs = computeRouteGateDecision({
    ...base,
    subscriptionLoading: true,
    hasPremiumAccess: false,
  });
  assert(
    loadingAccessFromTabs.target === '/upgrade',
    'onboarded users without confirmed entitlement route to paywall while access loads',
  );

  const loadingAccessOnPaywall = computeRouteGateDecision({
    ...base,
    topRoute: 'upgrade',
    subscriptionLoading: true,
    hasPremiumAccess: false,
  });
  assert(
    loadingAccessOnPaywall.target === null && loadingAccessOnPaywall.decision === 'show-paywall-loading-access',
    '/upgrade renders before RevenueCat offerings/customer info finish',
  );

  const noFreshEntitlement = computeRouteGateDecision({
    ...base,
    subscriptionLoading: false,
    hasPremiumAccess: false,
  });
  assert(noFreshEntitlement.target === '/upgrade', 'premium app content remains blocked without fresh active entitlement');

  const freshEntitlement = computeRouteGateDecision({
    ...base,
    subscriptionLoading: false,
    hasPremiumAccess: true,
  });
  assert(freshEntitlement.target === null && freshEntitlement.decision === 'allow-main-app', 'fresh active entitlement allows main app');

  return true;
}

export const routeGateRegressionTestsPassed = assertRouteGateRegressionScenarios();
