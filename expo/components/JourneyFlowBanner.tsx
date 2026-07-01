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
  ArrowRight,
  Heart,
  Shield,
  MessageCircle,
  Clock,
  BookOpen,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useEmotionalContext, JourneyPhase } from '@/providers/EmotionalContextProvider';

const PHASE_CONFIG: Record<JourneyPhase, {
  icon: typeof Heart;
  bg: string;
  border: string;
  accent: string;
  accentBg: string;
} | null> = {
  idle: null,
  triggered: {
    icon: Heart,
    bg: '#FFFFFF',
    border: '#D9E2EC',
    accent: '#3B82F6',
    accentBg: '#3B82F614',
  },
  copilot_active: {
    icon: MessageCircle,
    bg: '#FFFFFF',
    border: '#D9E2EC',
    accent: '#3B82F6',
    accentBg: '#3B82F614',
  },
  regulating: {
    icon: Shield,
    bg: '#FFFFFF',
    border: '#D9E2EC',
    accent: '#3B82F6',
    accentBg: '#3B82F614',
  },
  composing: {
    icon: MessageCircle,
    bg: '#FFFFFF',
    border: '#D9E2EC',
    accent: '#14B8A6',
    accentBg: '#14B8A614',
  },
  awaiting_outcome: {
    icon: Clock,
    bg: '#FFFFFF',
    border: '#D9E2EC',
    accent: '#67E8F9',
    accentBg: '#67E8F914',
  },
  reflecting: {
    icon: BookOpen,
    bg: '#FFFFFF',
    border: '#D9E2EC',
    accent: '#3B82F6',
    accentBg: '#3B82F614',
  },
};

export default React.memo(function JourneyFlowBanner() {
  const router = useRouter();
  const { journeyPhase, journeyLabel, journeySuggestion } = useEmotionalContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  const config = PHASE_CONFIG[journeyPhase];

  useEffect(() => {
    if (config) {
      fadeAnim.setValue(0);
      slideAnim.setValue(16);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [config, fadeAnim, slideAnim, journeyPhase]);

  const handlePress = useCallback(() => {
    if (!journeySuggestion) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(journeySuggestion.route as never);
  }, [router, journeySuggestion]);

  const handleCompanion = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(tabs)/companion');
  }, [router]);

  if (!config || !journeyLabel || !journeySuggestion) return null;

  const IconComp = config.icon;

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
      <View style={[styles.card, { backgroundColor: config.bg, borderColor: config.border }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: config.accentBg }]}>
            <IconComp size={20} color={config.accent} />
          </View>
          <View style={styles.textContent}>
            <Text style={[styles.phaseLabel, { color: config.accent }]}>
              Current journey
            </Text>
            <Text style={styles.label}>{journeyLabel}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.primaryAction, { backgroundColor: config.accent }]}
            onPress={handlePress}
            activeOpacity={0.8}
            testID="journey-primary-action"
          >
            <Text style={styles.primaryActionText}>{journeySuggestion.label}</Text>
            <ArrowRight size={14} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={handleCompanion}
            activeOpacity={0.7}
          >
            <Sparkles size={14} color={config.accent} />
            <Text style={[styles.secondaryActionText, { color: config.accent }]}>
              Talk it through
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    gap: 14,
    marginBottom: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
  },
  phaseLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
