import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Clipboard,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Copy,
  Check,
  MessageSquareText,
  Save,
  Shield,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useApp } from '@/providers/AppProvider';
import { useAICompanion } from '@/providers/AICompanionProvider';
import {
  analyzeDontSendItMessage,
  DONT_SEND_IT_OUTCOME_LABELS,
  DONT_SEND_IT_INSTRUCTION_LABELS,
  DONT_SEND_IT_RECIPIENT_LABELS,
  DONT_SEND_IT_RISK_LABELS,
  DontSendItAnalysis,
  DontSendItDesiredOutcome,
  DontSendItRewriteInstruction,
  DontSendItRewriteOption,
  DontSendItRecipient,
} from '@/services/messages/dontSendItService';
import { trackEvent } from '@/services/analytics/analyticsService';

const RECIPIENT_OPTIONS: DontSendItRecipient[] = [
  'partner',
  'parent',
  'friend',
  'ex',
  'coworker',
  'other',
];

const OUTCOME_OPTIONS: DontSendItDesiredOutcome[] = [
  'express_hurt',
  'set_boundary',
  'start_conversation',
  'get_response',
  'end_relationship',
  'vent_only',
];

const INSTRUCTION_OPTIONS: DontSendItRewriteInstruction[] = [
  'more_direct',
  'less_direct',
  'more_compassionate',
  'more_assertive',
  'shorter',
  'longer',
];

const WAITING_OPTIONS = ['5 min', '20 min', '1 hour', 'Tomorrow'] as const;

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function DontSendItScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { addMessageDraft, triggerPatterns } = useApp();
  const { conversations, companionMemorySystem, companionContextSummary } = useAICompanion();
  const params = useLocalSearchParams<{ draft?: string }>();
  const [message, setMessage] = useState(params.draft ?? '');
  const [recipient, setRecipient] = useState<DontSendItRecipient>('partner');
  const [desiredOutcome, setDesiredOutcome] = useState<DontSendItDesiredOutcome | null>(null);
  const [rewriteInstruction, setRewriteInstruction] = useState<DontSendItRewriteInstruction | null>(null);
  const [analysis, setAnalysis] = useState<DontSendItAnalysis | null>(null);
  const [copiedOptionId, setCopiedOptionId] = useState<string | null>(null);
  const [savedOptionId, setSavedOptionId] = useState<string | null>(null);

  const canAnalyze = message.trim().length >= 3 && desiredOutcome !== null;
  const intensityColor = useMemo(() => {
    if (!analysis) return colors.primary;
    if (analysis.emotionalIntensity >= 7) return colors.danger;
    if (analysis.emotionalIntensity >= 5) return colors.accent;
    return colors.success;
  }, [analysis, colors]);

  const handleAnalyze = useCallback(() => {
    if (!canAnalyze) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const result = analyzeDontSendItMessage(message, {
      recipient,
      desiredOutcome: desiredOutcome ?? undefined,
      rewriteInstruction,
      previousConversationTexts: conversations.slice(0, 5).map(conversation =>
        conversation.messages.slice(-4).map(item => item.content).join(' '),
      ),
      emotionalTimelineSummaries: companionMemorySystem.emotionalTimeline.slice(0, 5).map(item =>
        [item.trigger, item.emotion, item.fear, item.urge, item.action, item.outcome].filter(Boolean).join(' -> '),
      ),
      abandonmentFears: companionMemorySystem.coreFears.map(item => item.label),
      rejectionPatterns: companionMemorySystem.recurringPatterns.map(item => item.label).filter(label =>
        /reject|ignored|unwanted|abandon/i.test(label),
      ),
      relationshipPatterns: [
        ...companionMemorySystem.recurringLoops.map(loop => `${loop.trigger} -> ${loop.emotion} -> ${loop.urge}`),
        ...companionContextSummary.commonPatterns,
      ],
      recentTriggers: [
        ...companionContextSummary.recentTriggers,
        ...Object.entries(triggerPatterns.triggerCounts).sort((a, b) => b[1] - a[1]).map(([label]) => label).slice(0, 3),
      ],
      recentEmotions: [
        ...companionContextSummary.recentEmotions,
        ...Object.entries(triggerPatterns.emotionCounts).sort((a, b) => b[1] - a[1]).map(([label]) => label).slice(0, 3),
      ],
    });
    setAnalysis(result);
    setCopiedOptionId(null);
    setSavedOptionId(null);
    void trackEvent('dont_send_it_analyzed', {
      intensity: result.emotionalIntensity,
      reactive: result.appearsReactive,
      impulsivity_risk: result.impulsivityRisk,
      recipient,
      desired_outcome: desiredOutcome,
      waiting_period: result.suggestedWaitingPeriod,
    });
  }, [canAnalyze, companionContextSummary, companionMemorySystem, conversations, desiredOutcome, message, recipient, rewriteInstruction, triggerPatterns]);

  const handleCopy = useCallback((option: DontSendItRewriteOption) => {
    Clipboard.setString(option.text);
    setCopiedOptionId(option.id);
    void trackEvent('dont_send_it_copied', {
      intensity: analysis?.emotionalIntensity ?? 0,
      impulsivity_risk: analysis?.impulsivityRisk ?? 'unknown',
      option: option.id,
    });
  }, [analysis]);

  const handleSaveDraft = useCallback((option: DontSendItRewriteOption) => {
    if (!analysis) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    addMessageDraft({
      id: `dont_send_${Date.now()}`,
      timestamp: Date.now(),
      originalText: message.trim(),
      rewrittenText: option.text,
      rewriteType: 'nosend',
      sent: false,
      paused: true,
      outcome: 'not_sent',
      outcomeTimestamp: Date.now(),
    });
    setSavedOptionId(option.id);
    void trackEvent('dont_send_it_saved_draft', {
      intensity: analysis.emotionalIntensity,
      impulsivity_risk: analysis.impulsivityRisk,
      waiting_period: analysis.suggestedWaitingPeriod,
      option: option.id,
    });
  }, [addMessageDraft, analysis, message]);

  const handleDiscuss = useCallback(() => {
    if (!analysis) return;
    const prompt = [
      'I used Don’t Send It and want to talk through this before I respond.',
      '',
      `Original message: ${message.trim()}`,
      '',
      `Emotional intensity: ${analysis.emotionalIntensity}/10`,
      `Likely emotional state: ${analysis.likelyEmotionalState}`,
      `Impulsivity risk: ${DONT_SEND_IT_RISK_LABELS[analysis.impulsivityRisk]}`,
      `Why: ${analysis.impulsivityReason}`,
      `Who this is for: ${DONT_SEND_IT_RECIPIENT_LABELS[recipient]}`,
      `Desired outcome: ${desiredOutcome ? DONT_SEND_IT_OUTCOME_LABELS[desiredOutcome] : 'Not selected'}`,
      `Pattern check: ${analysis.patternCheck.join(' ')}`,
      '',
      `Rewrite options: ${analysis.rewriteOptions.map(option => `${option.label}: ${option.text}`).join(' | ')}`,
      `Waiting suggestion: ${analysis.suggestedWaitingPeriod}`,
      '',
      'Please help me understand what I actually need and whether I should wait before sending anything.',
    ].join('\n');
    void trackEvent('dont_send_it_discuss_companion', {
      intensity: analysis.emotionalIntensity,
      impulsivity_risk: analysis.impulsivityRisk,
    });
    router.push({
      pathname: '/(tabs)/companion/chat',
      params: { initialMessage: prompt },
    } as never);
  }, [analysis, desiredOutcome, message, recipient, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
            onPress={() => router.back()}
            activeOpacity={0.75}
            testID="dont-send-back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>Don’t Send It</Text>
            <Text style={[styles.title, { color: colors.text }]}>Pause before you send</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Paste the message. We’ll help you clarify the outcome you want and respond from a steadier place.
            </Text>
          </View>
        </View>

        <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
          <View style={styles.inputHeader}>
            <View style={[styles.inputIcon, { backgroundColor: colors.primaryLight }]}>
              <MessageSquareText size={20} color={colors.primary} />
            </View>
            <Text style={[styles.inputTitle, { color: colors.text }]}>Paste the message here</Text>
          </View>
          <TextInput
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              setAnalysis(null);
            }}
            placeholder="Paste the message here..."
            placeholderTextColor={colors.textMuted}
            style={[
              styles.messageInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                color: colors.text,
              },
            ]}
            multiline
            textAlignVertical="top"
            maxLength={2500}
            testID="dont-send-input"
          />

          <Text style={[styles.choiceLabel, { color: colors.text }]}>Who is this for?</Text>
          <View style={styles.typeSelector}>
            {RECIPIENT_OPTIONS.map((option) => {
              const selected = recipient === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => {
                    setRecipient(option);
                    setAnalysis(null);
                  }}
                  activeOpacity={0.78}
                  testID={`dont-send-recipient-${option}`}
                >
                  <Text style={[styles.typeChipText, { color: selected ? Colors.white : colors.textSecondary }]}>
                    {DONT_SEND_IT_RECIPIENT_LABELS[option]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.choiceLabel, { color: colors.text }]}>What outcome do you actually want?</Text>
          <View style={styles.typeSelector}>
            {OUTCOME_OPTIONS.map((option) => {
              const selected = desiredOutcome === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => {
                    setDesiredOutcome(option);
                    setAnalysis(null);
                  }}
                  activeOpacity={0.78}
                  testID={`dont-send-outcome-${option}`}
                >
                  <Text style={[styles.typeChipText, { color: selected ? Colors.white : colors.textSecondary }]}>
                    {DONT_SEND_IT_OUTCOME_LABELS[option]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!desiredOutcome ? (
            <Text style={[styles.outcomeHint, { color: colors.textSecondary }]}>
              Choose the outcome first so the rewrite can be emotionally regulated and effective.
            </Text>
          ) : null}

          <Text style={[styles.choiceLabel, { color: colors.text }]}>Adjust the rewrite (optional)</Text>
          <View style={styles.typeSelector}>
            {INSTRUCTION_OPTIONS.map((option) => {
              const selected = rewriteInstruction === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: selected ? colors.brandTeal : colors.surface,
                      borderColor: selected ? colors.brandTeal : colors.borderLight,
                    },
                  ]}
                  onPress={() => {
                    setRewriteInstruction(selected ? null : option);
                    setAnalysis(null);
                  }}
                  activeOpacity={0.78}
                  testID={`dont-send-instruction-${option}`}
                >
                  <Text style={[styles.typeChipText, { color: selected ? Colors.white : colors.textSecondary }]}>
                    {DONT_SEND_IT_INSTRUCTION_LABELS[option]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: canAnalyze ? colors.primary : colors.border }]}
            onPress={handleAnalyze}
            disabled={!canAnalyze}
            activeOpacity={0.86}
            testID="dont-send-analyze"
          >
            <Shield size={17} color={Colors.white} />
            <Text style={styles.primaryButtonText}>Analyze before sending</Text>
          </TouchableOpacity>
          <Text style={[styles.noBlockText, { color: colors.textSecondary }]}>
            This will never block you from sending. It gives you a pause, a pattern check, and a calmer option.
          </Text>
        </View>

        {analysis ? (
          <View style={styles.results}>
            <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <View style={[styles.scoreBadge, { backgroundColor: `${intensityColor}22` }]}>
                <Text style={[styles.scoreNumber, { color: intensityColor }]}>{analysis.emotionalIntensity}/10</Text>
              </View>
              <View style={styles.scoreTextWrap}>
                <Text style={[styles.scoreTitle, { color: colors.text }]}>
                  {analysis.appearsReactive ? 'This may be reactive' : 'This looks mostly grounded'}
                </Text>
                <Text style={[styles.scoreBody, { color: colors.textSecondary }]}>
                  Likely emotional state: {analysis.likelyEmotionalState} · Impulsivity risk: {DONT_SEND_IT_RISK_LABELS[analysis.impulsivityRisk]}
                </Text>
              </View>
            </View>

            <SectionCard title="💙 What I’m noticing">
              <Text style={[styles.rewriteText, { color: colors.text }]}>{analysis.whatImHearing}</Text>
            </SectionCard>

            <SectionCard title="🔥 Emotion intensity">
              <View style={styles.bulletRow}>
                <Sparkles size={14} color={intensityColor} />
                <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                  Estimated at {analysis.emotionalIntensity}/10. Likely emotional state: {analysis.likelyEmotionalState}.
                </Text>
              </View>
            </SectionCard>

            <SectionCard title="Why this risk level">
              <Text style={[styles.rewriteText, { color: colors.text }]}>{analysis.impulsivityReason}</Text>
              {analysis.riskSignals.length > 0 ? (
                <View style={styles.signalList}>
                  {analysis.riskSignals.map((signal) => (
                    <View key={signal} style={[styles.signalPill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                      <Text style={[styles.signalText, { color: colors.textSecondary }]}>{signal}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </SectionCard>

            <SectionCard title="⚠️ Possible consequences">
              {analysis.possibleConsequences.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <AlertTriangle size={14} color={colors.accent} />
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </SectionCard>

            <SectionCard title="🔍 Pattern check">
              {analysis.patternCheck.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <Sparkles size={14} color={colors.brandTeal} />
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </SectionCard>

            <SectionCard title="What I’m noticing">
              {analysis.whatImNoticing.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <Sparkles size={14} color={colors.brandTeal} />
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </SectionCard>

            <SectionCard title="✏️ Calmer versions">
              <View style={styles.rewriteOptions}>
                {analysis.rewriteOptions.map((option) => {
                  const copied = copiedOptionId === option.id;
                  const saved = savedOptionId === option.id;
                  return (
                    <View
                      key={option.id}
                      style={[styles.rewriteOptionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                    >
                      <Text style={[styles.rewriteOptionTitle, { color: colors.text }]}>{option.label}</Text>
                      <Text style={[styles.rewriteOptionDesc, { color: colors.textSecondary }]}>{option.description}</Text>
                      <Text style={[styles.rewriteText, { color: colors.text }]}>{option.text}</Text>
                      <View style={styles.rewriteOptionActions}>
                        <TouchableOpacity
                          style={[styles.optionCopyButton, { backgroundColor: colors.primary }]}
                          onPress={() => handleCopy(option)}
                          activeOpacity={0.84}
                          testID={`dont-send-copy-${option.id}`}
                        >
                          {copied ? <Check size={15} color={Colors.white} /> : <Copy size={15} color={Colors.white} />}
                          <Text style={styles.optionCopyText}>{copied ? 'Copied' : '📋 Copy Version'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.optionSaveButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                          onPress={() => handleSaveDraft(option)}
                          activeOpacity={0.82}
                          testID={`dont-send-save-${option.id}`}
                        >
                          {saved ? <Check size={15} color={colors.primary} /> : <Save size={15} color={colors.primary} />}
                          <Text style={[styles.optionSaveText, { color: colors.primary }]}>{saved ? 'Saved' : 'Save paused draft'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
              <Text style={[styles.saveExplanation, { color: colors.textSecondary }]}>
                Save paused draft stores the original and selected rewrite as not sent so you can review it later in message history.
              </Text>
            </SectionCard>

            <SectionCard title="⏳ Waiting suggestion">
              <View style={styles.waitingRow}>
                {WAITING_OPTIONS.map((option) => {
                  const selected = analysis.suggestedWaitingPeriod === option;
                  return (
                    <View
                      key={option}
                      style={[
                        styles.waitingChip,
                        {
                          backgroundColor: selected ? colors.primaryLight : colors.surface,
                          borderColor: selected ? colors.primary : colors.borderLight,
                        },
                      ]}
                    >
                      <Text style={[styles.waitingChipText, { color: selected ? colors.primary : colors.textSecondary }]}>
                        {option}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={[styles.bulletRow, { marginTop: 12 }]}>
                <Clock size={15} color={colors.primary} />
                <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{analysis.waitingSuggestion}</Text>
              </View>
            </SectionCard>

            <View style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <TouchableOpacity
                style={[styles.resultActionButton, { backgroundColor: colors.primary }]}
                onPress={handleDiscuss}
                activeOpacity={0.84}
                testID="dont-send-discuss"
              >
                <Sparkles size={16} color={Colors.white} />
                <Text style={styles.resultActionPrimaryText}>Discuss with Companion</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 7,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  inputCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 12,
  },
  inputIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  typeChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '900',
  },
  choiceLabel: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
    marginBottom: 9,
  },
  outcomeHint: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: -2,
    marginBottom: 12,
  },
  messageInput: {
    minHeight: 170,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  noBlockText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  results: {
    gap: 12,
  },
  scoreCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  scoreTextWrap: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  scoreBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 11,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 9,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  rewriteText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
  },
  signalList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  signalPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  signalText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  rewriteOptions: {
    gap: 10,
  },
  rewriteOptionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    gap: 7,
  },
  rewriteOptionTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  rewriteOptionDesc: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  rewriteOptionActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  optionCopyButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  optionCopyText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  optionSaveButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  optionSaveText: {
    fontSize: 12,
    fontWeight: '900',
  },
  saveExplanation: {
    marginTop: 11,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  waitingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  waitingChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  waitingChipText: {
    fontSize: 12,
    fontWeight: '900',
  },
  actionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  resultActionButton: {
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  resultActionPrimaryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
