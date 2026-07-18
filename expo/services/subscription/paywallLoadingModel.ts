export type PaywallOptionsStatus = 'loading' | 'ready' | 'empty' | 'error' | 'preview';
export type RevenueCatIdentityStatus = 'idle' | 'loading' | 'ready' | 'error';

export type OfferingStatusInput = {
  isExpoGo: boolean;
  isAuthenticated: boolean;
  hasUserId: boolean;
  identityStatus: RevenueCatIdentityStatus;
  isRevenueCatIdentified: boolean;
  isOfferingsLoading: boolean;
  isOfferingsError: boolean;
  hasMonthlyPackage: boolean;
  hasAnnualPackage: boolean;
  hasOffering: boolean;
  isDev: boolean;
};

export type PaywallLoadingInput = {
  offeringStatus: PaywallOptionsStatus;
  timedOut: boolean;
  hasValidPlan: boolean;
};

export type PaywallLoadingResult = {
  status: PaywallOptionsStatus;
  canShowRetry: boolean;
  message: string | null;
  canSubscribe: boolean;
};

export type MembershipOptionsRequestInput = {
  shouldUseRevenueCat: boolean;
  userKey: string | null | undefined;
  requestNonce: number;
  lastRequestKey: string | null;
};

export type MembershipOptionsRequestDecision = {
  requestKey: string | null;
  shouldStart: boolean;
};

export function getMembershipOptionsRequestDecision(
  input: MembershipOptionsRequestInput,
): MembershipOptionsRequestDecision {
  if (!input.shouldUseRevenueCat || !input.userKey) {
    return { requestKey: null, shouldStart: false };
  }

  const requestKey = `${input.userKey}:${input.requestNonce}`;
  return {
    requestKey,
    shouldStart: requestKey !== input.lastRequestKey,
  };
}

export function computeOfferingStatus(input: OfferingStatusInput): PaywallOptionsStatus {
  if (input.isExpoGo) return 'preview';
  if (input.isAuthenticated && input.hasUserId && input.identityStatus === 'error') return 'error';
  if (input.isAuthenticated && input.hasUserId && !input.isRevenueCatIdentified) return 'loading';
  if (input.isOfferingsLoading) return 'loading';
  if (input.isOfferingsError) return 'error';
  if (input.hasMonthlyPackage || input.hasAnnualPackage) return 'ready';
  if (input.hasOffering) return 'empty';
  if (input.isDev) return 'preview';
  return 'empty';
}

export function computePaywallLoadingState(input: PaywallLoadingInput): PaywallLoadingResult {
  if (input.offeringStatus === 'ready') {
    return {
      status: 'ready',
      canShowRetry: false,
      message: null,
      canSubscribe: input.hasValidPlan,
    };
  }

  if (input.offeringStatus === 'loading' && input.timedOut) {
    return {
      status: 'error',
      canShowRetry: true,
      message: 'Membership options are taking longer than expected. Please try again.',
      canSubscribe: false,
    };
  }

  if (input.offeringStatus === 'error' || input.offeringStatus === 'empty') {
    return {
      status: input.offeringStatus,
      canShowRetry: true,
      message: 'Membership options could not be loaded. Please try again.',
      canSubscribe: false,
    };
  }

  if (input.offeringStatus === 'preview') {
    return {
      status: 'preview',
      canShowRetry: false,
      message: null,
      canSubscribe: false,
    };
  }

  return {
    status: 'loading',
    canShowRetry: false,
    message: 'Loading membership options...',
    canSubscribe: false,
  };
}
