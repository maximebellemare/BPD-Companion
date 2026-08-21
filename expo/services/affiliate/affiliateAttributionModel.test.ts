import assert from 'node:assert/strict';
import {
  isValidManualReferralCode,
  normalizeAffiliateReferralCode,
  normalizeAffiliateSlug,
  parseAffiliateAttributionRpcResult,
} from './affiliateAttributionModel';

function run() {
  assert.equal(normalizeAffiliateReferralCode('  creator-50 '), 'CREATOR-50');
  assert.equal(normalizeAffiliateSlug(' Creator Slug!! '), 'creatorslug');
  assert.equal(isValidManualReferralCode('bpd_123'), true);
  assert.equal(isValidManualReferralCode('x'), false);

  assert.deepEqual(parseAffiliateAttributionRpcResult({ ok: true, reason: 'already_attributed', affiliate_id: 'a1' }), {
    ok: true,
    reason: 'already_attributed',
    affiliateId: 'a1',
  });
  assert.deepEqual(parseAffiliateAttributionRpcResult({ ok: false, reason: 'invalid_code' }), {
    ok: false,
    reason: 'invalid_code',
    affiliateId: null,
  });
}

run();
