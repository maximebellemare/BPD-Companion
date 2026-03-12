import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Lightbulb,
  Sparkles,
  ChevronRight,
  Clock,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { generateTherapySummary } from '@/services/therapy/therapySummaryService';
import {
  TherapySummaryReport,
  EmotionalPatternInsight,
  RelationshipPatternInsight,
  ProgressHighlight,
  SuggestedFocusArea,
  CopingStrategyInsight,
} from '@/types/therapySummary';

const PERIOD_OPTIONS = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
];

function EmotionalPatternCard({ pattern }: { pattern: EmotionalPatternInsight }) {
  const TrendIcon = pattern.trend === 'increasing' ? TrendingUp : pattern.trend === 'decreasing' ? TrendingDown : Minus;
  const trendColor = pattern.trend === 'increasing' ? '#E17055' : pattern.trend === 'decreasing' ? Colors.success : Colors.textMuted;

  return (
    <View style={styles.patternCard} testID={`pattern-${pattern.id}`}>
      <View style={styles.patternCardHeader}>
        <Text style={styles.patternEmoji}>{pattern.emoji}</Text>
        <View style={styles.patternCardInfo}>
          <Text style={styles.patternLabel}>{pattern.label}</Text>
          <View style={styles.patternFreqRow}>
            <Text style={styles.patternFreq}>{pattern.frequency}x recently</Text>
            <View style={[styles.trendBadge, { backgroundColor: trendColor + '18' }]}>
              <TrendIcon size={11} color={trendColor} />
              <Text style={[styles.trendText, { color: trendColor }]}>{pattern.trend}</Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.patternNarrative}>{pattern.narrative}</Text>
    </View>
  );
}

function RelationshipInsightCard({ insight }: { insight: RelationshipPatternInsight }) {
  return (
    <View style={styles.relationshipCard} testID={`rel-${insight.id}`}>
      <View style={styles.relationshipDot} />
      <View style={styles.relationshipContent}>
        <Text style={styles.relationshipPattern}>{insight.pattern}</Text>
        <Text style={styles.relationshipContext}>{insight.context}</Text>
        <View style={styles.suggestionPill}>
          <Lightbulb size={12} color={Colors.accent} />
          <Text style={styles.suggestionText}>{insight.suggestion}</Text>
        </View>
      </View>
    </View>
  );
}

function HighlightCard({ highlight }: { highlight: ProgressHighlight }) {
  const bgColor = highlight.type === 'growth' ? '#E0F5EF'
    : highlight.type === 'skill' ? '#E3EDE8'
    : highlight.type === 'consistency' ? '#F5E6D8'
    : '#E6F0FF';

  return (
    <View style={[styles.highlightCard, { backgroundColor: bgColor }]} testID={`highlight-${highlight.id}`}>
      <Text style={styles.highlightIcon}>{highlight.icon}</Text>
      <View style={styles.highlightContent}>
        <Text style={styles.highlightTitle}>{highlight.title}</Text>
        <Text style={styles.highlightDesc}>{highlight.description}</Text>
      </View>
    </View>
  );
}

function FocusAreaCard({ area, onPress }: { area: SuggestedFocusArea; onPress: () => void }) {
  const priorityColor = area.priority === 'high' ? Colors.danger
    : area.priority === 'medium' ? Colors.accent
    : Colors.textMuted;

  return (
    <TouchableOpacity
      style={styles.focusCard}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`focus-${area.id}`}
    >
      <View style={styles.focusCardLeft}>
        <View style={[styles.focusPriorityDot, { backgroundColor: priorityColor }]} />
        <View style={styles.focusCardContent}>
          <Text style={styles.focusArea}>{area.area}</Text>
          <Text style={styles.focusReason}>{area.reason}</Text>
        </View>
      </View>
      <View style={styles.focusAction}>
        <Text style={styles.focusActionLabel}>{area.actionLabel}</Text>
        <ChevronRight size={14} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

function CopingCard({ strategy }: { strategy: CopingStrategyInsight }) {
  const effectColor = strategy.effectiveness === 'helpful' ? Colors.success
    : strategy.effectiveness === 'moderate' ? Colors.accent
    : Colors.textMuted;
  const effectLabel = strategy.effectiveness === 'helpful' ? 'Appears helpful'
    : strategy.effectiveness === 'moderate' ? 'Sometimes helpful'
    : 'More data needed';

  return (
    <View style={styles.copingCard} testID={`coping-${strategy.id}`}>
      <View style={styles.copingHeader}>
        <Text style={styles.copingTool}>{strategy.tool}</Text>
        <View style={[styles.effectBadge, { backgroundColor: effectColor + '18' }]}>
          <Text style={[styles.effectText, { color: effectColor }]}>{effectLabel}</Text>
        </View>
      </View>
      <Text style={styles.copingUsed}>{strategy.timesUsed}x used</Text>
      <Text style={styles.copingNarrative}>{strategy.narrative}</Text>
    </View>
  );
}

export default function ReflectionReportScreen() {
  const router = useRouter();
  const { journalEntries, messageDrafts } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<number>(14);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const report = useMemo<TherapySummaryReport>(() => {
    return generateTherapySummary(journalEntries, messageDrafts, selectedPeriod);
  }, [journalEntries, messageDrafts, selectedPeriod]);

  const handlePeriodChange = useCallback((days: number) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPeriod(days);
  }, []);

  const handleNavigate = useCallback((route?: string) => {
    if (!route) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as never);
  }, [router]);

  const formattedDate = useMemo(() => {
    const d = new Date(report.generatedAt);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [report.generatedAt]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Reflection Report',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.headerCard}>
            <View style={styles.headerIconRow}>
              <View style={styles.headerIconBg}>
                <FileText size={22} color={Colors.white} />
              </View>
            </View>
            <Text style={styles.headerTitle}>Your Reflection</Text>
            <View style={styles.headerMeta}>
              <Clock size={13} color={Colors.textMuted} />
              <Text style={styles.headerDate}>{formattedDate}</Text>
            </View>

            <View style={styles.periodSelector}>
              {PERIOD_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.days}
                  style={[
                    styles.periodChip,
                    selectedPeriod === option.days && styles.periodChipActive,
                  ]}
                  onPress={() => handlePeriodChange(option.days)}
                  testID={`period-${option.days}`}
                >
                  <Text
                    style={[
                      styles.periodChipText,
                      selectedPeriod === option.days && styles.periodChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.narrativeCard}>
            <View style={styles.narrativeIconRow}>
              <Sparkles size={16} color={Colors.primary} />
              <Text style={styles.narrativeLabel}>Summary</Text>
            </View>
            <Text style={styles.narrativeText}>{report.overallNarrative}</Text>
          </View>

          {!report.hasEnoughData && (
            <View style={styles.emptyBanner}>
              <Text style={styles.emptyBannerText}>
                Keep checking in — your reports will become more personalized with more data.
              </Text>
            </View>
          )}

          {report.emotionalPatterns.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Heart size={16} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Emotional Patterns</Text>
              </View>
              {report.emotionalPatterns.map((pattern) => (
                <EmotionalPatternCard key={pattern.id} pattern={pattern} />
              ))}
            </View>
          )}

          {report.relationshipPatterns.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Heart size={16} color="#E84393" />
                <Text style={styles.sectionTitle}>Relationship Patterns</Text>
              </View>
              {report.relationshipPatterns.map((insight) => (
                <RelationshipInsightCard key={insight.id} insight={insight} />
              ))}
            </View>
          )}

          {report.progressHighlights.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={16} color={Colors.success} />
                <Text style={styles.sectionTitle}>Progress Highlights</Text>
              </View>
              {report.progressHighlights.map((highlight) => (
                <HighlightCard key={highlight.id} highlight={highlight} />
              ))}
            </View>
          )}

          {report.copingStrategies.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Shield size={16} color={Colors.accent} />
                <Text style={styles.sectionTitle}>Coping Strategies</Text>
              </View>
              {report.copingStrategies.map((strategy) => (
                <CopingCard key={strategy.id} strategy={strategy} />
              ))}
            </View>
          )}

          {report.suggestedFocusAreas.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Lightbulb size={16} color={Colors.accent} />
                <Text style={styles.sectionTitle}>Suggested Focus Areas</Text>
              </View>
              {report.suggestedFocusAreas.map((area) => (
                <FocusAreaCard
                  key={area.id}
                  area={area}
                  onPress={() => handleNavigate(area.route)}
                />
              ))}
            </View>
          )}

          <View style={styles.closingCard}>
            <View style={styles.closingAccent} />
            <Text style={styles.closingText}>{report.closingReflection}</Text>
          </View>

          <View style={styles.bottomSpacer} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  headerIconRow: {
    marginBottom: 14,
  },
  headerIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  headerMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginBottom: 18,
  },
  headerDate: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  periodSelector: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  periodChipTextActive: {
    color: Colors.white,
  },
  narrativeCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
  },
  narrativeIconRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
    marginBottom: 10,
  },
  narrativeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  narrativeText: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.text,
  },
  emptyBanner: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F5E6D8',
  },
  emptyBannerText: {
    fontSize: 14,
    color: Colors.accent,
    lineHeight: 21,
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  patternCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  patternCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  patternEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  patternCardInfo: {
    flex: 1,
  },
  patternLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  patternFreqRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  patternFreq: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  trendBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  patternNarrative: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  relationshipCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  relationshipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E84393',
    marginTop: 6,
    marginRight: 12,
  },
  relationshipContent: {
    flex: 1,
  },
  relationshipPattern: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  relationshipContext: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  suggestionPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start' as const,
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500' as const,
    flex: 1,
  },
  highlightCard: {
    flexDirection: 'row' as const,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    alignItems: 'flex-start' as const,
  },
  highlightIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  highlightDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  focusCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  focusCardLeft: {
    flexDirection: 'row' as const,
    marginBottom: 12,
  },
  focusPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  focusCardContent: {
    flex: 1,
  },
  focusArea: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  focusReason: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  focusAction: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    alignSelf: 'flex-end' as const,
  },
  focusActionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  copingCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  copingHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 4,
  },
  copingTool: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  effectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  effectText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  copingUsed: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  copingNarrative: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  closingCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 20,
    marginTop: 4,
  },
  closingAccent: {
    width: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginRight: 14,
  },
  closingText: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.primaryDark,
    flex: 1,
    fontStyle: 'italic' as const,
  },
  bottomSpacer: {
    height: 30,
  },
});
