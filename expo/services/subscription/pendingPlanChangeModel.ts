import type { SubscriptionPeriod } from '@/types/subscription';

export type PendingPlanChange = {
  platform: 'android';
  sourcePeriod: SubscriptionPeriod;
  targetPeriod: SubscriptionPeriod;
  effectiveAt: number | null;
  createdAt: number;
};

export type PendingPlanChangeValidationResult =
  | { status: 'none'; record: null }
  | { status: 'valid'; record: PendingPlanChange }
  | { status: 'clear'; record: null };

export function getPendingPlanChangeStorageKey(userId: string): string {
  return `bpd_pending_plan_change:${userId}`;
}

export function createPendingPlanChange(params: {
  sourcePeriod: SubscriptionPeriod;
  targetPeriod: SubscriptionPeriod;
  effectiveAt: number | null;
  platform: 'android';
  now?: number;
}): PendingPlanChange | null {
  if (params.sourcePeriod === params.targetPeriod) return null;
  return {
    platform: params.platform,
    sourcePeriod: params.sourcePeriod,
    targetPeriod: params.targetPeriod,
    effectiveAt: params.effectiveAt,
    createdAt: params.now ?? Date.now(),
  };
}

export function validatePendingPlanChange(params: {
  record: PendingPlanChange | null;
  hasActiveEntitlement: boolean;
  currentPeriod: SubscriptionPeriod | null;
  expiresAt: number | null;
  willRenew: boolean | null;
  platform: 'ios' | 'android' | 'web' | string;
  now?: number;
}): PendingPlanChangeValidationResult {
  const { record, hasActiveEntitlement, currentPeriod, expiresAt, platform } = params;
  if (!record) return { status: 'none', record: null };
  if (platform !== 'android' || record.platform !== 'android') return { status: 'clear', record: null };
  if (!hasActiveEntitlement || !currentPeriod) return { status: 'clear', record: null };
  if (record.sourcePeriod === record.targetPeriod) return { status: 'clear', record: null };
  if (currentPeriod === record.targetPeriod) return { status: 'clear', record: null };
  if (currentPeriod !== record.sourcePeriod) return { status: 'clear', record: null };
  return {
    status: 'valid',
    record: {
      ...record,
      effectiveAt: expiresAt ?? record.effectiveAt,
    },
  };
}
