import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  X,
  ChevronRight,
  Check,
  Heart,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  SentStatus,
  ConflictResult,
  SENT_STATUS_OPTIONS,
  CONFLICT_RESULT_OPTIONS,
  EnhancedMessageOutcome,
} from '@/types/messageOutcome';
import { updateEnhancedOutcome } from '@/services/messages/enhancedOutcomeService';

type CaptureStep = 'sent_status' | 'regret' | 'conflict' | 'distress' | 'notes' | 'done';

const CAPTURE_STEPS: CaptureStep[] = ['sent_status', 'regret', 'conflict', 'distress', 'notes', 'done'];

interface OutcomeCaptureSheetProps {
  outcomeRecord: EnhancedMessageOutcome;
  onComplete: () => void;
  onDismiss: () => void;
}

export default function OutcomeCaptureSheet({
  outcomeRecord,
  onComplete,
  onDismiss,
}: OutcomeCaptureSheetProps) {
  const [step, setStep] = useState<CaptureStep>('sent_status');
  const [sentStatus, setSentStatus] = useState<SentStatus | null>(null);
  const [regretReported, setRegretReported] = useState<boolean | null>(null);
  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null);
  const [distressAfter, setDistressAfter] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [selfRespect, setSelfRespect] = useState<boolean | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 12, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const animateStep = useCallback(() => {
    fadeAnim.setValue(0.5);
    slideAnim.setValue(15);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 12, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const goNext = useCallback(() => {
    const idx = CAPTURE_STEPS.indexOf(step);
    if (step === 'sent_status' && (sentStatus === 'not_sent' || sentStatus === 'saved_unsent')) {
      setStep('distress');
      animateStep();
      return;
    }
    if (idx < CAPTURE_STEPS.length - 1) {
      setStep(CAPTURE_STEPS[idx + 1]);
      animateStep();
    }
  }, [step, sentStatus, animateStep]);

  const handleComplete = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const updates: Partial<EnhancedMessageOutcome> = {
      sentStatus: sentStatus ?? 'not_sent',
      regretReported,
      conflictResult,
      distressAfter,
      notes,
      pauseUsed: outcomeRecord.pauseUsed,
    };

    await updateEnhancedOutcome(outcomeRecord.id, updates);
    console.log('[OutcomeCapture] Completed for:', outcomeRecord.id);
    onComplete();
  }, [sentStatus, regretReported, conflictResult, distressAfter, notes, outcomeRecord, onComplete]);

  const stepIndex = CAPTURE_STEPS.indexOf(step);
  const totalVisibleSteps = sentStatus === 'not_sent' || sentStatus === 'saved_unsent' ? 3 : 5;

  const renderSentStatus = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepQuestion}>What happened with the message?</Text>
      <Text style={styles.stepHint}>No judgment — just tracking what helps.</Text>
      <View style={styles.optionsGrid}>
        {SENT_STATUS_OPTIONS.map((opt) => {
          const isSelected = sentStatus === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionCard, isSelected && { borderColor: opt.color, backgroundColor: opt.color + '10' }]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSentStatus(opt.value);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.optionEmoji}>{opt.emoji}</Text>
              <Text style={[styles.optionLabel, isSelected && { color: opt.color, fontWeight: '600' as const }]}>{opt.label}</Text>
              {isSelected && <Check size={14} color={opt.color} />}
            </TouchableOpacity>
          );
        })}
      </View>
      {sentStatus && (
        <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.8}>
          <Text style={styles.nextBtnText}>Next</Text>
          <ChevronRight size={16} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRegret = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepQuestion}>Do you regret sending it?</Text>
      <Text style={styles.stepHint}>This helps the app learn what works for you.</Text>
      <View style={styles.binaryRow}>
        <TouchableOpacity
          style={[styles.binaryBtn, regretReported === false && styles.binaryBtnSelected]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setRegretReported(false);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.binaryEmoji}>{'\ud83d\ude0c'}</Text>
          <Text style={[styles.binaryLabel, regretReported === false && styles.binaryLabelSelected]}>No regret</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.binaryBtn, regretReported === true && styles.binaryBtnSelectedDanger]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setRegretReported(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.binaryEmoji}>{'\ud83d\udc94'}</Text>
          <Text style={[styles.binaryLabel, regretReported === true && styles.binaryLabelSelectedDanger]}>Some regret</Text>
        </TouchableOpacity>
      </View>
      {regretReported !== null && (
        <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.8}>
          <Text style={styles.nextBtnText}>Next</Text>
          <ChevronRight size={16} color={Colors.white} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.skipBtn} onPress={goNext} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConflict = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepQuestion}>How did it affect things?</Text>
      <Text style={styles.stepHint}>Understanding the outcome helps improve future suggestions.</Text>
      <View style={styles.optionsGrid}>
        {CONFLICT_RESULT_OPTIONS.map((opt) => {
          const isSelected = conflictResult === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionCard, isSelected && { borderColor: opt.color, backgroundColor: opt.color + '10' }]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setConflictResult(opt.value);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.optionEmoji}>{opt.emoji}</Text>
              <Text style={[styles.optionLabel, isSelected && { color: opt.color, fontWeight: '600' as const }]}>{opt.label}</Text>
              {isSelected && <Check size={14} color={opt.color} />}
            </TouchableOpacity>
          );
        })}
      </View>
      {conflictResult && (
        <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.8}>
          <Text style={styles.nextBtnText}>Next</Text>
          <ChevronRight size={16} color={Colors.white} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.skipBtn} onPress={goNext} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDistress = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepQuestion}>How do you feel now?</Text>
      <Text style={styles.stepHint}>Rate your distress level after this message experience.</Text>
      <View style={styles.distressRow}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const isSelected = distressAfter === n;
          const color = n <= 3 ? Colors.success : n <= 6 ? Colors.accent : Colors.danger;
          return (
            <TouchableOpacity
              key={n}
              style={[styles.distressCircle, isSelected && { backgroundColor: color, borderColor: color }]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDistressAfter(n);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.distressNumber, isSelected && { color: Colors.white }]}>{n}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.distressLabels}>
        <Text style={styles.distressLabelText}>Calm</Text>
        <Text style={styles.distressLabelText}>Very distressed</Text>
      </View>

      <Text style={[styles.stepQuestion, { marginTop: 24 }]}>Did you protect your dignity?</Text>
      <View style={styles.binaryRow}>
        <TouchableOpacity
          style={[styles.binaryBtn, selfRespect === true && styles.binaryBtnSelected]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelfRespect(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.binaryEmoji}>{'\ud83d\udc9a'}</Text>
          <Text style={[styles.binaryLabel, selfRespect === true && styles.binaryLabelSelected]}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.binaryBtn, selfRespect === false && styles.binaryBtnSelectedDanger]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelfRespect(false);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.binaryEmoji}>{'\ud83d\ude14'}</Text>
          <Text style={[styles.binaryLabel, selfRespect === false && styles.binaryLabelSelectedDanger]}>Not really</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.8}>
        <Text style={styles.nextBtnText}>Next</Text>
        <ChevronRight size={16} color={Colors.white} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipBtn} onPress={goNext} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNotes = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepQuestion}>Anything else to note?</Text>
      <Text style={styles.stepHint}>Optional — helps the app learn what matters to you.</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="What happened after? What would you do differently?"
        placeholderTextColor={Colors.textMuted}
        multiline
        value={notes}
        onChangeText={setNotes}
        textAlignVertical="top"
      />
      <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.8}>
        <Heart size={16} color={Colors.white} />
        <Text style={styles.completeBtnText}>Save & finish</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipBtn} onPress={handleComplete} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip & finish</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDone = () => (
    <View style={styles.doneContent}>
      <View style={styles.doneIconWrap}>
        <Check size={28} color={Colors.success} />
      </View>
      <Text style={styles.doneTitle}>Thank you</Text>
      <Text style={styles.doneDesc}>This helps the app learn what works best for you.</Text>
      <TouchableOpacity style={styles.doneBtn} onPress={onComplete} activeOpacity={0.8}>
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 'sent_status': return renderSentStatus();
      case 'regret': return renderRegret();
      case 'conflict': return renderConflict();
      case 'distress': return renderDistress();
      case 'notes': return renderNotes();
      case 'done': return renderDone();
      default: return null;
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Quick check-in</Text>
          <Text style={styles.headerSub}>
            {step !== 'done' ? `Step ${Math.min(stepIndex + 1, totalVisibleSteps)} of ${totalVisibleSteps}` : 'Complete'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDismiss();
          }}
          activeOpacity={0.7}
        >
          <X size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {step !== 'done' && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((stepIndex + 1) / totalVisibleSteps) * 100}%` }]} />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {renderStep()}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    maxHeight: 520,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepContent: {
    paddingBottom: 8,
  },
  stepQuestion: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  stepHint: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    marginBottom: 18,
  },
  optionsGrid: {
    gap: 8,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionEmoji: {
    fontSize: 18,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  binaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  binaryBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  binaryBtnSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  binaryBtnSelectedDanger: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  binaryEmoji: {
    fontSize: 24,
  },
  binaryLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  binaryLabelSelected: {
    color: Colors.success,
    fontWeight: '600' as const,
  },
  binaryLabelSelectedDanger: {
    color: Colors.dangerDark,
    fontWeight: '600' as const,
  },
  distressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
    justifyContent: 'center',
  },
  distressCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  distressNumber: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  distressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  distressLabelText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    lineHeight: 21,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
  },
  nextBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brandSage,
    borderRadius: 16,
    paddingVertical: 14,
  },
  completeBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  doneContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  doneIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  doneDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  doneBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
