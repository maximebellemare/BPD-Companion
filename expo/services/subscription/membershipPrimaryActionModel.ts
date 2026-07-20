import type { SubscriptionPeriod } from '@/types/subscription';

export type MembershipPrimaryAction =
  | { kind: 'continue'; label: string; requiresPurchasablePlan: false }
  | { kind: 'manage'; label: string; requiresPurchasablePlan: false }
  | { kind: 'switch'; label: string; requiresPurchasablePlan: true }
  | { kind: 'purchase'; label: string; requiresPurchasablePlan: true }
  | { kind: 'loading'; label: string; requiresPurchasablePlan: false };

export function getMembershipPrimaryAction(params: {
  isExpoGo: boolean;
  platform: 'ios' | 'android' | 'web' | string;
  hasStoreAccess: boolean;
  activePeriod: SubscriptionPeriod | null;
  selectedPeriod: SubscriptionPeriod | null;
  canSubscribe: boolean;
  shouldShowTrialCopy: boolean;
  selectedPriceLabel: string;
}): MembershipPrimaryAction {
  const {
    isExpoGo,
    platform,
    hasStoreAccess,
    activePeriod,
    selectedPeriod,
    canSubscribe,
    shouldShowTrialCopy,
    selectedPriceLabel,
  } = params;

  if (isExpoGo) {
    return { kind: 'continue', label: 'Continue to app', requiresPurchasablePlan: false };
  }

  if (
    hasStoreAccess &&
    platform === 'android' &&
    activePeriod &&
    selectedPeriod &&
    activePeriod !== selectedPeriod
  ) {
    return {
      kind: 'switch',
      label: selectedPeriod === 'yearly' ? 'Switch to Yearly' : 'Switch to Monthly',
      requiresPurchasablePlan: true,
    };
  }

  if (hasStoreAccess) {
    return { kind: 'manage', label: 'Manage existing subscription', requiresPurchasablePlan: false };
  }

  if (!canSubscribe) {
    return { kind: 'loading', label: 'Loading membership options...', requiresPurchasablePlan: false };
  }

  return {
    kind: 'purchase',
    label: shouldShowTrialCopy
      ? `Start your 3-day free trial ${selectedPriceLabel}`
      : `Start membership ${selectedPriceLabel}`,
    requiresPurchasablePlan: true,
  };
}
