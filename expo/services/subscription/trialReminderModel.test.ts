import { REVENUECAT_ENTITLEMENT_ID } from '@/constants/revenuecat';
import {
  TRIAL_REMINDER_MS_BEFORE_EXPIRATION,
  getTrialEndingReminderCandidate,
  getTrialEndingReminderDelaySeconds,
  getTrialEndingReminderReadiness,
  getTrialEligibilityCopy,
  getTrialLengthLabel,
  shouldShowTrialCopyForSelectedPlan,
  shouldShowTrialEndingReminderCopy,
} from '@/services/subscription/trialReminderModel';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Trial reminder model regression failed: ${message}`);
}

const NOW = new Date('2026-08-12T12:00:00.000Z').getTime();
const EXPIRATION = new Date('2026-08-15T12:00:00.000Z').getTime();
const PURCHASE = new Date('2026-08-12T12:01:00.000Z').getTime();

function customerInfo(params: {
  isActive?: boolean;
  periodType?: string | null;
  expirationDateMillis?: number | null;
  productIdentifier?: string | null;
}) {
  return {
    entitlements: {
      active: {
        [REVENUECAT_ENTITLEMENT_ID]: {
          isActive: params.isActive ?? true,
          periodType: 'periodType' in params ? params.periodType : 'TRIAL',
          expirationDateMillis: 'expirationDateMillis' in params ? params.expirationDateMillis : EXPIRATION,
          latestPurchaseDateMillis: PURCHASE,
          productIdentifier: params.productIdentifier ?? 'bpd_monthly:monthly',
        },
      },
    },
  };
}

export function assertTrialReminderModelRegressionScenarios(): true {
  const candidate = getTrialEndingReminderCandidate(customerInfo({}), NOW);
  assert(candidate !== null, 'active trial creates reminder candidate');
  if (!candidate) throw new Error('Expected active trial reminder candidate');
  assert(candidate?.productIdentifier === 'bpd_monthly:monthly', 'candidate keeps product identifier');
  assert(candidate?.dedupeKey.includes(String(PURCHASE)), 'dedupe key includes latest purchase timestamp');
  assert(candidate?.expirationAt === EXPIRATION, 'candidate uses actual RevenueCat trial expiration');
  assert(
    candidate?.triggerAt === EXPIRATION - TRIAL_REMINDER_MS_BEFORE_EXPIRATION,
    'candidate schedules around 24 hours before trial expiration',
  );
  assert(
    getTrialEndingReminderDelaySeconds(candidate, NOW) > 0,
    'candidate produces positive trigger delay',
  );
  assert(getTrialLengthLabel(3) === '3-day free', 'three-day trial label is derived from metadata');
  assert(getTrialLengthLabel(7) === '7-day free', 'seven-day trial label is derived from metadata');
  assert(getTrialLengthLabel(null) === 'free', 'unknown trial label does not invent a duration');
  assert(
    getTrialEligibilityCopy(7) === '7-day free trial for eligible new subscribers',
    'trial eligibility copy supports seven-day experiments',
  );

  assert(
    getTrialEndingReminderCandidate(customerInfo({ periodType: 'NORMAL' }), NOW) === null,
    'normal paid subscription does not create reminder candidate',
  );
  assert(
    getTrialEndingReminderReadiness(customerInfo({ periodType: null }), NOW).status === 'waiting_for_period_type',
    'missing RevenueCat trial period metadata can wait for a later CustomerInfo update',
  );
  assert(
    getTrialEndingReminderReadiness(customerInfo({ expirationDateMillis: null }), NOW).status === 'waiting_for_expiration',
    'missing RevenueCat expiration metadata can wait for a later CustomerInfo update',
  );
  assert(
    getTrialEndingReminderReadiness(customerInfo({ periodType: 'NORMAL' }), NOW).status === 'not_trial',
    'confirmed paid period is not treated as pending trial metadata',
  );
  assert(
    getTrialEndingReminderCandidate(customerInfo({ periodType: 'INTRO' }), NOW) === null,
    'intro period does not create reminder candidate',
  );
  assert(
    getTrialEndingReminderCandidate(customerInfo({ isActive: false }), NOW) === null,
    'inactive entitlement does not create reminder candidate',
  );
  assert(
    getTrialEndingReminderCandidate(customerInfo({ expirationDateMillis: NOW - 1000 }), NOW) === null,
    'expired trial does not create reminder candidate',
  );
  assert(
    getTrialEndingReminderCandidate(customerInfo({ expirationDateMillis: NOW + 30_000 }), NOW) === null,
    'trial expiring before minimum delay does not schedule after expiration',
  );

  assert(
    shouldShowTrialCopyForSelectedPlan({
      platform: 'ios',
      trialEligibilityStatus: 'eligible',
    }) === true,
    'iOS positive trial eligibility shows trial copy',
  );
  assert(
    shouldShowTrialCopyForSelectedPlan({
      platform: 'ios',
      trialEligibilityStatus: 'unknown',
    }) === false,
    'iOS unknown trial eligibility hides trial copy',
  );
  assert(
    shouldShowTrialCopyForSelectedPlan({
      platform: 'ios',
      trialEligibilityStatus: 'ineligible',
    }) === false,
    'iOS ineligible status hides trial copy',
  );
  assert(
    shouldShowTrialCopyForSelectedPlan({
      platform: 'android',
      androidTrialCopy: '7-day free trial for eligible new subscribers',
      trialEligibilityStatus: 'unknown',
    }) === true,
    'Android exact trial-copy behavior is unchanged',
  );
  assert(
    shouldShowTrialCopyForSelectedPlan({
      platform: 'android',
      androidTrialCopy: null,
      trialEligibilityStatus: 'eligible',
    }) === false,
    'Android does not use iOS eligibility for trial copy',
  );

  assert(
    shouldShowTrialEndingReminderCopy({
      hasStoreAccess: false,
      inactiveBillingRecovery: false,
      shouldShowTrialCopy: true,
    }) === true,
    'fresh trial paywall shows reminder reassurance',
  );
  assert(
    shouldShowTrialEndingReminderCopy({
      hasStoreAccess: true,
      inactiveBillingRecovery: false,
      shouldShowTrialCopy: true,
    }) === false,
    'active members do not see new-trial reminder copy',
  );
  assert(
    shouldShowTrialEndingReminderCopy({
      hasStoreAccess: false,
      inactiveBillingRecovery: true,
      shouldShowTrialCopy: true,
    }) === false,
    'billing recovery paywall does not show fresh-trial reminder copy',
  );

  return true;
}

export const trialReminderModelRegressionTestsPassed = assertTrialReminderModelRegressionScenarios();
