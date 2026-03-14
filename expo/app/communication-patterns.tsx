import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Sparkles,
  BookOpen,
  ChevronRight,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { getOutcomes } from '@/services/messages/messageOutcomeService';
import { getEnhancedOutcomes } from '@/services/messages/enhancedOutcomeService';
import {
  analyzeCommunicationPatterns,
  generateCommunicationInsights,
} from '@/services/messages/messageLearningService';
import { generateEnhancedInsights } from '@/services/messages/enhancedLearningService';
import {
  buildCommunicationTendencies,
  detectGrowthSignals,
} from '@/services/messages/communicationProfileService';
import {
  CommunicationPattern,
  CommunicationInsight,
  CommunicationTendency,
  GrowthSignal,
} from '@/types/messageOutcome';

const TREND_CONFIG = {
  improving: { icon: TrendingUp, color: Colors.success, label: 'Improving' },
  stable: { icon: Minus, color: Colors.textMuted, label: 'Stable' },
  worsening: { icon: TrendingDown, color: Colors.danger, label: 'Needs attention' },
};

const TENDENCY_TREND_CONFIG = {
  increasing: { icon: TrendingUp, color: Colors.primary },
  decreasing: { icon: TrendingDown, color: Colors.accent },
  stable: { icon: Minus, color: Colors.textMuted },
};

const INSIGHT_CATEGORY_COLORS: Record<string, string> = {
  pattern: '#9B8EC4',
  strength: Colors.success,
  suggestion: Colors.accent,
  learning: Colors.primary,
  growth: Colors.brandSage,
};

export default function CommunicationPatternsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { messageDrafts } = useApp();

  const outcomesQuery = useQuery({
    queryKey: ['message-outcomes'],
    queryFn: getOutcomes,
  });

  const enhancedQuery = useQuery({
    queryKey: ['enhanced-message-outcomes'],
    queryFn: getEnhancedOutcomes,
  });

  const outcomes = outcomesQuery.data;
  const enhancedOutcomes = useMemo(() => enhancedQuery.data ?? [], [enhancedQuery.data]);

  const patterns = useMemo<CommunicationPattern[]>(() => {
    return analyzeCommunicationPatterns(outcomes ?? [], messageDrafts);
  }, [outcomes, messageDrafts]);

  const legacyInsights = useMemo<CommunicationInsight[]>(() => {
    return generateCommunicationInsights(outcomes ?? [], messageDrafts);
  }, [outcomes, messageDrafts]);

  const enhancedInsights = useMemo<CommunicationInsight[]>(() => {
    return generateEnhancedInsights(enhancedOutcomes);
  }, [enhancedOutcomes]);

  const allInsights = useMemo(() => {
    const ids = new Set<string>();
    const combined: CommunicationInsight[] = [];
    [...enhancedInsights, ...legacyInsights].forEach(i => {
      if (!ids.has(i.id)) {
        ids.add(i.id);
        combined.push(i);
      }
    });
    return combined.slice(0, 8);
  }, [enhancedInsights, legacyInsights]);

  const tendencies = useMemo<CommunicationTendency[]>(() => {
    return buildCommunicationTendencies(enhancedOutcomes);
  }, [enhancedOutcomes]);

  const growthSignals = useMemo<GrowthSignal[]>(() => {
    return detectGrowthSignals(enhancedOutcomes);
  }, [enhancedOutcomes]);

  const stats = useMemo(() => {
    const total = messageDrafts.length + enhancedOutcomes.length;
    const sent = messageDrafts.filter(d => d.sent).length +
      enhancedOutcomes.filter(o => o.sentStatus === 'sent_now' || o.sentStatus === 'sent_later').length;
    const paused = messageDrafts.filter(d => d.paused).length +
      enhancedOutcomes.filter(o => o.pauseUsed).length;
    const helped = messageDrafts.filter(d => d.outcome === 'helped').length +
      enhancedOutcomes.filter(o => o.conflictResult === 'helped').length;
    const regretted = messageDrafts.filter(d => d.outcome === 'made_worse').length +
      enhancedOutcomes.filter(o => o.regretReported === true).length;
    return { total, sent, paused, helped, regretted };
  }, [messageDrafts, enhancedOutcomes]);

  const hasEnoughData = stats.total >= 3;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Your Communication Patterns</Text>
          <Text style={styles.headerSub}>What the data shows about how you communicate</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{stats.helped}</Text>
            <Text style={styles.statLabel}>Helped</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.accent }]}>{stats.paused}</Text>
            <Text style={styles.statLabel}>Paused</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.danger }]}>{stats.regretted}</Text>
            <Text style={styles.statLabel}>Regretted</Text>
          </View>
        </View>

        {growthSignals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={16} color={Colors.brandSage} />
              <Text style={styles.sectionTitle}>Growth signals</Text>
            </View>
            {growthSignals.map((signal) => (
              <View key={signal.id} style={styles.growthCard}>
                <Text style={styles.growthEmoji}>{signal.emoji}</Text>
                <View style={styles.growthTextWrap}>
                  <Text style={styles.growthLabel}>{signal.label}</Text>
                  <Text style={styles.growthDesc}>{signal.description}</Text>
                </View>
                <View style={styles.growthBadge}>
                  <Text style={styles.growthBadgeText}>{signal.occurrences}x</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {allInsights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lightbulb size={16} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Personal insights</Text>
            </View>
            {allInsights.map((insight) => (
              <View
                key={insight.id}
                style={[styles.insightCard, {
                  borderLeftColor: INSIGHT_CATEGORY_COLORS[insight.category] ?? Colors.primary,
                }]}
              >
                <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            ))}
          </View>
        )}

        {tendencies.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Zap size={16} color={Colors.brandLilac} />
              <Text style={styles.sectionTitle}>Communication tendencies</Text>
            </View>
            {tendencies.map((tendency) => {
              const trendCfg = TENDENCY_TREND_CONFIG[tendency.trend];
              const TrendIcon = trendCfg.icon;
              return (
                <View key={tendency.id} style={styles.tendencyCard}>
                  <View style={styles.tendencyHeader}>
                    <Text style={styles.tendencyLabel}>{tendency.label}</Text>
                    <View style={styles.tendencyTrend}>
                      <TrendIcon size={12} color={trendCfg.color} />
                      <Text style={[styles.tendencyTrendText, { color: trendCfg.color }]}>
                        {tendency.trend}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.tendencyBarBg}>
                    <View
                      style={[
                        styles.tendencyBarFill,
                        {
                          width: `${Math.min(tendency.score, 100)}%`,
                          backgroundColor: tendency.score > 50 ? Colors.accent : Colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.tendencyDesc}>{tendency.description}</Text>
                </View>
              );
            })}
          </View>
        )}

        {patterns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Detected patterns</Text>
            </View>
            {patterns.map((pattern) => {
              const trendConfig = TREND_CONFIG[pattern.trend];
              const TrendIcon = trendConfig.icon;
              return (
                <View key={pattern.id} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternLabel}>{pattern.label}</Text>
                    <View style={[styles.trendBadge, { backgroundColor: trendConfig.color + '15' }]}>
                      <TrendIcon size={11} color={trendConfig.color} />
                      <Text style={[styles.trendText, { color: trendConfig.color }]}>{trendConfig.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.patternDesc}>{pattern.description}</Text>
                  {pattern.frequency > 0 && (
                    <Text style={styles.patternFreq}>Observed {pattern.frequency} times</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={styles.playbookLink}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/communication-playbook' as never);
          }}
          activeOpacity={0.7}
          testID="playbook-link"
        >
          <View style={styles.playbookIconWrap}>
            <BookOpen size={18} color={Colors.brandSage} />
          </View>
          <View style={styles.playbookTextWrap}>
            <Text style={styles.playbookTitle}>Your Communication Playbook</Text>
            <Text style={styles.playbookSub}>Personalized strategies based on what works for you</Text>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        {!hasEnoughData && patterns.length === 0 && allInsights.length <= 1 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <BarChart3 size={28} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Building your patterns</Text>
            <Text style={styles.emptyDesc}>
              Use the message tool a few more times to unlock personalized communication insights and pattern detection.
            </Text>
          </View>
        )}

        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>{'\ud83d\udd12'} Your data stays private</Text>
          <Text style={styles.privacyText}>
            All patterns are analyzed locally on your device. Nothing is shared or uploaded.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  growthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  growthEmoji: {
    fontSize: 22,
  },
  growthTextWrap: {
    flex: 1,
  },
  growthLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  growthDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  growthBadge: {
    backgroundColor: Colors.success + '20',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  growthBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    gap: 10,
    alignItems: 'flex-start',
  },
  insightEmoji: {
    fontSize: 18,
    marginTop: 1,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  tendencyCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  tendencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tendencyLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  tendencyTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tendencyTrendText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  tendencyBarBg: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  tendencyBarFill: {
    height: 6,
    borderRadius: 3,
  },
  tendencyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  patternCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  patternDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  patternFreq: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
  },
  playbookLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Colors.brandSage + '30',
  },
  playbookIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.brandSage + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbookTextWrap: {
    flex: 1,
  },
  playbookTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  playbookSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  privacyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
