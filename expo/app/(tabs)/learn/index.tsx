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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  getCategories,
  getLearnState,
  getRecentlyViewedLessons,
  getBookmarkedLessons,
  searchLessons,
  getCategoryProgress,
} from '@/services/learn/learnService';
import { LearnState, LessonCategory, Lesson } from '@/types/learn';

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
};

export default function LearnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [learnState, setLearnState] = useState<LearnState | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Lesson[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'bookmarks'>('explore');

  const categories = useMemo(() => getCategories(), []);

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
  }, [loadState]);

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

  const handleCategoryPress = useCallback((categoryId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/learn/category?id=${categoryId}` as any);
  }, [router]);

  const handleLessonPress = useCallback((lessonId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/learn/lesson?id=${lessonId}` as any);
  }, [router]);

  const renderCategoryIcon = useCallback((iconName: string, color: string) => {
    const IconComponent = ICON_MAP[iconName] || BookOpen;
    return <IconComponent size={22} color={color} />;
  }, []);

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
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: category.color }]} />
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
        <Text style={styles.headerTitle}>Learn</Text>
        <Text style={styles.headerSubtitle}>Knowledge is power — and healing</Text>
      </Animated.View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search lessons, topics..."
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
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyDesc}>Try a different search term</Text>
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
              <BookOpen size={16} color={activeTab === 'explore' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'explore' && styles.tabTextActive]}>Explore</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'bookmarks' && styles.tabActive]}
              onPress={() => setActiveTab('bookmarks')}
            >
              <Bookmark size={16} color={activeTab === 'bookmarks' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'bookmarks' && styles.tabTextActive]}>Saved</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'explore' ? (
              <Animated.View style={{ opacity: fadeAnim }}>
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
                  <Text style={styles.sectionLabel}>Categories</Text>
                  {categories.map((category, index) => renderCategoryCard(category, index))}
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
                    <Text style={styles.emptyTitle}>No saved lessons yet</Text>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    paddingBottom: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    fontSize: 14,
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
    paddingBottom: 40,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
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
    justifyContent: 'space-between',
    minHeight: 100,
  },
  recentCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  recentCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  recentCardTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  categoryLessonCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
  progressBarBg: {
    height: 3,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
    lineHeight: 20,
  },
});
