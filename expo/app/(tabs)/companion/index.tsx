import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowRight, Brain, ChevronRight, Clock3, MessageCircle, MessageSquareText, Mic, Repeat, Sparkles, Square } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import BrandLogo from '@/components/branding/BrandLogo';
import Colors from '@/constants/colors';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useCompanionSpeechInput } from '@/hooks/useCompanionSpeechInput';

const QUICK_PROMPTS = [
  {
    id: 'overwhelmed',
    title: 'I feel overwhelmed',
    prompt: 'I feel overwhelmed. Help me understand what set this off and what my body is asking for.',
  },
  {
    id: 'rejected',
    title: 'I feel rejected',
    prompt: 'I feel rejected. Help me separate what happened from what my mind says it means.',
  },
  {
    id: 'react',
    title: 'I want to text/react',
    prompt: 'I want to text or react impulsively. Help me name what happened, what I feel, and what I usually do next.',
  },
  {
    id: 'calm',
    title: 'Help me calm down',
    prompt: 'Help me calm down first, then help me name what happened right before this got intense.',
  },
] as const;

const GREETING_VARIATIONS = [
  'How are things going today?',
  'What’s been on your mind lately?',
  'How are you feeling right now?',
  'What feels most important to talk through?',
  'What has your attention today?',
  'Where should we start?',
  'What part of today feels loudest?',
  'What would feel helpful right now?',
  'Want to talk through what happened?',
  'What are you carrying today?',
  'What emotion feels strongest?',
  'What do you need help slowing down?',
  'What moment are you still replaying?',
  'What feels unresolved?',
  'What would you like to understand better?',
  'What feels urgent right now?',
  'What are you trying not to react to?',
  'What do you wish someone understood?',
  'What would you like help naming?',
  'What would make the next five minutes easier?',
  'What do you want to sort out together?',
  'When did this start?',
];

function getDisplayName(name?: string | null, email?: string | null): string {
  const raw = name?.trim() || email?.split('@')[0] || '';
  if (!raw) return '';
  return raw.split(/[._\s-]/)[0];
}

export default function CompanionScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { trackEvent } = useAnalytics();
  const { user } = useAuth();
  const {
    startNewConversation,
    setActiveConversationId,
    recentConversations,
    companionMemorySystem,
    companionContextSummary,
  } = useAICompanion();
  const [input, setInput] = useState('');
  const speechBaseTextRef = useRef('');
  const firstName = getDisplayName(user?.displayName, user?.email);
  const safeRecentConversations = Array.isArray(recentConversations) ? recentConversations : [];
  const safeRecentEmotions = Array.isArray(companionContextSummary?.recentEmotions)
    ? companionContextSummary.recentEmotions
    : [];
  const safeMajorTriggers = Array.isArray(companionMemorySystem?.majorTriggers)
    ? companionMemorySystem.majorTriggers
    : [];
  const safeEmotionalGps = companionMemorySystem?.emotionalGPS ?? null;
  const applySpeechTranscript = useCallback((transcript: string) => {
    const base = speechBaseTextRef.current.trim();
    setInput(base ? `${base} ${transcript}` : transcript);
  }, []);
  const speechInput = useCompanionSpeechInput({ onTranscript: applySpeechTranscript });
  const inputPlaceholder = speechInput.isAvailable
    ? 'Write a few words or use the mic. You can edit before sending.'
    : 'Write a few words. You can edit before sending.';

  const memorySummaries = useMemo(() => {
    const summaries: string[] = [];
    const trigger = safeMajorTriggers[0];
    const emotion = safeRecentEmotions[0];
    const loop = safeEmotionalGps?.strongestLoop;

    if (safeEmotionalGps?.userPatternSummary) {
      summaries.push(safeEmotionalGps.userPatternSummary);
    }

    if (trigger?.label) {
      summaries.push(`Common trigger: ${trigger.label}`);
    }
    if (emotion) {
      summaries.push(`Recent emotion: ${emotion}`);
    }
    if (loop && !safeEmotionalGps?.userPatternSummary) {
      summaries.push(`Recurring loop: ${loop.trigger} -> ${loop.emotion}`);
    }

    return summaries.slice(0, 3);
  }, [safeEmotionalGps, safeMajorTriggers, safeRecentEmotions]);

  const greeting = useMemo(() => {
    const recentEmotion = safeRecentEmotions[0];
    if (companionContextSummary?.currentIntensity !== null && recentEmotion) {
      return `I remember ${recentEmotion.toLowerCase()} came up recently. Does today feel connected to that, or is this a different feeling?`;
    }
    const index = new Date().getDate() % GREETING_VARIATIONS.length;
    return `${firstName ? `Hi ${firstName}. ` : 'Hi. '}${GREETING_VARIATIONS[index]}`;
  }, [companionContextSummary?.currentIntensity, safeRecentEmotions, firstName]);

  const beginConversation = useCallback((message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const id = startNewConversation(false);
    setInput('');
    trackEvent('companion_chat_started', { entry_point: 'memory_home' });
    router.push({
      pathname: '/companion/chat',
      params: { conversationId: id, initialMessage: trimmed },
    } as never);
  }, [router, startNewConversation, trackEvent]);

  const handleMicPress = useCallback(() => {
    if (!speechInput.isListening) {
      speechBaseTextRef.current = input.trim();
    }
    speechInput.toggleListening();
  }, [input, speechInput]);

  const openConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
    router.push({
      pathname: '/companion/chat',
      params: { conversationId },
    } as never);
  }, [router, setActiveConversationId]);

  const openDontSendIt = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('dont_send_it_opened', { entry_point: 'companion_home' });
    router.push('/dont-send-it' as never);
  }, [router, trackEvent]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <BrandLogo size={44} />
          <View style={styles.headerTextWrap}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Companion</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              A calm place to understand what happened, what you feel, and what tends to happen next.
            </Text>
          </View>
        </View>

        <View style={[styles.talkCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.primaryLight }]}>
              <MessageCircle size={20} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>What’s going on right now?</Text>
              <Text style={[styles.greetingText, { color: colors.textSecondary }]}>{greeting}</Text>
            </View>
          </View>
          <View style={styles.inputShell}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={inputPlaceholder}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.largeInput,
                !speechInput.isAvailable && styles.largeInputWithoutMic,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                  color: colors.text,
                },
              ]}
              multiline
              textAlignVertical="top"
              maxLength={1800}
              testID="companion-home-input"
            />
            {speechInput.isAvailable && (
              <TouchableOpacity
                style={[
                  styles.micButton,
                  {
                    backgroundColor: speechInput.isListening ? colors.primary : colors.card,
                    borderColor: speechInput.isListening ? colors.primary : colors.borderLight,
                  },
                ]}
                onPress={handleMicPress}
                activeOpacity={0.75}
                testID="companion-home-mic-button"
                accessibilityRole="button"
                accessibilityLabel={speechInput.isListening ? 'Stop voice input' : 'Start voice input'}
                accessibilityState={{ selected: speechInput.isListening }}
              >
                {speechInput.isListening ? (
                  <Square size={16} color={Colors.white} />
                ) : (
                  <Mic size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          </View>
          {speechInput.message && (
            <Text
              style={[
                styles.speechStatusText,
                {
                  color: speechInput.status === 'error' ? colors.danger : colors.textSecondary,
                },
              ]}
              testID="companion-home-speech-status"
            >
              {speechInput.message}
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: input.trim() ? colors.primary : colors.border },
            ]}
            onPress={() => beginConversation(input)}
            disabled={!input.trim()}
            activeOpacity={0.86}
            testID="talk-it-through-button"
          >
            <Text style={styles.primaryButtonText}>Talk it through</Text>
            <ArrowRight size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={[styles.memoryCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.surface }]}>
              <Brain size={19} color={colors.brandTeal} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardKicker, { color: colors.brandTeal }]}>Emotional GPS</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>What I’m learning about you</Text>
            </View>
          </View>
          {memorySummaries.length > 0 ? (
            <View style={styles.memoryList}>
              {memorySummaries.map((summary) => (
                <View key={summary} style={[styles.memoryRow, { backgroundColor: colors.surface }]}>
                  <Repeat size={14} color={colors.primary} />
                  <Text style={[styles.memoryText, { color: colors.textSecondary }]}>{summary}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyMemoryText, { color: colors.textSecondary }]}>
              I’ll learn your patterns as you check in and reflect.
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.dontSendCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
          onPress={openDontSendIt}
          activeOpacity={0.78}
          testID="companion-dont-send-it-card"
        >
          <View style={[styles.cardIcon, { backgroundColor: colors.accentLight }]}>
            <MessageSquareText size={19} color={colors.accent} />
          </View>
          <View style={styles.dontSendTextWrap}>
            <Text style={[styles.cardKicker, { color: colors.accent }]}>Pause before sending</Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Don’t Send It</Text>
            <Text style={[styles.dontSendBody, { color: colors.textSecondary }]}>
              Paste the message first. Companion will help check tone, patterns, and a calmer version.
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {safeRecentConversations.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, { color: colors.brandNavy }]}>Recent conversations</Text>
            <View style={styles.recentList}>
              {safeRecentConversations.slice(0, 3).map((conversation) => {
                const safeMessages = Array.isArray(conversation.messages) ? conversation.messages : [];
                const latestMessage = safeMessages[safeMessages.length - 1];
                return (
                <TouchableOpacity
                  key={conversation.id}
                  style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                  onPress={() => openConversation(conversation.id)}
                  activeOpacity={0.78}
                  testID={`recent-conversation-${conversation.id}`}
                >
                  <View style={[styles.recentIcon, { backgroundColor: colors.primaryLight }]}>
                    <Clock3 size={15} color={colors.primary} />
                  </View>
                  <View style={styles.recentTextWrap}>
                    <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>
                      {conversation.title || 'Conversation'}
                    </Text>
                    <Text style={[styles.recentPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                      {conversation.preview || latestMessage?.content || 'Continue where you left off'}
                    </Text>
                  </View>
                  <ChevronRight size={17} color={colors.textMuted} />
                </TouchableOpacity>
              );})}
            </View>
          </View>
        )}

        <View style={styles.promptSection}>
          <Text style={[styles.sectionTitle, { color: colors.brandNavy }]}>Quick prompts</Text>
          <View style={styles.promptList}>
            {QUICK_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt.id}
                style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                onPress={() => beginConversation(prompt.prompt)}
                activeOpacity={0.76}
                testID={`companion-prompt-${prompt.id}`}
              >
                <Sparkles size={15} color={colors.brandTeal} />
                <Text style={[styles.promptTitle, { color: colors.text }]}>{prompt.title}</Text>
                <ChevronRight size={17} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 2,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  greetingText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  talkCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 20,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
  },
  memoryCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 18,
    padding: 16,
  },
  dontSendCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dontSendTextWrap: {
    flex: 1,
  },
  dontSendBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 13,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardKicker: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  inputShell: {
    position: 'relative',
    marginBottom: 12,
  },
  largeInput: {
    minHeight: 150,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingRight: 58,
    paddingVertical: 13,
    fontSize: 16,
    lineHeight: 23,
  },
  largeInputWithoutMic: {
    paddingRight: 14,
  },
  micButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speechStatusText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  memoryList: {
    gap: 8,
  },
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  memoryText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  emptyMemoryText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  promptSection: {
    gap: 10,
  },
  recentSection: {
    gap: 10,
  },
  sectionTitle: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  recentList: {
    gap: 8,
  },
  recentCard: {
    minHeight: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  recentIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  recentTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 3,
  },
  recentPreview: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  promptList: {
    gap: 8,
  },
  promptCard: {
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  promptTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
