import React, { useMemo, useRef, useEffect, useCallback } from 'react';
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
  Brain,
  Sparkles,
  TrendingUp,
  Shield,
  Heart,
  Compass,
  Lightbulb,
  ChevronRight,
  Clock,
  Users,
  Zap,
  Activity,
  Target,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import {
  buildBehavioralCoachProfile,
} from '@/services/coaching/behavioralCoachService';
import { generateCoachingMoments } from '@/services/coaching/coachingInsightGenerator';
import {
  BehavioralCoachProfile,
  CoachingMoment,
  PatternCoachInsight,
  TimingNudge,
  CopingSuggestion,
  GrowthRecognition,
  RelationshipCoachMoment,
  RegulationTip,
} from '@/types/behavioralCoach';

const SECTION_COLORS = {
  pattern: { bg: '#FFF0E8', border: '#F5D4BE', accent: '#C4704A' },
  timing: { bg: '#E8F0F5', border: '#C0D8E8', accent: '#4A7A9B' },
  coping: { bg: '#E3F0E8', border: '#C0DBC8', accent: '#4A8B60' },
  growth: { bg: '#F0F5E3', border: '#D4E0B8', accent: '#6B8B4A' },
  relationship: { bg: '#F5E6D8', border: '#E8D0BC', accent: '#C4885B' },
  regulation: { bg: '#EDE8F5', border: '#D4C8E8', accent: '#7B5EA7' },
};

function SectionHeader({ title, icon, color }: { title: string; icon: React.ReactNode; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: color + '18' }]}>
        {icon}
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function PatternInsightCard({ insight, index }: { insight: PatternCoachInsight; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.insightCard, { opacity: fadeAnim, backgroundColor: SECTION_COLORS.pattern.bg, borderColor: SECTION_COLORS.pattern.border }]}>
      <View style={styles.insightHeader}>
        <View style={[styles.categoryDot, { backgroundColor: SECTION_COLORS.pattern.accent }]} />
        <Text style={[styles.insightPattern, { color: SECTION_COLORS.pattern.accent }]}>{insight.pattern}</Text>
        <View style={styles.frequencyBadge}>
          <Text style={styles.frequencyText}>{insight.frequency}x</Text>
        </View>
      </View>
      <Text style={styles.insightObservation}>{insight.observation}</Text>
      <Text style={styles.insightCoaching}>{insight.coaching}</Text>
    </Animated.View>
  );
}

function TimingNudgeCard({ nudge, index }: { nudge: TimingNudge; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.insightCard, { opacity: fadeAnim, backgroundColor: SECTION_COLORS.timing.bg, borderColor: SECTION_COLORS.timing.border }]}>
      <View style={styles.insightHeader}>
        <Clock size={14} color={SECTION_COLORS.timing.accent} />
        <Text style={[styles.insightPattern, { color: SECTION_COLORS.timing.accent }]}>{nudge.context}</Text>
      </View>
      <Text style={styles.insightCoaching}>{nudge.suggestion}</Text>
      <Text style={styles.insightMeta}>{nudge.reasoning}</Text>
    </Animated.View>
  );
}

function CopingSuggestionCard({ suggestion, index }: { suggestion: CopingSuggestion; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.insightCard, { opacity: fadeAnim, backgroundColor: SECTION_COLORS.coping.bg, borderColor: SECTION_COLORS.coping.border }]}>
      <View style={styles.insightHeader}>
        <Heart size={14} color={SECTION_COLORS.coping.accent} />
        <Text style={[styles.insightPattern, { color: SECTION_COLORS.coping.accent }]}>{suggestion.tool}</Text>
        <View style={[styles.effectBadge, { backgroundColor: SECTION_COLORS.coping.accent + '20' }]}>
          <Text style={[styles.effectText, { color: SECTION_COLORS.coping.accent }]}>{suggestion.effectiveness}% effective</Text>
        </View>
      </View>
      <Text style={styles.insightObservation}>{suggestion.situation}</Text>
      <Text style={styles.insightCoaching}>{suggestion.why}</Text>
      {suggestion.alternativeTool && (
        <Text style={styles.insightMeta}>Alternative: {suggestion.alternativeTool}</Text>
      )}
    </Animated.View>
  );
}

function GrowthCard({ growth, index }: { growth: GrowthRecognition; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.insightCard, { opacity: fadeAnim, backgroundColor: SECTION_COLORS.growth.bg, borderColor: SECTION_COLORS.growth.border }]}>
      <View style={styles.insightHeader}>
        <TrendingUp size={14} color={SECTION_COLORS.growth.accent} />
        <Text style={[styles.insightPattern, { color: SECTION_COLORS.growth.accent }]}>{growth.area}</Text>
        <View style={[styles.directionBadge, { backgroundColor: SECTION_COLORS.growth.accent + '20' }]}>
          <Text style={[styles.directionText, { color: SECTION_COLORS.growth.accent }]}>
            {growth.direction === 'improving' ? 'Improving' : 'Maintained'}
          </Text>
        </View>
      </View>
      <Text style={styles.insightObservation}>{growth.description}</Text>
      <Text style={styles.insightCoaching}>{growth.narrative}</Text>
    </Animated.View>
  );
}

function RelationshipCoachCard({ moment, index }: { moment: RelationshipCoachMoment; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.insightCard, { opacity: fadeAnim, backgroundColor: SECTION_COLORS.relationship.bg, borderColor: SECTION_COLORS.relationship.border }]}>
      <View style={styles.insightHeader}>
        <Users size={14} color={SECTION_COLORS.relationship.accent} />
        <Text style={[styles.insightPattern, { color: SECTION_COLORS.relationship.accent }]} numberOfLines={1}>{moment.pattern}</Text>
      </View>
      <Text style={styles.insightCoaching}>{moment.coaching}</Text>
      <View style={styles.valuesWrap}>
        <Target size={12} color={Colors.accent} />
        <Text style={styles.valuesText}>{moment.valuesAlignment}</Text>
      </View>
      <Text style={styles.insightMeta}>{moment.suggestedResponse}</Text>
    </Animated.View>
  );
}

function RegulationTipCard({ tip, index }: { tip: RegulationTip; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.insightCard, { opacity: fadeAnim, backgroundColor: SECTION_COLORS.regulation.bg, borderColor: SECTION_COLORS.regulation.border }]}>
      <View style={styles.insightHeader}>
        <Zap size={14} color={SECTION_COLORS.regulation.accent} />
        <Text style={[styles.insightPattern, { color: SECTION_COLORS.regulation.accent }]}>When "{tip.trigger}" activates</Text>
        <View style={[styles.distressBadge, {
          backgroundColor: tip.distressRange === 'high' ? '#E1705520' : '#D4956A20',
        }]}>
          <Text style={[styles.distressText, {
            color: tip.distressRange === 'high' ? Colors.danger : Colors.accent,
          }]}>{tip.distressRange}</Text>
        </View>
      </View>
      <Text style={styles.insightObservation}>Pattern: {tip.currentPattern}</Text>
      <Text style={styles.insightCoaching}>{tip.suggestedShift}</Text>
      <Text style={styles.insightMeta}>Suggested tool: {tip.tool}</Text>
    </Animated.View>
  );
}

function MomentCard({ moment, onAction }: { moment: CoachingMoment; onAction: (route: string) => void }) {
  const toneColors: Record<string, string> = {
    encouraging: '#00B894',
    grounding: '#6B9080',
    reflective: '#D4956A',
    celebratory: '#F59E0B',
  };
  const color = toneColors[moment.tone] ?? Colors.primary;

  return (
    <View style={[styles.momentCard, { borderLeftColor: color }]}>
      <Text style={styles.momentTitle}>{moment.title}</Text>
      <Text style={styles.momentMessage}>{moment.message}</Text>
      {moment.detail && <Text style={styles.momentDetail}>{moment.detail}</Text>}
      {moment.suggestedAction && (
        <TouchableOpacity
          style={[styles.momentAction, { backgroundColor: color + '15' }]}
          onPress={() => onAction(moment.suggestedAction!.route)}
          activeOpacity={0.7}
        >
          <Sparkles size={13} color={color} />
          <Text style={[styles.momentActionText, { color }]}>{moment.suggestedAction.label}</Text>
          <ChevronRight size={13} color={color} style={{ opacity: 0.6 }} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Brain size={36} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Your coaching profile is building</Text>
      <Text style={styles.emptyBody}>
        As you check in, journal, and use the app, the AI Behavioral Coach will learn your patterns and offer personalized insights.
      </Text>
      <Text style={styles.emptyHint}>Keep checking in — every entry helps build a clearer picture.</Text>
    </View>
  );
}

export default function BehavioralCoachScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { journalEntries, messageDrafts } = useApp();
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  const profile = useMemo<BehavioralCoachProfile>(() => {
    console.log('[BehavioralCoachScreen] Building profile...');
    return buildBehavioralCoachProfile(journalEntries, messageDrafts);
  }, [journalEntries, messageDrafts]);


  const topMoments = useMemo(() => {
    return generateCoachingMoments(profile).slice(0, 5);
  }, [profile]);

  const hasData = profile.totalMoments > 0;

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleAction = useCallback((route: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as never);
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} testID="coach-close-btn">
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIconRow}>
            <Brain size={20} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>AI Behavioral Coach</Text>
          {profile.weeklyTheme ? (
            <Text style={styles.headerTheme}>{profile.weeklyTheme}</Text>
          ) : null}
        </View>
        <View style={styles.closeBtn} />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            {profile.dailySummary ? (
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Compass size={16} color={Colors.primary} />
                  <Text style={styles.summaryLabel}>Today's Focus</Text>
                </View>
                <Text style={styles.summaryText}>{profile.dailySummary}</Text>
              </View>
            ) : null}

            {topMoments.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Active Coaching Moments"
                  icon={<Sparkles size={16} color={Colors.accent} />}
                  color={Colors.accent}
                />
                {topMoments.map(moment => (
                  <MomentCard key={moment.id} moment={moment} onAction={handleAction} />
                ))}
              </View>
            )}

            {profile.topPatternInsights.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Pattern Insights"
                  icon={<Activity size={16} color={SECTION_COLORS.pattern.accent} />}
                  color={SECTION_COLORS.pattern.accent}
                />
                {profile.topPatternInsights.map((insight, i) => (
                  <PatternInsightCard key={insight.id} insight={insight} index={i} />
                ))}
              </View>
            )}

            {profile.growthRecognitions.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Growth Signals"
                  icon={<TrendingUp size={16} color={SECTION_COLORS.growth.accent} />}
                  color={SECTION_COLORS.growth.accent}
                />
                {profile.growthRecognitions.map((growth, i) => (
                  <GrowthCard key={growth.id} growth={growth} index={i} />
                ))}
              </View>
            )}

            {profile.timingNudges.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Timing Nudges"
                  icon={<Clock size={16} color={SECTION_COLORS.timing.accent} />}
                  color={SECTION_COLORS.timing.accent}
                />
                {profile.timingNudges.map((nudge, i) => (
                  <TimingNudgeCard key={nudge.id} nudge={nudge} index={i} />
                ))}
              </View>
            )}

            {profile.copingSuggestions.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Coping Suggestions"
                  icon={<Heart size={16} color={SECTION_COLORS.coping.accent} />}
                  color={SECTION_COLORS.coping.accent}
                />
                {profile.copingSuggestions.map((suggestion, i) => (
                  <CopingSuggestionCard key={suggestion.id} suggestion={suggestion} index={i} />
                ))}
              </View>
            )}

            {profile.relationshipCoaching.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Relationship Coaching"
                  icon={<Users size={16} color={SECTION_COLORS.relationship.accent} />}
                  color={SECTION_COLORS.relationship.accent}
                />
                {profile.relationshipCoaching.map((moment, i) => (
                  <RelationshipCoachCard key={moment.id} moment={moment} index={i} />
                ))}
              </View>
            )}

            {profile.regulationTips.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  title="Regulation Tips"
                  icon={<Shield size={16} color={SECTION_COLORS.regulation.accent} />}
                  color={SECTION_COLORS.regulation.accent}
                />
                {profile.regulationTips.map((tip, i) => (
                  <RegulationTipCard key={tip.id} tip={tip} index={i} />
                ))}
              </View>
            )}

            <View style={styles.footerNote}>
              <Lightbulb size={14} color={Colors.textMuted} />
              <Text style={styles.footerNoteText}>
                Coaching insights update as you use the app. More check-ins and journaling create more personalized guidance.
              </Text>
            </View>
          </>
        )}
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
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center' as const,
  },
  headerIconRow: {
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerTheme: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  insightCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap' as const,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  insightPattern: {
    fontSize: 13,
    fontWeight: '700' as const,
    flex: 1,
  },
  frequencyBadge: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  frequencyText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  effectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  effectText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  directionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  directionText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  distressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  distressText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  insightObservation: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 6,
  },
  insightCoaching: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    fontWeight: '500' as const,
  },
  insightMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  valuesWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(212,149,106,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  valuesText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500' as const,
    flex: 1,
    lineHeight: 18,
  },
  momentCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  momentTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  momentMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  momentDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  momentAction: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 12,
    alignSelf: 'flex-start' as const,
  },
  momentActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  emptyBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 16,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.primary,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
    fontStyle: 'italic' as const,
  },
  footerNote: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    flex: 1,
  },
});
