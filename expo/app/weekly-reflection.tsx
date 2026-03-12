import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
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
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  TrendingDown,
  TrendingUp,
  Minus,
  Heart,
  MessageCircle,
  Shield,
  Lightbulb,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  Bookmark,
  CheckCircle,
  Target,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { generateWeeklyReflection, setReflectionFeedback } from '@/services/reflection/weeklyReflectionService';
import { WeeklyReflection, ReflectionFeedback } from '@/types/weeklyReflection';

export default function WeeklyReflectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { journalEntries, messageDrafts } = useApp();
  const [selectedFeedback, setSelectedFeedback] = useState<ReflectionFeedback | null>(null);

  const reflection = useMemo<WeeklyReflection>(
    () => generateWeeklyReflection(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(30)),
  ).current;
  const slideOpacities = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    slideAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 500,
        delay: 200 + i * 120,
        useNativeDriver: true,
      }).start();
    });

    slideOpacities.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 200 + i * 120,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, slideAnims, slideOpacities]);

  const handleFeedback = useCallback((feedback: ReflectionFeedback) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedFeedback(feedback);
    setReflectionFeedback(feedback);

    if (feedback === 'discuss') {
      router.push('/(tabs)/companion');
    }
  }, [router]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const getTrendIcon = (trend: 'rising' | 'falling' | 'steady') => {
    if (trend === 'rising') return <TrendingUp size={14} color="#E17055" />;
    if (trend === 'falling') return <TrendingDown size={14} color={Colors.success} />;
    return <Minus size={14} color={Colors.textMuted} />;
  };

  const getIntensityTrendIcon = (trend: 'decreasing' | 'increasing' | 'stable') => {
    if (trend === 'decreasing') return <TrendingDown size={16} color={Colors.success} />;
    if (trend === 'increasing') return <TrendingUp size={16} color="#E17055" />;
    return <Minus size={16} color={Colors.textMuted} />;
  };

  if (!reflection.hasEnoughData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.closeRow}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} testID="close-reflection">
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <BookOpen size={40} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your Reflection Is Building</Text>
          <Text style={styles.emptyText}>
            As you check in more throughout the week, your reflection will become richer and more personalized. Even small check-ins count.
          </Text>
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={() => router.push('/check-in')}
            activeOpacity={0.7}
          >
            <Text style={styles.emptyActionText}>Start a Check-In</Text>
            <ArrowRight size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.closeRow}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton} testID="close-reflection">
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
          <View style={styles.headerBadge}>
            <Calendar size={14} color={Colors.primary} />
            <Text style={styles.headerBadgeText}>{reflection.weekLabel}</Text>
          </View>
          <Text style={styles.headerTitle}>Weekly Reflection</Text>
          <Text style={styles.openingNarrative}>{reflection.openingNarrative}</Text>
        </Animated.View>

        {/* Emotional Landscape */}
        <Animated.View style={[styles.sectionCard, { opacity: slideOpacities[0], transform: [{ translateY: slideAnims[0] }] }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FFF0E6' }]}>
              <Heart size={18} color="#E17055" />
            </View>
            <Text style={styles.sectionTitle}>This Week's Emotional Landscape</Text>
          </View>

          <Text style={styles.narrativeText}>{reflection.emotionalLandscape.narrative}</Text>

          {reflection.emotionalLandscape.strongestEmotions.length > 0 && (
            <View style={styles.emotionGrid}>
              {reflection.emotionalLandscape.strongestEmotions.map((emotion, i) => (
                <View key={i} style={styles.emotionChip}>
                  <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                  <View style={styles.emotionInfo}>
                    <Text style={styles.emotionLabel}>{emotion.label}</Text>
                    <View style={styles.emotionTrendRow}>
                      {getTrendIcon(emotion.trend)}
                      <Text style={styles.emotionCount}>{emotion.count}x</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {reflection.emotionalLandscape.keyTriggers.length > 0 && (
            <View style={styles.triggersSection}>
              <Text style={styles.subLabel}>Key Triggers</Text>
              <View style={styles.triggersList}>
                {reflection.emotionalLandscape.keyTriggers.map((trigger, i) => (
                  <View key={i} style={styles.triggerTag}>
                    <Text style={styles.triggerText}>{trigger.label}</Text>
                    <Text style={styles.triggerCount}>{trigger.count}x</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.intensityRow}>
            <Text style={styles.intensityLabel}>Intensity trend</Text>
            <View style={styles.intensityValue}>
              {getIntensityTrendIcon(reflection.emotionalLandscape.intensityTrend)}
              <Text style={styles.intensityText}>
                {reflection.emotionalLandscape.intensityTrend === 'decreasing' ? 'Softening' :
                  reflection.emotionalLandscape.intensityTrend === 'increasing' ? 'Rising' : 'Steady'}
              </Text>
            </View>
          </View>

          {reflection.emotionalLandscape.peakDay && (
            <View style={styles.peakDayRow}>
              <Text style={styles.peakDayLabel}>Peak day</Text>
              <Text style={styles.peakDayValue}>{reflection.emotionalLandscape.peakDay}</Text>
            </View>
          )}
        </Animated.View>

        {/* Relationship Patterns */}
        <Animated.View style={[styles.sectionCard, { opacity: slideOpacities[1], transform: [{ translateY: slideAnims[1] }] }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#E8F4FD' }]}>
              <MessageCircle size={18} color="#3B82F6" />
            </View>
            <Text style={styles.sectionTitle}>Relationship Patterns</Text>
          </View>

          <Text style={styles.narrativeText}>{reflection.relationshipReflection.narrative}</Text>

          {reflection.relationshipReflection.communicationThemes.length > 0 && (
            <View style={styles.themesList}>
              <Text style={styles.subLabel}>Communication Themes</Text>
              {reflection.relationshipReflection.communicationThemes.map((theme, i) => (
                <View key={i} style={styles.themeItem}>
                  <View style={styles.themeDot} />
                  <Text style={styles.themeText}>{theme}</Text>
                </View>
              ))}
            </View>
          )}

          {reflection.relationshipReflection.conflictImprovements.length > 0 && (
            <View style={styles.improvementsList}>
              {reflection.relationshipReflection.conflictImprovements.map((imp, i) => (
                <View key={i} style={styles.improvementItem}>
                  <CheckCircle size={14} color={Colors.success} />
                  <Text style={styles.improvementText}>{imp}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.pauseGrowthCard}>
            <Text style={styles.pauseGrowthLabel}>Message pauses</Text>
            <View style={styles.pauseGrowthValues}>
              <Text style={styles.pauseGrowthThis}>{reflection.relationshipReflection.pauseGrowth.thisWeek}</Text>
              <Text style={styles.pauseGrowthVs}>vs</Text>
              <Text style={styles.pauseGrowthLast}>{reflection.relationshipReflection.pauseGrowth.lastWeek} last week</Text>
            </View>
          </View>
        </Animated.View>

        {/* What Helped */}
        <Animated.View style={[styles.sectionCard, { opacity: slideOpacities[2], transform: [{ translateY: slideAnims[2] }] }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: Colors.successLight }]}>
              <Shield size={18} color={Colors.success} />
            </View>
            <Text style={styles.sectionTitle}>What Helped</Text>
          </View>

          <Text style={styles.narrativeText}>{reflection.whatHelped.narrative}</Text>

          {reflection.whatHelped.effectiveTools.length > 0 && (
            <View style={styles.toolsList}>
              {reflection.whatHelped.effectiveTools.map((tool, i) => (
                <View key={i} style={styles.toolCard}>
                  <View style={styles.toolHeader}>
                    <Text style={styles.toolName}>{tool.tool}</Text>
                    <View style={styles.toolBadge}>
                      <Text style={styles.toolBadgeText}>{tool.timesUsed}x</Text>
                    </View>
                  </View>
                  <Text style={styles.toolNote}>{tool.effectivenessNote}</Text>
                </View>
              ))}
            </View>
          )}

          {reflection.whatHelped.helpfulPractices.length > 0 && (
            <View style={styles.practicesList}>
              <Text style={styles.subLabel}>Helpful Practices</Text>
              {reflection.whatHelped.helpfulPractices.map((practice, i) => (
                <View key={i} style={styles.practiceItem}>
                  <View style={styles.practiceCheck}>
                    <CheckCircle size={14} color={Colors.primary} />
                  </View>
                  <Text style={styles.practiceText}>{practice}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Growth Signals */}
        <Animated.View style={[styles.sectionCard, styles.growthCard, { opacity: slideOpacities[3], transform: [{ translateY: slideAnims[3] }] }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FFF8E1' }]}>
              <Sparkles size={18} color="#F59E0B" />
            </View>
            <Text style={styles.sectionTitle}>Growth Signals</Text>
          </View>

          <Text style={styles.narrativeText}>{reflection.growthSignals.narrative}</Text>

          {reflection.growthSignals.improvements.length > 0 && (
            <View style={styles.improvementsGrid}>
              {reflection.growthSignals.improvements.map((imp, i) => (
                <View key={i} style={styles.growthItem}>
                  <Text style={styles.growthIcon}>{imp.icon}</Text>
                  <View style={styles.growthItemContent}>
                    <Text style={styles.growthItemTitle}>{imp.area}</Text>
                    <Text style={styles.growthItemDesc}>{imp.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {reflection.growthSignals.awarenessGains.length > 0 && (
            <View style={styles.gainsList}>
              <Text style={styles.subLabel}>Awareness</Text>
              {reflection.growthSignals.awarenessGains.map((gain, i) => (
                <Text key={i} style={styles.gainText}>• {gain}</Text>
              ))}
            </View>
          )}

          {reflection.growthSignals.communicationWins.length > 0 && (
            <View style={styles.gainsList}>
              <Text style={styles.subLabel}>Communication</Text>
              {reflection.growthSignals.communicationWins.map((win, i) => (
                <Text key={i} style={styles.gainText}>• {win}</Text>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Next Week Focus */}
        <Animated.View style={[styles.sectionCard, styles.focusCard, { opacity: slideOpacities[4], transform: [{ translateY: slideAnims[4] }] }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: Colors.primaryLight }]}>
              <Target size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Next Week's Gentle Focus</Text>
          </View>

          <View style={styles.focusTheme}>
            <Text style={styles.focusThemeLabel}>Theme</Text>
            <Text style={styles.focusThemeValue}>{reflection.nextWeekFocus.suggestedTheme}</Text>
            <Text style={styles.focusThemeReason}>{reflection.nextWeekFocus.themeReason}</Text>
          </View>

          <View style={styles.focusDivider} />

          <View style={styles.focusItem}>
            <View style={styles.focusItemIcon}>
              <Lightbulb size={16} color={Colors.accent} />
            </View>
            <View style={styles.focusItemContent}>
              <Text style={styles.focusItemTitle}>{reflection.nextWeekFocus.skillToPractice}</Text>
              <Text style={styles.focusItemDesc}>{reflection.nextWeekFocus.skillDescription}</Text>
            </View>
          </View>

          <View style={styles.focusItem}>
            <View style={styles.focusItemIcon}>
              <ArrowRight size={16} color={Colors.primary} />
            </View>
            <View style={styles.focusItemContent}>
              <Text style={styles.focusItemTitle}>{reflection.nextWeekFocus.behavioralShift}</Text>
              <Text style={styles.focusItemDesc}>{reflection.nextWeekFocus.shiftDescription}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Closing */}
        <Animated.View style={[styles.closingCard, { opacity: slideOpacities[5], transform: [{ translateY: slideAnims[5] }] }]}>
          <Text style={styles.closingText}>{reflection.closingMessage}</Text>
        </Animated.View>

        {/* Feedback */}
        <Animated.View style={[styles.feedbackSection, { opacity: slideOpacities[6], transform: [{ translateY: slideAnims[6] }] }]}>
          <Text style={styles.feedbackTitle}>How does this feel?</Text>
          <View style={styles.feedbackRow}>
            <TouchableOpacity
              style={[
                styles.feedbackButton,
                selectedFeedback === 'accurate' && styles.feedbackButtonActive,
              ]}
              onPress={() => handleFeedback('accurate')}
              activeOpacity={0.7}
              testID="feedback-accurate"
            >
              <CheckCircle
                size={18}
                color={selectedFeedback === 'accurate' ? Colors.white : Colors.primary}
              />
              <Text style={[
                styles.feedbackButtonText,
                selectedFeedback === 'accurate' && styles.feedbackButtonTextActive,
              ]}>
                Feels accurate
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.feedbackButton,
                selectedFeedback === 'saved' && styles.feedbackButtonActive,
              ]}
              onPress={() => handleFeedback('saved')}
              activeOpacity={0.7}
              testID="feedback-save"
            >
              <Bookmark
                size={18}
                color={selectedFeedback === 'saved' ? Colors.white : Colors.accent}
              />
              <Text style={[
                styles.feedbackButtonText,
                selectedFeedback === 'saved' && styles.feedbackButtonTextActive,
              ]}>
                Save this
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.feedbackButton,
                selectedFeedback === 'discuss' && styles.feedbackButtonActive,
              ]}
              onPress={() => handleFeedback('discuss')}
              activeOpacity={0.7}
              testID="feedback-discuss"
            >
              <Sparkles
                size={18}
                color={selectedFeedback === 'discuss' ? Colors.white : '#8B5CF6'}
              />
              <Text style={[
                styles.feedbackButtonText,
                selectedFeedback === 'discuss' && styles.feedbackButtonTextActive,
              ]}>
                Discuss with AI
              </Text>
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
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerSection: {
    marginBottom: 24,
    paddingTop: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  openingNarrative: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  growthCard: {
    borderWidth: 1,
    borderColor: '#FFF3D6',
  },
  focusCard: {
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  narrativeText: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  emotionEmoji: {
    fontSize: 20,
  },
  emotionInfo: {
    gap: 1,
  },
  emotionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emotionTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emotionCount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  triggersSection: {
    marginBottom: 16,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  triggersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warmGlow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  triggerText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  triggerCount: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  intensityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  intensityLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  intensityValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  intensityText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  peakDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
  },
  peakDayLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  peakDayValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  themesList: {
    marginBottom: 16,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  themeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  themeText: {
    fontSize: 14,
    color: Colors.text,
  },
  improvementsList: {
    gap: 8,
    marginBottom: 16,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  improvementText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  pauseGrowthCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pauseGrowthLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  pauseGrowthValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pauseGrowthThis: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  pauseGrowthVs: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  pauseGrowthLast: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  toolsList: {
    gap: 10,
    marginBottom: 16,
  },
  toolCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
  },
  toolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  toolName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  toolBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  toolBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  toolNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  practicesList: {
    marginTop: 4,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  practiceCheck: {},
  practiceText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  improvementsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  growthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFDF5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFF3D6',
  },
  growthIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  growthItemContent: {
    flex: 1,
  },
  growthItemTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  growthItemDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  gainsList: {
    marginBottom: 12,
  },
  gainText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    paddingLeft: 4,
  },
  focusTheme: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  focusThemeLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  focusThemeValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  focusThemeReason: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  focusDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: 16,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  focusItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  focusItemContent: {
    flex: 1,
  },
  focusItemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  focusItemDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  closingCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  closingText: {
    fontSize: 16,
    lineHeight: 25,
    color: Colors.accent,
    fontWeight: '500' as const,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  feedbackSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  feedbackButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  feedbackButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  feedbackButtonTextActive: {
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
