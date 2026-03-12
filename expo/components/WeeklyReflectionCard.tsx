import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface WeeklyReflectionCardProps {
  weekLabel: string;
  hasEnoughData: boolean;
  openingNarrative: string;
  improvementCount: number;
}

function WeeklyReflectionCardComponent({
  weekLabel,
  hasEnoughData,
  openingNarrative,
  improvementCount,
}: WeeklyReflectionCardProps) {
  const router = useRouter();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/weekly-reflection');
  }, [router]);

  const glowOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.12],
  });

  const previewText = hasEnoughData
    ? openingNarrative.length > 100
      ? openingNarrative.slice(0, 100) + '...'
      : openingNarrative
    : 'Check in a few more times to unlock your weekly reflection.';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
      testID="weekly-reflection-card"
    >
      <Animated.View
        style={[
          styles.glowOverlay,
          { opacity: glowOpacity },
        ]}
      />

      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <BookOpen size={20} color={Colors.primary} />
        </View>
        <View style={styles.badge}>
          <Calendar size={11} color={Colors.primaryDark} />
          <Text style={styles.badgeText}>{weekLabel}</Text>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </View>

      <Text style={styles.title}>Weekly Reflection</Text>
      <Text style={styles.preview}>{previewText}</Text>

      {hasEnoughData && improvementCount > 0 && (
        <View style={styles.growthBadge}>
          <Text style={styles.growthBadgeText}>
            {improvementCount} growth signal{improvementCount !== 1 ? 's' : ''} detected
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const WeeklyReflectionCard = React.memo(WeeklyReflectionCardComponent);
export default WeeklyReflectionCard;

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
    backgroundColor: Colors.primary,
    borderRadius: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  preview: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  growthBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  growthBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
});
