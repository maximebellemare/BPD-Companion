import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  ChevronRight,
  Sparkles,
  Check,
  Shield,
  Archive,
  BarChart3,
  Compass,
  Eye,
  Pause,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { useMessageRewrite } from '@/hooks/useMessageRewrite';
import CoachingNudgeBanner from '@/components/CoachingNudgeBanner';
import SpiralMessageBanner from '@/components/SpiralMessageBanner';
import ActiveLoopBanner from '@/components/ActiveLoopBanner';
import { useMessageCoaching } from '@/hooks/useCoaching';
import { useRelationshipSpiral } from '@/hooks/useRelationshipSpiral';
import { useActiveLoops } from '@/hooks/useActiveLoops';
import {
  MessageContext,
  MESSAGE_OUTCOME_OPTIONS,
} from '@/types/messages';
import { REWRITE_STYLE_META } from '@/services/messages/messageRewriteService';
import {
  QUICK_ENTRY_CARDS,
  EMOTIONAL_STATE_OPTIONS,
  INTERPRETATION_OPTIONS,
  URGE_OPTIONS,
  DESIRED_OUTCOME_OPTIONS,
  EnhancedMessageContext,
  QuickEntrySituation,
} from '@/types/messageHealth';
import { analyzeMessageHealth } from '@/services/messages/messageHealthService';
import { saveToDraftVault } from '@/services/messages/messageOutcomeService';
import { classifyMessageSafety } from '@/services/messages/messageSafetyClassifier';
import { generateSafeRewrites, buildDoNotSendRecommendation } from '@/services/messages/messageRiskScoringService';
import { MessageSafetyClassification, SafeRewrite, DoNotSendRecommendation } from '@/types/messageRisk';
import { ShieldAlert, ShieldOff, BookOpen, Heart, Timer, AlertOctagon, Leaf, Lightbulb, MessageCircle } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { getEnhancedOutcomes } from '@/services/messages/enhancedOutcomeService';
import { createOutcomeRecord, saveEnhancedOutcome } from '@/services/messages/enhancedOutcomeService';
import { generateWhatHelpedReminder } from '@/services/messages/communicationProfileService';
import { getTopInsightsForHome } from '@/services/messages/enhancedLearningService';
import OutcomeCaptureSheet from '@/components/OutcomeCaptureSheet';
import { EnhancedMessageOutcome, WhatHelpedReminder, CommunicationInsight } from '@/types/messageOutcome';
import { useEntitlements } from '@/hooks/useEntitlements';
import { PremiumBadge } from '@/components/PremiumGate';
import { trackEvent } from '@/services/analytics/analyticsService';

type ContextKey = keyof MessageContext;

type MainView = 'home' | 'flow';
type FlowStep = 'situation' | 'draft' | 'emotion' | 'interpretation' | 'urge' | 'outcome' | 'analysis';

const FLOW_STEPS: FlowStep[] = ['situation', 'draft', 'emotion', 'interpretation', 'urge', 'outcome', 'analysis'];
const FLOW_LABELS: Record<FlowStep, string> = {
  situation: 'Context',
  draft: 'Message',
  emotion: 'Feeling',
  interpretation: 'Meaning',
  urge: 'Urge',
  outcome: 'Goal',
  analysis: 'Insight',
};

function FlowStepIndicator({ currentStep }: { currentStep: FlowStep }) {
  const currentIndex = FLOW_STEPS.indexOf(currentStep);
  const visibleSteps = FLOW_STEPS.slice(0, Math.min(FLOW_STEPS.length, 5));

  return (
    <View style={styles.flowStepBar}>
      {visibleSteps.map((s, i) => {
        const isActive = FLOW_STEPS.indexOf(s) === currentIndex;
        const isCompleted = FLOW_STEPS.indexOf(s) < currentIndex;
        return (
          <View key={s} style={styles.flowStepItem}>
            <View
              style={[
                styles.flowStepDot,
                isActive && styles.flowStepDotActive,
                isCompleted && styles.flowStepDotCompleted,
              ]}
            />
            {i < visibleSteps.length - 1 && (
              <View style={[styles.flowStepLine, isCompleted && styles.flowStepLineCompleted]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

interface FlowChipOption<T extends string> {
  value: T;
  label: string;
  emoji: string;
}

function FlowChips<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: FlowChipOption<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.flowChipRow}>
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.flowChip, isSelected && styles.flowChipSelected]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(opt.value);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.flowChipEmoji}>{opt.emoji}</Text>
            <Text style={[styles.flowChipLabel, isSelected && styles.flowChipLabelSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { messageDrafts } = useApp();
  const messageRewrite = useMessageRewrite();
  const messageCoachingNudge = useMessageCoaching();
  const relationshipSpiral = useRelationshipSpiral();
  const activeLoops = useActiveLoops();
  const {
    isPremium,
    canAccess,
    rewriteLimitReached,
    remainingRewrites,
    trackRewriteUsage,
  } = useEntitlements();

  const [mainView, setMainView] = useState<MainView>('home');
  const [flowStep, setFlowStep] = useState<FlowStep>('situation');
  const [enhancedContext, setEnhancedContext] = useState<EnhancedMessageContext>({
    situation: '',
    draft: '',
    emotionalState: null,
    interpretation: null,
    urge: null,
    desiredOutcome: null,
  });

  const [coachingDismissed, setCoachingDismissed] = useState<boolean>(false);
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void trackEvent('screen_view', { screen: 'messages' });
  }, []);

  const animateTransition = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 12,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    animateTransition();
  }, [flowStep, mainView, animateTransition]);

  const healthAnalysis = useMemo(() => {
    if (enhancedContext.draft.trim().length < 5) return null;
    return analyzeMessageHealth(enhancedContext.draft, enhancedContext);
  }, [enhancedContext]);

  const safetyClassification = useMemo<MessageSafetyClassification | null>(() => {
    if (enhancedContext.draft.trim().length < 5) return null;
    return classifyMessageSafety(enhancedContext.draft);
  }, [enhancedContext.draft]);

  const safeRewrites = useMemo<SafeRewrite[]>(() => {
    if (!safetyClassification || safetyClassification.riskLevel === 'low') return [];
    return generateSafeRewrites(enhancedContext.draft, safetyClassification, enhancedContext);
  }, [safetyClassification, enhancedContext]);

  const doNotSend = useMemo<DoNotSendRecommendation | null>(() => {
    if (!safetyClassification) return null;
    return buildDoNotSendRecommendation(safetyClassification);
  }, [safetyClassification]);

  const [showSafeRewrites, setShowSafeRewrites] = useState<boolean>(false);
  const [selectedSafeRewrite, setSelectedSafeRewrite] = useState<SafeRewrite | null>(null);
  const [showOutcomeCapture, setShowOutcomeCapture] = useState<boolean>(false);
  const [currentOutcomeRecord, setCurrentOutcomeRecord] = useState<EnhancedMessageOutcome | null>(null);

  const enhancedOutcomesQuery = useQuery({
    queryKey: ['enhanced-message-outcomes'],
    queryFn: getEnhancedOutcomes,
  });

  const enhancedOutcomes = useMemo(() => enhancedOutcomesQuery.data ?? [], [enhancedOutcomesQuery.data]);

  const whatHelpedReminder = useMemo<WhatHelpedReminder | null>(() => {
    if (mainView !== 'flow' || !enhancedContext.emotionalState) return null;
    return generateWhatHelpedReminder(
      enhancedOutcomes,
      enhancedContext.emotionalState,
      enhancedContext.urge,
    );
  }, [enhancedOutcomes, enhancedContext.emotionalState, enhancedContext.urge, mainView]);

  const homeInsights = useMemo<CommunicationInsight[]>(() => {
    return getTopInsightsForHome(enhancedOutcomes, 2);
  }, [enhancedOutcomes]);

  const startFlow = useCallback((situation?: QuickEntrySituation) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const card = situation ? QUICK_ENTRY_CARDS.find(c => c.id === situation) : null;
    setEnhancedContext({
      situation: '',
      draft: '',
      emotionalState: card?.defaultEmotion ?? null,
      interpretation: null,
      urge: null,
      desiredOutcome: null,
    });

    if (situation === 'calm_before_reply') {
      setMainView('flow');
      setFlowStep('situation');
    } else {
      setMainView('flow');
      setFlowStep('situation');
    }
  }, []);

  const goToFlowStep = useCallback((step: FlowStep) => {
    setFlowStep(step);
  }, []);

  const goBackFlow = useCallback(() => {
    const idx = FLOW_STEPS.indexOf(flowStep);
    if (idx <= 0) {
      setMainView('home');
      return;
    }
    setFlowStep(FLOW_STEPS[idx - 1]);
  }, [flowStep]);

  const goNextFlow = useCallback(() => {
    const idx = FLOW_STEPS.indexOf(flowStep);
    if (idx < FLOW_STEPS.length - 1) {
      setFlowStep(FLOW_STEPS[idx + 1]);
    }
  }, [flowStep]);

  const handleSaveToVault = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveToDraftVault({
      id: `v_${Date.now()}`,
      timestamp: Date.now(),
      originalText: enhancedContext.draft,
      rewrittenText: null,
      rewriteStyle: null,
      situation: enhancedContext.situation,
      emotionalState: enhancedContext.emotionalState,
      reason: 'saved_for_later',
      reviewed: false,
      reviewNotes: null,
      notSendingHelped: null,
    });
  }, [enhancedContext]);

  const navigateToAnalysis = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/message-analysis',
      params: {
        draft: enhancedContext.draft,
        situation: enhancedContext.situation,
        emotionalState: enhancedContext.emotionalState ?? '',
        interpretation: enhancedContext.interpretation ?? '',
        urge: enhancedContext.urge ?? '',
        desiredOutcome: enhancedContext.desiredOutcome ?? '',
      },
    } as never);
  }, [enhancedContext, router]);

  const saveAndTriggerOutcome = useCallback(async () => {
    const record = createOutcomeRecord({
      originalDraft: enhancedContext.draft,
      emotionalState: enhancedContext.emotionalState,
      interpretation: enhancedContext.interpretation,
      urge: enhancedContext.urge,
      desiredOutcome: enhancedContext.desiredOutcome,
      riskLevel: safetyClassification?.riskLevel ?? null,
      sourceFlow: 'message_flow',
    });
    await saveEnhancedOutcome(record);
    setCurrentOutcomeRecord(record);
    setShowOutcomeCapture(true);
    console.log('[Messages] Outcome record created:', record.id);
  }, [enhancedContext, safetyClassification]);

  const navigateToSecureRewrite = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void saveAndTriggerOutcome();
    router.push({
      pathname: '/secure-rewrite',
      params: {
        draft: enhancedContext.draft,
        situation: enhancedContext.situation,
        emotionalState: enhancedContext.emotionalState ?? '',
        interpretation: enhancedContext.interpretation ?? '',
        urge: enhancedContext.urge ?? '',
        desiredOutcome: enhancedContext.desiredOutcome ?? '',
        distressLevel: '5',
        relationshipContext: '',
      },
    } as never);
  }, [enhancedContext, router, saveAndTriggerOutcome]);

  const navigateToSimulation = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void saveAndTriggerOutcome();
    router.push({
      pathname: '/message-simulation',
      params: {
        draft: enhancedContext.draft,
        situation: enhancedContext.situation,
        emotionalState: enhancedContext.emotionalState ?? '',
        interpretation: enhancedContext.interpretation ?? '',
        urge: enhancedContext.urge ?? '',
        desiredOutcome: enhancedContext.desiredOutcome ?? '',
        riskLevel: safetyClassification?.riskLevel ?? '',
      },
    } as never);
  }, [enhancedContext, router, safetyClassification, saveAndTriggerOutcome]);

  const proceedToLegacyRewrites = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    messageRewrite.setInputText(enhancedContext.draft);
    const emotionMap: Record<string, string> = {
      angry: 'angry',
      hurt: 'hurt',
      anxious: 'anxious',
      ashamed: 'ashamed',
      rejected: 'abandoned',
      overwhelmed: 'confused',
      confused: 'confused',
      calm_unsure: 'numb',
    };
    if (enhancedContext.emotionalState) {
      messageRewrite.updateContext('emotionalState' as ContextKey, (emotionMap[enhancedContext.emotionalState] ?? null) as never);
    }
    setMainView('home');
    messageRewrite.proceedToContext();
  }, [enhancedContext, messageRewrite]);

  const renderHome = () => (
    <>
      <View style={styles.heroSection}>
        <View style={styles.heroIconRow}>
          <View style={styles.heroIconBadge}>
            <Shield size={20} color={Colors.white} />
          </View>
          <Text style={styles.heroTitle}>Message Safety</Text>
        </View>
        <Text style={styles.heroSubtitle}>
          Decide whether to send, understand what you feel, and communicate with clarity.
        </Text>
      </View>

      <View style={styles.quickEntrySection}>
        <Text style={styles.sectionLabel}>What's happening?</Text>
        <View style={styles.quickEntryGrid}>
          {QUICK_ENTRY_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[styles.quickEntryCard, { borderLeftColor: card.color }]}
              onPress={() => startFlow(card.id)}
              activeOpacity={0.7}
              testID={`quick-entry-${card.id}`}
            >
              <Text style={styles.quickEntryEmoji}>{card.emoji}</Text>
              <View style={styles.quickEntryTextWrap}>
                <Text style={styles.quickEntryLabel}>{card.label}</Text>
                <Text style={styles.quickEntrySub}>{card.subtitle}</Text>
              </View>
              <ChevronRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeLoops.length > 0 && (
        <ActiveLoopBanner signals={activeLoops} />
      )}

      {relationshipSpiral.isActive && relationshipSpiral.messageIntervention && (
        <SpiralMessageBanner
          message={relationshipSpiral.messageIntervention}
          riskLevel={relationshipSpiral.riskLevel === 'calm' ? 'watchful' : relationshipSpiral.riskLevel}
        />
      )}

      {messageCoachingNudge && !coachingDismissed && (
        <CoachingNudgeBanner
          nudge={messageCoachingNudge}
          onDismiss={() => setCoachingDismissed(true)}
          compact
        />
      )}

      <View style={styles.toolStrip}>
        <TouchableOpacity
          style={styles.toolStripCard}
          onPress={() => router.push('/draft-vault' as never)}
          activeOpacity={0.7}
          testID="draft-vault-btn"
        >
          <View style={[styles.toolStripIcon, { backgroundColor: '#9B8EC4' + '18' }]}>
            <Archive size={16} color="#9B8EC4" />
          </View>
          <Text style={styles.toolStripLabel}>Draft Vault</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolStripCard}
          onPress={() => {
            if (!isPremium) {
              router.push('/upgrade' as never);
            } else {
              router.push('/communication-patterns' as never);
            }
          }}
          activeOpacity={0.7}
          testID="patterns-btn"
        >
          <View style={[styles.toolStripIcon, { backgroundColor: Colors.primary + '18' }]}>
            <BarChart3 size={16} color={Colors.primary} />
          </View>
          <View style={styles.toolStripLabelRow}>
            <Text style={styles.toolStripLabel}>My Patterns</Text>
            {!isPremium && <PremiumBadge />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolStripCard}
          onPress={() => {
            if (!isPremium) {
              router.push('/upgrade' as never);
            } else {
              router.push('/communication-playbook' as never);
            }
          }}
          activeOpacity={0.7}
          testID="playbook-btn"
        >
          <View style={[styles.toolStripIcon, { backgroundColor: Colors.brandSage + '18' }]}>
            <BookOpen size={16} color={Colors.brandSage} />
          </View>
          <View style={styles.toolStripLabelRow}>
            <Text style={styles.toolStripLabel}>Playbook</Text>
            {!isPremium && <PremiumBadge />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolStripCard}
          onPress={() => router.push('/message-guard' as never)}
          activeOpacity={0.7}
          testID="guard-btn"
        >
          <View style={[styles.toolStripIcon, { backgroundColor: '#5B8FB9' + '18' }]}>
            <Eye size={16} color="#5B8FB9" />
          </View>
          <Text style={styles.toolStripLabel}>Guard</Text>
        </TouchableOpacity>
      </View>

      {homeInsights.length > 0 && homeInsights[0].id !== 'getting_started' && (
        <View style={styles.homeInsightsSection}>
          <View style={styles.homeInsightsHeader}>
            <Lightbulb size={14} color={Colors.accent} />
            <Text style={styles.homeInsightsTitle}>From your patterns</Text>
          </View>
          {homeInsights.map((insight) => (
            <TouchableOpacity
              key={insight.id}
              style={styles.homeInsightCard}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/communication-patterns' as never);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.homeInsightEmoji}>{insight.emoji}</Text>
              <Text style={styles.homeInsightText} numberOfLines={2}>{insight.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {messageDrafts.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionLabel}>Recent</Text>
          {messageDrafts.slice(0, 4).map(draft => (
            <TouchableOpacity
              key={draft.id}
              style={[styles.historyCard, expandedDraftId === draft.id && styles.historyCardExpanded]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setExpandedDraftId(expandedDraftId === draft.id ? null : draft.id);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.historyHeader}>
                <View style={styles.historyMeta}>
                  <Clock size={11} color={Colors.textMuted} />
                  <Text style={styles.historyTime}>{formatTimestamp(draft.timestamp)}</Text>
                </View>
                {draft.rewriteType && (
                  <View style={[
                    styles.historyBadge,
                    { backgroundColor: (REWRITE_STYLE_META[draft.rewriteType as keyof typeof REWRITE_STYLE_META]?.color ?? Colors.primary) + '18' },
                  ]}>
                    <Text style={[
                      styles.historyBadgeText,
                      { color: REWRITE_STYLE_META[draft.rewriteType as keyof typeof REWRITE_STYLE_META]?.color ?? Colors.primary },
                    ]}>
                      {REWRITE_STYLE_META[draft.rewriteType as keyof typeof REWRITE_STYLE_META]?.emoji ?? ''}{' '}
                      {REWRITE_STYLE_META[draft.rewriteType as keyof typeof REWRITE_STYLE_META]?.label ?? draft.rewriteType}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.historyOriginal} numberOfLines={expandedDraftId === draft.id ? undefined : 2}>
                {draft.originalText}
              </Text>
              {expandedDraftId === draft.id && draft.rewrittenText && (
                <View style={styles.historyRewriteSection}>
                  <View style={styles.historyDivider} />
                  <Text style={styles.historyRewriteLabel}>Rewritten</Text>
                  <Text style={styles.historyRewriteText}>
                    {draft.rewrittenText.replace(/\[.*?\]\n\n/, '').replace(/\n---\n.*/, '')}
                  </Text>
                </View>
              )}
              {expandedDraftId === draft.id && draft.outcome && (
                <View style={styles.historyOutcomeRow}>
                  <Text style={styles.historyOutcomeLabel}>Outcome:</Text>
                  <View style={[
                    styles.historyOutcomeBadge,
                    { backgroundColor: (MESSAGE_OUTCOME_OPTIONS.find(o => o.value === draft.outcome)?.color ?? Colors.primary) + '18' },
                  ]}>
                    <Text style={styles.historyOutcomeEmoji}>
                      {MESSAGE_OUTCOME_OPTIONS.find(o => o.value === draft.outcome)?.emoji ?? ''}
                    </Text>
                    <Text style={[
                      styles.historyOutcomeText,
                      { color: MESSAGE_OUTCOME_OPTIONS.find(o => o.value === draft.outcome)?.color ?? Colors.primary },
                    ]}>
                      {MESSAGE_OUTCOME_OPTIONS.find(o => o.value === draft.outcome)?.label ?? draft.outcome}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  const renderFlowSituation = () => (
    <View style={styles.flowSection}>
      <Text style={styles.flowQuestion}>What happened?</Text>
      <Text style={styles.flowHint}>Briefly describe the situation. This helps generate better insights.</Text>
      <TextInput
        style={styles.flowTextInput}
        placeholder="e.g. They haven't replied in 3 hours and I'm spiraling..."
        placeholderTextColor={Colors.textMuted}
        multiline
        value={enhancedContext.situation}
        onChangeText={(text) => setEnhancedContext(prev => ({ ...prev, situation: text }))}
        textAlignVertical="top"
        testID="situation-input"
      />
      <TouchableOpacity
        style={[styles.flowNextBtn, !enhancedContext.situation.trim() && styles.flowNextBtnDisabled]}
        onPress={goNextFlow}
        activeOpacity={0.8}
        disabled={!enhancedContext.situation.trim()}
        testID="next-situation"
      >
        <Text style={styles.flowNextBtnText}>Next</Text>
        <ChevronRight size={16} color={Colors.white} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.flowSkipBtn} onPress={goNextFlow} activeOpacity={0.7}>
        <Text style={styles.flowSkipText}>Skip this step</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFlowDraft = () => (
    <View style={styles.flowSection}>
      <Text style={styles.flowQuestion}>What do you want to say?</Text>
      <Text style={styles.flowHint}>Write the message you're thinking of sending — raw and unfiltered is okay.</Text>
      <TextInput
        style={[styles.flowTextInput, { minHeight: 120 }]}
        placeholder="Type your message here..."
        placeholderTextColor={Colors.textMuted}
        multiline
        value={enhancedContext.draft}
        onChangeText={(text) => setEnhancedContext(prev => ({ ...prev, draft: text }))}
        textAlignVertical="top"
        testID="draft-input"
      />
      {enhancedContext.draft.trim().length > 0 && (
        <Text style={styles.charCount}>{enhancedContext.draft.length} characters</Text>
      )}
      <TouchableOpacity
        style={[styles.flowNextBtn, !enhancedContext.draft.trim() && styles.flowNextBtnDisabled]}
        onPress={goNextFlow}
        activeOpacity={0.8}
        disabled={!enhancedContext.draft.trim()}
        testID="next-draft"
      >
        <Text style={styles.flowNextBtnText}>Next</Text>
        <ChevronRight size={16} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderFlowEmotion = () => (
    <View style={styles.flowSection}>
      <Text style={styles.flowQuestion}>How are you feeling?</Text>
      <Text style={styles.flowHint}>Your emotional state shapes how messages come across.</Text>
      {whatHelpedReminder && (
        <View style={styles.whatHelpedBanner}>
          <Text style={styles.whatHelpedEmoji}>{whatHelpedReminder.emoji}</Text>
          <Text style={styles.whatHelpedText}>{whatHelpedReminder.text}</Text>
        </View>
      )}
      <FlowChips
        options={EMOTIONAL_STATE_OPTIONS}
        selected={enhancedContext.emotionalState}
        onSelect={(v) => setEnhancedContext(prev => ({ ...prev, emotionalState: v }))}
      />
      <TouchableOpacity
        style={[styles.flowNextBtn, !enhancedContext.emotionalState && styles.flowNextBtnDisabled]}
        onPress={goNextFlow}
        activeOpacity={0.8}
        disabled={!enhancedContext.emotionalState}
        testID="next-emotion"
      >
        <Text style={styles.flowNextBtnText}>Next</Text>
        <ChevronRight size={16} color={Colors.white} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.flowSkipBtn} onPress={goNextFlow} activeOpacity={0.7}>
        <Text style={styles.flowSkipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFlowInterpretation = () => (
    <View style={styles.flowSection}>
      <Text style={styles.flowQuestion}>What do you think this means?</Text>
      <Text style={styles.flowHint}>Our interpretation of a situation often drives the message more than what actually happened.</Text>
      <FlowChips
        options={INTERPRETATION_OPTIONS}
        selected={enhancedContext.interpretation}
        onSelect={(v) => setEnhancedContext(prev => ({ ...prev, interpretation: v }))}
      />
      <TouchableOpacity
        style={[styles.flowNextBtn, !enhancedContext.interpretation && styles.flowNextBtnDisabled]}
        onPress={goNextFlow}
        activeOpacity={0.8}
        disabled={!enhancedContext.interpretation}
        testID="next-interpretation"
      >
        <Text style={styles.flowNextBtnText}>Next</Text>
        <ChevronRight size={16} color={Colors.white} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.flowSkipBtn} onPress={goNextFlow} activeOpacity={0.7}>
        <Text style={styles.flowSkipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFlowUrge = () => (
    <View style={styles.flowSection}>
      <Text style={styles.flowQuestion}>What's your strongest urge?</Text>
      <Text style={styles.flowHint}>Naming the urge creates space between feeling and acting.</Text>
      <FlowChips
        options={URGE_OPTIONS}
        selected={enhancedContext.urge}
        onSelect={(v) => setEnhancedContext(prev => ({ ...prev, urge: v }))}
      />
      <TouchableOpacity
        style={[styles.flowNextBtn, !enhancedContext.urge && styles.flowNextBtnDisabled]}
        onPress={goNextFlow}
        activeOpacity={0.8}
        disabled={!enhancedContext.urge}
        testID="next-urge"
      >
        <Text style={styles.flowNextBtnText}>Next</Text>
        <ChevronRight size={16} color={Colors.white} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.flowSkipBtn} onPress={goNextFlow} activeOpacity={0.7}>
        <Text style={styles.flowSkipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFlowOutcome = () => (
    <View style={styles.flowSection}>
      <Text style={styles.flowQuestion}>What do you actually want?</Text>
      <Text style={styles.flowHint}>The real goal behind the message — not just the emotion.</Text>
      <FlowChips
        options={DESIRED_OUTCOME_OPTIONS}
        selected={enhancedContext.desiredOutcome}
        onSelect={(v) => setEnhancedContext(prev => ({ ...prev, desiredOutcome: v }))}
      />
      <TouchableOpacity
        style={[styles.flowNextBtn, !enhancedContext.desiredOutcome && styles.flowNextBtnDisabled]}
        onPress={goNextFlow}
        activeOpacity={0.8}
        disabled={!enhancedContext.desiredOutcome}
        testID="next-outcome"
      >
        <Text style={styles.flowNextBtnText}>See my analysis</Text>
        <Sparkles size={16} color={Colors.white} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.flowSkipBtn} onPress={goNextFlow} activeOpacity={0.7}>
        <Text style={styles.flowSkipText}>Skip to analysis</Text>
      </TouchableOpacity>
    </View>
  );

  const handleDoNotSendAction = useCallback((action: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switch (action) {
      case 'save_draft':
        void handleSaveToVault();
        break;
      case 'rewrite_boundary':
        setShowSafeRewrites(true);
        break;
      case 'pause':
        router.push('/grounding-mode' as never);
        break;
      case 'journal':
        router.push('/journal-entry' as never);
        break;
      case 'grounding':
        router.push('/grounding-mode' as never);
        break;
    }
  }, [handleSaveToVault, router]);

  const renderDoNotSendMode = () => {
    if (!doNotSend?.active) return null;
    return (
      <View style={styles.doNotSendContainer}>
        <View style={styles.doNotSendHeader}>
          <View style={styles.doNotSendIconWrap}>
            <ShieldAlert size={22} color={Colors.danger} />
          </View>
          <Text style={styles.doNotSendTitle}>Do Not Send Right Now</Text>
        </View>
        <Text style={styles.doNotSendReason}>{doNotSend.reason}</Text>
        <View style={styles.doNotSendConsequence}>
          <AlertOctagon size={14} color={Colors.accent} />
          <Text style={styles.doNotSendConsequenceText}>{doNotSend.likelyConsequence}</Text>
        </View>
        <Text style={styles.doNotSendOptionsLabel}>What you can do instead</Text>
        <View style={styles.doNotSendOptions}>
          {doNotSend.options.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={styles.doNotSendOption}
              onPress={() => handleDoNotSendAction(opt.action)}
              activeOpacity={0.7}
              testID={`dns-${opt.id}`}
            >
              <Text style={styles.doNotSendOptionEmoji}>{opt.emoji}</Text>
              <Text style={styles.doNotSendOptionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSafeRewrites = () => {
    if (safeRewrites.length === 0) return null;
    return (
      <View style={styles.safeRewritesSection}>
        <Text style={styles.safeRewritesTitle}>Safer alternatives</Text>
        <Text style={styles.safeRewritesHint}>These replace the original — they don't preserve harmful language.</Text>
        {safeRewrites.map((rw) => {
          const isSelected = selectedSafeRewrite?.type === rw.type;
          return (
            <TouchableOpacity
              key={rw.type}
              style={[
                styles.safeRewriteCard,
                { borderLeftColor: rw.color },
                isSelected && styles.safeRewriteCardSelected,
              ]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedSafeRewrite(isSelected ? null : rw);
              }}
              activeOpacity={0.7}
              testID={`safe-rw-${rw.type}`}
            >
              <View style={styles.safeRewriteHeader}>
                <Text style={styles.safeRewriteEmoji}>{rw.emoji}</Text>
                <Text style={[styles.safeRewriteLabel, { color: rw.color }]}>{rw.label}</Text>
                {rw.isRecommended && (
                  <View style={styles.recommendedBadge}>
                    <Heart size={10} color={Colors.success} />
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                )}
              </View>
              <Text style={styles.safeRewriteText} numberOfLines={isSelected ? undefined : 3}>{rw.text}</Text>
              {isSelected && (
                <View style={styles.safeRewriteWhySection}>
                  <Text style={styles.safeRewriteWhyLabel}>Why this helps</Text>
                  <Text style={styles.safeRewriteWhyText}>{rw.whyThisHelps}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderFlowAnalysis = () => {
    const analysis = healthAnalysis;
    const isSevere = safetyClassification?.riskLevel === 'severe';
    const isHigh = safetyClassification?.riskLevel === 'high';
    const isHighRisk = isSevere || isHigh;

    const recColors: Record<string, string> = {
      safe_to_send: Colors.success,
      better_after_pause: Colors.accent,
      better_rewritten: '#9B8EC4',
      better_not_sent: Colors.danger,
      do_not_send: Colors.dangerDark,
    };
    const recEmojis: Record<string, string> = {
      safe_to_send: '✅',
      better_after_pause: '⏳',
      better_rewritten: '✏️',
      better_not_sent: '🛑',
      do_not_send: '⛔',
    };

    return (
      <View style={styles.flowSection}>
        {analysis ? (
          <>
            {isHighRisk && safetyClassification?.flaggedContent && safetyClassification.flaggedContent.length > 0 && (
              <View style={styles.safetyWarningBanner}>
                <View style={styles.safetyWarningRow}>
                  <ShieldOff size={18} color={Colors.danger} />
                  <Text style={styles.safetyWarningTitle}>
                    {isSevere ? 'High-risk language detected' : 'Escalation risk detected'}
                  </Text>
                </View>
                <Text style={styles.safetyWarningText}>
                  {isSevere
                    ? 'This draft contains language that will almost certainly escalate conflict and cause regret. Your feelings are valid — but this version is not safe to send.'
                    : 'This draft has elements that could significantly escalate conflict. A calmer approach is recommended.'}
                </Text>
              </View>
            )}

            <View style={[styles.recCard, { borderLeftColor: recColors[analysis.recommendation] ?? Colors.primary }]}>
              <Text style={styles.recEmoji}>{recEmojis[analysis.recommendation] ?? '📋'}</Text>
              <View style={styles.recTextWrap}>
                <Text style={[styles.recTitle, { color: recColors[analysis.recommendation] ?? Colors.primary }]}>
                  {analysis.recommendationMessage}
                </Text>
                <Text style={styles.recDetail}>{analysis.recommendationDetail}</Text>
              </View>
            </View>

            {doNotSend?.active && renderDoNotSendMode()}

            {analysis.topConcerns.length > 0 && (
              <View style={styles.concernsSection}>
                <Text style={styles.concernsSectionTitle}>What we noticed</Text>
                {analysis.topConcerns.map((concern, i) => (
                  <View key={i} style={styles.concernCard}>
                    <View style={[styles.concernDot, {
                      backgroundColor: concern.level === 'high' ? Colors.danger : Colors.accent,
                    }]} />
                    <View style={styles.concernText}>
                      <Text style={styles.concernLabel}>{concern.label}</Text>
                      <Text style={styles.concernDesc}>{concern.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!isHighRisk && analysis.strengths.length > 0 && (
              <View style={styles.strengthsSection}>
                <Text style={styles.strengthsTitle}>Strengths</Text>
                <View style={styles.strengthsRow}>
                  {analysis.strengths.map((s, i) => (
                    <View key={i} style={styles.strengthBadge}>
                      <Check size={10} color={Colors.success} />
                      <Text style={styles.strengthText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {(isHighRisk || showSafeRewrites) && renderSafeRewrites()}

            <View style={styles.draftPreviewCard}>
              <Text style={styles.draftPreviewLabel}>Your message</Text>
              <Text style={styles.draftPreviewText} numberOfLines={3}>{enhancedContext.draft}</Text>
            </View>

            <View style={styles.analysisActions}>
              {!rewriteLimitReached && (
                <TouchableOpacity
                  style={[styles.analysisPrimaryBtn, { backgroundColor: Colors.brandSage }]}
                  onPress={() => {
                    if (canAccess('secure_rewrite')) {
                      void trackRewriteUsage();
                      navigateToSecureRewrite();
                    } else {
                      router.push('/upgrade' as never);
                    }
                  }}
                  activeOpacity={0.8}
                  testID="secure-rewrite-btn"
                >
                  <Leaf size={16} color={Colors.white} />
                  <Text style={styles.analysisPrimaryBtnText}>Secure Rewrite</Text>
                  {!canAccess('secure_rewrite') && <PremiumBadge />}
                </TouchableOpacity>
              )}
              {rewriteLimitReached && (
                <TouchableOpacity
                  style={[styles.analysisPrimaryBtn, { backgroundColor: Colors.brandNavy }]}
                  onPress={() => router.push('/upgrade' as never)}
                  activeOpacity={0.8}
                  testID="rewrite-limit-btn"
                >
                  <Sparkles size={16} color={Colors.white} />
                  <Text style={styles.analysisPrimaryBtnText}>Unlock Unlimited Rewrites</Text>
                </TouchableOpacity>
              )}
              {!isPremium && remainingRewrites !== null && remainingRewrites > 0 && (
                <Text style={styles.rewriteLimitText}>
                  {remainingRewrites} free rewrite{remainingRewrites !== 1 ? 's' : ''} remaining today
                </Text>
              )}

              {isHighRisk ? (
                <>
                  {!showSafeRewrites && (
                    <TouchableOpacity
                      style={styles.analysisSecondaryBtn}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setShowSafeRewrites(true);
                      }}
                      activeOpacity={0.7}
                      testID="show-safe-rewrites-btn"
                    >
                      <Shield size={14} color={Colors.brandSage} />
                      <Text style={[styles.analysisSecondaryBtnText, { color: Colors.brandSage }]}>See safer alternatives</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.analysisSecondaryBtn}
                    onPress={() => {
                      if (canAccess('message_simulation')) {
                        navigateToSimulation();
                      } else {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/upgrade' as never);
                      }
                    }}
                    activeOpacity={0.7}
                    testID="see-paths-btn"
                  >
                    <Compass size={14} color={Colors.primary} />
                    <Text style={styles.analysisSecondaryBtnText}>See response paths</Text>
                    {!canAccess('message_simulation') && <PremiumBadge />}
                  </TouchableOpacity>

                  <View style={styles.analysisBottomRow}>
                    <TouchableOpacity
                      style={styles.analysisSmallBtn}
                      onPress={handleSaveToVault}
                      activeOpacity={0.7}
                    >
                      <Archive size={13} color={Colors.textSecondary} />
                      <Text style={styles.analysisSmallBtnText}>Save to vault</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.analysisSmallBtn}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/grounding-mode' as never);
                      }}
                      activeOpacity={0.7}
                    >
                      <Timer size={13} color={Colors.textSecondary} />
                      <Text style={styles.analysisSmallBtnText}>Ground first</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.analysisSmallBtn}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/journal-entry' as never);
                      }}
                      activeOpacity={0.7}
                    >
                      <BookOpen size={13} color={Colors.textSecondary} />
                      <Text style={styles.analysisSmallBtnText}>Journal first</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.companionLinkBtn}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const prompt = `I'm about to send a message and I'm feeling ${enhancedContext.emotionalState ?? 'activated'}. The situation: ${enhancedContext.situation?.substring(0, 100) ?? 'communication difficulty'}. Can you help me process this before I decide?`;
                      router.push({ pathname: '/(tabs)/companion/chat', params: { prefill: prompt } } as never);
                    }}
                    activeOpacity={0.7}
                    testID="companion-link-btn"
                  >
                    <MessageCircle size={13} color={Colors.primary} />
                    <Text style={styles.companionLinkText}>Talk to Companion first</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.analysisSecondaryBtn}
                    onPress={() => {
                      if (canAccess('message_simulation')) {
                        navigateToSimulation();
                      } else {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/upgrade' as never);
                      }
                    }}
                    activeOpacity={0.7}
                    testID="see-paths-btn"
                  >
                    <Compass size={14} color={Colors.primary} />
                    <Text style={styles.analysisSecondaryBtnText}>See response paths</Text>
                    {!canAccess('message_simulation') && <PremiumBadge />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.analysisSecondaryBtn}
                    onPress={() => {
                      if (canAccess('message_health_scoring')) {
                        navigateToAnalysis();
                      } else {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/upgrade' as never);
                      }
                    }}
                    activeOpacity={0.7}
                    testID="full-analysis-btn"
                  >
                    <BarChart3 size={14} color={Colors.primary} />
                    <Text style={styles.analysisSecondaryBtnText}>Full health score</Text>
                    {!canAccess('message_health_scoring') && <PremiumBadge />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.analysisSecondaryBtn}
                    onPress={proceedToLegacyRewrites}
                    activeOpacity={0.7}
                    testID="rewrite-btn"
                  >
                    <Sparkles size={14} color={Colors.accent} />
                    <Text style={[styles.analysisSecondaryBtnText, { color: Colors.accent }]}>Other rewrite styles</Text>
                  </TouchableOpacity>

                  {safetyClassification?.riskLevel === 'medium' && (
                    <TouchableOpacity
                      style={styles.analysisSecondaryBtn}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowSafeRewrites(!showSafeRewrites);
                      }}
                      activeOpacity={0.7}
                      testID="safe-alts-btn"
                    >
                      <Shield size={14} color={Colors.brandSage} />
                      <Text style={[styles.analysisSecondaryBtnText, { color: Colors.brandSage }]}>
                        {showSafeRewrites ? 'Hide safer alternatives' : 'Safer alternatives'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.analysisBottomRow}>
                    <TouchableOpacity
                      style={styles.analysisSmallBtn}
                      onPress={handleSaveToVault}
                      activeOpacity={0.7}
                    >
                      <Archive size={13} color={Colors.textSecondary} />
                      <Text style={styles.analysisSmallBtnText}>Save to vault</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.analysisSmallBtn}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/grounding-mode' as never);
                      }}
                      activeOpacity={0.7}
                    >
                      <Pause size={13} color={Colors.textSecondary} />
                      <Text style={styles.analysisSmallBtnText}>Ground first</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.companionLinkBtn}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const prompt = `I just drafted a message while feeling ${enhancedContext.emotionalState ?? 'unsure'}. Can you help me think through whether to send it?`;
                      router.push({ pathname: '/(tabs)/companion/chat', params: { prefill: prompt } } as never);
                    }}
                    activeOpacity={0.7}
                    testID="companion-link-normal-btn"
                  >
                    <MessageCircle size={13} color={Colors.primary} />
                    <Text style={styles.companionLinkText}>Talk to Companion</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        ) : (
          <View style={styles.noAnalysis}>
            <Text style={styles.noAnalysisText}>Enter a message in step 2 to see your analysis.</Text>
            <TouchableOpacity
              style={styles.flowBackLink}
              onPress={() => goToFlowStep('draft')}
              activeOpacity={0.7}
            >
              <ArrowLeft size={14} color={Colors.primary} />
              <Text style={styles.flowBackLinkText}>Go back to write your message</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderFlowContent = () => {
    switch (flowStep) {
      case 'situation': return renderFlowSituation();
      case 'draft': return renderFlowDraft();
      case 'emotion': return renderFlowEmotion();
      case 'interpretation': return renderFlowInterpretation();
      case 'urge': return renderFlowUrge();
      case 'outcome': return renderFlowOutcome();
      case 'analysis': return renderFlowAnalysis();
      default: return null;
    }
  };

  const flowStepTitle = FLOW_LABELS[flowStep] ?? '';
  const flowStepNumber = FLOW_STEPS.indexOf(flowStep) + 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <View style={styles.header}>
          {mainView === 'flow' ? (
            <>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    goBackFlow();
                  }}
                  activeOpacity={0.7}
                  testID="flow-back-btn"
                >
                  <ArrowLeft size={18} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.flowHeaderTitle}>
                    Step {flowStepNumber} — {flowStepTitle}
                  </Text>
                </View>
              </View>
              <FlowStepIndicator currentStep={flowStep} />
            </>
          ) : (
            <View style={styles.headerRow}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>Messages</Text>
                <Text style={styles.subtitle}>Your communication safety system</Text>
              </View>
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {mainView === 'home' ? renderHome() : renderFlowContent()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showOutcomeCapture && currentOutcomeRecord && (
        <View style={styles.outcomeCaptureOverlay}>
          <OutcomeCaptureSheet
            outcomeRecord={currentOutcomeRecord}
            onComplete={() => {
              setShowOutcomeCapture(false);
              setCurrentOutcomeRecord(null);
              void enhancedOutcomesQuery.refetch();
            }}
            onDismiss={() => {
              setShowOutcomeCapture(false);
              setCurrentOutcomeRecord(null);
            }}
          />
        </View>
      )}
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  flowHeaderTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: Colors.brandNavy,
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
  },
  heroIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  heroIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 21,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  quickEntrySection: {
    marginBottom: 20,
  },
  quickEntryGrid: {
    gap: 8,
  },
  quickEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderLeftWidth: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  quickEntryEmoji: {
    fontSize: 22,
  },
  quickEntryTextWrap: {
    flex: 1,
  },
  quickEntryLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 1,
  },
  quickEntrySub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  toolStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  toolStripCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  toolStripIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolStripLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  toolStripLabelRow: {
    alignItems: 'center' as const,
    gap: 4,
  },
  rewriteLimitText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    marginTop: 6,
  },
  historySection: {
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  historyCardExpanded: {
    borderColor: Colors.primaryLight,
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
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  historyOriginal: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  historyRewriteSection: {
    marginTop: 8,
  },
  historyDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: 10,
  },
  historyRewriteLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  historyRewriteText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  historyOutcomeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 10,
  },
  historyOutcomeLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  historyOutcomeBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  historyOutcomeEmoji: {
    fontSize: 11,
  },
  historyOutcomeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  flowStepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  flowStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flowStepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
  },
  flowStepDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  flowStepDotCompleted: {
    backgroundColor: Colors.success,
  },
  flowStepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  flowStepLineCompleted: {
    backgroundColor: Colors.success,
  },
  flowSection: {
    paddingTop: 8,
  },
  flowQuestion: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  flowHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
  flowTextInput: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: Colors.border,
    lineHeight: 24,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: 8,
  },
  flowChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  flowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  flowChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  flowChipEmoji: {
    fontSize: 16,
  },
  flowChipLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  flowChipLabelSelected: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  flowNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  flowNextBtnDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  flowNextBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  flowSkipBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  flowSkipText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  recCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 4,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  recEmoji: {
    fontSize: 26,
    marginTop: 2,
  },
  recTextWrap: {
    flex: 1,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  recDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  concernsSection: {
    marginBottom: 16,
  },
  concernsSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  concernCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  concernDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  concernText: {
    flex: 1,
  },
  concernLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  concernDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  strengthsSection: {
    marginBottom: 16,
  },
  strengthsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  strengthsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  strengthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  strengthText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500' as const,
  },
  draftPreviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  draftPreviewLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  draftPreviewText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  analysisActions: {
    gap: 8,
  },
  analysisPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brandNavy,
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: Colors.brandNavy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  analysisPrimaryBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  analysisSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  analysisSecondaryBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  analysisBottomRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  analysisSmallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
  },
  analysisSmallBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  noAnalysis: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAnalysisText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  flowBackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flowBackLinkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  safetyWarningBanner: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  safetyWarningRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  safetyWarningTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dangerDark,
  },
  safetyWarningText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  doNotSendContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.danger + '40',
  },
  doNotSendHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 12,
  },
  doNotSendIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  doNotSendTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dangerDark,
  },
  doNotSendReason: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 12,
  },
  doNotSendConsequence: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  doNotSendConsequenceText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  doNotSendOptionsLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  doNotSendOptions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  doNotSendOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doNotSendOptionEmoji: {
    fontSize: 16,
  },
  doNotSendOptionLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  safeRewritesSection: {
    marginBottom: 16,
  },
  safeRewritesTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  safeRewritesHint: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    marginBottom: 12,
  },
  safeRewriteCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  safeRewriteCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  safeRewriteHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  safeRewriteEmoji: {
    fontSize: 18,
  },
  safeRewriteLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  recommendedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 'auto' as const,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  safeRewriteText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  safeRewriteWhySection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  safeRewriteWhyLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  safeRewriteWhyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  homeInsightsSection: {
    marginBottom: 20,
  },
  homeInsightsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 10,
  },
  homeInsightsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  homeInsightCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  homeInsightEmoji: {
    fontSize: 16,
  },
  homeInsightText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  whatHelpedBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  whatHelpedEmoji: {
    fontSize: 20,
  },
  whatHelpedText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryDark,
    lineHeight: 19,
    fontWeight: '500' as const,
  },
  outcomeCaptureOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(27,40,56,0.4)',
    justifyContent: 'center' as const,
    zIndex: 100,
  },
  companionLinkBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  companionLinkText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
});
