import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Wind,
  Eye,
  Heart,
  Flame,
  ArrowRight,
  BookOpen,
  MessageCircle,
  Bot,
  Activity,
  Check,
  ChevronLeft,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { EMOTIONS, URGES } from '@/constants/data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = ['breathing', 'grounding', 'emotions', 'urges', 'next'] as const;
type StepKey = (typeof STEPS)[number];

const STEP_META: Record<StepKey, { title: string; subtitle: string; icon: React.ComponentType<{ size: number; color: string }> }> = {
  breathing: {
    title: 'Breathe',
    subtitle: 'Slow your nervous system down',
    icon: Wind,
  },
  grounding: {
    title: 'Ground',
    subtitle: 'Anchor yourself in the present',
    icon: Eye,
  },
  emotions: {
    title: 'Name it',
    subtitle: 'What are you feeling right now?',
    icon: Heart,
  },
  urges: {
    title: 'Notice urges',
    subtitle: 'What is your mind pulling you toward?',
    icon: Flame,
  },
  next: {
    title: 'Next step',
    subtitle: 'Choose what feels right',
    icon: ArrowRight,
  },
};

const GROUNDING_PROMPTS = [
  { count: 5, sense: 'SEE', color: '#14B8A6' },
  { count: 4, sense: 'TOUCH', color: '#14B8A6' },
  { count: 3, sense: 'HEAR', color: '#67E8F9' },
  { count: 2, sense: 'SMELL', color: '#3B82F6' },
  { count: 1, sense: 'TASTE', color: '#3B82F6' },
];

const BREATHING_CYCLE = { inhale: 4, hold: 4, exhale: 6 };

const EMOTION_SUBSET = EMOTIONS.slice(0, 8);
const URGE_SUBSET = URGES.slice(0, 8);

export default function GuidedRegulationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [stepIndex, setStepIndex] = useState<number>(0);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedUrges, setSelectedUrges] = useState<string[]>([]);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState<number>(0);
  const [groundingStep, setGroundingStep] = useState<number>(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepFade = useRef(new Animated.Value(1)).current;
  const breatheScale = useRef(new Animated.Value(0.6)).current;
  const breatheOpacity = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const groundingPulse = useRef(new Animated.Value(1)).current;

  const breathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breathCycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = STEPS[stepIndex];
  const meta = STEP_META[currentStep];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: stepIndex / (STEPS.length - 1),
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [stepIndex, progressAnim]);

  const runBreathCycle = useCallback(() => {
    setBreathPhase('inhale');
    Animated.timing(breatheScale, {
      toValue: 1,
      duration: BREATHING_CYCLE.inhale * 1000,
      useNativeDriver: true,
    }).start();
    Animated.timing(breatheOpacity, {
      toValue: 0.9,
      duration: BREATHING_CYCLE.inhale * 1000,
      useNativeDriver: true,
    }).start();

    breathTimerRef.current = setTimeout(() => {
      setBreathPhase('hold');

      breathTimerRef.current = setTimeout(() => {
        setBreathPhase('exhale');
        Animated.timing(breatheScale, {
          toValue: 0.6,
          duration: BREATHING_CYCLE.exhale * 1000,
          useNativeDriver: true,
        }).start();
        Animated.timing(breatheOpacity, {
          toValue: 0.4,
          duration: BREATHING_CYCLE.exhale * 1000,
          useNativeDriver: true,
        }).start();

        breathTimerRef.current = setTimeout(() => {
          setBreathCount(prev => prev + 1);
        }, BREATHING_CYCLE.exhale * 1000);
      }, BREATHING_CYCLE.hold * 1000);
    }, BREATHING_CYCLE.inhale * 1000);
  }, [breatheScale, breatheOpacity]);

  useEffect(() => {
    if (currentStep === 'breathing') {
      runBreathCycle();
    }
    const timerRef = breathTimerRef;
    const cycleRef = breathCycleRef;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (cycleRef.current) clearTimeout(cycleRef.current);
    };
  }, [currentStep, runBreathCycle]);

  useEffect(() => {
    if (currentStep === 'breathing' && breathCount > 0 && breathCount < 5) {
      runBreathCycle();
    }
  }, [breathCount, currentStep, runBreathCycle]);

  useEffect(() => {
    if (currentStep === 'grounding') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(groundingPulse, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(groundingPulse, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [currentStep, groundingPulse]);

  const haptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const hapticMedium = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const animateStepTransition = useCallback((onMid: () => void) => {
    Animated.timing(stepFade, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onMid();
      Animated.timing(stepFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [stepFade]);

  const goNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      hapticMedium();
      animateStepTransition(() => {
        setStepIndex(prev => prev + 1);
      });
    }
  }, [stepIndex, hapticMedium, animateStepTransition]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      haptic();
      animateStepTransition(() => {
        setStepIndex(prev => prev - 1);
      });
    }
  }, [stepIndex, haptic, animateStepTransition]);

  const handleClose = useCallback(() => {
    haptic();
    router.back();
  }, [haptic, router]);

  const toggleEmotion = useCallback((id: string) => {
    haptic();
    setSelectedEmotions(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  }, [haptic]);

  const toggleUrge = useCallback((id: string) => {
    haptic();
    setSelectedUrges(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  }, [haptic]);

  const advanceGrounding = useCallback(() => {
    haptic();
    if (groundingStep < GROUNDING_PROMPTS.length - 1) {
      setGroundingStep(prev => prev + 1);
    } else {
      goNext();
    }
  }, [haptic, groundingStep, goNext]);

  const handleAction = useCallback((action: string) => {
    hapticMedium();
    router.back();
    setTimeout(() => {
      switch (action) {
        case 'journal':
          router.push('/(tabs)/journal');
          break;
        case 'companion':
          router.push('/(tabs)/companion');
          break;
        case 'exercise':
          router.push('/exercise?id=c1');
          break;
        case 'message-pause':
          router.push('/(tabs)/messages');
          break;
      }
    }, 300);
  }, [hapticMedium, router]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const breathLabel =
    breathPhase === 'inhale' ? 'Breathe in...' :
    breathPhase === 'hold' ? 'Hold...' : 'Breathe out...';

  const breathTimer =
    breathPhase === 'inhale' ? BREATHING_CYCLE.inhale :
    breathPhase === 'hold' ? BREATHING_CYCLE.hold : BREATHING_CYCLE.exhale;

  const canProceedBreathing = breathCount >= 3;
  const canProceedGrounding = groundingStep >= GROUNDING_PROMPTS.length - 1;

  const renderBreathing = () => (
    <View style={styles.stepContent}>
      <View style={styles.breatheArea}>
        <Animated.View
          style={[
            styles.breatheOuter,
            {
              transform: [{ scale: breatheScale }],
              opacity: breatheOpacity,
            },
          ]}
        />
        <View style={styles.breatheCenter}>
          <Text style={styles.breathePhaseText}>{breathLabel}</Text>
          <Text style={styles.breatheTimerText}>{breathTimer}s</Text>
        </View>
      </View>
      <Text style={styles.breatheCountText}>
        {breathCount < 3
          ? `Breath ${breathCount + 1} of 3`
          : 'Great. You can continue or keep breathing.'}
      </Text>
      {canProceedBreathing && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={goNext}
          activeOpacity={0.8}
          testID="breathing-continue"
        >
          <Text style={styles.continueText}>I'm ready to continue</Text>
          <ArrowRight size={18} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderGrounding = () => {
    const prompt = GROUNDING_PROMPTS[groundingStep];
    return (
      <View style={styles.stepContent}>
        <Animated.View
          style={[styles.groundingCard, { transform: [{ scale: groundingPulse }] }]}
        >
          <Text style={[styles.groundingCount, { color: prompt.color }]}>
            {prompt.count}
          </Text>
          <Text style={styles.groundingSense}>
            things you can {prompt.sense}
          </Text>
        </Animated.View>
        <Text style={styles.groundingHint}>
          Take your time. Notice each one slowly.
        </Text>
        <View style={styles.groundingDots}>
          {GROUNDING_PROMPTS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.groundingDot,
                i <= groundingStep && styles.groundingDotActive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: prompt.color }]}
          onPress={advanceGrounding}
          activeOpacity={0.8}
          testID="grounding-next"
        >
          <Text style={styles.continueText}>
            {canProceedGrounding ? 'Continue' : 'Next sense'}
          </Text>
          <ArrowRight size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmotions = () => (
    <View style={styles.stepContent}>
      <View style={styles.selectionGrid}>
        {EMOTION_SUBSET.map(emotion => {
          const selected = selectedEmotions.includes(emotion.id);
          return (
            <TouchableOpacity
              key={emotion.id}
              style={[styles.selectionChip, selected && styles.selectionChipActive]}
              onPress={() => toggleEmotion(emotion.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{emotion.emoji}</Text>
              <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>
                {emotion.label}
              </Text>
              {selected && (
                <View style={styles.chipCheck}>
                  <Check size={12} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.selectionHint}>
        {selectedEmotions.length === 0
          ? 'Select what fits. No pressure.'
          : `${selectedEmotions.length} selected — naming helps regulate.`}
      </Text>
      <TouchableOpacity
        style={styles.continueButton}
        onPress={goNext}
        activeOpacity={0.8}
        testID="emotions-continue"
      >
        <Text style={styles.continueText}>
          {selectedEmotions.length === 0 ? 'Skip' : 'Continue'}
        </Text>
        <ArrowRight size={18} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderUrges = () => (
    <View style={styles.stepContent}>
      <View style={styles.selectionGrid}>
        {URGE_SUBSET.map(urge => {
          const selected = selectedUrges.includes(urge.id);
          const riskColor =
            urge.risk === 'high' ? Colors.danger :
            urge.risk === 'medium' ? Colors.accent : Colors.primary;
          return (
            <TouchableOpacity
              key={urge.id}
              style={[
                styles.selectionChip,
                selected && { ...styles.selectionChipActive, borderColor: riskColor },
              ]}
              onPress={() => toggleUrge(urge.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
              <Text style={[styles.chipLabel, selected && { color: riskColor, fontWeight: '600' as const }]}>
                {urge.label}
              </Text>
              {selected && (
                <View style={[styles.chipCheck, { backgroundColor: riskColor }]}>
                  <Check size={12} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.selectionHint}>
        Urges are normal. Noticing them gives you a choice.
      </Text>
      <TouchableOpacity
        style={styles.continueButton}
        onPress={goNext}
        activeOpacity={0.8}
        testID="urges-continue"
      >
        <Text style={styles.continueText}>
          {selectedUrges.length === 0 ? 'Skip' : 'Continue'}
        </Text>
        <ArrowRight size={18} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderNextActions = () => {
    const actions = [
      {
        id: 'message-pause',
        icon: MessageCircle,
        label: 'Wait before messaging',
        desc: 'Give yourself space first',
        color: '#14B8A6',
        bg: '#D9E2EC',
      },
      {
        id: 'journal',
        icon: BookOpen,
        label: 'Write in journal',
        desc: 'Put thoughts into words',
        color: Colors.accent,
        bg: Colors.accentLight,
      },
      {
        id: 'companion',
        icon: Bot,
        label: 'Talk to AI Companion',
        desc: 'Process with support',
        color: '#3B82F6',
        bg: '#FFFFFF',
      },
      {
        id: 'exercise',
        icon: Activity,
        label: 'Another coping exercise',
        desc: 'Keep building calm',
        color: Colors.primary,
        bg: Colors.primaryLight,
      },
    ];

    return (
      <View style={styles.stepContent}>
        <Text style={styles.nextIntro}>
          You've slowed down. That takes real strength.
        </Text>
        <View style={styles.actionsList}>
          {actions.map(action => {
            const IconComp = action.icon;
            return (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => handleAction(action.id)}
                activeOpacity={0.7}
                testID={`action-${action.id}`}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                  <IconComp size={22} color={action.color} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionDesc}>{action.desc}</Text>
                </View>
                <ArrowRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleClose}
          activeOpacity={0.7}
          testID="done-button"
        >
          <Text style={styles.doneText}>I'm feeling better now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'breathing':
        return renderBreathing();
      case 'grounding':
        return renderGrounding();
      case 'emotions':
        return renderEmotions();
      case 'urges':
        return renderUrges();
      case 'next':
        return renderNextActions();
    }
  };

  const IconComp = meta.icon;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <View style={styles.topBar}>
          {stepIndex > 0 ? (
            <TouchableOpacity
              style={styles.navButton}
              onPress={goBack}
              activeOpacity={0.7}
              testID="back-button"
            >
              <ChevronLeft size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.navButton} />
          )}

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.stepCounter}>
              {stepIndex + 1} / {STEPS.length}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.navButton}
            onPress={handleClose}
            activeOpacity={0.7}
            testID="close-button"
          >
            <X size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.headerSection, { opacity: stepFade }]}>
            <View style={styles.stepIconWrap}>
              <IconComp size={26} color={Colors.white} />
            </View>
            <Text style={styles.stepTitle}>{meta.title}</Text>
            <Text style={styles.stepSubtitle}>{meta.subtitle}</Text>
          </Animated.View>

          <Animated.View style={{ opacity: stepFade }}>
            {renderStep()}
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(107,144,128,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepCounter: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 28,
  },
  stepIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepContent: {
    alignItems: 'center',
  },
  breatheArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  breatheOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary,
  },
  breatheCenter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  breathePhaseText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 2,
  },
  breatheTimerText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
  breatheCountText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  groundingCard: {
    width: SCREEN_WIDTH - 80,
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  groundingCount: {
    fontSize: 72,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  groundingSense: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  groundingHint: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  groundingDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  groundingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(107,144,128,0.2)',
  },
  groundingDotActive: {
    backgroundColor: Colors.primary,
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 16,
  },
  selectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  selectionChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  chipEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  chipLabelActive: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  chipCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  selectionHint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 8,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  nextIntro: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  actionsList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  actionDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  doneButton: {
    backgroundColor: Colors.successLight,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.success,
  },
});
