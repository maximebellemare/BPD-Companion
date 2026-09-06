import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';
import type { CustomerInfo } from '@/services/subscription/purchasesService';
import type { SubscriptionPlanPeriod } from '@/types/subscription';

type PrimaryActionLike = {
  kind: string;
};

export function hasActiveTrialEntitlementForRoadmap(customerInfo: CustomerInfo | null): boolean {
  const entitlement = customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID] ?? null;
  return entitlement?.isActive === true &&
    String(entitlement.periodType ?? '').trim().toUpperCase() === 'TRIAL';
}

export function shouldPrepareTrialActivationRoadmap(params: {
  primaryAction: PrimaryActionLike;
  hasStoreAccess: boolean;
  selectedPeriod: SubscriptionPlanPeriod | null | undefined;
  shouldShowTrialCopy: boolean;
  trialDays?: number | null;
}): boolean {
  return params.primaryAction.kind === 'purchase' &&
    !params.hasStoreAccess &&
    params.shouldShowTrialCopy &&
    params.selectedPeriod !== 'lifetime';
}

export function shouldRouteTrialActivationRoadmapFromPurchase(params: {
  customerInfo: CustomerInfo | null;
  purchaseCompleted: boolean;
}): boolean {
  return params.purchaseCompleted && hasActiveTrialEntitlementForRoadmap(params.customerInfo);
}
