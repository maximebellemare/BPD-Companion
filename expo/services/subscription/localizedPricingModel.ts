import type { PurchasesPackage } from '@/services/subscription/purchasesService';
import type { SubscriptionPeriod, SubscriptionPlan } from '@/types/subscription';

export function createLocalizedSubscriptionPlan(params: {
  pkg: PurchasesPackage;
  period: SubscriptionPeriod;
  fallbackProductIdentifier: string;
  androidTrialCopy?: string | null;
}): SubscriptionPlan | null {
  const { pkg, period, fallbackProductIdentifier, androidTrialCopy = null } = params;
  const localizedPrice = pkg.product.priceString;
  if (!localizedPrice) return null;
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
    androidTrialCopy,
  };
}
