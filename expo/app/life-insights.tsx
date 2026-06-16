import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  Heart,
  Zap,
  Clock,
  Shield,
  RefreshCw,
  ChevronRight,
  Lightbulb,
  Leaf,
  MessageCircle,
  AlertTriangle,
  Repeat,
  Calendar,
  Link2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLifeInsights } from '@/hooks/useLifeInsights';
import { LifeInsight, WeeklySummary } from '@/types/lifeInsight';

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  trigger: { icon: <Zap size={16} color="#67E8F9" />, color: '#67E8F9', bgColor: '#0B1238' },
  relationship: { icon: <Heart size={16} color="#3B82F6" />, color: '#3B82F6', bgColor: '#FFFFFF' },
  coping: { icon: <Shield size={16} color="#14B8A6" />, color: '#14B8A6', bgColor: '#0B1238' },
  distress: { icon: <AlertTriangle size={16} color="#3B82F6" />, color: '#3B82F6', bgColor: '#FFFFFF' },
  growth: { icon: <Leaf size={16} color="#14B8A6" />, color: '#14B8A6', bgColor: '#FFFFFF' },
  communication: { icon: <MessageCircle size={16} color="#3B82F6" />, color: '#3B82F6', bgColor: '#FFFFFF' },
  time_pattern: { icon: <Clock size={16} color="#3B82F6" />, color: '#3B82F6', bgColor: '#0B1238' },
  emotional_loop: { icon: <Repeat size={16} color="#67E8F9" />, color: '#67E8F9', bgColor: '#0B1238' },
};

const SEVERITY_ACCENT: Record<string, string> = {
  gentle: '#14B8A6',
  notable: '#67E8F9',
  important: '#3B82F6',
};

function InsightCard({ insight, index, onPress }: { insight: LifeInsight; index: number; onPress: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const config = CATEGORY_CONFIG[insight.category] ?? CATEGORY_CONFIG.trigger;
  const accentColor = SEVERITY_ACCENT[insight.severity] ?? Colors.primary;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.insightCard, { borderLeftColor: accentColor }]}
        activeOpacity={0.7}
        onPress={onPress}
        testID={`insight-card-${index}`}
      >
        <View style={styles.insightHeader}>
          <View style={[styles.insightIconWrap, { backgroundColor: config.bgColor }]}>
            {config.icon}
          </View>
          <View style={styles.insightHeaderText}>
            <Text style={styles.insightTitle} numberOfLines={2}>{insight.title}</Text>
            <Text style={styles.insightCategory}>
              {insight.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </View>
        <Text style={styles.insightDescription} numberOfLines={3}>{insight.description}</Text>
        {!insight.viewed && (
          <View style={[styles.newBadge, { backgroundColor: accentColor + '18' }]}>
            <View style={[styles.newDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.newBadgeText, { color: accentColor }]}>New</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function InsightDetailModal({
  insight,
  onClose,
}: {
  insight: LifeInsight;
  onClose: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const config = CATEGORY_CONFIG[insight.category] ?? CATEGORY_CONFIG.trigger;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.detailOverlay, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.detailBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.detailSheet}>
        <View style={styles.detailHandle} />
        <View style={[styles.detailIconRow]}>
          <View style={[styles.detailIconWrap, { backgroundColor: config.bgColor }]}>
            {config.icon}
          </View>
          <Text style={styles.detailCategory}>
            {insight.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </Text>
        </View>
        <Text style={styles.detailTitle}>{insight.title}</Text>
        <Text style={styles.detailDescription}>{insight.description}</Text>

        <View style={styles.detailSection}>
          <View style={styles.detailSectionHeader}>
            <Lightbulb size={14} color={Colors.primary} />
            <Text style={styles.detailSectionTitle}>Supportive note</Text>
          </View>
          <Text style={styles.detailSectionText}>{insight.supportiveNote}</Text>
        </View>

        <View style={[styles.detailSection, styles.actionSection]}>
          <View style={styles.detailSectionHeader}>
            <Sparkles size={14} color={Colors.accent} />
            <Text style={styles.detailSectionTitle}>What might help</Text>
          </View>
          <Text style={styles.detailSectionText}>{insight.suggestedAction}</Text>
        </View>

        <TouchableOpacity style={styles.detailCloseBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.detailCloseBtnText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function WeeklySummaryCard({ summary }: { summary: WeeklySummary }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const trendIcon = summary.distressTrend === 'improving'
    ? <TrendingDown size={14} color={Colors.success} />
    : summary.distressTrend === 'elevated'
      ? <TrendingUp size={14} color={Colors.danger} />
      : <Minus size={14} color={Colors.textMuted} />;

  const trendLabel = summary.distressTrend === 'improving'
    ? 'Improving' : summary.distressTrend === 'elevated'
      ? 'Elevated' : summary.distressTrend === 'stable'
        ? 'Stable' : 'Not enough data';

  const trendColor = summary.distressTrend === 'improving'
    ? Colors.success : summary.distressTrend === 'elevated'
      ? Colors.danger : Colors.textMuted;

  return (
    <Animated.View style={[styles.weeklyCard, { opacity: fadeAnim }]}>
      <View style={styles.weeklyHeader}>
        <View style={styles.weeklyHeaderLeft}>
          <Calendar size={16} color={Colors.primary} />
          <Text style={styles.weeklyLabel}>{summary.weekLabel}</Text>
        </View>
        <View style={[styles.weeklyTrendBadge, { backgroundColor: trendColor + '15' }]}>
          {trendIcon}
          <Text style={[styles.weeklyTrendText, { color: trendColor }]}>{trendLabel}</Text>
        </View>
      </View>

      <View style={styles.weeklyStats}>
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatValue}>{summary.totalCheckIns}</Text>
          <Text style={styles.weeklyStatLabel}>Check-ins</Text>
        </View>
        <View style={styles.weeklyStatDivider} />
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatValue}>{summary.averageDistress || '—'}</Text>
          <Text style={styles.weeklyStatLabel}>Avg Distress</Text>
        </View>
        <View style={styles.weeklyStatDivider} />
        <View style={styles.weeklyStat}>
          <Text style={styles.weeklyStatValue}>{summary.insights.length}</Text>
          <Text style={styles.weeklyStatLabel}>Insights</Text>
        </View>
      </View>

      {summary.topEmotions.length > 0 && (
        <View style={styles.weeklyEmotions}>
          <Text style={styles.weeklySubLabel}>Top emotions</Text>
          <View style={styles.weeklyEmotionRow}>
            {summary.topEmotions.slice(0, 4).map(em => (
              <View key={em.label} style={styles.weeklyEmotionChip}>
                <Text style={styles.weeklyEmotionEmoji}>{em.emoji}</Text>
                <Text style={styles.weeklyEmotionLabel}>{em.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {summary.topTriggers.length > 0 && (
        <View style={styles.weeklyTriggers}>
          <Text style={styles.weeklySubLabel}>Top triggers</Text>
          {summary.topTriggers.slice(0, 3).map(t => (
            <View key={t.label} style={styles.weeklyTriggerRow}>
              <Text style={styles.weeklyTriggerLabel}>{t.label}</Text>
              <Text style={styles.weeklyTriggerCount}>{t.count}x</Text>
            </View>
          ))}
        </View>
      )}

      {summary.growthSignals.length > 0 && (
        <View style={styles.weeklyGrowth}>
          <Text style={styles.weeklySubLabel}>Growth signals</Text>
          {summary.growthSignals.map((signal, i) => (
            <View key={i} style={styles.weeklyGrowthRow}>
              <View style={styles.weeklyGrowthDot} />
              <Text style={styles.weeklyGrowthText}>{signal}</Text>
            </View>
          ))}
        </View>
      )}

      {summary.copingHighlight && (
        <View style={styles.weeklyCoping}>
          <Shield size={13} color={Colors.primary} />
          <Text style={styles.weeklyCopingText}>{summary.copingHighlight}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function LifeInsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    insights,
    pastSummaries,
    isLoading,
    generateInsights,
    generateWeeklySummary,
    markViewed,
    isGenerating,
    isGeneratingWeekly,
  } = useLifeInsights();

  const [selectedInsight, setSelectedInsight] = useState<LifeInsight | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'weekly'>('insights');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleInsightPress = useCallback((insight: LifeInsight) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!insight.viewed) {
      markViewed(insight.id);
    }
    setSelectedInsight(insight);
  }, [markViewed]);

  const handleGenerate = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    generateInsights();
  }, [generateInsights]);

  const handleGenerateWeekly = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    generateWeeklySummary();
  }, [generateWeeklySummary]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    generateInsights();
    setTimeout(() => setRefreshing(false), 1000);
  }, [generateInsights]);

  const hasInsights = insights.length > 0;
  const hasSummaries = pastSummaries.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          testID="life-insights-back"
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Life Insights</Text>
        <TouchableOpacity
          onPress={handleGenerate}
          style={styles.refreshButton}
          activeOpacity={0.7}
          testID="life-insights-refresh"
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <RefreshCw size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && styles.tabActive]}
          onPress={() => setActiveTab('insights')}
          activeOpacity={0.7}
        >
          <Sparkles size={15} color={activeTab === 'insights' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>Insights</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
          onPress={() => setActiveTab('weekly')}
          activeOpacity={0.7}
        >
          <Calendar size={15} color={activeTab === 'weekly' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>Weekly</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.correlationBanner}
        onPress={() => {
          if (Platform.OS !== 'web') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.push('/correlation-insights');
        }}
        activeOpacity={0.7}
      >
        <View style={styles.correlationBannerIcon}>
          <Link2 size={16} color="#3B82F6" />
        </View>
        <Text style={styles.correlationBannerText}>Correlation Insights</Text>
        <ChevronRight size={14} color={Colors.textMuted} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Analyzing your patterns...</Text>
          </View>
        ) : activeTab === 'insights' ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            {hasInsights ? (
              <>
                <Text style={styles.sectionIntro}>
                  Personalized insights from your recent emotional patterns
                </Text>
                {insights.map((insight, i) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    index={i}
                    onPress={() => handleInsightPress(insight)}
                  />
                ))}
                <View style={styles.footerMessage}>
                  <Text style={styles.footerText}>
                    Every check-in helps build a clearer picture.{'\n'}You are doing something meaningful.
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Sparkles size={40} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Insights are building</Text>
                <Text style={styles.emptySubtitle}>
                  Complete a few check-ins and your personalized emotional insights will start appearing here.
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/check-in')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyButtonText}>Start a Check-in</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.weeklyActions}>
              <Text style={styles.sectionIntro}>
                Weekly emotional summaries and patterns
              </Text>
              <TouchableOpacity
                style={styles.generateWeeklyBtn}
                onPress={handleGenerateWeekly}
                activeOpacity={0.8}
                disabled={isGeneratingWeekly}
              >
                {isGeneratingWeekly ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <RefreshCw size={15} color={Colors.white} />
                    <Text style={styles.generateWeeklyText}>Generate This Week</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {hasSummaries ? (
              pastSummaries.map(summary => (
                <WeeklySummaryCard key={summary.id} summary={summary} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Calendar size={40} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No weekly summaries yet</Text>
                <Text style={styles.emptySubtitle}>
                  Generate your first weekly summary to see emotional patterns over time.
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {selectedInsight && (
        <InsightDetailModal
          insight={selectedInsight}
          onClose={() => setSelectedInsight(null)}
        />
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tabBar: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionIntro: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 18,
    lineHeight: 22,
  },
  insightCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderLeftWidth: 4,
  },
  insightHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 10,
  },
  insightIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  insightHeaderText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  insightCategory: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  insightDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginLeft: 46,
  },
  newBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    alignSelf: 'flex-start' as const,
    marginLeft: 46,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  newDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  detailOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end' as const,
    zIndex: 100,
  },
  detailBackdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
  },
  detailSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '80%' as const,
  },
  detailHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center' as const,
    marginBottom: 20,
  },
  detailIconRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 12,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  detailCategory: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 10,
  },
  detailDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 23,
    marginBottom: 20,
  },
  detailSection: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  actionSection: {
    backgroundColor: Colors.warmGlow,
  },
  detailSectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  detailSectionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  detailCloseBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center' as const,
    marginTop: 8,
  },
  detailCloseBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  weeklyActions: {
    marginBottom: 8,
  },
  generateWeeklyBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  generateWeeklyText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  weeklyCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  weeklyHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  weeklyHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  weeklyLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  weeklyTrendBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  weeklyTrendText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  weeklyStats: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  weeklyStat: {
    flex: 1,
    alignItems: 'center' as const,
  },
  weeklyStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  weeklyStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  weeklyStatDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  weeklyEmotions: {
    marginBottom: 14,
  },
  weeklySubLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  weeklyEmotionRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  weeklyEmotionChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  weeklyEmotionEmoji: {
    fontSize: 14,
  },
  weeklyEmotionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  weeklyTriggers: {
    marginBottom: 14,
  },
  weeklyTriggerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
  },
  weeklyTriggerLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  weeklyTriggerCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  weeklyGrowth: {
    marginBottom: 14,
  },
  weeklyGrowthRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    paddingVertical: 4,
  },
  weeklyGrowthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginTop: 6,
  },
  weeklyGrowthText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 19,
  },
  weeklyCoping: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 12,
  },
  weeklyCopingText: {
    fontSize: 13,
    color: Colors.primaryDark,
    flex: 1,
    lineHeight: 19,
  },
  loadingState: {
    alignItems: 'center' as const,
    paddingTop: 80,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  footerMessage: {
    marginTop: 20,
    paddingVertical: 20,
    alignItems: 'center' as const,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 22,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 23,
    marginBottom: 28,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  correlationBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  correlationBannerIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#0B1238',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  correlationBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
