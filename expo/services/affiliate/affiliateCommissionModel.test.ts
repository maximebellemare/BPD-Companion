import assert from 'node:assert/strict';
import {
  calculateAffiliateCommissionAmountUsd,
  calculateNetProceedsUsd,
  getAffiliateCommissionDecision,
  getRefundReversalAdjustmentMatch,
} from './affiliateCommissionModel';

const basePaid = {
  environment: 'PRODUCTION',
  productId: 'bpd_monthly:monthly',
  store: 'PLAY_STORE',
  priceUsd: 10,
  taxPercentage: 0,
  storeCommissionPercentage: 0.15,
  revenueCatEventId: 'event-1',
  transactionId: 'txn-1',
  affiliateCommissionPercent: 30,
};

function run() {
  assert.equal(calculateNetProceedsUsd(10, 0, 0.15), 8.5, '15% store commission leaves 8.50 USD net proceeds');
  assert.equal(calculateNetProceedsUsd(10, 0.1, 0.15), 7.5, 'tax and store commission reduce net proceeds');
  assert.equal(calculateNetProceedsUsd(10.123456, 0, 0.15), 8.604938, 'ledger preserves six decimal RevenueCat precision');
  assert.equal(calculateAffiliateCommissionAmountUsd(8.604938, 30), 2.581481, 'commission preserves six decimal ledger precision');
  assert.equal(calculateAffiliateCommissionAmountUsd(8.5, 30), 2.55, 'creator earns 30% of net proceeds');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'INITIAL_PURCHASE',
    periodType: 'TRIAL',
    priceUsd: 0,
    revenueCatEventId: 'trial-event',
    transactionId: 'trial-txn',
  }), { action: 'skip', reason: 'trial' }, 'trial conversion does not create commission');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'RENEWAL',
    environment: 'SANDBOX',
    revenueCatEventId: 'sandbox-event',
  }), { action: 'skip', reason: 'sandbox' }, 'sandbox purchase is skipped');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'RENEWAL',
    revenueCatEventId: 'renewal-event',
  }), {
    action: 'commission',
    reason: 'paid_revenue',
    priceUsd: 10,
    netProceedsUsd: 8.5,
    commissionAmountUsd: 2.55,
  }, 'monthly renewal commissions on USD net proceeds');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'RENEWAL',
    affiliateCommissionPercent: 50,
    revenueCatEventId: 'public-rate-event',
    transactionId: 'public-rate-txn',
  }), {
    action: 'commission',
    reason: 'paid_revenue',
    priceUsd: 10,
    netProceedsUsd: 8.5,
    commissionAmountUsd: 2.55,
  }, 'public affiliate commission remains 30% of net proceeds');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'RENEWAL',
    productId: 'bpd_yearly:annual',
    priceUsd: 60,
    taxPercentage: 0.05,
    revenueCatEventId: 'yearly-event',
    transactionId: 'yearly-txn',
  }), {
    action: 'commission',
    reason: 'paid_revenue',
    priceUsd: 60,
    netProceedsUsd: 48,
    commissionAmountUsd: 14.4,
  }, 'yearly renewal applies tax and store commission before creator commission');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'NON_RENEWING_PURCHASE',
    productId: 'bpd_lifetime',
    priceUsd: 150,
    revenueCatEventId: 'lifetime-event',
    transactionId: 'lifetime-txn',
  }), {
    action: 'commission',
    reason: 'paid_revenue',
    priceUsd: 150,
    netProceedsUsd: 127.5,
    commissionAmountUsd: 38.25,
  }, 'lifetime earns one 30% commission on USD net proceeds');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'RENEWAL',
    priceUsd: 10,
    taxPercentage: 0,
    storeCommissionPercentage: 0.15,
    revenueCatEventId: 'foreign-currency-event',
    transactionId: 'foreign-currency-txn',
  }), {
    action: 'commission',
    reason: 'paid_revenue',
    priceUsd: 10,
    netProceedsUsd: 8.5,
    commissionAmountUsd: 2.55,
  }, 'foreign storefront metadata does not replace USD price basis');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'CANCELLATION',
    cancelReason: 'CUSTOMER_SUPPORT',
    priceUsd: -10,
    revenueCatEventId: 'refund-event',
    transactionId: 'refund-txn',
  }), {
    action: 'negative_adjustment',
    reason: 'customer_support_refund',
    priceUsd: -10,
    netProceedsUsd: -8.5,
    commissionAmountUsd: -2.55,
  }, 'CUSTOMER_SUPPORT refund creates proportional negative commission adjustment');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'CANCELLATION',
    cancelReason: 'CUSTOMER_SUPPORT',
    priceUsd: -10,
    revenueCatEventId: 'paid-refund-event',
    transactionId: 'paid-refund-txn',
  }).action, 'negative_adjustment', 'refund after payout still produces append-only negative adjustment');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'REFUND_REVERSED',
    revenueCatEventId: 'refund-reversed-event',
    transactionId: 'refund-reversed-txn',
  }), { action: 'refund_reversed', reason: 'refund_reversed' }, 'REFUND_REVERSED reverses the negative adjustment path');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'REFUND_REVERSED',
    environment: 'SANDBOX',
    revenueCatEventId: 'sandbox-reversal-event',
    transactionId: 'sandbox-reversal-txn',
  }), { action: 'skip', reason: 'sandbox' }, 'sandbox REFUND_REVERSED is skipped');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'REFUND_REVERSED',
    productId: 'other_product',
    revenueCatEventId: 'unrelated-reversal-event',
    transactionId: 'unrelated-reversal-txn',
  }), { action: 'skip', reason: 'unrelated_product' }, 'unrelated-product REFUND_REVERSED is skipped');

  assert.deepEqual(getRefundReversalAdjustmentMatch('refund-txn-b', 'original-subscription', [
    { id: 'negative-a', transactionId: 'refund-txn-a', originalTransactionId: 'original-subscription' },
    { id: 'negative-b', transactionId: 'refund-txn-b', originalTransactionId: 'original-subscription' },
  ]), {
    action: 'match',
    reason: 'exact_transaction',
    adjustmentId: 'negative-b',
  }, 'exact transaction REFUND_REVERSED reverses the correct negative adjustment');

  assert.deepEqual(getRefundReversalAdjustmentMatch('missing-exact', 'original-subscription', [
    { id: 'negative-a', transactionId: 'refund-txn-a', originalTransactionId: 'original-subscription' },
    { id: 'negative-b', transactionId: 'refund-txn-b', originalTransactionId: 'original-subscription' },
  ]), {
    action: 'skip',
    reason: 'ambiguous_original_transaction',
  }, 'ambiguous original-transaction fallback does not guess');

  assert.deepEqual(getRefundReversalAdjustmentMatch('missing-exact', 'single-original', [
    { id: 'negative-c', transactionId: 'refund-txn-c', originalTransactionId: 'single-original' },
  ]), {
    action: 'match',
    reason: 'original_transaction',
    adjustmentId: 'negative-c',
  }, 'single original-transaction fallback can be reversed');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'RENEWAL',
    isDuplicateRevenueCatEvent: true,
    revenueCatEventId: 'duplicate-event',
  }), { action: 'skip', reason: 'duplicate_revenuecat_event' }, 'duplicate RevenueCat delivery is idempotently skipped');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'RENEWAL',
    priceUsd: null,
    revenueCatEventId: 'missing-price-event',
  }), { action: 'skip', reason: 'missing_financial_fields' }, 'missing price is reviewable skip');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'RENEWAL',
    taxPercentage: null,
    revenueCatEventId: 'missing-tax-event',
  }), { action: 'skip', reason: 'missing_financial_fields' }, 'missing tax percentage is reviewable skip');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'RENEWAL',
    storeCommissionPercentage: null,
    revenueCatEventId: 'missing-commission-event',
  }), { action: 'skip', reason: 'missing_financial_fields' }, 'missing store commission is reviewable skip');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'RENEWAL',
    firstPaidConversionAtMs: Date.UTC(2025, 0, 1),
    eventAtMs: Date.UTC(2026, 1, 1),
    revenueCatEventId: 'late-renewal-event',
  }), { action: 'skip', reason: 'outside_subscription_commission_window' }, 'subscription commission stops after 12 months');

  assert.deepEqual(getAffiliateCommissionDecision({
    ...basePaid,
    eventType: 'RENEWAL',
    store: 'PROMOTIONAL',
    revenueCatEventId: 'support-grant-event',
  }), { action: 'skip', reason: 'support_grant' }, 'support/promotional grant is skipped');
}

run();
