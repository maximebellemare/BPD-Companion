import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronRight, ChevronLeft, Check, Wind, Anchor, BookOpen, Heart, RefreshCw, Search, MessageCircle, Timer, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { EMOTIONS, TRIGGERS, BODY_SENSATIONS, URGES } from '@/constants/data';
import { useApp } from '@/providers/AppProvider';
import { Emotion, Trigger, BodySensation, Urge, CheckInEntry, JournalEntry } from '@/types';
import { generateCheckInRecommendations } from '@/services/recommendation/copingRecommendationService';
import { CopingRecommendation } from '@/types/recommendation';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useNotificationEntry } from '@/providers/NotificationEntryProvider';
import NotificationEntryBanner from '@/components/NotificationEntryBanner';

const STEPS = ['triggers', 'emotions', 'body', 'urges', 'intensity', 'notes', 'suggestions'] as const;

const CI_ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Wind, Anchor, BookOpen, Heart, RefreshCw, Search, MessageCircle, Timer,
};
type Step = typeof STEPS[number];

const STEP_TITLES: Record<Step, string> = {
  triggers: 'What triggered this?',
  emotions: 'What are you feeling?',
  body: 'Where do you feel it?',
  urges: 'What urges are coming up?',
  intensity: 'How intense is this?',
  notes: 'Anything else?',
  suggestions: 'Here for you',
};

const STEP_SUBTITLES: Record<Step, string> = {
  triggers: 'Select all that apply. No judgment here.',
  emotions: 'Name it to tame it. Pick what fits.',
  body: 'Your body holds wisdom. Notice where.',
  urges: "It's okay to have urges. Naming them gives you power.",
  intensity: 'On a scale of 1-10, how intense right now?',
  notes: 'Optional. Write anything you need to get out.',
  suggestions: 'Based on what you shared, these might help right now.',
};

export default function CheckInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ prefillNotes?: string; source?: string }>();
  const { addJournalEntry, setDistressLevel } = useApp();
  const { trackEvent, trackFlowStart, trackFlowComplete } = useAnalytics();
  const { isFromNotification, markFlowCompleted } = useNotificationEntry();

  useEffect(() => {
    trackFlowStart('check_in');
    trackEvent('screen_view', { screen: 'check_in', source: params.source ?? 'direct' });
  }, [trackFlowStart, trackEvent, params.source]);

  const [stepIndex, setStepIndex] = useState<number>(0);
  const [selectedTriggers, setSelectedTriggers] = useState<Trigger[]>([]);
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [selectedSensations, setSelectedSensations] = useState<BodySensation[]>([]);
  const [selectedUrges, setSelectedUrges] = useState<Urge[]>([]);
  const [intensity, setIntensity] = useState<number>(5);
  const [notes, setNotes] = useState<string>(params.prefillNotes ?? '');

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const step = STEPS[stepIndex];

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
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(direction === 'forward' ? 30 : -30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
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

  const [checkInRecs, setCheckInRecs] = useState<CopingRecommendation[]>([]);

  const handleSaveAndShowSuggestions = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const checkIn: CheckInEntry = {
      id: `ci_${Date.now()}`,
      timestamp: Date.now(),
      triggers: selectedTriggers,
      emotions: selectedEmotions,
      urges: selectedUrges,
      bodySensations: selectedSensations,
      intensityLevel: intensity,
      notes,
    };

    const entry: JournalEntry = {
      id: `j_${Date.now()}`,
      timestamp: Date.now(),
      checkIn,
    };

    addJournalEntry(entry);

    if (isFromNotification()) {
      markFlowCompleted(intensity);
    }

    trackFlowComplete('check_in', {
      intensity,
      trigger_count: selectedTriggers.length,
      emotion_count: selectedEmotions.length,
      urge_count: selectedUrges.length,
    });
    trackEvent('check_in_completed', {
      intensity,
      trigger_count: selectedTriggers.length,
    });

    if (intensity >= 8) {
      setDistressLevel('crisis');
    } else if (intensity >= 6) {
      setDistressLevel('high');
    } else if (intensity >= 4) {
      setDistressLevel('moderate');
    } else {
      setDistressLevel('low');
    }

    const recs = generateCheckInRecommendations(
      intensity,
      selectedEmotions.map(e => e.label),
      selectedTriggers.map(t => t.label),
      selectedTriggers.map(t => t.category),
      selectedUrges.map(u => ({ label: u.label, risk: u.risk })),
    );
    setCheckInRecs(recs);

    if (recs.length > 0) {
      animateTransition('forward', () => setStepIndex(STEPS.length - 1));
    } else {
      router.back();
      if (intensity >= 8) {
        setTimeout(() => router.push('/safety-mode'), 300);
      }
    }
  }, [selectedTriggers, selectedEmotions, selectedUrges, selectedSensations, intensity, notes, addJournalEntry, setDistressLevel, router, animateTransition, trackFlowComplete, trackEvent, isFromNotification, markFlowCompleted]);

  const handleComplete = useCallback(() => {
    router.back();
    if (intensity >= 8) {
      setTimeout(() => router.push('/safety-mode'), 300);
    }
  }, [intensity, router]);

  const toggleItem = useCallback(<T extends { id: string }>(
    items: T[],
    setItems: React.Dispatch<React.SetStateAction<T[]>>,
    item: T
  ) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setItems(prev =>
      prev.find(i => i.id === item.id)
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item]
    );
  }, []);

  const renderChips = useCallback(<T extends { id: string; label: string }>(
    items: T[],
    selected: T[],
    setSelected: React.Dispatch<React.SetStateAction<T[]>>,
    extraInfo?: (item: T) => string | undefined
  ) => (
    <View style={styles.chipGrid}>
      {items.map(item => {
        const isSelected = selected.some(s => s.id === item.id);
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => toggleItem(items, setSelected, item)}
            activeOpacity={0.7}
          >
            {extraInfo?.(item) && (
              <Text style={styles.chipEmoji}>{extraInfo(item)}</Text>
            )}
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  ), [toggleItem]);

  const renderIntensitySlider = () => (
    <View style={styles.intensityContainer}>
      <Text style={styles.intensityValue}>{intensity}</Text>
      <Text style={styles.intensityLabel}>
        {intensity <= 3 ? 'Manageable' : intensity <= 6 ? 'Difficult' : intensity <= 8 ? 'Very intense' : 'Overwhelming'}
      </Text>
      <View style={styles.intensityDots}>
        {Array.from({ length: 10 }, (_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              setIntensity(i + 1);
              if (Platform.OS !== 'web') {
                void Haptics.selectionAsync();
              }
            }}
            style={[
              styles.intensityDot,
              {
                backgroundColor: i < intensity
                  ? (i < 3 ? Colors.success : i < 6 ? Colors.accent : Colors.danger)
                  : Colors.border,
                transform: [{ scale: i + 1 === intensity ? 1.3 : 1 }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'triggers':
        return renderChips(TRIGGERS, selectedTriggers, setSelectedTriggers);
      case 'emotions':
        return renderChips(EMOTIONS, selectedEmotions, setSelectedEmotions, (e: Emotion) => e.emoji);
      case 'body':
        return renderChips(BODY_SENSATIONS, selectedSensations, setSelectedSensations);
      case 'urges':
        return renderChips(URGES, selectedUrges, setSelectedUrges);
      case 'intensity':
        return renderIntensitySlider();
      case 'notes':
        return (
          <TextInput
            style={styles.notesInput}
            placeholder="Whatever you need to say..."
            placeholderTextColor={Colors.textMuted}
            multiline
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        );
      case 'suggestions':
        return (
          <View style={styles.suggestionsContainer}>
            {checkInRecs.map((rec) => {
              const IconComp = CI_ICON_MAP[rec.icon] ?? Wind;
              const isHigh = rec.priority === 'high';
              return (
                <TouchableOpacity
                  key={rec.id}
                  style={[
                    styles.suggestionCard,
                    isHigh && styles.suggestionCardHighlight,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                    setTimeout(() => router.push(rec.route as never), 200);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.suggestionIconWrap,
                    { backgroundColor: isHigh ? '#FFFFFF' : Colors.primaryLight },
                  ]}>
                    <IconComp size={20} color={isHigh ? Colors.danger : Colors.primary} />
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionTitle}>{rec.title}</Text>
                    <Text style={styles.suggestionMsg}>{rec.message}</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.companionSuggestion}
              onPress={() => {
                if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
                setTimeout(() => router.push('/(tabs)/companion' as never), 200);
              }}
              activeOpacity={0.7}
              testID="checkin-companion-cta"
            >
              <View style={styles.companionSuggestionIcon}>
                <Sparkles size={18} color={Colors.primary} />
              </View>
              <View style={styles.suggestionContent}>
                <Text style={styles.companionSuggestionTitle}>Talk this through</Text>
                <Text style={styles.companionSuggestionMsg}>
                  {intensity >= 7 ? 'Get calmer support with AI Companion' : 'Process what you\'re feeling with AI Companion'}
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  const isLastStep = stepIndex === STEPS.length - 1;
  const isNotesStep = step === 'notes';

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

      {stepIndex === 0 && isFromNotification('daily_checkin') && (
        <NotificationEntryBanner compact />
      )}
      {stepIndex === 0 && isFromNotification('calm_followup') && (
        <NotificationEntryBanner compact />
      )}
      {stepIndex === 0 && isFromNotification('regulation_followup') && (
        <NotificationEntryBanner compact />
      )}

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
            style={[styles.nextButton, (isLastStep || isNotesStep) && styles.completeButton]}
            onPress={isLastStep ? handleComplete : isNotesStep ? handleSaveAndShowSuggestions : goNext}
            activeOpacity={0.8}
          >
            {isLastStep ? (
              <>
                <Check size={20} color={Colors.white} />
                <Text style={styles.nextButtonText}>Done</Text>
              </>
            ) : isNotesStep ? (
              <>
                <Check size={20} color={Colors.white} />
                <Text style={styles.nextButtonText}>Save</Text>
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
          {isLastStep ? 'Tap a tool to try it, or Done to close' : isNotesStep ? 'This will be saved to your journal' : 'You can skip — select what feels right'}
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  chipTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '600' as const,
  },
  intensityContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  intensityValue: {
    fontSize: 64,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  intensityLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 32,
  },
  intensityDots: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  intensityDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: Colors.text,
    minHeight: 160,
    borderWidth: 1,
    borderColor: Colors.border,
    lineHeight: 24,
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
  completeButton: {
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
  suggestionsContainer: {
    gap: 12,
  },
  suggestionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionCardHighlight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0B1238',
  },
  suggestionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  suggestionContent: {
    flex: 1,
    marginRight: 8,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  suggestionMsg: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  companionSuggestion: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: 4,
  },
  companionSuggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  companionSuggestionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
    marginBottom: 3,
  },
  companionSuggestionMsg: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
