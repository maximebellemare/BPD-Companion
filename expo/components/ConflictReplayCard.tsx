import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { RotateCcw, ChevronRight, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

interface ConflictReplayCardProps {
  eventCount: number;
  latestTrigger?: string;
  latestOutcome?: string;
}

export default React.memo(function ConflictReplayCard({
  eventCount,
  latestTrigger,
  latestOutcome,
}: ConflictReplayCardProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/conflict-replay' as never);
  }, [router]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.8}
        testID="conflict-replay-card"
      >
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <RotateCcw size={20} color="#6366F1" />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Conflict Replay</Text>
            <Text style={styles.subtitle}>
              {eventCount > 0
                ? `${eventCount} moment${eventCount !== 1 ? 's' : ''} to learn from`
                : 'Review past emotional conflicts'}
            </Text>
          </View>
          <ChevronRight size={16} color="#6366F1" style={{ opacity: 0.6 }} />
        </View>

        {latestTrigger && (
          <View style={styles.previewRow}>
            <Clock size={12} color={Colors.textMuted} />
            <Text style={styles.previewText} numberOfLines={1}>
              Latest: {latestTrigger}
              {latestOutcome ? ` → ${latestOutcome}` : ''}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  card: {
    backgroundColor: '#F0F0FF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E0E0F6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E8E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#4338CA',
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0F6',
  },
  previewText: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
});
