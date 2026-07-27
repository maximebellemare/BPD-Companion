import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { TrendingUp, TrendingDown, Minus, Activity, Zap, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { EmotionalTrend, WarningLevel } from '@/types/prediction';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

interface Props {
  trend: EmotionalTrend;
  warningLevel: WarningLevel;
  onPress?: () => void;
}

const TREND_CONFIG = {
  rising: { get label() { return localizedText('Rising', 'Subiendo'); }, color: '#3B82F6', Icon: TrendingUp },
  falling: { get label() { return localizedText('Falling', 'Bajando'); }, color: '#14B8A6', Icon: TrendingDown },
  stable: { get label() { return localizedText('Stable', 'Estable'); }, color: Colors.primary, Icon: Minus },
  unknown: { get label() { return localizedText('Not enough data', 'Aún faltan datos'); }, color: Colors.textMuted, Icon: Activity },
} as const;

const WARNING_ACCENT: Record<WarningLevel, string> = {
  none: Colors.primary,
  mild: '#67E8F9',
  moderate: '#3B82F6',
  elevated: '#3B82F6',
};

export default React.memo(function EmotionalTrendsCard({ trend, warningLevel, onPress }: Props) {
  useLanguage();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (warningLevel === 'elevated' || warningLevel === 'moderate') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [warningLevel, pulseAnim]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const trendConfig = TREND_CONFIG[trend.distressTrend];
  const TrendIcon = trendConfig.Icon;
  const accentColor = WARNING_ACCENT[warningLevel];

  const indicatorOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.8}
        testID="emotional-trends-card"
      >
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Activity size={16} color={accentColor} />
            <Text style={styles.title}>{localizedText('Emotional Trends', 'Tendencias emocionales')}</Text>
          </View>
          {warningLevel !== 'none' && (
            <Animated.View
              style={[
                styles.warningDot,
                { backgroundColor: accentColor, opacity: indicatorOpacity },
              ]}
            />
          )}
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <View style={[styles.metricIconWrap, { backgroundColor: trendConfig.color + '18' }]}>
              <TrendIcon size={16} color={trendConfig.color} />
            </View>
            <Text style={styles.metricLabel}>{localizedText('Distress', 'Malestar')}</Text>
            <Text style={[styles.metricValue, { color: trendConfig.color }]}>
              {trendConfig.label}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metric}>
            <View style={[styles.metricIconWrap, { backgroundColor: Colors.accent + '18' }]}>
              <Zap size={16} color={Colors.accent} />
            </View>
            <Text style={styles.metricLabel}>{localizedText('Top Trigger', 'Disparador')}</Text>
            <Text style={styles.metricValue} numberOfLines={1}>
              {trend.topTriggerThisWeek ?? '—'}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metric}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#3B82F6' + '18' }]}>
              <Heart size={16} color="#3B82F6" />
            </View>
            <Text style={styles.metricLabel}>{localizedText('Top Emotion', 'Emoción')}</Text>
            <Text style={styles.metricValue} numberOfLines={1}>
              {trend.topEmotionThisWeek ?? '—'}
            </Text>
          </View>
        </View>

        {trend.checkInsThisWeek > 0 && (
          <View style={styles.footer}>
            <View style={styles.distressBar}>
              <View
                style={[
                  styles.distressFill,
                  {
                    width: `${Math.min(100, (trend.averageDistressThisWeek / 10) * 100)}%`,
                    backgroundColor: trendConfig.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.footerText}>
              {localizedText('Avg distress:', 'Malestar prom.:')} {trend.averageDistressThisWeek}/10 · {trend.checkInsThisWeek} {localizedText(
                `check-in${trend.checkInsThisWeek !== 1 ? 's' : ''} this week`,
                `registro${trend.checkInsThisWeek !== 1 ? 's' : ''} esta semana`,
              )}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  warningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginBottom: 3,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.borderLight,
    marginTop: 6,
  },
  footer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  distressBar: {
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  distressFill: {
    height: 4,
    borderRadius: 2,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
