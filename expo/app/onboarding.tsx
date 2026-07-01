import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  MessageCircle,
  MessageSquareWarning,
  Shield,
  Sparkles,
  Users,
  Wind,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import BrandLogo from '@/components/branding/BrandLogo';
import OnboardingIllustration, { OnboardingTheme } from '@/components/branding/illustrations/OnboardingIllustration';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { useUserProfile } from '@/providers/UserProfileProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import {
  DEFAULT_ONBOARDING_PROFILE,
  OnboardingProfile,
} from '@/types/onboarding';

type FeatureIcon = React.ComponentType<{ size: number; color: string }>;

interface FeatureItem {
  title: string;
  what: string;
  why: string;
  icon: FeatureIcon;
}

interface TourStep {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  theme: OnboardingTheme;
  features: FeatureItem[];
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    eyebrow: 'BPD Companion',
    title: 'Understand patterns. Pause reactions. Build skills.',
    subtitle: 'A private support app for emotional awareness, regulation practice, and steadier choices in hard moments.',
    theme: 'welcome',
    features: [
      {
        title: 'Private daily support',
        what: 'A simple place to check in, reflect, and get help when emotions feel intense.',
        why: 'Small daily signals help the app understand what tends to happen before spirals.',
        icon: Sparkles,
      },
    ],
  },
  {
    id: 'daily',
    eyebrow: 'Daily rhythm',
    title: 'Check in once. Learn what repeats.',
    subtitle: 'Use BPD Companion for a quick daily signal, then let Insights turn those signals into plain-language patterns.',
    theme: 'awareness',
    features: [
      {
        title: 'Daily Check-Ins',
        what: 'Log emotion, intensity, triggers, relationships, and notes in under a minute.',
        why: 'You start seeing what shows up most often instead of guessing from memory.',
        icon: MessageCircle,
      },
      {
        title: 'Insights',
        what: 'Simple cards explain what appears in your check-ins, conversations, and reflections.',
        why: 'Patterns become easier to catch before they become reactions.',
        icon: BarChart3,
      },
    ],
  },
  {
    id: 'moment',
    eyebrow: 'In the moment',
    title: 'Get help before the reaction takes over.',
    subtitle: 'When emotions spike, the app points you toward calming, talking it through, or pausing before a message.',
    theme: 'pause',
    features: [
      {
        title: 'Companion',
        what: 'Talk through what happened with context from your recent check-ins and patterns.',
        why: 'It can help you slow down, understand the emotional chain, and choose one next step.',
        icon: HeartHandshake,
      },
      {
        title: 'Calm Me Down',
        what: 'A short guided flow for intense moments, with before-and-after intensity tracking.',
        why: 'It helps your body settle before you analyze or respond.',
        icon: Wind,
      },
      {
        title: "Don't Send It",
        what: 'Paste a message and clarify who it is for, what you want, and how to say it more effectively.',
        why: 'You can pause impulsive texting without shaming yourself or blocking your choice.',
        icon: MessageSquareWarning,
      },
    ],
  },
  {
    id: 'practice',
    eyebrow: 'Practice and support',
    title: 'Build skills between hard moments.',
    subtitle: 'Use short practice, peer support, and real-life scenarios so the skills are easier to reach when you need them.',
    theme: 'growth',
    features: [
      {
        title: 'DBT Academy',
        what: 'Practice real scenarios across abandonment, rejection, anger, shame, relationships, and more.',
        why: 'You learn application, not theory, so skills become more natural.',
        icon: BookOpen,
      },
      {
        title: 'Community',
        what: 'A peer-support space for feeling less alone.',
        why: 'Community can support connection, while crisis and medical needs still belong with urgent or professional care.',
        icon: Users,
      },
    ],
  },
  {
    id: 'safety',
    eyebrow: 'Safety',
    title: 'Supportive, not medical care.',
    subtitle: 'BPD Companion can help you reflect, practice, and organize care. It is not a replacement for therapy, medical advice, or emergency support.',
    theme: 'safety',
    features: [
      {
        title: 'Use crisis support when needed',
        what: 'If someone is in immediate danger, contact local emergency services or a crisis line.',
        why: 'The app is not a crisis service and should not be used as emergency care.',
        icon: Shield,
      },
    ],
  },
];

const TOTAL_STEPS = TOUR_STEPS.length;

function buildCompletedProfile(skipped: boolean): OnboardingProfile {
  return {
    ...DEFAULT_ONBOARDING_PROFILE,
    primaryReasons: ['understanding_patterns', 'impulsive_messaging', 'emotional_overwhelm'],
    preferredTools: [
      'ai_companion',
      'calm_emotional_spikes',
      'understand_patterns',
      'pause_before_messaging',
      'dbt_coping_skills',
      'feel_less_alone',
    ],
    dailyCheckInTracks: ['emotions', 'triggers', 'urges', 'relationships', 'notes'],
    desiredOutcomes: [
      'better_understanding_triggers',
      'more_pause_before_reacting',
      'better_emotional_control',
    ],
    safetyAcknowledged: !skipped,
    completedAt: Date.now(),
    skippedAt: skipped ? Date.now() : null,
  };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, theme } = useAppTheme();
  const { completeOnboarding } = useOnboarding();
  const { refreshProfile } = useUserProfile();
  const { trackEvent } = useAnalytics();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const illustrationVariant = theme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    void trackEvent('onboarding_started', { version: 'feature_tour_v2' });
  }, [trackEvent]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / TOTAL_STEPS,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [currentStep, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const animateStep = useCallback((direction: 'forward' | 'back', callback: () => void) => {
    const exitX = direction === 'forward' ? -22 : 22;
    const enterX = direction === 'forward' ? 22 : -22;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: exitX, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(enterX);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 170, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 170, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const finishOnboarding = useCallback(async (skipped: boolean) => {
    if (isCompleting) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsCompleting(true);
    const completed = buildCompletedProfile(skipped);
    try {
      await completeOnboarding(completed);
      await refreshProfile();
      trackEvent(skipped ? 'onboarding_step_completed' : 'onboarding_completed', {
        step: skipped ? 'skipped' : 'feature_tour_complete',
        version: 'feature_tour_v2',
      });
      router.replace('/(tabs)/(home)' as never);
    } catch (error) {
      console.log('[Onboarding] completion failed:', error);
      setIsCompleting(false);
    }
  }, [completeOnboarding, isCompleting, refreshProfile, router, trackEvent]);

  const goBack = useCallback(() => {
    if (currentStep === 0 || isCompleting) return;
    animateStep('back', () => setCurrentStep(prev => prev - 1));
  }, [animateStep, currentStep, isCompleting]);

  const goNext = useCallback(() => {
    if (isCompleting) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('onboarding_step_completed', { step: step.id, step_index: currentStep });
    if (isLastStep) {
      void finishOnboarding(false);
      return;
    }
    animateStep('forward', () => setCurrentStep(prev => prev + 1));
  }, [animateStep, currentStep, finishOnboarding, isCompleting, isLastStep, step.id, trackEvent]);

  const featureRows = useMemo(() => step.features, [step.features]);

  if (isCompleting) {
    return (
      <View style={[styles.transitionContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <BrandLogo size={74} />
        <ActivityIndicator size="small" color={colors.brandTeal} style={styles.transitionSpinner} />
        <Text style={[styles.transitionTitle, { color: colors.text }]}>Setting up your space</Text>
        <Text style={[styles.transitionText, { color: colors.textSecondary }]}>BPD Companion is saving your tutorial.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <View style={styles.progressRow}>
          <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
            <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.brandTeal }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.primary }]}>{currentStep + 1} / {TOTAL_STEPS}</Text>
        </View>
        <TouchableOpacity
          onPress={() => void finishOnboarding(true)}
          activeOpacity={0.75}
          style={styles.skipButton}
          testID="onboarding-skip"
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 122 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          <View style={[styles.visualCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            {currentStep === 0 ? (
              <BrandLogo size={118} animated />
            ) : (
              <OnboardingIllustration theme={step.theme} size={150} variant={illustrationVariant} />
            )}
          </View>

          <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>{step.eyebrow}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{step.subtitle}</Text>

          <View style={styles.featureStack}>
            {featureRows.map((feature) => {
              const Icon = feature.icon;
              return (
                <View
                  key={feature.title}
                  style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                >
                  <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}>
                    <Icon size={20} color={colors.primary} />
                  </View>
                  <View style={styles.featureCopy}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                      <Text style={[styles.featureLead, { color: colors.text }]}>What it is: </Text>
                      {feature.what}
                    </Text>
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                      <Text style={[styles.featureLead, { color: colors.text }]}>How it helps: </Text>
                      {feature.why}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={[styles.replayNote, { color: colors.textMuted }]}>
            You can replay this tutorial later from Profile.
          </Text>
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.card, borderTopColor: colors.borderLight }]}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.75} testID="onboarding-back">
            <ChevronLeft size={18} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={goNext}
          activeOpacity={0.75}
          testID="onboarding-continue"
        >
          <Text style={styles.nextText}>{isLastStep ? 'Enter app' : currentStep === 0 ? 'Start tour' : 'Continue'}</Text>
          <ChevronRight size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  transitionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  transitionSpinner: {
    marginTop: 22,
    marginBottom: 14,
  },
  transitionTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  transitionText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 10,
  },
  progressRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    minWidth: 38,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '800',
  },
  skipButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  visualCard: {
    minHeight: 188,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 18,
  },
  featureStack: {
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: {
    flex: 1,
    gap: 5,
  },
  featureTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  featureText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  featureLead: {
    fontWeight: '900',
  },
  replayNote: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 15,
    paddingHorizontal: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: '800',
  },
  backPlaceholder: {
    width: 74,
  },
  nextButton: {
    flex: 1,
    maxWidth: 230,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
  },
  nextText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
});
