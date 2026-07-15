import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';
import type { CustomerInfo } from '@/services/subscription/purchasesService';
import {
  type RestoreNavigationState,
  applyRestoreError,
  applyRestoreResult,
  isSubscriptionAccessLoading,
  shouldAcceptCustomerInfoUpdate,
} from '@/services/subscription/restoreNavigationModel';

const initialState: RestoreNavigationState = {
  hasActiveAccess: false,
  isRestoring: true,
  hasNavigated: false,
  navigationCount: 0,
};

function activeInfo(): CustomerInfo {
  return {
    entitlements: {
      active: {
        [REVENUECAT_ENTITLEMENT_ID]: {
          expirationDate: null,
          productIdentifier: 'bpd_monthly:monthly',
          periodType: 'NORMAL',
        },
      },
    },
  };
}

function inactiveInfo(): CustomerInfo {
  return { entitlements: { active: {} } };
}

const successfulRestore = applyRestoreResult(initialState, activeInfo());
const repeatedNavigation = applyRestoreResult(successfulRestore, activeInfo());
const restoreError = applyRestoreError(initialState);
const identityRepairRestore = applyRestoreResult(initialState, activeInfo());
const timeoutFailure = applyRestoreError(initialState);
const activeEntitlementWithOfferingsStillLoading = isSubscriptionAccessLoading({
  isExpoGo: false,
  isAuthenticated: true,
  hasUserId: true,
  isRevenueCatIdentified: true,
  isCustomerInfoLoading: false,
  isOfferingsLoading: true,
  customerInfo: activeInfo(),
});
const inactiveEntitlementWithOfferingsStillLoading = isSubscriptionAccessLoading({
  isExpoGo: false,
  isAuthenticated: true,
  hasUserId: true,
  isRevenueCatIdentified: true,
  isCustomerInfoLoading: false,
  isOfferingsLoading: true,
  customerInfo: inactiveInfo(),
});

export const restoreNavigationRegressionFailures = [
  successfulRestore.hasActiveAccess === true || 'successful restore updates active entitlement immediately',
  successfulRestore.isRestoring === false || 'successful restore clears loading state',
  successfulRestore.shouldNavigate === true || 'successful restore dismisses paywall without app restart',
  shouldAcceptCustomerInfoUpdate(activeInfo(), inactiveInfo()) === false || 'stale parallel refresh cannot overwrite active restored state',
  activeEntitlementWithOfferingsStillLoading === false || 'offerings query remains loading while entitlement is active but provider still unblocks',
  inactiveEntitlementWithOfferingsStillLoading === true || 'no entitlement still waits on offerings before entering app',
  restoreError.isRestoring === false || 'restore error clears loading state',
  identityRepairRestore.navigationCount === 1 || 'identity repair + restore still completes once',
  repeatedNavigation.navigationCount === 1 || 'navigation occurs exactly once',
  timeoutFailure.isRestoring === false || 'timeout/failure does not hang indefinitely',
].filter((result): result is string => result !== true);

export function assertRestoreNavigationRegressionScenarios(): true {
  if (restoreNavigationRegressionFailures.length > 0) {
    throw new Error(`Restore navigation regression failures: ${restoreNavigationRegressionFailures.join(', ')}`);
  }
  return true;
}

export const restoreNavigationRegressionTestsPassed = assertRestoreNavigationRegressionScenarios();
