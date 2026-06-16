import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Link2, ChevronRight, Sprout } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCorrelationInsights } from '@/hooks/useCorrelationInsights';

export default React.memo(function CorrelationInsightsCard() {
  const router = useRouter();
  const { insights, whatHelps, hasEnoughData } = useCorrelationInsights();

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/correlation-insights');
  }, [router]);

  if (!hasEnoughData || insights.length === 0) return null;

  const topItem = whatHelps[0];
  const unviewedCount = insights.filter(i => !i.viewed).length;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={handlePress}
      testID="correlation-insights-card"
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Link2 size={18} color="#3B82F6" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Correlation Insights</Text>
          <Text style={styles.subtitle}>
            {insights.length} pattern{insights.length !== 1 ? 's' : ''} detected
          </Text>
        </View>
        {unviewedCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unviewedCount}</Text>
          </View>
        )}
        <ChevronRight size={16} color={Colors.textMuted} />
      </View>

      {topItem && (
        <View style={styles.previewRow}>
          <Text style={styles.previewEmoji}>{topItem.emoji}</Text>
          <View style={styles.previewContent}>
            <Text style={styles.previewLabel} numberOfLines={1}>{topItem.label}</Text>
            <Text style={styles.previewDesc} numberOfLines={1}>{topItem.description}</Text>
          </View>
          <Sprout size={14} color="#14B8A6" />
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#0B1238',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    fontWeight: '500' as const,
    marginTop: 1,
  },
  badge: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  previewRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  previewEmoji: {
    fontSize: 18,
  },
  previewContent: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  previewDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
