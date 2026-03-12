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
import { Compass, ChevronRight, Lightbulb, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { DailyCoaching, COACHING_CATEGORY_META } from '@/types/coaching';

interface Props {
  coaching: DailyCoaching;
}

const BehavioralCoachingCard = React.memo(function BehavioralCoachingCard({ coaching }: Props) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, [fadeAnim, glowAnim]);

  const { primaryNudge, focusArea, focusDescription } = coaching;
  const categoryMeta = COACHING_CATEGORY_META[primaryNudge.category];

  const handleAction = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (primaryNudge.suggestedAction) {
      router.push(primaryNudge.suggestedAction.route as never);
    }
  }, [primaryNudge.suggestedAction, router]);

  const accentOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} testID="coaching-card">
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: categoryMeta.color + '18' }]}>
            <Compass size={18} color={categoryMeta.color} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerLabel}>Daily Coaching</Text>
            <Animated.Text style={[styles.focusArea, { opacity: accentOpacity }]}>
              {focusArea}
            </Animated.Text>
          </View>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: categoryMeta.color + '15' }]}>
          <Text style={styles.categoryEmoji}>{categoryMeta.emoji}</Text>
        </View>
      </View>

      <Text style={styles.focusDescription}>{focusDescription}</Text>

      <View style={styles.nudgeCard}>
        <View style={styles.nudgeHeader}>
          <Lightbulb size={14} color={Colors.accent} />
          <Text style={styles.nudgeTitle}>{primaryNudge.title}</Text>
        </View>
        <Text style={styles.nudgeMessage}>{primaryNudge.message}</Text>
        {primaryNudge.supportingDetail && (
          <Text style={styles.nudgeDetail}>{primaryNudge.supportingDetail}</Text>
        )}
      </View>

      {primaryNudge.suggestedAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: categoryMeta.color }]}
          onPress={handleAction}
          activeOpacity={0.8}
          testID="coaching-action-btn"
        >
          <Sparkles size={16} color={Colors.white} />
          <Text style={styles.actionButtonText}>{primaryNudge.suggestedAction.label}</Text>
          <ChevronRight size={16} color={Colors.white} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
      )}

      {coaching.secondaryNudges.length > 0 && (
        <View style={styles.secondarySection}>
          {coaching.secondaryNudges.slice(0, 2).map(nudge => {
            const meta = COACHING_CATEGORY_META[nudge.category];
            return (
              <View key={nudge.id} style={styles.secondaryNudge}>
                <Text style={styles.secondaryEmoji}>{meta.emoji}</Text>
                <View style={styles.secondaryContent}>
                  <Text style={styles.secondaryTitle}>{nudge.title}</Text>
                  <Text style={styles.secondaryMessage} numberOfLines={2}>{nudge.message}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
});

export default BehavioralCoachingCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  focusArea: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 1,
    letterSpacing: -0.2,
  },
  categoryBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  focusDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  nudgeCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  nudgeHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  nudgeTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  nudgeMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  nudgeDetail: {
    fontSize: 13,
    color: Colors.accent,
    lineHeight: 19,
    marginTop: 10,
    fontStyle: 'italic' as const,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  secondarySection: {
    marginTop: 12,
    gap: 8,
  },
  secondaryNudge: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  secondaryEmoji: {
    fontSize: 18,
    marginTop: 1,
  },
  secondaryContent: {
    flex: 1,
  },
  secondaryTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  secondaryMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
