export type AffiliateRevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'NON_RENEWING_PURCHASE'
  | 'PRODUCT_CHANGE'
  | 'CANCELLATION'
  | 'REFUND'
  | 'REFUND_REVERSED'
  | string;

export type AffiliateCommissionInput = {
  eventType: AffiliateRevenueCatEventType;
  periodType?: string | null;
  cancelReason?: string | null;
  environment?: string | null;
  productId?: string | null;
  store?: string | null;
  priceUsd?: number | null;
  taxPercentage?: number | null;
  storeCommissionPercentage?: number | null;
  revenueCatEventId?: string | null;
  transactionId?: string | null;
  originalTransactionId?: string | null;
  affiliateCommissionPercent?: number | null;
  isSupportGrant?: boolean;
  isDuplicateRevenueCatEvent?: boolean;
  firstPaidConversionAtMs?: number | null;
  eventAtMs?: number | null;
};

export type AffiliateCommissionDecision =
  | {
      action: 'commission';
      reason: 'paid_revenue';
      priceUsd: number;
      netProceedsUsd: number;
      commissionAmountUsd: number;
    }
  | {
      action: 'negative_adjustment';
      reason: 'customer_support_refund';
      priceUsd: number;
      netProceedsUsd: number;
      commissionAmountUsd: number;
    }
  | { action: 'refund_reversed'; reason: 'refund_reversed' }
  | {
      action: 'skip';
      reason:
        | 'duplicate_revenuecat_event'
        | 'sandbox'
        | 'support_grant'
        | 'trial'
        | 'zero_or_negative_price'
        | 'non_commissionable_event'
        | 'missing_product'
        | 'unrelated_product'
        | 'missing_financial_fields'
        | 'invalid_financial_fields'
        | 'missing_event_id'
        | 'missing_transaction'
        | 'outside_subscription_commission_window';
    };

export type AffiliateRefundAdjustmentCandidate = {
  id: string;
  transactionId: string | null;
  originalTransactionId: string | null;
};

export type AffiliateRefundReversalMatch =
  | { action: 'match'; reason: 'exact_transaction' | 'original_transaction'; adjustmentId: string }
  | { action: 'skip'; reason: 'no_matching_negative_adjustment' | 'ambiguous_exact_transaction' | 'ambiguous_original_transaction' };

const COMMISSIONABLE_EVENTS = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'NON_RENEWING_PURCHASE']);
const PUBLIC_AFFILIATE_COMMISSION_PERCENT = 30;
const BPD_PRODUCT_IDENTIFIERS = new Set([
  'bpd_monthly',
  'bpd_monthly:monthly',
  'bpd_yearly',
  'bpd_yearly:annual',
  'bpd_lifetime',
  'com.maximebellemare.bpdcompanion.monthly',
  'com.maximebellemare.bpdcompanion.yearly',
  'com.maximebellemare.bpdcompanion.lifetime',
]);
const LIFETIME_PRODUCT_IDENTIFIERS = new Set([
  'bpd_lifetime',
  'com.maximebellemare.bpdcompanion.lifetime',
]);
const SUBSCRIPTION_COMMISSION_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;

function normalizeUpper(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(6));
}

export function isBpdAffiliateProduct(productId: string | null | undefined): boolean {
  return Boolean(productId && BPD_PRODUCT_IDENTIFIERS.has(productId));
}

export function isBpdLifetimeProduct(productId: string | null | undefined): boolean {
  return Boolean(productId && LIFETIME_PRODUCT_IDENTIFIERS.has(productId));
}

export function calculateNetProceedsUsd(
  priceUsd: number,
  taxPercentage: number,
  storeCommissionPercentage: number,
): number | null {
  const multiplier = 1 - taxPercentage - storeCommissionPercentage;
  if (!Number.isFinite(multiplier) || multiplier < 0) return null;
  return roundCurrency(priceUsd * multiplier);
}

export function calculateAffiliateCommissionAmountUsd(netProceedsUsd: number, affiliateCommissionPercent = 30): number {
  return roundCurrency((netProceedsUsd * affiliateCommissionPercent) / 100);
}

export function getRefundReversalAdjustmentMatch(
  transactionId: string,
  originalTransactionId: string | null | undefined,
  candidates: AffiliateRefundAdjustmentCandidate[],
): AffiliateRefundReversalMatch {
  const exactMatches = candidates.filter((candidate) => candidate.transactionId === transactionId);
  if (exactMatches.length === 1) {
    return { action: 'match', reason: 'exact_transaction', adjustmentId: exactMatches[0].id };
  }
  if (exactMatches.length > 1) return { action: 'skip', reason: 'ambiguous_exact_transaction' };

  if (!originalTransactionId) return { action: 'skip', reason: 'no_matching_negative_adjustment' };

  const originalMatches = candidates.filter((candidate) => candidate.originalTransactionId === originalTransactionId);
  if (originalMatches.length === 1) {
    return { action: 'match', reason: 'original_transaction', adjustmentId: originalMatches[0].id };
  }

  return {
    action: 'skip',
    reason: originalMatches.length > 1 ? 'ambiguous_original_transaction' : 'no_matching_negative_adjustment',
  };
}

export function getAffiliateCommissionDecision(input: AffiliateCommissionInput): AffiliateCommissionDecision {
  const eventType = normalizeUpper(input.eventType);
  const cancelReason = normalizeUpper(input.cancelReason);
  const environment = normalizeUpper(input.environment);
  const store = normalizeUpper(input.store);

  if (input.isDuplicateRevenueCatEvent) return { action: 'skip', reason: 'duplicate_revenuecat_event' };
  if (!input.revenueCatEventId) return { action: 'skip', reason: 'missing_event_id' };
  if (environment !== 'PRODUCTION') return { action: 'skip', reason: 'sandbox' };
  if (input.isSupportGrant || store === 'PROMOTIONAL') return { action: 'skip', reason: 'support_grant' };
  if (!input.productId) return { action: 'skip', reason: 'missing_product' };
  if (!isBpdAffiliateProduct(input.productId)) return { action: 'skip', reason: 'unrelated_product' };
  if (!input.transactionId) return { action: 'skip', reason: 'missing_transaction' };
  if (eventType === 'REFUND_REVERSED') return { action: 'refund_reversed', reason: 'refund_reversed' };

  const isCustomerSupportRefund =
    eventType === 'CANCELLATION' &&
    cancelReason === 'CUSTOMER_SUPPORT' &&
    isFiniteNumber(input.priceUsd) &&
    input.priceUsd < 0;

  if (!COMMISSIONABLE_EVENTS.has(eventType) && !isCustomerSupportRefund) {
    return { action: 'skip', reason: 'non_commissionable_event' };
  }

  if (eventType === 'INITIAL_PURCHASE' && normalizeUpper(input.periodType) === 'TRIAL') {
    return { action: 'skip', reason: 'trial' };
  }

  if (
    !isFiniteNumber(input.priceUsd) ||
    !isFiniteNumber(input.taxPercentage) ||
    !isFiniteNumber(input.storeCommissionPercentage)
  ) {
    return { action: 'skip', reason: 'missing_financial_fields' };
  }

  if (
    input.taxPercentage < 0 ||
    input.storeCommissionPercentage < 0 ||
    input.taxPercentage + input.storeCommissionPercentage > 1
  ) {
    return { action: 'skip', reason: 'invalid_financial_fields' };
  }

  const netProceedsUsd = calculateNetProceedsUsd(
    input.priceUsd,
    input.taxPercentage,
    input.storeCommissionPercentage,
  );
  if (netProceedsUsd === null) return { action: 'skip', reason: 'invalid_financial_fields' };

  const commissionAmountUsd = calculateAffiliateCommissionAmountUsd(netProceedsUsd, PUBLIC_AFFILIATE_COMMISSION_PERCENT);

  if (isCustomerSupportRefund) {
    return {
      action: 'negative_adjustment',
      reason: 'customer_support_refund',
      priceUsd: roundCurrency(input.priceUsd),
      netProceedsUsd,
      commissionAmountUsd,
    };
  }

  if (input.priceUsd <= 0 || netProceedsUsd <= 0 || commissionAmountUsd <= 0) {
    return { action: 'skip', reason: 'zero_or_negative_price' };
  }

  if (!isBpdLifetimeProduct(input.productId) && isFiniteNumber(input.firstPaidConversionAtMs) && isFiniteNumber(input.eventAtMs)) {
    if (input.eventAtMs - input.firstPaidConversionAtMs > SUBSCRIPTION_COMMISSION_WINDOW_MS) {
      return { action: 'skip', reason: 'outside_subscription_commission_window' };
    }
  }

  return {
    action: 'commission',
    reason: 'paid_revenue',
    priceUsd: roundCurrency(input.priceUsd),
    netProceedsUsd,
    commissionAmountUsd,
  };
}
