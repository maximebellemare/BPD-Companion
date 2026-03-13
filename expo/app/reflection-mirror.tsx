import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Users,
  Leaf,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { generateReflectionMirror } from '@/services/reflection/reflectionMirrorService';
import { ReflectionTheme, RelationshipPattern, CopingInsight, GrowthSignal } from '@/types/reflectionMirror';

const SECTION_COLORS = {
  themes: '#E8F0ED',
  themesBorder: '#C5D9D0',
  themesAccent: '#6B9080',
  relationship: '#F5E6D8',
  relationshipBorder: '#E8D0BC',
  relationshipAccent: '#C4885B',
  coping: '#E3E8F0',
  copingBorder: '#C5CEE0',
  copingAccent: '#5B7AA8',
  growth: '#F0ECE0',
  growthBorder: '#DDD6C5',
  growthAccent: '#8B7D5E',
};

function TrendIcon({ trend }: { trend: 'rising' | 'falling' | 'steady' }) {
  if (trend === 'rising') return <TrendingUp size={14} color={SECTION_COLORS.themesAccent} />;
  if (trend === 'falling') return <TrendingDown size={14} color={Colors.success} />;
  return <Minus size={14} color={Colors.textMuted} />;
}

function EmotionalThemeCard({ theme, index }: { theme: ReflectionTheme; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.themeCard, { opacity: fadeAnim }]}>
      <View style={styles.themeHeader}>
        <Text style={styles.themeEmoji}>{theme.emoji}</Text>
        <View style={styles.themeInfo}>
          <Text style={styles.themeLabel}>{theme.label}</Text>
          <View style={styles.themeMeta}>
            <TrendIcon trend={theme.trend} />
            <Text style={styles.themeFreq}>
              {theme.frequency}× recently
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.themeDescription}>{theme.description}</Text>
    </Animated.View>
  );
}

function RelationshipPatternCard({ pattern, index }: { pattern: RelationshipPattern; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 120,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.relationshipCard, { opacity: fadeAnim }]}>
      <View style={styles.patternChain}>
        <View style={styles.patternNode}>
          <Text style={styles.patternNodeLabel}>Trigger</Text>
          <Text style={styles.patternNodeValue}>{pattern.trigger}</Text>
        </View>
        <View style={styles.patternArrow}>
          <Text style={styles.patternArrowText}>→</Text>
        </View>
        <View style={styles.patternNode}>
          <Text style={styles.patternNodeLabel}>Response</Text>
          <Text style={styles.patternNodeValue}>{pattern.emotionalResponse}</Text>
        </View>
      </View>
      <Text style={styles.patternNarrative}>{pattern.narrative}</Text>
    </Animated.View>
  );
}

function CopingInsightCard({ insight, index }: { insight: CopingInsight; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.copingCard, { opacity: fadeAnim }]}>
      <View style={styles.copingHeader}>
        <Text style={styles.copingEmoji}>{insight.emoji}</Text>
        <View style={styles.copingInfo}>
          <Text style={styles.copingTool}>{insight.tool}</Text>
          <Text style={styles.copingCount}>{insight.timesUsed}× used</Text>
        </View>
      </View>
      <Text style={styles.copingNote}>{insight.helpfulnessNote}</Text>
    </Animated.View>
  );
}

function GrowthSignalCard({ signal, index }: { signal: GrowthSignal; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  return (
    <Animated.View style={[styles.growthCard, { opacity: fadeAnim }]}>
      <Text style={styles.growthEmoji}>{signal.emoji}</Text>
      <View style={styles.growthInfo}>
        <Text style={styles.growthArea}>{signal.area}</Text>
        <Text style={styles.growthDesc}>{signal.description}</Text>
      </View>
    </Animated.View>
  );
}

export default function ReflectionMirrorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { journalEntries, messageDrafts } = useApp();

  const headerFade = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const mirror = useMemo(
    () => generateReflectionMirror(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ]),
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [headerFade, shimmerAnim]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleNavigate = useCallback((path: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(path as never);
  }, [router]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.7],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
          testID="reflection-mirror-close"
        >
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.heroSection, { opacity: headerFade }]}>
          <Animated.View style={[styles.heroGlow, { opacity: shimmerOpacity }]} />
          <View style={styles.heroIconWrap}>
            <Sparkles size={28} color={Colors.white} />
          </View>
          <Text style={styles.heroTitle}>Reflection Mirror</Text>
          <Text style={styles.heroSubtitle}>
            A compassionate look at your emotional patterns
          </Text>
        </Animated.View>

        {!mirror.hasEnoughData ? (
          <Animated.View style={[styles.emptyState, { opacity: headerFade }]}>
            <Text style={styles.emptyEmoji}>🪞</Text>
            <Text style={styles.emptyTitle}>Your mirror is forming</Text>
            <Text style={styles.emptyDesc}>
              As you continue checking in and journaling, your reflection mirror will reveal meaningful patterns about your emotional world.
            </Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={() => handleNavigate('/check-in')}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyActionText}>Start a check-in</Text>
              <ChevronRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            <Animated.View style={[styles.openingCard, { opacity: headerFade }]}>
              <Text style={styles.openingText}>{mirror.openingReflection}</Text>
            </Animated.View>

            {mirror.emotionalThemes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: SECTION_COLORS.themes }]}>
                    <Heart size={18} color={SECTION_COLORS.themesAccent} />
                  </View>
                  <Text style={styles.sectionTitle}>Recent Emotional Themes</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Emotions that have been most present lately
                </Text>
                {mirror.emotionalThemes.map((theme, i) => (
                  <EmotionalThemeCard key={theme.id} theme={theme} index={i} />
                ))}
              </View>
            )}

            {mirror.relationshipPatterns.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: SECTION_COLORS.relationship }]}>
                    <Users size={18} color={SECTION_COLORS.relationshipAccent} />
                  </View>
                  <Text style={styles.sectionTitle}>Relationship Patterns</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  How relationship triggers tend to affect you
                </Text>
                {mirror.relationshipPatterns.map((pattern, i) => (
                  <RelationshipPatternCard key={pattern.id} pattern={pattern} index={i} />
                ))}
              </View>
            )}

            {mirror.copingInsights.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: SECTION_COLORS.coping }]}>
                    <Leaf size={18} color={SECTION_COLORS.copingAccent} />
                  </View>
                  <Text style={styles.sectionTitle}>What Helped</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Coping strategies that seem to make a difference
                </Text>
                {mirror.copingInsights.map((insight, i) => (
                  <CopingInsightCard key={insight.id} insight={insight} index={i} />
                ))}
              </View>
            )}

            {mirror.growthSignals.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: SECTION_COLORS.growth }]}>
                    <Sparkles size={18} color={SECTION_COLORS.growthAccent} />
                  </View>
                  <Text style={styles.sectionTitle}>Growth Signals</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Signs that something meaningful is shifting
                </Text>
                {mirror.growthSignals.map((signal, i) => (
                  <GrowthSignalCard key={signal.id} signal={signal} index={i} />
                ))}
              </View>
            )}

            <View style={styles.closingSection}>
              <Text style={styles.closingText}>
                These reflections are not diagnoses — they are gentle observations drawn from your own words and check-ins. Use them as a mirror, not a measure.
              </Text>
            </View>

            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleNavigate('/weekly-reflection')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionLabel}>Weekly Reflection</Text>
                <Text style={styles.actionDesc}>See your full weekly summary</Text>
                <ChevronRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleNavigate('/insights')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionLabel}>Your Insights</Text>
                <Text style={styles.actionDesc}>Deeper emotional analytics</Text>
                <ChevronRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleNavigate('/therapy-report')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionLabel}>Therapist Report</Text>
                <Text style={styles.actionDesc}>Share patterns with your therapist</Text>
                <ChevronRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
    marginBottom: 8,
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: SECTION_COLORS.themesAccent,
    top: 10,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: SECTION_COLORS.themesAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: SECTION_COLORS.themesAccent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  openingCard: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 18,
    padding: 22,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  openingText: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '500' as const,
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 14,
    marginLeft: 46,
  },
  themeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: SECTION_COLORS.themesBorder,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  themeInfo: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  themeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  themeFreq: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  themeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  relationshipCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: SECTION_COLORS.relationshipBorder,
  },
  patternChain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternNode: {
    flex: 1,
    backgroundColor: SECTION_COLORS.relationship,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  patternNodeLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: SECTION_COLORS.relationshipAccent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  patternNodeValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  patternArrow: {
    paddingHorizontal: 8,
  },
  patternArrowText: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  patternNarrative: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  copingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: SECTION_COLORS.copingBorder,
  },
  copingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  copingEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  copingInfo: {
    flex: 1,
  },
  copingTool: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  copingCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  copingNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  growthCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: SECTION_COLORS.growthBorder,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  growthEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  growthInfo: {
    flex: 1,
  },
  growthArea: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  growthDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  closingSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  closingText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionsSection: {
    gap: 10,
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  actionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 8,
  },
});
