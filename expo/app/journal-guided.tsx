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
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, Loader } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useJournal } from '@/providers/JournalProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { GUIDED_REFLECTION_FLOWS } from '@/data/guidedReflectionFlows';
import { JOURNAL_EMOTIONS } from '@/types/journalEntry';
import { Emotion } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

export default function JournalGuidedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ flowId?: string }>();
  const { addEntry, analyzeEntry, isAnalyzing } = useJournal();
  const { trackEvent } = useAnalytics();
  useLanguage();

  const flow = GUIDED_REFLECTION_FLOWS.find(f => f.id === params.flowId);
  const steps = flow?.steps ?? [];

  const [stepIndex, setStepIndex] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [distressLevel, setDistressLevel] = useState<number>(5);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const totalSteps = steps.length + 2;
  const isEmotionStep = stepIndex === steps.length;
  const isDistressStep = stepIndex === steps.length + 1;
  const currentStep = steps[stepIndex];

  useEffect(() => {
    if (flow) {
      trackEvent('journal_guided_opened', { flowId: flow.id, flowTitle: flow.title });
    }
  }, [flow, trackEvent]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (stepIndex + 1) / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [stepIndex, totalSteps, progressAnim]);

  const animateTransition = useCallback((_direction: 'forward' | 'back') => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim]);

  const goNext = useCallback(() => {
    if (stepIndex < totalSteps - 1) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateTransition('forward');
      setStepIndex(prev => prev + 1);
    }
  }, [stepIndex, totalSteps, animateTransition]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      animateTransition('back');
      setStepIndex(prev => prev - 1);
    }
  }, [stepIndex, animateTransition]);

  const handleResponseChange = useCallback((stepId: string, text: string) => {
    setResponses(prev => ({ ...prev, [stepId]: text }));
  }, []);

  const toggleEmotion = useCallback((emotion: Emotion) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmotions(prev =>
      prev.some(e => e.id === emotion.id)
        ? prev.filter(e => e.id !== emotion.id)
        : [...prev, emotion]
    );
  }, []);

  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const handleSave = useCallback(async () => {
    if (!flow) return;
    setIsSaving(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const currentSteps = stepsRef.current;
    const contentParts = currentSteps.map(s => {
      const response = responses[s.id] || '';
      return `${s.prompt}\n${response}`;
    }).filter(p => p.trim());

    const content = contentParts.join('\n\n');

    try {
      const entry = addEntry({
        format: 'guided_reflection',
        title: flow.title,
        content,
        emotions: selectedEmotions,
        triggers: [],
        distressLevel,
        guidedFlowId: flow.id,
        guidedResponses: responses,
      });

      trackEvent('journal_guided_completed', {
        flowId: flow.id,
        stepCount: currentSteps.length,
        emotionCount: selectedEmotions.length,
        distressLevel,
      });

      try {
        await analyzeEntry(entry);
      } catch {
        console.log('[JournalGuided] AI analysis skipped');
      }

      setIsSaved(true);
    } catch (err) {
      console.error('[JournalGuided] Save failed:', err);
      Alert.alert(
        localizedText('Error', 'Error'),
        localizedText('Could not save. Please try again.', 'No se pudo guardar. Inténtalo de nuevo.'),
      );
    } finally {
      setIsSaving(false);
    }
  }, [flow, responses, selectedEmotions, distressLevel, addEntry, analyzeEntry, trackEvent]);

  if (!flow) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{localizedText('Flow not found', 'No se encontró esta guía')}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>{localizedText('Go back', 'Volver')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isSaved) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.savedContainer}>
          <View style={styles.savedIcon}>
            <Check size={32} color={Colors.brandTeal} />
          </View>
          <Text style={styles.savedTitle}>{localizedText('Reflection complete', 'Reflexión completa')}</Text>
          <Text style={styles.savedSubtitle}>
            {localizedText(
              'You walked through this with honesty. That takes courage.',
              'Recorriste esto con honestidad. Eso requiere valentía.',
            )}
          </Text>

          {isAnalyzing && (
            <View style={styles.analyzingRow}>
              <Loader size={16} color={Colors.brandTeal} />
              <Text style={styles.analyzingText}>{localizedText('Generating insight...', 'Generando insight...')}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>{localizedText('Done', 'Listo')}</Text>
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
          <Text style={styles.headerTitle} numberOfLines={1}>{flow.title}</Text>
          <Text style={styles.stepCounter}>{stepIndex + 1}/{totalSteps}</Text>
        </View>

        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {!isEmotionStep && !isDistressStep && currentStep && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepPrompt}>{currentStep.prompt}</Text>
                <TextInput
                  style={styles.stepInput}
                  value={responses[currentStep.id] || ''}
                  onChangeText={(text) => handleResponseChange(currentStep.id, text)}
                  placeholder={currentStep.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
                {currentStep.optional && (
                  <Text style={styles.optionalLabel}>{localizedText('This step is optional', 'Este paso es opcional')}</Text>
                )}
              </View>
            )}

            {isEmotionStep && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepPrompt}>{localizedText('How are you feeling right now?', '¿Cómo te sientes ahora mismo?')}</Text>
                <Text style={styles.stepSubprompt}>{localizedText('Select all that apply', 'Selecciona todo lo que corresponda')}</Text>
                <View style={styles.emotionGrid}>
                  {JOURNAL_EMOTIONS.map(emotion => {
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

            {isDistressStep && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepPrompt}>{localizedText('How intense is your distress right now?', '¿Qué tan intenso se siente tu malestar ahora mismo?')}</Text>
                <View style={styles.distressContainer}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.distressDot,
                        distressLevel === level && {
                          backgroundColor:
                            level <= 3 ? Colors.success : level <= 6 ? Colors.accent : Colors.danger,
                          transform: [{ scale: 1.2 }],
                        },
                      ]}
                      onPress={() => {
                        setDistressLevel(level);
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text
                        style={[
                          styles.distressDotText,
                          distressLevel === level && styles.distressDotTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.navBtn, stepIndex === 0 && styles.navBtnDisabled]}
            onPress={goBack}
            disabled={stepIndex === 0}
          >
            <ChevronLeft size={20} color={stepIndex === 0 ? Colors.textMuted : Colors.text} />
            <Text style={[styles.navBtnText, stepIndex === 0 && styles.navBtnTextDisabled]}>{localizedText('Back', 'Atrás')}</Text>
          </TouchableOpacity>

          {isDistressStep ? (
            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Sparkles size={18} color={Colors.white} />
              <Text style={styles.saveBtnText}>
                {isSaving
                  ? localizedText('Saving...', 'Guardando...')
                  : localizedText('Save & Analyze', 'Guardar y analizar')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
              <Text style={styles.nextBtnText}>
                {currentStep?.optional && !responses[currentStep.id]?.trim()
                  ? localizedText('Skip', 'Omitir')
                  : localizedText('Next', 'Siguiente')}
              </Text>
              <ChevronRight size={20} color={Colors.white} />
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
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  stepCounter: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    width: 40,
    textAlign: 'right',
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
    backgroundColor: Colors.brandTeal,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    flexGrow: 1,
  },
  stepContainer: {},
  stepPrompt: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 8,
  },
  stepSubprompt: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  stepInput: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 180,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: 12,
  },
  optionalLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 20,
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
  distressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 4,
  },
  distressDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distressDotText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  distressDotTextActive: {
    color: Colors.white,
    fontWeight: '700' as const,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  navBtnTextDisabled: {
    color: Colors.textMuted,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brandTeal,
    borderRadius: 24,
    paddingHorizontal: 22,
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
    backgroundColor: Colors.brandTeal,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  saveBtnDisabled: {
    opacity: 0.6,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brandTealSoft,
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
    marginBottom: 24,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  analyzingText: {
    fontSize: 14,
    color: Colors.brandTeal,
    fontWeight: '500' as const,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  backLink: {
    fontSize: 15,
    color: Colors.brandTeal,
    fontWeight: '600' as const,
  },
});
