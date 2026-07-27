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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Lightbulb,
  Bookmark,
  Wrench,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ChevronRight,
  PenLine,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDailyInsight } from '@/hooks/useDailyInsight';
import { getInsightById } from '@/services/learn/dailyInsightService';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { InsightFeedback } from '@/types/dailyInsight';
import { localizedText } from '@/lib/i18n/staticText';
import { useLanguage } from '@/hooks/useLanguage';

export default function DailyInsightScreen() {
  useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trackEvent } = useAnalytics();
  const { selection, isSaved, currentFeedback, toggleSave, submitFeedback, markViewed } = useDailyInsight();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const insight = useMemo(() => {
    if (id) return getInsightById(id);
    return selection?.insight ?? null;
  }, [id, selection]);

  const isPatternTriggered = selection?.isPatternTriggered ?? false;
  const patternMessage = selection?.patternMessage;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (insight) {
      trackEvent('daily_insight_shown', { insight_id: insight.id });
      markViewed(insight.id);
    }
  }, [insight, trackEvent, markViewed]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleSave = useCallback(() => {
    if (!insight) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('daily_insight_saved', { insight_id: insight.id, saved: !isSaved });
    toggleSave(insight.id);
  }, [insight, isSaved, toggleSave, trackEvent]);

  const handleFeedback = useCallback((feedback: InsightFeedback) => {
    if (!insight) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('daily_insight_feedback', { insight_id: insight.id, feedback });
    submitFeedback(insight.id, feedback);
  }, [insight, submitFeedback, trackEvent]);

  const handleToolPress = useCallback(() => {
    if (!insight) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('daily_insight_tool_clicked', {
      insight_id: insight.id,
      tool_id: insight.suggestedToolId,
    });
    router.push(`/tools/dbt-skill?skillId=${insight.suggestedToolId}` as any);
  }, [insight, router, trackEvent]);

  const handleJournal = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('daily_insight_journal_clicked', { insight_id: insight?.id ?? '' });
    router.push('/journal-write' as any);
  }, [router, trackEvent, insight]);

  const handleCompanion = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('daily_insight_companion_clicked', { insight_id: insight?.id ?? '' });
    router.push('/(tabs)/companion' as any);
  }, [router, trackEvent, insight]);

  if (!insight) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyState}>
          <Lightbulb size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>{localizedText('No insight available', 'No hay insight disponible')}</Text>
          <Text style={styles.emptyDesc}>Check back tomorrow for a new insight.</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.headerButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID="daily-insight-close"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{localizedText('Daily Insight', 'Insight diario')}</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID="daily-insight-detail-save"
        >
          <Bookmark
            size={22}
            color={isSaved ? Colors.brandAmber : Colors.textMuted}
            fill={isSaved ? Colors.brandAmber : 'none'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.iconSection}>
            <View style={styles.largeIconWrap}>
              <Lightbulb size={32} color="#67E8F9" />
            </View>
          </View>

          {isPatternTriggered && (
            <View style={styles.personalizedBanner}>
              <Sparkles size={14} color={Colors.brandTeal} />
              <Text style={styles.personalizedText}>Selected based on your recent patterns</Text>
            </View>
          )}

          <Text style={styles.insightTitle}>{insight.title}</Text>

          <View style={styles.explanationCard}>
            <Text style={styles.explanationText}>{insight.explanation}</Text>
          </View>

          {isPatternTriggered && patternMessage && (
            <View style={styles.patternCard}>
              <View style={styles.patternHeader}>
                <Sparkles size={14} color={Colors.brandTeal} />
                <Text style={styles.patternLabel}>{localizedText('Pattern Notice', 'Aviso de patron')}</Text>
              </View>
              <Text style={styles.patternText}>{patternMessage}</Text>
            </View>
          )}

          <View style={styles.scenarioCard}>
            <Text style={styles.scenarioLabel}>Example</Text>
            <Text style={styles.scenarioText}>{insight.scenario}</Text>
          </View>

          <View style={styles.actionsSection}>
            <Text style={styles.actionsSectionTitle}>{localizedText('What you can do', 'Que puedes hacer')}</Text>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleToolPress}
              activeOpacity={0.7}
              testID="daily-insight-try-tool"
            >
              <View style={[styles.actionIconWrap, { backgroundColor: Colors.warmGlow }]}>
                <Wrench size={18} color={Colors.brandAmber} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{localizedText('Try this skill', 'Probar esta habilidad')}</Text>
                <Text style={styles.actionDesc}>{insight.suggestedToolLabel}</Text>
              </View>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleJournal}
              activeOpacity={0.7}
              testID="daily-insight-journal"
            >
              <View style={[styles.actionIconWrap, { backgroundColor: Colors.brandTealSoft }]}>
                <PenLine size={18} color={Colors.brandTeal} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{localizedText('Journal about this', 'Escribir sobre esto')}</Text>
                <Text style={styles.actionDesc}>Reflect on how this applies to you</Text>
              </View>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleCompanion}
              activeOpacity={0.7}
              testID="daily-insight-companion"
            >
              <View style={[styles.actionIconWrap, { backgroundColor: Colors.brandLilacSoft }]}>
                <MessageCircle size={18} color={Colors.brandLilac} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Discuss with Companion</Text>
                <Text style={styles.actionDesc}>Explore this insight further</Text>
              </View>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>Was this helpful?</Text>
            <Text style={styles.feedbackDesc}>{localizedText('Your feedback helps personalize future insights.', 'Tu respuesta ayuda a personalizar futuros insights.')}</Text>

            <View style={styles.feedbackButtons}>
              <TouchableOpacity
                style={[
                  styles.feedbackButton,
                  currentFeedback === 'helpful' && styles.feedbackButtonActive,
                ]}
                onPress={() => handleFeedback('helpful')}
                activeOpacity={0.7}
                testID="daily-insight-helpful"
              >
                <ThumbsUp
                  size={18}
                  color={currentFeedback === 'helpful' ? Colors.brandTeal : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.feedbackButtonText,
                    currentFeedback === 'helpful' && styles.feedbackButtonTextActive,
                  ]}
                >
                  This helped
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.feedbackButton,
                  currentFeedback === 'not_relevant' && styles.feedbackButtonInactive,
                ]}
                onPress={() => handleFeedback('not_relevant')}
                activeOpacity={0.7}
                testID="daily-insight-not-relevant"
              >
                <ThumbsDown
                  size={18}
                  color={currentFeedback === 'not_relevant' ? Colors.danger : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.feedbackButtonText,
                    currentFeedback === 'not_relevant' && styles.feedbackButtonTextInactive,
                  ]}
                >
                  Not relevant
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.feedbackButton,
                  currentFeedback === 'more_like_this' && styles.feedbackButtonActive,
                ]}
                onPress={() => handleFeedback('more_like_this')}
                activeOpacity={0.7}
                testID="daily-insight-more"
              >
                <Sparkles
                  size={18}
                  color={currentFeedback === 'more_like_this' ? Colors.brandTeal : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.feedbackButtonText,
                    currentFeedback === 'more_like_this' && styles.feedbackButtonTextActive,
                  ]}
                >
                  More like this
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {insight.relatedPatternTags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsLabel}>Related topics</Text>
              <View style={styles.tagsWrap}>
                {insight.relatedPatternTags.map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{formatTag(tag)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function formatTag(tag: string): string {
  return tag
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.brandNavy,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  iconSection: {
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  largeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: 'rgba(196, 149, 106, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  personalizedBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: Colors.brandTealSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'center' as const,
  },
  personalizedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  insightTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.brandNavy,
    textAlign: 'center' as const,
    lineHeight: 34,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  explanationCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 22,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brandAmber,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  explanationText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 25,
    letterSpacing: 0.1,
  },
  patternCard: {
    backgroundColor: Colors.brandTealSoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(74, 139, 141, 0.15)',
  },
  patternHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  patternLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.brandTeal,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  patternText: {
    fontSize: 14,
    color: Colors.brandTeal,
    lineHeight: 21,
    fontWeight: '500' as const,
  },
  scenarioCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  scenarioLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.brandAmber,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  scenarioText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 23,
    fontStyle: 'italic' as const,
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionsSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  actionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  feedbackSection: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center' as const,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    marginBottom: 4,
  },
  feedbackDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  feedbackButtons: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  feedbackButton: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  feedbackButtonActive: {
    backgroundColor: Colors.brandTealSoft,
    borderColor: Colors.brandTeal,
  },
  feedbackButtonInactive: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger,
  },
  feedbackButtonText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textAlign: 'center' as const,
  },
  feedbackButtonTextActive: {
    color: Colors.brandTeal,
  },
  feedbackButtonTextInactive: {
    color: Colors.danger,
  },
  tagsSection: {
    marginBottom: 20,
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  tagsWrap: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  closeButton: {
    backgroundColor: Colors.brandTeal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
