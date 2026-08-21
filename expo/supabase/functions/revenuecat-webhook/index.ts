// @ts-nocheck
// eslint-disable-next-line import/no-unresolved
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  buildCancelledTrialWinbackSchedule,
  isBpdProductIdentifier,
  isValidSupabaseUserId,
  isVoluntaryTrialCancellation,
  normalizeRevenueCatWebhookEvent,
  shouldCancelPendingWinbackForEvent,
} from '../_shared/revenueCatWinbackModel.ts';

type JsonResponseBody = Record<string, unknown>;
type RevenueCatPayloadRecord = Record<string, unknown>;

const COMMISSIONABLE_REVENUECAT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'NON_RENEWING_PURCHASE',
]);

const REFUND_CANCEL_REASONS = new Set([
  'CUSTOMER_SUPPORT',
  'REFUND',
]);

const AFFILIATE_COMMISSION_HOLD_DAYS = 45;
const PUBLIC_AFFILIATE_COMMISSION_PERCENT = 30;
const AFFILIATE_SUBSCRIPTION_COMMISSION_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;
const LIFETIME_PRODUCT_IDENTIFIERS = new Set([
  'bpd_lifetime',
  'com.maximebellemare.bpdcompanion.lifetime',
]);

function jsonResponse(body: JsonResponseBody, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function timingSafeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  let diff = leftBytes.length ^ rightBytes.length;
  const maxLength = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < maxLength; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return diff === 0;
}

function getBearerOrRawAuthorization(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : header.trim();
}

function verifyAuthorization(request: Request): boolean {
  const expected = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  if (!expected) {
    console.error('[RevenueCatWebhook] Missing REVENUECAT_WEBHOOK_AUTH secret.');
    return false;
  }
  const received = getBearerOrRawAuthorization(request);
  return Boolean(received && timingSafeEqual(received, expected));
}

async function verifyOptionalRevenueCatSignature(_request: Request, _rawBody: string): Promise<boolean> {
  const signingSecret = Deno.env.get('REVENUECAT_WEBHOOK_SIGNING_SECRET');
  if (!signingSecret) return true;

  // Follow-up: enable RevenueCat HMAC verification here after confirming the
  // account's exact signature header format and timestamp payload contract.
  // Keep using rawBody before JSON parsing when that secret is configured.
  console.error('[RevenueCatWebhook] HMAC secret is configured, but HMAC verification is not implemented yet.');
  return false;
}

function createSupabaseAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service-role configuration.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function storeRevenueCatEvent(supabase: ReturnType<typeof createSupabaseAdminClient>, event, raw: unknown): Promise<boolean> {
  const { error } = await supabase
    .from('revenuecat_events')
    .insert({
      event_id: event.eventId,
      app_user_id: isValidSupabaseUserId(event.appUserId) ? event.appUserId : null,
      event_type: event.eventType,
      period_type: event.periodType,
      cancel_reason: event.cancelReason,
      product_id: event.productId,
      store: event.store,
      purchased_at: event.purchasedAt,
      expiration_at: event.expirationAt,
      raw,
    });

  if (!error) return false;
  if (error.code === '23505') return true;
  throw new Error(error.message);
}

async function userExists(supabase: ReturnType<typeof createSupabaseAdminClient>, userId: string): Promise<boolean> {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) return false;
  return Boolean(data.user);
}

async function hasMarketingConsent(supabase: ReturnType<typeof createSupabaseAdminClient>, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('marketing_preferences')
    .select('marketing_opt_in, marketing_unsubscribed_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.marketing_opt_in === true && data.marketing_unsubscribed_at === null;
}

function asEventRecord(raw: unknown): RevenueCatPayloadRecord {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const payload = raw as RevenueCatPayloadRecord;
  const event = payload.event;
  return event && typeof event === 'object' && !Array.isArray(event)
    ? event as RevenueCatPayloadRecord
    : payload;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asUpperString(value: unknown): string | null {
  return asString(value)?.toUpperCase() ?? null;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getRevenueCatEnvironment(raw: unknown): string | null {
  const event = asEventRecord(raw);
  return asUpperString(event.environment);
}

function getRevenueCatTransactionId(_event: ReturnType<typeof normalizeRevenueCatWebhookEvent>, raw: unknown): string | null {
  const record = asEventRecord(raw);
  return asString(record.transaction_id)
    ?? asString(record.store_transaction_id)
    ?? null;
}

function getRevenueCatOriginalTransactionId(raw: unknown): string | null {
  const event = asEventRecord(raw);
  return asString(event.original_transaction_id)
    ?? asString(event.original_store_transaction_id)
    ?? null;
}

function getRevenueCatPriceUsd(raw: unknown): number | null {
  const event = asEventRecord(raw);
  return asFiniteNumber(event.price);
}

function getRevenueCatTaxPercentage(raw: unknown): number | null {
  const event = asEventRecord(raw);
  return asFiniteNumber(event.tax_percentage);
}

function getRevenueCatStoreCommissionPercentage(raw: unknown): number | null {
  const event = asEventRecord(raw);
  return asFiniteNumber(event.commission_percentage);
}

function getRevenueCatPurchasedCurrency(raw: unknown): string | null {
  const event = asEventRecord(raw);
  return asUpperString(event.currency)
    ?? asUpperString(event.price_currency)
    ?? asUpperString(event.currency_code);
}

function getRevenueCatPriceInPurchasedCurrency(raw: unknown): number | null {
  const event = asEventRecord(raw);
  return asFiniteNumber(event.price_in_purchased_currency);
}

function isInternalAffiliateTestEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? '').toLowerCase();
  return normalized.includes('+test') ||
    normalized.includes('internal') ||
    normalized.endsWith('@example.com') ||
    normalized.endsWith('@example.org') ||
    normalized.endsWith('@example.net');
}

function isBpdLifetimeProduct(productId: string | null): boolean {
  return Boolean(productId && LIFETIME_PRODUCT_IDENTIFIERS.has(productId));
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(6));
}

function calculateNetProceedsUsd(priceUsd: number, taxPercentage: number, storeCommissionPercentage: number): number | null {
  const multiplier = 1 - taxPercentage - storeCommissionPercentage;
  if (!Number.isFinite(multiplier) || multiplier < 0) return null;
  return roundCurrency(priceUsd * multiplier);
}

function calculateAffiliateCommissionAmountUsd(netProceedsUsd: number, commissionPercent: number): number {
  return roundCurrency((netProceedsUsd * commissionPercent) / 100);
}

function getEventTimeMs(event: ReturnType<typeof normalizeRevenueCatWebhookEvent>): number | null {
  const candidate = event?.purchasedAt ?? event?.eventAt ?? null;
  if (!candidate) return null;
  const parsed = new Date(candidate).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

async function getFirstPaidConversionTimeMs(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from('revenuecat_events')
    .select('event_type, period_type, product_id, purchased_at, raw')
    .eq('app_user_id', userId)
    .in('event_type', Array.from(COMMISSIONABLE_REVENUECAT_EVENTS))
    .order('purchased_at', { ascending: true, nullsFirst: false })
    .limit(200);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    if (row.period_type === 'TRIAL') continue;
    if (row.product_id && !isBpdProductIdentifier(row.product_id)) continue;
    const raw = row.raw;
    if (getRevenueCatEnvironment(raw) !== 'PRODUCTION') continue;
    const priceUsd = getRevenueCatPriceUsd(raw);
    if (priceUsd === null || priceUsd <= 0) continue;
    const time = new Date(row.purchased_at).getTime();
    if (Number.isFinite(time)) return time;
  }

  return null;
}

async function findExistingCommissionForTransaction(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  transactionId: string,
  originalTransactionId: string | null,
) {
  const exact = await supabase
    .from('affiliate_commissions')
    .select('id, affiliate_id, user_id, price_usd, net_proceeds_usd, commission_percent, commission_amount, currency, status')
    .eq('transaction_id', transactionId)
    .gt('commission_amount', 0)
    .order('created_at', { ascending: true })
    .limit(2);

  if (exact.error) throw new Error(exact.error.message);
  if ((exact.data?.length ?? 0) === 1) return { status: 'matched', data: exact.data[0] };
  if ((exact.data?.length ?? 0) > 1) return { status: 'ambiguous', data: null };

  if (!originalTransactionId) return { status: 'no_match', data: null };

  const byOriginal = await supabase
    .from('affiliate_commissions')
    .select('id, affiliate_id, user_id, price_usd, net_proceeds_usd, commission_percent, commission_amount, currency, status')
    .eq('original_transaction_id', originalTransactionId)
    .gt('commission_amount', 0)
    .order('created_at', { ascending: true })
    .limit(2);

  if (byOriginal.error) throw new Error(byOriginal.error.message);
  if ((byOriginal.data?.length ?? 0) === 1) return { status: 'matched', data: byOriginal.data[0] };
  if ((byOriginal.data?.length ?? 0) > 1) return { status: 'ambiguous', data: null };
  return { status: 'no_match', data: null };
}

async function findExistingNegativeAdjustmentForTransaction(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  transactionId: string,
  originalTransactionId: string | null,
) {
  const exact = await supabase
    .from('affiliate_commissions')
    .select('id, affiliate_id, user_id, price_usd, net_proceeds_usd, commission_percent, commission_amount, currency, status')
    .eq('transaction_id', transactionId)
    .lt('commission_amount', 0)
    .order('created_at', { ascending: false })
    .limit(2);

  if (exact.error) throw new Error(exact.error.message);
  if ((exact.data?.length ?? 0) === 1) return { status: 'matched', data: exact.data[0] };
  if ((exact.data?.length ?? 0) > 1) return { status: 'ambiguous', data: null };

  if (!originalTransactionId) return { status: 'no_match', data: null };

  const byOriginal = await supabase
    .from('affiliate_commissions')
    .select('id, affiliate_id, user_id, price_usd, net_proceeds_usd, commission_percent, commission_amount, currency, status')
    .eq('original_transaction_id', originalTransactionId)
    .lt('commission_amount', 0)
    .order('created_at', { ascending: false })
    .limit(2);

  if (byOriginal.error) throw new Error(byOriginal.error.message);
  if ((byOriginal.data?.length ?? 0) === 1) return { status: 'matched', data: byOriginal.data[0] };
  if ((byOriginal.data?.length ?? 0) > 1) return { status: 'ambiguous', data: null };
  return { status: 'no_match', data: null };
}

async function handleAffiliateCommission(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  event: ReturnType<typeof normalizeRevenueCatWebhookEvent>,
  raw: unknown,
): Promise<string> {
  if (!event || !event.appUserId || !isValidSupabaseUserId(event.appUserId)) return 'skipped_invalid_user';
  if (!event.eventId) return 'skipped_missing_event_id';

  const transactionId = getRevenueCatTransactionId(event, raw);
  if (!transactionId) return 'skipped_missing_transaction';
  const originalTransactionId = getRevenueCatOriginalTransactionId(raw);

  const { data: existingLedgerEntry, error: existingLedgerEntryError } = await supabase
    .from('affiliate_commissions')
    .select('id')
    .eq('revenuecat_event_id', event.eventId)
    .maybeSingle();

  if (existingLedgerEntryError) throw new Error(existingLedgerEntryError.message);
  if (existingLedgerEntry) return 'skipped_duplicate_commission';

  if (event.eventType === 'REFUND_REVERSED') {
    if (getRevenueCatEnvironment(raw) !== 'PRODUCTION') return 'skipped_non_production_refund_reversed';
    if (!event.productId || !isBpdProductIdentifier(event.productId)) return 'skipped_unrelated_refund_reversed_product';

    const negativeAdjustmentMatch = await findExistingNegativeAdjustmentForTransaction(supabase, transactionId, originalTransactionId);
    if (negativeAdjustmentMatch.status === 'ambiguous') return 'refund_reversed_ambiguous_adjustment';
    if (negativeAdjustmentMatch.status !== 'matched') return 'refund_reversed_no_adjustment';
    const existingNegativeAdjustment = negativeAdjustmentMatch.data;

    const earnedAt = event.eventAt ?? new Date().toISOString();
    const { error } = await supabase
      .from('affiliate_commissions')
      .insert({
        affiliate_id: existingNegativeAdjustment.affiliate_id,
        user_id: existingNegativeAdjustment.user_id,
        revenuecat_event_id: event.eventId,
        event_type: event.eventType,
        product_id: event.productId,
        store: event.store,
        transaction_id: transactionId,
        original_transaction_id: originalTransactionId,
        price_usd: Math.abs(Number(existingNegativeAdjustment.price_usd)),
        net_proceeds_usd: Math.abs(Number(existingNegativeAdjustment.net_proceeds_usd)),
        currency: 'USD',
        commission_percent: Number(existingNegativeAdjustment.commission_percent) || 30,
        commission_amount: Math.abs(Number(existingNegativeAdjustment.commission_amount)),
        status: 'approved',
        earned_at: earnedAt,
        available_at: earnedAt,
        metadata: {
          source: 'revenuecat_webhook',
          adjustment_type: 'refund_reversed',
          reverses_negative_adjustment_id: existingNegativeAdjustment.id,
          original_transaction_id: originalTransactionId,
        },
      });
    if (error) {
      if (error.code === '23505') return 'skipped_duplicate_commission';
      throw new Error(error.message);
    }
    return 'refund_reversed_adjustment';
  }

  const priceUsd = getRevenueCatPriceUsd(raw);
  const taxPercentage = getRevenueCatTaxPercentage(raw);
  const storeCommissionPercentage = getRevenueCatStoreCommissionPercentage(raw);
  const purchasedCurrency = getRevenueCatPurchasedCurrency(raw);
  const priceInPurchasedCurrency = getRevenueCatPriceInPurchasedCurrency(raw);

  const isCustomerSupportRefund =
    event.eventType === 'CANCELLATION' &&
    event.cancelReason &&
    REFUND_CANCEL_REASONS.has(event.cancelReason) &&
    priceUsd !== null &&
    priceUsd < 0;

  if (isCustomerSupportRefund) {
    if (getRevenueCatEnvironment(raw) !== 'PRODUCTION') return 'skipped_non_production_refund';
    if (!event.productId || !isBpdProductIdentifier(event.productId)) return 'skipped_unrelated_refund_product';
    if (priceUsd === null || taxPercentage === null || storeCommissionPercentage === null) return 'skipped_missing_refund_financial_fields';
    if (taxPercentage < 0 || storeCommissionPercentage < 0 || taxPercentage + storeCommissionPercentage > 1) {
      return 'skipped_invalid_refund_financial_fields';
    }

    const existingMatch = await findExistingCommissionForTransaction(supabase, transactionId, originalTransactionId);
    if (existingMatch.status === 'ambiguous') return 'refund_ambiguous_commission';
    if (existingMatch.status !== 'matched') return 'refund_no_commission';
    const existing = existingMatch.data;

    const netProceedsUsd = calculateNetProceedsUsd(priceUsd, taxPercentage, storeCommissionPercentage);
    if (netProceedsUsd === null || netProceedsUsd >= 0) return 'skipped_invalid_refund_financial_fields';
    const commissionPercent = Number(existing.commission_percent) || 30;
    const commissionAmount = calculateAffiliateCommissionAmountUsd(netProceedsUsd, commissionPercent);
    if (commissionAmount >= 0) return 'skipped_invalid_refund_financial_fields';

    const earnedAt = event.eventAt ?? new Date().toISOString();
    const { error } = await supabase
      .from('affiliate_commissions')
      .insert({
        affiliate_id: existing.affiliate_id,
        user_id: existing.user_id,
        revenuecat_event_id: event.eventId,
        event_type: event.eventType,
        product_id: event.productId,
        store: event.store,
        transaction_id: transactionId,
        original_transaction_id: originalTransactionId,
        price_usd: roundCurrency(priceUsd),
        net_proceeds_usd: netProceedsUsd,
        currency: 'USD',
        commission_percent: commissionPercent,
        commission_amount: commissionAmount,
        status: 'approved',
        earned_at: earnedAt,
        available_at: earnedAt,
        metadata: {
          source: 'revenuecat_webhook',
          adjustment_type: 'customer_support_refund',
          related_commission_id: existing.id,
          original_transaction_id: originalTransactionId,
          price_in_purchased_currency: priceInPurchasedCurrency,
          purchased_currency: purchasedCurrency,
          tax_percentage: taxPercentage,
          store_commission_percentage: storeCommissionPercentage,
        },
      });
    if (error) {
      if (error.code === '23505') return 'skipped_duplicate_commission';
      throw new Error(error.message);
    }
    return 'refund_negative_adjustment';
  }

  if (!COMMISSIONABLE_REVENUECAT_EVENTS.has(event.eventType)) return 'skipped_non_commissionable';
  if (event.eventType === 'INITIAL_PURCHASE' && event.periodType === 'TRIAL') return 'skipped_trial';
  if (event.eventType === 'PRODUCT_CHANGE') return 'skipped_product_change';
  if (getRevenueCatEnvironment(raw) !== 'PRODUCTION') return 'skipped_non_production';
  if (!event.productId) return 'skipped_missing_product';
  if (!isBpdProductIdentifier(event.productId)) return 'skipped_unrelated_product';
  if (event.store === 'PROMOTIONAL') return 'skipped_support_grant';
  if (priceUsd === null || taxPercentage === null || storeCommissionPercentage === null) return 'skipped_missing_financial_fields';
  if (taxPercentage < 0 || storeCommissionPercentage < 0 || taxPercentage + storeCommissionPercentage > 1) {
    return 'skipped_invalid_financial_fields';
  }

  const netProceedsUsd = calculateNetProceedsUsd(priceUsd, taxPercentage, storeCommissionPercentage);
  if (netProceedsUsd === null) return 'skipped_invalid_financial_fields';
  if (priceUsd <= 0 || netProceedsUsd <= 0) return 'skipped_zero_revenue';

  const { data: affiliateUser, error: affiliateUserError } = await supabase
    .from('affiliate_users')
    .select('affiliate_id')
    .eq('user_id', event.appUserId)
    .maybeSingle();

  if (affiliateUserError) throw new Error(affiliateUserError.message);
  if (!affiliateUser?.affiliate_id) return 'skipped_no_affiliate';

  const { data: affiliate, error: affiliateError } = await supabase
    .from('affiliates')
    .select('id, email, commission_percent, status')
    .eq('id', affiliateUser.affiliate_id)
    .maybeSingle();

  if (affiliateError) throw new Error(affiliateError.message);
  if (!affiliate || affiliate.status !== 'active') return 'skipped_inactive_affiliate';

  const { data: userData } = await supabase.auth.admin.getUserById(event.appUserId);
  const purchaserEmail = userData.user?.email ?? null;
  if (isInternalAffiliateTestEmail(purchaserEmail)) return 'skipped_internal_test_purchase';
  if (purchaserEmail && affiliate.email && purchaserEmail.toLowerCase() === String(affiliate.email).toLowerCase()) {
    return 'skipped_self_referral';
  }

  const commissionPercent = PUBLIC_AFFILIATE_COMMISSION_PERCENT;
  const commissionAmount = calculateAffiliateCommissionAmountUsd(netProceedsUsd, commissionPercent);
  if (commissionAmount <= 0) return 'skipped_zero_commission';

  const earnedAt = event.eventAt ?? event.purchasedAt ?? new Date().toISOString();
  if (!isBpdLifetimeProduct(event.productId)) {
    const firstPaidConversionTimeMs = await getFirstPaidConversionTimeMs(supabase, event.appUserId);
    const eventTimeMs = getEventTimeMs(event);
    if (firstPaidConversionTimeMs !== null && eventTimeMs !== null && eventTimeMs - firstPaidConversionTimeMs > AFFILIATE_SUBSCRIPTION_COMMISSION_WINDOW_MS) {
      return 'skipped_outside_subscription_commission_window';
    }
  }
  const availableAt = new Date(new Date(earnedAt).getTime() + AFFILIATE_COMMISSION_HOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('affiliate_commissions')
    .insert({
      affiliate_id: affiliate.id,
      user_id: event.appUserId,
      revenuecat_event_id: event.eventId,
      event_type: event.eventType,
      product_id: event.productId,
      store: event.store,
      transaction_id: transactionId,
      original_transaction_id: originalTransactionId,
      price_usd: roundCurrency(priceUsd),
      net_proceeds_usd: netProceedsUsd,
      currency: 'USD',
      commission_percent: commissionPercent,
      commission_amount: commissionAmount,
      status: 'pending',
      earned_at: earnedAt,
      available_at: availableAt,
      metadata: {
        source: 'revenuecat_webhook',
        period_type: event.periodType,
        original_transaction_id: originalTransactionId,
        price_in_purchased_currency: priceInPurchasedCurrency,
        purchased_currency: purchasedCurrency,
        tax_percentage: taxPercentage,
        store_commission_percentage: storeCommissionPercentage,
      },
    });

  if (error) {
    if (error.code === '23505') return 'skipped_duplicate_commission';
    throw new Error(error.message);
  }

  return 'commission_created';
}

async function cancelPendingWinbackForUser(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  reason: string,
): Promise<number> {
  const { data, error } = await supabase.rpc('cancel_pending_winback_for_user', {
    p_user_id: userId,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  return typeof data === 'number' ? data : 0;
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  if (!verifyAuthorization(request)) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  const rawBody = await request.text();
  if (!(await verifyOptionalRevenueCatSignature(request, rawBody))) {
    return jsonResponse({ error: 'invalid_signature' }, 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  const event = normalizeRevenueCatWebhookEvent(payload);
  if (!event) {
    return jsonResponse({ error: 'invalid_revenuecat_event' }, 400);
  }

  try {
    const supabase = createSupabaseAdminClient();
    const duplicate = await storeRevenueCatEvent(supabase, event, payload);

    const affiliateCommissionAction = await handleAffiliateCommission(supabase, event, payload);

    if (shouldCancelPendingWinbackForEvent(event) && event.appUserId) {
      const cancelled = await cancelPendingWinbackForUser(supabase, event.appUserId, `revenuecat_${event.eventType.toLowerCase()}`);
      return jsonResponse({ ok: true, duplicate, action: 'cancelled_pending_winback', cancelled, affiliateCommissionAction });
    }

    if (!isVoluntaryTrialCancellation(event)) {
      return jsonResponse({ ok: true, duplicate, action: 'stored_only', affiliateCommissionAction });
    }

    if (!event.appUserId || !isValidSupabaseUserId(event.appUserId)) {
      return jsonResponse({ ok: true, duplicate, action: 'stored_invalid_app_user_id', affiliateCommissionAction });
    }

    if (!(await userExists(supabase, event.appUserId))) {
      return jsonResponse({ ok: true, duplicate, action: 'stored_unknown_user', affiliateCommissionAction });
    }

    if (!(await hasMarketingConsent(supabase, event.appUserId))) {
      return jsonResponse({ ok: true, duplicate, action: 'stored_no_marketing_consent', affiliateCommissionAction });
    }

    const nowIso = new Date().toISOString();
    const schedule = buildCancelledTrialWinbackSchedule(event, nowIso);
    if (schedule.length === 0) {
      return jsonResponse({ ok: true, duplicate, action: 'stored_no_schedule', affiliateCommissionAction });
    }

    const rows = schedule.map((candidate) => ({
      user_id: event.appUserId,
      revenuecat_event_id: event.eventId,
      sequence_step: candidate.sequenceStep,
      product_id: event.productId,
      store: event.store,
      scheduled_for: candidate.scheduledFor,
    }));

    const { error } = await supabase
      .from('winback_email_queue')
      .upsert(rows, {
        onConflict: 'revenuecat_event_id,sequence_step',
        ignoreDuplicates: true,
      });

    if (error) throw new Error(error.message);

    return jsonResponse({ ok: true, duplicate, action: 'queued', queued: rows.length, affiliateCommissionAction });
  } catch (error) {
    console.error('[RevenueCatWebhook] Failed to process event.', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
      eventId: event.eventId,
      eventType: event.eventType,
    });
    return jsonResponse({ error: 'processing_failed' }, 500);
  }
});
