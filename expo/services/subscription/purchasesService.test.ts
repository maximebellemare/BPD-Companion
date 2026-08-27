import { selectCurrentOfferingForPurchase } from '@/services/subscription/purchasesService';
import type { PurchasesOffering } from '@/services/subscription/purchasesService';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Purchases service regression failed: ${message}`);
}

export function assertRevenueCatOfferingExperimentScenarios(): true {
  const current = { identifier: 'experiment_variant_b' } as PurchasesOffering;
  const fallback = { identifier: 'default' } as PurchasesOffering;

  assert(
    selectCurrentOfferingForPurchase({
      current,
      all: { default: fallback },
    }) === current,
    'purchase/display path uses the customer-assigned current offering',
  );

  assert(
    selectCurrentOfferingForPurchase({
      current: null,
      all: { default: fallback },
    }) === null,
    'purchase/display path does not fall back to an unrelated offering',
  );

  return true;
}

export const revenueCatOfferingExperimentTestsPassed =
  assertRevenueCatOfferingExperimentScenarios();
