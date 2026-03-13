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
import { Brain, ChevronRight, Sparkles, TrendingUp, Shield, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { CoachingMoment } from '@/types/behavioralCoach';

interface Props {
  moment: CoachingMoment;
  dailySummary?: string;
  weeklyTheme?: string;
}

const TONE_COLORS: Record<string, string> = {
  encouraging: '#00B894',
  grounding: '#6B9080',
  reflective: '#D4956A',
  celebratory: '#F59E0B',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pattern_insight: <Brain size={18} color="#D4956A" />,
  timing_nudge: <Shield size={18} color="#6B9080" />,
  coping_suggestion: <Heart size={18} color="#E84393" />,
  growth_recognition: <TrendingUp size={18} color="#00B894" />,
  relationship_coaching: <Sparkles size={18} color="#8B5CF6" />,
  regulation_tip: <Shield size={18} color="#3B82F6" />,
};

const TYPE_LABELS: Record<string, string> = {
  pattern_insight: 'Pattern Insight',
  timing_nudge: 'Timing Nudge',
  coping_suggestion: 'Coping Suggestion',
  growth_recognition: 'Growth Recognition',
  relationship_coaching: 'Relationship Coaching',
  regulation_tip: 'Regulation Tip',
};

const ActiveCoachingCard = React.memo(function ActiveCoachingCard({
  moment,
  dailySummary,
  weeklyTheme,
}: Props) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fadeAnim, pulseAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/behavioral-coach');
  }, [router]);

  const handleAction = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (moment.suggestedAction) {
      router.push(moment.suggestedAction.route as never);
    }
  }, [moment.suggestedAction, router]);

  const toneColor = TONE_COLORS[moment.tone] ?? Colors.primary;
  const icon = TYPE_ICONS[moment.type] ?? <Brain size={18} color={toneColor} />;
  const typeLabel = TYPE_LABELS[moment.type] ?? 'Coach';

  const accentOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} testID="active-coaching-card">
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrap, { backgroundColor: toneColor + '15' }]}>
              {icon}
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerLabel}>AI Behavioral Coach</Text>
              {weeklyTheme ? (
                <Animated.Text style={[styles.themeText, { opacity: accentOpacity, color: toneColor }]}>
                  {weeklyTheme}
                </Animated.Text>
              ) : null}
            </View>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </View>

        <View style={styles.momentCard}>
          <View style={styles.momentHeader}>
            <View style={[styles.typeBadge, { backgroundColor: toneColor + '12' }]}>
              <Text style={[styles.typeLabel, { color: toneColor }]}>{typeLabel}</Text>
            </View>
            {moment.confidence === 'high' && (
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>Strong signal</Text>
              </View>
            )}
          </View>
          <Text style={styles.momentMessage}>{moment.message}</Text>
          {moment.detail && (
            <Text style={styles.momentDetail}>{moment.detail}</Text>
          )}
        </View>

        {moment.suggestedAction && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: toneColor }]}
            onPress={handleAction}
            activeOpacity={0.8}
            testID="coaching-action-button"
          >
            <Sparkles size={15} color={Colors.white} />
            <Text style={styles.actionButtonText}>{moment.suggestedAction.label}</Text>
            <ChevronRight size={14} color={Colors.white} style={{ opacity: 0.7 }} />
          </TouchableOpacity>
        )}

        {dailySummary ? (
          <View style={styles.summaryWrap}>
            <Text style={styles.summaryText} numberOfLines={2}>{dailySummary}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
});

export default ActiveCoachingCard;

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
    marginBottom: 14,
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
  themeText: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginTop: 1,
    letterSpacing: -0.2,
  },
  momentCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  momentHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#00B89415',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#00B894',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  momentMessage: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    fontWeight: '500' as const,
  },
  momentDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  summaryWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  summaryText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    fontStyle: 'italic' as const,
  },
});
