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
  fetchCustomerInfo,
  fetchOfferings,
  isExpoGoPurchases,
  logInPurchases,
  logOutPurchases,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
  hasActiveEntitlement,
  classifyRevenueCatAccessProblem,
  getActiveExpiration,
  getActivePeriodType,
  getActiveProductIdentifier,
  isTrialActive as rcIsTrialActive,
  PURCHASES_UNAVAILABLE_MESSAGE,
} from '@/services/subscription/purchasesService';
import type { PurchasesPackage } from '@/services/subscription/purchasesService';
import { useAuth } from '@/providers/AuthProvider';
import {
  REVENUECAT_MONTHLY_PRODUCT_ID,
  REVENUECAT_YEARLY_PRODUCT_ID,
} from '@/constants/revenuecat';
import { trackEvent } from '@/services/analytics/analyticsService';
import { isSubscriptionAccessLoading } from '@/services/subscription/restoreNavigationModel';
import { getAndroidPaywallSelection } from '@/services/subscription/androidPurchaseSelector';
import {
  computeOfferingStatus,
  getOfferingsRecoveryDecision,
  getMembershipOptionsRequestDecision,
  RevenueCatIdentityStatus,
} from '@/services/subscription/paywallLoadingModel';

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

function getMissingMembershipMessage(info: Awaited<ReturnType<typeof fetchCustomerInfo>>): string {
  const classification = classifyRevenueCatAccessProblem(info ?? null);
  if (classification === 'store_purchase_without_entitlement') {
    return 'RevenueCat found a store purchase, but the membership entitlement is not active yet. Tap Restore purchase or contact support if this continues.';
  }
  return 'RevenueCat did not find an active subscription receipt yet. Tap Restore purchase, wait a moment, or try again.';
}

function logRestoreTiming(step: string, startedAt: number, extra?: Record<string, unknown>): void {
  console.log('[RestoreFlow]', {
    step,
    elapsedMs: Date.now() - startedAt,
    ...(extra ?? {}),
  });
}

function logRevenueCatAccessFlow(step: string, details?: Record<string, unknown>): void {
  if (!__DEV__) return;
  console.log('[RevenueCatAccess]', {
    step,
    ...(details ?? {}),
  });
}

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const isExpoGo = isExpoGoPurchases();
  const [dailyAIUsage, setDailyAIUsage] = useState<number>(0);
  const [dailyRewriteUsage, setDailyRewriteUsage] = useState<number>(0);
  const [isRevenueCatIdentified, setIsRevenueCatIdentified] = useState<boolean>(false);
  const [revenueCatIdentityStatus, setRevenueCatIdentityStatus] = useState<RevenueCatIdentityStatus>('idle');
  const [identityRetryNonce, setIdentityRetryNonce] = useState<number>(0);
  const [membershipOptionsRequestNonce, setMembershipOptionsRequestNonce] = useState<number>(0);
  const [accountGeneration, setAccountGeneration] = useState<number>(0);
  const shouldUseRevenueCat = !isExpoGo && isAuthenticated && !!user?.id && isRevenueCatIdentified;
  const identifiedUserIdRef = useRef<string | null>(null);
  const activeAccountUserIdRef = useRef<string | null>(null);
  const accountGenerationRef = useRef<number>(0);
  const membershipOptionsRequestKeyRef = useRef<string | null>(null);
  const offeringsRecoveryKeyRef = useRef<string | null>(null);
  const membershipOptionsRetryPromiseRef = useRef<Promise<void> | null>(null);
  const customerInfoQueryKey = useMemo(() => ['rc-customer-info', user?.id ?? 'anonymous'] as const, [user?.id]);
  const offeringsQueryKey = useMemo(() => ['rc-offerings'] as const, []);

  useEffect(() => {
    if (isExpoGo) {
      setIsRevenueCatIdentified(true);
      setRevenueCatIdentityStatus('ready');
      return;
    }

    let cancelled = false;

    const syncRevenueCatIdentity = async () => {
      const nextUserId = isAuthenticated && user?.id ? user.id : null;
      if (activeAccountUserIdRef.current !== nextUserId) {
        activeAccountUserIdRef.current = nextUserId;
        accountGenerationRef.current += 1;
        const nextAccountGeneration = accountGenerationRef.current;
        setAccountGeneration(nextAccountGeneration);
        membershipOptionsRequestKeyRef.current = null;
        offeringsRecoveryKeyRef.current = null;
        membershipOptionsRetryPromiseRef.current = null;
        setMembershipOptionsRequestNonce(0);
        setIdentityRetryNonce(0);
        await queryClient.cancelQueries({ queryKey: ['rc-customer-info'] });
        queryClient.removeQueries({ queryKey: ['rc-customer-info'] });
        logRevenueCatAccessFlow('account_generation_changed', {
          accountGeneration: nextAccountGeneration,
          hasSupabaseUser: !!nextUserId,
        });
      }

      if (isAuthenticated && user?.id) {
        if (identifiedUserIdRef.current === user.id && isRevenueCatIdentified) return;
        if (identifiedUserIdRef.current && identifiedUserIdRef.current !== user.id) {
          await queryClient.cancelQueries({ queryKey: ['rc-customer-info'] });
          queryClient.removeQueries({ queryKey: ['rc-customer-info'] });
          membershipOptionsRequestKeyRef.current = null;
          offeringsRecoveryKeyRef.current = null;
        }
        setIsRevenueCatIdentified(false);
        setRevenueCatIdentityStatus('loading');
        logRevenueCatAccessFlow('login_start', {
          hasSupabaseUser: true,
          accountGeneration: accountGenerationRef.current,
        });
        try {
          const info = await logInPurchases(user.id);
          if (!info) {
            throw new Error('RevenueCat login did not return customer info.');
          }
          if (cancelled) return;
          if (activeAccountUserIdRef.current !== user.id) {
            logRevenueCatAccessFlow('login_stale_ignored', {
              accountGeneration: accountGenerationRef.current,
            });
            return;
          }
          identifiedUserIdRef.current = user.id;
          membershipOptionsRequestKeyRef.current = null;
          offeringsRecoveryKeyRef.current = null;
          await queryClient.cancelQueries({ queryKey: customerInfoQueryKey });
          if (cancelled) return;
          if (activeAccountUserIdRef.current !== user.id) return;
          queryClient.setQueryData(customerInfoQueryKey, info);
          setIsRevenueCatIdentified(true);
          setRevenueCatIdentityStatus('ready');
          setMembershipOptionsRequestNonce((value) => value + 1);
          logRevenueCatAccessFlow('login_success', {
            accountGeneration: accountGenerationRef.current,
          });
          void queryClient.invalidateQueries({ queryKey: customerInfoQueryKey }).catch((error) => {
            if (__DEV__) {
              console.log('[SubscriptionProvider] post-login CustomerInfo refresh failed:', error);
            }
          });
        } catch (error) {
          if (!cancelled) {
            setIsRevenueCatIdentified(false);
            setRevenueCatIdentityStatus('error');
            logRevenueCatAccessFlow('login_failure', {
              hasSupabaseUser: !!user?.id,
              accountGeneration: accountGenerationRef.current,
              message: error instanceof Error ? error.message : String(error),
            });
            if (__DEV__) {
              console.log('[SubscriptionProvider] RevenueCat login failed', {
                hasSupabaseUser: !!user?.id,
                message: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
        return;
      }

      if (identifiedUserIdRef.current) {
        identifiedUserIdRef.current = null;
        membershipOptionsRequestKeyRef.current = null;
        offeringsRecoveryKeyRef.current = null;
        setIsRevenueCatIdentified(false);
        setRevenueCatIdentityStatus('idle');
        await logOutPurchases();
        await queryClient.cancelQueries({ queryKey: ['rc-customer-info'] });
        queryClient.removeQueries({ queryKey: ['rc-customer-info'] });
      } else {
        setIsRevenueCatIdentified(false);
        setRevenueCatIdentityStatus('idle');
        await queryClient.cancelQueries({ queryKey: ['rc-customer-info'] });
        queryClient.removeQueries({ queryKey: ['rc-customer-info'] });
      }
    };

    void syncRevenueCatIdentity();

    return () => {
      cancelled = true;
    };
  }, [customerInfoQueryKey, identityRetryNonce, isAuthenticated, isExpoGo, isRevenueCatIdentified, queryClient, user?.id]);

  const customerInfoQuery = useQuery({
    queryKey: customerInfoQueryKey,
    queryFn: fetchCustomerInfo,
    staleTime: 60_000,
    enabled: shouldUseRevenueCat,
  });

  const offeringsQuery = useQuery({
    queryKey: offeringsQueryKey,
    queryFn: fetchOfferings,
    staleTime: 5 * 60_000,
    enabled: !isExpoGo && isAuthenticated && !!user?.id,
    retry: 1,
  });

  useEffect(() => {
    const decision = getMembershipOptionsRequestDecision({
      shouldUseRevenueCat,
      userKey: user?.id,
      requestNonce: membershipOptionsRequestNonce,
      lastRequestKey: membershipOptionsRequestKeyRef.current,
    });
    if (!decision.shouldStart || !decision.requestKey) return;
    membershipOptionsRequestKeyRef.current = decision.requestKey;
    if (__DEV__) {
      console.log('[SubscriptionProvider] RevenueCat requests started', {
        hasSupabaseUser: true,
        identityReady: isRevenueCatIdentified,
        requestNonce: membershipOptionsRequestNonce,
        accountGeneration,
      });
    }
    void Promise.all([
      customerInfoQuery.refetch(),
      offeringsQuery.refetch(),
    ]).catch((error) => {
      if (__DEV__) {
        console.log('[SubscriptionProvider] RevenueCat request refetch failed', {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }, [accountGeneration, customerInfoQuery, isRevenueCatIdentified, membershipOptionsRequestNonce, offeringsQuery, shouldUseRevenueCat, user?.id]);

  useEffect(() => {
    const decision = getOfferingsRecoveryDecision({
      shouldUseRevenueCat,
      userKey: user?.id,
      accountGeneration,
      identityStatus: revenueCatIdentityStatus,
      hasOffering: !!offeringsQuery.data,
      isOfferingsLoading: offeringsQuery.isFetching,
      recoveryAttemptedForKey: offeringsRecoveryKeyRef.current,
    });
    if (!decision.shouldStart || !decision.requestKey) return;
    offeringsRecoveryKeyRef.current = decision.requestKey;
    logRevenueCatAccessFlow('offerings_auto_recovery_start', {
      accountGeneration,
      reason: offeringsQuery.isError ? 'previous_failure' : 'missing_offering_after_identity_ready',
    });
    void offeringsQuery.refetch().then((result) => {
      logRevenueCatAccessFlow(result.data ? 'offerings_auto_recovery_success' : 'offerings_auto_recovery_empty', {
        accountGeneration,
      });
    }).catch((error) => {
      logRevenueCatAccessFlow('offerings_auto_recovery_failure', {
        accountGeneration,
        message: error instanceof Error ? error.message : String(error),
      });
    });
  }, [
    accountGeneration,
    offeringsQuery,
    offeringsQuery.data,
    offeringsQuery.isError,
    offeringsQuery.isFetching,
    revenueCatIdentityStatus,
    shouldUseRevenueCat,
    user?.id,
  ]);

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
  const activeProductIdentifier = getActiveProductIdentifier(customerInfoQuery.data ?? null);
  const isPremium = isExpoGo || isEntitlementActive;
  const hasPremiumAccess = isExpoGo || isEntitlementActive;
  const subscriptionAccessLoading = isSubscriptionAccessLoading({
    isExpoGo,
    isAuthenticated,
    hasUserId: !!user?.id,
    isRevenueCatIdentified,
    isCustomerInfoLoading: customerInfoQuery.isLoading,
    isOfferingsLoading: offeringsQuery.isLoading,
    customerInfo: customerInfoQuery.data ?? null,
  });

  const offeringStatus: OfferingStatus = useMemo(() => {
    return computeOfferingStatus({
      isExpoGo,
      isAuthenticated,
      hasUserId: !!user?.id,
      identityStatus: revenueCatIdentityStatus,
      isRevenueCatIdentified,
      isOfferingsLoading: offeringsQuery.isLoading,
      isOfferingsError: offeringsQuery.isError,
      hasMonthlyPackage: !!offeringsQuery.data?.monthly,
      hasAnnualPackage: !!offeringsQuery.data?.annual,
      hasOffering: !!offeringsQuery.data,
      isDev: __DEV__,
    });
  }, [isAuthenticated, isExpoGo, isRevenueCatIdentified, offeringsQuery.data, offeringsQuery.isError, offeringsQuery.isLoading, revenueCatIdentityStatus, user?.id]);

  const plans = useMemo<SubscriptionPlan[]>(() => {
    const offering = offeringsQuery.data;
    if (!offering) {
      return offeringStatus === 'preview' ? FALLBACK_PREVIEW_PLANS : [];
    }

    const nextPlans: SubscriptionPlan[] = [];

    if (offering.monthly) {
      const androidSelection = Platform.OS === 'android'
        ? getAndroidPaywallSelection({
            pkg: offering.monthly,
            period: 'monthly',
            customerInfo: customerInfoQuery.data ?? null,
          })
        : null;
      nextPlans.push({
        id: 'monthly',
        name: 'Monthly',
        period: 'monthly',
        price: 0,
        priceLabel: `${offering.monthly.product.priceString}/mo`,
        productIdentifier: offering.monthly.product.identifier ?? REVENUECAT_MONTHLY_PRODUCT_ID,
        packageIdentifier: offering.monthly.identifier,
        androidTrialCopy: androidSelection?.trialCopy ?? null,
      });
    }

    if (offering.annual) {
      const androidSelection = Platform.OS === 'android'
        ? getAndroidPaywallSelection({
            pkg: offering.annual,
            period: 'yearly',
            customerInfo: customerInfoQuery.data ?? null,
          })
        : null;
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
        androidTrialCopy: androidSelection?.trialCopy ?? null,
      });
    }

    return nextPlans;
  }, [customerInfoQuery.data, offeringStatus, offeringsQuery.data]);

  const offeringsError = useMemo(() => {
    if (offeringsQuery.error instanceof Error) return offeringsQuery.error.message;
    if (offeringStatus === 'empty') return 'No RevenueCat offering was returned for this app.';
    if (offeringStatus === 'preview') return PURCHASES_UNAVAILABLE_MESSAGE;
    return null;
  }, [offeringStatus, offeringsQuery.error]);

  const purchaseMutation = useMutation({
    mutationFn: async (input: { pkg: PurchasesPackage; period: SubscriptionPlan['period'] }) => {
      if (isExpoGo) return null;
      if (!user?.id) {
        throw new Error('Please sign in again before starting your membership.');
      }
      const info = await rcPurchasePackage(input.pkg, user.id, input.period);
      const membershipActive = hasActiveEntitlement(info ?? null);
      await queryClient.cancelQueries({ queryKey: customerInfoQueryKey });
      if (info) {
        queryClient.setQueryData(customerInfoQueryKey, info);
      }
      if (!membershipActive) {
        throw new Error(getMissingMembershipMessage(info ?? null));
      }
      return info;
    },
    onSuccess: (info) => {
      if (rcIsTrialActive(info ?? null)) {
        void trackEvent('trial_started');
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (isExpoGo) return Promise.resolve(null);
      if (!user?.id) {
        return Promise.reject(new Error('Please sign in again before restoring purchases.'));
      }
      const startedAt = Date.now();
      const info = await rcRestorePurchases(user.id);
      logRestoreTiming('provider:restoreMutationResolved', startedAt, {
        hasActiveEntitlement: hasActiveEntitlement(info ?? null),
      });
      return info;
    },
    onSuccess: async (info) => {
      const startedAt = Date.now();
      await queryClient.cancelQueries({ queryKey: customerInfoQueryKey });
      if (info) {
        queryClient.setQueryData(customerInfoQueryKey, info);
      }
      logRestoreTiming('provider:setFreshCustomerInfo', startedAt, {
        hasActiveEntitlement: hasActiveEntitlement(info ?? null),
      });
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
    purchaseMutation.mutate({ pkg, period: 'monthly' });
  }, [isExpoGo, purchaseMutation]);

  const restore = useCallback(async () => {
    if (isExpoGo) return true;
    const startedAt = Date.now();
    const info = await restoreMutation.mutateAsync();
    if (!hasActiveEntitlement(info ?? null)) {
      logRestoreTiming('provider:restoreNoEntitlement', startedAt);
      throw new Error(getMissingMembershipMessage(info ?? null));
    }
    logRestoreTiming('provider:restoreActiveEntitlementConfirmed', startedAt);
    return hasActiveEntitlement(info ?? null);
  }, [isExpoGo, restoreMutation]);

  const retryMembershipOptions = useCallback(async () => {
    if (isExpoGo) return;
    if (membershipOptionsRetryPromiseRef.current) {
      return membershipOptionsRetryPromiseRef.current;
    }
    membershipOptionsRequestKeyRef.current = null;
    const retry = async () => {
      if (!isAuthenticated || !user?.id) {
        setRevenueCatIdentityStatus('idle');
        return;
      }
      if (!isRevenueCatIdentified) {
        setRevenueCatIdentityStatus('idle');
        setIdentityRetryNonce((value) => value + 1);
        setMembershipOptionsRequestNonce((value) => value + 1);
        return;
      }
      if (__DEV__) {
        console.log('[SubscriptionProvider] RevenueCat retry requested', {
          hasSupabaseUser: true,
          identityReady: true,
          accountGeneration,
        });
      }
      await Promise.all([
        customerInfoQuery.refetch(),
        offeringsQuery.refetch(),
      ]);
    };
    membershipOptionsRetryPromiseRef.current = retry().finally(() => {
      membershipOptionsRetryPromiseRef.current = null;
    });
    return membershipOptionsRetryPromiseRef.current;
  }, [accountGeneration, customerInfoQuery, isAuthenticated, isExpoGo, isRevenueCatIdentified, offeringsQuery, user?.id]);

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
    purchaseMutation.mutate({ pkg, period: _plan.period });
  }, [isExpoGo, offeringsQuery.data, purchaseMutation]);

  return useMemo(() => ({
    tier,
    isPremium,
    isEntitlementActive,
    activeProductIdentifier,
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
    isLoading: subscriptionAccessLoading,
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
      if (pkg) purchaseMutation.mutate({ pkg, period: current?.annual ? 'yearly' : 'monthly' });
    },
    cancel: () => {},
    restore,
    retryMembershipOptions,
    canAccessFeature,
    shouldPromptUpgrade,
    lockedFeatures,
    trackAIUsage,
    trackRewriteUsage,
  }), [
    tier,
    isPremium,
    isEntitlementActive,
    activeProductIdentifier,
    hasPremiumAccess,
    state,
    subscriptionAccessLoading,
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
    isExpoGo,
    purchaseMutation,
    restoreMutation.isPending,
    restoreMutation.error,
    restore,
    retryMembershipOptions,
    purchase,
    subscribe,
    canAccessFeature,
    shouldPromptUpgrade,
    lockedFeatures,
    trackAIUsage,
    trackRewriteUsage,
  ]);
});
