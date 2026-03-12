import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle,
  Flame,
  Target,
  Heart,
  Pause,
  Shield,
  Award,
  Lock,
  PenLine,
  MessageSquare,
  Activity,
  Calendar,
  Sparkles,
  Eye,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { computeProgressSummary } from '@/services/progress/progressService';
import {
  ProgressSummary,
  CopingSuccessItem,
  EmotionDistributionItem,
  Milestone,
  EncouragingInsight,
  TriggerFrequencyItem,
} from '@/types/progress';

function DistressChart({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) {
  const barAnims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = barAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: i * 30,
        useNativeDriver: false,
      })
    );
    Animated.stagger(20, animations).start();
  }, [barAnims]);

  const effectiveMax = maxValue > 0 ? maxValue : 10;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.yAxis}>
        {[10, 7, 4, 1].map(v => (
          <Text key={v} style={chartStyles.yLabel}>{v}</Text>
        ))}
      </View>
      <View style={chartStyles.barsWrap}>
        {data.map((point, i) => {
          const heightPercent = point.value > 0 ? (point.value / effectiveMax) * 100 : 0;
          const barHeight = barAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.max(heightPercent, 3)],
          });
          const isHigh = point.value >= 7;
          const isMed = point.value >= 4 && point.value < 7;
          const barColor = isHigh ? '#E8836C' : isMed ? '#E8B86C' : '#6B9080';

          return (
            <View key={`${point.label}-${i}`} style={chartStyles.barGroup}>
              <View style={chartStyles.barTrack}>
                <Animated.View
                  style={[
                    chartStyles.bar,
                    {
                      height: barHeight.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: point.value > 0 ? barColor : 'transparent',
                    },
                  ]}
                />
              </View>
              <Text style={chartStyles.xLabel}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row' as const,
    height: 140,
    marginTop: 12,
  },
  yAxis: {
    width: 22,
    justifyContent: 'space-between' as const,
    paddingBottom: 18,
    paddingTop: 2,
  },
  yLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  barsWrap: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 2,
    paddingLeft: 4,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center' as const,
  },
  barTrack: {
    width: '75%',
    height: 110,
    justifyContent: 'flex-end' as const,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden' as const,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  xLabel: {
    fontSize: 8,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500' as const,
  },
});

function EmotionBar({ item, maxCount }: { item: EmotionDistributionItem; maxCount: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: maxCount > 0 ? (item.count / maxCount) * 100 : 0,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, item.count, maxCount]);

  return (
    <View style={emotionStyles.row}>
      <Text style={emotionStyles.emoji}>{item.emoji}</Text>
      <View style={emotionStyles.barContainer}>
        <Animated.View
          style={[
            emotionStyles.bar,
            {
              backgroundColor: item.color,
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={emotionStyles.label}>{item.label}</Text>
      <Text style={emotionStyles.percent}>{item.percentage}%</Text>
    </View>
  );
}

const emotionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  emoji: {
    fontSize: 16,
    width: 26,
  },
  barContainer: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.borderLight,
    borderRadius: 5,
    overflow: 'hidden' as const,
    marginHorizontal: 8,
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 70,
    fontWeight: '500' as const,
  },
  percent: {
    fontSize: 12,
    color: Colors.textMuted,
    width: 34,
    textAlign: 'right' as const,
    fontWeight: '600' as const,
  },
});

function CopingRow({ item }: { item: CopingSuccessItem }) {
  const rateColor = item.successRate >= 70 ? Colors.success : item.successRate >= 40 ? Colors.accent : Colors.textMuted;
  return (
    <View style={copingStyles.row}>
      <View style={copingStyles.info}>
        <Text style={copingStyles.tool} numberOfLines={1}>{item.tool}</Text>
        <Text style={copingStyles.meta}>{item.timesUsed}x used · avg -{item.avgReduction} intensity</Text>
      </View>
      <View style={[copingStyles.badge, { backgroundColor: rateColor + '18' }]}>
        <Text style={[copingStyles.badgeText, { color: rateColor }]}>{item.successRate}%</Text>
      </View>
    </View>
  );
}

const copingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  info: {
    flex: 1,
  },
  tool: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
});

function MilestoneItem({ milestone }: { milestone: Milestone }) {
  return (
    <View style={[milestoneStyles.item, !milestone.achieved && milestoneStyles.locked]}>
      <Text style={milestoneStyles.icon}>{milestone.achieved ? milestone.icon : ''}</Text>
      {!milestone.achieved && (
        <View style={milestoneStyles.lockIcon}>
          <Lock size={12} color={Colors.textMuted} />
        </View>
      )}
      <Text style={[milestoneStyles.label, !milestone.achieved && milestoneStyles.labelLocked]} numberOfLines={2}>
        {milestone.label}
      </Text>
    </View>
  );
}

const milestoneStyles = StyleSheet.create({
  item: {
    width: 84,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    marginRight: 10,
  },
  locked: {
    backgroundColor: Colors.surface,
    opacity: 0.5,
  },
  icon: {
    fontSize: 24,
    marginBottom: 6,
  },
  lockIcon: {
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
    textAlign: 'center' as const,
  },
  labelLocked: {
    color: Colors.textMuted,
  },
});

function InsightCard({ insight }: { insight: EncouragingInsight }) {
  const TYPE_COLORS: Record<string, { bg: string; border: string }> = {
    regulation: { bg: '#EFF6FF', border: '#DBEAFE' },
    consistency: { bg: '#FFF7ED', border: '#FED7AA' },
    growth: { bg: '#ECFDF5', border: '#A7F3D0' },
    coping: { bg: '#F0FDF4', border: '#BBF7D0' },
    awareness: { bg: '#FDF4FF', border: '#E9D5FF' },
  };

  const colors = TYPE_COLORS[insight.type] ?? TYPE_COLORS.growth;

  return (
    <View style={[insightStyles.card, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={insightStyles.icon}>{insight.icon}</Text>
      <Text style={insightStyles.text}>{insight.text}</Text>
    </View>
  );
}

const insightStyles = StyleSheet.create({
  card: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  icon: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
    fontWeight: '500' as const,
  },
});

function TriggerChip({ item }: { item: TriggerFrequencyItem }) {
  const CATEGORY_COLORS: Record<string, string> = {
    relationship: '#E84393',
    self: '#8B5CF6',
    situation: '#3B82F6',
    memory: '#D4956A',
    other: Colors.textSecondary,
  };
  const color = CATEGORY_COLORS[item.category] ?? Colors.textSecondary;

  return (
    <View style={[triggerStyles.chip, { borderColor: color + '30', backgroundColor: color + '0A' }]}>
      <View style={[triggerStyles.dot, { backgroundColor: color }]} />
      <Text style={triggerStyles.label} numberOfLines={1}>{item.label}</Text>
      <Text style={[triggerStyles.count, { color }]}>{item.count}x</Text>
    </View>
  );
}

const triggerStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
    marginRight: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  count: {
    fontSize: 12,
    fontWeight: '700' as const,
    marginLeft: 8,
  },
});

function EmptyStateCard() {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconWrap}>
        <Sparkles size={28} color={Colors.primary} />
      </View>
      <Text style={emptyStyles.title}>Your progress story starts here</Text>
      <Text style={emptyStyles.body}>
        As you check in, journal, and use support tools, this space will reveal patterns of growth you might not notice on your own.
      </Text>
      <Text style={emptyStyles.hint}>Even small check-ins count.</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center' as const,
    padding: 32,
    paddingTop: 48,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center' as const,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
    maxWidth: 280,
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600' as const,
    fontStyle: 'italic' as const,
  },
});

export default function ProgressScreen() {
  const { journalEntries, messageDrafts } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const summary: ProgressSummary = useMemo(
    () => computeProgressSummary(journalEntries, messageDrafts),
    [journalEntries, messageDrafts]
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [fadeAnim, slideAnim]);

  const { metrics, weekComparison, distressTrend, emotionDistribution, copingSuccess, milestones, regulation, consistency, triggerFrequency, encouragingInsights } = summary;

  const trendIcon = weekComparison.direction === 'improved'
    ? <TrendingDown size={16} color={Colors.success} />
    : weekComparison.direction === 'worsened'
      ? <TrendingUp size={16} color={Colors.danger} />
      : <Minus size={16} color={Colors.textMuted} />;

  const trendColor = weekComparison.direction === 'improved'
    ? Colors.success
    : weekComparison.direction === 'worsened'
      ? Colors.danger
      : Colors.textSecondary;

  const trendLabel = weekComparison.direction === 'improved'
    ? `${weekComparison.changePercent}% lower`
    : weekComparison.direction === 'worsened'
      ? `${weekComparison.changePercent}% higher`
      : 'stable';

  const maxDistress = Math.max(...distressTrend.map(p => p.value), 1);
  const maxEmotionCount = emotionDistribution.length > 0 ? emotionDistribution[0].count : 1;
  const achievedCount = milestones.filter(m => m.achieved).length;

  if (!summary.hasEnoughData) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Progress', headerTintColor: Colors.text }} />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <EmptyStateCard />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Progress', headerTintColor: Colors.text }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Award size={20} color={Colors.white} />
            </View>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Your Progress</Text>
              <Text style={styles.heroMessage}>{summary.encouragingMessage}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FFF0E6' }]}>
                <Target size={15} color="#E17055" />
              </View>
              <Text style={styles.metricValue}>{metrics.totalCheckIns}</Text>
              <Text style={styles.metricLabel}>Check-Ins</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FFF7ED' }]}>
                <Flame size={15} color="#D4956A" />
              </View>
              <Text style={styles.metricValue}>{metrics.journalStreak}</Text>
              <Text style={styles.metricLabel}>Day Streak</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: Colors.primaryLight }]}>
                <Heart size={15} color={Colors.primary} />
              </View>
              <Text style={styles.metricValue}>{metrics.copingExercisesUsed}</Text>
              <Text style={styles.metricLabel}>Tools Used</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Distress This Week</Text>
              <View style={[styles.trendBadge, { backgroundColor: trendColor + '14' }]}>
                {trendIcon}
                <Text style={[styles.trendText, { color: trendColor }]}>{trendLabel}</Text>
              </View>
            </View>
            <View style={styles.weekCompare}>
              <View style={styles.weekCol}>
                <Text style={styles.weekValue}>{weekComparison.lastWeekAvgDistress || '—'}</Text>
                <Text style={styles.weekLabel}>Last Week</Text>
              </View>
              <View style={styles.weekArrow}>
                {trendIcon}
              </View>
              <View style={styles.weekCol}>
                <Text style={[styles.weekValue, { color: trendColor }]}>
                  {weekComparison.thisWeekAvgDistress || '—'}
                </Text>
                <Text style={styles.weekLabel}>This Week</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Distress Trend</Text>
            <Text style={styles.cardSubtitle}>Average intensity over 14 days</Text>
            <DistressChart
              data={distressTrend.map(p => ({ label: p.label, value: p.value }))}
              maxValue={maxDistress}
            />
          </View>

          {encouragingInsights.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Encouraging Patterns</Text>
              <Text style={styles.sectionSubtitle}>What the data suggests about your growth</Text>
              {encouragingInsights.map(insight => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Regulation Behavior</Text>
          <Text style={styles.sectionSubtitle}>How you've been managing emotional moments</Text>
          <View style={styles.regulationGrid}>
            <View style={styles.regulationCard}>
              <View style={[styles.regIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Pause size={16} color="#3B82F6" />
              </View>
              <Text style={styles.regValue}>{regulation.pausesBeforeSending}</Text>
              <Text style={styles.regLabel}>Message Pauses</Text>
            </View>
            <View style={styles.regulationCard}>
              <View style={[styles.regIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Activity size={16} color="#10B981" />
              </View>
              <Text style={styles.regValue}>{regulation.groundingUsed}</Text>
              <Text style={styles.regLabel}>Grounding Used</Text>
            </View>
            <View style={styles.regulationCard}>
              <View style={[styles.regIconWrap, { backgroundColor: '#FDF4FF' }]}>
                <PenLine size={16} color="#A855F7" />
              </View>
              <Text style={styles.regValue}>{regulation.rewritesUsed}</Text>
              <Text style={styles.regLabel}>Rewrites</Text>
            </View>
            <View style={styles.regulationCard}>
              <View style={[styles.regIconWrap, { backgroundColor: '#FFF7ED' }]}>
                <MessageSquare size={16} color="#D4956A" />
              </View>
              <Text style={styles.regValue}>{regulation.constructiveOutcomes}</Text>
              <Text style={styles.regLabel}>Helped</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Consistency</Text>
          <Text style={styles.sectionSubtitle}>Showing up is its own kind of progress</Text>
          <View style={styles.consistencyCard}>
            <View style={styles.consistencyRow}>
              <View style={styles.consistencyItem}>
                <Flame size={18} color="#E17055" />
                <View style={styles.consistencyText}>
                  <Text style={styles.consistencyValue}>{consistency.journalStreak} days</Text>
                  <Text style={styles.consistencyLabel}>Journal streak</Text>
                </View>
              </View>
              <View style={styles.consistencyDivider} />
              <View style={styles.consistencyItem}>
                <Calendar size={18} color="#3B82F6" />
                <View style={styles.consistencyText}>
                  <Text style={styles.consistencyValue}>{consistency.weeklyActiveDays}/7</Text>
                  <Text style={styles.consistencyLabel}>Active this week</Text>
                </View>
              </View>
            </View>
            {consistency.ritualStreak > 0 && (
              <View style={styles.consistencyExtra}>
                <Sparkles size={14} color={Colors.primary} />
                <Text style={styles.consistencyExtraText}>
                  Daily ritual streak: {consistency.ritualStreak} day{consistency.ritualStreak !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {triggerFrequency.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Top Triggers</Text>
              <Text style={styles.sectionSubtitle}>Most common this month</Text>
              <View style={styles.triggerList}>
                {triggerFrequency.map(item => (
                  <TriggerChip key={item.label} item={item} />
                ))}
              </View>
            </View>
          )}

          {emotionDistribution.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Emotion Frequency</Text>
              <Text style={styles.cardSubtitle}>Most frequent emotions this month</Text>
              <View style={{ marginTop: 12 }}>
                {emotionDistribution.map(item => (
                  <EmotionBar key={item.label} item={item} maxCount={maxEmotionCount} />
                ))}
              </View>
            </View>
          )}

          {copingSuccess.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Coping Effectiveness</Text>
                <View style={[styles.trendBadge, { backgroundColor: Colors.successLight }]}>
                  <CheckCircle size={14} color={Colors.success} />
                </View>
              </View>
              <Text style={styles.cardSubtitle}>How well each tool has supported you</Text>
              <View style={{ marginTop: 4 }}>
                {copingSuccess.map(item => (
                  <CopingRow key={item.tool} item={item} />
                ))}
              </View>
            </View>
          )}

          {metrics.relationshipConflictReduction !== 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.metricIconWrap, { backgroundColor: '#FFE6F0' }]}>
                  <Shield size={16} color="#E84393" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardTitle}>Relationship Conflicts</Text>
                  <Text style={styles.conflictText}>
                    {metrics.relationshipConflictReduction > 0
                      ? `${metrics.relationshipConflictReduction}% fewer this week — that may suggest growing stability.`
                      : `${Math.abs(metrics.relationshipConflictReduction)}% more this week — remember, awareness is progress too.`}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Milestones</Text>
            <Text style={styles.cardSubtitle}>{achievedCount} of {milestones.length} unlocked</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 14 }}
              contentContainerStyle={{ paddingRight: 10 }}
            >
              {milestones.map(m => (
                <MilestoneItem key={m.id} milestone={m} />
              ))}
            </ScrollView>
          </View>

          <View style={styles.closingCard}>
            <Eye size={16} color={Colors.primary} />
            <Text style={styles.closingText}>
              Progress isn't always linear. Noticing your patterns is already a sign of growth.
            </Text>
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
    padding: 20,
    paddingTop: 12,
  },
  heroCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#2D5A47',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroMessage: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  trendBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  weekCompare: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 16,
    gap: 24,
  },
  weekCol: {
    alignItems: 'center' as const,
  },
  weekValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  weekLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  weekArrow: {
    padding: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  regulationGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 24,
  },
  regulationCard: {
    width: '47%' as unknown as number,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexGrow: 1,
  },
  regIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  regValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  regLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  consistencyCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 24,
  },
  consistencyRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  consistencyItem: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  consistencyText: {
    flex: 1,
  },
  consistencyValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  consistencyLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  consistencyDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 14,
  },
  consistencyExtra: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 8,
  },
  consistencyExtraText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  triggerList: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  conflictText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  closingCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginTop: 6,
  },
  closingText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: '500' as const,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
  bottomSpacer: {
    height: 40,
  },
});
