import {
  computeOfferingStatus,
  computePaywallLoadingState,
  getOfferingsRecoveryDecision,
  getMembershipOptionsRequestDecision,
} from '@/services/subscription/paywallLoadingModel';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Paywall loading regression failed: ${message}`);
}

export function assertPaywallLoadingRegressionScenarios(): true {
  const baseOfferingInput = {
    isExpoGo: false,
    isAuthenticated: true,
    hasUserId: true,
    identityStatus: 'ready' as const,
    isRevenueCatIdentified: true,
    isOfferingsLoading: false,
    isOfferingsError: false,
    hasMonthlyPackage: false,
    hasAnnualPackage: false,
    hasOffering: false,
    isDev: false,
  };

  const offeringsReadyBeforeCustomerInfo = computeOfferingStatus({
    ...baseOfferingInput,
    hasMonthlyPackage: true,
    hasOffering: true,
  });
  assert(
    offeringsReadyBeforeCustomerInfo === 'ready',
    'offerings can become ready independently of customer-info entitlement loading',
  );

  const lifetimeOnlyOfferingEmpty = computeOfferingStatus({
    ...baseOfferingInput,
    hasOffering: true,
  });
  assert(lifetimeOnlyOfferingEmpty === 'empty', 'lifetime-only offerings are not usable for new purchases');

  const identityFailedWithNoTrustedAccess = computeOfferingStatus({
    ...baseOfferingInput,
    identityStatus: 'error',
    isRevenueCatIdentified: false,
    hasMonthlyPackage: true,
    hasOffering: true,
  });
  assert(identityFailedWithNoTrustedAccess === 'error', 'identity failure is retryable and does not show trusted packages');

  const offeringsFailed = computeOfferingStatus({
    ...baseOfferingInput,
    isOfferingsError: true,
  });
  assert(offeringsFailed === 'error', 'offerings request failure is retryable');

  const emptyOffering = computeOfferingStatus({
    ...baseOfferingInput,
    hasOffering: true,
  });
  assert(emptyOffering === 'empty', 'offering without monthly/yearly packages is distinct from request failure');

  const missingDefaultOffering = computeOfferingStatus(baseOfferingInput);
  assert(missingDefaultOffering === 'empty', 'missing default/current offering is treated as empty in production');

  const initialLoading = computePaywallLoadingState({
    offeringStatus: 'loading',
    timedOut: false,
    hasValidPlan: false,
  });
  assert(initialLoading.message === 'Loading membership options...', '/upgrade renders while offerings are unresolved');
  assert(initialLoading.canShowRetry === false, 'initial loading does not show retry before timeout');
  assert(initialLoading.canSubscribe === false, 'purchase CTA remains disabled while packages are missing');

  const timedOut = computePaywallLoadingState({
    offeringStatus: 'loading',
    timedOut: true,
    hasValidPlan: false,
  });
  assert(timedOut.status === 'error', 'long loading transitions to retryable error state');
  assert(timedOut.canShowRetry === true, 'timed-out loading exposes retry UI');
  assert(timedOut.canSubscribe === false, 'timeout changes UI only and never enables purchase');

  const failed = computePaywallLoadingState({
    offeringStatus: 'error',
    timedOut: false,
    hasValidPlan: false,
  });
  assert(failed.canShowRetry === true, 'failed offerings request exposes retry UI');
  assert(failed.canSubscribe === false, 'failed offerings request cannot enable purchase');

  const readyWithoutPackage = computePaywallLoadingState({
    offeringStatus: 'ready',
    timedOut: false,
    hasValidPlan: false,
  });
  assert(readyWithoutPackage.canSubscribe === false, 'ready status without selected package cannot enable purchase');

  const readyWithPackage = computePaywallLoadingState({
    offeringStatus: 'ready',
    timedOut: false,
    hasValidPlan: true,
  });
  assert(readyWithPackage.canSubscribe === true, 'valid resolved package enables purchase');
  assert(readyWithPackage.message === null, 'successful package load clears loading copy');

  const lateSuccessAfterTimeout = computePaywallLoadingState({
    offeringStatus: 'ready',
    timedOut: true,
    hasValidPlan: true,
  });
  assert(lateSuccessAfterTimeout.canSubscribe === true, 'late successful offerings response wins after timeout');

  const noIdentityRequest = getMembershipOptionsRequestDecision({
    shouldUseRevenueCat: false,
    userKey: 'user-a',
    requestNonce: 0,
    lastRequestKey: null,
  });
  assert(noIdentityRequest.shouldStart === false, 'RevenueCat request waits for identity-ready access');

  const firstIdentityReadyRequest = getMembershipOptionsRequestDecision({
    shouldUseRevenueCat: true,
    userKey: 'user-a',
    requestNonce: 1,
    lastRequestKey: null,
  });
  assert(firstIdentityReadyRequest.shouldStart === true, 'identity-ready transition starts a membership options request');

  const duplicateRequest = getMembershipOptionsRequestDecision({
    shouldUseRevenueCat: true,
    userKey: 'user-a',
    requestNonce: 1,
    lastRequestKey: firstIdentityReadyRequest.requestKey,
  });
  assert(duplicateRequest.shouldStart === false, 'same identity request key is deduplicated');

  const retryRequest = getMembershipOptionsRequestDecision({
    shouldUseRevenueCat: true,
    userKey: 'user-a',
    requestNonce: 2,
    lastRequestKey: firstIdentityReadyRequest.requestKey,
  });
  assert(retryRequest.shouldStart === true, 'retry nonce starts a real new offerings/customer-info request');

  const accountSwitchRequest = getMembershipOptionsRequestDecision({
    shouldUseRevenueCat: true,
    userKey: 'user-b',
    requestNonce: 2,
    lastRequestKey: retryRequest.requestKey,
  });
  assert(accountSwitchRequest.shouldStart === true, 'account switch cannot reuse a previous user request guard');

  const recoveryBeforeIdentityReady = getOfferingsRecoveryDecision({
    shouldUseRevenueCat: true,
    userKey: 'user-a',
    accountGeneration: 1,
    identityStatus: 'loading',
    hasOffering: false,
    isOfferingsLoading: false,
    recoveryAttemptedForKey: null,
  });
  assert(recoveryBeforeIdentityReady.shouldStart === false, 'automatic offerings recovery waits for identity-ready');

  const recoveryAfterIdentityReady = getOfferingsRecoveryDecision({
    shouldUseRevenueCat: true,
    userKey: 'user-a',
    accountGeneration: 1,
    identityStatus: 'ready',
    hasOffering: false,
    isOfferingsLoading: false,
    recoveryAttemptedForKey: null,
  });
  assert(
    recoveryAfterIdentityReady.shouldStart === true,
    'identity-ready transition recovers a failed or missing initial offerings request',
  );

  const duplicateRecovery = getOfferingsRecoveryDecision({
    shouldUseRevenueCat: true,
    userKey: 'user-a',
    accountGeneration: 1,
    identityStatus: 'ready',
    hasOffering: false,
    isOfferingsLoading: false,
    recoveryAttemptedForKey: recoveryAfterIdentityReady.requestKey,
  });
  assert(duplicateRecovery.shouldStart === false, 'automatic offerings recovery runs once per account generation');

  const secondAccountRecovery = getOfferingsRecoveryDecision({
    shouldUseRevenueCat: true,
    userKey: 'user-b',
    accountGeneration: 2,
    identityStatus: 'ready',
    hasOffering: false,
    isOfferingsLoading: false,
    recoveryAttemptedForKey: recoveryAfterIdentityReady.requestKey,
  });
  assert(secondAccountRecovery.shouldStart === true, 'second account gets its own automatic offerings recovery');

  const noRecoveryWhenOfferingExists = getOfferingsRecoveryDecision({
    shouldUseRevenueCat: true,
    userKey: 'user-a',
    accountGeneration: 1,
    identityStatus: 'ready',
    hasOffering: true,
    isOfferingsLoading: false,
    recoveryAttemptedForKey: null,
  });
  assert(noRecoveryWhenOfferingExists.shouldStart === false, 'loaded packages do not trigger duplicate recovery');

  const noRecoveryWhileLoading = getOfferingsRecoveryDecision({
    shouldUseRevenueCat: true,
    userKey: 'user-a',
    accountGeneration: 1,
    identityStatus: 'ready',
    hasOffering: false,
    isOfferingsLoading: true,
    recoveryAttemptedForKey: null,
  });
  assert(noRecoveryWhileLoading.shouldStart === false, 'in-flight offerings request is not duplicated by recovery');

  return true;
}

export const paywallLoadingRegressionTestsPassed = assertPaywallLoadingRegressionScenarios();
