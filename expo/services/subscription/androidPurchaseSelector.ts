import {
  REVENUECAT_ANDROID_MONTHLY_BASE_PLAN_ID,
  REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID,
  REVENUECAT_ANDROID_MONTHLY_TRIAL_OFFER_ID,
  REVENUECAT_ANDROID_YEARLY_BASE_PLAN_ID,
  REVENUECAT_ANDROID_YEARLY_PRODUCT_ID,
  REVENUECAT_ANDROID_YEARLY_TRIAL_OFFER_ID,
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_TRIAL_DAYS,
} from '@/constants/revenuecat';
import type {
  CustomerInfo,
  GoogleProductChangeInfo,
  PurchasesPackage,
  RevenueCatBillingPeriod,
  SubscriptionOption,
} from '@/services/subscription/purchasesService';
import type { SubscriptionPeriod } from '@/types/subscription';

export const ANDROID_TRIAL_COPY = `${REVENUECAT_TRIAL_DAYS}-day free trial for eligible new subscribers`;

type AndroidPlanConfig = {
  productId: string;
  basePlanId: string;
  offerId: string;
};

export type ParsedSubscriptionOptionId = {
  basePlanId: string | null;
  offerId: string | null;
  malformed: boolean;
};

export type AndroidPurchaseSelection = {
  subscriptionOption: SubscriptionOption | null;
  googleProductChangeInfo: GoogleProductChangeInfo | null;
  selectedOptionId: string | null;
  trialCopy: string | null;
  priceString: string;
};

function getAndroidPlanConfig(period: SubscriptionPeriod): AndroidPlanConfig {
  return period === 'yearly'
    ? {
        productId: REVENUECAT_ANDROID_YEARLY_PRODUCT_ID,
        basePlanId: REVENUECAT_ANDROID_YEARLY_BASE_PLAN_ID,
        offerId: REVENUECAT_ANDROID_YEARLY_TRIAL_OFFER_ID,
      }
    : {
        productId: REVENUECAT_ANDROID_MONTHLY_PRODUCT_ID,
        basePlanId: REVENUECAT_ANDROID_MONTHLY_BASE_PLAN_ID,
        offerId: REVENUECAT_ANDROID_MONTHLY_TRIAL_OFFER_ID,
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

function hasThreeDayFreeTrial(option: SubscriptionOption): boolean {
  const freePhasePeriod = getIsoBillingPeriod(option.freePhase?.billingPeriod ?? null);
  if (freePhasePeriod === 'P3D') return true;

  return (option.pricingPhases ?? []).some(phase => {
    const billingPeriod = getIsoBillingPeriod(phase.billingPeriod ?? null);
    const paymentMode = String(phase.offerPaymentMode ?? '').toUpperCase();
    const legacyPriceAmountMicros = (phase as { priceAmountMicros?: number | string | null }).priceAmountMicros ?? null;
    const amountMicros = phase.price?.amountMicros ?? legacyPriceAmountMicros;
    return billingPeriod === 'P3D' &&
      (paymentMode === 'FREE_TRIAL' || String(amountMicros) === '0');
  });
}

function isExactTrialOption(option: SubscriptionOption, period: SubscriptionPeriod): boolean {
  if (option.isPrepaid) return false;
  const parsed = parseSubscriptionOptionId(option.id);
  if (parsed.malformed) return false;
  const config = getAndroidPlanConfig(period);
  return optionProductId(option) === config.productId &&
    parsed.basePlanId === config.basePlanId &&
    parsed.offerId === config.offerId &&
    hasThreeDayFreeTrial(option);
}

function getDefaultNonPrepaidOption(pkg: PurchasesPackage): SubscriptionOption | null {
  if (pkg.product.defaultOption && !pkg.product.defaultOption.isPrepaid) {
    return pkg.product.defaultOption;
  }

  return (pkg.product.subscriptionOptions ?? []).find(option => option.isBasePlan && !option.isPrepaid) ??
    (pkg.product.subscriptionOptions ?? []).find(option => !option.isPrepaid) ??
    null;
}

export function getActiveEntitlementProductIdentifier(customerInfo: CustomerInfo | null): string | null {
  return customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID]?.productIdentifier ?? null;
}

export function selectAndroidSubscriptionOption(params: {
  pkg: PurchasesPackage;
  period: SubscriptionPeriod;
  customerInfo: CustomerInfo | null;
}): AndroidPurchaseSelection {
  const { pkg, period, customerInfo } = params;
  const activeProductIdentifier = getActiveEntitlementProductIdentifier(customerInfo);
  const defaultOption = getDefaultNonPrepaidOption(pkg);

  if (activeProductIdentifier) {
    return {
      subscriptionOption: defaultOption,
      googleProductChangeInfo: defaultOption
        ? { oldProductIdentifier: activeProductIdentifier }
        : null,
      selectedOptionId: defaultOption?.id ?? null,
      trialCopy: null,
      priceString: pkg.product.priceString,
    };
  }

  const exactTrialOptions = (pkg.product.subscriptionOptions ?? [])
    .filter(option => isExactTrialOption(option, period));
  const exactTrialOption = exactTrialOptions.length === 1 ? exactTrialOptions[0] : null;
  const subscriptionOption = exactTrialOption ?? defaultOption;

  return {
    subscriptionOption,
    googleProductChangeInfo: null,
    selectedOptionId: subscriptionOption?.id ?? null,
    trialCopy: exactTrialOption ? ANDROID_TRIAL_COPY : null,
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
