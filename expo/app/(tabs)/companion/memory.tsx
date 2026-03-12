import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Brain,
  Zap,
  Heart,
  Shield,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { generateMemoryInsights } from '@/services/memory/emotionalMemoryService';
import { MemoryInsight, PatternItem } from '@/types/memory';

const CATEGORY_CONFIG: Record<string, { color: string; bg: string }> = {
  trigger: { color: '#E17055', bg: '#FDE8E3' },
  emotion: { color: '#6B9080', bg: '#E3EDE8' },
  coping: { color: '#00B894', bg: '#E0F5EF' },
  relationship: { color: '#D4956A', bg: '#F5E6D8' },
  improvement: { color: '#6B9080', bg: '#E3EDE8' },
  pattern: { color: '#636E72', bg: '#F0ECE7' },
};

function InsightItem({ insight, index }: { insight: MemoryInsight; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const config = CATEGORY_CONFIG[insight.category] ?? CATEGORY_CONFIG.pattern;
  const sentimentBorder =
    insight.sentiment === 'positive'
      ? Colors.success
      : insight.sentiment === 'cautious'
        ? Colors.accent
        : Colors.border;

  return (
    <Animated.View
      style={[
        styles.insightCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderLeftColor: sentimentBorder,
        },
      ]}
    >
      <View style={[styles.insightIconWrap, { backgroundColor: config.bg }]}>
        <Text style={styles.insightIcon}>{insight.icon}</Text>
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDesc}>{insight.description}</Text>
        {insight.detail ? (
          <Text style={styles.insightDetail}>{insight.detail}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const MemoizedInsightItem = React.memo(InsightItem);

function PatternBar({ item, maxCount, delay }: { item: PatternItem; maxCount: number; delay: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: maxCount > 0 ? item.count / maxCount : 0,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, item.count, maxCount, delay]);

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.barValue}>{item.percentage}%</Text>
    </View>
  );
}

const MemoizedPatternBar = React.memo(PatternBar);

export default function MemoryInsightsScreen() {
  const { memoryProfile } = useAICompanion();

  const memoryInsights = useMemo(() => {
    return generateMemoryInsights(memoryProfile);
  }, [memoryProfile]);

  const maxTriggerCount = useMemo(() => {
    return memoryProfile.topTriggers.reduce((max, t) => Math.max(max, t.count), 0);
  }, [memoryProfile.topTriggers]);

  const maxEmotionCount = useMemo(() => {
    return memoryProfile.topEmotions.reduce((max, t) => Math.max(max, t.count), 0);
  }, [memoryProfile.topEmotions]);

  const maxCopingCount = useMemo(() => {
    return memoryProfile.copingToolsUsed.reduce((max, t) => Math.max(max, t.count), 0);
  }, [memoryProfile.copingToolsUsed]);

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [headerFade]);

  const handleSectionPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const trendIcon = memoryProfile.intensityTrend === 'falling'
    ? <TrendingDown size={16} color={Colors.success} />
    : memoryProfile.intensityTrend === 'rising'
      ? <TrendingUp size={16} color={Colors.danger} />
      : <Minus size={16} color={Colors.textMuted} />;

  const trendLabel = memoryProfile.intensityTrend === 'falling'
    ? 'Improving'
    : memoryProfile.intensityTrend === 'rising'
      ? 'Elevated'
      : memoryProfile.intensityTrend === 'stable'
        ? 'Stable'
        : 'Not enough data';

  const trendColor = memoryProfile.intensityTrend === 'falling'
    ? Colors.success
    : memoryProfile.intensityTrend === 'rising'
      ? Colors.danger
      : Colors.textSecondary;

  const hasData = memoryProfile.recentCheckInCount > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Memory Insights',
          headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, { opacity: headerFade }]}>
          <View style={styles.heroIconWrap}>
            <Brain size={26} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Your Emotional Memory</Text>
          <Text style={styles.heroSubtitle}>
            Patterns and insights learned from your check-ins, journal entries, and coping history.
          </Text>
        </Animated.View>

        {!hasData ? (
          <View style={styles.emptyState}>
            <Sparkles size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptyDesc}>
              Complete check-ins and journal entries to build your emotional memory profile.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{memoryProfile.recentCheckInCount}</Text>
                <Text style={styles.statLabel}>Check-ins</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{memoryProfile.averageIntensity}</Text>
                <Text style={styles.statLabel}>Avg Intensity</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.trendRow}>
                  {trendIcon}
                  <Text style={[styles.statValue, { color: trendColor, marginLeft: 4 }]}>
                    {trendLabel}
                  </Text>
                </View>
                <Text style={styles.statLabel}>Trend</Text>
              </View>
            </View>

            {memoryProfile.topTriggers.length > 0 && (
              <TouchableOpacity
                style={styles.section}
                activeOpacity={0.9}
                onPress={handleSectionPress}
                testID="memory-triggers-section"
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#FDE8E3' }]}>
                    <Zap size={16} color="#E17055" />
                  </View>
                  <Text style={styles.sectionTitle}>Top Triggers</Text>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </View>
                {memoryProfile.topTriggers.slice(0, 5).map((item, i) => (
                  <MemoizedPatternBar
                    key={item.label}
                    item={item}
                    maxCount={maxTriggerCount}
                    delay={i * 60}
                  />
                ))}
              </TouchableOpacity>
            )}

            {memoryProfile.topEmotions.length > 0 && (
              <TouchableOpacity
                style={styles.section}
                activeOpacity={0.9}
                onPress={handleSectionPress}
                testID="memory-emotions-section"
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#E3EDE8' }]}>
                    <Heart size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Top Emotions</Text>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </View>
                {memoryProfile.topEmotions.slice(0, 5).map((item, i) => (
                  <MemoizedPatternBar
                    key={item.label}
                    item={item}
                    maxCount={maxEmotionCount}
                    delay={i * 60}
                  />
                ))}
              </TouchableOpacity>
            )}

            {memoryProfile.copingToolsUsed.length > 0 && (
              <TouchableOpacity
                style={styles.section}
                activeOpacity={0.9}
                onPress={handleSectionPress}
                testID="memory-coping-section"
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#E0F5EF' }]}>
                    <Shield size={16} color={Colors.success} />
                  </View>
                  <Text style={styles.sectionTitle}>Most Helpful Coping Tools</Text>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </View>
                {memoryProfile.copingToolsUsed.slice(0, 5).map((item, i) => (
                  <MemoizedPatternBar
                    key={item.label}
                    item={item}
                    maxCount={maxCopingCount}
                    delay={i * 60}
                  />
                ))}
              </TouchableOpacity>
            )}

            {memoryProfile.relationshipPatterns.length > 0 && (
              <View style={styles.section} testID="memory-relationship-section">
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#F5E6D8' }]}>
                    <Users size={16} color={Colors.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Relationship Patterns</Text>
                </View>
                {memoryProfile.relationshipPatterns.map((rp) => (
                  <View key={rp.id} style={styles.relationshipCard}>
                    <Text style={styles.relationshipText}>{rp.pattern}</Text>
                    <View style={styles.relationshipMeta}>
                      <Text style={styles.relationshipMetaText}>
                        Observed {rp.frequency} times
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {memoryInsights.length > 0 && (
              <View style={styles.insightsSection} testID="memory-insights-list">
                <Text style={styles.insightsSectionTitle}>Personalized Insights</Text>
                <Text style={styles.insightsSectionDesc}>
                  What your companion has learned about you
                </Text>
                {memoryInsights.map((insight, i) => (
                  <MemoizedInsightItem key={insight.id} insight={insight} index={i} />
                ))}
              </View>
            )}

            {memoryProfile.recentImprovements.length > 0 && (
              <View style={styles.improvementsSection} testID="memory-improvements-section">
                <Text style={styles.improvementsTitle}>Recent Improvements</Text>
                {memoryProfile.recentImprovements.map((imp) => (
                  <View key={imp.id} style={styles.improvementCard}>
                    <View style={styles.improvementDot} />
                    <View style={styles.improvementContent}>
                      <Text style={styles.improvementArea}>{imp.area}</Text>
                      <Text style={styles.improvementDesc}>{imp.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  hero: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 30,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  trendRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  barRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  barLabel: {
    width: 100,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden' as const,
  },
  barFill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  barValue: {
    width: 36,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right' as const,
    fontWeight: '600' as const,
  },
  relationshipCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  relationshipText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  relationshipMeta: {
    marginTop: 8,
  },
  relationshipMetaText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  insightsSection: {
    marginBottom: 14,
    marginTop: 6,
  },
  insightsSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  insightsSectionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  insightCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  insightIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  insightIcon: {
    fontSize: 18,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  insightDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  improvementsSection: {
    marginBottom: 14,
  },
  improvementsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  improvementCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  improvementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginTop: 5,
    marginRight: 12,
  },
  improvementContent: {
    flex: 1,
  },
  improvementArea: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  improvementDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  bottomSpacer: {
    height: 40,
  },
});
