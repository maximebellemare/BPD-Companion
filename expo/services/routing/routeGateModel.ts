export type RouteGateDecisionInput = {
  topRoute: string;
  isInitialized: boolean;
  authLoading: boolean;
  themeProfileLoading: boolean;
  isAuthenticated: boolean;
  profileLoading: boolean;
  hasProfile: boolean;
  onboardingCompleted: boolean;
  subscriptionLoading: boolean;
  hasPremiumAccess: boolean;
};

export type RouteGateDecision = {
  target: string | null;
  decision: string;
};

export function computeRouteGateDecision(input: RouteGateDecisionInput): RouteGateDecision {
  const inAuth = input.topRoute === 'auth';
  const inOnboarding = input.topRoute === 'onboarding';
  const inPaywall = input.topRoute === 'upgrade';

  if (!input.isInitialized || input.authLoading || input.themeProfileLoading) {
    return { target: null, decision: 'loading-session' };
  }

  if (!input.isAuthenticated) {
    return {
      target: inAuth ? null : '/auth/welcome',
      decision: inAuth ? 'show-auth' : 'redirect-auth',
    };
  }

  if (input.profileLoading || !input.hasProfile) {
    return { target: null, decision: 'loading-profile' };
  }

  if (!input.onboardingCompleted) {
    return {
      target: inOnboarding ? null : '/onboarding',
      decision: inOnboarding ? 'show-onboarding' : 'redirect-onboarding',
    };
  }

  if (input.subscriptionLoading) {
    return {
      target: inPaywall ? null : '/upgrade',
      decision: inPaywall ? 'show-paywall-loading-access' : 'redirect-paywall-loading-access',
    };
  }

  if (!input.hasPremiumAccess) {
    return {
      target: inPaywall ? null : '/upgrade',
      decision: inPaywall ? 'show-paywall' : 'redirect-paywall',
    };
  }

  if (inAuth) {
    return { target: '/(tabs)/(home)', decision: 'redirect-main-app' };
  }

  if (inOnboarding) {
    return { target: null, decision: 'show-onboarding-replay' };
  }

  if (inPaywall) {
    return { target: null, decision: 'show-subscription-management' };
  }

  return { target: null, decision: 'allow-main-app' };
}
