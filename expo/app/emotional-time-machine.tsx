import React, { useRef, useEffect, useCallback, useMemo } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  TrendingDown,
  TrendingUp,
  Minus,
  Heart,
  Zap,
  Shield,
  Users,
  Sprout,
  AlertTriangle,
  Award,
  Eye,
  Pause,
  Activity,
  Lightbulb,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useEmotionalHistory } from '@/hooks/useEmotionalHistory';
import {
  TimePeriodOption,
  EmotionFrequency,
  TriggerFrequency,
  CopingToolStat,
  GrowthMarker,
  AIHistoryInsight,
  DistressDataPoint,
} from '@/services/history/emotionalHistoryService';

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  TrendingDown,
  TrendingUp,
  Heart,
  Shield,
  Users,
  Clock,
  Sprout,
  AlertTriangle,
  Activity,
  Lightbulb,
};

const TREND_CONFIG = {
  up: { icon: TrendingUp, color: '#3B82F6', label: 'Rising' },
  down: { icon: TrendingDown, color: '#14B8A6', label: 'Declining' },
  stable: { icon: Minus, color: '#2E2A72', label: 'Stable' },
} as const;

const GROWTH_TYPE_CONFIG = {
  improvement: { color: '#14B8A6', bg: '#FFFFFF', icon: TrendingDown },
  milestone: { color: '#67E8F9', bg: '#D9E2EC', icon: Award },
  awareness: { color: '#14B8A6', bg: '#D9E2EC', icon: Eye },
} as const;

export default function EmotionalTimeMachineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { snapshot, selectedPeriod, changePeriod, periods, isLoading, hasData } = useEmotionalHistory();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      Animated.spring(headerScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, headerScale]);

  const handlePeriodChange = useCallback((period: TimePeriodOption) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    fadeAnim.setValue(0.3);
    slideAnim.setValue(15);
    changePeriod(period);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, [changePeriod, fadeAnim, slideAnim]);

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const distressChangeColor = useMemo(() => {
    if (snapshot.distressChange < -0.3) return Colors.success;
    if (snapshot.distressChange > 0.3) return Colors.danger;
    return Colors.textSecondary;
  }, [snapshot.distressChange]);

  const maxDistress = useMemo(() => {
    if (snapshot.distressTrend.length === 0) return 10;
    return Math.max(...snapshot.distressTrend.map(d => d.avgDistress), 5);
  }, [snapshot.distressTrend]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your emotional history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerBg, { paddingTop: insets.top }]}>
        <Animated.View style={[styles.header, { transform: [{ scale: headerScale }] }]}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            testID="back-button"
          >
            <ArrowLeft size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerIconRow}>
              <Clock size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.headerTitle}>Emotional Time Machine</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Explore your emotional journey over time
            </Text>
          </View>
        </Animated.View>

        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              onPress={() => handlePeriodChange(period)}
              style={[
                styles.periodBtn,
                selectedPeriod.key === period.key && styles.periodBtnActive,
              ]}
              testID={`period-${period.key}`}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  selectedPeriod.key === period.key && styles.periodBtnTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {!hasData ? (
          <EmptyState />
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <OverviewCards
              avgDistress={snapshot.avgDistress}
              distressChange={snapshot.distressChange}
              distressChangeColor={distressChangeColor}
              totalEntries={snapshot.totalEntries}
              pauseCount={snapshot.pauseBeforeSendCount}
              crisisCount={snapshot.crisisActivations}
            />

            {snapshot.distressTrend.length > 1 && (
              <DistressChart data={snapshot.distressTrend} maxValue={maxDistress} />
            )}

            {snapshot.topEmotions.length > 0 && (
              <EmotionsSection emotions={snapshot.topEmotions} />
            )}

            {snapshot.topTriggers.length > 0 && (
              <TriggersSection triggers={snapshot.topTriggers} />
            )}

            {snapshot.copingTools.length > 0 && (
              <CopingSection tools={snapshot.copingTools} />
            )}

            {snapshot.relationshipStress.totalConflicts > 0 && (
              <RelationshipSection stress={snapshot.relationshipStress} />
            )}

            {snapshot.aiInsights.length > 0 && (
              <AIInsightsSection insights={snapshot.aiInsights} />
            )}

            {snapshot.growthMarkers.length > 0 && (
              <GrowthSection markers={snapshot.growthMarkers} />
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Clock size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No data yet</Text>
      <Text style={styles.emptySubtitle}>
        Complete check-ins and use tools to build your emotional history.
      </Text>
    </View>
  );
}

const OverviewCards = React.memo(function OverviewCards({
  avgDistress,
  distressChange,
  distressChangeColor,
  totalEntries,
  pauseCount,
  crisisCount,
}: {
  avgDistress: number;
  distressChange: number;
  distressChangeColor: string;
  totalEntries: number;
  pauseCount: number;
  crisisCount: number;
}) {
  return (
    <View style={styles.overviewGrid}>
      <View style={[styles.overviewCard, styles.overviewCardWide]}>
        <View style={styles.overviewCardHeader}>
          <Activity size={16} color={Colors.primary} />
          <Text style={styles.overviewLabel}>Avg Distress</Text>
        </View>
        <Text style={styles.overviewValue}>{avgDistress.toFixed(1)}</Text>
        {distressChange !== 0 && (
          <View style={styles.changeRow}>
            {distressChange < 0 ? (
              <TrendingDown size={14} color={distressChangeColor} />
            ) : (
              <TrendingUp size={14} color={distressChangeColor} />
            )}
            <Text style={[styles.changeText, { color: distressChangeColor }]}>
              {distressChange > 0 ? '+' : ''}{distressChange.toFixed(1)} vs previous
            </Text>
          </View>
        )}
      </View>

      <View style={styles.overviewCard}>
        <View style={styles.overviewCardHeader}>
          <Eye size={14} color={Colors.accent} />
          <Text style={styles.overviewLabelSmall}>Check-ins</Text>
        </View>
        <Text style={styles.overviewValueSmall}>{totalEntries}</Text>
      </View>

      <View style={styles.overviewCard}>
        <View style={styles.overviewCardHeader}>
          <Pause size={14} color={Colors.success} />
          <Text style={styles.overviewLabelSmall}>Pauses</Text>
        </View>
        <Text style={styles.overviewValueSmall}>{pauseCount}</Text>
      </View>

      <View style={styles.overviewCard}>
        <View style={styles.overviewCardHeader}>
          <AlertTriangle size={14} color={Colors.danger} />
          <Text style={styles.overviewLabelSmall}>Crisis</Text>
        </View>
        <Text style={styles.overviewValueSmall}>{crisisCount}</Text>
      </View>
    </View>
  );
});

const DistressChart = React.memo(function DistressChart({
  data,
  maxValue,
}: {
  data: DistressDataPoint[];
  maxValue: number;
}) {
  const barAnimations = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = barAnimations.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: i * 60,
        useNativeDriver: true,
      })
    );
    Animated.stagger(40, animations).start();
  }, [data.length, barAnimations]);

  const displayData = useMemo(() => {
    if (data.length <= 14) return data;
    const step = Math.ceil(data.length / 14);
    return data.filter((_, i) => i % step === 0);
  }, [data]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Distress Over Time</Text>
      <View style={styles.chartContainer}>
        <View style={styles.chartYAxis}>
          <Text style={styles.chartYLabel}>{maxValue.toFixed(0)}</Text>
          <Text style={styles.chartYLabel}>{(maxValue / 2).toFixed(0)}</Text>
          <Text style={styles.chartYLabel}>0</Text>
        </View>
        <View style={styles.chartBars}>
          {displayData.map((point, i) => {
            const height = (point.avgDistress / maxValue) * 100;
            const barColor = point.avgDistress >= 7
              ? Colors.danger
              : point.avgDistress >= 4
                ? Colors.accent
                : Colors.primary;

            const animIndex = Math.min(i, barAnimations.length - 1);

            return (
              <View key={point.date} style={styles.chartBarCol}>
                <View style={styles.chartBarTrack}>
                  <Animated.View
                    style={[
                      styles.chartBar,
                      {
                        height: `${height}%`,
                        backgroundColor: barColor,
                        opacity: barAnimations[animIndex] ?? 1,
                        transform: [{
                          scaleY: barAnimations[animIndex] ?? 1,
                        }],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartBarLabel} numberOfLines={1}>
                  {new Date(point.timestamp).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
});

const EmotionsSection = React.memo(function EmotionsSection({
  emotions,
}: {
  emotions: EmotionFrequency[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Heart size={18} color={Colors.danger} />
        <Text style={styles.sectionTitle}>Top Emotions</Text>
      </View>
      {emotions.map((em) => {
        const trendCfg = TREND_CONFIG[em.trend];
        const TrendIcon = trendCfg.icon;
        return (
          <View key={em.label} style={styles.listRow}>
            <Text style={styles.listEmoji}>{em.emoji}</Text>
            <View style={styles.listInfo}>
              <Text style={styles.listLabel}>{em.label}</Text>
              <View style={styles.listBarTrack}>
                <View style={[styles.listBarFill, { width: `${Math.min(em.percentage, 100)}%`, backgroundColor: '#3B82F6' }]} />
              </View>
            </View>
            <View style={styles.listMeta}>
              <Text style={styles.listPercent}>{em.percentage}%</Text>
              <TrendIcon size={12} color={trendCfg.color} />
            </View>
          </View>
        );
      })}
    </View>
  );
});

const TriggersSection = React.memo(function TriggersSection({
  triggers,
}: {
  triggers: TriggerFrequency[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Zap size={18} color="#3B82F6" />
        <Text style={styles.sectionTitle}>Common Triggers</Text>
      </View>
      {triggers.map((tr) => {
        const trendCfg = TREND_CONFIG[tr.trend];
        const TrendIcon = trendCfg.icon;
        return (
          <View key={tr.label} style={styles.listRow}>
            <View style={styles.triggerDot}>
              <Zap size={12} color="#3B82F6" />
            </View>
            <View style={styles.listInfo}>
              <Text style={styles.listLabel}>{tr.label}</Text>
              <View style={styles.listBarTrack}>
                <View style={[styles.listBarFill, { width: `${Math.min(tr.percentage, 100)}%`, backgroundColor: '#3B82F6' }]} />
              </View>
            </View>
            <View style={styles.listMeta}>
              <Text style={styles.listPercent}>{tr.percentage}%</Text>
              <TrendIcon size={12} color={trendCfg.color} />
            </View>
          </View>
        );
      })}
    </View>
  );
});

const CopingSection = React.memo(function CopingSection({
  tools,
}: {
  tools: CopingToolStat[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Shield size={18} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Coping Tool Effectiveness</Text>
      </View>
      {tools.map((tool) => {
        const effectColor = tool.avgReduction > 1.5
          ? Colors.success
          : tool.avgReduction > 0
            ? Colors.primary
            : Colors.textMuted;
        return (
          <View key={tool.tool} style={styles.copingRow}>
            <View style={styles.copingInfo}>
              <Text style={styles.copingName}>{tool.tool}</Text>
              <Text style={styles.copingUsage}>Used {tool.timesUsed}x</Text>
            </View>
            <View style={styles.copingRight}>
              <View style={[styles.effectBadge, { backgroundColor: effectColor + '18' }]}>
                <Text style={[styles.effectText, { color: effectColor }]}>
                  {tool.effectivenessLabel}
                </Text>
              </View>
              {tool.avgReduction > 0 && (
                <Text style={[styles.reductionText, { color: effectColor }]}>
                  -{tool.avgReduction} pts
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
});

const RelationshipSection = React.memo(function RelationshipSection({
  stress,
}: {
  stress: {
    totalConflicts: number;
    avgIntensity: number;
    topTriggers: string[];
    trend: string;
  };
}) {
  const trendColor = stress.trend === 'improving'
    ? Colors.success
    : stress.trend === 'worsening'
      ? Colors.danger
      : Colors.textSecondary;
  const trendLabel = stress.trend === 'insufficient_data' ? 'Not enough data' : stress.trend;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Users size={18} color="#2E2A72" />
        <Text style={styles.sectionTitle}>Relationship Stress</Text>
      </View>
      <View style={styles.relCard}>
        <View style={styles.relStatRow}>
          <View style={styles.relStat}>
            <Text style={styles.relStatValue}>{stress.totalConflicts}</Text>
            <Text style={styles.relStatLabel}>Conflicts</Text>
          </View>
          <View style={styles.relDivider} />
          <View style={styles.relStat}>
            <Text style={styles.relStatValue}>{stress.avgIntensity.toFixed(1)}</Text>
            <Text style={styles.relStatLabel}>Avg Intensity</Text>
          </View>
          <View style={styles.relDivider} />
          <View style={styles.relStat}>
            <Text style={[styles.relStatValue, { color: trendColor, textTransform: 'capitalize' as const }]}>
              {trendLabel}
            </Text>
            <Text style={styles.relStatLabel}>Trend</Text>
          </View>
        </View>
        {stress.topTriggers.length > 0 && (
          <View style={styles.relTriggers}>
            <Text style={styles.relTriggersLabel}>Top triggers:</Text>
            <Text style={styles.relTriggersText}>{stress.topTriggers.join(', ')}</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const AIInsightsSection = React.memo(function AIInsightsSection({
  insights,
}: {
  insights: AIHistoryInsight[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Lightbulb size={18} color="#67E8F9" />
        <Text style={styles.sectionTitle}>AI Insights</Text>
      </View>
      {insights.map((insight) => {
        const IconComp = INSIGHT_ICONS[insight.icon] ?? Lightbulb;
        const bgColor = insight.type === 'growth'
          ? '#FFFFFF'
          : insight.type === 'suggestion'
            ? '#FFFFFF'
            : '#FFFFFF';
        const iconColor = insight.type === 'growth'
          ? '#14B8A6'
          : insight.type === 'suggestion'
            ? '#3B82F6'
            : '#14B8A6';

        return (
          <View key={insight.id} style={[styles.insightCard, { backgroundColor: bgColor }]}>
            <View style={[styles.insightIconWrap, { backgroundColor: iconColor + '20' }]}>
              <IconComp size={16} color={iconColor} />
            </View>
            <Text style={styles.insightText}>{insight.text}</Text>
          </View>
        );
      })}
    </View>
  );
});

const GrowthSection = React.memo(function GrowthSection({
  markers,
}: {
  markers: GrowthMarker[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Sprout size={18} color={Colors.success} />
        <Text style={styles.sectionTitle}>Growth Markers</Text>
      </View>
      {markers.map((marker) => {
        const cfg = GROWTH_TYPE_CONFIG[marker.type];
        const GrowthIcon = cfg.icon;
        return (
          <View key={marker.id} style={styles.growthRow}>
            <View style={[styles.growthIconWrap, { backgroundColor: cfg.bg }]}>
              <GrowthIcon size={16} color={cfg.color} />
            </View>
            <View style={styles.growthInfo}>
              <View style={styles.growthLabelRow}>
                <Text style={styles.growthLabel}>{marker.label}</Text>
                {marker.value && (
                  <View style={[styles.growthBadge, { backgroundColor: cfg.color + '18' }]}>
                    <Text style={[styles.growthBadgeText, { color: cfg.color }]}>
                      {marker.value}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.growthDesc}>{marker.description}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  headerBg: {
    backgroundColor: '#2E2A72',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 3,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: Colors.white,
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.6)',
  },
  periodBtnTextActive: {
    color: '#2E2A72',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  overviewCardWide: {
    width: '100%',
  },
  overviewCard: {
    flex: 1,
    minWidth: 90,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  overviewLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  overviewLabelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  overviewValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -1,
  },
  overviewValueSmall: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
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
    letterSpacing: -0.2,
  },
  chartContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  chartYAxis: {
    width: 28,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 18,
    marginRight: 8,
  },
  chartYLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 3,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarTrack: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: '80%',
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  listEmoji: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  triggerDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listInfo: {
    flex: 1,
    gap: 4,
  },
  listLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  listBarTrack: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  listBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  listMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  listPercent: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  copingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  copingInfo: {
    flex: 1,
    gap: 2,
  },
  copingName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  copingUsage: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  copingRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  effectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  effectText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  reductionText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  relCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  relStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  relStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  relStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  relDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderLight,
  },
  relTriggers: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 6,
  },
  relTriggersLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  relTriggersText: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  insightIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  growthIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthInfo: {
    flex: 1,
    gap: 4,
  },
  growthLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  growthLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  growthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  growthBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  growthDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
