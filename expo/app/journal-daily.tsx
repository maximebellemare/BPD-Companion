import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Sun, Moon, ChevronRight, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useJournal } from '@/providers/JournalProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { JOURNAL_EMOTIONS } from '@/types/journalEntry';
import { Emotion } from '@/types';
import {
  DailyReflectionType,
  MORNING_PROMPTS,
  EVENING_PROMPTS,
  MORNING_INTENTIONS,
} from '@/types/journalDaily';

const ACTIVATION_LABELS = ['Very calm', '', 'Calm', '', 'Moderate', '', 'Activated', '', 'Intense', 'Very intense'];

export default function JournalDailyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const { addDailyReflection } = useJournal();
  const { trackEvent } = useAnalytics();

  const reflectionType: DailyReflectionType = (params.type as DailyReflectionType) || 'morning';
  const isMorning = reflectionType === 'morning';
  const prompts = isMorning ? MORNING_PROMPTS : EVENING_PROMPTS;

  const [step, setStep] = useState<number>(0);
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [activationLevel, setActivationLevel] = useState<number>(5);
  const [text, setText] = useState<string>('');
  const [intention, setIntention] = useState<string>('');
  const [proudMoment, setProudMoment] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const totalSteps = isMorning ? 4 : 4;

  useEffect(() => {
    trackEvent('journal_daily_opened', { type: reflectionType });
  }, [trackEvent, reflectionType]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step, totalSteps, progressAnim]);

  const animateStep = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim]);

  const goNext = useCallback(() => {
    if (step < totalSteps - 1) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateStep();
      setStep(prev => prev + 1);
    }
  }, [step, totalSteps, animateStep]);

  const goBack = useCallback(() => {
    if (step > 0) {
      animateStep();
      setStep(prev => prev - 1);
    }
  }, [step, animateStep]);

  const toggleEmotion = useCallback((emotion: Emotion) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmotions(prev =>
      prev.some(e => e.id === emotion.id)
        ? prev.filter(e => e.id !== emotion.id)
        : [...prev, emotion]
    );
  }, []);

  const handleSave = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addDailyReflection({
      type: reflectionType,
      emotions: selectedEmotions,
      activationLevel,
      text: text.trim(),
      intention: isMorning ? intention : undefined,
      proudMoment: !isMorning ? proudMoment : undefined,
      savedAsImportant: false,
      addToWeeklyReflection: false,
    });

    trackEvent('journal_daily_saved', {
      type: reflectionType,
      emotionCount: selectedEmotions.length,
      activationLevel,
      hasText: !!text.trim(),
    });

    setIsSaved(true);
  }, [reflectionType, selectedEmotions, activationLevel, text, intention, proudMoment, isMorning, addDailyReflection, trackEvent]);

  if (isSaved) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.savedContainer}>
          <View style={[styles.savedIcon, { backgroundColor: isMorning ? '#FFF5E6' : '#E8ECF7' }]}>
            {isMorning ? (
              <Sun size={32} color="#E8A838" />
            ) : (
              <Moon size={32} color="#7A82AB" />
            )}
          </View>
          <Text style={styles.savedTitle}>
            {isMorning ? 'Morning set' : 'Evening reflected'}
          </Text>
          <Text style={styles.savedSubtitle}>
            {isMorning
              ? 'You\'ve shown up for yourself today. That matters.'
              : 'Reflecting on your day builds emotional awareness over time.'}
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            {isMorning ? (
              <Sun size={18} color="#E8A838" />
            ) : (
              <Moon size={18} color="#7A82AB" />
            )}
            <Text style={styles.headerTitle}>
              {isMorning ? 'Morning Check-In' : 'Evening Reflection'}
            </Text>
          </View>
          <Text style={styles.stepLabel}>{step + 1}/{totalSteps}</Text>
        </View>

        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: isMorning ? '#E8A838' : '#7A82AB',
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {step === 0 && (
              <View style={styles.stepContent}>
                <Text style={styles.promptText}>
                  {isMorning ? 'How do you feel this morning?' : 'How are you feeling now?'}
                </Text>
                <Text style={styles.promptSub}>Select all that apply</Text>
                <View style={styles.emotionGrid}>
                  {JOURNAL_EMOTIONS.slice(0, 12).map(emotion => {
                    const selected = selectedEmotions.some(e => e.id === emotion.id);
                    return (
                      <TouchableOpacity
                        key={emotion.id}
                        style={[styles.emotionChip, selected && styles.emotionChipSelected]}
                        onPress={() => toggleEmotion(emotion)}
                      >
                        <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                        <Text style={[styles.emotionLabel, selected && styles.emotionLabelSelected]}>
                          {emotion.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.promptText}>
                  {isMorning ? 'How activated do you feel?' : 'How intense was today?'}
                </Text>
                <View style={styles.activationRow}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(level => {
                    const isActive = activationLevel === level;
                    const color = level <= 3 ? Colors.success : level <= 6 ? '#E8A838' : Colors.danger;
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.activationDot,
                          isActive && { backgroundColor: color, transform: [{ scale: 1.15 }] },
                        ]}
                        onPress={() => {
                          setActivationLevel(level);
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Text style={[styles.activationText, isActive && styles.activationTextActive]}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.activationLabel}>
                  {ACTIVATION_LABELS[activationLevel - 1] || ''}
                </Text>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.promptText}>
                  {prompts[Math.floor(Math.random() * prompts.length)]}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={text}
                  onChangeText={setText}
                  placeholder="Write whatever comes to mind..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              </View>
            )}

            {step === 3 && isMorning && (
              <View style={styles.stepContent}>
                <Text style={styles.promptText}>Set an intention for today</Text>
                <Text style={styles.promptSub}>Choose one or write your own</Text>
                <View style={styles.intentionGrid}>
                  {MORNING_INTENTIONS.map(item => {
                    const selected = intention === item.label;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.intentionChip, selected && styles.intentionChipSelected]}
                        onPress={() => {
                          setIntention(item.label);
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Text style={styles.intentionEmoji}>{item.emoji}</Text>
                        <Text style={[styles.intentionLabel, selected && styles.intentionLabelSelected]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TextInput
                  style={styles.intentionInput}
                  value={intention}
                  onChangeText={setIntention}
                  placeholder="Or type your own..."
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            )}

            {step === 3 && !isMorning && (
              <View style={styles.stepContent}>
                <Text style={styles.promptText}>Was there a moment you're proud of?</Text>
                <Text style={styles.promptSub}>Even small moments count</Text>
                <TextInput
                  style={styles.textInput}
                  value={proudMoment}
                  onChangeText={setProudMoment}
                  placeholder="I'm proud that I..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={goBack}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}

          {step === totalSteps - 1 ? (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: isMorning ? '#E8A838' : '#7A82AB' }]}
              onPress={handleSave}
            >
              <Check size={18} color={Colors.white} />
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: isMorning ? '#E8A838' : '#7A82AB' }]}
              onPress={goNext}
            >
              <Text style={styles.nextBtnText}>Next</Text>
              <ChevronRight size={18} color={Colors.white} />
            </TouchableOpacity>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    width: 40,
    textAlign: 'right' as const,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    flexGrow: 1,
  },
  stepContent: {},
  promptText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 30,
    marginBottom: 8,
  },
  promptSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  emotionChipSelected: {
    backgroundColor: Colors.brandTealSoft,
    borderColor: Colors.brandTeal,
  },
  emotionEmoji: {
    fontSize: 16,
  },
  emotionLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  emotionLabelSelected: {
    color: Colors.brandTeal,
    fontWeight: '600' as const,
  },
  activationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 4,
  },
  activationDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activationText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  activationTextActive: {
    color: Colors.white,
    fontWeight: '700' as const,
  },
  activationLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  textInput: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 160,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: 8,
  },
  intentionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  intentionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  intentionChipSelected: {
    backgroundColor: '#FFF5E6',
    borderColor: '#E8A838',
  },
  intentionEmoji: {
    fontSize: 14,
  },
  intentionLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  intentionLabelSelected: {
    color: '#C08020',
    fontWeight: '600' as const,
  },
  intentionInput: {
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  savedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  savedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  savedTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  savedSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  doneBtn: {
    backgroundColor: Colors.brandTeal,
    borderRadius: 14,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
