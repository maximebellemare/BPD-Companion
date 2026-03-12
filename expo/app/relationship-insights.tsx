import React, { useMemo, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { analyzeRelationshipPatterns } from '@/services/relationships/relationshipInsightsService';
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
  important: '#E17055',
} as const;

const TREND_CONFIG = {
  rising: { label: 'Rising', icon: TrendingUp, color: '#E17055' },
  stable: { label: 'Stable', icon: Minus, color: Colors.primary },
  falling: { label: 'Improving', icon: TrendingDown, color: Colors.success },
  insufficient_data: { label: 'Not enough data', icon: AlertCircle, color: Colors.textMuted },
} as const;

function RelationshipCard({ pattern, index }: { pattern: RelationshipPattern; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 120,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 12,
        tension: 60,
        delay: index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const relOption = RELATIONSHIP_OPTIONS.find((r: { value: string; label: string; emoji: string }) => r.value === pattern.relationship);
  const topEmotion = pattern.emotionalTriggers[0];
  const topIntent = pattern.commonIntents[0];
  const topStyle = pattern.rewriteStyles[0];
  const emotionOption = topEmotion ? EMOTIONAL_STATE_OPTIONS.find((e: { value: string; label: string; emoji: string }) => e.value === topEmotion.emotion) : null;
  const intentOption = topIntent ? INTENT_OPTIONS.find((i: { value: string; label: string; emoji: string }) => i.value === topIntent.intent) : null;
  const styleMeta = topStyle ? (REWRITE_STYLE_META as Record<string, { label: string; emoji: string; color: string; description: string }>)[topStyle.style] : null;

  return (
    <Animated.View
      style={[
        styles.relationshipCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
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
            { backgroundColor: pattern.conflictRate > 40 ? '#E1705518' : Colors.primaryLight },
          ]}>
            <Zap size={11} color={pattern.conflictRate > 40 ? '#E17055' : Colors.primary} />
            <Text style={[
              styles.conflictBadgeText,
              { color: pattern.conflictRate > 40 ? '#E17055' : Colors.primary },
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
    </Animated.View>
  );
}

function InsightCard({ insight, index }: { insight: RelationshipInsight; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: 200 + index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const borderColor = SEVERITY_COLORS[insight.severity];

  return (
    <Animated.View style={[styles.insightCard, { opacity: fadeAnim, borderLeftColor: borderColor }]}>
      <Text style={styles.insightEmoji}>{insight.emoji}</Text>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDescription}>{insight.description}</Text>
      </View>
    </Animated.View>
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: 300 + index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [scaleAnim, onPress]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
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
  );
}

export default function RelationshipInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { messageDrafts, journalEntries } = useApp();
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [headerFade]);

  const analysis = useMemo(() => {
    return analyzeRelationshipPatterns(messageDrafts, journalEntries);
  }, [messageDrafts, journalEntries]);

  const trendConfig = TREND_CONFIG[analysis.overallConflictTrend];
  const TrendIcon = trendConfig.icon;

  const handleSuggestionPress = useCallback((suggestion: RelationshipSuggestion) => {
    if (suggestion.actionRoute) {
      router.push(suggestion.actionRoute as never);
    }
  }, [router]);

  const hasData = analysis.totalMessagesAnalyzed > 0;

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
            <View style={styles.overviewRow}>
              <View style={styles.overviewCard}>
                <View style={[styles.overviewIconWrap, { backgroundColor: Colors.primaryLight }]}>
                  <Users size={18} color={Colors.primary} />
                </View>
                <Text style={styles.overviewValue}>{analysis.patterns.length}</Text>
                <Text style={styles.overviewLabel}>Relationships</Text>
              </View>
              <View style={styles.overviewCard}>
                <View style={[styles.overviewIconWrap, { backgroundColor: Colors.accentLight }]}>
                  <MessageSquare size={18} color={Colors.accent} />
                </View>
                <Text style={styles.overviewValue}>{analysis.totalMessagesAnalyzed}</Text>
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

            {analysis.topTriggerRelationship && (
              <View style={styles.highlightCard}>
                <View style={styles.highlightHeader}>
                  <Lightbulb size={16} color={Colors.accent} />
                  <Text style={styles.highlightLabel}>Key finding</Text>
                </View>
                <Text style={styles.highlightText}>
                  Your most emotionally activating relationship is with your{' '}
                  <Text style={styles.highlightBold}>
                    {RELATIONSHIP_OPTIONS.find((r: { value: string; label: string; emoji: string }) => r.value === analysis.topTriggerRelationship)?.label?.toLowerCase() ?? 'connection'}
                  </Text>
                  {analysis.mostCommonEmotion && (
                    <>
                      , where you most often feel{' '}
                      <Text style={styles.highlightBold}>
                        {EMOTIONAL_STATE_OPTIONS.find((e: { value: string; label: string; emoji: string }) => e.value === analysis.mostCommonEmotion)?.label?.toLowerCase() ?? ''}
                      </Text>
                    </>
                  )}
                  . This awareness is powerful.
                </Text>
              </View>
            )}

            {analysis.patterns.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Heart size={16} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>By relationship</Text>
                </View>
                {analysis.patterns.map((pattern, i) => (
                  <RelationshipCard key={pattern.relationship} pattern={pattern} index={i} />
                ))}
              </View>
            )}

            {analysis.insights.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Lightbulb size={16} color={Colors.accent} />
                  <Text style={styles.sectionTitle}>Pattern insights</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  These are based on your message history and check-ins.
                </Text>
                {analysis.insights.map((insight, i) => (
                  <InsightCard key={insight.id} insight={insight} index={i} />
                ))}
              </View>
            )}

            {analysis.suggestions.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Shield size={16} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Suggestions</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Gentle ideas based on your patterns.
                </Text>
                {analysis.suggestions.map((suggestion, i) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={i}
                    onPress={() => handleSuggestionPress(suggestion)}
                  />
                ))}
              </View>
            )}

            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>
                These patterns are generated from your local data and are never shared. They're here to help you grow, not to judge you.
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
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
    marginTop: 2,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  relCardIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  relStatEmoji: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
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
    overflow: 'hidden',
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
    textAlign: 'right',
  },
  outcomesRow: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    gap: 12,
    alignItems: 'flex-start',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  suggestionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
