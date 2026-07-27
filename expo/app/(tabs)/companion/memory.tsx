import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Brain,
  Zap,
  Heart,
  Shield,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Link2,
  Leaf,
  Repeat,
  RefreshCw,
  Compass,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { useUserMemory } from '@/hooks/useUserMemory';
import { generateMemoryInsights } from '@/services/memory/emotionalMemoryService';
import { MemoryInsight, PatternItem } from '@/types/memory';
import { UserMemory, MemoryNarrative } from '@/types/userMemory';
import { localizedText } from '@/lib/i18n/staticText';
import { useLanguage } from '@/hooks/useLanguage';

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  trigger: { color: '#3B82F6', bg: '#FFFFFF', icon: '⚡' },
  emotion: { color: '#14B8A6', bg: '#D9E2EC', icon: '💜' },
  coping: { color: '#14B8A6', bg: '#FFFFFF', icon: '🛡️' },
  relationship: { color: '#67E8F9', bg: '#D9E2EC', icon: '💬' },
  improvement: { color: '#14B8A6', bg: '#D9E2EC', icon: '🌱' },
  pattern: { color: '#2E2A72', bg: '#FFFFFF', icon: '🔄' },
  loop: { color: '#3B82F6', bg: '#FFFFFF', icon: '🔄' },
  growth: { color: '#14B8A6', bg: '#FFFFFF', icon: '🌱' },
  value: { color: '#14B8A6', bg: '#D9E2EC', icon: '💎' },
  preference: { color: '#2E2A72', bg: '#FFFFFF', icon: '⚙️' },
};

function StrengthDots({ strength }: { strength: string }) {
  const filled = strength === 'strong' ? 3 : strength === 'moderate' ? 2 : 1;
  return (
    <View style={sdStyles.container}>
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            sdStyles.dot,
            i <= filled ? sdStyles.dotFilled : sdStyles.dotEmpty,
          ]}
        />
      ))}
    </View>
  );
}

const sdStyles = StyleSheet.create({
  container: {
    flexDirection: 'row' as const,
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  dotEmpty: {
    backgroundColor: Colors.borderLight,
  },
});

function MemoryItem({ memory, index }: { memory: UserMemory; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const config = CATEGORY_CONFIG[memory.category] ?? CATEGORY_CONFIG.pattern;
  const strengthBorder =
    memory.strength === 'strong'
      ? Colors.primary
      : memory.strength === 'moderate'
        ? Colors.accent
        : Colors.borderLight;

  const timeAgo = useMemo(() => {
    const diff = Date.now() - memory.lastObserved;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }, [memory.lastObserved]);

  return (
    <Animated.View
      style={[
        miStyles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderLeftColor: strengthBorder,
        },
      ]}
    >
      <View style={miStyles.topRow}>
        <View style={[miStyles.iconWrap, { backgroundColor: config.bg }]}>
          <Text style={miStyles.iconText}>{config.icon}</Text>
        </View>
        <View style={miStyles.topContent}>
          <Text style={miStyles.label} numberOfLines={1}>{memory.label}</Text>
          <View style={miStyles.metaRow}>
            <StrengthDots strength={memory.strength} />
            <Text style={miStyles.metaText}>{memory.occurrences}x</Text>
            <Text style={miStyles.metaDivider}>·</Text>
            <Text style={miStyles.metaText}>{timeAgo}</Text>
          </View>
        </View>
      </View>
      {memory.relatedMemoryIds.length > 0 && (
        <View style={miStyles.connectionRow}>
          <Link2 size={10} color={Colors.textMuted} />
          <Text style={miStyles.connectionText}>
            {memory.relatedMemoryIds.length} connection{memory.relatedMemoryIds.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const MemoizedMemoryItem = React.memo(MemoryItem);

const miStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  topRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  topContent: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  metaDivider: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  connectionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  connectionText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});

function NarrativeCard({ narrative, index }: { narrative: MemoryNarrative; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: 200 + index * 120,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const config = CATEGORY_CONFIG[narrative.category] ?? CATEGORY_CONFIG.pattern;

  return (
    <Animated.View style={[ncStyles.card, { opacity: fadeAnim }]}>
      <View style={[ncStyles.accent, { backgroundColor: config.color }]} />
      <Text style={ncStyles.text}>{narrative.text}</Text>
    </Animated.View>
  );
}

const MemoizedNarrativeCard = React.memo(NarrativeCard);

const ncStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    paddingLeft: 20,
    marginBottom: 10,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  accent: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  text: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic' as const,
  },
});

function InsightItem({ insight, index }: { insight: MemoryInsight; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const config = CATEGORY_CONFIG[insight.category] ?? CATEGORY_CONFIG.pattern;
  const sentimentBorder =
    insight.sentiment === 'positive'
      ? Colors.success
      : insight.sentiment === 'cautious'
        ? Colors.accent
        : Colors.border;

  return (
    <Animated.View
      style={[
        iiStyles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderLeftColor: sentimentBorder,
        },
      ]}
    >
      <View style={[iiStyles.iconWrap, { backgroundColor: config.bg }]}>
        <Text style={iiStyles.icon}>{insight.icon}</Text>
      </View>
      <View style={iiStyles.content}>
        <Text style={iiStyles.title}>{insight.title}</Text>
        <Text style={iiStyles.desc}>{insight.description}</Text>
        {insight.detail ? (
          <Text style={iiStyles.detail}>{insight.detail}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const MemoizedInsightItem = React.memo(InsightItem);

const iiStyles = StyleSheet.create({
  card: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  detail: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
});

function PatternBar({ item, maxCount, delay, color }: { item: PatternItem; maxCount: number; delay: number; color?: string }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: maxCount > 0 ? item.count / maxCount : 0,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, item.count, maxCount, delay]);

  return (
    <View style={pbStyles.row}>
      <Text style={pbStyles.label} numberOfLines={1}>{item.label}</Text>
      <View style={pbStyles.track}>
        <Animated.View
          style={[
            pbStyles.fill,
            color ? { backgroundColor: color } : undefined,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={pbStyles.value}>{item.percentage}%</Text>
    </View>
  );
}

const MemoizedPatternBar = React.memo(PatternBar);

const pbStyles = StyleSheet.create({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  label: {
    width: 100,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden' as const,
  },
  fill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  value: {
    width: 36,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right' as const,
    fontWeight: '600' as const,
  },
});

export default function MemoryScreen() {
  useLanguage();
  const { memoryProfile } = useAICompanion();
  const { summary, rebuildMemories } = useUserMemory();

  const memoryInsights = useMemo(() => {
    return generateMemoryInsights(memoryProfile);
  }, [memoryProfile]);

  const maxTriggerCount = useMemo(() => {
    return memoryProfile.topTriggers.reduce((max, t) => Math.max(max, t.count), 0);
  }, [memoryProfile.topTriggers]);

  const maxEmotionCount = useMemo(() => {
    return memoryProfile.topEmotions.reduce((max, t) => Math.max(max, t.count), 0);
  }, [memoryProfile.topEmotions]);

  const maxCopingCount = useMemo(() => {
    return memoryProfile.copingToolsUsed.reduce((max, t) => Math.max(max, t.count), 0);
  }, [memoryProfile.copingToolsUsed]);

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [headerFade]);

  const handleRefresh = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    rebuildMemories();
  }, [rebuildMemories]);

  const trendIcon = memoryProfile.intensityTrend === 'falling'
    ? <TrendingDown size={16} color={Colors.success} />
    : memoryProfile.intensityTrend === 'rising'
      ? <TrendingUp size={16} color={Colors.danger} />
      : <Minus size={16} color={Colors.textMuted} />;

  const trendLabel = memoryProfile.intensityTrend === 'falling'
    ? 'Improving'
    : memoryProfile.intensityTrend === 'rising'
      ? 'Elevated'
      : memoryProfile.intensityTrend === 'stable'
        ? 'Stable'
        : '—';

  const trendColor = memoryProfile.intensityTrend === 'falling'
    ? Colors.success
    : memoryProfile.intensityTrend === 'rising'
      ? Colors.danger
      : Colors.textSecondary;

  const hasData = memoryProfile.recentCheckInCount > 0;
  const hasMemories = summary.totalMemories > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Emotional Memory',
          headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
          headerRight: () => (
            <TouchableOpacity
              onPress={handleRefresh}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.refreshBtn}
              testID="memory-refresh-btn"
            >
              <RefreshCw size={18} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, { opacity: headerFade }]}>
          <View style={styles.heroIconWrap}>
            <Brain size={26} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>{localizedText('Your Emotional Memory', 'Tu memoria emocional')}</Text>
          <Text style={styles.heroSubtitle}>
            What your companion has learned about you over time.
          </Text>
        </Animated.View>

        {!hasData && !hasMemories ? (
          <View style={styles.emptyState}>
            <Sparkles size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Building your memory</Text>
            <Text style={styles.emptyDesc}>
              Complete check-ins and journal entries. Your companion will learn your patterns and remember what helps.
            </Text>
          </View>
        ) : (
          <>
            {hasMemories && (
              <View style={styles.memoryStatsRow}>
                <View style={styles.memoryStatCard}>
                  <Text style={styles.memoryStatValue}>{summary.totalMemories}</Text>
                  <Text style={styles.memoryStatLabel}>Memories</Text>
                </View>
                <View style={styles.memoryStatCard}>
                  <Text style={styles.memoryStatValue}>{summary.strongMemoryCount}</Text>
                  <Text style={styles.memoryStatLabel}>Strong</Text>
                </View>
                <View style={styles.memoryStatCard}>
                  <View style={styles.trendRow}>
                    {trendIcon}
                    <Text style={[styles.memoryStatValue, { color: trendColor, marginLeft: 4, fontSize: 14 }]}>
                      {trendLabel}
                    </Text>
                  </View>
                  <Text style={styles.memoryStatLabel}>Trend</Text>
                </View>
              </View>
            )}

            {summary.narratives.length > 0 && (
              <View style={styles.section} testID="memory-narratives-section">
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: Colors.primaryLight }]}>
                    <Compass size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>{localizedText('What I Know About You', 'Lo que se de ti')}</Text>
                </View>
                {summary.narratives.slice(0, 5).map((narrative, i) => (
                  <MemoizedNarrativeCard key={narrative.id} narrative={narrative} index={i} />
                ))}
              </View>
            )}

            {summary.topTriggers.length > 0 && (
              <View style={styles.sectionCard} testID="memory-persistent-triggers">
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#FFFFFF' }]}>
                    <Zap size={16} color="#3B82F6" />
                  </View>
                  <Text style={styles.sectionTitle}>{localizedText('Known Triggers', 'Disparadores conocidos')}</Text>
                </View>
                {summary.topTriggers.slice(0, 5).map((memory, i) => (
                  <MemoizedMemoryItem key={memory.id} memory={memory} index={i} />
                ))}
              </View>
            )}

            {summary.commonLoops.length > 0 && (
              <View style={styles.sectionCard} testID="memory-loops-section">
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#FFFFFF' }]}>
                    <Repeat size={16} color="#3B82F6" />
                  </View>
                  <Text style={styles.sectionTitle}>Common Loops</Text>
                </View>
                {summary.commonLoops.slice(0, 5).map((memory, i) => (
                  <MemoizedMemoryItem key={memory.id} memory={memory} index={i} />
                ))}
              </View>
            )}

            {summary.helpfulTools.length > 0 && (
              <View style={styles.sectionCard} testID="memory-coping-section">
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#FFFFFF' }]}>
                    <Shield size={16} color={Colors.success} />
                  </View>
                  <Text style={styles.sectionTitle}>{localizedText('What Helps', 'Que ayuda')}</Text>
                </View>
                {summary.helpfulTools.slice(0, 5).map((memory, i) => (
                  <MemoizedMemoryItem key={memory.id} memory={memory} index={i} />
                ))}
              </View>
            )}

            {summary.relationshipPatterns.length > 0 && (
              <View style={styles.sectionCard} testID="memory-relationship-section">
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#D9E2EC' }]}>
                    <Users size={16} color={Colors.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>{localizedText('Relationship Patterns', 'Patrones relacionales')}</Text>
                </View>
                {summary.relationshipPatterns.slice(0, 4).map((memory, i) => (
                  <MemoizedMemoryItem key={memory.id} memory={memory} index={i} />
                ))}
              </View>
            )}

            {summary.growthSignals.length > 0 && (
              <View style={styles.sectionCard} testID="memory-growth-section">
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: Colors.successLight }]}>
                    <Leaf size={16} color={Colors.success} />
                  </View>
                  <Text style={styles.sectionTitle}>{localizedText('Growth Signals', 'Senales de crecimiento')}</Text>
                </View>
                {summary.growthSignals.map((memory, i) => (
                  <MemoizedMemoryItem key={memory.id} memory={memory} index={i} />
                ))}
              </View>
            )}

            {memoryProfile.topTriggers.length > 0 && (
              <View style={styles.sectionCard} testID="memory-frequency-triggers">
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#FFFFFF' }]}>
                    <Zap size={16} color="#3B82F6" />
                  </View>
                  <Text style={styles.sectionTitle}>{localizedText('Trigger Frequency', 'Frecuencia de disparadores')}</Text>
                </View>
                {memoryProfile.topTriggers.slice(0, 5).map((item, i) => (
                  <MemoizedPatternBar
                    key={item.label}
                    item={item}
                    maxCount={maxTriggerCount}
                    delay={i * 60}
                    color="#3B82F6"
                  />
                ))}
              </View>
            )}

            {memoryProfile.topEmotions.length > 0 && (
              <View style={styles.sectionCard} testID="memory-frequency-emotions">
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#D9E2EC' }]}>
                    <Heart size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Emotion Frequency</Text>
                </View>
                {memoryProfile.topEmotions.slice(0, 5).map((item, i) => (
                  <MemoizedPatternBar
                    key={item.label}
                    item={item}
                    maxCount={maxEmotionCount}
                    delay={i * 60}
                  />
                ))}
              </View>
            )}

            {memoryProfile.copingToolsUsed.length > 0 && (
              <View style={styles.sectionCard} testID="memory-frequency-coping">
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#FFFFFF' }]}>
                    <Shield size={16} color={Colors.success} />
                  </View>
                  <Text style={styles.sectionTitle}>Coping Tool Usage</Text>
                </View>
                {memoryProfile.copingToolsUsed.slice(0, 5).map((item, i) => (
                  <MemoizedPatternBar
                    key={item.label}
                    item={item}
                    maxCount={maxCopingCount}
                    delay={i * 60}
                    color={Colors.success}
                  />
                ))}
              </View>
            )}

            {memoryInsights.length > 0 && (
              <View style={styles.section} testID="memory-insights-list">
                <Text style={styles.insightsSectionTitle}>{localizedText('Personalized Insights', 'Insights personalizados')}</Text>
                <Text style={styles.insightsSectionDesc}>
                  Patterns your companion uses to support you
                </Text>
                {memoryInsights.map((insight, i) => (
                  <MemoizedInsightItem key={insight.id} insight={insight} index={i} />
                ))}
              </View>
            )}

            {memoryProfile.recentImprovements.length > 0 && (
              <View style={styles.section} testID="memory-improvements-section">
                <Text style={styles.insightsSectionTitle}>Recent Improvements</Text>
                {memoryProfile.recentImprovements.map((imp) => (
                  <View key={imp.id} style={styles.improvementCard}>
                    <View style={styles.improvementDot} />
                    <View style={styles.improvementContent}>
                      <Text style={styles.improvementArea}>{imp.area}</Text>
                      <Text style={styles.improvementDesc}>{imp.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
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
  refreshBtn: {
    padding: 6,
  },
  hero: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 30,
  },
  memoryStatsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 20,
  },
  memoryStatCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  memoryStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  memoryStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  trendRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  section: {
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  insightsSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  insightsSectionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  improvementCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  improvementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginTop: 5,
    marginRight: 12,
  },
  improvementContent: {
    flex: 1,
  },
  improvementArea: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  improvementDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  bottomSpacer: {
    height: 40,
  },
});
