import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Repeat, X, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { ActiveLoopSignal } from '@/types/emotionalLoop';

interface Props {
  signals: ActiveLoopSignal[];
}

export default React.memo(function ActiveLoopBanner({ signals }: Props) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-8)).current;
  const [dismissed, setDismissed] = useState<boolean>(false);

  const topSignal = signals[0] ?? null;

  useEffect(() => {
    if (topSignal) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [topSignal, fadeAnim, slideAnim]);

  const handlePress = useCallback(() => {
    if (!topSignal) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(topSignal.suggestedRoute as never);
  }, [topSignal, router]);

  const handleDismiss = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setDismissed(true);
    });
  }, [fadeAnim]);

  if (!topSignal || dismissed) return null;

  const confidenceColor = topSignal.confidence >= 0.6 ? '#3B82F6' : '#67E8F9';

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.banner, { borderColor: confidenceColor + '30' }]}
        onPress={handlePress}
        activeOpacity={0.8}
        testID="active-loop-banner"
      >
        <View style={[styles.iconWrap, { backgroundColor: confidenceColor + '14' }]}>
          <Repeat size={15} color={confidenceColor} />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.label, { color: confidenceColor }]}>Familiar Pattern</Text>
          <Text style={styles.message} numberOfLines={2}>{topSignal.message}</Text>
        </View>
        <ChevronRight size={14} color={confidenceColor} style={{ opacity: 0.5 }} />
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
    marginBottom: 12,
    position: 'relative',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
