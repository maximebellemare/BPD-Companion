import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Sparkles, Shield, Brain, MessageCircle, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface AICompanionOnboardingProps {
  onDismiss: () => void;
}

const FEATURES = [
  {
    icon: <MessageCircle size={16} color={Colors.primary} />,
    text: 'Reflect and slow down with supportive conversations',
  },
  {
    icon: <Brain size={16} color="#3B82F6" />,
    text: 'Get insights based on your patterns and check-ins',
  },
  {
    icon: <Shield size={16} color={Colors.success} />,
    text: 'A safe, private space — never judging, always here',
  },
];

export default React.memo(function AICompanionOnboarding({ onDismiss }: AICompanionOnboardingProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleDismiss = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [fadeAnim, slideAnim, onDismiss]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={handleDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.iconRow}>
        <View style={styles.iconCircle}>
          <Sparkles size={20} color={Colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>Welcome to AI Companion</Text>
      <Text style={styles.subtitle}>
        A calm space designed to help you reflect, understand your emotions, and get personalized support.
      </Text>

      <View style={styles.featuresList}>
        {FEATURES.map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>{feature.icon}</View>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={handleDismiss}
        activeOpacity={0.8}
        testID="onboarding-dismiss-btn"
      >
        <Text style={styles.ctaText}>Got it</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.accentLight,
    position: 'relative' as const,
  },
  dismissButton: {
    position: 'absolute' as const,
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 149, 106, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 1,
  },
  iconRow: {
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: {
    fontSize: 19,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 21,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  featuresList: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center' as const,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
