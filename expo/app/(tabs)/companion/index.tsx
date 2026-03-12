import React, { useCallback, useRef, useEffect } from 'react';
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
import { Stack } from 'expo-router';
import { MessageCircle, Sparkles, BookmarkCheck, BarChart3, ChevronRight, Plus, Zap, Brain, TrendingDown, TrendingUp, Minus, Eye } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion, SUGGESTED_PROMPTS } from '@/providers/AICompanionProvider';

export default function CompanionScreen() {
  const router = useRouter();
  const {
    recentConversations,
    memoryProfile,
    supportiveInterpretations,
    startNewConversation,
    continueLastConversation,
    setActiveConversationId,
    sendMessage,
  } = useAICompanion();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleNewConversation = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    startNewConversation();
    router.push('/companion/chat' as never);
  }, [startNewConversation, router]);

  const handleContinue = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    continueLastConversation();
    router.push('/companion/chat' as never);
  }, [continueLastConversation, router]);

  const handlePrompt = useCallback(async (prompt: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const id = startNewConversation();
    setActiveConversationId(id);
    router.push('/companion/chat' as never);
    setTimeout(() => {
      void sendMessage(prompt);
    }, 300);
  }, [startNewConversation, setActiveConversationId, router, sendMessage]);

  const handleRecentConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
    router.push('/companion/chat' as never);
  }, [setActiveConversationId, router]);

  const formatTime = useCallback((timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }, []);

  const lastConvo = recentConversations.length > 0 ? recentConversations[0] : null;
  const hasInsightsData = memoryProfile.recentCheckInCount > 0;

  const trendIcon = memoryProfile.intensityTrend === 'falling'
    ? <TrendingDown size={14} color={Colors.success} />
    : memoryProfile.intensityTrend === 'rising'
      ? <TrendingUp size={14} color={Colors.danger} />
      : <Minus size={14} color={Colors.textMuted} />;

  const trendLabel = memoryProfile.intensityTrend === 'falling'
    ? 'Decreasing'
    : memoryProfile.intensityTrend === 'rising'
      ? 'Increasing'
      : memoryProfile.intensityTrend === 'stable'
        ? 'Stable'
        : '—';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerIconRow}>
            <View style={styles.headerIcon}>
              <Sparkles size={22} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.headerTitle}>AI Companion</Text>
          <Text style={styles.headerSubtitle}>
            A calm space to reflect, slow down, and get support.
          </Text>
        </Animated.View>

        {lastConvo && lastConvo.messages.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              style={styles.continueCard}
              onPress={handleContinue}
              activeOpacity={0.7}
              testID="continue-conversation-card"
            >
              <View style={styles.continueCardHeader}>
                <View style={styles.continueCardIconWrap}>
                  <MessageCircle size={16} color={Colors.primary} />
                </View>
                <Text style={styles.continueCardLabel}>Continue Conversation</Text>
                <Text style={styles.continueCardTime}>{formatTime(lastConvo.updatedAt)}</Text>
              </View>
              <Text style={styles.continueCardTitle} numberOfLines={1}>{lastConvo.title}</Text>
              <Text style={styles.continueCardPreview} numberOfLines={2}>
                {lastConvo.preview || 'Empty conversation'}
              </Text>
              {lastConvo.tags && lastConvo.tags.length > 0 && (
                <View style={styles.tagRow}>
                  {lastConvo.tags.slice(0, 3).map((tag) => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View style={[styles.actionRow, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.actionButtonPrimary}
            onPress={handleNewConversation}
            activeOpacity={0.8}
            testID="new-conversation-btn"
          >
            <Plus size={18} color={Colors.white} />
            <Text style={styles.actionButtonPrimaryText}>New Chat</Text>
          </TouchableOpacity>
          {recentConversations.length > 0 && (
            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={handleContinue}
              activeOpacity={0.8}
              testID="continue-conversation-btn"
            >
              <MessageCircle size={18} color={Colors.primary} />
              <Text style={styles.actionButtonSecondaryText}>Continue</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>What's on your mind?</Text>
          <View style={styles.promptsGrid}>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt.id}
                style={styles.promptCard}
                onPress={() => handlePrompt(prompt.prompt)}
                activeOpacity={0.7}
                testID={`prompt-${prompt.id}`}
              >
                <Text style={styles.promptIcon}>{prompt.icon}</Text>
                <Text style={styles.promptLabel}>{prompt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {hasInsightsData && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Quick Insights</Text>
              <TouchableOpacity
                onPress={() => router.push('/companion/insights' as never)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.insightsGrid}>
              <View style={styles.insightMiniCard}>
                <Text style={styles.insightMiniEmoji}>⚡</Text>
                <Text style={styles.insightMiniLabel}>Top Trigger</Text>
                <Text style={styles.insightMiniValue} numberOfLines={1}>
                  {memoryProfile.topTriggers[0]?.label ?? '—'}
                </Text>
              </View>
              <View style={styles.insightMiniCard}>
                <Text style={styles.insightMiniEmoji}>💜</Text>
                <Text style={styles.insightMiniLabel}>Top Emotion</Text>
                <Text style={styles.insightMiniValue} numberOfLines={1}>
                  {memoryProfile.topEmotions[0]?.label ?? '—'}
                </Text>
              </View>
              <View style={styles.insightMiniCard}>
                <Text style={styles.insightMiniEmoji}>🌊</Text>
                <Text style={styles.insightMiniLabel}>Top Urge</Text>
                <Text style={styles.insightMiniValue} numberOfLines={1}>
                  {memoryProfile.topUrges[0]?.label ?? '—'}
                </Text>
              </View>
              <View style={styles.insightMiniCard}>
                <View style={styles.insightMiniTrendRow}>
                  {trendIcon}
                </View>
                <Text style={styles.insightMiniLabel}>Distress Trend</Text>
                <Text style={styles.insightMiniValue}>{trendLabel}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {supportiveInterpretations.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>What I notice</Text>
              <Eye size={16} color={Colors.textMuted} />
            </View>
            {supportiveInterpretations.slice(0, 2).map((interp) => (
              <View key={interp.id} style={styles.interpretationCard}>
                <View style={[
                  styles.interpretationAccent,
                  interp.sentiment === 'encouraging' && styles.interpretationAccentEncouraging,
                  interp.sentiment === 'observational' && styles.interpretationAccentObservational,
                ]} />
                <Text style={styles.interpretationText}>{interp.text}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore</Text>
          </View>
          <TouchableOpacity
            style={styles.exploreCard}
            onPress={() => router.push('/companion/insights' as never)}
            activeOpacity={0.7}
            testID="insights-btn"
          >
            <View style={styles.exploreCardIcon}>
              <BarChart3 size={20} color={Colors.primary} />
            </View>
            <View style={styles.exploreCardContent}>
              <Text style={styles.exploreCardTitle}>Your Insights</Text>
              <Text style={styles.exploreCardDesc}>Patterns, triggers & emotional trends</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exploreCard}
            onPress={() => router.push('/companion/simulator' as never)}
            activeOpacity={0.7}
            testID="simulator-btn"
          >
            <View style={[styles.exploreCardIcon, { backgroundColor: Colors.accentLight }]}>
              <Zap size={20} color={Colors.accent} />
            </View>
            <View style={styles.exploreCardContent}>
              <Text style={styles.exploreCardTitle}>Emotional Simulator</Text>
              <Text style={styles.exploreCardDesc}>Explore responses before you react</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exploreCard}
            onPress={() => router.push('/companion/memory' as never)}
            activeOpacity={0.7}
            testID="memory-btn"
          >
            <View style={[styles.exploreCardIcon, { backgroundColor: '#EDE7F6' }]}>
              <Brain size={20} color="#7E57C2" />
            </View>
            <View style={styles.exploreCardContent}>
              <Text style={styles.exploreCardTitle}>Emotional Memory</Text>
              <Text style={styles.exploreCardDesc}>Patterns, triggers & personalized insights</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exploreCard}
            onPress={() => router.push('/companion/saved' as never)}
            activeOpacity={0.7}
            testID="saved-btn"
          >
            <View style={[styles.exploreCardIcon, { backgroundColor: Colors.accentLight }]}>
              <BookmarkCheck size={20} color={Colors.accent} />
            </View>
            <View style={styles.exploreCardContent}>
              <Text style={styles.exploreCardTitle}>Saved Conversations</Text>
              <Text style={styles.exploreCardDesc}>Revisit past moments of support</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {recentConversations.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <TouchableOpacity
                onPress={() => router.push('/companion/saved' as never)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentConversations.slice(0, 3).map((convo) => (
              <TouchableOpacity
                key={convo.id}
                style={styles.recentCard}
                onPress={() => handleRecentConversation(convo.id)}
                activeOpacity={0.7}
              >
                <View style={styles.recentCardLeft}>
                  <Text style={styles.recentCardTitle} numberOfLines={1}>
                    {convo.title}
                  </Text>
                  <Text style={styles.recentCardPreview} numberOfLines={1}>
                    {convo.preview || 'Empty conversation'}
                  </Text>
                  {convo.tags && convo.tags.length > 0 && (
                    <View style={styles.recentTagRow}>
                      {convo.tags.slice(0, 2).map((tag) => (
                        <View key={tag} style={styles.recentTagChip}>
                          <Text style={styles.recentTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <Text style={styles.recentCardTime}>
                  {formatTime(convo.updatedAt)}
                </Text>
              </TouchableOpacity>
            ))}
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
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 28,
    paddingTop: 12,
  },
  headerIconRow: {
    marginBottom: 14,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  continueCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  continueCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  continueCardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 8,
  },
  continueCardLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  continueCardTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  continueCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  continueCardPreview: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 10,
  },
  tagChip: {
    backgroundColor: 'rgba(212, 149, 106, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.accent,
  },
  actionRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 32,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  promptsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  promptCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  promptIcon: {
    fontSize: 16,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  insightsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  insightMiniCard: {
    width: '47%' as const,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  insightMiniEmoji: {
    fontSize: 18,
    marginBottom: 6,
  },
  insightMiniTrendRow: {
    marginBottom: 6,
  },
  insightMiniLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  insightMiniValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  interpretationCard: {
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
  interpretationAccent: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  interpretationAccentEncouraging: {
    backgroundColor: Colors.success,
  },
  interpretationAccentObservational: {
    backgroundColor: Colors.accent,
  },
  interpretationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic' as const,
  },
  exploreCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 10,
  },
  exploreCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  exploreCardContent: {
    flex: 1,
  },
  exploreCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  exploreCardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  recentCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  recentCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  recentCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  recentCardPreview: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  recentTagRow: {
    flexDirection: 'row' as const,
    gap: 5,
    marginTop: 8,
  },
  recentTagChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recentTagText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.primaryDark,
  },
  recentCardTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 30,
  },
});
