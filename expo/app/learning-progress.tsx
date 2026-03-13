import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Target,
  Award,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { getCoachProgressState } from '@/services/coach/coachProgressService';
import { getAllCoachModules } from '@/services/coach/coachService';
import { CoachModule, CoachInsight, COACH_CATEGORY_META } from '@/types/coachModule';
import { useAnalytics } from '@/providers/AnalyticsProvider';

export default function LearningProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { trackEvent } = useAnalytics();
  const [activeTab, setActiveTab] = useState<'progress' | 'insights' | 'skills'>('progress');

  const progressQuery = useQuery({
    queryKey: ['coach_progress'],
    queryFn: () => getCoachProgressState(),
  });

  const allModules = useMemo(() => getAllCoachModules(), []);
  const progressState = progressQuery.data;

  useEffect(() => {
    trackEvent('coach_progress_viewed', {});
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, trackEvent]);

  const completedModules = useMemo(() => {
    if (!progressState) return [];
    return allModules.filter(m => progressState.completedModuleIds.includes(m.id));
  }, [allModules, progressState]);

  const inProgressModules = useMemo(() => {
    if (!progressState) return [];
    return allModules.filter(m => {
      const prog = progressState.moduleProgress[m.id];
      return prog && !prog.completedAt && prog.currentStepIndex > 0;
    });
  }, [allModules, progressState]);

  const suggestedModules = useMemo(() => {
    if (!progressState) return allModules.slice(0, 3);
    const notStarted = allModules.filter(m => !progressState.moduleProgress[m.id]);
    return notStarted.slice(0, 3);
  }, [allModules, progressState]);

  const handleModulePress = useCallback((moduleId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/learning-coach?moduleId=${moduleId}` as any);
  }, [router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const completionPercent = allModules.length > 0
    ? Math.round((completedModules.length / allModules.length) * 100)
    : 0;

  const renderModuleCard = useCallback((mod: CoachModule, showStatus: boolean = false) => {
    const categoryMeta = COACH_CATEGORY_META[mod.category];
    const isCompleted = progressState?.completedModuleIds.includes(mod.id) ?? false;

    return (
      <TouchableOpacity
        key={mod.id}
        style={styles.moduleCard}
        onPress={() => handleModulePress(mod.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.moduleAccent, { backgroundColor: categoryMeta.color }]} />
        <View style={styles.moduleCardContent}>
          <View style={styles.moduleCardHeader}>
            <Text style={styles.moduleCardTitle} numberOfLines={2}>{mod.title}</Text>
            {showStatus && isCompleted && (
              <CheckCircle2 size={18} color={Colors.success} />
            )}
          </View>
          <Text style={[styles.moduleCardCategory, { color: categoryMeta.color }]}>{categoryMeta.label}</Text>
          <View style={styles.moduleCardMeta}>
            <Clock size={12} color={Colors.textMuted} />
            <Text style={styles.moduleCardTime}>{mod.estimatedDuration} min</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(mod.difficultyLevel) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(mod.difficultyLevel) }]}>
                {mod.difficultyLevel}
              </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  }, [progressState, handleModulePress]);

  const renderInsightCard = useCallback((insight: CoachInsight) => {
    const categoryMeta = allModules.find(m => m.id === insight.moduleId)
      ? COACH_CATEGORY_META[allModules.find(m => m.id === insight.moduleId)!.category]
      : null;

    return (
      <View key={insight.id} style={styles.insightCard}>
        <View style={styles.insightCardHeader}>
          <Sparkles size={14} color={categoryMeta?.color ?? Colors.accent} />
          <Text style={styles.insightCardModule}>{insight.moduleTitle}</Text>
        </View>
        <Text style={styles.insightCardText}>{insight.insightText}</Text>
        {insight.skillPracticed && (
          <View style={styles.insightSkillTag}>
            <Target size={11} color={Colors.primary} />
            <Text style={styles.insightSkillText}>{insight.skillPracticed}</Text>
          </View>
        )}
        <Text style={styles.insightCardDate}>
          {new Date(insight.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      </View>
    );
  }, [allModules]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton} testID="progress-back">
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Learning Progress</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedModules.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progressState?.skillsPracticed.length ?? 0}</Text>
          <Text style={styles.statLabel}>Skills</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progressState?.totalReflections ?? 0}</Text>
          <Text style={styles.statLabel}>Reflections</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.primary }]}>{completionPercent}%</Text>
          <Text style={styles.statLabel}>Overall</Text>
        </View>
      </Animated.View>

      <View style={styles.tabBar}>
        {(['progress', 'insights', 'skills'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            {tab === 'progress' && <BookOpen size={15} color={activeTab === tab ? Colors.primary : Colors.textMuted} />}
            {tab === 'insights' && <Sparkles size={15} color={activeTab === tab ? Colors.primary : Colors.textMuted} />}
            {tab === 'skills' && <Award size={15} color={activeTab === tab ? Colors.primary : Colors.textMuted} />}
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'progress' ? 'Modules' : tab === 'insights' ? 'Insights' : 'Skills'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {activeTab === 'progress' && (
            <>
              {inProgressModules.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Continue Where You Left Off</Text>
                  {inProgressModules.map(m => renderModuleCard(m, true))}
                </View>
              )}

              {completedModules.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Completed ({completedModules.length})</Text>
                  {completedModules.map(m => renderModuleCard(m, true))}
                </View>
              )}

              {suggestedModules.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Recommended Next</Text>
                  {suggestedModules.map(m => renderModuleCard(m, false))}
                </View>
              )}

              {allModules.length === 0 && (
                <View style={styles.emptyState}>
                  <BookOpen size={40} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>No modules yet</Text>
                  <Text style={styles.emptyDesc}>Start a guided learning session from the Learn tab</Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'insights' && (
            <>
              {(progressState?.insights ?? []).length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Your Learning Insights</Text>
                  {progressState!.insights.map(renderInsightCard)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Sparkles size={40} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>No insights yet</Text>
                  <Text style={styles.emptyDesc}>Complete a guided session to generate your first insight</Text>
                </View>
              )}
            </>
          )}

          {activeTab === 'skills' && (
            <>
              {(progressState?.skillsPracticed ?? []).length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Skills You Have Practiced</Text>
                  <View style={styles.skillsGrid}>
                    {progressState!.skillsPracticed.map(skill => (
                      <View key={skill} style={styles.skillCard}>
                        <View style={styles.skillIconWrap}>
                          <Target size={18} color={Colors.primary} />
                        </View>
                        <Text style={styles.skillName}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Award size={40} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>No skills practiced yet</Text>
                  <Text style={styles.emptyDesc}>Each module helps you practice a specific emotional skill</Text>
                </View>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function getDifficultyColor(level: string): string {
  switch (level) {
    case 'beginner': return Colors.success;
    case 'intermediate': return Colors.accent;
    case 'advanced': return Colors.danger;
    default: return Colors.textMuted;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
  },
  section: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
    overflow: 'hidden',
  },
  moduleAccent: {
    width: 4,
    height: 44,
    borderRadius: 2,
  },
  moduleCardContent: {
    flex: 1,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  moduleCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  moduleCardCategory: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 3,
  },
  moduleCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  moduleCardTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  insightCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  insightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  insightCardModule: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  insightCardText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  insightSkillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  insightSkillText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  insightCardDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  skillCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  skillIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
});
