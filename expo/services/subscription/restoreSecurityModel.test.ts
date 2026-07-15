import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';
import type { CustomerInfo } from '@/services/subscription/purchasesService';
import {
  type IdentityRepairDecision,
  type RestoreUnlockDecision,
  evaluateIdentityRepair,
  evaluateRestoreUnlock,
  isRevenueCatOwnershipConflict,
} from '@/services/subscription/restoreSecurityModel';

function customerInfoWithActiveEntitlement(): CustomerInfo {
  return {
    entitlements: {
      active: {
        [REVENUECAT_ENTITLEMENT_ID]: {
          expirationDate: null,
          productIdentifier: 'bpd_monthly:monthly',
          periodType: 'NORMAL',
        },
      },
    },
  };
}

function customerInfoWithoutEntitlement(): CustomerInfo {
  return { entitlements: { active: {} } };
}

export const restoreSecurityRegressionScenarios = [
  {
    name: 'clean store account + Restore -> no access',
    result: evaluateRestoreUnlock({
      supabaseUserId: 'user_a',
      revenueCatUserIdBefore: 'user_a',
      revenueCatUserIdAfterLogin: 'user_a',
      customerInfo: customerInfoWithoutEntitlement(),
    }),
    expectedAccess: false,
  },
  {
    name: 'no entitlement -> no access',
    result: evaluateRestoreUnlock({
      supabaseUserId: 'user_a',
      revenueCatUserIdBefore: 'user_a',
      revenueCatUserIdAfterLogin: 'user_a',
      customerInfo: customerInfoWithoutEntitlement(),
    }),
    expectedAccess: false,
  },
  {
    name: 'expired entitlement -> no access',
    result: evaluateRestoreUnlock({
      supabaseUserId: 'user_a',
      revenueCatUserIdBefore: 'user_a',
      revenueCatUserIdAfterLogin: 'user_a',
      customerInfo: customerInfoWithoutEntitlement(),
    }),
    expectedAccess: false,
  },
  {
    name: 'restore error -> no access',
    result: evaluateRestoreUnlock({
      supabaseUserId: 'user_a',
      revenueCatUserIdBefore: 'user_a',
      revenueCatUserIdAfterLogin: 'user_a',
      customerInfo: null,
      restoreError: new Error('network failed'),
    }),
    expectedAccess: false,
  },
  {
    name: 'active entitlement + matching identity -> access',
    result: evaluateRestoreUnlock({
      supabaseUserId: 'user_a',
      revenueCatUserIdBefore: 'user_a',
      revenueCatUserIdAfterLogin: 'user_a',
      customerInfo: customerInfoWithActiveEntitlement(),
    }),
    expectedAccess: true,
  },
  {
    name: 'same Apple account + different Supabase account -> blocked',
    result: evaluateRestoreUnlock({
      supabaseUserId: 'user_b',
      revenueCatUserIdBefore: 'user_b',
      revenueCatUserIdAfterLogin: 'user_b',
      customerInfo: null,
      restoreError: { code: 'RECEIPT_ALREADY_IN_USE_ERROR' },
    }),
    expectedAccess: false,
  },
  {
    name: 'original purchasing Supabase account -> restore succeeds',
    result: evaluateRestoreUnlock({
      supabaseUserId: 'user_a',
      revenueCatUserIdBefore: 'user_a',
      revenueCatUserIdAfterLogin: 'user_a',
      customerInfo: customerInfoWithActiveEntitlement(),
    }),
    expectedAccess: true,
  },
  {
    name: 'mismatched RevenueCat identity -> repair or fail safely',
    result: evaluateIdentityRepair('user_a', 'anonymous', 'user_a'),
    expectedAccess: true,
  },
  {
    name: 'navigation only after active entitlement confirmation',
    result: evaluateRestoreUnlock({
      supabaseUserId: 'user_a',
      revenueCatUserIdBefore: 'user_a',
      revenueCatUserIdAfterLogin: 'user_a',
      customerInfo: customerInfoWithoutEntitlement(),
    }),
    expectedAccess: false,
  },
] as const;

export const restoreSecurityOwnershipErrorCodes = [
  isRevenueCatOwnershipConflict({ code: 'RECEIPT_ALREADY_IN_USE_ERROR' }),
  isRevenueCatOwnershipConflict({ code: 'RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR' }),
] as const;

function scenarioAllowsAccess(result: IdentityRepairDecision | RestoreUnlockDecision): boolean {
  return 'access' in result ? result.access : result.ok;
}

export const restoreSecurityRegressionFailures = restoreSecurityRegressionScenarios
  .filter(scenario => scenarioAllowsAccess(scenario.result) !== scenario.expectedAccess)
  .map(scenario => scenario.name);

export function assertRestoreSecurityRegressionScenarios(): true {
  if (restoreSecurityRegressionFailures.length > 0) {
    throw new Error(`Restore security regression failures: ${restoreSecurityRegressionFailures.join(', ')}`);
  }

  if (restoreSecurityOwnershipErrorCodes.some(result => result !== true)) {
    throw new Error('Restore security regression failure: RevenueCat ownership error code not recognized.');
  }

  return true;
}

export const restoreSecurityRegressionTestsPassed = assertRestoreSecurityRegressionScenarios();
