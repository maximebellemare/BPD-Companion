import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Shield,
  Heart,
  Activity,
  ChevronRight,
  Anchor,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  CheckCircle,
  BarChart3,
  Moon,
  MessageCircle,
  Repeat2,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useSpiralPrevention } from '@/providers/SpiralPreventionProvider';
import { SpiralSignal, SpiralSignalType } from '@/types/spiral';
import { SpiralTrend } from '@/services/emotions/spiralHistoryService';

const SIGNAL_CONFIG: Record<SpiralSignalType, { label: string; color: string; icon: React.ComponentType<{ size: number; color: string }> }> = {
  rapid_distress_escalation: { label: 'Distress escalation', color: '#3B82F6', icon: TrendingUp },
  repeated_rejection_language: { label: 'Rejection themes', color: '#67E8F9', icon: Heart },
  relationship_conflict_loop: { label: 'Conflict cycle', color: '#3B82F6', icon: Activity },
  late_night_spike: { label: 'Late-night intensity', color: '#2E2A72', icon: Clock },
  emotional_volatility: { label: 'Emotional shifts', color: '#3B82F6', icon: Zap },
  shame_cascade: { label: 'Shame pattern', color: '#67E8F9', icon: Shield },
  urge_intensification: { label: 'Strong urges', color: '#3B82F6', icon: AlertTriangle },
  coping_abandonment: { label: 'Coping dropped off', color: '#2E2A72', icon: TrendingDown },
  isolation_pattern: { label: 'Withdrawal', color: '#3B82F6', icon: Heart },
  poor_sleep_vulnerability: { label: 'Sleep vulnerability', color: '#2E2A72', icon: Moon },
  conversation_spiral_language: { label: 'Conversation loop language', color: '#3B82F6', icon: MessageCircle },
  familiar_spiral_pattern: { label: 'Familiar pattern', color: '#14B8A6', icon: Repeat2 },
};

export default function SpiralInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const {
    detection,
    weeklyInsight,
    weekTrend,
    monthTrend,
    interventionSuccessRate,
  } = useSpiralPrevention();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleNavigate = useCallback((route: string) => {
    trackEvent('spiral_insight_action', { route });
    router.push(route as never);
  }, [router, trackEvent]);

  const riskColor = useMemo(() => {
    switch (detection.riskLevel) {
      case 'high': return Colors.danger;
      case 'moderate': return Colors.accent;
      default: return Colors.success;
    }
  }, [detection.riskLevel]);

  const riskLabel = useMemo(() => {
    switch (detection.riskLevel) {
      case 'high': return 'High';
      case 'moderate': return 'Moderate';
      default: return 'Low';
    }
  }, [detection.riskLevel]);

  const renderSignalCard = useCallback((signal: SpiralSignal) => {
    const config = SIGNAL_CONFIG[signal.type];
    const IconComp = config.icon;

    return (
      <View key={signal.id} style={styles.signalCard}>
        <View style={[styles.signalIconContainer, { backgroundColor: config.color + '18' }]}>
          <IconComp size={18} color={config.color} />
        </View>
        <View style={styles.signalContent}>
          <Text style={styles.signalLabel}>{config.label}</Text>
          <Text style={styles.signalNarrative} numberOfLines={2}>{signal.narrative}</Text>
        </View>
      </View>
    );
  }, []);

  const renderTrendCard = useCallback((trend: SpiralTrend, label: string) => {
    const TrendIcon = trend.riskTrend === 'improving' ? ArrowDownRight
      : trend.riskTrend === 'worsening' ? ArrowUpRight
      : Minus;
    const trendColor = trend.riskTrend === 'improving' ? Colors.success
      : trend.riskTrend === 'worsening' ? Colors.danger
      : Colors.textMuted;
    const trendLabel = trend.riskTrend === 'improving' ? 'Improving'
      : trend.riskTrend === 'worsening' ? 'Needs attention'
      : 'Stable';

    return (
      <View style={styles.trendCard}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendTitle}>{label}</Text>
          <View style={[styles.trendBadge, { backgroundColor: trendColor + '15' }]}>
            <TrendIcon size={12} color={trendColor} />
            <Text style={[styles.trendBadgeText, { color: trendColor }]}>{trendLabel}</Text>
          </View>
        </View>

        <View style={styles.trendStats}>
          <View style={styles.trendStat}>
            <Text style={styles.trendStatValue}>{trend.totalDetections}</Text>
            <Text style={styles.trendStatLabel}>Detections</Text>
          </View>
          <View style={styles.trendStatDivider} />
          <View style={styles.trendStat}>
            <Text style={[styles.trendStatValue, { color: Colors.danger }]}>{trend.highRiskCount}</Text>
            <Text style={styles.trendStatLabel}>High risk</Text>
          </View>
          <View style={styles.trendStatDivider} />
          <View style={styles.trendStat}>
            <Text style={[styles.trendStatValue, { color: Colors.success }]}>{trend.interventionsUsed}</Text>
            <Text style={styles.trendStatLabel}>Tools used</Text>
          </View>
        </View>

        {trend.averageDistressReduction !== null && trend.averageDistressReduction > 0 && (
          <View style={styles.distressReductionRow}>
            <CheckCircle size={14} color={Colors.success} />
            <Text style={styles.distressReductionText}>
              Average distress reduced by {trend.averageDistressReduction.toFixed(1)} points when tools were used
            </Text>
          </View>
        )}

        {trend.mostCommonSignals.length > 0 && (
          <View style={styles.trendSignals}>
            <Text style={styles.trendSignalsLabel}>Most common patterns</Text>
            <View style={styles.chipRow}>
              {trend.mostCommonSignals.slice(0, 3).map((s) => {
                const config = SIGNAL_CONFIG[s.type];
                return (
                  <View key={s.type} style={[styles.chip, { backgroundColor: config.color + '15' }]}>
                    <Text style={[styles.chipText, { color: config.color }]}>
                      {config.label} ({s.count}x)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {trend.detectionsByDay.length > 0 && (
          <View style={styles.miniTimeline}>
            <Text style={styles.trendSignalsLabel}>Recent activity</Text>
            <View style={styles.dayRow}>
              {trend.detectionsByDay.slice(-7).map((day) => {
                const dayColor = day.peakRisk === 'high' ? Colors.danger
                  : day.peakRisk === 'moderate' ? Colors.accent
                  : Colors.success;
                const dayLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <View key={day.date} style={styles.dayItem}>
                    <View style={[styles.dayBar, {
                      height: Math.max(8, Math.min(day.count * 12, 48)),
                      backgroundColor: dayColor + '40',
                    }]}>
                      <View style={[styles.dayBarInner, {
                        height: '100%',
                        backgroundColor: dayColor,
                        opacity: 0.7,
                      }]} />
                    </View>
                    <Text style={styles.dayLabel}>{dayLabel}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Spiral Prevention</Text>
          <Text style={styles.headerSubtitle}>Your emotional early warning system</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
          testID="spiral-insights-close"
        >
          <X size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.riskSection}>
          <View style={[styles.riskCard, { borderColor: riskColor + '30' }]}>
            <View style={styles.riskHeader}>
              <View style={[styles.riskIndicator, { backgroundColor: riskColor }]} />
              <Text style={styles.riskTitle}>Current Risk Level</Text>
            </View>
            <Text style={[styles.riskValue, { color: riskColor }]}>{riskLabel}</Text>
            {detection.narrative && (
              <Text style={styles.riskNarrative}>{detection.narrative}</Text>
            )}
            {detection.riskLevel === 'low' && (
              <Text style={styles.riskNarrative}>
                No concerning patterns detected right now. Keep tracking — awareness is your best tool.
              </Text>
            )}
            {interventionSuccessRate !== null && (
              <View style={styles.successRateRow}>
                <BarChart3 size={14} color={Colors.success} />
                <Text style={styles.successRateText}>
                  Tools helped in {Math.round(interventionSuccessRate * 100)}% of past interventions
                </Text>
              </View>
            )}
          </View>
        </View>

        {detection.signals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Signals</Text>
            <Text style={styles.sectionSubtitle}>Patterns the system is tracking</Text>
            <View style={styles.signalList}>
              {detection.signals.map(renderSignalCard)}
            </View>
          </View>
        )}

        {detection.shouldIntervene && detection.interventions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Support</Text>
            <Text style={styles.sectionSubtitle}>Tools that may help right now</Text>
            {detection.interventions.slice(0, 4).map((intervention) => (
              <TouchableOpacity
                key={intervention.id}
                style={styles.supportCard}
                onPress={() => handleNavigate(intervention.route)}
                activeOpacity={0.7}
                testID={`spiral-support-${intervention.id}`}
              >
                <View style={[styles.supportIcon, { backgroundColor: Colors.primaryLight }]}>
                  <Anchor size={18} color={Colors.primary} />
                </View>
                <View style={styles.supportText}>
                  <Text style={styles.supportTitle}>{intervention.title}</Text>
                  <Text style={styles.supportDesc}>{intervention.description}</Text>
                </View>
                <ChevronRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {(weekTrend.totalDetections > 0 || monthTrend.totalDetections > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pattern Trends</Text>
            <Text style={styles.sectionSubtitle}>How things are changing over time</Text>
            {weekTrend.totalDetections > 0 && renderTrendCard(weekTrend, 'Past 7 days')}
            {monthTrend.totalDetections > 0 && (
              <View style={{ marginTop: 12 }}>
                {renderTrendCard(monthTrend, 'Past 30 days')}
              </View>
            )}
          </View>
        )}

        {weeklyInsight && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Summary</Text>
            <Text style={styles.sectionSubtitle}>What the past 7 days show</Text>

            <View style={styles.weeklyCard}>
              <Text style={styles.weeklyNarrative}>{weeklyInsight.narrative}</Text>

              {weeklyInsight.mostCommonSignals.length > 0 && (
                <View style={styles.weeklyRow}>
                  <Text style={styles.weeklyLabel}>Most common patterns</Text>
                  <View style={styles.chipRow}>
                    {weeklyInsight.mostCommonSignals.map((s) => {
                      const config = SIGNAL_CONFIG[s.type];
                      return (
                        <View key={s.type} style={[styles.chip, { backgroundColor: config.color + '15' }]}>
                          <Text style={[styles.chipText, { color: config.color }]}>
                            {config.label} ({s.count}x)
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {weeklyInsight.spikeTimeOfDay && (
                <View style={styles.weeklyRow}>
                  <Text style={styles.weeklyLabel}>Peak intensity time</Text>
                  <View style={styles.weeklyValueRow}>
                    <Clock size={14} color={Colors.textSecondary} />
                    <Text style={styles.weeklyValue}>{weeklyInsight.spikeTimeOfDay}</Text>
                  </View>
                </View>
              )}

              {weeklyInsight.commonTriggers.length > 0 && (
                <View style={styles.weeklyRow}>
                  <Text style={styles.weeklyLabel}>Common triggers</Text>
                  <View style={styles.chipRow}>
                    {weeklyInsight.commonTriggers.map((t) => (
                      <View key={t} style={[styles.chip, { backgroundColor: Colors.accentLight }]}>
                        <Text style={[styles.chipText, { color: Colors.accent }]}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {weeklyInsight.relationshipTriggerCount > 0 && (
                <View style={styles.weeklyRow}>
                  <Text style={styles.weeklyLabel}>Relationship-related entries</Text>
                  <Text style={styles.weeklyValue}>{weeklyInsight.relationshipTriggerCount}</Text>
                </View>
              )}

              {weeklyInsight.toolsThatHelped.length > 0 && (
                <View style={styles.weeklyRow}>
                  <Text style={styles.weeklyLabel}>What helped</Text>
                  <View style={styles.chipRow}>
                    {weeklyInsight.toolsThatHelped.map((t) => (
                      <View key={t} style={[styles.chip, { backgroundColor: Colors.successLight }]}>
                        <Text style={[styles.chipText, { color: Colors.success }]}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How This Works</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: Colors.primaryLight }]}>
                <Activity size={16} color={Colors.primary} />
              </View>
              <Text style={styles.infoText}>
                Analyzes your check-ins, journal entries, and messaging patterns
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: Colors.accentLight }]}>
                <AlertTriangle size={16} color={Colors.accent} />
              </View>
              <Text style={styles.infoText}>
                Detects when familiar emotional spirals may be building
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: Colors.successLight }]}>
                <Shield size={16} color={Colors.success} />
              </View>
              <Text style={styles.infoText}>
                Suggests supportive actions before things escalate
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: Colors.brandLilacSoft }]}>
                <BarChart3 size={16} color={Colors.brandLilac} />
              </View>
              <Text style={styles.infoText}>
                Tracks which tools help you most and learns from your patterns over time
              </Text>
            </View>
          </View>
          <Text style={styles.disclaimer}>
            This system learns from your patterns over time. The more you track, the more personalized and helpful it becomes.
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  riskSection: {
    marginBottom: 24,
  },
  riskCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  riskIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  riskTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  riskValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  riskNarrative: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  successRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  successRateText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 14,
  },
  signalList: {
    gap: 10,
  },
  signalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  signalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  signalContent: {
    flex: 1,
  },
  signalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  signalNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  supportIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  supportDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  trendCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  trendStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
  },
  trendStat: {
    flex: 1,
    alignItems: 'center',
  },
  trendStatValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  trendStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  trendStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  distressReductionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: 10,
    padding: 10,
  },
  distressReductionText: {
    flex: 1,
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500' as const,
    lineHeight: 17,
  },
  trendSignals: {
    gap: 6,
  },
  trendSignalsLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  miniTimeline: {
    gap: 8,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 64,
    paddingTop: 8,
  },
  dayItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dayBar: {
    width: 20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  dayBarInner: {
    width: '100%',
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  weeklyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    gap: 16,
  },
  weeklyNarrative: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  weeklyRow: {
    gap: 6,
  },
  weeklyLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  weeklyValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weeklyValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
