import React, { useCallback, useRef, useEffect, useState } from 'react';
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
import { MessageCircle, BookmarkCheck, BarChart3, ChevronRight, Plus, Zap, Brain, TrendingDown, TrendingUp, Minus, Eye, Compass, HeartCrack, Repeat, Calendar, ArrowRight, X, Lightbulb } from 'lucide-react-native';
import BrandLogo from '@/components/branding/BrandLogo';
import { settingsRepository } from '@/services/repositories';
import AICompanionOnboarding from '@/components/AICompanionOnboarding';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion, SUGGESTED_PROMPTS } from '@/providers/AICompanionProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useCoaching } from '@/hooks/useCoaching';
import { useRelationshipSpiral } from '@/hooks/useRelationshipSpiral';
import { useEmotionalLoops } from '@/hooks/useEmotionalLoops';

const ONBOARDING_KEY = 'ai_companion_onboarded';

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
    followUps,
    dismissFollowUp,
    openFollowUp,
    weeklyInsights,
    companionPatternInsights,
    companionMemoryStore,
  } = useAICompanion();

  const { dailyCoaching } = useCoaching();
  const relationshipSpiral = useRelationshipSpiral();
  const emotionalLoops = useEmotionalLoops();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent('ai_companion_opened');
    trackEvent('screen_view', { screen: 'companion' });
  }, [trackEvent]);

  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingChecked, setOnboardingChecked] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    settingsRepository.get(ONBOARDING_KEY).then((val) => {
      if (val !== 'true') {
        setShowOnboarding(true);
      }
      setOnboardingChecked(true);
    }).catch(() => {
      setOnboardingChecked(true);
    });
  }, []);

  const handleDismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    settingsRepository.set(ONBOARDING_KEY, 'true').catch(() => {});
  }, []);

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
    trackEvent('companion_chat_started', { entry_point: 'new_conversation' });
    startNewConversation();
    router.push('/companion/chat' as never);
  }, [startNewConversation, router, trackEvent]);

  const handleContinue = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('companion_chat_started', { entry_point: 'continue_conversation' });
    continueLastConversation();
    router.push('/companion/chat' as never);
  }, [continueLastConversation, router, trackEvent]);

  const handlePrompt = useCallback(async (prompt: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('companion_chat_started', { entry_point: 'suggested_prompt' });
    const id = startNewConversation();
    setActiveConversationId(id);
    router.push('/companion/chat' as never);
    setTimeout(() => {
      void sendMessage(prompt);
    }, 300);
  }, [startNewConversation, setActiveConversationId, router, sendMessage, trackEvent]);

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
          <View style={styles.companionHeroBg}>
            <View style={styles.companionOrbitOuter} />
            <View style={styles.companionOrbitInner} />
            <View style={styles.companionHeroContent}>
              <BrandLogo size={52} variant="light" animated />
              <Text style={styles.headerTitle}>AI Companion</Text>
              <Text style={styles.headerSubtitle}>
                A calm space to reflect, slow down, and get support.
              </Text>
            </View>
          </View>
        </Animated.View>

        {onboardingChecked && showOnboarding && (
          <AICompanionOnboarding onDismiss={handleDismissOnboarding} />
        )}

        {followUps.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {followUps.slice(0, 2).map((fu) => (
              <TouchableOpacity
                key={fu.id}
                style={styles.followUpCard}
                onPress={() => {
                  if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openFollowUp(fu);
                  router.push('/companion/chat' as never);
                }}
                activeOpacity={0.7}
                testID={`follow-up-${fu.id}`}
              >
                <View style={styles.followUpHeader}>
                  <View style={styles.followUpIconWrap}>
                    <Lightbulb size={14} color="#D4956A" />
                  </View>
                  <Text style={styles.followUpTitle}>{fu.title}</Text>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      void dismissFollowUp(fu.id);
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.followUpDismiss}
                  >
                    <X size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.followUpMessage}>{fu.message}</Text>
                <View style={styles.followUpAction}>
                  <Text style={styles.followUpActionText}>Open conversation</Text>
                  <ArrowRight size={12} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

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

            {memoryProfile.supportiveSummary ? (
              <View style={styles.summaryBanner}>
                <Text style={styles.summaryBannerText}>{memoryProfile.supportiveSummary}</Text>
              </View>
            ) : null}

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

        {dailyCoaching && dailyCoaching.insights.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Coaching Insights</Text>
              <Compass size={16} color={Colors.textMuted} />
            </View>
            {dailyCoaching.insights.slice(0, 2).map((insight) => (
              <View key={insight.id} style={styles.interpretationCard}>
                <View style={[
                  styles.interpretationAccent,
                  insight.confidence === 'high' && styles.interpretationAccentEncouraging,
                  insight.confidence === 'medium' && styles.interpretationAccentObservational,
                ]} />
                <View>
                  <Text style={[styles.insightMiniLabel, { marginBottom: 4 }]}>{insight.pattern}</Text>
                  <Text style={styles.interpretationText}>{insight.suggestion}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {weeklyInsights.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.weeklyInsightCard}
              onPress={() => router.push('/companion/weekly-insights' as never)}
              activeOpacity={0.7}
              testID="weekly-insight-card"
            >
              <View style={styles.weeklyInsightHeader}>
                <View style={styles.weeklyInsightIconWrap}>
                  <Calendar size={16} color="#5B8FB9" />
                </View>
                <Text style={styles.weeklyInsightLabel}>This Week</Text>
                <ChevronRight size={16} color={Colors.textMuted} />
              </View>
              <Text style={styles.weeklyInsightSummary} numberOfLines={3}>
                {weeklyInsights[0].summary}
              </Text>
              {weeklyInsights[0].growthSignals.length > 0 && (
                <View style={styles.weeklyGrowthRow}>
                  <TrendingUp size={12} color={Colors.success} />
                  <Text style={styles.weeklyGrowthText} numberOfLines={1}>
                    {weeklyInsights[0].growthSignals[0]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {companionPatternInsights.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Pattern Signals</Text>
              <TouchableOpacity
                onPress={() => router.push('/companion/emotional-patterns' as never)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {companionPatternInsights.slice(0, 2).map((insight) => (
              <View
                key={insight.id}
                style={[
                  styles.patternCard,
                  insight.importance === 'high' && styles.patternCardHigh,
                ]}
              >
                <View style={[
                  styles.patternAccent,
                  insight.category === 'growth' && { backgroundColor: Colors.success },
                  insight.category === 'relationship' && { backgroundColor: '#D4956A' },
                  insight.category === 'trigger' && { backgroundColor: Colors.danger },
                  insight.category === 'coping' && { backgroundColor: Colors.primary },
                ]} />
                <Text style={styles.patternTitle}>{insight.title}</Text>
                <Text style={styles.patternNarrative} numberOfLines={3}>{insight.narrative}</Text>
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
            onPress={() => router.push('/scenario-simulator' as never)}
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
            onPress={() => router.push('/companion/weekly-insights' as never)}
            activeOpacity={0.7}
            testID="weekly-insights-btn"
          >
            <View style={[styles.exploreCardIcon, { backgroundColor: '#E3EFF7' }]}>
              <Calendar size={20} color="#5B8FB9" />
            </View>
            <View style={styles.exploreCardContent}>
              <Text style={styles.exploreCardTitle}>Weekly Insights</Text>
              <Text style={styles.exploreCardDesc}>Your emotional week at a glance</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exploreCard}
            onPress={() => router.push('/companion/memory' as never)}
            activeOpacity={0.7}
            testID="memory-btn"
          >
            <View style={[styles.exploreCardIcon, { backgroundColor: '#E8F0FE' }]}>
              <Brain size={20} color="#4A6FA5" />
            </View>
            <View style={styles.exploreCardContent}>
              <Text style={styles.exploreCardTitle}>Emotional Memory</Text>
              <Text style={styles.exploreCardDesc}>
                {companionMemoryStore
                  ? `${companionMemoryStore.episodicMemories.length} memories stored`
                  : 'What your companion remembers about you'}
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exploreCard}
            onPress={() => router.push('/companion/emotional-patterns' as never)}
            activeOpacity={0.7}
            testID="patterns-btn"
          >
            <View style={[styles.exploreCardIcon, { backgroundColor: '#EDE7F6' }]}>
              <Brain size={20} color="#7E57C2" />
            </View>
            <View style={styles.exploreCardContent}>
              <Text style={styles.exploreCardTitle}>Emotional Patterns</Text>
              <Text style={styles.exploreCardDesc}>Trigger chains, emotion clusters & growth signals</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exploreCard}
            onPress={() => router.push('/relationship-spiral' as never)}
            activeOpacity={0.7}
            testID="spiral-btn"
          >
            <View style={[styles.exploreCardIcon, { backgroundColor: '#FDECEA' }]}>
              <HeartCrack size={20} color="#C94438" />
            </View>
            <View style={styles.exploreCardContent}>
              <Text style={styles.exploreCardTitle}>Relationship Signals</Text>
              <Text style={styles.exploreCardDesc}>
                {relationshipSpiral.isActive
                  ? `${relationshipSpiral.signals.length} active signal${relationshipSpiral.signals.length !== 1 ? 's' : ''} detected`
                  : 'Monitor spiral patterns early'}
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exploreCard}
            onPress={() => router.push('/emotional-loops' as never)}
            activeOpacity={0.7}
            testID="loops-btn"
          >
            <View style={[styles.exploreCardIcon, { backgroundColor: '#FFF7ED' }]}>
              <Repeat size={20} color="#C8762A" />
            </View>
            <View style={styles.exploreCardContent}>
              <Text style={styles.exploreCardTitle}>Emotional Loops</Text>
              <Text style={styles.exploreCardDesc}>
                {emotionalLoops.totalPatternsDetected > 0
                  ? `${emotionalLoops.totalPatternsDetected} pattern${emotionalLoops.totalPatternsDetected !== 1 ? 's' : ''} detected`
                  : 'Discover recurring patterns you can interrupt'}
              </Text>
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
    marginBottom: 24,
  },
  companionHeroBg: {
    backgroundColor: Colors.brandNavy,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  companionHeroContent: {
    alignItems: 'center' as const,
    zIndex: 2,
  },
  companionOrbitOuter: {
    position: 'absolute' as const,
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(155, 142, 196, 0.12)',
  },
  companionOrbitInner: {
    position: 'absolute' as const,
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(74, 139, 141, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#F0EDE9',
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(240, 237, 233, 0.65)',
    textAlign: 'center' as const,
    lineHeight: 21,
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
    backgroundColor: Colors.brandTeal,
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: Colors.brandTealSoft,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.brandTeal + '20',
  },
  actionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
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
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
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
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: 'rgba(27,40,56,0.03)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
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
    shadowColor: 'rgba(27,40,56,0.03)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
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
    shadowColor: 'rgba(27,40,56,0.03)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
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
    shadowColor: 'rgba(27,40,56,0.03)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
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
  summaryBanner: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  summaryBannerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic' as const,
  },
  bottomSpacer: {
    height: 36,
  },
  followUpCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 149, 106, 0.2)',
  },
  followUpHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  followUpIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.accentLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 8,
  },
  followUpTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  followUpDismiss: {
    padding: 4,
  },
  followUpMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  followUpAction: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  followUpActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  weeklyInsightCard: {
    backgroundColor: '#F0F6FA',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(91, 143, 185, 0.15)',
  },
  weeklyInsightHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  weeklyInsightIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#E3EFF7',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 8,
  },
  weeklyInsightLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4A7A9B',
  },
  weeklyInsightSummary: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 8,
  },
  weeklyGrowthRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginTop: 4,
  },
  weeklyGrowthText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.success,
    flex: 1,
  },
  patternCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    paddingLeft: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  patternCardHigh: {
    borderColor: 'rgba(212, 149, 106, 0.3)',
  },
  patternAccent: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  patternTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  patternNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
