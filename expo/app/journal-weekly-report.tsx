import React, { useRef, useEffect } from 'react';
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
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  AlertTriangle,
  Heart,
  Shield,
  Lightbulb,
  BookOpen,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useJournal } from '@/providers/JournalProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { localizedText } from '@/lib/i18n/staticText';
import { useLanguage } from '@/hooks/useLanguage';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function JournalWeeklyReportScreen() {
  useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { weeklyReport } = useJournal();
  const { trackEvent } = useAnalytics();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    trackEvent('journal_weekly_report_viewed');
  }, [fadeAnim, trackEvent]);

  if (!weeklyReport) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{localizedText('Weekly Report', 'Reporte semanal')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Calendar size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>{localizedText('No report yet', 'Aun no hay reporte')}</Text>
          <Text style={styles.emptyDesc}>
            Write journal entries during the week and your reflection report will appear here.
          </Text>
        </View>
      </View>
    );
  }

  const trendIcon =
    weeklyReport.distressTrend === 'improving' ? TrendingDown :
    weeklyReport.distressTrend === 'worsening' ? TrendingUp : Minus;
  const TrendIcon = trendIcon;
  const trendColor =
    weeklyReport.distressTrend === 'improving' ? Colors.success :
    weeklyReport.distressTrend === 'worsening' ? Colors.danger : Colors.brandTeal;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{localizedText('Weekly Report', 'Reporte semanal')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.heroCard}>
            <BookOpen size={28} color={Colors.brandTeal} />
            <Text style={styles.heroTitle}>{localizedText('Your week in reflection', 'Tu semana en reflexion')}</Text>
            <Text style={styles.heroDates}>
              {formatDate(weeklyReport.weekStart)} — {formatDate(weeklyReport.weekEnd)}
            </Text>
          </View>

          <View style={styles.letterCard}>
            <Text style={styles.letterText}>{weeklyReport.reflectionLetter}</Text>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{weeklyReport.entryCount}</Text>
              <Text style={styles.metricLabel}>Entries</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: trendColor }]}>
                {weeklyReport.avgDistress}
              </Text>
              <Text style={styles.metricLabel}>Avg distress</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <TrendIcon size={20} color={trendColor} />
              <Text style={[styles.metricLabel, { color: trendColor, fontWeight: '600' as const }]}>
                {weeklyReport.distressTrend === 'improving' ? 'Easing' :
                 weeklyReport.distressTrend === 'worsening' ? 'Rising' : 'Stable'}
              </Text>
            </View>
          </View>

          {weeklyReport.mainTriggers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={16} color={Colors.accent} />
                <Text style={styles.sectionTitle}>{localizedText('Main Triggers', 'Disparadores principales')}</Text>
              </View>
              <View style={styles.chipRow}>
                {weeklyReport.mainTriggers.map(t => (
                  <View key={t} style={styles.triggerChip}>
                    <Text style={styles.triggerChipText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {weeklyReport.mostFrequentEmotions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Heart size={16} color={Colors.brandLilac} />
                <Text style={styles.sectionTitle}>Most Felt Emotions</Text>
              </View>
              <View style={styles.chipRow}>
                {weeklyReport.mostFrequentEmotions.map(e => (
                  <View key={e} style={styles.emotionChip}>
                    <Text style={styles.emotionChipText}>{e}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {weeklyReport.skillsThatHelped.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Shield size={16} color={Colors.success} />
                <Text style={styles.sectionTitle}>{localizedText('What Helped', 'Que ayudo')}</Text>
              </View>
              {weeklyReport.skillsThatHelped.map((s, i) => (
                <Text key={i} style={styles.skillText}>• {s}</Text>
              ))}
            </View>
          )}

          {weeklyReport.keyInsights.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Lightbulb size={16} color={Colors.brandAmber} />
                <Text style={styles.sectionTitle}>{localizedText('Key Insights', 'Insights clave')}</Text>
              </View>
              {weeklyReport.keyInsights.map((insight, i) => (
                <View key={i} style={styles.insightRow}>
                  <View style={styles.insightDot} />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.closingCard}>
            <Text style={styles.closingText}>
              Showing up to reflect, even on difficult days, is a form of self-care. You are building emotional awareness one entry at a time.
            </Text>
          </View>
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
    paddingTop: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  heroCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
  },
  heroDates: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  letterCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brandAmber,
  },
  letterText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    fontStyle: 'italic' as const,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerChip: {
    backgroundColor: Colors.accentLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  triggerChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  emotionChip: {
    backgroundColor: Colors.brandLilacSoft,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  emotionChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.brandLilac,
  },
  skillText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brandAmber,
    marginTop: 7,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  closingCard: {
    backgroundColor: Colors.brandTealSoft,
    borderRadius: 16,
    padding: 20,
    marginTop: 4,
    marginBottom: 20,
  },
  closingText: {
    fontSize: 14,
    color: Colors.brandTeal,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
});
