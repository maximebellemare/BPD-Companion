import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  Send,
  Bookmark,
  Plus,
  ArrowLeft,
  Shield,
  Compass,
  PenLine,
  MessageSquareText,
  Wind,
  Sparkles,
  MoreVertical,
  Trash2,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Check,
  Mic,
  Square,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Crown } from 'lucide-react-native';
import { AIMessage } from '@/types/ai';
import { AIMode } from '@/types/aiModes';
import { getManualModeOptions, getModeConfig } from '@/services/ai/aiModeService';
import {
  CompanionResponseFeedback,
  loadCompanionResponseFeedback,
  loadSavedCompanionInsights,
  rateCompanionResponse,
  saveCompanionInsight,
} from '@/services/companion/companionInsightService';
import { useCompanionSpeechInput } from '@/hooks/useCompanionSpeechInput';

const STARTER_CHIPS = [
  { id: 's1', label: 'I feel abandoned', icon: '💔', prompt: 'I feel abandoned. Help me slow down and understand what this is touching in me.' },
  { id: 's2', label: 'I want to text them again', icon: '📱', prompt: 'I want to text them again. Help me name what happened, what I feel, and what I usually do next.' },
  { id: 's3', label: 'I feel empty', icon: '🌫️', prompt: 'I feel empty and disconnected. Sit with me and help me name what might be happening.' },
  { id: 's4', label: 'I might say something I regret', icon: '🔥', prompt: 'I am angry and might say something I regret. Help me identify what happened right before the anger.' },
  { id: 's5', label: 'Help me understand this trigger', icon: '🔍', prompt: 'Help me trace this trigger: what happened, what it meant to me, what fear showed up, and what urge came next.' },
];

type ContextSuggestionChip = {
  id: string;
  label: string;
  prompt: string;
};

function buildContextSuggestions(messages: AIMessage[]): ContextSuggestionChip[] {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const lastUserMessage = [...safeMessages].reverse().find(message => message?.role === 'user')?.content ?? '';
  const lower = lastUserMessage.toLowerCase();
  const suggestions: ContextSuggestionChip[] = [];

  const add = (id: string, label: string, prompt: string) => {
    if (!suggestions.some(item => item.id === id)) suggestions.push({ id, label, prompt });
  };

  if (/(girlfriend|boyfriend|partner|wife|husband|date|relationship|reply|answered|text|message|ignored|left on read)/.test(lower)) {
    add('facts', 'What happened?', 'Help me start with the facts of what happened.');
    add('emotion', 'Name the emotion', 'Help me name the strongest emotion right now.');
    add('urge', 'What do I want to do?', 'Help me name what I feel pulled to do next.');
  }
  if (/(angry|mad|rage|furious|snap|yell|fight|argument|conflict)/.test(lower)) {
    add('body-first', 'Calm my body first', 'Help me calm my body before I decide what to say or do.');
    add('before-anger', 'What happened first?', 'Help me identify what happened right before the anger.');
  }
  if (/(abandon|rejected|ignored|not answer|no reply|pulling away|leave me|doesn.t care)/.test(lower)) {
    add('emotion', 'Name the emotion', 'Help me name the strongest emotion right now.');
    add('wait', 'What did I notice?', 'Help me name the concrete thing I noticed before the feeling got stronger.');
  }
  if (/(empty|numb|alone|lonely|disconnected|nothing)/.test(lower)) {
    add('empty-type', 'What kind of empty?', 'Help me tell whether this feels like numb, lonely, disconnected, bored, or hopeless.');
    add('when-started', 'When did it start?', 'Help me identify when this feeling started.');
  }
  if (/(send|text|reply|email|message|whatsapp|dm|react)/.test(lower)) {
    add('rewrite', 'Help me rewrite it', 'Help me rewrite what I want to say in a calmer, clearer way.');
  }
  if (/(pattern|again|always|keeps happening|same thing)/.test(lower)) {
    add('pattern', 'What usually happens?', 'Help me name what usually happens when this starts.');
  }

  return suggestions.slice(0, 4);
}

interface QuickActionConfig {
  icon: React.ReactNode;
  route?: string;
  message?: string;
}

const QUICK_ACTION_CONFIG: Record<string, QuickActionConfig> = {
  'Ground me': { icon: <Wind size={13} color={Colors.primary} />, route: '/grounding-mode' },
  'Show coping tools': { icon: <Compass size={13} color={Colors.primary} />, route: '/(tabs)/tools' },
  'Journal this': { icon: <PenLine size={13} color={Colors.primary} />, route: '/check-in' },
  'Help me rewrite a message': { icon: <MessageSquareText size={13} color={Colors.primary} />, route: '/dont-send-it' },
  "Don't Send It": { icon: <MessageSquareText size={13} color={Colors.primary} />, route: '/dont-send-it' },
  'Slow this down': { icon: <Wind size={13} color={Colors.primary} />, message: 'I need to slow this down. Can we take it one small step at a time?' },
  'Safety mode': { icon: <Shield size={13} color={Colors.danger} />, route: '/safety-mode' },
  'Reflection': { icon: <PenLine size={13} color={Colors.primary} />, message: 'I want to reflect on what I\'m feeling right now. Can you help me explore this?' },
  'What pattern do you see?': { icon: <Brain size={13} color={Colors.primary} />, message: 'Based on what you know about me, what patterns do you notice here?' },
  'Help me respond securely': { icon: <MessageSquareText size={13} color={Colors.primary} />, message: 'Help me craft a response that comes from security, not reactivity.' },
};

const SECTION_LABELS: Record<string, string> = {
  'one next step': '➡️ One thing to try',
  'one thing to try': '➡️ One thing to try',
  'what might help': '➡️ One thing to try',
  'next step': '➡️ One thing to try',
};

function normalizeMarkdownForDisplay(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*💙?\s*What I(?:'|’)m hearing\s*:?\s*$/gim, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeSectionLabel(line: string): string | null {
  const clean = line
    .replace(/^[💙🔍➡️❤️🧭]\s*/, '')
    .replace(/[:\-–—]\s*$/, '')
    .trim()
    .toLowerCase();

  return SECTION_LABELS[clean] ?? null;
}

function FormattedAssistantMessage({ content }: { content: string }) {
  const normalized = normalizeMarkdownForDisplay(content);
  const blocks = normalized.split(/\n{2,}/).map(block => block.trim()).filter(Boolean);

  return (
    <View style={styles.formattedMessage}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
        const sectionLabel = lines.length > 0 ? normalizeSectionLabel(lines[0]) : null;
        const bodyLines = sectionLabel ? lines.slice(1) : lines;

        return (
          <View key={`${blockIndex}-${block.slice(0, 20)}`} style={styles.formattedBlock}>
            {sectionLabel && (
              <Text style={styles.formattedSectionTitle}>{sectionLabel}</Text>
            )}
            {bodyLines.map((line, lineIndex) => {
              const isBullet = line.startsWith('• ');
              return (
                <Text
                  key={`${lineIndex}-${line.slice(0, 16)}`}
                  style={[styles.messageText, styles.assistantText, isBullet && styles.formattedBullet]}
                >
                  {line}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
    };

    const a1 = animateDot(dot1, 0);
    const a2 = animateDot(dot2, 150);
    const a3 = animateDot(dot3, 300);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingLabel}>
        <Sparkles size={12} color={Colors.primary} />
        <Text style={styles.typingLabelText}>Companion is thinking...</Text>
      </View>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
        <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
        <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
      </View>
    </View>
  );
}

interface QuickActionsProps {
  actions: string[];
  onAction: (action: string) => void;
}

const QuickActions = React.memo(({ actions, onAction }: QuickActionsProps) => {
  if (!actions || actions.length === 0) return null;

  return (
    <View style={styles.quickActionsRow}>
      {actions.map((action) => {
        const config = QUICK_ACTION_CONFIG[action];
        return (
          <TouchableOpacity
            key={action}
            style={styles.quickActionChip}
            onPress={() => onAction(action)}
            activeOpacity={0.7}
          >
            {config?.icon}
            <Text style={styles.quickActionText}>{action}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

interface MessageBubbleProps {
  message: AIMessage;
  isLastAssistant: boolean;
  onQuickAction: (action: string) => void;
  conversationId: string | null;
  isSavedInsight: boolean;
  feedback?: CompanionResponseFeedback;
  onSaveInsight: (message: AIMessage) => void;
  onRateResponse: (message: AIMessage, rating: CompanionResponseFeedback) => void;
}

const MessageBubble = React.memo(({
  message,
  isLastAssistant,
  onQuickAction,
  conversationId,
  isSavedInsight,
  feedback,
  onSaveInsight,
  onRateResponse,
}: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 10 : -10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const time = new Date(message.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const showQuickActions = !isUser && isLastAssistant && message.quickActions && message.quickActions.length > 0;

  return (
    <Animated.View
      style={[
        styles.messageBubbleWrapper,
        isUser ? styles.userBubbleWrapper : styles.assistantBubbleWrapper,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.assistantAvatarRow}>
          <View style={styles.assistantAvatar}>
            <Sparkles size={11} color={Colors.primary} />
          </View>
          <Text style={styles.assistantLabel}>Companion</Text>
          <Text style={styles.messageTimeInline}>{timeStr}</Text>
        </View>
      )}
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isUser ? (
          <Text style={[styles.messageText, styles.userText]}>{message.content}</Text>
        ) : (
          <FormattedAssistantMessage content={message.content} />
        )}
      </View>
      {isUser && (
        <Text style={[styles.messageTime, styles.userTime]}>{timeStr}</Text>
      )}
      {!isUser && conversationId && (
        <View style={styles.responseLearningRow}>
          <TouchableOpacity
            style={[styles.responseLearningButton, isSavedInsight && styles.responseLearningButtonActive]}
            onPress={() => onSaveInsight(message)}
            activeOpacity={0.75}
            disabled={isSavedInsight}
            testID={`save-insight-${message.id}`}
          >
            {isSavedInsight ? <Check size={13} color={Colors.success} /> : <Bookmark size={13} color={Colors.primary} />}
            <Text style={[styles.responseLearningText, isSavedInsight && styles.responseLearningTextActive]}>
              {isSavedInsight ? 'Insight saved to Insights' : '⭐ Save Insight'}
            </Text>
          </TouchableOpacity>
          {!isSavedInsight ? (
            <Text style={styles.responseLearningHint}>Save this conversation insight so it appears in Insights later.</Text>
          ) : null}
          <Text style={styles.responseFeedbackLabel}>Was this useful?</Text>
          <TouchableOpacity
            style={[styles.feedbackIconButton, feedback === 'useful' && styles.feedbackIconButtonActive]}
            onPress={() => onRateResponse(message, 'useful')}
            activeOpacity={0.75}
            testID={`rate-useful-${message.id}`}
          >
            <ThumbsUp size={13} color={feedback === 'useful' ? Colors.success : Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.feedbackIconButton, feedback === 'not_useful' && styles.feedbackIconButtonMuted]}
            onPress={() => onRateResponse(message, 'not_useful')}
            activeOpacity={0.75}
            testID={`rate-not-useful-${message.id}`}
          >
            <ThumbsDown size={13} color={feedback === 'not_useful' ? Colors.danger : Colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
      {showQuickActions && (
        <QuickActions actions={message.quickActions!} onAction={onQuickAction} />
      )}
    </Animated.View>
  );
});

function EmptyState({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  return (
    <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.emptyIconContainer}>
        <View style={styles.emptyIconOuter}>
          <View style={styles.emptyIconInner}>
            <Text style={styles.emptyEmoji}>🤲</Text>
          </View>
        </View>
      </View>
      <Text style={styles.emptyTitle}>Start with what feels urgent</Text>
      <Text style={styles.emptySubtitle}>
        I can use your recent check-ins, triggers, and goals to help you slow down, reflect, or pause before reacting.
      </Text>
      <View style={styles.emptyDivider}>
        <View style={styles.emptyDividerLine} />
        <Text style={styles.emptyDividerText}>or start with</Text>
        <View style={styles.emptyDividerLine} />
      </View>
      <View style={styles.emptyPrompts}>
        {STARTER_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip.id}
            style={styles.emptyPromptChip}
            onPress={() => onPrompt(chip.prompt)}
            activeOpacity={0.7}
          >
            <Text style={styles.emptyPromptIcon}>{chip.icon}</Text>
            <Text style={styles.emptyPromptText}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

function ChatMenu({
  visible,
  onClose,
  onNewChat,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onDelete: () => void;
}) {
  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.menuOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => { onNewChat(); onClose(); }}>
          <Plus size={16} color={Colors.text} />
          <Text style={styles.menuItemText}>New conversation</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => { onDelete(); onClose(); }}>
          <Trash2 size={16} color={Colors.danger} />
          <Text style={[styles.menuItemText, { color: Colors.danger }]}>Delete conversation</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const MODE_OPTIONS = getManualModeOptions();

interface ModeSelectorProps {
  activeMode: AIMode | null;
  manualMode: AIMode | null;
  onSelectMode: (mode: AIMode | null) => void;
  visible: boolean;
}

const ModeSelector = React.memo(({ activeMode, manualMode, onSelectMode, visible }: ModeSelectorProps) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const handleToggle = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpanded(prev => !prev);
  }, []);

  const handleSelect = useCallback((mode: AIMode) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (manualMode === mode) {
      onSelectMode(null);
    } else {
      onSelectMode(mode);
    }
    setExpanded(false);
  }, [manualMode, onSelectMode]);

  if (!visible) return null;

  const currentConfig = activeMode ? getModeConfig(activeMode) : null;

  return (
    <View style={styles.modeSelectorContainer}>
      {currentConfig && (
        <TouchableOpacity
          style={[styles.modeIndicatorPill, { backgroundColor: currentConfig.color + '18' }]}
          onPress={handleToggle}
          activeOpacity={0.7}
          testID="mode-indicator"
        >
          <Text style={styles.modeIndicatorIcon}>{currentConfig.icon}</Text>
          <Text style={[styles.modeIndicatorLabel, { color: currentConfig.color }]}>
            {currentConfig.label}
          </Text>
          {manualMode && (
            <View style={[styles.modeManualDot, { backgroundColor: currentConfig.color }]} />
          )}
        </TouchableOpacity>
      )}
      {!currentConfig && (
        <TouchableOpacity
          style={styles.modeIndicatorPill}
          onPress={handleToggle}
          activeOpacity={0.7}
          testID="mode-toggle"
        >
          <Text style={styles.modeIndicatorIcon}>🎯</Text>
          <Text style={styles.modeIndicatorLabelDefault}>Choose support style</Text>
        </TouchableOpacity>
      )}
      {expanded && (
        <View style={styles.modeChipsRow}>
          {MODE_OPTIONS.map((opt) => {
            const isActive = manualMode === opt.mode;
            const config = getModeConfig(opt.mode);
            return (
              <TouchableOpacity
                key={opt.mode}
                style={[
                  styles.modeChip,
                  isActive && { backgroundColor: config.color + '20', borderColor: config.color + '40' },
                ]}
                onPress={() => handleSelect(opt.mode)}
                activeOpacity={0.7}
                testID={`mode-chip-${opt.mode}`}
              >
                <Text style={styles.modeChipIcon}>{opt.icon}</Text>
                <Text style={[
                  styles.modeChipLabel,
                  isActive && { color: config.color, fontWeight: '600' as const },
                ]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
          {manualMode && (
            <TouchableOpacity
              style={styles.modeClearChip}
              onPress={() => { onSelectMode(null); setExpanded(false); }}
              activeOpacity={0.7}
              testID="mode-clear"
            >
              <Text style={styles.modeClearText}>Auto-detect</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

export default function ChatScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    prefill?: string;
    initialMessage?: string;
    conversationId?: string;
  }>();
  const {
    activeConversation,
    activeConversationId,
    isGenerating,
    memoryProfile,
    sendMessage,
    startNewConversation,
    deleteConversation,
    setActiveConversationId,
    manualMode,
    currentActiveMode,
    currentModeConfig,
    latestSafetyAssessment,
  } = useAICompanion();

  const { aiLimitReached, remainingAIMessages, trackAIUsage, isPremium } = useEntitlements();
  const [inputText, setInputText] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [initialMessageHandled, setInitialMessageHandled] = useState<boolean>(false);
  const [savedInsightMessageIds, setSavedInsightMessageIds] = useState<Set<string>>(new Set());
  const [responseFeedback, setResponseFeedback] = useState<Record<string, CompanionResponseFeedback>>({});
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const speechBaseTextRef = useRef('');
  const applySpeechTranscript = useCallback((transcript: string) => {
    const base = speechBaseTextRef.current.trim();
    setInputText(base ? `${base} ${transcript}` : transcript);
  }, []);
  const speechInput = useCompanionSpeechInput({ onTranscript: applySpeechTranscript });

  useEffect(() => {
    let mounted = true;
    Promise.all([loadSavedCompanionInsights(), loadCompanionResponseFeedback()])
      .then(([saved, feedback]) => {
        if (!mounted) return;
        setSavedInsightMessageIds(new Set(saved.map(item => item.messageId)));
        setResponseFeedback(
          Object.fromEntries(Object.entries(feedback).map(([messageId, record]) => [messageId, record.rating])),
        );
      })
      .catch((error) => {
        console.log('[CompanionChat] Failed to load response learning state:', error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const routeConversationId = typeof searchParams.conversationId === 'string'
      ? searchParams.conversationId
      : undefined;

    if (routeConversationId && activeConversationId !== routeConversationId) {
      setActiveConversationId(routeConversationId);
    }
  }, [activeConversationId, searchParams.conversationId, setActiveConversationId]);

  useEffect(() => {
    const routeConversationId = typeof searchParams.conversationId === 'string'
      ? searchParams.conversationId
      : undefined;
    const initialMessage = typeof searchParams.initialMessage === 'string'
      ? searchParams.initialMessage
      : undefined;
    const prefillMessage = typeof searchParams.prefill === 'string'
      ? searchParams.prefill
      : undefined;
    const messageToSend = initialMessage ?? prefillMessage;

    if (!messageToSend || initialMessageHandled || isGenerating) return;

    setInitialMessageHandled(true);
    const targetConversationId = routeConversationId ?? activeConversationId ?? startNewConversation(false);
    if (targetConversationId !== activeConversationId) {
      setActiveConversationId(targetConversationId);
    }
    void sendMessage(messageToSend, targetConversationId);
  }, [
    activeConversationId,
    initialMessageHandled,
    isGenerating,
    searchParams.conversationId,
    searchParams.initialMessage,
    searchParams.prefill,
    sendMessage,
    setActiveConversationId,
    startNewConversation,
  ]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isGenerating) return;

    if (aiLimitReached) {
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      return;
    }

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setInputText('');
    await trackAIUsage();
    const targetConversationId = activeConversationId ?? startNewConversation(false);
    if (targetConversationId !== activeConversationId) {
      setActiveConversationId(targetConversationId);
    }
    await sendMessage(text, targetConversationId);
  }, [
    activeConversationId,
    inputText,
    isGenerating,
    sendMessage,
    aiLimitReached,
    trackAIUsage,
    router,
    startNewConversation,
    setActiveConversationId,
  ]);

  const handleMicPress = useCallback(() => {
    if (!speechInput.isListening) {
      speechBaseTextRef.current = inputText.trim();
    }
    speechInput.toggleListening();
  }, [inputText, speechInput]);

  const handleNewChat = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    startNewConversation();
  }, [startNewConversation]);

  const handleDelete = useCallback(() => {
    if (!activeConversation) return;
    deleteConversation(activeConversation.id);
    router.back();
  }, [activeConversation, deleteConversation, router]);

  const handlePrompt = useCallback(async (prompt: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const targetConversationId = activeConversationId ?? startNewConversation(false);
    if (targetConversationId !== activeConversationId) {
      setActiveConversationId(targetConversationId);
    }
    await sendMessage(prompt, targetConversationId);
  }, [activeConversationId, sendMessage, setActiveConversationId, startNewConversation]);

  const getConversationContext = useCallback((): string => {
    const safeMessages = Array.isArray(activeConversation?.messages) ? activeConversation.messages : [];
    if (!safeMessages.length) return '';
    const recent = safeMessages.slice(-6);
    const userMessages = recent.filter(m => m?.role === 'user').map(m => m.content);
    const lastAssistant = recent.filter(m => m?.role === 'assistant').pop();

    const parts: string[] = [];
    const activeTitle = activeConversation?.title;
    if (activeTitle && activeTitle !== 'New Chat') {
      parts.push(`Topic: ${activeTitle}`);
    }
    if (userMessages.length > 0) {
      const summary = userMessages.slice(-2).join(' ').slice(0, 300);
      parts.push(`What I was sharing: ${summary}`);
    }
    if (lastAssistant) {
      const snippet = lastAssistant.content.slice(0, 200);
      parts.push(`Companion noted: ${snippet}`);
    }
    return parts.join('\n');
  }, [activeConversation]);

  const handleQuickAction = useCallback((action: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const config = QUICK_ACTION_CONFIG[action];

    if (config?.message) {
      const targetConversationId = activeConversationId ?? startNewConversation(false);
      if (targetConversationId !== activeConversationId) {
        setActiveConversationId(targetConversationId);
      }
      void sendMessage(config.message, targetConversationId);
      return;
    }

    if (action === 'Journal this') {
      const context = getConversationContext();
      const prefillNotes = context
        ? `From companion conversation:\n${context}`
        : '';
      router.push({
        pathname: '/check-in',
        params: { prefillNotes, source: 'companion' },
      } as never);
      return;
    }

    if (config?.route) {
      router.push(config.route as never);
      return;
    }

    const targetConversationId = activeConversationId ?? startNewConversation(false);
    if (targetConversationId !== activeConversationId) {
      setActiveConversationId(targetConversationId);
    }
    void sendMessage(action, targetConversationId);
  }, [activeConversationId, sendMessage, router, getConversationContext, setActiveConversationId, startNewConversation]);

  const handleSaveInsight = useCallback((message: AIMessage) => {
    if (!activeConversation) return;
    const safeMessages = Array.isArray(activeConversation.messages) ? activeConversation.messages : [];
    const messageIndex = safeMessages.findIndex(item => item.id === message.id);
    const userMessage = messageIndex >= 0
      ? [...safeMessages.slice(0, messageIndex)].reverse().find(item => item.role === 'user')?.content
      : undefined;
    setSavedInsightMessageIds(prev => new Set(prev).add(message.id));
    void saveCompanionInsight({
      conversationId: activeConversation.id,
      messageId: message.id,
      content: message.content,
      userMessage,
      tags: activeConversation.tags,
    }).catch((error) => {
      console.log('[CompanionChat] Failed to save insight:', error);
      setSavedInsightMessageIds(prev => {
        const next = new Set(prev);
        next.delete(message.id);
        return next;
      });
    });
  }, [activeConversation]);

  const handleRateResponse = useCallback((message: AIMessage, rating: CompanionResponseFeedback) => {
    if (!activeConversation) return;
    setResponseFeedback(prev => ({ ...prev, [message.id]: rating }));
    void rateCompanionResponse({
      conversationId: activeConversation.id,
      messageId: message.id,
      rating,
    }).catch((error) => {
      console.log('[CompanionChat] Failed to save response feedback:', error);
      setResponseFeedback(prev => {
        const next = { ...prev };
        delete next[message.id];
        return next;
      });
    });
  }, [activeConversation]);

  useEffect(() => {
    const safeMessages = Array.isArray(activeConversation?.messages) ? activeConversation.messages : [];
    if (safeMessages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [activeConversation?.messages]);

  const messages = Array.isArray(activeConversation?.messages) ? activeConversation.messages : [];
  const hasMessages = messages.length > 0;
  const hasMemoryData = (memoryProfile?.recentCheckInCount ?? 0) > 0;
  const contextSuggestions = useMemo(() => buildContextSuggestions(messages), [messages]);

  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'assistant') return messages[i].id;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const renderMessage = useCallback(({ item }: { item: AIMessage }) => {
    return (
      <MessageBubble
        message={item}
        isLastAssistant={item.id === lastAssistantId}
        onQuickAction={handleQuickAction}
        conversationId={activeConversation?.id ?? null}
        isSavedInsight={savedInsightMessageIds.has(item.id)}
        feedback={responseFeedback[item.id]}
        onSaveInsight={handleSaveInsight}
        onRateResponse={handleRateResponse}
      />
    );
  }, [lastAssistantId, handleQuickAction, activeConversation?.id, savedInsightMessageIds, responseFeedback, handleSaveInsight, handleRateResponse]);

  const renderEmpty = useCallback(() => {
    return <EmptyState onPrompt={handlePrompt} />;
  }, [handlePrompt]);

  const keyExtractor = useCallback((item: AIMessage) => item.id, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitleText} numberOfLines={1}>
                {activeConversation?.title || 'New Chat'}
              </Text>
              {currentModeConfig ? (
                <View style={[styles.memoryIndicator, { gap: 4 }]}>
                  <Text style={{ fontSize: 9 }}>{currentModeConfig.icon}</Text>
                  <Text style={[styles.memoryIndicatorText, { color: currentModeConfig.color }]}>
                    {currentModeConfig.label}
                  </Text>
                </View>
              ) : hasMemoryData ? (
                <View style={styles.memoryIndicator}>
                  <Brain size={10} color={Colors.primary} />
                  <Text style={styles.memoryIndicatorText}>Memory active</Text>
                </View>
              ) : null}
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} testID="chat-back-btn">
              <ArrowLeft size={22} color={Colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerBtn} testID="chat-menu-btn">
              <MoreVertical size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ChatMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNewChat={handleNewChat}
        onDelete={handleDelete}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {latestSafetyAssessment?.level === 'crisis' && (
          <View style={styles.safetyContextBanner}>
            <Shield size={16} color={Colors.danger} />
            <View style={styles.safetyContextTextWrap}>
              <Text style={styles.safetyContextTitle}>Immediate support may help</Text>
              <Text style={styles.safetyContextText}>
                If you may hurt yourself or someone else, contact local emergency services or a crisis line now.
              </Text>
            </View>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.messagesList,
            !hasMessages && styles.messagesListEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (hasMessages) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          keyboardDismissMode="interactive"
        />

        {isGenerating && <TypingIndicator />}

        {hasMessages && !isGenerating && contextSuggestions.length > 0 && (
          <View style={styles.contextChipsContainer}>
            <FlatList
              horizontal
              data={contextSuggestions}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contextChipsContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contextChip}
                  onPress={() => handlePrompt(item.prompt)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.contextChipText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <View style={styles.inputBar}>
          {aiLimitReached && (
            <View style={styles.aiLimitCard} testID="companion-limit-card">
              <View style={styles.aiLimitHeader}>
                <Crown size={18} color={Colors.primary} />
                <Text style={styles.aiLimitTitle}>You’ve used today’s 5 free Companion messages.</Text>
              </View>
              <Text style={styles.aiLimitBody}>Start membership for unlimited Companion support.</Text>
              <View style={styles.aiLimitActions}>
                <TouchableOpacity
                  style={styles.aiLimitUpgradeButton}
                  onPress={() => router.push({ pathname: '/upgrade', params: { anchor: 'unlimited_ai' } } as never)}
                  activeOpacity={0.82}
                  testID="companion-limit-upgrade"
                >
                  <Text style={styles.aiLimitUpgradeText}>Start membership</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.aiLimitTomorrowButton}
                  onPress={() => router.back()}
                  activeOpacity={0.76}
                  testID="companion-limit-tomorrow"
                >
                  <Text style={styles.aiLimitTomorrowText}>Come back tomorrow</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {!isPremium && !aiLimitReached && remainingAIMessages !== null && remainingAIMessages <= 2 && (
            <View style={styles.aiRemainingBanner}>
              <Text style={styles.aiRemainingText}>
                {remainingAIMessages} message{remainingAIMessages !== 1 ? 's' : ''} remaining today
              </Text>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Share what's on your mind..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={2000}
              testID="chat-input"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={!isGenerating && !aiLimitReached}
            />
            {speechInput.isAvailable && (
              <TouchableOpacity
                style={[
                  styles.micButton,
                  speechInput.isListening && styles.micButtonListening,
                  isGenerating && styles.micButtonDisabled,
                ]}
                onPress={handleMicPress}
                disabled={isGenerating}
                activeOpacity={0.74}
                testID="companion-mic-button"
                accessibilityRole="button"
                accessibilityLabel={speechInput.isListening ? 'Stop voice input' : 'Start voice input'}
                accessibilityState={{ selected: speechInput.isListening, disabled: isGenerating }}
              >
                {speechInput.isListening ? (
                  <Square size={15} color={Colors.white} />
                ) : (
                  <Mic size={17} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isGenerating || aiLimitReached) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isGenerating || aiLimitReached}
              activeOpacity={0.7}
              testID="send-btn"
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Send size={17} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
          {!hasMessages && (
            <Text style={styles.inputHelperText}>
              Everything here is private and supportive
            </Text>
          )}
          {speechInput.message && (
            <Text
              style={[
                styles.speechStatusText,
                speechInput.status === 'error' && styles.speechStatusError,
              ]}
              testID="companion-speech-status"
            >
              {speechInput.message}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerTitleContainer: {
    alignItems: 'center' as const,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    maxWidth: 200,
  },
  memoryIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    marginTop: 2,
  },
  memoryIndicatorText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  headerBtn: {
    padding: 6,
  },
  keyboardView: {
    flex: 1,
  },
  safetyContextBanner: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.18)',
  },
  safetyContextTextWrap: {
    flex: 1,
  },
  safetyContextTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '900' as const,
    marginBottom: 3,
  },
  safetyContextText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  personalContextStrip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
  },
  personalContextStripText: {
    flex: 1,
    color: Colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700' as const,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  messagesListEmpty: {
    flexGrow: 1,
    justifyContent: 'center' as const,
  },
  messageBubbleWrapper: {
    marginBottom: 6,
    maxWidth: '85%' as const,
  },
  userBubbleWrapper: {
    alignSelf: 'flex-end' as const,
    alignItems: 'flex-end' as const,
    marginBottom: 16,
  },
  assistantBubbleWrapper: {
    alignSelf: 'flex-start' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },
  assistantAvatarRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginBottom: 6,
    paddingLeft: 2,
  },
  assistantAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  assistantLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  messageTimeInline: {
    fontSize: 10,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 23,
  },
  userText: {
    color: Colors.white,
  },
  assistantText: {
    color: Colors.text,
  },
  formattedMessage: {
    gap: 10,
  },
  formattedBlock: {
    gap: 5,
  },
  formattedSectionTitle: {
    color: Colors.primary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900' as const,
    marginBottom: 1,
  },
  formattedBullet: {
    paddingLeft: 2,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  userTime: {
    color: Colors.textMuted,
  },
  quickActionsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 10,
    paddingLeft: 2,
  },
  quickActionChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(107, 144, 128, 0.2)',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.primaryDark,
  },
  responseLearningRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 8,
    paddingLeft: 2,
  },
  responseLearningButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  responseLearningButtonActive: {
    backgroundColor: '#ECFDF5',
    borderColor: 'rgba(5, 150, 105, 0.28)',
  },
  responseLearningText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800' as const,
  },
  responseLearningTextActive: {
    color: Colors.success,
  },
  responseLearningHint: {
    color: Colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700' as const,
    maxWidth: 220,
  },
  responseFeedbackLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    marginLeft: 2,
  },
  feedbackIconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  feedbackIconButtonActive: {
    backgroundColor: '#ECFDF5',
    borderColor: 'rgba(5, 150, 105, 0.28)',
  },
  feedbackIconButtonMuted: {
    backgroundColor: '#FEF2F2',
    borderColor: 'rgba(220, 38, 38, 0.22)',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingLabel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingLeft: 4,
    marginBottom: 6,
  },
  typingLabelText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  typingBubble: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignSelf: 'flex-start' as const,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  inputBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 10,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  inputRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
  micButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  micButtonListening: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  micButtonDisabled: {
    opacity: 0.45,
  },
  inputHelperText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    marginTop: 8,
    marginBottom: 2,
  },
  speechStatusText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 7,
  },
  speechStatusError: {
    color: Colors.danger,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIconOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(107, 144, 128, 0.08)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyEmoji: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
    marginBottom: 20,
  },
  emptyDivider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  emptyDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  emptyDividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: 12,
  },
  emptyPrompts: {
    width: '100%',
    gap: 7,
  },
  emptyPromptChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.card,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyPromptIcon: {
    fontSize: 16,
  },
  emptyPromptText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  menuOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menuContainer: {
    position: 'absolute' as const,
    top: Platform.OS === 'ios' ? 100 : 56,
    right: 16,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 6,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 101,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 12,
  },
  modeSelectorContainer: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 2,
    backgroundColor: Colors.background,
  },
  modeIndicatorPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    gap: 5,
    backgroundColor: Colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  modeIndicatorIcon: {
    fontSize: 12,
  },
  modeIndicatorLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  modeIndicatorLabelDefault: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  modeManualDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginLeft: 2,
  },
  modeChipsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 8,
    paddingBottom: 4,
  },
  modeChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    backgroundColor: Colors.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modeChipIcon: {
    fontSize: 13,
  },
  modeChipLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  modeClearChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeClearText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  contextChipsContainer: {
    paddingTop: 6,
    paddingBottom: 2,
    backgroundColor: Colors.background,
  },
  contextChipsContent: {
    paddingHorizontal: 14,
    gap: 6,
  },
  contextChip: {
    backgroundColor: Colors.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  contextChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  aiLimitCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  aiLimitHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  aiLimitTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900' as const,
    color: Colors.text,
    lineHeight: 19,
  },
  aiLimitBody: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  aiLimitActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 10,
  },
  aiLimitUpgradeButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 10,
  },
  aiLimitUpgradeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '900' as const,
  },
  aiLimitTomorrowButton: {
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 12,
  },
  aiLimitTomorrowText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '800' as const,
  },
  aiRemainingBanner: {
    alignItems: 'center' as const,
    paddingVertical: 6,
    marginBottom: 4,
  },
  aiRemainingText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
