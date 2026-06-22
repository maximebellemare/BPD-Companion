import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { HeartCrack, X, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

interface Props {
  message: string;
  riskLevel: 'watchful' | 'rising' | 'urgent';
}

const BANNER_COLORS = {
  watchful: { bg: '#FFFFFF', border: '#D9E2EC', accent: '#67E8F9' },
  rising: { bg: '#FFFFFF', border: '#D9E2EC', accent: '#3B82F6' },
  urgent: { bg: '#FFFFFF', border: '#D9E2EC', accent: '#3B82F6' },
};

export default React.memo(function SpiralMessageBanner({ message, riskLevel }: Props) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleDismiss = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setDismissed(true);
    });
  }, [fadeAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/relationship-spiral' as never);
  }, [router]);

  if (dismissed) return null;

  const colors = BANNER_COLORS[riskLevel];

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.banner, { backgroundColor: colors.bg, borderColor: colors.border }]}
        onPress={handlePress}
        activeOpacity={0.85}
        testID="spiral-message-banner"
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.accent + '14' }]}>
          <HeartCrack size={15} color={colors.accent} />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.label, { color: colors.accent }]}>Relationship Signal</Text>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </View>
        <ChevronRight size={14} color={colors.accent} style={{ opacity: 0.5 }} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dismissBtn}
        onPress={handleDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={12} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 10,
    paddingRight: 28,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  dismissBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
