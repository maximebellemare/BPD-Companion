import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle, XCircle, Minus, MessageSquareOff, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useEmotionalContext, OutcomeRecord } from '@/providers/EmotionalContextProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';

interface OutcomePromptBannerProps {
  draftId?: string;
}

export default React.memo(function OutcomePromptBanner({ draftId }: OutcomePromptBannerProps) {
  const router = useRouter();
  const { journeyPhase, recordOutcome, advanceJourney } = useEmotionalContext();
  const { trackEvent } = useAnalytics();
  const [recorded, setRecorded] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleOutcome = useCallback((outcome: 'helped' | 'made_worse' | 'neutral' | 'not_sent') => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const record: OutcomeRecord = {
      id: `outcome_${Date.now()}`,
      timestamp: Date.now(),
      draftId: draftId ?? null,
      outcome,
      notes: '',
      journeyPhaseCompleted: journeyPhase,
    };

    recordOutcome(record);
    trackEvent('outcome_recorded', { outcome, journey_phase: journeyPhase });

    setRecorded(true);
    Animated.timing(successAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    setTimeout(() => {
      advanceJourney('reflecting');
    }, 1500);
  }, [draftId, journeyPhase, recordOutcome, advanceJourney, trackEvent, successAnim]);

  const handleReflect = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/weekly-reflection');
  }, [router]);

  if (journeyPhase !== 'awaiting_outcome') return null;

  if (recorded) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.successCard}>
          <CheckCircle size={20} color={Colors.success} />
          <View style={styles.successContent}>
            <Text style={styles.successTitle}>Outcome recorded</Text>
            <Text style={styles.successDesc}>This will appear in your weekly reflection and therapy report.</Text>
          </View>
          <TouchableOpacity onPress={handleReflect} style={styles.reflectButton} activeOpacity={0.7}>
            <Text style={styles.reflectText}>Reflect</Text>
            <ChevronRight size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.title}>How did that go?</Text>
        <Text style={styles.subtitle}>Recording outcomes helps track what works for you.</Text>

        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.option, styles.optionHelped]}
            onPress={() => handleOutcome('helped')}
            activeOpacity={0.7}
            testID="outcome-helped"
          >
            <CheckCircle size={18} color={Colors.success} />
            <Text style={[styles.optionText, { color: Colors.success }]}>Helped</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, styles.optionNeutral]}
            onPress={() => handleOutcome('neutral')}
            activeOpacity={0.7}
            testID="outcome-neutral"
          >
            <Minus size={18} color={Colors.textSecondary} />
            <Text style={[styles.optionText, { color: Colors.textSecondary }]}>Neutral</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, styles.optionWorse]}
            onPress={() => handleOutcome('made_worse')}
            activeOpacity={0.7}
            testID="outcome-worse"
          >
            <XCircle size={18} color="#E17055" />
            <Text style={[styles.optionText, { color: '#E17055' }]}>Harder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, styles.optionNotSent]}
            onPress={() => handleOutcome('not_sent')}
            activeOpacity={0.7}
            testID="outcome-not-sent"
          >
            <MessageSquareOff size={18} color={Colors.textMuted} />
            <Text style={[styles.optionText, { color: Colors.textMuted }]}>Didn't send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  card: {
    backgroundColor: '#FFF9F0',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F5E6D8',
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 19,
  },
  optionsRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
  },
  optionHelped: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success + '30',
  },
  optionNeutral: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  optionWorse: {
    backgroundColor: '#FFF5F0',
    borderColor: '#E1705530',
  },
  optionNotSent: {
    backgroundColor: Colors.card,
    borderColor: Colors.borderLight,
  },
  optionText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  successCard: {
    backgroundColor: Colors.successLight,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  successDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reflectButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  reflectText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
