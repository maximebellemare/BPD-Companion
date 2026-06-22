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
  ArrowRight,
  Check,
  ChevronRight,
  Heart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useApp } from '@/providers/AppProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import {
  isAnyCalmAudioAvailable,
  type CalmAudioCueId,
  type CalmAudioDurationSeconds,
} from '@/services/calm/calmAudioService';
import { saveCalmMeDownSession } from '@/services/calm/calmSessionService';
import type { JournalEntry } from '@/types';

type CalmPhase = 'start' | 'breathe' | 'anchor' | 'pattern' | 'after' | 'complete';
type BreathPhase = 'inhale' | 'hold' | 'exhale';

const BREATH_PHASE_SECONDS: Record<BreathPhase, number> = {
  inhale: 4,
  hold: 2,
  exhale: 8,
};
const BREATH_CYCLE_SECONDS = BREATH_PHASE_SECONDS.inhale + BREATH_PHASE_SECONDS.hold + BREATH_PHASE_SECONDS.exhale;
const CALM_DURATIONS: Array<{ seconds: CalmAudioDurationSeconds; label: string; description: string }> = [
  { seconds: 60, label: '1 min', description: 'Quick reset' },
  { seconds: 120, label: '2 min', description: 'Recommended' },
  { seconds: 300, label: '5 min', description: 'Deeper calm' },
];
const CALM_AUDIO_CUE_ASSETS: Record<CalmAudioCueId, number> = {
  start: require('../assets/audio/calm/start-chime.wav'),
  inhale: require('../assets/audio/calm/inhale-cue.wav'),
  hold: require('../assets/audio/calm/hold-cue.wav'),
  exhale: require('../assets/audio/calm/exhale-cue.wav'),
};

const ANCHORS = [
  'Press your feet into the floor and notice what is holding you up.',
  'Look for one straight line, one soft color, and one object that is not moving.',
  'Place one hand somewhere steady. Let your body know this is this moment, not every moment.',
];

const TRIGGER_SUPPORT: Record<string, string> = {
  relationship: 'Relationship stress can make urgency feel like danger. Right now, your only job is to slow the body down.',
  abandonment: 'Fear of being left can feel immediate and convincing. You do not have to solve the relationship in this exact minute.',
  shame: 'Shame can make your whole self feel like the problem. Right now, we are separating the feeling from who you are.',
  conflict: 'Conflict can keep your nervous system braced for impact. Let your body come down before you decide what to do.',
  default: 'This is a wave. It can be intense without being permanent. We will move through the next two minutes together.',
};

function getIntensityLabel(value: number): string {
  if (value <= 3) return 'A little calmer';
  if (value <= 6) return 'Still activated';
  if (value <= 8) return 'Very intense';
  return 'Overwhelming';
}

function getTopLabel(counts: Record<string, number>): string | null {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function inferSupportKey(entries: JournalEntry[], triggerCounts: Record<string, number>): keyof typeof TRIGGER_SUPPORT {
  const top = getTopLabel(triggerCounts)?.toLowerCase() ?? '';
  const recentText = entries
    .slice(0, 5)
    .flatMap((entry) => [
      ...entry.checkIn.triggers.map((trigger) => trigger.label),
      ...entry.checkIn.emotions.map((emotion) => emotion.label),
      entry.checkIn.notes ?? '',
    ])
    .join(' ')
    .toLowerCase();
  const all = `${top} ${recentText}`;

  if (all.includes('abandon') || all.includes('ignored') || all.includes('delayed reply')) return 'abandonment';
  if (all.includes('shame') || all.includes('ashamed') || all.includes('criticism')) return 'shame';
  if (all.includes('conflict') || all.includes('argue')) return 'conflict';
  if (all.includes('relationship') || all.includes('partner') || all.includes('reply')) return 'relationship';
  return 'default';
}

export default function CalmMeDownScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const { colors } = useAppTheme();
  const { journalEntries, triggerPatterns } = useApp();
  const [phase, setPhase] = useState<CalmPhase>('start');
  const [beforeIntensity, setBeforeIntensity] = useState(8);
  const [afterIntensity, setAfterIntensity] = useState(5);
  const [breathLabel, setBreathLabel] = useState('Breathe in');
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [breathCycle, setBreathCycle] = useState(1);
  const [calmDuration, setCalmDuration] = useState<CalmAudioDurationSeconds>(120);
  const [breathSecondsRemaining, setBreathSecondsRemaining] = useState(120);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const startCuePlayer = useAudioPlayer(CALM_AUDIO_CUE_ASSETS.start, { updateInterval: 1000 });
  const inhaleCuePlayer = useAudioPlayer(CALM_AUDIO_CUE_ASSETS.inhale, { updateInterval: 1000 });
  const holdCuePlayer = useAudioPlayer(CALM_AUDIO_CUE_ASSETS.hold, { updateInterval: 1000 });
  const exhaleCuePlayer = useAudioPlayer(CALM_AUDIO_CUE_ASSETS.exhale, { updateInterval: 1000 });
  const breathScale = useRef(new Animated.Value(0.58)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const totalBreathCycles = useMemo(
    () => Math.max(1, Math.ceil(calmDuration / BREATH_CYCLE_SECONDS)),
    [calmDuration]
  );

  const supportKey = useMemo(
    () => inferSupportKey(journalEntries, triggerPatterns.triggerCounts),
    [journalEntries, triggerPatterns.triggerCounts]
  );
  const topTrigger = useMemo(() => getTopLabel(triggerPatterns.triggerCounts), [triggerPatterns.triggerCounts]);
  const topEmotion = useMemo(() => getTopLabel(triggerPatterns.emotionCounts), [triggerPatterns.emotionCounts]);
  const patternLine = useMemo(() => {
    if (topTrigger && topEmotion) return `${topEmotion} often shows up around ${topTrigger}.`;
    if (topTrigger) return `${topTrigger} has shown up in your recent check-ins.`;
    if (topEmotion) return `${topEmotion} has shown up in your recent check-ins.`;
    return 'I will personalize this more as you check in and reflect.';
  }, [topEmotion, topTrigger]);

  useEffect(() => {
    trackEvent('calm_me_down_opened');
    const available = isAnyCalmAudioAvailable();
    setAudioAvailable(available);
    setAudioEnabled(available);
    if (available) {
      void setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      }).catch(() => {
        setAudioAvailable(false);
        setAudioEnabled(false);
      });
    }
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fadeAnim, trackEvent]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const haptic = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(style);
  }, []);

  const playAudioCue = useCallback(async (cue: CalmAudioCueId) => {
    if (!audioAvailable || !audioEnabled) return;
    const player =
      cue === 'start' ? startCuePlayer :
      cue === 'inhale' ? inhaleCuePlayer :
      cue === 'hold' ? holdCuePlayer :
      exhaleCuePlayer;
    try {
      player.pause();
      await player.seekTo(0);
      player.play();
    } catch {
      setAudioAvailable(false);
      setAudioEnabled(false);
    }
  }, [audioAvailable, audioEnabled, exhaleCuePlayer, holdCuePlayer, inhaleCuePlayer, startCuePlayer]);

  const clearBreathingTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const cuePhase = useCallback((nextPhase: BreathPhase) => {
    setBreathPhase(nextPhase);
    if (nextPhase === 'inhale') setBreathLabel('Inhale');
    if (nextPhase === 'hold') setBreathLabel('Hold');
    if (nextPhase === 'exhale') setBreathLabel('Exhale');
    haptic(nextPhase === 'exhale' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    void playAudioCue(nextPhase);
  }, [haptic, playAudioCue]);

  const runBreathing = useCallback((cycle: number) => {
    if (cycle > totalBreathCycles) {
      clearBreathingTimers();
      setPhase('anchor');
      return;
    }

    setBreathCycle(cycle);
    cuePhase('inhale');
    Animated.timing(breathScale, { toValue: 1, duration: 4000, useNativeDriver: true }).start();

    timerRef.current = setTimeout(() => {
      cuePhase('hold');
      timerRef.current = setTimeout(() => {
        cuePhase('exhale');
        Animated.timing(breathScale, { toValue: 0.58, duration: 8000, useNativeDriver: true }).start();
        timerRef.current = setTimeout(() => runBreathing(cycle + 1), 8000);
      }, 2000);
    }, 4000);
  }, [breathScale, clearBreathingTimers, cuePhase, totalBreathCycles]);

  const startFlow = useCallback(() => {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    clearBreathingTimers();
    setBreathSecondsRemaining(calmDuration);
    startedAtRef.current = Date.now();
    void playAudioCue('start');
    trackEvent('calm_me_down_started', {
      before_intensity: beforeIntensity,
      duration_seconds: calmDuration,
      guided_audio_available: audioAvailable && audioEnabled,
    });
    setPhase('breathe');
    countdownRef.current = setInterval(() => {
      setBreathSecondsRemaining((remaining) => {
        if (remaining <= 1) {
          clearBreathingTimers();
          setPhase('anchor');
          return 0;
        }
        return remaining - 1;
      });
    }, 1000);
    runBreathing(1);
  }, [audioAvailable, audioEnabled, beforeIntensity, calmDuration, clearBreathingTimers, haptic, playAudioCue, runBreathing, trackEvent]);

  const goNext = useCallback((next: CalmPhase) => {
    haptic();
    if (phase === 'breathe') clearBreathingTimers();
    setPhase(next);
  }, [clearBreathingTimers, haptic, phase]);

  const finish = useCallback(async () => {
    const completedAt = Date.now();
    const durationCompletedSeconds = Math.max(
      0,
      Math.round((completedAt - (startedAtRef.current ?? completedAt)) / 1000),
    );
    try {
      await saveCalmMeDownSession({
        id: `calm_${completedAt}`,
        timestamp: completedAt,
        beforeIntensity,
        afterIntensity,
        durationCompletedSeconds,
        triggerLabel: topTrigger,
        emotionLabel: topEmotion,
      });
    } catch (error) {
      console.log('[CalmMeDown] Failed to save session:', error);
    }
    trackEvent('calm_me_down_completed', {
      before_intensity: beforeIntensity,
      after_intensity: afterIntensity,
      shift: beforeIntensity - afterIntensity,
      duration_completed_seconds: durationCompletedSeconds,
      trigger: topTrigger ?? 'unknown',
      emotion: topEmotion ?? 'unknown',
      support_key: supportKey,
    });
    setPhase('complete');
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [afterIntensity, beforeIntensity, supportKey, topEmotion, topTrigger, trackEvent]);

  const close = useCallback(() => {
    clearBreathingTimers();
    router.back();
  }, [clearBreathingTimers, router]);

  const formatRemaining = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${rest.toString().padStart(2, '0')}`;
  }, []);

  const IntensitySelector = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => (
    <View style={styles.scaleGrid}>
      {Array.from({ length: 10 }).map((_, index) => {
        const score = index + 1;
        const selected = score === value;
        return (
          <TouchableOpacity
            key={score}
            style={[
              styles.scaleButton,
              {
                backgroundColor: selected ? colors.primary : colors.card,
                borderColor: selected ? colors.primary : colors.borderLight,
              },
            ]}
            onPress={() => {
              haptic();
              onChange(score);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.scaleText, { color: selected ? colors.white : colors.text }]}>{score}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStart = () => (
    <Animated.View style={[styles.card, { opacity: fadeAnim, backgroundColor: colors.card, borderColor: colors.borderLight, shadowColor: colors.shadow }]}>
      <View style={[styles.iconBubble, { backgroundColor: colors.brandTealSoft }]}>
        <Heart size={28} color={colors.brandTeal} />
      </View>
      <Text style={[styles.kicker, { color: colors.brandTeal }]}>1, 2, or 5 minute reset</Text>
      <Text style={[styles.title, { color: colors.text }]}>Calm Me Down</Text>
      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
        We will slow your breathing, anchor your senses, and name what may be driving the urgency.
      </Text>

      <View style={styles.supportList}>
        {[
          'Guided breathing',
          'Guided grounding',
          'Calm Me Down flow',
        ].map(item => (
          <View key={item} style={[styles.supportItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Check size={14} color={colors.brandTeal} />
            <Text style={[styles.supportItemText, { color: colors.text }]}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.miniCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose your length</Text>
        <View style={styles.durationGrid}>
          {CALM_DURATIONS.map((duration) => {
            const selected = calmDuration === duration.seconds;
            return (
              <TouchableOpacity
                key={duration.seconds}
                style={[
                  styles.durationButton,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.borderLight,
                  },
                ]}
                onPress={() => {
                  haptic();
                  setCalmDuration(duration.seconds);
                  setBreathSecondsRemaining(duration.seconds);
                }}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${duration.label} Calm Me Down session, ${duration.description}`}
                accessibilityState={{ selected }}
              >
                <Text style={[styles.durationLabel, { color: selected ? colors.white : colors.text }]}>
                  {duration.label}
                </Text>
                <Text style={[styles.durationDescription, { color: selected ? colors.white : colors.textSecondary }]}>
                  {duration.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {audioAvailable && (
          <TouchableOpacity
            style={[
              styles.audioToggle,
              {
                backgroundColor: audioEnabled ? colors.primaryLight : colors.card,
                borderColor: audioEnabled ? colors.primary : colors.borderLight,
              },
            ]}
            onPress={() => {
              haptic();
              setAudioEnabled((enabled) => !enabled);
            }}
            activeOpacity={0.82}
            testID="calm-audio-toggle"
            accessibilityRole="button"
            accessibilityLabel={`Audio cues are ${audioEnabled ? 'on' : 'off'}`}
            accessibilityState={{ selected: audioEnabled }}
          >
            {audioEnabled ? (
              <Volume2 size={18} color={colors.primary} />
            ) : (
              <VolumeX size={18} color={colors.textMuted} />
            )}
            <View style={styles.audioToggleTextBlock}>
              <Text style={[styles.audioToggleTitle, { color: audioEnabled ? colors.primary : colors.text }]}>
                Audio cues {audioEnabled ? 'on' : 'off'}
              </Text>
              <Text style={[styles.audioNote, { color: colors.textSecondary }]}>
                Chimes guide inhale, hold, and exhale so you can close your eyes.
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.miniCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>How intense is it right now?</Text>
        <Text style={[styles.intensityLabel, { color: colors.textSecondary }]}>{beforeIntensity}/10 · {getIntensityLabel(beforeIntensity)}</Text>
        <IntensitySelector value={beforeIntensity} onChange={setBeforeIntensity} />
      </View>

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={startFlow} activeOpacity={0.85}>
        <Text style={[styles.primaryButtonText, { color: colors.white }]}>Start Calm Me Down</Text>
        <ArrowRight size={18} color={colors.white} />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBreathing = () => (
    <View style={styles.centerStage}>
      <Text style={[styles.kicker, { color: colors.brandTeal }]}>Step 1 of 4 · breathe</Text>
      <Animated.View
        style={[
          styles.breathCircle,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            transform: [{ scale: breathScale }],
          },
        ]}
      >
        <Wind size={44} color={colors.white} />
      </Animated.View>
      <Text style={[styles.breathLabel, { color: colors.text }]}>{breathLabel}</Text>
      <Text style={[styles.breathTimer, { color: colors.primary }]}>
        {formatRemaining(breathSecondsRemaining)}
      </Text>
      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
        Cycle {Math.min(breathCycle, totalBreathCycles)} of {totalBreathCycles}. {breathPhase === 'exhale' ? 'Let the exhale be slow and complete.' : 'Follow the cue and keep it gentle.'}
      </Text>
      <View style={styles.progressRow}>
        {Array.from({ length: totalBreathCycles }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: index + 1 <= breathCycle ? colors.brandTeal : colors.borderLight,
              },
            ]}
          />
        ))}
      </View>
      <TouchableOpacity style={styles.textButton} onPress={() => goNext('anchor')}>
        <Text style={[styles.textButtonText, { color: colors.primary }]}>Skip breathing</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAnchor = () => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight, shadowColor: colors.shadow }]}>
      <View style={[styles.iconBubble, { backgroundColor: colors.primaryLight }]}>
        <ShieldCheck size={28} color={colors.primary} />
      </View>
      <Text style={[styles.kicker, { color: colors.brandTeal }]}>Step 2 of 4 · anchor</Text>
      <Text style={[styles.title, { color: colors.text }]}>Come back to right now</Text>
      {ANCHORS.map((anchor, index) => (
        <View key={anchor} style={[styles.anchorRow, { borderColor: colors.borderLight }]}>
          <Text style={[styles.anchorNumber, { color: colors.brandTeal }]}>{index + 1}</Text>
          <Text style={[styles.anchorText, { color: colors.text }]}>{anchor}</Text>
        </View>
      ))}
      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => goNext('pattern')}>
        <Text style={[styles.primaryButtonText, { color: colors.white }]}>I did this</Text>
        <ChevronRight size={18} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderPattern = () => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight, shadowColor: colors.shadow }]}>
      <View style={[styles.iconBubble, { backgroundColor: colors.brandTealSoft }]}>
        <Sparkles size={28} color={colors.brandTeal} />
      </View>
      <Text style={[styles.kicker, { color: colors.brandTeal }]}>Step 3 of 4 · personalize</Text>
      <Text style={[styles.title, { color: colors.text }]}>Name the wave without obeying it</Text>
      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
        {TRIGGER_SUPPORT[supportKey]}
      </Text>
      <View style={[styles.patternCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.patternLabel, { color: colors.textSecondary }]}>Based on your entries</Text>
        <Text style={[styles.patternText, { color: colors.text }]}>{patternLine}</Text>
      </View>
      <View style={[styles.statementCard, { backgroundColor: colors.primaryLight, borderColor: colors.borderLight }]}>
        <Text style={[styles.statementText, { color: colors.primary }]}>
          “I can feel this strongly and still wait before I act.”
        </Text>
      </View>
      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => goNext('after')}>
        <Text style={[styles.primaryButtonText, { color: colors.white }]}>Check my intensity</Text>
        <ChevronRight size={18} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderAfter = () => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight, shadowColor: colors.shadow }]}>
      <View style={[styles.iconBubble, { backgroundColor: colors.successLight }]}>
        <Check size={28} color={colors.success} />
      </View>
      <Text style={[styles.kicker, { color: colors.brandTeal }]}>Step 4 of 4 · after</Text>
      <Text style={[styles.title, { color: colors.text }]}>Where is your intensity now?</Text>
      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
        You do not need to be perfectly calm. A one-point shift still counts.
      </Text>
      <Text style={[styles.intensityLabel, { color: colors.textSecondary }]}>{afterIntensity}/10 · {getIntensityLabel(afterIntensity)}</Text>
      <IntensitySelector value={afterIntensity} onChange={setAfterIntensity} />
      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={finish}>
        <Text style={[styles.primaryButtonText, { color: colors.white }]}>Finish</Text>
        <Check size={18} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderComplete = () => {
    const shift = beforeIntensity - afterIntensity;
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight, shadowColor: colors.shadow }]}>
        <View style={[styles.iconBubble, { backgroundColor: colors.successLight }]}>
          <Heart size={28} color={colors.success} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {shift > 0 ? `You came down ${shift} point${shift === 1 ? '' : 's'}.` : 'You stayed with the moment.'}
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          That is the practice: slow the body, name the wave, choose the next step from a steadier place.
        </Text>
        <View style={styles.nextActions}>
          <TouchableOpacity style={[styles.nextCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={() => router.push('/(tabs)/companion' as never)}>
            <MessageCircle size={20} color={colors.primary} />
            <View style={styles.nextText}>
              <Text style={[styles.nextTitle, { color: colors.text }]}>Talk it through</Text>
              <Text style={[styles.nextBody, { color: colors.textSecondary }]}>Let Companion help you decide what to do next.</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.nextCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={() => router.push('/dont-send-it' as never)}>
            <ShieldCheck size={20} color={colors.brandTeal} />
            <View style={styles.nextText}>
              <Text style={[styles.nextTitle, { color: colors.text }]}>Do not send it yet</Text>
              <Text style={[styles.nextBody, { color: colors.textSecondary }]}>Check a message before reacting.</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.borderLight }]} onPress={close}>
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>I’m okay for now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Calm Me Down</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Choose a short reset</Text>
        </View>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]} onPress={close}>
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {phase === 'start' && renderStart()}
        {phase === 'breathe' && renderBreathing()}
        {phase === 'anchor' && renderAnchor()}
        {phase === 'pattern' && renderPattern()}
        {phase === 'after' && renderAfter()}
        {phase === 'complete' && renderComplete()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  iconBubble: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0,
    marginBottom: 8,
  },
  title: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900' as const,
    letterSpacing: 0,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 18,
  },
  miniCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  intensityLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  scaleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scaleButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleText: {
    fontSize: 15,
    fontWeight: '800' as const,
  },
  durationGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    minHeight: 68,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '900' as const,
    marginBottom: 3,
  },
  durationDescription: {
    fontSize: 11,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  audioToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 12,
  },
  audioToggleTextBlock: {
    flex: 1,
  },
  audioToggleTitle: {
    fontSize: 14,
    fontWeight: '900' as const,
    marginBottom: 2,
  },
  audioNote: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700' as const,
  },
  supportList: {
    gap: 8,
    marginBottom: 14,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 9,
  },
  supportItemText: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '900' as const,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '800' as const,
  },
  breathCircle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 34,
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  breathLabel: {
    fontSize: 29,
    fontWeight: '900' as const,
    marginBottom: 10,
  },
  breathTimer: {
    fontSize: 18,
    fontWeight: '900' as const,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
    maxWidth: 240,
  },
  progressDot: {
    width: 26,
    height: 6,
    borderRadius: 3,
  },
  textButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  textButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  anchorRow: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  anchorNumber: {
    fontSize: 17,
    fontWeight: '900' as const,
  },
  anchorText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600' as const,
  },
  patternCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
  },
  patternLabel: {
    fontSize: 12,
    fontWeight: '800' as const,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
  },
  patternText: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700' as const,
  },
  statementCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginBottom: 18,
  },
  statementText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '900' as const,
  },
  nextActions: {
    gap: 10,
    marginTop: 4,
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  nextText: {
    flex: 1,
  },
  nextTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    marginBottom: 2,
  },
  nextBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
