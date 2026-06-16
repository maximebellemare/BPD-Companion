import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Heart,
  AlertTriangle,
  Shield,
  Layers,
  Lightbulb,
  ChevronRight,
  Wind,
  Anchor,
  BookOpen,
  RefreshCw,
  Search,
  MessageCircle,
  Timer,
  Eye,
  Users,
  Sparkles,
  MessageSquareText,
  BarChart3,
  Activity,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { InsightCard, PatternItem } from '@/types/memory';
import { SupportiveInterpretation } from '@/types/ai';
import { useRecommendations } from '@/hooks/useRecommendations';
import { CopingRecommendation } from '@/types/recommendation';

const ICON_MAP: Record<string, React.ReactNode> = {
  trigger: <Zap size={18} color={Colors.accent} />,
  emotion: <Heart size={18} color="#3B82F6" />,
  urge: <AlertTriangle size={18} color="#0B1238" />,
  coping: <Shield size={18} color={Colors.primary} />,
  pattern: <Layers size={18} color="#3B82F6" />,
  message: <MessageSquareText size={18} color={Colors.primary} />,
  progress: <Activity size={18} color={Colors.success} />,
};

const BG_MAP: Record<string, string> = {
  trigger: Colors.accentLight,
  emotion: '#FFFFFF',
  urge: '#FFFFFF',
  coping: Colors.primaryLight,
  pattern: '#0B1238',
  message: Colors.primaryLight,
  progress: Colors.successLight,
};

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp size={14} color={Colors.danger} />;
  if (trend === 'down') return <TrendingDown size={14} color={Colors.success} />;
  return <Minus size={14} color={Colors.textMuted} />;
}

function AnimatedBarRow({ item, maxCount, index, color }: { item: PatternItem; maxCount: number; index: number; color: string }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: maxCount > 0 ? (item.count / maxCount) * 100 : 0,
      duration: 500,
      delay: index * 50,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, item.count, maxCount, index]);

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.barPercent}>{item.percentage}%</Text>
    </View>
  );
}

function InsightCardView({ card, index }: { card: InsightCard; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View
      style={[
        styles.insightCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.insightCardHeader}>
        <View style={[styles.insightIconWrap, { backgroundColor: BG_MAP[card.type] || Colors.primaryLight }]}>
          {ICON_MAP[card.type] || ICON_MAP.pattern}
        </View>
        <Text style={styles.insightCardTitle}>{card.title}</Text>
        {card.trend && <TrendIcon trend={card.trend} />}
      </View>
      <Text style={styles.insightCardDesc}>{card.description}</Text>
    </Animated.View>
  );
}

const REC_ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Wind, Anchor, BookOpen, Heart, RefreshCw, Search, MessageCircle, Timer,
};

const REC_PRIORITY_COLORS: Record<string, { bg: string; accent: string }> = {
  high: { bg: '#FFFFFF', accent: Colors.danger },
  medium: { bg: Colors.warmGlow, accent: Colors.accent },
  low: { bg: Colors.primaryLight, accent: Colors.primary },
};

function RecRow({ rec }: { rec: CopingRecommendation }) {
  const router = useRouter();
  const IconComp = REC_ICON_MAP[rec.icon] ?? Wind;
  const colors = REC_PRIORITY_COLORS[rec.priority] ?? REC_PRIORITY_COLORS.low;

  return (
    <TouchableOpacity
      style={recStyles.row}
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(rec.route as never);
      }}
      activeOpacity={0.7}
    >
      <View style={[recStyles.iconWrap, { backgroundColor: colors.bg }]}>
        <IconComp size={16} color={colors.accent} />
      </View>
      <View style={recStyles.content}>
        <Text style={recStyles.title}>{rec.title}</Text>
        <Text style={recStyles.msg} numberOfLines={1}>{rec.message}</Text>
      </View>
      <ChevronRight size={14} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function InterpretationRow({ item, index }: { item: SupportiveInterpretation; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const accentColor = item.sentiment === 'encouraging'
    ? Colors.success
    : item.sentiment === 'observational'
      ? Colors.accent
      : Colors.primary;

  const bgColor = item.sentiment === 'encouraging'
    ? Colors.successLight
    : item.sentiment === 'observational'
      ? Colors.accentLight
      : Colors.primaryLight;

  return (
    <Animated.View style={[interpStyles.card, { opacity: fadeAnim }]}>
      <View style={[interpStyles.accent, { backgroundColor: accentColor }]} />
      <View style={[interpStyles.categoryBadge, { backgroundColor: bgColor }]}>
        <Text style={[interpStyles.categoryText, { color: accentColor }]}>
          {item.category}
        </Text>
      </View>
      <Text style={interpStyles.text}>{item.text}</Text>
    </Animated.View>
  );
}

export default function InsightsScreen() {
  const { insightCards, memoryProfile, supportiveInterpretations } = useAICompanion();
  const { recommendations, hasData: hasRecData } = useRecommendations();
  const router = useRouter();

  const hasData = memoryProfile.recentCheckInCount > 0;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const trendIcon = memoryProfile.intensityTrend === 'falling'
    ? <TrendingDown size={16} color={Colors.success} />
    : memoryProfile.intensityTrend === 'rising'
      ? <TrendingUp size={16} color={Colors.danger} />
      : <Minus size={16} color={Colors.textMuted} />;

  const trendLabel = memoryProfile.intensityTrend === 'falling'
    ? 'Improving'
    : memoryProfile.intensityTrend === 'rising'
      ? 'Elevated'
      : memoryProfile.intensityTrend === 'stable'
        ? 'Stable'
        : '\u2014';

  const trendColor = memoryProfile.intensityTrend === 'falling'
    ? Colors.success
    : memoryProfile.intensityTrend === 'rising'
      ? Colors.danger
      : Colors.textMuted;

  const maxTriggerCount = memoryProfile.topTriggers.reduce((max, t) => Math.max(max, t.count), 0);
  const maxEmotionCount = memoryProfile.topEmotions.reduce((max, t) => Math.max(max, t.count), 0);
  const maxUrgeCount = memoryProfile.topUrges.reduce((max, t) => Math.max(max, t.count), 0);
  const maxCopingCount = memoryProfile.copingToolsUsed.reduce((max, t) => Math.max(max, t.count), 0);

  const handleCheckIn = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/check-in');
  }, [router]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Your Insights' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hasData ? (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {memoryProfile.supportiveSummary ? (
              <View style={styles.overviewCard}>
                <View style={styles.overviewHeader}>
                  <View style={styles.overviewIconWrap}>
                    <Sparkles size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.overviewTitle}>Overview</Text>
                </View>
                <Text style={styles.overviewText}>{memoryProfile.supportiveSummary}</Text>
                {memoryProfile.distressTrendDescription ? (
                  <View style={styles.overviewTrendRow}>
                    {trendIcon}
                    <Text style={[styles.overviewTrendText, { color: trendColor }]}>
                      {trendLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{memoryProfile.recentCheckInCount}</Text>
                <Text style={styles.statLabel}>Check-ins</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {memoryProfile.averageIntensity > 0 ? memoryProfile.averageIntensity : '\u2014'}
                </Text>
                <Text style={styles.statLabel}>Avg Intensity</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: trendColor }]}>
                  {memoryProfile.copingSuccessRate > 0 ? `${memoryProfile.copingSuccessRate}%` : '\u2014'}
                </Text>
                <Text style={styles.statLabel}>Managed</Text>
              </View>
            </View>

            {memoryProfile.topTriggers.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: Colors.accentLight }]}>
                    <Zap size={16} color={Colors.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Top Triggers</Text>
                </View>
                <Text style={styles.sectionHint}>
                  Patterns in what activates your emotions
                </Text>
                {memoryProfile.topTriggers.slice(0, 5).map((item, i) => (
                  <AnimatedBarRow
                    key={item.label}
                    item={item}
                    maxCount={maxTriggerCount}
                    index={i}
                    color={Colors.accent}
                  />
                ))}
              </View>
            )}

            {memoryProfile.topEmotions.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#FFFFFF' }]}>
                    <Heart size={16} color="#3B82F6" />
                  </View>
                  <Text style={styles.sectionTitle}>Recurring Emotions</Text>
                </View>
                <Text style={styles.sectionHint}>
                  The feelings that show up most in your check-ins
                </Text>
                {memoryProfile.topEmotions.slice(0, 5).map((item, i) => (
                  <AnimatedBarRow
                    key={item.label}
                    item={item}
                    maxCount={maxEmotionCount}
                    index={i}
                    color="#3B82F6"
                  />
                ))}
              </View>
            )}

            {memoryProfile.topUrges.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#FFFFFF' }]}>
                    <AlertTriangle size={16} color="#67E8F9" />
                  </View>
                  <Text style={styles.sectionTitle}>Urge Patterns</Text>
                </View>
                <Text style={styles.sectionHint}>
                  What your body and mind reach for when distressed
                </Text>
                {memoryProfile.topUrges.slice(0, 5).map((item, i) => (
                  <AnimatedBarRow
                    key={item.label}
                    item={item}
                    maxCount={maxUrgeCount}
                    index={i}
                    color="#67E8F9"
                  />
                ))}
              </View>
            )}

            {memoryProfile.copingToolsUsed.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: Colors.successLight }]}>
                    <Shield size={16} color={Colors.success} />
                  </View>
                  <Text style={styles.sectionTitle}>Coping Tools Used</Text>
                </View>
                <Text style={styles.sectionHint}>
                  The strategies you lean on most
                </Text>
                {memoryProfile.copingToolsUsed.slice(0, 5).map((item, i) => (
                  <AnimatedBarRow
                    key={item.label}
                    item={item}
                    maxCount={maxCopingCount}
                    index={i}
                    color={Colors.success}
                  />
                ))}
              </View>
            )}

            {memoryProfile.relationshipPatterns.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: Colors.accentLight }]}>
                    <Users size={16} color={Colors.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Relationship Patterns</Text>
                </View>
                {memoryProfile.relationshipPatternSummary ? (
                  <Text style={styles.sectionHint}>
                    {memoryProfile.relationshipPatternSummary}
                  </Text>
                ) : null}
                {memoryProfile.relationshipPatterns.slice(0, 3).map((rp) => (
                  <View key={rp.id} style={styles.relationshipCard}>
                    <Text style={styles.relationshipText}>{rp.pattern}</Text>
                    <Text style={styles.relationshipMeta}>
                      Observed {rp.frequency} times
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {(memoryProfile.messageUsage.totalRewrites > 0 || memoryProfile.messageUsage.totalPauses > 0) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: Colors.primaryLight }]}>
                    <MessageSquareText size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Message Awareness</Text>
                </View>
                <View style={styles.messageStatsRow}>
                  {memoryProfile.messageUsage.totalRewrites > 0 && (
                    <View style={styles.messageStatCard}>
                      <Text style={styles.messageStatValue}>{memoryProfile.messageUsage.totalRewrites}</Text>
                      <Text style={styles.messageStatLabel}>Rewrites</Text>
                    </View>
                  )}
                  {memoryProfile.messageUsage.totalPauses > 0 && (
                    <View style={styles.messageStatCard}>
                      <Text style={styles.messageStatValue}>{memoryProfile.messageUsage.totalPauses}</Text>
                      <Text style={styles.messageStatLabel}>Pauses</Text>
                    </View>
                  )}
                  {memoryProfile.messageUsage.pauseSuccessRate > 0 && (
                    <View style={styles.messageStatCard}>
                      <Text style={[styles.messageStatValue, { color: Colors.success }]}>
                        {memoryProfile.messageUsage.pauseSuccessRate}%
                      </Text>
                      <Text style={styles.messageStatLabel}>Held back</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.messageHint}>
                  Taking time before reacting shows real emotional awareness.
                </Text>
              </View>
            )}

            {supportiveInterpretations.length > 0 && (
              <View style={interpStyles.section}>
                <View style={interpStyles.headerRow}>
                  <Eye size={16} color={Colors.primary} />
                  <Text style={interpStyles.headerTitle}>What We Notice</Text>
                </View>
                <Text style={interpStyles.headerHint}>
                  Gentle observations based on your patterns
                </Text>
                {supportiveInterpretations.map((interp, i) => (
                  <InterpretationRow key={interp.id} item={interp} index={i} />
                ))}
              </View>
            )}

            {insightCards.length > 0 && (
              <View style={styles.cardsSection}>
                <View style={styles.cardsSectionHeader}>
                  <BarChart3 size={16} color={Colors.primary} />
                  <Text style={styles.cardsSectionTitle}>Pattern Summary</Text>
                </View>
                {insightCards.map((card, i) => (
                  <InsightCardView key={card.id} card={card} index={i} />
                ))}
              </View>
            )}

            {hasRecData && recommendations.length > 0 && (
              <View style={recStyles.section}>
                <View style={recStyles.headerRow}>
                  <Lightbulb size={16} color={Colors.accent} />
                  <Text style={recStyles.headerTitle}>Suggested Coping Tools</Text>
                </View>
                <Text style={recStyles.headerHint}>
                  Based on your recent emotions and triggers
                </Text>
                <View style={recStyles.list}>
                  {recommendations.slice(0, 3).map(rec => (
                    <RecRow key={rec.id} rec={rec} />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.footerMessage}>
              <Text style={styles.footerText}>
                Every check-in builds a clearer picture.{'\n'}You're doing something meaningful.
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={styles.emptyIconWrap}>
              <Sparkles size={40} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Your insights will grow here</Text>
            <Text style={styles.emptySubtitle}>
              As you use the app more, this space will help you notice patterns with more clarity. Check-ins, journaling, and coping exercises all contribute.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleCheckIn}
              activeOpacity={0.8}
              testID="insights-start-checkin"
            >
              <Text style={styles.emptyButtonText}>Start a Check-in</Text>
            </TouchableOpacity>
          </Animated.View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  overviewCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  overviewHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  overviewIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  overviewText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  overviewTrendRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 149, 106, 0.15)',
  },
  overviewTrendText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    marginBottom: 14,
    marginLeft: 42,
  },
  barRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
    gap: 10,
  },
  barLabel: {
    width: 100,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface,
    overflow: 'hidden' as const,
  },
  barFill: {
    height: '100%' as const,
    borderRadius: 4,
  },
  barPercent: {
    width: 36,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textAlign: 'right' as const,
  },

  relationshipCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  relationshipText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  relationshipMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 6,
  },
  messageStatsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 12,
  },
  messageStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  messageStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 2,
  },
  messageStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  messageHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    lineHeight: 19,
  },
  cardsSection: {
    marginBottom: 20,
  },
  cardsSectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  cardsSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  insightCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 10,
  },
  insightCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 10,
  },
  insightIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  insightCardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  insightCardDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  footerMessage: {
    marginTop: 10,
    paddingVertical: 20,
    alignItems: 'center' as const,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 22,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 23,
    marginBottom: 28,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  bottomSpacer: {
    height: 30,
  },
});

const recStyles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  msg: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

const interpStyles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    paddingLeft: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  accent: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  text: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic' as const,
  },
});
