import type { CustomerInfo } from '@/services/subscription/purchasesService';
import { hasActiveMembershipEntitlement } from '@/services/subscription/restoreSecurityModel';

export type RestoreNavigationState = {
  hasActiveAccess: boolean;
  isRestoring: boolean;
  hasNavigated: boolean;
  navigationCount: number;
};

export type RestoreNavigationResult = RestoreNavigationState & {
  shouldNavigate: boolean;
};

export function applyRestoreResult(
  state: RestoreNavigationState,
  customerInfo: CustomerInfo | null,
): RestoreNavigationResult {
  const hasActiveAccess = hasActiveMembershipEntitlement(customerInfo);
  const shouldNavigate = hasActiveAccess && !state.hasNavigated;

  return {
    hasActiveAccess: state.hasActiveAccess || hasActiveAccess,
    isRestoring: false,
    hasNavigated: state.hasNavigated || shouldNavigate,
    navigationCount: state.navigationCount + (shouldNavigate ? 1 : 0),
    shouldNavigate,
  };
}

export function applyRestoreError(state: RestoreNavigationState): RestoreNavigationResult {
  return {
    ...state,
    isRestoring: false,
    shouldNavigate: false,
  };
}

export function shouldAcceptCustomerInfoUpdate(
  currentInfo: CustomerInfo | null,
  incomingInfo: CustomerInfo | null,
): boolean {
  return !hasActiveMembershipEntitlement(currentInfo) || hasActiveMembershipEntitlement(incomingInfo);
}

export function isSubscriptionAccessLoading(input: {
  isExpoGo: boolean;
  isAuthenticated: boolean;
  hasUserId: boolean;
  isRevenueCatIdentified: boolean;
  isCustomerInfoLoading: boolean;
  isOfferingsLoading: boolean;
  customerInfo: CustomerInfo | null;
}): boolean {
  if (input.isExpoGo) return false;
  const isEntitlementActive = hasActiveMembershipEntitlement(input.customerInfo);

  return (
    (input.isAuthenticated && input.hasUserId && !input.isRevenueCatIdentified) ||
    input.isCustomerInfoLoading ||
    (!isEntitlementActive && input.isOfferingsLoading)
  );
}
