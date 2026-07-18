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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { usePersonalization } from '@/hooks/usePersonalization';
import BrandLogo from '@/components/branding/BrandLogo';
import { isNativePurchasesPlatform } from '@/services/subscription/purchasesService';
import { useAppTheme } from '@/providers/ThemeProvider';
import { trackSingularEvent } from '@/lib/singular';

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

export default function UpgradeScreen() {
  const router = useRouter();
  const isExpoGo = Constants.appOwnership === 'expo';
  const { anchor, mode } = useLocalSearchParams<{ anchor?: string; mode?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const {
    isPremium,
    isEntitlementActive,
    subscribe,
    restore,
    isLoading,
    isSubscribing,
    isRestoring,
    state,
    plans,
    offeringStatus,
    purchaseError,
    restoreError,
  } = useSubscription();
  const personalization = usePersonalization();
  const { trackEvent } = useAnalytics();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('yearly');
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const isNativePurchases = isNativePurchasesPlatform();
  const hasNavigatedAfterAccessRef = useRef<boolean>(false);
  const membershipActive = isEntitlementActive || state.isTrialActive;
  const hasStoreAccess = membershipActive;
  const isSubscriptionManagement = mode === 'manage';

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
    trackEvent('upgrade_screen_viewed');
    void trackSingularEvent('paywall_view');
    trackEvent('screen_view', { screen: 'upgrade' });
    if (anchor) {
      trackEvent('upgrade_screen_anchored', { anchor });
    }
  }, [trackEvent, anchor]);

  useEffect(() => {
    if (!hasStoreAccess) return;
    if (isSubscriptionManagement) return;
    navigateToAppOnce();
  }, [
    hasStoreAccess,
    isSubscriptionManagement,
    navigateToAppOnce,
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

  const handleSubscribe = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (isExpoGo) {
      router.replace('/');
      return;
    }
    if (hasStoreAccess) {
      const url = Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
      void Linking.openURL(url).catch(() => {
        Alert.alert('Manage subscription', 'Open your App Store or Google Play subscription settings to manage your membership.');
      });
      return;
    }
    const selected = plans.find(p => p.id === selectedPlanId);
    if (!selected) return;
    if (!isNativePurchases) {
      Alert.alert('Membership options are loading', 'Please try again in a moment.');
      return;
    }
    if (selected.isFallbackPrice || offeringStatus !== 'ready') {
      Alert.alert('Membership options are loading', 'Please try again in a moment.');
      return;
    }
    trackEvent('upgrade_clicked', { plan_id: selectedPlanId });
    subscribe(selected);
  }, [hasStoreAccess, isExpoGo, router, selectedPlanId, subscribe, trackEvent, plans, offeringStatus, isNativePurchases]);

  const handleClose = useCallback(() => {
    if (isExpoGo) {
      router.replace('/');
      return;
    }
    if (!hasStoreAccess) {
      setRestoreNotice('Start your 3-day free trial to enter BPD Companion.');
      return;
    }
    router.back();
  }, [hasStoreAccess, isExpoGo, router]);

  const handleRestore = useCallback(() => {
    handleHaptic();
    setRestoreNotice(null);
    if (isExpoGo) {
      router.replace('/');
      return;
    }
    restore()
      .then((active) => {
        if (active) {
          setRestoreNotice('Subscription restored. Membership access is active.');
          navigateToAppOnce();
          return;
        }
        setRestoreNotice('No active membership was found for this store account.');
      })
      .catch((error) => {
        setRestoreNotice(error instanceof Error ? error.message : 'Restore could not be completed. Please try again.');
      });
  }, [handleHaptic, isExpoGo, restore, router, navigateToAppOnce]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const selectedAndroidTrialCopy = Platform.OS === 'android' ? selectedPlan?.androidTrialCopy ?? null : null;
  const shouldShowTrialCopy = Platform.OS !== 'android' || !!selectedAndroidTrialCopy;
  const canSubscribe = !isExpoGo && isNativePurchases && offeringStatus === 'ready' && !!selectedPlan && !selectedPlan.isFallbackPrice;
  const canUsePrimaryCta = isExpoGo || isPremium || canSubscribe;
  const trialDaysRemaining = state.trialEndsAt
    ? Math.max(0, Math.ceil((state.trialEndsAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;
  const accessStatusTitle = state.isTrialActive
    ? trialDaysRemaining === 1
      ? 'Store trial active — 1 day left.'
      : `Store trial active — ${trialDaysRemaining} days left.`
    : isEntitlementActive
      ? 'Membership active.'
      : shouldShowTrialCopy
        ? 'Start your 3-day free trial.'
        : 'Start your membership.';
  const accessStatusBody = state.isTrialActive
    ? 'Everything is unlocked during your App Store or Google Play trial. No daily limits.'
    : isEntitlementActive
      ? 'You have full access to every feature, including Companion, check-ins, tools, insights, and Community.'
      : shouldShowTrialCopy
        ? 'Start your 3-day free trial for full access from day one. Cancel anytime before the trial ends.'
        : 'Start membership for full access from day one. Cancel anytime.';
  const statusMessage = useMemo(() => {
    if (offeringStatus === 'loading') return 'Loading membership options...';
    if (offeringStatus === 'preview') return isNativePurchases ? null : 'Preparing your personalized membership...';
    if (offeringStatus === 'empty') return 'Preparing your personalized membership...';
    if (offeringStatus === 'error') return 'Preparing your personalized membership...';
    return null;
  }, [offeringStatus, isNativePurchases]);

  const anchorMessage = useMemo(() => {
    const map: Record<string, string> = {
      weekly_reflection: 'Continue with deeper weekly reflection insights',
      therapist_report: 'Keep a complete history of your therapy reports',
      unlimited_ai: 'Continue with unlimited AI companion support',
      relationship_analysis: 'Continue with relationship pattern support',
      emotional_profile: 'Discover deeper emotional pattern intelligence',
      secure_rewrite: 'Continue with calm, self-respecting rewrites',
      message_simulation: 'See likely outcomes before you send',
      message_health_scoring: 'Get detailed message health analysis',
      communication_insights: 'Discover your communication patterns',
      unlimited_rewrites: 'Continue with unlimited message rewrites',
    };
    if (!anchor) return '';
    return map[anchor] ?? 'Continue with deeper support tools';
  }, [anchor]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });
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
            {shouldShowTrialCopy ? 'Start your 3-day free trial.' : 'Start your membership.'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Everything is unlocked from day one: Companion, check-ins, tools, Community, insights, and progress tracking.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.accessStatusCard, { opacity: fadeAnim }]}>
          <View style={styles.accessStatusTopRow}>
            <View style={styles.accessStatusIcon}>
              <Crown size={18} color={isEntitlementActive ? Colors.brandTeal : Colors.primary} />
            </View>
            <View style={styles.accessStatusTextWrap}>
              <Text style={styles.accessStatusTitle}>{accessStatusTitle}</Text>
              <Text style={styles.accessStatusBody}>{accessStatusBody}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.featuresSection, { opacity: fadeAnim }]}
        >
          <Text style={[styles.comparisonTitle, { color: colors.text }]}>What membership helps with</Text>
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
                ? "Relationship stress seems active lately. Membership keeps Companion, Don't Send It, and relationship support available."
                : personalization.recentDistressAvg >= 6
                  ? 'It seems like an intense week. Membership keeps calming tools and Companion support available when you need them.'
                  : 'Membership helps you keep practicing: understand the pattern, pause the reaction, choose the next step.'}
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
          <Text style={[styles.comparisonTitle, { color: colors.text }]}>Full access includes</Text>
          <View style={styles.freeList}>
            {[
              'No daily limits',
              'Unlimited AI Companion',
              'Unlimited check-ins and emotional tracking',
              'Unlimited tools for reflection, CBT, DBT, calming, and communication',
              'Personalized insights, saved patterns, and emotional map',
              'Community and crisis-safe support language',
            ].map((item, i) => (
              <View key={i} style={styles.freeRow}>
                <Check size={13} color={Colors.success} />
                <Text style={styles.freeRowText}>{item}</Text>
              </View>
            ))}
          </View>
          {shouldShowTrialCopy ? (
            <Text style={styles.trialClarifier}>
              Cancel anytime before your 3-day trial ends. You won’t be charged until your trial is over.
            </Text>
          ) : (
            <Text style={styles.trialClarifier}>
              Cancel anytime from your App Store or Google Play subscription settings.
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
          <Text style={styles.comparisonTitle}>Also included</Text>
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
                    {Platform.OS === 'android' && plan.androidTrialCopy ? (
                      <Text style={[styles.planTrialText, isSelected && styles.planTrialTextSelected]}>
                        {plan.androidTrialCopy}
                      </Text>
                    ) : null}
                    {plan.savings && (
                      <Text style={[styles.planSavings, isSelected && styles.planSavingsSelected]}>
                        {plan.savings}
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
              <Text style={styles.emptyPlansTitle}>Loading membership options</Text>
              <Text style={styles.emptyPlansText}>
                Membership options are loading. Please try again in a moment. You can still restore an existing subscription.
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.ctaSection, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.ctaButton, (!canUsePrimaryCta || (!isExpoGo && !isPremium && (isSubscribing || isLoading))) && styles.ctaButtonDisabled]}
            onPress={handleSubscribe}
            activeOpacity={0.8}
            disabled={!canUsePrimaryCta || (!isExpoGo && !isPremium && (isSubscribing || isLoading))}
            testID="subscribe-btn"
          >
            <Crown size={18} color={Colors.white} />
            <Text style={styles.ctaButtonText}>
              {isExpoGo
                ? 'Continue to app'
                : isSubscribing
                ? 'Processing...'
                : isPremium
                  ? 'Manage existing subscription'
                  : canSubscribe
                    ? shouldShowTrialCopy
                      ? `Start your 3-day free trial ${selectedPlan?.priceLabel ?? ''}`
                      : `Start membership ${selectedPlan?.priceLabel ?? ''}`
                  : 'Loading membership options...'}
            </Text>
          </TouchableOpacity>

          {purchaseError ? <Text style={styles.inlineErrorText}>{purchaseError}</Text> : null}
        </Animated.View>

        <View style={styles.trustSection}>
          <View style={styles.trustRow}>
            <Shield size={13} color={Colors.textMuted} />
            <Text style={styles.trustText}>
              {shouldShowTrialCopy
                ? '3-day free trial for eligible new subscribers · Cancel anytime'
                : 'Cancel anytime'}
            </Text>
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
    paddingTop: 30,
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
    paddingHorizontal: 18,
    paddingTop: 38,
    paddingBottom: 18,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    position: 'relative' as const,
    overflow: 'visible' as const,
  },
  planCardSelected: {
    borderColor: Colors.brandTeal,
    backgroundColor: Colors.brandTealSoft,
  },
  popularBadge: {
    position: 'absolute' as const,
    top: -25,
    alignSelf: 'center' as const,
    backgroundColor: Colors.brandTealSoft,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.brandTeal,
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
  planTrialText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
    textAlign: 'center' as const,
    marginBottom: 6,
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
