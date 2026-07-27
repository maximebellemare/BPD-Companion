import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  ChevronLeft,
  Shield,
  Heart,
  Wind,
  Sparkles,
  Eye,
  TrendingUp,
  Pause,
  PenLine,
  ShieldCheck,
  MessageCircle,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePlaybook } from '@/hooks/usePlaybook';
import type { PlaybookStrategy } from '@/types/playbook';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

type TabKey = 'coping' | 'relationship' | 'calming' | 'identity';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'coping', get label() { return localizedText('Coping', 'Afrontamiento'); }, icon: <Shield size={16} color={Colors.primary} /> },
  { key: 'relationship', get label() { return localizedText('Relationships', 'Relaciones'); }, icon: <Heart size={16} color="#3B82F6" /> },
  { key: 'calming', get label() { return localizedText('Calming', 'Calma'); }, icon: <Wind size={16} color="#3B82F6" /> },
  { key: 'identity', get label() { return localizedText('Identity', 'Identidad'); }, icon: <Sparkles size={16} color="#67E8F9" /> },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  Shield: <Shield size={18} color={Colors.primary} />,
  Heart: <Heart size={18} color="#3B82F6" />,
  Wind: <Wind size={18} color="#3B82F6" />,
  Sparkles: <Sparkles size={18} color="#67E8F9" />,
  Eye: <Eye size={18} color="#3B82F6" />,
  TrendingUp: <TrendingUp size={18} color="#14B8A6" />,
  Pause: <Pause size={18} color="#3B82F6" />,
  PenLine: <PenLine size={18} color="#3B82F6" />,
  ShieldCheck: <ShieldCheck size={18} color={Colors.primary} />,
  MessageCircle: <MessageCircle size={18} color="#3B82F6" />,
};

const CATEGORY_COLORS: Record<TabKey, { bg: string; accent: string; light: string }> = {
  coping: { bg: Colors.primaryLight, accent: Colors.primary, light: '#D9E2EC' },
  relationship: { bg: '#FFFFFF', accent: '#3B82F6', light: '#FFFFFF' },
  calming: { bg: '#FFFFFF', accent: '#3B82F6', light: '#D9E2EC' },
  identity: { bg: '#FFFFFF', accent: '#67E8F9', light: '#FFFFFF' },
};

function StrategyCard({ strategy }: { strategy: PlaybookStrategy }) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const colors = CATEGORY_COLORS[strategy.category];

  const toggleExpand = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.timing(expandAnim, {
      toValue: expanded ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  }, [expanded, expandAnim]);

  const maxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const icon = ICON_MAP[strategy.icon] ?? <Shield size={18} color={Colors.primary} />;

  const lastUsedLabel = useMemo(() => {
    const diff = Date.now() - strategy.lastUsed;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''} ago`;
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''} ago`;
  }, [strategy.lastUsed]);

  return (
    <TouchableOpacity
      style={[styles.strategyCard, { borderLeftColor: colors.accent }]}
      onPress={toggleExpand}
      activeOpacity={0.85}
      testID={`strategy-${strategy.id}`}
    >
      <View style={styles.strategyHeader}>
        <View style={[styles.strategyIconWrap, { backgroundColor: colors.bg }]}>
          {icon}
        </View>
        <View style={styles.strategyMain}>
          <Text style={styles.strategyTitle}>{strategy.title}</Text>
          <View style={styles.strategyMeta}>
            {strategy.avgDistressReduction > 0 && (
              <View style={[styles.metaBadge, { backgroundColor: '#FFFFFF' }]}>
                <Zap size={10} color="#14B8A6" />
                <Text style={[styles.metaText, { color: '#14B8A6' }]}>
                  -{strategy.avgDistressReduction}
                </Text>
              </View>
            )}
            <View style={[styles.metaBadge, { backgroundColor: colors.light }]}>
              <Text style={[styles.metaText, { color: colors.accent }]}>
                {strategy.timesUsed}x used
              </Text>
            </View>
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={16} color={Colors.textMuted} />
        ) : (
          <ChevronDown size={16} color={Colors.textMuted} />
        )}
      </View>

      <Animated.View style={[styles.strategyExpanded, { maxHeight, overflow: 'hidden' }]}>
        <Text style={styles.strategyNarrative}>{strategy.narrative}</Text>
        {strategy.relatedTriggers.length > 0 && (
          <View style={styles.triggersRow}>
            <Text style={styles.triggersLabel}>Related triggers:</Text>
            <View style={styles.triggerTags}>
              {strategy.relatedTriggers.map(t => (
                <View key={t} style={[styles.triggerTag, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.triggerTagText, { color: colors.accent }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <Text style={styles.lastUsedText}>Last used: {lastUsedLabel}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function EmptySection({ category }: { category: TabKey }) {
  const messages: Record<TabKey, string> = {
    coping: 'Use coping tools after check-ins to track what helps you most.',
    relationship: 'Message rewrites and pauses will appear here as you use them.',
    calming: 'When you manage high distress moments, your calming strategies will show here.',
    identity: 'Keep checking in regularly. Your growth patterns will emerge.',
  };

  return (
    <View style={styles.emptySection}>
      <View style={styles.emptyIcon}>
        <BookOpen size={28} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Building this section</Text>
      <Text style={styles.emptyText}>{messages[category]}</Text>
    </View>
  );
}

export default function EmotionalPlaybookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLanguage();
  const playbook = usePlaybook();
  const [activeTab, setActiveTab] = useState<TabKey>('coping');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(headerGlow, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(headerGlow, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, [fadeAnim, headerGlow]);

  const handleTabPress = useCallback((key: TabKey) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setActiveTab(key);
  }, []);

  const currentStrategies = useMemo<PlaybookStrategy[]>(() => {
    switch (activeTab) {
      case 'coping': return playbook.copingStrategies;
      case 'relationship': return playbook.relationshipStrategies;
      case 'calming': return playbook.calmingRoutines;
      case 'identity': return playbook.identityReminders;
    }
  }, [activeTab, playbook]);

  const glowOpacity = headerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  const effectivenessBar = useMemo(() => {
    if (!playbook.topStrategy) return null;
    const score = Math.min(100, playbook.topStrategy.effectivenessScore);
    return score;
  }, [playbook.topStrategy]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.heroSection, { paddingTop: insets.top + 8 }]}>
        <Animated.View style={[styles.heroGlow, { opacity: glowOpacity }]} />
        <View style={styles.heroContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.heroTitleRow}>
            <BookOpen size={26} color={Colors.white} />
            <Text style={styles.heroTitle}>{localizedText('My Emotional Playbook', 'Mi manual emocional')}</Text>
          </View>
          <Text style={styles.heroSubtitle}>{playbook.personalNarrative}</Text>

          {playbook.topStrategy && effectivenessBar !== null && (
            <View style={styles.topStrategyHero}>
              <View style={styles.topStrategyHeroInner}>
                <Text style={styles.topStrategyHeroLabel}>{localizedText('Most effective', 'Más efectivo')}</Text>
                <Text style={styles.topStrategyHeroName}>{playbook.topStrategy.title}</Text>
                <View style={styles.effectivenessBarBg}>
                  <View
                    style={[styles.effectivenessBarFill, { width: `${effectivenessBar}%` }]}
                  />
                </View>
                <Text style={styles.effectivenessText}>
                  {localizedText(
                    `${effectivenessBar}% effectiveness · Reduces distress by ${playbook.topStrategy.avgDistressReduction}`,
                    `${effectivenessBar}% de efectividad · Reduce el malestar en ${playbook.topStrategy.avgDistressReduction}`,
                  )}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{playbook.totalStrategiesTracked}</Text>
            <Text style={styles.statLabel}>{localizedText('Strategies', 'Estrategias')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{playbook.copingStrategies.length}</Text>
            <Text style={styles.statLabel}>{localizedText('Coping', 'Afrontamiento')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{playbook.relationshipStrategies.length}</Text>
            <Text style={styles.statLabel}>{localizedText('Relationship', 'Relación')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{playbook.identityReminders.length}</Text>
            <Text style={styles.statLabel}>{localizedText('Growth', 'Crecimiento')}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          style={styles.tabsScroll}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const colors = CATEGORY_COLORS[tab.key];
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: colors.bg, borderColor: colors.accent },
                ]}
                onPress={() => handleTabPress(tab.key)}
                activeOpacity={0.7}
                testID={`tab-${tab.key}`}
              >
                {tab.icon}
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && { color: colors.accent, fontWeight: '700' as const },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.strategiesList}
          contentContainerStyle={styles.strategiesContent}
          showsVerticalScrollIndicator={false}
        >
          {currentStrategies.length > 0 ? (
            currentStrategies.map(strategy => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))
          ) : (
            <EmptySection category={activeTab} />
          )}

          {!playbook.hasEnoughData && (
            <View style={styles.encourageCard}>
              <Sparkles size={20} color={Colors.accent} />
              <Text style={styles.encourageText}>
                Your playbook grows with each check-in and tool you use. Keep going — patterns are forming.
              </Text>
            </View>
          )}

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroSection: {
    backgroundColor: '#14B8A6',
    paddingBottom: 24,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroContent: {
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  topStrategyHero: {
    marginTop: 18,
  },
  topStrategyHeroInner: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  topStrategyHeroLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  topStrategyHeroName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
    marginTop: 4,
  },
  effectivenessBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  effectivenessBarFill: {
    height: 6,
    backgroundColor: '#D9E2EC',
    borderRadius: 3,
  },
  effectivenessText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 6,
  },
  body: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: -1,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.borderLight,
  },
  tabsScroll: {
    marginTop: 18,
    maxHeight: 48,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  strategiesList: {
    flex: 1,
    marginTop: 14,
  },
  strategiesContent: {
    paddingHorizontal: 20,
  },
  strategyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strategyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  strategyMain: {
    flex: 1,
  },
  strategyTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  strategyMeta: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  strategyExpanded: {
    marginTop: 12,
  },
  strategyNarrative: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  triggersRow: {
    marginTop: 10,
  },
  triggersLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  triggerTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  triggerTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  triggerTagText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  lastUsedText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  encourageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  encourageText: {
    flex: 1,
    fontSize: 13,
    color: Colors.accent,
    lineHeight: 19,
    fontWeight: '500' as const,
  },
});
