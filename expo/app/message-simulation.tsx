import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Clipboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
  Copy,
  Check,
  Shield,
  Leaf,
  Pause,
  BookOpen,
  Archive,
  Compass,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { simulateResponsePaths } from '@/services/messages/messageSimulationService';
import { saveSimulationOutcome } from '@/services/messages/messageSimulationOutcomeService';
import { saveToDraftVault } from '@/services/messages/messageOutcomeService';
import { trackMessageSimulation } from '@/services/analytics/analyticsService';
import {
  ResponsePath,
  ResponsePathSimulation,
  SimulationContext,
  SimulationResult,
  RiskTier,
  SIMULATION_OUTCOME_OPTIONS,
  SimulationOutcomeResult,
} from '@/types/messageSimulation';

const TIER_COLORS: Record<RiskTier, string> = {
  low: Colors.success,
  moderate: Colors.accent,
  high: Colors.danger,
};

const TIER_LABELS: Record<string, Record<RiskTier, string>> = {
  regretRisk: { low: 'Low regret', moderate: 'Some regret', high: 'High regret' },
  dignityProtection: { low: 'Low dignity', moderate: 'Some dignity', high: 'High dignity' },
  escalationRisk: { low: 'Low escalation', moderate: 'May escalate', high: 'Likely escalation' },
  selfRespect: { low: 'Low self-respect', moderate: 'Moderate', high: 'Self-respecting' },
  clarityLevel: { low: 'Low clarity', moderate: 'Some clarity', high: 'High clarity' },
};

function ImpactPill({ dimension, tier }: { dimension: string; tier: RiskTier }) {
  const isInverted = dimension === 'dignityProtection' || dimension === 'selfRespect' || dimension === 'clarityLevel';
  const color = isInverted
    ? (tier === 'high' ? Colors.success : tier === 'low' ? Colors.danger : Colors.accent)
    : TIER_COLORS[tier];
  const label = TIER_LABELS[dimension]?.[tier] ?? `${tier}`;

  return (
    <View style={[styles.impactPill, { backgroundColor: color + '12' }]}>
      <View style={[styles.impactDot, { backgroundColor: color }]} />
      <Text style={[styles.impactPillText, { color }]}>{label}</Text>
    </View>
  );
}

function EffectRow({ emoji, label, text }: { emoji: string; label: string; text: string }) {
  return (
    <View style={styles.effectRow}>
      <View style={styles.effectIconWrap}>
        <Text style={styles.effectIcon}>{emoji}</Text>
      </View>
      <View style={styles.effectContent}>
        <Text style={styles.effectLabel}>{label}</Text>
        <Text style={styles.effectText}>{text}</Text>
      </View>
    </View>
  );
}

function DoNotSendActions({
  onSaveDraft,
  onPause,
  onJournal,
  onGround,
  onSecureRewrite,
}: {
  onSaveDraft: () => void;
  onPause: () => void;
  onJournal: () => void;
  onGround: () => void;
  onSecureRewrite: () => void;
}) {
  return (
    <View style={styles.dnsActionsContainer}>
      <Text style={styles.dnsActionsTitle}>What you can do instead</Text>
      <View style={styles.dnsActionsGrid}>
        <TouchableOpacity style={styles.dnsActionBtn} onPress={onSaveDraft} activeOpacity={0.7}>
          <Archive size={16} color={Colors.brandLilac} />
          <Text style={styles.dnsActionLabel}>Save draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dnsActionBtn} onPress={onPause} activeOpacity={0.7}>
          <Pause size={16} color={Colors.accent} />
          <Text style={styles.dnsActionLabel}>Pause 10 min</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dnsActionBtn} onPress={onSecureRewrite} activeOpacity={0.7}>
          <Leaf size={16} color={Colors.brandSage} />
          <Text style={styles.dnsActionLabel}>Secure rewrite</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dnsActionBtn} onPress={onJournal} activeOpacity={0.7}>
          <BookOpen size={16} color={Colors.brandMist} />
          <Text style={styles.dnsActionLabel}>Journal first</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dnsActionBtn} onPress={onGround} activeOpacity={0.7}>
          <Shield size={16} color={Colors.brandTeal} />
          <Text style={styles.dnsActionLabel}>Ground yourself</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function OutcomeTracker({
  onSelectOutcome,
  selectedOutcome,
}: {
  onSelectOutcome: (outcome: SimulationOutcomeResult) => void;
  selectedOutcome: SimulationOutcomeResult | null;
}) {
  return (
    <View style={styles.outcomeSection}>
      <Text style={styles.outcomeSectionTitle}>How did it go?</Text>
      <Text style={styles.outcomeSectionHint}>Your feedback helps improve future recommendations.</Text>
      <View style={styles.outcomeGrid}>
        {SIMULATION_OUTCOME_OPTIONS.map((opt) => {
          const isSelected = selectedOutcome === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.outcomeChip,
                isSelected && { backgroundColor: opt.color + '15', borderColor: opt.color },
              ]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectOutcome(opt.value);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.outcomeEmoji}>{opt.emoji}</Text>
              <Text style={[styles.outcomeLabel, isSelected && { color: opt.color, fontWeight: '600' as const }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function MessageSimulationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    draft: string;
    situation: string;
    emotionalState: string;
    interpretation: string;
    urge: string;
    desiredOutcome: string;
    riskLevel: string;
  }>();

  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [selectedPathType, setSelectedPathType] = useState<ResponsePath | null>(null);
  const [showOutcome, setShowOutcome] = useState<boolean>(false);
  const [selectedOutcome, setSelectedOutcome] = useState<SimulationOutcomeResult | null>(null);
  const [outcomeSaved, setOutcomeSaved] = useState<boolean>(false);

  const scrollRef = useRef<ScrollView>(null);

  const context: SimulationContext = useMemo(() => ({
    draft: params.draft ?? '',
    situation: params.situation ?? '',
    emotionalState: params.emotionalState || null,
    interpretation: params.interpretation || null,
    urge: params.urge || null,
    desiredOutcome: params.desiredOutcome || null,
    riskLevel: params.riskLevel || null,
  }), [params]);

  const simulation: SimulationResult | null = useMemo(() => {
    if (!context.draft) return null;
    return simulateResponsePaths(context.draft, context);
  }, [context]);

  useEffect(() => {
    if (simulation) {
      void trackMessageSimulation('started', {
        path_count: simulation.paths.length,
        risk_level: context.riskLevel ?? 'unknown',
        has_recommended: simulation.paths.some(p => p.isRecommended),
      });
      console.log('[Analytics] message_simulation_started');
    }
  }, [simulation, context.riskLevel]);

  const handleCopy = useCallback((path: ResponsePathSimulation) => {
    if (path.path === 'do_not_send') return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (Platform.OS !== 'web') {
      Clipboard.setString(path.exampleMessage);
    }
    setCopiedPath(path.path);
    setTimeout(() => setCopiedPath(null), 2000);
  }, []);

  const handleSelectPath = useCallback((path: ResponsePath) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPathType(path);
    setShowOutcome(true);
    void trackMessageSimulation('path_selected', {
      path_type: path,
      risk_level: context.riskLevel ?? 'unknown',
    });
    console.log('[MessageSimulation] Path selected:', path);
  }, [context.riskLevel]);

  const handleSaveOutcome = useCallback(async (outcome: SimulationOutcomeResult) => {
    setSelectedOutcome(outcome);
    if (!simulation || !selectedPathType) return;

    await saveSimulationOutcome({
      id: `simo_${Date.now()}`,
      simulationId: simulation.id,
      timestamp: Date.now(),
      selectedPath: selectedPathType,
      outcome,
      didSend: outcome === 'sent_helped' || outcome === 'sent_neutral' || outcome === 'sent_regretted',
      didRegret: outcome === 'sent_regretted',
      conflictEscalated: false,
      waitingHelped: outcome === 'paused_first' || outcome === 'not_sent_relieved',
      emotionalState: context.emotionalState,
      desiredOutcome: context.desiredOutcome,
      draftRiskLevel: context.riskLevel,
    });

    setOutcomeSaved(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void trackMessageSimulation('outcome_logged', {
      path_type: selectedPathType,
      outcome,
      risk_level: context.riskLevel ?? 'unknown',
    });
    console.log('[MessageSimulation] Outcome saved:', outcome);
  }, [simulation, selectedPathType, context]);

  const handleSaveDraft = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveToDraftVault({
      id: `v_${Date.now()}`,
      timestamp: Date.now(),
      originalText: context.draft,
      rewrittenText: null,
      rewriteStyle: null,
      situation: context.situation,
      emotionalState: context.emotionalState,
      reason: 'chose_not_to_send',
      reviewed: false,
      reviewNotes: null,
      notSendingHelped: null,
    });
    handleSelectPath('do_not_send');
  }, [context, handleSelectPath]);

  const navigateToSecureRewrite = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/secure-rewrite',
      params: {
        draft: context.draft,
        situation: context.situation,
        emotionalState: context.emotionalState ?? '',
        interpretation: context.interpretation ?? '',
        urge: context.urge ?? '',
        desiredOutcome: context.desiredOutcome ?? '',
        distressLevel: '5',
        relationshipContext: '',
      },
    } as never);
  }, [context, router]);

  const navigateToJournal = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/journal-write' as never);
  }, [router]);

  const navigateToGrounding = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/grounding-mode' as never);
  }, [router]);

  const handlePathAction = useCallback((path: ResponsePathSimulation) => {
    if (path.path === 'do_not_send') {
      void handleSaveDraft();
      return;
    }
    if (path.path === 'secure') {
      navigateToSecureRewrite();
      return;
    }
    handleCopy(path);
    handleSelectPath(path.path);
  }, [handleSaveDraft, navigateToSecureRewrite, handleCopy, handleSelectPath]);

  if (!simulation) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Response Paths</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No message to analyze.</Text>
        </View>
      </View>
    );
  }

  const recommendedPath = simulation.paths.find(p => p.isRecommended);

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
          testID="sim-back-btn"
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Response Paths</Text>
          <Text style={styles.headerSub}>Compare approaches before you decide</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {recommendedPath && (
          <View style={styles.recommendationBanner}>
            <View style={styles.recBannerHeader}>
              <View style={[styles.recBannerIcon, { backgroundColor: recommendedPath.color + '20' }]}>
                <Compass size={18} color={recommendedPath.color} />
              </View>
              <View style={styles.recBannerTextWrap}>
                <Text style={styles.recBannerTitle}>
                  Best option: {recommendedPath.label}
                </Text>
              </View>
            </View>
            <Text style={styles.recBannerReason}>{simulation.recommendationReason}</Text>
          </View>
        )}

        {simulation.paths.map((path) => {
          const isExpanded = expandedPath === path.path;
          const isCopied = copiedPath === path.path;
          const isDoNotSend = path.path === 'do_not_send';
          const isSelected = selectedPathType === path.path;

          return (
            <View key={path.path}>
              <TouchableOpacity
                style={[
                  styles.pathCard,
                  path.isRecommended && styles.pathCardRecommended,
                  isSelected && styles.pathCardSelected,
                  { borderLeftColor: path.color },
                ]}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setExpandedPath(isExpanded ? null : path.path);
                }}
                activeOpacity={0.7}
                testID={`path-${path.path}`}
              >
                <View style={styles.pathHeader}>
                  <View style={[styles.pathIconBadge, { backgroundColor: path.color + '12' }]}>
                    <Text style={styles.pathEmoji}>{path.emoji}</Text>
                  </View>
                  <View style={styles.pathHeaderText}>
                    <View style={styles.pathTitleRow}>
                      <Text style={[styles.pathLabel, { color: path.color }]}>{path.label}</Text>
                      {path.isRecommended && (
                        <View style={styles.recommendedBadge}>
                          <Star size={10} color={Colors.success} />
                          <Text style={styles.recommendedText}>Best option</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.pathRecommendationNote} numberOfLines={2}>
                      {path.recommendationNote}
                    </Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={16} color={Colors.textMuted} />
                  ) : (
                    <ChevronDown size={16} color={Colors.textMuted} />
                  )}
                </View>

                <View style={styles.impactRow}>
                  <ImpactPill dimension="regretRisk" tier={path.impact.regretRisk} />
                  <ImpactPill dimension="dignityProtection" tier={path.impact.dignityProtection} />
                  <ImpactPill dimension="escalationRisk" tier={path.impact.escalationRisk} />
                </View>

                {isExpanded && (
                  <View style={styles.pathExpanded}>
                    {!isDoNotSend && (
                      <View style={styles.pathMessageCard}>
                        <Text style={styles.pathMessageLabel}>Example message</Text>
                        <Text style={styles.pathMessageText}>{path.exampleMessage}</Text>
                        <TouchableOpacity
                          style={styles.pathCopyBtn}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleCopy(path);
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          {isCopied ? (
                            <Check size={12} color={Colors.success} />
                          ) : (
                            <Copy size={12} color={Colors.textMuted} />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    <View style={styles.effectSection}>
                      <EffectRow emoji="💭" label="Effect on you" text={path.selfEffect} />
                      <EffectRow emoji="⏱️" label="Short-term" text={path.shortTermEffect} />
                      <EffectRow emoji="🤝" label="Relationship" text={path.relationshipEffect} />
                    </View>

                    <View style={styles.fullImpactSection}>
                      <Text style={styles.fullImpactTitle}>Impact breakdown</Text>
                      <View style={styles.fullImpactGrid}>
                        <ImpactPill dimension="regretRisk" tier={path.impact.regretRisk} />
                        <ImpactPill dimension="dignityProtection" tier={path.impact.dignityProtection} />
                        <ImpactPill dimension="clarityLevel" tier={path.impact.clarityLevel} />
                        <ImpactPill dimension="escalationRisk" tier={path.impact.escalationRisk} />
                        <ImpactPill dimension="selfRespect" tier={path.impact.selfRespect} />
                      </View>
                    </View>

                    {isDoNotSend ? (
                      <DoNotSendActions
                        onSaveDraft={handleSaveDraft}
                        onPause={() => {
                          handleSelectPath('do_not_send');
                        }}
                        onJournal={navigateToJournal}
                        onGround={navigateToGrounding}
                        onSecureRewrite={navigateToSecureRewrite}
                      />
                    ) : (
                      <TouchableOpacity
                        style={[styles.pathActionBtn, { backgroundColor: path.color }]}
                        onPress={() => handlePathAction(path)}
                        activeOpacity={0.8}
                        testID={`path-action-${path.path}`}
                      >
                        {path.path === 'secure' ? (
                          <Leaf size={14} color={Colors.white} />
                        ) : path.path === 'boundary' ? (
                          <Shield size={14} color={Colors.white} />
                        ) : (
                          <Copy size={14} color={Colors.white} />
                        )}
                        <Text style={styles.pathActionBtnText}>{path.actionLabel}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.originalSection}>
          <Text style={styles.originalLabel}>Your original draft</Text>
          <Text style={styles.originalText}>{context.draft}</Text>
        </View>

        {showOutcome && !outcomeSaved && (
          <OutcomeTracker
            onSelectOutcome={handleSaveOutcome}
            selectedOutcome={selectedOutcome}
          />
        )}

        {outcomeSaved && (
          <View style={styles.outcomeSavedCard}>
            <Check size={16} color={Colors.success} />
            <Text style={styles.outcomeSavedText}>
              Feedback saved. This helps improve future recommendations.
            </Text>
          </View>
        )}

        <View style={styles.disclaimerCard}>
          <AlertTriangle size={14} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            These are projections based on communication patterns. Real outcomes depend on many factors. Trust your judgment.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
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
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  recommendationBanner: {
    backgroundColor: Colors.brandNavy,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  recBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  recBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBannerTextWrap: {
    flex: 1,
  },
  recBannerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  recBannerReason: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 21,
  },
  pathCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  pathCardRecommended: {
    borderWidth: 1,
    borderColor: Colors.success + '30',
    shadowColor: Colors.success,
    shadowOpacity: 0.08,
  },
  pathCardSelected: {
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primaryLight,
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  pathIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathEmoji: {
    fontSize: 20,
  },
  pathHeaderText: {
    flex: 1,
  },
  pathTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  pathLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  pathRecommendationNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  impactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  impactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  impactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  impactPillText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  pathExpanded: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 14,
  },
  pathMessageCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    position: 'relative' as const,
  },
  pathMessageLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pathMessageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 23,
    paddingRight: 28,
  },
  pathCopyBtn: {
    position: 'absolute' as const,
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  effectSection: {
    gap: 14,
    marginBottom: 16,
  },
  effectRow: {
    flexDirection: 'row',
    gap: 10,
  },
  effectIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectIcon: {
    fontSize: 16,
  },
  effectContent: {
    flex: 1,
  },
  effectLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  effectText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  fullImpactSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  fullImpactTitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  fullImpactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pathActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  pathActionBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dnsActionsContainer: {
    marginTop: 4,
  },
  dnsActionsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  dnsActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dnsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dnsActionLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  originalSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  originalLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  originalText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  outcomeSection: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  outcomeSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  outcomeSectionHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 19,
  },
  outcomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  outcomeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  outcomeEmoji: {
    fontSize: 14,
  },
  outcomeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  outcomeSavedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  outcomeSavedText: {
    flex: 1,
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    backgroundColor: Colors.warmGlow,
    borderRadius: 12,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
