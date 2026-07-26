import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Wind,
  Eye,
  MessageCircle,
  Flame,
  Heart,
  BookOpen,
  Bot,
  Clock,
  ArrowRight,
  ChevronLeft,
  Check,
  Save,
  Edit3,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import Colors from '@/constants/colors';
import { RegulationStep, BreathingDuration, UrgeSurfingState, HelpNotTextState } from '@/types/crisis';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  REGULATION_URGES,
  ENTRY_CHOICES,
  BREATHING_DURATIONS,
  GROUNDING_STEPS,
  CALM_NEXT_ACTIONS,
  DELAY_OPTIONS,
  getIntensityLabel,
  createRegulationSession,
} from '@/services/crisis/crisisRegulationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEP_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Wind,
  Eye,
  MessageCircle,
  Flame,
  BookOpen,
  Bot,
  Clock,
  Edit3,
  Shield,
};

const BREATHE_IN = 4000;
const BREATHE_HOLD = 4000;
const BREATHE_OUT = 6000;

export default function CrisisRegulationScreen() {
  const { t } = useTranslation('safety');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackEvent, trackFlowStart } = useAnalytics();

  useEffect(() => {
    trackFlowStart('crisis_regulation');
    trackEvent('crisis_regulation_started');
  }, [trackFlowStart, trackEvent]);

  const [currentStep, setCurrentStep] = useState<RegulationStep>('entry');
  const [entryMessageIndex] = useState<number>(() => Math.floor(Math.random() * 3));
  const [breathDuration, setBreathDuration] = useState<BreathingDuration>(60);
  const [breathTimer, setBreathTimer] = useState<number>(60);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathStarted, setBreathStarted] = useState<boolean>(false);
  const [groundingIndex, setGroundingIndex] = useState<number>(0);
  const [groundingDone, setGroundingDone] = useState<Set<string>>(new Set<string>());
  const [urgeSurfing, setUrgeSurfing] = useState<UrgeSurfingState>({ selectedUrge: null, intensity: 5 });
  const [compassionIndex] = useState<number>(() => Math.floor(Math.random() * 5));
  const [helpNotText, setHelpNotText] = useState<HelpNotTextState>({ draftText: '', selectedDelay: null, draftSaved: false });
  const [session] = useState(() => createRegulationSession());

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepFade = useRef(new Animated.Value(1)).current;
  const breatheScale = useRef(new Animated.Value(0.5)).current;
  const breatheGlow = useRef(new Animated.Value(0.2)).current;
  const entryPulse = useRef(new Animated.Value(1)).current;
  const groundPulse = useRef(new Animated.Value(1)).current;

  const breathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(entryPulse, { toValue: 1.02, duration: 2500, useNativeDriver: true }),
        Animated.timing(entryPulse, { toValue: 1, duration: 2500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fadeAnim, entryPulse]);

  const runBreathCycle = useCallback(() => {
    setBreathPhase('inhale');
    Animated.parallel([
      Animated.timing(breatheScale, { toValue: 1, duration: BREATHE_IN, useNativeDriver: true }),
      Animated.timing(breatheGlow, { toValue: 0.7, duration: BREATHE_IN, useNativeDriver: true }),
    ]).start(() => {
      setBreathPhase('hold');
      breathTimerRef.current = setTimeout(() => {
        setBreathPhase('exhale');
        Animated.parallel([
          Animated.timing(breatheScale, { toValue: 0.5, duration: BREATHE_OUT, useNativeDriver: true }),
          Animated.timing(breatheGlow, { toValue: 0.2, duration: BREATHE_OUT, useNativeDriver: true }),
        ]).start();
      }, BREATHE_HOLD);
    });
  }, [breatheScale, breatheGlow]);

  useEffect(() => {
    if (currentStep !== 'breathing' || !breathStarted) return;

    setBreathTimer(breathDuration);
    runBreathCycle();

    const cycle = setInterval(() => {
      runBreathCycle();
    }, BREATHE_IN + BREATHE_HOLD + BREATHE_OUT);

    const timer = setInterval(() => {
      setBreathTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          clearInterval(cycle);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(cycle);
      clearInterval(timer);
      if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
    };
  }, [currentStep, breathStarted, breathDuration, runBreathCycle]);

  useEffect(() => {
    if (currentStep !== 'grounding') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(groundPulse, { toValue: 1.04, duration: 1800, useNativeDriver: true }),
        Animated.timing(groundPulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [currentStep, groundPulse]);

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

  const animateTransition = useCallback((onMid: () => void) => {
    Animated.timing(stepFade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      onMid();
      Animated.timing(stepFade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    });
  }, [stepFade]);

  const goToStep = useCallback((step: RegulationStep) => {
    hapticMedium();
    animateTransition(() => {
      setCurrentStep(step);
      if (!session.stepsVisited.includes(step)) {
        session.stepsVisited.push(step);
      }
    });
  }, [hapticMedium, animateTransition, session]);

  const handleClose = useCallback(() => {
    haptic();
    router.back();
  }, [haptic, router]);

  const handleAction = useCallback((route: string | null) => {
    hapticMedium();
    if (!route) {
      if (currentStep === 'calm_next') {
        goToStep('entry');
      }
      return;
    }
    router.back();
    setTimeout(() => {
      router.push(route as never);
    }, 300);
  }, [hapticMedium, router, currentStep, goToStep]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const breathLabel = useMemo(() => {
    if (breathPhase === 'inhale') return t('crisisMode.breathLabels.inhale');
    if (breathPhase === 'hold') return t('crisisMode.breathLabels.hold');
    return t('crisisMode.breathLabels.exhale');
  }, [breathPhase, t]);
  const entryMessages = t('regulation.entryMessages', { returnObjects: true }) as string[];
  const compassionMessages = t('regulation.compassion', { returnObjects: true }) as string[];
  const entryMessage = entryMessages[entryMessageIndex % entryMessages.length] ?? '';
  const compassionMessage = compassionMessages[compassionIndex % compassionMessages.length] ?? '';

  const renderEntry = () => (
    <View style={styles.stepContent}>
      <Animated.View style={[styles.entryHeart, { transform: [{ scale: entryPulse }] }]}>
        <Heart size={36} color={Colors.white} fill={Colors.white} />
      </Animated.View>

      <Text style={styles.entryMessage}>{entryMessage}</Text>

      <TouchableOpacity
        style={styles.primaryCta}
        onPress={() => goToStep('breathing')}
        activeOpacity={0.8}
        testID="start-calming"
      >
        <Wind size={20} color={Colors.white} />
        <Text style={styles.primaryCtaText}>{t('regulation.startCalming')}</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>{t('regulation.orChoose')}</Text>

      <View style={styles.entryChoices}>
        {ENTRY_CHOICES.map(choice => {
          const IconComp = STEP_ICONS[choice.icon] ?? Wind;
          return (
            <TouchableOpacity
              key={choice.id}
              style={styles.entryChoice}
              onPress={() => goToStep(choice.targetStep)}
              activeOpacity={0.7}
              testID={`entry-${choice.id}`}
            >
              <View style={styles.entryChoiceIcon}>
                <IconComp size={20} color="#14B8A6" />
              </View>
              <Text style={styles.entryChoiceLabel}>{t(`regulation.entryChoices.${choice.id}`)}</Text>
              <ArrowRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderBreathing = () => (
    <View style={styles.stepContent}>
      {!breathStarted ? (
        <>
          <Text style={styles.sectionTitle}>{t('regulation.choosePace')}</Text>
          <Text style={styles.sectionSubtitle}>{t('regulation.durationQuestion')}</Text>

          <View style={styles.durationRow}>
            {BREATHING_DURATIONS.map(d => (
              <TouchableOpacity
                key={d.value}
                style={[styles.durationChip, breathDuration === d.value && styles.durationChipActive]}
                onPress={() => { haptic(); setBreathDuration(d.value); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.durationText, breathDuration === d.value && styles.durationTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.startBreathButton}
            onPress={() => { hapticMedium(); setBreathStarted(true); }}
            activeOpacity={0.8}
            testID="start-breathing"
          >
            <Text style={styles.startBreathText}>{t('regulation.beginBreathing')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.breatheArea}>
            <Animated.View
              style={[styles.breatheOuterRing, { transform: [{ scale: breatheScale }], opacity: breatheGlow }]}
            />
            <View style={styles.breatheInnerCircle}>
              <Text style={styles.breathePhaseLabel}>{breathLabel}</Text>
              <Text style={styles.breatheTimerText}>{formatTime(breathTimer)}</Text>
            </View>
          </View>

          <Text style={styles.breatheHint}>{t('regulation.breathHint')}</Text>

          {breathTimer === 0 && (
            <View style={styles.breatheDoneRow}>
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => goToStep('grounding')}
                activeOpacity={0.8}
              >
                <Text style={styles.continueBtnText}>{t('regulation.continueGrounding')}</Text>
                <ArrowRight size={16} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => goToStep('calm_next')}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>{t('regulation.feelCalmer')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderGrounding = () => {
    const step = GROUNDING_STEPS[groundingIndex];
    const done = groundingDone.has(step.id);

    return (
      <View style={styles.stepContent}>
        <Text style={styles.sectionTitle}>{t('regulation.groundTitle')}</Text>
        <Text style={styles.sectionSubtitle}>{t('regulation.groundSubtitle')}</Text>

        <View style={styles.groundDots}>
          {GROUNDING_STEPS.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.groundDot,
                groundingDone.has(s.id) && styles.groundDotDone,
                i === groundingIndex && !groundingDone.has(s.id) && styles.groundDotCurrent,
              ]}
            />
          ))}
        </View>

        <Animated.View style={[styles.groundCard, { transform: [{ scale: groundPulse }] }]}>
          <Text style={[styles.groundCount, { color: step.color }]}>{step.count}</Text>
          <Text style={styles.groundInstruction}>{t(`regulation.groundingSteps.${step.id}.0`)}</Text>
          <Text style={[styles.groundSense, { color: step.color }]}>
            {t(`regulation.groundingSteps.${step.id}.1`)}
          </Text>

          <TouchableOpacity
            style={[styles.groundDoneBtn, done && styles.groundDoneBtnDone]}
            onPress={() => {
              hapic();
              setGroundingDone(prev => {
                const next = new Set(prev);
                next.add(step.id);
                return next;
              });
              if (groundingIndex < GROUNDING_STEPS.length - 1) {
                setGroundingIndex(prev => prev + 1);
              }
            }}
            activeOpacity={0.7}
            testID="grounding-done"
          >
            {done ? (
              <Check size={18} color={Colors.white} />
            ) : (
              <Text style={styles.groundDoneBtnText}>{t('regulation.done')}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.groundProgress}>
          {t('regulation.progress', { done: groundingDone.size, total: GROUNDING_STEPS.length })}
        </Text>

        <View style={styles.groundNav}>
          {groundingIndex > 0 && (
            <TouchableOpacity
              style={styles.groundNavBtn}
              onPress={() => { haptic(); setGroundingIndex(prev => prev - 1); }}
              activeOpacity={0.7}
            >
              <ChevronLeft size={16} color={Colors.textSecondary} />
              <Text style={styles.groundNavText}>{t('regulation.previous')}</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {groundingIndex < GROUNDING_STEPS.length - 1 ? (
            <TouchableOpacity
              style={styles.groundNavBtn}
              onPress={() => { haptic(); setGroundingIndex(prev => prev + 1); }}
              activeOpacity={0.7}
            >
              <Text style={styles.groundNavText}>{t('regulation.next')}</Text>
              <ArrowRight size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => goToStep('calm_next')}
              activeOpacity={0.8}
            >
              <Text style={styles.continueBtnText}>{t('regulation.nextStep')}</Text>
              <ArrowRight size={16} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderUrgeSurfing = () => {
    const selectedUrge = REGULATION_URGES.find(u => u.id === urgeSurfing.selectedUrge);

    return (
      <View style={styles.stepContent}>
        <Text style={styles.sectionTitle}>{t('regulation.urgeTitle')}</Text>
        <Text style={styles.sectionSubtitle}>{t('regulation.urgeSubtitle')}</Text>

        <View style={styles.urgeGrid}>
          {REGULATION_URGES.map(urge => {
            const selected = urgeSurfing.selectedUrge === urge.id;
            return (
              <TouchableOpacity
                key={urge.id}
                style={[styles.urgeChip, selected && styles.urgeChipSelected]}
                onPress={() => {
                  haptic();
                  setUrgeSurfing(prev => ({ ...prev, selectedUrge: urge.id }));
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.urgeEmoji}>{urge.emoji}</Text>
                <Text style={[styles.urgeLabel, selected && styles.urgeLabelSelected]}>{t(`regulation.urges.${urge.id}`)}</Text>
                {selected && (
                  <View style={styles.urgeCheck}>
                    <Check size={10} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedUrge && (
          <View style={styles.urgeIntensitySection}>
            <Text style={styles.urgeIntensityLabel}>
              {t('regulation.intensity')} <Text style={styles.urgeIntensityValue}>{urgeSurfing.intensity}/10 - {t(`regulation.intensityLabels.${getIntensityLabel(urgeSurfing.intensity)}`)}</Text>
            </Text>

            <View style={styles.intensityTrack}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(val => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.intensityDot,
                    val <= urgeSurfing.intensity && styles.intensityDotFilled,
                    val <= 3 && val <= urgeSurfing.intensity && styles.intensityDotLow,
                    val > 3 && val <= 6 && val <= urgeSurfing.intensity && styles.intensityDotMid,
                    val > 6 && val <= urgeSurfing.intensity && styles.intensityDotHigh,
                  ]}
                  onPress={() => {
                    haptic();
                    setUrgeSurfing(prev => ({ ...prev, intensity: val }));
                  }}
                  activeOpacity={0.7}
                />
              ))}
            </View>

            <View style={styles.compassionCard}>
              <Text style={styles.compassionText}>{compassionMessage}</Text>
            </View>

            <View style={styles.urgeActions}>
              <TouchableOpacity
                style={styles.urgeActionBtn}
                onPress={() => goToStep('breathing')}
                activeOpacity={0.7}
              >
                <Wind size={16} color="#14B8A6" />
                <Text style={styles.urgeActionText}>{t('regulation.breatheFirst')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.urgeActionBtn}
                onPress={() => goToStep('grounding')}
                activeOpacity={0.7}
              >
                <Eye size={16} color="#14B8A6" />
                <Text style={styles.urgeActionText}>{t('regulation.groundMe')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.urgeActionBtn}
                onPress={() => goToStep('help_not_text')}
                activeOpacity={0.7}
              >
                <Clock size={16} color="#67E8F9" />
                <Text style={styles.urgeActionText}>{t('regulation.delayAction')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => goToStep('calm_next')}
              activeOpacity={0.8}
            >
              <Text style={styles.continueBtnText}>{t('regulation.calmerNext')}</Text>
              <ArrowRight size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderHelpNotText = () => (
    <View style={styles.stepContent}>
      <View style={styles.notTextIcon}>
        <MessageCircle size={28} color="#67E8F9" />
      </View>
      <Text style={styles.sectionTitle}>{t('regulation.helpNotTextTitle')}</Text>
      <Text style={styles.sectionSubtitle}>
        {t('regulation.helpNotTextSubtitle')}
      </Text>

      <View style={styles.draftSection}>
        <Text style={styles.draftLabel}>{t('regulation.draftLabel')}</Text>
        <TextInput
          style={styles.draftInput}
          placeholder={t('regulation.draftPlaceholder')}
          placeholderTextColor={Colors.textMuted}
          multiline
          value={helpNotText.draftText}
          onChangeText={(text) => setHelpNotText(prev => ({ ...prev, draftText: text }))}
          testID="draft-input"
        />
        {helpNotText.draftText.length > 0 && !helpNotText.draftSaved && (
          <TouchableOpacity
            style={styles.saveDraftBtn}
            onPress={() => {
              hapicMedium();
              setHelpNotText(prev => ({ ...prev, draftSaved: true }));
              session.draftSaved = true;
            }}
            activeOpacity={0.7}
            testID="save-draft"
          >
            <Save size={16} color={Colors.white} />
            <Text style={styles.saveDraftText}>{t('regulation.saveDraft')}</Text>
          </TouchableOpacity>
        )}
        {helpNotText.draftSaved && (
          <View style={styles.draftSavedBadge}>
            <Check size={16} color={Colors.success} />
            <Text style={styles.draftSavedText}>{t('regulation.draftSaved')}</Text>
          </View>
        )}
      </View>

      <Text style={styles.delayTitle}>{t('regulation.pauseTitle')}</Text>
      <Text style={styles.delaySubtitle}>{t('regulation.pauseSubtitle')}</Text>

      <View style={styles.delayRow}>
        {DELAY_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.delayChip,
              helpNotText.selectedDelay === opt.minutes && styles.delayChipSelected,
            ]}
            onPress={() => {
              hapic();
              setHelpNotText(prev => ({ ...prev, selectedDelay: opt.minutes }));
              session.delayMinutes = opt.minutes;
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.delayChipText,
              helpNotText.selectedDelay === opt.minutes && styles.delayChipTextSelected,
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {helpNotText.selectedDelay !== null && (
        <View style={styles.delayEncouragement}>
          <Clock size={16} color="#67E8F9" />
          <Text style={styles.delayEncouragementText}>
            {t(`regulation.delayEncouragement.${helpNotText.selectedDelay}`)}
          </Text>
        </View>
      )}

      <View style={styles.helpNotTextActions}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => goToStep('breathing')}
          activeOpacity={0.8}
        >
          <Wind size={16} color={Colors.white} />
          <Text style={styles.continueBtnText}>{t('regulation.breatheWaiting')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => goToStep('calm_next')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryBtnText}>{t('regulation.otherOptions')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCalmNext = () => (
    <View style={styles.stepContent}>
      <View style={styles.calmNextHeader}>
        <Check size={24} color={Colors.success} />
        <Text style={styles.calmNextTitle}>
          {t('regulation.calmNextTitle')}
        </Text>
        <Text style={styles.calmNextSubtitle}>
          {t('regulation.calmNextSubtitle')}
        </Text>
      </View>

      <View style={styles.calmNextList}>
        {CALM_NEXT_ACTIONS.map(action => {
          const IconComp = STEP_ICONS[action.icon] ?? ArrowRight;
          const isRedo = action.route === null;
          return (
            <TouchableOpacity
              key={action.id}
              style={styles.calmNextCard}
              onPress={() => {
                if (isRedo && action.id === 'cna5') {
                  goToStep('grounding');
                } else {
                  handleAction(action.route);
                }
              }}
              activeOpacity={0.7}
              testID={`calm-${action.id}`}
            >
              <View style={[styles.calmNextIcon, { backgroundColor: action.bg }]}>
                <IconComp size={20} color={action.color} />
              </View>
              <View style={styles.calmNextInfo}>
                <Text style={styles.calmNextLabel}>{t(`regulation.calmNextActions.${action.id}.0`)}</Text>
                <Text style={styles.calmNextDesc}>{t(`regulation.calmNextActions.${action.id}.1`)}</Text>
              </View>
              <ArrowRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.feelBetterBtn}
        onPress={handleClose}
        activeOpacity={0.7}
        testID="feel-better"
      >
        <Text style={styles.feelBetterText}>{t('regulation.feelBetter')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'entry': return renderEntry();
      case 'breathing': return renderBreathing();
      case 'grounding': return renderGrounding();
      case 'urge_surfing': return renderUrgeSurfing();
      case 'help_not_text': return renderHelpNotText();
      case 'calm_next': return renderCalmNext();
    }
  };

  const showBack = currentStep !== 'entry';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <View style={styles.topBar}>
          {showBack ? (
            <TouchableOpacity
              style={styles.topBtn}
              onPress={() => goToStep('entry')}
              activeOpacity={0.7}
              testID="regulation-back"
            >
              <ChevronLeft size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.topBtn} />
          )}

          <Text style={styles.topTitle}>{t('regulation.title')}</Text>

          <TouchableOpacity
            style={styles.topBtn}
            onPress={handleClose}
            activeOpacity={0.7}
            testID="regulation-close"
          >
            <X size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.topSubtitle}>{t('regulation.subtitle')}</Text>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: stepFade }}>
            {renderStep()}
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// Fix typos in callbacks - alias to correct names
const hapic = () => {
  if (Platform.OS !== 'web') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};
const hapicMedium = () => {
  if (Platform.OS !== 'web') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

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
    paddingVertical: 10,
  },
  topBtn: {
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
  topTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  topSubtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  stepContent: {
    alignItems: 'center',
  },
  entryHeart: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#14B8A6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  entryMessage: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14B8A6',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 28,
    gap: 10,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  primaryCtaText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  orText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  entryChoices: {
    width: '100%',
    gap: 10,
  },
  entryChoice: {
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
    gap: 14,
  },
  entryChoiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#D9E2EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryChoiceLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  durationChip: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  durationChipActive: {
    borderColor: '#14B8A6',
    backgroundColor: '#D9E2EC',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  durationTextActive: {
    color: '#14B8A6',
  },
  startBreathButton: {
    backgroundColor: '#14B8A6',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 40,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  startBreathText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  breatheArea: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  breatheOuterRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#2E2A72',
  },
  breatheInnerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  breathePhaseLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2E2A72',
    marginBottom: 2,
  },
  breatheTimerText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#2E2A72',
    fontVariant: ['tabular-nums'],
  },
  breatheHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  breatheDoneRow: {
    gap: 12,
    alignItems: 'center',
    width: '100%',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14B8A6',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 8,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  secondaryBtn: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  groundDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  groundDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D9E2EC',
  },
  groundDotDone: {
    backgroundColor: Colors.success,
  },
  groundDotCurrent: {
    backgroundColor: '#14B8A6',
  },
  groundCard: {
    width: SCREEN_WIDTH - 80,
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  groundCount: {
    fontSize: 64,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  groundInstruction: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  groundSense: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginBottom: 20,
  },
  groundDoneBtn: {
    backgroundColor: '#14B8A6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  groundDoneBtnDone: {
    backgroundColor: Colors.success,
  },
  groundDoneBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  groundProgress: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  groundNav: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 8,
  },
  groundNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  groundNavText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  urgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 20,
  },
  urgeChip: {
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
  urgeChipSelected: {
    borderColor: '#67E8F9',
    backgroundColor: '#FFFFFF',
  },
  urgeEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  urgeLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  urgeLabelSelected: {
    color: '#67E8F9',
    fontWeight: '600' as const,
  },
  urgeCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#67E8F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  urgeIntensitySection: {
    width: '100%',
    alignItems: 'center',
  },
  urgeIntensityLabel: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 12,
    fontWeight: '500' as const,
  },
  urgeIntensityValue: {
    fontWeight: '700' as const,
    color: '#67E8F9',
  },
  intensityTrack: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  intensityDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D9E2EC',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  intensityDotFilled: {
    borderColor: 'transparent',
  },
  intensityDotLow: {
    backgroundColor: '#14B8A6',
  },
  intensityDotMid: {
    backgroundColor: '#67E8F9',
  },
  intensityDotHigh: {
    backgroundColor: '#3B82F6',
  },
  compassionCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 18,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#67E8F9',
  },
  compassionText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    fontWeight: '500' as const,
    fontStyle: 'italic',
  },
  urgeActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  urgeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  urgeActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  notTextIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#D9E2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  draftSection: {
    width: '100%',
    marginBottom: 28,
  },
  draftLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  draftInput: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14B8A6',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
    alignSelf: 'flex-start',
  },
  saveDraftText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  draftSavedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  draftSavedText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500' as const,
  },
  delayTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  delaySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  delayRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  delayChip: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  delayChipSelected: {
    borderColor: '#67E8F9',
    backgroundColor: Colors.warmGlow,
  },
  delayChipText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  delayChipTextSelected: {
    color: '#67E8F9',
  },
  delayEncouragement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 24,
    width: '100%',
  },
  delayEncouragementText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  helpNotTextActions: {
    gap: 12,
    alignItems: 'center',
    width: '100%',
  },
  calmNextHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  calmNextTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
    lineHeight: 28,
  },
  calmNextSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  calmNextList: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  calmNextCard: {
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
    gap: 14,
  },
  calmNextIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calmNextInfo: {
    flex: 1,
  },
  calmNextLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  calmNextDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  feelBetterBtn: {
    backgroundColor: Colors.successLight,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  feelBetterText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.success,
  },
});
