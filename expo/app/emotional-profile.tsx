import React, { useMemo, useRef, useEffect, useCallback } from 'react';
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
  X,
  Zap,
  GitBranch,
  Flame,
  Users,
  Leaf,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  ChevronRight,
  Brain,
  Activity,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { buildFullEmotionalModelState } from '@/services/emotionalModel/emotionalModelService';
import {
  EmotionalTriggerProfile,
  EmotionSequence,
  UrgeProfile,
  CopingEffectiveness,
  RelationshipTriggerProfile,
  EscalationPattern,
  EmotionalModelInsight,
} from '@/types/emotionalModel';

const PALETTE = {
  trigger: { bg: '#FFF0E8', border: '#F5D4BE', accent: '#C4704A' },
  emotion: { bg: '#EDE8F5', border: '#D4C8E8', accent: '#7B5EA7' },
  urge: { bg: '#FFF5E0', border: '#F0DFB8', accent: '#A08040' },
  relationship: { bg: '#F5E6D8', border: '#E8D0BC', accent: '#C4885B' },
  coping: { bg: '#E3F0E8', border: '#C0DBC8', accent: '#4A8B60' },
  escalation: { bg: '#F8E8E8', border: '#E8C8C8', accent: '#A85050' },
  growth: { bg: '#E8F0E3', border: '#C8DBC0', accent: '#5A8B4A' },
  attention: { bg: '#FFF8E8', border: '#F0E0B8', accent: '#A09040' },
};

function TriggerCard({ trigger, index }: { trigger: EmotionalTriggerProfile; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const TrendIcon = trigger.trend === 'increasing'
    ? TrendingUp
    : trigger.trend === 'decreasing'
      ? TrendingDown
      : Minus;

  const trendColor = trigger.trend === 'decreasing'
    ? Colors.success
    : trigger.trend === 'increasing'
      ? PALETTE.escalation.accent
      : Colors.textMuted;

  return (
    <Animated.View style={[styles.triggerCard, { opacity: fadeAnim }]}>
      <View style={styles.triggerHeader}>
        <View style={styles.triggerLabelWrap}>
          <Zap size={14} color={PALETTE.trigger.accent} />
          <Text style={styles.triggerLabel}>{trigger.label}</Text>
        </View>
        <View style={styles.triggerMeta}>
          <TrendIcon size={13} color={trendColor} />
          <Text style={[styles.triggerFreq, { color: trendColor }]}>{trigger.frequency}×</Text>
        </View>
      </View>
      <View style={styles.triggerDistressBar}>
        <View style={styles.triggerDistressTrack}>
          <View
            style={[
              styles.triggerDistressFill,
              { width: `${Math.min(trigger.averageDistress * 10, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.triggerDistressLabel}>{trigger.averageDistress}/10</Text>
      </View>
      {trigger.commonEmotions.length > 0 && (
        <View style={styles.triggerTags}>
          {trigger.commonEmotions.map(em => (
            <View key={em} style={styles.triggerTag}>
              <Text style={styles.triggerTagText}>{em}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

function SequenceCard({ sequence, index }: { sequence: EmotionSequence; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.sequenceCard, { opacity: fadeAnim }]}>
      <View style={styles.sequenceChain}>
        {sequence.chain.map((node, i) => (
          <React.Fragment key={`${node}_${i}`}>
            <View style={styles.sequenceNode}>
              <Text style={styles.sequenceNodeText}>{node}</Text>
            </View>
            {i < sequence.chain.length - 1 && (
              <Text style={styles.sequenceArrow}>→</Text>
            )}
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.sequenceNarrative}>{sequence.narrative}</Text>
      <View style={styles.sequenceMeta}>
        <Text style={styles.sequenceCount}>{sequence.occurrences}× observed</Text>
        <Text style={styles.sequenceIntensity}>avg {sequence.averageIntensity}/10</Text>
      </View>
    </Animated.View>
  );
}

function UrgeCard({ urge, index }: { urge: UrgeProfile; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.urgeCard, { opacity: fadeAnim }]}>
      <View style={styles.urgeHeader}>
        <Flame size={14} color={PALETTE.urge.accent} />
        <Text style={styles.urgeLabel}>{urge.label}</Text>
        <Text style={styles.urgeFreq}>{urge.frequency}×</Text>
      </View>
      <View style={styles.urgeManagedRow}>
        <Text style={styles.urgeManagedLabel}>Managed</Text>
        <View style={styles.urgeManagedTrack}>
          <View
            style={[
              styles.urgeManagedFill,
              { width: `${Math.min(urge.managedRate, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.urgeManagedValue}>{urge.managedRate}%</Text>
      </View>
    </Animated.View>
  );
}

function CopingCard({ coping, index }: { coping: CopingEffectiveness; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.copingCard, { opacity: fadeAnim }]}>
      <View style={styles.copingHeader}>
        <Leaf size={14} color={PALETTE.coping.accent} />
        <Text style={styles.copingTool}>{coping.tool}</Text>
      </View>
      <View style={styles.copingStats}>
        <View style={styles.copingStat}>
          <Text style={styles.copingStatValue}>{coping.timesUsed}</Text>
          <Text style={styles.copingStatLabel}>used</Text>
        </View>
        <View style={styles.copingStatDivider} />
        <View style={styles.copingStat}>
          <Text style={[styles.copingStatValue, coping.helpfulRate >= 50 && { color: PALETTE.coping.accent }]}>
            {coping.helpfulRate}%
          </Text>
          <Text style={styles.copingStatLabel}>helpful</Text>
        </View>
      </View>
      <Text style={styles.copingNarrative}>{coping.narrative}</Text>
    </Animated.View>
  );
}

function RelationshipCard({ rel, index }: { rel: RelationshipTriggerProfile; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const riskColor = rel.escalationRisk === 'high'
    ? PALETTE.escalation.accent
    : rel.escalationRisk === 'moderate'
      ? PALETTE.urge.accent
      : PALETTE.coping.accent;

  return (
    <Animated.View style={[styles.relCard, { opacity: fadeAnim }]}>
      <View style={styles.relHeader}>
        <Users size={14} color={PALETTE.relationship.accent} />
        <Text style={styles.relLabel}>{rel.label}</Text>
        <View style={[styles.relRiskBadge, { backgroundColor: riskColor + '20' }]}>
          <Text style={[styles.relRiskText, { color: riskColor }]}>{rel.escalationRisk}</Text>
        </View>
      </View>
      <View style={styles.relFlow}>
        <View style={styles.relFlowItem}>
          <Text style={styles.relFlowLabel}>Response</Text>
          <Text style={styles.relFlowValue}>{rel.emotionalResponse}</Text>
        </View>
        <Text style={styles.relFlowArrow}>→</Text>
        <View style={styles.relFlowItem}>
          <Text style={styles.relFlowLabel}>Urge</Text>
          <Text style={styles.relFlowValue}>{rel.typicalUrge}</Text>
        </View>
      </View>
      <Text style={styles.relNarrative}>{rel.narrative}</Text>
    </Animated.View>
  );
}

function EscalationCard({ pattern, index }: { pattern: EscalationPattern; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.escalationCard, { opacity: fadeAnim }]}>
      <View style={styles.escalationChain}>
        <View style={styles.escalationNode}>
          <Text style={styles.escalationNodeLabel}>Trigger</Text>
          <Text style={styles.escalationNodeValue}>{pattern.triggerPhase}</Text>
        </View>
        <Text style={styles.escalationArrow}>→</Text>
        <View style={styles.escalationNode}>
          <Text style={styles.escalationNodeLabel}>Emotion</Text>
          <Text style={styles.escalationNodeValue}>{pattern.emotionalPhase}</Text>
        </View>
        <Text style={styles.escalationArrow}>→</Text>
        <View style={styles.escalationNode}>
          <Text style={styles.escalationNodeLabel}>Urge</Text>
          <Text style={styles.escalationNodeValue}>{pattern.urgePhase}</Text>
        </View>
      </View>
      <Text style={styles.escalationNarrative}>{pattern.narrative}</Text>
      <View style={styles.escalationMeta}>
        <Text style={styles.escalationMetaText}>{pattern.frequency}× seen</Text>
        <Text style={styles.escalationMetaText}>Peak: {pattern.averagePeakDistress}/10</Text>
        <Text style={styles.escalationMetaText}>Interrupted: {pattern.interruptionSuccess}%</Text>
      </View>
    </Animated.View>
  );
}

function InsightChip({ insight }: { insight: EmotionalModelInsight }) {
  const bgColor = insight.sentiment === 'positive'
    ? PALETTE.growth.bg
    : insight.sentiment === 'cautious'
      ? PALETTE.attention.bg
      : Colors.surface;
  const borderColor = insight.sentiment === 'positive'
    ? PALETTE.growth.border
    : insight.sentiment === 'cautious'
      ? PALETTE.attention.border
      : Colors.border;

  return (
    <View style={[styles.insightChip, { backgroundColor: bgColor, borderColor }]}>
      <Text style={styles.insightChipTitle}>{insight.title}</Text>
      <Text style={styles.insightChipNarrative}>{insight.narrative}</Text>
    </View>
  );
}

export default function EmotionalProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { journalEntries, messageDrafts } = useApp();

  const headerFade = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const modelState = useMemo(
    () => buildFullEmotionalModelState(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const { model, insights } = modelState;
  const hasData = model.dataPointCount >= 3;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [headerFade, pulseAnim]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleNavigate = useCallback((path: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(path as never);
  }, [router]);

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const trendLabel = model.overallDistressTrend === 'improving'
    ? 'Improving'
    : model.overallDistressTrend === 'worsening'
      ? 'Needs attention'
      : model.overallDistressTrend === 'stable'
        ? 'Stable'
        : 'Building';

  const trendColor = model.overallDistressTrend === 'improving'
    ? PALETTE.coping.accent
    : model.overallDistressTrend === 'worsening'
      ? PALETTE.escalation.accent
      : Colors.textSecondary;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
          testID="emotional-profile-close"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.heroSection, { opacity: headerFade }]}>
          <Animated.View style={[styles.heroGlow, { opacity: pulseOpacity }]} />
          <View style={styles.heroIconWrap}>
            <Brain size={28} color={Colors.white} />
          </View>
          <Text style={styles.heroTitle}>Emotional Profile</Text>
          <Text style={styles.heroSubtitle}>
            Your personal emotional model, built from your patterns
          </Text>
        </Animated.View>

        {!hasData ? (
          <Animated.View style={[styles.emptyState, { opacity: headerFade }]}>
            <Text style={styles.emptyEmoji}>🧠</Text>
            <Text style={styles.emptyTitle}>Your model is forming</Text>
            <Text style={styles.emptyDesc}>
              As you continue checking in and journaling, your personal emotional model will become more detailed and personalized.
            </Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={() => handleNavigate('/check-in')}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyActionText}>Start a check-in</Text>
              <ChevronRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            <Animated.View style={[styles.narrativeCard, { opacity: headerFade }]}>
              <Text style={styles.narrativeText}>{model.modelNarrative}</Text>
            </Animated.View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{model.dataPointCount}</Text>
                <Text style={styles.summaryLabel}>Check-ins</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{model.averageDistress}</Text>
                <Text style={styles.summaryLabel}>Avg Distress</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: trendColor }]}>{trendLabel}</Text>
                <Text style={styles.summaryLabel}>Trend</Text>
              </View>
            </View>

            {insights.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#EDE8F5' }]}>
                    <Activity size={18} color="#7B5EA7" />
                  </View>
                  <Text style={styles.sectionTitle}>Key Insights</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  What your emotional model has noticed
                </Text>
                <View style={styles.insightsList}>
                  {insights.slice(0, 6).map(insight => (
                    <InsightChip key={insight.id} insight={insight} />
                  ))}
                </View>
              </View>
            )}

            {model.topTriggers.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: PALETTE.trigger.bg }]}>
                    <Zap size={18} color={PALETTE.trigger.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Common Triggers</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  What tends to activate emotional responses
                </Text>
                {model.topTriggers.slice(0, 5).map((trigger, i) => (
                  <TriggerCard key={trigger.label} trigger={trigger} index={i} />
                ))}
              </View>
            )}

            {model.emotionSequences.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: PALETTE.emotion.bg }]}>
                    <GitBranch size={18} color={PALETTE.emotion.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Emotional Chains</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  How emotions tend to flow from one to another
                </Text>
                {model.emotionSequences.slice(0, 4).map((seq, i) => (
                  <SequenceCard key={seq.id} sequence={seq} index={i} />
                ))}
              </View>
            )}

            {model.frequentUrges.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: PALETTE.urge.bg }]}>
                    <Flame size={18} color={PALETTE.urge.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Frequent Urges</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Urges that show up most and how well they are managed
                </Text>
                {model.frequentUrges.slice(0, 5).map((urge, i) => (
                  <UrgeCard key={urge.label} urge={urge} index={i} />
                ))}
              </View>
            )}

            {model.effectiveCoping.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: PALETTE.coping.bg }]}>
                    <Leaf size={18} color={PALETTE.coping.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Helpful Coping Tools</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Tools that seem to make a difference
                </Text>
                {model.effectiveCoping.slice(0, 4).map((coping, i) => (
                  <CopingCard key={coping.tool} coping={coping} index={i} />
                ))}
              </View>
            )}

            {model.relationshipTriggers.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: PALETTE.relationship.bg }]}>
                    <Users size={18} color={PALETTE.relationship.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Relationship Triggers</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  How relationship dynamics tend to affect you
                </Text>
                {model.relationshipTriggers.slice(0, 4).map((rel, i) => (
                  <RelationshipCard key={rel.label} rel={rel} index={i} />
                ))}
              </View>
            )}

            {model.escalationPatterns.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: PALETTE.escalation.bg }]}>
                    <AlertCircle size={18} color={PALETTE.escalation.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Escalation Patterns</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Sequences that tend to build in intensity
                </Text>
                {model.escalationPatterns.slice(0, 3).map((pattern, i) => (
                  <EscalationCard key={pattern.id} pattern={pattern} index={i} />
                ))}
              </View>
            )}

            {(model.growthAreas.length > 0 || model.attentionAreas.length > 0) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: PALETTE.growth.bg }]}>
                    <TrendingUp size={18} color={PALETTE.growth.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>Growth & Focus</Text>
                </View>
                {model.growthAreas.map((area, i) => (
                  <View key={`growth_${i}`} style={styles.growthItem}>
                    <View style={styles.growthDot} />
                    <Text style={styles.growthText}>{area}</Text>
                  </View>
                ))}
                {model.attentionAreas.map((area, i) => (
                  <View key={`attn_${i}`} style={styles.attentionItem}>
                    <View style={styles.attentionDot} />
                    <Text style={styles.attentionText}>{area}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.closingSection}>
              <Text style={styles.closingText}>
                This profile is built from your own check-ins and patterns. It is not a diagnosis — it is a compassionate mirror to help you and the AI Companion understand your emotional world better.
              </Text>
            </View>

            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleNavigate('/reflection-mirror')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionLabel}>Reflection Mirror</Text>
                <Text style={styles.actionDesc}>Compassionate reflections</Text>
                <ChevronRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleNavigate('/insights')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionLabel}>Your Insights</Text>
                <Text style={styles.actionDesc}>Detailed analytics</Text>
                <ChevronRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleNavigate('/emotional-loops')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionLabel}>Emotional Loops</Text>
                <Text style={styles.actionDesc}>Recurring patterns</Text>
                <ChevronRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 4,
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#7B5EA7',
    top: 12,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7B5EA7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#7B5EA7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  narrativeCard: {
    backgroundColor: '#F5F0FA',
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0D5F0',
  },
  narrativeText: {
    fontSize: 16,
    color: '#7B5EA7',
    fontWeight: '500' as const,
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 14,
    marginLeft: 46,
  },
  insightsList: {
    gap: 8,
  },
  insightChip: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  insightChipTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  insightChipNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  triggerCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PALETTE.trigger.border,
  },
  triggerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  triggerLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  triggerLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  triggerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  triggerFreq: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  triggerDistressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  triggerDistressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.trigger.bg,
    overflow: 'hidden',
  },
  triggerDistressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: PALETTE.trigger.accent,
  },
  triggerDistressLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    width: 36,
    textAlign: 'right',
  },
  triggerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  triggerTag: {
    backgroundColor: PALETTE.trigger.bg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  triggerTagText: {
    fontSize: 11,
    color: PALETTE.trigger.accent,
    fontWeight: '500' as const,
  },
  sequenceCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PALETTE.emotion.border,
  },
  sequenceChain: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  sequenceNode: {
    backgroundColor: PALETTE.emotion.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sequenceNodeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: PALETTE.emotion.accent,
  },
  sequenceArrow: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  sequenceNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  sequenceMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  sequenceCount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  sequenceIntensity: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  urgeCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PALETTE.urge.border,
  },
  urgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  urgeLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  urgeFreq: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  urgeManagedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgeManagedLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    width: 56,
  },
  urgeManagedTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.urge.bg,
    overflow: 'hidden',
  },
  urgeManagedFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: PALETTE.coping.accent,
  },
  urgeManagedValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    width: 32,
    textAlign: 'right',
  },
  copingCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PALETTE.coping.border,
  },
  copingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  copingTool: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  copingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: PALETTE.coping.bg,
    borderRadius: 10,
    padding: 10,
  },
  copingStat: {
    flex: 1,
    alignItems: 'center',
  },
  copingStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  copingStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  copingStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: PALETTE.coping.border,
  },
  copingNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  relCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PALETTE.relationship.border,
  },
  relHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  relLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  relRiskBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  relRiskText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  relFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  relFlowItem: {
    flex: 1,
    backgroundColor: PALETTE.relationship.bg,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  relFlowLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: PALETTE.relationship.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  relFlowValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  relFlowArrow: {
    fontSize: 16,
    color: Colors.textMuted,
    paddingHorizontal: 8,
  },
  relNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  escalationCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PALETTE.escalation.border,
  },
  escalationChain: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  escalationNode: {
    backgroundColor: PALETTE.escalation.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  escalationNodeLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: PALETTE.escalation.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  escalationNodeValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  escalationArrow: {
    fontSize: 14,
    color: Colors.textMuted,
    paddingHorizontal: 4,
  },
  escalationNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  escalationMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  escalationMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  growthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
    paddingLeft: 46,
  },
  growthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.growth.accent,
    marginTop: 5,
  },
  growthText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    flex: 1,
  },
  attentionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
    paddingLeft: 46,
  },
  attentionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.attention.accent,
    marginTop: 5,
  },
  attentionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    flex: 1,
  },
  closingSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  closingText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionsSection: {
    gap: 10,
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  actionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 8,
  },
});
