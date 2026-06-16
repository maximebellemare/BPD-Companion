import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
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
  Shield,
  Users,
  TrendingUp,
  ChevronRight,
  BarChart3,
  Flame,
  Eye,
  Sprout,
  Activity,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePatternInsights } from '@/hooks/usePatternInsights';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { PatternInsight } from '@/services/patterns/patternInsightService';
import {
  TriggerPattern,
  EmotionPattern,
  CopingEffectiveness,
} from '@/services/patterns/patternEngine';

type TimePeriod = 7 | 14 | 30;

const PERIOD_OPTIONS: { label: string; value: TimePeriod }[] = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
];

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Zap,
  Heart,
  AlertTriangle,
  Shield,
  Users,
  TrendingUp,
  Flame,
  Eye,
  Sprout,
  BarChart3,
  Activity,
};

function getIcon(name: string) {
  return ICON_MAP[name] ?? BarChart3;
}

function AnimatedProgressBar({
  value,
  maxValue,
  color,
  delay,
}: {
  value: number;
  maxValue: number;
  color: string;
  delay: number;
}) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: maxValue > 0 ? (value / maxValue) * 100 : 0,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, value, maxValue, delay]);

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: color,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

function OverviewCard({ narrative, avgDistress, totalEntries, trend }: {
  narrative: string;
  avgDistress: number;
  totalEntries: number;
  trend: string;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const trendColor = trend === 'improving' ? Colors.success
    : trend === 'worsening' ? Colors.danger
    : Colors.textMuted;

  const trendLabel = trend === 'improving' ? 'Improving'
    : trend === 'worsening' ? 'Elevated'
    : trend === 'stable' ? 'Stable'
    : 'Building data';

  return (
    <Animated.View style={[styles.overviewCard, { opacity: fadeAnim }]}>
      <View style={styles.overviewHeader}>
        <View style={styles.overviewIconWrap}>
          <Activity size={18} color={Colors.primary} />
        </View>
        <Text style={styles.overviewTitle}>Overview</Text>
      </View>
      <Text style={styles.overviewNarrative}>{narrative}</Text>
      <View style={styles.overviewStats}>
        <View style={styles.overviewStat}>
          <Text style={styles.overviewStatValue}>{totalEntries}</Text>
          <Text style={styles.overviewStatLabel}>Check-ins</Text>
        </View>
        <View style={styles.overviewStatDivider} />
        <View style={styles.overviewStat}>
          <Text style={styles.overviewStatValue}>{avgDistress || '—'}</Text>
          <Text style={styles.overviewStatLabel}>Avg Distress</Text>
        </View>
        <View style={styles.overviewStatDivider} />
        <View style={styles.overviewStat}>
          <Text style={[styles.overviewStatValue, { color: trendColor }]}>{trendLabel}</Text>
          <Text style={styles.overviewStatLabel}>Trend</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function TriggerCard({ trigger, index, maxCount }: {
  trigger: TriggerPattern;
  index: number;
  maxCount: number;
}) {
  const trendBadge = trigger.trend === 'increasing'
    ? { label: '↑ Rising', color: '#3B82F6', bg: '#FFFFFF' }
    : trigger.trend === 'decreasing'
      ? { label: '↓ Easing', color: Colors.success, bg: Colors.successLight }
      : null;

  return (
    <View style={styles.patternRow}>
      <View style={styles.patternRowHeader}>
        <View style={styles.patternLabelRow}>
          <Text style={styles.patternLabel}>{trigger.label}</Text>
          {trendBadge && (
            <View style={[styles.trendBadge, { backgroundColor: trendBadge.bg }]}>
              <Text style={[styles.trendBadgeText, { color: trendBadge.color }]}>
                {trendBadge.label}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.patternPercent}>{trigger.percentage}%</Text>
      </View>
      <AnimatedProgressBar
        value={trigger.count}
        maxValue={maxCount}
        color={index === 0 ? Colors.accent : Colors.primary}
        delay={index * 80}
      />
      {trigger.relatedEmotions.length > 0 && (
        <Text style={styles.patternMeta}>
          Often brings {trigger.relatedEmotions.slice(0, 2).join(', ').toLowerCase()}
        </Text>
      )}
    </View>
  );
}

function EmotionBubble({ emotion, index }: { emotion: EmotionPattern; index: number }) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 70,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim, index]);

  return (
    <Animated.View
      style={[
        styles.emotionBubble,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
      <Text style={styles.emotionLabel} numberOfLines={1}>{emotion.label}</Text>
      <Text style={styles.emotionPercent}>{emotion.percentage}%</Text>
    </Animated.View>
  );
}

function CopingCard({ tool, index, maxReduction }: {
  tool: CopingEffectiveness;
  index: number;
  maxReduction: number;
}) {
  return (
    <View style={styles.copingRow}>
      <View style={styles.copingInfo}>
        <Text style={styles.copingName} numberOfLines={1}>{tool.tool}</Text>
        <Text style={styles.copingMeta}>Used {tool.timesUsed}x</Text>
      </View>
      <View style={styles.copingBarArea}>
        <AnimatedProgressBar
          value={Math.max(tool.avgReduction, 0)}
          maxValue={maxReduction}
          color={tool.avgReduction > 0 ? Colors.success : Colors.textMuted}
          delay={index * 80}
        />
      </View>
      <View style={[
        styles.copingBadge,
        { backgroundColor: tool.avgReduction > 0 ? Colors.successLight : Colors.surface },
      ]}>
        <Text style={[
          styles.copingBadgeText,
          { color: tool.avgReduction > 0 ? Colors.success : Colors.textMuted },
        ]}>
          {tool.avgReduction > 0 ? `-${tool.avgReduction}` : '0'}
        </Text>
      </View>
    </View>
  );
}

function InsightCard({ insight }: { insight: PatternInsight }) {
  const IconComponent = getIcon(insight.icon);
  const importanceColor = insight.importance === 'high' ? Colors.accent
    : insight.importance === 'medium' ? Colors.primary
    : Colors.textMuted;

  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightIconWrap, { backgroundColor: importanceColor + '18' }]}>
        <IconComponent size={16} color={importanceColor} />
      </View>
      <Text style={styles.insightNarrative}>{insight.narrative}</Text>
    </View>
  );
}

function SectionCard({
  title,
  icon,
  iconColor: _iconColor,
  iconBg,
  children,
  delay,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  children: React.ReactNode;
  delay: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.sectionCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

export default function EmotionalInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<TimePeriod>(30);
  const { analysis, insights } = usePatternInsights(period);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent('screen_view', { screen: 'emotional_insights' });
  }, [trackEvent]);

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handlePeriodChange = useCallback((p: TimePeriod) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPeriod(p);
    trackEvent('emotional_insights_period_changed', { period: p });
  }, [trackEvent]);

  const maxTriggerCount = useMemo(
    () => Math.max(...analysis.triggers.map(t => t.count), 1),
    [analysis.triggers],
  );

  const maxCopingReduction = useMemo(
    () => Math.max(...analysis.copingEffectiveness.map(c => c.avgReduction), 1),
    [analysis.copingEffectiveness],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          testID="emotional-insights-back"
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emotional Insights</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.periodSelector}>
          {PERIOD_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.periodButton,
                period === opt.value && styles.periodButtonActive,
              ]}
              onPress={() => handlePeriodChange(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.periodButtonText,
                period === opt.value && styles.periodButtonTextActive,
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!insights.hasEnoughData ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <BarChart3 size={40} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Your patterns are forming</Text>
            <Text style={styles.emptySubtitle}>
              Complete a few more check-ins and your emotional patterns will start becoming visible. Each one adds depth to your self-understanding.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/check-in')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Start a Check-in</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <OverviewCard
              narrative={insights.overview.narrative}
              avgDistress={analysis.avgDistress}
              totalEntries={analysis.totalEntries}
              trend={analysis.distressTrend}
            />

            {analysis.triggers.length > 0 && (
              <SectionCard
                title="Common Triggers"
                icon={<Zap size={16} color={Colors.accent} />}
                iconColor={Colors.accent}
                iconBg={Colors.accentLight}
                delay={100}
              >
                {analysis.triggers.slice(0, 5).map((trigger, i) => (
                  <TriggerCard
                    key={trigger.label}
                    trigger={trigger}
                    index={i}
                    maxCount={maxTriggerCount}
                  />
                ))}
                {insights.triggerInsights.length > 0 && (
                  <View style={styles.insightDivider}>
                    {insights.triggerInsights.slice(0, 2).map(insight => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                  </View>
                )}
              </SectionCard>
            )}

            {analysis.emotions.length > 0 && (
              <SectionCard
                title="Emotional Patterns"
                icon={<Heart size={16} color="#3B82F6" />}
                iconColor="#3B82F6"
                iconBg="#FFFFFF"
                delay={200}
              >
                <View style={styles.emotionGrid}>
                  {analysis.emotions.slice(0, 6).map((emotion, i) => (
                    <EmotionBubble key={emotion.label} emotion={emotion} index={i} />
                  ))}
                </View>
                {insights.emotionInsights.length > 0 && (
                  <View style={styles.insightDivider}>
                    {insights.emotionInsights.slice(0, 2).map(insight => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                  </View>
                )}
              </SectionCard>
            )}

            {analysis.urges.length > 0 && (
              <SectionCard
                title="Urge Patterns"
                icon={<AlertTriangle size={16} color="#0B1238" />}
                iconColor="#0B1238"
                iconBg="#FFFFFF"
                delay={300}
              >
                {analysis.urges.slice(0, 4).map((urge) => (
                  <View key={urge.label} style={styles.urgeRow}>
                    <View style={styles.urgeInfo}>
                      <Text style={styles.urgeName}>{urge.label}</Text>
                      <Text style={styles.urgeMeta}>
                        {urge.percentage}% of check-ins · avg {urge.avgIntensity}/10
                      </Text>
                    </View>
                  </View>
                ))}
                {analysis.urgeSequences.length > 0 && (
                  <View style={styles.sequenceSection}>
                    <Text style={styles.sequenceLabel}>Common sequences</Text>
                    {analysis.urgeSequences.slice(0, 3).map((seq, i) => (
                      <View key={i} style={styles.sequenceRow}>
                        <Text style={styles.sequenceFrom}>{seq.from}</Text>
                        <View style={styles.sequenceArrow}>
                          <ChevronRight size={12} color={Colors.textMuted} />
                        </View>
                        <Text style={styles.sequenceTo}>{seq.to}</Text>
                        <Text style={styles.sequenceCount}>{seq.count}x</Text>
                      </View>
                    ))}
                  </View>
                )}
                {insights.urgeInsights.length > 0 && (
                  <View style={styles.insightDivider}>
                    {insights.urgeInsights.slice(0, 2).map(insight => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                  </View>
                )}
              </SectionCard>
            )}

            {analysis.copingEffectiveness.length > 0 && (
              <SectionCard
                title="Helpful Tools"
                icon={<Shield size={16} color={Colors.success} />}
                iconColor={Colors.success}
                iconBg={Colors.successLight}
                delay={400}
              >
                <Text style={styles.copingSectionDesc}>
                  Distress reduction after using each tool
                </Text>
                {analysis.copingEffectiveness.slice(0, 5).map((tool, i) => (
                  <CopingCard
                    key={tool.tool}
                    tool={tool}
                    index={i}
                    maxReduction={maxCopingReduction}
                  />
                ))}
                {insights.copingInsights.length > 0 && (
                  <View style={styles.insightDivider}>
                    {insights.copingInsights.slice(0, 2).map(insight => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                  </View>
                )}
              </SectionCard>
            )}

            {analysis.relationshipSignals.length > 0 && (
              <SectionCard
                title="Relationship Stress Signals"
                icon={<Users size={16} color="#3B82F6" />}
                iconColor="#3B82F6"
                iconBg="#0B1238"
                delay={500}
              >
                {analysis.relationshipSignals.slice(0, 4).map((signal) => (
                  <View key={signal.label} style={styles.relSignalRow}>
                    <View style={styles.relSignalHeader}>
                      <Text style={styles.relSignalName}>{signal.label}</Text>
                      <View style={styles.relSignalBadge}>
                        <Text style={styles.relSignalCount}>{signal.frequency}x</Text>
                      </View>
                    </View>
                    <Text style={styles.relSignalMeta}>
                      Avg intensity {signal.avgIntensity}/10
                      {signal.commonEmotions.length > 0
                        ? ` · Often brings ${signal.commonEmotions.slice(0, 2).join(', ').toLowerCase()}`
                        : ''}
                    </Text>
                  </View>
                ))}
                {insights.relationshipInsights.length > 0 && (
                  <View style={styles.insightDivider}>
                    {insights.relationshipInsights.slice(0, 2).map(insight => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.deeperLink}
                  onPress={() => router.push('/relationship-insights')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deeperLinkText}>Deeper Relationship Insights</Text>
                  <ChevronRight size={14} color={Colors.primary} />
                </TouchableOpacity>
              </SectionCard>
            )}

            {analysis.growthSignals.length > 0 && (
              <SectionCard
                title="Growth Signals"
                icon={<TrendingUp size={16} color={Colors.success} />}
                iconColor={Colors.success}
                iconBg={Colors.successLight}
                delay={600}
              >
                {analysis.growthSignals.map((signal, i) => {
                  const typeColor = signal.type === 'positive' ? Colors.success
                    : signal.type === 'emerging' ? Colors.primary
                    : Colors.textSecondary;
                  const typeBg = signal.type === 'positive' ? Colors.successLight
                    : signal.type === 'emerging' ? Colors.primaryLight
                    : Colors.surface;

                  return (
                    <View key={i} style={styles.growthRow}>
                      <View style={[styles.growthDot, { backgroundColor: typeColor }]} />
                      <View style={styles.growthContent}>
                        <View style={[styles.growthTypeBadge, { backgroundColor: typeBg }]}>
                          <Text style={[styles.growthTypeText, { color: typeColor }]}>
                            {signal.type === 'positive' ? 'Progress' : signal.type === 'emerging' ? 'Emerging' : 'Awareness'}
                          </Text>
                        </View>
                        <Text style={styles.growthNarrative}>{signal.narrative}</Text>
                      </View>
                    </View>
                  );
                })}
              </SectionCard>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Every check-in deepens this picture.{'\n'}You're building real self-understanding.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.fullInsightsButton}
              onPress={() => router.push('/insights')}
              activeOpacity={0.7}
            >
              <BarChart3 size={18} color={Colors.white} />
              <Text style={styles.fullInsightsText}>View Full Insights</Text>
              <ChevronRight size={16} color={Colors.white} style={{ opacity: 0.7 }} />
            </TouchableOpacity>
          </>
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
    paddingTop: 16,
  },
  periodSelector: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center' as const,
  },
  periodButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  periodButtonTextActive: {
    color: Colors.text,
  },
  overviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  overviewHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 12,
  },
  overviewIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  overviewNarrative: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  overviewStat: {
    flex: 1,
    alignItems: 'center' as const,
  },
  overviewStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  overviewStatLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  overviewStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  patternRow: {
    marginBottom: 14,
  },
  patternRowHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 6,
  },
  patternLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  patternLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  patternPercent: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  patternMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%' as const,
    borderRadius: 4,
  },
  emotionGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    justifyContent: 'center' as const,
  },
  emotionBubble: {
    alignItems: 'center' as const,
    width: 80,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderRadius: 14,
  },
  emotionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  emotionLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  emotionPercent: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginTop: 2,
  },
  urgeRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  urgeInfo: {
    gap: 2,
  },
  urgeName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  urgeMeta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sequenceSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  sequenceLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sequenceRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 8,
  },
  sequenceFrom: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  sequenceArrow: {
    opacity: 0.5,
  },
  sequenceTo: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    flex: 1,
  },
  sequenceCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  copingSectionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  copingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 12,
  },
  copingInfo: {
    width: 90,
  },
  copingName: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  copingMeta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  copingBarArea: {
    flex: 1,
  },
  copingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 38,
    alignItems: 'center' as const,
  },
  copingBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  relSignalRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  relSignalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 4,
  },
  relSignalName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  relSignalBadge: {
    backgroundColor: '#0B1238',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  relSignalCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  relSignalMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  deeperLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  deeperLinkText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  growthRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 14,
  },
  growthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  growthContent: {
    flex: 1,
  },
  growthTypeBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  growthTypeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  growthNarrative: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  insightDivider: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 10,
  },
  insightRow: {
    flexDirection: 'row' as const,
    gap: 10,
    alignItems: 'flex-start' as const,
  },
  insightIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 1,
  },
  insightNarrative: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    marginTop: 10,
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
  fullInsightsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  fullInsightsText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 60,
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
