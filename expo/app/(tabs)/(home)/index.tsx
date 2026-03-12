import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Heart, Wind, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { VALIDATION_MESSAGES } from '@/constants/data';
import { useApp } from '@/providers/AppProvider';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { journalEntries } = useApp();
  const [validationIndex, setValidationIndex] = useState<number>(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const validationFade = useRef(new Animated.Value(1)).current;
  const buttonGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    );
    breatheLoop.start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlow, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlow, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    return () => {
      breatheLoop.stop();
      glowLoop.stop();
    };
  }, [breatheAnim, fadeAnim, buttonGlow]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(validationFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setValidationIndex(prev => (prev + 1) % VALIDATION_MESSAGES.length);
        Animated.timing(validationFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [validationFade]);

  const handleTriggered = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    router.push('/check-in');
  }, [pulseAnim, router]);

  const handleSafetyMode = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    router.push('/safety-mode');
  }, [router]);

  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const breatheOpacity = breatheAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  const glowOpacity = buttonGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  const recentCount = journalEntries.filter(
    e => Date.now() - e.timestamp < 7 * 24 * 60 * 60 * 1000
  ).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.greeting}>Steady</Text>
          <Text style={styles.subtitle}>You're here. That matters.</Text>
        </Animated.View>

        <Animated.View style={[styles.validationCard, { opacity: fadeAnim }]}>
          <Animated.Text style={[styles.validationText, { opacity: validationFade }]}>
            {VALIDATION_MESSAGES[validationIndex]}
          </Animated.Text>
        </Animated.View>

        <View style={styles.mainButtonContainer}>
          <Animated.View
            style={[
              styles.breatheRing,
              {
                transform: [{ scale: breatheScale }],
                opacity: breatheOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.glowRing,
              { opacity: glowOpacity },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.triggeredButton}
              onPress={handleTriggered}
              activeOpacity={0.85}
              testID="triggered-button"
            >
              <Heart size={28} color={Colors.white} fill={Colors.white} />
              <Text style={styles.triggeredText}>I'm triggered{'\n'}right now</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Text style={styles.mainButtonHint}>
          Tap to start a guided check-in
        </Text>

        <Animated.View style={[styles.quickActions, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={handleSafetyMode}
            activeOpacity={0.7}
            testID="safety-mode-button"
          >
            <View style={[styles.quickIconWrap, { backgroundColor: Colors.dangerLight }]}>
              <Shield size={20} color={Colors.danger} />
            </View>
            <Text style={styles.quickActionLabel}>Safety Mode</Text>
            <Text style={styles.quickActionDesc}>High distress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/exercise?id=c1')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: Colors.primaryLight }]}>
              <Wind size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Breathe</Text>
            <Text style={styles.quickActionDesc}>Quick calm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/exercise?id=c5')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: Colors.accentLight }]}>
              <Sparkles size={20} color={Colors.accent} />
            </View>
            <Text style={styles.quickActionLabel}>Reality Check</Text>
            <Text style={styles.quickActionDesc}>Check facts</Text>
          </TouchableOpacity>
        </Animated.View>

        {recentCount > 0 && (
          <Animated.View style={[styles.insightCard, { opacity: fadeAnim }]}>
            <Text style={styles.insightTitle}>This week</Text>
            <Text style={styles.insightValue}>{recentCount} check-in{recentCount !== 1 ? 's' : ''}</Text>
            <Text style={styles.insightDesc}>
              Every check-in is an act of self-awareness.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    marginTop: 16,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  validationCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  validationText: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '500' as const,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mainButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
    height: 200,
  },
  breatheRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary,
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary,
  },
  triggeredButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  triggeredText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  mainButtonHint: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: -16,
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  quickActionDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  insightValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginTop: 4,
  },
  insightDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
