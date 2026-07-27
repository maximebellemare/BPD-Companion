import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Animated,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';
import { useMovement } from '@/providers/MovementProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  MovementType,
  MovementIntensity,
  MoodLevel,
  MOVEMENT_TYPES,
  INTENSITY_OPTIONS,
  MOOD_LEVELS,
  DURATION_PRESETS,
} from '@/types/movement';

type Step = 'type' | 'duration' | 'intensity' | 'mood_before' | 'mood_after' | 'notes';
const STEPS: Step[] = ['type', 'duration', 'intensity', 'mood_before', 'mood_after', 'notes'];

export default function MovementAddScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLanguage();
  const { trackEvent } = useAnalytics();
  const { addEntry, isAdding } = useMovement();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [type, setType] = useState<MovementType | null>(null);
  const [customType, setCustomType] = useState('');
  const [duration, setDuration] = useState<number>(15);
  const [intensity, setIntensity] = useState<MovementIntensity>('gentle');
  const [moodBefore, setMoodBefore] = useState<MoodLevel>(3);
  const [moodAfter, setMoodAfter] = useState<MoodLevel>(3);
  const [notes, setNotes] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const step = STEPS[currentStep];
  const progress = (currentStep + 1) / STEPS.length;

  const animateTransition = useCallback((callback: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const canProceed = useCallback(() => {
    switch (step) {
      case 'type': return type !== null;
      case 'duration': return duration > 0;
      case 'intensity': return true;
      case 'mood_before': return true;
      case 'mood_after': return true;
      case 'notes': return true;
      default: return false;
    }
  }, [step, type, duration]);

  const handleNext = useCallback(() => {
    if (!canProceed()) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep < STEPS.length - 1) {
      animateTransition(() => setCurrentStep(prev => prev + 1));
    }
  }, [canProceed, currentStep, animateTransition]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      animateTransition(() => setCurrentStep(prev => prev - 1));
    } else {
      router.back();
    }
  }, [currentStep, animateTransition, router]);

  const handleSave = useCallback(async () => {
    if (!type) return;
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    try {
      await addEntry({
        type,
        customType: type === 'other' ? customType : undefined,
        duration,
        intensity,
        moodBefore,
        moodAfter,
        notes,
      });
      trackEvent('movement_logged', {
        type,
        duration,
        intensity,
        mood_shift: moodAfter - moodBefore,
      });
      router.back();
    } catch (error) {
      console.log('[MovementAdd] Error saving:', error);
    }
  }, [type, customType, duration, intensity, moodBefore, moodAfter, notes, addEntry, trackEvent, router]);

  const renderTypeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{localizedText('What kind of movement?', '¿Qué tipo de movimiento?')}</Text>
      <Text style={styles.stepSubtitle}>{localizedText('Choose what feels right for today', 'Elige lo que se sienta bien para hoy')}</Text>
      <View style={styles.typeGrid}>
        {MOVEMENT_TYPES.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[styles.typeCard, type === t.value && styles.typeCardSelected]}
            onPress={() => {
              setType(t.value);
              if (Platform.OS !== 'web') {
                void Haptics.selectionAsync();
              }
            }}
            testID={`movement-type-${t.value}`}
          >
            <Text style={styles.typeEmoji}>{t.icon}</Text>
            <Text style={[styles.typeLabel, type === t.value && styles.typeLabelSelected]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {type === 'other' && (
        <TextInput
          style={styles.customTypeInput}
          placeholder={localizedText('Describe your movement...', 'Describe tu movimiento...')}
          placeholderTextColor={Colors.textMuted}
          value={customType}
          onChangeText={setCustomType}
        />
      )}
    </View>
  );

  const renderDurationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{localizedText('How long?', '¿Cuánto tiempo?')}</Text>
      <Text style={styles.stepSubtitle}>{localizedText('Even a few minutes counts', 'Incluso unos minutos cuentan')}</Text>
      <View style={styles.durationGrid}>
        {DURATION_PRESETS.map(d => (
          <TouchableOpacity
            key={d.value}
            style={[styles.durationChip, duration === d.value && styles.durationChipSelected]}
            onPress={() => {
              setDuration(d.value);
              if (Platform.OS !== 'web') {
                void Haptics.selectionAsync();
              }
            }}
          >
            <Text style={[styles.durationChipText, duration === d.value && styles.durationChipTextSelected]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.customDurationRow}>
        <TouchableOpacity
          style={styles.durationAdjustBtn}
          onPress={() => setDuration(prev => Math.max(1, prev - 5))}
        >
          <Text style={styles.durationAdjustText}>−5</Text>
        </TouchableOpacity>
        <View style={styles.durationDisplay}>
          <Text style={styles.durationValue}>{duration}</Text>
          <Text style={styles.durationUnit}>{localizedText('minutes', 'minutos')}</Text>
        </View>
        <TouchableOpacity
          style={styles.durationAdjustBtn}
          onPress={() => setDuration(prev => Math.min(180, prev + 5))}
        >
          <Text style={styles.durationAdjustText}>+5</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderIntensityStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{localizedText('How intense?', '¿Qué tan intenso?')}</Text>
      <Text style={styles.stepSubtitle}>{localizedText('No judgment — gentle is powerful too', 'Sin juicio; lo suave también es poderoso')}</Text>
      <View style={styles.intensityList}>
        {INTENSITY_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.intensityCard, intensity === opt.value && styles.intensityCardSelected]}
            onPress={() => {
              setIntensity(opt.value);
              if (Platform.OS !== 'web') {
                void Haptics.selectionAsync();
              }
            }}
          >
            <View style={styles.intensityInfo}>
              <Text style={[styles.intensityLabel, intensity === opt.value && styles.intensityLabelSelected]}>
                {opt.label}
              </Text>
              <Text style={styles.intensityDesc}>{opt.description}</Text>
            </View>
            {intensity === opt.value && (
              <View style={styles.intensityCheck}>
                <Check size={16} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMoodStep = (isBefore: boolean) => {
    const currentMood = isBefore ? moodBefore : moodAfter;
    const setMood = isBefore ? setMoodBefore : setMoodAfter;
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>
          {isBefore
            ? localizedText('How are you feeling now?', '¿Cómo te sientes ahora?')
            : localizedText('How do you feel after?', '¿Cómo te sientes después?')}
        </Text>
        <Text style={styles.stepSubtitle}>
          {isBefore
            ? localizedText('Before you move — just notice', 'Antes de moverte, solo observa')
            : localizedText('Did movement shift anything?', '¿El movimiento cambió algo?')}
        </Text>
        <View style={styles.moodList}>
          {MOOD_LEVELS.map(m => (
            <TouchableOpacity
              key={m.value}
              style={[styles.moodCard, currentMood === m.value && styles.moodCardSelected]}
              onPress={() => {
                setMood(m.value);
                if (Platform.OS !== 'web') {
                  void Haptics.selectionAsync();
                }
              }}
            >
              <Text style={styles.moodCardEmoji}>{m.emoji}</Text>
              <Text style={[styles.moodCardLabel, currentMood === m.value && styles.moodCardLabelSelected]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {!isBefore && moodAfter !== moodBefore && (
          <View style={styles.moodCompare}>
            <Text style={styles.moodCompareText}>
              {moodAfter > moodBefore
                ? localizedText(
                  `Movement helped — you went from ${MOOD_LEVELS.find(m => m.value === moodBefore)?.emoji} to ${MOOD_LEVELS.find(m => m.value === moodAfter)?.emoji}`,
                  `El movimiento ayudó: pasaste de ${MOOD_LEVELS.find(m => m.value === moodBefore)?.emoji} a ${MOOD_LEVELS.find(m => m.value === moodAfter)?.emoji}`,
                )
                : localizedText("That's okay — not every session shifts things", 'Está bien; no toda sesión cambia las cosas')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderNotesStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{localizedText('Any reflections?', '¿Alguna reflexión?')}</Text>
      <Text style={styles.stepSubtitle}>{localizedText('Optional — whatever comes to mind', 'Opcional; lo que te venga a la mente')}</Text>
      <TextInput
        style={styles.notesInput}
        placeholder={localizedText('How did this movement feel? Did it help you reset?', '¿Cómo se sintió este movimiento? ¿Te ayudó a reiniciar?')}
        placeholderTextColor={Colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
        textAlignVertical="top"
      />
      <View style={styles.notePrompts}>
        {[
          localizedText('Helped me reset', 'Me ayudó a reiniciar'),
          localizedText('Needed this today', 'Necesitaba esto hoy'),
          localizedText('Felt grounding', 'Me ayudó a anclarme'),
          localizedText('Released tension', 'Liberé tensión'),
        ].map(prompt => (
          <TouchableOpacity
            key={prompt}
            style={styles.notePromptChip}
            onPress={() => setNotes(prev => prev ? `${prev}. ${prompt}` : prompt)}
          >
            <Text style={styles.notePromptText}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'type': return renderTypeStep();
      case 'duration': return renderDurationStep();
      case 'intensity': return renderIntensityStep();
      case 'mood_before': return renderMoodStep(true);
      case 'mood_after': return renderMoodStep(false);
      case 'notes': return renderNotesStep();
      default: return null;
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn} testID="movement-add-back">
          {currentStep > 0 ? <ChevronLeft size={22} color={Colors.text} /> : <X size={22} color={Colors.text} />}
        </TouchableOpacity>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderCurrentStep()}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {isLastStep ? (
          <TouchableOpacity
            style={[styles.primaryBtn, isAdding && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={isAdding}
            testID="movement-save"
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Check size={20} color={Colors.white} />
                <Text style={styles.primaryBtnText}>{localizedText('Save Movement', 'Guardar movimiento')}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, !canProceed() && styles.primaryBtnDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
            testID="movement-next"
          >
            <Text style={styles.primaryBtnText}>{localizedText('Continue', 'Continuar')}</Text>
            <ChevronRight size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stepContent: {
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 28,
    lineHeight: 21,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '47%' as unknown as number,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.borderLight,
    gap: 8,
  },
  typeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  typeEmoji: {
    fontSize: 28,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  typeLabelSelected: {
    color: Colors.primaryDark,
  },
  customTypeInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 14,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  durationChip: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  durationChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  durationChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  durationChipTextSelected: {
    color: Colors.primaryDark,
  },
  customDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  durationAdjustBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationAdjustText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  durationDisplay: {
    alignItems: 'center',
  },
  durationValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  durationUnit: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  intensityList: {
    gap: 10,
  },
  intensityCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  intensityCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  intensityInfo: {
    flex: 1,
  },
  intensityLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  intensityLabelSelected: {
    color: Colors.primaryDark,
  },
  intensityDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  intensityCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodList: {
    gap: 10,
  },
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    gap: 14,
  },
  moodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  moodCardEmoji: {
    fontSize: 26,
  },
  moodCardLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  moodCardLabelSelected: {
    color: Colors.primaryDark,
  },
  moodCompare: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  moodCompareText: {
    fontSize: 14,
    color: Colors.accent,
    textAlign: 'center',
    lineHeight: 20,
  },
  notesInput: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
    lineHeight: 22,
  },
  notePrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  notePromptChip: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  notePromptText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
