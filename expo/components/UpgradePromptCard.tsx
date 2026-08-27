import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

export default function UpgradePromptCard() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  useLanguage();
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/upgrade');
  }, [router]);

  if (isPremium) return null;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  return (
    <Animated.View style={[styles.container, { opacity: glowOpacity }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.8}
        testID="upgrade-prompt-card"
      >
        <View style={styles.left}>
          <View style={styles.iconWrap}>
            <Crown size={20} color="#67E8F9" />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{localizedText('Membership access', 'Acceso de membresía')}</Text>
            <Text style={styles.subtitle}>{localizedText('Start your free trial', 'Inicia tu prueba gratis')}</Text>
          </View>
        </View>
        <View style={styles.arrowWrap}>
          <ArrowRight size={16} color="#67E8F9" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  card: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D9E2EC',
  },
  left: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },
});
