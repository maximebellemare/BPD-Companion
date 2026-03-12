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
import { Stack, useRouter } from 'expo-router';
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { SUBSCRIPTION_PLANS, PREMIUM_FEATURES } from '@/types/subscription';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  sparkles: Sparkles,
  eye: Eye,
  calendar: Calendar,
  heart: Heart,
  'file-text': FileText,
  'trending-up': TrendingUp,
  'git-branch': GitBranch,
};

export default function UpgradeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium, subscribe, startTrial, restore, isSubscribing, state } = useSubscription();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('yearly');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
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
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    shimmerLoop.start();

    featureAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 300 + index * 80,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      shimmerLoop.stop();
    };
  }, [fadeAnim, slideAnim, shimmerAnim, featureAnims]);

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
      subscribe(plan);
      Alert.alert(
        'Welcome to Premium',
        'You now have access to all features. This is a demo subscription.',
        [{ text: 'Continue', onPress: () => router.back() }]
      );
    }
  }, [selectedPlanId, subscribe, router]);

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
    outputRange: [0.6, 1],
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
          <Text style={styles.activeTitle}>You're on Premium</Text>
          <Text style={styles.activeSubtitle}>
            {state.isTrialActive ? 'Free trial active' : 'Full access enabled'}
          </Text>
          <View style={styles.activeInfoCard}>
            <View style={styles.activeInfoRow}>
              <Text style={styles.activeInfoLabel}>Status</Text>
              <Text style={styles.activeInfoValue}>
                {state.isTrialActive ? 'Trial' : 'Active'}
              </Text>
            </View>
            {state.expiresAt && (
              <View style={styles.activeInfoRow}>
                <Text style={styles.activeInfoLabel}>Renews</Text>
                <Text style={styles.activeInfoValue}>
                  {new Date(state.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            )}
            {state.plan && (
              <View style={styles.activeInfoRow}>
                <Text style={styles.activeInfoLabel}>Plan</Text>
                <Text style={styles.activeInfoValue}>{state.plan.priceLabel}</Text>
              </View>
            )}
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
            <Crown size={36} color="#D4956A" />
          </Animated.View>
          <Text style={styles.heroTitle}>Deeper Support{'\n'}When You Need It</Text>
          <Text style={styles.heroSubtitle}>
            Unlock advanced AI guidance, personalized therapy plans, and insights that grow with you.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.featuresSection, { opacity: fadeAnim }]}>
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
                        outputRange: [-20, 0],
                      }),
                    }],
                  },
                ]}
              >
                <View style={styles.featureIconWrap}>
                  <IconComponent size={18} color={Colors.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </View>
                <View style={styles.featureCheck}>
                  <Check size={14} color={Colors.success} />
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
            <Crown size={20} color={Colors.white} />
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
            <Zap size={16} color={Colors.primary} />
            <Text style={styles.trialButtonText}>Start 7-day free trial</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.trustSection}>
          <View style={styles.trustRow}>
            <Shield size={14} color={Colors.textMuted} />
            <Text style={styles.trustText}>Cancel anytime</Text>
          </View>
          <TouchableOpacity onPress={handleRestore}>
            <Text style={styles.restoreText}>Restore purchase</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            This is a companion app, not a replacement for therapy or medical advice. Subscription auto-renews unless cancelled at least 24 hours before the end of the current period.
          </Text>
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
    paddingTop: 8,
    paddingBottom: 28,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FFF5EB',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F5E0CC',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    maxWidth: 300,
  },
  featuresSection: {
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
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
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.successLight,
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
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
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
    color: Colors.primaryDark,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  planPriceSelected: {
    color: Colors.primaryDark,
  },
  planSavings: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
    marginBottom: 8,
  },
  planSavingsSelected: {
    color: Colors.primaryDark,
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
    borderColor: Colors.primary,
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  ctaSection: {
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    shadowColor: Colors.primaryDark,
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
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.card,
  },
  trialButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
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
  restoreText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
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
  activeContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  },
  activeBadge: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: '#FFF5EB',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#F5E0CC',
  },
  activeTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  activeSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  activeInfoCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 28,
  },
  activeInfoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
  doneBtn: {
    backgroundColor: Colors.primary,
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
