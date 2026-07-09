import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
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
  fetchRevenueCatDiagnostics,
  isExpoGoPurchases,
  logInPurchases,
  logOutPurchases,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
  hasActiveEntitlement,
  getActiveExpiration,
  getActivePeriodType,
  isTrialActive as rcIsTrialActive,
  PURCHASES_UNAVAILABLE_MESSAGE,
} from '@/services/subscription/purchasesService';
import type { PurchasesPackage } from '@/services/subscription/purchasesService';
import { useAuth } from '@/providers/AuthProvider';
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
  const isExpoGo = isExpoGoPurchases();
  const [dailyAIUsage, setDailyAIUsage] = useState<number>(0);
  const [dailyRewriteUsage, setDailyRewriteUsage] = useState<number>(0);
  const [isRevenueCatIdentified, setIsRevenueCatIdentified] = useState<boolean>(false);
  const shouldUseRevenueCat = !isExpoGo && isAuthenticated && !!user?.id && isRevenueCatIdentified;
  const identifiedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isExpoGo) {
      setIsRevenueCatIdentified(true);
      return;
    }

    let cancelled = false;

    const syncRevenueCatIdentity = async () => {
      if (isAuthenticated && user?.id) {
        if (identifiedUserIdRef.current === user.id && isRevenueCatIdentified) return;
        setIsRevenueCatIdentified(false);
        try {
          await logInPurchases(user.id);
          if (cancelled) return;
          identifiedUserIdRef.current = user.id;
          setIsRevenueCatIdentified(true);
          await queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
          await queryClient.invalidateQueries({ queryKey: ['rc-offerings'] });
          await queryClient.invalidateQueries({ queryKey: ['rc-diagnostics'] });
        } catch (error) {
          console.log('[Subscription] RevenueCat identity sync failed:', error);
          if (!cancelled) setIsRevenueCatIdentified(false);
        }
        return;
      }

      if (identifiedUserIdRef.current) {
        identifiedUserIdRef.current = null;
        setIsRevenueCatIdentified(false);
        await logOutPurchases();
        await queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
        await queryClient.invalidateQueries({ queryKey: ['rc-diagnostics'] });
      } else {
        setIsRevenueCatIdentified(false);
      }
    };

    void syncRevenueCatIdentity();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isExpoGo, isRevenueCatIdentified, queryClient, user?.id]);

  useEffect(() => {
    if (isExpoGo) return;
    if (isAuthenticated && user?.id && !isRevenueCatIdentified) {
      void configurePurchases(user.id);
    }
  }, [isAuthenticated, isExpoGo, isRevenueCatIdentified, user?.id]);

  const customerInfoQuery = useQuery({
    queryKey: ['rc-customer-info'],
    queryFn: fetchCustomerInfo,
    staleTime: 60_000,
    enabled: shouldUseRevenueCat,
  });

  const offeringsQuery = useQuery({
    queryKey: ['rc-offerings'],
    queryFn: fetchOfferings,
    staleTime: 5 * 60_000,
    enabled: shouldUseRevenueCat,
  });

  const revenueCatDiagnosticsQuery = useQuery({
    queryKey: ['rc-diagnostics'],
    queryFn: fetchRevenueCatDiagnostics,
    staleTime: 30_000,
    enabled: __DEV__ && shouldUseRevenueCat,
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
    if (isExpoGo) {
      return {
        tier: 'premium',
        plan: null,
        expiresAt: null,
        startedAt: null,
        trialEndsAt: null,
        isTrialActive: false,
      };
    }

    const info = customerInfoQuery.data ?? null;
    const isEntitlementActive = hasActiveEntitlement(info);
    if (!isEntitlementActive) {
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
  }, [customerInfoQuery.data, isExpoGo]);

  const tier: SubscriptionTier = state.tier;
  const isEntitlementActive = hasActiveEntitlement(customerInfoQuery.data ?? null);
  const isPremium = isExpoGo || isEntitlementActive;
  const hasPremiumAccess = isExpoGo || isEntitlementActive;

  const offeringStatus: OfferingStatus = useMemo(() => {
    if (isExpoGo) return 'preview';
    if (isAuthenticated && !!user?.id && !isRevenueCatIdentified) return 'loading';
    if (offeringsQuery.isLoading || customerInfoQuery.isLoading) return 'loading';
    if (offeringsQuery.isError) return 'error';
    if (offeringsQuery.data?.monthly || offeringsQuery.data?.annual) return 'ready';
    if (offeringsQuery.data) return 'empty';
    if (__DEV__) return 'preview';
    return 'empty';
  }, [customerInfoQuery.isLoading, isAuthenticated, isExpoGo, isRevenueCatIdentified, offeringsQuery.data, offeringsQuery.isError, offeringsQuery.isLoading, user?.id]);

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
    if (offeringStatus === 'preview') return PURCHASES_UNAVAILABLE_MESSAGE;
    return null;
  }, [offeringStatus, offeringsQuery.error]);

  const purchaseMutation = useMutation({
    mutationFn: (pkg: PurchasesPackage) => (isExpoGo ? Promise.resolve(null) : rcPurchasePackage(pkg)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => (isExpoGo ? Promise.resolve(null) : rcRestorePurchases()),
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
    if (isExpoGo) return;
    purchaseMutation.mutate(pkg);
  }, [isExpoGo, purchaseMutation]);

  const restore = useCallback(async () => {
    if (isExpoGo) return true;
    const info = await restoreMutation.mutateAsync();
    return hasActiveEntitlement(info ?? null);
  }, [isExpoGo, restoreMutation]);

  const subscribe = useCallback((_plan: SubscriptionPlan) => {
    if (isExpoGo) return;
    const current = offeringsQuery.data;
    if (!current) {
      throw new Error(PURCHASES_UNAVAILABLE_MESSAGE);
    }
    const pkg = _plan.period === 'yearly' ? current.annual : current.monthly;
    if (!pkg) {
      throw new Error(PURCHASES_UNAVAILABLE_MESSAGE);
    }
    purchaseMutation.mutate(pkg);
  }, [isExpoGo, offeringsQuery.data, purchaseMutation]);

  return useMemo(() => ({
    tier,
    isPremium,
    isEntitlementActive,
    hasPremiumAccess,
    state,
    offering: offeringsQuery.data ?? null,
    offeringStatus,
    offeringsError,
    revenueCatDiagnostics: revenueCatDiagnosticsQuery.data ?? null,
    refreshRevenueCatDiagnostics: () => {
      void queryClient.invalidateQueries({ queryKey: ['rc-diagnostics'] });
    },
    plans,
    dailyAIUsage,
    aiLimitReached,
    remainingAIMessages,
    dailyRewriteUsage,
    rewriteLimitReached,
    remainingRewrites,
    daysRemaining,
    expirationLabel,
    isLoading: !isExpoGo && ((isAuthenticated && !!user?.id && !isRevenueCatIdentified) || customerInfoQuery.isLoading || offeringsQuery.isLoading),
    isSubscribing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    purchaseError: purchaseMutation.error instanceof Error ? purchaseMutation.error.message : null,
    restoreError: restoreMutation.error instanceof Error ? restoreMutation.error.message : null,
    purchase,
    subscribe,
    startTrial: () => {
      if (isExpoGo) return;
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
    revenueCatDiagnosticsQuery.data,
    queryClient,
    plans,
    dailyAIUsage,
    aiLimitReached,
    remainingAIMessages,
    dailyRewriteUsage,
    rewriteLimitReached,
    remainingRewrites,
    daysRemaining,
    expirationLabel,
    isExpoGo,
    isRevenueCatIdentified,
    isAuthenticated,
    user?.id,
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
