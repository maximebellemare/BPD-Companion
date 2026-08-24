import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
  Linking,
  AppState,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Sparkles,
  Heart,
  HeartHandshake,
  Check,
  Crown,
  Shield,
  Brain,
  Clipboard,
  Activity,
  Users,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useAuth } from '@/providers/AuthProvider';
import { usePersonalization } from '@/hooks/usePersonalization';
import BrandLogo from '@/components/branding/BrandLogo';
import {
  PURCHASE_SYNC_PENDING_MESSAGE,
  isNativePurchasesPlatform,
} from '@/services/subscription/purchasesService';
import type { RevenueCatAccessKind } from '@/services/subscription/purchasesService';
import { useAppTheme } from '@/providers/ThemeProvider';
import { trackSingularEvent } from '@/lib/singular';
import { createAccessFlowTimer } from '@/services/performance/accessFlowTiming';
import { computePaywallLoadingState } from '@/services/subscription/paywallLoadingModel';
import {
  getAndroidActivePeriodFromProductIdentifier,
  getIosActivePeriodFromProductIdentifier,
  getInitialManageSelectedPlanId,
  getMembershipPrimaryAction,
} from '@/services/subscription/membershipPrimaryActionModel';
import {
  openBillingPaymentManagement,
  openCustomerCenterAfterModalDismiss,
  openCustomerCenterOrSubscriptionManagement,
} from '@/services/subscription/manageSubscriptionService';
import {
  shouldRefreshMembershipPricingOnAppStateChange,
  shouldRefreshMembershipPricingOnManageOpen,
} from '@/services/subscription/membershipPricingRefreshModel';
import { trackBillingIssueBannerViewedOnce } from '@/services/subscription/billingIssueRecoveryAnalytics';
import { getBillingIssueAnalyticsMetadata } from '@/services/subscription/billingIssueRecoveryModel';
import { BILLING_ISSUE_MANAGEMENT_RETURN_REASON } from '@/services/subscription/customerInfoRefreshModel';
import {
  shouldShowTrialCopyForSelectedPlan,
  shouldShowTrialEndingReminderCopy,
} from '@/services/subscription/trialReminderModel';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDateForLanguage } from '@/lib/i18n';
import type { SubscriptionPlan, SubscriptionPeriod, SubscriptionPlanPeriod } from '@/types/subscription';
import RevenueCatUI from 'react-native-purchases-ui';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

const OUTCOME_PAYWALL_OFFERING_ID = 'paywall_outcome_v1';

const TESTIMONIALS = [
  {
    text: "The secure rewrite saved me from sending something I would have deeply regretted.",
    label: 'Communication safety',
  },
  {
    text: "The weekly reflections helped me see patterns I couldn't see on my own.",
    label: 'Pattern awareness',
  },
  {
    text: "Having the AI remember my triggers made it feel like real support.",
    label: 'Personalized support',
  },
  {
    text: "Seeing response paths before sending changed how I communicate completely.",
    label: 'Response simulation',
  },
];

const TESTIMONIALS_ES = [
  {
    text: 'La herramienta para reescribir me evitó enviar algo de lo que me habría arrepentido mucho.',
    label: 'Seguridad al comunicar',
  },
  {
    text: 'Las reflexiones semanales me ayudaron a ver patrones que no podía ver por mi cuenta.',
    label: 'Conciencia de patrones',
  },
  {
    text: 'Que la IA recordara mis desencadenantes hizo que se sintiera como apoyo real.',
    label: 'Apoyo personalizado',
  },
  {
    text: 'Ver opciones de respuesta antes de enviar cambió por completo cómo me comunico.',
    label: 'Simulación de respuestas',
  },
];

const PAYWALL_VALUE_ITEMS = [
  {
    id: 'patterns',
    title: 'Understand emotional patterns',
    description: 'Connect triggers, emotions, fears, urges, actions, and outcomes.',
    icon: Brain,
  },
  {
    id: 'pause',
    title: 'Pause impulsive reactions',
    description: "Use Companion and Don't Send It before texts, conflict, or regret.",
    icon: Shield,
  },
  {
    id: 'skills',
    title: 'Build regulation skills',
    description: 'Practice calming tools, DBT-style skills, and short real-life lessons.',
    icon: Activity,
  },
];

const MEMBERSHIP_FEATURES = [
  {
    id: 'companion',
    title: 'Unlimited AI Companion',
    description: 'Talk through hard moments with personalized context and memory.',
    icon: Sparkles,
  },
  {
    id: 'checkins',
    title: 'Daily check-ins and emotional tracking',
    description: 'Track intensity, emotions, triggers, urges, relationships, and notes.',
    icon: Heart,
  },
  {
    id: 'insights',
    title: 'Personalized insights and emotional map',
    description: 'See saved insights, recurring patterns, triggers, and progress over time.',
    icon: Brain,
  },
  {
    id: 'cbt-dbt',
    title: 'CBT Thought Record and DBT tools',
    description: 'Practice thought reframing, distress tolerance, STOP, and coping skills.',
    icon: Clipboard,
  },
  {
    id: 'calm',
    title: 'Calm Me Down',
    description: 'Use guided regulation tools when emotions feel intense.',
    icon: Activity,
  },
  {
    id: 'pause',
    title: 'Pause Before You Send',
    description: 'Review reactive messages before texting, emailing, or replying.',
    icon: Shield,
  },
  {
    id: 'relationships',
    title: 'Relationship support and trigger understanding',
    description: 'Understand conflict, abandonment fear, rejection, shame, and repair.',
    icon: HeartHandshake,
  },
  {
    id: 'community',
    title: 'Community and reflection tools',
    description: 'Feel less alone while keeping crisis and medical support boundaries clear.',
    icon: Users,
  },
];

function getLocalizedPlanName(t: (key: string, options?: Record<string, unknown>) => string, period: SubscriptionPlanPeriod | null | undefined): string | null {
  if (period === 'monthly') return t('plans.monthly');
  if (period === 'yearly') return t('plans.yearly');
  if (period === 'lifetime') return t('plans.lifetime');
  return null;
}

function getLocalizedPrimaryActionLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  primaryAction: ReturnType<typeof getMembershipPrimaryAction>,
  selectedPlan: SubscriptionPlan | undefined,
  shouldShowTrialCopy: boolean,
): string {
  const plan = getLocalizedPlanName(t, selectedPlan?.period) ?? selectedPlan?.name ?? '';
  if (primaryAction.kind === 'continue') return t('actions.continue');
  if (primaryAction.kind === 'manage') return t('actions.manage');
  if (primaryAction.kind === 'owned') return t('actions.lifetimeActive');
  if (primaryAction.kind === 'scheduled') return t('actions.scheduled', { plan });
  if (primaryAction.kind === 'switch') return t('actions.switch', { plan });
  if (selectedPlan?.period === 'lifetime' && primaryAction.kind === 'purchase') return t('actions.purchaseLifetime');
  if (primaryAction.kind === 'purchase') return shouldShowTrialCopy ? t('actions.purchaseTrial') : t('actions.purchaseMembership');
  return t('actions.loading');
}

function getPlanCadenceLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  period: SubscriptionPlanPeriod,
): string {
  if (period === 'monthly') return t('perMonth');
  if (period === 'yearly') return t('perYear');
  return t('payOnce');
}

function getMembershipFeatureTranslationKey(id: string): string {
  if (id === 'cbt-dbt') return 'cbtDbt';
  return id;
}

function getLocalizedStatusCopy(params: {
  t: (key: string, options?: Record<string, unknown>) => string;
  hasStoreAccess: boolean;
  isEntitlementActive: boolean;
  isTrialActive: boolean;
  currentPeriod: SubscriptionPlanPeriod | null;
  pendingTargetPeriod?: SubscriptionPeriod | null;
  pendingEffectiveDateLabel?: string | null;
  activeExpirationDateLabel?: string | null;
  activeWillRenew?: boolean | null;
  billingIssueDateLabel?: string | null;
  billingIssueRecoveryKind?: 'active_grace' | 'inactive_billing_issue' | null;
  billingIssueRecoveryStore?: string | null;
  accessKind?: RevenueCatAccessKind;
  inactiveExpirationDateLabel?: string | null;
  trialDaysRemaining: number;
  shouldShowTrialCopy: boolean;
  isSubscriptionManagement?: boolean;
  isMembershipLoading?: boolean;
}): { title: string; body: string; heroTitle: string; plansTitle: string } {
  const t = params.t;
  const currentPlanLabel = getLocalizedPlanName(t, params.currentPeriod);
  const pendingTargetLabel = getLocalizedPlanName(t, params.pendingTargetPeriod);
  const accessKind = params.accessKind ?? 'none';
  const heroTitle = params.hasStoreAccess || (params.isSubscriptionManagement && params.isMembershipLoading)
    ? t('status.yourMembership')
    : params.shouldShowTrialCopy
      ? t('status.startTrialHero')
      : t('status.startMembershipHero');
  const plansTitle = params.hasStoreAccess || params.isSubscriptionManagement ? t('status.managePlan') : t('status.choosePlan');

  if (params.isSubscriptionManagement && params.isMembershipLoading && !params.hasStoreAccess) {
    return { heroTitle, plansTitle, title: t('status.checkingTitle'), body: t('status.checkingBody') };
  }

  if (params.hasStoreAccess && currentPlanLabel && pendingTargetLabel) {
    const date = params.pendingEffectiveDateLabel ?? params.activeExpirationDateLabel ?? t('status.renewalDate', { defaultValue: 'your renewal date' });
    return {
      heroTitle,
      plansTitle,
      title: params.isTrialActive ? t('status.trialActiveTitle', { plan: currentPlanLabel }) : t('status.membershipActiveTitle', { plan: currentPlanLabel }),
      body: t('status.pending', { source: currentPlanLabel, target: pendingTargetLabel, date }),
    };
  }

  if (params.hasStoreAccess && accessKind === 'support_grant') {
    return {
      heroTitle,
      plansTitle,
      title: t('status.membershipActive'),
      body: params.activeExpirationDateLabel
        ? t('status.supportGrantActiveUntil', { date: params.activeExpirationDateLabel })
        : t('status.supportGrantActive'),
    };
  }

  if (params.hasStoreAccess && currentPlanLabel) {
    if (params.currentPeriod === 'lifetime' || accessKind === 'purchased_lifetime') {
      return {
        heroTitle,
        plansTitle,
        title: t('status.membershipActive'),
        body: t('status.lifetimeActive'),
      };
    }

    if (params.billingIssueDateLabel) {
      return {
        heroTitle,
        plansTitle,
        title: t('status.billingIssue'),
        body: t('status.billing', {
          plan: currentPlanLabel,
          dateText: params.billingIssueDateLabel ? t('status.billingDateText', { date: params.billingIssueDateLabel }) : '',
        }),
      };
    }
    if (params.activeWillRenew === false) {
      return {
        heroTitle,
        plansTitle,
        title: t('status.membershipCancelledTitle', { plan: currentPlanLabel }),
        body: params.activeExpirationDateLabel
          ? t('status.cancelled', { plan: currentPlanLabel, date: params.activeExpirationDateLabel })
          : t('status.cancelledNoDate', { plan: currentPlanLabel }),
      };
    }
    return {
      heroTitle,
      plansTitle,
      title: params.isTrialActive ? t('status.trialActiveTitle', { plan: currentPlanLabel }) : t('status.membershipActiveTitle', { plan: currentPlanLabel }),
      body: params.isTrialActive
        ? params.activeExpirationDateLabel
          ? t('status.trial', { plan: currentPlanLabel, date: params.activeExpirationDateLabel })
          : params.trialDaysRemaining === 1
            ? t('status.trialOneDay', { plan: currentPlanLabel })
            : t('status.trialDays', { plan: currentPlanLabel, count: params.trialDaysRemaining })
        : params.activeExpirationDateLabel
          ? t('status.renews', { plan: currentPlanLabel, date: params.activeExpirationDateLabel })
          : t('status.activeNoDate', { plan: currentPlanLabel }),
    };
  }

  if (params.isEntitlementActive) {
    return { heroTitle, plansTitle, title: t('status.membershipActive'), body: t('status.fullAccess') };
  }

  if (params.billingIssueRecoveryKind === 'inactive_billing_issue') {
    const bodyKey = params.billingIssueRecoveryStore === 'APP_STORE'
      ? 'status.inactiveBillingIssueBodyApple'
      : 'status.inactiveBillingIssueBody';
    return {
      heroTitle: t('status.yourMembership'),
      plansTitle: t('status.recoveryPlan'),
      title: t('status.inactiveBillingIssueTitle'),
      body: t(bodyKey),
    };
  }

  if (params.inactiveExpirationDateLabel) {
    return {
      heroTitle,
      plansTitle,
      title: t('status.membershipExpired'),
      body: t('status.expired', { date: params.inactiveExpirationDateLabel }),
    };
  }

  return {
    heroTitle,
    plansTitle,
    title: params.shouldShowTrialCopy ? t('status.startTrialTitle') : t('status.startMembershipTitle'),
    body: params.shouldShowTrialCopy ? t('status.startTrialBody') : t('status.startMembershipBody'),
  };
}

export default function UpgradeScreen() {
  const router = useRouter();
  const { t } = useTranslation('subscription');
  const { language } = useLanguage();
  const isExpoGo = Constants.appOwnership === 'expo';
  const { anchor, mode } = useLocalSearchParams<{ anchor?: string; mode?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const {
    isPremium,
    isEntitlementActive,
    activeProductIdentifier,
    activeManagementUrl,
    activeWillRenew,
    activeBillingIssueDetectedAt,
    billingIssueRecoveryState,
    inactiveExpirationAt,
    revenueCatAccessKind,
    subscribe,
    restore,
    isLoading,
    isSubscribing,
    isRestoring,
    state,
    pendingPlanChange,
    plans,
    offeringIdentifier,
    offeringStatus,
    purchaseError,
    restoreError,
    retryMembershipOptions,
    refreshMembershipOptions,
  } = useSubscription();
  const { user } = useAuth();
  const personalization = usePersonalization();
  const { trackEvent } = useAnalytics();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('yearly');
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [useRevenueCatAcquisitionPaywall, setUseRevenueCatAcquisitionPaywall] =
    useState<boolean>(false);
  const [membershipOptionsTimedOut, setMembershipOptionsTimedOut] = useState<boolean>(false);
  const isNativePurchases = isNativePurchasesPlatform();
  const hasNavigatedAfterAccessRef = useRef<boolean>(false);
  const routeNewTrialToActivationRef = useRef<boolean>(false);
  const timingRef = useRef(createAccessFlowTimer('paywall'));
  const paywallRenderMarkedRef = useRef<boolean>(false);
  const offeringsReadyMarkedRef = useRef<boolean>(false);
  const managementInitialPlanAppliedRef = useRef<boolean>(false);
  const hasUserSelectedPlanRef = useRef<boolean>(false);
  const activeAccountRef = useRef<string | null>(null);
  const manageModeRefreshStartedRef = useRef<boolean>(false);
  const awaitingBillingManagementReturnRef = useRef<boolean>(false);
  const appStateRef = useRef(AppState.currentState);
  const membershipActive = isEntitlementActive || state.isTrialActive;
  const hasStoreAccess = membershipActive;
  const isSubscriptionManagement = mode === 'manage';
  const fallbackActivePeriod = state.plan?.period === 'monthly' || state.plan?.period === 'yearly'
    ? state.plan.period
    : null;
  const activePeriodForPrimaryAction: SubscriptionPlanPeriod | null = state.plan?.period === 'lifetime'
    ? 'lifetime'
    : revenueCatAccessKind === 'support_grant'
      ? null
      : Platform.OS === 'android'
        ? getAndroidActivePeriodFromProductIdentifier(activeProductIdentifier)
        : Platform.OS === 'ios'
          ? getIosActivePeriodFromProductIdentifier(activeProductIdentifier)
          : fallbackActivePeriod;
  const hasEntitlementBackedActivePlan = isEntitlementActive && !!activePeriodForPrimaryAction;
  const hasStoreAccessForPresentation = hasStoreAccess || hasEntitlementBackedActivePlan;
  const inactiveBillingIssueRecovery = billingIssueRecoveryState?.kind === 'inactive_billing_issue'
    ? billingIssueRecoveryState
    : null;

  const navigateToAppOnce = useCallback(() => {
    if (hasNavigatedAfterAccessRef.current) return;
    hasNavigatedAfterAccessRef.current = true;
    router.replace('/(tabs)/(home)');
  }, [router]);

  useEffect(() => {
    if (plans.length > 0 && !plans.some(plan => plan.id === selectedPlanId)) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  useEffect(() => {
    if (!shouldRefreshMembershipPricingOnManageOpen({
      isSubscriptionManagement,
      hasAlreadyRefreshed: manageModeRefreshStartedRef.current,
    })) return;
    manageModeRefreshStartedRef.current = true;
    void refreshMembershipOptions('manage_screen_open').catch((error) => {
      if (__DEV__) {
        console.log('[Upgrade] manage-mode membership refresh failed', {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }, [isSubscriptionManagement, refreshMembershipOptions]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;
      if (!shouldRefreshMembershipPricingOnAppStateChange({
        previousState,
        nextState,
      })) return;
      const refreshReason = awaitingBillingManagementReturnRef.current
        ? BILLING_ISSUE_MANAGEMENT_RETURN_REASON
        : 'app_foreground';
      awaitingBillingManagementReturnRef.current = false;
      void refreshMembershipOptions(refreshReason).catch((error) => {
        if (__DEV__) {
          console.log('[Upgrade] foreground membership refresh failed', {
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });
    });
    return () => subscription.remove();
  }, [refreshMembershipOptions]);

  useEffect(() => {
    const accountKey = user?.id ?? null;
    if (activeAccountRef.current === accountKey) return;
    activeAccountRef.current = accountKey;
    hasUserSelectedPlanRef.current = false;
    managementInitialPlanAppliedRef.current = false;
    setUseRevenueCatAcquisitionPaywall(false);
  }, [user?.id]);

  useEffect(() => {
    const nextSelectedPlanId = getInitialManageSelectedPlanId({
      isSubscriptionManagement,
      hasAppliedInitialSelection: managementInitialPlanAppliedRef.current,
      hasUserSelectedPlan: hasUserSelectedPlanRef.current,
      activePeriod: activePeriodForPrimaryAction,
      availablePlanIds: plans.map(plan => plan.id),
      currentSelectedPlanId: selectedPlanId,
    });
    if (nextSelectedPlanId === selectedPlanId) return;
    managementInitialPlanAppliedRef.current = true;
    setSelectedPlanId(nextSelectedPlanId);
  }, [activePeriodForPrimaryAction, isSubscriptionManagement, plans, selectedPlanId]);

  useEffect(() => {
    if (!paywallRenderMarkedRef.current) {
      paywallRenderMarkedRef.current = true;
      timingRef.current.mark('paywall_first_render');
    }
    trackEvent('upgrade_screen_viewed');
    void trackSingularEvent('paywall_view');
    trackEvent('screen_view', { screen: 'upgrade' });
    if (anchor) {
      trackEvent('upgrade_screen_anchored', { anchor });
    }
  }, [trackEvent, anchor]);

  useEffect(() => {
    if (offeringsReadyMarkedRef.current || offeringStatus !== 'ready') return;
    offeringsReadyMarkedRef.current = true;
    timingRef.current.mark('offerings_ready');
  }, [offeringStatus]);

  useEffect(() => {
    if (offeringStatus !== 'loading') {
      setMembershipOptionsTimedOut(false);
      return;
    }
    const timeout = setTimeout(() => {
      setMembershipOptionsTimedOut(true);
      timingRef.current.mark('offerings_timeout');
    }, 20_000);
    return () => clearTimeout(timeout);
  }, [offeringStatus]);

  useEffect(() => {
    if (useRevenueCatAcquisitionPaywall) return;
    if (isSubscriptionManagement) return;
    if (isExpoGo) return;
    if (!isNativePurchases) return;
    if (isLoading) return;
    if (hasStoreAccess) return;
    if (offeringStatus !== 'ready') return;
    if (offeringIdentifier !== OUTCOME_PAYWALL_OFFERING_ID) return;

    setUseRevenueCatAcquisitionPaywall(true);
  }, [
    hasStoreAccess,
    isExpoGo,
    isLoading,
    isNativePurchases,
    isSubscriptionManagement,
    offeringIdentifier,
    offeringStatus,
    useRevenueCatAcquisitionPaywall,
  ]);

  useEffect(() => {
    // Never navigate from the paywall until RevenueCat access for the
    // current signed-in account has finished resolving.
    if (isLoading) return;
    if (useRevenueCatAcquisitionPaywall) return;
    if (!hasStoreAccess) return;
    if (isSubscriptionManagement) return;

    if (routeNewTrialToActivationRef.current) {
      routeNewTrialToActivationRef.current = false;

      if (hasNavigatedAfterAccessRef.current) return;

      hasNavigatedAfterAccessRef.current = true;
      trackEvent('trial_activation_started');
      router.replace('/trial-activation' as never);
      return;
    }

    navigateToAppOnce();
  }, [
    hasStoreAccess,
    isLoading,
    isSubscriptionManagement,
    useRevenueCatAcquisitionPaywall,
    navigateToAppOnce,
    router,
    trackEvent,
  ]);
  const [testimonialIndex, setTestimonialIndex] = useState<number>(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const testimonialFade = useRef(new Animated.Value(1)).current;
  const featureAnims = useRef(MEMBERSHIP_FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    );
    shimmerLoop.start();

    featureAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 300 + index * 60,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      shimmerLoop.stop();
    };
  }, [fadeAnim, slideAnim, shimmerAnim, featureAnims]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(testimonialFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTestimonialIndex(prev => (prev + 1) % TESTIMONIALS.length);
        Animated.timing(testimonialFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonialFade]);

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleRevenueCatPaywallPurchaseStarted = useCallback(
    ({ packageBeingPurchased }: { packageBeingPurchased: PurchasesPackage }) => {
      trackEvent('upgrade_clicked', {
        plan_id: packageBeingPurchased.identifier,
        source: 'revenuecat_paywall',
        package_type: packageBeingPurchased.packageType,
      });
    },
    [trackEvent],
  );

  const handleRevenueCatPaywallPurchaseCompleted = useCallback(
    ({ customerInfo }: { customerInfo: CustomerInfo }) => {
      const activeEntitlements = Object.values(
        customerInfo.entitlements.active ?? {},
      );

      const startedTrial = activeEntitlements.some(
        entitlement =>
          String(entitlement.periodType).toUpperCase() === 'TRIAL',
      );

      if (hasNavigatedAfterAccessRef.current) return;
      hasNavigatedAfterAccessRef.current = true;

      if (startedTrial) {
        trackEvent('trial_activation_started', {
          source: 'revenuecat_paywall',
        });
        router.replace('/trial-activation' as never);
        return;
      }

      router.replace('/(tabs)/(home)');
    },
    [router, trackEvent],
  );

  const handleRevenueCatPaywallRestoreCompleted = useCallback(
    ({ customerInfo }: { customerInfo: CustomerInfo }) => {
      const hasActiveEntitlement =
        Object.keys(customerInfo.entitlements.active ?? {}).length > 0;

      if (!hasActiveEntitlement) return;
      if (hasNavigatedAfterAccessRef.current) return;

      hasNavigatedAfterAccessRef.current = true;
      router.replace('/(tabs)/(home)');
    },
    [router],
  );

  const handleSubscribe = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (isExpoGo) {
      router.replace('/');
      return;
    }
    if (inactiveBillingIssueRecovery) {
      trackEvent('billing_issue_fix_payment_tapped', getBillingIssueAnalyticsMetadata(inactiveBillingIssueRecovery));
      awaitingBillingManagementReturnRef.current = true;
      void openBillingPaymentManagement(
        Platform.OS,
        Linking,
        inactiveBillingIssueRecovery.productIdentifier,
        inactiveBillingIssueRecovery.managementUrl ?? activeManagementUrl,
      ).then((result) => {
        if (!result.opened) {
          awaitingBillingManagementReturnRef.current = false;
          Alert.alert(t('billingRecovery.fixPaymentTitle'), t('manageFallback'));
        }
      }).catch(() => {
        awaitingBillingManagementReturnRef.current = false;
        Alert.alert(t('billingRecovery.fixPaymentTitle'), t('manageFallback'));
      });
      return;
    }
    const selected = plans.find(p => p.id === selectedPlanId);
    const selectedShowsTrialCopy = shouldShowTrialCopyForSelectedPlan({
      platform: Platform.OS,
      androidTrialCopy: Platform.OS === 'android' ? selected?.androidTrialCopy ?? null : null,
      trialEligibilityStatus: selected?.trialEligibilityStatus ?? 'unknown',
    });
    const primaryAction = getMembershipPrimaryAction({
      isExpoGo,
      platform: Platform.OS,
      hasStoreAccess,
      activePeriod: activePeriodForPrimaryAction,
      selectedPeriod: selected?.period ?? null,
      pendingTargetPeriod: pendingPlanChange?.targetPeriod ?? null,
      canSubscribe: !isExpoGo && isNativePurchases && !!selected && !selected.isFallbackPrice && offeringStatus === 'ready',
      shouldShowTrialCopy: selectedShowsTrialCopy,
      selectedPriceLabel: selected?.priceLabel ?? '',
    });
    if (primaryAction.kind === 'manage') {
      const logManageFlow = (event: string, metadata?: Record<string, unknown>) => {
        if (!__DEV__) return;
        console.log('[Upgrade] Membership management flow', {
          event,
          platform: Platform.OS,
          activeProductIdentifier,
          hasManagementUrl: !!activeManagementUrl,
          ...(metadata ?? {}),
        });
      };
      void openCustomerCenterAfterModalDismiss({
        dismissModal: () => {
          router.back();
        },
        openAfterDismiss: () => openCustomerCenterOrSubscriptionManagement(
          Platform.OS,
          Linking,
          activeProductIdentifier,
          activeManagementUrl,
        ),
        onLog: logManageFlow,
      }).then((result) => {
        if (!result.opened) {
          Alert.alert(t('manageTitle'), t('manageFallback'));
        }
      }).catch((error) => {
        if (__DEV__) {
          console.log('[Upgrade] Membership management flow', {
            event: 'store_fallback_error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
        Alert.alert(t('manageTitle'), t('manageFallback'));
      });
      return;
    }
    if (!selected) return;
    if (!isNativePurchases) {
      Alert.alert(t('loadingAlertTitle'), t('loadingAlertBody'));
      return;
    }
    if (selected.isFallbackPrice || offeringStatus !== 'ready') {
      Alert.alert(t('loadingAlertTitle'), t('loadingAlertBody'));
      return;
    }
    trackEvent('upgrade_clicked', { plan_id: selectedPlanId });

    routeNewTrialToActivationRef.current =
      primaryAction.kind === 'purchase' &&
      !hasStoreAccess &&
      selectedShowsTrialCopy &&
      selected.period !== 'lifetime';
    subscribe(selected);
  }, [activeManagementUrl, activePeriodForPrimaryAction, activeProductIdentifier, hasStoreAccess, inactiveBillingIssueRecovery, isExpoGo, pendingPlanChange?.targetPeriod, router, selectedPlanId, subscribe, t, trackEvent, plans, offeringStatus, isNativePurchases]);

  const handleClose = useCallback(() => {
    if (isExpoGo) {
      router.replace('/');
      return;
    }
    if (!hasStoreAccess) {
      setRestoreNotice(t('closeRequiresTrial'));
      return;
    }
    router.back();
  }, [hasStoreAccess, isExpoGo, router, t]);

  const handleRestore = useCallback(() => {
    handleHaptic();
    setRestoreNotice(null);
    if (inactiveBillingIssueRecovery) {
      trackEvent('billing_issue_restore_tapped', getBillingIssueAnalyticsMetadata(inactiveBillingIssueRecovery));
    }
    if (isExpoGo) {
      router.replace('/');
      return;
    }
    routeNewTrialToActivationRef.current = false;

    restore()
      .then((active) => {
        if (active) {
          setRestoreNotice(t('restoreActive'));
          navigateToAppOnce();
          return;
        }
        setRestoreNotice(t('restoreNone'));
      })
      .catch((error) => {
        setRestoreNotice(error instanceof Error ? error.message : t('restoreFailed'));
      });
  }, [handleHaptic, inactiveBillingIssueRecovery, isExpoGo, restore, router, navigateToAppOnce, t, trackEvent]);

  const handleRetryMembershipOptions = useCallback(() => {
    handleHaptic();
    setMembershipOptionsTimedOut(false);
    setRestoreNotice(null);
    timingRef.current.mark('offerings_retry');
    void retryMembershipOptions().catch((error) => {
      if (__DEV__) {
        console.log('[Upgrade] membership options retry failed', {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }, [handleHaptic, retryMembershipOptions]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const selectedIsLifetime = selectedPlan?.period === 'lifetime';
  const selectedAndroidTrialCopy = Platform.OS === 'android' ? selectedPlan?.androidTrialCopy ?? null : null;
  const shouldShowTrialCopy = shouldShowTrialCopyForSelectedPlan({
    platform: Platform.OS,
    androidTrialCopy: selectedAndroidTrialCopy,
    trialEligibilityStatus: selectedPlan?.trialEligibilityStatus ?? 'unknown',
  });
  const showTrialEndingReminderCopy = shouldShowTrialEndingReminderCopy({
    hasStoreAccess: hasStoreAccessForPresentation,
    inactiveBillingRecovery: !!inactiveBillingIssueRecovery,
    shouldShowTrialCopy,
  });
  const hasValidSelectedPackage = !isExpoGo && isNativePurchases && !!selectedPlan && !selectedPlan.isFallbackPrice;
  const paywallLoadingState = useMemo(() => computePaywallLoadingState({
    offeringStatus,
    timedOut: membershipOptionsTimedOut,
    hasValidPlan: hasValidSelectedPackage,
  }), [hasValidSelectedPackage, membershipOptionsTimedOut, offeringStatus]);
  const canSubscribe = !isExpoGo && isNativePurchases && paywallLoadingState.canSubscribe;
  const primaryAction = useMemo(() => getMembershipPrimaryAction({
    isExpoGo,
    platform: Platform.OS,
    hasStoreAccess,
    accessKind: revenueCatAccessKind,
    activePeriod: activePeriodForPrimaryAction,
    selectedPeriod: selectedPlan?.period ?? null,
    pendingTargetPeriod: pendingPlanChange?.targetPeriod ?? null,
    canSubscribe,
    shouldShowTrialCopy,
    selectedPriceLabel: selectedPlan?.priceLabel ?? '',
  }), [
    canSubscribe,
    hasStoreAccess,
    isExpoGo,
    revenueCatAccessKind,
    pendingPlanChange?.targetPeriod,
    activePeriodForPrimaryAction,
    selectedPlan?.period,
    selectedPlan?.priceLabel,
    shouldShowTrialCopy,
  ]);
  const canUsePrimaryCta = primaryAction.kind === 'continue' ||
    primaryAction.kind === 'manage' ||
    !!inactiveBillingIssueRecovery ||
    (primaryAction.requiresPurchasablePlan && canSubscribe);
  const pendingEffectiveDateLabel = formatDateForLanguage(pendingPlanChange?.effectiveAt ?? null, language);
  const trialDaysRemaining = state.trialEndsAt
    ? Math.max(0, Math.ceil((state.trialEndsAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;
  const statusCopy = getLocalizedStatusCopy({
    t,
    hasStoreAccess: hasStoreAccessForPresentation,
    isEntitlementActive: isEntitlementActive || hasEntitlementBackedActivePlan,
    isTrialActive: state.isTrialActive,
    currentPeriod: activePeriodForPrimaryAction,
    pendingTargetPeriod: pendingPlanChange?.targetPeriod ?? null,
    pendingEffectiveDateLabel,
    activeExpirationDateLabel: formatDateForLanguage(state.expiresAt, language),
    activeWillRenew,
    accessKind: revenueCatAccessKind,
    billingIssueDateLabel: formatDateForLanguage(activeBillingIssueDetectedAt, language),
    billingIssueRecoveryKind: billingIssueRecoveryState?.kind ?? null,
    billingIssueRecoveryStore: billingIssueRecoveryState?.store ?? null,
    inactiveExpirationDateLabel: formatDateForLanguage(inactiveExpirationAt, language),
    trialDaysRemaining,
    shouldShowTrialCopy,
    isSubscriptionManagement,
    isMembershipLoading: isLoading,
  });
  const planChangeTimingMessage = useMemo(() => {
    if (selectedPlan?.period === 'lifetime') return null;
    const activeLabel = getLocalizedPlanName(t, activePeriodForPrimaryAction);
    const selectedLabel = getLocalizedPlanName(t, selectedPlan?.period);
    if (!hasStoreAccessForPresentation || !activeLabel || !selectedLabel || activePeriodForPrimaryAction === selectedPlan?.period) {
      return null;
    }
    if (pendingPlanChange?.targetPeriod === selectedPlan?.period) return null;
    if (Platform.OS === 'ios') {
      if (activePeriodForPrimaryAction === 'monthly' && selectedPlan?.period === 'yearly') return t('planChange.iosMonthlyToYearly');
      if (activePeriodForPrimaryAction === 'yearly' && selectedPlan?.period === 'monthly') return t('planChange.iosYearlyToMonthly');
      return t('planChange.iosGeneric');
    }
    if (Platform.OS === 'android') {
      const date = formatDateForLanguage(state.expiresAt, language);
      return date
        ? t('planChange.androidDated', { source: activeLabel, target: selectedLabel, date })
        : t('planChange.androidGeneric', { source: activeLabel, target: selectedLabel });
    }
    return null;
  }, [activePeriodForPrimaryAction, hasStoreAccessForPresentation, language, pendingPlanChange?.targetPeriod, selectedPlan?.period, state.expiresAt, t]);
  const statusMessage = useMemo(() => {
    if (paywallLoadingState.message) return paywallLoadingState.canShowRetry ? t('unavailableTitle') : t('loadingTitle');
    if (offeringStatus === 'preview') return isNativePurchases ? null : t('loadingTitle');
    return null;
  }, [isNativePurchases, offeringStatus, paywallLoadingState.canShowRetry, paywallLoadingState.message, t]);

  const anchorMessage = useMemo(() => {
    if (!anchor) return '';
    return t(`anchors.${anchor}`, { defaultValue: t('anchors.fallback') });
  }, [anchor, t]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });
  const visibleTestimonials = language === 'es' ? TESTIMONIALS_ES : TESTIMONIALS;
  const primaryActionLabel = getLocalizedPrimaryActionLabel(t, primaryAction, selectedPlan, shouldShowTrialCopy);
  const visiblePrimaryActionLabel = inactiveBillingIssueRecovery
    ? t('billingRecovery.fixPayment')
    : primaryActionLabel;
  const isPurchaseSyncPending = purchaseError === PURCHASE_SYNC_PENDING_MESSAGE;
  const primaryCtaDisabled = !canUsePrimaryCta ||
    isSubscribing ||
    (!inactiveBillingIssueRecovery && !isExpoGo && !isPremium && isLoading);

  useEffect(() => {
    if (!inactiveBillingIssueRecovery) return;
    trackBillingIssueBannerViewedOnce({
      state: inactiveBillingIssueRecovery,
      surface: 'upgrade_recovery',
      trackEvent,
    });
  }, [inactiveBillingIssueRecovery, trackEvent]);

  if (useRevenueCatAcquisitionPaywall) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />

        <RevenueCatUI.Paywall
          style={{ flex: 1 }}
          options={{
            displayCloseButton: false,
          }}
          onPurchaseStarted={handleRevenueCatPaywallPurchaseStarted}
          onPurchaseCompleted={handleRevenueCatPaywallPurchaseCompleted}
          onRestoreCompleted={handleRevenueCatPaywallRestoreCompleted}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.closeRow}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} testID="close-btn">
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Animated.View style={[styles.heroIconWrap, { opacity: shimmerOpacity }]}>
            <BrandLogo size={56} />
          </Animated.View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {statusCopy.heroTitle}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            {t('heroSubtitle')}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.accessStatusCard, { opacity: fadeAnim }]}>
          <View style={styles.accessStatusTopRow}>
            <View style={styles.accessStatusIcon}>
              <Crown size={18} color={isEntitlementActive ? Colors.brandTeal : Colors.primary} />
            </View>
            <View style={styles.accessStatusTextWrap}>
              <Text style={styles.accessStatusTitle}>{statusCopy.title}</Text>
              <Text style={styles.accessStatusBody}>{statusCopy.body}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.featuresSection, { opacity: fadeAnim }]}
        >
          <Text style={[styles.comparisonTitle, { color: colors.text }]}>{t('whatHelpsWith')}</Text>
          {PAYWALL_VALUE_ITEMS.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.insightEngineRow,
                  {
                    opacity: featureAnims[index],
                    transform: [{
                      translateX: featureAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-16, 0],
                      }),
                    }],
                  },
                ]}
              >
                <View style={styles.insightEngineIcon}>
                  <IconComponent size={16} color={Colors.primary} />
                </View>
                <View style={styles.insightEngineTextWrap}>
                  <Text style={styles.insightEngineTitle}>{t(`valueItems.${item.id}Title`)}</Text>
                  <Text style={styles.insightEngineDesc}>{t(`valueItems.${item.id}Description`)}</Text>
                </View>
                <View style={styles.featureCheck}>
                  <Check size={11} color={Colors.brandTeal} />
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>

        {personalization.recentDistressAvg > 0 && (
          <Animated.View style={[styles.personalizationCard, { opacity: fadeAnim }]}>
            <Sparkles size={14} color={Colors.primary} />
            <Text style={styles.personalizationText}>
              {personalization.isRelationshipActivated
                ? t('personalization.relationship')
                : personalization.recentDistressAvg >= 6
                  ? t('personalization.intense')
                  : t('personalization.practice')}
            </Text>
          </Animated.View>
        )}

        <Animated.View style={[styles.testimonialCard, { opacity: fadeAnim }]}>
          <Animated.View style={{ opacity: testimonialFade }} key={testimonialIndex}>
            <Text style={styles.testimonialText}>{`"${visibleTestimonials[testimonialIndex].text}"`}</Text>
            <Text style={styles.testimonialLabel}>{visibleTestimonials[testimonialIndex].label}</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.freeVsPremiumSection, { opacity: fadeAnim }]}>
          <Text style={[styles.comparisonTitle, { color: colors.text }]}>{t('fullAccessIncludes')}</Text>
          <View style={styles.freeList}>
            {(t('includes', { returnObjects: true }) as string[]).map((item, i) => (
              <View key={i} style={styles.freeRow}>
                <Check size={13} color={Colors.success} />
                <Text style={styles.freeRowText}>{item}</Text>
              </View>
            ))}
          </View>
          {shouldShowTrialCopy ? (
            <Text style={styles.trialClarifier}>
              {t('trialClarifier')}
            </Text>
          ) : selectedIsLifetime ? (
            <Text style={styles.trialClarifier}>
              {t('lifetimeClarifier')}
            </Text>
          ) : (
            <Text style={styles.trialClarifier}>
              {t('settingsClarifier')}
            </Text>
          )}
        </Animated.View>

        <Animated.View
          style={[styles.featuresSection, { opacity: fadeAnim }]}
        >
          {anchor ? (
            <View style={styles.anchorHighlight}>
              <Sparkles size={14} color={Colors.brandTeal} />
              <Text style={styles.anchorHighlightText}>{anchorMessage}</Text>
            </View>
          ) : null}
          <Text style={styles.comparisonTitle}>{t('alsoIncluded')}</Text>
          {MEMBERSHIP_FEATURES.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Animated.View
                key={feature.id}
                style={[
                  styles.featureRow,
                  {
                    opacity: featureAnims[index],
                    transform: [{
                      translateX: featureAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-16, 0],
                      }),
                    }],
                  },
                ]}
              >
                <View style={styles.featureIconWrap}>
                  <IconComponent size={16} color={Colors.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{t(`features.${getMembershipFeatureTranslationKey(feature.id)}Title`)}</Text>
                  <Text style={styles.featureDesc}>{t(`features.${getMembershipFeatureTranslationKey(feature.id)}Description`)}</Text>
                </View>
                <View style={styles.featureCheck}>
                  <Crown size={11} color={Colors.brandTeal} />
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>

        <Animated.View style={[styles.plansSection, { opacity: fadeAnim }]}>
          <Text style={styles.plansTitle}>{statusCopy.plansTitle}</Text>
          {statusMessage ? (
            <View style={styles.offeringStatusCard}>
              <Shield size={16} color={Colors.brandTeal} />
              <Text style={styles.offeringStatusText}>{statusMessage}</Text>
              {paywallLoadingState.canShowRetry ? (
                <TouchableOpacity
                  onPress={handleRetryMembershipOptions}
                  style={styles.retryOptionsBtn}
                  activeOpacity={0.75}
                  testID="retry-membership-options-btn"
                >
                  <Text style={styles.retryOptionsText}>{t('tryAgain')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          {plans.length > 0 ? (
            <View style={styles.plansList}>
              {plans.map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                const isCurrentPlan = hasStoreAccessForPresentation && activePeriodForPrimaryAction === plan.period;
                const isScheduledPlan = pendingPlanChange?.targetPeriod === plan.period;
                const cadenceLabel = getPlanCadenceLabel(t, plan.period);
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                    ]}
                    onPress={() => {
                      handleHaptic();
                      hasUserSelectedPlanRef.current = true;
                      setSelectedPlanId(plan.id);
                    }}
                    activeOpacity={0.7}
                    testID={`plan-${plan.id}`}
                  >
                    <View style={styles.planContent}>
                      <View style={styles.planTextColumn}>
                        <View style={styles.planHeaderRow}>
                          <Text style={[styles.planName, isSelected && styles.planNameSelected]}>
                            {getLocalizedPlanName(t, plan.period) ?? plan.name}
                          </Text>
                          <View style={styles.planBadgeRow}>
                            {plan.badge ? (
                              <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>
                                  {plan.badge === 'mostPopular' ? t('mostPopular') : t('bestValue')}
                                </Text>
                              </View>
                            ) : null}
                            {isScheduledPlan ? (
                              <View style={styles.scheduledBadge}>
                                <Text style={styles.scheduledBadgeText}>{t('scheduled')}</Text>
                              </View>
                            ) : null}
                            {isCurrentPlan ? (
                              <View style={styles.currentPlanBadge}>
                                <Text style={styles.currentPlanBadgeText}>{t('currentPlan')}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <View style={styles.planPriceRow}>
                          <Text
                            style={[styles.planPrice, isSelected && styles.planPriceSelected]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.86}
                          >
                            {plan.priceLabel}
                          </Text>
                          <Text style={[styles.planCadenceText, isSelected && styles.planCadenceTextSelected]}>
                            {cadenceLabel}
                          </Text>
                        </View>
                        {Platform.OS === 'android' && plan.androidTrialCopy ? (
                          <Text style={[styles.planTrialText, isSelected && styles.planTrialTextSelected]}>
                            {plan.androidTrialCopy}
                          </Text>
                        ) : null}
                      </View>
                      <View style={[styles.planRadio, isSelected && styles.planRadioSelected]}>
                        {isSelected && <View style={styles.planRadioInner} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyPlansCard}>
              <Text style={styles.emptyPlansTitle}>
                {paywallLoadingState.canShowRetry ? t('unavailableTitle') : t('loadingTitle')}
              </Text>
              <Text style={styles.emptyPlansText}>
                {paywallLoadingState.canShowRetry
                  ? t('unavailableBody')
                  : t('loadingBody')}
              </Text>
              {paywallLoadingState.canShowRetry ? (
                <TouchableOpacity
                  onPress={handleRetryMembershipOptions}
                  style={styles.emptyPlansRetryBtn}
                  activeOpacity={0.75}
                  testID="empty-plans-retry-btn"
                >
                  <Text style={styles.emptyPlansRetryText}>{t('tryAgain')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.ctaSection, { opacity: fadeAnim }]}>
          {planChangeTimingMessage ? (
            <View style={styles.planChangeTimingCard}>
              <Clock size={15} color={Colors.primary} />
              <Text style={styles.planChangeTimingText}>{planChangeTimingMessage}</Text>
            </View>
          ) : null}
          {showTrialEndingReminderCopy ? (
            <View style={styles.trialReminderCard}>
              <Clock size={15} color={Colors.primary} />
              <View style={styles.trialReminderTextWrap}>
                <Text style={styles.trialReminderLine}>{t('trialReminder.today')}</Text>
                <Text style={styles.trialReminderLine}>{t('trialReminder.reminder')}</Text>
                <Text style={styles.trialReminderLine}>{t('trialReminder.day3')}</Text>
                <Text style={styles.trialReminderNote}>{t('trialReminder.permissionNote')}</Text>
              </View>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.ctaButton, primaryCtaDisabled && styles.ctaButtonDisabled]}
            onPress={handleSubscribe}
            activeOpacity={0.8}
            disabled={primaryCtaDisabled}
            testID="subscribe-btn"
          >
            <Crown size={18} color={Colors.white} />
            <Text style={styles.ctaButtonText}>
              {isSubscribing ? t('processing') : visiblePrimaryActionLabel}
            </Text>
          </TouchableOpacity>

          {purchaseError ? <Text style={styles.inlineErrorText}>{purchaseError}</Text> : null}
          {showTrialEndingReminderCopy ? (
            <Text style={styles.trialReminderReassurance}>{t('trialReminder.reassurance')}</Text>
          ) : null}
          {isPurchaseSyncPending || inactiveBillingIssueRecovery ? (
            <TouchableOpacity
              onPress={handleRestore}
              style={styles.syncPurchaseButton}
              activeOpacity={0.75}
              testID="sync-purchase-btn"
            >
              <Text style={styles.syncPurchaseButtonText}>{t('syncPurchase')}</Text>
            </TouchableOpacity>
          ) : null}
        </Animated.View>

        <View style={styles.trustSection}>
          <View style={styles.trustRow}>
            <Shield size={13} color={Colors.textMuted} />
            <Text style={styles.trustText}>
              {shouldShowTrialCopy
                ? t('trialEligible')
                : selectedIsLifetime
                  ? t('lifetimeTrust')
                : t('cancelAnytime')}
            </Text>
          </View>
          <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn} testID="restore-btn" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.restoreText}>{isRestoring ? t('restoring') : t('restore')}</Text>
          </TouchableOpacity>
        </View>
        {restoreError ? <Text style={styles.inlineErrorText}>{restoreError}</Text> : null}
        {restoreNotice ? <Text style={styles.inlineNoticeText}>{restoreNotice}</Text> : null}

        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            {selectedIsLifetime ? t('lifetimeDisclaimer') : t('disclaimer')}
          </Text>
          <View style={styles.legalLinksRow}>
            <TouchableOpacity onPress={() => router.push('/terms-of-service')} testID="terms-link">
              <Text style={styles.legalLinkText}>{t('common:termsOfService', { ns: 'common' })}</Text>
            </TouchableOpacity>
            <Text style={styles.legalLinkDot}>·</Text>
            <TouchableOpacity onPress={() => router.push('/privacy-policy')} testID="privacy-link">
              <Text style={styles.legalLinkText}>{t('common:privacyPolicy', { ns: 'common' })}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  closeRow: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center' as const,
    paddingTop: 4,
    paddingBottom: 24,
  },
  heroIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    maxWidth: 300,
  },
  accessStatusCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
    marginBottom: 20,
  },
  accessStatusTopRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
  },
  accessStatusIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  accessStatusTextWrap: {
    flex: 1,
  },
  accessStatusTitle: {
    color: Colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900' as const,
  },
  accessStatusBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700' as const,
    marginTop: 3,
  },
  accessStatusMetaRow: {
    marginTop: 13,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  accessStatusMetaLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
  },
  accessStatusMetaValue: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900' as const,
  },
  personalizationCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    backgroundColor: Colors.brandTealSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  personalizationText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  testimonialCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.accentLight,
    minHeight: 80,
  },
  testimonialText: {
    fontSize: 14,
    color: Colors.text,
    fontStyle: 'italic' as const,
    lineHeight: 21,
    marginBottom: 8,
  },
  testimonialLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  freeVsPremiumSection: {
    marginBottom: 20,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  freeList: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 10,
  },
  freeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  freeRowText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  trialClarifier: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  anchorHighlight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  anchorHighlightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: 28,
  },
  insightEngineRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  insightEngineIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  insightEngineTextWrap: {
    flex: 1,
  },
  insightEngineTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  insightEngineValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 3,
  },
  insightEngineDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
  insightEngineBadge: {
    borderRadius: 999,
    backgroundColor: Colors.brandTealSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  insightEngineBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.brandTeal,
    textTransform: 'uppercase' as const,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 13,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 1,
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },
  plansSection: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  offeringStatusCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  offeringStatusText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  retryOptionsBtn: {
    borderRadius: 999,
    backgroundColor: Colors.brandTealSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.brandTeal,
  },
  retryOptionsText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  plansList: {
    gap: 10,
  },
  emptyPlansCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyPlansTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  emptyPlansText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  emptyPlansRetryBtn: {
    alignSelf: 'flex-start' as const,
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  emptyPlansRetryText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  planCard: {
    width: '100%' as const,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  planCardSelected: {
    borderColor: Colors.brandTeal,
    backgroundColor: Colors.brandTealSoft,
  },
  planContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  planTextColumn: {
    flex: 1,
    minWidth: 0,
  },
  planHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
    marginBottom: 8,
  },
  planBadgeRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'flex-end' as const,
    gap: 6,
    flexShrink: 1,
  },
  popularBadge: {
    backgroundColor: Colors.brandTealSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.brandTeal,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
  },
  scheduledBadge: {
    backgroundColor: Colors.brandTealSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.brandTeal,
  },
  scheduledBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.brandTeal,
    textTransform: 'uppercase' as const,
  },
  currentPlanBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentPlanBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.brandNavy,
    textTransform: 'uppercase' as const,
  },
  planName: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  planNameSelected: {
    color: Colors.brandNavy,
  },
  planCurrentText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  planCurrentTextSelected: {
    color: Colors.brandNavy,
  },
  planPrice: {
    fontSize: 23,
    fontWeight: '800' as const,
    color: Colors.text,
    flexShrink: 1,
  },
  planPriceSelected: {
    color: Colors.brandNavy,
  },
  planPriceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 8,
    flexWrap: 'nowrap' as const,
  },
  planCadenceText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  planCadenceTextSelected: {
    color: Colors.brandNavy,
  },
  planTrialText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
    textAlign: 'left' as const,
    marginTop: 5,
  },
  planTrialTextSelected: {
    color: Colors.brandNavy,
  },
  planSavings: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
    marginBottom: 8,
  },
  planSavingsSelected: {
    color: Colors.brandTeal,
  },
  planFallback: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 2,
  },
  planRadioSelected: {
    borderColor: Colors.brandTeal,
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.brandTeal,
  },
  ctaSection: {
    marginBottom: 16,
  },
  planChangeTimingCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  planChangeTimingText: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700' as const,
  },
  trialReminderCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  trialReminderTextWrap: {
    flex: 1,
    gap: 4,
  },
  trialReminderLine: {
    color: Colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800' as const,
  },
  trialReminderNote: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  trialReminderReassurance: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center' as const,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  ctaButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  inlineErrorText: {
    fontSize: 12,
    color: Colors.dangerDark,
    textAlign: 'center' as const,
    lineHeight: 17,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  syncPurchaseButton: {
    alignSelf: 'center' as const,
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: Colors.brandTealSoft,
    borderWidth: 1,
    borderColor: Colors.brandTeal,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  syncPurchaseButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900' as const,
  },
  inlineNoticeText: {
    fontSize: 12,
    color: Colors.success,
    textAlign: 'center' as const,
    lineHeight: 17,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  trialButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.brandTealSoft,
    backgroundColor: Colors.card,
  },
  trialButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  trustSection: {
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: -4,
    marginBottom: 20,
    paddingHorizontal: 4,
    gap: 8,
  },
  trustRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  trustText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  restoreBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  restoreText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  disclaimerSection: {
    paddingHorizontal: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 16,
  },
  legalLinksRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: 10,
  },
  legalLinkText: {
    fontSize: 12,
    color: Colors.brandTeal,
    fontWeight: '600' as const,
  },
  legalLinkDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  activeContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  },
  activeBadge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  activeTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.brandNavy,
    marginBottom: 6,
  },
  activeSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  activeInfoCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
  },
  activeInfoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  activeInfoDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  activeInfoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  activeInfoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  activeStatusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  activeStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  activeFeaturesList: {
    width: '100%' as const,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 24,
  },
  activeFeatureHeader: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  activeFeatureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 8,
  },
  activeFeatureText: {
    fontSize: 14,
    color: Colors.text,
  },
  doneBtn: {
    backgroundColor: Colors.brandTeal,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
