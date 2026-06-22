import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Calendar,
  TrendingUp,
  Heart,
  Shield,
  Users,
  Sparkles,
  ChevronRight,
  MessageCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { WeeklyCompanionInsight } from '@/types/companionMemory';

function InsightSection({
  title,
  icon,
  iconBg,
  items,
  index,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  items: string[];
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  if (items.length === 0) return null;

  return (
    <Animated.View style={[styles.sectionCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.map((item, i) => (
        <View key={`${title}-${i}`} style={styles.insightRow}>
          <View style={styles.insightDot} />
          <Text style={styles.insightText}>{item}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

function WeeklyCard({ insight, index, onDiscuss }: { insight: WeeklyCompanionInsight; index: number; onDiscuss: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 150,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const weekDate = new Date(insight.weekStart);
  const weekEndDate = new Date(insight.weekEnd);
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dateRange = `${formatDate(weekDate)} — ${formatDate(weekEndDate)}`;
  const isLatest = index === 0;

  return (
    <Animated.View style={[styles.weekCard, isLatest && styles.weekCardLatest, { opacity: fadeAnim }]}>
      <View style={styles.weekCardHeader}>
        <View style={styles.weekCardDateRow}>
          <Calendar size={14} color={isLatest ? '#3B82F6' : Colors.textMuted} />
          <Text style={[styles.weekCardDate, isLatest && styles.weekCardDateLatest]}>{dateRange}</Text>
        </View>
        {isLatest && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        )}
      </View>

      <Text style={styles.weekCardSummary}>{insight.summary}</Text>

      <InsightSection
        title="Emotional Patterns"
        icon={<Heart size={14} color="#3B82F6" />}
        iconBg="#FFFFFF"
        items={insight.emotionalPatterns}

        index={0}
      />

      <InsightSection
        title="Relationship Patterns"
        icon={<Users size={14} color={Colors.accent} />}
        iconBg={Colors.accentLight}
        items={insight.relationshipPatterns}

        index={1}
      />

      <InsightSection
        title="What Helped"
        icon={<Shield size={14} color={Colors.primary} />}
        iconBg={Colors.primaryLight}
        items={insight.helpfulStrategies}

        index={2}
      />

      <InsightSection
        title="Growth Signals"
        icon={<TrendingUp size={14} color={Colors.success} />}
        iconBg={Colors.successLight}
        items={insight.growthSignals}

        index={3}
      />

      {isLatest && (
        <TouchableOpacity
          style={styles.discussButton}
          onPress={onDiscuss}
          activeOpacity={0.7}
          testID="discuss-weekly-btn"
        >
          <MessageCircle size={15} color={Colors.primary} />
          <Text style={styles.discussButtonText}>Discuss with Companion</Text>
          <ChevronRight size={14} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function WeeklyInsightsScreen() {
  const router = useRouter();
  const {
    weeklyInsights,
    startNewConversation,
  } = useAICompanion();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleDiscuss = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const id = startNewConversation(false);
    router.push({
      pathname: '/companion/chat',
      params: {
        conversationId: id,
        initialMessage: 'I want to talk about my weekly emotional patterns and what you have noticed.',
      },
    } as never);
  }, [startNewConversation, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Weekly Insights' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerIconWrap}>
            <Sparkles size={20} color="#3B82F6" />
          </View>
          <Text style={styles.headerTitle}>Your Companion Insights</Text>
          <Text style={styles.headerSubtitle}>
            A personal look at your emotional patterns, what helped, and where you are growing.
          </Text>
        </Animated.View>

        {weeklyInsights.length === 0 ? (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={styles.emptyIcon}>
              <Calendar size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No weekly insights yet</Text>
            <Text style={styles.emptySubtitle}>
              As you use the Companion, check in, and journal, your weekly insights will appear here. Keep showing up for yourself.
            </Text>
          </Animated.View>
        ) : (
          weeklyInsights.map((insight, i) => (
            <WeeklyCard
              key={insight.id}
              insight={insight}
              index={i}
              onDiscuss={handleDiscuss}
            />
          ))
        )}

        <View style={styles.bottomSpacer} />
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
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  weekCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  weekCardLatest: {
    borderColor: 'rgba(91, 143, 185, 0.2)',
    backgroundColor: '#FFFFFF',
  },
  weekCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 14,
  },
  weekCardDateRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  weekCardDate: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  weekCardDateLatest: {
    color: '#3B82F6',
  },
  currentBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  weekCardSummary: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 23,
    marginBottom: 16,
    fontWeight: '500' as const,
  },
  sectionCard: {
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: 0.2,
  },
  insightRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    marginBottom: 6,
    paddingLeft: 34,
  },
  insightDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginTop: 7,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  discussButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  discussButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 30,
  },
});
