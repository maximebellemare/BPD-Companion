import React, { useRef, useEffect, useCallback } from 'react';
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
  Shield,
  Eye,
  ChevronRight,
  AlertTriangle,
  Clock,
  Save,
  RotateCcw,
  Sparkles,
  Check,
  MessageSquare,
  Heart,
  Zap,
  Feather,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useMessageGuard } from '@/hooks/useMessageGuard';
import {
  TONE_META,
  EMOTIONAL_SIGNAL_META,
  DELAY_OPTIONS,
  ResponseStyleCard,
} from '@/types/messageGuard';

function formatDelayTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function UrgencyMeter({ level }: { level: number }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(width, {
      toValue: level / 10,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [level, width]);

  const color = level <= 3 ? Colors.success : level <= 6 ? Colors.accent : Colors.danger;

  return (
    <View style={urgencyStyles.container}>
      <View style={urgencyStyles.labelRow}>
        <Text style={urgencyStyles.label}>Urgency level</Text>
        <Text style={[urgencyStyles.value, { color }]}>{level}/10</Text>
      </View>
      <View style={urgencyStyles.track}>
        <Animated.View
          style={[
            urgencyStyles.fill,
            {
              backgroundColor: color,
              width: width.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const urgencyStyles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

function StyleCard({
  card,
  isDetected,
  onSelect,
  expanded,
  onToggle,
}: {
  card: ResponseStyleCard;
  isDetected: boolean;
  onSelect: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
    ]).start();
    onToggle();
  }, [scaleAnim, onToggle]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          cardStyles.container,
          isDetected && cardStyles.detectedContainer,
          card.isRecommended && cardStyles.recommendedContainer,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {isDetected && (
          <View style={[cardStyles.badge, { backgroundColor: card.color + '20' }]}>
            <AlertTriangle size={10} color={card.color} />
            <Text style={[cardStyles.badgeText, { color: card.color }]}>Your current tone</Text>
          </View>
        )}
        {card.isRecommended && !isDetected && (
          <View style={[cardStyles.badge, { backgroundColor: Colors.successLight }]}>
            <Sparkles size={10} color={Colors.success} />
            <Text style={[cardStyles.badgeText, { color: Colors.success }]}>Recommended</Text>
          </View>
        )}

        <View style={cardStyles.header}>
          <View style={[cardStyles.iconBadge, { backgroundColor: card.color + '18' }]}>
            <Text style={cardStyles.emoji}>{card.emoji}</Text>
          </View>
          <View style={cardStyles.headerText}>
            <Text style={[cardStyles.label, { color: card.color }]}>{card.label}</Text>
            <Text style={cardStyles.description}>
              {TONE_META[card.tone].description}
            </Text>
          </View>
          <ChevronRight
            size={16}
            color={Colors.textMuted}
            style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
          />
        </View>

        <View style={cardStyles.messagePreview}>
          <Text style={cardStyles.messageText} numberOfLines={expanded ? undefined : 2}>
            {card.rewrittenMessage}
          </Text>
        </View>

        {expanded && (
          <View style={cardStyles.impactSection}>
            <View style={cardStyles.impactRow}>
              <Heart size={12} color={Colors.accent} />
              <Text style={cardStyles.impactLabel}>Emotional impact</Text>
            </View>
            <Text style={cardStyles.impactText}>{card.emotionalImpact}</Text>

            <View style={[cardStyles.impactRow, { marginTop: 12 }]}>
              <Zap size={12} color={Colors.primary} />
              <Text style={cardStyles.impactLabel}>Relationship impact</Text>
            </View>
            <Text style={cardStyles.impactText}>{card.relationshipImpact}</Text>

            {card.isRecommended && (
              <TouchableOpacity
                style={cardStyles.selectButton}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onSelect();
                }}
                activeOpacity={0.8}
              >
                <Feather size={16} color={Colors.white} />
                <Text style={cardStyles.selectButtonText}>Refine this version</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  detectedContainer: {
    borderColor: Colors.accent + '40',
    backgroundColor: Colors.warmGlow,
  },
  recommendedContainer: {
    borderColor: Colors.success + '30',
    backgroundColor: '#F0FBF7',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  description: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  messagePreview: {
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    fontStyle: 'italic' as const,
  },
  impactSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  impactLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  impactText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 16,
  },
  selectButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
});

export default function MessageGuardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    messageText,
    setMessageText,
    step,
    toneAnalysis,
    responseStyles,
    selectedTone,
    secureRewrite,
    rewriteOptions,
    delayRemaining,
    isDelaying,
    draftSaved,
    analyzeMessage,
    proceedToStyles,
    selectStyle,
    updateRewriteOption,
    startDelay,
    skipDelay,
    saveDraft,
    reset,
    goBack,
  } = useMessageGuard();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const [expandedCard, setExpandedCard] = React.useState<string | null>(null);

  const animateTransition = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 12, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    animateTransition();
  }, [step, animateTransition]);

  useEffect(() => {
    if (step === 'pause' && isDelaying) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
          Animated.timing(breatheAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [step, isDelaying, breatheAnim]);

  const renderInputStep = () => (
    <>
      <View style={styles.heroSection}>
        <View style={styles.heroIconContainer}>
          <Shield size={28} color={Colors.primary} />
        </View>
        <Text style={styles.heroTitle}>Before You Send</Text>
        <Text style={styles.heroSubtitle}>
          Paste or write the message you're considering. Let's explore how it might land.
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Write or paste your message here..."
          placeholderTextColor={Colors.textMuted}
          multiline
          value={messageText}
          onChangeText={setMessageText}
          textAlignVertical="top"
          testID="guard-message-input"
        />
        {messageText.trim().length > 0 && (
          <Text style={styles.charCount}>{messageText.length} characters</Text>
        )}
      </View>

      {messageText.trim().length > 0 && (
        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            analyzeMessage();
          }}
          activeOpacity={0.8}
          testID="analyze-btn"
        >
          <Eye size={18} color={Colors.white} />
          <Text style={styles.analyzeButtonText}>Analyze this message</Text>
        </TouchableOpacity>
      )}

      <View style={styles.infoCard}>
        <View style={styles.infoIconRow}>
          <Shield size={14} color={Colors.primary} />
          <Text style={styles.infoTitle}>How this works</Text>
        </View>
        <Text style={styles.infoText}>
          We'll look at the emotional tone, show you how it might sound in different styles, and help you craft something that protects both connection and self-respect.
        </Text>
      </View>
    </>
  );

  const renderAnalysisStep = () => {
    if (!toneAnalysis) return null;
    const detectedMeta = TONE_META[toneAnalysis.primaryTone];

    return (
      <>
        <View style={[styles.analysisHero, { backgroundColor: detectedMeta.color + '10' }]}>
          <Text style={styles.analysisEmoji}>{detectedMeta.emoji}</Text>
          <Text style={[styles.analysisTitle, { color: detectedMeta.color }]}>
            {detectedMeta.label} tone detected
          </Text>
          <Text style={styles.analysisDesc}>{detectedMeta.description}</Text>
        </View>

        <View style={styles.originalPreview}>
          <Text style={styles.originalLabel}>Your message</Text>
          <Text style={styles.originalText} numberOfLines={3}>{messageText}</Text>
        </View>

        <UrgencyMeter level={toneAnalysis.urgencyLevel} />

        {toneAnalysis.signals.length > 0 && (
          <View style={styles.signalsSection}>
            <Text style={styles.signalsSectionTitle}>Emotional signals detected</Text>
            <View style={styles.signalsRow}>
              {toneAnalysis.signals.map(signal => {
                const meta = EMOTIONAL_SIGNAL_META[signal];
                return (
                  <View key={signal} style={styles.signalChip}>
                    <Text style={styles.signalEmoji}>{meta.emoji}</Text>
                    <Text style={styles.signalLabel}>{meta.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {toneAnalysis.urgencyLevel >= 5 && (
          <View style={styles.gentleWarning}>
            <Text style={styles.gentleWarningText}>
              It seems like urgency may be high right now. Seeing different styles can help you choose how you want to show up.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            proceedToStyles();
          }}
          activeOpacity={0.8}
          testID="see-styles-btn"
        >
          <MessageSquare size={18} color={Colors.white} />
          <Text style={styles.primaryButtonText}>See response styles</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderStylesStep = () => {
    if (!toneAnalysis) return null;

    return (
      <>
        <View style={styles.stylesIntro}>
          <Text style={styles.stylesIntroTitle}>How this message could sound</Text>
          <Text style={styles.stylesIntroSub}>
            Each style shows a different way the same feelings could come across. Tap to explore.
          </Text>
        </View>

        {responseStyles.map(card => (
          <StyleCard
            key={card.tone}
            card={card}
            isDetected={card.tone === toneAnalysis.primaryTone}
            onSelect={() => selectStyle(card.tone)}
            expanded={expandedCard === card.tone}
            onToggle={() => setExpandedCard(prev => prev === card.tone ? null : card.tone)}
          />
        ))}

        <View style={styles.delaySection}>
          <Text style={styles.delaySectionTitle}>Or simply pause</Text>
          <Text style={styles.delaySectionSub}>
            Sometimes the most powerful thing is waiting.
          </Text>
          <View style={styles.delayRow}>
            {DELAY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={styles.delayChip}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  startDelay(opt.minutes);
                }}
                activeOpacity={0.7}
              >
                <Clock size={14} color={Colors.accent} />
                <Text style={styles.delayChipLabel}>{opt.label}</Text>
                <Text style={styles.delayChipDesc}>{opt.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveDraftButton}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            void saveDraft();
          }}
          activeOpacity={0.7}
        >
          <Save size={14} color={Colors.textSecondary} />
          <Text style={styles.saveDraftText}>
            {draftSaved ? 'Draft saved' : 'Save as draft'}
          </Text>
          {draftSaved && <Check size={14} color={Colors.success} />}
        </TouchableOpacity>
      </>
    );
  };

  const renderRefineStep = () => {
    if (!toneAnalysis) return null;

    return (
      <>
        <View style={styles.refineHero}>
          <Text style={styles.refineHeroEmoji}>🌿</Text>
          <Text style={styles.refineHeroTitle}>Build your secure version</Text>
          <Text style={styles.refineHeroSub}>
            Adjust what matters most to you right now.
          </Text>
        </View>

        <View style={styles.toggleSection}>
          {([
            { key: 'reduceUrgency' as const, label: 'Reduce urgency', desc: 'Soften time pressure' },
            { key: 'removeBlame' as const, label: 'Remove blame', desc: 'Replace accusatory language' },
            { key: 'addEmotionalClarity' as const, label: 'Add emotional clarity', desc: 'Name what you feel' },
            { key: 'addBoundaries' as const, label: 'Add boundaries', desc: 'Protect your peace' },
          ]).map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.toggleRow,
                rewriteOptions[opt.key] && styles.toggleRowActive,
              ]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateRewriteOption(opt.key, !rewriteOptions[opt.key]);
              }}
              activeOpacity={0.7}
            >
              <View style={[
                styles.toggleCheckbox,
                rewriteOptions[opt.key] && styles.toggleCheckboxActive,
              ]}>
                {rewriteOptions[opt.key] && <Check size={12} color={Colors.white} />}
              </View>
              <View style={styles.toggleText}>
                <Text style={[
                  styles.toggleLabel,
                  rewriteOptions[opt.key] && styles.toggleLabelActive,
                ]}>
                  {opt.label}
                </Text>
                <Text style={styles.toggleDesc}>{opt.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.rewritePreviewSection}>
          <Text style={styles.rewritePreviewLabel}>Your refined message</Text>
          <View style={styles.rewritePreviewCard}>
            <Text style={styles.rewritePreviewText}>{secureRewrite}</Text>
          </View>
        </View>

        <View style={styles.originalCompare}>
          <Text style={styles.originalCompareLabel}>Original</Text>
          <Text style={styles.originalCompareText} numberOfLines={2}>{messageText}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              void saveDraft();
            }}
            activeOpacity={0.8}
          >
            <Save size={18} color={Colors.white} />
            <Text style={styles.primaryButtonText}>
              {draftSaved ? 'Saved' : 'Save this version'}
            </Text>
            {draftSaved && <Check size={16} color={Colors.white} />}
          </TouchableOpacity>

          <View style={styles.delayRow}>
            {DELAY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={styles.delayChipSmall}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  startDelay(opt.minutes);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.delayChipSmallLabel}>Wait {opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.simulatorLink}
          onPress={() => router.push('/scenario-simulator')}
          activeOpacity={0.7}
          testID="guard-simulator-link"
        >
          <Sparkles size={15} color={Colors.primary} />
          <Text style={styles.simulatorLinkText}>Practice different responses</Text>
          <ChevronRight size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      </>
    );
  };

  const renderPauseStep = () => {
    const breatheScale = breatheAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.15],
    });
    const breatheOpacity = breatheAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.25, 0.6, 0.25],
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
                transform: [{
                  scale: breatheAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                }],
                opacity: breatheAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.12, 0.3, 0.12],
                }),
              },
            ]}
          />
          <View style={styles.pauseCircleInner}>
            {isDelaying ? (
              <>
                <Text style={styles.pauseTimerText}>{formatDelayTime(delayRemaining)}</Text>
                <Animated.Text
                  style={[
                    styles.pauseBreatheLabel,
                    {
                      opacity: breatheAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 0.5, 1],
                      }),
                    },
                  ]}
                >
                  Breathe...
                </Animated.Text>
              </>
            ) : (
              <>
                <Text style={styles.pauseCompleteEmoji}>🌿</Text>
                <Text style={styles.pauseCompleteText}>Pause complete</Text>
              </>
            )}
          </View>
        </View>

        <Text style={styles.pauseMessage}>
          {isDelaying
            ? "This pause is a gift to your future self.\nLet the urgency pass through you."
            : "You chose to wait. That takes real strength."
          }
        </Text>

        {isDelaying ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              skipDelay();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>I'm ready now</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.pauseCompleteActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                void saveDraft();
              }}
              activeOpacity={0.8}
            >
              <Save size={18} color={Colors.white} />
              <Text style={styles.primaryButtonText}>
                {draftSaved ? 'Draft saved' : 'Save draft for later'}
              </Text>
              {draftSaved && <Check size={16} color={Colors.white} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                reset();
              }}
              activeOpacity={0.7}
            >
              <RotateCcw size={14} color={Colors.textSecondary} />
              <Text style={styles.secondaryButtonText}>Start over</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const stepTitles: Record<string, { title: string; subtitle: string }> = {
    input: { title: 'Message Guard', subtitle: 'See how your message may land before sending' },
    analysis: { title: 'Tone Analysis', subtitle: "Here's what we noticed" },
    styles: { title: 'Response Styles', subtitle: 'Same feelings, different delivery' },
    refine: { title: 'Secure Builder', subtitle: 'Craft your grounded response' },
    pause: { title: 'Pausing', subtitle: '' },
  };

  const currentStepMeta = stepTitles[step] ?? stepTitles.input;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (step === 'input') {
                  router.back();
                } else {
                  goBack();
                }
              }}
              activeOpacity={0.7}
              testID="guard-back-btn"
            >
              <ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{currentStepMeta.title}</Text>
              {currentStepMeta.subtitle.length > 0 && (
                <Text style={styles.headerSubtitle}>{currentStepMeta.subtitle}</Text>
              )}
            </View>
          </View>
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
            {step === 'analysis' && renderAnalysisStep()}
            {step === 'styles' && renderStylesStep()}
            {step === 'refine' && renderRefineStep()}
            {step === 'pause' && renderPauseStep()}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 8,
  },
  heroIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  messageInput: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: Colors.text,
    minHeight: 140,
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
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  infoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  analysisHero: {
    alignItems: 'center',
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
  },
  analysisEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  analysisDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  originalPreview: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  originalLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  originalText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  signalsSection: {
    marginTop: 4,
    marginBottom: 20,
  },
  signalsSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  signalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  signalEmoji: {
    fontSize: 13,
  },
  signalLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  gentleWarning: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  gentleWarningText: {
    fontSize: 13,
    color: Colors.accent,
    lineHeight: 19,
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
  stylesIntro: {
    marginBottom: 20,
  },
  stylesIntroTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  stylesIntroSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  delaySection: {
    marginTop: 8,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  delaySectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  delaySectionSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  delayRow: {
    flexDirection: 'row',
    gap: 10,
  },
  delayChip: {
    flex: 1,
    backgroundColor: Colors.warmGlow,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  delayChipLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  delayChipDesc: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  saveDraftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 8,
  },
  saveDraftText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  refineHero: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 4,
  },
  refineHeroEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  refineHeroTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  refineHeroSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  toggleSection: {
    gap: 8,
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toggleRowActive: {
    borderColor: Colors.primary + '40',
    backgroundColor: '#F5FAF7',
  },
  toggleCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCheckboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  toggleLabelActive: {
    color: Colors.primaryDark,
  },
  toggleDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  rewritePreviewSection: {
    marginBottom: 16,
  },
  rewritePreviewLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  rewritePreviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.success + '30',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  rewritePreviewText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 23,
  },
  originalCompare: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  originalCompareLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  originalCompareText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  actionRow: {
    gap: 4,
  },
  delayChipSmall: {
    flex: 1,
    backgroundColor: Colors.warmGlow,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  delayChipSmallLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  pauseContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  pauseCircleContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  pauseCircleOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary,
  },
  pauseCircleMid: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary,
  },
  pauseCircleInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  pauseTimerText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  pauseBreatheLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pauseCompleteEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  pauseCompleteText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  pauseMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  pauseCompleteActions: {
    width: '100%',
  },
  simulatorLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 6,
  },
  simulatorLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
});
