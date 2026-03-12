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
import { Compass, ChevronRight, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { CoachingNudge, COACHING_CATEGORY_META } from '@/types/coaching';

interface Props {
  nudge: CoachingNudge;
  onDismiss?: () => void;
  compact?: boolean;
}

const CoachingNudgeBanner = React.memo(function CoachingNudgeBanner({ nudge, onDismiss, compact }: Props) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const meta = COACHING_CATEGORY_META[nudge.category];

  const handleAction = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (nudge.suggestedAction) {
      router.push(nudge.suggestedAction.route as never);
    }
  }, [nudge.suggestedAction, router]);

  const handleDismiss = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  }, [fadeAnim, onDismiss]);

  if (compact) {
    return (
      <Animated.View style={[styles.compactContainer, { opacity: fadeAnim }]} testID="coaching-nudge-compact">
        <View style={[styles.compactAccent, { backgroundColor: meta.color }]} />
        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <Compass size={13} color={meta.color} />
            <Text style={[styles.compactLabel, { color: meta.color }]}>Coach</Text>
          </View>
          <Text style={styles.compactMessage} numberOfLines={2}>{nudge.message}</Text>
        </View>
        {onDismiss && (
          <TouchableOpacity
            onPress={handleDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.dismissBtn}
          >
            <X size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} testID="coaching-nudge-banner">
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: meta.color + '18' }]}>
          <Compass size={16} color={meta.color} />
        </View>
        <View style={styles.topText}>
          <Text style={styles.label}>Coaching Nudge</Text>
          <Text style={styles.title}>{nudge.title}</Text>
        </View>
        {onDismiss && (
          <TouchableOpacity
            onPress={handleDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.message}>{nudge.message}</Text>

      {nudge.suggestedAction && (
        <TouchableOpacity
          style={[styles.actionRow, { backgroundColor: meta.color + '12' }]}
          onPress={handleAction}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: meta.color }]}>{nudge.suggestedAction.label}</Text>
          <ChevronRight size={14} color={meta.color} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
});

export default CoachingNudgeBanner;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  topText: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 1,
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  compactContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.warmGlow,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.accentLight,
    overflow: 'hidden' as const,
  },
  compactAccent: {
    width: 3,
    height: '100%' as const,
    borderRadius: 2,
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
  },
  compactContent: {
    flex: 1,
    paddingLeft: 4,
  },
  compactHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 3,
  },
  compactLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  compactMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  dismissBtn: {
    marginLeft: 8,
    padding: 4,
  },
});
