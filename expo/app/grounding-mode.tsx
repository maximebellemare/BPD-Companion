import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Wind,
  Anchor,
  BookOpen,
  Sparkles,
  Eye,
  Hand,
  Ear,
  Heart,
  Timer,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAnalytics } from '@/providers/AnalyticsProvider';

type GroundingPhase = 'welcome' | 'breathing' | 'senses' | 'settled';

const SENSE_STEPS = [
  { id: 's1', sense: 'sight', instruction: 'Name 5 things you can see right now.', icon: Eye, color: '#14B8A6' },
  { id: 's2', sense: 'touch', instruction: 'Name 4 things you can touch or feel.', icon: Hand, color: '#67E8F9' },
  { id: 's3', sense: 'hearing', instruction: 'Name 3 things you can hear.', icon: Ear, color: '#3B82F6' },
  { id: 's4', sense: 'smell', instruction: 'Name 2 things you can smell.', icon: Wind, color: '#14B8A6' },
  { id: 's5', sense: 'taste', instruction: 'Name 1 thing you can taste.', icon: Heart, color: '#2E2A72' },
];

const BREATHE_IN = 4000;
const BREATHE_HOLD = 2000;
const BREATHE_OUT = 6000;
const TOTAL_BREATHS = 4;

export default function GroundingModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const [phase, setPhase] = useState<GroundingPhase>('welcome');
  const [breathCount, setBreathCount] = useState(0);
  const [breathLabel, setBreathLabel] = useState('');
  const [senseStep, setSenseStep] = useState(0);
  const [completedSenses, setCompletedSenses] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0.4)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    trackEvent('grounding_mode_opened');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, trackEvent]);

  useEffect(() => {
    return () => {
      if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
    };
  }, []);

  const startBreathing = useCallback(() => {
    setPhase('breathing');
    setBreathCount(0);
    runBreathCycle(0);
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runBreathCycle = useCallback((count: number) => {
    if (count >= TOTAL_BREATHS) {
      setPhase('senses');
      setSenseStep(0);
      return;
    }

    setBreathLabel('Breathe in...');
    Animated.timing(breatheAnim, {
      toValue: 1,
      duration: BREATHE_IN,
      useNativeDriver: true,
    }).start();

    breathTimerRef.current = setTimeout(() => {
      setBreathLabel('Hold...');

      breathTimerRef.current = setTimeout(() => {
        setBreathLabel('Breathe out...');
        Animated.timing(breatheAnim, {
          toValue: 0.4,
          duration: BREATHE_OUT,
          useNativeDriver: true,
        }).start();

        breathTimerRef.current = setTimeout(() => {
          const next = count + 1;
          setBreathCount(next);
          if (next < TOTAL_BREATHS) {
            runBreathCycle(next);
          } else {
            setPhase('senses');
            setSenseStep(0);
            if (Platform.OS !== 'web') {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        }, BREATHE_OUT);
      }, BREATHE_HOLD);
    }, BREATHE_IN);
  }, [breatheAnim]);

  const completeSenseStep = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const currentSense = SENSE_STEPS[senseStep];
    setCompletedSenses(prev => [...prev, currentSense.id]);

    if (senseStep < SENSE_STEPS.length - 1) {
      setSenseStep(prev => prev + 1);
    } else {
      setPhase('settled');
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [senseStep]);

  const handleClose = useCallback(() => {
    trackEvent('grounding_mode_completed', { phase });
    router.back();
  }, [phase, router, trackEvent]);

  const handleNavigate = useCallback((route: string) => {
    trackEvent('grounding_mode_action', { route });
    router.back();
    setTimeout(() => {
      router.push(route as never);
    }, 300);
  }, [trackEvent, router]);

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (phase === 'welcome') {
      startPulse();
    }
  }, [phase, startPulse]);

  const renderWelcome = () => (
    <Animated.View style={[styles.centerContent, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.welcomeCircle, { transform: [{ scale: pulseAnim }] }]}>
        <Anchor size={48} color={Colors.white} />
      </Animated.View>

      <Text style={styles.welcomeTitle}>Grounding Mode</Text>
      <Text style={styles.welcomeSubtitle}>
        Let's slow things down together.{'\n'}You're safe here.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={startBreathing}
        activeOpacity={0.8}
        testID="start-breathing-btn"
      >
        <Wind size={20} color={Colors.white} />
        <Text style={styles.primaryButtonText}>Start with breathing</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => { setPhase('senses'); setSenseStep(0); }}
        activeOpacity={0.7}
        testID="skip-to-grounding-btn"
      >
        <Text style={styles.secondaryButtonText}>Skip to grounding</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBreathing = () => (
    <View style={styles.centerContent}>
      <Text style={styles.breathCountLabel}>
        Breath {Math.min(breathCount + 1, TOTAL_BREATHS)} of {TOTAL_BREATHS}
      </Text>

      <Animated.View
        style={[
          styles.breathCircle,
          {
            transform: [{ scale: breatheAnim }],
            opacity: Animated.add(0.5, Animated.multiply(breatheAnim, 0.5)),
          },
        ]}
      >
        <Wind size={40} color={Colors.white} />
      </Animated.View>

      <Text style={styles.breathLabel}>{breathLabel}</Text>

      <View style={styles.breathDots}>
        {Array.from({ length: TOTAL_BREATHS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.breathDot,
              i < breathCount && styles.breathDotComplete,
              i === breathCount && styles.breathDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderSenses = () => {
    const current = SENSE_STEPS[senseStep];
    const IconComponent = current.icon;

    return (
      <View style={styles.centerContent}>
        <Text style={styles.senseProgress}>
          Step {senseStep + 1} of {SENSE_STEPS.length}
        </Text>

        <View style={[styles.senseIconContainer, { backgroundColor: current.color + '20' }]}>
          <IconComponent size={40} color={current.color} />
        </View>

        <Text style={styles.senseInstruction}>{current.instruction}</Text>

        <Text style={styles.senseHint}>
          Take your time. There's no rush.
        </Text>

        <TouchableOpacity
          style={[styles.senseButton, { backgroundColor: current.color }]}
          onPress={completeSenseStep}
          activeOpacity={0.8}
          testID={`sense-done-${senseStep}`}
        >
          <Check size={20} color={Colors.white} />
          <Text style={styles.senseButtonText}>Done</Text>
        </TouchableOpacity>

        <View style={styles.senseStepDots}>
          {SENSE_STEPS.map((step) => (
            <View
              key={step.id}
              style={[
                styles.senseStepDot,
                { backgroundColor: step.color + (completedSenses.includes(step.id) ? '' : '40') },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderSettled = () => (
    <View style={styles.centerContent}>
      <View style={styles.settledCircle}>
        <Check size={48} color={Colors.success} />
      </View>

      <Text style={styles.settledTitle}>You did it.</Text>
      <Text style={styles.settledSubtitle}>
        Take a moment to notice how you feel now.{'\n'}Even small shifts matter.
      </Text>

      <View style={styles.nextActions}>
        <Text style={styles.nextActionsLabel}>What would help next?</Text>

        <TouchableOpacity
          style={styles.nextActionCard}
          onPress={() => handleNavigate('/journal-write')}
          activeOpacity={0.7}
          testID="next-journal"
        >
          <View style={[styles.nextActionIcon, { backgroundColor: Colors.primaryLight }]}>
            <BookOpen size={20} color={Colors.primary} />
          </View>
          <View style={styles.nextActionText}>
            <Text style={styles.nextActionTitle}>Quick journal</Text>
            <Text style={styles.nextActionDesc}>Write about what you're feeling</Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextActionCard}
          onPress={() => handleNavigate('/(tabs)/companion')}
          activeOpacity={0.7}
          testID="next-companion"
        >
          <View style={[styles.nextActionIcon, { backgroundColor: Colors.brandLilacSoft }]}>
            <Sparkles size={20} color={Colors.brandLilac} />
          </View>
          <View style={styles.nextActionText}>
            <Text style={styles.nextActionTitle}>AI Companion</Text>
            <Text style={styles.nextActionDesc}>Process what happened in a safe space</Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextActionCard}
          onPress={() => handleNavigate('/message-guard')}
          activeOpacity={0.7}
          testID="next-pause"
        >
          <View style={[styles.nextActionIcon, { backgroundColor: Colors.accentLight }]}>
            <Timer size={20} color={Colors.accent} />
          </View>
          <View style={styles.nextActionText}>
            <Text style={styles.nextActionTitle}>Pause before messaging</Text>
            <Text style={styles.nextActionDesc}>Give yourself space before responding</Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleClose}
        activeOpacity={0.7}
        testID="grounding-done"
      >
        <Text style={styles.doneButtonText}>I'm okay for now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
          testID="grounding-close"
        >
          <X size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {phase === 'welcome' && renderWelcome()}
        {phase === 'breathing' && renderBreathing()}
        {phase === 'senses' && renderSenses()}
        {phase === 'settled' && renderSettled()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  centerContent: {
    alignItems: 'center',
  },
  welcomeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(74,139,141,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(74,139,141,0.5)',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500' as const,
  },
  breathCountLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500' as const,
    marginBottom: 40,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  breathCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  breathLabel: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 32,
  },
  breathDots: {
    flexDirection: 'row',
    gap: 8,
  },
  breathDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  breathDotComplete: {
    backgroundColor: Colors.success,
  },
  breathDotActive: {
    backgroundColor: Colors.primary,
  },
  senseProgress: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500' as const,
    marginBottom: 32,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  senseIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  senseInstruction: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 30,
  },
  senseHint: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 36,
  },
  senseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    marginBottom: 32,
  },
  senseButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  senseStepDots: {
    flexDirection: 'row',
    gap: 8,
  },
  senseStepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  settledCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  settledTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  settledSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  nextActions: {
    width: '100%',
    marginBottom: 24,
  },
  nextActionsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500' as const,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  nextActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  nextActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextActionText: {
    flex: 1,
  },
  nextActionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  nextActionDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  doneButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
});
