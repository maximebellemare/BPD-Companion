import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Anchor,
  Wind,
  BookOpen,
  Sparkles,
  Timer,
  Shield,
  HeartHandshake,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { SpiralDetectionResult, SpiralIntervention } from '@/types/spiral';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Anchor,
  Wind,
  BookOpen,
  Sparkles,
  Timer,
  Shield,
  HeartHandshake,
  PenLine: BookOpen,
  ArrowRight: ChevronRight,
};

interface SpiralInterventionCardProps {
  result: SpiralDetectionResult;
  compact?: boolean;
}

function SpiralInterventionCardInner({ result, compact = false }: SpiralInterventionCardProps) {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (result.shouldIntervene) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();

      if (Platform.OS !== 'web' && result.riskLevel === 'high') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      trackEvent('spiral_risk_detected', {
        risk_level: result.riskLevel,
        signal_count: result.signals.length,
        confidence: Math.round(result.confidenceScore * 100),
      });
    }
  }, [result.shouldIntervene, result.riskLevel, result.signals.length, result.confidenceScore, fadeAnim, slideAnim, trackEvent]);

  const handleIntervention = useCallback((intervention: SpiralIntervention) => {
    trackEvent('spiral_intervention_used', {
      intervention_type: intervention.type,
      intervention_id: intervention.id,
      risk_level: result.riskLevel,
    });
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(intervention.route as never);
  }, [result.riskLevel, router, trackEvent]);

  if (!result.shouldIntervene) return null;

  const isHigh = result.riskLevel === 'high';
  const isModerate = result.riskLevel === 'moderate';

  const bgColor = isHigh ? '#020617' : isModerate ? '#2E2A72' : Colors.card;
  const borderColor = isHigh ? Colors.danger + '40' : isModerate ? Colors.accent + '30' : Colors.border;
  const accentColor = isHigh ? Colors.danger : Colors.accent;

  if (compact) {
    const topIntervention = result.suggestedAction;
    return (
      <Animated.View
        style={[
          styles.compactContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }], backgroundColor: bgColor, borderColor },
        ]}
      >
        <View style={styles.compactHeader}>
          <View style={[styles.compactDot, { backgroundColor: accentColor }]} />
          <Text style={[styles.compactTitle, { color: accentColor }]}>
            {isHigh ? 'Spiral risk detected' : 'Emotional intensity rising'}
          </Text>
        </View>
        {result.narrative && (
          <Text style={styles.compactNarrative} numberOfLines={2}>{result.narrative}</Text>
        )}
        {topIntervention && (
          <TouchableOpacity
            style={[styles.compactAction, { backgroundColor: accentColor + '18' }]}
            onPress={() => handleIntervention(topIntervention)}
            activeOpacity={0.7}
            testID="spiral-compact-action"
          >
            <Text style={[styles.compactActionText, { color: accentColor }]}>
              {topIntervention.title}
            </Text>
            <ChevronRight size={16} color={accentColor} />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  const topInterventions = result.interventions.slice(0, 3);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }], backgroundColor: bgColor, borderColor },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
          <AlertTriangle size={20} color={accentColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: isHigh ? '#FFFFFF' : Colors.text }]}>
            {isHigh ? 'High emotional intensity' : 'Something may be building'}
          </Text>
          <Text style={[styles.subtitle, { color: isHigh ? 'rgba(255,255,255,0.6)' : Colors.textSecondary }]}>
            {result.signals.length} pattern{result.signals.length !== 1 ? 's' : ''} detected
          </Text>
        </View>
      </View>

      {result.narrative && (
        <Text style={[styles.narrative, { color: isHigh ? 'rgba(255,255,255,0.75)' : Colors.textSecondary }]}>
          {result.narrative}
        </Text>
      )}

      <View style={styles.interventions}>
        {topInterventions.map((intervention) => {
          const IconComp = ICON_MAP[intervention.icon] ?? Anchor;
          return (
            <TouchableOpacity
              key={intervention.id}
              style={[styles.interventionRow, { backgroundColor: isHigh ? 'rgba(255,255,255,0.08)' : Colors.surface }]}
              onPress={() => handleIntervention(intervention)}
              activeOpacity={0.7}
              testID={`spiral-intervention-${intervention.id}`}
            >
              <View style={[styles.interventionIcon, { backgroundColor: accentColor + '18' }]}>
                <IconComp size={18} color={accentColor} />
              </View>
              <View style={styles.interventionText}>
                <Text style={[styles.interventionTitle, { color: isHigh ? '#FFFFFF' : Colors.text }]}>
                  {intervention.title}
                </Text>
                <Text style={[styles.interventionDesc, { color: isHigh ? 'rgba(255,255,255,0.5)' : Colors.textMuted }]}>
                  {intervention.description}
                </Text>
              </View>
              <ChevronRight size={16} color={isHigh ? 'rgba(255,255,255,0.3)' : Colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const SpiralInterventionCard = React.memo(SpiralInterventionCardInner);
export default SpiralInterventionCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  narrative: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  interventions: {
    gap: 8,
  },
  interventionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  interventionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interventionText: {
    flex: 1,
  },
  interventionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 1,
  },
  interventionDesc: {
    fontSize: 12,
  },
  compactContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  compactNarrative: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 19,
    marginBottom: 10,
  },
  compactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  compactActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
