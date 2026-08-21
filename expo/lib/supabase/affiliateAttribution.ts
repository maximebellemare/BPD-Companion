import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase/client';
import {
  AffiliateAttributionResult,
  isValidManualReferralCode,
  normalizeAffiliateReferralCode,
  parseAffiliateAttributionRpcResult,
} from '@/services/affiliate/affiliateAttributionModel';

export async function attributeAffiliateReferralCode(
  referralCode: string,
  source: 'manual_code' | 'web_referral' | 'singular' | 'deep_link' = 'manual_code',
): Promise<AffiliateAttributionResult> {
  const normalized = normalizeAffiliateReferralCode(referralCode);
  if (!normalized) return { ok: false, reason: 'missing_code' };
  if (!isValidManualReferralCode(normalized)) return { ok: false, reason: 'invalid_code' };

  try {
    const { data, error } = await supabase.rpc('attribute_affiliate_user', {
      p_referral_code: normalized,
      p_attribution_source: source,
      p_metadata: {
        platform: Platform.OS,
        source,
      },
    });

    if (error) throw new Error(error.message);
    return parseAffiliateAttributionRpcResult(data);
  } catch (error) {
    if (__DEV__) {
      console.warn('[Affiliate] Referral attribution failed', {
        reason: error instanceof Error ? error.message : 'unknown_error',
      });
    }
    return { ok: false, reason: 'network_error' };
  }
}
