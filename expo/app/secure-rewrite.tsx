import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  ArrowLeft,
  Shield,
  ChevronDown,
  ChevronUp,
  Copy,
  BookOpen,
  ArrowRight,
  Check,
  Archive,
  Pause,
  Lightbulb,
  GitCompare,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  SecureRewriteInput,
  SecureRewriteResult,
  SecureComparisonPoint,
  SecureTeachingPoint,
  SecureSubtype,
  SECURE_OUTCOME_OPTIONS,
  SecureRewriteSessionOutcome,
} from '@/types/secureRewrite';
import {
  MessageInterpretation,
  MessageUrge,
  MessageDesiredOutcome,
} from '@/types/messageHealth';
import {
  generateSecureRewrites,
  generateSecureComparison,
  generateSecureTeachingPoints,
} from '@/services/messages/secureRewriteEngineService';
import { scoreSecureRewrite, scoreOriginalDraft } from '@/services/messages/secureRewriteScoringService';
import { saveSecureSession } from '@/services/messages/secureRewriteOutcomeService';
import { saveToDraftVault } from '@/services/messages/messageOutcomeService';
import { trackSecureRewrite } from '@/services/analytics/analyticsService';

type ViewMode = 'rewrites' | 'comparison' | 'teaching' | 'outcome';

export default function SecureRewriteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    draft: string;
    situation: string;
    emotionalState: string;
    interpretation: string;
    urge: string;
    desiredOutcome: string;
    distressLevel: string;
    relationshipContext: string;
  }>();

  const sessionId = useRef(`sr_${Date.now()}`).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const input: SecureRewriteInput = useMemo(() => ({
    originalDraft: params.draft ?? '',
    emotionalState: params.emotionalState || null,
    interpretation: (params.interpretation as MessageInterpretation) || null,
    urge: (params.urge as MessageUrge) || null,
    desiredOutcome: (params.desiredOutcome as MessageDesiredOutcome) || null,
    relationshipContext: params.relationshipContext || null,
    distressLevel: parseInt(params.distressLevel ?? '5', 10),
    situation: params.situation ?? '',
  }), [params]);

  const rewrites = useMemo(() => generateSecureRewrites(input), [input]);
  const originalScore = useMemo(() => scoreOriginalDraft(input.originalDraft), [input.originalDraft]);

  useEffect(() => {
    void trackSecureRewrite('generated', {
      subtype_count: rewrites.length,
      distress_level: input.distressLevel,
      emotional_state: input.emotionalState ?? 'none',
    });
  }, [rewrites.length, input.distressLevel, input.emotionalState]);

  const [selectedRewrite, setSelectedRewrite] = useState<SecureRewriteResult | null>(
    rewrites.find(r => r.isRecommended) ?? rewrites[0] ?? null
  );
  const [viewMode, setViewMode] = useState<ViewMode>('rewrites');
  const [expandedRewrite, setExpandedRewrite] = useState<SecureSubtype | null>(
    selectedRewrite?.subtype ?? null
  );
  const [comparisonViewed, setComparisonViewed] = useState<boolean>(false);
  const [teachingViewed, setTeachingViewed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [outcomeRecorded, setOutcomeRecorded] = useState<boolean>(false);

  const comparison = useMemo<SecureComparisonPoint[]>(() => {
    if (!selectedRewrite) return [];
    return generateSecureComparison(input.originalDraft, selectedRewrite.text);
  }, [input.originalDraft, selectedRewrite]);

  const teachingPoints = useMemo<SecureTeachingPoint[]>(() => {
    if (!selectedRewrite) return [];
    return generateSecureTeachingPoints(input.originalDraft, selectedRewrite.subtype);
  }, [input.originalDraft, selectedRewrite]);

  const secureScore = useMemo(() => {
    if (!selectedRewrite) return null;
    return scoreSecureRewrite(selectedRewrite.text);
  }, [selectedRewrite]);

  const handleSelectRewrite = useCallback((rewrite: SecureRewriteResult) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRewrite(rewrite);
    setExpandedRewrite(rewrite.subtype);
    void trackSecureRewrite('selected', { subtype: rewrite.subtype });
  }, []);

  const handleCopy = useCallback(async () => {
    if (!selectedRewrite) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (Platform.OS !== 'web') {
      try {
        const clipboardModule = require('expo-clipboard');
        await clipboardModule.setStringAsync(selectedRewrite.text);
      } catch {
        console.log('[SecureRewrite] Clipboard not available');
      }
    }
    setCopied(true);
    void trackSecureRewrite('sent', { subtype: selectedRewrite.subtype });
    setTimeout(() => setCopied(false), 2000);
  }, [selectedRewrite]);

  const handleSaveToVault = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveToDraftVault({
      id: `v_${Date.now()}`,
      timestamp: Date.now(),
      originalText: input.originalDraft,
      rewrittenText: selectedRewrite?.text ?? null,
      rewriteStyle: selectedRewrite?.subtype ?? null,
      situation: input.situation,
      emotionalState: input.emotionalState,
      reason: 'saved_for_later',
      reviewed: false,
      reviewNotes: null,
      notSendingHelped: null,
    });
    void trackSecureRewrite('saved', { subtype: selectedRewrite?.subtype ?? 'none' });
  }, [input, selectedRewrite]);

  const handleRecordOutcome = useCallback(async (outcome: SecureRewriteSessionOutcome) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveSecureSession({
      id: sessionId,
      timestamp: Date.now(),
      input,
      selectedSubtype: selectedRewrite?.subtype ?? null,
      selectedText: selectedRewrite?.text ?? null,
      comparisonViewed,
      teachingViewed,
      outcome,
    });
    setOutcomeRecorded(true);
    void trackSecureRewrite('helpful', {
      subtype: selectedRewrite?.subtype ?? 'none',
      outcome,
      comparison_viewed: comparisonViewed,
      teaching_viewed: teachingViewed,
    });
    console.log('[SecureRewrite] Outcome recorded:', outcome);
  }, [sessionId, input, selectedRewrite, comparisonViewed, teachingViewed]);

  const handleViewComparison = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode('comparison');
    setComparisonViewed(true);
    void trackSecureRewrite('comparison_viewed');
  }, []);

  const handleViewTeaching = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode('teaching');
    setTeachingViewed(true);
    void trackSecureRewrite('teaching_viewed');
  }, []);

  const renderRewriteCard = (rewrite: SecureRewriteResult) => {
    const isSelected = selectedRewrite?.subtype === rewrite.subtype;
    const isExpanded = expandedRewrite === rewrite.subtype;

    return (
      <TouchableOpacity
        key={rewrite.subtype}
        style={[
          styles.rewriteCard,
          { borderLeftColor: rewrite.color },
          isSelected && styles.rewriteCardSelected,
        ]}
        onPress={() => handleSelectRewrite(rewrite)}
        activeOpacity={0.7}
        testID={`secure-rw-${rewrite.subtype}`}
      >
        <View style={styles.rewriteCardHeader}>
          <View style={styles.rewriteCardTitleRow}>
            <Text style={styles.rewriteCardEmoji}>{rewrite.emoji}</Text>
            <Text style={[styles.rewriteCardLabel, { color: rewrite.color }]}>{rewrite.label}</Text>
            {rewrite.isRecommended && (
              <View style={styles.recommendedBadge}>
                <Shield size={10} color={Colors.brandSage} />
                <Text style={styles.recommendedText}>Best match</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setExpandedRewrite(isExpanded ? null : rewrite.subtype);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {isExpanded ? (
              <ChevronUp size={16} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={16} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.rewriteCardText} numberOfLines={isExpanded ? undefined : 3}>
          {rewrite.text}
        </Text>

        {isExpanded && (
          <View style={styles.rewriteCardExpanded}>
            <View style={styles.whySecureSection}>
              <View style={styles.whySecureHeader}>
                <Shield size={12} color={Colors.brandSage} />
                <Text style={styles.whySecureTitle}>Why this is secure</Text>
              </View>
              <Text style={styles.whySecureText}>{rewrite.whySecure}</Text>
            </View>

            <View style={styles.whenBestSection}>
              <Text style={styles.whenBestLabel}>Best for</Text>
              <Text style={styles.whenBestText}>{rewrite.whenBestUsed}</Text>
            </View>

            {isSelected && (
              <View style={styles.rewriteActions}>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={handleCopy}
                  activeOpacity={0.7}
                  testID="copy-secure-btn"
                >
                  {copied ? (
                    <>
                      <Check size={14} color={Colors.success} />
                      <Text style={[styles.copyBtnText, { color: Colors.success }]}>Copied</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={14} color={Colors.primary} />
                      <Text style={styles.copyBtnText}>Copy message</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderComparisonView = () => (
    <View style={styles.comparisonContainer}>
      <View style={styles.sectionHeaderRow}>
        <GitCompare size={16} color={Colors.primary} />
        <Text style={styles.sectionHeaderTitle}>Before & After</Text>
      </View>

      <View style={styles.comparisonDraftCard}>
        <Text style={styles.comparisonDraftLabel}>Your original</Text>
        <Text style={styles.comparisonDraftText}>{input.originalDraft}</Text>
        <View style={styles.comparisonScorePill}>
          <Text style={[styles.comparisonScoreText, { color: originalScore.overall <= 4 ? Colors.danger : Colors.accent }]}>
            Quality: {originalScore.overall}/10
          </Text>
        </View>
      </View>

      {selectedRewrite && (
        <View style={[styles.comparisonDraftCard, styles.comparisonSecureCard]}>
          <View style={styles.comparisonSecureLabel}>
            <Shield size={12} color={Colors.brandSage} />
            <Text style={styles.comparisonSecureLabelText}>Secure version</Text>
          </View>
          <Text style={styles.comparisonDraftText}>{selectedRewrite.text}</Text>
          {secureScore && (
            <View style={styles.comparisonScorePill}>
              <Text style={[styles.comparisonScoreText, { color: Colors.success }]}>
                Quality: {secureScore.overall}/10
              </Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.improvementsTitle}>What improved</Text>
      {comparison.map((point, i) => (
        <View key={i} style={styles.improvementRow}>
          <Text style={styles.improvementEmoji}>{point.emoji}</Text>
          <View style={styles.improvementContent}>
            <Text style={styles.improvementDimension}>{point.dimension}</Text>
            <View style={styles.improvementLevels}>
              <View style={[styles.levelPill, { backgroundColor: getLevelColor(point.originalLevel) + '18' }]}>
                <Text style={[styles.levelPillText, { color: getLevelColor(point.originalLevel) }]}>
                  {point.originalLevel}
                </Text>
              </View>
              <ArrowRight size={12} color={Colors.textMuted} />
              <View style={[styles.levelPill, { backgroundColor: getLevelColor(point.secureLevel) + '18' }]}>
                <Text style={[styles.levelPillText, { color: getLevelColor(point.secureLevel) }]}>
                  {point.secureLevel}
                </Text>
              </View>
            </View>
            <Text style={styles.improvementText}>{point.improvement}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTeachingView = () => (
    <View style={styles.teachingContainer}>
      <View style={styles.sectionHeaderRow}>
        <Lightbulb size={16} color={Colors.accent} />
        <Text style={styles.sectionHeaderTitle}>Why this matters</Text>
      </View>
      <Text style={styles.teachingIntro}>
        Understanding why certain language patterns work helps you build secure communication habits over time.
      </Text>

      {teachingPoints.map((point) => (
        <View key={point.id} style={styles.teachingCard}>
          <View style={styles.teachingCardHeader}>
            <Text style={styles.teachingCardEmoji}>{point.emoji}</Text>
            <Text style={styles.teachingCardTitle}>{point.title}</Text>
          </View>
          <Text style={styles.teachingCardText}>{point.explanation}</Text>
        </View>
      ))}
    </View>
  );

  const renderOutcomeView = () => (
    <View style={styles.outcomeContainer}>
      {outcomeRecorded ? (
        <View style={styles.outcomeRecordedCard}>
          <Check size={24} color={Colors.success} />
          <Text style={styles.outcomeRecordedTitle}>Recorded</Text>
          <Text style={styles.outcomeRecordedText}>
            Your response helps the system learn what works best for you.
          </Text>
          <TouchableOpacity
            style={styles.outcomeDoneBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.outcomeDoneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.outcomeTitle}>What happened?</Text>
          <Text style={styles.outcomeHint}>This helps improve future suggestions.</Text>
          <View style={styles.outcomeGrid}>
            {SECURE_OUTCOME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.outcomeCard, { borderLeftColor: opt.color }]}
                onPress={() => handleRecordOutcome(opt.value)}
                activeOpacity={0.7}
                testID={`outcome-${opt.value}`}
              >
                <Text style={styles.outcomeCardEmoji}>{opt.emoji}</Text>
                <Text style={styles.outcomeCardLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.outcomeSkipBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.outcomeSkipText}>Skip</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
          testID="secure-back-btn"
        >
          <ArrowLeft size={18} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Shield size={16} color={Colors.brandSage} />
          <Text style={styles.headerTitle}>Secure Rewrite</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'rewrites' && styles.tabActive]}
          onPress={() => setViewMode('rewrites')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, viewMode === 'rewrites' && styles.tabTextActive]}>Rewrites</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'comparison' && styles.tabActive]}
          onPress={handleViewComparison}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, viewMode === 'comparison' && styles.tabTextActive]}>Compare</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'teaching' && styles.tabActive]}
          onPress={handleViewTeaching}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, viewMode === 'teaching' && styles.tabTextActive]}>Learn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'outcome' && styles.tabActive]}
          onPress={() => setViewMode('outcome')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, viewMode === 'outcome' && styles.tabTextActive]}>Outcome</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {viewMode === 'rewrites' && (
            <>
              <View style={styles.introBanner}>
                <Text style={styles.introBannerText}>
                  These versions protect your dignity, reduce regret, and communicate clearly.
                </Text>
              </View>

              {rewrites.map(renderRewriteCard)}

              <View style={styles.bottomActions}>
                <TouchableOpacity
                  style={styles.bottomActionBtn}
                  onPress={handleViewComparison}
                  activeOpacity={0.7}
                  testID="compare-btn"
                >
                  <GitCompare size={14} color={Colors.primary} />
                  <Text style={styles.bottomActionText}>Compare original vs secure</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bottomActionBtn}
                  onPress={handleViewTeaching}
                  activeOpacity={0.7}
                  testID="teach-btn"
                >
                  <BookOpen size={14} color={Colors.accent} />
                  <Text style={[styles.bottomActionText, { color: Colors.accent }]}>Teach me why</Text>
                </TouchableOpacity>

                <View style={styles.utilityRow}>
                  <TouchableOpacity
                    style={styles.utilityBtn}
                    onPress={handleSaveToVault}
                    activeOpacity={0.7}
                  >
                    <Archive size={13} color={Colors.textSecondary} />
                    <Text style={styles.utilityBtnText}>Save to vault</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.utilityBtn}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/grounding-mode' as never);
                    }}
                    activeOpacity={0.7}
                  >
                    <Pause size={13} color={Colors.textSecondary} />
                    <Text style={styles.utilityBtnText}>Pause first</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {viewMode === 'comparison' && renderComparisonView()}
          {viewMode === 'teaching' && renderTeachingView()}
          {viewMode === 'outcome' && renderOutcomeView()}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function getLevelColor(level: 'low' | 'moderate' | 'high'): string {
  switch (level) {
    case 'low': return Colors.success;
    case 'moderate': return Colors.accent;
    case 'high': return Colors.danger;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 4,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.brandNavy,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  introBanner: {
    backgroundColor: Colors.brandSage + '12',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brandSage,
  },
  introBannerText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  rewriteCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  rewriteCardSelected: {
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  rewriteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rewriteCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rewriteCardEmoji: {
    fontSize: 16,
  },
  rewriteCardLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brandSage + '15',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.brandSage,
  },
  rewriteCardText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 23,
  },
  rewriteCardExpanded: {
    marginTop: 14,
    gap: 12,
  },
  whySecureSection: {
    backgroundColor: Colors.brandSage + '08',
    borderRadius: 12,
    padding: 14,
  },
  whySecureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  whySecureTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.brandSage,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  whySecureText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  whenBestSection: {
    gap: 4,
  },
  whenBestLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  whenBestText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  rewriteActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  bottomActions: {
    marginTop: 12,
    gap: 10,
  },
  bottomActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  bottomActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  utilityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  utilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
  },
  utilityBtnText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  comparisonContainer: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  comparisonDraftCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger + '60',
  },
  comparisonSecureCard: {
    borderLeftColor: Colors.brandSage,
  },
  comparisonDraftLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  comparisonSecureLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  comparisonSecureLabelText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.brandSage,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  comparisonDraftText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  comparisonScorePill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  comparisonScoreText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  improvementsTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 4,
  },
  improvementRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  improvementEmoji: {
    fontSize: 18,
    marginTop: 2,
  },
  improvementContent: {
    flex: 1,
    gap: 6,
  },
  improvementDimension: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  improvementLevels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelPill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  improvementText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  teachingContainer: {
    gap: 14,
  },
  teachingIntro: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 4,
  },
  teachingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  teachingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  teachingCardEmoji: {
    fontSize: 20,
  },
  teachingCardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  teachingCardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  outcomeContainer: {
    gap: 12,
  },
  outcomeTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  outcomeHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  outcomeGrid: {
    gap: 8,
  },
  outcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
  },
  outcomeCardEmoji: {
    fontSize: 20,
  },
  outcomeCardLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  outcomeSkipBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  outcomeSkipText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  outcomeRecordedCard: {
    backgroundColor: Colors.successLight,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
  },
  outcomeRecordedTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  outcomeRecordedText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  outcomeDoneBtn: {
    backgroundColor: Colors.success,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  outcomeDoneBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
