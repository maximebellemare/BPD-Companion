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
  Shield,
  Heart,
  Wind,
  BookOpen,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useEmotionalContext, Intervention } from '@/providers/EmotionalContextProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';

const CATEGORY_STYLE: Record<Intervention['category'], {
  icon: typeof Heart;
  bg: string;
  border: string;
  accent: string;
}> = {
  crisis: { icon: Shield, bg: '#FFF0ED', border: '#FDCFCA', accent: '#C94438' },
  relationship: { icon: Heart, bg: '#FFF5EE', border: '#FDCFB8', accent: '#D4764E' },
  regulation: { icon: Wind, bg: '#F0F7F3', border: '#D4E8DC', accent: '#6B9080' },
  reflection: { icon: BookOpen, bg: '#F5F0FF', border: '#DDD0F5', accent: '#7C5CB8' },
  growth: { icon: Sparkles, bg: '#FFF9F0', border: '#F5E6D8', accent: '#C8975A' },
};

export default React.memo(function NextInterventionCard() {
  const router = useRouter();
  const { bestNextIntervention, zone } = useEmotionalContext();
  const { trackEvent } = useAnalytics();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const style = CATEGORY_STYLE[bestNextIntervention.category];
  const IconComp = style.icon;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    trackEvent('next_intervention_tapped', {
      label: bestNextIntervention.label,
      category: bestNextIntervention.category,
      zone,
    });
    router.push(bestNextIntervention.route as never);
  }, [router, bestNextIntervention, zone, trackEvent]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: style.bg, borderColor: style.border }]}
        onPress={handlePress}
        activeOpacity={0.8}
        testID="next-intervention-card"
      >
        <Animated.View style={[styles.glowDot, { backgroundColor: style.accent, opacity: glowOpacity }]} />
        <View style={[styles.iconWrap, { backgroundColor: style.accent + '18' }]}>
          <IconComp size={22} color={style.accent} />
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>Suggested next step</Text>
          <Text style={styles.title}>{bestNextIntervention.label}</Text>
          <Text style={styles.reason}>{bestNextIntervention.reason}</Text>
        </View>
        <View style={[styles.arrowWrap, { backgroundColor: style.accent }]}>
          <ArrowRight size={16} color={Colors.white} />
        </View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  card: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  glowDot: {
    position: 'absolute' as const,
    top: 16,
    left: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  reason: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  arrowWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
