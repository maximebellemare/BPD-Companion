import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, ArrowRight, Shield, Heart, Compass } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useConflictAlignment, useIdentityValues } from '@/hooks/useIdentity';


type Step = 'feeling' | 'fear' | 'need' | 'values' | 'protects' | 'summary';

const STEPS: Step[] = ['feeling', 'fear', 'need', 'values', 'protects', 'summary'];

const STEP_CONFIG: Record<Step, { title: string; question: string; placeholder: string; icon: React.ReactNode }> = {
  feeling: {
    title: 'What are you feeling?',
    question: 'Name the emotion that is most present right now.',
    placeholder: 'Hurt, angry, abandoned, anxious...',
    icon: <Heart size={20} color="#E84393" />,
  },
  fear: {
    title: 'What are you afraid this means?',
    question: 'What story is your mind telling you about this situation?',
    placeholder: 'They don\'t care, I\'m too much, this is ending...',
    icon: <Shield size={20} color="#D4956A" />,
  },
  need: {
    title: 'What do you actually need?',
    question: 'Separate from panic, what would truly help right now?',
    placeholder: 'Reassurance, space, honesty, to feel safe...',
    icon: <Compass size={20} color="#6B9080" />,
  },
  values: {
    title: 'What response aligns with your values?',
    question: 'Thinking about what matters most to you, how would you want to respond?',
    placeholder: 'I want to respond with dignity and honesty...',
    icon: <Check size={20} color="#8B5CF6" />,
  },
  protects: {
    title: 'What protects both connection and self-respect?',
    question: 'What action would honor both the relationship and your own worth?',
    placeholder: 'Taking a pause, expressing needs calmly...',
    icon: <Shield size={20} color="#3B82F6" />,
  },
  summary: {
    title: 'Your Alignment',
    question: '',
    placeholder: '',
    icon: <Check size={20} color={Colors.primary} />,
  },
};

export default function ConflictAlignmentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessions, save, isSaving } = useConflictAlignment();
  const { selectedValues } = useIdentityValues();
  const [currentStep, setCurrentStep] = useState(0);
  const [feeling, setFeeling] = useState('');
  const [fear, setFear] = useState('');
  const [need, setNeed] = useState('');
  const [valuesResponse, setValuesResponse] = useState('');
  const [protectsBoth, setProtectsBoth] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [currentStep, stepAnim]);

  const step = STEPS[currentStep];
  const config = STEP_CONFIG[step];

  const getValue = useCallback((): string => {
    switch (step) {
      case 'feeling': return feeling;
      case 'fear': return fear;
      case 'need': return need;
      case 'values': return valuesResponse;
      case 'protects': return protectsBoth;
      default: return '';
    }
  }, [step, feeling, fear, need, valuesResponse, protectsBoth]);

  const setValue = useCallback((text: string) => {
    switch (step) {
      case 'feeling': setFeeling(text); break;
      case 'fear': setFear(text); break;
      case 'need': setNeed(text); break;
      case 'values': setValuesResponse(text); break;
      case 'protects': setProtectsBoth(text); break;
    }
  }, [step]);

  const handleNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSave = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    save({
      feeling,
      fear,
      need,
      valuesResponse,
      protectsBoth,
    });
    router.back();
  }, [feeling, fear, need, valuesResponse, protectsBoth, save, router]);

  const handleStartNew = useCallback(() => {
    setShowHistory(false);
    setCurrentStep(0);
    setFeeling('');
    setFear('');
    setNeed('');
    setValuesResponse('');
    setProtectsBoth('');
  }, []);

  if (showHistory) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowHistory(false)}>
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Past Sessions</Text>
          </View>
          <View style={styles.closeBtn} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {sessions.map((session) => (
            <View key={session.id} style={styles.historyCard}>
              <Text style={styles.historyDate}>{new Date(session.createdAt).toLocaleDateString()}</Text>
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>Feeling</Text>
                <Text style={styles.historyValue}>{session.feeling}</Text>
              </View>
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>Fear</Text>
                <Text style={styles.historyValue}>{session.fear}</Text>
              </View>
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>Need</Text>
                <Text style={styles.historyValue}>{session.need}</Text>
              </View>
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>Values Response</Text>
                <Text style={styles.historyValue}>{session.valuesResponse}</Text>
              </View>
              <View style={styles.historyRow}>
                <Text style={styles.historyLabel}>Protects Both</Text>
                <Text style={styles.historyValue}>{session.protectsBoth}</Text>
              </View>
            </View>
          ))}
          {sessions.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No sessions yet.</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          testID="close-conflict"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Self-Alignment</Text>
          <Text style={styles.headerSubtitle}>Pause. Align. Respond.</Text>
        </View>
        {sessions.length > 0 ? (
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowHistory(true)}>
            <Text style={styles.historyBtnText}>{sessions.length}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.closeBtn} />
        )}
      </View>

      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i <= currentStep && styles.progressDotActive,
              i === currentStep && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.stepContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{
          opacity: stepAnim,
          transform: [{
            translateY: stepAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }}>
          {step === 'summary' ? (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryIcon}>
                  <Compass size={28} color={Colors.primary} />
                </View>
                <Text style={styles.summaryTitle}>Your Alignment</Text>
                <Text style={styles.summarySubtitle}>
                  Here is what came up for you in this moment.
                </Text>
              </View>

              {selectedValues.length > 0 && (
                <View style={styles.summaryValuesRow}>
                  {selectedValues.slice(0, 4).map(v => (
                    <View key={v.id} style={styles.summaryValueChip}>
                      <Text style={styles.summaryValueEmoji}>{v.emoji}</Text>
                      <Text style={styles.summaryValueLabel}>{v.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel}>Feeling</Text>
                <Text style={styles.summaryCardValue}>{feeling}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel}>Underneath the fear</Text>
                <Text style={styles.summaryCardValue}>{fear}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel}>What you actually need</Text>
                <Text style={styles.summaryCardValue}>{need}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: Colors.primaryLight, borderColor: '#C8DDD2' }]}>
                <Text style={[styles.summaryCardLabel, { color: Colors.primaryDark }]}>Values-aligned response</Text>
                <Text style={[styles.summaryCardValue, { color: Colors.primaryDark }]}>{valuesResponse}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#E8F0FE', borderColor: '#C8D8F0' }]}>
                <Text style={[styles.summaryCardLabel, { color: '#2563EB' }]}>Protects connection + self-respect</Text>
                <Text style={[styles.summaryCardValue, { color: '#1E40AF' }]}>{protectsBoth}</Text>
              </View>

              <View style={styles.summaryActions}>
                <TouchableOpacity
                  style={styles.saveSessionBtn}
                  onPress={handleSave}
                  disabled={isSaving}
                  activeOpacity={0.7}
                  testID="save-session"
                >
                  <Check size={18} color={Colors.white} />
                  <Text style={styles.saveSessionBtnText}>Save & Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.newSessionBtn}
                  onPress={handleStartNew}
                  activeOpacity={0.7}
                >
                  <Text style={styles.newSessionBtnText}>Start Over</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.stepContainer}>
              <View style={styles.stepIconWrap}>
                {config.icon}
              </View>
              <Text style={styles.stepTitle}>{config.title}</Text>
              <Text style={styles.stepQuestion}>{config.question}</Text>

              <TextInput
                style={styles.stepInput}
                value={getValue()}
                onChangeText={setValue}
                placeholder={config.placeholder}
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
                testID={`input-${step}`}
              />

              <View style={styles.stepActions}>
                {currentStep > 0 && (
                  <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.nextBtn, !getValue().trim() && styles.nextBtnDisabled]}
                  onPress={handleNext}
                  disabled={!getValue().trim()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.nextBtnText}>Continue</Text>
                  <ArrowRight size={18} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.primaryLight,
  },
  progressDotCurrent: {
    backgroundColor: Colors.primary,
    width: 24,
    borderRadius: 4,
  },
  stepContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepQuestion: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  stepInput: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 24,
  },
  stepActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  backBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  summaryContainer: {
    alignItems: 'center',
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  summarySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summaryValuesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  summaryValueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warmGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  summaryValueEmoji: {
    fontSize: 14,
  },
  summaryValueLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryCardLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  summaryCardValue: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  summaryActions: {
    width: '100%',
    gap: 10,
    marginTop: 16,
  },
  saveSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  saveSessionBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  newSessionBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  newSessionBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  historyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  historyRow: {
    marginBottom: 10,
  },
  historyLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  historyValue: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
