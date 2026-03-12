import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, MessageCircle, Heart, X, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';

const CRISIS_RESOURCES = [
  {
    id: 'crisis-line',
    label: '988 Suicide & Crisis Lifeline',
    action: 'tel:988',
    desc: 'Call or text 24/7',
    icon: Phone,
    color: Colors.danger,
    bg: Colors.dangerLight,
  },
  {
    id: 'crisis-text',
    label: 'Crisis Text Line',
    action: 'sms:741741',
    desc: 'Text HOME to 741741',
    icon: MessageCircle,
    color: '#5B8FB9',
    bg: '#E3EFF7',
  },
];

export default function SafetyModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deactivateSafetyMode } = useApp();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: false,
        }),
      ])
    );
    breathe.start();

    return () => {
      pulse.stop();
      breathe.stop();
    };
  }, [fadeAnim, pulseAnim, breatheAnim]);

  const handleClose = useCallback(() => {
    deactivateSafetyMode();
    router.back();
  }, [deactivateSafetyMode, router]);

  const handleResource = useCallback((action: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    void Linking.openURL(action);
  }, []);

  const handleGrounding = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
    setTimeout(() => router.push('/exercise?id=c1'), 300);
  }, [router]);

  const breatheText = breatheAnim.interpolate({
    inputRange: [0, 0.4, 0.41, 1],
    outputRange: [1, 1, 1, 1],
  });

  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.1],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <X size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Shield size={32} color={Colors.safetyAccent} />
        </View>

        <Text style={styles.title}>You're in a hard moment</Text>
        <Text style={styles.subtitle}>
          This will pass. Let's keep you safe right now.
        </Text>

        <Animated.View
          style={[
            styles.breatheContainer,
            {
              transform: [{ scale: breatheScale }],
              opacity: breatheText,
            },
          ]}
        >
          <Animated.View style={[styles.breatheCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Heart size={28} color={Colors.white} fill={Colors.white} />
          </Animated.View>
          <Text style={styles.breatheLabel}>Breathe with me</Text>
          <Text style={styles.breatheInstruction}>
            In... 2... 3... 4... Hold... Out... 2... 3... 4... 5... 6
          </Text>
        </Animated.View>

        <View style={styles.resourcesSection}>
          <Text style={styles.resourcesTitle}>Reach out now</Text>
          {CRISIS_RESOURCES.map(resource => {
            const IconComponent = resource.icon;
            return (
              <TouchableOpacity
                key={resource.id}
                style={styles.resourceCard}
                onPress={() => handleResource(resource.action)}
                activeOpacity={0.7}
              >
                <View style={[styles.resourceIcon, { backgroundColor: resource.bg }]}>
                  <IconComponent size={22} color={resource.color} />
                </View>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceLabel}>{resource.label}</Text>
                  <Text style={styles.resourceDesc}>{resource.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.groundingButton}
          onPress={handleGrounding}
          activeOpacity={0.7}
        >
          <Text style={styles.groundingText}>Try a grounding exercise</Text>
        </TouchableOpacity>

        <Text style={styles.reminder}>
          You've survived every hard moment before this one.{'\n'}
          You will survive this one too.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.safetyBg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 23,
  },
  breatheContainer: {
    alignItems: 'center',
    marginVertical: 28,
  },
  breatheCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.safetyAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  breatheLabel: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  breatheInstruction: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  resourcesSection: {
    marginBottom: 20,
  },
  resourcesTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  resourceDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  groundingButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  groundingText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  reminder: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
