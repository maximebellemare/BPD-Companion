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
  Wind,
  Anchor,
  BookOpen,
  Heart,
  RefreshCw,
  Search,
  MessageCircle,
  Timer,
  ChevronRight,
  Lightbulb,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { CopingRecommendation } from '@/types/recommendation';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Wind,
  Anchor,
  BookOpen,
  Heart,
  RefreshCw,
  Search,
  MessageCircle,
  Timer,
};

const PRIORITY_COLORS: Record<string, { bg: string; accent: string; border: string }> = {
  high: { bg: '#FFFFFF', accent: Colors.danger, border: '#0B1238' },
  medium: { bg: Colors.warmGlow, accent: Colors.accent, border: Colors.accentLight },
  low: { bg: Colors.primaryLight, accent: Colors.primary, border: '#0B1238' },
};

interface SmartCopingCardProps {
  recommendations: CopingRecommendation[];
  topRecommendation: CopingRecommendation | null;
}

function RecommendationRow({
  rec,
  index,
}: {
  rec: CopingRecommendation;
  index: number;
}) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(rec.route as never);
  }, [router, rec.route]);

  const IconComponent = ICON_MAP[rec.icon] ?? Wind;
  const colors = PRIORITY_COLORS[rec.priority] ?? PRIORITY_COLORS.low;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={[styles.recRow, { borderColor: colors.border }]}
        onPress={handlePress}
        activeOpacity={0.7}
        testID={`rec-${rec.id}`}
      >
        <View style={[styles.recIconWrap, { backgroundColor: colors.bg }]}>
          <IconComponent size={18} color={colors.accent} />
        </View>
        <View style={styles.recContent}>
          <Text style={styles.recTitle}>{rec.title}</Text>
          <Text style={styles.recMessage} numberOfLines={2}>{rec.message}</Text>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SmartCopingCard({ recommendations, topRecommendation }: SmartCopingCardProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (!topRecommendation || recommendations.length === 0) {
    return null;
  }

  const handleTopPress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(topRecommendation.route as never);
  };

  const topColors = PRIORITY_COLORS[topRecommendation.priority] ?? PRIORITY_COLORS.low;
  const TopIcon = ICON_MAP[topRecommendation.icon] ?? Wind;
  const remaining = recommendations.slice(1, 4);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Lightbulb size={16} color={Colors.accent} />
          <Text style={styles.headerTitle}>Smart Suggestions</Text>
        </View>
        <Text style={styles.headerHint}>Based on your data</Text>
      </View>

      <TouchableOpacity
        style={[styles.topCard, { backgroundColor: topColors.bg, borderColor: topColors.border }]}
        onPress={handleTopPress}
        activeOpacity={0.8}
        testID="top-recommendation"
      >
        <View style={[styles.topIconWrap, { backgroundColor: topColors.accent + '18' }]}>
          <TopIcon size={22} color={topColors.accent} />
        </View>
        <View style={styles.topContent}>
          <Text style={styles.topTitle}>{topRecommendation.title}</Text>
          <Text style={styles.topMessage} numberOfLines={2}>
            {topRecommendation.message}
          </Text>
          <View style={styles.topReasonRow}>
            <View style={[styles.reasonDot, { backgroundColor: topColors.accent }]} />
            <Text style={styles.topReason}>{topRecommendation.reason}</Text>
          </View>
        </View>
        <View style={[styles.topArrow, { backgroundColor: topColors.accent }]}>
          <ChevronRight size={16} color={Colors.white} />
        </View>
      </TouchableOpacity>

      {remaining.length > 0 && (
        <View style={styles.moreSection}>
          {remaining.map((rec, i) => (
            <RecommendationRow key={rec.id} rec={rec} index={i} />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  headerHint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  topCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  topIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  topContent: {
    flex: 1,
    marginRight: 8,
  },
  topTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  topMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 6,
  },
  topReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reasonDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  topReason: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  topArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreSection: {
    gap: 8,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  recIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recContent: {
    flex: 1,
    marginRight: 8,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  recMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
