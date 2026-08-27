import {
  ANDROID_REPLACEMENT_MODE_MONTHLY_TO_YEARLY,
  ANDROID_REPLACEMENT_MODE_YEARLY_TO_MONTHLY,
  getAndroidPaywallSelection,
  parseSubscriptionOptionId,
  selectAndroidSubscriptionOption,
} from '@/services/subscription/androidPurchaseSelector';
import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';
import type {
  CustomerInfo,
  PurchasesPackage,
  SubscriptionOption,
} from '@/services/subscription/purchasesService';
import type { SubscriptionPeriod } from '@/types/subscription';
import {
  evaluateRestoreUnlock,
} from '@/services/subscription/restoreSecurityModel';

function option(params: Partial<SubscriptionOption> & { id: string }): SubscriptionOption {
  return {
    id: params.id,
    productId: params.productId ?? 'bpd_monthly',
    storeProductId: params.storeProductId ?? params.productId ?? 'bpd_monthly',
    isBasePlan: params.isBasePlan ?? false,
    isPrepaid: params.isPrepaid ?? false,
    freePhase: Object.prototype.hasOwnProperty.call(params, 'freePhase')
      ? params.freePhase
      : { billingPeriod: { iso8601: 'P3D' }, price: { amountMicros: 0 } },
    pricingPhases: params.pricingPhases ?? [],
    tags: params.tags ?? [],
  } as SubscriptionOption;
}

function pkg(params: {
  productId: string;
  priceString?: string;
  options: SubscriptionOption[];
  defaultOptionId?: string;
}): PurchasesPackage {
  const defaultOption = params.options.find(item => item.id === params.defaultOptionId) ?? params.options[0] ?? null;
  return {
    identifier: params.productId,
    product: {
      identifier: `${params.productId}:${defaultOption?.id ?? 'base'}`,
      priceString: params.priceString ?? '$9.99',
      defaultOption,
      subscriptionOptions: params.options,
    },
  } as PurchasesPackage;
}

function infoWithActiveEntitlement(productIdentifier: string): CustomerInfo {
  return {
    activeSubscriptions: [productIdentifier],
    allPurchasedProductIdentifiers: [productIdentifier],
    entitlements: {
      active: {
        [REVENUECAT_ENTITLEMENT_ID]: {
          productIdentifier,
          expirationDate: null,
          periodType: 'NORMAL',
        },
      },
    },
  };
}

function infoWithoutEntitlement(): CustomerInfo {
  return {
    activeSubscriptions: [],
    allPurchasedProductIdentifiers: [],
    entitlements: { active: {} },
  };
}

function monthlyPackage(extraOptions: SubscriptionOption[] = []): PurchasesPackage {
  return monthlyPackageWithDefault('monthly', extraOptions);
}

function monthlyPackageWithDefault(
  defaultOptionId: string,
  extraOptions: SubscriptionOption[] = [],
  trialPeriod: string = 'P3D',
): PurchasesPackage {
  const base = option({
    id: 'monthly',
    productId: 'bpd_monthly',
    isBasePlan: true,
    freePhase: null,
  });
  const trial = option({
    id: 'monthly:free-trial',
    productId: 'bpd_monthly',
    freePhase: { billingPeriod: { iso8601: trialPeriod }, price: { amountMicros: 0 } } as never,
  });
  return pkg({
    productId: 'bpd_monthly',
    defaultOptionId,
    options: [base, trial, ...extraOptions],
  });
}

function yearlyPackage(extraOptions: SubscriptionOption[] = []): PurchasesPackage {
  return yearlyPackageWithDefault('annual', extraOptions);
}

function yearlyPackageWithDefault(
  defaultOptionId: string,
  extraOptions: SubscriptionOption[] = [],
  trialPeriod: string = 'P3D',
): PurchasesPackage {
  const base = option({
    id: 'annual',
    productId: 'bpd_yearly',
    isBasePlan: true,
    freePhase: null,
  });
  const trial = option({
    id: 'annual:free-trial',
    productId: 'bpd_yearly',
    freePhase: { billingPeriod: { iso8601: trialPeriod }, price: { amountMicros: 0 } } as never,
  });
  return pkg({
    productId: 'bpd_yearly',
    priceString: '$59.99',
    defaultOptionId,
    options: [base, trial, ...extraOptions],
  });
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Android purchase selector regression failed: ${message}`);
}

function assertSelection(params: {
  name: string;
  pkg: PurchasesPackage;
  period: SubscriptionPeriod;
  expectedOptionId: string | null;
  expectedTrialCopy: string | null;
  expectedTrialDays?: number | null;
  expectedChangeInfo?: string | null;
  expectedReplacementMode?: string | null;
  info?: CustomerInfo | null;
}): void {
  const result = selectAndroidSubscriptionOption({
    pkg: params.pkg,
    period: params.period,
    customerInfo: params.info ?? null,
  });
  assert(result.selectedOptionId === params.expectedOptionId, `${params.name}: selected option`);
  assert(result.trialCopy === params.expectedTrialCopy, `${params.name}: trial copy`);
  assert(result.trialDays === (params.expectedTrialDays ?? null), `${params.name}: trial days`);
  assert(
    (result.googleProductChangeInfo?.oldProductIdentifier ?? null) === (params.expectedChangeInfo ?? null),
    `${params.name}: product change info`,
  );
  assert(
    (result.googleProductChangeInfo?.replacementMode ?? null) === (params.expectedReplacementMode ?? null),
    `${params.name}: replacement mode`,
  );
}

export function assertAndroidPurchaseSelectorRegressionScenarios(): true {
  assert(
    ANDROID_REPLACEMENT_MODE_MONTHLY_TO_YEARLY === 'DEFERRED',
    'monthly to yearly uses deferred replacement mode',
  );
  assert(
    ANDROID_REPLACEMENT_MODE_YEARLY_TO_MONTHLY === 'DEFERRED',
    'yearly to monthly uses deferred replacement mode',
  );

  assertSelection({
    name: 'fresh Monthly selects exact Monthly trial',
    pkg: monthlyPackage(),
    period: 'monthly',
    expectedOptionId: 'monthly:free-trial',
    expectedTrialCopy: '3-day free trial for eligible new subscribers',
    expectedTrialDays: 3,
  });

  assertSelection({
    name: 'fresh Yearly selects exact Yearly trial',
    pkg: yearlyPackage(),
    period: 'yearly',
    expectedOptionId: 'annual:free-trial',
    expectedTrialCopy: '3-day free trial for eligible new subscribers',
    expectedTrialDays: 3,
  });

  assertSelection({
    name: 'Monthly cannot select Yearly offer',
    pkg: monthlyPackage([option({ id: 'annual:free-trial', productId: 'bpd_yearly' })]),
    period: 'monthly',
    expectedOptionId: 'monthly:free-trial',
    expectedTrialCopy: '3-day free trial for eligible new subscribers',
    expectedTrialDays: 3,
  });

  assertSelection({
    name: 'Yearly cannot select Monthly offer',
    pkg: yearlyPackage([option({ id: 'monthly:free-trial', productId: 'bpd_monthly' })]),
    period: 'yearly',
    expectedOptionId: 'annual:free-trial',
    expectedTrialCopy: '3-day free trial for eligible new subscribers',
    expectedTrialDays: 3,
  });

  assert(parseSubscriptionOptionId('too:many:parts').malformed, 'malformed option ID is detected');
  assertSelection({
    name: 'malformed option ID falls back safely',
    pkg: pkg({
      productId: 'bpd_monthly',
      defaultOptionId: 'monthly',
      options: [
        option({ id: 'monthly', productId: 'bpd_monthly', isBasePlan: true, freePhase: null }),
        option({ id: 'too:many:parts', productId: 'bpd_monthly' }),
      ],
    }),
    period: 'monthly',
    expectedOptionId: 'monthly',
    expectedTrialCopy: null,
  });

  const noExactOffer = selectAndroidSubscriptionOption({
    pkg: pkg({
      productId: 'bpd_monthly',
      priceString: '$9.99',
      defaultOptionId: 'monthly',
      options: [
        option({ id: 'monthly', productId: 'bpd_monthly', isBasePlan: true, freePhase: null }),
        option({ id: 'other:wrong-offer', productId: 'bpd_monthly' }),
      ],
    }),
    period: 'monthly',
    customerInfo: null,
  });
  assert(noExactOffer.selectedOptionId === 'monthly', 'no exact offer falls back to base option');
  assert(noExactOffer.priceString === '$9.99', 'no exact offer still displays base price');

  assertSelection({
    name: 'prepaid option excluded',
    pkg: pkg({
      productId: 'bpd_monthly',
      defaultOptionId: 'monthly',
      options: [
        option({ id: 'monthly', productId: 'bpd_monthly', isBasePlan: true, freePhase: null }),
        option({ id: 'monthly:free-trial', productId: 'bpd_monthly', isPrepaid: true }),
      ],
    }),
    period: 'monthly',
    expectedOptionId: 'monthly',
    expectedTrialCopy: null,
  });

  assertSelection({
    name: 'canceled Yearly checkout followed by Monthly remains fresh',
    pkg: monthlyPackage(),
    period: 'monthly',
    expectedOptionId: 'monthly:free-trial',
    expectedTrialCopy: '3-day free trial for eligible new subscribers',
    expectedTrialDays: 3,
    info: infoWithoutEntitlement(),
  });

  assertSelection({
    name: 'canceled Monthly checkout followed by Yearly remains fresh',
    pkg: yearlyPackage(),
    period: 'yearly',
    expectedOptionId: 'annual:free-trial',
    expectedTrialCopy: '3-day free trial for eligible new subscribers',
    expectedTrialDays: 3,
    info: infoWithoutEntitlement(),
  });

  assertSelection({
    name: 'no active entitlement means no change info',
    pkg: monthlyPackage(),
    period: 'monthly',
    expectedOptionId: 'monthly:free-trial',
    expectedTrialCopy: '3-day free trial for eligible new subscribers',
    expectedTrialDays: 3,
    expectedChangeInfo: null,
    info: infoWithoutEntitlement(),
  });

  assertSelection({
    name: 'fresh Yearly supports RevenueCat seven-day trial experiment',
    pkg: yearlyPackageWithDefault('annual:free-trial', [], 'P7D'),
    period: 'yearly',
    expectedOptionId: 'annual:free-trial',
    expectedTrialCopy: '7-day free trial for eligible new subscribers',
    expectedTrialDays: 7,
  });

  assertSelection({
    name: 'fresh Yearly respects current offering default three-day trial when multiple offers exist',
    pkg: yearlyPackageWithDefault('annual:trial-3-day', [
      option({
        id: 'annual:trial-3-day',
        productId: 'bpd_yearly',
        freePhase: { billingPeriod: { iso8601: 'P3D' }, price: { amountMicros: 0 } } as never,
      }),
      option({
        id: 'annual:trial-7-day',
        productId: 'bpd_yearly',
        freePhase: { billingPeriod: { iso8601: 'P7D' }, price: { amountMicros: 0 } } as never,
      }),
    ]),
    period: 'yearly',
    expectedOptionId: 'annual:trial-3-day',
    expectedTrialCopy: '3-day free trial for eligible new subscribers',
    expectedTrialDays: 3,
  });

  assertSelection({
    name: 'fresh Yearly respects current offering default seven-day trial when multiple offers exist',
    pkg: yearlyPackageWithDefault('annual:trial-7-day', [
      option({
        id: 'annual:trial-3-day',
        productId: 'bpd_yearly',
        freePhase: { billingPeriod: { iso8601: 'P3D' }, price: { amountMicros: 0 } } as never,
      }),
      option({
        id: 'annual:trial-7-day',
        productId: 'bpd_yearly',
        freePhase: { billingPeriod: { iso8601: 'P7D' }, price: { amountMicros: 0 } } as never,
      }),
    ]),
    period: 'yearly',
    expectedOptionId: 'annual:trial-7-day',
    expectedTrialCopy: '7-day free trial for eligible new subscribers',
    expectedTrialDays: 7,
  });

  assertSelection({
    name: 'fresh Yearly does not guess between multiple eligible trial offers without current default',
    pkg: yearlyPackageWithDefault('annual', [
      option({
        id: 'annual:trial-3-day',
        productId: 'bpd_yearly',
        freePhase: { billingPeriod: { iso8601: 'P3D' }, price: { amountMicros: 0 } } as never,
      }),
      option({
        id: 'annual:trial-7-day',
        productId: 'bpd_yearly',
        freePhase: { billingPeriod: { iso8601: 'P7D' }, price: { amountMicros: 0 } } as never,
      }),
    ]),
    period: 'yearly',
    expectedOptionId: 'annual',
    expectedTrialCopy: null,
    expectedTrialDays: null,
  });

  assertSelection({
    name: 'active subscriber uses change mode without trial',
    pkg: yearlyPackage(),
    period: 'yearly',
    expectedOptionId: 'annual',
    expectedTrialCopy: null,
    expectedChangeInfo: 'bpd_monthly',
    expectedReplacementMode: ANDROID_REPLACEMENT_MODE_MONTHLY_TO_YEARLY,
    info: infoWithActiveEntitlement('bpd_monthly:monthly'),
  });

  assertSelection({
    name: 'active monthly subscriber excludes Yearly trial default option',
    pkg: yearlyPackageWithDefault('annual:free-trial'),
    period: 'yearly',
    expectedOptionId: 'annual',
    expectedTrialCopy: null,
    expectedChangeInfo: 'bpd_monthly',
    expectedReplacementMode: ANDROID_REPLACEMENT_MODE_MONTHLY_TO_YEARLY,
    info: infoWithActiveEntitlement('bpd_monthly:monthly'),
  });

  assertSelection({
    name: 'active yearly subscriber excludes Monthly trial default option',
    pkg: monthlyPackageWithDefault('monthly:free-trial'),
    period: 'monthly',
    expectedOptionId: 'monthly',
    expectedTrialCopy: null,
    expectedChangeInfo: 'bpd_yearly',
    expectedReplacementMode: ANDROID_REPLACEMENT_MODE_YEARLY_TO_MONTHLY,
    info: infoWithActiveEntitlement('bpd_yearly:annual'),
  });

  assertSelection({
    name: 'active subscriber does not fall back to trial when base plan is missing',
    pkg: pkg({
      productId: 'bpd_monthly',
      defaultOptionId: 'monthly:free-trial',
      options: [
        option({ id: 'monthly:free-trial', productId: 'bpd_monthly' }),
      ],
    }),
    period: 'monthly',
    expectedOptionId: null,
    expectedTrialCopy: null,
    expectedChangeInfo: null,
    info: infoWithActiveEntitlement('bpd_yearly:annual'),
  });

  assertSelection({
    name: 'active subscriber base monthly product uses monthly change info',
    pkg: yearlyPackage(),
    period: 'yearly',
    expectedOptionId: 'annual',
    expectedTrialCopy: null,
    expectedChangeInfo: 'bpd_monthly',
    expectedReplacementMode: ANDROID_REPLACEMENT_MODE_MONTHLY_TO_YEARLY,
    info: infoWithActiveEntitlement('bpd_monthly'),
  });

  assertSelection({
    name: 'active subscriber yearly base-plan product uses yearly change info',
    pkg: monthlyPackage(),
    period: 'monthly',
    expectedOptionId: 'monthly',
    expectedTrialCopy: null,
    expectedChangeInfo: 'bpd_yearly',
    expectedReplacementMode: ANDROID_REPLACEMENT_MODE_YEARLY_TO_MONTHLY,
    info: infoWithActiveEntitlement('bpd_yearly:annual'),
  });

  assertSelection({
    name: 'same-plan active subscriber does not create replacement info',
    pkg: monthlyPackage(),
    period: 'monthly',
    expectedOptionId: null,
    expectedTrialCopy: null,
    expectedChangeInfo: null,
    expectedReplacementMode: null,
    info: infoWithActiveEntitlement('bpd_monthly:monthly'),
  });

  assertSelection({
    name: 'active subscriber unknown product does not guess change info',
    pkg: monthlyPackage(),
    period: 'monthly',
    expectedOptionId: null,
    expectedTrialCopy: null,
    expectedChangeInfo: null,
    info: infoWithActiveEntitlement('rc_promo_BPD Companion Pro_lifetime'),
  });

  assert(
    !infoWithoutEntitlement().entitlements.active[REVENUECAT_ENTITLEMENT_ID],
    'purchase result without active entitlement remains locked',
  );

  assert(
    !evaluateRestoreUnlock({
      supabaseUserId: 'user_a',
      revenueCatUserIdBefore: 'user_a',
      revenueCatUserIdAfterLogin: 'user_a',
      customerInfo: infoWithoutEntitlement(),
    }).access,
    'restore on clean account stays locked',
  );

  assert(
    !evaluateRestoreUnlock({
      supabaseUserId: 'user_b',
      revenueCatUserIdBefore: 'user_b',
      revenueCatUserIdAfterLogin: 'user_b',
      customerInfo: null,
      restoreError: { code: 'RECEIPT_ALREADY_IN_USE_ERROR' },
    }).access,
    'wrong app account is blocked from restoring',
  );

  assert(
    evaluateRestoreUnlock({
      supabaseUserId: 'user_a',
      revenueCatUserIdBefore: 'user_a',
      revenueCatUserIdAfterLogin: 'user_a',
      customerInfo: infoWithActiveEntitlement('bpd_yearly:annual'),
    }).access,
    'original purchaser can restore',
  );

  const paywallSelection = getAndroidPaywallSelection({
    pkg: monthlyPackage(),
    period: 'monthly',
    customerInfo: null,
  });
  const purchaseSelection = selectAndroidSubscriptionOption({
    pkg: monthlyPackage(),
    period: 'monthly',
    customerInfo: null,
  });
  assert(
    paywallSelection.selectedOptionId === purchaseSelection.selectedOptionId &&
      paywallSelection.trialCopy === purchaseSelection.trialCopy,
    'paywall and purchase use the same option selection',
  );

  return true;
}

export const androidPurchaseSelectorRegressionTestsPassed =
  assertAndroidPurchaseSelectorRegressionScenarios();
