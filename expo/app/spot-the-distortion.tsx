import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Brain, Check, ChevronRight, Eye, Sparkles, Target, Trophy, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { trackEvent } from '@/services/analytics/analyticsService';
import {
  CognitiveDistortion,
  DISTORTION_DESCRIPTIONS,
  DISTORTION_DIFFICULTY_LABELS,
  DISTORTION_LABELS,
  DistortionDifficulty,
  SPOT_DISTORTION_EXAMPLES,
  SpotDistortionExample,
  SpotDistortionProgress,
  getSpotDistortionProgress,
  submitSpotDistortionAnswer,
} from '@/services/games/spotTheDistortionService';

const DIFFICULTIES = Object.keys(DISTORTION_DIFFICULTY_LABELS) as DistortionDifficulty[];
const OPTIONS = Object.keys(DISTORTION_LABELS) as CognitiveDistortion[];

function accuracyLabel(progress: SpotDistortionProgress | null): string {
  if (!progress || progress.totalAttempts === 0) return '0%';
  return `${Math.round((progress.totalCorrect / progress.totalAttempts) * 100)}%`;
}

export default function SpotTheDistortionScreen() {
  useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [progress, setProgress] = useState<SpotDistortionProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<DistortionDifficulty>('beginner');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [selected, setSelected] = useState<CognitiveDistortion | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);

  const examples = useMemo(
    () => SPOT_DISTORTION_EXAMPLES.filter(item => item.difficulty === difficulty),
    [difficulty],
  );
  const example: SpotDistortionExample = examples[exampleIndex % Math.max(1, examples.length)] ?? SPOT_DISTORTION_EXAMPLES[0];

  useEffect(() => {
    let mounted = true;
    getSpotDistortionProgress()
      .then(next => {
        if (mounted) setProgress(next);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    void trackEvent('screen_view', { screen: 'spot_the_distortion' });
    return () => {
      mounted = false;
    };
  }, []);

  const resetRound = useCallback((nextDifficulty = difficulty, nextIndex = exampleIndex) => {
    setDifficulty(nextDifficulty);
    setExampleIndex(nextIndex);
    setSelected(null);
    setSubmitted(false);
    setWasCorrect(null);
  }, [difficulty, exampleIndex]);

  const chooseDifficulty = useCallback((next: DistortionDifficulty) => {
    resetRound(next, 0);
  }, [resetRound]);

  const chooseOption = useCallback((option: CognitiveDistortion) => {
    if (submitted) return;
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setSelected(option);
  }, [submitted]);

  const submit = useCallback(async () => {
    if (!selected || submitted) return;
    const { progress: nextProgress, correct } = await submitSpotDistortionAnswer(example, selected);
    setProgress(nextProgress);
    setSubmitted(true);
    setWasCorrect(correct);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    }
    void trackEvent('spot_distortion_answered', {
      example_id: example.id,
      difficulty,
      answer: example.answer,
      selected,
      correct,
    });
  }, [difficulty, example, selected, submitted]);

  const nextExample = useCallback(() => {
    resetRound(difficulty, (exampleIndex + 1) % examples.length);
  }, [difficulty, exampleIndex, examples.length, resetRound]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.brandTeal} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
            onPress={() => router.back()}
            activeOpacity={0.75}
            testID="spot-distortion-back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>Spot The Distortion</Text>
            <Text style={[styles.title, { color: colors.text }]}>Catch the thought trap</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Practice noticing the difference between a feeling, a fear, and a thought pattern.
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Target size={16} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{accuracyLabel(progress)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Accuracy</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Trophy size={16} color={colors.brandTeal} />
            <Text style={[styles.statValue, { color: colors.text }]}>{progress?.masteredDistortions.length ?? 0}/4</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Mastered</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Sparkles size={16} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{progress?.currentStreak ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
          </View>
        </View>

        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map(item => {
            const active = item === difficulty;
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.difficultyChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.borderLight,
                  },
                ]}
                onPress={() => chooseDifficulty(item)}
                activeOpacity={0.78}
                testID={`spot-distortion-difficulty-${item}`}
              >
                <Text style={[styles.difficultyText, { color: active ? Colors.white : colors.textSecondary }]}>
                  {DISTORTION_DIFFICULTY_LABELS[item]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.scenarioCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={[styles.scenarioIcon, { backgroundColor: colors.primaryLight }]}>
            <Eye size={22} color={colors.primary} />
          </View>
          <Text style={[styles.scenarioLabel, { color: colors.brandTeal }]}>Scenario</Text>
          <Text style={[styles.scenarioText, { color: colors.text }]}>{example.scenario}</Text>
          <View style={[styles.thoughtBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.thoughtLabel, { color: colors.textSecondary }]}>Thought</Text>
            <Text style={[styles.thoughtText, { color: colors.text }]}>“{example.thought}”</Text>
          </View>
        </View>

        <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.question, { color: colors.text }]}>Which distortion is present?</Text>
          <View style={styles.optionList}>
            {OPTIONS.map(option => {
              const active = selected === option;
              const correct = submitted && option === example.answer;
              const wrong = submitted && active && !correct;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: correct
                        ? colors.successLight
                        : wrong
                          ? colors.dangerLight
                          : active
                            ? colors.primaryLight
                            : colors.surface,
                      borderColor: correct
                        ? colors.success
                        : wrong
                          ? colors.danger
                          : active
                            ? colors.primary
                            : colors.borderLight,
                    },
                  ]}
                  onPress={() => chooseOption(option)}
                  activeOpacity={0.78}
                  testID={`spot-distortion-option-${option}`}
                >
                  <View style={[styles.optionIcon, { backgroundColor: colors.card }]}>
                    <Brain size={15} color={correct ? colors.success : wrong ? colors.danger : colors.primary} />
                  </View>
                  <View style={styles.optionTextWrap}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>{DISTORTION_LABELS[option]}</Text>
                    <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{DISTORTION_DESCRIPTIONS[option]}</Text>
                  </View>
                  {correct ? <Check size={17} color={colors.success} /> : null}
                  {wrong ? <X size={17} color={colors.danger} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {!submitted ? (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: selected ? colors.primary : colors.border }]}
            onPress={submit}
            disabled={!selected}
            activeOpacity={0.86}
            testID="spot-distortion-submit"
          >
            <Text style={styles.submitText}>Check answer</Text>
            <ChevronRight size={18} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.feedbackWrap}>
            <View style={[styles.feedbackCard, { backgroundColor: colors.card, borderColor: wasCorrect ? colors.success : colors.borderLight }]}>
              <Text style={[styles.feedbackTitle, { color: colors.text }]}>
                {wasCorrect ? 'Correct' : `This is ${DISTORTION_LABELS[example.answer]}`}
              </Text>
              <Text style={[styles.feedbackBody, { color: colors.textSecondary }]}>{example.explanation}</Text>
            </View>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={nextExample}
              activeOpacity={0.86}
              testID="spot-distortion-next"
            >
              <Text style={styles.submitText}>{localizedText('Next example', 'Siguiente ejemplo')}</Text>
              <ChevronRight size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.masteryCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.masteryTitle, { color: colors.text }]}>Mastery</Text>
          {OPTIONS.map(option => {
            const attempts = progress?.attemptsByDistortion[option] ?? 0;
            const correct = progress?.correctByDistortion[option] ?? 0;
            const percent = attempts ? Math.round((correct / attempts) * 100) : 0;
            const mastered = progress?.masteredDistortions.includes(option) ?? false;
            return (
              <View key={option} style={styles.masteryRow}>
                <Text style={[styles.masteryName, { color: colors.text }]}>{DISTORTION_LABELS[option]}</Text>
                <Text style={[styles.masteryMeta, { color: mastered ? colors.success : colors.textSecondary }]}>
                  {attempts < 5 ? `${correct}/${attempts} correct` : `${percent}%${mastered ? ' mastered' : ''}`}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: { flex: 1 },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 7,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  difficultyChip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '900',
  },
  scenarioCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  scenarioIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scenarioLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  scenarioText: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    marginBottom: 12,
  },
  thoughtBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  thoughtLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  thoughtText: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '900',
  },
  questionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },
  question: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
  },
  optionList: { gap: 8 },
  optionButton: {
    minHeight: 66,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: { flex: 1 },
  optionTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 3,
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  submitText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  feedbackWrap: { gap: 0 },
  feedbackCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 6,
  },
  feedbackBody: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  masteryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
  },
  masteryTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  masteryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
  },
  masteryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  masteryMeta: {
    fontSize: 13,
    fontWeight: '900',
  },
});
