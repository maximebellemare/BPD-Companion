import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Eye,
  Lightbulb,
  BookOpen,
  Wrench,
  ArrowRight,
  MessageSquareHeart,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Brain,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getScenarioById, getPatternById } from '@/services/learn/learningPathService';
import { getLessonById } from '@/services/learn/learnService';
import { ScenarioInterpretation } from '@/types/learningPath';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

export default function ScenarioLearningScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { trackEvent } = useAnalytics();
  useLanguage();

  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [showInsight, setShowInsight] = useState<boolean>(false);

  const scenario = useMemo(() => getScenarioById(id ?? ''), [id]);
  const relatedPattern = useMemo(() => {
    if (!scenario) return null;
    return getPatternById(scenario.relatedPatternId);
  }, [scenario]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    trackEvent('scenario_learning_viewed', { scenario_id: id ?? '' });
  }, [fadeAnim, id, trackEvent]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleRevealInterpretation = useCallback((interpId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRevealedIds(prev => {
      const next = new Set(prev);
      next.add(interpId);
      return next;
    });

    if (scenario && revealedIds.size + 1 >= scenario.interpretations.length) {
      setTimeout(() => setShowInsight(true), 500);
    }
  }, [scenario, revealedIds]);

  const handlePatternPress = useCallback(() => {
    if (!scenario) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/pattern-education?id=${scenario.relatedPatternId}` as any);
  }, [scenario, router]);

  const handleLessonPress = useCallback((lessonId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/learn/lesson?id=${lessonId}` as any);
  }, [router]);

  const handleToolsPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(tabs)/tools' as any);
  }, [router]);

  if (!scenario) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>{localizedText('Scenario', 'Escenario')}</Text>
          <View style={styles.topBarSpacer} />
        </View>
        <View style={styles.emptyState}>
          <BookOpen size={40} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>{localizedText('Scenario not found', 'Escenario no encontrado')}</Text>
        </View>
      </View>
    );
  }

  const renderInterpretation = (interp: ScenarioInterpretation, _index: number) => {
    const isRevealed = revealedIds.has(interp.id);
    const borderColor = interp.isBalanced ? Colors.success : Colors.accent;
    const bgColor = interp.isBalanced ? Colors.successLight : Colors.warmGlow;

    return (
      <View key={interp.id} style={styles.interpWrapper}>
        <TouchableOpacity
          style={[styles.interpHeader, { borderLeftColor: borderColor, backgroundColor: isRevealed ? bgColor : Colors.white }]}
          onPress={() => handleRevealInterpretation(interp.id)}
          activeOpacity={0.7}
          testID={`interp-${interp.id}`}
        >
          <View style={styles.interpLabelRow}>
            {interp.isBalanced ? (
              <CheckCircle2 size={18} color={Colors.success} />
            ) : (
              <AlertCircle size={18} color={Colors.accent} />
            )}
            <Text style={[styles.interpLabel, { color: interp.isBalanced ? Colors.success : Colors.accent }]}>
              {interp.label}
            </Text>
          </View>
          {!isRevealed && (
            <Text style={styles.interpTapHint}>{localizedText('Tap to explore', 'Toca para explorar')}</Text>
          )}
        </TouchableOpacity>

        {isRevealed && (
          <Animated.View style={[styles.interpBody, { borderLeftColor: borderColor }]}>
            <View style={styles.interpSection}>
              <Text style={styles.interpSectionLabel}>{localizedText('Thought', 'Pensamiento')}</Text>
              <Text style={styles.interpSectionText}>{interp.thought}</Text>
            </View>
            <View style={styles.interpSection}>
              <Text style={styles.interpSectionLabel}>{localizedText('Emotion', 'Emoción')}</Text>
              <Text style={styles.interpSectionText}>{interp.emotion}</Text>
            </View>
            <View style={styles.interpSection}>
              <Text style={styles.interpSectionLabel}>{localizedText('Urge', 'Impulso')}</Text>
              <Text style={styles.interpSectionText}>{interp.urge}</Text>
            </View>
            <View style={[styles.interpSection, styles.interpOutcome]}>
              <Text style={styles.interpSectionLabel}>{localizedText('Likely Outcome', 'Resultado probable')}</Text>
              <Text style={styles.interpSectionText}>{interp.outcome}</Text>
            </View>
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton} testID="scenario-back">
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{localizedText('Scenario', 'Escenario')}</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.hero}>
            <View style={[styles.categoryBadge, { backgroundColor: scenario.color + '18' }]}>
              <Text style={[styles.categoryBadgeText, { color: scenario.color }]}>
                {scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1)}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{scenario.title}</Text>
          </View>

          <View style={[styles.situationCard, { borderLeftColor: scenario.color }]}>
            <View style={styles.situationHeader}>
              <Eye size={16} color={scenario.color} />
              <Text style={[styles.situationLabel, { color: scenario.color }]}>{localizedText('The Situation', 'La situación')}</Text>
            </View>
            <Text style={styles.situationText}>{scenario.situation}</Text>
          </View>

          <View style={styles.interpretationsSection}>
            <Text style={styles.sectionTitle}>{localizedText('How might you interpret this?', '¿Cómo podrías interpretar esto?')}</Text>
            <Text style={styles.sectionSubtitle}>{localizedText('Tap each perspective to explore different reactions and outcomes', 'Toca cada perspectiva para explorar distintas reacciones y resultados')}</Text>
            {scenario.interpretations.map((interp, index) => renderInterpretation(interp, index))}
          </View>

          {showInsight && (
            <View style={[styles.insightCard, { borderLeftColor: scenario.color }]}>
              <View style={styles.insightHeader}>
                <Lightbulb size={18} color={scenario.color} />
                <Text style={[styles.insightLabel, { color: scenario.color }]}>{localizedText('Key Insight', 'Insight clave')}</Text>
              </View>
              <Text style={styles.insightText}>{scenario.keyInsight}</Text>
            </View>
          )}

          {showInsight && (
            <View style={styles.reflectionCard}>
              <View style={styles.reflectionHeader}>
                <MessageSquareHeart size={18} color={Colors.accent} />
                <Text style={styles.reflectionLabel}>{localizedText('Reflect', 'Reflexiona')}</Text>
              </View>
              <Text style={styles.reflectionText}>{scenario.reflectionPrompt}</Text>
            </View>
          )}

          {showInsight && relatedPattern && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedSectionTitle}>{localizedText('Learn More', 'Aprender más')}</Text>
              <TouchableOpacity
                style={styles.patternLink}
                onPress={handlePatternPress}
                activeOpacity={0.7}
              >
                <Brain size={18} color={relatedPattern.color} />
                <View style={styles.patternLinkContent}>
                  <Text style={styles.patternLinkTitle}>{relatedPattern.title}</Text>
                  <Text style={styles.patternLinkSubtitle}>{localizedText('Understand the pattern behind this', 'Entiende el patrón detrás de esto')}</Text>
                </View>
                <ChevronRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>

              {scenario.relatedLessonIds.slice(0, 2).map(lessonId => {
                const lesson = getLessonById(lessonId);
                if (!lesson) return null;
                return (
                  <TouchableOpacity
                    key={lessonId}
                    style={styles.relatedLessonCard}
                    onPress={() => handleLessonPress(lessonId)}
                    activeOpacity={0.7}
                  >
                    <BookOpen size={16} color={Colors.primary} />
                    <View style={styles.relatedLessonContent}>
                      <Text style={styles.relatedLessonTitle}>{lesson.title}</Text>
                      <Text style={styles.relatedLessonTime}>{lesson.readingTime} {localizedText('min read', 'min de lectura')}</Text>
                    </View>
                    <ChevronRight size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.toolsButton}
                onPress={handleToolsPress}
                activeOpacity={0.7}
              >
                <Wrench size={18} color={Colors.primary} />
                <View style={styles.toolsButtonContent}>
                  <Text style={styles.toolsButtonTitle}>{localizedText('Practice a Related Skill', 'Practicar una habilidad relacionada')}</Text>
                  <Text style={styles.toolsButtonDesc}>{localizedText('Open the Tools tab', 'Abrir la pestaña Herramientas')}</Text>
                </View>
                <ArrowRight size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  topBarSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingTop: 4,
  },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  situationCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  situationHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  situationLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  situationText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
  },
  interpretationsSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 19,
  },
  interpWrapper: {
    marginBottom: 14,
  },
  interpHeader: {
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  interpLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  interpLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  interpTapHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  interpBody: {
    backgroundColor: Colors.white,
    borderRadius: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    marginTop: -8,
    paddingTop: 16,
  },
  interpSection: {
    marginBottom: 14,
  },
  interpOutcome: {
    marginBottom: 0,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  interpSectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  interpSectionText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 23,
  },
  insightCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  insightText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
  },
  reflectionCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: Colors.accentLight,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  reflectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  reflectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  reflectionText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    fontStyle: 'italic' as const,
  },
  relatedSection: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  relatedSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  patternLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  patternLinkContent: {
    flex: 1,
  },
  patternLinkTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  patternLinkSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  relatedLessonCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  relatedLessonContent: {
    flex: 1,
  },
  relatedLessonTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  relatedLessonTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  toolsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  toolsButtonContent: {
    flex: 1,
  },
  toolsButtonTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  toolsButtonDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
