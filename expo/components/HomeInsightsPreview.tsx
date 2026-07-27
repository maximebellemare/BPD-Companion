import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingDown, TrendingUp, Minus, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

export default React.memo(function HomeInsightsPreview() {
  useLanguage();
  const router = useRouter();
  const { memoryProfile } = useAICompanion();

  const hasData = memoryProfile.recentCheckInCount > 0;

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/companion/insights' as never);
  }, [router]);

  if (!hasData) return null;

  const trendIcon = memoryProfile.intensityTrend === 'falling'
    ? <TrendingDown size={12} color={Colors.success} />
    : memoryProfile.intensityTrend === 'rising'
      ? <TrendingUp size={12} color={Colors.danger} />
      : <Minus size={12} color={Colors.textMuted} />;

  const trendColor = memoryProfile.intensityTrend === 'falling'
    ? Colors.success
    : memoryProfile.intensityTrend === 'rising'
      ? Colors.danger
      : Colors.textMuted;

  const trendLabel = memoryProfile.intensityTrend === 'falling'
    ? localizedText('Decreasing', 'Disminuyendo')
    : memoryProfile.intensityTrend === 'rising'
      ? localizedText('Increasing', 'Aumentando')
      : memoryProfile.intensityTrend === 'stable'
        ? localizedText('Stable', 'Estable')
        : '—';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      testID="home-insights-preview"
    >
      <View style={styles.header}>
        <Text style={styles.headerLabel}>{localizedText('Your patterns', 'Tus patrones')}</Text>
        <ChevronRight size={14} color={Colors.textMuted} />
      </View>

      <View style={styles.grid}>
        {memoryProfile.topTriggers[0] && (
          <View style={styles.item}>
            <Text style={styles.itemEmoji}>⚡</Text>
            <Text style={styles.itemLabel}>{localizedText('Trigger', 'Disparador')}</Text>
            <Text style={styles.itemValue} numberOfLines={1}>
              {memoryProfile.topTriggers[0].label}
            </Text>
          </View>
        )}

        {memoryProfile.topEmotions[0] && (
          <View style={styles.item}>
            <Text style={styles.itemEmoji}>💙</Text>
            <Text style={styles.itemLabel}>{localizedText('Emotion', 'Emoción')}</Text>
            <Text style={styles.itemValue} numberOfLines={1}>
              {memoryProfile.topEmotions[0].label}
            </Text>
          </View>
        )}

        {memoryProfile.mostEffectiveCoping && (
          <View style={styles.item}>
            <Text style={styles.itemEmoji}>🛠</Text>
            <Text style={styles.itemLabel}>{localizedText('Tool', 'Herramienta')}</Text>
            <Text style={styles.itemValue} numberOfLines={1}>
              {memoryProfile.mostEffectiveCoping.label}
            </Text>
          </View>
        )}

        <View style={styles.item}>
          <View style={styles.trendIconWrap}>{trendIcon}</View>
          <Text style={styles.itemLabel}>{localizedText('Distress', 'Malestar')}</Text>
          <Text style={[styles.itemValue, { color: trendColor }]}>{trendLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center' as const,
  },
  itemEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  trendIconWrap: {
    height: 20,
    justifyContent: 'center' as const,
    marginBottom: 2,
  },
  itemLabel: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  itemValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
});
