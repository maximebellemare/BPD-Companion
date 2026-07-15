import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';
import type { CustomerInfo } from '@/services/subscription/purchasesService';

export const SUBSCRIPTION_LINKED_TO_ANOTHER_ACCOUNT_MESSAGE =
  'This subscription is linked to another account. Sign in with the account originally used to subscribe.';

export const REVENUECAT_IDENTITY_MISMATCH_MESSAGE =
  'We could not verify the signed-in account for this purchase. Please sign out and sign back in.';

export type IdentityRepairDecision =
  | { ok: true; repaired: boolean }
  | { ok: false; reason: 'missing_supabase_user' | 'identity_mismatch' };

export type RestoreUnlockDecision =
  | { access: true; reason: 'active_entitlement' }
  | {
      access: false;
      reason:
        | 'missing_supabase_user'
        | 'identity_mismatch'
        | 'ownership_conflict'
        | 'restore_error'
        | 'no_entitlement';
      message?: string;
    };

export function isRevenueCatOwnershipConflict(error: unknown): boolean {
  const maybe = error as {
    code?: string | number;
    readableErrorCode?: string;
    underlyingErrorCode?: string;
    message?: string;
  } | null;
  const haystack = [
    maybe?.readableErrorCode,
    maybe?.underlyingErrorCode,
    maybe?.code !== undefined ? String(maybe.code) : null,
    maybe?.message,
    error instanceof Error ? error.message : null,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes('receipt_already_in_use_error') ||
    haystack.includes('receipt_in_use_by_other_subscriber_error') ||
    haystack.includes('receipt_already_in_use') ||
    haystack.includes('receipt in use by other subscriber') ||
    haystack.includes('receipt already in use') ||
    haystack.includes('already used by another subscriber');
}

export function hasActiveMembershipEntitlement(info: CustomerInfo | null): boolean {
  return !!info?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID];
}

export function evaluateIdentityRepair(
  supabaseUserId: string | null | undefined,
  revenueCatUserIdBefore: string | null | undefined,
  revenueCatUserIdAfterLogin: string | null | undefined,
): IdentityRepairDecision {
  if (!supabaseUserId) return { ok: false, reason: 'missing_supabase_user' };
  if (revenueCatUserIdBefore === supabaseUserId) return { ok: true, repaired: false };
  if (revenueCatUserIdAfterLogin === supabaseUserId) return { ok: true, repaired: true };
  return { ok: false, reason: 'identity_mismatch' };
}

export function evaluateRestoreUnlock(params: {
  supabaseUserId: string | null | undefined;
  revenueCatUserIdBefore: string | null | undefined;
  revenueCatUserIdAfterLogin: string | null | undefined;
  customerInfo: CustomerInfo | null;
  restoreError?: unknown;
}): RestoreUnlockDecision {
  if (params.restoreError) {
    if (isRevenueCatOwnershipConflict(params.restoreError)) {
      return {
        access: false,
        reason: 'ownership_conflict',
        message: SUBSCRIPTION_LINKED_TO_ANOTHER_ACCOUNT_MESSAGE,
      };
    }
    return { access: false, reason: 'restore_error' };
  }

  const identity = evaluateIdentityRepair(
    params.supabaseUserId,
    params.revenueCatUserIdBefore,
    params.revenueCatUserIdAfterLogin,
  );
  if (!identity.ok) return { access: false, reason: identity.reason };
  if (!hasActiveMembershipEntitlement(params.customerInfo)) {
    return { access: false, reason: 'no_entitlement' };
  }
  return { access: true, reason: 'active_entitlement' };
}
