import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, ChevronRight, MessageCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion } from '@/providers/AICompanionProvider';

export default React.memo(function AICompanionHomeCard() {
  const router = useRouter();
  const {
    recentConversations,
    memoryProfile,
    startNewConversation,
    continueLastConversation,
  } = useAICompanion();

  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sparkleAnim]);

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const lastConvo = recentConversations.length > 0 ? recentConversations[0] : null;
  const hasRecentConvo = lastConvo && lastConvo.messages.length > 0;

  const personalizedLine = getPersonalizedLine(memoryProfile);

  const handleOpenCompanion = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (hasRecentConvo) {
      const id = continueLastConversation();
      router.push({
        pathname: '/companion/chat',
        params: { conversationId: id },
      } as never);
    } else {
      const id = startNewConversation();
      router.push({
        pathname: '/companion/chat',
        params: { conversationId: id },
      } as never);
    }
  }, [hasRecentConvo, continueLastConversation, startNewConversation, router]);

  const handleQuickPrompt = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const id = startNewConversation(false);
    router.push({
      pathname: '/companion/chat',
      params: {
        conversationId: id,
        initialMessage: 'Help me slow down, everything feels overwhelming right now',
      },
    } as never);
  }, [startNewConversation, router]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={handleOpenCompanion}
        activeOpacity={0.8}
        testID="ai-companion-home-card"
      >
        <View style={styles.cardInner}>
          <View style={styles.headerRow}>
            <Animated.View style={[styles.iconWrap, { opacity: sparkleOpacity }]}>
              <Sparkles size={18} color={Colors.primary} />
            </Animated.View>
            <View style={styles.headerText}>
              <Text style={styles.title}>AI Companion</Text>
              <Text style={styles.subtitle}>Talk it through</Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </View>

          <Text style={styles.personalizedLine}>{personalizedLine}</Text>

          {hasRecentConvo && (
            <View style={styles.continueRow}>
              <MessageCircle size={13} color={Colors.accent} />
              <Text style={styles.continueText} numberOfLines={1}>
                Continue: {lastConvo.title}
              </Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={handleOpenCompanion}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionText}>
                {hasRecentConvo ? 'Continue' : 'Start a chat'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={handleQuickPrompt}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryActionText}>Slow me down</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

function getPersonalizedLine(memoryProfile: { intensityTrend: string; averageIntensity: number; topTriggers: { label: string }[]; recentCheckInCount: number }): string {
  if (memoryProfile.recentCheckInCount === 0) {
    return "A calm space to reflect and get support when you need it.";
  }

  if (memoryProfile.intensityTrend === 'rising' && memoryProfile.averageIntensity > 6) {
    return "You've been under more stress lately. Want to slow it down together?";
  }

  if (memoryProfile.intensityTrend === 'rising') {
    return "Things seem a bit harder recently. I'm here if you want to talk.";
  }

  if (memoryProfile.intensityTrend === 'falling') {
    return "You're trending calmer lately. Want to reflect on what's helping?";
  }

  if (memoryProfile.topTriggers.length > 0) {
    const trigger = memoryProfile.topTriggers[0].label.toLowerCase();
    return `Noticing ${trigger} comes up often. Want to explore that gently?`;
  }

  return "A supportive space to process what you're going through.";
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden' as const,
  },
  cardInner: {
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  personalizedLine: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 14,
  },
  continueRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.warmGlow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  continueText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500' as const,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center' as const,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center' as const,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
