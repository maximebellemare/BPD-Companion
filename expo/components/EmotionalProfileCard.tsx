import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { buildFullEmotionalModelState } from '@/services/emotionalModel/emotionalModelService';

export default function EmotionalProfileCard() {
  const router = useRouter();
  const { journalEntries, messageDrafts } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const modelState = useMemo(
    () => buildFullEmotionalModelState(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const { model } = modelState;
  const hasData = model.dataPointCount >= 3;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const TrendIcon = model.overallDistressTrend === 'improving'
    ? TrendingDown
    : model.overallDistressTrend === 'worsening'
      ? TrendingUp
      : Minus;

  const trendColor = model.overallDistressTrend === 'improving'
    ? '#4A8B60'
    : model.overallDistressTrend === 'worsening'
      ? '#A85050'
      : Colors.textMuted;

  const trendLabel = model.overallDistressTrend === 'improving'
    ? 'Improving'
    : model.overallDistressTrend === 'worsening'
      ? 'Needs care'
      : model.overallDistressTrend === 'stable'
        ? 'Stable'
        : 'Building';

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/emotional-profile')}
        activeOpacity={0.7}
        testID="emotional-profile-card"
      >
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Brain size={20} color="#7B5EA7" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Emotional Profile</Text>
            <Text style={styles.subtitle}>
              {hasData
                ? 'Your personal emotional model'
                : 'Building your emotional understanding'}
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </View>

        {hasData ? (
          <View style={styles.body}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{model.dataPointCount}</Text>
                <Text style={styles.statLabel}>check-ins</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{model.averageDistress}</Text>
                <Text style={styles.statLabel}>avg distress</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <View style={styles.trendRow}>
                  <TrendIcon size={13} color={trendColor} />
                  <Text style={[styles.statValue, { color: trendColor, fontSize: 13 }]}>{trendLabel}</Text>
                </View>
                <Text style={styles.statLabel}>trend</Text>
              </View>
            </View>

            {model.topTriggers.length > 0 && (
              <View style={styles.topTrigger}>
                <Text style={styles.topTriggerLabel}>Top trigger:</Text>
                <Text style={styles.topTriggerValue}>{model.topTriggers[0].label}</Text>
              </View>
            )}

            {model.effectiveCoping.length > 0 && (
              <View style={styles.topCoping}>
                <Text style={styles.topCopingLabel}>Best coping:</Text>
                <Text style={styles.topCopingValue}>
                  {model.effectiveCoping[0].tool} ({model.effectiveCoping[0].helpfulRate}% helpful)
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyBody}>
            <Text style={styles.emptyText}>
              Continue checking in to build your personal emotional model. Each entry adds more understanding.
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8E0F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F0EAF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  body: {
    marginTop: 14,
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F5FC',
    borderRadius: 12,
    padding: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0D5F0',
    marginVertical: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  topTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topTriggerLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  topTriggerValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  topCoping: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topCopingLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  topCopingValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#4A8B60',
  },
  emptyBody: {
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
