import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  UserX,
  MessageCircle,
  CloudLightning,
  Stethoscope,
  Anchor,
  TrendingUp,
  Pill,
  Sparkles,
  BookOpen,
  Wind,
  Timer,
  Users,
  BarChart3,
  Wrench,
  Clock,
  ChevronRight,
  Check,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { BRAND } from '@/constants/branding';
import BrandLogo from '@/components/branding/BrandLogo';
import OnboardingIllustration from '@/components/branding/illustrations/OnboardingIllustration';
import type { OnboardingTheme } from '@/components/branding/illustrations/OnboardingIllustration';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  OnboardingProfile,
  PrimaryReason,
  HardestMoment,
  PreferredTool,
  DesiredOutcome,
  ReminderTone,
  PRIMARY_REASON_OPTIONS,
  HARDEST_MOMENT_OPTIONS,
  PREFERRED_TOOL_OPTIONS,
  DESIRED_OUTCOME_OPTIONS,
  ONBOARDING_STEPS,
} from '@/types/onboarding';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Heart,
  UserX,
  MessageCircle,
  CloudLightning,
  Stethoscope,
  Anchor,
  TrendingUp,
  Pill,
  Sparkles,
  BookOpen,
  Wind,
  Timer,
  Users,
  BarChart3,
  Wrench,
  Clock,
};

const TOTAL_STEPS = ONBOARDING_STEPS.length;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onboardingProfile, completeOnboarding, skipOnboarding } = useOnboarding();
  const { trackEvent } = useAnalytics();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [profile, setProfile] = useState<OnboardingProfile>({ ...onboardingProfile });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [headerFade]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / TOTAL_STEPS,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentStep, progressAnim]);

  const animateTransition = useCallback((direction: 'forward' | 'back', callback: () => void) => {
    const exitValue = direction === 'forward' ? -30 : 30;
    const enterValue = direction === 'forward' ? 30 : -30;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: exitValue, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(enterValue);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const goNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('onboarding_step_completed', {
      step: ONBOARDING_STEPS[currentStep]?.id ?? 'unknown',
      step_index: currentStep,
    });

    if (currentStep < TOTAL_STEPS - 1) {
      animateTransition('forward', () => setCurrentStep(prev => prev + 1));
    } else {
      const finalProfile = { ...profile, completedAt: Date.now() };
      completeOnboarding(finalProfile);
      trackEvent('onboarding_completed', {
        primary_reason: finalProfile.primaryReason ?? 'none',
        tools_count: finalProfile.preferredTools.length,
        outcomes_count: finalProfile.desiredOutcomes.length,
      });
      router.replace('/');
    }
  }, [currentStep, profile, completeOnboarding, trackEvent, animateTransition, router]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      animateTransition('back', () => setCurrentStep(prev => prev - 1));
    }
  }, [currentStep, animateTransition]);

  const handleSkip = useCallback(() => {
    skipOnboarding();
    trackEvent('onboarding_skipped', { step_index: currentStep });
    router.replace('/');
  }, [skipOnboarding, trackEvent, currentStep, router]);

  const setPrimaryReason = useCallback((reason: PrimaryReason) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setProfile(prev => ({ ...prev, primaryReason: reason }));
  }, []);

  const toggleHardestMoment = useCallback((moment: HardestMoment) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setProfile(prev => {
      const exists = prev.hardestMoments.includes(moment);
      return {
        ...prev,
        hardestMoments: exists
          ? prev.hardestMoments.filter(m => m !== moment)
          : [...prev.hardestMoments, moment],
      };
    });
  }, []);

  const togglePreferredTool = useCallback((tool: PreferredTool) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setProfile(prev => {
      const exists = prev.preferredTools.includes(tool);
      return {
        ...prev,
        preferredTools: exists
          ? prev.preferredTools.filter(t => t !== tool)
          : [...prev.preferredTools, tool],
      };
    });
  }, []);

  const toggleDesiredOutcome = useCallback((outcome: DesiredOutcome) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setProfile(prev => {
      const exists = prev.desiredOutcomes.includes(outcome);
      return {
        ...prev,
        desiredOutcomes: exists
          ? prev.desiredOutcomes.filter(o => o !== outcome)
          : [...prev.desiredOutcomes, outcome],
      };
    });
  }, []);

  const toggleTreatment = useCallback((field: keyof typeof profile.treatmentContext) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setProfile(prev => ({
      ...prev,
      treatmentContext: {
        ...prev.treatmentContext,
        [field]: !prev.treatmentContext[field],
      },
    }));
  }, []);

  const setReminderTone = useCallback((tone: ReminderTone) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setProfile(prev => ({
      ...prev,
      reminderPreferences: { ...prev.reminderPreferences, tone },
    }));
  }, []);

  const toggleReminder = useCallback((field: 'dailyReminders' | 'weeklyReflectionReminders') => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setProfile(prev => ({
      ...prev,
      reminderPreferences: {
        ...prev.reminderPreferences,
        [field]: !prev.reminderPreferences[field],
      },
    }));
  }, []);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return true;
      case 1: return profile.primaryReason !== null;
      case 2: return profile.hardestMoments.length > 0;
      case 3: return true;
      case 4: return profile.preferredTools.length > 0;
      case 5: return true;
      case 6: return profile.desiredOutcomes.length > 0;
      default: return true;
    }
  }, [currentStep, profile]);

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const stepConfig = ONBOARDING_STEPS[currentStep];

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const STEP_ILLUSTRATION_MAP: Record<number, OnboardingTheme> = {
    0: 'welcome',
    1: 'emotions',
    2: 'relationships',
    3: 'growth',
    4: 'pause',
    5: 'awareness',
    6: 'growth',
  };

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeHeroBg}>
        <View style={styles.welcomeOrbitOuter} />
        <View style={styles.welcomeOrbitInner} />
        <View style={styles.welcomeGlow} />
        <View style={styles.welcomeHeroContent}>
          <BrandLogo size={72} variant="light" animated />
          <Text style={styles.welcomeTitle}>{BRAND.name}</Text>
          <Text style={styles.welcomeTagline}>{BRAND.shortTagline}</Text>
        </View>
      </View>
      <Text style={styles.welcomeSubtitle}>
        A calm, private space designed to support you through emotional storms, relationship triggers, and daily life.
      </Text>

      <View style={styles.welcomeFeatures}>
        {[
          { icon: <Shield size={18} color={Colors.primary} />, label: 'Emotional overwhelm support' },
          { icon: <Heart size={18} color={Colors.accent} />, label: 'Relationship trigger help' },
          { icon: <MessageCircle size={18} color={Colors.primaryDark} />, label: 'Pause before impulsive messages' },
          { icon: <BookOpen size={18} color={Colors.primary} />, label: 'Self-reflection & journaling' },
          { icon: <Stethoscope size={18} color={Colors.accent} />, label: 'Therapy prep & tracking' },
          { icon: <Anchor size={18} color={Colors.primaryDark} />, label: 'Daily stability & routines' },
        ].map((feature, i) => (
          <View key={i} style={styles.welcomeFeatureRow}>
            <View style={styles.welcomeFeatureIcon}>{feature.icon}</View>
            <Text style={styles.welcomeFeatureLabel}>{feature.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.welcomeNote}>
        Let's personalize your experience so everything feels relevant from day one.
      </Text>
    </View>
  );

  const renderPrimaryReason = () => (
    <View style={styles.stepContent}>
      {PRIMARY_REASON_OPTIONS.map(option => {
        const IconComponent = ICON_MAP[option.icon];
        const isSelected = profile.primaryReason === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.reasonCard, isSelected && styles.reasonCardSelected]}
            onPress={() => setPrimaryReason(option.value)}
            activeOpacity={0.7}
            testID={`reason-${option.value}`}
          >
            <View style={[styles.reasonIconWrap, isSelected && styles.reasonIconWrapSelected]}>
              {IconComponent && <IconComponent size={20} color={isSelected ? Colors.white : Colors.primary} />}
            </View>
            <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelSelected]}>
              {option.label}
            </Text>
            {isSelected && (
              <View style={styles.checkCircle}>
                <Check size={14} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderHardestMoments = () => (
    <View style={styles.stepContent}>
      <Text style={styles.multiSelectHint}>Select all that apply</Text>
      <View style={styles.chipGrid}>
        {HARDEST_MOMENT_OPTIONS.map(option => {
          const isSelected = profile.hardestMoments.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleHardestMoment(option.value)}
              activeOpacity={0.7}
              testID={`moment-${option.value}`}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {option.label}
              </Text>
              {isSelected && <Check size={14} color={Colors.white} style={styles.chipCheck} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderTreatment = () => (
    <View style={styles.stepContent}>
      {([
        { field: 'inTherapy' as const, label: 'I\'m currently in therapy', sub: 'Individual, group, or DBT' },
        { field: 'seesPsychiatrist' as const, label: 'I see a psychiatrist', sub: 'For medication management' },
        { field: 'trackAppointments' as const, label: 'I want to track appointments', sub: 'Reminders for upcoming sessions' },
        { field: 'trackMedications' as const, label: 'I want to track medications', sub: 'Daily medication reminders' },
      ]).map(item => (
        <TouchableOpacity
          key={item.field}
          style={[styles.treatmentCard, profile.treatmentContext[item.field] && styles.treatmentCardSelected]}
          onPress={() => toggleTreatment(item.field)}
          activeOpacity={0.7}
          testID={`treatment-${item.field}`}
        >
          <View style={styles.treatmentTextWrap}>
            <Text style={[styles.treatmentLabel, profile.treatmentContext[item.field] && styles.treatmentLabelSelected]}>
              {item.label}
            </Text>
            <Text style={styles.treatmentSub}>{item.sub}</Text>
          </View>
          <View style={[styles.toggleTrack, profile.treatmentContext[item.field] && styles.toggleTrackActive]}>
            <View style={[styles.toggleThumb, profile.treatmentContext[item.field] && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPreferredTools = () => (
    <View style={styles.stepContent}>
      <Text style={styles.multiSelectHint}>Select what resonates most</Text>
      {PREFERRED_TOOL_OPTIONS.map(option => {
        const IconComponent = ICON_MAP[option.icon];
        const isSelected = profile.preferredTools.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.toolCard, isSelected && styles.toolCardSelected]}
            onPress={() => togglePreferredTool(option.value)}
            activeOpacity={0.7}
            testID={`tool-${option.value}`}
          >
            <View style={[styles.toolIconWrap, isSelected && styles.toolIconWrapSelected]}>
              {IconComponent && <IconComponent size={18} color={isSelected ? Colors.white : Colors.primary} />}
            </View>
            <Text style={[styles.toolLabel, isSelected && styles.toolLabelSelected]}>
              {option.label}
            </Text>
            {isSelected && (
              <View style={styles.checkCircleSmall}>
                <Check size={12} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderReminders = () => (
    <View style={styles.stepContent}>
      <TouchableOpacity
        style={[styles.treatmentCard, profile.reminderPreferences.dailyReminders && styles.treatmentCardSelected]}
        onPress={() => toggleReminder('dailyReminders')}
        activeOpacity={0.7}
        testID="reminder-daily"
      >
        <View style={styles.treatmentTextWrap}>
          <Text style={[styles.treatmentLabel, profile.reminderPreferences.dailyReminders && styles.treatmentLabelSelected]}>
            Daily check-in reminders
          </Text>
          <Text style={styles.treatmentSub}>A gentle nudge to check in with yourself</Text>
        </View>
        <View style={[styles.toggleTrack, profile.reminderPreferences.dailyReminders && styles.toggleTrackActive]}>
          <View style={[styles.toggleThumb, profile.reminderPreferences.dailyReminders && styles.toggleThumbActive]} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.treatmentCard, profile.reminderPreferences.weeklyReflectionReminders && styles.treatmentCardSelected]}
        onPress={() => toggleReminder('weeklyReflectionReminders')}
        activeOpacity={0.7}
        testID="reminder-weekly"
      >
        <View style={styles.treatmentTextWrap}>
          <Text style={[styles.treatmentLabel, profile.reminderPreferences.weeklyReflectionReminders && styles.treatmentLabelSelected]}>
            Weekly reflection reminders
          </Text>
          <Text style={styles.treatmentSub}>Reflect on your week and notice growth</Text>
        </View>
        <View style={[styles.toggleTrack, profile.reminderPreferences.weeklyReflectionReminders && styles.toggleTrackActive]}>
          <View style={[styles.toggleThumb, profile.reminderPreferences.weeklyReflectionReminders && styles.toggleThumbActive]} />
        </View>
      </TouchableOpacity>

      <View style={styles.toneSection}>
        <Text style={styles.toneSectionTitle}>Reminder tone</Text>
        <Text style={styles.toneSectionSub}>How would you like reminders to feel?</Text>
        <View style={styles.toneOptions}>
          {([
            { value: 'minimal' as ReminderTone, label: 'Minimal', desc: 'Brief, low-key' },
            { value: 'balanced' as ReminderTone, label: 'Balanced', desc: 'Warm, moderate' },
            { value: 'supportive' as ReminderTone, label: 'Supportive', desc: 'Encouraging, caring' },
          ]).map(tone => (
            <TouchableOpacity
              key={tone.value}
              style={[styles.toneCard, profile.reminderPreferences.tone === tone.value && styles.toneCardSelected]}
              onPress={() => setReminderTone(tone.value)}
              activeOpacity={0.7}
              testID={`tone-${tone.value}`}
            >
              <Text style={[styles.toneLabel, profile.reminderPreferences.tone === tone.value && styles.toneLabelSelected]}>
                {tone.label}
              </Text>
              <Text style={[styles.toneDesc, profile.reminderPreferences.tone === tone.value && styles.toneDescSelected]}>
                {tone.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderDesiredOutcomes = () => (
    <View style={styles.stepContent}>
      <Text style={styles.multiSelectHint}>What would progress look like for you?</Text>
      <View style={styles.chipGrid}>
        {DESIRED_OUTCOME_OPTIONS.map(option => {
          const isSelected = profile.desiredOutcomes.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.outcomeChip, isSelected && styles.outcomeChipSelected]}
              onPress={() => toggleDesiredOutcome(option.value)}
              activeOpacity={0.7}
              testID={`outcome-${option.value}`}
            >
              <Text style={[styles.outcomeChipText, isSelected && styles.outcomeChipTextSelected]}>
                {option.label}
              </Text>
              {isSelected && <Check size={14} color={Colors.white} style={styles.chipCheck} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderWelcome();
      case 1: return renderPrimaryReason();
      case 2: return renderHardestMoments();
      case 3: return renderTreatment();
      case 4: return renderPreferredTools();
      case 5: return renderReminders();
      case 6: return renderDesiredOutcomes();
      default: return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.topBar, { opacity: headerFade }]}>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.stepIndicator}>{currentStep + 1} / {TOTAL_STEPS}</Text>
        </View>
        {currentStep > 0 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7} testID="skip-onboarding">
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep > 0 && (
          <Animated.View style={[styles.stepHeader, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.stepIllustrationWrap}>
              <OnboardingIllustration
                theme={STEP_ILLUSTRATION_MAP[currentStep] ?? 'default'}
                size={100}
              />
            </View>
            <Text style={styles.stepTitle}>{stepConfig?.title}</Text>
            <Text style={styles.stepSubtitle}>{stepConfig?.subtitle}</Text>
          </Animated.View>
        )}

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          {renderStepContent()}
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomActions}>
          {currentStep > 0 ? (
            <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7} testID="back-button">
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}

          <TouchableOpacity
            style={[styles.continueButton, !canProceed && styles.continueButtonDisabled]}
            onPress={goNext}
            activeOpacity={0.7}
            disabled={!canProceed}
            testID="continue-button"
          >
            <Text style={[styles.continueButtonText, !canProceed && styles.continueButtonTextDisabled]}>
              {isLastStep ? 'Get Started' : currentStep === 0 ? "Let's go" : 'Continue'}
            </Text>
            <ChevronRight size={18} color={canProceed ? Colors.white : Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(74, 139, 141, 0.12)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brandTeal,
    borderRadius: 3,
  },
  stepIndicator: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    minWidth: 36,
    textAlign: 'right',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  stepIllustrationWrap: {
    alignItems: 'center' as const,
    marginBottom: 20,
    marginTop: 8,
  },
  stepHeader: {
    marginTop: 16,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 22,
  },
  stepContent: {
    gap: 10,
  },
  multiSelectHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 6,
    fontWeight: '500' as const,
  },
  welcomeContainer: {
    paddingTop: 20,
  },
  welcomeHeroBg: {
    backgroundColor: Colors.brandNavy,
    borderRadius: 28,
    paddingVertical: 44,
    paddingHorizontal: 24,
    marginBottom: 28,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  welcomeHeroContent: {
    alignItems: 'center' as const,
    zIndex: 2,
  },
  welcomeOrbitOuter: {
    position: 'absolute' as const,
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(74, 139, 141, 0.12)',
  },
  welcomeOrbitInner: {
    position: 'absolute' as const,
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(155, 142, 196, 0.1)',
  },
  welcomeGlow: {
    position: 'absolute' as const,
    top: '30%' as unknown as number,
    left: '25%' as unknown as number,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(74, 139, 141, 0.06)',
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: '#F0EDE9',
    textAlign: 'center' as const,
    letterSpacing: -0.8,
    marginTop: 16,
  },
  welcomeTagline: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(74, 139, 141, 0.85)',
    textAlign: 'center' as const,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 23,
    paddingHorizontal: 8,
  },
  welcomeFeatures: {
    marginTop: 28,
    gap: 14,
  },
  welcomeFeatureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  welcomeFeatureIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  welcomeFeatureLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
    flex: 1,
  },
  welcomeNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 28,
    fontStyle: 'italic' as const,
    lineHeight: 21,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  reasonCardSelected: {
    borderColor: Colors.brandTeal,
    backgroundColor: Colors.brandTealSoft,
  },
  reasonIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  reasonIconWrapSelected: {
    backgroundColor: Colors.brandTeal,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  reasonLabelSelected: {
    color: Colors.brandNavy,
    fontWeight: '600' as const,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.brandTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.brandTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  chipSelected: {
    backgroundColor: Colors.brandTeal,
    borderColor: Colors.brandTeal,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  chipCheck: {
    marginLeft: 6,
  },
  treatmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  treatmentCardSelected: {
    borderColor: Colors.brandTeal,
    backgroundColor: Colors.brandTealSoft,
  },
  treatmentTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  treatmentLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  treatmentLabelSelected: {
    color: Colors.brandNavy,
    fontWeight: '600' as const,
  },
  treatmentSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: Colors.brandTeal,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.white,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  toolCardSelected: {
    borderColor: Colors.brandTeal,
    backgroundColor: Colors.brandTealSoft,
  },
  toolIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toolIconWrapSelected: {
    backgroundColor: Colors.brandTeal,
  },
  toolLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  toolLabelSelected: {
    color: Colors.brandNavy,
    fontWeight: '600' as const,
  },
  toneSection: {
    marginTop: 12,
  },
  toneSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  toneSectionSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 14,
  },
  toneOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  toneCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  toneCardSelected: {
    borderColor: Colors.brandTeal,
    backgroundColor: Colors.brandTealSoft,
  },
  toneLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  toneLabelSelected: {
    color: Colors.brandNavy,
  },
  toneDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  toneDescSelected: {
    color: Colors.brandNavy,
  },
  outcomeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  outcomeChipSelected: {
    backgroundColor: Colors.brandTeal,
    borderColor: Colors.brandTeal,
  },
  outcomeChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  outcomeChipTextSelected: {
    color: Colors.white,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  backPlaceholder: {
    width: 0,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.brandNavy,
    borderRadius: 16,
    paddingVertical: 17,
    gap: 6,
    shadowColor: Colors.brandNavy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  continueButtonTextDisabled: {
    color: Colors.textMuted,
  },
});
