import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Heart,
  Zap,
  Lightbulb,
  BarChart3,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useJournal } from '@/providers/JournalProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { localizedText } from '@/lib/i18n/staticText';
import { useLanguage } from '@/hooks/useLanguage';

export default function JournalInsightsScreen() {
  useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { smartEntries, stats, patterns, weeklyReport } = useJournal();
  const { trackEvent } = useAnalytics();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    trackEvent('journal_insights_viewed', { entryCount: smartEntries.length });
  }, [fadeAnim, trackEvent, smartEntries.length]);

  const distressTrend = useMemo(() => {
    if (smartEntries.length < 3) return null;
    const recent = smartEntries.slice(0, 5);
    const older = smartEntries.slice(5, 10);
    if (older.length === 0) return null;
    const recentAvg = recent.reduce((s, e) => s + e.distressLevel, 0) / recent.length;
    const olderAvg = older.reduce((s, e) => s + e.distressLevel, 0) / older.length;
    const diff = recentAvg - olderAvg;
    if (diff < -0.5) return { direction: 'improving' as const, value: Math.abs(diff) };
    if (diff > 0.5) return { direction: 'worsening' as const, value: diff };
    return { direction: 'stable' as const, value: 0 };
  }, [smartEntries]);

  const hasData = smartEntries.length >= 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{localizedText('Journal Insights', 'Insights del diario')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {!hasData ? (
            <View style={styles.emptyState}>
              <BarChart3 size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>Not enough data yet</Text>
              <Text style={styles.emptyDesc}>
                Write a few more journal entries and patterns will emerge here.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.totalEntries}</Text>
                  <Text style={styles.statLabel}>Total entries</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.streakDays}</Text>
                  <Text style={styles.statLabel}>Day streak</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: stats.avgDistress > 6 ? Colors.danger : stats.avgDistress > 3 ? Colors.accent : Colors.success }]}>
                    {stats.avgDistress}
                  </Text>
                  <Text style={styles.statLabel}>Avg distress</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.thisWeekEntries}</Text>
                  <Text style={styles.statLabel}>This week</Text>
                </View>
              </View>

              {distressTrend && (
                <View style={styles.trendCard}>
                  <View style={styles.trendHeader}>
                    {distressTrend.direction === 'improving' ? (
                      <TrendingDown size={20} color={Colors.success} />
                    ) : distressTrend.direction === 'worsening' ? (
                      <TrendingUp size={20} color={Colors.danger} />
                    ) : (
                      <Minus size={20} color={Colors.brandTeal} />
                    )}
                    <Text style={styles.trendTitle}>
                      {distressTrend.direction === 'improving'
                        ? 'Distress is easing'
                        : distressTrend.direction === 'worsening'
                        ? 'Distress has been higher lately'
                        : 'Distress is stable'}
                    </Text>
                  </View>
                  <Text style={styles.trendDesc}>
                    {distressTrend.direction === 'improving'
                      ? 'Your recent entries show lower emotional intensity. Something is working.'
                      : distressTrend.direction === 'worsening'
                      ? 'Recent entries show rising intensity. Be gentle with yourself and lean on support.'
                      : 'Your emotional intensity has been consistent. Steady is also progress.'}
                  </Text>
                </View>
              )}

              {patterns.commonTriggers.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <AlertTriangle size={18} color={Colors.accent} />
                    <Text style={styles.sectionTitle}>{localizedText('Top Triggers', 'Disparadores principales')}</Text>
                  </View>
                  {patterns.commonTriggers.slice(0, 5).map((t) => (
                    <View key={t.label} style={styles.barRow}>
                      <Text style={styles.barLabel} numberOfLines={1}>{t.label}</Text>
                      <View style={styles.barBg}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${(t.count / (patterns.commonTriggers[0]?.count || 1)) * 100}%`,
                              backgroundColor: Colors.accent,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barCount}>{t.count}</Text>
                    </View>
                  ))}
                </View>
              )}

              {patterns.recurringEmotions.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Heart size={18} color={Colors.brandLilac} />
                    <Text style={styles.sectionTitle}>Most Felt Emotions</Text>
                  </View>
                  {patterns.recurringEmotions.slice(0, 5).map((e) => (
                    <View key={e.label} style={styles.barRow}>
                      <Text style={styles.barLabel} numberOfLines={1}>{e.label}</Text>
                      <View style={styles.barBg}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${(e.count / (patterns.recurringEmotions[0]?.count || 1)) * 100}%`,
                              backgroundColor: Colors.brandLilac,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barCount}>{e.count}</Text>
                    </View>
                  ))}
                </View>
              )}

              {patterns.emotionalCycles.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Zap size={18} color={Colors.brandTeal} />
                    <Text style={styles.sectionTitle}>{localizedText('Emotional Patterns', 'Patrones emocionales')}</Text>
                  </View>
                  {patterns.emotionalCycles.map((cycle, i) => (
                    <Text key={i} style={styles.cycleText}>{cycle}</Text>
                  ))}
                </View>
              )}

              {patterns.insights.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Lightbulb size={18} color={Colors.brandAmber} />
                    <Text style={styles.sectionTitle}>{localizedText('Key Insights', 'Insights clave')}</Text>
                  </View>
                  {patterns.insights.map((insight, i) => (
                    <Text key={i} style={styles.insightText}>{insight}</Text>
                  ))}
                </View>
              )}

              {weeklyReport && (
                <TouchableOpacity
                  style={styles.weeklyCard}
                  onPress={() => router.push('/journal-weekly-report' as never)}
                >
                  <Text style={styles.weeklyTitle}>{localizedText('Weekly Reflection', 'Reflexion semanal')}</Text>
                  <Text style={styles.weeklyDesc}>
                    {weeklyReport.reflectionLetter.slice(0, 100)}...
                  </Text>
                  <Text style={styles.weeklyLink}>Read full report →</Text>
                </TouchableOpacity>
              )}
            </>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  trendCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  trendDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  barLabel: {
    fontSize: 13,
    color: Colors.text,
    width: 110,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    width: 24,
    textAlign: 'right' as const,
  },
  cycleText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 4,
  },
  insightText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 4,
  },
  weeklyCard: {
    backgroundColor: Colors.brandTealSoft,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.brandTeal + '20',
  },
  weeklyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.brandTeal,
    marginBottom: 6,
  },
  weeklyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  weeklyLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
});
