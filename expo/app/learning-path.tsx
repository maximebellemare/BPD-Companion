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
  CheckCircle,
  Clock,
  ChevronRight,
  BookOpen,
  Wrench,
  ArrowRight,
  Play,
  Brain,
  Heart,
  Users,
  Anchor,
  Sprout,
  MessageCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  getLearningPathById,
  getLearningPathState,
  getPathCompletionPercent,
  startPath,
} from '@/services/learn/learningPathService';
import { getLearnState } from '@/services/learn/learnService';
import { LearningPathState } from '@/types/learningPath';
import { LearnState } from '@/types/learn';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { localizedText } from '@/lib/i18n/staticText';
import { useLanguage } from '@/hooks/useLanguage';

const PATH_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  heart: Heart,
  users: Users,
  anchor: Anchor,
  'message-circle': MessageCircle,
  sprout: Sprout,
  brain: Brain,
};

export default function LearningPathScreen() {
  useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { trackEvent } = useAnalytics();

  const [pathState, setPathState] = useState<LearningPathState | null>(null);
  const [learnState, setLearnState] = useState<LearnState | null>(null);

  const path = useMemo(() => getLearningPathById(id ?? ''), [id]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    void getLearningPathState().then(setPathState);
    void getLearnState().then(setLearnState);
  }, []);

  const completion = useMemo(() => {
    if (!pathState || !id) return 0;
    return getPathCompletionPercent(id, pathState);
  }, [pathState, id]);

  const completedStepIds = useMemo(() => {
    if (!pathState || !id) return new Set<string>();
    return new Set(pathState.pathProgress[id]?.completedStepIds ?? []);
  }, [pathState, id]);

  const nextStepIndex = useMemo(() => {
    if (!path) return 0;
    for (let i = 0; i < path.steps.length; i++) {
      if (!completedStepIds.has(path.steps[i].id)) return i;
    }
    return path.steps.length;
  }, [path, completedStepIds]);

  const handleStartPath = useCallback(async () => {
    if (!id || !pathState) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const newState = await startPath(id, pathState);
    setPathState(newState);
    trackEvent('learning_path_started', { path_id: id });

    if (path && path.steps[0]) {
      router.push(`/learn/lesson?id=${path.steps[0].lessonId}&pathId=${id}&stepId=${path.steps[0].id}` as any);
    }
  }, [id, pathState, path, router, trackEvent]);

  const handleStepPress = useCallback(async (stepId: string, lessonId: string) => {
    if (!id || !pathState) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('learning_path_step_opened', { path_id: id, step_id: stepId });
    router.push(`/learn/lesson?id=${lessonId}&pathId=${id}&stepId=${stepId}` as any);
  }, [id, pathState, router, trackEvent]);

  const handleToolsPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(tabs)/tools' as any);
  }, [router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  if (!path) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Learning Path</Text>
          <View style={styles.topBarSpacer} />
        </View>
        <View style={styles.emptyState}>
          <BookOpen size={40} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Path not found</Text>
        </View>
      </View>
    );
  }

  const IconComp = PATH_ICONS[path.icon] ?? BookOpen;
  const isStarted = completion > 0;
  const isCompleted = completion === 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton} testID="path-back">
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>Learning Path</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: path.color + '18' }]}>
            <IconComp size={32} color={path.color} />
          </View>
          <Text style={styles.heroTitle}>{path.title}</Text>
          <Text style={styles.heroSubtitle}>{path.subtitle}</Text>
          <Text style={styles.heroDescription}>{path.description}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{path.steps.length}</Text>
              <Text style={styles.heroStatLabel}>{localizedText('Lessons', 'Lecciones')}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>
                {path.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0)}
              </Text>
              <Text style={styles.heroStatLabel}>Minutes</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: path.color }]}>{completion}%</Text>
              <Text style={styles.heroStatLabel}>{localizedText('Complete', 'Completado')}</Text>
            </View>
          </View>

          {completion > 0 && (
            <View style={styles.heroProgressBarBg}>
              <View style={[styles.heroProgressBarFill, { width: `${completion}%`, backgroundColor: path.color }]} />
            </View>
          )}
        </Animated.View>

        {!isStarted && (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: path.color }]}
            onPress={handleStartPath}
            activeOpacity={0.8}
            testID="start-path"
          >
            <Play size={20} color="#fff" />
            <Text style={styles.startButtonText}>{localizedText('Start This Path', 'Iniciar esta ruta')}</Text>
          </TouchableOpacity>
        )}

        {isStarted && !isCompleted && nextStepIndex < path.steps.length && (
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: path.color }]}
            onPress={() => handleStepPress(path.steps[nextStepIndex].id, path.steps[nextStepIndex].lessonId)}
            activeOpacity={0.8}
            testID="continue-path"
          >
            <ArrowRight size={20} color="#fff" />
            <Text style={styles.continueButtonText}>{localizedText('Continue', 'Continuar')}: {path.steps[nextStepIndex].title}</Text>
          </TouchableOpacity>
        )}

        {isCompleted && (
          <View style={styles.completedBanner}>
            <CheckCircle size={24} color={Colors.success} />
            <Text style={styles.completedBannerTitle}>{localizedText('Path Complete', 'Ruta completada')}</Text>
            <Text style={styles.completedBannerDesc}>
              {localizedText(
                "You've completed all lessons in this path. Great work building your understanding.",
                'Completaste todas las lecciones de esta ruta. Gran trabajo construyendo comprensión.',
              )}
            </Text>
          </View>
        )}

        <View style={styles.stepsSection}>
          <Text style={styles.sectionLabel}>{localizedText('Lessons in this path', 'Lecciones en esta ruta')}</Text>
          {path.steps.map((step, index) => {
            const isStepCompleted = completedStepIds.has(step.id);
            const isLessonCompleted = learnState?.progress[step.lessonId]?.completed ?? false;
            const isNext = index === nextStepIndex && !isCompleted;
            const done = isStepCompleted || isLessonCompleted;

            return (
              <Animated.View
                key={step.id}
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }],
                }}
              >
                <TouchableOpacity
                  style={[styles.stepCard, isNext && styles.stepCardNext]}
                  onPress={() => handleStepPress(step.id, step.lessonId)}
                  activeOpacity={0.7}
                  testID={`step-${step.id}`}
                >
                  <View style={styles.stepNumber}>
                    {done ? (
                      <CheckCircle size={22} color={Colors.success} />
                    ) : (
                      <View style={[styles.stepNumberCircle, isNext && { borderColor: path.color, backgroundColor: path.color + '12' }]}>
                        <Text style={[styles.stepNumberText, isNext && { color: path.color }]}>{index + 1}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, done && styles.stepTitleDone]}>{step.title}</Text>
                    <Text style={styles.stepDescription} numberOfLines={1}>{step.description}</Text>
                    <View style={styles.stepMeta}>
                      <Clock size={12} color={Colors.textMuted} />
                      <Text style={styles.stepTime}>{step.estimatedMinutes} min</Text>
                      {isNext && (
                        <View style={[styles.nextBadge, { backgroundColor: path.color + '18' }]}>
                          <Text style={[styles.nextBadgeText, { color: path.color }]}>{localizedText('Up next', 'Siguiente')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {path.suggestedToolIds.length > 0 && (
          <View style={styles.toolsSection}>
            <Text style={styles.sectionLabel}>{localizedText('Related Tools', 'Herramientas relacionadas')}</Text>
            <TouchableOpacity
              style={styles.toolsCard}
              onPress={handleToolsPress}
              activeOpacity={0.7}
            >
              <Wrench size={22} color={Colors.primary} />
              <View style={styles.toolsCardContent}>
                <Text style={styles.toolsCardTitle}>{localizedText('Practice These Skills', 'Practicar estas habilidades')}</Text>
                <Text style={styles.toolsCardDesc}>{localizedText("Open the Tools tab to practice what you've learned", 'Abre la pestana Herramientas para practicar lo que aprendiste')}</Text>
              </View>
              <ArrowRight size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}
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
    alignItems: 'center' as const,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  heroDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 12,
    lineHeight: 23,
    paddingHorizontal: 8,
  },
  heroStats: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  heroStatValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  heroStatLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  heroProgressBarBg: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden' as const,
    width: '100%',
    marginTop: 16,
  },
  heroProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  startButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#fff',
  },
  continueButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  completedBanner: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: Colors.successLight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center' as const,
    gap: 8,
  },
  completedBannerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  completedBannerDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  stepsSection: {
    marginTop: 28,
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  stepCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  stepCardNext: {
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  stepNumber: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stepNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stepTitleDone: {
    color: Colors.textSecondary,
  },
  stepDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stepMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginTop: 6,
  },
  stepTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  nextBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  nextBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  toolsSection: {
    marginTop: 28,
    paddingHorizontal: 24,
  },
  toolsCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  toolsCardContent: {
    flex: 1,
  },
  toolsCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  toolsCardDesc: {
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
