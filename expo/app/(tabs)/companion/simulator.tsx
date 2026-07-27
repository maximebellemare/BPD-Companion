import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Zap,
  Send,
  ChevronDown,
  ChevronUp,
  Heart,
  Shield,
  AlertTriangle,
  Eye,
  Sparkles,
  RotateCcw,
  Check,
  Users,
  Gem,
  ChevronRight,
  ArrowRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';
import { SimulationResult, SimulatedResponse, ResponseStyle, QuickAction } from '@/types/simulator';
import { simulateResponses, EXAMPLE_SCENARIOS } from '@/services/simulator/emotionalSimulationService';

const STYLE_ICONS: Record<ResponseStyle, React.ReactNode> = {
  anxious: <AlertTriangle size={18} color="#3B82F6" />,
  reassurance: <Users size={18} color="#67E8F9" />,
  avoidance: <Eye size={18} color="#3B82F6" />,
  calm: <Heart size={18} color="#14B8A6" />,
  boundary: <Shield size={18} color="#67E8F9" />,
  secure: <Gem size={18} color="#3B82F6" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  get relationship() { return localizedText('Relationship', 'Relación'); },
  get social() { return localizedText('Social', 'Social'); },
  get work() { return localizedText('Work', 'Trabajo'); },
  get self() { return localizedText('Self', 'Yo'); },
};

export default function SimulatorScreen() {
  const router = useRouter();
  useLanguage();
  const [situation, setSituation] = useState<string>('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [expandedCard, setExpandedCard] = useState<ResponseStyle | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showPauseTimer, setShowPauseTimer] = useState<boolean>(false);
  const [pauseSeconds, setPauseSeconds] = useState<number>(120);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const resultFadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef<Animated.Value[]>(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  ).current;
  const actionsFadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pauseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (showPauseTimer && pauseSeconds > 0) {
      pauseTimerRef.current = setInterval(() => {
        setPauseSeconds(prev => {
          if (prev <= 1) {
            if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
            setShowPauseTimer(false);
            if (Platform.OS !== 'web') {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
      };
    }
  }, [showPauseTimer, pauseSeconds]);

  const animateResults = useCallback(() => {
    resultFadeAnim.setValue(0);
    actionsFadeAnim.setValue(0);
    cardAnims.forEach(a => a.setValue(0));

    Animated.timing(resultFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 150 + index * 100,
        useNativeDriver: true,
      }).start();
    });

    Animated.timing(actionsFadeAnim, {
      toValue: 1,
      duration: 500,
      delay: 150 + cardAnims.length * 100 + 200,
      useNativeDriver: true,
    }).start();
  }, [resultFadeAnim, cardAnims, actionsFadeAnim]);

  const animateShimmer = useCallback(() => {
    shimmerAnim.setValue(0);
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const handleSimulate = useCallback(() => {
    const trimmed = situation.trim();
    if (!trimmed) return;

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSimulating(true);
    setExpandedCard(null);
    animateShimmer();

    setTimeout(() => {
      const simResult = simulateResponses(trimmed);
      setResult(simResult);
      setIsSimulating(false);
      shimmerAnim.stopAnimation();
      animateResults();

      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 280, animated: true });
      }, 200);
    }, 1000);
  }, [situation, animateResults, animateShimmer, shimmerAnim]);

  const handleScenarioTap = useCallback((scenarioSituation: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSituation(scenarioSituation);
  }, []);

  const handleToggleCard = useCallback((style: ResponseStyle) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedCard(prev => (prev === style ? null : style));
  }, []);

  const handleReset = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSituation('');
    setResult(null);
    setExpandedCard(null);
    setShowPauseTimer(false);
    setPauseSeconds(120);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const handleQuickAction = useCallback((action: QuickAction) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (action.type === 'inline' && action.id === 'pause') {
      setShowPauseTimer(true);
      setPauseSeconds(120);
      return;
    }

    if (action.route) {
      router.push(action.route as never);
    }
  }, [router]);

  const impactDirectionColors = useMemo(() => ({
    positive: Colors.success,
    neutral: Colors.textSecondary,
    negative: Colors.danger,
  }), []);

  const intensityColors = useMemo(() => ({
    low: Colors.success,
    moderate: Colors.accent,
    high: Colors.danger,
  }), []);

  const filteredScenarios = useMemo(() => {
    if (!activeCategory) return EXAMPLE_SCENARIOS;
    return EXAMPLE_SCENARIOS.filter(s => s.category === activeCategory);
  }, [activeCategory]);

  const categories = useMemo(() => {
    const cats = new Set(EXAMPLE_SCENARIOS.map(s => s.category));
    return Array.from(cats);
  }, []);

  const formatPauseTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const renderResponseCard = useCallback((response: SimulatedResponse, index: number) => {
    const isExpanded = expandedCard === response.style;
    const animValue = cardAnims[index];
    const isHealthy = response.isRecommended;

    return (
      <Animated.View
        key={response.style}
        style={[
          styles.responseCard,
          isHealthy && styles.responseCardRecommended,
          {
            borderLeftColor: response.color,
            opacity: animValue,
            transform: [{
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.responseCardHeader}
          onPress={() => handleToggleCard(response.style)}
          activeOpacity={0.7}
          testID={`response-card-${response.style}`}
        >
          <View style={styles.responseCardHeaderLeft}>
            <View style={[styles.styleIconContainer, { backgroundColor: response.color + '18' }]}>
              {STYLE_ICONS[response.style]}
            </View>
            <View style={styles.responseCardTitleArea}>
              <Text style={styles.responseCardTitle}>{response.label}</Text>
              <View style={styles.responseCardMeta}>
                {response.isRecommended ? (
                  <View style={styles.recommendedBadge}>
                    <Check size={10} color={Colors.success} />
                    <Text style={styles.recommendedText}>{localizedText('Recommended', 'Recomendado')}</Text>
                  </View>
                ) : (
                  <View style={styles.riskBadge}>
                    <Text style={styles.riskText}>
                      {localizedText(`${response.emotionalOutcome.intensity} risk`, `Riesgo ${response.emotionalOutcome.intensity}`)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          {isExpanded ? (
            <ChevronUp size={18} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} />
          )}
        </TouchableOpacity>

        {!isExpanded && (
          <View style={styles.responseCardPreview}>
            <Text style={styles.responsePreviewText} numberOfLines={2}>
              {response.exampleResponse}
            </Text>
          </View>
        )}

        {isExpanded && (
          <View style={styles.responseCardBody}>
            <View style={styles.responseSection}>
              <Text style={styles.responseSectionLabel}>{localizedText('What this looks like', 'Cómo se vería')}</Text>
              <Text style={styles.responseExampleText}>{response.exampleResponse}</Text>
            </View>

            <View style={styles.outcomeGrid}>
              <View style={styles.outcomeCard}>
                <Text style={styles.outcomeLabel}>{localizedText('How you may feel', 'Cómo podrías sentirte')}</Text>
                <Text style={styles.outcomeEmotion}>{response.emotionalOutcome.emotion}</Text>
                <View style={[styles.intensityPill, { backgroundColor: intensityColors[response.emotionalOutcome.intensity] + '18' }]}>
                  <View style={[styles.intensityDot, { backgroundColor: intensityColors[response.emotionalOutcome.intensity] }]} />
                  <Text style={[styles.intensityText, { color: intensityColors[response.emotionalOutcome.intensity] }]}>
                    {localizedText(`${response.emotionalOutcome.intensity} intensity`, `Intensidad ${response.emotionalOutcome.intensity}`)}
                  </Text>
                </View>
                <Text style={styles.outcomeDesc}>{response.emotionalOutcome.description}</Text>
              </View>

              <View style={styles.outcomeCard}>
                <Text style={styles.outcomeLabel}>{localizedText('Relationship impact', 'Impacto en la relación')}</Text>
                <View style={[styles.impactPill, { backgroundColor: impactDirectionColors[response.relationshipImpact.direction] + '18' }]}>
                  <View style={[styles.impactDot, { backgroundColor: impactDirectionColors[response.relationshipImpact.direction] }]} />
                  <Text style={[styles.impactText, { color: impactDirectionColors[response.relationshipImpact.direction] }]}>
                    {response.relationshipImpact.direction === 'positive'
                      ? localizedText('Likely positive', 'Probablemente positivo')
                      : response.relationshipImpact.direction === 'negative'
                        ? localizedText('May cause strain', 'Puede generar tensión')
                        : localizedText('Neutral', 'Neutral')}
                  </Text>
                </View>
                <Text style={styles.outcomeDesc}>{response.relationshipImpact.description}</Text>
              </View>
            </View>

            <View style={[styles.healthierSection, isHealthy && styles.healthierSectionGreen]}>
              <View style={styles.healthierHeader}>
                <Sparkles size={14} color={isHealthy ? Colors.success : Colors.primary} />
                <Text style={[styles.healthierLabel, isHealthy && styles.healthierLabelGreen]}>
                  {isHealthy ? localizedText('Why this works', 'Por qué funciona') : localizedText('A healthier path', 'Una opción más saludable')}
                </Text>
              </View>
              <Text style={[styles.healthierText, isHealthy && styles.healthierTextGreen]}>
                {response.healthierAlternative}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    );
  }, [expandedCard, cardAnims, handleToggleCard, intensityColors, impactDirectionColors]);

  const renderQuickActions = useCallback(() => {
    if (!result) return null;

    return (
      <Animated.View style={[styles.quickActionsSection, { opacity: actionsFadeAnim }]}>
        <Text style={styles.quickActionsTitle}>{localizedText('What would help right now?', '¿Qué ayudaría ahora mismo?')}</Text>
        <Text style={styles.quickActionsSubtitle}>
          {localizedText('Choose a next step that feels right for you', 'Elige un siguiente paso que se sienta adecuado para ti')}
        </Text>

        {showPauseTimer && (
          <View style={styles.pauseTimerCard}>
            <View style={styles.pauseTimerCircle}>
              <Text style={styles.pauseTimerText}>{formatPauseTime(pauseSeconds)}</Text>
            </View>
            <Text style={styles.pauseTimerLabel}>{localizedText('Breathe. This moment will pass.', 'Respira. Este momento va a pasar.')}</Text>
            <TouchableOpacity
              style={styles.pauseTimerStop}
              onPress={() => {
                setShowPauseTimer(false);
                if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.pauseTimerStopText}>{localizedText("I'm ready", 'Estoy listo/a')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.quickActionsGrid}>
          {result.quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={() => handleQuickAction(action)}
              activeOpacity={0.7}
              testID={`quick-action-${action.id}`}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
              <ArrowRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  }, [result, actionsFadeAnim, showPauseTimer, pauseSeconds, handleQuickAction, formatPauseTime]);

  const renderLoadingState = useCallback(() => {
    const shimmerOpacity = shimmerAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.7, 0.3],
    });

    return (
      <View style={styles.loadingSection}>
        <View style={styles.loadingHeader}>
          <Animated.View style={[styles.loadingDot, { opacity: shimmerOpacity }]} />
          <Text style={styles.loadingText}>{localizedText('Exploring response paths...', 'Explorando posibles respuestas...')}</Text>
        </View>
        {[1, 2, 3].map((i) => (
          <Animated.View
            key={i}
            style={[styles.loadingSkeleton, { opacity: shimmerOpacity }]}
          >
            <View style={styles.loadingSkeletonBar} />
            <View style={[styles.loadingSkeletonBar, { width: '60%' }]} />
          </Animated.View>
        ))}
      </View>
    );
  }, [shimmerAnim]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: localizedText('Response Paths', 'Caminos de respuesta'),
          headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.introSection, { opacity: fadeAnim }]}>
            <View style={styles.introIconRow}>
              <View style={styles.introIcon}>
                <Zap size={22} color={Colors.accent} />
              </View>
            </View>
            <Text style={styles.introTitle}>{localizedText('Before You Respond', 'Antes de responder')}</Text>
            <Text style={styles.introSubtitle}>
              {localizedText(
                'See how different reactions might play out — so you can choose the one that protects your peace.',
                'Mira cómo podrían desarrollarse distintas reacciones para elegir la que proteja tu calma.',
              )}
            </Text>
          </Animated.View>

          <Animated.View style={[styles.inputSection, { opacity: fadeAnim }]}>
            <Text style={styles.inputLabel}>{localizedText("What's the situation?", '¿Cuál es la situación?')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={localizedText("e.g. My partner hasn't replied for hours...", 'p. ej., mi pareja no responde hace horas...')}
                placeholderTextColor={Colors.textMuted}
                value={situation}
                onChangeText={setSituation}
                multiline
                maxLength={300}
                testID="situation-input"
              />
              <View style={styles.inputFooter}>
                <Text style={styles.charCount}>{situation.length}/300</Text>
                <TouchableOpacity
                  style={[
                    styles.simulateButton,
                    (!situation.trim() || isSimulating) && styles.simulateButtonDisabled,
                  ]}
                  onPress={handleSimulate}
                  disabled={!situation.trim() || isSimulating}
                  activeOpacity={0.7}
                  testID="simulate-btn"
                >
                  {isSimulating ? (
                    <Text style={styles.simulateButtonText}>{localizedText('Thinking...', 'Pensando...')}</Text>
                  ) : (
                    <>
                      <Send size={15} color={Colors.white} />
                      <Text style={styles.simulateButtonText}>{localizedText('Simulate', 'Simular')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {!result && !isSimulating && (
            <Animated.View style={[styles.scenariosSection, { opacity: fadeAnim }]}>
              <Text style={styles.scenariosTitle}>{localizedText('Or explore a common situation', 'O explora una situación común')}</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryFilterRow}
                style={styles.categoryFilterScroll}
              >
                <TouchableOpacity
                  style={[styles.categoryPill, !activeCategory && styles.categoryPillActive]}
                  onPress={() => setActiveCategory(null)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryPillText, !activeCategory && styles.categoryPillTextActive]}>
                    {localizedText('All', 'Todo')}
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
                    onPress={() => setActiveCategory(prev => prev === cat ? null : cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.scenariosGrid}>
                {filteredScenarios.map((scenario) => (
                  <TouchableOpacity
                    key={scenario.id}
                    style={styles.scenarioChip}
                    onPress={() => handleScenarioTap(scenario.situation)}
                    activeOpacity={0.7}
                    testID={`scenario-${scenario.id}`}
                  >
                    <Text style={styles.scenarioEmoji}>{scenario.emoji}</Text>
                    <Text style={styles.scenarioLabel}>{scenario.label}</Text>
                    <ChevronRight size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {isSimulating && renderLoadingState()}

          {result && !isSimulating && (
            <Animated.View style={[styles.resultsSection, { opacity: resultFadeAnim }]}>
              <View style={styles.resultsHeader}>
                <View>
                  <Text style={styles.resultsTitle}>{localizedText('Response Paths', 'Caminos de respuesta')}</Text>
                  <Text style={styles.resultsSubtitle}>{localizedText('6 ways this could go', '6 formas en que esto podría desarrollarse')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                  activeOpacity={0.7}
                  testID="reset-btn"
                >
                  <RotateCcw size={14} color={Colors.primary} />
                  <Text style={styles.resetText}>{localizedText('New', 'Nuevo')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.situationBubble}>
                <Text style={styles.situationBubbleLabel}>{localizedText('Your situation', 'Tu situación')}</Text>
                <Text style={styles.situationBubbleText}>{result.situation}</Text>
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>{localizedText('May escalate', 'Puede intensificarse')}</Text>
                <View style={styles.dividerLine} />
              </View>

              {result.responses.slice(0, 3).map((response, index) =>
                renderResponseCard(response, index)
              )}

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, styles.dividerLineGreen]} />
                <Text style={[styles.dividerLabel, styles.dividerLabelGreen]}>{localizedText('May support you', 'Puede apoyarte')}</Text>
                <View style={[styles.dividerLine, styles.dividerLineGreen]} />
              </View>

              {result.responses.slice(3).map((response, index) =>
                renderResponseCard(response, index + 3)
              )}

              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Sparkles size={16} color={Colors.primary} />
                  <Text style={styles.summaryTitle}>{localizedText('Key Takeaway', 'Idea clave')}</Text>
                </View>
                <Text style={styles.summaryText}>{result.summary}</Text>
              </View>

              {renderQuickActions()}
            </Animated.View>
          )}

          <View style={styles.bottomSpacer} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  introSection: {
    alignItems: 'center' as const,
    marginBottom: 24,
    paddingTop: 8,
  },
  introIconRow: {
    marginBottom: 14,
  },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accentLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  introSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
    paddingHorizontal: 12,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden' as const,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  textInput: {
    fontSize: 15,
    color: Colors.text,
    padding: 16,
    minHeight: 80,
    textAlignVertical: 'top' as const,
    lineHeight: 22,
  },
  inputFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  simulateButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  simulateButtonDisabled: {
    opacity: 0.45,
  },
  simulateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  scenariosSection: {
    marginBottom: 24,
  },
  scenariosTitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 14,
    textAlign: 'center' as const,
  },
  categoryFilterScroll: {
    marginBottom: 14,
  },
  categoryFilterRow: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingHorizontal: 2,
  },
  categoryPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  categoryPillTextActive: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  scenariosGrid: {
    gap: 8,
  },
  scenarioChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  scenarioEmoji: {
    fontSize: 18,
  },
  scenarioLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  loadingSection: {
    marginBottom: 24,
    paddingTop: 8,
  },
  loadingHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center' as const,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  loadingSkeleton: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    gap: 10,
  },
  loadingSkeletonBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    width: '80%' as const,
  },
  resultsSection: {
    marginBottom: 16,
  },
  resultsHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  resultsSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  resetButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  situationBubble: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  situationBubbleLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  situationBubbleText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  dividerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
    marginTop: 6,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.danger + '30',
  },
  dividerLineGreen: {
    backgroundColor: Colors.success + '30',
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.danger,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  dividerLabelGreen: {
    color: Colors.success,
  },
  responseCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderLeftWidth: 4,
    marginBottom: 10,
    overflow: 'hidden' as const,
  },
  responseCardRecommended: {
    borderColor: Colors.success + '25',
  },
  responseCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 14,
  },
  responseCardHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 12,
  },
  styleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  responseCardTitleArea: {
    flex: 1,
  },
  responseCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  responseCardMeta: {
    marginTop: 3,
  },
  recommendedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  riskBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    textTransform: 'capitalize' as const,
  },
  responseCardPreview: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 0,
  },
  responsePreviewText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  responseCardBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  responseSection: {
    marginBottom: 14,
  },
  responseSectionLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  responseExampleText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
  },
  outcomeGrid: {
    gap: 10,
    marginBottom: 14,
  },
  outcomeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  outcomeLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  outcomeEmotion: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  intensityPill: {
    alignSelf: 'flex-start' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  intensityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  impactPill: {
    alignSelf: 'flex-start' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  impactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  impactText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  outcomeDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  healthierSection: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
  },
  healthierSectionGreen: {
    backgroundColor: Colors.successLight,
  },
  healthierHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 8,
  },
  healthierLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  healthierLabelGreen: {
    color: Colors.success,
  },
  healthierText: {
    fontSize: 13,
    color: Colors.primaryDark,
    lineHeight: 20,
  },
  healthierTextGreen: {
    color: '#14B8A6',
  },
  summaryCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 18,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  summaryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  quickActionsSection: {
    marginTop: 24,
  },
  quickActionsTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  quickActionsSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  quickActionsGrid: {
    gap: 8,
  },
  quickActionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  quickActionIcon: {
    fontSize: 20,
  },
  quickActionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  pauseTimerCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center' as const,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
  },
  pauseTimerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  pauseTimerText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
    fontVariant: ['tabular-nums'] as const,
  },
  pauseTimerLabel: {
    fontSize: 14,
    color: Colors.primaryDark,
    fontStyle: 'italic' as const,
    marginBottom: 14,
  },
  pauseTimerStop: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  pauseTimerStopText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  bottomSpacer: {
    height: 40,
  },
});
