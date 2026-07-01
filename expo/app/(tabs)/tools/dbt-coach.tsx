import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Award,
  Brain,
  CheckCircle2,
  ChevronRight,
  Flame,
  Heart,
  HeartHandshake,
  Layers,
  Shield,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppTheme } from '@/providers/ThemeProvider';
import { trackEvent } from '@/services/analytics/analyticsService';
import {
  answerDBTAcademyScenario,
  DBT_ACADEMY_SCENARIOS,
  DBTAcademyLevel,
  DBTAcademyProgress,
  DBTAcademyScenario,
  DBTAcademyTrack,
  DEFAULT_DBT_ACADEMY_PROGRESS,
  getDBTAcademyProgress,
  getScenarioCountForTrack,
  LEVEL_LABELS,
  TRACK_LABELS,
} from '@/services/dbt/dbtAcademyService';

const TRACK_ICONS: Record<DBTAcademyTrack, React.ComponentType<{ size: number; color: string }>> = {
  abandonment: Heart,
  rejection: Shield,
  anger: Flame,
  shame: Brain,
  relationships: HeartHandshake,
  impulsivity: Zap,
  emotional_regulation: Brain,
  distress_tolerance: Shield,
  mindfulness: Sparkles,
  identity_self_image: Target,
};

const LEVEL_ORDER: DBTAcademyLevel[] = ['beginner', 'intermediate', 'advanced'];
const TRACK_ORDER: DBTAcademyTrack[] = [
  'abandonment',
  'rejection',
  'anger',
  'shame',
  'relationships',
  'impulsivity',
  'emotional_regulation',
  'distress_tolerance',
  'mindfulness',
  'identity_self_image',
];

function levelForIndex(index: number): DBTAcademyLevel {
  return LEVEL_ORDER[index] ?? 'beginner';
}

export default function DBTAcademyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [progress, setProgress] = useState<DBTAcademyProgress>(DEFAULT_DBT_ACADEMY_PROGRESS);
  const [selectedTrack, setSelectedTrack] = useState<DBTAcademyTrack>('abandonment');
  const [selectedLevel, setSelectedLevel] = useState<DBTAcademyLevel>('beginner');
  const [activeScenario, setActiveScenario] = useState<DBTAcademyScenario | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; scenario: DBTAcademyScenario } | null>(null);

  useEffect(() => {
    getDBTAcademyProgress()
      .then(setProgress)
      .catch((error) => console.log('[DBTAcademy] Failed to load progress:', error));
    void trackEvent('screen_view', { screen: 'dbt_skills_academy' });
  }, []);

  const scenariosForTrack = useMemo(
    () => DBT_ACADEMY_SCENARIOS.filter(scenario => scenario.track === selectedTrack),
    [selectedTrack],
  );

  const visibleScenarios = useMemo(
    () => scenariosForTrack.filter(scenario => scenario.level === selectedLevel),
    [scenariosForTrack, selectedLevel],
  );

  const completionPercent = useMemo(() => {
    if (DBT_ACADEMY_SCENARIOS.length === 0) return 0;
    return Math.round((progress.completedScenarioIds.length / DBT_ACADEMY_SCENARIOS.length) * 100);
  }, [progress.completedScenarioIds.length]);

  const startScenario = useCallback((scenario: DBTAcademyScenario) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveScenario(scenario);
    setSelectedChoiceId(null);
    setAnswerResult(null);
    void trackEvent('dbt_academy_scenario_started', {
      track: scenario.track,
      level: scenario.level,
      scenario_id: scenario.id,
    });
  }, []);

  const handleAnswer = useCallback(async () => {
    if (!activeScenario || !selectedChoiceId) return;
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const result = await answerDBTAcademyScenario(activeScenario, selectedChoiceId, progress);
    setProgress(result.progress);
    setAnswerResult({ isCorrect: result.isCorrect, scenario: activeScenario });
    void trackEvent('dbt_academy_scenario_answered', {
      track: activeScenario.track,
      level: activeScenario.level,
      scenario_id: activeScenario.id,
      correct: result.isCorrect,
    });
  }, [activeScenario, progress, selectedChoiceId]);

  const handleNextScenario = useCallback(() => {
    if (!activeScenario) return;
    const currentIndex = visibleScenarios.findIndex(scenario => scenario.id === activeScenario.id);
    const next = visibleScenarios[currentIndex + 1] ??
      scenariosForTrack.find(scenario => !progress.completedScenarioIds.includes(scenario.id)) ??
      null;
    if (next) {
      startScenario(next);
    } else {
      setActiveScenario(null);
      setAnswerResult(null);
      setSelectedChoiceId(null);
    }
  }, [activeScenario, progress.completedScenarioIds, scenariosForTrack, startScenario, visibleScenarios]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
            onPress={() => router.back()}
            activeOpacity={0.76}
            testID="dbt-academy-back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>DBT Skills Academy</Text>
            <Text style={[styles.title, { color: colors.text }]}>Practice real moments</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Learn application, not theory. Choose what you would do, then see the skill that fits.
            </Text>
          </View>
        </View>

        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={styles.progressTop}>
            <View style={[styles.progressIcon, { backgroundColor: colors.primaryLight }]}>
              <Award size={22} color={colors.primary} />
            </View>
            <View style={styles.progressCopy}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>Emotional mastery progress</Text>
              <Text style={[styles.progressBody, { color: colors.textSecondary }]}>
                {progress.completedScenarioIds.length} scenarios completed · {progress.currentStreak} day streak
              </Text>
            </View>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>{completionPercent}%</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.surface }]}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.brandTeal, width: `${completionPercent}%` }]} />
          </View>
          <Text style={[styles.progressHint, { color: colors.textMuted }]}>
            Best streak: {progress.longestStreak} day{progress.longestStreak === 1 ? '' : 's'}
          </Text>
        </View>

        {activeScenario ? (
          <View style={[styles.scenarioPanel, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={styles.scenarioMetaRow}>
              <View style={[styles.levelPill, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.levelPillText, { color: colors.primary }]}>{LEVEL_LABELS[activeScenario.level]}</Text>
              </View>
              <Text style={[styles.scenarioTrack, { color: colors.textMuted }]}>{TRACK_LABELS[activeScenario.track]}</Text>
            </View>

            <Text style={[styles.scenarioLabel, { color: colors.brandTeal }]}>Scenario</Text>
            <Text style={[styles.scenarioText, { color: colors.text }]}>{activeScenario.scenario}</Text>
            <Text style={[styles.questionText, { color: colors.text }]}>{activeScenario.question}</Text>

            <View style={styles.choiceList}>
              {activeScenario.choices.map((choice) => {
                const selected = selectedChoiceId === choice.id;
                const isCorrectChoice = answerResult && choice.id === activeScenario.correctChoiceId;
                const isWrongSelected = answerResult && selected && choice.id !== activeScenario.correctChoiceId;
                return (
                  <TouchableOpacity
                    key={choice.id}
                    style={[
                      styles.choiceButton,
                      { backgroundColor: colors.surface, borderColor: colors.borderLight },
                      selected && { borderColor: colors.primary },
                      isCorrectChoice && { borderColor: colors.success, backgroundColor: colors.successLight },
                      isWrongSelected && { borderColor: colors.danger, backgroundColor: colors.dangerLight },
                    ]}
                    onPress={() => !answerResult && setSelectedChoiceId(choice.id)}
                    activeOpacity={0.82}
                    disabled={!!answerResult}
                    testID={`dbt-choice-${choice.id}`}
                  >
                    <Text style={[styles.choiceText, { color: colors.text }]}>{choice.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {answerResult ? (
              <View style={[styles.feedbackCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={styles.feedbackHeader}>
                  <CheckCircle2 size={18} color={answerResult.isCorrect ? colors.success : colors.primary} />
                  <Text style={[styles.feedbackTitle, { color: colors.text }]}>
                    {answerResult.isCorrect ? 'Skillful choice' : 'Useful learning moment'}
                  </Text>
                </View>
                <Text style={[styles.feedbackSkill, { color: colors.primary }]}>Skill: {activeScenario.skill}</Text>
                <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>Why: {activeScenario.why}</Text>
                <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>
                  What usually happens: {activeScenario.whatUsuallyHappens}
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleNextScenario}
                  activeOpacity={0.84}
                  testID="dbt-next-scenario"
                >
                  <Text style={styles.primaryButtonText}>Continue training</Text>
                  <ChevronRight size={17} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: selectedChoiceId ? colors.primary : colors.border }]}
                onPress={handleAnswer}
                disabled={!selectedChoiceId}
                activeOpacity={0.84}
                testID="dbt-submit-answer"
              >
                <Text style={styles.primaryButtonText}>Check answer</Text>
                <ChevronRight size={17} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose a track</Text>
              <View style={styles.trackGrid}>
                {TRACK_ORDER.map((track) => {
                  const Icon = TRACK_ICONS[track];
                  const selected = selectedTrack === track;
                  const total = getScenarioCountForTrack(track);
                  const completed = progress.trackCompletions[track] ?? 0;
                  return (
                    <TouchableOpacity
                      key={track}
                      style={[
                        styles.trackCard,
                        { backgroundColor: colors.card, borderColor: selected ? colors.primary : colors.borderLight },
                      ]}
                      onPress={() => setSelectedTrack(track)}
                      activeOpacity={0.82}
                      testID={`dbt-track-${track}`}
                    >
                      <View style={[styles.trackIcon, { backgroundColor: selected ? colors.primaryLight : colors.surface }]}>
                        <Icon size={19} color={selected ? colors.primary : colors.textSecondary} />
                      </View>
                      <Text style={[styles.trackTitle, { color: colors.text }]}>{TRACK_LABELS[track]}</Text>
                      <Text style={[styles.trackProgress, { color: colors.textMuted }]}>{completed}/{total}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Progression</Text>
              <View style={styles.levelRow}>
                {LEVEL_ORDER.map((level, index) => {
                  const selected = selectedLevel === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.levelButton,
                        { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.borderLight },
                      ]}
                      onPress={() => setSelectedLevel(levelForIndex(index))}
                      activeOpacity={0.8}
                      testID={`dbt-level-${level}`}
                    >
                      <Layers size={14} color={selected ? Colors.white : colors.primary} />
                      <Text style={[styles.levelButtonText, { color: selected ? Colors.white : colors.primary }]}>
                        {LEVEL_LABELS[level]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {TRACK_LABELS[selectedTrack]} · {LEVEL_LABELS[selectedLevel]}
              </Text>
              <View style={styles.scenarioList}>
                {visibleScenarios.length > 0 ? visibleScenarios.map((scenario) => {
                  const completed = progress.completedScenarioIds.includes(scenario.id);
                  return (
                    <TouchableOpacity
                      key={scenario.id}
                      style={[styles.scenarioCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                      onPress={() => startScenario(scenario)}
                      activeOpacity={0.82}
                      testID={`dbt-scenario-${scenario.id}`}
                    >
                      <View style={[styles.scenarioCardIcon, { backgroundColor: completed ? colors.successLight : colors.primaryLight }]}>
                        {completed ? <CheckCircle2 size={18} color={colors.success} /> : <Target size={18} color={colors.primary} />}
                      </View>
                      <View style={styles.scenarioCardText}>
                        <Text style={[styles.scenarioCardTitle, { color: colors.text }]} numberOfLines={2}>{scenario.scenario}</Text>
                        <Text style={[styles.scenarioCardBody, { color: colors.textSecondary }]} numberOfLines={2}>
                          Practice choosing {scenario.skill} in the moment.
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                }) : (
                  <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <Sparkles size={18} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      This level is coming next. Try another level in this track.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 38,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    marginBottom: 7,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  progressCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCopy: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 3,
  },
  progressBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressHint: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  trackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  trackCard: {
    width: '48%',
    minHeight: 118,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  trackIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  trackTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    marginBottom: 5,
  },
  trackProgress: {
    fontSize: 12,
    fontWeight: '800',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  levelButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },
  scenarioList: {
    gap: 10,
  },
  scenarioCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scenarioCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioCardText: {
    flex: 1,
  },
  scenarioCardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    marginBottom: 3,
  },
  scenarioCardBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  scenarioPanel: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 17,
    marginBottom: 20,
  },
  scenarioMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  levelPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scenarioTrack: {
    fontSize: 12,
    fontWeight: '800',
  },
  scenarioLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  scenarioText: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    marginBottom: 12,
  },
  choiceList: {
    gap: 9,
    marginBottom: 14,
  },
  choiceButton: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  choiceText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  feedbackCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 9,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  feedbackSkill: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
});
