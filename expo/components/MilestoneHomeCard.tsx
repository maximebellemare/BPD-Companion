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
import {
  Heart,
  BookOpen,
  Shield,
  Compass,
  FileText,
  Sparkles,
  Anchor,
  Calendar,
  Flame,
  ChevronRight,
  Award,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRewards } from '@/providers/RewardsProvider';
import { MilestoneLevel } from '@/types/reward';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Heart,
  BookOpen,
  Shield,
  Compass,
  FileText,
  Sparkles,
  Anchor,
  Calendar,
  Flame,
  Pill: Award,
};

const LEVEL_COLORS: Record<MilestoneLevel, { bg: string; border: string; text: string; accent: string }> = {
  bronze: { bg: '#FFFFFF', border: '#D9E2EC', text: '#3B82F6', accent: '#67E8F9' },
  silver: { bg: '#FFFFFF', border: '#D9E2EC', text: '#2E2A72', accent: '#2E2A72' },
  gold: { bg: '#FFFFFF', border: '#D9E2EC', text: '#3B82F6', accent: '#67E8F9' },
};

function MilestoneHomeCard() {
  const router = useRouter();
  const { recentMilestone, markMilestoneSeen, totalUnlocked } = useRewards();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (recentMilestone) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();

      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      );
      glowLoop.start();
      return () => glowLoop.stop();
    }
  }, [recentMilestone, fadeAnim, scaleAnim, glowAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (recentMilestone) {
      markMilestoneSeen(recentMilestone.id);
    }
    router.push('/milestones' as never);
  }, [recentMilestone, markMilestoneSeen, router]);

  if (!recentMilestone && totalUnlocked === 0) return null;

  if (!recentMilestone) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={handlePress}
        activeOpacity={0.7}
        testID="milestone-home-card"
      >
        <View style={styles.compactIcon}>
          <Award size={16} color={Colors.primary} />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle}>{totalUnlocked} Milestone{totalUnlocked !== 1 ? 's' : ''} Earned</Text>
          <Text style={styles.compactDesc}>View your consistency progress</Text>
        </View>
        <ChevronRight size={14} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  }

  const levelColors = LEVEL_COLORS[recentMilestone.level];
  const IconComponent = ICON_MAP[recentMilestone.icon] ?? Award;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: levelColors.bg, borderColor: levelColors.border }]}
        onPress={handlePress}
        activeOpacity={0.8}
        testID="milestone-celebration-card"
      >
        <Animated.View style={[styles.glowRing, { backgroundColor: levelColors.accent, opacity: glowOpacity }]} />
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: levelColors.accent + '20', borderColor: levelColors.accent + '40' }]}>
            <IconComponent size={20} color={levelColors.accent} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.levelBadge, { color: levelColors.text, backgroundColor: levelColors.accent + '18' }]}>
              {recentMilestone.level === 'bronze' ? 'New' : recentMilestone.level === 'silver' ? 'Growing' : 'Strong'} Milestone
            </Text>
            <Text style={[styles.title, { color: levelColors.text }]}>{recentMilestone.title}</Text>
          </View>
        </View>
        <Text style={[styles.celebration, { color: levelColors.text }]}>
          {recentMilestone.celebrationMessage}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: levelColors.accent }]}>View all milestones</Text>
          <ChevronRight size={14} color={levelColors.accent} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default React.memo(MilestoneHomeCard);

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  glowRing: {
    position: 'absolute' as const,
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1.5,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  levelBadge: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start' as const,
    overflow: 'hidden' as const,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  celebration: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic' as const,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  compactCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 14,
  },
  compactIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 1,
  },
  compactDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
