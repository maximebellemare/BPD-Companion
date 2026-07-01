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
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Sparkles,
  Eye,
  Calendar,
  Heart,
  FileText,
  TrendingUp,
  GitBranch,
  Check,
  Crown,
  Shield,
  Zap,
  Brain,
  Clipboard,
  Compass,
  BarChart3,
  Lightbulb,
  Activity,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { PREMIUM_FEATURES } from '@/types/subscription';
import { usePersonalization } from '@/hooks/usePersonalization';
import BrandLogo from '@/components/branding/BrandLogo';
import { isNativePurchasesPlatform, PURCHASES_UNAVAILABLE_MESSAGE } from '@/services/subscription/purchasesService';
import { useAppTheme } from '@/providers/ThemeProvider';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  sparkles: Sparkles,
  eye: Eye,
  calendar: Calendar,
  heart: Heart,
  'file-text': FileText,
  'trending-up': TrendingUp,
  'git-branch': GitBranch,
  brain: Brain,
  clipboard: Clipboard,
  shield: Shield,
  compass: Compass,
  'bar-chart-3': BarChart3,
  lightbulb: Lightbulb,
  activity: Activity,
  zap: Zap,
};

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

export default function UpgradeScreen() {
  const router = useRouter();
  const { anchor } = useLocalSearchParams<{ anchor?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const {
    isPremium,
    subscribe,
    restore,
    isLoading,
    isSubscribing,
    isRestoring,
    state,
    plans,
    offeringStatus,
    offeringsError,
    purchaseError,
    restoreError,
    remainingAIMessages,
    dailyAIUsage,
    revenueCatDiagnostics,
    refreshRevenueCatDiagnostics,
  } = useSubscription();
  const personalization = usePersonalization();
  const { trackEvent } = useAnalytics();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('yearly');
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const isNativePurchases = isNativePurchasesPlatform();

  useEffect(() => {
    if (plans.length > 0 && !plans.some(plan => plan.id === selectedPlanId)) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  useEffect(() => {
    trackEvent('upgrade_screen_viewed');
    trackEvent('screen_view', { screen: 'upgrade' });
    if (anchor) {
      trackEvent('upgrade_screen_anchored', { anchor });
    }
  }, [trackEvent, anchor]);
  const [testimonialIndex, setTestimonialIndex] = useState<number>(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const testimonialFade = useRef(new Animated.Value(1)).current;
  const featureAnims = useRef(PREMIUM_FEATURES.map(() => new Animated.Value(0))).current;

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

  const handleSubscribe = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (isPremium) {
      const url = Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
      void Linking.openURL(url).catch(() => {
        Alert.alert('Manage subscription', 'Open your App Store or Google Play subscription settings to manage Premium.');
      });
      return;
    }
    const selected = plans.find(p => p.id === selectedPlanId);
    if (!selected) return;
    if (!isNativePurchases) {
      Alert.alert('Purchases unavailable', PURCHASES_UNAVAILABLE_MESSAGE);
      return;
    }
    if (selected.isFallbackPrice || offeringStatus !== 'ready') {
      Alert.alert('Subscriptions unavailable', offeringsError ?? 'Subscription plans could not be loaded. Please try again shortly.');
      return;
    }
    trackEvent('upgrade_clicked', { plan_id: selectedPlanId });
    subscribe(selected);
  }, [isPremium, selectedPlanId, subscribe, trackEvent, plans, offeringStatus, offeringsError, isNativePurchases]);

  const handleRestore = useCallback(() => {
    handleHaptic();
    setRestoreNotice(null);
    restore()
      .then((active) => {
        setRestoreNotice(
          active
            ? 'Purchase restored. Premium access is active.'
            : 'No active subscription was found for this store account.',
        );
      })
      .catch(() => {
        setRestoreNotice(null);
      });
  }, [handleHaptic, restore]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const canSubscribe = isNativePurchases && offeringStatus === 'ready' && !!selectedPlan && !selectedPlan.isFallbackPrice;
  const trialDaysRemaining = state.trialEndsAt
    ? Math.max(0, Math.ceil((state.trialEndsAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;
  const accessStatusTitle = isPremium
    ? 'Premium active.'
    : state.isTrialActive
      ? trialDaysRemaining === 1
        ? 'Trial active — 1 day left.'
        : `Trial active — ${trialDaysRemaining} days left.`
      : 'Premium unlocks continued access.';
  const accessStatusBody = isPremium
    ? 'You have unlimited Companion messages and Premium insights.'
    : state.isTrialActive
      ? 'Trial active — upgrade anytime to unlock unlimited Companion and Premium insights.'
      : 'Your 7-day trial controls app access. Premium keeps the app available after trial expiration.';
  const statusMessage = useMemo(() => {
    if (offeringStatus === 'loading') return 'Loading secure App Store and Google Play plans...';
    if (offeringStatus === 'preview') return isNativePurchases ? null : PURCHASES_UNAVAILABLE_MESSAGE;
    if (offeringStatus === 'empty') return 'No subscription offering is configured yet. Check the RevenueCat offering and package setup.';
    if (offeringStatus === 'error') return offeringsError ?? 'Subscription plans could not be loaded.';
    return null;
  }, [offeringStatus, offeringsError, isNativePurchases]);

  const anchorMessage = useMemo(() => {
    const map: Record<string, string> = {
      weekly_reflection: 'Unlock deeper weekly reflection insights',
      therapist_report: 'Keep a complete history of your therapy reports',
      unlimited_ai: 'Continue with unlimited AI companion support',
      relationship_analysis: 'Unlock advanced relationship pattern analysis',
      emotional_profile: 'Discover deeper emotional pattern intelligence',
      secure_rewrite: 'Unlock calm, self-respecting secure rewrites',
      message_simulation: 'See likely outcomes before you send',
      message_health_scoring: 'Get detailed message health analysis',
      communication_insights: 'Discover your communication patterns',
      unlimited_rewrites: 'Continue with unlimited message rewrites',
    };
    if (!anchor) return '';
    return map[anchor] ?? 'Unlock deeper support tools';
  }, [anchor]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });
  const diagnosticRows = __DEV__ && revenueCatDiagnostics
    ? [
        ['RevenueCat configured?', revenueCatDiagnostics.configured ? 'true' : 'false'],
        ['API key detected?', revenueCatDiagnostics.apiKeyDetected ? 'true' : 'false'],
        ['API key prefix', revenueCatDiagnostics.apiKeyPrefix ?? '(none)'],
        ['configure() success?', revenueCatDiagnostics.configureSucceeded ? 'true' : 'false'],
        ['configure() exception', revenueCatDiagnostics.configureExceptionMessage ?? '(none)'],
        ['initialization completed?', revenueCatDiagnostics.initializationCompleted ? 'true' : 'false'],
        ['Current appUserID', revenueCatDiagnostics.currentAppUserId ?? '(none)'],
        ['Customer original appUserID', revenueCatDiagnostics.customerInfoOriginalAppUserId ?? '(none)'],
        ['Offerings fetched?', revenueCatDiagnostics.offeringsFetched ? 'true' : 'false'],
        ['offerings.current exists?', revenueCatDiagnostics.offeringsCurrentExists ? 'true' : 'false'],
        ['offerings.all keys', revenueCatDiagnostics.offeringsAllKeys.length > 0 ? revenueCatDiagnostics.offeringsAllKeys.join(', ') : '(none)'],
        ['Package count', String(revenueCatDiagnostics.packageCount)],
        ['Current offering identifier', revenueCatDiagnostics.currentOfferingIdentifier ?? '(none)'],
        ['Monthly package found?', revenueCatDiagnostics.monthlyPackageFound ? 'true' : 'false'],
        ['Annual package found?', revenueCatDiagnostics.annualPackageFound ? 'true' : 'false'],
        ['Monthly product ID', revenueCatDiagnostics.monthlyProductIdentifier ?? '(none)'],
        ['Annual product ID', revenueCatDiagnostics.annualProductIdentifier ?? '(none)'],
        ['Expected offering ID', revenueCatDiagnostics.expectedOfferingId],
        ['Expected entitlement ID', revenueCatDiagnostics.expectedEntitlementId],
        ['Expected monthly product ID', revenueCatDiagnostics.expectedMonthlyProductId],
        ['Expected yearly product ID', revenueCatDiagnostics.expectedYearlyProductId],
        ['Platform', revenueCatDiagnostics.platform],
        ['Error', revenueCatDiagnostics.error ?? '(none)'],
      ]
    : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.closeRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} testID="close-btn">
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
          <Text style={[styles.heroTitle, { color: colors.text }]}>Understand patterns. Pause reactions. Build skills.</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Premium keeps your Companion, calming tools, Don't Send It, and emotional map available after your trial.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.accessStatusCard, { opacity: fadeAnim }]}>
          <View style={styles.accessStatusTopRow}>
            <View style={styles.accessStatusIcon}>
              <Crown size={18} color={isPremium ? Colors.brandTeal : Colors.primary} />
            </View>
            <View style={styles.accessStatusTextWrap}>
              <Text style={styles.accessStatusTitle}>{accessStatusTitle}</Text>
              <Text style={styles.accessStatusBody}>{accessStatusBody}</Text>
            </View>
          </View>
          <View style={styles.accessStatusMetaRow}>
            <Text style={styles.accessStatusMetaLabel}>Companion today</Text>
            <Text style={styles.accessStatusMetaValue}>
              {isPremium
                ? 'Unlimited'
                : `${dailyAIUsage}/5 used${remainingAIMessages !== null ? ` · ${remainingAIMessages} left` : ''}`}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.featuresSection, { opacity: fadeAnim }]}
        >
          <Text style={[styles.comparisonTitle, { color: colors.text }]}>What Premium helps with</Text>
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
                  <Text style={styles.insightEngineTitle}>{item.title}</Text>
                  <Text style={styles.insightEngineDesc}>{item.description}</Text>
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
                ? "Relationship stress seems active lately. Premium keeps Companion, Don't Send It, and relationship support available."
                : personalization.recentDistressAvg >= 6
                  ? 'It seems like an intense week. Premium keeps calming tools and Companion support available when you need them.'
                  : 'Premium helps you keep practicing: understand the pattern, pause the reaction, choose the next step.'}
            </Text>
          </Animated.View>
        )}

        <Animated.View style={[styles.testimonialCard, { opacity: fadeAnim }]}>
          <Animated.View style={{ opacity: testimonialFade }} key={testimonialIndex}>
            <Text style={styles.testimonialText}>{`"${TESTIMONIALS[testimonialIndex].text}"`}</Text>
            <Text style={styles.testimonialLabel}>{TESTIMONIALS[testimonialIndex].label}</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.freeVsPremiumSection, { opacity: fadeAnim }]}>
          <Text style={[styles.comparisonTitle, { color: colors.text }]}>Included during your trial</Text>
          <View style={styles.freeList}>
            {[
              'Check-ins & basic journaling',
              'Basic coping tools & grounding',
              'Safety mode & crisis support',
              `${5} AI conversations per day`,
              `${3} message rewrites per day`,
              'Draft vault & pause timer',
              'Do-not-send recommendations',
            ].map((item, i) => (
              <View key={i} style={styles.freeRow}>
                <Check size={13} color={Colors.success} />
                <Text style={styles.freeRowText}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.trialClarifier}>
            After the 7-day trial, Premium keeps BPD Companion available when emotions feel intense.
          </Text>
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
          <Text style={styles.comparisonTitle}>Also included</Text>
          {PREMIUM_FEATURES.slice(0, 7).map((feature, index) => {
            const IconComponent = ICON_MAP[feature.icon] ?? Sparkles;
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
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </View>
                <View style={styles.featureCheck}>
                  <Crown size={11} color={Colors.brandTeal} />
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>

        <Animated.View style={[styles.plansSection, { opacity: fadeAnim }]}>
          <Text style={styles.plansTitle}>Choose your plan</Text>
          {__DEV__ && (
            <View style={styles.diagnosticsCard}>
              <View style={styles.diagnosticsHeader}>
                <Text style={styles.diagnosticsTitle}>RevenueCat diagnostics</Text>
                <TouchableOpacity
                  style={styles.diagnosticsRefresh}
                  onPress={refreshRevenueCatDiagnostics}
                  activeOpacity={0.75}
                  testID="revenuecat-diagnostics-refresh"
                >
                  <Text style={styles.diagnosticsRefreshText}>Refresh</Text>
                </TouchableOpacity>
              </View>
              {diagnosticRows.length > 0 ? (
                diagnosticRows.map(([label, value]) => (
                  <View key={label} style={styles.diagnosticsRow}>
                    <Text style={styles.diagnosticsLabel}>{label}</Text>
                    <Text style={styles.diagnosticsValue}>{value}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.diagnosticsEmpty}>Diagnostics loading…</Text>
              )}
            </View>
          )}
          {statusMessage ? (
            <View style={styles.offeringStatusCard}>
              <Shield size={16} color={Colors.brandTeal} />
              <Text style={styles.offeringStatusText}>{statusMessage}</Text>
            </View>
          ) : null}
          {plans.length > 0 ? (
            <View style={styles.plansRow}>
              {plans.map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                    ]}
                    onPress={() => {
                      handleHaptic();
                      setSelectedPlanId(plan.id);
                    }}
                    activeOpacity={0.7}
                    testID={`plan-${plan.id}`}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>Best Value</Text>
                      </View>
                    )}
                    <Text style={[styles.planName, isSelected && styles.planNameSelected]}>
                      {plan.name}
                    </Text>
                    <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                      {plan.priceLabel}
                    </Text>
                    {plan.savings && (
                      <Text style={[styles.planSavings, isSelected && styles.planSavingsSelected]}>
                        {plan.savings}
                      </Text>
                    )}
                    {plan.isFallbackPrice && (
                      <Text style={[styles.planFallback, isSelected && styles.planSavingsSelected]}>
                        Preview price
                      </Text>
                    )}
                    <View style={[styles.planRadio, isSelected && styles.planRadioSelected]}>
                      {isSelected && <View style={styles.planRadioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyPlansCard}>
              <Text style={styles.emptyPlansTitle}>Plans unavailable</Text>
              <Text style={styles.emptyPlansText}>
                Subscription plans could not be loaded. You can still restore an existing purchase.
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.ctaSection, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.ctaButton, (!isPremium && (!canSubscribe || isSubscribing || isLoading)) && styles.ctaButtonDisabled]}
            onPress={handleSubscribe}
            activeOpacity={0.8}
            disabled={!isPremium && (!canSubscribe || isSubscribing || isLoading)}
            testID="subscribe-btn"
          >
            <Crown size={18} color={Colors.white} />
            <Text style={styles.ctaButtonText}>
              {isSubscribing
                ? 'Processing...'
                : canSubscribe
                  ? isPremium
                    ? 'Manage existing subscription'
                    : `Upgrade to Premium ${selectedPlan?.priceLabel ?? ''}`
                  : 'Subscriptions unavailable'}
            </Text>
          </TouchableOpacity>

          {purchaseError ? <Text style={styles.inlineErrorText}>{purchaseError}</Text> : null}
        </Animated.View>

        <View style={styles.trustSection}>
          <View style={styles.trustRow}>
            <Shield size={13} color={Colors.textMuted} />
            <Text style={styles.trustText}>7-day free trial · Cancel anytime</Text>
          </View>
          <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn} testID="restore-btn" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.restoreText}>{isRestoring ? 'Restoring...' : 'Restore purchase'}</Text>
          </TouchableOpacity>
        </View>
        {restoreError ? <Text style={styles.inlineErrorText}>{restoreError}</Text> : null}
        {restoreNotice ? <Text style={styles.inlineNoticeText}>{restoreNotice}</Text> : null}

        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscription in your App Store account settings. This is a companion app, not a replacement for therapy or medical advice.
          </Text>
          <View style={styles.legalLinksRow}>
            <TouchableOpacity onPress={() => router.push('/terms-of-service')} testID="terms-link">
              <Text style={styles.legalLinkText}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalLinkDot}>·</Text>
            <TouchableOpacity onPress={() => router.push('/privacy-policy')} testID="privacy-link">
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
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
  diagnosticsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  diagnosticsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    marginBottom: 10,
  },
  diagnosticsTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '900' as const,
  },
  diagnosticsRefresh: {
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primary,
  },
  diagnosticsRefreshText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900' as const,
  },
  diagnosticsRow: {
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  diagnosticsLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  },
  diagnosticsValue: {
    color: Colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700' as const,
  },
  diagnosticsEmpty: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700' as const,
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
  plansRow: {
    flexDirection: 'row' as const,
    gap: 12,
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
  planCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    position: 'relative' as const,
  },
  planCardSelected: {
    borderColor: Colors.brandTeal,
    backgroundColor: Colors.brandTealSoft,
  },
  popularBadge: {
    position: 'absolute' as const,
    top: -10,
    backgroundColor: Colors.brandTealSoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  planName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  planNameSelected: {
    color: Colors.brandNavy,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  planPriceSelected: {
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
    marginTop: 4,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 20,
    paddingHorizontal: 4,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.brandTealSoft,
  },
  restoreText: {
    fontSize: 13,
    color: Colors.brandTeal,
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
