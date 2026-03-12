import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Repeat, ArrowRight, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { EmotionalLoopReport, LoopNodeType } from '@/types/emotionalLoop';

const NODE_DOT_COLORS: Record<LoopNodeType, string> = {
  trigger: '#C94438',
  emotion: '#7C3AED',
  urge: '#C8762A',
  behavior: '#0369A1',
  outcome: '#047857',
  coping: Colors.primaryDark,
};

interface Props {
  report: EmotionalLoopReport;
}

export default React.memo(function EmotionalLoopsCard({ report }: Props) {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const topLoop = report.triggerChains[0] ?? report.emotionChains[0] ?? report.behaviorChains[0];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/emotional-loops')}
      activeOpacity={0.7}
      testID="emotional-loops-card"
    >
      <View style={styles.headerRow}>
        <Animated.View style={[styles.iconWrap, { opacity: pulseAnim }]}>
          <Repeat size={18} color={Colors.accent} />
        </Animated.View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Emotional Loops</Text>
          <Text style={styles.subtitle}>
            {report.totalPatternsDetected > 0
              ? `${report.totalPatternsDetected} pattern${report.totalPatternsDetected !== 1 ? 's' : ''} detected`
              : 'Discover your patterns'}
          </Text>
        </View>
        <ChevronRight size={18} color={Colors.textMuted} />
      </View>

      {topLoop && topLoop.nodes.length >= 2 && (
        <View style={styles.previewChain}>
          {topLoop.nodes.slice(0, 4).map((node, idx) => (
            <React.Fragment key={node.id}>
              {idx > 0 && (
                <ArrowRight size={12} color={Colors.textMuted} style={styles.arrow} />
              )}
              <View style={styles.previewNode}>
                <View style={[styles.nodeDot, { backgroundColor: NODE_DOT_COLORS[node.type] }]} />
                <Text style={styles.nodeText} numberOfLines={1}>{node.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      )}

      {topLoop?.narrative ? (
        <Text style={styles.narrative} numberOfLines={2}>{topLoop.narrative}</Text>
      ) : (
        <Text style={styles.narrative}>Check in regularly to reveal emotional loops you can learn to interrupt.</Text>
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
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  previewChain: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 14,
    gap: 4,
  },
  arrow: {
    marginHorizontal: 2,
  },
  previewNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  nodeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  nodeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    maxWidth: 80,
  },
  narrative: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginTop: 10,
    fontStyle: 'italic',
  },
});
