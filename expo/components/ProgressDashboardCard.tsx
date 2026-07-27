import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Award, TrendingDown, TrendingUp, Minus, ChevronRight, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useProgress } from '@/hooks/useProgress';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

function ProgressDashboardCardComponent() {
  useLanguage();
  const router = useRouter();
  const progress = useProgress();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/profile/progress' as never);
  }, [router]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.03, 0.09],
  });

  const { metrics, weekComparison, encouragingMessage, hasEnoughData } = progress;

  const trendIcon = weekComparison.direction === 'improved'
    ? <TrendingDown size={13} color={Colors.success} />
    : weekComparison.direction === 'worsened'
      ? <TrendingUp size={13} color="#3B82F6" />
      : <Minus size={13} color={Colors.textMuted} />;

  const trendColor = weekComparison.direction === 'improved'
    ? Colors.success
    : weekComparison.direction === 'worsened'
      ? '#3B82F6'
      : Colors.textMuted;

  const trendLabel = weekComparison.direction === 'improved'
    ? localizedText(`${weekComparison.changePercent}% lower`, `${weekComparison.changePercent}% más bajo`)
    : weekComparison.direction === 'worsened'
      ? localizedText(`${weekComparison.changePercent}% higher`, `${weekComparison.changePercent}% más alto`)
      : localizedText('stable', 'estable');

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
      testID="progress-dashboard-card"
    >
      <Animated.View style={[styles.glowOverlay, { opacity: glowOpacity }]} />

      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Award size={20} color="#67E8F9" />
        </View>
        <View style={styles.titleArea}>
          <Text style={styles.title}>{localizedText('Recovery Progress', 'Progreso de recuperación')}</Text>
          {hasEnoughData && (
            <View style={[styles.trendBadge, { backgroundColor: trendColor + '14' }]}>
              {trendIcon}
              <Text style={[styles.trendText, { color: trendColor }]}>{localizedText('Distress', 'Malestar')} {trendLabel}</Text>
            </View>
          )}
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </View>

      {hasEnoughData ? (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{metrics.totalCheckIns}</Text>
              <Text style={styles.statLabel}>{localizedText('Check-ins', 'Registros')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.streakRow}>
                <Flame size={14} color="#67E8F9" />
                <Text style={styles.statValue}>{metrics.journalStreak}</Text>
              </View>
              <Text style={styles.statLabel}>{localizedText('Day streak', 'Racha de días')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{metrics.copingExercisesUsed}</Text>
              <Text style={styles.statLabel}>{localizedText('Tools used', 'Herramientas usadas')}</Text>
            </View>
            {metrics.successfulMessagePauses > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{metrics.successfulMessagePauses}</Text>
                  <Text style={styles.statLabel}>{localizedText('Pauses', 'Pausas')}</Text>
                </View>
              </>
            )}
          </View>

          <Text style={styles.encouragingText}>{encouragingMessage}</Text>
        </>
      ) : (
        <Text style={styles.emptyText}>
          {localizedText(
            'Complete a few check-ins to see your progress dashboard come alive.',
            'Completa algunos registros para ver cómo cobra vida tu panel de progreso.',
          )}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const ProgressDashboardCard = React.memo(ProgressDashboardCardComponent);
export default ProgressDashboardCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#67E8F9',
    borderRadius: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleArea: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 4,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  encouragingText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
});
