import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
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
import { SUBSCRIPTION_PLANS, PREMIUM_FEATURES } from '@/types/subscription';
import { usePersonalization } from '@/hooks/usePersonalization';

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

export default function UpgradeScreen() {
  const router = useRouter();
  const { anchor } = useLocalSearchParams<{ anchor?: string }>();
  const insets = useSafeAreaInsets();
  const { isPremium, subscribe, startTrial, restore, isSubscribing, state } = useSubscription();
  const personalization = usePersonalization();
  const { trackEvent } = useAnalytics();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('yearly');
  const _scrollRef = React.useRef<ScrollView>(null);
  const featureSectionY = React.useRef<number>(0);

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
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId);
    if (plan) {
      trackEvent('upgrade_clicked', { plan_id: selectedPlanId });
      subscribe(plan);
      Alert.alert(
        'Welcome to Premium',
        'You now have access to all features. This is a demo subscription.',
        [{ text: 'Continue', onPress: () => router.back() }]
      );
    }
  }, [selectedPlanId, subscribe, router, trackEvent]);

  const handleStartTrial = useCallback(() => {
    handleHaptic();
    startTrial();
    Alert.alert(
      'Trial Started',
      'Enjoy 7 days of full Premium access.',
      [{ text: 'Explore', onPress: () => router.back() }]
    );
  }, [handleHaptic, startTrial, router]);

  const handleRestore = useCallback(() => {
    handleHaptic();
    restore();
    Alert.alert('Restore', 'No previous purchase found. This is a demo.');
  }, [handleHaptic, restore]);

  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  if (isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.closeRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} testID="close-btn">
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.activeContainer}>
          <View style={styles.activeBadge}>
            <Crown size={32} color="#D4956A" />
          </View>
          <Text style={styles.activeTitle}>Premium Active</Text>
          <Text style={styles.activeSubtitle}>
            {state.isTrialActive ? 'Free trial active' : 'Full access enabled'}
          </Text>
          <View style={styles.activeInfoCard}>
            <View style={styles.activeInfoRow}>
              <Text style={styles.activeInfoLabel}>Status</Text>
              <View style={styles.activeStatusBadge}>
                <View style={styles.activeStatusDot} />
                <Text style={styles.activeInfoValue}>
                  {state.isTrialActive ? 'Trial' : 'Active'}
                </Text>
              </View>
            </View>
            {state.expiresAt && (
              <>
                <View style={styles.activeInfoDivider} />
                <View style={styles.activeInfoRow}>
                  <Text style={styles.activeInfoLabel}>Renews</Text>
                  <Text style={styles.activeInfoValue}>
                    {new Date(state.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              </>
            )}
            {state.plan && (
              <>
                <View style={styles.activeInfoDivider} />
                <View style={styles.activeInfoRow}>
                  <Text style={styles.activeInfoLabel}>Plan</Text>
                  <Text style={styles.activeInfoValue}>{state.plan.priceLabel}</Text>
                </View>
              </>
            )}
          </View>
          <View style={styles.activeFeaturesList}>
            <Text style={styles.activeFeatureHeader}>What's included</Text>
            {PREMIUM_FEATURES.slice(0, 5).map((f) => (
              <View key={f.id} style={styles.activeFeatureRow}>
                <Check size={14} color={Colors.success} />
                <Text style={styles.activeFeatureText}>{f.title}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
            <Crown size={32} color="#D4956A" />
          </Animated.View>
          <Text style={styles.heroTitle}>Deeper Support{'\n'}When You Need It</Text>
          <Text style={styles.heroSubtitle}>
            Unlock personalized insights, unlimited AI guidance, and advanced tools that grow with you.
          </Text>
        </Animated.View>

        {personalization.recentDistressAvg > 0 && (
          <Animated.View style={[styles.personalizationCard, { opacity: fadeAnim }]}>
            <Sparkles size={14} color={Colors.primary} />
            <Text style={styles.personalizationText}>
              {personalization.isRelationshipActivated
                ? 'Relationship stress seems active lately — premium unlocks deeper relationship support tools.'
                : personalization.recentDistressAvg >= 6
                  ? 'It seems like an intense week — premium gives you unlimited AI support and deeper insights.'
                  : 'Premium can help you understand your patterns and build on your progress.'}
            </Text>
          </Animated.View>
        )}

        <Animated.View style={[styles.testimonialCard, { opacity: fadeAnim }]}>
          <Animated.View style={{ opacity: testimonialFade }}>
            <Text style={styles.testimonialText}>
              "{TESTIMONIALS[testimonialIndex].text}"
            </Text>
            <Text style={styles.testimonialLabel}>
              {TESTIMONIALS[testimonialIndex].label}
            </Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.freeVsPremiumSection, { opacity: fadeAnim }]}>
          <Text style={styles.comparisonTitle}>What stays free</Text>
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
        </Animated.View>

        <Animated.View
          style={[styles.featuresSection, { opacity: fadeAnim }]}
          onLayout={(e) => { featureSectionY.current = e.nativeEvent.layout.y; }}
        >
          {anchor && (
            <View style={styles.anchorHighlight}>
              <Sparkles size={14} color="#D4956A" />
              <Text style={styles.anchorHighlightText}>
                {anchor === 'weekly_reflection' && 'Unlock deeper weekly reflection insights'}
                {anchor === 'therapist_report' && 'Keep a complete history of your therapy reports'}
                {anchor === 'unlimited_ai' && 'Continue with unlimited AI companion support'}
                {anchor === 'relationship_analysis' && 'Unlock advanced relationship pattern analysis'}
                {anchor === 'emotional_profile' && 'Discover deeper emotional pattern intelligence'}
                {anchor === 'secure_rewrite' && 'Unlock calm, self-respecting secure rewrites'}
                {anchor === 'message_simulation' && 'See likely outcomes before you send'}
                {anchor === 'message_health_scoring' && 'Get detailed message health analysis'}
                {anchor === 'communication_insights' && 'Discover your communication patterns'}
                {anchor === 'unlimited_rewrites' && 'Continue with unlimited message rewrites'}
                {!['weekly_reflection', 'therapist_report', 'unlimited_ai', 'relationship_analysis', 'emotional_profile', 'secure_rewrite', 'message_simulation', 'message_health_scoring', 'communication_insights', 'unlimited_rewrites'].includes(anchor) && 'Unlock deeper support tools'}
              </Text>
            </View>
          )}
          <Text style={styles.comparisonTitle}>What Premium unlocks</Text>
          {PREMIUM_FEATURES.map((feature, index) => {
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
                  <Crown size={11} color="#D4956A" />
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>

        <Animated.View style={[styles.plansSection, { opacity: fadeAnim }]}>
          <Text style={styles.plansTitle}>Choose your plan</Text>
          <View style={styles.plansRow}>
            {SUBSCRIPTION_PLANS.map((plan) => {
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
                  <View style={[styles.planRadio, isSelected && styles.planRadioSelected]}>
                    {isSelected && <View style={styles.planRadioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View style={[styles.ctaSection, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.ctaButton, isSubscribing && styles.ctaButtonDisabled]}
            onPress={handleSubscribe}
            activeOpacity={0.8}
            disabled={isSubscribing}
            testID="subscribe-btn"
          >
            <Crown size={18} color={Colors.white} />
            <Text style={styles.ctaButtonText}>
              {isSubscribing ? 'Processing...' : `Subscribe ${selectedPlan?.priceLabel ?? ''}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.trialButton}
            onPress={handleStartTrial}
            activeOpacity={0.7}
            testID="trial-btn"
          >
            <Zap size={15} color={Colors.primary} />
            <Text style={styles.trialButtonText}>Start 7-day free trial</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.trustSection}>
          <View style={styles.trustRow}>
            <Shield size={13} color={Colors.textMuted} />
            <Text style={styles.trustText}>Cancel anytime · No commitment</Text>
          </View>
          <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn} testID="restore-btn" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.restoreText}>Restore purchase</Text>
          </TouchableOpacity>
        </View>

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
    backgroundColor: '#FFF5EB',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#F5E0CC',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.brandNavy,
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
    color: Colors.brandNavy,
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
  anchorHighlight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: '#FFF5EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5E0CC',
  },
  anchorHighlightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8B6A47',
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: 28,
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
    backgroundColor: '#FFF0E3',
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
  plansRow: {
    flexDirection: 'row' as const,
    gap: 12,
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
    backgroundColor: '#D4956A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
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
    backgroundColor: Colors.brandNavy,
    borderRadius: 18,
    paddingVertical: 18,
    gap: 10,
    shadowColor: Colors.brandNavy,
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
    backgroundColor: '#FFF5EB',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F5E0CC',
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
