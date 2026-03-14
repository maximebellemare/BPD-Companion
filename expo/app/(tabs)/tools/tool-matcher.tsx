import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Sparkles, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { matchTools } from '@/services/tools/toolMatcherService';
import { ToolMatchResult } from '@/types/tools';

const EMOTION_OPTIONS = [
  'Angry', 'Ashamed', 'Afraid', 'Sad', 'Lonely',
  'Abandoned', 'Jealous', 'Confused', 'Overwhelmed',
  'Anxious', 'Numb', 'Desperate',
];

const URGE_OPTIONS = [
  'Send an angry text', 'Push someone away', 'Beg for reassurance',
  'Isolate completely', 'Quit / end things', 'Lash out',
];

type MatcherStep = 'emotions' | 'urges' | 'distress' | 'context' | 'results';

export default function ToolMatcherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState<MatcherStep>('emotions');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedUrges, setSelectedUrges] = useState<string[]>([]);
  const [distressLevel, setDistressLevel] = useState<number>(5);
  const [relationshipContext, setRelationshipContext] = useState<boolean>(false);
  const [results, setResults] = useState<ToolMatchResult[]>([]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step, stepAnim]);

  const toggleEmotion = useCallback((emotion: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmotions(prev =>
      prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]
    );
  }, []);

  const toggleUrge = useCallback((urge: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUrges(prev =>
      prev.includes(urge) ? prev.filter(u => u !== urge) : [...prev, urge]
    );
  }, []);

  const handleNext = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const steps: MatcherStep[] = ['emotions', 'urges', 'distress', 'context', 'results'];
    const currentIdx = steps.indexOf(step);

    if (step === 'context') {
      const matched = matchTools({
        emotions: selectedEmotions,
        triggers: [],
        urges: selectedUrges,
        distressLevel,
        relationshipContext,
      });
      setResults(matched);
      setStep('results');
    } else if (currentIdx < steps.length - 1) {
      setStep(steps[currentIdx + 1]);
    }
  }, [step, selectedEmotions, selectedUrges, distressLevel, relationshipContext]);

  const handleToolPress = useCallback((route: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as never);
  }, [router]);

  const canProceed = step === 'emotions' ? selectedEmotions.length > 0 :
    step === 'urges' ? true :
    step === 'distress' ? true :
    step === 'context' ? true : false;

  const renderStep = () => {
    switch (step) {
      case 'emotions':
        return (
          <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
            <Text style={styles.stepTitle}>What are you feeling?</Text>
            <Text style={styles.stepDesc}>Select all that apply</Text>
            <View style={styles.chipGrid}>
              {EMOTION_OPTIONS.map(emotion => {
                const selected = selectedEmotions.includes(emotion);
                return (
                  <TouchableOpacity
                    key={emotion}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleEmotion(emotion)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{emotion}</Text>
                    {selected && <Check size={14} color={Colors.white} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        );

      case 'urges':
        return (
          <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
            <Text style={styles.stepTitle}>Any strong urges?</Text>
            <Text style={styles.stepDesc}>Optional — select if relevant</Text>
            <View style={styles.chipGrid}>
              {URGE_OPTIONS.map(urge => {
                const selected = selectedUrges.includes(urge);
                return (
                  <TouchableOpacity
                    key={urge}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleUrge(urge)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{urge}</Text>
                    {selected && <Check size={14} color={Colors.white} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        );

      case 'distress':
        return (
          <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
            <Text style={styles.stepTitle}>How intense is it?</Text>
            <Text style={styles.stepDesc}>Rate your distress level</Text>
            <View style={styles.distressContainer}>
              <View style={styles.distressRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.distressBtn,
                      level === distressLevel && styles.distressBtnActive,
                      level >= 7 && level === distressLevel && styles.distressBtnHigh,
                    ]}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDistressLevel(level);
                    }}
                  >
                    <Text style={[
                      styles.distressBtnText,
                      level === distressLevel && styles.distressBtnTextActive,
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.distressLabels}>
                <Text style={styles.distressLabel}>Low</Text>
                <Text style={styles.distressLabel}>Moderate</Text>
                <Text style={styles.distressLabel}>Intense</Text>
              </View>
            </View>
          </Animated.View>
        );

      case 'context':
        return (
          <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
            <Text style={styles.stepTitle}>Is this relationship-related?</Text>
            <Text style={styles.stepDesc}>This helps us recommend the right tools</Text>
            <View style={styles.contextOptions}>
              <TouchableOpacity
                style={[styles.contextBtn, relationshipContext && styles.contextBtnActive]}
                onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRelationshipContext(true); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.contextBtnText, relationshipContext && styles.contextBtnTextActive]}>
                  Yes, this involves someone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contextBtn, !relationshipContext && styles.contextBtnActive]}
                onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRelationshipContext(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.contextBtnText, !relationshipContext && styles.contextBtnTextActive]}>
                  No, it's more internal
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );

      case 'results':
        return (
          <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
            <View style={styles.resultsHeader}>
              <View style={styles.resultsIconWrap}>
                <Sparkles size={24} color={Colors.brandNavy} />
              </View>
              <Text style={styles.resultsTitle}>Recommended for you</Text>
              <Text style={styles.resultsDesc}>Based on what you shared, these tools may help most right now</Text>
            </View>
            <View style={styles.resultsList}>
              {results.map((result, index) => (
                <TouchableOpacity
                  key={result.toolId}
                  style={styles.resultCard}
                  onPress={() => handleToolPress(result.route)}
                  activeOpacity={0.7}
                  testID={`result-${result.toolId}`}
                >
                  <View style={styles.resultRank}>
                    <Text style={styles.resultRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>{result.toolTitle}</Text>
                    <Text style={styles.resultReason}>{result.reason}</Text>
                    <View style={styles.resultMeta}>
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>{result.confidence}% match</Text>
                      </View>
                      <Text style={styles.resultType}>{result.toolType}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setStep('emotions');
                setSelectedEmotions([]);
                setSelectedUrges([]);
                setDistressLevel(5);
                setRelationshipContext(false);
                setResults([]);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.retryBtnText}>Try different answers</Text>
            </TouchableOpacity>
          </Animated.View>
        );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => step === 'emotions' ? router.back() : setStep(
              step === 'urges' ? 'emotions' :
              step === 'distress' ? 'urges' :
              step === 'context' ? 'distress' :
              'emotions'
            )}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find the Right Tool</Text>
          {step !== 'results' && (
            <Text style={styles.stepIndicator}>
              {['emotions', 'urges', 'distress', 'context'].indexOf(step) + 1}/4
            </Text>
          )}
        </View>

        {step !== 'results' && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((['emotions', 'urges', 'distress', 'context'].indexOf(step) + 1) / 4) * 100}%` }]} />
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {step !== 'results' && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
              onPress={handleNext}
              activeOpacity={0.7}
              disabled={!canProceed}
              testID="matcher-next-btn"
            >
              <Text style={styles.nextBtnText}>
                {step === 'context' ? 'Find Tools' : 'Continue'}
              </Text>
            </TouchableOpacity>
            {step === 'urges' && (
              <TouchableOpacity onPress={handleNext} style={styles.skipBtn}>
                <Text style={styles.skipBtnText}>Skip this step</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>
    </View>
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
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stepIndicator: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.brandTeal,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 140,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  chipGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  chipSelected: {
    backgroundColor: Colors.brandNavy,
    borderColor: Colors.brandNavy,
  },
  chipText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  distressContainer: {
    marginTop: 8,
  },
  distressRow: {
    flexDirection: 'row' as const,
    gap: 6,
    justifyContent: 'center' as const,
  },
  distressBtn: {
    width: 32,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  distressBtnActive: {
    backgroundColor: Colors.brandNavy,
    borderColor: Colors.brandNavy,
  },
  distressBtnHigh: {
    backgroundColor: '#C47878',
    borderColor: '#C47878',
  },
  distressBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  distressBtnTextActive: {
    color: Colors.white,
  },
  distressLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  distressLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  contextOptions: {
    gap: 12,
  },
  contextBtn: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    alignItems: 'center' as const,
  },
  contextBtnActive: {
    backgroundColor: Colors.brandNavy,
    borderColor: Colors.brandNavy,
  },
  contextBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  contextBtnTextActive: {
    color: Colors.white,
  },
  resultsHeader: {
    alignItems: 'center' as const,
    marginBottom: 28,
  },
  resultsIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 6,
  },
  resultsDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
  },
  resultsList: {
    gap: 12,
  },
  resultCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 14,
  },
  resultRank: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  resultRankText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  resultReason: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  confidenceBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  resultType: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'capitalize' as const,
  },
  retryBtn: {
    alignItems: 'center' as const,
    marginTop: 20,
    padding: 12,
  },
  retryBtnText: {
    fontSize: 15,
    color: Colors.brandTeal,
    fontWeight: '600' as const,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  nextBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.brandNavy,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  skipBtn: {
    alignItems: 'center' as const,
    paddingVertical: 12,
  },
  skipBtnText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
