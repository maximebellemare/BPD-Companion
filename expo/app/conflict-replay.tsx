import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  RotateCcw,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Wind,
  Timer,
  Sparkles,
  MessageSquare,
  BookOpen,
  Compass,
  TrendingUp,
  AlertCircle,
  Leaf,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useConflictReplay } from '@/hooks/useConflictReplay';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  ConflictReplayTimeline,
  ConflictInsightCard,
  ConflictTimelineStep,
  CONFLICT_OUTCOME_META,
} from '@/types/conflictReplay';

const STEP_COLORS: Record<string, string> = {
  trigger: '#E17055',
  emotion: '#D4956A',
  urge: '#E84393',
  action: '#6B9080',
  outcome: '#3B82F6',
};

function TimelineStepCard({
  step,
  index,
  isLast,
}: {
  step: ConflictTimelineStep;
  index: number;
  isLast: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const color = STEP_COLORS[step.type] ?? Colors.textSecondary;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View
      style={[
        styles.timelineStepRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.timelineTrack}>
        <View style={[styles.timelineDot, { backgroundColor: color }]}>
          <Text style={styles.timelineDotEmoji}>{step.emoji}</Text>
        </View>
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: color + '30' }]} />}
      </View>
      <View style={styles.timelineStepContent}>
        <Text style={[styles.stepTypeLabel, { color }]}>
          {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
        </Text>
        <Text style={styles.stepLabel}>{step.label}</Text>
        <Text style={styles.stepDetail}>{step.detail}</Text>
        {step.intensity != null && step.intensity > 0 && (
          <View style={styles.intensityRow}>
            <View style={styles.intensityBarBg}>
              <View
                style={[
                  styles.intensityBarFill,
                  {
                    width: `${(step.intensity / 10) * 100}%`,
                    backgroundColor: step.intensity >= 7 ? Colors.danger : step.intensity >= 4 ? Colors.accent : Colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.intensityText}>{step.intensity}/10</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function EventCard({
  timeline,
  isExpanded,
  onToggle,
}: {
  timeline: ConflictReplayTimeline;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { event, steps } = timeline;
  const outcomeMeta = CONFLICT_OUTCOME_META[event.outcome];
  const date = new Date(event.timestamp);
  const timeStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  }, [onToggle]);

  return (
    <View style={styles.eventCard}>
      <TouchableOpacity
        style={styles.eventCardHeader}
        onPress={handlePress}
        activeOpacity={0.7}
        testID={`conflict-event-${event.id}`}
      >
        <View style={styles.eventCardLeft}>
          <View style={[styles.outcomeBadge, { backgroundColor: outcomeMeta.color + '18' }]}>
            <Text style={styles.outcomeBadgeEmoji}>{outcomeMeta.emoji}</Text>
          </View>
          <View style={styles.eventCardInfo}>
            <Text style={styles.eventTriggerLabel}>
              {event.triggerDetail ?? event.trigger}
            </Text>
            <Text style={styles.eventTime}>{timeStr}</Text>
            <View style={styles.eventTagsRow}>
              <View style={[styles.eventTag, { backgroundColor: Colors.primaryLight }]}>
                <Text style={[styles.eventTagText, { color: Colors.primary }]}>
                  {event.emotion}
                </Text>
              </View>
              <View style={[styles.eventTag, { backgroundColor: outcomeMeta.color + '18' }]}>
                <Text style={[styles.eventTagText, { color: outcomeMeta.color }]}>
                  {outcomeMeta.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {isExpanded ? (
          <ChevronUp size={20} color={Colors.textMuted} />
        ) : (
          <ChevronDown size={20} color={Colors.textMuted} />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.eventCardExpanded}>
          <View style={styles.timelineContainer}>
            {steps.map((step, idx) => (
              <TimelineStepCard
                key={step.type}
                step={step}
                index={idx}
                isLast={idx === steps.length - 1}
              />
            ))}
          </View>

          {event.aiInsight && (
            <View style={styles.aiInsightBox}>
              <View style={styles.aiInsightHeader}>
                <Sparkles size={14} color={Colors.primary} />
                <Text style={styles.aiInsightTitle}>AI Insight</Text>
              </View>
              <Text style={styles.aiInsightText}>{event.aiInsight}</Text>
            </View>
          )}

          {event.learningSuggestions && event.learningSuggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              <View style={styles.suggestionsHeader}>
                <Lightbulb size={14} color={Colors.accent} />
                <Text style={styles.suggestionsTitle}>What might help next time</Text>
              </View>
              {event.learningSuggestions.map((suggestion, idx) => (
                <View key={idx} style={styles.suggestionRow}>
                  <View style={styles.suggestionBullet} />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function InsightCard({ insight }: { insight: ConflictInsightCard }) {
  const iconColor = insight.type === 'growth'
    ? Colors.primary
    : insight.type === 'warning'
    ? Colors.danger
    : insight.type === 'suggestion'
    ? Colors.accent
    : Colors.textSecondary;

  const bgColor = insight.type === 'growth'
    ? Colors.primaryLight
    : insight.type === 'warning'
    ? Colors.dangerLight
    : insight.type === 'suggestion'
    ? Colors.accentLight
    : Colors.surface;

  const IconComponent = insight.type === 'growth'
    ? Leaf
    : insight.type === 'warning'
    ? AlertCircle
    : insight.type === 'suggestion'
    ? Lightbulb
    : TrendingUp;

  return (
    <View style={[styles.insightCard, { backgroundColor: bgColor }]}>
      <View style={styles.insightCardIcon}>
        <IconComponent size={18} color={iconColor} />
      </View>
      <View style={styles.insightCardContent}>
        <Text style={[styles.insightCardTitle, { color: iconColor }]}>{insight.title}</Text>
        <Text style={styles.insightCardNarrative}>{insight.narrative}</Text>
      </View>
    </View>
  );
}

function QuickActionButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.quickAction}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        {icon}
        <Text style={styles.quickActionLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ConflictReplayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const analytics = useAnalytics();
  const { timelines, patternInsights, isLoading } = useConflictReplay();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState<boolean>(true);
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    analytics.trackScreen('conflict_replay');
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = useCallback((id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const navigateTo = useCallback((route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as never);
  }, [router]);

  const hasEvents = timelines.length > 0;
  const hasInsights = patternInsights.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID="conflict-replay-back"
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Conflict Replay</Text>
          <Text style={styles.headerSubtitle}>Review and learn from past moments</Text>
        </View>
        <View style={styles.headerRight}>
          <RotateCcw size={20} color={Colors.textMuted} />
        </View>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your history...</Text>
        </View>
      ) : !hasEvents ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <RotateCcw size={36} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No conflict events yet</Text>
          <Text style={styles.emptyDescription}>
            As you use check-ins, message rewrites, and Relationship Copilot, your emotional
            conflict moments will appear here as a timeline you can learn from.
          </Text>
          <View style={styles.emptyActions}>
            <QuickActionButton
              label="Check in"
              icon={<BookOpen size={18} color={Colors.primary} />}
              onPress={() => navigateTo('/check-in')}
            />
            <QuickActionButton
              label="Copilot"
              icon={<Compass size={18} color={Colors.primary} />}
              onPress={() => navigateTo('/relationship-copilot')}
            />
            <QuickActionButton
              label="Messages"
              icon={<MessageSquare size={18} color={Colors.primary} />}
              onPress={() => navigateTo('/(tabs)/messages')}
            />
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {hasInsights && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowInsights(prev => !prev);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Sparkles size={16} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Pattern Insights</Text>
                </View>
                {showInsights ? (
                  <ChevronUp size={18} color={Colors.textMuted} />
                ) : (
                  <ChevronDown size={18} color={Colors.textMuted} />
                )}
              </TouchableOpacity>

              {showInsights && (
                <View style={styles.insightsList}>
                  {patternInsights.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeaderLeft}>
              <Clock size={16} color={Colors.textSecondary} />
              <Text style={styles.sectionTitle}>
                Timeline · {timelines.length} event{timelines.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.eventsList}>
            {timelines.map(timeline => (
              <EventCard
                key={timeline.event.id}
                timeline={timeline}
                isExpanded={expandedId === timeline.event.id}
                onToggle={() => toggleExpand(timeline.event.id)}
              />
            ))}
          </View>

          <View style={styles.quickActionsSection}>
            <Text style={styles.quickActionsSectionTitle}>Learn from this</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionButton
                label="Pause practice"
                icon={<Timer size={18} color={Colors.primary} />}
                onPress={() => navigateTo('/exercise?id=c1')}
              />
              <QuickActionButton
                label="Grounding"
                icon={<Wind size={18} color={Colors.primary} />}
                onPress={() => navigateTo('/exercise?id=c2')}
              />
              <QuickActionButton
                label="Copilot"
                icon={<Compass size={18} color={Colors.primary} />}
                onPress={() => navigateTo('/relationship-copilot')}
              />
              <QuickActionButton
                label="Secure rewrite"
                icon={<MessageSquare size={18} color={Colors.primary} />}
                onPress={() => navigateTo('/(tabs)/messages')}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
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
    marginTop: 1,
  },
  headerRight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  insightsList: {
    marginTop: 10,
    gap: 10,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  insightCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightCardContent: {
    flex: 1,
  },
  insightCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 3,
  },
  insightCardNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  eventsList: {
    gap: 10,
    marginBottom: 20,
  },
  eventCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
    }),
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  eventCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  outcomeBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeBadgeEmoji: {
    fontSize: 20,
  },
  eventCardInfo: {
    flex: 1,
  },
  eventTriggerLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  eventTagsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  eventTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  eventTagText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  eventCardExpanded: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 12,
  },
  timelineContainer: {
    marginBottom: 16,
  },
  timelineStepRow: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineTrack: {
    width: 40,
    alignItems: 'center',
  },
  timelineDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotEmoji: {
    fontSize: 14,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  timelineStepContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 14,
  },
  stepTypeLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  stepDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  intensityBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  intensityBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  intensityText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    width: 32,
    textAlign: 'right',
  },
  aiInsightBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiInsightTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiInsightText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  suggestionsBox: {
    backgroundColor: Colors.accentLight,
    borderRadius: 12,
    padding: 12,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  suggestionBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 6,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
    flex: 1,
  },
  quickActionsSection: {
    marginBottom: 16,
  },
  quickActionsSectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
