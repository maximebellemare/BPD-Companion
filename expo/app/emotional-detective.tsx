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
import { ArrowLeft, Check, ChevronRight, Search, Sparkles, Target, Trophy, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppTheme } from '@/providers/ThemeProvider';
import { trackEvent } from '@/services/analytics/analyticsService';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';
import {
  DETECTIVE_DIFFICULTY_LABELS,
  DETECTIVE_STEP_LABELS,
  EMOTIONAL_DETECTIVE_SCENARIOS,
  EmotionalDetectiveDifficulty,
  EmotionalDetectiveProgress,
  EmotionalDetectiveScenario,
  EmotionalDetectiveStep,
  getEmotionalDetectiveProgress,
  submitEmotionalDetectiveAttempt,
} from '@/services/games/emotionalDetectiveService';

const STEPS = Object.keys(DETECTIVE_STEP_LABELS) as EmotionalDetectiveStep[];
const DIFFICULTIES = Object.keys(DETECTIVE_DIFFICULTY_LABELS) as EmotionalDetectiveDifficulty[];

function accuracyLabel(progress: EmotionalDetectiveProgress | null): string {
  if (!progress || progress.totalAnsweredSteps === 0) return '0%';
  return `${Math.round((progress.totalCorrectSteps / progress.totalAnsweredSteps) * 100)}%`;
}

export default function EmotionalDetectiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  useLanguage();
  const [progress, setProgress] = useState<EmotionalDetectiveProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<EmotionalDetectiveDifficulty>('beginner');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selections, setSelections] = useState<Record<EmotionalDetectiveStep, string | null>>({
    trigger: null,
    emotion: null,
    fear: null,
    urge: null,
    action: null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const scenarios = useMemo(
    () => EMOTIONAL_DETECTIVE_SCENARIOS.filter(item => item.difficulty === difficulty),
    [difficulty],
  );
  const scenario: EmotionalDetectiveScenario = scenarios[scenarioIndex % Math.max(1, scenarios.length)] ?? EMOTIONAL_DETECTIVE_SCENARIOS[0];
  const canSubmit = STEPS.every(step => selections[step]);

  useEffect(() => {
    let mounted = true;
    getEmotionalDetectiveProgress()
      .then(next => {
        if (mounted) setProgress(next);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    void trackEvent('screen_view', { screen: 'emotional_detective' });
    return () => {
      mounted = false;
    };
  }, []);

  const resetRound = useCallback((nextDifficulty = difficulty, nextIndex = scenarioIndex) => {
    setDifficulty(nextDifficulty);
    setScenarioIndex(nextIndex);
    setSelections({
      trigger: null,
      emotion: null,
      fear: null,
      urge: null,
      action: null,
    });
    setSubmitted(false);
    setAccuracy(null);
  }, [difficulty, scenarioIndex]);

  const selectDifficulty = useCallback((next: EmotionalDetectiveDifficulty) => {
    resetRound(next, 0);
  }, [resetRound]);

  const selectChoice = useCallback((step: EmotionalDetectiveStep, choiceId: string) => {
    if (submitted) return;
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setSelections(prev => ({ ...prev, [step]: choiceId }));
  }, [submitted]);

  const submit = useCallback(async () => {
    if (!canSubmit || submitted) return;
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const { progress: nextProgress, result } = await submitEmotionalDetectiveAttempt(scenario, selections);
    setProgress(nextProgress);
    setAccuracy(result.accuracy);
    setSubmitted(true);
    void trackEvent('emotional_detective_completed', {
      scenario_id: scenario.id,
      difficulty,
      accuracy: result.accuracy,
    });
  }, [canSubmit, difficulty, scenario, selections, submitted]);

  const nextScenario = useCallback(() => {
    resetRound(difficulty, (scenarioIndex + 1) % scenarios.length);
  }, [difficulty, resetRound, scenarioIndex, scenarios.length]);

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
            testID="emotional-detective-back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>{localizedText('Emotional Detective', 'Detective emocional')}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{localizedText('Find the emotional chain', 'Encuentra la cadena emocional')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {localizedText(
                'Learn how a moment turns into an emotion, fear, urge, action, and outcome.',
                'Aprende cómo un momento se convierte en emoción, miedo, impulso, acción y resultado.',
              )}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Target size={16} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{accuracyLabel(progress)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{localizedText('Awareness', 'Conciencia')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Trophy size={16} color={colors.brandTeal} />
            <Text style={[styles.statValue, { color: colors.text }]}>{progress?.completedScenarioIds.length ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{localizedText('Completed', 'Completados')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Sparkles size={16} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{progress?.currentStreak ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{localizedText('Streak', 'Racha')}</Text>
          </View>
        </View>

        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map(item => {
            const selected = item === difficulty;
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.difficultyChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.borderLight,
                  },
                ]}
                onPress={() => selectDifficulty(item)}
                activeOpacity={0.78}
                testID={`emotional-detective-difficulty-${item}`}
              >
                <Text style={[styles.difficultyText, { color: selected ? Colors.white : colors.textSecondary }]}>
                  {DETECTIVE_DIFFICULTY_LABELS[item]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.scenarioCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={[styles.scenarioIcon, { backgroundColor: colors.primaryLight }]}>
            <Search size={22} color={colors.primary} />
          </View>
          <Text style={[styles.scenarioLabel, { color: colors.brandTeal }]}>{localizedText('Scenario', 'Escenario')}</Text>
          <Text style={[styles.scenarioText, { color: colors.text }]}>{scenario.scenario}</Text>
          <Text style={[styles.scenarioContext, { color: colors.textSecondary }]}>{scenario.context}</Text>
        </View>

        {STEPS.map(step => (
          <View key={step} style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              {STEPS.indexOf(step) + 1}. {step === 'emotion'
                ? localizedText('Choose the emotion that feels most central', 'Elige la emoción que se siente más central')
                : localizedText(`Identify the ${DETECTIVE_STEP_LABELS[step].toLowerCase()}`, `Identifica: ${DETECTIVE_STEP_LABELS[step].toLowerCase()}`)}
            </Text>
            {step === 'emotion' ? (
              <Text style={[styles.stepHint, { color: colors.textSecondary }]}>
                {localizedText(
                  'More than one emotion can be plausible. The goal is awareness, not guessing a trick answer.',
                  'Más de una emoción puede ser plausible. La meta es tomar conciencia, no adivinar una respuesta tramposa.',
                )}
              </Text>
            ) : null}
            <View style={styles.choiceList}>
              {scenario.choices[step].map(choice => {
                const selected = selections[step] === choice.id;
                const acceptedAnswers = scenario.acceptableAnswers?.[step] ?? [scenario.answers[step]];
                const isPrimary = submitted && scenario.answers[step] === choice.id;
                const isAccepted = submitted && acceptedAnswers.includes(choice.id);
                const isWrong = submitted && selected && !isAccepted;
                return (
                  <TouchableOpacity
                    key={choice.id}
                    style={[
                      styles.choiceButton,
                      {
                        backgroundColor: isPrimary
                          ? colors.successLight
                          : isAccepted
                            ? colors.primaryLight
                          : isWrong
                            ? colors.dangerLight
                            : selected
                              ? colors.primaryLight
                              : colors.surface,
                        borderColor: isPrimary
                          ? colors.success
                          : isAccepted
                            ? colors.primary
                          : isWrong
                            ? colors.danger
                            : selected
                              ? colors.primary
                              : colors.borderLight,
                      },
                    ]}
                    onPress={() => selectChoice(step, choice.id)}
                    activeOpacity={0.78}
                    testID={`emotional-detective-${step}-${choice.id}`}
                  >
                    <View style={styles.choiceCopy}>
                      <Text style={[styles.choiceText, { color: colors.text }]}>{choice.text}</Text>
                      {step === 'emotion' && isPrimary ? (
                        <Text style={[styles.choiceNote, { color: colors.success }]}>{localizedText('Primary emotion', 'Emoción principal')}</Text>
                      ) : null}
                      {step === 'emotion' && isAccepted && !isPrimary ? (
                        <Text style={[styles.choiceNote, { color: colors.primary }]}>{localizedText('Also common here', 'También común aquí')}</Text>
                      ) : null}
                    </View>
                    {isPrimary || isAccepted ? <Check size={17} color={isPrimary ? colors.success : colors.primary} /> : null}
                    {isWrong ? <X size={17} color={colors.danger} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {!submitted ? (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: canSubmit ? colors.primary : colors.border }]}
            onPress={submit}
            disabled={!canSubmit}
            activeOpacity={0.86}
            testID="emotional-detective-submit"
          >
            <Text style={styles.submitText}>{localizedText('Reveal the chain', 'Revelar la cadena')}</Text>
            <ChevronRight size={18} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.revealWrap}>
            <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>{localizedText(`You mapped ${accuracy}% of the chain`, `Mapeaste el ${accuracy}% de la cadena`)}</Text>
              <Text style={[styles.resultBody, { color: colors.textSecondary }]}>{scenario.lesson}</Text>
            </View>

            <View style={[styles.emotionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Text style={[styles.chainTitle, { color: colors.text }]}>{localizedText('Emotion awareness', 'Conciencia emocional')}</Text>
              <View style={[styles.primaryEmotionBox, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={[styles.chainLabel, { color: colors.primary }]}>{localizedText('Primary emotion', 'Emoción principal')}</Text>
                <Text style={[styles.primaryEmotionText, { color: colors.text }]}>
                  {scenario.emotionAwareness.primaryEmotion}
                </Text>
              </View>
              <Text style={[styles.otherEmotionTitle, { color: colors.text }]}>{localizedText('Other common emotions', 'Otras emociones comunes')}</Text>
              <View style={styles.emotionChipRow}>
                {scenario.emotionAwareness.otherCommonEmotions.map(emotion => (
                  <View
                    key={emotion}
                    style={[styles.emotionChip, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  >
                    <Text style={[styles.emotionChipText, { color: colors.textSecondary }]}>{emotion}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.resultBody, { color: colors.textSecondary }]}>{scenario.emotionAwareness.why}</Text>
            </View>

            <View style={[styles.chainCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Text style={[styles.chainTitle, { color: colors.text }]}>{localizedText('Reveal', 'Revelación')}</Text>
              {[
                [localizedText('Trigger', 'Desencadenante'), scenario.reveal.trigger],
                [localizedText('Emotion', 'Emoción'), scenario.reveal.emotion],
                [localizedText('Fear', 'Miedo'), scenario.reveal.fear],
                [localizedText('Urge', 'Impulso'), scenario.reveal.urge],
                [localizedText('Action', 'Acción'), scenario.reveal.action],
                [localizedText('Outcome', 'Resultado'), scenario.reveal.outcome],
              ].map(([label, value], index, arr) => (
                <View key={label}>
                  <View style={styles.chainRow}>
                    <View style={[styles.chainDot, { backgroundColor: colors.brandTeal }]} />
                    <View style={styles.chainTextWrap}>
                      <Text style={[styles.chainLabel, { color: colors.brandTeal }]}>{label}</Text>
                      <Text style={[styles.chainValue, { color: colors.text }]}>{value}</Text>
                    </View>
                  </View>
                  {index < arr.length - 1 ? <Text style={[styles.arrow, { color: colors.textMuted }]}>↓</Text> : null}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={nextScenario}
              activeOpacity={0.86}
              testID="emotional-detective-next"
            >
              <Text style={styles.submitText}>{localizedText('Next case', 'Siguiente caso')}</Text>
              <ChevronRight size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerTextWrap: {
    flex: 1,
  },
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
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  scenarioContext: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  stepCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  stepHint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: -4,
    marginBottom: 10,
  },
  choiceList: {
    gap: 8,
  },
  choiceButton: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  choiceCopy: {
    flex: 1,
  },
  choiceText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  choiceNote: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  submitText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  revealWrap: {
    gap: 12,
  },
  resultCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
  },
  resultTitle: {
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 6,
  },
  resultBody: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  chainCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
  },
  emotionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    gap: 12,
  },
  primaryEmotionBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
  primaryEmotionText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  otherEmotionTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
    marginBottom: -4,
  },
  emotionChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  emotionChipText: {
    fontSize: 12,
    fontWeight: '900',
  },
  chainTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  chainDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  chainTextWrap: {
    flex: 1,
  },
  chainLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  chainValue: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  arrow: {
    marginLeft: 4,
    marginVertical: 4,
    fontSize: 16,
    fontWeight: '900',
  },
});
