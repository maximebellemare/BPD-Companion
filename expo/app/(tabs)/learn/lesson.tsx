import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Bookmark,
  CheckCircle,
  Lightbulb,
  Target,
  Dumbbell,
  Wrench,
  ArrowRight,
  BookOpen,
  MessageSquareHeart,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  getLessonById,
  getCategoryById,
  getLearnState,
  markLessonViewed,
  markLessonCompleted,
  toggleBookmark,
} from '@/services/learn/learnService';
import { LearnState, LessonSection } from '@/types/learn';

const SECTION_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  callout: Lightbulb,
  takeaway: Target,
  exercise: Dumbbell,
};

const REFLECTION_PROMPTS: Record<string, string[]> = {
  'understanding-bpd': [
    'Does anything in this lesson feel familiar in your own experience?',
    'What part of this resonated most with you?',
    'How does understanding this change the way you see yourself?',
  ],
  'emotional-regulation': [
    'Can you think of a recent moment when this skill could have helped?',
    'What is one small thing you could try from this lesson today?',
    'How do you usually respond when emotions feel overwhelming?',
  ],
  'relationships': [
    'Does this pattern show up in any of your current relationships?',
    'What would change if you tried one thing from this lesson?',
    'How do you feel after reading this — is anything shifting?',
  ],
  'triggers-abandonment': [
    'Can you identify a recent trigger that connects to what you read?',
    'What would it feel like to respond differently next time?',
    'Is there an old wound this lesson is helping you understand?',
  ],
  'identity-selfworth': [
    'What is one thing you know to be true about yourself right now?',
    'How do you talk to yourself when things go wrong?',
    'What would self-compassion look like for you today?',
  ],
  'communication': [
    'Think of a recent conversation that felt hard. What could you try differently?',
    'What is one need you find difficult to express?',
    'How does it feel to imagine communicating more openly?',
  ],
  'crisis-storms': [
    'What has helped you get through difficult moments before?',
    'What is one safe thing you could reach for during the next storm?',
    'How do you feel knowing that every storm eventually passes?',
  ],
  'daily-stability': [
    'What is one small routine that already helps you feel grounded?',
    'What would a slightly more stable day look like for you?',
    'How does your body feel when your basic needs are met?',
  ],
  'therapy-healing': [
    'What does recovery mean to you personally?',
    'What is one sign of progress you can see in yourself?',
    'How does it feel to know that healing is possible?',
  ],
};

function getReflectionPrompt(categoryId: string): string {
  const prompts = REFLECTION_PROMPTS[categoryId] ?? REFLECTION_PROMPTS['understanding-bpd'] ?? [];
  if (prompts.length === 0) return 'What stood out to you in this lesson?';
  return prompts[Math.floor(Math.random() * prompts.length)] ?? prompts[0];
}

const SECTION_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  callout: { bg: '#EEF4F0', border: '#6B9080', icon: '#6B9080' },
  takeaway: { bg: '#FFF8F0', border: '#D4956A', icon: '#D4956A' },
  exercise: { bg: '#F0F0FF', border: '#7B8CDE', icon: '#7B8CDE' },
};

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [learnState, setLearnState] = useState<LearnState | null>(null);

  const lesson = getLessonById(id ?? '');
  const category = lesson ? getCategoryById(lesson.categoryId) : undefined;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    void (async () => {
      const state = await getLearnState();
      const updated = await markLessonViewed(id ?? '', state);
      setLearnState(updated);
    })();
  }, [id]);

  const isBookmarked = learnState?.bookmarkedIds.includes(id ?? '') ?? false;
  const isCompleted = learnState?.progress[id ?? '']?.completed ?? false;

  const handleBookmark = useCallback(async () => {
    if (!learnState) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newState = await toggleBookmark(id ?? '', learnState);
    setLearnState(newState);
  }, [learnState, id]);

  const handleComplete = useCallback(async () => {
    if (!learnState) return;
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const newState = await markLessonCompleted(id ?? '', learnState);
    setLearnState(newState);
  }, [learnState, id]);

  const handleToolPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(tabs)/tools' as any);
  }, [router]);

  if (!lesson) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Lesson' }} />
        <View style={styles.emptyState}>
          <BookOpen size={40} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Lesson not found</Text>
        </View>
      </View>
    );
  }

  const renderSection = (section: LessonSection, _index: number) => {
    if (section.type === 'text') {
      return (
        <Animated.View
          key={section.id}
          style={[styles.textSection, { opacity: fadeAnim }]}
        >
          <Text style={styles.sectionHeading}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.content}</Text>
        </Animated.View>
      );
    }

    const colors = SECTION_COLORS[section.type] ?? SECTION_COLORS.callout;
    const IconComp = SECTION_ICONS[section.type] ?? Lightbulb;

    return (
      <Animated.View
        key={section.id}
        style={[
          styles.specialSection,
          {
            backgroundColor: colors.bg,
            borderLeftColor: colors.border,
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.specialHeader}>
          <IconComp size={18} color={colors.icon} />
          <Text style={[styles.specialLabel, { color: colors.icon }]}>
            {section.type === 'callout' ? 'Key Insight' : section.type === 'takeaway' ? 'Takeaway' : 'Try This'}
          </Text>
        </View>
        <Text style={styles.specialHeading}>{section.title}</Text>
        <Text style={styles.specialBody}>{section.content}</Text>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerTintColor: Colors.text,
          headerStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => void handleBookmark()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.headerBookmark}
            >
              <Bookmark
                size={22}
                color={isBookmarked ? Colors.accent : Colors.textMuted}
                fill={isBookmarked ? Colors.accent : 'none'}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
          {category && (
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '18' }]}>
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>{category.title}</Text>
            </View>
          )}
          <Text style={styles.title}>{lesson.title}</Text>
          <Text style={styles.description}>{lesson.description}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <BookOpen size={14} color={Colors.textMuted} />
              <Text style={styles.metaText}>{lesson.readingTime} min read</Text>
            </View>
            {isCompleted && (
              <View style={styles.completedIndicator}>
                <CheckCircle size={14} color={Colors.success} />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <View style={styles.divider} />

        <View style={styles.content}>
          {lesson.sections.map((section, index) => renderSection(section, index))}
        </View>

        <View style={styles.reflectionSection}>
          <View style={styles.reflectionCard}>
            <View style={styles.reflectionIconRow}>
              <MessageSquareHeart size={20} color={Colors.accent} />
              <Text style={styles.reflectionLabel}>Reflect</Text>
            </View>
            <Text style={styles.reflectionPrompt}>
              {getReflectionPrompt(lesson.categoryId)}
            </Text>
          </View>
        </View>

        {(lesson.relatedToolIds.length > 0 || lesson.relatedExerciseIds.length > 0) && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Tools</Text>
            <TouchableOpacity
              style={styles.relatedCard}
              onPress={handleToolPress}
              activeOpacity={0.7}
            >
              <Wrench size={20} color={Colors.primary} />
              <View style={styles.relatedCardContent}>
                <Text style={styles.relatedCardTitle}>Open Coping Tools</Text>
                <Text style={styles.relatedCardDesc}>Practice what you've learned</Text>
              </View>
              <ArrowRight size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {!isCompleted && (
          <View style={styles.completeSection}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => void handleComplete()}
              activeOpacity={0.8}
              testID="complete-lesson-button"
            >
              <CheckCircle size={20} color={Colors.white} />
              <Text style={styles.completeButtonText}>Mark as Completed</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedSection}>
            <View style={styles.completedCard}>
              <CheckCircle size={28} color={Colors.success} />
              <Text style={styles.completedCardTitle}>Lesson complete</Text>
              <Text style={styles.completedCardDesc}>
                You've read this lesson. Come back anytime.
              </Text>
            </View>
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
  scrollContent: {
    paddingBottom: 60,
  },
  headerBookmark: {
    padding: 4,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 24,
  },
  textSection: {},
  sectionHeading: {
    fontSize: 19,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  sectionBody: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  specialSection: {
    borderLeftWidth: 4,
    borderRadius: 14,
    padding: 20,
  },
  specialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  specialLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  specialHeading: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  specialBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  relatedSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  relatedTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  relatedCardContent: {
    flex: 1,
  },
  relatedCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  relatedCardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  completeSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  completedSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  completedCard: {
    backgroundColor: Colors.successLight,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  completedCardTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  completedCardDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reflectionSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  reflectionCard: {
    backgroundColor: Colors.accentLight,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  reflectionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  reflectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  reflectionPrompt: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
