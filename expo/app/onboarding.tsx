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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import BrandLogo from '@/components/branding/BrandLogo';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { trackSingularEvent } from '@/lib/singular';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useReviewPrompt } from '@/providers/ReviewPromptProvider';
import { createAccessFlowTimer } from '@/services/performance/accessFlowTiming';
import { useTranslation } from 'react-i18next';
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

function focusTranslationKey(item: string): string | null {
  if (item === 'Relationship stability') return 'focus.relationship';
  if (item === 'Emotional regulation') return 'focus.regulation';
  if (item === 'Pausing before reacting') return 'focus.pause';
  if (item === 'Understanding triggers') return 'focus.triggers';
  if (item === 'Daily steadiness') return 'focus.steadiness';
  return null;
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
  const { t } = useTranslation(['onboarding', 'common']);
  const { completeOnboarding } = useOnboarding();
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
  const [completionText, setCompletionText] = useState<string>(() => t('onboarding:completion.saving'));
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

  const focus = useMemo(
    () => getFocus(reasons, situations, success, [customReason, customSituation, customSuccess]),
    [customReason, customSituation, customSuccess, reasons, situations, success],
  );
  const localizedReasonLabels = useMemo(
    () => [
      ...reasons
        .filter(value => value !== 'other')
        .map(value => t(`onboarding:options.${value}`, { defaultValue: REASONS.find(option => option.value === value)?.label ?? value })),
      ...(cleanCustom(customReason) ? [cleanCustom(customReason)] : []),
    ],
    [customReason, reasons, t],
  );
  const localizedSituationLabels = useMemo(
    () => [
      ...situations
        .filter(value => value !== 'other')
        .map(value => t(`onboarding:options.${value}`, { defaultValue: SITUATIONS.find(option => option.value === value)?.label ?? value })),
      ...(cleanCustom(customSituation) ? [cleanCustom(customSituation)] : []),
    ],
    [customSituation, situations, t],
  );

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
    setCompletionText(t('onboarding:completion.preparing'));
    const timer = createAccessFlowTimer('onboarding');
    const profile = buildProfile(reasons, situations, success, customReason, customSituation, customSuccess, skipped);
    try {
      await completeOnboarding(profile);
      trackEvent(skipped ? 'onboarding_skipped' : 'onboarding_completed', {
        version: VERSION,
        focus: profile.personalizedFocus.join(', '),
      });
      if (!skipped) {
        void trackSingularEvent('onboarding_complete');
      }
      void maybeShowReviewPrompt('after_onboarding');

      timer.mark('route_to_upgrade');
      router.replace('/upgrade' as never);
    } catch (error) {
      console.log('[Onboarding] completion failed:', error);
      Alert.alert(t('onboarding:completion.errorTitle'), t('onboarding:completion.errorBody'));
      setIsCompleting(false);
    }
  }, [completeOnboarding, customReason, customSituation, customSuccess, isCompleting, maybeShowReviewPrompt, reasons, router, situations, success, t, trackEvent]);

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
        <Text style={[styles.transitionText, { color: colors.textSecondary }]}>{t('onboarding:completion.secure')}</Text>
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
          <Text style={[styles.progressText, { color: colors.primary }]}>
            {t('onboarding:progress', { current: currentStep + 1, total: TOTAL_STEPS })}
          </Text>
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
              eyebrow={t('onboarding:steps.personalize')}
              title={t('onboarding:questions.reasonsTitle')}
              subtitle={t('onboarding:questions.reasonsSubtitle')}
              options={REASONS}
              selected={reasons}
              onToggle={(value) => toggleChoice('reasons', value)}
              customValue={customReason}
              onCustomChange={setCustomReason}
              customPlaceholder={t('onboarding:questions.reasonsOther')}
              colors={colors}
            />
          ) : currentStep === 2 ? (
            <ChoiceStep
              eyebrow={t('onboarding:steps.hardMoments')}
              title={t('onboarding:questions.situationsTitle')}
              subtitle={t('onboarding:questions.situationsSubtitle')}
              options={SITUATIONS}
              selected={situations}
              onToggle={(value) => toggleChoice('situations', value)}
              customValue={customSituation}
              onCustomChange={setCustomSituation}
              customPlaceholder={t('onboarding:questions.situationsOther')}
              colors={colors}
            />
          ) : currentStep === 3 ? (
            <ChoiceStep
              eyebrow={t('onboarding:steps.goals')}
              title={t('onboarding:questions.successTitle')}
              subtitle={t('onboarding:questions.successSubtitle')}
              options={SUCCESS}
              selected={success}
              onToggle={(value) => toggleChoice('success', value)}
              customValue={customSuccess}
              onCustomChange={setCustomSuccess}
              customPlaceholder={t('onboarding:questions.successOther')}
              colors={colors}
            />
          ) : currentStep === 4 ? (
            <FocusStep focus={focus} colors={colors} />
          ) : currentStep === 5 ? (
            <HowItHelpsStep
              reasons={localizedReasonLabels}
              situations={localizedSituationLabels}
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
            <Text style={[styles.backText, { color: colors.primary }]}>{t('common:back')}</Text>
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
            {currentStep === TOTAL_STEPS - 1 ? t('onboarding:membership.primary') : currentStep === 0 ? t('common:continue') : t('common:continue')}
          </Text>
          <ChevronRight size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function WelcomeStep({ colors }: { colors: ReturnType<typeof useAppTheme>['colors'] }) {
  const { t } = useTranslation('onboarding');
  return (
    <View>
      <View style={[styles.logoCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
        <BrandLogo size={120} animated />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('welcome.headline')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('welcome.subtext')}
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
  const { t } = useTranslation('onboarding');
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
              <Text style={[styles.choiceText, { color: isSelected ? Colors.white : colors.text }]}>
                {t(`options.${option.value}`, { defaultValue: option.label })}
              </Text>
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
      <Text style={[styles.helperText, { color: colors.textMuted }]}>{t('questions.selectAtLeastOne')}</Text>
    </View>
  );
}

function FocusStep({ focus, colors }: { focus: string[]; colors: ReturnType<typeof useAppTheme>['colors'] }) {
  const { t } = useTranslation('onboarding');
  return (
    <View>
      <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>{t('steps.focus')}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{t('focus.intro')}</Text>
      <View style={styles.focusStack}>
        {focus.map((item, index) => (
          <View key={item} style={[styles.focusCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.focusLabel, { color: colors.textMuted }]}>
              {index === 0 ? t('focus.primary') : index === 1 ? t('focus.secondary') : t('focus.third')}
            </Text>
            <Text style={[styles.focusText, { color: colors.text }]}>
              {focusTranslationKey(item)
                ? t(focusTranslationKey(item) as string)
                : item.startsWith('Support with ')
                  ? t('focus.supportWith', { answer: item.replace('Support with ', '') })
                  : item}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.reassurance, { color: colors.textSecondary }]}>{t('focus.helps')}</Text>
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
  const { t } = useTranslation('onboarding');
  const struggleText = sentenceList([...reasons, ...situations].slice(0, 3));
  const focusText = sentenceList(focus);
  const cards = [
    {
      icon: MessageCircle,
      title: 'AI Companion',
      text: t('helps.companion', { items: struggleText }),
    },
    {
      icon: BarChart3,
      title: t('helps.checkinsTitle'),
      text: t('helps.checkins', { items: focusText }),
    },
    {
      icon: Shield,
      title: t('helps.toolsTitle'),
      text: t('helps.tools'),
    },
    {
      icon: Sparkles,
      title: t('helps.insightsTitle'),
      text: t('helps.insights'),
    },
    {
      icon: Users,
      title: 'Community',
      text: t('helps.community'),
    },
  ];

  return (
    <View>
      <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>{t('steps.howHelps')}</Text>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('helps.headline', { items: struggleText })}
      </Text>
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
  const { t } = useTranslation('onboarding');
  const transformationPoints = t('membership.transformations', { returnObjects: true }) as string[];
  const benefits = t('membership.benefits', { returnObjects: true }) as string[];
  return (
    <View>
      <View style={[styles.membershipHero, { backgroundColor: colors.primaryLight, borderColor: colors.borderLight }]}>
        <HeartHandshake size={32} color={colors.primary} />
        <Text style={[styles.membershipTitle, { color: colors.text }]}>{t('membership.transformTitle')}</Text>
        <Text style={[styles.membershipSubtitle, { color: colors.textSecondary }]}>
          {t('membership.subheadline')}
        </Text>
      </View>
      <View style={styles.benefitStack}>
        {transformationPoints.map(point => (
          <View key={point} style={[styles.benefitRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Sparkles size={17} color={colors.brandTeal} />
            <Text style={[styles.benefitText, { color: colors.text }]}>{point}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.membershipIncludesTitle, { color: colors.text }]}>{t('membership.includesTitle')}</Text>
      <View style={styles.benefitStack}>
        {benefits.map(benefit => (
          <View key={benefit} style={[styles.benefitRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Check size={17} color={colors.brandTeal} />
            <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.cancelText, { color: colors.textMuted }]}>
        {t('membership.trialNote')}
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
