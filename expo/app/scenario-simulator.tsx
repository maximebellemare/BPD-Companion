import React, { useRef, useEffect, useCallback, useState } from 'react';
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
  MessageSquare,
  ChevronRight,
  Shield,
  Zap,
  Snowflake,
  Swords,
  Leaf,
  AlertTriangle,
  Check,
  RefreshCw,
  Sparkles,
  Target,
  Heart,
  RotateCcw,
  Edit3,
  Play,
  Award,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useScenarioSimulator } from '@/hooks/useScenarioSimulator';
import {
  ResponseStyle,
  RESPONSE_STYLE_META,
  SCENARIO_CONTEXTS,
  ResponseSimulation,
  RefineTool,
} from '@/types/scenarioSimulator';

const RISK_COLORS = {
  low: Colors.success,
  medium: '#E8A87C',
  high: Colors.danger,
} as const;

const RISK_LABELS = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
} as const;

function FadeInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  return (
    <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[level] + '18' }]}>
      <View style={[styles.riskDot, { backgroundColor: RISK_COLORS[level] }]} />
      <Text style={[styles.riskText, { color: RISK_COLORS[level] }]}>{RISK_LABELS[level]}</Text>
    </View>
  );
}

function StyleIcon({ style, size = 18, color }: { style: ResponseStyle; size?: number; color?: string }) {
  const c = color || RESPONSE_STYLE_META[style].color;
  switch (style) {
    case 'urgent': return <Zap size={size} color={c} />;
    case 'avoidant': return <Snowflake size={size} color={c} />;
    case 'defensive': return <Swords size={size} color={c} />;
    case 'secure': return <Leaf size={size} color={c} />;
  }
}

export default function ScenarioSimulatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const {
    step,
    input,
    simulations,
    selectedStyle,
    refineTools,
    refinedResponse,
    practiceRounds,
    currentFeedback,
    sessionSaved,
    updateInput,
    runSimulation,
    selectResponse,
    startRefining,
    toggleRefineTool,
    updateRefinedResponse,
    startPractice,
    submitPracticeResponse,
    completeSession,
    reset,
    goBack,
    clearFeedback,
  } = useScenarioSimulator();

  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [expandedSim, setExpandedSim] = useState<ResponseStyle | null>(null);
  const [practiceText, setPracticeText] = useState<string>('');

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [headerAnim]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

  const handleContextSelect = useCallback((contextId: string) => {
    setSelectedContext(contextId);
    const ctx = SCENARIO_CONTEXTS.find(c => c.id === contextId);
    if (ctx) {
      updateInput('conversationContext', ctx.label);
    }
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [updateInput]);

  const handleRunSimulation = useCallback(() => {
    runSimulation();
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [runSimulation]);

  const handleSelectResponse = useCallback((style: ResponseStyle) => {
    selectResponse(style);
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [selectResponse]);

  const handleToggleTool = useCallback((toolId: RefineTool) => {
    toggleRefineTool(toolId);
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [toggleRefineTool]);

  const handleSubmitPractice = useCallback(() => {
    if (!practiceText.trim()) return;
    submitPracticeResponse('secure', practiceText);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [practiceText, submitPracticeResponse]);

  const handleComplete = useCallback(() => {
    void completeSession();
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [completeSession]);

  const canSimulate =
    input.messageReceived.trim() ||
    input.situationDescription.trim() ||
    input.conversationContext.trim();

  const renderInputStep = () => (
    <View style={styles.stepContainer}>
      <FadeInView>
        <View style={styles.introCard}>
          <View style={styles.introIconRow}>
            <View style={styles.introIconBg}>
              <MessageSquare size={22} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.introTitle}>What happened?</Text>
          <Text style={styles.introSubtitle}>
            Describe a difficult conversation or message. We'll simulate different ways to respond.
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={styles.fieldLabel}>Message you received</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Paste or type the message..."
          placeholderTextColor={Colors.textMuted}
          value={input.messageReceived}
          onChangeText={t => updateInput('messageReceived', t)}
          multiline
          textAlignVertical="top"
          testID="scenario-message-input"
        />
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={styles.fieldLabel}>What's the situation?</Text>
        <TextInput
          style={[styles.textInput, { minHeight: 70 }]}
          placeholder="E.g., partner hasn't responded in hours..."
          placeholderTextColor={Colors.textMuted}
          value={input.situationDescription}
          onChangeText={t => updateInput('situationDescription', t)}
          multiline
          textAlignVertical="top"
          testID="scenario-situation-input"
        />
      </FadeInView>

      <FadeInView delay={300}>
        <Text style={styles.fieldLabel}>Context</Text>
        <View style={styles.contextGrid}>
          {SCENARIO_CONTEXTS.map(ctx => (
            <TouchableOpacity
              key={ctx.id}
              style={[
                styles.contextChip,
                selectedContext === ctx.id && styles.contextChipActive,
              ]}
              onPress={() => handleContextSelect(ctx.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.contextEmoji}>{ctx.emoji}</Text>
              <Text
                style={[
                  styles.contextLabel,
                  selectedContext === ctx.id && styles.contextLabelActive,
                ]}
              >
                {ctx.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={400}>
        <TouchableOpacity
          style={[styles.primaryBtn, !canSimulate && styles.primaryBtnDisabled]}
          onPress={handleRunSimulation}
          disabled={!canSimulate}
          activeOpacity={0.8}
          testID="run-simulation-btn"
        >
          <Play size={18} color={Colors.white} />
          <Text style={styles.primaryBtnText}>Simulate Responses</Text>
        </TouchableOpacity>
      </FadeInView>
    </View>
  );

  const renderSimulationCard = (sim: ResponseSimulation, index: number) => {
    const isExpanded = expandedSim === sim.style;
    const isSecure = sim.style === 'secure';

    return (
      <FadeInView key={sim.style} delay={index * 120}>
        <TouchableOpacity
          style={[
            styles.simCard,
            isSecure && styles.simCardSecure,
            isExpanded && styles.simCardExpanded,
          ]}
          onPress={() => setExpandedSim(isExpanded ? null : sim.style)}
          activeOpacity={0.8}
        >
          <View style={styles.simCardHeader}>
            <View style={styles.simCardTitleRow}>
              <View style={[styles.simIconBg, { backgroundColor: sim.color + '18' }]}>
                <StyleIcon style={sim.style} />
              </View>
              <View style={styles.simCardTitleCol}>
                <Text style={styles.simCardTitle}>{sim.emoji} {sim.label}</Text>
                <Text style={styles.simCardDesc}>{sim.description}</Text>
              </View>
            </View>
            <RiskBadge level={sim.riskLevel} />
          </View>

          <View style={[styles.simResponseBox, { borderLeftColor: sim.color }]}>
            <Text style={styles.simResponseText}>
              "{sim.responseText}"
            </Text>
          </View>

          {isExpanded && (
            <View style={styles.simImpactSection}>
              <View style={styles.impactRow}>
                <Heart size={14} color={Colors.accent} />
                <Text style={styles.impactLabel}>Emotional impact</Text>
              </View>
              <Text style={styles.impactText}>{sim.emotionalImpact}</Text>

              <View style={[styles.impactRow, { marginTop: 12 }]}>
                <Target size={14} color={Colors.primary} />
                <Text style={styles.impactLabel}>Relationship impact</Text>
              </View>
              <Text style={styles.impactText}>{sim.relationshipImpact}</Text>

              {isSecure ? (
                <TouchableOpacity
                  style={styles.refineBtn}
                  onPress={startRefining}
                  activeOpacity={0.7}
                >
                  <Edit3 size={15} color={Colors.white} />
                  <Text style={styles.refineBtnText}>Refine This Response</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.trySecureBtn}
                  onPress={startRefining}
                  activeOpacity={0.7}
                >
                  <Leaf size={15} color={Colors.primary} />
                  <Text style={styles.trySecureBtnText}>Try the secure version instead</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </TouchableOpacity>
      </FadeInView>
    );
  };

  const renderSimulationsStep = () => (
    <View style={styles.stepContainer}>
      <FadeInView>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Response Styles</Text>
          <Text style={styles.sectionSubtitle}>
            Tap a card to see how each response might land
          </Text>
        </View>
      </FadeInView>

      {simulations.map((sim, i) => renderSimulationCard(sim, i))}

      <FadeInView delay={simulations.length * 120 + 100}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={startRefining}
          activeOpacity={0.8}
        >
          <Shield size={18} color={Colors.white} />
          <Text style={styles.primaryBtnText}>Build a Secure Response</Text>
        </TouchableOpacity>
      </FadeInView>
    </View>
  );

  const renderRefineStep = () => (
    <View style={styles.stepContainer}>
      <FadeInView>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Refine Your Response</Text>
          <Text style={styles.sectionSubtitle}>
            Use tools to shape a calmer, clearer message
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={styles.fieldLabel}>Refinement Tools</Text>
        <View style={styles.refineToolsGrid}>
          {refineTools.map(tool => (
            <TouchableOpacity
              key={tool.id}
              style={[
                styles.refineToolChip,
                tool.active && styles.refineToolChipActive,
              ]}
              onPress={() => handleToggleTool(tool.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.refineToolEmoji}>{tool.emoji}</Text>
              <View style={styles.refineToolContent}>
                <Text
                  style={[
                    styles.refineToolLabel,
                    tool.active && styles.refineToolLabelActive,
                  ]}
                >
                  {tool.label}
                </Text>
                <Text style={styles.refineToolDesc}>{tool.description}</Text>
              </View>
              {tool.active && (
                <View style={styles.refineToolCheck}>
                  <Check size={14} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={styles.fieldLabel}>Your Response</Text>
        <TextInput
          style={[styles.textInput, styles.refineInput]}
          value={refinedResponse}
          onChangeText={updateRefinedResponse}
          multiline
          textAlignVertical="top"
          testID="refined-response-input"
        />
      </FadeInView>

      <FadeInView delay={300}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={startPractice}
          activeOpacity={0.8}
          testID="start-practice-btn"
        >
          <Play size={18} color={Colors.white} />
          <Text style={styles.primaryBtnText}>Practice Mode</Text>
        </TouchableOpacity>
      </FadeInView>
    </View>
  );

  const renderPracticeStep = () => (
    <View style={styles.stepContainer}>
      <FadeInView>
        <View style={styles.introCard}>
          <View style={styles.introIconRow}>
            <View style={[styles.introIconBg, { backgroundColor: Colors.primaryLight }]}>
              <Target size={22} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.introTitle}>Practice Mode</Text>
          <Text style={styles.introSubtitle}>
            Write your own response to this scenario. Get feedback on how it might land.
          </Text>
        </View>
      </FadeInView>

      {input.messageReceived.trim() ? (
        <FadeInView delay={100}>
          <View style={styles.scenarioReminder}>
            <Text style={styles.scenarioReminderLabel}>The message:</Text>
            <Text style={styles.scenarioReminderText}>"{input.messageReceived}"</Text>
          </View>
        </FadeInView>
      ) : input.situationDescription.trim() ? (
        <FadeInView delay={100}>
          <View style={styles.scenarioReminder}>
            <Text style={styles.scenarioReminderLabel}>The situation:</Text>
            <Text style={styles.scenarioReminderText}>{input.situationDescription}</Text>
          </View>
        </FadeInView>
      ) : null}

      <FadeInView delay={200}>
        <Text style={styles.fieldLabel}>Your response</Text>
        <TextInput
          style={[styles.textInput, styles.practiceInput]}
          placeholder="Type how you'd respond..."
          placeholderTextColor={Colors.textMuted}
          value={practiceText}
          onChangeText={setPracticeText}
          multiline
          textAlignVertical="top"
          testID="practice-response-input"
        />
      </FadeInView>

      <FadeInView delay={300}>
        <TouchableOpacity
          style={[styles.primaryBtn, !practiceText.trim() && styles.primaryBtnDisabled]}
          onPress={handleSubmitPractice}
          disabled={!practiceText.trim()}
          activeOpacity={0.8}
        >
          <Sparkles size={18} color={Colors.white} />
          <Text style={styles.primaryBtnText}>Get Feedback</Text>
        </TouchableOpacity>
      </FadeInView>

      {currentFeedback && (
        <FadeInView delay={100}>
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <Sparkles size={16} color={Colors.primary} />
              <Text style={styles.feedbackHeaderText}>Feedback</Text>
            </View>
            <Text style={styles.feedbackText}>{currentFeedback.feedback}</Text>
            <View style={styles.feedbackTipBox}>
              <AlertTriangle size={14} color={Colors.accent} />
              <Text style={styles.feedbackTipText}>{currentFeedback.improvementTip}</Text>
            </View>
          </View>
        </FadeInView>
      )}

      {practiceRounds.length > 0 && (
        <FadeInView delay={200}>
          <View style={styles.practiceActions}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setPracticeText('');
                clearFeedback();
              }}
              activeOpacity={0.7}
            >
              <RotateCcw size={16} color={Colors.primary} />
              <Text style={styles.secondaryBtnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtnSmall}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              <Award size={16} color={Colors.white} />
              <Text style={styles.primaryBtnSmallText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </FadeInView>
      )}
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <FadeInView>
        <View style={styles.completeCard}>
          <View style={styles.completeIconBg}>
            <Award size={32} color={Colors.primary} />
          </View>
          <Text style={styles.completeTitle}>Great Practice</Text>
          <Text style={styles.completeSubtitle}>
            You explored different response styles and practiced a calmer approach.
            This kind of rehearsal builds emotional muscle memory.
          </Text>
        </View>
      </FadeInView>

      {refinedResponse ? (
        <FadeInView delay={150}>
          <View style={styles.finalResponseCard}>
            <Text style={styles.finalResponseLabel}>Your refined response</Text>
            <Text style={styles.finalResponseText}>"{refinedResponse}"</Text>
          </View>
        </FadeInView>
      ) : null}

      <FadeInView delay={300}>
        <View style={styles.suggestionsCard}>
          <Text style={styles.suggestionsTitle}>What to try next</Text>
          <TouchableOpacity
            style={styles.suggestionRow}
            onPress={() => router.push('/relationship-copilot')}
            activeOpacity={0.7}
          >
            <Heart size={16} color={Colors.primary} />
            <Text style={styles.suggestionText}>Relationship Copilot session</Text>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.suggestionRow}
            onPress={() => router.push('/message-guard')}
            activeOpacity={0.7}
          >
            <Shield size={16} color={Colors.primary} />
            <Text style={styles.suggestionText}>Message Guard for real messages</Text>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </FadeInView>

      <FadeInView delay={450}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={reset}
          activeOpacity={0.8}
        >
          <RefreshCw size={18} color={Colors.white} />
          <Text style={styles.primaryBtnText}>New Scenario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </FadeInView>
    </View>
  );

  const stepTitles: Record<string, string> = {
    input: 'Scenario Simulator',
    simulations: 'Response Styles',
    refine: 'Secure Response',
    practice: 'Practice Mode',
    complete: 'Session Complete',
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View
        style={[
          styles.header,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
        ]}
      >
        <TouchableOpacity
          style={styles.headerBack}
          onPress={step === 'input' ? () => router.back() : goBack}
          activeOpacity={0.7}
          testID="simulator-back-btn"
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{stepTitles[step] ?? 'Simulator'}</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <View style={styles.progressBar}>
        {['input', 'simulations', 'refine', 'practice', 'complete'].map((s, i) => {
          const steps = ['input', 'simulations', 'refine', 'practice', 'complete'];
          const currentIdx = steps.indexOf(step);
          const isActive = i <= currentIdx;
          return (
            <View
              key={s}
              style={[styles.progressSegment, isActive && styles.progressSegmentActive]}
            />
          );
        })}
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex1}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'input' && renderInputStep()}
          {step === 'simulations' && renderSimulationsStep()}
          {step === 'refine' && renderRefineStep()}
          {step === 'practice' && renderPracticeStep()}
          {step === 'complete' && renderCompleteStep()}
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
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 4,
    marginBottom: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
  },
  progressSegmentActive: {
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  stepContainer: {
    gap: 16,
  },
  introCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  introIconRow: {
    marginBottom: 12,
  },
  introIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  introSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    lineHeight: 22,
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  contextChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  contextEmoji: {
    fontSize: 14,
  },
  contextLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  contextLabelActive: {
    color: Colors.primaryDark,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  sectionHeader: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  simCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  simCardSecure: {
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
  },
  simCardExpanded: {
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  simCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  simCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  simIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simCardTitleCol: {
    flex: 1,
  },
  simCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  simCardDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  simResponseBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
  },
  simResponseText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    fontStyle: 'italic' as const,
  },
  simImpactSection: {
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
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  impactText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginLeft: 20,
  },
  refineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    marginTop: 14,
  },
  refineBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  trySecureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    marginTop: 14,
  },
  trySecureBtnText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  refineToolsGrid: {
    gap: 8,
  },
  refineToolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  refineToolChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary + '40',
  },
  refineToolEmoji: {
    fontSize: 20,
  },
  refineToolContent: {
    flex: 1,
  },
  refineToolLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  refineToolLabelActive: {
    color: Colors.primaryDark,
  },
  refineToolDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  refineToolCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refineInput: {
    minHeight: 120,
  },
  practiceInput: {
    minHeight: 100,
  },
  scenarioReminder: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 14,
    padding: 16,
  },
  scenarioReminderLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  scenarioReminderText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontStyle: 'italic' as const,
  },
  feedbackCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  feedbackHeaderText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  feedbackText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 12,
  },
  feedbackTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.accentLight,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  feedbackTipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  practiceActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  primaryBtnSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  primaryBtnSmallText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  completeCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  completeIconBg: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  finalResponseCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 18,
  },
  finalResponseLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  finalResponseText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    fontStyle: 'italic' as const,
  },
  suggestionsCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
  },
  suggestionsTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  closeBtnText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
