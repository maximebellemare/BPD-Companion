import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Zap,
  Heart,
  AlertTriangle,
  Shield,
  Clock,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Activity,
  RotateCcw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { PremiumInlinePrompt } from '@/components/PremiumGate';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import {
  buildEpisodeReplayState,
} from '@/services/timeline/emotionalEpisodeService';
import { EmotionalEpisode, EpisodeNode, EpisodeNodeType } from '@/types/emotionalEpisode';

const NODE_TYPE_CONFIG: Record<EpisodeNodeType, { icon: React.ElementType; label: string; bg: string; color: string }> = {
  trigger: { icon: Zap, label: 'Trigger', bg: '#FFFFFF', color: '#3B82F6' },
  emotion: { icon: Heart, label: 'Emotion', bg: '#FFFFFF', color: '#3B82F6' },
  urge: { icon: AlertTriangle, label: 'Urge', bg: '#FFFFFF', color: '#3B82F6' },
  behavior: { icon: MessageSquare, label: 'Action', bg: '#D9E2EC', color: '#67E8F9' },
  coping: { icon: Shield, label: 'Coping', bg: '#FFFFFF', color: '#14B8A6' },
  outcome: { icon: Activity, label: 'Outcome', bg: '#D9E2EC', color: '#14B8A6' },
};

const OUTCOME_CONFIG = {
  managed: { label: 'Managed', color: '#14B8A6', bg: '#FFFFFF', icon: TrendingDown },
  escalated: { label: 'Escalated', color: '#3B82F6', bg: '#FFFFFF', icon: TrendingUp },
  deescalated: { label: 'De-escalated', color: '#14B8A6', bg: '#D9E2EC', icon: TrendingDown },
  neutral: { label: 'Neutral', color: '#2E2A72', bg: '#FFFFFF', icon: Minus },
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(start: number, end: number): string {
  const diff = end - start;
  const mins = Math.round(diff / (60 * 1000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

const TimelineNode = React.memo(function TimelineNode({
  node,
  index,
  isLast,
}: {
  node: EpisodeNode;
  index: number;
  isLast: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = index * 120;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const config = NODE_TYPE_CONFIG[node.type];
  const NodeIcon = config.icon;

  return (
    <Animated.View
      style={[
        styles.nodeRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.nodeTrack}>
        <View style={[styles.nodeDot, { backgroundColor: node.color }]}>
          <NodeIcon size={11} color="#FFF" />
        </View>
        {!isLast && <View style={[styles.nodeLine, { backgroundColor: node.color + '30' }]} />}
      </View>

      <View style={[styles.nodeCard, { borderLeftColor: node.color }]}>
        <View style={styles.nodeCardHeader}>
          <View style={[styles.nodeTypeBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.nodeTypeBadgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
          <Text style={styles.nodeTime}>{formatTime(node.timestamp)}</Text>
        </View>
        <Text style={styles.nodeLabel}>{node.label}</Text>
        {node.intensity !== undefined && (
          <View style={styles.nodeIntensityRow}>
            <View style={styles.nodeIntensityTrack}>
              <View
                style={[
                  styles.nodeIntensityFill,
                  {
                    width: `${(node.intensity / 10) * 100}%`,
                    backgroundColor: node.intensity <= 3
                      ? '#14B8A6'
                      : node.intensity <= 6
                        ? '#67E8F9'
                        : '#3B82F6',
                  },
                ]}
              />
            </View>
            <Text style={styles.nodeIntensityText}>{node.intensity}/10</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

const EpisodeCard = React.memo(function EpisodeCard({
  episode,
  onPress,
}: {
  episode: EmotionalEpisode;
  onPress: () => void;
}) {
  const outcomeConfig = OUTCOME_CONFIG[episode.outcome];
  const OutcomeIcon = outcomeConfig.icon;

  const intensityColor = episode.peakIntensity <= 3
    ? '#14B8A6'
    : episode.peakIntensity <= 6
      ? '#67E8F9'
      : '#3B82F6';

  return (
    <TouchableOpacity
      style={styles.episodeCard}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`episode-card-${episode.id}`}
    >
      <View style={styles.episodeCardTop}>
        <View style={styles.episodeDateRow}>
          <Clock size={13} color={Colors.textMuted} />
          <Text style={styles.episodeDateText}>{formatDate(episode.startTime)}</Text>
          {episode.startTime !== episode.endTime && (
            <Text style={styles.episodeDuration}>
              {formatDuration(episode.startTime, episode.endTime)}
            </Text>
          )}
        </View>
        <View style={[styles.outcomeBadge, { backgroundColor: outcomeConfig.bg }]}>
          <OutcomeIcon size={11} color={outcomeConfig.color} />
          <Text style={[styles.outcomeBadgeText, { color: outcomeConfig.color }]}>
            {outcomeConfig.label}
          </Text>
        </View>
      </View>

      <Text style={styles.episodeDominantEmotion}>{episode.dominantEmotion}</Text>

      <View style={styles.episodeChainPreview}>
        {episode.nodes.slice(0, 5).map((node, idx) => (
          <React.Fragment key={node.id}>
            <View style={[styles.chainDot, { backgroundColor: node.color }]} />
            {idx < Math.min(episode.nodes.length - 1, 4) && (
              <View style={styles.chainConnector} />
            )}
          </React.Fragment>
        ))}
        {episode.nodes.length > 5 && (
          <Text style={styles.chainMoreText}>+{episode.nodes.length - 5}</Text>
        )}
      </View>

      <View style={styles.episodeMetaRow}>
        <View style={styles.episodeMetaItem}>
          <Zap size={12} color="#3B82F6" />
          <Text style={styles.episodeMetaText}>{episode.triggers.length} trigger{episode.triggers.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={[styles.episodeIntensityPill, { backgroundColor: intensityColor + '18' }]}>
          <Text style={[styles.episodeIntensityText, { color: intensityColor }]}>
            Peak {episode.peakIntensity}/10
          </Text>
        </View>
        {episode.isRelationshipRelated && (
          <View style={styles.relationshipBadge}>
            <Heart size={10} color="#67E8F9" />
            <Text style={styles.relationshipBadgeText}>Relationship</Text>
          </View>
        )}
      </View>

      <View style={styles.episodeTapHint}>
        <Text style={styles.episodeTapHintText}>Tap to replay</Text>
        <ChevronRight size={14} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
});

function EpisodeDetail({
  episode,
  onBack,
}: {
  episode: EmotionalEpisode;
  onBack: () => void;
}) {
  const headerFade = useRef(new Animated.Value(0)).current;
  const reflectionFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(reflectionFade, {
      toValue: 1,
      duration: 600,
      delay: episode.nodes.length * 120 + 200,
      useNativeDriver: true,
    }).start();
  }, [headerFade, reflectionFade, episode.nodes.length]);

  const outcomeConfig = OUTCOME_CONFIG[episode.outcome];
  const OutcomeIcon = outcomeConfig.icon;

  return (
    <View style={styles.detailContainer}>
      <Animated.View style={[styles.detailHeader, { opacity: headerFade }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={Colors.primary} />
          <Text style={styles.backText}>Episodes</Text>
        </TouchableOpacity>

        <View style={styles.detailHeaderInfo}>
          <Text style={styles.detailDate}>{formatDate(episode.startTime)}</Text>
          <Text style={styles.detailTimeRange}>
            {formatTime(episode.startTime)}
            {episode.startTime !== episode.endTime
              ? ` — ${formatTime(episode.endTime)}`
              : ''}
          </Text>
        </View>

        <View style={styles.detailBadgeRow}>
          <View style={[styles.outcomeBadge, { backgroundColor: outcomeConfig.bg }]}>
            <OutcomeIcon size={11} color={outcomeConfig.color} />
            <Text style={[styles.outcomeBadgeText, { color: outcomeConfig.color }]}>
              {outcomeConfig.label}
            </Text>
          </View>
          {episode.isRelationshipRelated && (
            <View style={styles.relationshipBadge}>
              <Heart size={10} color="#67E8F9" />
              <Text style={styles.relationshipBadgeText}>Relationship</Text>
            </View>
          )}
        </View>
      </Animated.View>

      <View style={styles.detailSummaryRow}>
        <View style={styles.detailSummaryItem}>
          <Text style={styles.detailSummaryValue}>{episode.peakIntensity}</Text>
          <Text style={styles.detailSummaryLabel}>Peak</Text>
        </View>
        <View style={styles.detailSummaryDivider} />
        <View style={styles.detailSummaryItem}>
          <Text style={styles.detailSummaryValue}>{episode.nodes.length}</Text>
          <Text style={styles.detailSummaryLabel}>Steps</Text>
        </View>
        <View style={styles.detailSummaryDivider} />
        <View style={styles.detailSummaryItem}>
          <Text style={styles.detailSummaryValue}>{episode.emotions.length}</Text>
          <Text style={styles.detailSummaryLabel}>Emotions</Text>
        </View>
        <View style={styles.detailSummaryDivider} />
        <View style={styles.detailSummaryItem}>
          <Text style={styles.detailSummaryValue}>{episode.copingUsed.length}</Text>
          <Text style={styles.detailSummaryLabel}>Coping</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Episode Timeline</Text>

      {episode.nodes.map((node, idx) => (
        <TimelineNode
          key={node.id}
          node={node}
          index={idx}
          isLast={idx === episode.nodes.length - 1}
        />
      ))}

      <Animated.View style={[styles.reflectionCard, { opacity: reflectionFade }]}>
        <View style={styles.reflectionIconRow}>
          <View style={styles.reflectionIconWrap}>
            <Lightbulb size={18} color="#67E8F9" />
          </View>
          <Text style={styles.reflectionTitle}>What may have happened</Text>
        </View>
        <Text style={styles.reflectionText}>{episode.reflection}</Text>
      </Animated.View>

      <Animated.View style={[styles.interruptCard, { opacity: reflectionFade }]}>
        <View style={styles.reflectionIconRow}>
          <View style={[styles.reflectionIconWrap, { backgroundColor: '#D9E2EC' }]}>
            <RotateCcw size={16} color="#14B8A6" />
          </View>
          <Text style={styles.reflectionTitle}>Where to interrupt next time</Text>
        </View>
        <Text style={styles.interruptText}>{episode.interruptSuggestion}</Text>
      </Animated.View>

      {episode.emotions.length > 0 && (
        <View style={styles.chipSection}>
          <Text style={styles.chipSectionTitle}>Emotions</Text>
          <View style={styles.chipRow}>
            {episode.emotions.map(e => (
              <View key={e} style={styles.emotionChip}>
                <Text style={styles.emotionChipText}>{e}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {episode.triggers.length > 0 && (
        <View style={styles.chipSection}>
          <Text style={styles.chipSectionTitle}>Triggers</Text>
          <View style={styles.chipRow}>
            {episode.triggers.map(t => (
              <View key={t} style={styles.triggerChip}>
                <Text style={styles.triggerChipText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {episode.copingUsed.length > 0 && (
        <View style={styles.chipSection}>
          <Text style={styles.chipSectionTitle}>Coping used</Text>
          <View style={styles.chipRow}>
            {episode.copingUsed.map(c => (
              <View key={c} style={styles.copingChip}>
                <Shield size={10} color="#14B8A6" />
                <Text style={styles.copingChipText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function EmotionalTimelineReplayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { journalEntries, messageDrafts } = useApp();
  const { trackEvent } = useAnalytics();
  const [selectedEpisode, setSelectedEpisode] = useState<EmotionalEpisode | null>(null);

  useEffect(() => {
    trackEvent('emotional_timeline_viewed');
    trackEvent('screen_view', { screen: 'emotional_timeline' });
  }, [trackEvent]);

  const replayState = useMemo(
    () => buildEpisodeReplayState(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const handleSelectEpisode = useCallback((episode: EmotionalEpisode) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedEpisode(episode);
  }, []);

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedEpisode(null);
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={selectedEpisode ? handleBack : handleClose}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedEpisode ? 'Episode Replay' : 'Emotional Timeline'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {selectedEpisode ? (
          <EpisodeDetail episode={selectedEpisode} onBack={handleBack} />
        ) : (
          <>
            <View style={styles.introCard}>
              <Text style={styles.introText}>
                Review emotional episodes to understand how escalation unfolds — and where you might interrupt it next time.
              </Text>
              <PremiumInlinePrompt
                feature="emotional_timeline"
                message="Start membership for full emotional timeline replay and AI reflections."
              />
            </View>

            {replayState.episodes.length > 0 && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{replayState.recentEpisodeCount}</Text>
                  <Text style={styles.statLabel}>This week</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                    {replayState.highIntensityCount}
                  </Text>
                  <Text style={styles.statLabel}>High intensity</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#14B8A6' }]}>
                    {replayState.managedCount}
                  </Text>
                  <Text style={styles.statLabel}>Managed</Text>
                </View>
              </View>
            )}

            {replayState.topPattern && (
              <View style={styles.patternCard}>
                <TrendingUp size={14} color={Colors.accent} />
                <Text style={styles.patternText}>{replayState.topPattern}</Text>
              </View>
            )}

            {replayState.episodes.length === 0 ? (
              <View style={styles.emptyState}>
                <Activity size={48} color={Colors.border} />
                <Text style={styles.emptyTitle}>No episodes yet</Text>
                <Text style={styles.emptyDesc}>
                  As you use check-ins and journaling, emotional episodes will appear here for you to review.
                </Text>
              </View>
            ) : (
              replayState.episodes.map(episode => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  onPress={() => handleSelectEpisode(episode)}
                />
              ))
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  introCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  introText: {
    fontSize: 14,
    color: Colors.accent,
    lineHeight: 21,
    fontWeight: '500' as const,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
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
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  patternCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.accentLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  patternText: {
    flex: 1,
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  episodeCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  episodeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  episodeDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  episodeDateText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  episodeDuration: {
    fontSize: 11,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  outcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  outcomeBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  episodeDominantEmotion: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  episodeChainPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 4,
  },
  chainDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chainConnector: {
    width: 16,
    height: 2,
    backgroundColor: Colors.borderLight,
  },
  chainMoreText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 6,
    fontWeight: '600' as const,
  },
  episodeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  episodeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  episodeMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  episodeIntensityPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  episodeIntensityText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  relationshipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  relationshipBadgeText: {
    fontSize: 11,
    color: '#67E8F9',
    fontWeight: '600' as const,
  },
  episodeTapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 2,
  },
  episodeTapHintText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  detailContainer: {
    paddingBottom: 20,
  },
  detailHeader: {
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  backText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  detailHeaderInfo: {
    marginBottom: 10,
  },
  detailDate: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  detailTimeRange: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailSummaryRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  detailSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailSummaryValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  detailSummaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  detailSummaryDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  nodeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  nodeTrack: {
    width: 32,
    alignItems: 'center',
  },
  nodeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  nodeLine: {
    width: 2,
    flex: 1,
    marginTop: 3,
  },
  nodeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginLeft: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  nodeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nodeTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  nodeTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  nodeTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  nodeLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  nodeIntensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  nodeIntensityTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  nodeIntensityFill: {
    height: '100%',
    borderRadius: 2,
  },
  nodeIntensityText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  reflectionCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  reflectionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  reflectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  reflectionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  interruptCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  interruptText: {
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 22,
  },
  chipSection: {
    marginBottom: 14,
  },
  chipSectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emotionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  emotionChipText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600' as const,
  },
  triggerChip: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  triggerChipText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  copingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  copingChipText: {
    fontSize: 13,
    color: '#14B8A6',
    fontWeight: '600' as const,
  },
});
