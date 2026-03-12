import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Zap,
  Heart,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Shield,
  BarChart3,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useInsights } from '@/hooks/useInsights';
import {
  WeeklyIntensityPoint,
  TriggerFrequencyItem,
  MoodDistributionItem,
  ExerciseEffectiveness,
  CopingToolUsage,
} from '@/types/insights';

const BAR_MAX_HEIGHT = 120;
const CHART_COLORS = {
  bar: '#6B9080',
  barLight: '#E3EDE8',
  barHighlight: '#D4956A',
  gridLine: '#F0ECE7',
};

function AnimatedBar({ value, maxValue, index, color }: { value: number; maxValue: number; index: number; color: string }) {
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: maxValue > 0 ? (value / maxValue) * BAR_MAX_HEIGHT : 0,
      duration: 600,
      delay: index * 80,
      useNativeDriver: false,
    }).start();
  }, [heightAnim, value, maxValue, index]);

  return (
    <Animated.View
      style={[
        styles.barFill,
        {
          height: heightAnim,
          backgroundColor: color,
        },
      ]}
    />
  );
}

function WeeklyChart({ data }: { data: WeeklyIntensityPoint[] }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleRow}>
          <View style={[styles.chartIconWrap, { backgroundColor: '#E3EDE8' }]}>
            <BarChart3 size={16} color={Colors.primary} />
          </View>
          <Text style={styles.chartTitle}>Weekly Intensity</Text>
        </View>
        <Text style={styles.chartSubtitle}>Last 7 days</Text>
      </View>
      <View style={styles.barChart}>
        <View style={styles.gridLines}>
          {[10, 7, 4, 1].map(v => (
            <View key={v} style={styles.gridLine}>
              <Text style={styles.gridLabel}>{v}</Text>
              <View style={styles.gridDash} />
            </View>
          ))}
        </View>
        <View style={styles.barsRow}>
          {data.map((point, i) => {
            const isHighest = point.value === maxValue && point.value > 0;
            return (
              <View key={point.date} style={styles.barColumn}>
                <View style={styles.barContainer}>
                  <AnimatedBar
                    value={point.value}
                    maxValue={10}
                    index={i}
                    color={isHighest ? CHART_COLORS.barHighlight : CHART_COLORS.bar}
                  />
                </View>
                <Text style={[styles.barLabel, isHighest && styles.barLabelHighlight]}>
                  {point.day}
                </Text>
                {point.value > 0 && (
                  <Text style={styles.barValue}>{point.value}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function HorizontalBar({ item, maxPercentage, index }: { item: TriggerFrequencyItem; maxPercentage: number; index: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: maxPercentage > 0 ? (item.percentage / maxPercentage) * 100 : 0,
      duration: 500,
      delay: index * 60,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, item.percentage, maxPercentage, index]);

  return (
    <View style={styles.hBarRow}>
      <Text style={styles.hBarLabel} numberOfLines={1}>{item.label}</Text>
      <View style={styles.hBarTrack}>
        <Animated.View
          style={[
            styles.hBarFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: item.color,
            },
          ]}
        />
      </View>
      <Text style={styles.hBarPercent}>{item.percentage}%</Text>
    </View>
  );
}

function TriggerChart({ data }: { data: TriggerFrequencyItem[] }) {
  if (data.length === 0) return null;
  const maxPct = Math.max(...data.map(d => d.percentage));

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleRow}>
          <View style={[styles.chartIconWrap, { backgroundColor: Colors.accentLight }]}>
            <Zap size={16} color={Colors.accent} />
          </View>
          <Text style={styles.chartTitle}>Trigger Frequency</Text>
        </View>
        <Text style={styles.chartSubtitle}>Past 30 days</Text>
      </View>
      {data.map((item, i) => (
        <HorizontalBar key={item.label} item={item} maxPercentage={maxPct} index={i} />
      ))}
    </View>
  );
}

function MoodBubble({ item, index }: { item: MoodDistributionItem; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 60,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, index]);

  return (
    <Animated.View
      style={[
        styles.moodItem,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.moodBubble, { borderColor: item.color + '40' }]}>
        <Text style={styles.moodEmoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.moodLabel} numberOfLines={1}>{item.label}</Text>
      <Text style={styles.moodPercent}>{item.percentage}%</Text>
    </Animated.View>
  );
}

function MoodChart({ data }: { data: MoodDistributionItem[] }) {
  if (data.length === 0) return null;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleRow}>
          <View style={[styles.chartIconWrap, { backgroundColor: '#FDE8E3' }]}>
            <Heart size={16} color="#E17055" />
          </View>
          <Text style={styles.chartTitle}>Mood Distribution</Text>
        </View>
        <Text style={styles.chartSubtitle}>Past 30 days</Text>
      </View>
      <View style={styles.moodGrid}>
        {data.map((item, i) => (
          <MoodBubble key={item.label} item={item} index={i} />
        ))}
      </View>
    </View>
  );
}

function ExerciseChart({ data }: { data: ExerciseEffectiveness[] }) {
  if (data.length === 0) return null;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleRow}>
          <View style={[styles.chartIconWrap, { backgroundColor: Colors.successLight }]}>
            <Activity size={16} color={Colors.success} />
          </View>
          <Text style={styles.chartTitle}>Exercise Effectiveness</Text>
        </View>
        <Text style={styles.chartSubtitle}>Distress before vs after</Text>
      </View>
      {data.map((item) => (
        <View key={item.exerciseId} style={styles.exerciseRow}>
          <Text style={styles.exerciseName} numberOfLines={1}>{item.exerciseName}</Text>
          <View style={styles.exerciseBars}>
            <View style={styles.exerciseBarGroup}>
              <View style={[styles.exerciseBarBefore, { width: `${(item.avgBefore / 10) * 100}%` }]} />
              <Text style={styles.exerciseBarLabel}>{item.avgBefore}</Text>
            </View>
            <View style={styles.exerciseBarGroup}>
              <View style={[styles.exerciseBarAfter, { width: `${(item.avgAfter / 10) * 100}%` }]} />
              <Text style={styles.exerciseBarLabel}>{item.avgAfter}</Text>
            </View>
          </View>
          <View style={styles.exerciseReduction}>
            <Text style={styles.exerciseReductionText}>-{item.reduction}</Text>
          </View>
        </View>
      ))}
      <View style={styles.exerciseLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
          <Text style={styles.legendText}>Before</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>After</Text>
        </View>
      </View>
    </View>
  );
}

function CopingBar({ tool, maxCount, index }: { tool: CopingToolUsage; maxCount: number; index: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: maxCount > 0 ? (tool.count / maxCount) * 100 : 0,
      duration: 500,
      delay: index * 60,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, index, tool.count, maxCount]);

  return (
    <View style={styles.copingRow}>
      <Text style={styles.copingLabel} numberOfLines={1}>{tool.label}</Text>
      <View style={styles.copingBarTrack}>
        <Animated.View
          style={[
            styles.copingBarFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.copingCount}>{tool.count}x</Text>
    </View>
  );
}

function CopingChart({ data }: { data: CopingToolUsage[] }) {
  if (data.length === 0) return null;
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleRow}>
          <View style={[styles.chartIconWrap, { backgroundColor: '#EDE7F6' }]}>
            <Shield size={16} color="#8B5CF6" />
          </View>
          <Text style={styles.chartTitle}>Most Helpful Tools</Text>
        </View>
      </View>
      {data.map((tool, i) => (
        <CopingBar key={tool.label} tool={tool} maxCount={maxCount} index={i} />
      ))}
    </View>
  );
}

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { insights } = useInsights();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const hasData = insights.totalCheckIns > 0;

  const trendIcon = insights.distressTrend === 'falling'
    ? <TrendingDown size={14} color={Colors.success} />
    : insights.distressTrend === 'rising'
      ? <TrendingUp size={14} color={Colors.danger} />
      : <Minus size={14} color={Colors.textMuted} />;

  const trendLabel = insights.distressTrend === 'falling'
    ? 'Improving'
    : insights.distressTrend === 'rising'
      ? 'Elevated'
      : insights.distressTrend === 'stable'
        ? 'Stable'
        : '—';

  const trendColor = insights.distressTrend === 'falling'
    ? Colors.success
    : insights.distressTrend === 'rising'
      ? Colors.danger
      : Colors.textMuted;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          testID="insights-back"
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hasData ? (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.sectionIntro}>
              Your emotional patterns at a glance
            </Text>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: Colors.primaryLight }]}>
                  <Flame size={16} color={Colors.primary} />
                </View>
                <Text style={styles.summaryValue}>{insights.streakDays}</Text>
                <Text style={styles.summaryLabel}>Day Streak</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: Colors.accentLight }]}>
                  <Activity size={16} color={Colors.accent} />
                </View>
                <Text style={styles.summaryValue}>{insights.totalCheckIns}</Text>
                <Text style={styles.summaryLabel}>Check-ins</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: '#FDE8E3' }]}>
                  <Heart size={16} color="#E17055" />
                </View>
                <Text style={styles.summaryValue}>{insights.averageDistress || '—'}</Text>
                <Text style={styles.summaryLabel}>Avg Distress</Text>
              </View>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: insights.distressTrend === 'falling' ? Colors.successLight : insights.distressTrend === 'rising' ? Colors.dangerLight : Colors.surface }]}>
                  {trendIcon}
                </View>
                <Text style={[styles.summaryValue, { color: trendColor, fontSize: 15 }]}>{trendLabel}</Text>
                <Text style={styles.summaryLabel}>Trend</Text>
              </View>
            </View>

            {insights.topTriggerThisWeek && (
              <View style={styles.highlightCard}>
                <View style={styles.highlightRow}>
                  <Zap size={16} color={Colors.accent} />
                  <Text style={styles.highlightLabel}>Top trigger this week</Text>
                </View>
                <Text style={styles.highlightValue}>{insights.topTriggerThisWeek}</Text>
              </View>
            )}

            {insights.topEmotionThisMonth && (
              <View style={styles.highlightCard}>
                <View style={styles.highlightRow}>
                  <Heart size={16} color="#E17055" />
                  <Text style={styles.highlightLabel}>Top emotion this month</Text>
                </View>
                <Text style={styles.highlightValue}>{insights.topEmotionThisMonth}</Text>
              </View>
            )}

            {insights.topUrge && (
              <View style={styles.highlightCard}>
                <View style={styles.highlightRow}>
                  <AlertTriangle size={16} color="#FDCB6E" />
                  <Text style={styles.highlightLabel}>Most common urge</Text>
                </View>
                <Text style={styles.highlightValue}>{insights.topUrge}</Text>
              </View>
            )}

            <WeeklyChart data={insights.weeklyIntensity} />
            <TriggerChart data={insights.triggerFrequency} />
            <MoodChart data={insights.moodDistribution} />
            <ExerciseChart data={insights.exerciseEffectiveness} />
            <CopingChart data={insights.copingTools} />

            <View style={styles.footerMessage}>
              <Text style={styles.footerText}>
                Every check-in builds a clearer picture.{'\n'}You're doing something meaningful.
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={styles.emptyIconWrap}>
              <BarChart3 size={40} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Your insights will appear here</Text>
            <Text style={styles.emptySubtitle}>
              Complete a few check-ins and your emotional patterns will start showing up. Each one helps build a picture of your journey.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/check-in')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Start a Check-in</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionIntro: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  summaryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    minWidth: '22%' as unknown as number,
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  highlightCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  highlightRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 6,
  },
  highlightLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  highlightValue: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginLeft: 24,
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chartHeader: {
    marginBottom: 18,
  },
  chartTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 4,
  },
  chartIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  chartSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 40,
  },
  barChart: {
    flexDirection: 'row' as const,
  },
  gridLines: {
    width: 30,
    justifyContent: 'space-between' as const,
    height: BAR_MAX_HEIGHT,
    marginRight: 6,
  },
  gridLine: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  gridLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    width: 18,
    textAlign: 'right' as const,
  },
  gridDash: {
    flex: 1,
    height: 1,
    backgroundColor: CHART_COLORS.gridLine,
    marginLeft: 4,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'space-around' as const,
    height: BAR_MAX_HEIGHT + 40,
  },
  barColumn: {
    alignItems: 'center' as const,
    flex: 1,
  },
  barContainer: {
    width: 20,
    height: BAR_MAX_HEIGHT,
    borderRadius: 6,
    backgroundColor: CHART_COLORS.barLight,
    justifyContent: 'flex-end' as const,
    overflow: 'hidden' as const,
  },
  barFill: {
    width: '100%' as const,
    borderRadius: 6,
    minHeight: 0,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    fontWeight: '500' as const,
  },
  barLabelHighlight: {
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  barValue: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  hBarRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 10,
  },
  hBarLabel: {
    width: 100,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  hBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.surface,
    overflow: 'hidden' as const,
  },
  hBarFill: {
    height: '100%' as const,
    borderRadius: 5,
  },
  hBarPercent: {
    width: 38,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textAlign: 'right' as const,
  },
  moodGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    justifyContent: 'center' as const,
  },
  moodItem: {
    alignItems: 'center' as const,
    width: 72,
  },
  moodBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    marginBottom: 6,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  moodPercent: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700' as const,
    marginTop: 2,
  },
  exerciseRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
    gap: 10,
  },
  exerciseName: {
    width: 80,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  exerciseBars: {
    flex: 1,
    gap: 4,
  },
  exerciseBarGroup: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  exerciseBarBefore: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  exerciseBarAfter: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  exerciseBarLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  exerciseReduction: {
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exerciseReductionText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  exerciseLegend: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  copingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 10,
  },
  copingLabel: {
    width: 100,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  copingBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.surface,
    overflow: 'hidden' as const,
  },
  copingBarFill: {
    height: '100%' as const,
    borderRadius: 5,
    backgroundColor: '#8B5CF6',
  },
  copingCount: {
    width: 30,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textAlign: 'right' as const,
  },
  footerMessage: {
    marginTop: 24,
    paddingVertical: 20,
    alignItems: 'center' as const,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 22,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 23,
    marginBottom: 28,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
