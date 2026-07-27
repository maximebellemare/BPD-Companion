import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { useLanguage } from '@/hooks/useLanguage';
import { localizedField, localizedText } from '@/lib/i18n/staticText';
import { matchTools } from '@/services/tools/toolMatcherService';
import { ToolMatchResult } from '@/types/tools';

type MatcherOption = { value: string; label: string };

const EMOTION_OPTIONS: MatcherOption[] = [
  localizedField({ value: 'Anxious', label: 'Anxious' }, 'label', 'Anxious', 'Ansiedad'),
  localizedField({ value: 'Angry', label: 'Angry' }, 'label', 'Angry', 'Enojo'),
  localizedField({ value: 'Sad', label: 'Sad' }, 'label', 'Sad', 'Tristeza'),
  localizedField({ value: 'Empty', label: 'Empty' }, 'label', 'Empty', 'Vacío'),
  localizedField({ value: 'Ashamed', label: 'Ashamed' }, 'label', 'Ashamed', 'Vergüenza'),
  localizedField({ value: 'Lonely', label: 'Lonely' }, 'label', 'Lonely', 'Soledad'),
  localizedField({ value: 'Rejected', label: 'Rejected' }, 'label', 'Rejected', 'Rechazo'),
  localizedField({ value: 'Abandoned', label: 'Abandoned' }, 'label', 'Abandoned', 'Abandono'),
  localizedField({ value: 'Jealous', label: 'Jealous' }, 'label', 'Jealous', 'Celos'),
  localizedField({ value: 'Numb', label: 'Numb' }, 'label', 'Numb', 'Entumecimiento'),
  localizedField({ value: 'Overwhelmed', label: 'Overwhelmed' }, 'label', 'Overwhelmed', 'Abrumamiento'),
  localizedField({ value: 'Calm', label: 'Calm' }, 'label', 'Calm', 'Calma'),
  localizedField({ value: 'Something else', label: 'Something else' }, 'label', 'Something else', 'Algo más'),
];

const URGE_OPTIONS: MatcherOption[] = [
  localizedField({ value: 'Text again', label: 'Text again' }, 'label', 'Text again', 'Escribir otra vez'),
  localizedField({ value: 'Call repeatedly', label: 'Call repeatedly' }, 'label', 'Call repeatedly', 'Llamar repetidamente'),
  localizedField({ value: 'Argue', label: 'Argue' }, 'label', 'Argue', 'Discutir'),
  localizedField({ value: 'Withdraw', label: 'Withdraw' }, 'label', 'Withdraw', 'Alejarme'),
  localizedField({ value: 'Apologize too much', label: 'Apologize too much' }, 'label', 'Apologize too much', 'Pedir perdón demasiado'),
  localizedField({ value: 'Check social media', label: 'Check social media' }, 'label', 'Check social media', 'Revisar redes sociales'),
  localizedField({ value: 'Ask for reassurance', label: 'Ask for reassurance' }, 'label', 'Ask for reassurance', 'Pedir seguridad'),
  localizedField({ value: 'Spend money', label: 'Spend money' }, 'label', 'Spend money', 'Gastar dinero'),
  localizedField({ value: 'Drink/use substances', label: 'Drink/use substances' }, 'label', 'Drink/use substances', 'Beber/usar sustancias'),
  localizedField({ value: 'End the relationship', label: 'End the relationship' }, 'label', 'End the relationship', 'Terminar la relación'),
  localizedField({ value: 'Say something hurtful', label: 'Say something hurtful' }, 'label', 'Say something hurtful', 'Decir algo hiriente'),
  localizedField({ value: 'I don’t know', label: 'I don’t know' }, 'label', 'I don’t know', 'No sé'),
  localizedField({ value: 'Something else', label: 'Something else' }, 'label', 'Something else', 'Algo más'),
];

type MatcherStep = 'emotions' | 'urges' | 'distress' | 'context' | 'results';

export default function ToolMatcherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState<MatcherStep>('emotions');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedUrges, setSelectedUrges] = useState<string[]>([]);
  const [customEmotion, setCustomEmotion] = useState<string>('');
  const [customUrge, setCustomUrge] = useState<string>('');
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
      const emotions = [...selectedEmotions.filter(e => e !== 'Something else')];
      const urges = [...selectedUrges.filter(u => u !== 'Something else')];
      if (customEmotion.trim()) emotions.push(customEmotion.trim());
      if (customUrge.trim()) urges.push(customUrge.trim());
      const matched = matchTools({
        emotions,
        triggers: [],
        urges,
        distressLevel,
        relationshipContext,
      });
      setResults(matched);
      setStep('results');
    } else if (currentIdx < steps.length - 1) {
      setStep(steps[currentIdx + 1]);
    }
  }, [step, selectedEmotions, selectedUrges, customEmotion, customUrge, distressLevel, relationshipContext]);

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
            <Text style={styles.stepTitle}>{localizedText('What are you feeling?', '¿Qué estás sintiendo?')}</Text>
            <Text style={styles.stepDesc}>{localizedText('Select all that apply', 'Selecciona todo lo que aplique')}</Text>
            <View style={styles.chipGrid}>
              {EMOTION_OPTIONS.map(emotion => {
                const selected = selectedEmotions.includes(emotion.value);
                return (
                  <TouchableOpacity
                    key={emotion.value}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleEmotion(emotion.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{emotion.label}</Text>
                    {selected && <Check size={14} color={Colors.white} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedEmotions.includes('Something else') && (
              <TextInput
                style={styles.customInput}
                placeholder={localizedText('Write what you feel', 'Escribe lo que sientes')}
                placeholderTextColor={Colors.textMuted}
                value={customEmotion}
                onChangeText={setCustomEmotion}
              />
            )}
          </Animated.View>
        );

      case 'urges':
        return (
          <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
            <Text style={styles.stepTitle}>{localizedText('Any strong urges?', '¿Algún impulso fuerte?')}</Text>
            <Text style={styles.stepDesc}>{localizedText('Optional — select if relevant', 'Opcional: selecciona si aplica')}</Text>
            <View style={styles.chipGrid}>
              {URGE_OPTIONS.map(urge => {
                const selected = selectedUrges.includes(urge.value);
                return (
                  <TouchableOpacity
                    key={urge.value}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleUrge(urge.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{urge.label}</Text>
                    {selected && <Check size={14} color={Colors.white} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedUrges.includes('Something else') && (
              <TextInput
                style={styles.customInput}
                placeholder={localizedText('Write the urge', 'Escribe el impulso')}
                placeholderTextColor={Colors.textMuted}
                value={customUrge}
                onChangeText={setCustomUrge}
              />
            )}
          </Animated.View>
        );

      case 'distress':
        return (
          <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
            <Text style={styles.stepTitle}>{localizedText('How intense is it?', '¿Qué tan intenso se siente?')}</Text>
            <Text style={styles.stepDesc}>{localizedText('Rate your distress level', 'Califica tu nivel de angustia')}</Text>
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
                <Text style={styles.distressLabel}>{localizedText('Low', 'Bajo')}</Text>
                <Text style={styles.distressLabel}>{localizedText('Moderate', 'Moderado')}</Text>
                <Text style={styles.distressLabel}>{localizedText('Intense', 'Intenso')}</Text>
              </View>
            </View>
          </Animated.View>
        );

      case 'context':
        return (
          <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
            <Text style={styles.stepTitle}>{localizedText('Is this relationship-related?', '¿Esto está relacionado con una relación?')}</Text>
            <Text style={styles.stepDesc}>{localizedText('This helps us recommend the right tools', 'Esto nos ayuda a recomendar las herramientas adecuadas')}</Text>
            <View style={styles.contextOptions}>
              <TouchableOpacity
                style={[styles.contextBtn, relationshipContext && styles.contextBtnActive]}
                onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRelationshipContext(true); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.contextBtnText, relationshipContext && styles.contextBtnTextActive]}>
                  {localizedText('Yes, this involves someone', 'Sí, involucra a alguien')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contextBtn, !relationshipContext && styles.contextBtnActive]}
                onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRelationshipContext(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.contextBtnText, !relationshipContext && styles.contextBtnTextActive]}>
                  {localizedText("No, it's more internal", 'No, es más interno')}
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
              <Text style={styles.resultsTitle}>{localizedText('Recommended for you', 'Recomendado para ti')}</Text>
              <Text style={styles.resultsDesc}>
                {localizedText('Based on what you shared, these tools may help most right now', 'Según lo que compartiste, estas herramientas podrían ayudar más ahora mismo')}
              </Text>
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
                        <Text style={styles.confidenceText}>{localizedText(`${result.confidence}% match`, `${result.confidence}% coincidencia`)}</Text>
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
                setCustomEmotion('');
                setCustomUrge('');
                setDistressLevel(5);
                setRelationshipContext(false);
                setResults([]);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.retryBtnText}>{localizedText('Try different answers', 'Probar otras respuestas')}</Text>
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
          <Text style={styles.headerTitle}>{localizedText('Find the Right Tool', 'Encontrar la herramienta adecuada')}</Text>
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
                {step === 'context' ? localizedText('Find Tools', 'Encontrar herramientas') : localizedText('Continue', 'Continuar')}
              </Text>
            </TouchableOpacity>
            {step === 'urges' && (
              <TouchableOpacity onPress={handleNext} style={styles.skipBtn}>
                <Text style={styles.skipBtnText}>{localizedText('Skip this step', 'Saltar este paso')}</Text>
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  customInput: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: 16,
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  distressBtnHigh: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    backgroundColor: Colors.primary,
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
