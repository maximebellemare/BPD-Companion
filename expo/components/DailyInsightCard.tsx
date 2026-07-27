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
import { Lightbulb, Bookmark, ChevronRight, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDailyInsight } from '@/hooks/useDailyInsight';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

interface DailyInsightCardProps {
  variant?: 'learn' | 'home';
}

export default React.memo(function DailyInsightCard({ variant = 'learn' }: DailyInsightCardProps) {
  useLanguage();
  const router = useRouter();
  const { selection, isSaved, toggleSave, markViewed } = useDailyInsight();
  const { trackEvent } = useAnalytics();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();

    const glow = Animated.loop(
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
    glow.start();
    return () => glow.stop();
  }, [fadeAnim, glowAnim]);

  const handlePress = useCallback(() => {
    if (!selection) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('daily_insight_opened', { insight_id: selection.insight.id });
    markViewed(selection.insight.id);
    router.push(`/daily-insight?id=${selection.insight.id}` as any);
  }, [selection, router, trackEvent, markViewed]);

  const handleSave = useCallback(() => {
    if (!selection) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('daily_insight_saved', { insight_id: selection.insight.id, saved: !isSaved });
    toggleSave(selection.insight.id);
  }, [selection, isSaved, toggleSave, trackEvent]);

  if (!selection) return null;

  const { insight, reason, isPatternTriggered, patternMessage } = selection;

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.12],
  });

  if (variant === 'home') {
    return (
      <Animated.View style={[styles.homeCard, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.homeCardInner}
          onPress={handlePress}
          activeOpacity={0.7}
          testID="daily-insight-home-card"
        >
          <View style={styles.homeHeader}>
            <View style={styles.homeIconWrap}>
              <Lightbulb size={16} color="#67E8F9" />
            </View>
            <Text style={styles.homeLabel}>{localizedText("Today's Insight", 'Insight de hoy')}</Text>
            <TouchableOpacity
              onPress={handleSave}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="daily-insight-home-save"
            >
              <Bookmark
                size={16}
                color={isSaved ? Colors.brandAmber : Colors.textMuted}
                fill={isSaved ? Colors.brandAmber : 'none'}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.homeTitle} numberOfLines={2}>{insight.title}</Text>
          <Text style={styles.homeExplanation} numberOfLines={2}>{insight.explanation}</Text>
          <View style={styles.homeFooter}>
            <Text style={styles.homeToolLabel}>{insight.suggestedToolLabel}</Text>
            <ChevronRight size={14} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.glowBg, { opacity: glowOpacity }]} />
      <TouchableOpacity
        style={styles.cardInner}
        onPress={handlePress}
        activeOpacity={0.7}
        testID="daily-insight-card"
      >
        <View style={styles.header}>
          <View style={styles.labelRow}>
            <View style={styles.iconWrap}>
              <Lightbulb size={18} color="#67E8F9" />
            </View>
            <View style={styles.labelTextWrap}>
              <Text style={styles.label}>{localizedText("Today's Emotional Insight", 'Insight emocional de hoy')}</Text>
              {isPatternTriggered && (
                <View style={styles.patternBadge}>
                  <Sparkles size={10} color={Colors.brandTeal} />
                  <Text style={styles.patternBadgeText}>{localizedText('Personalized', 'Personalizado')}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            testID="daily-insight-save"
          >
            <Bookmark
              size={20}
              color={isSaved ? Colors.brandAmber : Colors.textMuted}
              fill={isSaved ? Colors.brandAmber : 'none'}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{insight.title}</Text>
        <Text style={styles.explanation} numberOfLines={3}>{insight.explanation}</Text>

        {isPatternTriggered && patternMessage && (
          <View style={styles.patternNotice}>
            <Sparkles size={12} color={Colors.brandTeal} />
            <Text style={styles.patternNoticeText}>{patternMessage}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.toolChip}>
            <Text style={styles.toolChipText}>
              {localizedText('Try:', 'Prueba:')} {insight.suggestedToolLabel}
            </Text>
          </View>
          <View style={styles.readMore}>
            <Text style={styles.readMoreText}>{localizedText('Read more', 'Leer más')}</Text>
            <ChevronRight size={14} color={Colors.brandTeal} />
          </View>
        </View>

        <Text style={styles.reasonText}>{reason}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden' as const,
    backgroundColor: Colors.white,
    shadowColor: 'rgba(196, 149, 106, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(196, 149, 106, 0.12)',
  },
  glowBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.brandAmber,
    borderRadius: 20,
  },
  cardInner: {
    padding: 20,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  labelTextWrap: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.brandAmber,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  patternBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.brandTealSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
  },
  patternBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    lineHeight: 26,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  explanation: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  patternNotice: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.brandTealSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  patternNoticeText: {
    fontSize: 13,
    color: Colors.brandTeal,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  toolChip: {
    backgroundColor: Colors.warmGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  toolChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.brandAmber,
  },
  readMore: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  reasonText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
  homeCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(196, 149, 106, 0.1)',
  },
  homeCardInner: {
    padding: 16,
  },
  homeHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  homeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  homeLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.brandAmber,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    flex: 1,
  },
  homeTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    lineHeight: 21,
    marginBottom: 4,
  },
  homeExplanation: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  homeFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  homeToolLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
});
