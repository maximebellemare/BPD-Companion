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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { getOutcomes } from '@/services/messages/messageOutcomeService';
import {
  analyzeCommunicationPatterns,
  generateCommunicationInsights,
} from '@/services/messages/messageLearningService';
import { CommunicationPattern, CommunicationInsight } from '@/types/messageOutcome';

const TREND_CONFIG = {
  improving: { icon: TrendingUp, color: Colors.success, label: 'Improving' },
  stable: { icon: Minus, color: Colors.textMuted, label: 'Stable' },
  worsening: { icon: TrendingDown, color: Colors.danger, label: 'Needs attention' },
};

const INSIGHT_CATEGORY_COLORS: Record<string, string> = {
  pattern: '#9B8EC4',
  strength: Colors.success,
  suggestion: Colors.accent,
  learning: Colors.primary,
};

export default function CommunicationPatternsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { messageDrafts } = useApp();

  const outcomesQuery = useQuery({
    queryKey: ['message-outcomes'],
    queryFn: getOutcomes,
  });

  const outcomes = outcomesQuery.data;

  const patterns = useMemo<CommunicationPattern[]>(() => {
    return analyzeCommunicationPatterns(outcomes ?? [], messageDrafts);
  }, [outcomes, messageDrafts]);

  const insights = useMemo<CommunicationInsight[]>(() => {
    return generateCommunicationInsights(outcomes ?? [], messageDrafts);
  }, [outcomes, messageDrafts]);

  const stats = useMemo(() => {
    const total = messageDrafts.length;
    const sent = messageDrafts.filter(d => d.sent).length;
    const paused = messageDrafts.filter(d => d.paused).length;
    const helped = messageDrafts.filter(d => d.outcome === 'helped').length;
    const regretted = messageDrafts.filter(d => d.outcome === 'made_worse').length;
    return { total, sent, paused, helped, regretted };
  }, [messageDrafts]);

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
            <Text style={styles.statLabel}>Messages processed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{stats.helped}</Text>
            <Text style={styles.statLabel}>Helped</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.accent }]}>{stats.paused}</Text>
            <Text style={styles.statLabel}>Paused</Text>
          </View>
        </View>

        {insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lightbulb size={16} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Personal Insights</Text>
            </View>
            {insights.map((insight) => (
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

        {patterns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Communication Patterns</Text>
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

        {patterns.length === 0 && insights.length <= 1 && (
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
          <Text style={styles.privacyTitle}>🔒 Your data stays private</Text>
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
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
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
