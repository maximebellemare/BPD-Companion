import { createLocalizedSubscriptionPlan } from '@/services/subscription/localizedPricingModel';
import type { PurchasesPackage } from '@/services/subscription/purchasesService';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Localized pricing regression failed: ${message}`);
}

function pkg(
  priceString?: string,
  identifier: string = '$rc_monthly',
  introPeriod: string | null = null,
): PurchasesPackage {
  return {
    identifier,
    packageType: 'MONTHLY',
    product: {
      identifier: 'bpd_monthly:monthly',
      price: 12.99,
      priceString: priceString ?? '',
      introPrice: introPeriod ? { period: introPeriod, price: 0, priceString: '$0.00' } : null,
    },
  } as unknown as PurchasesPackage;
}

export function assertLocalizedPricingRegressionScenarios(): true {
  assert(
    createLocalizedSubscriptionPlan({
      pkg: pkg('CA$12.99'),
      period: 'monthly',
      fallbackProductIdentifier: 'bpd_monthly:monthly',
    })?.priceLabel === 'CA$12.99/mo',
    'Canadian localized monthly priceString is rendered unchanged',
  );
  assert(
    createLocalizedSubscriptionPlan({
      pkg: pkg('$9.99'),
      period: 'monthly',
      fallbackProductIdentifier: 'bpd_monthly:monthly',
    })?.priceLabel === '$9.99/mo',
    'USD localized monthly priceString is rendered unchanged',
  );
  assert(
    createLocalizedSubscriptionPlan({
      pkg: pkg('€8,99'),
      period: 'monthly',
      fallbackProductIdentifier: 'bpd_monthly:monthly',
    })?.priceLabel === '€8,99/mo',
    'Euro localized formatting is rendered unchanged',
  );
  const staleUsdPlan = createLocalizedSubscriptionPlan({
    pkg: pkg('$9.99', '$rc_monthly'),
    period: 'monthly',
    fallbackProductIdentifier: 'bpd_monthly:monthly',
  });
  const freshCadPlan = createLocalizedSubscriptionPlan({
    pkg: pkg('CA$12.99', '$rc_monthly'),
    period: 'monthly',
    fallbackProductIdentifier: 'bpd_monthly:monthly',
  });
  assert(
    staleUsdPlan?.priceLabel === '$9.99/mo' &&
      freshCadPlan?.priceLabel === 'CA$12.99/mo',
    'fresh offerings replace stale USD display plans with current priceString',
  );
  assert(
    freshCadPlan?.packageIdentifier === '$rc_monthly' &&
      freshCadPlan.productIdentifier === 'bpd_monthly:monthly',
    'display plan preserves the RevenueCat package/product used for purchase',
  );
  const iosSevenDayTrialPlan = createLocalizedSubscriptionPlan({
    pkg: pkg('$9.99', '$rc_monthly', 'P7D'),
    period: 'monthly',
    fallbackProductIdentifier: 'bpd_monthly:monthly',
    trialEligibilityStatus: 'eligible',
  });
  assert(iosSevenDayTrialPlan?.trialDays === 7, 'iOS trial days come from StoreProduct introPrice period');
  assert(iosSevenDayTrialPlan?.androidTrialCopy === '7-day free trial for eligible new subscribers', 'eligible native trial copy can reflect seven-day experiment metadata');

  assert(
    createLocalizedSubscriptionPlan({
      pkg: pkg(undefined),
      period: 'monthly',
      fallbackProductIdentifier: 'bpd_monthly:monthly',
    }) === null,
    'missing priceString does not fabricate USD fallback',
  );

  return true;
}

export const localizedPricingRegressionTestsPassed =
  assertLocalizedPricingRegressionScenarios();
