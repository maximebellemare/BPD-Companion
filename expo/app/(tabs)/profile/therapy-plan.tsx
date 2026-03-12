import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Calendar,
  CheckCircle2,
  Circle,
  ChevronRight,
  RefreshCw,
  Lightbulb,
  Heart,
  Shield,
  Users,
  Eye,
  Sparkles,
  HeartHandshake,
  BookOpen,
  Anchor,
  Wind,
  Star,
  Target,
  Brain,
  MessageSquare,
  Flame,
  Zap,
  Search,
  Timer,
  Hand,
  Trophy,
  Globe,
  Mail,
  Repeat,
  Pause,
  PenLine,
  FileText,
  Link,
  MapPin,
  ListChecks,
  Scan,
  FileEdit,
  CheckCircle,
  MessageCircle,
  Scale,
  GitBranch,
  Thermometer,
  Cloud,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useTherapyPlan } from '@/hooks/useTherapyPlan';
import { FOCUS_AREA_META, TherapyPlanItem } from '@/types/therapy';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Heart, Shield, Users, Eye, Sparkles, HeartHandshake, BookOpen, Anchor, Wind,
  Star, Target, Brain, MessageSquare, Flame, Zap, Search, Timer, Hand, Trophy,
  Globe, Mail, Repeat, Pause, PenLine, FileText, Link, MapPin: MapPin, ListChecks,
  Scan, FileEdit, CheckCircle, MessageCircle, Scale, GitBranch, Thermometer, Cloud,
  Map: MapPin, Focus: Target, HandHeart: HeartHandshake, RefreshCw,
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getIconComponent(iconName: string): React.ComponentType<{ size: number; color: string }> {
  return ICON_MAP[iconName] ?? Target;
}

function getFocusIcon(iconName: string): React.ComponentType<{ size: number; color: string }> {
  const map: Record<string, React.ComponentType<{ size: number; color: string }>> = {
    Shield, Heart, Users, Eye, HeartHandshake, Sparkles,
  };
  return map[iconName] ?? Target;
}

function TypeBadge({ type }: { type: TherapyPlanItem['type'] }) {
  const config = {
    skill: { label: 'Skill', color: '#3B82F6', bg: '#E6F0FF' },
    exercise: { label: 'Exercise', color: Colors.primary, bg: Colors.primaryLight },
    reflection: { label: 'Reflection', color: Colors.accent, bg: Colors.accentLight },
    strategy: { label: 'Strategy', color: '#8B5CF6', bg: '#F0E6FF' },
  }[type];

  return (
    <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

export default function TherapyPlanScreen() {
  const router = useRouter();
  const { plan, isLoading, isGenerating, progress, regeneratePlan, toggleItemCompleted } = useTherapyPlan();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (progress.percentage > 0) {
      Animated.timing(progressAnim, {
        toValue: progress.percentage,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [progress.percentage, progressAnim]);

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleToggle = useCallback((itemId: string) => {
    handleHaptic();
    void toggleItemCompleted(itemId);
  }, [handleHaptic, toggleItemCompleted]);

  const handleRegenerate = useCallback(() => {
    handleHaptic();
    void regeneratePlan();
  }, [handleHaptic, regeneratePlan]);

  const handleItemPress = useCallback((item: TherapyPlanItem) => {
    if (item.route) {
      handleHaptic();
      router.push(item.route as never);
    }
  }, [handleHaptic, router]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Therapy Plan', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your plan...</Text>
        </View>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Therapy Plan', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.emptyIcon}>
            <Calendar size={40} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your Adaptive Therapy Plan</Text>
          <Text style={styles.emptyDesc}>
            Complete a few check-ins and your personalized weekly plan will appear here — tailored to your emotional patterns and needs.
          </Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleRegenerate}
            activeOpacity={0.8}
            testID="generate-plan-btn"
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Sparkles size={18} color={Colors.white} />
                <Text style={styles.generateButtonText}>Generate Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const focusMeta = FOCUS_AREA_META[plan.focusArea];
  const FocusIcon = getFocusIcon(focusMeta.icon);
  const today = new Date().getDay();
  const todayNum = today === 0 ? 7 : today;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Therapy Plan', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={[styles.focusBanner, { backgroundColor: focusMeta.color }]}>
            <View style={styles.focusBannerTop}>
              <View style={styles.focusIconWrap}>
                <FocusIcon size={24} color={Colors.white} />
              </View>
              <View style={styles.focusBannerMeta}>
                <Text style={styles.focusWeekLabel}>This Week's Focus</Text>
                <Text style={styles.focusTitle}>{plan.focusLabel}</Text>
              </View>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={handleRegenerate}
                activeOpacity={0.7}
                testID="refresh-plan-btn"
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.9)" />
                ) : (
                  <RefreshCw size={18} color="rgba(255,255,255,0.9)" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.focusDesc}>{plan.focusDescription}</Text>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Weekly Progress</Text>
                <Text style={styles.progressValue}>{progress.completed}/{progress.total}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
              </View>
            </View>
          </View>

          <View style={styles.dayNav}>
            {[1, 2, 3, 4, 5, 6, 7].map(day => {
              const item = plan.items.find(i => i.day === day);
              const isToday = day === todayNum;
              const isCompleted = item?.completed ?? false;
              return (
                <View key={day} style={[styles.dayDot, isToday && styles.dayDotActive]}>
                  {isCompleted ? (
                    <CheckCircle2 size={16} color={isToday ? Colors.white : Colors.primary} />
                  ) : (
                    <Text style={[styles.dayDotText, isToday && styles.dayDotTextActive]}>
                      {DAY_LABELS[day === 7 ? 0 : day]}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {plan.personalInsight ? (
            <View style={styles.insightCard}>
              <View style={styles.insightIconWrap}>
                <Lightbulb size={18} color={Colors.accent} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Personal Insight</Text>
                <Text style={styles.insightText}>{plan.personalInsight}</Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Your Daily Plan</Text>

          {plan.items.map((item) => {
            const Icon = getIconComponent(item.icon);
            const isToday = item.day === todayNum;
            const isPast = item.day < todayNum;

            return (
              <View
                key={item.id}
                style={[
                  styles.planItem,
                  isToday && styles.planItemToday,
                  item.completed && styles.planItemCompleted,
                ]}
              >
                <View style={styles.planItemHeader}>
                  <View style={styles.planItemLeft}>
                    <TouchableOpacity
                      onPress={() => handleToggle(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      testID={`toggle-${item.id}`}
                    >
                      {item.completed ? (
                        <CheckCircle2 size={22} color={Colors.primary} />
                      ) : (
                        <Circle size={22} color={isToday ? focusMeta.color : Colors.textMuted} />
                      )}
                    </TouchableOpacity>
                    <View style={styles.planItemTitleWrap}>
                      <View style={styles.planItemTitleRow}>
                        <Text style={[
                          styles.planItemDay,
                          isToday && { color: focusMeta.color },
                        ]}>
                          Day {item.day}{isToday ? ' · Today' : ''}
                        </Text>
                        <TypeBadge type={item.type} />
                      </View>
                      <Text style={[
                        styles.planItemTitle,
                        item.completed && styles.planItemTitleDone,
                      ]}>
                        {item.title}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.planItemIcon, { backgroundColor: focusMeta.bgColor }]}>
                    <Icon size={16} color={focusMeta.color} />
                  </View>
                </View>

                <Text style={[
                  styles.planItemDesc,
                  item.completed && styles.planItemDescDone,
                ]}>
                  {item.description}
                </Text>

                <View style={styles.planItemFooter}>
                  <Text style={styles.planItemReason}>{item.reason}</Text>
                  {item.route ? (
                    <TouchableOpacity
                      style={[styles.startBtn, { backgroundColor: focusMeta.bgColor }]}
                      onPress={() => handleItemPress(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.startBtnText, { color: focusMeta.color }]}>
                        {item.completed ? 'Revisit' : (isPast ? 'Catch Up' : 'Start')}
                      </Text>
                      <ChevronRight size={14} color={focusMeta.color} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}

          {plan.encouragement ? (
            <View style={styles.encouragementCard}>
              <Heart size={18} color={Colors.primary} />
              <Text style={styles.encouragementText}>{plan.encouragement}</Text>
            </View>
          ) : null}

          <View style={styles.bottomSpacer} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 28,
  },
  generateButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  focusBanner: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  focusBannerTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  focusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 14,
  },
  focusBannerMeta: {
    flex: 1,
  },
  focusWeekLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  focusTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  focusDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressSection: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 14,
  },
  progressHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.8)',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  dayNav: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  dayDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dayDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayDotText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  dayDotTextActive: {
    color: Colors.white,
  },
  insightCard: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0E4D6',
  },
  insightIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.accent,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  planItem: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  planItemToday: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  planItemCompleted: {
    opacity: 0.75,
  },
  planItemHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  planItemLeft: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    flex: 1,
    gap: 10,
  },
  planItemTitleWrap: {
    flex: 1,
  },
  planItemTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 3,
  },
  planItemDay: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  planItemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  planItemTitleDone: {
    textDecorationLine: 'line-through' as const,
    color: Colors.textMuted,
  },
  planItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 10,
  },
  planItemDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginLeft: 32,
    marginBottom: 10,
  },
  planItemDescDone: {
    color: Colors.textMuted,
  },
  planItemFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginLeft: 32,
  },
  planItemReason: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
    fontStyle: 'italic' as const,
    marginRight: 10,
  },
  startBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  encouragementCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    gap: 12,
  },
  encouragementText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 20,
    fontStyle: 'italic' as const,
  },
  bottomSpacer: {
    height: 40,
  },
});
