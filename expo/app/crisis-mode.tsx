import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Eye,
  Ear,
  Hand,
  Coffee,
  Flower2,
  Heart,
  Phone,
  MessageCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { CrisisModePhase } from '@/types/crisis';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import TrustedSupportCard from '@/components/TrustedSupportCard';
import {
  GROUNDING_PROMPTS,
  MESSAGE_DELAY_OPTIONS,
  CRISIS_PHASES,
  getCalmnessResponse,
} from '@/services/crisis/crisisModeService';

const SENSE_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Eye,
  Hand,
  Ear,
  Flower2,
  Coffee,
};

const BREATHE_DURATION_IN = 4000;
const BREATHE_DURATION_HOLD = 4000;
const BREATHE_DURATION_OUT = 6000;
const TOTAL_BREATHE_CYCLE = BREATHE_DURATION_IN + BREATHE_DURATION_HOLD + BREATHE_DURATION_OUT;

export default function CrisisModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackEvent, trackFlowStart } = useAnalytics();

  useEffect(() => {
    trackFlowStart('crisis_mode');
    trackEvent('crisis_mode_triggered');
    trackEvent('crisis_mode_activated', { source: 'direct' });
  }, [trackFlowStart, trackEvent]);

  const [currentPhase, setCurrentPhase] = useState<CrisisModePhase>('breathing');
  const [breatheLabel, setBreatheLabel] = useState<string>('Breathe in...');
  const [breatheTimer, setBreatheTimer] = useState<number>(60);
  const [groundingStep, setGroundingStep] = useState<number>(0);
  const [groundingCompleted, setGroundingCompleted] = useState<Set<string>>(new Set<string>());
  const [calmResponseIndex, setCalmResponseIndex] = useState<number>(0);
  const [selectedDelay, setSelectedDelay] = useState<number | null>(null);
  const [delayConfirmed, setDelayConfirmed] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const breatheScale = useRef(new Animated.Value(0.7)).current;
  const breatheOpacity = useRef(new Animated.Value(0.3)).current;
  const phaseTransition = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (currentPhase !== 'breathing') return;

    const breatheCycle = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheScale, {
          toValue: 1.2,
          duration: BREATHE_DURATION_IN,
          useNativeDriver: true,
        }),
        Animated.timing(breatheScale, {
          toValue: 1.2,
          duration: BREATHE_DURATION_HOLD,
          useNativeDriver: true,
        }),
        Animated.timing(breatheScale, {
          toValue: 0.7,
          duration: BREATHE_DURATION_OUT,
          useNativeDriver: true,
        }),
      ])
    );

    const opacityCycle = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheOpacity, {
          toValue: 0.7,
          duration: BREATHE_DURATION_IN,
          useNativeDriver: true,
        }),
        Animated.timing(breatheOpacity, {
          toValue: 0.7,
          duration: BREATHE_DURATION_HOLD,
          useNativeDriver: true,
        }),
        Animated.timing(breatheOpacity, {
          toValue: 0.3,
          duration: BREATHE_DURATION_OUT,
          useNativeDriver: true,
        }),
      ])
    );

    breatheCycle.start();
    opacityCycle.start();

    const labelInterval = setInterval(() => {
      const elapsed = Date.now() % TOTAL_BREATHE_CYCLE;
      if (elapsed < BREATHE_DURATION_IN) {
        setBreatheLabel('Breathe in...');
      } else if (elapsed < BREATHE_DURATION_IN + BREATHE_DURATION_HOLD) {
        setBreatheLabel('Hold...');
      } else {
        setBreatheLabel('Breathe out...');
      }
    }, 500);

    const timerInterval = setInterval(() => {
      setBreatheTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      breatheCycle.stop();
      opacityCycle.stop();
      clearInterval(labelInterval);
      clearInterval(timerInterval);
    };
  }, [currentPhase, breatheScale, breatheOpacity]);

  useEffect(() => {
    if (currentPhase !== 'contact_safe') return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [currentPhase, pulseAnim]);

  const switchPhase = useCallback((phase: CrisisModePhase) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.sequence([
      Animated.timing(phaseTransition, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(phaseTransition, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentPhase(phase);
  }, [phaseTransition]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    trackEvent('crisis_mode_completed', {
      final_phase: currentPhase,
      grounding_steps_completed: groundingCompleted.size,
      delay_confirmed: delayConfirmed,
    });
    router.back();
  }, [router, trackEvent, currentPhase, groundingCompleted.size, delayConfirmed]);

  const handleGroundingComplete = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setGroundingCompleted(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    if (groundingStep < GROUNDING_PROMPTS.length - 1) {
      setGroundingStep(prev => prev + 1);
    }
  }, [groundingStep]);

  const handleNextCalm = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCalmResponseIndex(prev => prev + 1);
  }, []);

  const handleDelaySelect = useCallback((minutes: number) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedDelay(minutes);
  }, []);

  const handleDelayConfirm = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setDelayConfirmed(true);
  }, []);

  const handleCallCrisis = useCallback((action: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    void Linking.openURL(action);
  }, []);

  const currentPhaseIndex = useMemo(
    () => CRISIS_PHASES.findIndex(item => item.phase === currentPhase),
    [currentPhase],
  );

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderPhaseNav = () => (
    <View style={styles.phaseNav}>
      {CRISIS_PHASES.map((p) => (
        <TouchableOpacity
          key={p.phase}
          style={[
            styles.phaseChip,
            currentPhase === p.phase && styles.phaseChipActive,
          ]}
          onPress={() => switchPhase(p.phase)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.phaseChipText,
              currentPhase === p.phase && styles.phaseChipTextActive,
            ]}
          >
            {p.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBreathingPhase = () => (
    <View style={styles.phaseContent}>
      <View style={styles.breatheArea}>
        <Animated.View
          style={[
            styles.breatheOuterRing,
            {
              transform: [{ scale: breatheScale }],
              opacity: breatheOpacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.breatheCircle,
            { transform: [{ scale: breatheScale }] },
          ]}
        >
          <Heart size={32} color={Colors.white} fill={Colors.white} />
        </Animated.View>
      </View>

      <Text style={styles.breatheLabel}>{breatheLabel}</Text>
      <Text style={styles.breatheTimer}>{formatTime(breatheTimer)}</Text>
      <Text style={styles.breatheHint}>
        In for 4... Hold for 4... Out for 6...
      </Text>

      <TouchableOpacity
        style={styles.nextPhaseButton}
        onPress={() => switchPhase('grounding')}
        activeOpacity={0.7}
      >
        <Text style={styles.nextPhaseText}>Continue to Grounding</Text>
        <ChevronRight size={18} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderGroundingPhase = () => {
    const currentPrompt = GROUNDING_PROMPTS[groundingStep];
    const IconComp = SENSE_ICONS[currentPrompt.icon] ?? Eye;
    const completedCount = groundingCompleted.size;

    return (
      <View style={styles.phaseContent}>
        <Text style={styles.groundingTitle}>5-4-3-2-1 Grounding</Text>
        <Text style={styles.groundingSubtitle}>
          Reconnect with the present through your senses
        </Text>

        <View style={styles.groundingProgress}>
          {GROUNDING_PROMPTS.map((p, idx) => (
            <View
              key={p.id}
              style={[
                styles.groundingDot,
                groundingCompleted.has(p.id) && styles.groundingDotDone,
                idx === groundingStep && !groundingCompleted.has(p.id) && styles.groundingDotCurrent,
              ]}
            />
          ))}
        </View>

        <View style={styles.groundingCard}>
          <View style={styles.groundingIconWrap}>
            <IconComp size={28} color="#5B8FB9" />
          </View>
          <Text style={styles.groundingInstruction}>
            {currentPrompt.instruction}
          </Text>
          <Text style={styles.groundingSense}>
            {currentPrompt.sense.charAt(0).toUpperCase() + currentPrompt.sense.slice(1)}
          </Text>

          <TouchableOpacity
            style={[
              styles.groundingDoneButton,
              groundingCompleted.has(currentPrompt.id) && styles.groundingDoneButtonCompleted,
            ]}
            onPress={() => handleGroundingComplete(currentPrompt.id)}
            activeOpacity={0.7}
          >
            {groundingCompleted.has(currentPrompt.id) ? (
              <Check size={20} color={Colors.white} />
            ) : (
              <Text style={styles.groundingDoneText}>Done</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.groundingCount}>
          {completedCount} of {GROUNDING_PROMPTS.length} completed
        </Text>

        <View style={styles.navRow}>
          {groundingStep > 0 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setGroundingStep(prev => prev - 1)}
              activeOpacity={0.7}
            >
              <ChevronLeft size={16} color={Colors.textSecondary} />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {groundingStep < GROUNDING_PROMPTS.length - 1 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setGroundingStep(prev => prev + 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.navButtonText}>Next</Text>
              <ChevronRight size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderAICalmPhase = () => {
    const response = getCalmnessResponse(calmResponseIndex);

    return (
      <View style={styles.phaseContent}>
        <View style={styles.calmIconWrap}>
          <Sparkles size={28} color={Colors.primary} />
        </View>
        <Text style={styles.calmTitle}>Calm Support</Text>
        <Text style={styles.calmSubtitle}>
          Short, simple guidance — one step at a time
        </Text>

        <View style={styles.calmCard}>
          <Text style={styles.calmResponse}>{response}</Text>
        </View>

        <TouchableOpacity
          style={styles.calmNextButton}
          onPress={handleNextCalm}
          activeOpacity={0.7}
        >
          <Text style={styles.calmNextText}>Another gentle thought</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.companionLink}
          onPress={() => {
            router.back();
            setTimeout(() => router.push('/(tabs)/companion'), 300);
          }}
          activeOpacity={0.7}
        >
          <Sparkles size={16} color={Colors.primary} />
          <Text style={styles.companionLinkText}>Open AI Companion</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMessageDelayPhase = () => (
    <View style={styles.phaseContent}>
      <View style={styles.delayIconWrap}>
        <Clock size={28} color={Colors.accent} />
      </View>
      <Text style={styles.delayTitle}>Pause Before Sending</Text>
      <Text style={styles.delaySubtitle}>
        Give yourself space. You can always send it later.
      </Text>

      {!delayConfirmed ? (
        <>
          <View style={styles.delayOptions}>
            {MESSAGE_DELAY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.delayOption,
                  selectedDelay === option.minutes && styles.delayOptionSelected,
                ]}
                onPress={() => handleDelaySelect(option.minutes)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.delayOptionText,
                    selectedDelay === option.minutes && styles.delayOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedDelay !== null && (
            <TouchableOpacity
              style={styles.delayConfirmButton}
              onPress={handleDelayConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.delayConfirmText}>
                Set {selectedDelay}-minute pause
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.delayConfirmedCard}>
          <Check size={24} color={Colors.success} />
          <Text style={styles.delayConfirmedText}>
            Message pause set for {selectedDelay} minutes
          </Text>
          <Text style={styles.delayConfirmedHint}>
            Use this time to breathe, ground, or just be still.
          </Text>
        </View>
      )}
    </View>
  );

  const renderContactPhase = () => (
    <View style={styles.phaseContent}>
      <TrustedSupportCard variant="crisis" maxContacts={5} />

      <View style={styles.crisisLinesSpacer} />

      <Text style={styles.crisisLinesHeader}>Crisis Lines</Text>

      <TouchableOpacity
        style={styles.contactCard}
        onPress={() => handleCallCrisis('tel:988')}
        activeOpacity={0.7}
      >
        <View style={[styles.contactCardIcon, { backgroundColor: '#FDE8E3' }]}>
          <Phone size={22} color={Colors.danger} />
        </View>
        <View style={styles.contactCardText}>
          <Text style={styles.contactCardLabel}>988 Suicide & Crisis Lifeline</Text>
          <Text style={styles.contactCardDesc}>Call or text 24/7</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.contactCard}
        onPress={() => handleCallCrisis('sms:741741')}
        activeOpacity={0.7}
      >
        <View style={[styles.contactCardIcon, { backgroundColor: '#E3EFF7' }]}>
          <MessageCircle size={22} color="#5B8FB9" />
        </View>
        <View style={styles.contactCardText}>
          <Text style={styles.contactCardLabel}>Crisis Text Line</Text>
          <Text style={styles.contactCardDesc}>Text HOME to 741741</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.contactReminder}>
        <Text style={styles.contactReminderText}>
          You've survived every hard moment before this one.{'\n'}
          You will survive this one too.
        </Text>
      </View>
    </View>
  );

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 'breathing':
        return renderBreathingPhase();
      case 'grounding':
        return renderGroundingPhase();
      case 'ai_calm':
        return renderAICalmPhase();
      case 'message_delay':
        return renderMessageDelayPhase();
      case 'contact_safe':
        return renderContactPhase();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
            testID="crisis-close"
          >
            <X size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crisis Mode</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.headerSubtitle}>
          One step at a time. You're safe here.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.phaseNavScroll}
        >
          {renderPhaseNav()}
        </ScrollView>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: phaseTransition }}>
            {renderCurrentPhase()}
          </Animated.View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.footerNav}>
            {currentPhaseIndex > 0 && (
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => switchPhase(CRISIS_PHASES[currentPhaseIndex - 1].phase)}
                activeOpacity={0.7}
              >
                <ChevronLeft size={18} color={Colors.textSecondary} />
                <Text style={styles.footerButtonText}>
                  {CRISIS_PHASES[currentPhaseIndex - 1].label}
                </Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            {currentPhaseIndex < CRISIS_PHASES.length - 1 && (
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => switchPhase(CRISIS_PHASES[currentPhaseIndex + 1].phase)}
                activeOpacity={0.7}
              >
                <Text style={styles.footerButtonText}>
                  {CRISIS_PHASES[currentPhaseIndex + 1].label}
                </Text>
                <ChevronRight size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 38,
  },
  headerSubtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  phaseNavScroll: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  phaseNav: {
    flexDirection: 'row',
    gap: 8,
  },
  phaseChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  phaseChipActive: {
    backgroundColor: '#3D5A80',
  },
  phaseChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  phaseChipTextActive: {
    color: Colors.white,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  phaseContent: {
    alignItems: 'center',
  },
  breatheArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  breatheOuterRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#98C1D9',
  },
  breatheCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3D5A80',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3D5A80',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  breatheLabel: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: '#3D5A80',
    marginBottom: 4,
  },
  breatheTimer: {
    fontSize: 40,
    fontWeight: '300' as const,
    color: Colors.textMuted,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  breatheHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  nextPhaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3D5A80',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  nextPhaseText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  groundingTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  groundingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  groundingProgress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  groundingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D0D8E0',
  },
  groundingDotDone: {
    backgroundColor: Colors.success,
  },
  groundingDotCurrent: {
    backgroundColor: '#5B8FB9',
  },
  groundingCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  groundingIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#E3EFF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  groundingInstruction: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
  },
  groundingSense: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 20,
  },
  groundingDoneButton: {
    backgroundColor: '#5B8FB9',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  groundingDoneButtonCompleted: {
    backgroundColor: Colors.success,
  },
  groundingDoneText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  groundingCount: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  navButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  calmIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  calmTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  calmSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  calmCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  calmResponse: {
    fontSize: 17,
    color: Colors.text,
    lineHeight: 26,
    fontWeight: '500' as const,
  },
  calmNextButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 16,
  },
  calmNextText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  companionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  companionLinkText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  delayIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  delayTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  delaySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 21,
  },
  delayOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  delayOption: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  delayOptionSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.warmGlow,
  },
  delayOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  delayOptionTextSelected: {
    color: Colors.accent,
  },
  delayConfirmButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  delayConfirmText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  delayConfirmedCard: {
    backgroundColor: Colors.successLight,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  delayConfirmedText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  delayConfirmedHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  contactIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#E3EFF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  contactSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    width: '100%',
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    gap: 14,
  },
  contactCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCardText: {
    flex: 1,
  },
  contactCardLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  contactCardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  contactReminder: {
    marginTop: 24,
    backgroundColor: '#F0F4F8',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  contactReminderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#F0F4F8',
    borderTopWidth: 1,
    borderTopColor: '#E0E6EC',
  },
  footerNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  crisisLinesSpacer: {
    height: 20,
  },
  crisisLinesHeader: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
});
