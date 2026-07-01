import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle2, ChevronRight, MessageSquareText, Sparkles, Target, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppTheme } from '@/providers/ThemeProvider';
import { trackEvent } from '@/services/analytics/analyticsService';
import {
  REWRITE_CATEGORY_LABELS,
  REWRITE_MESSAGE_SCENARIOS,
  RewriteMessageAttempt,
  RewriteMessageCategory,
  RewriteMessageProgress,
  RewriteMessageScenario,
  getRewriteMessageProgress,
  saveRewriteMessageAttempt,
} from '@/services/games/rewriteMessageGameService';

const CATEGORIES = Object.keys(REWRITE_CATEGORY_LABELS) as RewriteMessageCategory[];

function averageScore(progress: RewriteMessageProgress | null): string {
  if (!progress || progress.attempts.length === 0) return '0';
  const avg = progress.attempts.reduce((sum, attempt) => sum + attempt.score.overall, 0) / progress.attempts.length;
  return String(Math.round(avg));
}

function latestImprovement(progress: RewriteMessageProgress | null): string {
  const attempts = progress?.attempts ?? [];
  if (attempts.length < 2) return 'New';
  const change = attempts[0].score.overall - attempts[1].score.overall;
  return change >= 0 ? `+${change}` : String(change);
}

export default function RewriteTheMessageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [progress, setProgress] = useState<RewriteMessageProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<RewriteMessageCategory>('abandonment');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [rewrite, setRewrite] = useState('');
  const [attempt, setAttempt] = useState<RewriteMessageAttempt | null>(null);

  const scenarios = useMemo(
    () => REWRITE_MESSAGE_SCENARIOS.filter(item => item.category === category),
    [category],
  );
  const scenario: RewriteMessageScenario = scenarios[scenarioIndex % Math.max(1, scenarios.length)] ?? REWRITE_MESSAGE_SCENARIOS[0];
  const canSubmit = rewrite.trim().length >= 8;

  useEffect(() => {
    let mounted = true;
    getRewriteMessageProgress()
      .then(next => {
        if (mounted) setProgress(next);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    void trackEvent('screen_view', { screen: 'rewrite_the_message' });
    return () => {
      mounted = false;
    };
  }, []);

  const resetRound = useCallback((nextCategory = category, nextIndex = scenarioIndex) => {
    setCategory(nextCategory);
    setScenarioIndex(nextIndex);
    setRewrite('');
    setAttempt(null);
  }, [category, scenarioIndex]);

  const chooseCategory = useCallback((next: RewriteMessageCategory) => {
    resetRound(next, 0);
  }, [resetRound]);

  const submit = useCallback(async () => {
    if (!canSubmit || attempt) return;
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const result = await saveRewriteMessageAttempt(scenario, rewrite.trim());
    setProgress(result.progress);
    setAttempt(result.attempt);
    void trackEvent('rewrite_message_game_completed', {
      scenario_id: scenario.id,
      category: scenario.category,
      overall: result.attempt.score.overall,
    });
  }, [attempt, canSubmit, rewrite, scenario]);

  const nextScenario = useCallback(() => {
    resetRound(category, (scenarioIndex + 1) % scenarios.length);
  }, [category, resetRound, scenarioIndex, scenarios.length]);

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
            onPress={() => router.back()}
            activeOpacity={0.75}
            testID="rewrite-message-back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>Rewrite The Message</Text>
            <Text style={[styles.title, { color: colors.text }]}>Practice healthier words</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Rewrite emotionally loaded messages into clearer, steadier communication.
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
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rewrites</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Sparkles size={16} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{latestImprovement(progress)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last change</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map(item => {
            const active = item === category;
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.borderLight,
                  },
                ]}
                onPress={() => chooseCategory(item)}
                activeOpacity={0.78}
                testID={`rewrite-category-${item}`}
              >
                <Text style={[styles.categoryText, { color: active ? Colors.white : colors.textSecondary }]}>
                  {REWRITE_CATEGORY_LABELS[item]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.scenarioCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={[styles.scenarioIcon, { backgroundColor: colors.primaryLight }]}>
            <MessageSquareText size={22} color={colors.primary} />
          </View>
          <Text style={[styles.scenarioLabel, { color: colors.brandTeal }]}>{REWRITE_CATEGORY_LABELS[scenario.category]}</Text>
          <Text style={[styles.scenarioTitle, { color: colors.text }]}>{scenario.title}</Text>
          <Text style={[styles.contextText, { color: colors.textSecondary }]}>{scenario.context}</Text>
          <View style={[styles.originalBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.boxLabel, { color: colors.textSecondary }]}>Original</Text>
            <Text style={[styles.originalText, { color: colors.text }]}>“{scenario.original}”</Text>
          </View>
          <Text style={[styles.goalText, { color: colors.textSecondary }]}>Goal: {scenario.goal}</Text>
        </View>

        <View style={[styles.writeCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <Text style={[styles.writeTitle, { color: colors.text }]}>Your rewrite</Text>
          <TextInput
            value={rewrite}
            onChangeText={(text) => {
              setRewrite(text);
              setAttempt(null);
            }}
            placeholder="Try rewriting it with a feeling, context, and one clear ask..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={800}
            style={[
              styles.rewriteInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                color: colors.text,
              },
            ]}
            testID="rewrite-message-input"
          />
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: canSubmit ? colors.primary : colors.border }]}
            onPress={submit}
            disabled={!canSubmit}
            activeOpacity={0.86}
            testID="rewrite-message-submit"
          >
            <Text style={styles.submitText}>Score my rewrite</Text>
            <ChevronRight size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {attempt ? (
          <View style={styles.resultsWrap}>
            <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>Overall score: {attempt.score.overall}</Text>
              {[
                ['Emotional regulation', attempt.score.emotionalRegulation],
                ['Validation', attempt.score.validation],
                ['Effectiveness', attempt.score.effectiveness],
              ].map(([label, value]) => (
                <View key={label} style={styles.scoreRow}>
                  <Text style={[styles.scoreLabel, { color: colors.text }]}>{label}</Text>
                  <Text style={[styles.scoreValue, { color: colors.primary }]}>{value}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.feedbackCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>What worked</Text>
              {attempt.score.feedback.map(item => (
                <View key={item} style={styles.feedbackRow}>
                  <CheckCircle2 size={15} color={colors.brandTeal} />
                  <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>

            {[
              ['Stronger version', scenario.strongerVersion],
              ['DBT version', scenario.dbtVersion],
              ['Assertive version', scenario.assertiveVersion],
            ].map(([label, value]) => (
              <View key={label} style={[styles.versionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.versionLabel, { color: colors.brandTeal }]}>{label}</Text>
                <Text style={[styles.versionText, { color: colors.text }]}>{value}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={nextScenario}
              activeOpacity={0.86}
              testID="rewrite-message-next"
            >
              <Text style={styles.submitText}>Next message</Text>
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
  categoryRow: {
    gap: 8,
    paddingBottom: 12,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  categoryText: {
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
    marginBottom: 12,
  },
  originalBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  boxLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  originalText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '900',
  },
  goalText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
  },
  writeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },
  writeTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
  },
  rewriteInput: {
    minHeight: 150,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
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
  resultsWrap: {
    gap: 12,
  },
  scoreCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 7,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  feedbackCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  versionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 7,
  },
  versionText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },
});
