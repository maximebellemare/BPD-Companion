import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Sparkles,
  PenLine,
  BookOpen,
  CheckCircle2,
  Heart,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getCoachModuleById, generateSessionInsight, getSkillForModule } from '@/services/coach/coachService';
import {
  startModule,
  updateStepProgress,
  completeModule,
} from '@/services/coach/coachProgressService';
import { CoachModuleStep, COACH_CATEGORY_META } from '@/types/coachModule';
import { useAnalytics } from '@/providers/AnalyticsProvider';

export default function LearningCoachScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const scrollRef = useRef<ScrollView>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [insightText, setInsightText] = useState<string>('');
  const [initialized, setInitialized] = useState<boolean>(false);

  const coachModule = useMemo(() => {
    if (!moduleId) return null;
    return getCoachModuleById(moduleId) ?? null;
  }, [moduleId]);

  const currentStep: CoachModuleStep | null = useMemo(() => {
    if (!coachModule) return null;
    return coachModule.steps[currentStepIndex] ?? null;
  }, [coachModule, currentStepIndex]);

  const totalSteps = coachModule?.steps.length ?? 0;
  const categoryMeta = coachModule ? COACH_CATEGORY_META[coachModule.category] : null;

  useEffect(() => {
    if (!moduleId || initialized) return;
    setInitialized(true);

    void startModule(moduleId);
    trackEvent('coach_module_started', { module_id: moduleId });

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [moduleId, initialized, fadeAnim, slideAnim, trackEvent]);

  useEffect(() => {
    if (totalSteps === 0) return;
    Animated.timing(progressAnim, {
      toValue: (currentStepIndex + 1) / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStepIndex, totalSteps, progressAnim]);

  const animateStepTransition = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleNext = useCallback(async () => {
    if (!coachModule || !currentStep) return;

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep.reflectionQuestion && currentResponse.trim()) {
      const newResponses = { ...responses, [currentStep.id]: currentResponse };
      setResponses(newResponses);
      await updateStepProgress(coachModule.id, currentStepIndex, currentStep.id, currentResponse);
    }

    trackEvent('coach_step_completed', {
      module_id: coachModule.id,
      step_index: currentStepIndex,
      step_type: currentStep.type,
    });

    if (currentStepIndex < totalSteps - 1) {
      setCurrentResponse('');
      setCurrentStepIndex(prev => prev + 1);
      animateStepTransition();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      const allResponses = currentStep.reflectionQuestion && currentResponse.trim()
        ? { ...responses, [currentStep.id]: currentResponse }
        : responses;

      const insight = generateSessionInsight(coachModule.id, allResponses);
      const skill = getSkillForModule(coachModule.id);
      setInsightText(insight);
      setIsComplete(true);

      await completeModule(coachModule.id, insight, skill, coachModule.title);
      trackEvent('coach_module_completed', {
        module_id: coachModule.id,
        reflections_count: Object.keys(allResponses).length,
      });

      animateStepTransition();
    }
  }, [coachModule, currentStep, currentStepIndex, totalSteps, currentResponse, responses, trackEvent, animateStepTransition]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const prevStep = coachModule?.steps[currentStepIndex - 1];
      if (prevStep && responses[prevStep.id]) {
        setCurrentResponse(responses[prevStep.id]);
      } else {
        setCurrentResponse('');
      }
      setCurrentStepIndex(prev => prev - 1);
      animateStepTransition();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [currentStepIndex, coachModule, responses, animateStepTransition]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleViewProgress = useCallback(() => {
    router.replace('/learning-progress' as any);
  }, [router]);

  const getStepIcon = useCallback((type: string) => {
    switch (type) {
      case 'introduction': return <BookOpen size={20} color={categoryMeta?.color ?? Colors.primary} />;
      case 'explanation': return <Lightbulb size={20} color={categoryMeta?.color ?? Colors.primary} />;
      case 'reflection': return <PenLine size={20} color={categoryMeta?.color ?? Colors.primary} />;
      case 'exercise': return <Sparkles size={20} color={categoryMeta?.color ?? Colors.primary} />;
      case 'closing': return <Heart size={20} color={categoryMeta?.color ?? Colors.primary} />;
      default: return <BookOpen size={20} color={Colors.primary} />;
    }
  }, [categoryMeta]);

  const getStepLabel = useCallback((type: string) => {
    switch (type) {
      case 'introduction': return 'Introduction';
      case 'explanation': return 'Understanding';
      case 'reflection': return 'Reflection';
      case 'exercise': return 'Practice';
      case 'closing': return 'Closing Insight';
      default: return 'Step';
    }
  }, []);

  if (!coachModule || !currentStep) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Module not found</Text>
          <TouchableOpacity style={styles.errorButton} onPress={handleClose}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (isComplete) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} testID="coach-close">
            <X size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.completionContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.completionCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.completionIconWrap, { backgroundColor: (categoryMeta?.color ?? Colors.primary) + '20' }]}>
              <CheckCircle2 size={40} color={categoryMeta?.color ?? Colors.primary} />
            </View>
            <Text style={styles.completionTitle}>Session Complete</Text>
            <Text style={styles.completionModuleTitle}>{coachModule.title}</Text>

            <View style={[styles.insightCard, { borderLeftColor: categoryMeta?.color ?? Colors.primary }]}>
              <View style={styles.insightHeader}>
                <Sparkles size={16} color={categoryMeta?.color ?? Colors.primary} />
                <Text style={[styles.insightLabel, { color: categoryMeta?.color ?? Colors.primary }]}>Your Insight</Text>
              </View>
              <Text style={styles.insightText}>{insightText}</Text>
            </View>

            {getSkillForModule(coachModule.id) && (
              <View style={styles.skillBadge}>
                <Text style={styles.skillBadgeLabel}>Skill Practiced</Text>
                <Text style={[styles.skillBadgeValue, { color: categoryMeta?.color ?? Colors.primary }]}>
                  {getSkillForModule(coachModule.id)}
                </Text>
              </View>
            )}

            {Object.keys(responses).length > 0 && (
              <View style={styles.reflectionSummary}>
                <Text style={styles.reflectionSummaryTitle}>Your Reflections</Text>
                {Object.entries(responses).map(([stepId, response]) => {
                  const step = coachModule.steps.find(s => s.id === stepId);
                  return (
                    <View key={stepId} style={styles.reflectionItem}>
                      <Text style={styles.reflectionQuestion}>{step?.reflectionQuestion ?? 'Reflection'}</Text>
                      <Text style={styles.reflectionAnswer}>{response}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: categoryMeta?.color ?? Colors.primary }]}
              onPress={handleViewProgress}
              testID="coach-view-progress"
            >
              <Text style={styles.primaryButtonText}>View Learning Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleClose} testID="coach-done">
              <Text style={styles.secondaryButtonText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton} testID="coach-close">
          <X size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth, backgroundColor: categoryMeta?.color ?? Colors.primary }]} />
          </View>
          <Text style={styles.progressLabel}>{currentStepIndex + 1}/{totalSteps}</Text>
        </View>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.stepContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepIconWrap, { backgroundColor: (categoryMeta?.color ?? Colors.primary) + '15' }]}>
              {getStepIcon(currentStep.type)}
            </View>
            <Text style={[styles.stepTypeLabel, { color: categoryMeta?.color ?? Colors.primary }]}>
              {getStepLabel(currentStep.type)}
            </Text>
          </View>

          <Text style={styles.promptText}>{currentStep.promptText}</Text>

          {currentStep.optionalExample && (
            <View style={styles.exampleCard}>
              <View style={styles.exampleHeader}>
                <Lightbulb size={14} color={Colors.accent} />
                <Text style={styles.exampleLabel}>Example</Text>
              </View>
              <Text style={styles.exampleText}>{currentStep.optionalExample}</Text>
            </View>
          )}

          {currentStep.optionalExercise && (
            <View style={[styles.exerciseCard, { borderLeftColor: categoryMeta?.color ?? Colors.primary }]}>
              <View style={styles.exerciseHeader}>
                <Sparkles size={14} color={categoryMeta?.color ?? Colors.primary} />
                <Text style={[styles.exerciseLabel, { color: categoryMeta?.color ?? Colors.primary }]}>Try This</Text>
              </View>
              <Text style={styles.exerciseText}>{currentStep.optionalExercise}</Text>
            </View>
          )}

          {currentStep.tipText && (
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>{currentStep.tipText}</Text>
            </View>
          )}

          {currentStep.reflectionQuestion && (
            <View style={styles.reflectionContainer}>
              <Text style={styles.reflectionQuestionText}>{currentStep.reflectionQuestion}</Text>
              <TextInput
                style={styles.reflectionInput}
                placeholder="Take a moment to reflect..."
                placeholderTextColor={Colors.textMuted}
                value={currentResponse}
                onChangeText={setCurrentResponse}
                multiline
                textAlignVertical="top"
                testID="coach-reflection-input"
              />
              <Text style={styles.reflectionHint}>This is just for you. Write freely.</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.navButtons}>
          {currentStepIndex > 0 ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack} testID="coach-back">
              <ChevronLeft size={20} color={Colors.textSecondary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navSpacer} />
          )}

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: categoryMeta?.color ?? Colors.primary }]}
            onPress={handleNext}
            testID="coach-next"
          >
            <Text style={styles.nextButtonText}>
              {currentStepIndex === totalSteps - 1 ? 'Complete' : 'Continue'}
            </Text>
            <ChevronRight size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    minWidth: 30,
    textAlign: 'right' as const,
  },
  topBarSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTypeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  promptText: {
    fontSize: 18,
    color: Colors.text,
    lineHeight: 28,
    fontWeight: '400' as const,
    marginBottom: 20,
  },
  exampleCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  exampleLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  exampleText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 23,
    fontStyle: 'italic' as const,
  },
  exerciseCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  exerciseLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  exerciseText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },
  tipCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  tipText: {
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 21,
    fontStyle: 'italic' as const,
  },
  reflectionContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  reflectionQuestionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
    lineHeight: 24,
    marginBottom: 12,
  },
  reflectionInput: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 120,
    lineHeight: 22,
  },
  reflectionHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  navSpacer: {
    width: 60,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600' as const,
  },
  completionContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  completionCard: {
    alignItems: 'center',
  },
  completionIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  completionModuleTitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 28,
  },
  insightCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 16,
    borderLeftWidth: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  insightLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  skillBadge: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  skillBadgeLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  skillBadgeValue: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  reflectionSummary: {
    width: '100%',
    marginBottom: 24,
  },
  reflectionSummaryTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  reflectionItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  reflectionQuestion: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 6,
    fontStyle: 'italic' as const,
  },
  reflectionAnswer: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600' as const,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 17,
    color: Colors.textSecondary,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600' as const,
  },
});
