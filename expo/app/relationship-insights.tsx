import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Lightbulb,
  ChevronRight,
  Users,
  MessageSquare,
  Zap,
  Shield,
  Activity,
  Pause,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRelationshipInsights } from '@/hooks/useRelationshipInsights';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { REWRITE_STYLE_META } from '@/services/messages/messageRewriteService';
import {
  RELATIONSHIP_OPTIONS,
  EMOTIONAL_STATE_OPTIONS,
  INTENT_OPTIONS,
} from '@/types/messages';
import {
  RelationshipPattern,
  RelationshipInsight,
  RelationshipSuggestion,
} from '@/types/relationships';

const SEVERITY_COLORS = {
  info: Colors.primary,
  gentle: Colors.accent,
  important: '#3B82F6',
} as const;

const TREND_CONFIG = {
  rising: { label: 'Rising', icon: TrendingUp, color: '#3B82F6' },
  stable: { label: 'Stable', icon: Minus, color: Colors.primary },
  falling: { label: 'Improving', icon: TrendingDown, color: Colors.success },
  insufficient_data: { label: 'Not enough data', icon: AlertCircle, color: Colors.textMuted },
} as const;

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 12,
        tension: 60,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
}

function RelationshipCard({ pattern, index }: { pattern: RelationshipPattern; index: number }) {
  const relOption = RELATIONSHIP_OPTIONS.find((r: { value: string; label: string; emoji: string }) => r.value === pattern.relationship);
  const topEmotion = pattern.emotionalTriggers[0];
  const topIntent = pattern.commonIntents[0];
  const topStyle = pattern.rewriteStyles[0];
  const emotionOption = topEmotion ? EMOTIONAL_STATE_OPTIONS.find((e: { value: string; label: string; emoji: string }) => e.value === topEmotion.emotion) : null;
  const intentOption = topIntent ? INTENT_OPTIONS.find((i: { value: string; label: string; emoji: string }) => i.value === topIntent.intent) : null;
  const styleMeta = topStyle ? (REWRITE_STYLE_META as Record<string, { label: string; emoji: string; color: string; description: string }>)[topStyle.style] : null;

  return (
    <AnimatedSection delay={index * 100}>
      <View style={styles.relationshipCard}>
        <View style={styles.relCardHeader}>
          <View style={styles.relCardIdentity}>
            <Text style={styles.relCardEmoji}>{relOption?.emoji ?? '👤'}</Text>
            <View>
              <Text style={styles.relCardName}>{relOption?.label ?? 'Unknown'}</Text>
              <Text style={styles.relCardCount}>
                {pattern.totalInteractions} message{pattern.totalInteractions !== 1 ? 's' : ''} analyzed
              </Text>
            </View>
          </View>
          {pattern.conflictRate > 0 && (
            <View style={[
              styles.conflictBadge,
              { backgroundColor: pattern.conflictRate > 40 ? '#3B82F618' : Colors.primaryLight },
            ]}>
              <Zap size={11} color={pattern.conflictRate > 40 ? '#3B82F6' : Colors.primary} />
              <Text style={[
                styles.conflictBadgeText,
                { color: pattern.conflictRate > 40 ? '#3B82F6' : Colors.primary },
              ]}>
                {pattern.conflictRate}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.relCardStats}>
          {emotionOption && (
            <View style={styles.relStatItem}>
              <Text style={styles.relStatEmoji}>{emotionOption.emoji}</Text>
              <View style={styles.relStatContent}>
                <Text style={styles.relStatLabel}>Top emotion</Text>
                <Text style={styles.relStatValue}>{emotionOption.label}</Text>
                <View style={styles.relStatBar}>
                  <View style={[styles.relStatBarFill, { width: `${topEmotion.percentage}%`, backgroundColor: Colors.accent }]} />
                </View>
              </View>
              <Text style={styles.relStatPercent}>{topEmotion.percentage}%</Text>
            </View>
          )}

          {intentOption && (
            <View style={styles.relStatItem}>
              <Text style={styles.relStatEmoji}>{intentOption.emoji}</Text>
              <View style={styles.relStatContent}>
                <Text style={styles.relStatLabel}>Common intent</Text>
                <Text style={styles.relStatValue}>{intentOption.label}</Text>
                <View style={styles.relStatBar}>
                  <View style={[styles.relStatBarFill, { width: `${topIntent.percentage}%`, backgroundColor: Colors.primary }]} />
                </View>
              </View>
              <Text style={styles.relStatPercent}>{topIntent.percentage}%</Text>
            </View>
          )}

          {styleMeta && (
            <View style={styles.relStatItem}>
              <Text style={styles.relStatEmoji}>{styleMeta.emoji}</Text>
              <View style={styles.relStatContent}>
                <Text style={styles.relStatLabel}>Preferred style</Text>
                <Text style={styles.relStatValue}>{styleMeta.label}</Text>
                <View style={styles.relStatBar}>
                  <View style={[styles.relStatBarFill, { width: `${topStyle.percentage}%`, backgroundColor: styleMeta.color }]} />
                </View>
              </View>
              <Text style={styles.relStatPercent}>{topStyle.percentage}%</Text>
            </View>
          )}
        </View>

        {pattern.outcomes.length > 0 && (
          <View style={styles.outcomesRow}>
            {pattern.outcomes.slice(0, 3).map(o => (
              <View key={o.outcome} style={styles.outcomeChip}>
                <Text style={styles.outcomeChipText}>
                  {o.outcome === 'sent' ? '📤' : o.outcome === 'helped' ? '💚' : o.outcome === 'not_sent' ? '🚫' : '💔'}{' '}
                  {o.percentage}%
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </AnimatedSection>
  );
}

function InsightCard({ insight, index }: { insight: RelationshipInsight; index: number }) {
  const borderColor = SEVERITY_COLORS[insight.severity];

  return (
    <AnimatedSection delay={150 + index * 80}>
      <View style={[styles.insightCard, { borderLeftColor: borderColor }]}>
        <Text style={styles.insightEmoji}>{insight.emoji}</Text>
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightDescription}>{insight.description}</Text>
        </View>
      </View>
    </AnimatedSection>
  );
}

function SuggestionCard({
  suggestion,
  index,
  onPress,
}: {
  suggestion: RelationshipSuggestion;
  index: number;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [scaleAnim, onPress]);

  return (
    <AnimatedSection delay={250 + index * 80}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.suggestionCard}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={styles.suggestionLeft}>
            <View style={styles.suggestionIconWrap}>
              <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
            </View>
            <View style={styles.suggestionTextContent}>
              <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
              <Text style={styles.suggestionDesc}>{suggestion.description}</Text>
            </View>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </Animated.View>
    </AnimatedSection>
  );
}

function TriggerChip({ label, emoji, percentage }: { label: string; emoji: string; percentage: number }) {
  return (
    <View style={styles.triggerChip}>
      <Text style={styles.triggerChipEmoji}>{emoji}</Text>
      <View style={styles.triggerChipContent}>
        <Text style={styles.triggerChipLabel}>{label}</Text>
        <View style={styles.triggerChipBarBg}>
          <View style={[styles.triggerChipBarFill, { width: `${Math.min(percentage, 100)}%` }]} />
        </View>
      </View>
      <Text style={styles.triggerChipPercent}>{percentage}%</Text>
    </View>
  );
}

export default function RelationshipInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'relationship_insights' });
  }, [trackEvent]);

  const {
    hasData,
    patterns,
    suggestions,
    triggerInsights,
    emotionInsights,
    communicationInsights,
    topTriggerRelationship,
    mostCommonEmotion,
    overallConflictTrend,
    totalMessagesAnalyzed,
  } = useRelationshipInsights();

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [headerFade]);

  const trendConfig = TREND_CONFIG[overallConflictTrend];
  const TrendIcon = trendConfig.icon;

  const handleSuggestionPress = useCallback((suggestion: RelationshipSuggestion) => {
    if (suggestion.actionRoute) {
      router.push(suggestion.actionRoute as never);
    }
  }, [router]);

  const allTriggerEmotions = patterns.flatMap(p =>
    p.emotionalTriggers.map(et => ({
      ...et,
      relationship: p.relationship,
    }))
  );

  const uniqueEmotionMap = new Map<string, { count: number; percentage: number }>();
  for (const et of allTriggerEmotions) {
    const existing = uniqueEmotionMap.get(et.emotion);
    if (existing) {
      uniqueEmotionMap.set(et.emotion, {
        count: existing.count + et.count,
        percentage: Math.max(existing.percentage, et.percentage),
      });
    } else {
      uniqueEmotionMap.set(et.emotion, { count: et.count, percentage: et.percentage });
    }
  }

  const topEmotions = Array.from(uniqueEmotionMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const allIntents = patterns.flatMap(p => p.commonIntents);
  const uniqueIntentMap = new Map<string, { count: number; percentage: number }>();
  for (const ci of allIntents) {
    const existing = uniqueIntentMap.get(ci.intent);
    if (existing) {
      uniqueIntentMap.set(ci.intent, {
        count: existing.count + ci.count,
        percentage: Math.max(existing.percentage, ci.percentage),
      });
    } else {
      uniqueIntentMap.set(ci.intent, { count: ci.count, percentage: ci.percentage });
    }
  }

  const topIntents = Array.from(uniqueIntentMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const pauseCount = patterns.reduce((sum, p) => {
    const delayStyle = p.rewriteStyles.find(s => s.style === 'delay' || s.style === 'nosend');
    return sum + (delayStyle?.count ?? 0);
  }, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.header, { opacity: headerFade }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
          testID="back-btn"
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Relationship Patterns</Text>
          <Text style={styles.headerSubtitle}>Understanding how you connect</Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasData ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Heart size={40} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No patterns yet</Text>
            <Text style={styles.emptyDesc}>
              Use the Message Tool to rewrite messages and track outcomes. Over time, you'll see patterns in how you communicate in different relationships.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <MessageSquare size={16} color={Colors.white} />
              <Text style={styles.emptyButtonText}>Go to Messages</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <AnimatedSection delay={0}>
              <View style={styles.overviewRow}>
                <View style={styles.overviewCard}>
                  <View style={[styles.overviewIconWrap, { backgroundColor: Colors.primaryLight }]}>
                    <Users size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.overviewValue}>{patterns.length}</Text>
                  <Text style={styles.overviewLabel}>Relationships</Text>
                </View>
                <View style={styles.overviewCard}>
                  <View style={[styles.overviewIconWrap, { backgroundColor: Colors.accentLight }]}>
                    <MessageSquare size={18} color={Colors.accent} />
                  </View>
                  <Text style={styles.overviewValue}>{totalMessagesAnalyzed}</Text>
                  <Text style={styles.overviewLabel}>Messages</Text>
                </View>
                <View style={styles.overviewCard}>
                  <View style={[styles.overviewIconWrap, { backgroundColor: trendConfig.color + '18' }]}>
                    <TrendIcon size={18} color={trendConfig.color} />
                  </View>
                  <Text style={[styles.overviewValue, { color: trendConfig.color }]}>{trendConfig.label}</Text>
                  <Text style={styles.overviewLabel}>Conflict trend</Text>
                </View>
              </View>
            </AnimatedSection>

            {topTriggerRelationship && (
              <AnimatedSection delay={100}>
                <View style={styles.highlightCard}>
                  <View style={styles.highlightHeader}>
                    <Lightbulb size={16} color={Colors.accent} />
                    <Text style={styles.highlightLabel}>Key finding</Text>
                  </View>
                  <Text style={styles.highlightText}>
                    Your most emotionally activating relationship appears to be with your{' '}
                    <Text style={styles.highlightBold}>
                      {RELATIONSHIP_OPTIONS.find((r: { value: string; label: string; emoji: string }) => r.value === topTriggerRelationship)?.label?.toLowerCase() ?? 'connection'}
                    </Text>
                    {mostCommonEmotion && (
                      <>
                        , where you seem to most often feel{' '}
                        <Text style={styles.highlightBold}>
                          {EMOTIONAL_STATE_OPTIONS.find((e: { value: string; label: string; emoji: string }) => e.value === mostCommonEmotion)?.label?.toLowerCase() ?? ''}
                        </Text>
                      </>
                    )}
                    . This awareness is powerful.
                  </Text>
                </View>
              </AnimatedSection>
            )}

            {triggerInsights.length > 0 && (
              <AnimatedSection delay={200}>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: '#FFFFFF' }]}>
                      <Zap size={16} color="#3B82F6" />
                    </View>
                    <View>
                      <Text style={styles.sectionTitle}>Relationship Triggers</Text>
                      <Text style={styles.sectionSubtitleInline}>What seems to activate you most</Text>
                    </View>
                  </View>
                  {triggerInsights.map((insight, i) => (
                    <InsightCard key={insight.id} insight={insight} index={i} />
                  ))}
                </View>
              </AnimatedSection>
            )}

            {topEmotions.length > 0 && (
              <AnimatedSection delay={300}>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: '#FFFFFF' }]}>
                      <Activity size={16} color="#3B82F6" />
                    </View>
                    <View>
                      <Text style={styles.sectionTitle}>Emotional Reactions</Text>
                      <Text style={styles.sectionSubtitleInline}>Emotions that appear most in your messages</Text>
                    </View>
                  </View>
                  <View style={styles.emotionGrid}>
                    {topEmotions.map(([emotion, data]) => {
                      const opt = EMOTIONAL_STATE_OPTIONS.find(e => e.value === emotion);
                      return (
                        <TriggerChip
                          key={emotion}
                          label={opt?.label ?? emotion}
                          emoji={opt?.emoji ?? '💭'}
                          percentage={data.percentage}
                        />
                      );
                    })}
                  </View>
                  {emotionInsights.length > 0 && (
                    <View style={styles.insightsSubgroup}>
                      {emotionInsights.map((insight, i) => (
                        <InsightCard key={insight.id} insight={insight} index={i} />
                      ))}
                    </View>
                  )}
                </View>
              </AnimatedSection>
            )}

            {topIntents.length > 0 && (
              <AnimatedSection delay={400}>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: '#FFFFFF' }]}>
                      <MessageSquare size={16} color="#3B82F6" />
                    </View>
                    <View>
                      <Text style={styles.sectionTitle}>Communication Patterns</Text>
                      <Text style={styles.sectionSubtitleInline}>How you tend to approach conversations</Text>
                    </View>
                  </View>
                  <View style={styles.emotionGrid}>
                    {topIntents.map(([intent, data]) => {
                      const opt = INTENT_OPTIONS.find(i => i.value === intent);
                      return (
                        <TriggerChip
                          key={intent}
                          label={opt?.label ?? intent}
                          emoji={opt?.emoji ?? '💬'}
                          percentage={data.percentage}
                        />
                      );
                    })}
                  </View>
                  {pauseCount > 0 && (
                    <View style={styles.pauseCard}>
                      <View style={styles.pauseCardIcon}>
                        <Pause size={16} color={Colors.primary} />
                      </View>
                      <View style={styles.pauseCardContent}>
                        <Text style={styles.pauseCardTitle}>Pause usage</Text>
                        <Text style={styles.pauseCardDesc}>
                          You chose to pause or not send {pauseCount} time{pauseCount !== 1 ? 's' : ''}. That takes real self-awareness.
                        </Text>
                      </View>
                    </View>
                  )}
                  {communicationInsights.length > 0 && (
                    <View style={styles.insightsSubgroup}>
                      {communicationInsights.map((insight, i) => (
                        <InsightCard key={insight.id} insight={insight} index={i} />
                      ))}
                    </View>
                  )}
                </View>
              </AnimatedSection>
            )}

            {patterns.length > 0 && (
              <AnimatedSection delay={500}>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: Colors.primaryLight }]}>
                      <Heart size={16} color={Colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.sectionTitle}>By Relationship</Text>
                      <Text style={styles.sectionSubtitleInline}>Patterns within each connection</Text>
                    </View>
                  </View>
                  {patterns.map((pattern, i) => (
                    <RelationshipCard key={pattern.relationship} pattern={pattern} index={i} />
                  ))}
                </View>
              </AnimatedSection>
            )}

            {suggestions.length > 0 && (
              <AnimatedSection delay={600}>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: Colors.successLight }]}>
                      <Shield size={16} color={Colors.success} />
                    </View>
                    <View>
                      <Text style={styles.sectionTitle}>Suggestions</Text>
                      <Text style={styles.sectionSubtitleInline}>Gentle ideas based on your patterns</Text>
                    </View>
                  </View>
                  {suggestions.map((suggestion, i) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      index={i}
                      onPress={() => handleSuggestionPress(suggestion)}
                    />
                  ))}
                </View>
              </AnimatedSection>
            )}

            <AnimatedSection delay={700}>
              <View style={styles.footerNote}>
                <Text style={styles.footerNoteText}>
                  These patterns are generated from your local data and are never shared. They're here to help you grow, not to judge you.
                </Text>
              </View>
            </AnimatedSection>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  overviewRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 16,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center' as const,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  overviewIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  overviewLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center' as const,
  },
  highlightCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  highlightHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  highlightLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  highlightText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 23,
  },
  highlightBold: {
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionSubtitleInline: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  insightsSubgroup: {
    marginTop: 12,
  },
  emotionGrid: {
    gap: 8,
  },
  triggerChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  triggerChipEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center' as const,
  },
  triggerChipContent: {
    flex: 1,
  },
  triggerChipLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 5,
  },
  triggerChipBarBg: {
    height: 5,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  triggerChipBarFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  triggerChipPercent: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    width: 40,
    textAlign: 'right' as const,
  },
  pauseCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginTop: 10,
  },
  pauseCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pauseCardContent: {
    flex: 1,
  },
  pauseCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
    marginBottom: 3,
  },
  pauseCardDesc: {
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 19,
  },
  relationshipCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  relCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  relCardIdentity: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  relCardEmoji: {
    fontSize: 28,
  },
  relCardName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  relCardCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  conflictBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  conflictBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  relCardStats: {
    gap: 12,
  },
  relStatItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  relStatEmoji: {
    fontSize: 18,
    width: 28,
    textAlign: 'center' as const,
  },
  relStatContent: {
    flex: 1,
  },
  relStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  relStatValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 1,
  },
  relStatBar: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden' as const,
  },
  relStatBarFill: {
    height: 4,
    borderRadius: 2,
  },
  relStatPercent: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    width: 38,
    textAlign: 'right' as const,
  },
  outcomesRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  outcomeChip: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  outcomeChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  insightCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    gap: 12,
    alignItems: 'flex-start' as const,
  },
  insightEmoji: {
    fontSize: 22,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  suggestionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestionLeft: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
  },
  suggestionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  suggestionEmoji: {
    fontSize: 20,
  },
  suggestionTextContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  suggestionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  footerNote: {
    marginTop: 8,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
  },
  footerNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
});
