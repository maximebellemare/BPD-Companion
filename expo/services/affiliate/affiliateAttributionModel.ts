export type AffiliateAttributionReason =
  | 'attributed'
  | 'already_attributed'
  | 'invalid_code'
  | 'missing_code'
  | 'not_authenticated'
  | 'self_referral'
  | 'network_error'
  | 'unknown';

export type AffiliateAttributionResult = {
  ok: boolean;
  reason: AffiliateAttributionReason;
  affiliateId?: string | null;
};

export function normalizeAffiliateReferralCode(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
}

export function normalizeAffiliateSlug(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '');
}

export function isValidManualReferralCode(value: string | null | undefined): boolean {
  const normalized = normalizeAffiliateReferralCode(value);
  return /^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(normalized);
}

export function parseAffiliateAttributionRpcResult(value: unknown): AffiliateAttributionResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, reason: 'unknown' };
  }

  const record = value as Record<string, unknown>;
  const rawReason = typeof record.reason === 'string' ? record.reason : null;
  const reason: AffiliateAttributionReason =
    rawReason === 'attributed' ||
    rawReason === 'already_attributed' ||
    rawReason === 'invalid_code' ||
    rawReason === 'missing_code' ||
    rawReason === 'not_authenticated' ||
    rawReason === 'self_referral'
      ? rawReason
      : record.ok === true
        ? 'attributed'
        : 'unknown';

  return {
    ok: record.ok === true,
    reason,
    affiliateId: typeof record.affiliate_id === 'string' ? record.affiliate_id : null,
  };
}
