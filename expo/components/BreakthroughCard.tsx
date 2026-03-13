import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, ChevronRight, Star, TrendingDown, Pause, Brain, Heart, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import type { BreakthroughSummary } from '@/types/breakthrough';

interface BreakthroughCardProps {
  summary: BreakthroughSummary;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; accent: string; bg: string }> = {
  distress_reduction: {
    icon: <TrendingDown size={16} color="#10B981" />,
    accent: '#10B981',
    bg: '#ECFDF5',
  },
  pause_before_send: {
    icon: <Pause size={16} color="#6366F1" />,
    accent: '#6366F1',
    bg: '#EEF2FF',
  },
  emotional_awareness: {
    icon: <Brain size={16} color="#8B5CF6" />,
    accent: '#8B5CF6',
    bg: '#F5F3FF',
  },
  relationship_regulation: {
    icon: <Heart size={16} color="#EC4899" />,
    accent: '#EC4899',
    bg: '#FDF2F8',
  },
  coping_success: {
    icon: <CheckCircle size={16} color={Colors.primary} />,
    accent: Colors.primary,
    bg: Colors.primaryLight,
  },
  consistent_checkin: {
    icon: <Star size={16} color="#F59E0B" />,
    accent: '#F59E0B',
    bg: '#FFFBEB',
  },
};

export default React.memo(function BreakthroughCard({ summary }: BreakthroughCardProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [fadeAnim, slideAnim, shimmerAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/breakthrough-moments' as never);
  }, [router]);

  const latest = summary.latestBreakthrough;
  const config = latest ? (TYPE_CONFIG[latest.type] ?? TYPE_CONFIG.coping_success) : TYPE_CONFIG.coping_success;

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  if (summary.totalBreakthroughs === 0) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.8}
        testID="breakthrough-card"
      >
        <Animated.View style={[styles.accentBar, { backgroundColor: config.accent, opacity: shimmerOpacity }]} />

        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
            <Sparkles size={20} color={config.accent} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Breakthrough Moments</Text>
            <Text style={styles.subtitle}>
              {summary.thisWeekCount > 0
                ? `${summary.thisWeekCount} insight${summary.thisWeekCount !== 1 ? 's' : ''} this week`
                : `${summary.totalBreakthroughs} moment${summary.totalBreakthroughs !== 1 ? 's' : ''} of growth`}
            </Text>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </View>

        {latest && (
          <View style={[styles.latestRow, { backgroundColor: config.bg }]}>
            <View style={styles.latestIcon}>{config.icon}</View>
            <View style={styles.latestContent}>
              <Text style={[styles.latestTitle, { color: config.accent }]} numberOfLines={1}>
                {latest.title}
              </Text>
              <Text style={styles.latestDesc} numberOfLines={2}>
                {latest.supportiveNote}
              </Text>
            </View>
          </View>
        )}

        {summary.streakDays > 1 && (
          <View style={styles.streakRow}>
            <Star size={12} color="#F59E0B" />
            <Text style={styles.streakText}>
              {summary.streakDays}-day growth streak
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  latestRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
  },
  latestIcon: {
    marginTop: 2,
  },
  latestContent: {
    flex: 1,
  },
  latestTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 3,
  },
  latestDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
});
