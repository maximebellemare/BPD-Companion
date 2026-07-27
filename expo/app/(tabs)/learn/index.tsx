import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  BookOpen,
  Bookmark,
  Clock,
  ChevronRight,
  Brain,
  Heart,
  Users,
  Anchor,
  Zap,
  Fingerprint,
  Wrench,
  Sunrise,
  X,
  MessageCircle,
  CloudLightning,
  Sprout,
  Sparkles,
  GraduationCap,
  Target,
  ArrowRight,
  Route,
  ShieldAlert,
  TrendingUp,
  ArrowDownCircle,
  Repeat,
  GitPullRequest,
  Eye,
} from 'lucide-react-native';
import BrandLogo from '@/components/branding/BrandLogo';
import DailyInsightCard from '@/components/DailyInsightCard';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';
import {
  getCategories,
  getLearnState,
  getRecentlyViewedLessons,
  getBookmarkedLessons,
  searchLessons,
  getCategoryProgress,
} from '@/services/learn/learnService';
import { LearnState, LessonCategory, Lesson } from '@/types/learn';
import { LEARN_CATEGORIES } from '@/data/lessonCategories';
import { useLearningRecommendations } from '@/hooks/useLearningRecommendations';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { getAllCoachModules } from '@/services/coach/coachService';
import { getCoachProgressState } from '@/services/coach/coachProgressService';
import { COACH_CATEGORY_META, CoachProgressState } from '@/types/coachModule';
import {
  getAllLearningPaths,
  getLearningPathState,
  getPathCompletionPercent,
  getAllPatterns,
  getAllScenarios,
  getWeeklyLearningInsight,
  generateWeeklyLearningInsight,
  saveWeeklyLearningInsight,
} from '@/services/learn/learningPathService';
import { LearningPath, LearningPathState, EmotionalPattern, LearningScenario, WeeklyLearningInsight } from '@/types/learningPath';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  brain: Brain,
  heart: Heart,
  users: Users,
  anchor: Anchor,
  zap: Zap,
  fingerprint: Fingerprint,
  tool: Wrench,
  sunrise: Sunrise,
  'message-circle': MessageCircle,
  'cloud-lightning': CloudLightning,
  sprout: Sprout,
  'shield-alert': ShieldAlert,
  'trending-up': TrendingUp,
  'arrow-down-circle': ArrowDownCircle,
  repeat: Repeat,
  'git-pull-request': GitPullRequest,
};

type ActiveTab = 'explore' | 'paths' | 'bookmarks';

export default function LearnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { recommendations, contextMessage, trackArticleOpened } = useLearningRecommendations();
  const { trackEvent } = useAnalytics();

  const [learnState, setLearnState] = useState<LearnState | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Lesson[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [coachProgress, setCoachProgress] = useState<CoachProgressState | null>(null);
  const [pathState, setPathState] = useState<LearningPathState | null>(null);
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyLearningInsight | null>(null);

  const coachModules = useMemo(() => getAllCoachModules(), []);
  const categories = useMemo(() => getCategories(), []);
  const learningPaths = useMemo(() => getAllLearningPaths(), []);
  const patterns = useMemo(() => getAllPatterns(), []);
  const scenarios = useMemo(() => getAllScenarios(), []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const loadState = useCallback(async () => {
    const state = await getLearnState();
    setLearnState(state);
  }, []);

  useEffect(() => {
    void loadState();
    void getCoachProgressState().then(setCoachProgress);
    void getLearningPathState().then(setPathState);
  }, [loadState]);

  const loadWeeklyInsight = useCallback(async () => {
    let insight = await getWeeklyLearningInsight();
    if (!insight) {
      insight = generateWeeklyLearningInsight([], [], []);
      await saveWeeklyLearningInsight(insight);
    }
    setWeeklyInsight(insight);
  }, []);

  useEffect(() => {
    void loadWeeklyInsight();
  }, [loadWeeklyInsight]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim()) {
        const results = searchLessons(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const recentLessons = useMemo(() => {
    if (!learnState) return [];
    return getRecentlyViewedLessons(learnState);
  }, [learnState]);

  const bookmarkedLessons = useMemo(() => {
    if (!learnState) return [];
    return getBookmarkedLessons(learnState);
  }, [learnState]);

  const handleModulePress = useCallback((moduleId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('coach_module_started', { module_id: moduleId, source: 'learn_tab' });
    router.push(`/learning-coach?moduleId=${moduleId}` as any);
  }, [router, trackEvent]);

  const handleViewProgress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/learning-progress' as any);
  }, [router]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/learn/category?id=${categoryId}` as any);
  }, [router]);

  const handleLessonPress = useCallback((lessonId: string, source: 'browse' | 'search' | 'recommendation' = 'browse') => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('learning_article_opened', {
      article_id: lessonId,
      trigger_context: source,
    });
    void trackArticleOpened(lessonId, source);
    router.push(`/learn/lesson?id=${lessonId}` as any);
  }, [router, trackEvent, trackArticleOpened]);

  const handlePathPress = useCallback((pathId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('learning_path_opened', { path_id: pathId });
    router.push(`/learning-path?id=${pathId}` as any);
  }, [router, trackEvent]);

  const handlePatternPress = useCallback((patternId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('pattern_education_opened', { pattern_id: patternId });
    router.push(`/pattern-education?id=${patternId}` as any);
  }, [router, trackEvent]);

  const handleScenarioPress = useCallback((scenarioId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('scenario_learning_opened', { scenario_id: scenarioId });
    router.push(`/scenario-learning?id=${scenarioId}` as any);
  }, [router, trackEvent]);

  const renderCategoryIcon = useCallback((iconName: string, color: string) => {
    const IconComponent = ICON_MAP[iconName] || BookOpen;
    return <IconComponent size={22} color={color} />;
  }, []);

  const renderPathCard = useCallback((path: LearningPath) => {
    const completion = pathState ? getPathCompletionPercent(path.id, pathState) : 0;
    const isStarted = completion > 0;

    return (
      <TouchableOpacity
        key={path.id}
        style={styles.pathCard}
        onPress={() => handlePathPress(path.id)}
        activeOpacity={0.7}
        testID={`path-${path.id}`}
      >
        <View style={[styles.pathAccent, { backgroundColor: path.color }]} />
        <View style={styles.pathCardInner}>
          <View style={[styles.pathIconWrap, { backgroundColor: path.color + '18' }]}>
            {renderCategoryIcon(path.icon, path.color)}
          </View>
          <Text style={styles.pathCardTitle} numberOfLines={2}>{path.title}</Text>
          <Text style={styles.pathCardSubtitle} numberOfLines={1}>{path.subtitle}</Text>
          <View style={styles.pathCardFooter}>
            <Text style={styles.pathStepCount}>{path.steps.length} lessons</Text>
            {isStarted && (
              <View style={styles.pathProgressBadge}>
                <View style={[styles.pathProgressDot, { backgroundColor: path.color }]} />
                <Text style={[styles.pathProgressText, { color: path.color }]}>{completion}%</Text>
              </View>
            )}
          </View>
          {isStarted && (
            <View style={styles.pathProgressBarBg}>
              <View style={[styles.pathProgressBarFill, { width: `${completion}%`, backgroundColor: path.color }]} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [pathState, handlePathPress, renderCategoryIcon]);

  const renderPatternCard = useCallback((pattern: EmotionalPattern) => {
    return (
      <TouchableOpacity
        key={pattern.id}
        style={styles.patternCard}
        onPress={() => handlePatternPress(pattern.id)}
        activeOpacity={0.7}
        testID={`pattern-${pattern.id}`}
      >
        <View style={[styles.patternIconWrap, { backgroundColor: pattern.color + '15' }]}>
          {renderCategoryIcon(pattern.icon, pattern.color)}
        </View>
        <Text style={styles.patternCardTitle} numberOfLines={1}>{pattern.title}</Text>
        <Text style={styles.patternCardSubtitle} numberOfLines={2}>{pattern.subtitle}</Text>
      </TouchableOpacity>
    );
  }, [handlePatternPress, renderCategoryIcon]);

  const renderScenarioCard = useCallback((scenario: LearningScenario) => {
    return (
      <TouchableOpacity
        key={scenario.id}
        style={styles.scenarioCard}
        onPress={() => handleScenarioPress(scenario.id)}
        activeOpacity={0.7}
        testID={`scenario-${scenario.id}`}
      >
        <View style={[styles.scenarioAccent, { backgroundColor: scenario.color }]} />
        <View style={styles.scenarioCardContent}>
          <Text style={styles.scenarioCardTitle} numberOfLines={1}>{scenario.title}</Text>
          <Text style={styles.scenarioCardSituation} numberOfLines={2}>{scenario.situation}</Text>
          <View style={styles.scenarioCardMeta}>
            <Eye size={12} color={Colors.textMuted} />
            <Text style={styles.scenarioCardMetaText}>{scenario.interpretations.length} perspectives</Text>
          </View>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  }, [handleScenarioPress]);

  const renderCategoryCard = useCallback((category: LessonCategory, _index: number) => {
    const progress = learnState ? getCategoryProgress(category.id, learnState) : { completed: 0, total: 0 };
    const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

    return (
      <TouchableOpacity
        key={category.id}
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(category.id)}
        activeOpacity={0.7}
        testID={`category-${category.id}`}
      >
        <View style={[styles.categoryIconWrap, { backgroundColor: category.color + '18' }]}>
          {renderCategoryIcon(category.icon, category.color)}
        </View>
        <View style={styles.categoryContent}>
          <Text style={styles.categoryTitle} numberOfLines={1}>{category.title}</Text>
          <Text style={styles.categoryDesc} numberOfLines={2}>{category.description}</Text>
          <View style={styles.categoryMeta}>
            <Text style={styles.categoryLessonCount}>{category.lessonCount} lessons</Text>
            {progress.completed > 0 && (
              <View style={styles.progressBadge}>
                <View style={[styles.progressDot, { backgroundColor: category.color }]} />
                <Text style={[styles.progressText, { color: category.color }]}>
                  {progress.completed}/{progress.total}
                </Text>
              </View>
            )}
          </View>
          {progressPercent > 0 && (
            <View style={styles.categoryProgressBarBg}>
              <View style={[styles.categoryProgressBarFill, { width: `${progressPercent}%`, backgroundColor: category.color }]} />
            </View>
          )}
        </View>
        <ChevronRight size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  }, [learnState, handleCategoryPress, renderCategoryIcon]);

  const renderLessonCard = useCallback((lesson: Lesson) => {
    const isBookmarked = learnState?.bookmarkedIds.includes(lesson.id) ?? false;
    const isCompleted = learnState?.progress[lesson.id]?.completed ?? false;

    return (
      <TouchableOpacity
        key={lesson.id}
        style={styles.lessonCard}
        onPress={() => handleLessonPress(lesson.id)}
        activeOpacity={0.7}
      >
        <View style={styles.lessonCardContent}>
          <Text style={styles.lessonCardTitle} numberOfLines={1}>{lesson.title}</Text>
          <Text style={styles.lessonCardDesc} numberOfLines={2}>{lesson.description}</Text>
          <View style={styles.lessonCardMeta}>
            <Clock size={12} color={Colors.textMuted} />
            <Text style={styles.lessonCardTime}>{lesson.readingTime} min read</Text>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>Read</Text>
              </View>
            )}
            {isBookmarked && (
              <Bookmark size={12} color={Colors.accent} fill={Colors.accent} />
            )}
          </View>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  }, [learnState, handleLessonPress]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.learnHeaderRow}>
          <BrandLogo size={38} />
          <View style={styles.learnHeaderText}>
            <Text style={styles.headerTitle}>Learn</Text>
            <Text style={styles.headerSubtitle}>Knowledge is power — and healing</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={localizedText('Search lessons, topics...', 'Buscar lecciones, temas...')}
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearching(true)}
            testID="learn-search-input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setIsSearching(false); }}>
              <X size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching && searchQuery.trim().length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {searchResults.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</Text>
              {searchResults.map(renderLessonCard)}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Search size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>{localizedText('No results found', 'No se encontraron resultados')}</Text>
              <Text style={styles.emptyDesc}>{localizedText('Try a different search term', 'Prueba con otra busqueda')}</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'explore' && styles.tabActive]}
              onPress={() => setActiveTab('explore')}
            >
              <BookOpen size={16} color={activeTab === 'explore' ? Colors.brandTeal : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'explore' && styles.tabTextActive]}>Explore</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'paths' && styles.tabActive]}
              onPress={() => setActiveTab('paths')}
            >
              <Route size={16} color={activeTab === 'paths' ? Colors.brandTeal : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'paths' && styles.tabTextActive]}>Paths</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'bookmarks' && styles.tabActive]}
              onPress={() => setActiveTab('bookmarks')}
            >
              <Bookmark size={16} color={activeTab === 'bookmarks' ? Colors.brandTeal : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'bookmarks' && styles.tabTextActive]}>{localizedText('Saved', 'Guardado')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'explore' ? (
              <Animated.View style={{ opacity: fadeAnim }}>
                <DailyInsightCard variant="learn" />

                {weeklyInsight && (
                  <View style={styles.weeklyInsightCard}>
                    <View style={styles.weeklyInsightHeader}>
                      <Sparkles size={16} color={Colors.brandTeal} />
                      <Text style={styles.weeklyInsightLabel}>This Week</Text>
                    </View>
                    <Text style={styles.weeklyInsightMessage}>{weeklyInsight.message}</Text>
                    {weeklyInsight.suggestedPathId && (
                      <TouchableOpacity
                        style={styles.weeklyInsightAction}
                        onPress={() => handlePathPress(weeklyInsight.suggestedPathId!)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.weeklyInsightActionText}>{localizedText('Start suggested path', 'Iniciar ruta sugerida')}</Text>
                        <ArrowRight size={14} color={Colors.brandTeal} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {recommendations.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Sparkles size={16} color={Colors.accent} />
                      <Text style={styles.sectionTitle}>Recommended For You</Text>
                    </View>
                    <Text style={styles.recContextLabel}>{contextMessage}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                      {recommendations.map(rec => (
                        <TouchableOpacity
                          key={rec.lessonId}
                          style={styles.recCard}
                          onPress={() => handleLessonPress(rec.lessonId, 'recommendation')}
                          activeOpacity={0.7}
                          testID={`learn-rec-${rec.lessonId}`}
                        >
                          <View style={[styles.recAccent, { backgroundColor: LEARN_CATEGORIES.find(c => c.id === rec.lesson.categoryId)?.color ?? Colors.primary }]} />
                          <Text style={styles.recCardTitle} numberOfLines={2}>{rec.lesson.title}</Text>
                          <Text style={styles.recCardReason} numberOfLines={2}>{rec.reason}</Text>
                          <View style={styles.recCardMeta}>
                            <Clock size={11} color={Colors.textMuted} />
                            <Text style={styles.recCardTime}>{rec.lesson.readingTime} min</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Route size={16} color={Colors.brandTeal} />
                    <Text style={styles.sectionTitle}>Learning Paths</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Structured journeys through key topics</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {learningPaths.map(renderPathCard)}
                  </ScrollView>
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Brain size={16} color={Colors.brandLilac} />
                    <Text style={styles.sectionTitle}>{localizedText('Understand Your Patterns', 'Comprende tus patrones')}</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Learn why your mind and body react the way they do</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {patterns.map(renderPatternCard)}
                  </ScrollView>
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Eye size={16} color={Colors.brandAmber} />
                    <Text style={styles.sectionTitle}>Real-Life Scenarios</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>See how different interpretations lead to different outcomes</Text>
                  {scenarios.slice(0, 3).map(renderScenarioCard)}
                  {scenarios.length > 3 && (
                    <TouchableOpacity
                      style={styles.viewAllButton}
                      onPress={() => setActiveTab('paths')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewAllText}>{localizedText('View all scenarios', 'Ver todos los escenarios')}</Text>
                      <ArrowRight size={14} color={Colors.brandTeal} />
                    </TouchableOpacity>
                  )}
                </View>

                {recentLessons.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Clock size={16} color={Colors.primary} />
                      <Text style={styles.sectionTitle}>Continue Learning</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                      {recentLessons.map(lesson => (
                        <TouchableOpacity
                          key={lesson.id}
                          style={styles.recentCard}
                          onPress={() => handleLessonPress(lesson.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.recentCardTitle} numberOfLines={2}>{lesson.title}</Text>
                          <View style={styles.recentCardMeta}>
                            <Clock size={11} color={Colors.textMuted} />
                            <Text style={styles.recentCardTime}>{lesson.readingTime} min</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <GraduationCap size={16} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>Guided Learning</Text>
                  </View>
                  <Text style={styles.sectionSubtitle}>Interactive coaching sessions with reflections and exercises</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {coachModules.slice(0, 5).map(mod => {
                      const catMeta = COACH_CATEGORY_META[mod.category];
                      const isCompleted = coachProgress?.completedModuleIds.includes(mod.id) ?? false;
                      return (
                        <TouchableOpacity
                          key={mod.id}
                          style={styles.coachCard}
                          onPress={() => handleModulePress(mod.id)}
                          activeOpacity={0.7}
                          testID={`coach-${mod.id}`}
                        >
                          <View style={[styles.coachAccent, { backgroundColor: catMeta.color }]} />
                          <View style={styles.coachCardInner}>
                            <Text style={styles.coachCardTitle} numberOfLines={2}>{mod.title}</Text>
                            <Text style={[styles.coachCardCategory, { color: catMeta.color }]}>{catMeta.label}</Text>
                            <View style={styles.coachCardMeta}>
                              <Clock size={11} color={Colors.textMuted} />
                              <Text style={styles.coachCardTime}>{mod.estimatedDuration} min</Text>
                              {isCompleted && (
                                <View style={styles.coachCompletedBadge}>
                                  <Text style={styles.coachCompletedText}>{localizedText('Done', 'Listo')}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  {(coachProgress?.completedModuleIds.length ?? 0) > 0 && (
                    <TouchableOpacity style={styles.viewProgressButton} onPress={handleViewProgress}>
                      <Target size={14} color={Colors.primary} />
                      <Text style={styles.viewProgressText}>{localizedText('View Learning Progress', 'Ver progreso de aprendizaje')}</Text>
                      <ArrowRight size={14} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Categories</Text>
                  {categories.map((category, index) => renderCategoryCard(category, index))}
                </View>
              </Animated.View>
            ) : activeTab === 'paths' ? (
              <Animated.View style={{ opacity: fadeAnim }}>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Learning Paths</Text>
                  <Text style={styles.pathsIntro}>Structured journeys that guide you through key emotional skills, step by step.</Text>
                  {learningPaths.map(path => {
                    const completion = pathState ? getPathCompletionPercent(path.id, pathState) : 0;
                    return (
                      <TouchableOpacity
                        key={path.id}
                        style={styles.pathListCard}
                        onPress={() => handlePathPress(path.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.pathListIconWrap, { backgroundColor: path.color + '18' }]}>
                          {renderCategoryIcon(path.icon, path.color)}
                        </View>
                        <View style={styles.pathListContent}>
                          <Text style={styles.pathListTitle}>{path.title}</Text>
                          <Text style={styles.pathListDesc} numberOfLines={2}>{path.description}</Text>
                          <View style={styles.pathListMeta}>
                            <Text style={styles.pathListSteps}>{path.steps.length} lessons</Text>
                            {completion > 0 && (
                              <Text style={[styles.pathListProgress, { color: path.color }]}>{completion}% complete</Text>
                            )}
                          </View>
                          {completion > 0 && (
                            <View style={styles.pathListProgressBarBg}>
                              <View style={[styles.pathListProgressBarFill, { width: `${completion}%`, backgroundColor: path.color }]} />
                            </View>
                          )}
                        </View>
                        <ChevronRight size={18} color={Colors.textMuted} />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Brain size={16} color={Colors.brandLilac} />
                    <Text style={styles.sectionTitle}>{localizedText('Emotional Patterns', 'Patrones emocionales')}</Text>
                  </View>
                  {patterns.map(pattern => (
                    <TouchableOpacity
                      key={pattern.id}
                      style={styles.patternListCard}
                      onPress={() => handlePatternPress(pattern.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.patternListIconWrap, { backgroundColor: pattern.color + '15' }]}>
                        {renderCategoryIcon(pattern.icon, pattern.color)}
                      </View>
                      <View style={styles.patternListContent}>
                        <Text style={styles.patternListTitle}>{pattern.title}</Text>
                        <Text style={styles.patternListSubtitle} numberOfLines={2}>{pattern.subtitle}</Text>
                      </View>
                      <ChevronRight size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Eye size={16} color={Colors.brandAmber} />
                    <Text style={styles.sectionTitle}>All Scenarios</Text>
                  </View>
                  {scenarios.map(renderScenarioCard)}
                </View>
              </Animated.View>
            ) : (
              <Animated.View style={{ opacity: fadeAnim }}>
                {bookmarkedLessons.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{bookmarkedLessons.length} saved lesson{bookmarkedLessons.length !== 1 ? 's' : ''}</Text>
                    {bookmarkedLessons.map(renderLessonCard)}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Bookmark size={40} color={Colors.textMuted} />
                    <Text style={styles.emptyTitle}>{localizedText('No saved lessons yet', 'Aun no hay lecciones guardadas')}</Text>
                    <Text style={styles.emptyDesc}>Bookmark lessons to find them here</Text>
                  </View>
                )}
              </Animated.View>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 4,
  },
  learnHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  learnHeaderText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.brandTeal,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  tabBar: {
    flexDirection: 'row' as const,
    paddingHorizontal: 24,
    gap: 8,
    paddingBottom: 4,
  },
  tab: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabActive: {
    backgroundColor: Colors.brandTealSoft,
    borderColor: Colors.brandTeal,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.brandTeal,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 24,
    marginBottom: 12,
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
  horizontalScroll: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 8,
  },
  weeklyInsightCard: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: Colors.brandTealSoft,
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brandTeal,
  },
  weeklyInsightHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  weeklyInsightLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.brandTeal,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  weeklyInsightMessage: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  weeklyInsightAction: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 12,
  },
  weeklyInsightActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  pathCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: 200,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pathAccent: {
    height: 4,
    width: '100%',
  },
  pathCardInner: {
    padding: 16,
  },
  pathIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  pathCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  pathCardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  pathCardFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 10,
  },
  pathStepCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  pathProgressBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  pathProgressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pathProgressText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  pathProgressBarBg: {
    height: 3,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden' as const,
  },
  pathProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  patternCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    width: 160,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  patternIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  patternCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  patternCardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  scenarioCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
    overflow: 'hidden' as const,
  },
  scenarioAccent: {
    width: 4,
    height: 44,
    borderRadius: 2,
  },
  scenarioCardContent: {
    flex: 1,
  },
  scenarioCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  scenarioCardSituation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  scenarioCardMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginTop: 6,
  },
  scenarioCardMetaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  viewAllButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    marginHorizontal: 24,
    marginTop: 8,
    paddingVertical: 10,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  recentCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    width: 160,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between' as const,
    minHeight: 100,
  },
  recentCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  recentCardMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 10,
  },
  recentCardTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  categoryCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    marginBottom: 10,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  categoryMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginTop: 6,
  },
  categoryLessonCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  progressBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  categoryProgressBarBg: {
    height: 3,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden' as const,
  },
  categoryProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  lessonCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  lessonCardContent: {
    flex: 1,
  },
  lessonCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  lessonCardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  lessonCardMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 6,
  },
  lessonCardTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  completedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 80,
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
  recContextLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
    paddingHorizontal: 24,
    marginBottom: 10,
    marginTop: -2,
  },
  recCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    width: 180,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between' as const,
    minHeight: 130,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  recAccent: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginBottom: 10,
  },
  recCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  recCardReason: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
    fontStyle: 'italic' as const,
  },
  recCardMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 10,
  },
  recCardTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  coachCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: 180,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 130,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden' as const,
  },
  coachAccent: {
    height: 4,
    width: '100%',
  },
  coachCardInner: {
    padding: 14,
    flex: 1,
    justifyContent: 'space-between' as const,
  },
  coachCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  coachCardCategory: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  coachCardMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    marginTop: 10,
  },
  coachCardTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  coachCompletedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  coachCompletedText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  viewProgressButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginHorizontal: 24,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  viewProgressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  pathsIntro: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: -4,
  },
  pathListCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  pathListIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pathListContent: {
    flex: 1,
  },
  pathListTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pathListDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  pathListMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginTop: 6,
  },
  pathListSteps: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  pathListProgress: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  pathListProgressBarBg: {
    height: 3,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden' as const,
  },
  pathListProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  patternListCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  patternListIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  patternListContent: {
    flex: 1,
  },
  patternListTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  patternListSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});
