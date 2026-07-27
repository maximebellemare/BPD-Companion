import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

interface MessageGuardCardProps {
  recentDraftCount: number;
}

export default function MessageGuardCard({ recentDraftCount }: MessageGuardCardProps) {
  useLanguage();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (recentDraftCount < 1) return null;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/message-guard');
        }}
        activeOpacity={0.7}
        testID="home-message-guard-card"
      >
        <View style={styles.iconContainer}>
          <Shield size={20} color={Colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{localizedText('Before you send', 'Antes de enviar')}</Text>
          <Text style={styles.description}>
            {localizedText(
              "You've been composing messages lately. Want to check how your next one may land?",
              'Has estado redactando mensajes últimamente. ¿Quieres revisar cómo podría sentirse el próximo?',
            )}
          </Text>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
