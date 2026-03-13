import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  ChevronRight,
  Wind,
  Timer,
  Anchor,
  Sparkles,
  MessageSquare,
  BookOpen,
  Shield,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRelationshipCopilot } from '@/hooks/useRelationshipCopilot';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import PostActionReflection from '@/components/PostActionReflection';
import {
  CopilotSituation,
  CopilotEmotion,
  CopilotUrge,
  CopilotNeed,
  CopilotSessionIntake,
  CopilotSessionResult,
  SITUATION_OPTIONS,
  EMOTION_OPTIONS,
  URGE_OPTIONS,
  NEED_OPTIONS,
} from '@/types/relationshipCopilot';
import { RELATIONSHIP_TYPE_META } from '@/types/relationship';
import { Users } from 'lucide-react-native';

type Step = 'profile' | 'situation' | 'emotions' | 'urge' | 'intensity' | 'need' | 'result';
const STEPS: Step[] = ['profile', 'situation', 'emotions', 'urge', 'intensity', 'need', 'result'];

const STEP_TITLES: Record<Step, string> = {
  profile: 'Who is this about?',
  situation: 'What happened?',
  emotions: 'What are you feeling?',
  urge: 'What urge is strongest?',
  intensity: 'How intense is this?',
  need: 'What do you need most?',
  result: '',
};

const STEP_SUBTITLES: Record<Step, string> = {
  profile: 'Optional — helps personalize support.',
  situation: "Let's slow this down together.",
  emotions: 'You can pick more than one.',
  urge: 'No judgment — just awareness.',
  intensity: 'On a scale of 1 to 10.',
  need: 'What would help right now?',
  result: '',
};

const ICON_MAP: Record<string, typeof Wind> = {
  Wind,
  Timer,
  Anchor,
  Sparkles,
  MessageSquare,
  BookOpen,
  Shield,
};

export default function RelationshipCopilotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startSession, profiles } = useRelationshipCopilot();

  const { trackEvent, trackFlowStart, trackFlowComplete } = useAnalytics();

  useEffect(() => {
    trackFlowStart('relationship_copilot');
    trackEvent('relationship_copilot_opened');
  }, [trackFlowStart, trackEvent]);

  const [step, setStep] = useState<Step>('profile');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [situation, setSituation] = useState<CopilotSituation | null>(null);
  const [emotions, setEmotions] = useState<CopilotEmotion[]>([]);
  const [urge, setUrge] = useState<CopilotUrge | null>(null);
  const [intensity, setIntensity] = useState<number>(5);
  const [need, setNeed] = useState<CopilotNeed | null>(null);
  const [result, setResult] = useState<CopilotSessionResult | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const resultFade = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const stepIndex = STEPS.indexOf(step);
  const progress = useMemo(() => (stepIndex + 1) / STEPS.length, [stepIndex]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const animateTransition = useCallback((nextStep: Step) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleProfileSelect = useCallback((profileId: string | null) => {
    handleHaptic();
    setSelectedProfileId(profileId);
    animateTransition('situation');
  }, [handleHaptic, animateTransition]);

  const handleSkipProfile = useCallback(() => {
    handleHaptic();
    setSelectedProfileId(null);
    animateTransition('situation');
  }, [handleHaptic, animateTransition]);

  const handleSituation = useCallback((s: CopilotSituation) => {
    handleHaptic();
    setSituation(s);
    animateTransition('emotions');
  }, [handleHaptic, animateTransition]);

  const handleEmotion = useCallback((e: CopilotEmotion) => {
    handleHaptic();
    setEmotions(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e].slice(0, 4),
    );
  }, [handleHaptic]);

  const handleEmotionContinue = useCallback(() => {
    if (emotions.length === 0) return;
    handleHaptic();
    animateTransition('urge');
  }, [emotions, handleHaptic, animateTransition]);

  const handleUrge = useCallback((u: CopilotUrge) => {
    handleHaptic();
    setUrge(u);
    animateTransition('intensity');
  }, [handleHaptic, animateTransition]);

  const handleIntensityContinue = useCallback(() => {
    handleHaptic();
    animateTransition('need');
  }, [handleHaptic, animateTransition]);

  const handleNeed = useCallback(async (n: CopilotNeed) => {
    handleHaptic();
    setNeed(n);

    if (!situation || emotions.length === 0 || !urge) return;

    const intake: CopilotSessionIntake = {
      situation,
      emotions,
      strongestUrge: urge,
      intensity,
      deepestNeed: n,
      relationshipProfileId: selectedProfileId ?? undefined,
    };

    try {
      const session = await startSession(intake);
      setResult(session.result);
      trackFlowComplete('relationship_copilot', {
        situation: situation ?? '',
        intensity,
        urge: urge ?? '',
        need: n,
      });
      trackEvent('relationship_copilot_completed', { intensity });
      animateTransition('result');
      setTimeout(() => {
        Animated.timing(resultFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      }, 100);
    } catch (err) {
      console.log('[CopilotScreen] Error starting session:', err);
    }
  }, [situation, emotions, urge, intensity, selectedProfileId, handleHaptic, startSession, animateTransition, resultFade, trackFlowComplete, trackEvent]);

  const handleNextStep = useCallback((route?: string) => {
    handleHaptic();
    if (route) {
      router.push(route as never);
    }
  }, [handleHaptic, router]);

  const handleBack = useCallback(() => {
    handleHaptic();
    const idx = STEPS.indexOf(step);
    if (idx <= 0) {
      router.back();
    } else {
      animateTransition(STEPS[idx - 1]);
    }
  }, [step, handleHaptic, router, animateTransition]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const renderProfilePicker = () => (
    <>
      <View style={styles.optionsGrid}>
        {profiles.map(p => {
          const meta = RELATIONSHIP_TYPE_META[p.relationshipType];
          const selected = selectedProfileId === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.optionCard, selected && styles.optionCardSelected]}
              onPress={() => handleProfileSelect(p.id)}
              activeOpacity={0.7}
              testID={`profile-${p.id}`}
            >
              <Text style={styles.optionEmoji}>{meta.emoji}</Text>
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkipProfile}
        activeOpacity={0.7}
        testID="skip-profile"
      >
        <Users size={16} color={Colors.textSecondary} />
        <Text style={styles.skipButtonText}>
          {profiles.length === 0 ? 'Continue without a profile' : 'Skip — not about a specific person'}
        </Text>
        <ChevronRight size={14} color={Colors.textMuted} />
      </TouchableOpacity>
    </>
  );

  const renderSituation = () => (
    <View style={styles.optionsGrid}>
      {SITUATION_OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.optionCard, situation === opt.id && styles.optionCardSelected]}
          onPress={() => handleSituation(opt.id)}
          activeOpacity={0.7}
          testID={`situation-${opt.id}`}
        >
          <Text style={styles.optionEmoji}>{opt.emoji}</Text>
          <Text style={[styles.optionLabel, situation === opt.id && styles.optionLabelSelected]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmotions = () => (
    <>
      <View style={styles.optionsGrid}>
        {EMOTION_OPTIONS.map(opt => {
          const selected = emotions.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.optionCard, selected && styles.optionCardSelected]}
              onPress={() => handleEmotion(opt.id)}
              activeOpacity={0.7}
              testID={`emotion-${opt.id}`}
            >
              <Text style={styles.optionEmoji}>{opt.emoji}</Text>
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {opt.label}
              </Text>
              {selected && (
                <View style={styles.checkBadge}>
                  <Check size={10} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {emotions.length > 0 && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleEmotionContinue}
          activeOpacity={0.8}
          testID="emotions-continue"
        >
          <Text style={styles.continueText}>Continue</Text>
          <ChevronRight size={18} color={Colors.white} />
        </TouchableOpacity>
      )}
    </>
  );

  const renderUrge = () => (
    <View style={styles.optionsGrid}>
      {URGE_OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.optionCard, urge === opt.id && styles.optionCardSelected]}
          onPress={() => handleUrge(opt.id)}
          activeOpacity={0.7}
          testID={`urge-${opt.id}`}
        >
          <Text style={styles.optionEmoji}>{opt.emoji}</Text>
          <Text style={[styles.optionLabel, urge === opt.id && styles.optionLabelSelected]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderIntensity = () => (
    <View style={styles.intensityContainer}>
      <View style={styles.intensityDisplay}>
        <Text style={styles.intensityNumber}>{intensity}</Text>
        <Text style={styles.intensityMax}>/10</Text>
      </View>
      <Text style={styles.intensityHint}>
        {intensity <= 3 ? 'Manageable' : intensity <= 5 ? 'Uncomfortable' : intensity <= 7 ? 'Distressing' : 'Overwhelming'}
      </Text>
      <View style={styles.intensityRow}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <TouchableOpacity
            key={n}
            style={[
              styles.intensityDot,
              n <= intensity && styles.intensityDotActive,
              n === intensity && styles.intensityDotCurrent,
            ]}
            onPress={() => {
              handleHaptic();
              setIntensity(n);
            }}
            activeOpacity={0.7}
            testID={`intensity-${n}`}
          >
            <Text style={[styles.intensityDotText, n <= intensity && styles.intensityDotTextActive]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleIntensityContinue}
        activeOpacity={0.8}
        testID="intensity-continue"
      >
        <Text style={styles.continueText}>Continue</Text>
        <ChevronRight size={18} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderNeed = () => (
    <View style={styles.optionsGrid}>
      {NEED_OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.optionCard, need === opt.id && styles.optionCardSelected]}
          onPress={() => void handleNeed(opt.id)}
          activeOpacity={0.7}
          testID={`need-${opt.id}`}
        >
          <Text style={styles.optionEmoji}>{opt.emoji}</Text>
          <Text style={[styles.optionLabel, need === opt.id && styles.optionLabelSelected]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderResult = () => {
    if (!result) return null;

    return (
      <Animated.View style={[styles.resultContainer, { opacity: resultFade }]}>
        <View style={styles.resultHeaderCard}>
          <View style={styles.resultHeaderIcon}>
            <Heart size={24} color="#E84393" fill="#E84393" />
          </View>
          <Text style={styles.resultHeaderTitle}>Let's slow this down</Text>
          <Text style={styles.resultAffirmation}>{result.affirmation}</Text>
        </View>

        <View style={styles.resultSection}>
          <Text style={styles.resultSectionTitle}>What may be happening</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultCardText}>{result.interpretation.whatMayBeHappening}</Text>
          </View>
        </View>

        {result.interpretation.whatUsuallyFollows && (
          <View style={styles.resultSection}>
            <Text style={styles.resultSectionTitle}>What often follows</Text>
            <View style={styles.resultCard}>
              <Text style={styles.resultCardText}>{result.interpretation.whatUsuallyFollows}</Text>
            </View>
          </View>
        )}

        <View style={styles.resultSection}>
          <Text style={styles.resultSectionTitle}>Calmer next steps</Text>
          {result.nextSteps.map(stepItem => {
            const IconComp = ICON_MAP[stepItem.icon] ?? Heart;
            return (
              <TouchableOpacity
                key={stepItem.id}
                style={styles.nextStepCard}
                onPress={() => handleNextStep(stepItem.route)}
                activeOpacity={0.7}
                testID={`next-step-${stepItem.id}`}
              >
                <View style={styles.nextStepIcon}>
                  <IconComp size={18} color={Colors.primary} />
                </View>
                <View style={styles.nextStepContent}>
                  <Text style={styles.nextStepLabel}>{stepItem.label}</Text>
                  <Text style={styles.nextStepDesc}>{stepItem.description}</Text>
                </View>
                {stepItem.route && <ChevronRight size={14} color={Colors.textMuted} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.resultSection}>
          <Text style={styles.resultSectionTitle}>If you choose to respond</Text>
          <View style={styles.secureMessageCard}>
            <View style={styles.secureMessageIcon}>
              <Shield size={18} color="#E84393" />
            </View>
            <Text style={styles.secureMessageText}>{result.secureMessagePrompt}</Text>
          </View>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => handleNextStep('/(tabs)/messages')}
            activeOpacity={0.8}
            testID="secure-message-btn"
          >
            <MessageSquare size={16} color={Colors.white} />
            <Text style={styles.messageButtonText}>Open Message Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.simulatorLink}
            onPress={() => handleNextStep('/scenario-simulator')}
            activeOpacity={0.7}
            testID="scenario-simulator-link"
          >
            <Sparkles size={15} color={Colors.primary} />
            <Text style={styles.simulatorLinkText}>Practice responses first</Text>
            <ChevronRight size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <PostActionReflection
          onComplete={() => router.back()}
          showReflectionLinks={true}
        />

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
          testID="copilot-done"
        >
          <Text style={styles.doneButtonText}>I'm okay for now</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          testID="copilot-back"
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        {step !== 'result' && (
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>Relationship Copilot</Text>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </View>
        )}
        {step === 'result' && (
          <Text style={styles.headerLabel}>Relationship Copilot</Text>
        )}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step !== 'result' && (
          <Animated.View style={[styles.stepHeader, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
            <Text style={styles.stepSubtitle}>{STEP_SUBTITLES[step]}</Text>
          </Animated.View>
        )}

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {step === 'profile' && renderProfilePicker()}
          {step === 'situation' && renderSituation()}
          {step === 'emotions' && renderEmotions()}
          {step === 'urge' && renderUrge()}
          {step === 'intensity' && renderIntensity()}
          {step === 'need' && renderNeed()}
          {step === 'result' && renderResult()}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E84393',
    borderRadius: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  stepHeader: {
    marginTop: 12,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 21,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    width: '47%' as unknown as number,
    flexGrow: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#E84393',
    backgroundColor: '#FFF5F9',
  },
  optionEmoji: {
    fontSize: 22,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  optionLabelSelected: {
    color: '#E84393',
    fontWeight: '600' as const,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E84393',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E84393',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    gap: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  intensityContainer: {
    alignItems: 'center',
  },
  intensityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  intensityNumber: {
    fontSize: 64,
    fontWeight: '700' as const,
    color: '#E84393',
    letterSpacing: -2,
  },
  intensityMax: {
    fontSize: 24,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  intensityHint: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 28,
    fontWeight: '500' as const,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    width: '100%',
    justifyContent: 'center',
  },
  intensityDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  intensityDotActive: {
    backgroundColor: '#FFF5F9',
    borderColor: '#E8439340',
  },
  intensityDotCurrent: {
    backgroundColor: '#E84393',
    borderColor: '#E84393',
  },
  intensityDotText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  intensityDotTextActive: {
    color: '#E84393',
  },
  resultContainer: {
    paddingTop: 8,
  },
  resultHeaderCard: {
    backgroundColor: '#FFF5F9',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F8D7E8',
  },
  resultHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFEDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultHeaderTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  resultAffirmation: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  resultSection: {
    marginBottom: 24,
  },
  resultSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  resultCardText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 23,
  },
  nextStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 14,
  },
  nextStepIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStepContent: {
    flex: 1,
  },
  nextStepLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  nextStepDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  secureMessageCard: {
    backgroundColor: '#FFF5F9',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1,
    borderColor: '#F8D7E8',
  },
  secureMessageIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFEDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  secureMessageText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  doneButton: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  simulatorLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 6,
  },
  simulatorLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  skipButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  skipButtonText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
});
