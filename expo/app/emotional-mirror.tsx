import React, { useRef, useEffect, useCallback, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Sparkles,
  Heart,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Eye,
  Clock,
  ChevronRight,
  RefreshCw,
  BookOpen,
  Activity,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useEmotionalMirror } from '@/hooks/useEmotionalMirror';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  EmotionalMirrorInsight,
  DetectedPattern,
  GrowthSignalMirror,
  RelationshipMirrorPattern,
  EmotionalMirrorReport,
} from '@/types/emotionalMirror';

function FadeInView({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
}

function LandscapeCard({ report }: { report: EmotionalMirrorReport }) {
  const { landscape } = report;

  const trendColor = landscape.distressTrend === 'improving' ? Colors.success
    : landscape.distressTrend === 'elevated' ? Colors.accent
    : landscape.distressTrend === 'stable' ? Colors.primary
    : Colors.textMuted;

  const trendLabel = landscape.distressTrend === 'improving' ? 'Easing'
    : landscape.distressTrend === 'elevated' ? 'Elevated'
    : landscape.distressTrend === 'stable' ? 'Steady'
    : 'Building';

  const trendBg = landscape.distressTrend === 'improving' ? Colors.successLight
    : landscape.distressTrend === 'elevated' ? Colors.accentLight
    : landscape.distressTrend === 'stable' ? Colors.primaryLight
    : Colors.surface;

  return (
    <View style={styles.landscapeCard}>
      <View style={styles.landscapeHeader}>
        <View style={styles.landscapeIconWrap}>
          <Activity size={18} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.landscapeTitle}>This Week</Text>
          <Text style={styles.landscapeSubtitle}>{report.weekLabel}</Text>
        </View>
        <View style={[styles.trendPill, { backgroundColor: trendBg }]}>
          <Text style={[styles.trendPillText, { color: trendColor }]}>{trendLabel}</Text>
        </View>
      </View>

      <View style={styles.landscapeStats}>
        <View style={styles.landscapeStat}>
          <Text style={styles.landscapeStatValue}>{landscape.totalCheckIns}</Text>
          <Text style={styles.landscapeStatLabel}>Check-ins</Text>
        </View>
        <View style={styles.landscapeStatDivider} />
        <View style={styles.landscapeStat}>
          <Text style={styles.landscapeStatValue}>
            {landscape.averageDistress > 0 ? landscape.averageDistress : '\u2014'}
          </Text>
          <Text style={styles.landscapeStatLabel}>Avg Distress</Text>
        </View>
        <View style={styles.landscapeStatDivider} />
        <View style={styles.landscapeStat}>
          <Text style={styles.landscapeStatValue}>
            {landscape.dominantEmotions[0]?.emoji ?? '\u2014'}
          </Text>
          <Text style={styles.landscapeStatLabel}>
            {landscape.dominantEmotions[0]?.label ?? 'No data'}
          </Text>
        </View>
      </View>

      {landscape.dominantEmotions.length > 1 && (
        <View style={styles.emotionRow}>
          {landscape.dominantEmotions.map((em) => (
            <View key={em.label} style={styles.emotionChip}>
              <Text style={styles.emotionChipEmoji}>{em.emoji}</Text>
              <Text style={styles.emotionChipLabel}>{em.label}</Text>
              <Text style={styles.emotionChipPercent}>{em.percentage}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function InsightRow({ insight }: { insight: EmotionalMirrorInsight }) {
  const iconColor = insight.category === 'growth' ? Colors.success
    : insight.category === 'trigger' ? Colors.accent
    : insight.category === 'distress' ? '#E17055'
    : insight.category === 'relationship' ? '#8B5CF6'
    : Colors.primary;

  const iconBg = insight.category === 'growth' ? Colors.successLight
    : insight.category === 'trigger' ? Colors.accentLight
    : insight.category === 'distress' ? '#FDE8E3'
    : insight.category === 'relationship' ? '#EDE7F6'
    : Colors.primaryLight;

  const IconComponent = insight.category === 'growth' ? TrendingUp
    : insight.category === 'trigger' ? Zap
    : insight.category === 'distress' ? Heart
    : insight.category === 'relationship' ? Users
    : Eye;

  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <View style={[styles.insightIconWrap, { backgroundColor: iconBg }]}>
          <IconComponent size={14} color={iconColor} />
        </View>
        <Text style={styles.insightTitle}>{insight.title}</Text>
      </View>
      <Text style={styles.insightDescription}>{insight.description}</Text>
      <View style={styles.insightEvidence}>
        <Text style={styles.insightEvidenceText}>{insight.evidence}</Text>
      </View>
      <Text style={styles.insightSupportive}>{insight.supportiveNote}</Text>
      {insight.recommendedAction && (
        <View style={styles.insightAction}>
          <Sparkles size={12} color={Colors.primary} />
          <Text style={styles.insightActionText}>{insight.recommendedAction}</Text>
        </View>
      )}
    </View>
  );
}

function PatternRow({ pattern }: { pattern: DetectedPattern }) {
  const confidenceLabel = pattern.confidence >= 0.8 ? 'Strong' : pattern.confidence >= 0.5 ? 'Emerging' : 'Early';
  const confidenceColor = pattern.confidence >= 0.8 ? Colors.accent : pattern.confidence >= 0.5 ? Colors.primary : Colors.textMuted;

  return (
    <View style={styles.patternCard}>
      <View style={styles.patternHeader}>
        <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '18' }]}>
          <Text style={[styles.confidenceBadgeText, { color: confidenceColor }]}>{confidenceLabel}</Text>
        </View>
        <Text style={styles.patternOccurrences}>{pattern.occurrences}x</Text>
      </View>
      <Text style={styles.patternDescription}>{pattern.description}</Text>
      <Text style={styles.patternExplanation}>{pattern.supportiveExplanation}</Text>
      <View style={styles.patternRecommendation}>
        <Sparkles size={12} color={Colors.primary} />
        <Text style={styles.patternRecommendationText}>{pattern.recommendedInsight}</Text>
      </View>
    </View>
  );
}

function GrowthRow({ signal }: { signal: GrowthSignalMirror }) {
  return (
    <View style={styles.growthRow}>
      <View style={styles.growthDot} />
      <View style={styles.growthContent}>
        <Text style={styles.growthLabel}>{signal.label}</Text>
        <Text style={styles.growthDescription}>{signal.description}</Text>
      </View>
    </View>
  );
}

function RelationshipRow({ pattern }: { pattern: RelationshipMirrorPattern }) {
  return (
    <View style={styles.relRow}>
      <Text style={styles.relDescription}>{pattern.description}</Text>
      {pattern.relatedEmotions.length > 0 && (
        <Text style={styles.relEmotions}>
          Often brings {pattern.relatedEmotions.join(', ').toLowerCase()}
        </Text>
      )}
      <Text style={styles.relSupportive}>{pattern.supportiveNote}</Text>
    </View>
  );
}

function CopingSection({ report }: { report: EmotionalMirrorReport }) {
  const { copingSummary } = report;
  if (copingSummary.toolsUsed.length === 0) return null;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: Colors.successLight }]}>
          <Shield size={16} color={Colors.success} />
        </View>
        <Text style={styles.sectionTitle}>What Helped</Text>
      </View>
      {copingSummary.mostEffective && (
        <View style={styles.mostEffectiveBanner}>
          <Text style={styles.mostEffectiveLabel}>Most effective tool</Text>
          <Text style={styles.mostEffectiveName}>{copingSummary.mostEffective}</Text>
        </View>
      )}
      {copingSummary.toolsUsed.slice(0, 4).map((tool) => (
        <View key={tool.name} style={styles.copingRow}>
          <Text style={styles.copingName} numberOfLines={1}>{tool.name}</Text>
          <Text style={styles.copingMeta}>Used {tool.count}x</Text>
          <View style={[
            styles.copingBadge,
            { backgroundColor: tool.avgReduction > 0 ? Colors.successLight : Colors.surface },
          ]}>
            <Text style={[
              styles.copingBadgeText,
              { color: tool.avgReduction > 0 ? Colors.success : Colors.textMuted },
            ]}>
              {tool.avgReduction > 0 ? `-${tool.avgReduction}` : '0'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function HistorySection({ history, onSelect }: { history: EmotionalMirrorReport[]; onSelect: (report: EmotionalMirrorReport) => void }) {
  if (history.length === 0) return null;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: Colors.surface }]}>
          <Clock size={16} color={Colors.textSecondary} />
        </View>
        <Text style={styles.sectionTitle}>Past Reports</Text>
      </View>
      {history.slice(0, 4).map((report) => (
        <TouchableOpacity
          key={report.id}
          style={styles.historyRow}
          onPress={() => onSelect(report)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.historyWeek}>{report.weekLabel}</Text>
            <Text style={styles.historyMeta}>
              {report.landscape.totalCheckIns} check-ins \u00B7 Avg {report.landscape.averageDistress}/10
            </Text>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function EmptyState({ onCheckIn }: { onCheckIn: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Eye size={40} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Your mirror is forming</Text>
      <Text style={styles.emptySubtitle}>
        Complete a few check-ins this week and your Emotional Mirror will reflect patterns, triggers, and growth signals back to you.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onCheckIn} activeOpacity={0.8}>
        <Text style={styles.emptyButtonText}>Start a Check-in</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function EmotionalMirrorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const { currentReport, history, saveCurrentReport, isSaving } = useEmotionalMirror();
  const [viewingReport, setViewingReport] = useState<EmotionalMirrorReport | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const report = viewingReport ?? currentReport;
  const hasData = report.landscape.totalCheckIns >= 2;

  useEffect(() => {
    trackEvent('emotional_mirror_viewed');
  }, [trackEvent]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleBack = useCallback(() => {
    if (viewingReport) {
      setViewingReport(null);
      return;
    }
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router, viewingReport]);

  const handleSave = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    saveCurrentReport();
    trackEvent('emotional_mirror_generated');
  }, [saveCurrentReport, trackEvent]);

  const handleSelectHistory = useCallback((r: EmotionalMirrorReport) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setViewingReport(r);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBg}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
            testID="emotional-mirror-back"
          >
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Eye size={20} color={Colors.primary} />
            </Animated.View>
            <Text style={styles.headerTitle}>Emotional Mirror</Text>
          </View>
          {hasData && !viewingReport ? (
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
              activeOpacity={0.7}
              disabled={isSaving}
              testID="emotional-mirror-save"
            >
              <RefreshCw size={18} color={isSaving ? Colors.textMuted : Colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {viewingReport && (
          <View style={styles.viewingBanner}>
            <BookOpen size={14} color={Colors.textSecondary} />
            <Text style={styles.viewingBannerText}>Viewing: {viewingReport.weekLabel}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasData ? (
          <EmptyState onCheckIn={() => router.push('/check-in')} />
        ) : (
          <>
            <FadeInView delay={0}>
              <LandscapeCard report={report} />
            </FadeInView>

            {report.insights.length > 0 && (
              <FadeInView delay={100}>
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: '#FFF3E8' }]}>
                      <Sparkles size={16} color={Colors.accent} />
                    </View>
                    <Text style={styles.sectionTitle}>Insights</Text>
                  </View>
                  {report.insights.map((insight) => (
                    <InsightRow key={insight.id} insight={insight} />
                  ))}
                </View>
              </FadeInView>
            )}

            {report.patterns.length > 0 && (
              <FadeInView delay={200}>
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: Colors.primaryLight }]}>
                      <Eye size={16} color={Colors.primary} />
                    </View>
                    <Text style={styles.sectionTitle}>Patterns Detected</Text>
                  </View>
                  {report.patterns.map((pattern) => (
                    <PatternRow key={pattern.id} pattern={pattern} />
                  ))}
                </View>
              </FadeInView>
            )}

            {report.relationshipPatterns.length > 0 && (
              <FadeInView delay={300}>
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: '#EDE7F6' }]}>
                      <Users size={16} color="#8B5CF6" />
                    </View>
                    <Text style={styles.sectionTitle}>Relationship Patterns</Text>
                  </View>
                  {report.relationshipPatterns.map((pattern) => (
                    <RelationshipRow key={pattern.id} pattern={pattern} />
                  ))}
                </View>
              </FadeInView>
            )}

            <FadeInView delay={400}>
              <CopingSection report={report} />
            </FadeInView>

            {report.growthSignals.length > 0 && (
              <FadeInView delay={500}>
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: Colors.successLight }]}>
                      <TrendingUp size={16} color={Colors.success} />
                    </View>
                    <Text style={styles.sectionTitle}>Growth Signals</Text>
                  </View>
                  {report.growthSignals.map((signal) => (
                    <GrowthRow key={signal.id} signal={signal} />
                  ))}
                </View>
              </FadeInView>
            )}

            {!viewingReport && (
              <FadeInView delay={600}>
                <HistorySection
                  history={history}
                  onSelect={handleSelectHistory}
                />
              </FadeInView>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Every check-in sharpens this reflection.{'\n'}You are building deep self-understanding.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deeperButton}
              onPress={() => router.push('/emotional-insights')}
              activeOpacity={0.7}
            >
              <Activity size={18} color={Colors.white} />
              <Text style={styles.deeperButtonText}>Full Emotional Insights</Text>
              <ChevronRight size={16} color={Colors.white} style={{ opacity: 0.7 }} />
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBg: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerSpacer: {
    width: 40,
  },
  viewingBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 8,
    backgroundColor: Colors.warmGlow,
  },
  viewingBannerText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  landscapeCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  landscapeHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
  },
  landscapeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  landscapeTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  landscapeSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  trendPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trendPillText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  landscapeStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  landscapeStat: {
    flex: 1,
    alignItems: 'center' as const,
  },
  landscapeStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  landscapeStatLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  landscapeStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  emotionRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  emotionChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  emotionChipEmoji: {
    fontSize: 14,
  },
  emotionChipLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  emotionChipPercent: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  insightCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  insightHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  insightIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 8,
  },
  insightEvidence: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start' as const,
    marginBottom: 8,
  },
  insightEvidenceText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  insightSupportive: {
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 20,
    fontStyle: 'italic' as const,
    marginBottom: 8,
  },
  insightAction: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 10,
  },
  insightActionText: {
    fontSize: 13,
    color: Colors.primaryDark,
    lineHeight: 19,
    flex: 1,
  },
  patternCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  patternHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confidenceBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  patternOccurrences: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  patternDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 6,
  },
  patternExplanation: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
    fontStyle: 'italic' as const,
  },
  patternRecommendation: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 10,
  },
  patternRecommendationText: {
    fontSize: 13,
    color: Colors.primaryDark,
    lineHeight: 19,
    flex: 1,
  },
  growthRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 14,
  },
  growthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginTop: 5,
  },
  growthContent: {
    flex: 1,
  },
  growthLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  growthDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  relRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  relDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 4,
  },
  relEmotions: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
    marginBottom: 6,
  },
  relSupportive: {
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
  mostEffectiveBanner: {
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center' as const,
  },
  mostEffectiveLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.success,
    marginBottom: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  mostEffectiveName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  copingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  copingName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  copingMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 10,
  },
  copingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center' as const,
  },
  copingBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  historyRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  historyWeek: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  footer: {
    marginTop: 10,
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
  deeperButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  deeperButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
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
});
