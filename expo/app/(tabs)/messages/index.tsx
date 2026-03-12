import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Pause,
  Feather,
  Target,
  ShieldCheck,
  XCircle,
  Clock,
  MessageSquare,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { MessageDraft } from '@/types';

type RewriteType = 'softer' | 'clearer' | 'boundary' | 'nosend';

interface RewriteOption {
  type: RewriteType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const REWRITE_OPTIONS: RewriteOption[] = [
  {
    type: 'softer',
    label: 'Softer',
    desc: 'Same message, gentler delivery',
    icon: <Feather size={18} color={Colors.primary} />,
    color: Colors.primaryLight,
  },
  {
    type: 'clearer',
    label: 'Clearer',
    desc: 'Direct without blame',
    icon: <Target size={18} color={Colors.accent} />,
    color: Colors.accentLight,
  },
  {
    type: 'boundary',
    label: 'Boundary',
    desc: 'Set a firm, kind limit',
    icon: <ShieldCheck size={18} color="#5B8FB9" />,
    color: '#E3EFF7',
  },
  {
    type: 'nosend',
    label: "Don't Send",
    desc: 'Write it out, let it go',
    icon: <XCircle size={18} color={Colors.danger} />,
    color: Colors.dangerLight,
  },
];

function rewriteMessage(original: string, type: RewriteType): string {
  const cleaned = original.trim();
  if (!cleaned) return '';

  switch (type) {
    case 'softer':
      return `I want to share how I'm feeling, and I hope we can talk about it. ${cleaned.replace(/!/g, '.').replace(/you always/gi, 'sometimes I feel like').replace(/you never/gi, 'I wish I could see more of')} I care about us, and I want to work through this together.`;
    case 'clearer':
      return `I need to be honest about something. ${cleaned.replace(/!/g, '.').replace(/you always/gi, 'I notice a pattern where').replace(/you never/gi, "I'd appreciate it if")} Can we talk about this?`;
    case 'boundary':
      return `I need to set a boundary here. ${cleaned.replace(/!/g, '.').replace(/you always/gi, 'When this happens,').replace(/you never/gi, 'I need')} This is important to me, and I hope you can understand.`;
    case 'nosend':
      return `[Not sent — written for yourself]\n\n${cleaned}\n\n---\nYou wrote this down. That took courage. You don't need to send it to process it.`;
    default:
      return cleaned;
  }
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const { messageDrafts, addMessageDraft } = useApp();
  const [inputText, setInputText] = useState<string>('');
  const [selectedType, setSelectedType] = useState<RewriteType | null>(null);
  const [currentDraft, setCurrentDraft] = useState<MessageDraft | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleRewrite = useCallback((type: RewriteType) => {
    if (!inputText.trim()) return;

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const rewritten = rewriteMessage(inputText, type);
    const draft: MessageDraft = {
      id: `m_${Date.now()}`,
      timestamp: Date.now(),
      originalText: inputText,
      rewrittenText: rewritten,
      rewriteType: type,
      sent: false,
      paused: type === 'nosend',
    };

    setSelectedType(type);
    setCurrentDraft(draft);
    setShowResult(true);
    addMessageDraft(draft);

    Animated.spring(resultAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [inputText, addMessageDraft, resultAnim]);

  const handlePause = useCallback(() => {
    if (!inputText.trim()) return;

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const draft: MessageDraft = {
      id: `m_${Date.now()}`,
      timestamp: Date.now(),
      originalText: inputText,
      sent: false,
      paused: true,
    };

    addMessageDraft(draft);
    setInputText('');
  }, [inputText, addMessageDraft]);

  const handleNewMessage = useCallback(() => {
    setInputText('');
    setSelectedType(null);
    setCurrentDraft(null);
    setShowResult(false);
    resultAnim.setValue(0);
  }, [resultAnim]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Message Tool</Text>
            <Text style={styles.subtitle}>Pause before you send. Rewrite with care.</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!showResult ? (
              <>
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>
                    What do you want to say?
                  </Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Type the message you're thinking of sending..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    value={inputText}
                    onChangeText={setInputText}
                    textAlignVertical="top"
                  />
                </View>

                {inputText.trim().length > 0 && (
                  <View style={styles.actionsSection}>
                    <Text style={styles.actionsLabel}>How would you like to handle this?</Text>

                    <View style={styles.optionGrid}>
                      {REWRITE_OPTIONS.map(option => (
                        <TouchableOpacity
                          key={option.type}
                          style={styles.optionCard}
                          onPress={() => handleRewrite(option.type)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                            {option.icon}
                          </View>
                          <Text style={styles.optionLabel}>{option.label}</Text>
                          <Text style={styles.optionDesc}>{option.desc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.pauseButton}
                      onPress={handlePause}
                      activeOpacity={0.7}
                    >
                      <Pause size={18} color={Colors.accent} />
                      <Text style={styles.pauseText}>
                        Just pause it — save for later
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {messageDrafts.length > 0 && (
                  <View style={styles.historySection}>
                    <Text style={styles.historyTitle}>Recent</Text>
                    {messageDrafts.slice(0, 5).map(draft => (
                      <View key={draft.id} style={styles.historyCard}>
                        <View style={styles.historyHeader}>
                          <View style={styles.historyMeta}>
                            <Clock size={12} color={Colors.textMuted} />
                            <Text style={styles.historyTime}>{formatTimestamp(draft.timestamp)}</Text>
                          </View>
                          {draft.rewriteType && (
                            <View style={styles.historyBadge}>
                              <Text style={styles.historyBadgeText}>{draft.rewriteType}</Text>
                            </View>
                          )}
                          {draft.paused && !draft.rewriteType && (
                            <View style={[styles.historyBadge, { backgroundColor: Colors.accentLight }]}>
                              <Text style={[styles.historyBadgeText, { color: Colors.accent }]}>paused</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.historyOriginal} numberOfLines={2}>
                          {draft.originalText}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <Animated.View
                style={{
                  opacity: resultAnim,
                  transform: [
                    {
                      translateY: resultAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                }}
              >
                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>
                    {selectedType === 'nosend' ? 'Written but not sent' : 'Rewritten version'}
                  </Text>
                  <Text style={styles.resultText}>
                    {currentDraft?.rewrittenText}
                  </Text>
                </View>

                <View style={styles.originalCard}>
                  <Text style={styles.originalLabel}>Your original</Text>
                  <Text style={styles.originalText}>{currentDraft?.originalText}</Text>
                </View>

                <TouchableOpacity
                  style={styles.newMessageButton}
                  onPress={handleNewMessage}
                  activeOpacity={0.7}
                >
                  <MessageSquare size={18} color={Colors.white} />
                  <Text style={styles.newMessageText}>New message</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  messageInput: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: Colors.text,
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: Colors.border,
    lineHeight: 24,
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionsLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    width: '48%' as unknown as number,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  pauseText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.accent,
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  historyBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  historyOriginal: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  originalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  originalLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  originalText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  newMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  newMessageText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
