import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { HeartCrack, ChevronRight, Shield, Timer, Anchor } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { SpiralRiskLevel, SpiralSignal, SpiralIntervention } from '@/types/relationshipPrediction';

interface Props {
  riskLevel: SpiralRiskLevel;
  message: string | null;
  supportMessage: string | null;
  signals: SpiralSignal[];
  interventions: SpiralIntervention[];
  score: number;
}

const RISK_THEME: Record<SpiralRiskLevel, { bg: string; border: string; accent: string; label: string }> = {
  calm: { bg: Colors.white, border: Colors.border, accent: Colors.primary, label: 'Calm' },
  watchful: { bg: '#FFFFFF', border: '#0B1238', accent: '#67E8F9', label: 'Watchful' },
  rising: { bg: '#FFFFFF', border: '#0B1238', accent: '#3B82F6', label: 'Rising' },
  urgent: { bg: '#FFFFFF', border: '#0B1238', accent: '#3B82F6', label: 'Needs attention' },
};

const ICON_MAP: Record<string, typeof Timer> = {
  Timer,
  Anchor,
  Shield,
};

export default React.memo(function RelationshipSpiralCard({
  riskLevel,
  message,
  supportMessage,
  signals,
  interventions,
  score: _score,
}: Props) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (riskLevel !== 'calm') {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();

      if (riskLevel === 'urgent' || riskLevel === 'rising') {
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.04, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          ])
        );
        pulse.start();
        return () => pulse.stop();
      }
    }
  }, [riskLevel, fadeAnim, slideAnim, pulseAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/relationship-spiral' as never);
  }, [router]);

  const handleIntervention = useCallback((route: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as never);
  }, [router]);

  if (riskLevel === 'calm' || !message) return null;

  const theme = RISK_THEME[riskLevel];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}
        onPress={handlePress}
        activeOpacity={0.8}
        testID="relationship-spiral-card"
      >
        <View style={styles.headerRow}>
          <View style={[styles.iconCircle, { backgroundColor: theme.accent + '14' }]}>
            <HeartCrack size={18} color={theme.accent} />
          </View>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: theme.accent }]}>Relationship Signal</Text>
              <View style={[styles.riskBadge, { backgroundColor: theme.accent + '18' }]}>
                <Text style={[styles.riskBadgeText, { color: theme.accent }]}>{theme.label}</Text>
              </View>
            </View>
            <Text style={styles.message} numberOfLines={3}>{message}</Text>
          </View>
          <ChevronRight size={16} color={theme.accent} style={{ opacity: 0.6 }} />
        </View>

        {supportMessage && (
          <View style={styles.supportRow}>
            <Text style={styles.supportText}>{supportMessage}</Text>
          </View>
        )}

        {interventions.length > 0 && (
          <View style={styles.interventionsRow}>
            {interventions.slice(0, 2).map(intervention => {
              const IconComp = ICON_MAP[intervention.icon];
              return (
                <TouchableOpacity
                  key={intervention.id}
                  style={styles.interventionChip}
                  onPress={() => handleIntervention(intervention.route)}
                  activeOpacity={0.7}
                >
                  {IconComp ? (
                    <IconComp size={13} color={Colors.primary} />
                  ) : null}
                  <Text style={styles.interventionLabel}>{intervention.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.signalDotsRow}>
          {signals.slice(0, 4).map((signal) => (
            <View
              key={signal.id}
              style={[
                styles.signalDot,
                { backgroundColor: theme.accent, opacity: 0.3 + (signal.strength / 5) * 0.7 },
              ]}
            />
          ))}
          <Text style={styles.tapHint}>Tap to see full analysis</Text>
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
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: -0.1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  supportRow: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    padding: 12,
  },
  supportText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  interventionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  interventionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  interventionLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  signalDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tapHint: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    color: Colors.textMuted,
  },
});
