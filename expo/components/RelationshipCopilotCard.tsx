import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { HeartHandshake, ChevronRight, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

interface Props {
  shouldShow: boolean;
  relationshipTriggerCount: number;
  recentDraftCount: number;
  lastSessionLabel?: string | null;
}

export default React.memo(function RelationshipCopilotCard({
  shouldShow,
  relationshipTriggerCount,
  recentDraftCount,
  lastSessionLabel,
}: Props) {
  useLanguage();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (shouldShow) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [shouldShow, fadeAnim, slideAnim, pulseAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/relationship-copilot' as never);
  }, [router]);

  if (!shouldShow) return null;

  const contextLine = relationshipTriggerCount > 0
    ? localizedText(
      `${relationshipTriggerCount} relationship trigger${relationshipTriggerCount !== 1 ? 's' : ''} this week`,
      `${relationshipTriggerCount} disparador${relationshipTriggerCount !== 1 ? 'es' : ''} relacional${relationshipTriggerCount !== 1 ? 'es' : ''} esta semana`,
    )
    : recentDraftCount >= 2
      ? localizedText(
        `${recentDraftCount} messages drafted recently`,
        `${recentDraftCount} mensajes redactados recientemente`,
      )
      : localizedText('Get support for a relationship moment', 'Recibe apoyo para un momento relacional');

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
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.8}
        testID="relationship-copilot-card"
      >
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <HeartHandshake size={20} color="#3B82F6" />
          </View>
          <View style={styles.textContent}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{localizedText('Relationship Copilot', 'Copiloto relacional')}</Text>
              <View style={styles.premiumBadge}>
                <Shield size={9} color={Colors.white} />
                <Text style={styles.premiumText}>MEMBER</Text>
              </View>
            </View>
            <Text style={styles.subtitle} numberOfLines={2}>
              {lastSessionLabel
                ? localizedText('Continue getting support for relationship triggers', 'Sigue recibiendo apoyo con disparadores relacionales')
                : localizedText('Slow down before reacting to a relationship moment', 'Baja la velocidad antes de reaccionar en un momento relacional')}
            </Text>
          </View>
          <ChevronRight size={16} color="#3B82F6" style={{ opacity: 0.6 }} />
        </View>

        <View style={styles.contextRow}>
          <View style={styles.contextDot} />
          <Text style={styles.contextText}>{contextLine}</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#3B82F6',
    letterSpacing: -0.1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#D9E2EC',
    gap: 8,
  },
  contextDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    opacity: 0.5,
  },
  contextText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
