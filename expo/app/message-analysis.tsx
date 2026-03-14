import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  AlertTriangle,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { trackMessageDraft } from '@/services/analytics/analyticsService';
import { analyzeMessageHealth } from '@/services/messages/messageHealthService';
import {
  EnhancedMessageContext,
  MessageEmotionalState,
  MessageInterpretation,
  MessageUrge,
  MessageDesiredOutcome,
  MessageHealthScore,
} from '@/types/messageHealth';

const DIMENSION_META: Record<keyof MessageHealthScore, { label: string; emoji: string; inverted?: boolean }> = {
  urgency: { label: 'Urgency', emoji: '⚡' },
  blame: { label: 'Blame', emoji: '👆' },
  reassuranceSeeking: { label: 'Reassurance-seeking', emoji: '🤲' },
  overexplaining: { label: 'Over-explaining', emoji: '📝' },
  hostility: { label: 'Hostility', emoji: '🔥' },
  clarity: { label: 'Clarity', emoji: '🎯', inverted: true },
  emotionalFlooding: { label: 'Emotional flooding', emoji: '🌊' },
  boundaryStrength: { label: 'Boundary strength', emoji: '🛡️', inverted: true },
  selfRespect: { label: 'Self-respect', emoji: '👑', inverted: true },
  escalationRisk: { label: 'Escalation risk', emoji: '📈' },
};

function ScoreBar({ value, inverted }: { value: number; inverted?: boolean }) {
  const displayValue = inverted ? 10 - value : value;
  const color = displayValue <= 3 ? Colors.success : displayValue <= 6 ? Colors.accent : Colors.danger;
  const width = `${Math.max(value * 10, 5)}%` as const;

  return (
    <View style={styles.scoreBarTrack}>
      <View style={[styles.scoreBarFill, { width, backgroundColor: color }]} />
    </View>
  );
}

export default function MessageAnalysisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    draft: string;
    situation: string;
    emotionalState: string;
    interpretation: string;
    urge: string;
    desiredOutcome: string;
  }>();

  const context: EnhancedMessageContext = useMemo(() => ({
    draft: params.draft ?? '',
    situation: params.situation ?? '',
    emotionalState: (params.emotionalState as MessageEmotionalState) || null,
    interpretation: (params.interpretation as MessageInterpretation) || null,
    urge: (params.urge as MessageUrge) || null,
    desiredOutcome: (params.desiredOutcome as MessageDesiredOutcome) || null,
  }), [params]);

  const analysis = useMemo(() => {
    if (!context.draft) return null;
    return analyzeMessageHealth(context.draft, context);
  }, [context]);

  useEffect(() => {
    if (analysis) {
      void trackMessageDraft('analyzed', {
        risk_level: analysis.recommendation,
        overall_risk: analysis.overallRisk,
        top_concern_count: analysis.topConcerns.length,
        word_count: context.draft.split(/\s+/).length,
      });
      if (analysis.overallRisk >= 7) {
        void trackMessageDraft('risk_detected', {
          risk_level: analysis.recommendation,
          overall_risk: analysis.overallRisk,
        });
      }
      console.log('[Analytics] message_draft_analyzed', { risk: analysis.overallRisk });
    }
  }, [analysis, context.draft]);

  const recColors: Record<string, string> = {
    safe_to_send: Colors.success,
    better_after_pause: Colors.accent,
    better_rewritten: '#9B8EC4',
    better_not_sent: Colors.danger,
    do_not_send: Colors.dangerDark,
  };
  const recEmojis: Record<string, string> = {
    safe_to_send: '✅',
    better_after_pause: '⏳',
    better_rewritten: '✏️',
    better_not_sent: '🛑',
    do_not_send: '⛔',
  };

  if (!analysis) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Message Health</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No message to analyze.</Text>
        </View>
      </View>
    );
  }

  const sortedDimensions = (Object.entries(analysis.score) as [keyof MessageHealthScore, number][])
    .sort((a, b) => {
      const aRisk = DIMENSION_META[a[0]].inverted ? 10 - a[1] : a[1];
      const bRisk = DIMENSION_META[b[0]].inverted ? 10 - b[1] : b[1];
      return bRisk - aRisk;
    });

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
        <Text style={styles.headerTitle}>Message Health Score</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.recBanner, { backgroundColor: (recColors[analysis.recommendation] ?? Colors.primary) + '12' }]}>
          <Text style={styles.recBannerEmoji}>{recEmojis[analysis.recommendation] ?? '📋'}</Text>
          <View style={styles.recBannerContent}>
            <Text style={[styles.recBannerTitle, { color: recColors[analysis.recommendation] ?? Colors.primary }]}>
              {analysis.recommendationMessage}
            </Text>
            <Text style={styles.recBannerDetail}>{analysis.recommendationDetail}</Text>
          </View>
        </View>

        <View style={styles.overallCard}>
          <View style={styles.overallRow}>
            <View style={styles.overallCircle}>
              <Text style={[styles.overallScore, {
                color: analysis.overallRisk <= 3 ? Colors.success : analysis.overallRisk <= 6 ? Colors.accent : Colors.danger,
              }]}>
                {analysis.overallRisk}
              </Text>
              <Text style={styles.overallMax}>/10</Text>
            </View>
            <View style={styles.overallTextWrap}>
              <Text style={styles.overallLabel}>Overall Risk</Text>
              <Text style={styles.overallDesc}>
                {analysis.overallRisk <= 3
                  ? 'Low risk — this message is measured and clear.'
                  : analysis.overallRisk <= 6
                    ? 'Moderate risk — consider adjustments.'
                    : 'High risk — strong emotions are driving this.'
                }
              </Text>
            </View>
          </View>
        </View>

        {analysis.topConcerns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={14} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Top Concerns</Text>
            </View>
            {analysis.topConcerns.map((concern, i) => (
              <View key={i} style={styles.concernRow}>
                <View style={[styles.concernLevel, {
                  backgroundColor: concern.level === 'high' ? Colors.dangerLight : Colors.accentLight,
                }]}>
                  <Text style={[styles.concernLevelText, {
                    color: concern.level === 'high' ? Colors.danger : Colors.accent,
                  }]}>
                    {concern.level}
                  </Text>
                </View>
                <View style={styles.concernContent}>
                  <Text style={styles.concernName}>{concern.label}</Text>
                  <Text style={styles.concernDesc}>{concern.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {analysis.strengths.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Check size={14} color={Colors.success} />
              <Text style={styles.sectionTitle}>Strengths</Text>
            </View>
            <View style={styles.strengthsWrap}>
              {analysis.strengths.map((s, i) => (
                <View key={i} style={styles.strengthPill}>
                  <Check size={10} color={Colors.success} />
                  <Text style={styles.strengthPillText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Breakdown</Text>
          <View style={styles.breakdownList}>
            {sortedDimensions.map(([key, value]) => {
              const meta = DIMENSION_META[key];
              return (
                <View key={key} style={styles.breakdownRow}>
                  <View style={styles.breakdownLabelRow}>
                    <Text style={styles.breakdownEmoji}>{meta.emoji}</Text>
                    <Text style={styles.breakdownLabel}>{meta.label}</Text>
                    <Text style={styles.breakdownValue}>{value}/10</Text>
                  </View>
                  <ScoreBar value={value} inverted={meta.inverted} />
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.draftCard}>
          <Text style={styles.draftLabel}>Your message</Text>
          <Text style={styles.draftText}>{context.draft}</Text>
        </View>

        <View style={styles.contextCard}>
          <Text style={styles.contextCardTitle}>Context provided</Text>
          {context.situation ? (
            <View style={styles.contextRow}>
              <Text style={styles.contextRowLabel}>Situation</Text>
              <Text style={styles.contextRowValue}>{context.situation}</Text>
            </View>
          ) : null}
          {context.emotionalState ? (
            <View style={styles.contextRow}>
              <Text style={styles.contextRowLabel}>Feeling</Text>
              <Text style={styles.contextRowValue}>{context.emotionalState.replace(/_/g, ' ')}</Text>
            </View>
          ) : null}
          {context.interpretation ? (
            <View style={styles.contextRow}>
              <Text style={styles.contextRowLabel}>Interpretation</Text>
              <Text style={styles.contextRowValue}>{context.interpretation.replace(/_/g, ' ')}</Text>
            </View>
          ) : null}
          {context.urge ? (
            <View style={styles.contextRow}>
              <Text style={styles.contextRowLabel}>Urge</Text>
              <Text style={styles.contextRowValue}>{context.urge.replace(/_/g, ' ')}</Text>
            </View>
          ) : null}
          {context.desiredOutcome ? (
            <View style={styles.contextRow}>
              <Text style={styles.contextRowLabel}>Goal</Text>
              <Text style={styles.contextRowValue}>{context.desiredOutcome.replace(/_/g, ' ')}</Text>
            </View>
          ) : null}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  recBanner: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    gap: 12,
  },
  recBannerEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  recBannerContent: {
    flex: 1,
  },
  recBannerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  recBannerDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  overallCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  overallCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  overallScore: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  overallMax: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
  },
  overallTextWrap: {
    flex: 1,
  },
  overallLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  overallDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  concernRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    alignItems: 'flex-start',
  },
  concernLevel: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  concernLevelText: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  concernContent: {
    flex: 1,
  },
  concernName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  concernDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  strengthsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  strengthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  strengthPillText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500' as const,
  },
  breakdownList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  breakdownRow: {
    gap: 6,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownEmoji: {
    fontSize: 14,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  scoreBarTrack: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: 6,
    borderRadius: 3,
  },
  draftCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  draftLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  draftText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  contextCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  contextCardTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  contextRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  contextRowLabel: {
    width: 100,
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  contextRowValue: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    textTransform: 'capitalize' as const,
  },
});
