import { useEffect, useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import type { PurchasesPackage } from 'react-native-purchases';
import {
  SubscriptionState,
  SubscriptionTier,
  SubscriptionPlan,
  PremiumFeature,
} from '@/types/subscription';
import {
  getDailyAIUsage,
  incrementDailyAIUsage,
  hasReachedAILimit,
  getRemainingAIMessages,
  getDaysRemaining,
  formatExpirationDate,
  getDailyRewriteUsage,
  incrementDailyRewriteUsage,
  hasReachedRewriteLimit as hasReachedRewriteLimitFn,
  getRemainingRewrites as getRemainingRewritesFn,
} from '@/services/subscription/subscriptionService';
import {
  canAccess,
  shouldShowUpgradePrompt,
  getLockedFeatures,
  FeatureEntitlement,
} from '@/services/subscription/entitlementService';
import {
  configurePurchases,
  fetchCustomerInfo,
  fetchOfferings,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
  hasActiveEntitlement,
  getActiveExpiration,
  getActivePeriodType,
  isTrialActive as rcIsTrialActive,
} from '@/services/subscription/purchasesService';

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [dailyAIUsage, setDailyAIUsage] = useState<number>(0);
  const [dailyRewriteUsage, setDailyRewriteUsage] = useState<number>(0);

  useEffect(() => {
    void configurePurchases();
  }, []);

  const customerInfoQuery = useQuery({
    queryKey: ['rc-customer-info'],
    queryFn: fetchCustomerInfo,
    staleTime: 60_000,
  });

  const offeringsQuery = useQuery({
    queryKey: ['rc-offerings'],
    queryFn: fetchOfferings,
    staleTime: 5 * 60_000,
  });

  const aiUsageQuery = useQuery({
    queryKey: ['ai-daily-usage'],
    queryFn: getDailyAIUsage,
  });

  const rewriteUsageQuery = useQuery({
    queryKey: ['rewrite-daily-usage'],
    queryFn: getDailyRewriteUsage,
  });

  useEffect(() => {
    if (aiUsageQuery.data !== undefined) {
      setDailyAIUsage(aiUsageQuery.data);
    }
  }, [aiUsageQuery.data]);

  useEffect(() => {
    if (rewriteUsageQuery.data !== undefined) {
      setDailyRewriteUsage(rewriteUsageQuery.data);
    }
  }, [rewriteUsageQuery.data]);

  const state: SubscriptionState = useMemo(() => {
    const info = customerInfoQuery.data ?? null;
    const isActive = hasActiveEntitlement(info);
    if (!isActive) {
      return {
        tier: 'free',
        plan: null,
        expiresAt: null,
        startedAt: null,
        trialEndsAt: null,
        isTrialActive: false,
      };
    }
    const expiresAt = getActiveExpiration(info);
    const period = getActivePeriodType(info);
    const trial = rcIsTrialActive(info);
    const plan: SubscriptionPlan | null = period
      ? {
          id: period,
          name: period === 'yearly' ? 'Yearly' : 'Monthly',
          period,
          price: period === 'yearly' ? 59.99 : 9.99,
          priceLabel: period === 'yearly' ? '$59.99/yr' : '$9.99/mo',
        }
      : null;
    return {
      tier: 'premium',
      plan,
      expiresAt,
      startedAt: null,
      trialEndsAt: trial ? expiresAt : null,
      isTrialActive: trial,
    };
  }, [customerInfoQuery.data]);

  const tier: SubscriptionTier = state.tier;
  const isPremium = tier === 'premium';

  const purchaseMutation = useMutation({
    mutationFn: (pkg: PurchasesPackage) => rcPurchasePackage(pkg),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => rcRestorePurchases(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
    },
  });

  const trackAIUsage = useCallback(async () => {
    const newCount = await incrementDailyAIUsage();
    setDailyAIUsage(newCount);
    void queryClient.invalidateQueries({ queryKey: ['ai-daily-usage'] });
    return newCount;
  }, [queryClient]);

  const trackRewriteUsage = useCallback(async () => {
    const newCount = await incrementDailyRewriteUsage();
    setDailyRewriteUsage(newCount);
    void queryClient.invalidateQueries({ queryKey: ['rewrite-daily-usage'] });
    return newCount;
  }, [queryClient]);

  const rewriteLimitReached = useMemo(() => {
    return hasReachedRewriteLimitFn(dailyRewriteUsage, tier);
  }, [dailyRewriteUsage, tier]);

  const remainingRewrites = useMemo(() => {
    return getRemainingRewritesFn(dailyRewriteUsage, tier);
  }, [dailyRewriteUsage, tier]);

  const canAccessFeature = useCallback((feature: PremiumFeature): boolean => {
    return canAccess(feature, tier);
  }, [tier]);

  const shouldPromptUpgrade = useCallback((
    feature: PremiumFeature,
    context?: { distressLevel?: number; isCrisis?: boolean }
  ): boolean => {
    return shouldShowUpgradePrompt(feature, tier, context);
  }, [tier]);

  const lockedFeatures = useMemo((): FeatureEntitlement[] => {
    return getLockedFeatures(tier);
  }, [tier]);

  const aiLimitReached = useMemo(() => {
    return hasReachedAILimit(dailyAIUsage, tier);
  }, [dailyAIUsage, tier]);

  const remainingAIMessages = useMemo(() => {
    return getRemainingAIMessages(dailyAIUsage, tier);
  }, [dailyAIUsage, tier]);

  const daysRemaining = useMemo(() => {
    return getDaysRemaining(state.expiresAt);
  }, [state.expiresAt]);

  const expirationLabel = useMemo(() => {
    return formatExpirationDate(state.expiresAt);
  }, [state.expiresAt]);

  const purchase = useCallback((pkg: PurchasesPackage) => {
    purchaseMutation.mutate(pkg);
  }, [purchaseMutation]);

  const subscribe = useCallback((_plan: SubscriptionPlan) => {
    const current = offeringsQuery.data;
    if (!current) {
      console.log('[Subscription] No offering available');
      return;
    }
    const pkg = _plan.period === 'yearly' ? current.annual : current.monthly;
    if (!pkg) {
      console.log('[Subscription] No package for period:', _plan.period);
      return;
    }
    purchaseMutation.mutate(pkg);
  }, [offeringsQuery.data, purchaseMutation]);

  return useMemo(() => ({
    tier,
    isPremium,
    state,
    offering: offeringsQuery.data ?? null,
    dailyAIUsage,
    aiLimitReached,
    remainingAIMessages,
    dailyRewriteUsage,
    rewriteLimitReached,
    remainingRewrites,
    daysRemaining,
    expirationLabel,
    isLoading: customerInfoQuery.isLoading,
    isSubscribing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    purchase,
    subscribe,
    startTrial: () => {
      const current = offeringsQuery.data;
      const pkg = current?.annual ?? current?.monthly ?? null;
      if (pkg) purchaseMutation.mutate(pkg);
    },
    cancel: () => {
      console.log('[Subscription] Cancel must be done in the App Store / Play Store');
    },
    restore: restoreMutation.mutate,
    canAccessFeature,
    shouldPromptUpgrade,
    lockedFeatures,
    trackAIUsage,
    trackRewriteUsage,
  }), [
    tier,
    isPremium,
    state,
    offeringsQuery.data,
    dailyAIUsage,
    aiLimitReached,
    remainingAIMessages,
    dailyRewriteUsage,
    rewriteLimitReached,
    remainingRewrites,
    daysRemaining,
    expirationLabel,
    customerInfoQuery.isLoading,
    purchaseMutation.isPending,
    purchaseMutation,
    restoreMutation.isPending,
    restoreMutation.mutate,
    purchase,
    subscribe,
    canAccessFeature,
    shouldPromptUpgrade,
    lockedFeatures,
    trackAIUsage,
    trackRewriteUsage,
  ]);
});
