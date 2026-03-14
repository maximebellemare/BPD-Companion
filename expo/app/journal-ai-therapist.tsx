import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Send, Sparkles, Bookmark, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useJournal } from '@/providers/JournalProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  AIJournalMode,
  AI_JOURNAL_MODE_CONFIG,
  AIJournalMessage,
} from '@/types/journalDaily';
import { generateAIJournalResponse, generateSessionSummary } from '@/services/journal/aiJournalCoachService';

const SUGGESTION_CHIPS = [
  'What exactly happened?',
  'Could I be misinterpreting this?',
  'Help me calm down',
  'What pattern do you see?',
  'Help me respond well',
];

function MessageBubble({ message }: { message: AIJournalMessage }) {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.aiBubble,
        { opacity: fadeAnim },
      ]}
    >
      {!isUser && (
        <View style={styles.aiLabel}>
          <Sparkles size={12} color={Colors.brandLilac} />
          <Text style={styles.aiLabelText}>Journal Guide</Text>
        </View>
      )}
      <Text style={[styles.messageText, isUser && styles.userMessageText]}>
        {message.content}
      </Text>
    </Animated.View>
  );
}

export default function JournalAITherapistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { smartEntries, addEntry } = useJournal();
  const { trackEvent } = useAnalytics();

  const mode: AIJournalMode = (params.mode as AIJournalMode) || 'free_reflection';
  const config = AI_JOURNAL_MODE_CONFIG[mode];

  const [messages, setMessages] = useState<AIJournalMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showChips, setShowChips] = useState<boolean>(true);
  const [sessionSaved, setSessionSaved] = useState<boolean>(false);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    trackEvent('journal_ai_therapist_opened', { mode });
    const openingMsg: AIJournalMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: config.openingPrompt,
      timestamp: Date.now(),
    };
    setMessages([openingMsg]);
  }, [mode, config.openingPrompt, trackEvent]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowChips(false);

    const userMsg: AIJournalMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      const response = await generateAIJournalResponse(
        mode,
        updatedMessages,
        smartEntries.slice(0, 5),
      );

      const aiMsg: AIJournalMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);
      setShowChips(true);
      scrollToBottom();

      trackEvent('journal_ai_therapist_message_sent', {
        mode,
        messageCount: updatedMessages.length + 1,
      });
    } catch (error) {
      console.error('[JournalAITherapist] Response failed:', error);
      const fallbackMsg: AIJournalMessage = {
        id: `msg_${Date.now()}_f`,
        role: 'assistant',
        content: 'I want to understand what you\'re going through. Could you share a bit more about what happened?',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
      setShowChips(true);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, mode, smartEntries, scrollToBottom, trackEvent]);

  const handleSaveSession = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const userMessages = messages.filter(m => m.role === 'user');
    const content = userMessages.map(m => m.content).join('\n\n');

    if (content.trim()) {
      addEntry({
        format: 'free_writing',
        title: `${config.label} — AI Session`,
        content,
        emotions: [],
        triggers: [],
        distressLevel: 5,
        notes: 'Generated from AI Therapist journaling session',
      });
    }

    try {
      await generateSessionSummary(messages);
    } catch {
      console.log('[JournalAITherapist] Summary generation skipped');
    }

    trackEvent('journal_ai_session_saved', { mode, messageCount: messages.length });
    setSessionSaved(true);
  }, [messages, config.label, mode, addEntry, trackEvent]);

  const handleChipPress = useCallback((chip: string) => {
    void sendMessage(chip);
  }, [sendMessage]);

  if (sessionSaved) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.savedContainer}>
          <View style={styles.savedIconCircle}>
            <Bookmark size={32} color={Colors.brandLilac} />
          </View>
          <Text style={styles.savedTitle}>Session saved</Text>
          <Text style={styles.savedSubtitle}>
            Your reflections have been saved to your journal. The insights from this conversation are part of your emotional story.
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>{config.emoji}</Text>
            <Text style={styles.headerTitle}>{config.label}</Text>
          </View>
          <TouchableOpacity
            onPress={handleSaveSession}
            style={styles.saveHeaderBtn}
            disabled={messages.length < 3}
          >
            <Bookmark
              size={20}
              color={messages.length >= 3 ? Colors.brandLilac : Colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        >
          <View style={styles.modeCard}>
            <Text style={styles.modeEmoji}>{config.emoji}</Text>
            <Text style={styles.modeTitle}>{config.label}</Text>
            <Text style={styles.modeDesc}>{config.description}</Text>
          </View>

          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.brandLilac} />
              <Text style={styles.loadingText}>Reflecting...</Text>
            </View>
          )}

          {showChips && messages.length >= 2 && messages.length < 10 && (
            <View style={styles.chipsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {SUGGESTION_CHIPS.map(chip => (
                    <TouchableOpacity
                      key={chip}
                      style={styles.chip}
                      onPress={() => handleChipPress(chip)}
                    >
                      <Text style={styles.chipText}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          {messages.length >= 6 && (
            <TouchableOpacity
              style={styles.saveSessionBtn}
              onPress={handleSaveSession}
            >
              <Bookmark size={14} color={Colors.brandLilac} />
              <Text style={styles.saveSessionText}>Save session</Text>
              <ChevronDown size={14} color={Colors.brandLilac} style={{ transform: [{ rotate: '-90deg' }] }} />
            </TouchableOpacity>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Write what's on your mind..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={2000}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
              onPress={() => void sendMessage(input)}
              disabled={!input.trim() || isLoading}
            >
              <Send size={18} color={input.trim() && !isLoading ? Colors.white : Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  saveHeaderBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modeCard: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  modeEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  modeDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.brandTeal,
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  aiLabelText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.brandLilac,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.white,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.brandLilac,
    fontWeight: '500' as const,
  },
  chipsContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.brandLilac + '40',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.brandLilac,
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  saveSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 4,
  },
  saveSessionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.brandLilac,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    paddingTop: 10,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.brandLilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.surface,
  },
  savedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  savedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brandLilacSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  savedTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  savedSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  doneBtn: {
    backgroundColor: Colors.brandLilac,
    borderRadius: 14,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
