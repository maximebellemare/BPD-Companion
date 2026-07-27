import React, { useEffect, useRef, useCallback, useMemo } from 'react';
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
  AlertTriangle,
  Lightbulb,
  Wrench,
  BookOpen,
  ArrowRight,
  MessageSquareHeart,
  ShieldAlert,
  TrendingUp,
  ArrowDownCircle,
  Repeat,
  GitPullRequest,
  Heart,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getPatternById } from '@/services/learn/learningPathService';
import { getLessonById } from '@/services/learn/learnService';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { localizedText } from '@/lib/i18n/staticText';
import { useLanguage } from '@/hooks/useLanguage';

const PATTERN_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'shield-alert': ShieldAlert,
  'trending-up': TrendingUp,
  'arrow-down-circle': ArrowDownCircle,
  repeat: Repeat,
  'git-pull-request': GitPullRequest,
};

export default function PatternEducationScreen() {
  useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { trackEvent } = useAnalytics();

  const pattern = useMemo(() => getPatternById(id ?? ''), [id]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    trackEvent('pattern_education_viewed', { pattern_id: id ?? '' });
  }, [fadeAnim, id, trackEvent]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

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

  if (!pattern) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>{localizedText('Pattern', 'Patron')}</Text>
          <View style={styles.topBarSpacer} />
        </View>
        <View style={styles.emptyState}>
          <BookOpen size={40} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>{localizedText('Pattern not found', 'Patron no encontrado')}</Text>
        </View>
      </View>
    );
  }

  const IconComp = PATTERN_ICONS[pattern.icon] ?? Heart;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton} testID="pattern-back">
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{localizedText('Emotional Pattern', 'Patron emocional')}</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: pattern.color + '15' }]}>
            <IconComp size={32} color={pattern.color} />
          </View>
          <Text style={styles.heroTitle}>{pattern.title}</Text>
          <Text style={styles.heroSubtitle}>{pattern.subtitle}</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>{localizedText('What It Is', 'Que es')}</Text>
            <Text style={styles.sectionBody}>{pattern.description}</Text>
          </View>

          <View style={[styles.insightCard, { borderLeftColor: pattern.color }]}>
            <View style={styles.insightHeader}>
              <Lightbulb size={16} color={pattern.color} />
              <Text style={[styles.insightLabel, { color: pattern.color }]}>{localizedText('How It Works', 'Como funciona')}</Text>
            </View>
            <Text style={styles.insightBody}>{pattern.howItWorks}</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.listHeader}>
              <AlertTriangle size={16} color={Colors.accent} />
              <Text style={styles.listTitle}>{localizedText('Common Triggers', 'Disparadores comunes')}</Text>
            </View>
            {pattern.commonTriggers.map((trigger, i) => (
              <View key={i} style={styles.listItem}>
                <View style={[styles.listDot, { backgroundColor: pattern.color }]} />
                <Text style={styles.listText}>{trigger}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.listHeader}>
              <Heart size={16} color={Colors.danger} />
              <Text style={styles.listTitle}>{localizedText('What It Feels Like', 'Como se siente')}</Text>
            </View>
            {pattern.whatItFeelsLike.map((feeling, i) => (
              <View key={i} style={styles.listItem}>
                <View style={[styles.listDot, { backgroundColor: Colors.danger }]} />
                <Text style={styles.listText}>{feeling}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.strategiesCard, { backgroundColor: pattern.color + '08' }]}>
            <View style={styles.listHeader}>
              <Wrench size={16} color={pattern.color} />
              <Text style={[styles.listTitle, { color: pattern.color }]}>Helpful Strategies</Text>
            </View>
            {pattern.helpfulStrategies.map((strategy, i) => (
              <View key={i} style={styles.strategyItem}>
                <Text style={styles.strategyNumber}>{i + 1}</Text>
                <Text style={styles.strategyText}>{strategy}</Text>
              </View>
            ))}
          </View>

          <View style={styles.reflectionCard}>
            <View style={styles.reflectionHeader}>
              <MessageSquareHeart size={18} color={Colors.accent} />
              <Text style={styles.reflectionLabel}>Reflect</Text>
            </View>
            {pattern.reflectionQuestions.map((question, i) => (
              <Text key={i} style={styles.reflectionQuestion}>{question}</Text>
            ))}
          </View>

          {pattern.relatedLessonIds.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>{localizedText('Related Lessons', 'Lecciones relacionadas')}</Text>
              {pattern.relatedLessonIds.slice(0, 3).map(lessonId => {
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
                      <Text style={styles.relatedLessonTime}>{lesson.readingTime} min read</Text>
                    </View>
                    <ChevronRight size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.toolsSection}>
            <TouchableOpacity
              style={styles.toolsButton}
              onPress={handleToolsPress}
              activeOpacity={0.7}
            >
              <Wrench size={20} color={Colors.primary} />
              <View style={styles.toolsButtonContent}>
                <Text style={styles.toolsButtonTitle}>{localizedText('Practice These Skills Now', 'Practicar estas habilidades ahora')}</Text>
                <Text style={styles.toolsButtonDesc}>{localizedText('Open the Tools tab', 'Abrir la pestana Herramientas')}</Text>
              </View>
              <ArrowRight size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
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
    paddingBottom: 24,
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
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 6,
    fontStyle: 'italic' as const,
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  sectionBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
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
  insightBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  listHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  listItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    marginBottom: 10,
  },
  listDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  strategiesCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  strategyItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    marginBottom: 12,
  },
  strategyNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    width: 20,
    textAlign: 'center' as const,
    marginTop: 1,
  },
  strategyText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 23,
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
    marginBottom: 14,
  },
  reflectionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  reflectionQuestion: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 23,
    fontStyle: 'italic' as const,
    marginBottom: 10,
  },
  relatedSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  relatedTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
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
  toolsSection: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  toolsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    gap: 14,
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
