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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Heart,
  Info,
  Timer,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Shield,
  Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { useMessageRewrite } from '@/hooks/useMessageRewrite';
import {
  RELATIONSHIP_OPTIONS,
  EMOTIONAL_STATE_OPTIONS,
  INTENT_OPTIONS,
  OUTCOME_OPTIONS,
  PAUSE_DURATIONS,
  MessageContext,
  MESSAGE_OUTCOME_OPTIONS,
  MessageOutcome,
} from '@/types/messages';
import { REWRITE_STYLE_META } from '@/services/messages/messageRewriteService';

type ContextKey = keyof MessageContext;



const STEPS = ['input', 'context', 'pause', 'rewrites', 'result'] as const;
const STEP_LABELS: Record<string, string> = {
  input: 'Write',
  context: 'Context',
  pause: 'Pause',
  rewrites: 'Options',
  result: 'Done',
};

interface ChipOption<T extends string> {
  value: T;
  label: string;
  emoji: string;
}

function StepIndicator({ currentStep }: { currentStep: string }) {
  const visibleSteps = STEPS.filter(s => {
    if (currentStep === 'pause') return true;
    return s !== 'pause';
  });

  const currentIndex = visibleSteps.indexOf(currentStep as typeof visibleSteps[number]);

  return (
    <View style={styles.stepIndicator}>
      {visibleSteps.map((s, i) => {
        const isActive = i === currentIndex;
        const isCompleted = i < currentIndex;
        return (
          <View key={s} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                isActive && styles.stepDotActive,
                isCompleted && styles.stepDotCompleted,
              ]}
            >
              {isCompleted && <Check size={8} color={Colors.white} />}
            </View>
            <Text
              style={[
                styles.stepLabel,
                isActive && styles.stepLabelActive,
                isCompleted && styles.stepLabelCompleted,
              ]}
            >
              {STEP_LABELS[s]}
            </Text>
            {i < visibleSteps.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  isCompleted && styles.stepLineCompleted,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

function ContextChips<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: ChipOption<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  const scaleAnims = useRef(options.map(() => new Animated.Value(1))).current;

  const handlePress = useCallback((value: T, index: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
    onSelect(value);
  }, [onSelect, scaleAnims]);

  return (
    <View style={styles.chipRow}>
      {options.map((opt, index) => {
        const isSelected = selected === opt.value;
        return (
          <Animated.View
            key={opt.value}
            style={{ transform: [{ scale: scaleAnims[index] }] }}
          >
            <TouchableOpacity
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => handlePress(opt.value, index)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{opt.emoji}</Text>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          </Animated.View>
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

function formatPauseTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
  return `0:${s.toString().padStart(2, '0')}`;
}

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { messageDrafts } = useApp();
  const {
    inputText,
    setInputText,
    step,
    context,
    updateContext,
    rewrites,
    selectedRewrite,
    pauseRemaining,
    isPausing,
    triggerSuggestions,
    proceedToContext,
    proceedToRewrites,
    startPause,
    skipPause,
    finishPause,
    selectRewrite,
    recordOutcome,
    reset,
    goBack,
  } = useMessageRewrite();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [showPauseOptions, setShowPauseOptions] = useState<boolean>(false);
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);
  const [copiedRewriteStyle, setCopiedRewriteStyle] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<MessageOutcome | null>(null);
  const pauseExpandAnim = useRef(new Animated.Value(0)).current;
  const suggestionsExpandAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
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
  }, [step, animateTransition]);

  useEffect(() => {
    Animated.spring(pauseExpandAnim, {
      toValue: showPauseOptions ? 1 : 0,
      friction: 10,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [showPauseOptions, pauseExpandAnim]);

  useEffect(() => {
    Animated.spring(suggestionsExpandAnim, {
      toValue: showSuggestions ? 1 : 0,
      friction: 10,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [showSuggestions, suggestionsExpandAnim]);

  useEffect(() => {
    if (step === 'pause' && isPausing) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [step, isPausing, breatheAnim]);

  useEffect(() => {
    if (step === 'pause' && !isPausing && pauseRemaining === 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [step, isPausing, pauseRemaining, pulseAnim]);

  const handleCopyRewrite = useCallback((style: string, _text: string) => {
    setCopiedRewriteStyle(style);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedRewriteStyle(null), 2000);
  }, []);

  const togglePauseOptions = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPauseOptions(prev => !prev);
  }, []);

  const contextFilledCount = [
    context.relationship,
    context.emotionalState,
    context.intent,
    context.desiredOutcome,
  ].filter(Boolean).length;

  const renderInputStep = () => (
    <>
      <View style={styles.inputSection}>
        <View style={styles.inputHeaderRow}>
          <MessageSquare size={18} color={Colors.primary} />
          <Text style={styles.inputLabel}>What do you want to say?</Text>
        </View>
        <Text style={styles.inputHint}>
          Write the message you're thinking of sending — raw and unfiltered is okay here.
        </Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Type your message here..."
          placeholderTextColor={Colors.textMuted}
          multiline
          value={inputText}
          onChangeText={setInputText}
          textAlignVertical="top"
          testID="message-input"
        />
        {inputText.trim().length > 0 && (
          <Text style={styles.charCount}>{inputText.length} characters</Text>
        )}
      </View>

      {inputText.trim().length > 0 && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            proceedToContext();
          }}
          activeOpacity={0.8}
          testID="proceed-context-btn"
        >
          <Shield size={18} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Before you send...</Text>
          <ChevronRight size={18} color={Colors.white} />
        </TouchableOpacity>
      )}

      {triggerSuggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <TouchableOpacity
            style={styles.suggestionsToggle}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSuggestions(!showSuggestions);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.suggestionsIconBadge}>
              <Lightbulb size={14} color={Colors.accent} />
            </View>
            <Text style={styles.suggestionsToggleText}>Trigger-aware insights</Text>
            <Animated.View
              style={{
                transform: [{
                  rotate: suggestionsExpandAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                }],
              }}
            >
              <ChevronDown size={16} color={Colors.textMuted} />
            </Animated.View>
          </TouchableOpacity>

          {showSuggestions && (
            <View style={styles.suggestionsList}>
              {triggerSuggestions.map((s, i) => (
                <View key={i} style={styles.suggestionCard}>
                  <Text style={styles.suggestionLabel}>{s.label}</Text>
                  <Text style={styles.suggestionDesc}>{s.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.relInsightsBanner}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/relationship-insights');
        }}
        activeOpacity={0.7}
        testID="relationship-insights-btn"
      >
        <View style={styles.relInsightsBannerLeft}>
          <View style={styles.relInsightsBannerIcon}>
            <Users size={18} color={Colors.white} />
          </View>
          <View style={styles.relInsightsBannerText}>
            <Text style={styles.relInsightsBannerTitle}>Relationship Patterns</Text>
            <Text style={styles.relInsightsBannerDesc}>Understand how you connect</Text>
          </View>
        </View>
        <ChevronRight size={16} color={Colors.white} style={{ opacity: 0.7 }} />
      </TouchableOpacity>

      {messageDrafts.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent messages</Text>
          {messageDrafts.slice(0, 5).map(draft => {
            const isExpanded = expandedDraftId === draft.id;
            return (
              <TouchableOpacity
                key={draft.id}
                style={[styles.historyCard, isExpanded && styles.historyCardExpanded]}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setExpandedDraftId(isExpanded ? null : draft.id);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.historyHeader}>
                  <View style={styles.historyMeta}>
                    <Clock size={12} color={Colors.textMuted} />
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
                  {draft.paused && !draft.rewriteType && (
                    <View style={[styles.historyBadge, { backgroundColor: Colors.accentLight }]}>
                      <Text style={[styles.historyBadgeText, { color: Colors.accent }]}>⏸️ paused</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.historyOriginal} numberOfLines={isExpanded ? undefined : 2}>
                  {draft.originalText}
                </Text>
                {isExpanded && draft.rewrittenText && (
                  <View style={styles.historyRewriteSection}>
                    <View style={styles.historyDivider} />
                    <Text style={styles.historyRewriteLabel}>Rewritten as</Text>
                    <Text style={styles.historyRewriteText}>{draft.rewrittenText.replace(/\[.*?\]\n\n/, '').replace(/\n---\n.*/, '')}</Text>
                  </View>
                )}
                {isExpanded && draft.outcome && (
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
            );
          })}
        </View>
      )}
    </>
  );

  const renderContextStep = () => (
    <>
      <View style={styles.contextIntro}>
        <Heart size={18} color={Colors.primary} />
        <View style={styles.contextIntroContent}>
          <Text style={styles.contextIntroText}>
            A little context helps craft a more thoughtful response.
          </Text>
          <Text style={styles.contextProgress}>
            {contextFilledCount}/4 selected
          </Text>
        </View>
      </View>

      <View style={styles.contextPreview}>
        <Text style={styles.contextPreviewLabel}>Your message</Text>
        <Text style={styles.contextPreviewText} numberOfLines={3}>{inputText}</Text>
      </View>

      <View style={styles.contextSection}>
        <Text style={styles.contextLabel}>Who is this to?</Text>
        <ContextChips
          options={RELATIONSHIP_OPTIONS}
          selected={context.relationship}
          onSelect={(v) => updateContext('relationship' as ContextKey, v)}
        />
      </View>

      <View style={styles.contextSection}>
        <Text style={styles.contextLabel}>How are you feeling?</Text>
        <ContextChips
          options={EMOTIONAL_STATE_OPTIONS}
          selected={context.emotionalState}
          onSelect={(v) => updateContext('emotionalState' as ContextKey, v)}
        />
      </View>

      <View style={styles.contextSection}>
        <Text style={styles.contextLabel}>What's your intent?</Text>
        <ContextChips
          options={INTENT_OPTIONS}
          selected={context.intent}
          onSelect={(v) => updateContext('intent' as ContextKey, v)}
        />
      </View>

      <View style={styles.contextSection}>
        <Text style={styles.contextLabel}>What do you hope for?</Text>
        <ContextChips
          options={OUTCOME_OPTIONS}
          selected={context.desiredOutcome}
          onSelect={(v) => updateContext('desiredOutcome' as ContextKey, v)}
        />
      </View>

      <View style={styles.contextActions}>
        <TouchableOpacity
          style={[styles.pauseFirstButton, showPauseOptions && styles.pauseFirstButtonActive]}
          onPress={togglePauseOptions}
          activeOpacity={0.7}
        >
          <Timer size={16} color={showPauseOptions ? Colors.white : Colors.accent} />
          <Text style={[styles.pauseFirstText, showPauseOptions && styles.pauseFirstTextActive]}>
            {showPauseOptions ? 'Hide pause options' : 'Pause first'}
          </Text>
          <Animated.View
            style={{
              transform: [{
                rotate: pauseExpandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              }],
            }}
          >
            <ChevronDown size={14} color={showPauseOptions ? Colors.white : Colors.accent} />
          </Animated.View>
        </TouchableOpacity>

        {showPauseOptions && (
          <View style={styles.pauseOptions}>
            <Text style={styles.pauseOptionsHint}>
              Taking a moment before rewriting can help you respond from a calmer place.
            </Text>
            <View style={styles.pauseDurationRow}>
              {PAUSE_DURATIONS.map(pd => (
                <TouchableOpacity
                  key={pd.seconds}
                  style={styles.pauseDurationChip}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    startPause(pd.seconds);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pauseDurationLabel}>{pd.label}</Text>
                  <Text style={styles.pauseDurationDesc}>{pd.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            proceedToRewrites();
          }}
          activeOpacity={0.8}
          testID="generate-rewrites-btn"
        >
          <Sparkles size={18} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Show me alternatives</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderPauseStep = () => {
    const breatheScale = breatheAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.18],
    });
    const breatheOpacity = breatheAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.7, 0.3],
    });
    const breatheLabel = breatheAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.6, 1],
    });

    return (
      <View style={styles.pauseContainer}>
        <View style={styles.pauseCircleContainer}>
          <Animated.View
            style={[
              styles.pauseCircleOuter,
              { transform: [{ scale: breatheScale }], opacity: breatheOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.pauseCircleMid,
              {
                transform: [{ scale: breatheAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                }) }],
                opacity: breatheAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.15, 0.35, 0.15],
                }),
              },
            ]}
          />
          <View style={styles.pauseCircleInner}>
            {isPausing ? (
              <>
                <Text style={styles.pauseTimerText}>{formatPauseTime(pauseRemaining)}</Text>
                <Animated.Text style={[styles.pauseBreatheText, { opacity: breatheLabel }]}>
                  Breathe with me...
                </Animated.Text>
              </>
            ) : (
              <>
                <Text style={styles.pauseCompleteText}>You did it</Text>
                <Text style={styles.pauseBreatheText}>
                  Ready when you are
                </Text>
              </>
            )}
          </View>
        </View>

        <Text style={styles.pauseMessage}>
          {isPausing
            ? "This moment of pause is a gift to yourself.\nLet the urgency soften."
            : "You paused instead of reacting.\nThat's real strength."
          }
        </Text>

        {isPausing ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={skipPause}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>I'm ready now</Text>
          </TouchableOpacity>
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                finishPause();
              }}
              activeOpacity={0.8}
            >
              <Sparkles size={18} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Show me alternatives</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  };

  const renderRewritesStep = () => (
    <>
      <View style={styles.rewritesIntro}>
        <Text style={styles.rewritesIntroTitle}>Here are your options</Text>
        <Text style={styles.rewritesIntroSub}>
          Each version honors your feelings in a different way.
        </Text>
      </View>

      <View style={styles.originalPreview}>
        <Text style={styles.originalPreviewLabel}>Your original</Text>
        <Text style={styles.originalPreviewText} numberOfLines={2}>{inputText}</Text>
      </View>

      {rewrites.map((rw, index) => {
        const meta = REWRITE_STYLE_META[rw.style];
        const isCopied = copiedRewriteStyle === rw.style;
        return (
          <TouchableOpacity
            key={rw.style}
            style={[styles.rewriteCard, index === 0 && styles.rewriteCardFirst]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              selectRewrite(rw);
            }}
            activeOpacity={0.7}
            testID={`rewrite-${rw.style}`}
          >
            <View style={styles.rewriteHeader}>
              <View style={[styles.rewriteIconBadge, { backgroundColor: meta.color + '18' }]}>
                <Text style={styles.rewriteEmoji}>{meta.emoji}</Text>
              </View>
              <View style={styles.rewriteHeaderText}>
                <Text style={[styles.rewriteLabel, { color: meta.color }]}>{meta.label}</Text>
                <Text style={styles.rewriteDesc}>{meta.description}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleCopyRewrite(rw.style, rw.text);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {isCopied ? (
                  <Check size={14} color={Colors.success} />
                ) : (
                  <Copy size={14} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.rewritePreview} numberOfLines={3}>
              {rw.text.replace(/\[.*?\]\n\n/, '').replace(/\n---\n.*/, '')}
            </Text>

            <View style={styles.whyHelpsContainer}>
              <Info size={11} color={Colors.primary} />
              <Text style={styles.whyHelpsText}>{rw.whyThisHelps}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </>
  );

  const renderResultStep = () => {
    if (!selectedRewrite) return null;
    const meta = REWRITE_STYLE_META[selectedRewrite.style];

    return (
      <>
        <View style={[styles.resultBanner, { backgroundColor: meta.color + '12' }]}>
          <Text style={styles.resultBannerEmoji}>{meta.emoji}</Text>
          <View>
            <Text style={[styles.resultBannerLabel, { color: meta.color }]}>{meta.label} version</Text>
            <Text style={styles.resultBannerSub}>Saved to your history</Text>
          </View>
        </View>

        <View style={[styles.resultCard, { borderColor: meta.color + '30' }]}>
          <Text style={styles.resultText}>{selectedRewrite.text}</Text>
        </View>

        <View style={styles.whyHelpsResult}>
          <View style={styles.whyHelpsResultHeader}>
            <Lightbulb size={14} color={Colors.primary} />
            <Text style={styles.whyHelpsResultTitle}>Why this helps</Text>
          </View>
          <Text style={styles.whyHelpsResultText}>{selectedRewrite.whyThisHelps}</Text>
        </View>

        <View style={styles.originalCard}>
          <Text style={styles.originalLabel}>Your original</Text>
          <Text style={styles.originalText}>{inputText}</Text>
        </View>

        <View style={styles.outcomeSection}>
          <Text style={styles.outcomeSectionTitle}>How did it go?</Text>
          <Text style={styles.outcomeSectionHint}>
            Tracking outcomes helps you see what works over time.
          </Text>
          <View style={styles.outcomeRow}>
            {MESSAGE_OUTCOME_OPTIONS.map(opt => {
              const isSelected = selectedOutcome === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.outcomeChip,
                    isSelected && { backgroundColor: opt.color + '18', borderColor: opt.color },
                  ]}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedOutcome(opt.value);
                    recordOutcome(opt.value);
                  }}
                  activeOpacity={0.7}
                  testID={`outcome-${opt.value}`}
                >
                  <Text style={styles.outcomeEmoji}>{opt.emoji}</Text>
                  <Text style={[
                    styles.outcomeLabel,
                    isSelected && { color: opt.color, fontWeight: '600' as const },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedOutcome && (
            <View style={styles.outcomeConfirm}>
              <Check size={14} color={Colors.success} />
              <Text style={styles.outcomeConfirmText}>Recorded — this helps your insights grow</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSelectedOutcome(null);
            reset();
          }}
          activeOpacity={0.8}
          testID="new-message-btn"
        >
          <MessageSquare size={18} color={Colors.white} />
          <Text style={styles.primaryButtonText}>New message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={goBack}
          activeOpacity={0.7}
        >
          <RotateCcw size={14} color={Colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>See other options</Text>
        </TouchableOpacity>
      </>
    );
  };

  const stepTitles: Record<string, { title: string; subtitle: string }> = {
    input: { title: 'Message Tool', subtitle: 'Pause before you send. Rewrite with care.' },
    context: { title: 'Add context', subtitle: 'This helps craft something more thoughtful.' },
    pause: { title: 'Taking a pause', subtitle: '' },
    rewrites: { title: 'Alternatives', subtitle: 'Choose the version that feels right.' },
    result: { title: 'Your rewrite', subtitle: '' },
  };

  const currentStep = stepTitles[step] ?? stepTitles.input;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {step !== 'input' && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  goBack();
                }}
                activeOpacity={0.7}
                testID="back-btn"
              >
                <ArrowLeft size={20} color={Colors.text} />
              </TouchableOpacity>
            )}
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>{currentStep.title}</Text>
              {currentStep.subtitle.length > 0 && (
                <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
              )}
            </View>
          </View>
          {step !== 'input' && <StepIndicator currentStep={step} />}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {step === 'input' && renderInputStep()}
            {step === 'context' && renderContextStep()}
            {step === 'pause' && renderPauseStep()}
            {step === 'rewrites' && renderRewritesStep()}
            {step === 'result' && renderResultStep()}
          </Animated.View>
        </ScrollView>
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  stepDotCompleted: {
    backgroundColor: Colors.success,
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  stepLabelCompleted: {
    color: Colors.success,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 6,
    borderRadius: 1,
  },
  stepLineCompleted: {
    backgroundColor: Colors.success,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  inputHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  messageInput: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: Colors.text,
    minHeight: 130,
    borderWidth: 1.5,
    borderColor: Colors.border,
    lineHeight: 24,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  suggestionsSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  suggestionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  suggestionsIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsToggleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  suggestionsList: {
    marginTop: 8,
    gap: 8,
  },
  suggestionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  suggestionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  historyCardExpanded: {
    borderColor: Colors.primaryLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
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
  contextIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  contextIntroContent: {
    flex: 1,
  },
  contextIntroText: {
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 20,
  },
  contextProgress: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  contextPreview: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  contextPreviewLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  contextPreviewText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  contextSection: {
    marginBottom: 20,
  },
  contextLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipEmoji: {
    fontSize: 15,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  chipLabelSelected: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  contextActions: {
    marginTop: 4,
  },
  pauseFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.accentLight,
    backgroundColor: Colors.warmGlow,
  },
  pauseFirstButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  pauseFirstText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  pauseFirstTextActive: {
    color: Colors.white,
  },
  pauseOptions: {
    marginTop: 8,
    marginBottom: 8,
  },
  pauseOptionsHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
    textAlign: 'center',
  },
  pauseDurationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pauseDurationChip: {
    flex: 1,
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.accentLight,
  },
  pauseDurationLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.accent,
    marginBottom: 2,
  },
  pauseDurationDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pauseContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  pauseCircleContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  pauseCircleOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primaryLight,
  },
  pauseCircleMid: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: Colors.primary,
  },
  pauseCircleInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  pauseTimerText: {
    fontSize: 40,
    fontWeight: '200' as const,
    color: Colors.primary,
    letterSpacing: -1,
  },
  pauseBreatheText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  pauseCompleteText: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  pauseMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  rewritesIntro: {
    marginBottom: 16,
  },
  rewritesIntroTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  rewritesIntroSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  originalPreview: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  originalPreviewLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  originalPreviewText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  rewriteCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  rewriteCardFirst: {
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  rewriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  rewriteIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewriteEmoji: {
    fontSize: 18,
  },
  rewriteHeaderText: {
    flex: 1,
  },
  rewriteLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  rewriteDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewritePreview: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 10,
  },
  whyHelpsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 10,
  },
  whyHelpsText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primaryDark,
    lineHeight: 17,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  resultBannerEmoji: {
    fontSize: 24,
  },
  resultBannerLabel: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  resultBannerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  resultText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  whyHelpsResult: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  whyHelpsResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  whyHelpsResultTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  whyHelpsResultText: {
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 20,
  },
  originalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  outcomeSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  outcomeSectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  outcomeSectionHint: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    marginBottom: 14,
  },
  outcomeRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  outcomeChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  outcomeEmoji: {
    fontSize: 14,
  },
  outcomeLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  outcomeConfirm: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.successLight,
    borderRadius: 10,
  },
  outcomeConfirmText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500' as const,
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
  relInsightsBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#5B8FB9',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  relInsightsBannerLeft: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  relInsightsBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  relInsightsBannerText: {
    flex: 1,
  },
  relInsightsBannerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  relInsightsBannerDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
});
