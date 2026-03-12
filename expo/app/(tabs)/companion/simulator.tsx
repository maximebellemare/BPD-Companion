import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import { Stack } from 'expo-router';
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { SimulationResult, SimulatedResponse, ResponseStyle } from '@/types/simulator';
import { simulateResponses, EXAMPLE_SCENARIOS } from '@/services/simulator/emotionalSimulationService';

const STYLE_ICONS: Record<ResponseStyle, React.ReactNode> = {
  anxious: <AlertTriangle size={18} color="#E17055" />,
  calm: <Heart size={18} color="#6B9080" />,
  boundary: <Shield size={18} color="#D4956A" />,
  avoidance: <Eye size={18} color="#9B8EC4" />,
};

export default function SimulatorScreen() {
  const [situation, setSituation] = useState<string>('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [expandedCard, setExpandedCard] = useState<ResponseStyle | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const resultFadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef<Animated.Value[]>([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const scrollRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const animateResults = useCallback(() => {
    resultFadeAnim.setValue(0);
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
        delay: 150 + index * 120,
        useNativeDriver: true,
      }).start();
    });
  }, [resultFadeAnim, cardAnims]);

  const handleSimulate = useCallback(() => {
    const trimmed = situation.trim();
    if (!trimmed) return;

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSimulating(true);
    setExpandedCard(null);

    setTimeout(() => {
      const simResult = simulateResponses(trimmed);
      setResult(simResult);
      setIsSimulating(false);
      animateResults();

      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 280, animated: true });
      }, 200);
    }, 800);
  }, [situation, animateResults]);

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
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

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

  const renderResponseCard = useCallback((response: SimulatedResponse, index: number) => {
    const isExpanded = expandedCard === response.style;
    const animValue = cardAnims[index];

    return (
      <Animated.View
        key={response.style}
        style={[
          styles.responseCard,
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
              {response.isRecommended && (
                <View style={styles.recommendedBadge}>
                  <Check size={10} color={Colors.success} />
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
            </View>
          </View>
          {isExpanded ? (
            <ChevronUp size={18} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.responseCardBody}>
            <View style={styles.responseSection}>
              <Text style={styles.responseSectionLabel}>What this looks like</Text>
              <Text style={styles.responseExampleText}>{response.exampleResponse}</Text>
            </View>

            <View style={styles.outcomeRow}>
              <View style={styles.outcomeCard}>
                <Text style={styles.outcomeLabel}>Emotional Outcome</Text>
                <Text style={styles.outcomeEmotion}>{response.emotionalOutcome.emotion}</Text>
                <View style={[styles.intensityPill, { backgroundColor: intensityColors[response.emotionalOutcome.intensity] + '20' }]}>
                  <Text style={[styles.intensityText, { color: intensityColors[response.emotionalOutcome.intensity] }]}>
                    {response.emotionalOutcome.intensity} intensity
                  </Text>
                </View>
                <Text style={styles.outcomeDesc}>{response.emotionalOutcome.description}</Text>
              </View>

              <View style={styles.outcomeCard}>
                <Text style={styles.outcomeLabel}>Relationship Impact</Text>
                <View style={[styles.impactPill, { backgroundColor: impactDirectionColors[response.relationshipImpact.direction] + '20' }]}>
                  <Text style={[styles.impactText, { color: impactDirectionColors[response.relationshipImpact.direction] }]}>
                    {response.relationshipImpact.direction}
                  </Text>
                </View>
                <Text style={styles.outcomeDesc}>{response.relationshipImpact.description}</Text>
              </View>
            </View>

            <View style={styles.healthierSection}>
              <View style={styles.healthierHeader}>
                <Sparkles size={14} color={Colors.primary} />
                <Text style={styles.healthierLabel}>Healthier Path</Text>
              </View>
              <Text style={styles.healthierText}>{response.healthierAlternative}</Text>
            </View>
          </View>
        )}
      </Animated.View>
    );
  }, [expandedCard, cardAnims, handleToggleCard, intensityColors, impactDirectionColors]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Emotional Simulator',
          headerTitleStyle: { fontWeight: '600' as const },
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
            <View style={styles.introIcon}>
              <Zap size={24} color={Colors.accent} />
            </View>
            <Text style={styles.introTitle}>Explore Before You React</Text>
            <Text style={styles.introSubtitle}>
              Describe a situation and see how different responses might play out — before you act on impulse.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.inputSection, { opacity: fadeAnim }]}>
            <Text style={styles.inputLabel}>What's the situation?</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. My partner hasn't replied for hours..."
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
                  <Send size={16} color={Colors.white} />
                  <Text style={styles.simulateButtonText}>
                    {isSimulating ? 'Thinking...' : 'Simulate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {!result && (
            <Animated.View style={[styles.scenariosSection, { opacity: fadeAnim }]}>
              <Text style={styles.scenariosTitle}>Or try an example</Text>
              <View style={styles.scenariosGrid}>
                {EXAMPLE_SCENARIOS.map((scenario) => (
                  <TouchableOpacity
                    key={scenario.id}
                    style={styles.scenarioChip}
                    onPress={() => handleScenarioTap(scenario.situation)}
                    activeOpacity={0.7}
                    testID={`scenario-${scenario.id}`}
                  >
                    <Text style={styles.scenarioEmoji}>{scenario.emoji}</Text>
                    <Text style={styles.scenarioLabel}>{scenario.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {result && (
            <Animated.View style={[styles.resultsSection, { opacity: resultFadeAnim }]}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>Possible Responses</Text>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                  activeOpacity={0.7}
                  testID="reset-btn"
                >
                  <RotateCcw size={15} color={Colors.primary} />
                  <Text style={styles.resetText}>New situation</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.situationBubble}>
                <Text style={styles.situationBubbleText}>"{result.situation}"</Text>
              </View>

              {result.responses.map((response, index) => renderResponseCard(response, index))}

              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Sparkles size={16} color={Colors.primary} />
                  <Text style={styles.summaryTitle}>Key Takeaway</Text>
                </View>
                <Text style={styles.summaryText}>{result.summary}</Text>
              </View>
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
    paddingTop: 16,
  },
  introSection: {
    alignItems: 'center' as const,
    marginBottom: 28,
    paddingTop: 8,
  },
  introIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accentLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  introSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 16,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden' as const,
  },
  textInput: {
    fontSize: 15,
    color: Colors.text,
    padding: 16,
    minHeight: 80,
    textAlignVertical: 'top' as const,
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
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  simulateButtonDisabled: {
    opacity: 0.5,
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
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  scenariosGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    justifyContent: 'center' as const,
  },
  scenarioChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.card,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  scenarioEmoji: {
    fontSize: 14,
  },
  scenarioLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
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
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  resetButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  situationBubble: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  situationBubbleText: {
    fontSize: 14,
    fontStyle: 'italic' as const,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  responseCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderLeftWidth: 4,
    marginBottom: 12,
    overflow: 'hidden' as const,
  },
  responseCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  responseCardHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 12,
  },
  styleIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
  recommendedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    marginTop: 3,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.success,
  },
  responseCardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  responseSection: {
    marginBottom: 16,
  },
  responseSectionLabel: {
    fontSize: 12,
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
    padding: 12,
    borderRadius: 10,
  },
  outcomeRow: {
    gap: 10,
    marginBottom: 16,
  },
  outcomeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
  },
  outcomeLabel: {
    fontSize: 12,
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
    marginBottom: 6,
  },
  intensityPill: {
    alignSelf: 'flex-start' as const,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  impactPill: {
    alignSelf: 'flex-start' as const,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  impactText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  outcomeDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  healthierSection: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
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
  healthierText: {
    fontSize: 13,
    color: Colors.primaryDark,
    lineHeight: 19,
  },
  summaryCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 18,
    marginTop: 6,
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
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  bottomSpacer: {
    height: 40,
  },
});
