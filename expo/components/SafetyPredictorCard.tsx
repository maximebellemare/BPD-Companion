import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { SafetyPrediction, SafetyState, SafetyIntervention } from '@/types/safetyPredictor';

interface SafetyPredictorCardProps {
  prediction: SafetyPrediction;
}

const STATE_CONFIG: Record<SafetyState, {
  label: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  iconColor: string;
  tagBg: string;
  tagText: string;
}> = {
  calm: {
    label: 'Calm',
    bgColor: Colors.successLight,
    borderColor: Colors.success,
    accentColor: Colors.success,
    iconColor: Colors.success,
    tagBg: Colors.successLight,
    tagText: Colors.success,
  },
  elevated: {
    label: 'Elevated',
    bgColor: '#FFF8E1',
    borderColor: '#FFB74D',
    accentColor: '#F57C00',
    iconColor: '#F57C00',
    tagBg: '#FFF3E0',
    tagText: '#E65100',
  },
  high_distress: {
    label: 'High Distress',
    bgColor: '#FFF3E0',
    borderColor: '#FF7043',
    accentColor: Colors.danger,
    iconColor: Colors.danger,
    tagBg: Colors.dangerLight,
    tagText: Colors.danger,
  },
  critical: {
    label: 'Critical',
    bgColor: '#FFEBEE',
    borderColor: Colors.dangerDark,
    accentColor: Colors.dangerDark,
    iconColor: Colors.dangerDark,
    tagBg: '#FFCDD2',
    tagText: Colors.dangerDark,
  },
};

function StateIcon({ state, size }: { state: SafetyState; size: number }) {
  const color = STATE_CONFIG[state].iconColor;
  switch (state) {
    case 'critical':
      return <ShieldAlert size={size} color={color} />;
    case 'high_distress':
      return <AlertTriangle size={size} color={color} />;
    case 'elevated':
      return <Activity size={size} color={color} />;
    default:
      return <ShieldCheck size={size} color={color} />;
  }
}

function InterventionButton({ intervention }: { intervention: SafetyIntervention }) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log('[SafetyPredictor] Intervention tapped:', intervention.type);
    router.push(intervention.route as never);
  }, [intervention, router]);

  const urgencyColor = intervention.urgency === 'critical'
    ? Colors.dangerDark
    : intervention.urgency === 'high_distress'
      ? Colors.danger
      : intervention.urgency === 'elevated'
        ? '#F57C00'
        : Colors.primary;

  return (
    <TouchableOpacity
      style={[styles.interventionBtn, { borderColor: urgencyColor + '30' }]}
      onPress={handlePress}
      activeOpacity={0.7}
      testID={`safety-intervention-${intervention.type}`}
    >
      <View style={[styles.interventionDot, { backgroundColor: urgencyColor }]} />
      <View style={styles.interventionContent}>
        <Text style={styles.interventionTitle}>{intervention.title}</Text>
        <Text style={styles.interventionDesc} numberOfLines={1}>{intervention.description}</Text>
      </View>
      <ChevronRight size={14} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const MemoInterventionButton = React.memo(InterventionButton);

export default React.memo(function SafetyPredictorCard({ prediction }: SafetyPredictorCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const config = STATE_CONFIG[prediction.state];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (prediction.state === 'critical' || prediction.state === 'high_distress') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [prediction.state, pulseAnim]);

  if (prediction.state === 'calm') return null;

  const trendLabel = prediction.trend === 'escalating'
    ? 'Escalating'
    : prediction.trend === 'de_escalating'
      ? 'De-escalating'
      : prediction.trend === 'stable'
        ? 'Holding steady'
        : null;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
        },
      ]}
      testID="safety-predictor-card"
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <StateIcon state={prediction.state} size={22} />
          <View style={styles.headerText}>
            <View style={styles.labelRow}>
              <Text style={[styles.stateLabel, { color: config.accentColor }]}>
                {config.label}
              </Text>
              {trendLabel && (
                <View style={[styles.trendTag, { backgroundColor: config.tagBg }]}>
                  <Text style={[styles.trendText, { color: config.tagText }]}>
                    {trendLabel}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.signalCount}>
              {prediction.signals.length} signal{prediction.signals.length !== 1 ? 's' : ''} detected
            </Text>
          </View>
        </View>

        <View style={[styles.scoreCircle, { borderColor: config.accentColor }]}>
          <Text style={[styles.scoreText, { color: config.accentColor }]}>
            {prediction.score}
          </Text>
        </View>
      </View>

      {prediction.narrative && (
        <Text style={styles.narrative}>{prediction.narrative}</Text>
      )}

      {prediction.signals.length > 0 && (
        <View style={styles.signalList}>
          {prediction.signals.slice(0, 3).map(signal => (
            <View key={signal.id} style={styles.signalRow}>
              <View style={[styles.signalDot, { backgroundColor: config.accentColor }]} />
              <Text style={styles.signalLabel} numberOfLines={1}>{signal.label}</Text>
            </View>
          ))}
        </View>
      )}

      {prediction.interventions.length > 0 && (
        <View style={styles.interventions}>
          <Text style={styles.interventionsTitle}>Recommended right now</Text>
          {prediction.interventions.slice(0, 3).map(intervention => (
            <MemoInterventionButton key={intervention.id} intervention={intervention} />
          ))}
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateLabel: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  trendTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  signalCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scoreCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  narrative: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginTop: 14,
    fontStyle: 'italic',
  },
  signalList: {
    marginTop: 14,
    gap: 6,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  signalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  interventions: {
    marginTop: 16,
    gap: 8,
  },
  interventionsTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  interventionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 10,
  },
  interventionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  interventionContent: {
    flex: 1,
  },
  interventionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  interventionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
