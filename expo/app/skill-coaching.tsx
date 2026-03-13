import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Heart,
  Wind,
  Anchor,
  Shield,
  Activity,
  Waves,
  Pause,
  RefreshCw,
  Check,
  Sparkles,
  Clock,
  TrendingDown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { SkillExercise, SkillExerciseStep } from '@/types/companionMemory';
import { SkillCoachingSession } from '@/types/skillCoaching';
import {
  EXTENDED_SKILL_LIBRARY,
  SKILL_CATEGORIES,
  getSkillById,
  getSkillsByCategory,
} from '@/data/skills/skillLibrary';
import {
  startCoachingSession,
  advanceStep,
  addReflection,
  completeSession,
  persistSessionResult,
  getSkillStats,
  generateSessionInsight,
} from '@/services/companion/skillCoachService';
import { trackEvent } from '@/services/analytics/analyticsService';

type Phase = 'browse' | 'distress_before' | 'exercise' | 'distress_after' | 'complete';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Anchor,
  Wind,
  Waves,
  Pause,
  RefreshCw,
  Heart,
  Shield,
  Activity,
};

export default function SkillCoachingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ exerciseId?: string; state?: string }>();

  const [phase, setPhase] = useState<Phase>('browse');
  const [selectedExercise, setSelectedExercise] = useState<SkillExercise | null>(null);
  const [session, setSession] = useState<SkillCoachingSession | null>(null);
  const [distressBefore, setDistressBefore] = useState<number>(5);
  const [distressAfter, setDistressAfter] = useState<number>(5);
  const [reflectionText, setReflectionText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [insight, setInsight] = useState<string>('');
  const [stats, setStats] = useState<{ totalSessions: number; completedSessions: number; averageDistressReduction: number; mostEffectiveSkill: string | null; totalPracticeMinutes: number } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepFade = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const loadStats = useCallback(async () => {
    try {
      const s = await getSkillStats();
      setStats(s);
    } catch (error) {
      console.log('[SkillCoaching] Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    if (params.exerciseId) {
      const exercise = getSkillById(params.exerciseId);
      if (exercise) {
        setSelectedExercise(exercise);
        setPhase('distress_before');
      }
    }
  }, [params.exerciseId]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (phase === 'exercise' && session) {
      const exercise = getSkillById(session.exerciseId);
      if (exercise) {
        const progress = session.currentStepIndex / exercise.steps.length;
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 400,
          useNativeDriver: false,
        }).start();
      }
    }
  }, [phase, session, progressAnim]);

  useEffect(() => {
    if (phase === 'exercise') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [phase, pulseAnim]);

  const animateStepTransition = useCallback((callback: () => void) => {
    Animated.timing(stepFade, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(stepFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [stepFade]);

  const handleSelectExercise = useCallback((exercise: SkillExercise) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedExercise(exercise);
    setPhase('distress_before');
    void trackEvent('skill_session_started', {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      category: exercise.category,
    });
  }, []);

  const handleStartSession = useCallback(() => {
    if (!selectedExercise) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const newSession = startCoachingSession(selectedExercise.id, distressBefore);
    setSession(newSession);
    setPhase('exercise');
  }, [selectedExercise, distressBefore]);

  const currentStep = useMemo((): SkillExerciseStep | null => {
    if (!session || !selectedExercise) return null;
    return selectedExercise.steps[session.currentStepIndex] ?? null;
  }, [session, selectedExercise]);

  const isLastStep = useMemo((): boolean => {
    if (!session || !selectedExercise) return false;
    return session.currentStepIndex >= selectedExercise.steps.length - 1;
  }, [session, selectedExercise]);

  const handleNextStep = useCallback(() => {
    if (!session || !selectedExercise) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep?.reflectionPrompt && reflectionText.trim()) {
      const updated = addReflection(session, session.currentStepIndex, currentStep.reflectionPrompt, reflectionText.trim());
      setSession(updated);
      setReflectionText('');

      void trackEvent('skill_step_completed', {
        exercise_id: selectedExercise.id,
        step_index: session.currentStepIndex,
        has_reflection: true,
      });

      if (isLastStep) {
        animateStepTransition(() => {
          setSession(prev => prev ? { ...prev, status: 'completed', completedAt: Date.now() } : null);
          setPhase('distress_after');
        });
      } else {
        animateStepTransition(() => {
          setSession(advanceStep(updated));
        });
      }
    } else {
      void trackEvent('skill_step_completed', {
        exercise_id: selectedExercise.id,
        step_index: session.currentStepIndex,
        has_reflection: false,
      });

      if (isLastStep) {
        animateStepTransition(() => {
          setPhase('distress_after');
        });
      } else {
        animateStepTransition(() => {
          setSession(prev => prev ? advanceStep(prev) : null);
        });
      }
    }
  }, [session, selectedExercise, currentStep, reflectionText, isLastStep, animateStepTransition]);

  const handlePrevStep = useCallback(() => {
    if (!session || session.currentStepIndex === 0) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    animateStepTransition(() => {
      setSession(prev => prev ? { ...prev, currentStepIndex: prev.currentStepIndex - 1 } : null);
    });
    setReflectionText('');
  }, [session, animateStepTransition]);

  const handleComplete = useCallback(async () => {
    if (!session) return;
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const { session: completedSession, result } = completeSession(session, distressAfter);
    const sessionInsight = generateSessionInsight(completedSession);
    setInsight(sessionInsight);
    setPhase('complete');

    await persistSessionResult(completedSession, result);
    await loadStats();

    void trackEvent('skill_session_completed', {
      exercise_id: session.exerciseId,
      distress_before: session.distressBefore,
      distress_after: distressAfter,
      distress_reduction: session.distressBefore - distressAfter,
      duration_seconds: Math.round((Date.now() - session.startedAt) / 1000),
    });
  }, [session, distressAfter, loadStats]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleReset = useCallback(() => {
    setPhase('browse');
    setSelectedExercise(null);
    setSession(null);
    setDistressBefore(5);
    setDistressAfter(5);
    setReflectionText('');
    setInsight('');
    setSelectedCategory(null);
  }, []);

  const filteredExercises = useMemo(() => {
    if (selectedCategory) {
      return getSkillsByCategory(selectedCategory);
    }
    return EXTENDED_SKILL_LIBRARY;
  }, [selectedCategory]);

  const renderDistressSlider = (value: number, setValue: (v: number) => void) => {
    const levels = Array.from({ length: 10 }, (_, i) => i + 1);
    return (
      <View style={styles.distressContainer}>
        <View style={styles.distressLabels}>
          <Text style={styles.distressLabelLow}>Calm</Text>
          <Text style={styles.distressLabelHigh}>Very distressed</Text>
        </View>
        <View style={styles.distressGrid}>
          {levels.map(level => {
            const isSelected = level === value;
            const intensity = level / 10;
            const bgColor = isSelected
              ? `rgba(225, 112, 85, ${0.3 + intensity * 0.7})`
              : Colors.surface;
            return (
              <TouchableOpacity
                key={level}
                testID={`distress-level-${level}`}
                style={[
                  styles.distressButton,
                  { backgroundColor: bgColor },
                  isSelected && styles.distressButtonSelected,
                ]}
                onPress={() => {
                  setValue(level);
                  if (Platform.OS !== 'web') {
                    void Haptics.selectionAsync();
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.distressButtonText,
                  isSelected && styles.distressButtonTextSelected,
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderBrowsePhase = () => (
    <ScrollView
      style={styles.scrollContent}
      contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      {stats && stats.totalSessions > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completedSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalPracticeMinutes}m</Text>
              <Text style={styles.statLabel}>Practice</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {stats.averageDistressReduction > 0 ? `-${stats.averageDistressReduction}` : '0'}
              </Text>
              <Text style={styles.statLabel}>Avg. Relief</Text>
            </View>
          </View>
          {stats.mostEffectiveSkill && (
            <View style={styles.statHighlight}>
              <Sparkles size={14} color={Colors.accent} />
              <Text style={styles.statHighlightText}>
                Most effective: {stats.mostEffectiveSkill}
              </Text>
            </View>
          )}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(null)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.categoryChipText,
            !selectedCategory && styles.categoryChipTextActive,
          ]}>All</Text>
        </TouchableOpacity>
        {SKILL_CATEGORIES.map(cat => {
          const IconComp = CATEGORY_ICONS[cat.iconName] ?? Activity;
          const isActive = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                isActive && { backgroundColor: cat.color },
              ]}
              onPress={() => setSelectedCategory(isActive ? null : cat.id)}
              activeOpacity={0.7}
            >
              <IconComp size={14} color={isActive ? '#FFFFFF' : cat.color} />
              <Text style={[
                styles.categoryChipText,
                isActive && styles.categoryChipTextActive,
              ]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filteredExercises.map(exercise => {
        const catInfo = SKILL_CATEGORIES.find(c => c.id === exercise.category);
        const IconComp = catInfo ? (CATEGORY_ICONS[catInfo.iconName] ?? Activity) : Activity;
        const catColor = catInfo?.color ?? Colors.primary;

        return (
          <TouchableOpacity
            key={exercise.id}
            testID={`skill-card-${exercise.id}`}
            style={styles.exerciseCard}
            onPress={() => handleSelectExercise(exercise)}
            activeOpacity={0.7}
          >
            <View style={[styles.exerciseIconContainer, { backgroundColor: catInfo?.bgColor ?? Colors.primaryLight }]}>
              <IconComp size={22} color={catColor} />
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <View style={styles.exerciseMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: catInfo?.bgColor ?? Colors.primaryLight }]}>
                  <Text style={[styles.categoryBadgeText, { color: catColor }]}>
                    {catInfo?.label ?? exercise.category}
                  </Text>
                </View>
                <View style={styles.durationBadge}>
                  <Clock size={11} color={Colors.textMuted} />
                  <Text style={styles.durationText}>{exercise.estimatedMinutes} min</Text>
                </View>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderDistressBeforePhase = () => (
    <View style={[styles.phaseContainer, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.phaseContent}>
        <View style={[styles.phaseIconCircle, { backgroundColor: Colors.accentLight }]}>
          <Activity size={28} color={Colors.accent} />
        </View>
        <Text style={styles.phaseTitle}>How are you feeling right now?</Text>
        <Text style={styles.phaseSubtitle}>
          Rate your current distress level so we can track how this exercise helps.
        </Text>
        {renderDistressSlider(distressBefore, setDistressBefore)}
      </View>
      <TouchableOpacity
        testID="start-session-button"
        style={styles.primaryButton}
        onPress={handleStartSession}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>Begin {selectedExercise?.name}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderExercisePhase = () => {
    if (!session || !selectedExercise || !currentStep) return null;
    const catInfo = SKILL_CATEGORIES.find(c => c.id === selectedExercise.category);
    const catColor = catInfo?.color ?? Colors.primary;

    return (
      <View style={[styles.phaseContainer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: catColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.stepCounter}>
          Step {session.currentStepIndex + 1} of {selectedExercise.steps.length}
        </Text>

        <ScrollView
          style={styles.exerciseScrollArea}
          contentContainerStyle={styles.exerciseScrollInner}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.stepContent, { opacity: stepFade, transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.stepInstruction}>{currentStep.instruction}</Text>

            {currentStep.reflectionPrompt && (
              <View style={styles.reflectionContainer}>
                <Text style={styles.reflectionPrompt}>{currentStep.reflectionPrompt}</Text>
                <TextInput
                  testID="reflection-input"
                  style={styles.reflectionInput}
                  placeholder="Share your thoughts..."
                  placeholderTextColor={Colors.textMuted}
                  value={reflectionText}
                  onChangeText={setReflectionText}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.stepNavigation}>
          {session.currentStepIndex > 0 ? (
            <TouchableOpacity
              style={styles.navButtonSecondary}
              onPress={handlePrevStep}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color={Colors.text} />
              <Text style={styles.navButtonSecondaryText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navSpacer} />
          )}

          <TouchableOpacity
            testID="next-step-button"
            style={[styles.navButtonPrimary, { backgroundColor: catColor }]}
            onPress={handleNextStep}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonPrimaryText}>
              {isLastStep ? 'Finish' : 'Continue'}
            </Text>
            {!isLastStep && <ChevronRight size={18} color="#FFFFFF" />}
            {isLastStep && <Check size={18} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDistressAfterPhase = () => (
    <View style={[styles.phaseContainer, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.phaseContent}>
        <View style={[styles.phaseIconCircle, { backgroundColor: Colors.successLight }]}>
          <TrendingDown size={28} color={Colors.success} />
        </View>
        <Text style={styles.phaseTitle}>How are you feeling now?</Text>
        <Text style={styles.phaseSubtitle}>
          Rate your distress level after the exercise. Any shift matters.
        </Text>
        {renderDistressSlider(distressAfter, setDistressAfter)}
      </View>
      <TouchableOpacity
        testID="complete-session-button"
        style={[styles.primaryButton, { backgroundColor: Colors.success }]}
        onPress={handleComplete}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>See Results</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCompletePhase = () => {
    const reduction = distressBefore - distressAfter;
    const improved = reduction > 0;

    return (
      <View style={[styles.phaseContainer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.phaseContent}>
          <View style={[styles.completionCircle, improved ? styles.completionCircleSuccess : styles.completionCircleNeutral]}>
            {improved ? (
              <Check size={36} color={Colors.success} />
            ) : (
              <Heart size={36} color={Colors.accent} />
            )}
          </View>

          <Text style={styles.completionTitle}>
            {improved ? 'Well done' : 'You showed up'}
          </Text>

          <View style={styles.distressComparison}>
            <View style={styles.distressCompItem}>
              <Text style={styles.distressCompLabel}>Before</Text>
              <Text style={[styles.distressCompValue, { color: Colors.danger }]}>{distressBefore}</Text>
            </View>
            <View style={styles.distressCompArrow}>
              <ChevronRight size={20} color={Colors.textMuted} />
            </View>
            <View style={styles.distressCompItem}>
              <Text style={styles.distressCompLabel}>After</Text>
              <Text style={[styles.distressCompValue, { color: improved ? Colors.success : Colors.accent }]}>{distressAfter}</Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Sparkles size={16} color={Colors.accent} />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        </View>

        <View style={styles.completionActions}>
          <TouchableOpacity
            testID="try-another-button"
            style={styles.secondaryButton}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Try Another Skill</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="done-button"
            style={styles.primaryButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: phase === 'exercise' ? '#FAFAF7' : Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          testID="close-button"
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {phase === 'browse' ? 'Skill Practice' : selectedExercise?.name ?? 'Skill Practice'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
        {phase === 'browse' && renderBrowsePhase()}
        {phase === 'distress_before' && renderDistressBeforePhase()}
        {phase === 'exercise' && renderExercisePhase()}
        {phase === 'distress_after' && renderDistressAfterPhase()}
        {phase === 'complete' && renderCompletePhase()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    textAlign: 'center' as const,
  },
  headerSpacer: {
    width: 36,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
  },
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderLight,
  },
  statHighlight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 6,
  },
  statHighlightText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  categoryScroll: {
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  exerciseCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  exerciseIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  durationBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
  },
  durationText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  phaseContainer: {
    flex: 1,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  phaseContent: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  phaseIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  phaseSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  distressContainer: {
    width: '100%',
  },
  distressLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  distressLabelLow: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500' as const,
  },
  distressLabelHigh: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '500' as const,
  },
  distressGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 6,
  },
  distressButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    maxWidth: 44,
  },
  distressButtonSelected: {
    borderWidth: 2,
    borderColor: Colors.danger,
  },
  distressButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  distressButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden' as const,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepCounter: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    marginBottom: 16,
    fontWeight: '500' as const,
  },
  exerciseScrollArea: {
    flex: 1,
  },
  exerciseScrollInner: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    paddingVertical: 16,
  },
  stepContent: {
    alignItems: 'center' as const,
  },
  stepInstruction: {
    fontSize: 19,
    fontWeight: '500' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    lineHeight: 30,
    marginBottom: 24,
  },
  reflectionContainer: {
    width: '100%',
    marginTop: 8,
  },
  reflectionPrompt: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  reflectionInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    minHeight: 80,
    lineHeight: 22,
  },
  stepNavigation: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingTop: 12,
  },
  navSpacer: {
    width: 80,
  },
  navButtonSecondary: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  navButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  navButtonPrimary: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 6,
    flex: 1,
    justifyContent: 'center' as const,
  },
  navButtonPrimaryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  completionCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  completionCircleSuccess: {
    backgroundColor: Colors.successLight,
  },
  completionCircleNeutral: {
    backgroundColor: Colors.accentLight,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
  },
  distressComparison: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginBottom: 24,
  },
  distressCompItem: {
    alignItems: 'center' as const,
  },
  distressCompLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  distressCompValue: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  distressCompArrow: {
    paddingTop: 12,
  },
  insightCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    width: '100%',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  completionActions: {
    gap: 0,
  },
});
