import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Minus,
  Zap,
  Heart,
  AlertTriangle,
  Shield,
  Sparkles,
  Flame,
  MessageSquare,
  Pause,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useInsightsDashboard } from '@/hooks/useInsightsDashboard';
import {
  DistressDataPoint,
  EmotionFrequency,
  TriggerPattern,
  UrgePattern,
  CopingEffectivenessItem,
  AISummaryCard,
  WeeklyMoodAverage,
} from '@/types/insightsDashboard';

function MiniBarChart({ data, maxValue }: { data: DistressDataPoint[]; maxValue: number }) {
  const barAnims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = barAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: i * 50,
        useNativeDriver: false,
      })
    );
    Animated.stagger(30, animations).start();
  }, [barAnims]);

  const safeMax = Math.max(maxValue, 1);

  return (
    <View style={chartStyles.barContainer}>
      {data.map((point, i) => {
        const heightPercent = (point.value / safeMax) * 100;
        const barHeight = barAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', `${Math.max(heightPercent, point.value > 0 ? 8 : 2)}%`],
        });

        const barColor = point.value === 0
          ? Colors.borderLight
          : point.value <= 3
            ? Colors.success
            : point.value <= 6
              ? Colors.accent
              : Colors.danger;

        return (
          <View key={point.date} style={chartStyles.barColumn}>
            <View style={chartStyles.barTrack}>
              <Animated.View
                style={[
                  chartStyles.bar,
                  {
                    backgroundColor: barColor,
                    height: barHeight,
                  },
                ]}
              />
            </View>
            <Text style={chartStyles.barLabel}>{point.dayLabel}</Text>
          </View>
        );
      })}
    </View>
  );
}

function WeeklyAverageChart({ data }: { data: WeeklyMoodAverage[] }) {
  return (
    <View style={chartStyles.weeklyContainer}>
      {data.map((week, i) => {
        const barWidth = Math.max(week.average * 10, week.average > 0 ? 8 : 2);
        const barColor = week.average === 0
          ? Colors.borderLight
          : week.average <= 3
            ? Colors.success
            : week.average <= 6
              ? Colors.accent
              : Colors.danger;

        return (
          <View key={`week-${i}`} style={chartStyles.weeklyRow}>
            <Text style={chartStyles.weeklyLabel} numberOfLines={1}>{week.weekLabel}</Text>
            <View style={chartStyles.weeklyBarTrack}>
              <View
                style={[
                  chartStyles.weeklyBar,
                  { width: `${barWidth}%`, backgroundColor: barColor },
                ]}
              />
            </View>
            <Text style={chartStyles.weeklyValue}>
              {week.average > 0 ? week.average.toFixed(1) : '—'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function EmotionChips({ emotions }: { emotions: EmotionFrequency[] }) {
  return (
    <View style={chartStyles.chipGrid}>
      {emotions.map((emotion) => (
        <View key={emotion.label} style={[chartStyles.chip, { borderColor: emotion.color + '40' }]}>
          <Text style={chartStyles.chipEmoji}>{emotion.emoji}</Text>
          <View style={chartStyles.chipTextWrap}>
            <Text style={chartStyles.chipLabel}>{emotion.label}</Text>
            <Text style={chartStyles.chipPercent}>{emotion.percentage}%</Text>
          </View>
          <View style={[chartStyles.chipBar, { backgroundColor: emotion.color + '20' }]}>
            <View style={[chartStyles.chipBarFill, { width: `${emotion.percentage}%`, backgroundColor: emotion.color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function TriggerCards({ triggers }: { triggers: TriggerPattern[] }) {
  return (
    <View style={chartStyles.triggerList}>
      {triggers.map((trigger) => (
        <View key={trigger.label} style={chartStyles.triggerRow}>
          <View style={[chartStyles.triggerDot, { backgroundColor: trigger.color }]} />
          <Text style={chartStyles.triggerLabel} numberOfLines={1}>{trigger.label}</Text>
          <View style={chartStyles.triggerMeta}>
            {trigger.trend === 'up' && <ChevronUp size={12} color={Colors.danger} />}
            {trigger.trend === 'down' && <ChevronDown size={12} color={Colors.success} />}
            <Text style={chartStyles.triggerPercent}>{trigger.percentage}%</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function UrgeCards({ urges }: { urges: UrgePattern[] }) {
  const riskColor = (risk: string) => {
    if (risk === 'high') return Colors.danger;
    if (risk === 'medium') return Colors.accent;
    return Colors.success;
  };

  return (
    <View style={chartStyles.urgeList}>
      {urges.map((urge) => (
        <View key={urge.label} style={chartStyles.urgeRow}>
          <View style={[chartStyles.urgeDot, { backgroundColor: riskColor(urge.risk) }]} />
          <Text style={chartStyles.urgeLabel} numberOfLines={1}>{urge.label}</Text>
          <Text style={[chartStyles.urgePercent, { color: riskColor(urge.risk) }]}>{urge.percentage}%</Text>
        </View>
      ))}
    </View>
  );
}

function CopingCards({ items }: { items: CopingEffectivenessItem[] }) {
  return (
    <View style={chartStyles.copingList}>
      {items.map((item) => {
        const isEffective = item.reductionPercent > 0;
        return (
          <View key={item.tool} style={chartStyles.copingCard}>
            <View style={chartStyles.copingHeader}>
              <Text style={chartStyles.copingTool} numberOfLines={1}>{item.tool}</Text>
              <Text style={[chartStyles.copingReduction, { color: isEffective ? Colors.success : Colors.textMuted }]}>
                {isEffective ? `↓ ${item.reductionPercent}%` : 'No change'}
              </Text>
            </View>
            <View style={chartStyles.copingBarWrap}>
              <View style={chartStyles.copingBarBg}>
                <View style={[chartStyles.copingBarBefore, { width: `${item.avgDistressBefore * 10}%` }]} />
              </View>
              <View style={chartStyles.copingBarBg}>
                <View style={[chartStyles.copingBarAfter, { width: `${item.avgDistressAfter * 10}%` }]} />
              </View>
            </View>
            <View style={chartStyles.copingLegend}>
              <Text style={chartStyles.copingLegendText}>Before: {item.avgDistressBefore}</Text>
              <Text style={chartStyles.copingLegendText}>After: {item.avgDistressAfter}</Text>
              <Text style={chartStyles.copingLegendText}>Used {item.timesUsed}×</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function SummaryCards({ summaries }: { summaries: AISummaryCard[] }) {
  return (
    <View style={chartStyles.summaryList}>
      {summaries.map((card) => {
        const bgColor = card.sentiment === 'encouraging'
          ? Colors.successLight
          : card.sentiment === 'gentle'
            ? Colors.accentLight
            : Colors.primaryLight;

        return (
          <View key={card.id} style={[chartStyles.summaryCard, { backgroundColor: bgColor }]}>
            <Text style={chartStyles.summaryIcon}>{card.icon}</Text>
            <Text style={chartStyles.summaryText}>{card.text}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function InsightsDashboardScreen() {
  const router = useRouter();
  const { dashboard, selectedRange, changeRange, timeRanges, isLoading, hasData } = useInsightsDashboard();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const trendIcon = dashboard.distressTrendDirection === 'falling'
    ? <TrendingDown size={16} color={Colors.success} />
    : dashboard.distressTrendDirection === 'rising'
      ? <TrendingUp size={16} color={Colors.danger} />
      : <Minus size={14} color={Colors.textMuted} />;

  const trendLabel = dashboard.distressTrendDirection === 'falling'
    ? 'Decreasing'
    : dashboard.distressTrendDirection === 'rising'
      ? 'Increasing'
      : dashboard.distressTrendDirection === 'stable'
        ? 'Stable'
        : 'Not enough data';

  const trendColor = dashboard.distressTrendDirection === 'falling'
    ? Colors.success
    : dashboard.distressTrendDirection === 'rising'
      ? Colors.danger
      : Colors.textSecondary;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            handleHaptic();
            router.back();
          }}
          testID="insights-dashboard-back"
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Insights Dashboard</Text>
          <Text style={styles.headerSubtitle}>Your emotional patterns</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.rangeSelector}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.key}
                style={[styles.rangeChip, selectedRange.key === range.key && styles.rangeChipActive]}
                onPress={() => {
                  handleHaptic();
                  changeRange(range);
                }}
              >
                <Text style={[styles.rangeChipText, selectedRange.key === range.key && styles.rangeChipTextActive]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {!hasData ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Sparkles size={32} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Your insights will appear here</Text>
              <Text style={styles.emptySubtitle}>
                Start checking in and journaling to see your emotional patterns come to life.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: Colors.primaryLight }]}>
                    <Heart size={15} color={Colors.primary} />
                  </View>
                  <Text style={styles.statValue}>{dashboard.totalCheckIns}</Text>
                  <Text style={styles.statLabel}>Check-ins</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: Colors.accentLight }]}>
                    <Zap size={15} color={Colors.accent} />
                  </View>
                  <Text style={styles.statValue}>{dashboard.averageDistress || '—'}</Text>
                  <Text style={styles.statLabel}>Avg Distress</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: Colors.successLight }]}>
                    <Flame size={15} color={Colors.success} />
                  </View>
                  <Text style={styles.statValue}>{dashboard.journalStreak}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
              </View>

              <View style={styles.miniStatsRow}>
                <View style={styles.miniStat}>
                  <MessageSquare size={13} color={Colors.primary} />
                  <Text style={styles.miniStatText}>{dashboard.messageRewriteCount} rewrites</Text>
                </View>
                <View style={styles.miniStatDivider} />
                <View style={styles.miniStat}>
                  <Pause size={13} color={Colors.accent} />
                  <Text style={styles.miniStatText}>{dashboard.pauseCount} pauses</Text>
                </View>
                <View style={styles.miniStatDivider} />
                <View style={styles.miniStat}>
                  {trendIcon}
                  <Text style={[styles.miniStatText, { color: trendColor }]}>{trendLabel}</Text>
                </View>
              </View>

              {dashboard.aiSummaries.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Sparkles size={16} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>AI Summary</Text>
                  </View>
                  <SummaryCards summaries={dashboard.aiSummaries} />
                </View>
              )}

              {dashboard.distressTrend.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <TrendingDown size={16} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>Distress Over Time</Text>
                  </View>
                  <View style={styles.card}>
                    <MiniBarChart
                      data={dashboard.distressTrend.slice(-7)}
                      maxValue={10}
                    />
                  </View>
                </View>
              )}

              {dashboard.weeklyMoodAverages.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Heart size={16} color={Colors.accent} />
                    <Text style={styles.sectionTitle}>Weekly Mood Averages</Text>
                  </View>
                  <View style={styles.card}>
                    <WeeklyAverageChart data={dashboard.weeklyMoodAverages} />
                  </View>
                </View>
              )}

              {dashboard.emotionDistribution.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Heart size={16} color="#3B82F6" />
                    <Text style={styles.sectionTitle}>Emotional States</Text>
                  </View>
                  <View style={styles.card}>
                    <EmotionChips emotions={dashboard.emotionDistribution} />
                  </View>
                </View>
              )}

              {dashboard.triggerPatterns.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Zap size={16} color={Colors.danger} />
                    <Text style={styles.sectionTitle}>Trigger Patterns</Text>
                  </View>
                  <View style={styles.card}>
                    <TriggerCards triggers={dashboard.triggerPatterns} />
                  </View>
                </View>
              )}

              {dashboard.urgePatterns.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <AlertTriangle size={16} color={Colors.accent} />
                    <Text style={styles.sectionTitle}>Urge Patterns</Text>
                  </View>
                  <View style={styles.card}>
                    <UrgeCards urges={dashboard.urgePatterns} />
                  </View>
                </View>
              )}

              {dashboard.copingEffectiveness.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Shield size={16} color={Colors.success} />
                    <Text style={styles.sectionTitle}>Coping Effectiveness</Text>
                  </View>
                  <CopingCards items={dashboard.copingEffectiveness} />
                </View>
              )}
            </>
          )}
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-between' as const,
    height: 120,
    paddingTop: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center' as const,
    gap: 6,
  },
  barTrack: {
    width: '60%',
    height: 100,
    justifyContent: 'flex-end' as const,
    borderRadius: 6,
    overflow: 'hidden' as const,
    backgroundColor: Colors.surface,
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  weeklyContainer: {
    gap: 10,
  },
  weeklyRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  weeklyLabel: {
    width: 80,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  weeklyBarTrack: {
    flex: 1,
    height: 14,
    backgroundColor: Colors.surface,
    borderRadius: 7,
    overflow: 'hidden' as const,
  },
  weeklyBar: {
    height: '100%',
    borderRadius: 7,
    minWidth: 2,
  },
  weeklyValue: {
    width: 30,
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600' as const,
    textAlign: 'right' as const,
  },
  chipGrid: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  chipEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  chipTextWrap: {
    flex: 1,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  chipPercent: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  chipBar: {
    width: 60,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden' as const,
    marginLeft: 8,
  },
  chipBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  triggerList: {
    gap: 10,
  },
  triggerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  triggerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  triggerLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  triggerMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
  },
  triggerPercent: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  urgeList: {
    gap: 10,
  },
  urgeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  urgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  urgeLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  urgePercent: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  copingList: {
    gap: 10,
  },
  copingCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  copingHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  copingTool: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  copingReduction: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  copingBarWrap: {
    gap: 5,
    marginBottom: 8,
  },
  copingBarBg: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  copingBarBefore: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  copingBarAfter: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  copingLegend: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  copingLegendText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  summaryList: {
    gap: 10,
  },
  summaryCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  summaryIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  rangeSelector: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  rangeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center' as const,
  },
  rangeChipActive: {
    backgroundColor: Colors.card,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  rangeChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  rangeChipTextActive: {
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  miniStatsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 10,
  },
  miniStat: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
  },
  miniStatText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  miniStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.borderLight,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  bottomSpacer: {
    height: 40,
  },
});
