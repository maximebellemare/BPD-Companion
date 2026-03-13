import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { ShieldAlert, Wind, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { CrisisDetectionResult } from '@/types/crisis';

interface Props {
  detection: CrisisDetectionResult;
}

export default React.memo(function CrisisModeCard({ detection }: Props) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { shouldActivate, signals, severity, message } = detection;

  useEffect(() => {
    if (!shouldActivate || signals.length === 0) return;

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    if (severity >= 7) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [shouldActivate, signals.length, severity, fadeAnim, pulseAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/crisis-regulation');
  }, [router]);

  const handleCrisisMode = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    router.push('/crisis-mode');
  }, [router]);

  if (!shouldActivate || signals.length === 0) return null;

  const isUrgent = severity >= 7;
  const bgColor = isUrgent ? '#FFF0EE' : '#FFF5F0';
  const borderColor = isUrgent ? '#FDCFCA' : '#F5DDD4';
  const accentColor = isUrgent ? '#D63031' : '#E17055';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
        },
      ]}
      testID="crisis-mode-card"
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: bgColor, borderColor }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: accentColor + '15' }]}>
            <ShieldAlert size={22} color={accentColor} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: accentColor }]}>
              {isUrgent ? 'Crisis Mode Available' : 'Emotional Intensity Rising'}
            </Text>
            {message && (
              <Text style={styles.message} numberOfLines={2}>{message}</Text>
            )}
          </View>
          <ChevronRight size={16} color={accentColor} style={{ opacity: 0.5 }} />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionChip} onPress={handlePress} activeOpacity={0.7}>
            <Wind size={14} color={accentColor} />
            <Text style={[styles.actionChipText, { color: accentColor }]}>Regulate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={handleCrisisMode} activeOpacity={0.7}>
            <Text style={[styles.actionChipText, { color: accentColor }]}>Crisis Mode</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionChip} onPress={handlePress} activeOpacity={0.7}>
            <Text style={[styles.actionChipText, { color: accentColor }]}>Pause</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signalCount}>
          <Text style={styles.signalCountText}>
            {signals.length} signal{signals.length !== 1 ? 's' : ''} detected
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  signalCount: {
    alignItems: 'center',
  },
  signalCountText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
