import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppTheme } from '@/providers/ThemeProvider';
import { trackEvent } from '@/services/analytics/analyticsService';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';
import {
  BPD_ACADEMY_LESSONS,
  BPD_ACADEMY_SECTION_DESCRIPTIONS,
  BPD_ACADEMY_SECTION_LABELS,
  BPDAcademyLesson,
  BPDAcademyProgress,
  BPDAcademySection,
  getBPDAcademyLessonsBySection,
  getBPDAcademyProgress,
  getBPDAcademySectionProgress,
  markBPDAcademyLessonCompleted,
} from '@/services/academy/bpdAcademyService';

const SECTIONS: BPDAcademySection[] = ['dbt', 'act', 'cbt', 'bpd_specific'];

function getNextLesson(progress: BPDAcademyProgress | null): BPDAcademyLesson {
  const completed = progress?.completedLessonIds ?? [];
  return BPD_ACADEMY_LESSONS.find(lesson => !completed.includes(lesson.id)) ?? BPD_ACADEMY_LESSONS[0];
}

export default function BPDAcademyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  useLanguage();
  const scrollRef = useRef<ScrollView>(null);
  const lessonCardY = useRef(0);
  const [progress, setProgress] = useState<BPDAcademyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getBPDAcademyProgress()
      .then(next => {
        if (!mounted) return;
        setProgress(next);
        setSelectedLessonId(getNextLesson(next).id);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    void trackEvent('screen_view', { screen: 'bpd_academy' });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedLesson = useMemo(
    () => BPD_ACADEMY_LESSONS.find(lesson => lesson.id === selectedLessonId) ?? getNextLesson(progress),
    [progress, selectedLessonId],
  );

  const completedCount = progress?.completedLessonIds.length ?? 0;
  const totalCount = BPD_ACADEMY_LESSONS.length;
  const completionPercent = Math.round((completedCount / totalCount) * 100);
  const selectedCompleted = progress?.completedLessonIds.includes(selectedLesson.id) ?? false;

  const selectLesson = useCallback((lessonId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setSelectedLessonId(lessonId);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, lessonCardY.current - 12), animated: true });
    });
  }, []);

  const completeLesson = useCallback(async () => {
    if (selectedCompleted || savingLessonId) return;
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSavingLessonId(selectedLesson.id);
    try {
      const next = await markBPDAcademyLessonCompleted(selectedLesson.id);
      setProgress(next);
      void trackEvent('bpd_academy_lesson_completed', {
        lesson_id: selectedLesson.id,
        section: selectedLesson.section,
      });
    } finally {
      setSavingLessonId(null);
    }
  }, [savingLessonId, selectedCompleted, selectedLesson]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.brandTeal} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
            onPress={() => router.back()}
            activeOpacity={0.75}
            testID="bpd-academy-back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>{localizedText('BPD Academy', 'Academia TLP')}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{localizedText('Tiny lessons for real moments', 'Lecciones breves para momentos reales')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {localizedText(
                'Short 2-5 minute practices. Educational support only, not medical advice.',
                'Prácticas breves de 2 a 5 minutos. Apoyo educativo solamente, no consejo médico.',
              )}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Target size={16} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{completionPercent}%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{localizedText('Complete', 'Completado')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Trophy size={16} color={colors.brandTeal} />
            <Text style={[styles.statValue, { color: colors.text }]}>{completedCount}/{totalCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{localizedText('Lessons', 'Lecciones')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <Sparkles size={16} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{progress?.currentStreak ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{localizedText('Streak', 'Racha')}</Text>
          </View>
        </View>

        <View
          style={[styles.lessonCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
          onLayout={(event) => {
            lessonCardY.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.lessonTopRow}>
            <View style={[styles.lessonIcon, { backgroundColor: colors.primaryLight }]}>
              <GraduationCap size={24} color={colors.primary} />
            </View>
            <View style={styles.lessonMetaWrap}>
              <Text style={[styles.lessonSection, { color: colors.brandTeal }]}>
                {BPD_ACADEMY_SECTION_LABELS[selectedLesson.section]} - {selectedLesson.durationMinutes} min
              </Text>
              <Text style={[styles.lessonTitle, { color: colors.text }]}>{selectedLesson.title}</Text>
              <Text style={[styles.lessonSubtitle, { color: colors.textSecondary }]}>{selectedLesson.subtitle}</Text>
            </View>
          </View>

          <View style={styles.lessonBlocks}>
            <LessonBlock title={localizedText('Explain', 'Explicación')} body={selectedLesson.explain} icon={<BookOpen size={16} color={colors.primary} />} />
            <LessonBlock title={localizedText('Example', 'Ejemplo')} body={selectedLesson.example} icon={<Sparkles size={16} color={colors.brandTeal} />} />
            <LessonBlock title={localizedText('Real-life application', 'Aplicación en la vida real')} body={selectedLesson.application} icon={<Target size={16} color={colors.accent} />} />
            <LessonBlock title={localizedText('Mini exercise', 'Mini ejercicio')} body={selectedLesson.miniExercise} icon={<Clock size={16} color={colors.primary} />} />
          </View>

          <TouchableOpacity
            style={[
              styles.completeButton,
              { backgroundColor: selectedCompleted ? colors.brandTealSoft : colors.primary },
            ]}
            onPress={completeLesson}
            activeOpacity={0.82}
            disabled={selectedCompleted || Boolean(savingLessonId)}
            testID="bpd-academy-complete-lesson"
          >
            {savingLessonId === selectedLesson.id ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <CheckCircle2 size={18} color={selectedCompleted ? colors.brandTeal : Colors.white} />
                <Text style={[styles.completeButtonText, { color: selectedCompleted ? colors.brandTeal : Colors.white }]}>
                  {selectedCompleted ? localizedText('Lesson complete', 'Lección completa') : localizedText('Mark complete', 'Marcar completa')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.text }]}>{localizedText('Choose a lesson', 'Elige una lección')}</Text>

        {SECTIONS.map(section => {
          const sectionLessons = getBPDAcademyLessonsBySection(section);
          const sectionProgress = getBPDAcademySectionProgress(section, progress ?? {
            completedLessonIds: [],
            completedAtByLesson: {},
            currentStreak: 0,
            longestStreak: 0,
            lastCompletedDate: null,
          });
          return (
            <View key={section} style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{BPD_ACADEMY_SECTION_LABELS[section]}</Text>
                  <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                    {BPD_ACADEMY_SECTION_DESCRIPTIONS[section]}
                  </Text>
                </View>
                <Text style={[styles.sectionProgress, { color: colors.brandTeal }]}>
                  {sectionProgress.completed}/{sectionProgress.total}
                </Text>
              </View>
              <View style={styles.lessonList}>
                {sectionLessons.map(lesson => {
                  const isSelected = lesson.id === selectedLesson.id;
                  const isComplete = progress?.completedLessonIds.includes(lesson.id) ?? false;
                  return (
                    <TouchableOpacity
                      key={lesson.id}
                      style={[
                        styles.lessonRow,
                        {
                          backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.borderLight,
                        },
                      ]}
                      onPress={() => selectLesson(lesson.id)}
                      activeOpacity={0.78}
                      testID={`bpd-academy-lesson-${lesson.id}`}
                    >
                      <View style={styles.lessonRowText}>
                        <Text style={[styles.lessonRowTopic, { color: colors.textSecondary }]}>
                          {lesson.topic} - {lesson.durationMinutes} min
                        </Text>
                        <Text style={[styles.lessonRowTitle, { color: colors.text }]}>{lesson.title}</Text>
                      </View>
                      {isComplete ? (
                        <CheckCircle2 size={18} color={colors.brandTeal} />
                      ) : (
                        <ChevronRight size={17} color={colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function LessonBlock({ title, body, icon }: { title: string; body: string; icon: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.lessonBlock, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={styles.lessonBlockTitleRow}>
        {icon}
        <Text style={[styles.lessonBlockTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.lessonBlockBody, { color: colors.textSecondary }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 7,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    minHeight: 82,
    borderRadius: 17,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  lessonCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 22,
  },
  lessonTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  lessonIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonMetaWrap: {
    flex: 1,
  },
  lessonSection: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  lessonTitle: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    marginBottom: 5,
  },
  lessonSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  lessonBlocks: {
    gap: 10,
  },
  lessonBlock: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
  lessonBlockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  lessonBlockTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  lessonBlockBody: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  completeButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: '900',
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    maxWidth: 250,
  },
  sectionProgress: {
    fontSize: 13,
    fontWeight: '900',
  },
  lessonList: {
    gap: 8,
  },
  lessonRow: {
    minHeight: 62,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  lessonRowText: {
    flex: 1,
  },
  lessonRowTopic: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  lessonRowTitle: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
  },
});
