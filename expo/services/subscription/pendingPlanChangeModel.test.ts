import {
  createPendingPlanChange,
  getPendingPlanChangeStorageKey,
  validatePendingPlanChange,
} from '@/services/subscription/pendingPlanChangeModel';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Pending plan change regression failed: ${message}`);
}

export function assertPendingPlanChangeRegressionScenarios(): true {
  const now = new Date('2026-07-20T12:00:00Z').getTime();
  const renewalDate = now + 86_400_000;

  assert(
    getPendingPlanChangeStorageKey('user_a') !== getPendingPlanChangeStorageKey('user_b'),
    'pending plan change state is user-scoped',
  );

  const yearlyToMonthly = createPendingPlanChange({
    sourcePeriod: 'yearly',
    targetPeriod: 'monthly',
    effectiveAt: renewalDate,
    platform: 'android',
    now,
  });
  assert(yearlyToMonthly?.targetPeriod === 'monthly', 'yearly active + monthly scheduled is recorded');
  assert(yearlyToMonthly?.sourcePeriod === 'yearly', 'current yearly plan remains source until renewal');

  const monthlyToYearly = createPendingPlanChange({
    sourcePeriod: 'monthly',
    targetPeriod: 'yearly',
    effectiveAt: renewalDate,
    platform: 'android',
    now,
  });
  assert(monthlyToYearly?.targetPeriod === 'yearly', 'monthly active + yearly scheduled is recorded');

  assert(
    createPendingPlanChange({
      sourcePeriod: 'monthly',
      targetPeriod: 'monthly',
      effectiveAt: renewalDate,
      platform: 'android',
      now,
    }) === null,
    'same-plan purchase never creates pending change',
  );

  const valid = validatePendingPlanChange({
    record: yearlyToMonthly,
    hasActiveEntitlement: true,
    currentPeriod: 'yearly',
    expiresAt: renewalDate,
    willRenew: true,
    platform: 'android',
    now,
  });
  assert(valid.status === 'valid', 'scheduled change stays visible while source plan remains active');
  assert(valid.record?.effectiveAt === renewalDate, 'RevenueCat expiration date drives scheduled switch date');

  assert(
    validatePendingPlanChange({
      record: yearlyToMonthly,
      hasActiveEntitlement: true,
      currentPeriod: 'monthly',
      expiresAt: renewalDate,
      willRenew: true,
      platform: 'android',
      now,
    }).status === 'clear',
    'pending state clears when active product changes after renewal',
  );

  assert(
    validatePendingPlanChange({
      record: yearlyToMonthly,
      hasActiveEntitlement: false,
      currentPeriod: null,
      expiresAt: null,
      willRenew: null,
      platform: 'android',
      now,
    }).status === 'clear',
    'pending state clears when entitlement disappears',
  );

  assert(
    validatePendingPlanChange({
      record: yearlyToMonthly,
      hasActiveEntitlement: true,
      currentPeriod: 'yearly',
      expiresAt: renewalDate,
      willRenew: false,
      platform: 'android',
      now,
    }).status === 'clear',
    'pending state clears when store says subscription will not renew',
  );

  assert(
    validatePendingPlanChange({
      record: yearlyToMonthly,
      hasActiveEntitlement: true,
      currentPeriod: 'monthly',
      expiresAt: renewalDate,
      willRenew: true,
      platform: 'android',
      now,
    }).status === 'clear',
    'stale pending state contradicted by CustomerInfo is cleared',
  );

  assert(
    validatePendingPlanChange({
      record: yearlyToMonthly,
      hasActiveEntitlement: true,
      currentPeriod: 'yearly',
      expiresAt: now - 1,
      willRenew: true,
      platform: 'android',
      now,
    }).status === 'clear',
    'expired sandbox period clears pending display state',
  );

  assert(
    validatePendingPlanChange({
      record: yearlyToMonthly,
      hasActiveEntitlement: true,
      currentPeriod: 'yearly',
      expiresAt: renewalDate,
      willRenew: true,
      platform: 'ios',
      now,
    }).status === 'clear',
    'Android pending state is not shown on iOS',
  );

  return true;
}

export const pendingPlanChangeRegressionTestsPassed =
  assertPendingPlanChangeRegressionScenarios();
