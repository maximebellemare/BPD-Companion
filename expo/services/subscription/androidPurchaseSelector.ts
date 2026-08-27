import {
  REVENUECAT_ANDROID_MONTHLY_BASE_PLAN_ID,
  REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID,
  REVENUECAT_ANDROID_YEARLY_BASE_PLAN_ID,
  REVENUECAT_ANDROID_YEARLY_PRODUCT_ID,
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_MONTHLY_PRODUCT_ID,
  REVENUECAT_YEARLY_PRODUCT_ID,
} from '@/constants/revenuecat';
import { getTrialDaysFromIsoPeriod, getTrialEligibilityCopy } from '@/services/subscription/trialReminderModel';
import type {
  CustomerInfo,
  PurchasesPackage,
  RevenueCatBillingPeriod,
  StoreProductChangeInfo,
  SubscriptionOption,
} from '@/services/subscription/purchasesService';
import type { SubscriptionPeriod } from '@/types/subscription';

type AndroidPlanConfig = {
  productId: string;
  basePlanId: string;
};

export type ParsedSubscriptionOptionId = {
  basePlanId: string | null;
  offerId: string | null;
  malformed: boolean;
};

export type AndroidPurchaseSelection = {
  subscriptionOption: SubscriptionOption | null;
  googleProductChangeInfo: StoreProductChangeInfo | null;
  selectedOptionId: string | null;
  trialCopy: string | null;
  trialDays: number | null;
  priceString: string;
};

type StoreReplacementMode = NonNullable<StoreProductChangeInfo['replacementMode']>;

export const ANDROID_REPLACEMENT_MODE_MONTHLY_TO_YEARLY = 'DEFERRED' as StoreReplacementMode;
export const ANDROID_REPLACEMENT_MODE_YEARLY_TO_MONTHLY = 'DEFERRED' as StoreReplacementMode;

function getAndroidPlanConfig(period: SubscriptionPeriod): AndroidPlanConfig {
  return period === 'yearly'
    ? {
        productId: REVENUECAT_ANDROID_YEARLY_PRODUCT_ID,
        basePlanId: REVENUECAT_ANDROID_YEARLY_BASE_PLAN_ID,
      }
    : {
        productId: REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID,
        basePlanId: REVENUECAT_ANDROID_MONTHLY_BASE_PLAN_ID,
      };
}

export function parseSubscriptionOptionId(optionId: string | null | undefined): ParsedSubscriptionOptionId {
  if (!optionId) {
    return { basePlanId: null, offerId: null, malformed: true };
  }

  const parts = optionId.split(':');
  if (parts.length === 1 && parts[0]) {
    return { basePlanId: parts[0], offerId: null, malformed: false };
  }

  if (parts.length === 2 && parts[0] && parts[1]) {
    return { basePlanId: parts[0], offerId: parts[1], malformed: false };
  }

  return { basePlanId: null, offerId: null, malformed: true };
}

function optionProductId(option: SubscriptionOption): string | null {
  return option.productId ?? option.storeProductId ?? null;
}

function getIsoBillingPeriod(period: RevenueCatBillingPeriod | null | undefined): string | null {
  if (!period) return null;
  return typeof period === 'string' ? period : period.iso8601 ?? null;
}

function getTrialDaysFromSubscriptionOption(option: SubscriptionOption): number | null {
  const freePhasePeriod = getIsoBillingPeriod(option.freePhase?.billingPeriod ?? null);
  const freePhaseDays = getTrialDaysFromIsoPeriod(freePhasePeriod);
  if (freePhaseDays) return freePhaseDays;

  for (const phase of option.pricingPhases ?? []) {
    const billingPeriod = getIsoBillingPeriod(phase.billingPeriod ?? null);
    const paymentMode = String(phase.offerPaymentMode ?? '').toUpperCase();
    const legacyPriceAmountMicros = (phase as { priceAmountMicros?: number | string | null }).priceAmountMicros ?? null;
    const amountMicros = phase.price?.amountMicros ?? legacyPriceAmountMicros;
    if (paymentMode === 'FREE_TRIAL' || String(amountMicros) === '0') {
      const days = getTrialDaysFromIsoPeriod(billingPeriod);
      if (days) return days;
    }
  }

  return null;
}

function hasAnyFreeTrial(option: SubscriptionOption): boolean {
  if (option.freePhase) return true;

  return (option.pricingPhases ?? []).some(phase => {
    const paymentMode = String(phase.offerPaymentMode ?? '').toUpperCase();
    const legacyPriceAmountMicros = (phase as { priceAmountMicros?: number | string | null }).priceAmountMicros ?? null;
    const amountMicros = phase.price?.amountMicros ?? legacyPriceAmountMicros;
    return paymentMode === 'FREE_TRIAL' || String(amountMicros) === '0';
  });
}

function isExactTrialOption(option: SubscriptionOption, period: SubscriptionPeriod): boolean {
  if (option.isPrepaid) return false;
  const parsed = parseSubscriptionOptionId(option.id);
  if (parsed.malformed) return false;
  const config = getAndroidPlanConfig(period);
  return optionProductId(option) === config.productId &&
    parsed.basePlanId === config.basePlanId &&
    parsed.offerId !== null &&
    !!getTrialDaysFromSubscriptionOption(option);
}

function isExactBasePlanOption(option: SubscriptionOption, period: SubscriptionPeriod): boolean {
  if (option.isPrepaid || hasAnyFreeTrial(option)) return false;
  const parsed = parseSubscriptionOptionId(option.id);
  if (parsed.malformed) return false;
  const config = getAndroidPlanConfig(period);
  return optionProductId(option) === config.productId &&
    parsed.basePlanId === config.basePlanId &&
    parsed.offerId === null;
}

function getDefaultNonPrepaidOption(pkg: PurchasesPackage): SubscriptionOption | null {
  if (pkg.product.defaultOption && !pkg.product.defaultOption.isPrepaid && !hasAnyFreeTrial(pkg.product.defaultOption)) {
    return pkg.product.defaultOption;
  }

  return (pkg.product.subscriptionOptions ?? []).find(option => option.isBasePlan && !option.isPrepaid && !hasAnyFreeTrial(option)) ??
    (pkg.product.subscriptionOptions ?? []).find(option => !option.isPrepaid && !hasAnyFreeTrial(option)) ??
    null;
}

function getCurrentOfferingTrialOption(pkg: PurchasesPackage, period: SubscriptionPeriod): SubscriptionOption | null {
  const defaultOption = pkg.product.defaultOption ?? null;
  if (defaultOption && isExactTrialOption(defaultOption, period)) {
    return defaultOption;
  }

  const exactTrialOptions = (pkg.product.subscriptionOptions ?? [])
    .filter(option => isExactTrialOption(option, period));
  return exactTrialOptions.length === 1 ? exactTrialOptions[0] : null;
}

function getActiveSubscriberTargetOption(pkg: PurchasesPackage, period: SubscriptionPeriod): SubscriptionOption | null {
  const options = pkg.product.subscriptionOptions ?? [];
  const exactBasePlan = options.find(option => isExactBasePlanOption(option, period));
  if (exactBasePlan) return exactBasePlan;

  if (pkg.product.defaultOption && isExactBasePlanOption(pkg.product.defaultOption, period)) {
    return pkg.product.defaultOption;
  }

  return null;
}

export function getActiveEntitlementProductIdentifier(customerInfo: CustomerInfo | null): string | null {
  return customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID]?.productIdentifier ?? null;
}

export function getAndroidGoogleProductIdentifier(productIdentifier: string | null | undefined): string | null {
  if (
    productIdentifier === REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID ||
    productIdentifier === REVENUECAT_MONTHLY_PRODUCT_ID ||
    productIdentifier === `${REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID}:${REVENUECAT_ANDROID_MONTHLY_BASE_PLAN_ID}`
  ) {
    return REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID;
  }

  if (
    productIdentifier === REVENUECAT_ANDROID_YEARLY_PRODUCT_ID ||
    productIdentifier === REVENUECAT_YEARLY_PRODUCT_ID ||
    productIdentifier === `${REVENUECAT_ANDROID_YEARLY_PRODUCT_ID}:${REVENUECAT_ANDROID_YEARLY_BASE_PLAN_ID}`
  ) {
    return REVENUECAT_ANDROID_YEARLY_PRODUCT_ID;
  }

  return null;
}

function getSelectedGoogleProductIdentifier(period: SubscriptionPeriod): string {
  return period === 'yearly'
    ? REVENUECAT_ANDROID_YEARLY_PRODUCT_ID
    : REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID;
}

export function getAndroidReplacementMode(params: {
  activeGoogleProductIdentifier: string | null;
  selectedPeriod: SubscriptionPeriod;
}): StoreReplacementMode | null {
  const selectedGoogleProductIdentifier = getSelectedGoogleProductIdentifier(params.selectedPeriod);

  if (!params.activeGoogleProductIdentifier || params.activeGoogleProductIdentifier === selectedGoogleProductIdentifier) {
    return null;
  }

  if (
    params.activeGoogleProductIdentifier === REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID &&
    selectedGoogleProductIdentifier === REVENUECAT_ANDROID_YEARLY_PRODUCT_ID
  ) {
    return ANDROID_REPLACEMENT_MODE_MONTHLY_TO_YEARLY;
  }

  if (
    params.activeGoogleProductIdentifier === REVENUECAT_ANDROID_YEARLY_PRODUCT_ID &&
    selectedGoogleProductIdentifier === REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID
  ) {
    return ANDROID_REPLACEMENT_MODE_YEARLY_TO_MONTHLY;
  }

  return null;
}

export function selectAndroidSubscriptionOption(params: {
  pkg: PurchasesPackage;
  period: SubscriptionPeriod;
  customerInfo: CustomerInfo | null;
}): AndroidPurchaseSelection {
  const { pkg, period, customerInfo } = params;
  const activeProductIdentifier = getActiveEntitlementProductIdentifier(customerInfo);
  const activeGoogleProductIdentifier = getAndroidGoogleProductIdentifier(activeProductIdentifier);
  const replacementMode = getAndroidReplacementMode({
    activeGoogleProductIdentifier,
    selectedPeriod: period,
  });
  const defaultOption = getDefaultNonPrepaidOption(pkg);

  if (activeProductIdentifier) {
    const activeSubscriberOption = getActiveSubscriberTargetOption(pkg, period);
    if (!activeSubscriberOption || !activeGoogleProductIdentifier || !replacementMode) {
      return {
        subscriptionOption: null,
        googleProductChangeInfo: null,
        selectedOptionId: null,
        trialCopy: null,
        trialDays: null,
        priceString: pkg.product.priceString,
      };
    }

    return {
      subscriptionOption: activeSubscriberOption,
      googleProductChangeInfo: { oldProductIdentifier: activeGoogleProductIdentifier, replacementMode },
      selectedOptionId: activeSubscriberOption?.id ?? null,
      trialCopy: null,
      trialDays: null,
      priceString: pkg.product.priceString,
    };
  }

  const exactTrialOption = getCurrentOfferingTrialOption(pkg, period);
  const subscriptionOption = exactTrialOption ?? defaultOption;

  return {
    subscriptionOption,
    googleProductChangeInfo: null,
    selectedOptionId: subscriptionOption?.id ?? null,
    trialCopy: exactTrialOption ? getTrialEligibilityCopy(getTrialDaysFromSubscriptionOption(exactTrialOption)) : null,
    trialDays: exactTrialOption ? getTrialDaysFromSubscriptionOption(exactTrialOption) : null,
    priceString: pkg.product.priceString,
  };
}

export function getAndroidPaywallSelection(params: {
  pkg: PurchasesPackage;
  period: SubscriptionPeriod;
  customerInfo: CustomerInfo | null;
}): AndroidPurchaseSelection {
  return selectAndroidSubscriptionOption(params);
}
