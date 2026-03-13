import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Sparkles,
  Star,
  TrendingDown,
  Pause,
  Brain,
  Heart,
  CheckCircle,
  BookOpen,
  Bookmark,
  Share2,
  ChevronRight,
  Award,
  Flame,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBreakthroughs } from '@/hooks/useBreakthroughs';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import type { BreakthroughMoment, BreakthroughType } from '@/types/breakthrough';

const TYPE_META: Record<BreakthroughType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  distress_reduction: { label: 'Distress Reduced', color: '#10B981', bg: '#ECFDF5', Icon: TrendingDown },
  pause_before_send: { label: 'Paused', color: '#6366F1', bg: '#EEF2FF', Icon: Pause },
  loop_broken: { label: 'Loop Broken', color: '#F59E0B', bg: '#FFFBEB', Icon: Award },
  emotional_awareness: { label: 'Awareness', color: '#8B5CF6', bg: '#F5F3FF', Icon: Brain },
  coping_success: { label: 'Coping Win', color: Colors.primary, bg: Colors.primaryLight, Icon: CheckCircle },
  relationship_regulation: { label: 'Relationship', color: '#EC4899', bg: '#FDF2F8', Icon: Heart },
  consistent_checkin: { label: 'Consistency', color: '#F59E0B', bg: '#FFFBEB', Icon: Star },
  journal_reflection: { label: 'Reflection', color: '#0EA5E9', bg: '#F0F9FF', Icon: BookOpen },
};

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MomentCard({
  moment,
  index,
  onSave,
  onShare,
  onAction,
}: {
  moment: BreakthroughMoment;
  index: number;
  onSave: (m: BreakthroughMoment) => void;
  onShare: (m: BreakthroughMoment) => void;
  onAction: (route: string) => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = Math.min(index * 80, 400);
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, index]);

  const meta = TYPE_META[moment.type];
  const IconComp = meta.Icon;

  return (
    <Animated.View
      style={[
        styles.momentCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.momentTimeline}>
        <View style={[styles.timelineDot, { backgroundColor: meta.color }]} />
        {index < 29 && <View style={styles.timelineLine} />}
      </View>

      <View style={styles.momentContent}>
        <View style={styles.momentHeader}>
          <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
            <IconComp size={12} color={meta.color} />
            <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={styles.momentTime}>{formatTimestamp(moment.timestamp)}</Text>
        </View>

        <Text style={styles.momentTitle}>{moment.title}</Text>
        <Text style={styles.momentDesc}>{moment.description}</Text>

        <View style={styles.supportiveBox}>
          <Sparkles size={13} color={Colors.accent} />
          <Text style={styles.supportiveText}>{moment.supportiveNote}</Text>
        </View>

        {moment.sourceData && (moment.sourceData.distressBefore != null && moment.sourceData.distressAfter != null) && (
          <View style={styles.dataRow}>
            <View style={styles.dataPill}>
              <Text style={styles.dataLabel}>Before</Text>
              <Text style={[styles.dataValue, { color: Colors.danger }]}>{moment.sourceData.distressBefore}</Text>
            </View>
            <View style={styles.dataArrow}>
              <ChevronRight size={14} color={Colors.textMuted} />
            </View>
            <View style={styles.dataPill}>
              <Text style={styles.dataLabel}>After</Text>
              <Text style={[styles.dataValue, { color: Colors.success }]}>{moment.sourceData.distressAfter}</Text>
            </View>
            {moment.sourceData.toolUsed && (
              <View style={[styles.dataPill, { backgroundColor: Colors.primaryLight }]}>
                <Text style={[styles.dataLabel, { color: Colors.primary }]}>Tool</Text>
                <Text style={[styles.dataValue, { color: Colors.primary, fontSize: 11 }]}>{moment.sourceData.toolUsed}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.momentActions}>
          <TouchableOpacity
            style={[styles.actionBtn, moment.saved && styles.actionBtnActive]}
            onPress={() => onSave(moment)}
            activeOpacity={0.7}
          >
            <Bookmark size={14} color={moment.saved ? Colors.accent : Colors.textMuted} fill={moment.saved ? Colors.accent : 'transparent'} />
            <Text style={[styles.actionBtnText, moment.saved && { color: Colors.accent }]}>
              {moment.saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onShare(moment)}
            activeOpacity={0.7}
          >
            <Share2 size={14} color={Colors.textMuted} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>

          {moment.actionRoute && moment.actionSuggestion && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: meta.bg }]}
              onPress={() => onAction(moment.actionRoute!)}
              activeOpacity={0.7}
            >
              <ChevronRight size={14} color={meta.color} />
              <Text style={[styles.actionBtnText, { color: meta.color }]} numberOfLines={1}>
                {moment.actionSuggestion}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function BreakthroughMomentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { moments, summary, save, markShared } = useBreakthroughs();
  const { trackEvent, trackScreen } = useAnalytics();
  const [filter, setFilter] = useState<BreakthroughType | 'all'>('all');

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    trackScreen('breakthrough_moments');
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [headerFade, headerSlide, trackScreen]);

  const filteredMoments = useMemo(() => {
    if (filter === 'all') return moments;
    return moments.filter(m => m.type === filter);
  }, [moments, filter]);

  const availableTypes = useMemo(() => {
    const types = new Set(moments.map(m => m.type));
    return Array.from(types) as BreakthroughType[];
  }, [moments]);

  const handleSave = useCallback((moment: BreakthroughMoment) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    save(moment);
    trackEvent('breakthrough_saved', { type: moment.type });
  }, [save, trackEvent]);

  const handleShare = useCallback((moment: BreakthroughMoment) => {
    const shareText = `${moment.title}\n\n${moment.description}\n\n${moment.supportiveNote}`;

    Alert.alert(
      'Share This Moment',
      'How would you like to share?',
      [
        {
          text: 'Share with Therapist',
          onPress: () => {
            markShared(moment.id);
            trackEvent('breakthrough_shared', { type: moment.type, method: 'therapist' });
            Alert.alert('Saved', 'This moment has been marked for your therapist.');
          },
        },
        {
          text: 'Share as Text',
          onPress: () => {
            void Share.share({ message: shareText });
            markShared(moment.id);
            trackEvent('breakthrough_shared', { type: moment.type, method: 'text' });
          },
        },
        {
          text: 'Save to Journal',
          onPress: () => {
            save(moment);
            trackEvent('breakthrough_saved_to_journal', { type: moment.type });
            Alert.alert('Saved', 'This breakthrough has been saved to your collection.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [markShared, save, trackEvent]);

  const handleAction = useCallback((route: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as never);
  }, [router]);

  const handleFilterPress = useCallback((type: BreakthroughType | 'all') => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setFilter(type);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          testID="close-breakthrough"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Breakthrough Moments</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.heroIcon}>
            <Sparkles size={32} color="#F59E0B" />
          </View>
          <Text style={styles.heroTitle}>Your Growth Story</Text>
          <Text style={styles.heroSubtitle}>
            Every moment of awareness is a step forward.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{summary.totalBreakthroughs}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{summary.thisWeekCount}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.streakInline}>
                <Flame size={14} color="#F59E0B" />
                <Text style={styles.statNumber}>{summary.streakDays}</Text>
              </View>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </Animated.View>

        {availableTypes.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
              onPress={() => handleFilterPress('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {availableTypes.map(type => {
              const meta = TYPE_META[type];
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    filter === type && { backgroundColor: meta.bg, borderColor: meta.color },
                  ]}
                  onPress={() => handleFilterPress(type)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filter === type && { color: meta.color },
                    ]}
                  >
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {filteredMoments.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Sparkles size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Moments are being gathered</Text>
            <Text style={styles.emptyDesc}>
              As you check in, use tools, and reflect, your breakthrough moments will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {filteredMoments.map((moment, index) => (
              <MomentCard
                key={moment.id}
                moment={moment}
                index={index}
                onSave={handleSave}
                onShare={handleShare}
                onAction={handleAction}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderLight,
  },
  streakInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  timelineContainer: {
    paddingTop: 4,
  },
  momentCard: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  momentTimeline: {
    width: 24,
    alignItems: 'center',
    paddingTop: 6,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderLight,
    marginTop: 4,
  },
  momentContent: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginLeft: 8,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  momentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  momentTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  momentTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  momentDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  supportiveBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.warmGlow,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  supportiveText: {
    flex: 1,
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500' as const,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dataPill: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    marginBottom: 1,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  dataArrow: {
    opacity: 0.4,
  },
  momentActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  actionBtnActive: {
    backgroundColor: Colors.accentLight,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
