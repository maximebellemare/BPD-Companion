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
import { ArrowLeft, CheckCircle2, ChevronRight, MessageCircle, Sparkles, Target, Trophy, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppTheme } from '@/providers/ThemeProvider';
import { trackEvent } from '@/services/analytics/analyticsService';
import {
  OUTCOME_LABELS,
  RELATIONSHIP_SIMULATOR_DIFFICULTY_LABELS,
  RELATIONSHIP_SIMULATOR_SCENARIOS,
  RELATIONSHIP_SIMULATOR_TOPIC_LABELS,
  RelationshipResponseOption,
  RelationshipSimulatorAttempt,
  RelationshipSimulatorDifficulty,
  RelationshipSimulatorProgress,
  RelationshipSimulatorScenario,
  getRelationshipSimulatorProgress,
  saveRelationshipSimulatorAttempt,
} from '@/services/games/relationshipSimulatorService';

type ConversationMessage = {
  id: string;
  speaker: 'partner' | 'user';
  text: string;
};

const DIFFICULTIES = Object.keys(RELATIONSHIP_SIMULATOR_DIFFICULTY_LABELS) as RelationshipSimulatorDifficulty[];

function averageScore(progress: RelationshipSimulatorProgress | null): string {
  const attempts = progress?.attempts ?? [];
  if (attempts.length === 0) return '0';
  const avg = attempts.reduce((sum, attempt) => sum + attempt.score.overall, 0) / attempts.length;
  return String(Math.round(avg));
}

export default function RelationshipSimulatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [progress, setProgress] = useState<RelationshipSimulatorProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<RelationshipSimulatorDifficulty>('beginner');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [turnIndex, setTurnIndex] = useState(0);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<RelationshipResponseOption[]>([]);
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<RelationshipSimulatorAttempt | null>(null);

  const scenarios = useMemo(
    () => RELATIONSHIP_SIMULATOR_SCENARIOS.filter(item => item.difficulty === difficulty),
    [difficulty],
  );
  const scenario: RelationshipSimulatorScenario = scenarios[scenarioIndex % Math.max(1, scenarios.length)] ?? RELATIONSHIP_SIMULATOR_SCENARIOS[0];
  const currentTurn = scenario.turns[turnIndex] ?? null;

  const initializeRound = useCallback((nextDifficulty = difficulty, nextIndex = scenarioIndex) => {
    const nextScenarios = RELATIONSHIP_SIMULATOR_SCENARIOS.filter(item => item.difficulty === nextDifficulty);
    const nextScenario = nextScenarios[nextIndex % Math.max(1, nextScenarios.length)] ?? RELATIONSHIP_SIMULATOR_SCENARIOS[0];
    setDifficulty(nextDifficulty);
    setScenarioIndex(nextIndex);
    setTurnIndex(0);
    setSelectedOptions([]);
    setLastNote(null);
    setAttempt(null);
    setMessages([
      {
        id: `${nextScenario.id}_setup`,
        speaker: 'partner',
        text: nextScenario.turns[0]?.partnerLine ?? nextScenario.setup,
      },
    ]);
  }, [difficulty, scenarioIndex]);

  useEffect(() => {
    let mounted = true;
    getRelationshipSimulatorProgress()
      .then(next => {
        if (mounted) setProgress(next);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    void trackEvent('screen_view', { screen: 'relationship_simulator' });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && messages.length === 0) initializeRound();
  }, [initializeRound, loading, messages.length]);

  const chooseDifficulty = useCallback((next: RelationshipSimulatorDifficulty) => {
    initializeRound(next, 0);
  }, [initializeRound]);

  const chooseResponse = useCallback(async (option: RelationshipResponseOption) => {
    if (!currentTurn || attempt) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const nextSelected = [...selectedOptions, option];
    setSelectedOptions(nextSelected);
    setLastNote(option.coachingNote);
    setMessages(prev => [
      ...prev,
      { id: `${currentTurn.id}_${option.id}_user`, speaker: 'user', text: option.text },
      { id: `${currentTurn.id}_${option.id}_partner`, speaker: 'partner', text: option.partnerReply },
    ]);

    const nextTurnIndex = turnIndex + 1;
    if (nextTurnIndex < scenario.turns.length) {
      const nextTurn = scenario.turns[nextTurnIndex];
      setTurnIndex(nextTurnIndex);
      setMessages(prev => [
        ...prev,
        { id: `${nextTurn.id}_partner`, speaker: 'partner', text: nextTurn.partnerLine },
      ]);
      return;
    }

    const result = await saveRelationshipSimulatorAttempt(scenario, nextSelected);
    setProgress(result.progress);
    setAttempt(result.attempt);
    void trackEvent('relationship_simulator_completed', {
      scenario_id: scenario.id,
      difficulty: scenario.difficulty,
      topic: scenario.topic,
      outcome: result.attempt.score.outcome,
      overall: result.attempt.score.overall,
    });
  }, [attempt, currentTurn, scenario, selectedOptions, turnIndex]);

  const nextScenario = useCallback(() => {
    initializeRound(difficulty, (scenarioIndex + 1) % scenarios.length);
  }, [difficulty, initializeRound, scenarioIndex, scenarios.length]);

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
            testID="relationship-simulator-back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>Relationship Simulator</Text>
            <Text style={[styles.title, { color: colors.text }]}>Practice the hard moment</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choose responses and watch the conversation move toward escalation, repair, or healthy communication.
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Target size={16} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{averageScore(progress)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg score</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Trophy size={16} color={colors.brandTeal} />
            <Text style={[styles.statValue, { color: colors.text }]}>{progress?.attempts.length ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions</Text>
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
                testID={`relationship-simulator-difficulty-${item}`}
              >
                <Text style={[styles.difficultyText, { color: active ? Colors.white : colors.textSecondary }]}>
                  {RELATIONSHIP_SIMULATOR_DIFFICULTY_LABELS[item]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.scenarioCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={[styles.scenarioIcon, { backgroundColor: colors.primaryLight }]}>
            <Users size={22} color={colors.primary} />
          </View>
          <Text style={[styles.scenarioLabel, { color: colors.brandTeal }]}>{RELATIONSHIP_SIMULATOR_TOPIC_LABELS[scenario.topic]}</Text>
          <Text style={[styles.scenarioTitle, { color: colors.text }]}>{scenario.title}</Text>
          <Text style={[styles.contextText, { color: colors.textSecondary }]}>{scenario.setup}</Text>
        </View>

        <View style={[styles.chatCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.chatTitle, { color: colors.text }]}>Conversation</Text>
          {messages.map(message => {
            const isUser = message.speaker === 'user';
            return (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  {
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    backgroundColor: isUser ? colors.primary : colors.surface,
                    borderColor: isUser ? colors.primary : colors.borderLight,
                  },
                ]}
              >
                <Text style={[styles.messageSpeaker, { color: isUser ? Colors.white : colors.textSecondary }]}>
                  {isUser ? 'You' : 'Partner'}
                </Text>
                <Text style={[styles.messageText, { color: isUser ? Colors.white : colors.text }]}>
                  {message.text}
                </Text>
              </View>
            );
          })}
        </View>

        {lastNote && !attempt ? (
          <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <CheckCircle2 size={16} color={colors.brandTeal} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>{lastNote}</Text>
          </View>
        ) : null}

        {!attempt && currentTurn ? (
          <View style={[styles.choiceCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Text style={[styles.choicePrompt, { color: colors.text }]}>{currentTurn.prompt}</Text>
            <View style={styles.optionList}>
              {currentTurn.options.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionButton, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  onPress={() => chooseResponse(option)}
                  activeOpacity={0.8}
                  testID={`relationship-simulator-option-${option.id}`}
                >
                  <MessageCircle size={16} color={colors.primary} />
                  <Text style={[styles.optionText, { color: colors.text }]}>{option.text}</Text>
                  <ChevronRight size={17} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {attempt ? (
          <View style={styles.resultsWrap}>
            <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Text style={[styles.resultKicker, { color: colors.brandTeal }]}>Outcome</Text>
              <Text style={[styles.resultTitle, { color: colors.text }]}>{OUTCOME_LABELS[attempt.score.outcome]}</Text>
              <Text style={[styles.resultBody, { color: colors.textSecondary }]}>
                Overall: {attempt.score.overall}. This is practice, not a judgment. The goal is seeing how choices shift the conversation.
              </Text>
            </View>

            <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              {[
                ['Emotional regulation', attempt.score.emotionalRegulation],
                ['Interpersonal effectiveness', attempt.score.interpersonalEffectiveness],
                ['Impulse control', attempt.score.impulseControl],
              ].map(([label, value]) => (
                <View key={label} style={styles.scoreRow}>
                  <Text style={[styles.scoreLabel, { color: colors.text }]}>{label}</Text>
                  <Text style={[styles.scoreValue, { color: colors.primary }]}>{value}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={nextScenario}
              activeOpacity={0.86}
              testID="relationship-simulator-next"
            >
              <Text style={styles.submitText}>Next conversation</Text>
              <ChevronRight size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ) : null}
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
  scenarioTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginBottom: 6,
  },
  contextText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  chatCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },
  chatTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 9,
  },
  messageSpeaker: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  noteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  choiceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
  },
  choicePrompt: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
    marginBottom: 10,
  },
  optionList: {
    gap: 8,
  },
  optionButton: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  resultsWrap: {
    gap: 12,
  },
  resultCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
  },
  resultKicker: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  resultTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  resultBody: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  scoreCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  scoreLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
});
