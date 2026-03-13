import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface ReflectionMirrorCardProps {
  hasEnoughData: boolean;
  topTheme: string | null;
  growthCount: number;
}

export default function ReflectionMirrorCard({
  hasEnoughData,
  topTheme,
  growthCount,
}: ReflectionMirrorCardProps) {
  const router = useRouter();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/reflection-mirror');
  };

  const glowOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.18],
  });

  const subtitle = hasEnoughData && topTheme
    ? `${topTheme} has been a recurring theme`
    : 'See compassionate reflections about your patterns';

  const detail = hasEnoughData && growthCount > 0
    ? `${growthCount} growth signal${growthCount !== 1 ? 's' : ''} detected`
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
      testID="reflection-mirror-card"
    >
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Sparkles size={20} color="#6B9080" />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Reflection Mirror</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
          {detail && <Text style={styles.detail}>{detail}</Text>}
        </View>
        <ChevronRight size={18} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6B9080',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E8F0ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  detail: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500' as const,
    marginTop: 3,
  },
});
