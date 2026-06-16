import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
  Activity,
  BarChart3,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudLightning,
  Compass,
  Heart,
  Moon,
  Shield,
  Sparkles,
  Timer,
  TrendingUp,
  UserX,
  Users,
  Wind,
  Wrench,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import BrandLogo from '@/components/branding/BrandLogo';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useOnboarding } from '@/providers/OnboardingProvider';
import {
  DAILY_CHECK_IN_OPTIONS,
  DailyCheckInTrack,
  DEFAULT_ONBOARDING_PROFILE,
  ONBOARDING_STEPS,
  OnboardingProfile,
  PRIMARY_REASON_OPTIONS,
  PrimaryReason,
  PreferredTool,
  SUPPORT_GOAL_OPTIONS,
} from '@/types/onboarding';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Activity,
  BarChart3,
  BookOpen,
  Check,
  CloudLightning,
  Compass,
  Heart,
  Moon,
  Shield,
  Sparkles,
  Timer,
  TrendingUp,
  UserX,
  Users,
  Wind,
  Wrench,
};

const TOTAL_STEPS = ONBOARDING_STEPS.length;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onboardingProfile, completeOnboarding } = useOnboarding();
  const { trackEvent } = useAnalytics();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [profile, setProfile] = useState<OnboardingProfile>({
    ...DEFAULT_ONBOARDING_PROFILE,
    ...onboardingProfile,
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / TOTAL_STEPS,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [currentStep, progressAnim]);

  const animateStep = useCallback((direction: 'forward' | 'back', callback: () => void) => {
    const exitX = direction === 'forward' ? -24 : 24;
    const enterX = direction === 'forward' ? 24 : -24;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: exitX, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(enterX);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const toggleArrayValue = useCallback(<T extends string>(
    key: 'primaryReasons' | 'preferredTools' | 'dailyCheckInTracks',
    value: T,
  ) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setProfile(prev => {
      const current = prev[key] as T[];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists ? current.filter(item => item !== value) : [...current, value],
      };
    });
  }, []);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return profile.primaryReasons.length > 0;
      case 2:
        return profile.preferredTools.length > 0;
      case 3:
        return profile.dailyCheckInTracks.length > 0;
      case 4:
        return profile.safetyAcknowledged;
      default:
        return true;
    }
  }, [currentStep, profile]);

  const goBack = useCallback(() => {
    if (currentStep === 0) return;
    animateStep('back', () => setCurrentStep(prev => prev - 1));
  }, [animateStep, currentStep]);

  const goNext = useCallback(() => {
    if (!canProceed) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const stepId = ONBOARDING_STEPS[currentStep]?.id ?? 'unknown';
    trackEvent('onboarding_step_completed', { step: stepId, step_index: currentStep });

    if (currentStep < TOTAL_STEPS - 1) {
      animateStep('forward', () => setCurrentStep(prev => prev + 1));
      return;
    }

    const completed: OnboardingProfile = {
      ...profile,
      completedAt: Date.now(),
      skippedAt: null,
    };
    completeOnboarding(completed);
    trackEvent('onboarding_completed', {
      reasons_count: completed.primaryReasons.length,
      support_count: completed.preferredTools.length,
      check_in_count: completed.dailyCheckInTracks.length,
    });
    router.replace('/');
  }, [animateStep, canProceed, completeOnboarding, currentStep, profile, router, trackEvent]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  const renderOption = (
    value: string,
    label: string,
    icon: string,
    selected: boolean,
    onPress: () => void,
    testID: string,
  ) => {
    const Icon = ICON_MAP[icon] ?? Sparkles;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.optionCard, selected && styles.optionCardSelected]}
        onPress={onPress}
        activeOpacity={0.75}
        testID={testID}
      >
        <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
          <Icon size={19} color={selected ? Colors.white : Colors.logoCyan} />
        </View>
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
        <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
          {selected ? <Check size={13} color={Colors.white} /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderWelcome = () => (
    <View style={styles.centerContent}>
      <View style={styles.logoHalo}>
        <BrandLogo size={106} animated />
      </View>
      <Text style={styles.heroTitle}>BPD Companion</Text>
      <Text style={styles.heroSubtitle}>
        A calm, private companion for emotional regulation, reflection, and coping support.
      </Text>
      <View style={styles.featureStack}>
        {[
          ['Regulate emotional spikes', Wind],
          ['Reflect without judgment', BookOpen],
          ['Practice coping before reacting', Shield],
        ].map(([label, Icon]) => {
          const FeatureIcon = Icon as React.ComponentType<{ size: number; color: string }>;
          return (
            <View key={label as string} style={styles.featureRow}>
              <FeatureIcon size={18} color={Colors.logoCyan} />
              <Text style={styles.featureText}>{label as string}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderReasons = () => (
    <View style={styles.optionStack}>
      <Text style={styles.multiHint}>Choose one or more</Text>
      {PRIMARY_REASON_OPTIONS.map(option => renderOption(
        option.value,
        option.label,
        option.icon,
        profile.primaryReasons.includes(option.value),
        () => toggleArrayValue<PrimaryReason>('primaryReasons', option.value),
        `reason-${option.value}`,
      ))}
    </View>
  );

  const renderSupport = () => (
    <View style={styles.optionStack}>
      <Text style={styles.multiHint}>Choose one or more</Text>
      {SUPPORT_GOAL_OPTIONS.map(option => renderOption(
        option.value,
        option.label,
        option.icon,
        profile.preferredTools.includes(option.value),
        () => toggleArrayValue<PreferredTool>('preferredTools', option.value),
        `support-${option.value}`,
      ))}
    </View>
  );

  const renderCheckIn = () => (
    <View style={styles.optionStack}>
      <Text style={styles.multiHint}>Choose what your daily check-in should include</Text>
      {DAILY_CHECK_IN_OPTIONS.map(option => renderOption(
        option.value,
        option.label,
        option.icon,
        profile.dailyCheckInTracks.includes(option.value),
        () => toggleArrayValue<DailyCheckInTrack>('dailyCheckInTracks', option.value),
        `track-${option.value}`,
      ))}
    </View>
  );

  const renderSafety = () => (
    <View style={styles.safetyCard}>
      <View style={styles.safetyIconWrap}>
        <Shield size={28} color={Colors.logoCyan} />
      </View>
      <Text style={styles.safetyTitle}>Supportive, not clinical care</Text>
      {[
        'This app is not medical advice.',
        'It is not a crisis service.',
        'It does not replace therapy or emergency care.',
        'If someone is in immediate danger, contact local emergency services.',
      ].map(item => (
        <View key={item} style={styles.safetyLine}>
          <View style={styles.safetyDot} />
          <Text style={styles.safetyText}>{item}</Text>
        </View>
      ))}
      <TouchableOpacity
        style={[styles.ackButton, profile.safetyAcknowledged && styles.ackButtonSelected]}
        onPress={() => {
          if (Platform.OS !== 'web') void Haptics.selectionAsync();
          setProfile(prev => ({ ...prev, safetyAcknowledged: !prev.safetyAcknowledged }));
        }}
        activeOpacity={0.75}
        testID="acknowledge-safety"
      >
        <View style={[styles.ackCheck, profile.safetyAcknowledged && styles.ackCheckSelected]}>
          {profile.safetyAcknowledged ? <Check size={13} color={Colors.white} /> : null}
        </View>
        <Text style={[styles.ackText, profile.safetyAcknowledged && styles.ackTextSelected]}>
          I understand
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFinish = () => (
    <View style={styles.centerContent}>
      <View style={styles.logoHaloSmall}>
        <BrandLogo size={84} />
      </View>
      <Text style={styles.finishTitle}>Your space is ready</Text>
      <Text style={styles.finishText}>
        BPD Companion will prioritize regulation tools, reflection prompts, and check-ins based on what you selected.
      </Text>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Selected focus areas</Text>
        <Text style={styles.summaryValue}>{profile.primaryReasons.length} reasons</Text>
        <View style={styles.summaryDivider} />
        <Text style={styles.summaryLabel}>Support goals</Text>
        <Text style={styles.summaryValue}>{profile.preferredTools.length} priorities</Text>
        <View style={styles.summaryDivider} />
        <Text style={styles.summaryLabel}>Daily check-in</Text>
        <Text style={styles.summaryValue}>{profile.dailyCheckInTracks.length} trackers</Text>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderWelcome();
      case 1:
        return renderReasons();
      case 2:
        return renderSupport();
      case 3:
        return renderCheckIn();
      case 4:
        return renderSafety();
      case 5:
        return renderFinish();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>{currentStep + 1} / {TOTAL_STEPS}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 116 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.stepHeader, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          {currentStep > 0 ? (
            <>
              <Text style={styles.stepKicker}>BPD Companion</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            </>
          ) : null}
        </Animated.View>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.75} testID="back-button">
            <ChevronLeft size={18} color={Colors.logoCyan} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <TouchableOpacity
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={goNext}
          activeOpacity={0.75}
          disabled={!canProceed}
          testID="continue-button"
        >
          <Text style={[styles.nextText, !canProceed && styles.nextTextDisabled]}>
            {isLastStep ? 'Enter app' : currentStep === 0 ? 'Begin' : 'Continue'}
          </Text>
          <ChevronRight size={18} color={canProceed ? Colors.white : Colors.textMuted} />
        </TouchableOpacity>
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
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.logoCyan,
  },
  progressText: {
    minWidth: 38,
    textAlign: 'right',
    fontSize: 12,
    color: Colors.logoCyan,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
  },
  stepHeader: {
    minHeight: 100,
    justifyContent: 'flex-end',
    paddingTop: 14,
    paddingBottom: 20,
  },
  stepKicker: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.logoCyan,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.72)',
  },
  centerContent: {
    alignItems: 'center',
    paddingTop: 34,
  },
  logoHalo: {
    width: 142,
    height: 142,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  logoHaloSmall: {
    width: 116,
    height: 116,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 22,
  },
  heroTitle: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    maxWidth: 330,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.76)',
    textAlign: 'center',
    marginBottom: 28,
  },
  featureStack: {
    width: '100%',
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  featureText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  optionStack: {
    gap: 10,
  },
  multiHint: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.logoCyan,
    marginBottom: 2,
  },
  optionCard: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  optionCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.logoCyan,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(103,232,249,0.12)',
  },
  optionIconSelected: {
    backgroundColor: Colors.brandTeal,
  },
  optionText: {
    flex: 1,
    color: Colors.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: Colors.white,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: Colors.brandTeal,
    borderColor: Colors.brandTeal,
  },
  safetyCard: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  safetyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  safetyTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 16,
  },
  safetyLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 13,
  },
  safetyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.logoCyan,
    marginTop: 7,
  },
  safetyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.76)',
  },
  ackButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ackButtonSelected: {
    borderColor: Colors.logoCyan,
    backgroundColor: Colors.primary,
  },
  ackCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ackCheckSelected: {
    borderColor: Colors.brandTeal,
    backgroundColor: Colors.brandTeal,
  },
  ackText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  ackTextSelected: {
    color: Colors.white,
  },
  finishTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  finishText: {
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.76)',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    width: '100%',
    borderRadius: 20,
    padding: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.logoCyan,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 14,
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
    backgroundColor: 'rgba(2,6,23,0.96)',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 15,
    paddingHorizontal: 6,
  },
  backText: {
    color: Colors.logoCyan,
    fontSize: 15,
    fontWeight: '700',
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
    backgroundColor: Colors.brandTeal,
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  nextText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  nextTextDisabled: {
    color: Colors.textMuted,
  },
});
