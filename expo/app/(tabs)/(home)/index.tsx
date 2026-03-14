import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Shield,
  Heart,
  Wind,
  Sparkles,
  BookOpen,
  MessageSquare,
  PenLine,
  ChevronRight,
  Flame,
  TrendingDown,
  TrendingUp,
  Activity,
  Sun,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { useEmotionalContext, Intervention } from '@/providers/EmotionalContextProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { useProgress } from '@/hooks/useProgress';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { useSpiralPrevention } from '@/providers/SpiralPreventionProvider';
import SpiralPausePrompt from '@/components/SpiralPausePrompt';

const CATEGORY_ICON: Record<Intervention['category'], typeof Heart> = {
  crisis: Shield,
  relationship: Heart,
  regulation: Wind,
  reflection: BookOpen,
  growth: Sparkles,
};

const CATEGORY_COLORS: Record<Intervention['category'], { bg: string; accent: string }> = {
  crisis: { bg: '#FFF0ED', accent: '#C94438' },
  relationship: { bg: '#FFF5EE', accent: '#D4764E' },
  regulation: { bg: '#F0F7F3', accent: '#6B9080' },
  reflection: { bg: '#F5F0FF', accent: '#7C5CB8' },
  growth: { bg: '#FFF9F0', accent: '#C8975A' },
};

const QUICK_ACTIONS = [
  { key: 'message', label: 'Write a draft', icon: MessageSquare, route: '/(tabs)/messages', color: '#4A8B8D' },
  { key: 'journal', label: 'Journal', icon: PenLine, route: '/(tabs)/journal', color: '#9B8EC4' },
  { key: 'companion', label: 'Talk to AI', icon: Sparkles, route: '/(tabs)/companion', color: '#C4956A' },
] as const;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Still up?';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Winding down?';
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { journalEntries } = useApp();
  const { zone, bestNextIntervention, activeContext } = useEmotionalContext();
  const { trackEvent } = useAnalytics();
  const progress = useProgress();
  const { memoryProfile } = useAICompanion();
  const {
    showPausePrompt: spiralPauseVisible,
    pausePromptConfig: spiralPauseConfig,
    dismissPausePrompt: dismissSpiralPause,
  } = useSpiralPrevention();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('screen_view', { screen: 'home' });
  }, [trackEvent]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fadeAnim, slideAnim, pulseAnim]);

  const greeting = useMemo(() => getGreeting(), []);

  const zoneMessage = useMemo(() => {
    switch (zone) {
      case 'crisis': return "It's okay to need support right now.";
      case 'relationship_distress': return 'Relationship stress can be heavy. Support is here.';
      case 'activated': return 'Take a breath. You have tools here.';
      case 'recovering': return "You're doing the work. That matters.";
      default: return "You're here. That's a good thing.";
    }
  }, [zone]);

  const isCrisis = zone === 'crisis' || zone === 'activated';

  const handlePrimaryAction = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    trackEvent('home_primary_action_tapped', {
      label: bestNextIntervention.label,
      category: bestNextIntervention.category,
      zone,
    });
    router.push(bestNextIntervention.route as never);
  }, [router, bestNextIntervention, zone, trackEvent]);

  const handleQuickAction = useCallback((route: string, key: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    trackEvent('home_quick_action_tapped', { action: key, zone });
    router.push(route as never);
  }, [router, zone, trackEvent]);

  const handleCheckIn = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    trackEvent('home_checkin_tapped', { zone });
    router.push('/check-in');
  }, [router, zone, trackEvent]);

  const handleSafetyMode = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    trackEvent('home_safety_mode_tapped', {});
    router.push('/safety-mode');
  }, [router, trackEvent]);

  const catStyle = CATEGORY_COLORS[bestNextIntervention.category];
  const CatIcon = CATEGORY_ICON[bestNextIntervention.category];

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const hasInsightData = memoryProfile.recentCheckInCount > 0;
  const topTrigger = memoryProfile.topTriggers?.[0]?.label ?? null;
  const topEmotion = memoryProfile.topEmotions?.[0]?.label ?? null;
  const topCoping = memoryProfile.mostEffectiveCoping?.label ?? null;

  const trendDirection = memoryProfile.intensityTrend;
  const trendColor = trendDirection === 'falling'
    ? Colors.success
    : trendDirection === 'rising'
      ? Colors.danger
      : Colors.textMuted;
  const trendLabel = trendDirection === 'falling'
    ? 'Improving'
    : trendDirection === 'rising'
      ? 'Elevated'
      : trendDirection === 'stable'
        ? 'Stable'
        : '—';

  const { metrics, weekComparison, encouragingMessage, hasEnoughData, milestones } = progress;
  const achievedMilestones = useMemo(() => milestones.filter(m => m.achieved), [milestones]);
  const latestMilestone = achievedMilestones[achievedMilestones.length - 1] ?? null;

  const distressDirection = weekComparison.direction;
  const distressColor = distressDirection === 'improved'
    ? Colors.success
    : distressDirection === 'worsened'
      ? '#E17055'
      : Colors.textMuted;

  const recentCheckInCount = useMemo(() => {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return journalEntries.filter(e => Date.now() - e.timestamp < weekMs).length;
  }, [journalEntries]);

  const emotionalStateLabel = useMemo(() => {
    if (activeContext.latestEmotion) return activeContext.latestEmotion;
    if (zone === 'crisis') return 'High distress';
    if (zone === 'activated') return 'Activated';
    if (zone === 'recovering') return 'Recovering';
    return 'No recent check-in';
  }, [activeContext.latestEmotion, zone]);

  const emotionalIntensity = activeContext.latestIntensity;
  const hasRecentCheckIn = activeContext.recentCheckInCount > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.subtitle}>{zoneMessage}</Text>
            </View>
            {isCrisis && (
              <TouchableOpacity
                style={styles.safetyButton}
                onPress={handleSafetyMode}
                activeOpacity={0.7}
                testID="safety-mode-button"
              >
                <Shield size={18} color={Colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <TouchableOpacity
            style={[styles.primaryCard, { backgroundColor: catStyle.bg }]}
            onPress={handlePrimaryAction}
            activeOpacity={0.8}
            testID="primary-action-card"
          >
            <Animated.View style={[styles.primaryGlow, { backgroundColor: catStyle.accent, opacity: glowOpacity }]} />
            <View style={[styles.primaryIcon, { backgroundColor: catStyle.accent + '18' }]}>
              <CatIcon size={24} color={catStyle.accent} />
            </View>
            <View style={styles.primaryContent}>
              <Text style={styles.primaryLabel}>Suggested for you</Text>
              <Text style={styles.primaryTitle}>{bestNextIntervention.label}</Text>
              <Text style={styles.primaryReason} numberOfLines={2}>{bestNextIntervention.reason}</Text>
            </View>
            <View style={[styles.primaryArrow, { backgroundColor: catStyle.accent }]}>
              <ArrowRight size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <TouchableOpacity
                  key={action.key}
                  style={styles.quickCard}
                  onPress={() => handleQuickAction(action.route, action.key)}
                  activeOpacity={0.7}
                  testID={`quick-action-${action.key}`}
                >
                  <View style={[styles.quickIcon, { backgroundColor: action.color + '14' }]}>
                    <Icon size={18} color={action.color} />
                  </View>
                  <Text style={styles.quickLabel}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <TouchableOpacity
            style={styles.emotionalCard}
            onPress={handleCheckIn}
            activeOpacity={0.8}
            testID="emotional-state-card"
          >
            <View style={styles.emotionalHeader}>
              <View style={styles.emotionalIconWrap}>
                <Activity size={18} color={Colors.brandTeal} />
              </View>
              <Text style={styles.emotionalTitle}>How you're feeling</Text>
              <ChevronRight size={14} color={Colors.textMuted} />
            </View>

            {hasRecentCheckIn ? (
              <View style={styles.emotionalBody}>
                <View style={styles.emotionalMain}>
                  <Text style={styles.emotionalState}>{emotionalStateLabel}</Text>
                  {emotionalIntensity > 0 && (
                    <View style={styles.intensityRow}>
                      <View style={styles.intensityTrack}>
                        <View
                          style={[
                            styles.intensityFill,
                            {
                              width: `${(emotionalIntensity / 10) * 100}%`,
                              backgroundColor: emotionalIntensity >= 7
                                ? Colors.danger
                                : emotionalIntensity >= 4
                                  ? Colors.accent
                                  : Colors.success,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.intensityLabel}>{emotionalIntensity}/10</Text>
                    </View>
                  )}
                </View>
                {activeContext.latestTrigger && (
                  <Text style={styles.emotionalTrigger} numberOfLines={1}>
                    Trigger: {activeContext.latestTrigger}
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.emotionalEmpty}>
                <Text style={styles.emotionalEmptyText}>Tap to do a quick emotional check-in</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <TouchableOpacity
            style={styles.insightCard}
            onPress={() => {
              if (Platform.OS !== 'web') {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/insights');
            }}
            activeOpacity={0.8}
            testID="insight-card"
          >
            <View style={styles.insightHeader}>
              <View style={styles.insightIconWrap}>
                <Sun size={18} color="#9B8EC4" />
              </View>
              <Text style={styles.insightTitle}>Your patterns</Text>
              <ChevronRight size={14} color={Colors.textMuted} />
            </View>

            {hasInsightData ? (
              <View style={styles.insightGrid}>
                {topEmotion && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightItemLabel}>Top emotion</Text>
                    <Text style={styles.insightItemValue} numberOfLines={1}>{topEmotion}</Text>
                  </View>
                )}
                {topTrigger && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightItemLabel}>Top trigger</Text>
                    <Text style={styles.insightItemValue} numberOfLines={1}>{topTrigger}</Text>
                  </View>
                )}
                {topCoping && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightItemLabel}>Best tool</Text>
                    <Text style={styles.insightItemValue} numberOfLines={1}>{topCoping}</Text>
                  </View>
                )}
                <View style={styles.insightItem}>
                  <Text style={styles.insightItemLabel}>Distress</Text>
                  <Text style={[styles.insightItemValue, { color: trendColor }]}>{trendLabel}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.insightEmpty}>
                Complete a few check-ins to reveal your emotional patterns.
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <TouchableOpacity
            style={styles.progressCard}
            onPress={() => {
              if (Platform.OS !== 'web') {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/profile/progress' as never);
            }}
            activeOpacity={0.8}
            testID="progress-card"
          >
            <View style={styles.progressHeader}>
              <View style={styles.progressIconWrap}>
                <Flame size={18} color="#C4956A" />
              </View>
              <Text style={styles.progressTitle}>Your progress</Text>
              <ChevronRight size={14} color={Colors.textMuted} />
            </View>

            {hasEnoughData ? (
              <>
                <View style={styles.progressStats}>
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatValue}>{metrics.journalStreak}</Text>
                    <Text style={styles.progressStatLabel}>Day streak</Text>
                  </View>
                  <View style={styles.progressDivider} />
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatValue}>{recentCheckInCount}</Text>
                    <Text style={styles.progressStatLabel}>This week</Text>
                  </View>
                  <View style={styles.progressDivider} />
                  <View style={styles.progressStat}>
                    <Text style={styles.progressStatValue}>{metrics.copingExercisesUsed}</Text>
                    <Text style={styles.progressStatLabel}>Tools used</Text>
                  </View>
                </View>

                {distressDirection !== 'stable' && (
                  <View style={[styles.trendPill, { backgroundColor: distressColor + '12' }]}>
                    {distressDirection === 'improved'
                      ? <TrendingDown size={12} color={distressColor} />
                      : <TrendingUp size={12} color={distressColor} />
                    }
                    <Text style={[styles.trendPillText, { color: distressColor }]}>
                      Distress {distressDirection === 'improved' ? `${weekComparison.changePercent}% lower` : `${weekComparison.changePercent}% higher`} this week
                    </Text>
                  </View>
                )}

                {latestMilestone && (
                  <View style={styles.milestoneRow}>
                    <Text style={styles.milestoneEmoji}>{latestMilestone.icon}</Text>
                    <Text style={styles.milestoneText} numberOfLines={1}>{latestMilestone.label}</Text>
                  </View>
                )}

                <Text style={styles.encourageText}>{encouragingMessage}</Text>
              </>
            ) : (
              <Text style={styles.progressEmpty}>
                A few more check-ins and your progress story starts here.
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {isCrisis && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              style={styles.safetyBanner}
              onPress={handleSafetyMode}
              activeOpacity={0.7}
              testID="safety-banner"
            >
              <Shield size={20} color={Colors.danger} />
              <View style={styles.safetyBannerText}>
                <Text style={styles.safetyBannerTitle}>Safety Mode</Text>
                <Text style={styles.safetyBannerDesc}>Immediate grounding and crisis support</Text>
              </View>
              <ArrowRight size={16} color={Colors.danger} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <SpiralPausePrompt
        visible={spiralPauseVisible}
        config={spiralPauseConfig}
        onClose={dismissSpiralPause}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
    paddingTop: 6,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 5,
    lineHeight: 20,
  },
  safetyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    gap: 14,
    overflow: 'hidden',
    shadowColor: 'rgba(27,40,56,0.06)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  primaryGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  primaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryContent: {
    flex: 1,
  },
  primaryLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  primaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  primaryReason: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  primaryArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: 'rgba(27,40,56,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },

  emotionalCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: 'rgba(27,40,56,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  emotionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  emotionalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  emotionalTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emotionalBody: {
    gap: 10,
  },
  emotionalMain: {
    gap: 8,
  },
  emotionalState: {
    fontSize: 19,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.2,
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  intensityTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  intensityFill: {
    height: 6,
    borderRadius: 3,
  },
  intensityLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    width: 32,
    textAlign: 'right' as const,
  },
  emotionalTrigger: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  emotionalEmpty: {
    paddingVertical: 4,
  },
  emotionalEmptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },

  insightCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: 'rgba(27,40,56,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  insightIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.brandLilacSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  insightTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  insightGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  insightItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  insightItemLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  insightItemValue: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  insightEmpty: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },

  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: 'rgba(27,40,56,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  progressTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  progressStat: {
    flex: 1,
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
  },
  progressStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  progressDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderLight,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
    marginBottom: 10,
  },
  trendPillText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  milestoneEmoji: {
    fontSize: 16,
  },
  milestoneText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  encourageText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  progressEmpty: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },

  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,120,120,0.15)',
    shadowColor: 'rgba(196,120,120,0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  safetyBannerText: {
    flex: 1,
  },
  safetyBannerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dangerDark,
  },
  safetyBannerDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  bottomSpacer: {
    height: 12,
  },
});
