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
import { BookOpen, X, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getLessonById } from '@/services/learn/learnService';
import { PostEventSuggestion } from '@/types/learningRecommendation';
import { LEARN_CATEGORIES } from '@/data/lessonCategories';
import { useAnalytics } from '@/providers/AnalyticsProvider';

interface Props {
  suggestions: PostEventSuggestion[];
  onDismiss?: () => void;
}

const PostEventLearningSuggestion = React.memo(function PostEventLearningSuggestion({ suggestions, onDismiss }: Props) {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (suggestions.length > 0) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [suggestions.length, slideAnim, fadeAnim]);

  const handlePress = useCallback((suggestion: PostEventSuggestion) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('learning_article_opened', {
      article_id: suggestion.lessonId,
      trigger_context: suggestion.flowSource,
      category: getLessonById(suggestion.lessonId)?.categoryId ?? 'unknown',
    });
    router.push(`/learn/lesson?id=${suggestion.lessonId}` as any);
  }, [router, trackEvent]);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  }, [fadeAnim, slideAnim, onDismiss]);

  if (suggestions.length === 0) return null;

  const firstSuggestion = suggestions[0];
  const lesson = getLessonById(firstSuggestion.lessonId);
  if (!lesson) return null;

  const catColor = LEARN_CATEGORIES.find(c => c.id === lesson.categoryId)?.color ?? Colors.primary;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      testID="post-event-learning"
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: catColor + '18' }]}>
            <BookOpen size={16} color={catColor} />
          </View>
          <Text style={styles.headerText}>Want to learn more?</Text>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.reason}>{firstSuggestion.reason}</Text>

      <TouchableOpacity
        style={styles.articleRow}
        onPress={() => handlePress(firstSuggestion)}
        activeOpacity={0.7}
      >
        <View style={[styles.dot, { backgroundColor: catColor }]} />
        <View style={styles.articleInfo}>
          <Text style={styles.articleTitle} numberOfLines={1}>{lesson.title}</Text>
          <Text style={styles.articleTime}>{lesson.readingTime} min read</Text>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      {suggestions.length > 1 && (() => {
        const secondLesson = getLessonById(suggestions[1].lessonId);
        if (!secondLesson) return null;
        const secondColor = LEARN_CATEGORIES.find(c => c.id === secondLesson.categoryId)?.color ?? Colors.primary;
        return (
          <TouchableOpacity
            style={[styles.articleRow, styles.articleRowLast]}
            onPress={() => handlePress(suggestions[1])}
            activeOpacity={0.7}
          >
            <View style={[styles.dot, { backgroundColor: secondColor }]} />
            <View style={styles.articleInfo}>
              <Text style={styles.articleTitle} numberOfLines={1}>{secondLesson.title}</Text>
              <Text style={styles.articleTime}>{secondLesson.readingTime} min read</Text>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        );
      })()}
    </Animated.View>
  );
});

export default PostEventLearningSuggestion;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    marginHorizontal: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reason: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 19,
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 12,
  },
  articleRowLast: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  articleInfo: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  articleTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
