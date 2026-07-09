import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  MessageCircle,
  Shield,
  Sparkles,
  Users,
  Wind,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import BrandLogo from '@/components/branding/BrandLogo';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { useUserProfile } from '@/providers/UserProfileProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useReviewPrompt } from '@/providers/ReviewPromptProvider';
import {
  DEFAULT_ONBOARDING_PROFILE,
  OnboardingProfile,
  PrimaryReason,
  HardestMoment,
  DesiredOutcome,
  PreferredTool,
} from '@/types/onboarding';

type OptionGroup = 'reasons' | 'situations' | 'success';

interface Choice {
  label: string;
  value: string;
}

interface AssessmentAnswers {
  reasons: string[];
  situations: string[];
  success: string[];
  reasonLabels: string[];
  situationLabels: string[];
  successLabels: string[];
  customAnswers: {
    reasons: string[];
    situations: string[];
    success: string[];
  };
  focus: string[];
  completedVersion: string;
}

type AssessmentOnboardingProfile = OnboardingProfile & {
  assessment: AssessmentAnswers;
  personalizedFocus: string[];
};

const VERSION = 'personalized_conversion_v1';

const REASONS: Choice[] = [
  { label: 'Emotional overwhelm', value: 'emotional_overwhelm' },
  { label: 'Fear of abandonment', value: 'fear_of_abandonment' },
  { label: 'Relationship problems', value: 'relationship_problems' },
  { label: 'Mood swings', value: 'mood_swings' },
  { label: 'Anger', value: 'anger' },
  { label: 'Impulsive behaviours', value: 'impulsive_behaviours' },
  { label: 'Anxiety', value: 'anxiety' },
  { label: 'Depression', value: 'depression' },
  { label: 'Self-esteem', value: 'self_esteem' },
  { label: 'I was recently diagnosed', value: 'recently_diagnosed' },
  { label: 'I want to better understand myself', value: 'understand_myself' },
  { label: 'Other', value: 'other' },
];

const SITUATIONS: Choice[] = [
  { label: 'Arguments', value: 'arguments' },
  { label: 'Feeling ignored', value: 'feeling_ignored' },
  { label: 'Rejection', value: 'rejection' },
  { label: 'Breakups', value: 'breakups' },
  { label: 'Loneliness', value: 'loneliness' },
  { label: 'Family', value: 'family' },
  { label: 'Dating', value: 'dating' },
  { label: 'Work', value: 'work' },
  { label: 'Stress', value: 'stress' },
  { label: 'Other', value: 'other' },
];

const SUCCESS: Choice[] = [
  { label: 'Better emotional control', value: 'better_emotional_control' },
  { label: 'Healthier relationships', value: 'healthier_relationships' },
  { label: 'Less anxiety', value: 'less_anxiety' },
  { label: 'Fewer emotional crises', value: 'fewer_emotional_crises' },
  { label: 'Better communication', value: 'better_communication' },
  { label: 'Feeling calmer', value: 'feeling_calmer' },
  { label: 'Understanding my triggers', value: 'understanding_triggers' },
  { label: 'Building healthy habits', value: 'building_healthy_habits' },
  { label: 'Other', value: 'other' },
];

const BENEFITS = [
  'Unlimited AI Companion',
  'Unlimited check-ins',
  'CBT Thought Record',
  'DBT tools',
  'Calm Me Down and Pause Before You Send',
  'Trigger understanding',
  'Emotional map',
  'Relationship support',
  'Reflection tools',
  'Community',
  'Progress tracking',
  'Future updates included',
];

const TRANSFORMATION_POINTS = [
  'Calmer during arguments instead of reacting instantly',
  'Able to understand why your mood changed today',
  'Aware of triggers before they spiral',
  'More confident before sending difficult messages',
  'Less alone and less judged',
  'Supported every day, not only during crisis moments',
];

const TOTAL_STEPS = 7;

function labelsFor(values: string[], options: Choice[]): string[] {
  return values
    .filter(value => value !== 'other')
    .map(value => options.find(option => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));
}

function cleanCustom(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function buildLabels(values: string[], options: Choice[], customValue: string): string[] {
  const custom = cleanCustom(customValue);
  return custom ? [...labelsFor(values, options), custom] : labelsFor(values, options);
}

function buildStoredValues(values: string[], customValue: string): string[] {
  const custom = cleanCustom(customValue);
  return custom
    ? [...values.filter(value => value !== 'other'), `other:${custom}`]
    : values.filter(value => value !== 'other');
}

function includesAny(values: string[], candidates: string[]): boolean {
  return values.some(value => candidates.includes(value));
}

function getFocus(reasons: string[], situations: string[], success: string[], customAnswers: string[] = []): string[] {
  const focus: string[] = [];
  const add = (item: string) => {
    if (!focus.includes(item)) focus.push(item);
  };

  if (
    includesAny(reasons, ['fear_of_abandonment', 'relationship_problems']) ||
    includesAny(situations, ['arguments', 'feeling_ignored', 'rejection', 'breakups', 'dating'])
  ) {
    add('Relationship stability');
  }
  if (
    includesAny(reasons, ['emotional_overwhelm', 'mood_swings', 'anger', 'anxiety']) ||
    includesAny(success, ['better_emotional_control', 'feeling_calmer', 'fewer_emotional_crises'])
  ) {
    add('Emotional regulation');
  }
  if (
    includesAny(reasons, ['impulsive_behaviours']) ||
    includesAny(success, ['better_communication'])
  ) {
    add('Pausing before reacting');
  }
  if (
    includesAny(reasons, ['understand_myself', 'recently_diagnosed', 'self_esteem', 'depression']) ||
    includesAny(success, ['understanding_triggers', 'building_healthy_habits'])
  ) {
    add('Understanding triggers');
  }
  if (includesAny(situations, ['loneliness', 'family', 'work', 'stress', 'other'])) {
    add('Daily steadiness');
  }
  const customFocus = customAnswers.map(cleanCustom).find(Boolean);
  if (customFocus && focus.length < 3) {
    add(`Support with ${customFocus}`);
  }

  if (focus.length === 0) {
    add('Emotional regulation');
    add('Understanding triggers');
    add('Healthier relationships');
  }

  return focus.slice(0, 3);
}

function sentenceList(items: string[]): string {
  if (items.length === 0) return 'what feels hardest right now';
  if (items.length === 1) return items[0].toLowerCase();
  if (items.length === 2) return `${items[0].toLowerCase()} and ${items[1].toLowerCase()}`;
  return `${items[0].toLowerCase()}, ${items[1].toLowerCase()}, and ${items[2].toLowerCase()}`;
}

function buildProfile(
  reasons: string[],
  situations: string[],
  success: string[],
  customReason: string,
  customSituation: string,
  customSuccess: string,
  skipped: boolean,
): AssessmentOnboardingProfile {
  const customReasons = cleanCustom(customReason) ? [cleanCustom(customReason)] : [];
  const customSituations = cleanCustom(customSituation) ? [cleanCustom(customSituation)] : [];
  const customSuccessAnswers = cleanCustom(customSuccess) ? [cleanCustom(customSuccess)] : [];
  const focus = getFocus(reasons, situations, success, [...customReasons, ...customSituations, ...customSuccessAnswers]);
  const preferredTools = new Set<PreferredTool>(['ai_companion', 'understand_patterns', 'calm_emotional_spikes']);
  const primaryReasons = new Set<PrimaryReason>();
  const hardestMoments = new Set<HardestMoment>();
  const desiredOutcomes = new Set<DesiredOutcome>();

  if (reasons.includes('emotional_overwhelm')) primaryReasons.add('emotional_overwhelm');
  if (reasons.includes('fear_of_abandonment')) primaryReasons.add('fear_of_abandonment');
  if (reasons.includes('relationship_problems')) primaryReasons.add('relationship_conflict');
  if (reasons.includes('mood_swings')) primaryReasons.add('mood_swings');
  if (reasons.includes('impulsive_behaviours')) primaryReasons.add('impulsive_urges');
  if (reasons.includes('understand_myself')) primaryReasons.add('understanding_patterns');
  if (situations.includes('arguments')) hardestMoments.add('conflict');
  if (situations.includes('rejection')) hardestMoments.add('feeling_rejected');
  if (situations.includes('feeling_ignored')) hardestMoments.add('delayed_replies');
  if (success.includes('better_emotional_control')) desiredOutcomes.add('better_emotional_control');
  if (success.includes('better_communication')) desiredOutcomes.add('more_pause_before_reacting');
  if (success.includes('understanding_triggers')) desiredOutcomes.add('better_understanding_triggers');
  if (success.includes('healthier_relationships')) desiredOutcomes.add('fewer_relationship_spirals');
  if (focus.includes('Pausing before reacting')) preferredTools.add('pause_before_messaging');
  if (focus.includes('Relationship stability')) preferredTools.add('relationship_support');
  if (reasons.includes('recently_diagnosed')) preferredTools.add('dbt_coping_skills');
  if (situations.includes('loneliness')) preferredTools.add('feel_less_alone');

  return {
    ...DEFAULT_ONBOARDING_PROFILE,
    primaryReasons: Array.from(primaryReasons),
    hardestMoments: Array.from(hardestMoments),
    preferredTools: Array.from(preferredTools),
    dailyCheckInTracks: ['emotions', 'triggers', 'urges', 'relationships', 'notes'],
    desiredOutcomes: Array.from(desiredOutcomes),
    safetyAcknowledged: true,
    completedAt: Date.now(),
    skippedAt: skipped ? Date.now() : null,
    assessment: {
      reasons: buildStoredValues(reasons, customReason),
      situations: buildStoredValues(situations, customSituation),
      success: buildStoredValues(success, customSuccess),
      reasonLabels: buildLabels(reasons, REASONS, customReason),
      situationLabels: buildLabels(situations, SITUATIONS, customSituation),
      successLabels: buildLabels(success, SUCCESS, customSuccess),
      customAnswers: {
        reasons: customReasons,
        situations: customSituations,
        success: customSuccessAnswers,
      },
      focus,
      completedVersion: VERSION,
    },
    personalizedFocus: focus,
  };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { completeOnboarding } = useOnboarding();
  const { refreshProfile } = useUserProfile();
  const { trackEvent } = useAnalytics();
  const { maybeShowReviewPrompt } = useReviewPrompt();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [reasons, setReasons] = useState<string[]>([]);
  const [situations, setSituations] = useState<string[]>([]);
  const [success, setSuccess] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState<string>('');
  const [customSituation, setCustomSituation] = useState<string>('');
  const [customSuccess, setCustomSuccess] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [completionText, setCompletionText] = useState<string>('Saving your personalization');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

  const focus = useMemo(
    () => getFocus(reasons, situations, success, [customReason, customSituation, customSuccess]),
    [customReason, customSituation, customSuccess, reasons, situations, success],
  );
  const selectedReasonLabels = useMemo(() => buildLabels(reasons, REASONS, customReason), [customReason, reasons]);
  const selectedSituationLabels = useMemo(() => buildLabels(situations, SITUATIONS, customSituation), [customSituation, situations]);

  useEffect(() => {
    void trackEvent('onboarding_started', { version: VERSION });
  }, [trackEvent]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / TOTAL_STEPS,
      duration: 260,
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
      Animated.timing(fadeAnim, { toValue: 0, duration: 115, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: exitX, duration: 115, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(enterX);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 170, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 170, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const toggleChoice = useCallback((group: OptionGroup, value: string) => {
    const setter = group === 'reasons' ? setReasons : group === 'situations' ? setSituations : setSuccess;
    setter(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
  }, []);

  const saveAndRoute = useCallback(async (skipped: boolean) => {
    if (isCompleting) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsCompleting(true);
    setCompletionText('Preparing your membership options');
    const profile = buildProfile(reasons, situations, success, customReason, customSituation, customSuccess, skipped);
    try {
      await completeOnboarding(profile);
      await refreshProfile();
      trackEvent(skipped ? 'onboarding_skipped' : 'onboarding_completed', {
        version: VERSION,
        focus: profile.personalizedFocus.join(', '),
      });
      void maybeShowReviewPrompt('after_onboarding');

      router.replace('/upgrade' as never);
    } catch (error) {
      console.log('[Onboarding] completion failed:', error);
      Alert.alert('Could not finish setup', 'Please check your connection and try again.');
      setIsCompleting(false);
    }
  }, [completeOnboarding, customReason, customSituation, customSuccess, isCompleting, maybeShowReviewPrompt, reasons, refreshProfile, router, situations, success, trackEvent]);

  const canContinue = useMemo(() => {
    if (currentStep === 1) return reasons.length > 0 && (!reasons.includes('other') || reasons.length > 1 || cleanCustom(customReason).length > 0);
    if (currentStep === 2) return situations.length > 0 && (!situations.includes('other') || situations.length > 1 || cleanCustom(customSituation).length > 0);
    if (currentStep === 3) return success.length > 0 && (!success.includes('other') || success.length > 1 || cleanCustom(customSuccess).length > 0);
    return true;
  }, [currentStep, customReason, customSituation, customSuccess, reasons, situations, success]);

  const goBack = useCallback(() => {
    if (currentStep === 0 || isCompleting) return;
    animateStep('back', () => setCurrentStep(prev => prev - 1));
  }, [animateStep, currentStep, isCompleting]);

  const goNext = useCallback(() => {
    if (isCompleting || !canContinue) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('onboarding_step_completed', { step_index: currentStep, version: VERSION });
    if (currentStep === TOTAL_STEPS - 1) {
      void saveAndRoute(false);
      return;
    }
    animateStep('forward', () => setCurrentStep(prev => prev + 1));
  }, [animateStep, canContinue, currentStep, isCompleting, saveAndRoute, trackEvent]);

  if (isCompleting) {
    return (
      <View style={[styles.transitionContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <BrandLogo size={74} />
        <ActivityIndicator size="small" color={colors.brandTeal} style={styles.transitionSpinner} />
        <Text style={[styles.transitionTitle, { color: colors.text }]}>{completionText}</Text>
        <Text style={[styles.transitionText, { color: colors.textSecondary }]}>Your answers are being saved securely.</Text>
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
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 126 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          {currentStep === 0 ? (
            <WelcomeStep colors={colors} />
          ) : currentStep === 1 ? (
            <ChoiceStep
              eyebrow="Personalize"
              title="What brought you here today?"
              subtitle="Choose anything that fits. You can change direction later."
              options={REASONS}
              selected={reasons}
              onToggle={(value) => toggleChoice('reasons', value)}
              customValue={customReason}
              onCustomChange={setCustomReason}
              customPlaceholder="Tell us what brought you here"
              colors={colors}
            />
          ) : currentStep === 2 ? (
            <ChoiceStep
              eyebrow="Hard moments"
              title="What situations are hardest for you?"
              subtitle="This helps BPD Companion understand where support should show up first."
              options={SITUATIONS}
              selected={situations}
              onToggle={(value) => toggleChoice('situations', value)}
              customValue={customSituation}
              onCustomChange={setCustomSituation}
              customPlaceholder="Name the situation"
              colors={colors}
            />
          ) : currentStep === 3 ? (
            <ChoiceStep
              eyebrow="Your direction"
              title="What would success look like in 3 months?"
              subtitle="Pick the changes that would feel meaningful."
              options={SUCCESS}
              selected={success}
              onToggle={(value) => toggleChoice('success', value)}
              customValue={customSuccess}
              onCustomChange={setCustomSuccess}
              customPlaceholder="Describe your version of success"
              colors={colors}
            />
          ) : currentStep === 4 ? (
            <FocusStep focus={focus} colors={colors} />
          ) : currentStep === 5 ? (
            <HowItHelpsStep
              reasons={selectedReasonLabels}
              situations={selectedSituationLabels}
              focus={focus}
              colors={colors}
            />
          ) : (
            <MembershipIntroStep colors={colors} />
          )}
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
          style={[styles.nextButton, { backgroundColor: canContinue ? colors.primary : colors.border }]}
          onPress={goNext}
          activeOpacity={0.75}
          disabled={!canContinue}
          testID="onboarding-continue"
        >
          <Text style={styles.nextText}>
            {currentStep === TOTAL_STEPS - 1 ? 'Start 3-Day Free Trial' : currentStep === 0 ? 'Begin' : 'Continue'}
          </Text>
          <ChevronRight size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function WelcomeStep({ colors }: { colors: ReturnType<typeof useAppTheme>['colors'] }) {
  return (
    <View>
      <View style={[styles.logoCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
        <BrandLogo size={120} animated />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        BPD Companion was built for people living with Borderline Personality Disorder.
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        We’ll personalize your experience in less than 2 minutes.
      </Text>
    </View>
  );
}

function ChoiceStep({
  eyebrow,
  title,
  subtitle,
  options,
  selected,
  onToggle,
  customValue,
  onCustomChange,
  customPlaceholder,
  colors,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  options: Choice[];
  selected: string[];
  onToggle: (value: string) => void;
  customValue: string;
  onCustomChange: (value: string) => void;
  customPlaceholder: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const showCustom = selected.includes('other');
  return (
    <View>
      <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>{eyebrow}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      <View style={styles.choiceGrid}>
        {options.map(option => {
          const isSelected = selected.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.choiceChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.borderLight,
                },
              ]}
              onPress={() => onToggle(option.value)}
              activeOpacity={0.8}
              testID={`onboarding-choice-${option.value}`}
            >
              <Text style={[styles.choiceText, { color: isSelected ? Colors.white : colors.text }]}>{option.label}</Text>
              {isSelected ? <Check size={17} color={Colors.white} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
      {showCustom ? (
        <View style={[styles.customInputWrap, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <TextInput
            value={customValue}
            onChangeText={onCustomChange}
            placeholder={customPlaceholder}
            placeholderTextColor={colors.textMuted}
            style={[styles.customInput, { color: colors.text }]}
            multiline
            maxLength={90}
            autoCapitalize="sentences"
            testID="onboarding-custom-input"
          />
        </View>
      ) : null}
      <Text style={[styles.helperText, { color: colors.textMuted }]}>Select at least one.</Text>
    </View>
  );
}

function FocusStep({ focus, colors }: { focus: string[]; colors: ReturnType<typeof useAppTheme>['colors'] }) {
  return (
    <View>
      <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>Your focus</Text>
      <Text style={[styles.title, { color: colors.text }]}>Based on your answers, your personalized focus is:</Text>
      <View style={styles.focusStack}>
        {focus.map((item, index) => (
          <View key={item} style={[styles.focusCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.focusLabel, { color: colors.textMuted }]}>
              {index === 0 ? 'Primary Focus' : index === 1 ? 'Secondary Focus' : 'Third Focus'}
            </Text>
            <Text style={[styles.focusText, { color: colors.text }]}>{item}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.reassurance, { color: colors.textSecondary }]}>BPD Companion can help with this.</Text>
    </View>
  );
}

function HowItHelpsStep({
  reasons,
  situations,
  focus,
  colors,
}: {
  reasons: string[];
  situations: string[];
  focus: string[];
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const struggleText = sentenceList([...reasons, ...situations].slice(0, 3));
  const focusText = sentenceList(focus);
  const cards = [
    {
      icon: MessageCircle,
      title: 'AI Companion',
      text: `Talk through ${struggleText} before the moment turns into a crisis.`,
    },
    {
      icon: BarChart3,
      title: 'Daily check-ins',
      text: `Track what happens so patterns around ${focusText} become easier to see.`,
    },
    {
      icon: Shield,
      title: 'Pause tools',
      text: 'Use guided tools to slow down before texting, arguing, or reacting.',
    },
    {
      icon: Sparkles,
      title: 'Personalized insights',
      text: 'See plain-language reflections based on your entries, not generic advice.',
    },
    {
      icon: Users,
      title: 'Community',
      text: 'Feel less alone with peer support that is separate from crisis or medical care.',
    },
  ];

  return (
    <View>
      <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>How it helps</Text>
      <Text style={[styles.title, { color: colors.text }]}>Your support should fit what you’re actually facing.</Text>
      <View style={styles.helpStack}>
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <View key={card.title} style={[styles.helpCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <View style={[styles.helpIcon, { backgroundColor: colors.primaryLight }]}>
                <Icon size={19} color={colors.primary} />
              </View>
              <View style={styles.helpCopy}>
                <Text style={[styles.helpTitle, { color: colors.text }]}>{card.title}</Text>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>{card.text}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MembershipIntroStep({
  colors,
}: {
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View>
      <View style={[styles.membershipHero, { backgroundColor: colors.primaryLight, borderColor: colors.borderLight }]}>
        <HeartHandshake size={32} color={colors.primary} />
        <Text style={[styles.membershipTitle, { color: colors.text }]}>Imagine feeling...</Text>
        <Text style={[styles.membershipSubtitle, { color: colors.textSecondary }]}>
          Small daily support can change how you move through difficult moments.
        </Text>
      </View>
      <View style={styles.benefitStack}>
        {TRANSFORMATION_POINTS.map(point => (
          <View key={point} style={[styles.benefitRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Sparkles size={17} color={colors.brandTeal} />
            <Text style={[styles.benefitText, { color: colors.text }]}>{point}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.membershipIncludesTitle, { color: colors.text }]}>Your membership includes:</Text>
      <View style={styles.benefitStack}>
        {BENEFITS.map(benefit => (
          <View key={benefit} style={[styles.benefitRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Check size={17} color={colors.brandTeal} />
            <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.cancelText, { color: colors.textMuted }]}>
        Cancel anytime before your 3-day trial ends. You won’t be charged until your trial is over.
      </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  logoCard: {
    minHeight: 186,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
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
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    marginBottom: 20,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceChip: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  choiceText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  customInputWrap: {
    marginTop: 12,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 6,
  },
  customInput: {
    minHeight: 46,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    paddingVertical: Platform.OS === 'ios' ? 0 : 8,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  focusStack: {
    gap: 12,
    marginTop: 8,
  },
  focusCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  focusLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  focusText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  reassurance: {
    marginTop: 18,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '900',
  },
  helpStack: {
    gap: 10,
  },
  helpCard: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpCopy: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  membershipHero: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
    marginBottom: 16,
    gap: 8,
  },
  membershipTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  membershipSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  benefitStack: {
    gap: 9,
  },
  membershipIncludesTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 10,
  },
  benefitRow: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  cancelText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 14,
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
    maxWidth: 260,
    minHeight: 56,
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
