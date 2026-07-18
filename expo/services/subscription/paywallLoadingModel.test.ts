import { computeOfferingStatus, computePaywallLoadingState } from '@/services/subscription/paywallLoadingModel';

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

  return true;
}

export const paywallLoadingRegressionTestsPassed = assertPaywallLoadingRegressionScenarios();
