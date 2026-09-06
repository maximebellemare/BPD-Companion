import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  addCustomerInfoUpdateListener,
  isNativePurchasesPlatform,
  isExpoGoPurchases,
  logInPurchases,
  logOutPurchases,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
  hasActiveEntitlement,
  classifyRevenueCatAccessProblem,
  getActiveExpiration,
  getActivePlanPeriodType,
  getActivePeriodType,
  getActiveBillingIssueDetectedAt,
  getBillingIssueRecoveryState,
  getActiveProductIdentifier,
  getActiveUnsubscribeDetectedAt,
  getActiveWillRenew,
  getKnownInactiveExpiration,
  getManagementUrl,
  getRevenueCatAccessKind,
  getActiveTrialStartedAt,
  isTrialActive as rcIsTrialActive,
  checkTrialIntroEligibility,
  PURCHASES_UNAVAILABLE_MESSAGE,
} from '@/services/subscription/purchasesService';
import type { PurchasesOffering, PurchasesPackage } from '@/services/subscription/purchasesService';
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
import {
  type PendingPlanChange,
  createPendingPlanChange,
  getPendingPlanChangeStorageKey,
  validatePendingPlanChange,
} from '@/services/subscription/pendingPlanChangeModel';
import {
  createLocalizedSubscriptionPlan,
  getLifetimePackageFromOffering,
} from '@/services/subscription/localizedPricingModel';
import { shouldApplyCustomerInfoListenerUpdate } from '@/services/subscription/postPurchaseRecoveryModel';
import {
  getBillingIssueAnalyticsMetadata,
  type BillingIssueRecoveryState,
} from '@/services/subscription/billingIssueRecoveryModel';
import {
  createNativeCustomerInfoFreshBootstrapGate,
  shouldForceFreshCustomerInfoForRefreshReason,
} from '@/services/subscription/customerInfoRefreshModel';
import {
  clearTrialEndingReminderForOwnerChange,
  createTrialReminderOwnerKey,
  reconcileTrialEndingReminder,
  scheduleTrialEndingReminderAfterPurchase,
} from '@/services/subscription/trialEndingReminderService';
import { getTrialEndingReminderReadiness } from '@/services/subscription/trialReminderModel';
import {
  createPendingTrialReminderAttempt,
  getPendingTrialReminderDecision,
  type PendingTrialReminderAttempt,
} from '@/services/subscription/trialReminderPendingAttemptModel';

type OfferingStatus = 'loading' | 'ready' | 'empty' | 'error' | 'preview';

const FALLBACK_PREVIEW_PLANS: SubscriptionPlan[] = [
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
  {
    id: 'monthly',
    name: 'Monthly',
    period: 'monthly',
    price: 9.99,
    priceLabel: '$9.99/mo',
    productIdentifier: REVENUECAT_MONTHLY_PRODUCT_ID,
    isFallbackPrice: true,
  },
];

function isRecurringSubscriptionPeriod(period: SubscriptionPlan['period']): period is 'monthly' | 'yearly' {
  return period === 'monthly' || period === 'yearly';
}

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

const nativeCustomerInfoFreshBootstrapGate = createNativeCustomerInfoFreshBootstrapGate();

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
  const [pendingPlanChange, setPendingPlanChange] = useState<PendingPlanChange | null>(null);
  const shouldUseRevenueCat = !isExpoGo && isAuthenticated && !!user?.id && isRevenueCatIdentified;
  const identifiedUserIdRef = useRef<string | null>(null);
  const activeAccountUserIdRef = useRef<string | null>(null);
  const accountGenerationRef = useRef<number>(0);
  const membershipOptionsRequestKeyRef = useRef<string | null>(null);
  const offeringsRecoveryKeyRef = useRef<string | null>(null);
  const membershipOptionsRetryPromiseRef = useRef<Promise<void> | null>(null);
  const membershipOptionsRefreshPromiseRef = useRef<Promise<void> | null>(null);
  const previousBillingIssueRecoveryRef = useRef<BillingIssueRecoveryState | null>(null);
  const pendingTrialReminderAttemptRef = useRef<PendingTrialReminderAttempt | null>(null);
  const pendingTrialReminderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTrialReminderSchedulePromiseRef = useRef<Promise<void> | null>(null);
  const customerInfoQueryKey = useMemo(() => ['rc-customer-info', user?.id ?? 'anonymous'] as const, [user?.id]);
  const offeringsQueryKey = useMemo(() => ['rc-offerings'] as const, []);

  const clearPendingTrialReminderAttempt = useCallback((_reason: string): void => {
    if (pendingTrialReminderTimeoutRef.current) {
      clearTimeout(pendingTrialReminderTimeoutRef.current);
      pendingTrialReminderTimeoutRef.current = null;
    }
    pendingTrialReminderAttemptRef.current = null;
  }, []);

  const createPendingTrialReminderAttemptForPurchase = useCallback((
    info: Awaited<ReturnType<typeof fetchCustomerInfo>>,
    ownerId: string | null | undefined,
  ): void => {
    const ownerKey = createTrialReminderOwnerKey(ownerId);
    if (!ownerKey) return;

    clearPendingTrialReminderAttempt('replaced_by_new_purchase');
    const now = Date.now();
    const attempt = createPendingTrialReminderAttempt({
      accountGeneration: accountGenerationRef.current,
      now,
      ownerKey,
      productIdentifier: getActiveProductIdentifier(info ?? null),
    });
    pendingTrialReminderAttemptRef.current = attempt;
    pendingTrialReminderTimeoutRef.current = setTimeout(() => {
      if (pendingTrialReminderAttemptRef.current === attempt) {
        clearPendingTrialReminderAttempt('pending_attempt_expired');
      }
    }, Math.max(1, attempt.expiresAt - now));
  }, [clearPendingTrialReminderAttempt]);

  const retryPendingTrialReminderAttempt = useCallback((
    info: Awaited<ReturnType<typeof fetchCustomerInfo>>,
    _source: string,
  ): void => {
    const attempt = pendingTrialReminderAttemptRef.current;
    if (!attempt) {
      return;
    }
    if (pendingTrialReminderSchedulePromiseRef.current) {
      return;
    }

    const now = Date.now();
    const ownerKey = createTrialReminderOwnerKey(user?.id ?? null);
    const readiness = getTrialEndingReminderReadiness(info ?? null, now);
    const decision = getPendingTrialReminderDecision({
      accountGeneration: accountGenerationRef.current,
      attempt,
      now,
      ownerKey,
      readiness,
    });

    if (decision.action === 'wait') return;
    if (decision.action === 'clear') {
      clearPendingTrialReminderAttempt(decision.reason);
      return;
    }

    pendingTrialReminderSchedulePromiseRef.current = scheduleTrialEndingReminderAfterPurchase(info ?? null, {
      ownerId: user?.id ?? null,
    }).then((result) => {
      if (pendingTrialReminderAttemptRef.current !== attempt) return;
      if (
        result.status === 'scheduled' ||
        result.status === 'skipped_duplicate' ||
        result.status === 'skipped_missing_owner' ||
        result.status === 'skipped_no_trial' ||
        result.status === 'skipped_permission_denied' ||
        result.status === 'skipped_unsupported_platform'
      ) {
        clearPendingTrialReminderAttempt(result.status);
      }
    }).catch(() => {}).finally(() => {
      pendingTrialReminderSchedulePromiseRef.current = null;
    });
  }, [clearPendingTrialReminderAttempt, user?.id]);

  useEffect(() => {
    return () => {
      if (pendingTrialReminderTimeoutRef.current) {
        clearTimeout(pendingTrialReminderTimeoutRef.current);
        pendingTrialReminderTimeoutRef.current = null;
      }
    };
  }, []);

  const persistPendingPlanChange = useCallback(async (record: PendingPlanChange | null) => {
    const userId = user?.id ?? null;
    setPendingPlanChange(record);
    if (!userId) return;
    const storageKey = getPendingPlanChangeStorageKey(userId);
    try {
      if (record) {
        await AsyncStorage.setItem(storageKey, JSON.stringify(record));
      } else {
        await AsyncStorage.removeItem(storageKey);
      }
    } catch {
      // Display-only state; storage failures must never affect access.
    }
  }, [user?.id]);

  useEffect(() => {
    if (isExpoGo) {
      setIsRevenueCatIdentified(true);
      setRevenueCatIdentityStatus('ready');
      return;
    }

    let cancelled = false;

    const syncRevenueCatIdentity = async () => {
      const nextUserId = isAuthenticated && user?.id ? user.id : null;
      const previousUserId = activeAccountUserIdRef.current;
      if (previousUserId !== nextUserId) {
        if (previousUserId) {
          await clearTrialEndingReminderForOwnerChange({ ownerId: previousUserId });
        }
        activeAccountUserIdRef.current = nextUserId;
        accountGenerationRef.current += 1;
        const nextAccountGeneration = accountGenerationRef.current;
        setAccountGeneration(nextAccountGeneration);
        membershipOptionsRequestKeyRef.current = null;
        offeringsRecoveryKeyRef.current = null;
        membershipOptionsRetryPromiseRef.current = null;
        membershipOptionsRefreshPromiseRef.current = null;
        clearPendingTrialReminderAttempt('account_changed');
        setPendingPlanChange(null);
        setMembershipOptionsRequestNonce(0);
        setIdentityRetryNonce(0);
        await queryClient.cancelQueries({ queryKey: ['rc-customer-info'] });
        queryClient.removeQueries({ queryKey: ['rc-customer-info'] });
        void queryClient.cancelQueries({ queryKey: offeringsQueryKey })
          .then(() => queryClient.invalidateQueries({ queryKey: offeringsQueryKey }));
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
          clearPendingTrialReminderAttempt('account_changed');
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
          const shouldRunNativeBootstrapFreshFetch = nativeCustomerInfoFreshBootstrapGate.shouldRun(Platform.OS, user.id);
          if (shouldRunNativeBootstrapFreshFetch) {
            void fetchCustomerInfo({
              forceFresh: true,
              reason: 'native_identity_bootstrap',
            }).then(async (freshInfo) => {
              if (!freshInfo || cancelled) return;
              if (activeAccountUserIdRef.current !== user.id) return;
              await queryClient.cancelQueries({ queryKey: customerInfoQueryKey });
              if (cancelled || activeAccountUserIdRef.current !== user.id) return;
              queryClient.setQueryData(customerInfoQueryKey, freshInfo);
              logRevenueCatAccessFlow('native_bootstrap_fresh_customer_info', {
                accountGeneration: accountGenerationRef.current,
              });
            }).catch((error) => {
              if (__DEV__) {
                console.log('[SubscriptionProvider] Native bootstrap fresh CustomerInfo failed', {
                  message: error instanceof Error ? error.message : String(error),
                });
              }
            });
          } else {
            void queryClient.invalidateQueries({ queryKey: customerInfoQueryKey }).catch((error) => {
              if (__DEV__) {
                console.log('[SubscriptionProvider] post-login CustomerInfo refresh failed:', error);
              }
            });
          }
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
        clearPendingTrialReminderAttempt('logged_out');
        setPendingPlanChange(null);
        setIsRevenueCatIdentified(false);
        setRevenueCatIdentityStatus('idle');
        await logOutPurchases();
        await queryClient.cancelQueries({ queryKey: ['rc-customer-info'] });
        queryClient.removeQueries({ queryKey: ['rc-customer-info'] });
      } else {
        setPendingPlanChange(null);
        clearPendingTrialReminderAttempt('logged_out');
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
  }, [clearPendingTrialReminderAttempt, customerInfoQueryKey, identityRetryNonce, isAuthenticated, isExpoGo, isRevenueCatIdentified, offeringsQueryKey, queryClient, user?.id]);

  useEffect(() => {
    if (!shouldUseRevenueCat || !user?.id) return;
    let active = true;
    const listenerUserId = user.id;
    let removeListener: (() => void) | null = null;

    void addCustomerInfoUpdateListener((info) => {
      if (!shouldApplyCustomerInfoListenerUpdate({
        listenerActive: active,
        listenerUserId,
        currentUserId: activeAccountUserIdRef.current,
      })) return;
      void queryClient.cancelQueries({ queryKey: ['rc-customer-info', listenerUserId] })
        .finally(() => {
          if (!active || activeAccountUserIdRef.current !== listenerUserId) return;
          queryClient.setQueryData(['rc-customer-info', listenerUserId], info);
          logRevenueCatAccessFlow('customer_info_listener_update', {
            accountGeneration: accountGenerationRef.current,
          });
        });
    })
      .then((cleanup) => {
        if (!active) {
          cleanup();
          return;
        }
        removeListener = cleanup;
      })
      .catch((error) => {
        if (__DEV__) {
          console.log('[SubscriptionProvider] CustomerInfo listener registration failed', {
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });

    return () => {
      active = false;
      removeListener?.();
    };
  }, [queryClient, shouldUseRevenueCat, user?.id]);

  useEffect(() => {
    let cancelled = false;
    const userId = user?.id ?? null;
    if (!userId) {
      setPendingPlanChange(null);
      return;
    }

    const storageKey = getPendingPlanChangeStorageKey(userId);
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (cancelled || !stored) return;
        const parsed = JSON.parse(stored) as PendingPlanChange;
        if (
          (parsed.platform === 'android' || parsed.platform === 'ios') &&
          (parsed.sourcePeriod === 'monthly' || parsed.sourcePeriod === 'yearly') &&
          (parsed.targetPeriod === 'monthly' || parsed.targetPeriod === 'yearly')
        ) {
          setPendingPlanChange(parsed);
          return;
        }
        void AsyncStorage.removeItem(storageKey);
      })
      .catch(() => {
        void AsyncStorage.removeItem(storageKey);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const customerInfoQuery = useQuery({
    queryKey: customerInfoQueryKey,
    queryFn: () => fetchCustomerInfo(),
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

  const iosTrialEligibilityProductIdentifiers = useMemo(() => {
    if (Platform.OS !== 'ios') return [];
    return Array.from(new Set([
      offeringsQuery.data?.monthly?.product.identifier,
      offeringsQuery.data?.annual?.product.identifier,
    ].filter((value): value is string => !!value)));
  }, [offeringsQuery.data]);

  const iosTrialEligibilityQuery = useQuery({
    queryKey: ['rc-ios-trial-eligibility', iosTrialEligibilityProductIdentifiers.join('|')] as const,
    queryFn: () => checkTrialIntroEligibility(iosTrialEligibilityProductIdentifiers),
    staleTime: 5 * 60_000,
    enabled: Platform.OS === 'ios' &&
      !isExpoGo &&
      isAuthenticated &&
      iosTrialEligibilityProductIdentifiers.length > 0,
    retry: 0,
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
    const period = getActivePlanPeriodType(info);
    const trial = rcIsTrialActive(info);
    const plan: SubscriptionPlan | null = period
      ? {
          id: period,
          name: period === 'lifetime' ? 'Lifetime' : period === 'yearly' ? 'Yearly' : 'Monthly',
          period,
          price: period === 'lifetime' ? 0 : period === 'yearly' ? 59.99 : 9.99,
          priceLabel: period === 'lifetime' ? 'Lifetime' : period === 'yearly' ? '$59.99/yr' : '$9.99/mo',
        }
      : null;
    return {
      tier: 'premium',
      plan,
      expiresAt,
      startedAt: getActiveTrialStartedAt(info),
      trialEndsAt: trial ? expiresAt : null,
      isTrialActive: trial,
    };
  }, [customerInfoQuery.data, isExpoGo]);

  const tier: SubscriptionTier = state.tier;
  const isEntitlementActive = hasActiveEntitlement(customerInfoQuery.data ?? null);
  const activeProductIdentifier = getActiveProductIdentifier(customerInfoQuery.data ?? null);
  const activeWillRenew = getActiveWillRenew(customerInfoQuery.data ?? null);
  const activeBillingIssueDetectedAt = getActiveBillingIssueDetectedAt(customerInfoQuery.data ?? null);
  const activeUnsubscribeDetectedAt = getActiveUnsubscribeDetectedAt(customerInfoQuery.data ?? null);
  const activeManagementUrl = getManagementUrl(customerInfoQuery.data ?? null);
  const inactiveExpirationAt = getKnownInactiveExpiration(customerInfoQuery.data ?? null);
  const billingIssueRecoveryState = getBillingIssueRecoveryState(customerInfoQuery.data ?? null);
  const revenueCatAccessKind = getRevenueCatAccessKind(customerInfoQuery.data ?? null);
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

  useEffect(() => {
    const previous = previousBillingIssueRecoveryRef.current;
    if (previous && !billingIssueRecoveryState && isEntitlementActive) {
      void trackEvent('billing_issue_recovered', getBillingIssueAnalyticsMetadata(previous));
    }
    previousBillingIssueRecoveryRef.current = billingIssueRecoveryState;
  }, [billingIssueRecoveryState, isEntitlementActive]);

  useEffect(() => {
    if (isExpoGo) return;
    if (shouldUseRevenueCat && customerInfoQuery.data === undefined) return;
    void reconcileTrialEndingReminder(customerInfoQuery.data ?? null, { ownerId: user?.id ?? null });
    retryPendingTrialReminderAttempt(customerInfoQuery.data ?? null, 'customer_info_reconciliation');
  }, [customerInfoQuery.data, isExpoGo, retryPendingTrialReminderAttempt, shouldUseRevenueCat, user?.id]);

  useEffect(() => {
    if (!pendingPlanChange) return;
    if (shouldUseRevenueCat && customerInfoQuery.data === undefined) return;
    const result = validatePendingPlanChange({
      record: pendingPlanChange,
      hasActiveEntitlement: isEntitlementActive,
      currentPeriod: state.plan && isRecurringSubscriptionPeriod(state.plan.period) ? state.plan.period : null,
      expiresAt: state.expiresAt,
      willRenew: activeWillRenew,
      platform: Platform.OS,
    });

    if (result.status === 'clear') {
      void persistPendingPlanChange(null);
      return;
    }

    if (result.status === 'valid' && JSON.stringify(result.record) !== JSON.stringify(pendingPlanChange)) {
      void persistPendingPlanChange(result.record);
    }
  }, [activeWillRenew, customerInfoQuery.data, isEntitlementActive, pendingPlanChange, persistPendingPlanChange, shouldUseRevenueCat, state.expiresAt, state.plan]);

  const plans = useMemo<SubscriptionPlan[]>(() => {
    const offering = offeringsQuery.data;
    if (!offering) {
      return offeringStatus === 'preview' ? FALLBACK_PREVIEW_PLANS : [];
    }

    const nextPlans: SubscriptionPlan[] = [];

    let monthlyPlan: SubscriptionPlan | null = null;
    let annualPlan: SubscriptionPlan | null = null;

    if (offering.monthly) {
      const androidSelection = Platform.OS === 'android'
        ? getAndroidPaywallSelection({
            pkg: offering.monthly,
            period: 'monthly',
            customerInfo: customerInfoQuery.data ?? null,
          })
        : null;
      monthlyPlan = createLocalizedSubscriptionPlan({
        pkg: offering.monthly,
        period: 'monthly',
        fallbackProductIdentifier: REVENUECAT_MONTHLY_PRODUCT_ID,
        androidTrialCopy: androidSelection?.trialCopy ?? null,
        trialDays: androidSelection?.trialDays ?? null,
        trialEligibilityStatus: Platform.OS === 'android'
          ? (androidSelection?.trialCopy ? 'eligible' : 'unknown')
          : iosTrialEligibilityQuery.data?.[offering.monthly.product.identifier] ?? 'unknown',
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
      annualPlan = createLocalizedSubscriptionPlan({
        pkg: offering.annual,
        period: 'yearly',
        fallbackProductIdentifier: REVENUECAT_YEARLY_PRODUCT_ID,
        androidTrialCopy: androidSelection?.trialCopy ?? null,
        trialDays: androidSelection?.trialDays ?? null,
        trialEligibilityStatus: Platform.OS === 'android'
          ? (androidSelection?.trialCopy ? 'eligible' : 'unknown')
          : iosTrialEligibilityQuery.data?.[offering.annual.product.identifier] ?? 'unknown',
      });
    }

    if (annualPlan) nextPlans.push(annualPlan);
    if (monthlyPlan) nextPlans.push(monthlyPlan);

    return nextPlans;
  }, [customerInfoQuery.data, iosTrialEligibilityQuery.data, offeringStatus, offeringsQuery.data]);

  const offeringsError = useMemo(() => {
    if (offeringsQuery.error instanceof Error) return offeringsQuery.error.message;
    if (offeringStatus === 'empty') return 'No RevenueCat offering was returned for this app.';
    if (offeringStatus === 'preview') return PURCHASES_UNAVAILABLE_MESSAGE;
    return null;
  }, [offeringStatus, offeringsQuery.error]);

  const logMembershipOfferingsSnapshot = useCallback((reason: string, offering: PurchasesOffering | null | undefined): void => {
    if (!__DEV__) return;
    if (!offering || !isNativePurchasesPlatform()) return;
    const toSnapshot = (pkg: PurchasesPackage | null | undefined) => {
      if (!pkg) return null;
      const product = pkg.product as PurchasesPackage['product'] & {
        currencyCode?: string | null;
        productCategory?: string | null;
        productType?: string | null;
      };
      return {
        packageIdentifier: pkg.identifier,
        packageType: pkg.packageType,
        productIdentifier: product.identifier,
        priceString: product.priceString,
        price: product.price,
        currencyCode: product.currencyCode ?? null,
        productCategory: product.productCategory ?? null,
        productType: product.productType ?? null,
      };
    };
    console.log('[MembershipPricing]', {
      reason,
      platform: Platform.OS,
      monthly: toSnapshot(offering.monthly),
      yearly: toSnapshot(offering.annual),
      lifetime: toSnapshot(getLifetimePackageFromOffering(offering)),
    });
  }, []);

  const purchaseMutation = useMutation({
    mutationFn: async (input: { pkg: PurchasesPackage; period: SubscriptionPlan['period'] }) => {
      if (isExpoGo) return null;
      if (!user?.id) {
        throw new Error('Please sign in again before starting your membership.');
      }
      const purchaseUserId = user.id;
      const activePeriodBeforePurchase = getActivePeriodType(customerInfoQuery.data ?? null);
      const info = await rcPurchasePackage(
        input.pkg,
        purchaseUserId,
        isRecurringSubscriptionPeriod(input.period) ? input.period : undefined,
      );
      const membershipActive = hasActiveEntitlement(info ?? null);
      await queryClient.cancelQueries({ queryKey: customerInfoQueryKey });
      if (info) {
        queryClient.setQueryData(customerInfoQueryKey, info);
      }
      void queryClient.cancelQueries({ queryKey: offeringsQueryKey }).then(() => offeringsQuery.refetch()).then((result) => {
        logMembershipOfferingsSnapshot('after_purchase', result.data ?? null);
      }).catch((error) => {
        if (__DEV__) {
          console.log('[SubscriptionProvider] post-purchase offerings refresh failed', {
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });
      if (!membershipActive) {
        throw new Error(getMissingMembershipMessage(info ?? null));
      }
      return { info, userId: purchaseUserId, activePeriodBeforePurchase };
    },
    onSuccess: (result, input) => {
      const info = result?.info ?? null;
      if (result?.userId && user?.id !== result.userId) return;
      if (hasActiveEntitlement(info ?? null)) {
        createPendingTrialReminderAttemptForPurchase(info ?? null, result?.userId ?? null);
        retryPendingTrialReminderAttempt(info ?? null, 'purchase_success');
      }
      if (rcIsTrialActive(info ?? null)) {
        void trackEvent('trial_started');
      }
      const activePeriodAfterPurchase = getActivePeriodType(info ?? null);
      const activeExpirationAfterPurchase = getActiveExpiration(info ?? null);
      if (
        (Platform.OS === 'android' || Platform.OS === 'ios') &&
        hasActiveEntitlement(info ?? null) &&
        result?.activePeriodBeforePurchase &&
        activePeriodAfterPurchase === result.activePeriodBeforePurchase &&
        isRecurringSubscriptionPeriod(input.period) &&
        input.period !== result.activePeriodBeforePurchase
      ) {
        const pendingChange = createPendingPlanChange({
          sourcePeriod: result.activePeriodBeforePurchase,
          targetPeriod: input.period,
          effectiveAt: activeExpirationAfterPurchase,
          platform: Platform.OS,
        });
        void persistPendingPlanChange(pendingChange);
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
      void queryClient.cancelQueries({ queryKey: offeringsQueryKey }).then(() => offeringsQuery.refetch()).then((result) => {
        logMembershipOfferingsSnapshot('after_restore', result.data ?? null);
      }).catch((error) => {
        if (__DEV__) {
          console.log('[SubscriptionProvider] post-restore offerings refresh failed', {
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });
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

  const refreshMembershipOptions = useCallback(async (reason: string = 'manual') => {
    if (isExpoGo || !isAuthenticated || !user?.id) return;
    if (membershipOptionsRefreshPromiseRef.current) {
      return membershipOptionsRefreshPromiseRef.current;
    }
    const refresh = async () => {
      await queryClient.cancelQueries({ queryKey: offeringsQueryKey });
      const forceFreshCustomerInfo = shouldForceFreshCustomerInfoForRefreshReason(reason);
      const customerInfoRefresh = forceFreshCustomerInfo
        ? queryClient.cancelQueries({ queryKey: customerInfoQueryKey })
          .then(async () => {
            const freshInfo = await fetchCustomerInfo({ forceFresh: true, reason });
            if (freshInfo && activeAccountUserIdRef.current === user.id) {
              queryClient.setQueryData(customerInfoQueryKey, freshInfo);
            }
            return freshInfo;
          })
        : customerInfoQuery.refetch();
      await Promise.all([
        customerInfoRefresh,
        offeringsQuery.refetch().then((result) => {
          logMembershipOfferingsSnapshot(reason, result.data ?? null);
          return result;
        }),
      ]);
    };
    membershipOptionsRefreshPromiseRef.current = refresh().finally(() => {
      membershipOptionsRefreshPromiseRef.current = null;
    });
    return membershipOptionsRefreshPromiseRef.current;
  }, [customerInfoQuery, customerInfoQueryKey, isAuthenticated, isExpoGo, logMembershipOfferingsSnapshot, offeringsQuery, offeringsQueryKey, queryClient, user?.id]);

  const subscribe = useCallback((_plan: SubscriptionPlan) => {
    if (isExpoGo) return;
    if (_plan.period === 'lifetime') {
      throw new Error(PURCHASES_UNAVAILABLE_MESSAGE);
    }
    const current = offeringsQuery.data;
    if (!current) {
      throw new Error(PURCHASES_UNAVAILABLE_MESSAGE);
    }
    const pkg = _plan.period === 'yearly'
      ? current.annual
      : current.monthly;
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
    activeWillRenew,
    activeBillingIssueDetectedAt,
    billingIssueRecoveryState,
    activeUnsubscribeDetectedAt,
    activeManagementUrl,
    inactiveExpirationAt,
    revenueCatAccessKind,
    pendingPlanChange,
    hasPremiumAccess,
    state,
    customerInfo: customerInfoQuery.data ?? null,
    offering: offeringsQuery.data ?? null,
    offeringIdentifier: offeringsQuery.data?.identifier ?? null,
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
    refreshMembershipOptions,
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
    activeWillRenew,
    activeBillingIssueDetectedAt,
    billingIssueRecoveryState,
    activeUnsubscribeDetectedAt,
    activeManagementUrl,
    inactiveExpirationAt,
    revenueCatAccessKind,
    pendingPlanChange,
    hasPremiumAccess,
    state,
    customerInfoQuery.data,
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
    refreshMembershipOptions,
    purchase,
    subscribe,
    canAccessFeature,
    shouldPromptUpgrade,
    lockedFeatures,
    trackAIUsage,
    trackRewriteUsage,
  ]);
});
