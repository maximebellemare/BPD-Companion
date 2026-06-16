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
import { Stack, useRouter } from 'expo-router';
import {
  Brain,
  Zap,
  Heart,
  Shield,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Activity,
  MessageCircle,
  Leaf,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { getGraphPatternSummary, getGraphStats } from '@/services/memory/emotionalMemoryGraphService';
import {
  TriggerChain,
  EmotionCluster,
  CalmingPattern,
  RelationshipChain,
  GrowthSignal,
  GraphPatternSummary,
} from '@/types/memoryGraph';

function SectionHeader({ icon, title, bgColor }: { icon: React.ReactNode; title: string; color: string; bgColor: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: bgColor }]}>
        {icon}
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function TriggerChainCard({ chain, index }: { chain: TriggerChain; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View style={[styles.chainCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.chainTriggerRow}>
        <View style={styles.chainTriggerBadge}>
          <Zap size={12} color={Colors.danger} />
          <Text style={styles.chainTriggerText}>{chain.trigger.label}</Text>
        </View>
        <Text style={styles.chainOccurrences}>{chain.occurrences}×</Text>
      </View>

      <View style={styles.chainFlowRow}>
        {chain.emotions.slice(0, 3).map((emotion, i) => (
          <React.Fragment key={emotion.id}>
            {i > 0 && <View style={styles.chainDot} />}
            <View style={styles.chainEmotionChip}>
              <Text style={styles.chainEmotionText}>{emotion.label}</Text>
            </View>
          </React.Fragment>
        ))}
        {chain.urges.length > 0 && (
          <>
            <ArrowRight size={12} color={Colors.textMuted} style={{ marginHorizontal: 4 }} />
            {chain.urges.slice(0, 2).map((urge) => (
              <View key={urge.id} style={styles.chainUrgeChip}>
                <Text style={styles.chainUrgeText}>{urge.label}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      {chain.copingTools.length > 0 && (
        <View style={styles.chainHelpRow}>
          <Shield size={12} color={Colors.success} />
          <Text style={styles.chainHelpText}>
            {chain.copingTools.map(c => c.label).join(', ')} may help
          </Text>
        </View>
      )}

      <Text style={styles.chainNarrative}>{chain.narrative}</Text>
    </Animated.View>
  );
}

const MemoizedTriggerChainCard = React.memo(TriggerChainCard);

function EmotionClusterCard({ cluster, index }: { cluster: EmotionCluster; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.clusterCard, { opacity: fadeAnim }]}>
      <View style={styles.clusterEmotions}>
        {cluster.emotions.map((e, i) => (
          <React.Fragment key={e.id}>
            {i > 0 && <Text style={styles.clusterJoiner}>&</Text>}
            <View style={styles.clusterEmotionChip}>
              <Text style={styles.clusterEmotionText}>{e.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.clusterNarrative}>{cluster.narrative}</Text>
      {cluster.commonTriggers.length > 0 && (
        <Text style={styles.clusterTriggers}>
          Often after: {cluster.commonTriggers.join(', ')}
        </Text>
      )}
    </Animated.View>
  );
}

const MemoizedEmotionClusterCard = React.memo(EmotionClusterCard);

function CalmingPatternCard({ pattern, index }: { pattern: CalmingPattern; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }),
      Animated.timing(barWidth, { toValue: pattern.effectivenessScore / 100, duration: 800, delay: index * 100 + 200, useNativeDriver: false }),
    ]).start();
  }, [fadeAnim, barWidth, index, pattern.effectivenessScore]);

  return (
    <Animated.View style={[styles.calmingCard, { opacity: fadeAnim }]}>
      <View style={styles.calmingHeader}>
        <View style={styles.calmingToolBadge}>
          <Shield size={14} color={Colors.success} />
          <Text style={styles.calmingToolText}>{pattern.copingTool}</Text>
        </View>
        <Text style={styles.calmingUseCount}>{pattern.timesUsed}× used</Text>
      </View>

      <View style={styles.calmingBarTrack}>
        <Animated.View
          style={[
            styles.calmingBarFill,
            {
              width: barWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <Text style={styles.calmingNarrative}>{pattern.narrative}</Text>
    </Animated.View>
  );
}

const MemoizedCalmingPatternCard = React.memo(CalmingPatternCard);

function RelationshipChainCard({ chain, index }: { chain: RelationshipChain; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.relCard, { opacity: fadeAnim }]}>
      <View style={styles.relSituationRow}>
        <Users size={14} color={Colors.accent} />
        <Text style={styles.relSituation}>{chain.situation}</Text>
      </View>

      <View style={styles.relFlowContainer}>
        <View style={styles.relFlowStep}>
          <View style={[styles.relFlowDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.relFlowLabel}>{chain.emotionalResponse}</Text>
        </View>
        <View style={styles.relFlowLine} />
        <View style={styles.relFlowStep}>
          <View style={[styles.relFlowDot, { backgroundColor: '#67E8F9' }]} />
          <Text style={styles.relFlowLabel}>{chain.behavioralUrge}</Text>
        </View>
        <View style={styles.relFlowLine} />
        <View style={styles.relFlowStep}>
          <View style={[styles.relFlowDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.relFlowLabel}>{chain.communicationStyle}</Text>
        </View>
      </View>

      <Text style={styles.relNarrative}>{chain.narrative}</Text>
    </Animated.View>
  );
}

const MemoizedRelationshipChainCard = React.memo(RelationshipChainCard);

function GrowthSignalCard({ signal, index }: { signal: GrowthSignal; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }).start();
  }, [fadeAnim, index]);

  const iconColor = signal.direction === 'improving' ? Colors.success
    : signal.direction === 'needs_attention' ? Colors.accent
    : Colors.textSecondary;

  const bgColor = signal.direction === 'improving' ? Colors.successLight
    : signal.direction === 'needs_attention' ? Colors.accentLight
    : Colors.surface;

  return (
    <Animated.View style={[styles.growthCard, { opacity: fadeAnim, backgroundColor: bgColor }]}>
      <View style={styles.growthIconWrap}>
        {signal.direction === 'improving' ? (
          <TrendingUp size={16} color={iconColor} />
        ) : (
          <Activity size={16} color={iconColor} />
        )}
      </View>
      <View style={styles.growthContent}>
        <Text style={styles.growthArea}>{signal.area}</Text>
        <Text style={styles.growthNarrative}>{signal.narrative}</Text>
      </View>
    </Animated.View>
  );
}

const MemoizedGrowthSignalCard = React.memo(GrowthSignalCard);

export default function EmotionalPatternsScreen() {
  const router = useRouter();
  const { journalEntries, messageDrafts } = useApp();

  const patternSummary = useMemo<GraphPatternSummary>(() => {
    return getGraphPatternSummary(journalEntries, messageDrafts);
  }, [journalEntries, messageDrafts]);

  const graphStats = useMemo(() => {
    return getGraphStats(journalEntries, messageDrafts);
  }, [journalEntries, messageDrafts]);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [headerFade, headerSlide]);

  const handleExploreTap = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const hasData = graphStats.dataPoints > 0;
  const hasTriggerChains = patternSummary.topTriggerChains.length > 0;
  const hasEmotionClusters = patternSummary.topEmotionClusters.length > 0;
  const hasCalmingPatterns = patternSummary.mostEffectiveCalming.length > 0;
  const hasRelationshipChains = patternSummary.relationshipPatterns.length > 0;
  const hasGrowthSignals = patternSummary.growthSignals.length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Emotional Patterns',
          headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.heroIconWrap}>
            <Brain size={28} color="#2E2A72" />
          </View>
          <Text style={styles.heroTitle}>Your Emotional Patterns</Text>
          <Text style={styles.heroSubtitle}>
            Connections discovered across your check-ins, journal entries, and coping history.
          </Text>
        </Animated.View>

        {hasData && (
          <Animated.View style={[styles.statsRow, { opacity: headerFade }]}>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{graphStats.nodeCount}</Text>
              <Text style={styles.statPillLabel}>Patterns</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{graphStats.edgeCount}</Text>
              <Text style={styles.statPillLabel}>Connections</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{graphStats.dataPoints}</Text>
              <Text style={styles.statPillLabel}>Data Points</Text>
            </View>
          </Animated.View>
        )}

        {hasData && patternSummary.personalizedNarrative ? (
          <Animated.View style={[styles.narrativeBanner, { opacity: headerFade }]}>
            <Sparkles size={16} color={Colors.primary} />
            <Text style={styles.narrativeText}>{patternSummary.personalizedNarrative}</Text>
          </Animated.View>
        ) : null}

        {!hasData && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Sparkles size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Patterns emerge with time</Text>
            <Text style={styles.emptyDesc}>
              As you check in and use coping tools, this screen will reveal connections between your triggers, emotions, and what helps most.
            </Text>
            <Text style={styles.emptyHint}>Even small check-ins count.</Text>
          </View>
        )}

        {hasTriggerChains && (
          <View style={styles.section} testID="trigger-chains-section">
            <SectionHeader
              icon={<Zap size={16} color="#3B82F6" />}
              title="Common Trigger Chains"
              color="#3B82F6"
              bgColor="#FFFFFF"
            />
            <Text style={styles.sectionDesc}>
              What tends to follow your most common triggers
            </Text>
            {patternSummary.topTriggerChains.map((chain, i) => (
              <MemoizedTriggerChainCard key={chain.id} chain={chain} index={i} />
            ))}
          </View>
        )}

        {hasEmotionClusters && (
          <View style={styles.section} testID="emotion-clusters-section">
            <SectionHeader
              icon={<Heart size={16} color={Colors.primary} />}
              title="Emotion Clusters"
              color={Colors.primary}
              bgColor={Colors.primaryLight}
            />
            <Text style={styles.sectionDesc}>
              Emotions that often appear together
            </Text>
            {patternSummary.topEmotionClusters.map((cluster, i) => (
              <MemoizedEmotionClusterCard key={cluster.id} cluster={cluster} index={i} />
            ))}
          </View>
        )}

        {hasCalmingPatterns && (
          <View style={styles.section} testID="calming-patterns-section">
            <SectionHeader
              icon={<Leaf size={16} color={Colors.success} />}
              title="Most Effective Calming Patterns"
              color={Colors.success}
              bgColor={Colors.successLight}
            />
            <Text style={styles.sectionDesc}>
              Tools and strategies that seem to help most
            </Text>
            {patternSummary.mostEffectiveCalming.map((pattern, i) => (
              <MemoizedCalmingPatternCard key={pattern.id} pattern={pattern} index={i} />
            ))}
          </View>
        )}

        {hasRelationshipChains && (
          <View style={styles.section} testID="relationship-chains-section">
            <SectionHeader
              icon={<MessageCircle size={16} color={Colors.accent} />}
              title="Relationship Pattern Chains"
              color={Colors.accent}
              bgColor={Colors.accentLight}
            />
            <Text style={styles.sectionDesc}>
              How relationship situations tend to unfold
            </Text>
            {patternSummary.relationshipPatterns.map((chain, i) => (
              <MemoizedRelationshipChainCard key={chain.id} chain={chain} index={i} />
            ))}
          </View>
        )}

        {hasGrowthSignals && (
          <View style={styles.section} testID="growth-signals-section">
            <SectionHeader
              icon={<TrendingUp size={16} color={Colors.success} />}
              title="Growth & Change Signals"
              color={Colors.success}
              bgColor={Colors.successLight}
            />
            <Text style={styles.sectionDesc}>
              Signs of progress and positive change
            </Text>
            {patternSummary.growthSignals.map((signal, i) => (
              <MemoizedGrowthSignalCard key={signal.id} signal={signal} index={i} />
            ))}
          </View>
        )}

        {hasData && (
          <TouchableOpacity
            style={styles.exploreMemoryBtn}
            onPress={() => {
              handleExploreTap();
              router.push('/companion/memory' as never);
            }}
            activeOpacity={0.7}
            testID="explore-full-memory-btn"
          >
            <Brain size={18} color={Colors.primary} />
            <Text style={styles.exploreMemoryText}>View Full Memory Profile</Text>
            <ArrowRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.gentleNote}>
          <Heart size={13} color={Colors.textMuted} />
          <Text style={styles.gentleNoteText}>
            Patterns aren't destiny — they're invitations to understand yourself more deeply.
          </Text>
        </View>

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
    marginBottom: 20,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#0B1238',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
    paddingHorizontal: 10,
  },
  statsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 10,
    marginBottom: 20,
  },
  statPill: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    minWidth: 90,
  },
  statPillValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statPillLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  narrativeBanner: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  narrativeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 14,
    marginLeft: 42,
  },
  chainCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chainTriggerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  chainTriggerBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chainTriggerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  chainOccurrences: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  chainFlowRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 10,
  },
  chainDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  chainEmotionChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chainEmotionText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.primaryDark,
  },
  chainUrgeChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chainUrgeText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#3B82F6',
  },
  chainHelpRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 8,
  },
  chainHelpText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500' as const,
  },
  chainNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
  clusterCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  clusterEmotions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginBottom: 10,
  },
  clusterJoiner: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  clusterEmotionChip: {
    backgroundColor: '#0B1238',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  clusterEmotionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#2E2A72',
  },
  clusterNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  clusterTriggers: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  calmingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  calmingHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
  },
  calmingToolBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  calmingToolText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#14B8A6',
  },
  calmingUseCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  calmingBarTrack: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden' as const,
    marginBottom: 10,
  },
  calmingBarFill: {
    height: 6,
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  calmingNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
  relCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  relSituationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  relSituation: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  relFlowContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  relFlowStep: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    flex: 1,
  },
  relFlowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  relFlowLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    flexShrink: 1,
  },
  relFlowLine: {
    width: 16,
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  relNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
  growthCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  growthIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  growthContent: {
    flex: 1,
  },
  growthArea: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  growthNarrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  exploreMemoryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  exploreMemoryText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  gentleNote: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 16,
  },
  gentleNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 18,
    maxWidth: 300,
  },
  bottomSpacer: {
    height: 40,
  },
});
