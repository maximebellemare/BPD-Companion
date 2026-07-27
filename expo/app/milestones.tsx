import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Heart,
  BookOpen,
  Shield,
  Compass,
  FileText,
  Sparkles,
  Anchor,
  Calendar,
  Flame,
  Award,
  Lock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRewards } from '@/providers/RewardsProvider';
import { MilestoneDefinition, MilestoneLevel, MILESTONE_DEFINITIONS } from '@/types/reward';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

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

const LEVEL_META: Record<MilestoneLevel, { label: string; color: string; bg: string; border: string }> = {
  bronze: { get label() { return localizedText('Beginning', 'Comenzando'); }, color: '#3B82F6', bg: '#FFFFFF', border: '#D9E2EC' },
  silver: { get label() { return localizedText('Growing', 'Creciendo'); }, color: '#2E2A72', bg: '#FFFFFF', border: '#D9E2EC' },
  gold: { get label() { return localizedText('Strong', 'Fuerte'); }, color: '#3B82F6', bg: '#FFFFFF', border: '#D9E2EC' },
};

const CATEGORY_LABELS: Record<string, string> = {
  check_in: 'Check-Ins',
  journaling: 'Journaling',
  pause_win: 'Pause Before Sending',
  reflection: 'Weekly Reflection',
  therapy_prep: 'Therapy Preparation',
  medication: 'Medication',
  companion: 'AI Companion',
  support_before_reaction: 'Support Before Reaction',
  appointment: 'Appointments',
  consistency: 'Streaks',
};

export default function MilestonesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  useLanguage();
  const {
    unlockedMilestones,
    nextMilestones,
    metrics,
    totalUnlocked,
    markAllSeen,
  } = useRewards();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(20))
  ).current;
  const slideOpacities = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'milestones' });
    markAllSeen();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    slideAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 400,
        delay: 150 + i * 80,
        useNativeDriver: true,
      }).start();
    });

    slideOpacities.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 150 + i * 80,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, slideAnims, slideOpacities, trackEvent, markAllSeen]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const unlockedIds = useMemo(
    () => new Set(unlockedMilestones.map(m => m.id)),
    [unlockedMilestones],
  );

  const categories = useMemo(() => {
    const catMap = new Map<string, MilestoneDefinition[]>();
    for (const m of MILESTONE_DEFINITIONS) {
      const list = catMap.get(m.category) ?? [];
      list.push(m);
      catMap.set(m.category, list);
    }
    return Array.from(catMap.entries()).map(([category, milestones]) => ({
      category,
      label: CATEGORY_LABELS[category] ?? category,
      milestones,
      unlockedCount: milestones.filter(m => unlockedIds.has(m.id)).length,
    }));
  }, [unlockedIds]);

  const renderMilestone = useCallback((milestone: MilestoneDefinition, isUnlocked: boolean) => {
    const levelMeta = LEVEL_META[milestone.level];
    const IconComponent = ICON_MAP[milestone.icon] ?? Award;

    return (
      <View
        key={milestone.id}
        style={[
          styles.milestoneItem,
          isUnlocked
            ? { backgroundColor: levelMeta.bg, borderColor: levelMeta.border }
            : { backgroundColor: Colors.surface, borderColor: Colors.borderLight },
        ]}
      >
        <View
          style={[
            styles.milestoneIcon,
            isUnlocked
              ? { backgroundColor: levelMeta.color + '15' }
              : { backgroundColor: Colors.borderLight },
          ]}
        >
          {isUnlocked ? (
            <IconComponent size={18} color={levelMeta.color} />
          ) : (
            <Lock size={14} color={Colors.textMuted} />
          )}
        </View>
        <View style={styles.milestoneContent}>
          <Text
            style={[
              styles.milestoneTitle,
              !isUnlocked && styles.milestoneTitleLocked,
            ]}
          >
            {milestone.title}
          </Text>
          <Text
            style={[
              styles.milestoneDesc,
              !isUnlocked && styles.milestoneDescLocked,
            ]}
          >
            {milestone.description}
          </Text>
        </View>
        {isUnlocked && (
          <View style={[styles.levelPill, { backgroundColor: levelMeta.color + '18' }]}>
            <Text style={[styles.levelPillText, { color: levelMeta.color }]}>
              {levelMeta.label}
            </Text>
          </View>
        )}
      </View>
    );
  }, []);

  let animIndex = 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID="milestones-close"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Milestones</Text>
          <Text style={styles.headerSubtitle}>
            {totalUnlocked} earned
          </Text>
        </View>
        <View style={styles.headerRight} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.summaryCard,
            {
              opacity: slideOpacities[0],
              transform: [{ translateY: slideAnims[0] }],
            },
          ]}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{metrics.checkInDays}</Text>
              <Text style={styles.summaryLabel}>{localizedText('Check-in', 'Check-in')}{'\n'}{localizedText('days', 'días')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{metrics.journalDays}</Text>
              <Text style={styles.summaryLabel}>{localizedText('Journal', 'Diario')}{'\n'}{localizedText('days', 'días')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{metrics.pauseWins}</Text>
              <Text style={styles.summaryLabel}>Pause{'\n'}wins</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{metrics.currentCheckInStreak}</Text>
              <Text style={styles.summaryLabel}>Current{'\n'}streak</Text>
            </View>
          </View>
        </Animated.View>

        {nextMilestones.length > 0 && (
          <Animated.View
            style={{
              opacity: slideOpacities[1],
              transform: [{ translateY: slideAnims[1] }],
            }}
          >
            <Text style={styles.sectionTitle}>NEXT UP</Text>
            <View style={styles.nextSection}>
              {nextMilestones.map(milestone => {
                const levelMeta = LEVEL_META[milestone.level];
                const IconComponent = ICON_MAP[milestone.icon] ?? Award;
                return (
                  <View key={milestone.id} style={styles.nextItem}>
                    <View style={styles.nextItemTop}>
                      <View style={[styles.nextIcon, { backgroundColor: levelMeta.color + '12' }]}>
                        <IconComponent size={14} color={levelMeta.color} />
                      </View>
                      <View style={styles.nextItemContent}>
                        <Text style={styles.nextItemTitle}>{milestone.title}</Text>
                        <Text style={styles.nextItemDesc}>{milestone.description}</Text>
                      </View>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.round(milestone.progress * 100)}%` as `${number}%`,
                              backgroundColor: levelMeta.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(milestone.progress * 100)}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {categories.map((cat, catIdx) => {
          animIndex = Math.min(catIdx + 2, slideAnims.length - 1);
          return (
            <Animated.View
              key={cat.category}
              style={{
                opacity: slideOpacities[animIndex],
                transform: [{ translateY: slideAnims[animIndex] }],
              }}
            >
              <View style={styles.categoryHeader}>
                <Text style={styles.sectionTitle}>{cat.label.toUpperCase()}</Text>
                <Text style={styles.categoryCount}>
                  {cat.unlockedCount}/{cat.milestones.length}
                </Text>
              </View>
              <View style={styles.milestoneList}>
                {cat.milestones.map(m => renderMilestone(m, unlockedIds.has(m.id)))}
              </View>
            </Animated.View>
          );
        })}

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>
            Milestones celebrate your consistency.{'\n'}
            No pressure. Just recognition.
          </Text>
        </View>

        <View style={{ height: insets.bottom + 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 14,
    fontWeight: '500' as const,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 2,
  },
  nextSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden' as const,
    marginBottom: 24,
  },
  nextItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  nextItemTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  nextIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  nextItemContent: {
    flex: 1,
  },
  nextItemTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  nextItemDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  progressBarContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surface,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    width: 32,
    textAlign: 'right' as const,
  },
  categoryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
    marginLeft: 2,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  milestoneList: {
    gap: 8,
    marginBottom: 24,
  },
  milestoneItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  milestoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  milestoneTitleLocked: {
    color: Colors.textMuted,
  },
  milestoneDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  milestoneDescLocked: {
    color: Colors.textMuted,
  },
  levelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  levelPillText: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  bottomNote: {
    alignItems: 'center' as const,
    paddingVertical: 24,
  },
  bottomNoteText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
});
