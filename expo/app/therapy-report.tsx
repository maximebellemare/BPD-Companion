import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  FileText,
  TrendingDown,
  TrendingUp,
  Minus,
  Heart,
  Zap,
  Shield,
  MessageCircle,
  Award,
  AlertTriangle,
  Share2,
  Calendar,
  ClipboardList,
  ArrowRight,
  ChevronRight,
  CheckCircle,
  BookOpen,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { generateTherapyReport, formatReportAsText } from '@/services/therapy/therapyReportService';
import { TherapyReport, TherapyReportPeriod, TherapyDiscussionPrompt } from '@/types/therapyReport';

const PERIOD_OPTIONS: { label: string; value: TherapyReportPeriod }[] = [
  { label: '7 Days', value: '7' },
  { label: '14 Days', value: '14' },
  { label: '30 Days', value: '30' },
];

export default function TherapyReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { journalEntries, messageDrafts } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<TherapyReportPeriod>('7');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const report = useMemo<TherapyReport>(
    () => generateTherapyReport(journalEntries, messageDrafts, parseInt(selectedPeriod, 10)),
    [journalEntries, messageDrafts, selectedPeriod],
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(
    Array.from({ length: 9 }, () => new Animated.Value(30)),
  ).current;
  const slideOpacities = useRef(
    Array.from({ length: 9 }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnims.forEach(a => a.setValue(30));
    slideOpacities.forEach(a => a.setValue(0));

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    slideAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 500,
        delay: 200 + i * 100,
        useNativeDriver: true,
      }).start();
    });

    slideOpacities.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 200 + i * 100,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, slideAnims, slideOpacities, selectedPeriod]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handlePeriodChange = useCallback((period: TherapyReportPeriod) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPeriod(period);
  }, []);

  const handleExport = useCallback(async () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsExporting(true);
    try {
      const text = formatReportAsText(report);
      await Share.share({
        message: text,
        title: `Therapy Report — ${report.periodLabel}`,
      });
      console.log('[TherapyReport] Report shared successfully');
    } catch (error) {
      console.log('[TherapyReport] Share cancelled or failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [report]);

  const getTrendIcon = useCallback((trend: 'increasing' | 'decreasing' | 'stable') => {
    if (trend === 'increasing') return <TrendingUp size={13} color="#E17055" />;
    if (trend === 'decreasing') return <TrendingDown size={13} color={Colors.success} />;
    return <Minus size={13} color={Colors.textMuted} />;
  }, []);

  const getDirectionColor = (direction: 'improving' | 'worsening' | 'stable') => {
    if (direction === 'improving') return Colors.success;
    if (direction === 'worsening') return '#E17055';
    return Colors.textMuted;
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'high') return Colors.danger;
    if (risk === 'medium') return Colors.accent;
    return Colors.textMuted;
  };

  const getEffectivenessColor = (eff: string) => {
    if (eff === 'helpful') return Colors.success;
    if (eff === 'moderate') return Colors.accent;
    return Colors.textMuted;
  };

  if (!report.hasEnoughData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topRow}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} testID="close-report">
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <ClipboardList size={40} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Not Enough Data Yet</Text>
          <Text style={styles.emptyText}>
            Complete at least 2 check-ins to generate a therapy report. Each check-in adds depth to your summary.
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

      <View style={styles.topRow}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton} testID="close-report">
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleExport}
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          activeOpacity={0.7}
          disabled={isExporting}
          testID="export-report"
        >
          <Share2 size={16} color={Colors.white} />
          <Text style={styles.exportButtonText}>{isExporting ? 'Exporting…' : 'Share'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
          <View style={styles.headerBadge}>
            <FileText size={14} color={Colors.primaryDark} />
            <Text style={styles.headerBadgeText}>Therapy Report</Text>
          </View>
          <Text style={styles.headerTitle}>Session Summary</Text>
          <Text style={styles.dateRange}>{report.dateRange}</Text>

          <View style={styles.periodSelector}>
            {PERIOD_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.periodOption,
                  selectedPeriod === opt.value && styles.periodOptionActive,
                ]}
                onPress={() => handlePeriodChange(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.periodOptionText,
                  selectedPeriod === opt.value && styles.periodOptionTextActive,
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{report.checkInCount}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{report.journalReflectionCount}</Text>
              <Text style={styles.statLabel}>Reflections</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: getDirectionColor(report.distressTrend.direction) }]}>
                {report.distressTrend.average}
              </Text>
              <Text style={styles.statLabel}>Avg Distress</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.overviewCard, { opacity: slideOpacities[0], transform: [{ translateY: slideAnims[0] }] }]}>
          <Text style={styles.overviewText}>{report.overviewNarrative}</Text>
        </Animated.View>

        <Animated.View style={[styles.sectionCard, { opacity: slideOpacities[1], transform: [{ translateY: slideAnims[1] }] }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FFF0E6' }]}>
              <Heart size={18} color="#E17055" />
            </View>
            <Text style={styles.sectionTitle}>Emotional Patterns</Text>
          </View>

          {report.emotions.length > 0 ? (
            <View style={styles.emotionsList}>
              {report.emotions.map((em, i) => (
                <View key={i} style={styles.emotionRow}>
                  <Text style={styles.emotionEmoji}>{em.emoji}</Text>
                  <View style={styles.emotionContent}>
                    <View style={styles.emotionTopRow}>
                      <Text style={styles.emotionLabel}>{em.label}</Text>
                      <View style={styles.emotionMeta}>
                        {getTrendIcon(em.trend)}
                        <Text style={styles.emotionPercent}>{em.percentage}%</Text>
                      </View>
                    </View>
                    <View style={styles.emotionBarBg}>
                      <View style={[styles.emotionBarFill, { width: `${Math.min(em.percentage, 100)}%` }]} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.placeholderText}>No emotions recorded yet.</Text>
          )}
        </Animated.View>

        <Animated.View style={[styles.sectionCard, { opacity: slideOpacities[2], transform: [{ translateY: slideAnims[2] }] }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: Colors.accentLight }]}>
              <Zap size={18} color={Colors.accent} />
            </View>
            <Text style={styles.sectionTitle}>Top Triggers</Text>
          </View>

          {report.triggers.length > 0 ? (
            <View style={styles.triggersList}>
              {report.triggers.map((t, i) => (
                <View key={i} style={styles.triggerItem}>
                  <View style={styles.triggerHeader}>
                    <Text style={styles.triggerLabel}>{t.label}</Text>
                    <View style={styles.triggerCountBadge}>
                      <Text style={styles.triggerCountText}>{t.count}x</Text>
                    </View>
                  </View>
                  {t.associatedEmotions.length > 0 && (
                    <View style={styles.triggerEmotions}>
                      <ChevronRight size={12} color={Colors.textMuted} />
                      <Text style={styles.triggerEmotionText}>
                        {t.associatedEmotions.join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.placeholderText}>No triggers recorded yet.</Text>
          )}
        </Animated.View>

        <Animated.View style={[styles.sectionCard, { opacity: slideOpacities[3], transform: [{ translateY: slideAnims[3] }] }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <Calendar size={18} color="#6366F1" />
            </View>
            <Text style={styles.sectionTitle}>Distress Trend</Text>
          </View>

          <Text style={styles.narrativeText}>{report.distressTrend.narrative}</Text>

          <View style={styles.distressStatsRow}>
            <View style={styles.distressStat}>
              <Text style={styles.distressStatLabel}>Average</Text>
              <Text style={[styles.distressStatValue, { color: getDirectionColor(report.distressTrend.direction) }]}>
                {report.distressTrend.average}/10
              </Text>
            </View>
            <View style={styles.distressStat}>
              <Text style={styles.distressStatLabel}>Peak</Text>
              <Text style={[styles.distressStatValue, { color: '#E17055' }]}>{report.distressTrend.peak}/10</Text>
            </View>
            <View style={styles.distressStat}>
              <Text style={styles.distressStatLabel}>Lowest</Text>
              <Text style={[styles.distressStatValue, { color: Colors.success }]}>{report.distressTrend.lowest}/10</Text>
            </View>
          </View>

          {report.distressTrend.dailyPoints.length > 0 && (
            <View style={styles.miniChart}>
              {report.distressTrend.dailyPoints.map((pt, i) => (
                <View key={i} style={styles.miniChartCol}>
                  <View style={styles.miniChartBarContainer}>
                    <View
                      style={[
                        styles.miniChartBar,
                        {
                          height: `${Math.max(pt.value * 10, 4)}%`,
                          backgroundColor: pt.value >= 7 ? '#E17055' : pt.value >= 4 ? Colors.accent : Colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.miniChartLabel}>{pt.day}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {report.urges.topUrges.length > 0 && (
          <Animated.View style={[styles.sectionCard, { opacity: slideOpacities[4], transform: [{ translateY: slideAnims[4] }] }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: Colors.dangerLight }]}>
                <AlertTriangle size={18} color={Colors.danger} />
              </View>
              <Text style={styles.sectionTitle}>Urges</Text>
            </View>

            <Text style={styles.narrativeText}>{report.urges.narrative}</Text>

            <View style={styles.urgesList}>
              {report.urges.topUrges.map((u, i) => (
                <View key={i} style={styles.urgeItem}>
                  <View style={[styles.urgeDot, { backgroundColor: getRiskColor(u.risk) }]} />
                  <Text style={styles.urgeLabel}>{u.label}</Text>
                  <Text style={styles.urgeCount}>{u.count}x</Text>
                  <View style={[styles.urgeRiskBadge, { backgroundColor: getRiskColor(u.risk) + '18' }]}>
                    <Text style={[styles.urgeRiskText, { color: getRiskColor(u.risk) }]}>{u.risk}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View style={[styles.sectionCard, { opacity: slideOpacities[5], transform: [{ translateY: slideAnims[5] }] }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#E8F4FD' }]}>
              <MessageCircle size={18} color="#3B82F6" />
            </View>
            <Text style={styles.sectionTitle}>Relationship Patterns</Text>
          </View>

          <Text style={styles.narrativeText}>{report.relationships.narrative}</Text>

          {report.relationships.topTriggers.length > 0 && (
            <View style={styles.relTagsRow}>
              {report.relationships.topTriggers.map((t, i) => (
                <View key={i} style={styles.relTag}>
                  <Text style={styles.relTagText}>{t}</Text>
                </View>
              ))}
            </View>
          )}

          {report.relationships.communicationPatterns.length > 0 && (
            <View style={styles.commPatternsList}>
              {report.relationships.communicationPatterns.map((p, i) => (
                <View key={i} style={styles.commPatternItem}>
                  <CheckCircle size={14} color={Colors.primary} />
                  <Text style={styles.commPatternText}>{p}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.sectionCard, { opacity: slideOpacities[6], transform: [{ translateY: slideAnims[6] }] }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: Colors.successLight }]}>
              <Shield size={18} color={Colors.success} />
            </View>
            <Text style={styles.sectionTitle}>Coping Strategies</Text>
          </View>

          <Text style={styles.narrativeText}>{report.coping.narrative}</Text>

          {report.coping.toolsUsed.length > 0 && (
            <View style={styles.copingList}>
              {report.coping.toolsUsed.map((t, i) => (
                <View key={i} style={styles.copingItem}>
                  <View style={styles.copingItemHeader}>
                    <Text style={styles.copingToolName}>{t.tool}</Text>
                    <View style={styles.copingMeta}>
                      <Text style={styles.copingCount}>{t.count}x</Text>
                      <View style={[styles.copingEffBadge, { backgroundColor: getEffectivenessColor(t.effectiveness) + '18' }]}>
                        <Text style={[styles.copingEffText, { color: getEffectivenessColor(t.effectiveness) }]}>
                          {t.effectiveness}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.sectionCard, styles.progressCard, { opacity: slideOpacities[7], transform: [{ translateY: slideAnims[7] }] }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FFF8E1' }]}>
              <Award size={18} color="#F59E0B" />
            </View>
            <Text style={styles.sectionTitle}>Progress Highlights</Text>
          </View>

          <Text style={styles.narrativeText}>{report.progress.narrative}</Text>

          {report.progress.highlights.length > 0 && (
            <View style={styles.highlightsList}>
              {report.progress.highlights.map((h, i) => (
                <View key={i} style={styles.highlightItem}>
                  <View style={styles.highlightDot} />
                  <Text style={styles.highlightText}>{h}</Text>
                </View>
              ))}
            </View>
          )}

          {report.progress.skillsGained.length > 0 && (
            <View style={styles.skillsRow}>
              {report.progress.skillsGained.map((s, i) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.therapistNoteCard, { opacity: slideOpacities[8], transform: [{ translateY: slideAnims[8] }] }]}>
          <View style={styles.therapistNoteHeader}>
            <FileText size={16} color={Colors.primaryDark} />
            <Text style={styles.therapistNoteTitle}>Note for Therapist</Text>
          </View>
          <Text style={styles.therapistNoteText}>{report.therapistNote}</Text>
        </Animated.View>

        {report.discussionPrompts.length > 0 && (
          <Animated.View style={[styles.sectionCard, styles.discussionCard, { opacity: slideOpacities[8], transform: [{ translateY: slideAnims[8] }] }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#F3E8FF' }]}>
                <MessageCircle size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.sectionTitle}>Possible Therapy Topics</Text>
            </View>

            <Text style={styles.discussionIntro}>
              These topics emerged from your data and may be worth exploring in session.
            </Text>

            <View style={styles.discussionList}>
              {report.discussionPrompts.map((prompt: TherapyDiscussionPrompt, i: number) => (
                <View key={i} style={styles.discussionItem}>
                  <View style={[styles.discussionCategoryDot, {
                    backgroundColor: prompt.category === 'emotional' ? '#E17055' :
                      prompt.category === 'relational' ? '#3B82F6' :
                      prompt.category === 'behavioral' ? Colors.accent :
                      Colors.success,
                  }]} />
                  <View style={styles.discussionContent}>
                    <Text style={styles.discussionTopic}>{prompt.topic}</Text>
                    <Text style={styles.discussionContext}>{prompt.context}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.discussionCategoryLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#E17055' }]} />
                <Text style={styles.legendText}>Emotional</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Relational</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
                <Text style={styles.legendText}>Behavioral</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.legendText}>Growth</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <TouchableOpacity
          style={styles.reflectionLink}
          onPress={() => router.push('/weekly-reflection')}
          activeOpacity={0.7}
          testID="open-weekly-reflection"
        >
          <View style={styles.reflectionLinkIcon}>
            <BookOpen size={18} color={Colors.primary} />
          </View>
          <View style={styles.reflectionLinkContent}>
            <Text style={styles.reflectionLinkTitle}>Weekly Reflection</Text>
            <Text style={styles.reflectionLinkDesc}>Read your personal narrative reflection</Text>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            This report reflects self-reported data and should be discussed with a licensed professional. It does not constitute medical advice.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.bottomExportButton}
          onPress={handleExport}
          activeOpacity={0.7}
          disabled={isExporting}
          testID="export-report-bottom"
        >
          <Share2 size={18} color={Colors.white} />
          <Text style={styles.bottomExportText}>
            {isExporting ? 'Exporting…' : 'Share Report with Therapist'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerSection: {
    marginBottom: 20,
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
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  periodOptionActive: {
    backgroundColor: Colors.card,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  periodOptionTextActive: {
    color: Colors.text,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  overviewCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  overviewText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text,
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
  progressCard: {
    borderWidth: 1,
    borderColor: '#FFF3D6',
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
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  emotionsList: {
    gap: 14,
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emotionEmoji: {
    fontSize: 22,
  },
  emotionContent: {
    flex: 1,
  },
  emotionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  emotionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emotionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emotionPercent: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  emotionBarBg: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  emotionBarFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  triggersList: {
    gap: 12,
  },
  triggerItem: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
  },
  triggerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  triggerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  triggerCountBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  triggerCountText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  triggerEmotions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  triggerEmotionText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  distressStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  distressStat: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  distressStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  distressStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 80,
  },
  miniChartCol: {
    flex: 1,
    alignItems: 'center',
    height: 80,
  },
  miniChartBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  miniChartBar: {
    width: '70%',
    borderRadius: 4,
    minHeight: 3,
  },
  miniChartLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  urgesList: {
    gap: 10,
  },
  urgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
  },
  urgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  urgeLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  urgeCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  urgeRiskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgeRiskText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  relTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  relTag: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0E8F7',
  },
  relTagText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#3B82F6',
  },
  commPatternsList: {
    gap: 10,
  },
  commPatternItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  commPatternText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  copingList: {
    gap: 10,
  },
  copingItem: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
  },
  copingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copingToolName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  copingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copingCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  copingEffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  copingEffText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  highlightsList: {
    gap: 10,
    marginBottom: 14,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 7,
  },
  highlightText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 21,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skillChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  therapistNoteCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  therapistNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  therapistNoteTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
  therapistNoteText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
  },
  disclaimerSection: {
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomExportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  bottomExportText: {
    fontSize: 16,
    fontWeight: '700' as const,
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
  discussionCard: {
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  discussionIntro: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  discussionList: {
    gap: 14,
    marginBottom: 16,
  },
  discussionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
  },
  discussionCategoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  discussionContent: {
    flex: 1,
  },
  discussionTopic: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  discussionContext: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textMuted,
  },
  discussionCategoryLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  reflectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  reflectionLinkIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reflectionLinkContent: {
    flex: 1,
  },
  reflectionLinkTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  reflectionLinkDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
