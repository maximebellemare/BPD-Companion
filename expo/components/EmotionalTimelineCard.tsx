import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, ChevronRight, TrendingUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { EpisodeReplayState } from '@/types/emotionalEpisode';

interface Props {
  replayState: EpisodeReplayState;
}

export default React.memo(function EmotionalTimelineCard({ replayState }: Props) {
  const router = useRouter();

  const hasEpisodes = replayState.episodes.length > 0;
  const latestEpisode = hasEpisodes ? replayState.episodes[0] : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/emotional-timeline')}
      activeOpacity={0.7}
      testID="emotional-timeline-card"
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Activity size={18} color="#14B8A6" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Emotional Timeline</Text>
          <Text style={styles.subtitle}>
            {hasEpisodes
              ? `${replayState.episodes.length} episode${replayState.episodes.length !== 1 ? 's' : ''} recorded`
              : 'Replay emotional episodes step-by-step'}
          </Text>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </View>

      {hasEpisodes && (
        <View style={styles.body}>
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{replayState.recentEpisodeCount}</Text>
              <Text style={styles.statPillLabel}>this week</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.statPillValue, { color: '#3B82F6' }]}>{replayState.highIntensityCount}</Text>
              <Text style={[styles.statPillLabel, { color: '#3B82F6' }]}>high intensity</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.statPillValue, { color: '#14B8A6' }]}>{replayState.managedCount}</Text>
              <Text style={[styles.statPillLabel, { color: '#14B8A6' }]}>managed</Text>
            </View>
          </View>

          {replayState.topPattern && (
            <View style={styles.patternRow}>
              <TrendingUp size={12} color={Colors.accent} />
              <Text style={styles.patternText} numberOfLines={1}>{replayState.topPattern}</Text>
            </View>
          )}

          {latestEpisode && (
            <View style={styles.latestRow}>
              <Text style={styles.latestLabel}>Latest:</Text>
              <Text style={styles.latestEmotion} numberOfLines={1}>{latestEpisode.dominantEmotion}</Text>
              <View style={styles.latestChainPreview}>
                {latestEpisode.nodes.slice(0, 4).map((node, idx) => (
                  <React.Fragment key={node.id}>
                    <View style={[styles.chainDot, { backgroundColor: node.color }]} />
                    {idx < Math.min(latestEpisode.nodes.length - 1, 3) && (
                      <View style={styles.chainLine} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#D9E2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  body: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
  statPillLabel: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontWeight: '500' as const,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  patternText: {
    flex: 1,
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  latestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  latestLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  latestEmotion: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
    maxWidth: 100,
  },
  latestChainPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chainDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chainLine: {
    width: 10,
    height: 2,
    backgroundColor: Colors.borderLight,
  },
});
