import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  SubscriptionState,
  SubscriptionTier,
  SubscriptionPlan,
  PremiumFeature,
} from '@/types/subscription';
import {
  loadSubscriptionState,
  subscribeToPlan,
  startFreeTrial,
  cancelSubscription,
  restorePurchase,
  isPremiumFeature,
  getDailyAIUsage,
  incrementDailyAIUsage,
  hasReachedAILimit,
  getRemainingAIMessages,
  getDaysRemaining,
  formatExpirationDate,
} from '@/services/subscription/subscriptionService';

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [dailyAIUsage, setDailyAIUsage] = useState<number>(0);

  const subscriptionQuery = useQuery({
    queryKey: ['subscription'],
    queryFn: loadSubscriptionState,
  });

  const aiUsageQuery = useQuery({
    queryKey: ['ai-daily-usage'],
    queryFn: getDailyAIUsage,
  });

  useEffect(() => {
    if (aiUsageQuery.data !== undefined) {
      setDailyAIUsage(aiUsageQuery.data);
    }
  }, [aiUsageQuery.data]);

  const state: SubscriptionState = useMemo(() => subscriptionQuery.data ?? {
    tier: 'free',
    plan: null,
    expiresAt: null,
    startedAt: null,
    trialEndsAt: null,
    isTrialActive: false,
  }, [subscriptionQuery.data]);

  const tier: SubscriptionTier = state.tier;
  const isPremium = tier === 'premium';

  const subscribeMutation = useMutation({
    mutationFn: (plan: SubscriptionPlan) => subscribeToPlan(plan),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  const trialMutation = useMutation({
    mutationFn: () => startFreeTrial(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => restorePurchase(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  const trackAIUsage = useCallback(async () => {
    const newCount = await incrementDailyAIUsage();
    setDailyAIUsage(newCount);
    void queryClient.invalidateQueries({ queryKey: ['ai-daily-usage'] });
    return newCount;
  }, [queryClient]);

  const canAccessFeature = useCallback((feature: PremiumFeature): boolean => {
    return isPremiumFeature(feature, tier);
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

  return useMemo(() => ({
    tier,
    isPremium,
    state,
    dailyAIUsage,
    aiLimitReached,
    remainingAIMessages,
    daysRemaining,
    expirationLabel,
    isLoading: subscriptionQuery.isLoading,
    isSubscribing: subscribeMutation.isPending,
    subscribe: subscribeMutation.mutate,
    startTrial: trialMutation.mutate,
    cancel: cancelMutation.mutate,
    restore: restoreMutation.mutate,
    canAccessFeature,
    trackAIUsage,
  }), [
    tier,
    isPremium,
    state,
    dailyAIUsage,
    aiLimitReached,
    remainingAIMessages,
    daysRemaining,
    expirationLabel,
    subscriptionQuery.isLoading,
    subscribeMutation.isPending,
    subscribeMutation.mutate,
    trialMutation.mutate,
    cancelMutation.mutate,
    restoreMutation.mutate,
    canAccessFeature,
    trackAIUsage,
  ]);
});
