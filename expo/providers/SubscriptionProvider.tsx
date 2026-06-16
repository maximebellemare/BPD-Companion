import { useEffect, useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
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
import type { PurchasesPackage } from '@/services/subscription/purchasesService';
import { useAuth } from '@/providers/AuthProvider';
import { useUserProfile } from '@/providers/UserProfileProvider';
import { isProfileTrialActive } from '@/lib/supabase/profiles';
import {
  REVENUECAT_MONTHLY_PRODUCT_ID,
  REVENUECAT_YEARLY_PRODUCT_ID,
} from '@/constants/revenuecat';

type OfferingStatus = 'loading' | 'ready' | 'empty' | 'error' | 'preview';

const FALLBACK_PREVIEW_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    period: 'monthly',
    price: 9.99,
    priceLabel: '$9.99/mo',
    productIdentifier: REVENUECAT_MONTHLY_PRODUCT_ID,
    isFallbackPrice: true,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    period: 'yearly',
    price: 59.99,
    priceLabel: '$59.99/yr',
    savings: 'Best value',
    popular: true,
    productIdentifier: REVENUECAT_YEARLY_PRODUCT_ID,
    isFallbackPrice: true,
  },
];

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { profile } = useUserProfile();
  const [dailyAIUsage, setDailyAIUsage] = useState<number>(0);
  const [dailyRewriteUsage, setDailyRewriteUsage] = useState<number>(0);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      void configurePurchases(user.id);
    }
  }, [isAuthenticated, user?.id]);

  const customerInfoQuery = useQuery({
    queryKey: ['rc-customer-info'],
    queryFn: fetchCustomerInfo,
    staleTime: 60_000,
    enabled: isAuthenticated && !!user?.id,
  });

  const offeringsQuery = useQuery({
    queryKey: ['rc-offerings'],
    queryFn: fetchOfferings,
    staleTime: 5 * 60_000,
    enabled: isAuthenticated && !!user?.id,
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
    const isEntitlementActive = hasActiveEntitlement(info);
    const accountTrialActive = isProfileTrialActive(profile);
    const profileTrialEndsAt = profile ? new Date(profile.trial_ends_at).getTime() : null;
    if (!isEntitlementActive) {
      return {
        tier: accountTrialActive ? 'premium' : 'free',
        plan: null,
        expiresAt: null,
        startedAt: null,
        trialEndsAt: profileTrialEndsAt,
        isTrialActive: accountTrialActive,
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
  }, [customerInfoQuery.data, profile]);

  const tier: SubscriptionTier = state.tier;
  const isEntitlementActive = hasActiveEntitlement(customerInfoQuery.data ?? null);
  const isPremium = tier === 'premium';
  const hasPremiumAccess = state.isTrialActive || isEntitlementActive;

  const offeringStatus: OfferingStatus = useMemo(() => {
    if (offeringsQuery.isLoading || customerInfoQuery.isLoading) return 'loading';
    if (offeringsQuery.isError) return 'error';
    if (offeringsQuery.data?.monthly || offeringsQuery.data?.annual) return 'ready';
    if (offeringsQuery.data) return 'empty';
    if (__DEV__) return 'preview';
    return 'empty';
  }, [customerInfoQuery.isLoading, offeringsQuery.data, offeringsQuery.isError, offeringsQuery.isLoading]);

  const plans = useMemo<SubscriptionPlan[]>(() => {
    const offering = offeringsQuery.data;
    if (!offering) {
      return offeringStatus === 'preview' ? FALLBACK_PREVIEW_PLANS : [];
    }

    const nextPlans: SubscriptionPlan[] = [];

    if (offering.monthly) {
      nextPlans.push({
        id: 'monthly',
        name: 'Monthly',
        period: 'monthly',
        price: 0,
        priceLabel: `${offering.monthly.product.priceString}/mo`,
        productIdentifier: offering.monthly.product.identifier ?? REVENUECAT_MONTHLY_PRODUCT_ID,
        packageIdentifier: offering.monthly.identifier,
      });
    }

    if (offering.annual) {
      nextPlans.push({
        id: 'yearly',
        name: 'Yearly',
        period: 'yearly',
        price: 0,
        priceLabel: `${offering.annual.product.priceString}/yr`,
        savings: 'Best value',
        popular: true,
        productIdentifier: offering.annual.product.identifier ?? REVENUECAT_YEARLY_PRODUCT_ID,
        packageIdentifier: offering.annual.identifier,
      });
    }

    return nextPlans;
  }, [offeringStatus, offeringsQuery.data]);

  const offeringsError = useMemo(() => {
    if (offeringsQuery.error instanceof Error) return offeringsQuery.error.message;
    if (offeringStatus === 'empty') return 'No RevenueCat offering was returned for this app.';
    if (offeringStatus === 'preview') return 'RevenueCat offerings are unavailable in this build preview.';
    return null;
  }, [offeringStatus, offeringsQuery.error]);

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

  const restore = useCallback(async () => {
    const info = await restoreMutation.mutateAsync();
    return hasActiveEntitlement(info ?? null);
  }, [restoreMutation]);

  const subscribe = useCallback((_plan: SubscriptionPlan) => {
    const current = offeringsQuery.data;
    if (!current) {
      console.log('[Subscription] No offering available for plan:', _plan.id);
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
    isEntitlementActive,
    hasPremiumAccess,
    state,
    offering: offeringsQuery.data ?? null,
    offeringStatus,
    offeringsError,
    plans,
    dailyAIUsage,
    aiLimitReached,
    remainingAIMessages,
    dailyRewriteUsage,
    rewriteLimitReached,
    remainingRewrites,
    daysRemaining,
    expirationLabel,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    isSubscribing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    purchaseError: purchaseMutation.error instanceof Error ? purchaseMutation.error.message : null,
    restoreError: restoreMutation.error instanceof Error ? restoreMutation.error.message : null,
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
    restore,
    canAccessFeature,
    shouldPromptUpgrade,
    lockedFeatures,
    trackAIUsage,
    trackRewriteUsage,
  }), [
    tier,
    isPremium,
    isEntitlementActive,
    hasPremiumAccess,
    state,
    offeringsQuery.data,
    offeringStatus,
    offeringsError,
    plans,
    dailyAIUsage,
    aiLimitReached,
    remainingAIMessages,
    dailyRewriteUsage,
    rewriteLimitReached,
    remainingRewrites,
    daysRemaining,
    expirationLabel,
    customerInfoQuery.isLoading,
    offeringsQuery.isLoading,
    purchaseMutation.isPending,
    purchaseMutation.error,
    purchaseMutation,
    restoreMutation.isPending,
    restoreMutation.error,
    restore,
    purchase,
    subscribe,
    canAccessFeature,
    shouldPromptUpgrade,
    lockedFeatures,
    trackAIUsage,
    trackRewriteUsage,
  ]);
});
