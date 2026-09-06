import {
  hasActiveTrialEntitlementForRoadmap,
  shouldPrepareTrialActivationRoadmap,
  shouldRouteTrialActivationRoadmapFromPurchase,
} from '@/services/subscription/trialActivationModel';
import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';
import type { CustomerInfo } from '@/services/subscription/purchasesService';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Trial activation roadmap regression failed: ${message}`);
}

function info(periodType: string | null, isActive: boolean = true): CustomerInfo {
  return {
    entitlements: {
      active: isActive
        ? {
            [REVENUECAT_ENTITLEMENT_ID]: {
              isActive,
              periodType,
            },
          }
        : {},
    },
  } as unknown as CustomerInfo;
}

export function assertTrialActivationRoadmapRegressionScenarios(): true {
  assert(
    shouldPrepareTrialActivationRoadmap({
      primaryAction: { kind: 'purchase' },
      hasStoreAccess: false,
      selectedPeriod: 'yearly',
      shouldShowTrialCopy: true,
      trialDays: 3,
    }),
    'new 3-day recurring trial purchase prepares roadmap routing',
  );

  assert(
    shouldPrepareTrialActivationRoadmap({
      primaryAction: { kind: 'purchase' },
      hasStoreAccess: false,
      selectedPeriod: 'yearly',
      shouldShowTrialCopy: true,
      trialDays: 7,
    }),
    'new 7-day recurring trial purchase prepares roadmap routing',
  );

  assert(
    shouldPrepareTrialActivationRoadmap({
      primaryAction: { kind: 'purchase' },
      hasStoreAccess: false,
      selectedPeriod: 'monthly',
      shouldShowTrialCopy: true,
    }),
    'new monthly trial purchase prepares roadmap routing',
  );

  assert(
    !shouldPrepareTrialActivationRoadmap({
      primaryAction: { kind: 'purchase' },
      hasStoreAccess: false,
      selectedPeriod: 'lifetime',
      shouldShowTrialCopy: false,
    }),
    'lifetime selections never prepare trial roadmap routing',
  );

  assert(
    !shouldPrepareTrialActivationRoadmap({
      primaryAction: { kind: 'purchase' },
      hasStoreAccess: true,
      selectedPeriod: 'yearly',
      shouldShowTrialCopy: true,
    }),
    'existing users do not restart the roadmap from another purchase surface',
  );

  assert(hasActiveTrialEntitlementForRoadmap(info('TRIAL')), 'confirmed trial entitlement is recognized');
  assert(hasActiveTrialEntitlementForRoadmap(info('trial')), 'trial recognition is case-insensitive');
  assert(!hasActiveTrialEntitlementForRoadmap(info('NORMAL')), 'paid entitlement is not treated as a trial');
  assert(!hasActiveTrialEntitlementForRoadmap(info('TRIAL', false)), 'inactive trial entitlement is ignored');
  assert(!hasActiveTrialEntitlementForRoadmap(null), 'missing CustomerInfo does not fabricate a trial');

  assert(
    shouldRouteTrialActivationRoadmapFromPurchase({
      customerInfo: info('TRIAL'),
      purchaseCompleted: true,
    }),
    'RevenueCat Paywall trial completion routes to the roadmap',
  );

  assert(
    !shouldRouteTrialActivationRoadmapFromPurchase({
      customerInfo: info('TRIAL'),
      purchaseCompleted: false,
    }),
    'cancelled or failed purchases never route to the roadmap',
  );

  assert(
    !shouldRouteTrialActivationRoadmapFromPurchase({
      customerInfo: info('NORMAL'),
      purchaseCompleted: true,
    }),
    'paid non-trial purchases do not route to the trial roadmap even if the CTA previously showed trial copy',
  );

  return true;
}

export const trialActivationRoadmapRegressionTestsPassed =
  assertTrialActivationRoadmapRegressionScenarios();
