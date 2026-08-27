import type { PurchasesPackage } from '@/services/subscription/purchasesService';
import type { SubscriptionPeriod, SubscriptionPlan } from '@/types/subscription';
import {
  getTrialDaysFromIsoPeriod,
  getTrialEligibilityCopy,
  type TrialEligibilityStatus,
} from '@/services/subscription/trialReminderModel';

export function createLocalizedSubscriptionPlan(params: {
  pkg: PurchasesPackage;
  period: SubscriptionPeriod;
  fallbackProductIdentifier: string;
  androidTrialCopy?: string | null;
  trialDays?: number | null;
  trialEligibilityStatus?: TrialEligibilityStatus;
}): SubscriptionPlan | null {
  const { pkg, period, fallbackProductIdentifier, androidTrialCopy = null, trialEligibilityStatus = 'unknown' } = params;
  const localizedPrice = pkg.product.priceString;
  if (!localizedPrice) return null;
  const storeProduct = pkg.product as PurchasesPackage['product'] & {
    introPrice?: { period?: string | null; price?: number | null } | null;
  };
  const inferredTrialDays = trialEligibilityStatus !== 'eligible'
    ? null
    : getTrialDaysFromIsoPeriod(storeProduct.introPrice?.period ?? null);
  const trialDays = params.trialDays ?? inferredTrialDays;
  return {
    id: period,
    name: period === 'yearly' ? 'Yearly' : 'Monthly',
    period,
    price: typeof pkg.product.price === 'number' ? pkg.product.price : 0,
    priceLabel: period === 'yearly' ? `${localizedPrice}/yr` : `${localizedPrice}/mo`,
    savings: period === 'yearly' ? 'Best value' : undefined,
    popular: period === 'yearly',
    productIdentifier: pkg.product.identifier ?? fallbackProductIdentifier,
    packageIdentifier: pkg.identifier,
    androidTrialCopy: androidTrialCopy ?? (trialDays ? getTrialEligibilityCopy(trialDays) : null),
    trialDays,
    trialEligibilityStatus,
  };
}
