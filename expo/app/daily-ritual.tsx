import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronRight, ChevronLeft, Check, Flame, Sparkles } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { DailyRitualEntry, DailyMood, EmotionTag } from '@/types/ritual';
import { ritualRepository } from '@/services/repositories';
import {
  DAILY_MOODS,
  RITUAL_EMOTION_TAGS,
  INTENTION_SUGGESTIONS,
  getRandomReflectionPrompt,
  getTodayDateString,
  hasCheckedInToday,
} from '@/services/ritual/dailyCheckInService';

const STEPS = ['mood', 'emotions', 'stress', 'reflection', 'intention'] as const;
type Step = typeof STEPS[number];

const STEP_TITLES: Record<Step, string> = {
  mood: 'How are you feeling?',
  emotions: 'What emotions are present?',
  stress: 'Your stress level',
  reflection: 'A moment to reflect',
  intention: 'Set an intention',
};

const STEP_SUBTITLES: Record<Step, string> = {
  mood: 'Pick the mood that fits right now',
  emotions: 'Select all that resonate with you',
  stress: 'Where are you on the stress scale today?',
  reflection: 'Take a breath and write what comes to mind',
  intention: 'One small thing to carry through your day',
};

export default function DailyRitualScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [stepIndex, setStepIndex] = useState<number>(0);
  const [selectedMood, setSelectedMood] = useState<DailyMood | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionTag[]>([]);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [reflection, setReflection] = useState<string>('');
  const [intention, setIntention] = useState<string>('');
  const [showComplete, setShowComplete] = useState<boolean>(false);

  const reflectionPrompt = useMemo(() => getRandomReflectionPrompt(), []);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const completeAnim = useRef(new Animated.Value(0)).current;
  const completePulse = useRef(new Animated.Value(0)).current;

  const step = STEPS[stepIndex];

  const ritualQuery = useQuery({
    queryKey: ['ritual'],
    queryFn: () => ritualRepository.getState(),
  });

  const alreadyCheckedIn = useMemo(() => {
    return hasCheckedInToday(ritualQuery.data?.entries ?? []);
  }, [ritualQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (entry: DailyRitualEntry) => ritualRepository.addEntry(entry),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ritual'] });
    },
  });

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (stepIndex + 1) / STEPS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [stepIndex, progressAnim]);

  const animateTransition = useCallback((direction: 'forward' | 'back', callback: () => void) => {
    const toValue = direction === 'forward' ? -30 : 30;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(direction === 'forward' ? 30 : -30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const goNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (stepIndex < STEPS.length - 1) {
      animateTransition('forward', () => setStepIndex(prev => prev + 1));
    }
  }, [stepIndex, animateTransition]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      animateTransition('back', () => setStepIndex(prev => prev - 1));
    }
  }, [stepIndex, animateTransition]);

  const handleComplete = useCallback(() => {
    if (!selectedMood) return;

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const entry: DailyRitualEntry = {
      id: `ritual_${Date.now()}`,
      timestamp: Date.now(),
      date: getTodayDateString(),
      mood: selectedMood,
      emotionTags: selectedEmotions,
      stressLevel,
      reflection,
      intention,
    };

    saveMutation.mutate(entry);
    setShowComplete(true);

    Animated.parallel([
      Animated.timing(completeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(completePulse, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(completePulse, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    setTimeout(() => {
      router.back();
    }, 2500);
  }, [selectedMood, selectedEmotions, stressLevel, reflection, intention, saveMutation, completeAnim, completePulse, router]);

  const toggleEmotion = useCallback((tag: EmotionTag) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setSelectedEmotions(prev =>
      prev.find(e => e.id === tag.id)
        ? prev.filter(e => e.id !== tag.id)
        : [...prev, tag]
    );
  }, []);

  const selectMood = useCallback((mood: DailyMood) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedMood(mood);
  }, []);

  const renderMoodSelection = () => (
    <View style={styles.moodGrid}>
      {DAILY_MOODS.map(mood => {
        const isSelected = selectedMood?.id === mood.id;
        return (
          <TouchableOpacity
            key={mood.id}
            style={[
              styles.moodCard,
              isSelected && { borderColor: mood.color, backgroundColor: `${mood.color}10` },
            ]}
            onPress={() => selectMood(mood)}
            activeOpacity={0.7}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={[styles.moodLabel, isSelected && { color: mood.color, fontWeight: '700' as const }]}>
              {mood.label}
            </Text>
            {isSelected && (
              <View style={[styles.moodCheckmark, { backgroundColor: mood.color }]}>
                <Check size={12} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderEmotionTags = () => (
    <View style={styles.tagGrid}>
      {RITUAL_EMOTION_TAGS.map(tag => {
        const isSelected = selectedEmotions.some(e => e.id === tag.id);
        return (
          <TouchableOpacity
            key={tag.id}
            style={[styles.tag, isSelected && styles.tagSelected]}
            onPress={() => toggleEmotion(tag)}
            activeOpacity={0.7}
          >
            <Text style={styles.tagEmoji}>{tag.emoji}</Text>
            <Text style={[styles.tagLabel, isSelected && styles.tagLabelSelected]}>
              {tag.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStressSlider = () => (
    <View style={styles.stressContainer}>
      <Text style={styles.stressValue}>{stressLevel}</Text>
      <Text style={styles.stressDescription}>
        {stressLevel <= 2 ? 'Very relaxed' : stressLevel <= 4 ? 'Mild stress' : stressLevel <= 6 ? 'Moderate' : stressLevel <= 8 ? 'High stress' : 'Overwhelmed'}
      </Text>
      <View style={styles.stressDots}>
        {Array.from({ length: 10 }, (_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              setStressLevel(i + 1);
              if (Platform.OS !== 'web') {
                void Haptics.selectionAsync();
              }
            }}
            style={[
              styles.stressDot,
              {
                backgroundColor: i < stressLevel
                  ? (i < 3 ? '#14B8A6' : i < 6 ? '#67E8F9' : i < 8 ? '#67E8F9' : '#3B82F6')
                  : Colors.border,
                transform: [{ scale: i + 1 === stressLevel ? 1.4 : 1 }],
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.stressLabels}>
        <Text style={styles.stressLabelEnd}>Calm</Text>
        <Text style={styles.stressLabelEnd}>Overwhelmed</Text>
      </View>
    </View>
  );

  const renderReflection = () => (
    <View>
      <View style={styles.promptCard}>
        <Sparkles size={16} color={Colors.accent} />
        <Text style={styles.promptText}>{reflectionPrompt}</Text>
      </View>
      <TextInput
        style={styles.reflectionInput}
        placeholder="Write whatever comes to mind..."
        placeholderTextColor={Colors.textMuted}
        multiline
        value={reflection}
        onChangeText={setReflection}
        textAlignVertical="top"
      />
    </View>
  );

  const renderIntention = () => (
    <View>
      <TextInput
        style={styles.intentionInput}
        placeholder="My intention for today..."
        placeholderTextColor={Colors.textMuted}
        value={intention}
        onChangeText={setIntention}
      />
      <Text style={styles.suggestionsTitle}>Suggestions</Text>
      <View style={styles.suggestionsGrid}>
        {INTENTION_SUGGESTIONS.map((sug, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.suggestion, intention === sug && styles.suggestionSelected]}
            onPress={() => {
              setIntention(sug);
              if (Platform.OS !== 'web') {
                void Haptics.selectionAsync();
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.suggestionText, intention === sug && styles.suggestionTextSelected]}>
              {sug}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'mood':
        return renderMoodSelection();
      case 'emotions':
        return renderEmotionTags();
      case 'stress':
        return renderStressSlider();
      case 'reflection':
        return renderReflection();
      case 'intention':
        return renderIntention();
      default:
        return null;
    }
  };

  if (showComplete) {
    const pulseScale = completePulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.05],
    });
    return (
      <View style={[styles.completeContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Animated.View style={[styles.completeContent, { opacity: completeAnim, transform: [{ scale: pulseScale }] }]}>
          <Text style={styles.completeEmoji}>{selectedMood?.emoji ?? '🌸'}</Text>
          <Text style={styles.completeTitle}>Check-in complete</Text>
          <Text style={styles.completeSubtitle}>You showed up for yourself today</Text>
          {(ritualQuery.data?.streak.currentStreak ?? 0) > 0 && (
            <View style={styles.completeStreakBadge}>
              <Flame size={18} color="#3B82F6" />
              <Text style={styles.completeStreakText}>
                {(ritualQuery.data?.streak.currentStreak ?? 0) + 1} day streak
              </Text>
            </View>
          )}
          {intention.length > 0 && (
            <View style={styles.completeIntention}>
              <Text style={styles.completeIntentionLabel}>Today's intention</Text>
              <Text style={styles.completeIntentionText}>{intention}</Text>
            </View>
          )}
        </Animated.View>
      </View>
    );
  }

  if (alreadyCheckedIn) {
    const todayEntry = ritualQuery.data?.entries.find(e => e.date === getTodayDateString());
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Today's Check-In</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.alreadyContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.alreadyEmoji}>{todayEntry?.mood.emoji ?? '✨'}</Text>
          <Text style={styles.alreadyTitle}>You already checked in today</Text>
          <Text style={styles.alreadySubtitle}>Come back tomorrow to keep your streak going</Text>

          {todayEntry && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Mood</Text>
                <Text style={styles.summaryValue}>{todayEntry.mood.emoji} {todayEntry.mood.label}</Text>
              </View>
              {todayEntry.emotionTags.length > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Emotions</Text>
                  <Text style={styles.summaryValue}>
                    {todayEntry.emotionTags.map(t => `${t.emoji} ${t.label}`).join(', ')}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Stress</Text>
                <Text style={styles.summaryValue}>{todayEntry.stressLevel}/10</Text>
              </View>
              {todayEntry.reflection.length > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Reflection</Text>
                  <Text style={styles.summaryValueLong}>{todayEntry.reflection}</Text>
                </View>
              )}
              {todayEntry.intention.length > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Intention</Text>
                  <Text style={styles.summaryValue}>{todayEntry.intention}</Text>
                </View>
              )}
            </View>
          )}

          {(ritualQuery.data?.streak.currentStreak ?? 0) > 0 && (
            <View style={styles.streakCard}>
              <Flame size={20} color="#3B82F6" />
              <Text style={styles.streakCardText}>
                {ritualQuery.data?.streak.currentStreak} day streak
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  const isLastStep = stepIndex === STEPS.length - 1;
  const canProceed = step !== 'mood' || selectedMood !== null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.progressBarContainer}>
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
        <Text style={styles.stepCounter}>{stepIndex + 1}/{STEPS.length}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
        >
          <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>
          <Text style={styles.stepSubtitle}>{STEP_SUBTITLES[step]}</Text>
          {renderStepContent()}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.footerButtons}>
          {stepIndex > 0 ? (
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <ChevronLeft size={20} color={Colors.textSecondary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              isLastStep && styles.completeBtn,
              !canProceed && styles.nextButtonDisabled,
            ]}
            onPress={isLastStep ? handleComplete : goNext}
            activeOpacity={0.8}
            disabled={!canProceed}
          >
            {isLastStep ? (
              <>
                <Check size={20} color={Colors.white} />
                <Text style={styles.nextButtonText}>Complete</Text>
              </>
            ) : (
              <>
                <Text style={styles.nextButtonText}>Next</Text>
                <ChevronRight size={20} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.skipHint}>
          {step === 'mood' ? 'Choose a mood to continue' : 'You can skip — select what feels right'}
        </Text>
      </View>
    </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
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
  stepCounter: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 28,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  moodCard: {
    width: '45%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
  },
  moodEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  moodCheckmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  tagSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  tagEmoji: {
    fontSize: 16,
  },
  tagLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  tagLabelSelected: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  stressContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  stressValue: {
    fontSize: 64,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  stressDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 32,
  },
  stressDots: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  stressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  stressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 12,
  },
  stressLabelEnd: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '500' as const,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  reflectionInput: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: Colors.text,
    minHeight: 140,
    borderWidth: 1,
    borderColor: Colors.border,
    lineHeight: 24,
  },
  intentionInput: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestion: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  suggestionTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 80,
  },
  backButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 6,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  completeBtn: {
    backgroundColor: Colors.success,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  skipHint: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 10,
  },
  completeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  completeContent: {
    alignItems: 'center',
  },
  completeEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  completeStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    marginTop: 24,
  },
  completeStreakText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  completeIntention: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
    alignItems: 'center',
    minWidth: 200,
  },
  completeIntentionLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  completeIntentionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  alreadyContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  alreadyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  alreadyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  alreadySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    width: '100%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  summaryValueLong: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
    marginTop: 20,
  },
  streakCardText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
});
