import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CheckCircle,
  XCircle,
  Minus,
  Sparkles,
  BookOpen,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useEmotionalContext, OutcomeRecord } from '@/providers/EmotionalContextProvider';

interface Props {
  draftId?: string | null;
  onComplete?: () => void;
  showReflectionLinks?: boolean;
}

type OutcomeChoice = 'helped' | 'made_worse' | 'neutral' | 'not_sent';

const OUTCOME_OPTIONS: { id: OutcomeChoice; label: string; emoji: string; color: string }[] = [
  { id: 'helped', label: 'It helped', emoji: '✓', color: Colors.success },
  { id: 'neutral', label: 'Neutral', emoji: '—', color: Colors.textMuted },
  { id: 'made_worse', label: 'Made things harder', emoji: '✗', color: '#E17055' },
  { id: 'not_sent', label: "Didn't send it", emoji: '⏸', color: Colors.accent },
];

export default function PostActionReflection({
  draftId = null,
  onComplete,
  showReflectionLinks = true,
}: Props) {
  const router = useRouter();
  const { recordOutcome, journeyPhase, advanceJourney } = useEmotionalContext();
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeChoice | null>(null);
  const [recorded, setRecorded] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleOutcome = useCallback((outcome: OutcomeChoice) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedOutcome(outcome);

    const record: OutcomeRecord = {
      id: `outcome_${Date.now()}`,
      timestamp: Date.now(),
      draftId,
      outcome,
      notes: '',
      journeyPhaseCompleted: journeyPhase,
    };
    recordOutcome(record);
    setRecorded(true);
    advanceJourney('reflecting');

    Animated.spring(checkAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();

    console.log('[PostActionReflection] Outcome recorded:', outcome);
  }, [draftId, journeyPhase, recordOutcome, advanceJourney, checkAnim]);

  const handleReflect = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(tabs)/companion');
    onComplete?.();
  }, [router, onComplete]);

  const handleWeeklyReflection = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/weekly-reflection');
    onComplete?.();
  }, [router, onComplete]);

  const handleDone = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    advanceJourney(null);
    onComplete?.();
  }, [advanceJourney, onComplete]);

  const getOutcomeIcon = (id: OutcomeChoice) => {
    switch (id) {
      case 'helped': return <CheckCircle size={16} color={Colors.success} />;
      case 'made_worse': return <XCircle size={16} color="#E17055" />;
      case 'not_sent': return <Minus size={16} color={Colors.accent} />;
      default: return <Minus size={16} color={Colors.textMuted} />;
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {!recorded ? (
        <View style={styles.outcomeSection}>
          <Text style={styles.title}>How did that go?</Text>
          <Text style={styles.subtitle}>
            Recording outcomes helps the app learn what works for you.
          </Text>

          <View style={styles.outcomeGrid}>
            {OUTCOME_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.outcomeCard,
                  selectedOutcome === opt.id && { borderColor: opt.color, backgroundColor: opt.color + '08' },
                ]}
                onPress={() => handleOutcome(opt.id)}
                activeOpacity={0.7}
                testID={`outcome-${opt.id}`}
              >
                {getOutcomeIcon(opt.id)}
                <Text style={[
                  styles.outcomeLabel,
                  selectedOutcome === opt.id && { color: opt.color, fontWeight: '600' as const },
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.recordedSection}>
          <Animated.View style={[
            styles.checkCircle,
            { transform: [{ scale: checkAnim }] },
          ]}>
            <CheckCircle size={28} color={Colors.success} />
          </Animated.View>
          <Text style={styles.recordedTitle}>Recorded</Text>
          <Text style={styles.recordedSubtitle}>
            {selectedOutcome === 'helped'
              ? "That's a sign of growth. Notice what worked."
              : selectedOutcome === 'made_worse'
                ? "It's okay. Every experience teaches something."
                : selectedOutcome === 'not_sent'
                  ? 'Not sending can be its own form of strength.'
                  : 'Awareness of the outcome matters.'}
          </Text>

          {showReflectionLinks && (
            <View style={styles.nextSteps}>
              <TouchableOpacity
                style={styles.reflectButton}
                onPress={handleReflect}
                activeOpacity={0.7}
                testID="reflect-with-ai"
              >
                <Sparkles size={16} color={Colors.white} />
                <Text style={styles.reflectButtonText}>Talk it through with AI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleWeeklyReflection}
                activeOpacity={0.7}
              >
                <BookOpen size={15} color={Colors.primary} />
                <Text style={styles.linkButtonText}>Save for weekly reflection</Text>
                <ChevronRight size={14} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleDone}
                activeOpacity={0.7}
                testID="post-action-done"
              >
                <Text style={styles.doneButtonText}>I'm good for now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  outcomeSection: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  outcomeGrid: {
    gap: 8,
  },
  outcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  outcomeLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  recordedSection: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.successLight,
  },
  checkCircle: {
    marginBottom: 12,
  },
  recordedTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  recordedSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
    maxWidth: 280,
    fontStyle: 'italic',
  },
  nextSteps: {
    width: '100%',
    gap: 10,
  },
  reflectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  reflectButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  linkButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
});
