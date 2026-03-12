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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { computeProgressSummary } from '@/services/progress/progressService';
import { ProgressSummary, CopingSuccessItem, EmotionDistributionItem, Milestone } from '@/types/progress';

function BarChart({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) {
  const barAnims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = barAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: i * 40,
        useNativeDriver: false,
      })
    );
    Animated.stagger(30, animations).start();
  }, [barAnims]);

  const effectiveMax = maxValue > 0 ? maxValue : 10;

  return (
    <View style={barStyles.container}>
      {data.map((point, i) => {
        const heightPercent = point.value > 0 ? (point.value / effectiveMax) * 100 : 0;
        const barHeight = barAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.max(heightPercent, 4)],
        });
        const isHighDistress = point.value >= 7;
        const isMedDistress = point.value >= 4 && point.value < 7;
        const barColor = isHighDistress ? Colors.danger : isMedDistress ? Colors.accent : Colors.primary;

        return (
          <View key={`${point.label}-${i}`} style={barStyles.barGroup}>
            <View style={barStyles.barTrack}>
              <Animated.View
                style={[
                  barStyles.bar,
                  {
                    height: barHeight.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: point.value > 0 ? barColor : Colors.borderLight,
                  },
                ]}
              />
            </View>
            <Text style={barStyles.label}>{point.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    height: 130,
    gap: 4,
    paddingTop: 8,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center' as const,
  },
  barTrack: {
    width: '70%',
    height: 100,
    justifyContent: 'flex-end' as const,
    borderRadius: 6,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden' as const,
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 2,
  },
  label: {
    fontSize: 9,
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
        <Text style={copingStyles.meta}>{item.timesUsed}× used · avg -{item.avgReduction} intensity</Text>
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
    width: 80,
    alignItems: 'center' as const,
    padding: 10,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    marginRight: 10,
  },
  locked: {
    backgroundColor: Colors.surface,
    opacity: 0.6,
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

export default function ProgressScreen() {
  const { journalEntries, messageDrafts } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const summary: ProgressSummary = useMemo(
    () => computeProgressSummary(journalEntries, messageDrafts),
    [journalEntries, messageDrafts]
  );

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
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [fadeAnim, slideAnim]);

  const { metrics, weekComparison, distressTrend, emotionDistribution, copingSuccess, milestones } = summary;

  const trendIcon = weekComparison.direction === 'improved'
    ? <TrendingDown size={18} color={Colors.success} />
    : weekComparison.direction === 'worsened'
      ? <TrendingUp size={18} color={Colors.danger} />
      : <Minus size={18} color={Colors.textMuted} />;

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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Progress', headerTintColor: Colors.text }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.encourageCard}>
            <View style={styles.encourageIconWrap}>
              <Award size={22} color={Colors.white} />
            </View>
            <Text style={styles.encourageText}>{summary.encouragingMessage}</Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: Colors.accentLight }]}>
                <Target size={16} color={Colors.accent} />
              </View>
              <Text style={styles.metricValue}>{metrics.totalCheckIns}</Text>
              <Text style={styles.metricLabel}>Check-Ins</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: '#FFF0E6' }]}>
                <Flame size={16} color="#E17055" />
              </View>
              <Text style={styles.metricValue}>{metrics.journalStreak}</Text>
              <Text style={styles.metricLabel}>Day Streak</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: Colors.primaryLight }]}>
                <Heart size={16} color={Colors.primary} />
              </View>
              <Text style={styles.metricValue}>{metrics.copingExercisesUsed}</Text>
              <Text style={styles.metricLabel}>Coping Used</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: '#E6F0FF' }]}>
                <Pause size={16} color="#3B82F6" />
              </View>
              <Text style={styles.metricValue}>{metrics.successfulMessagePauses}</Text>
              <Text style={styles.metricLabel}>Msg Pauses</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Distress This Week vs Last</Text>
              <View style={styles.trendBadge}>
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
            <Text style={styles.cardTitle}>Distress Trend (14 Days)</Text>
            <Text style={styles.cardSubtitle}>Average intensity per day</Text>
            <BarChart
              data={distressTrend.map(p => ({ label: p.label, value: p.value }))}
              maxValue={maxDistress}
            />
          </View>

          {emotionDistribution.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Emotion Distribution</Text>
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
                <Text style={styles.cardTitle}>Coping Success Rate</Text>
                <View style={[styles.trendBadge, { backgroundColor: Colors.successLight }]}>
                  <CheckCircle size={14} color={Colors.success} />
                </View>
              </View>
              <Text style={styles.cardSubtitle}>How effective each tool has been</Text>
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
                <View style={[styles.metricIcon, { backgroundColor: '#FFE6F0' }]}>
                  <Shield size={16} color="#E84393" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardTitle}>Relationship Conflicts</Text>
                  <Text style={styles.conflictText}>
                    {metrics.relationshipConflictReduction > 0
                      ? `${metrics.relationshipConflictReduction}% fewer this week`
                      : `${Math.abs(metrics.relationshipConflictReduction)}% more this week`}
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
    paddingTop: 16,
  },
  encourageCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  encourageIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  encourageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%' as unknown as number,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  metricIcon: {
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
    fontSize: 16,
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
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    gap: 20,
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
  conflictText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 40,
  },
});
