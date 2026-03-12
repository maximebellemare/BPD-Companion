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
import { MessageCircle, Sparkles, BookmarkCheck, BarChart3, ChevronRight, Plus, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion, SUGGESTED_PROMPTS } from '@/providers/AICompanionProvider';

export default function CompanionScreen() {
  const router = useRouter();
  const {
    recentConversations,
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
            A safe, gentle space to explore your feelings.{'\n'}I'm here whenever you need me.
          </Text>
        </Animated.View>

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
            <Text style={styles.sectionTitle}>Recent</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 14,
    letterSpacing: -0.2,
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
    alignItems: 'center' as const,
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
  recentCardTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  bottomSpacer: {
    height: 30,
  },
});
