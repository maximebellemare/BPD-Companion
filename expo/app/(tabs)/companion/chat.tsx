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
import { Stack, useRouter } from 'expo-router';
import {
  Send,
  Bookmark,
  BookmarkCheck,
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { AIMessage } from '@/types/ai';
import { AIMode } from '@/types/aiModes';
import { getManualModeOptions, getModeConfig } from '@/services/ai/aiModeService';

const STARTER_CHIPS = [
  { id: 's1', label: 'I feel abandoned right now', icon: '💔', prompt: 'I feel abandoned right now and I need support' },
  { id: 's2', label: 'Help me slow down', icon: '🌊', prompt: 'Help me slow down, everything feels overwhelming right now' },
  { id: 's3', label: 'I want to text and I\'m not calm', icon: '📱', prompt: 'I want to send a message and I\'m not calm right now. Help me pause.' },
  { id: 's4', label: 'I feel ashamed and overwhelmed', icon: '😔', prompt: 'I feel deeply ashamed and overwhelmed right now' },
  { id: 's5', label: 'Am I overreacting?', icon: '🤔', prompt: 'I can\'t tell if I\'m overreacting to something that happened' },
  { id: 's6', label: 'Help me understand what I need', icon: '🔍', prompt: 'Help me understand what I actually need right now' },
];

interface QuickActionConfig {
  icon: React.ReactNode;
  route?: string;
  message?: string;
}

const QUICK_ACTION_CONFIG: Record<string, QuickActionConfig> = {
  'Ground me': { icon: <Wind size={13} color={Colors.primary} />, route: '/exercise?id=c1' },
  'Show coping tools': { icon: <Compass size={13} color={Colors.primary} />, route: '/(tabs)/tools' },
  'Journal this': { icon: <PenLine size={13} color={Colors.primary} />, route: '/(tabs)/journal' },
  'Help me rewrite a message': { icon: <MessageSquareText size={13} color={Colors.primary} />, route: '/(tabs)/messages' },
  'Slow this down': { icon: <Wind size={13} color={Colors.primary} />, message: 'I need to slow this down. Can we take it one small step at a time?' },
  'Safety mode': { icon: <Shield size={13} color={Colors.danger} />, route: '/safety-mode' },
  'Reflection': { icon: <PenLine size={13} color={Colors.primary} />, message: 'I want to reflect on what I\'m feeling right now. Can you help me explore this?' },
};

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
}

const MessageBubble = React.memo(({ message, isLastAssistant, onQuickAction }: MessageBubbleProps) => {
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
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>
      </View>
      {isUser && (
        <Text style={[styles.messageTime, styles.userTime]}>{timeStr}</Text>
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
      <Text style={styles.emptyTitle}>This is your safe space</Text>
      <Text style={styles.emptySubtitle}>
        Share what's on your mind. I'm here to listen{'\n'}without judgment, and everything stays private.
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
  onSave,
  onDelete,
  isSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSave: () => void;
  onDelete: () => void;
  isSaved: boolean;
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
        <TouchableOpacity style={styles.menuItem} onPress={() => { onSave(); onClose(); }}>
          {isSaved ? <BookmarkCheck size={16} color={Colors.primary} /> : <Bookmark size={16} color={Colors.text} />}
          <Text style={styles.menuItemText}>{isSaved ? 'Saved' : 'Save conversation'}</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
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
  const {
    activeConversation,
    isGenerating,
    memoryProfile,
    sendMessage,
    toggleSaveConversation,
    startNewConversation,
    deleteConversation,
    manualMode,
    currentActiveMode,
    currentModeConfig,
    setMode,
  } = useAICompanion();

  const [inputText, setInputText] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isGenerating) return;

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setInputText('');
    await sendMessage(text);
  }, [inputText, isGenerating, sendMessage]);

  const handleNewChat = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    startNewConversation();
  }, [startNewConversation]);

  const handleSave = useCallback(() => {
    if (!activeConversation) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleSaveConversation(activeConversation.id);
  }, [activeConversation, toggleSaveConversation]);

  const handleDelete = useCallback(() => {
    if (!activeConversation) return;
    deleteConversation(activeConversation.id);
    router.back();
  }, [activeConversation, deleteConversation, router]);

  const handlePrompt = useCallback(async (prompt: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await sendMessage(prompt);
  }, [sendMessage]);

  const handleQuickAction = useCallback((action: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const config = QUICK_ACTION_CONFIG[action];

    if (config?.message) {
      void sendMessage(config.message);
      return;
    }

    if (config?.route) {
      router.push(config.route as never);
      return;
    }

    void sendMessage(action);
  }, [sendMessage, router]);

  useEffect(() => {
    if (activeConversation?.messages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [activeConversation?.messages.length]);

  const messages = activeConversation?.messages ?? [];
  const isSaved = activeConversation?.saved ?? false;
  const hasMessages = messages.length > 0;
  const hasMemoryData = memoryProfile.recentCheckInCount > 0;

  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id;
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
      />
    );
  }, [lastAssistantId, handleQuickAction]);

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
        onSave={handleSave}
        onDelete={handleDelete}
        isSaved={isSaved}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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

        <ModeSelector
          activeMode={currentActiveMode}
          manualMode={manualMode}
          onSelectMode={setMode}
          visible={hasMessages}
        />

        <View style={styles.inputBar}>
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
              editable={!isGenerating}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isGenerating) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isGenerating}
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
  inputHelperText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    marginTop: 8,
    marginBottom: 2,
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
});
