import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { TrendingUp, TrendingDown, Minus, Calendar, Heart, Activity } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { RitualAnalytics } from '@/services/ritual/dailyRitualService';

interface WeeklyRitualSummaryProps {
  analytics: RitualAnalytics;
  onPress?: () => void;
}

export default function WeeklyRitualSummary({ analytics, onPress }: WeeklyRitualSummaryProps) {
  const trendIcon = useMemo(() => {
    switch (analytics.weeklyTrend) {
      case 'improving':
        return <TrendingUp size={16} color={Colors.success} />;
      case 'declining':
        return <TrendingDown size={16} color={Colors.danger} />;
      case 'stable':
        return <Minus size={16} color={Colors.accent} />;
      default:
        return <Minus size={16} color={Colors.textMuted} />;
    }
  }, [analytics.weeklyTrend]);

  const trendColor = useMemo(() => {
    switch (analytics.weeklyTrend) {
      case 'improving': return Colors.success;
      case 'declining': return Colors.danger;
      case 'stable': return Colors.accent;
      default: return Colors.textMuted;
    }
  }, [analytics.weeklyTrend]);

  const stressColor = useMemo(() => {
    if (analytics.averageStress > 6) return Colors.danger;
    if (analytics.averageStress > 3) return Colors.accent;
    return Colors.success;
  }, [analytics.averageStress]);

  const hasData = analytics.daysCheckedIn > 0;

  if (!hasData) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.75}
      testID="weekly-ritual-summary"
    >
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={[styles.trendBadge, { backgroundColor: `${trendColor}15` }]}>
          {trendIcon}
          <Text style={[styles.trendLabel, { color: trendColor }]}>
            {analytics.weeklyTrendLabel}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.primaryLight }]}>
            <Calendar size={14} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{analytics.daysCheckedIn}</Text>
          <Text style={styles.statLabel}>Days in</Text>
        </View>

        {analytics.mostCommonEmotion && (
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.accentLight }]}>
              <Heart size={14} color={Colors.accent} />
            </View>
            <Text style={styles.statEmoji}>{analytics.mostCommonEmotion.emoji}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              {analytics.mostCommonEmotion.label}
            </Text>
          </View>
        )}

        {analytics.averageStress > 0 && (
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${stressColor}18` }]}>
              <Activity size={14} color={stressColor} />
            </View>
            <Text style={[styles.statValue, { color: stressColor }]}>
              {analytics.averageStress}
            </Text>
            <Text style={styles.statLabel}>Avg stress</Text>
          </View>
        )}
      </View>

      <View style={styles.messageRow}>
        <Text style={styles.supportiveMessage}>{analytics.supportiveMessage}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  trendLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statEmoji: {
    fontSize: 22,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  messageRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  supportiveMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
