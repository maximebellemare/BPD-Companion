import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { BarChart3, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePatternInsights } from '@/hooks/usePatternInsights';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

export default function EmotionalInsightsCard() {
  useLanguage();
  const router = useRouter();
  const { analysis, insights } = usePatternInsights(30);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/emotional-insights');
  };

  const topTrigger = analysis.triggers[0];
  const topEmotion = analysis.emotions[0];
  const bestTool = analysis.copingEffectiveness[0];

  const trendIcon = analysis.distressTrend === 'improving'
    ? <TrendingDown size={13} color={Colors.success} />
    : analysis.distressTrend === 'worsening'
      ? <TrendingUp size={13} color={Colors.danger} />
      : <Minus size={13} color={Colors.textMuted} />;

  const trendLabel = analysis.distressTrend === 'improving' ? localizedText('Improving', 'Mejorando')
    : analysis.distressTrend === 'worsening' ? localizedText('Elevated', 'Elevado')
    : analysis.distressTrend === 'stable' ? localizedText('Stable', 'Estable')
    : '';

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.7}
        testID="emotional-insights-card"
      >
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <BarChart3 size={18} color={Colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{localizedText('Emotional Insights', 'Insights emocionales')}</Text>
            <Text style={styles.subtitle}>{localizedText('Your patterns at a glance', 'Tus patrones de un vistazo')}</Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </View>

        {insights.hasEnoughData ? (
          <View style={styles.body}>
            <View style={styles.statsRow}>
              {topTrigger && (
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>{localizedText('Top trigger', 'Disparador principal')}</Text>
                  <Text style={styles.statValue} numberOfLines={1}>{topTrigger.label}</Text>
                </View>
              )}
              {topEmotion && (
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>{localizedText('Top emotion', 'Emoción principal')}</Text>
                  <Text style={styles.statValue} numberOfLines={1}>{topEmotion.emoji} {topEmotion.label}</Text>
                </View>
              )}
              {trendLabel ? (
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>{localizedText('Trend', 'Tendencia')}</Text>
                  <View style={styles.trendRow}>
                    {trendIcon}
                    <Text style={styles.statValue}>{trendLabel}</Text>
                  </View>
                </View>
              ) : null}
            </View>
            {bestTool && bestTool.avgReduction > 0 && (
              <View style={styles.toolHint}>
                <Text style={styles.toolHintText}>
                  {bestTool.tool} {localizedText('reduced distress by', 'redujo el malestar en')} ~{bestTool.avgReduction} {localizedText('pts', 'pts')}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyBody}>
            <Text style={styles.emptyText}>
              {localizedText(
                'A few more check-ins will reveal your emotional patterns.',
                'Unos registros más revelarán tus patrones emocionales.',
              )}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  body: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  trendRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  toolHint: {
    marginTop: 10,
    backgroundColor: Colors.successLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toolHintText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.success,
  },
  emptyBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});
