import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronRight, Check, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { COPING_EXERCISES } from '@/constants/data';

export default function ExerciseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const exercise = COPING_EXERCISES.find(e => e.id === id);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepFade = useRef(new Animated.Value(1)).current;
  const stepSlide = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (exercise) {
      Animated.timing(progressAnim, {
        toValue: (currentStep + 1) / exercise.steps.length,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [currentStep, exercise, progressAnim]);

  const goNextStep = useCallback(() => {
    if (!exercise) return;

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep < exercise.steps.length - 1) {
      Animated.parallel([
        Animated.timing(stepFade, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(stepSlide, { toValue: -20, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        setCurrentStep(prev => prev + 1);
        stepSlide.setValue(20);
        Animated.parallel([
          Animated.timing(stepFade, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(stepSlide, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start();
      });
    } else {
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setCompleted(true);
    }
  }, [exercise, currentStep, stepFade, stepSlide]);

  const handleRestart = useCallback(() => {
    setCurrentStep(0);
    setCompleted(false);
    progressAnim.setValue(0);
  }, [progressAnim]);

  if (!exercise) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Exercise not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.errorLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (completed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Animated.View style={[styles.completedContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.completedContent}>
            <View style={styles.checkCircle}>
              <Check size={32} color={Colors.white} />
            </View>
            <Text style={styles.completedTitle}>Well done</Text>
            <Text style={styles.completedDesc}>
              You just did something kind for yourself.{'\n'}That takes real strength.
            </Text>

            <View style={styles.completedActions}>
              <TouchableOpacity
                style={styles.restartButton}
                onPress={handleRestart}
                activeOpacity={0.7}
              >
                <RotateCcw size={18} color={Colors.primary} />
                <Text style={styles.restartText}>Do it again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Text style={styles.doneText}>I'm done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.exerciseContainer, { opacity: fadeAnim }]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.stepIndicator}>
            {currentStep + 1}/{exercise.steps.length}
          </Text>
        </View>

        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseTitle}>{exercise.title}</Text>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{exercise.duration}</Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <Animated.View
            style={{
              opacity: stepFade,
              transform: [{ translateY: stepSlide }],
            }}
          >
            <Text style={styles.stepNumber}>Step {currentStep + 1}</Text>
            <Text style={styles.stepText}>{exercise.steps[currentStep]}</Text>
          </Animated.View>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <TouchableOpacity
            style={styles.nextStepButton}
            onPress={goNextStep}
            activeOpacity={0.8}
          >
            {currentStep === exercise.steps.length - 1 ? (
              <>
                <Check size={20} color={Colors.white} />
                <Text style={styles.nextStepText}>Complete</Text>
              </>
            ) : (
              <>
                <Text style={styles.nextStepText}>Next</Text>
                <ChevronRight size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.paceHint}>
            Take your time. There's no rush.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  exerciseContainer: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepIndicator: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  exerciseHeader: {
    paddingHorizontal: 28,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
    letterSpacing: -0.3,
  },
  durationBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  stepText: {
    fontSize: 24,
    fontWeight: '500' as const,
    color: Colors.text,
    lineHeight: 36,
    letterSpacing: -0.2,
  },
  footer: {
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  nextStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 18,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextStepText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  paceHint: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 12,
    fontStyle: 'italic',
  },
  completedContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  completedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  completedDesc: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  completedActions: {
    width: '100%',
    gap: 12,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 24,
    paddingVertical: 16,
  },
  restartText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  doneText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorLink: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
});
