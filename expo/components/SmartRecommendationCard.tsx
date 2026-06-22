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
  Shield,
  Heart,
  Wind,
  BookOpen,
  MessageCircle,
  Timer,
  Anchor,
  Search,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Compass,
  FileText,
  Activity,
  Pill,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { SmartRecommendation, RecommendationUrgency } from '@/types/smartRecommendation';
import { useSmartRecommendations } from '@/hooks/useSmartRecommendations';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Shield,
  Heart,
  Wind,
  BookOpen,
  MessageCircle,
  Timer,
  Anchor,
  Search,
  RefreshCw,
  Sparkles,
  Compass,
  FileText,
  Activity,
  Pill,
};

const URGENCY_STYLE: Record<RecommendationUrgency, {
  bg: string;
  border: string;
  accent: string;
  label: string;
}> = {
  immediate: {
    bg: '#FFFFFF',
    border: '#D9E2EC',
    accent: '#3B82F6',
    label: 'Right now',
  },
  suggested: {
    bg: '#FFFFFF',
    border: '#D9E2EC',
    accent: '#67E8F9',
    label: 'This may help',
  },
  gentle: {
    bg: '#FFFFFF',
    border: '#D9E2EC',
    accent: '#14B8A6',
    label: 'A useful next step',
  },
};

function RecommendationItem({
  rec,
  index,
  onPress,
}: {
  rec: SmartRecommendation;
  index: number;
  onPress: (rec: SmartRecommendation) => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(rec);
  }, [rec, onPress]);

  const IconComp = ICON_MAP[rec.icon] ?? Compass;
  const style = URGENCY_STYLE[rec.urgency];

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={[styles.itemRow, { borderColor: style.border }]}
        onPress={handlePress}
        activeOpacity={0.7}
        testID={`smart-rec-${rec.toolId}`}
      >
        <View style={[styles.itemIcon, { backgroundColor: style.bg }]}>
          <IconComp size={16} color={style.accent} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{rec.title}</Text>
          <Text style={styles.itemMessage} numberOfLines={1}>{rec.message}</Text>
        </View>
        <ChevronRight size={14} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const SmartRecommendationCard = React.memo(function SmartRecommendationCard() {
  const router = useRouter();
  const {
    recommendations,
    topRecommendation,
    hasData,
    trackShown,
    trackClicked,
  } = useSmartRecommendations();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (recommendations.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();

      if (!hasTrackedRef.current) {
        hasTrackedRef.current = true;
        trackShown();
      }
    }
  }, [recommendations.length, fadeAnim, trackShown]);

  const handlePress = useCallback((rec: SmartRecommendation) => {
    trackClicked(rec);
    router.push(rec.route as never);
  }, [router, trackClicked]);

  const handleTopPress = useCallback(() => {
    if (!topRecommendation) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    trackClicked(topRecommendation);
    router.push(topRecommendation.route as never);
  }, [router, topRecommendation, trackClicked]);

  if (!hasData || !topRecommendation || recommendations.length === 0) {
    return null;
  }

  const topStyle = URGENCY_STYLE[topRecommendation.urgency];
  const TopIcon = ICON_MAP[topRecommendation.icon] ?? Compass;
  const remaining = recommendations.slice(1, 4);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Compass size={15} color={Colors.accent} />
          <Text style={styles.headerTitle}>For You</Text>
        </View>
        <Text style={styles.headerHint}>Based on how things are going</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.topCard,
          { backgroundColor: topStyle.bg, borderColor: topStyle.border },
        ]}
        onPress={handleTopPress}
        activeOpacity={0.8}
        testID="smart-rec-top"
      >
        <View style={[styles.topIcon, { backgroundColor: topStyle.accent + '15' }]}>
          <TopIcon size={20} color={topStyle.accent} />
        </View>
        <View style={styles.topContent}>
          <Text style={[styles.topLabel, { color: topStyle.accent }]}>
            {topStyle.label}
          </Text>
          <Text style={styles.topTitle}>{topRecommendation.title}</Text>
          <Text style={styles.topMessage} numberOfLines={2}>
            {topRecommendation.message}
          </Text>
          <View style={styles.topReasonRow}>
            <View style={[styles.reasonDot, { backgroundColor: topStyle.accent }]} />
            <Text style={styles.topReason}>{topRecommendation.reason}</Text>
          </View>
        </View>
        <View style={[styles.topArrow, { backgroundColor: topStyle.accent }]}>
          <ChevronRight size={15} color={Colors.white} />
        </View>
      </TouchableOpacity>

      {remaining.length > 0 && (
        <View style={styles.moreSection}>
          {remaining.map((rec, i) => (
            <RecommendationItem
              key={rec.id}
              rec={rec}
              index={i}
              onPress={handlePress}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
});

export default SmartRecommendationCard;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    fontSize: 11,
    color: Colors.textMuted,
  },
  topCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  topIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topContent: {
    flex: 1,
    marginRight: 8,
  },
  topLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  topTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  topMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 5,
  },
  topReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reasonDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  topReason: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  topArrow: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreSection: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemContent: {
    flex: 1,
    marginRight: 6,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 1,
  },
  itemMessage: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
