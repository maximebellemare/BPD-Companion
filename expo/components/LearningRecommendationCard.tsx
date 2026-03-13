import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, ChevronRight, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLearningRecommendations, LearningRecommendationWithLesson } from '@/hooks/useLearningRecommendations';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { LEARN_CATEGORIES } from '@/data/lessonCategories';

const LearningRecommendationCard = React.memo(function LearningRecommendationCard() {
  const router = useRouter();
  const { recommendations, contextMessage, topSignals, isLoading, trackArticleOpened, trackRecommendationShown } = useLearningRecommendations();
  const { trackEvent } = useAnalytics();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (recommendations.length > 0 && !isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      if (!hasTrackedRef.current) {
        hasTrackedRef.current = true;
        void trackRecommendationShown();
        trackEvent('learning_recommendation_shown', {
          count: recommendations.length,
          top_signal: topSignals[0] ?? 'none',
        });
      }
    }
  }, [recommendations.length, isLoading, fadeAnim, trackRecommendationShown, trackEvent, topSignals]);

  const handlePress = useCallback((rec: LearningRecommendationWithLesson) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('learning_recommendation_clicked', {
      article_id: rec.lessonId,
      trigger_context: rec.signal,
      category: rec.lesson.categoryId,
    });
    void trackArticleOpened(rec.lessonId, 'recommendation', rec.signal);
    router.push(`/learn/lesson?id=${rec.lessonId}` as any);
  }, [router, trackEvent, trackArticleOpened]);

  const handleSeeAll = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(tabs)/learn' as any);
  }, [router]);

  if (isLoading || recommendations.length === 0) {
    return null;
  }

  const getCategoryColor = (categoryId: string): string => {
    return LEARN_CATEGORIES.find(c => c.id === categoryId)?.color ?? Colors.primary;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} testID="learning-recommendation-card">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <Sparkles size={16} color={Colors.accent} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Recommended For You</Text>
            <Text style={styles.headerSubtitle}>{contextMessage}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {recommendations.map((rec, index) => {
        const catColor = getCategoryColor(rec.lesson.categoryId);
        const catName = LEARN_CATEGORIES.find(c => c.id === rec.lesson.categoryId)?.title ?? '';

        return (
          <TouchableOpacity
            key={rec.lessonId}
            style={[
              styles.articleCard,
              index === recommendations.length - 1 && styles.articleCardLast,
            ]}
            onPress={() => handlePress(rec)}
            activeOpacity={0.7}
            testID={`rec-article-${rec.lessonId}`}
          >
            <View style={[styles.accentBar, { backgroundColor: catColor }]} />
            <View style={styles.articleContent}>
              <View style={styles.articleTop}>
                <View style={[styles.categoryPill, { backgroundColor: catColor + '15' }]}>
                  <Text style={[styles.categoryPillText, { color: catColor }]}>{catName}</Text>
                </View>
                <View style={styles.readTimeBadge}>
                  <Clock size={10} color={Colors.textMuted} />
                  <Text style={styles.readTimeText}>{rec.lesson.readingTime} min</Text>
                </View>
              </View>
              <Text style={styles.articleTitle} numberOfLines={2}>{rec.lesson.title}</Text>
              <Text style={styles.articleReason} numberOfLines={1}>{rec.reason}</Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} style={styles.chevron} />
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
});

export default LearningRecommendationCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
    marginHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  articleCardLast: {
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  accentBar: {
    width: 3,
    height: 40,
    borderRadius: 2,
    marginRight: 14,
  },
  articleContent: {
    flex: 1,
  },
  articleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  readTimeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  articleReason: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic' as const,
  },
  chevron: {
    marginLeft: 8,
  },
});
