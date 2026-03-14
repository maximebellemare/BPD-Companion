import React, { useRef, useEffect, useMemo, useCallback } from 'react';
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
  Wind,
  MessageCircle,
  HeartCrack,
  ShieldOff,
  Eye as EyeIcon,
  Zap,
  Brain,
  Anchor,
  ChevronRight,
  Sparkles,
  Shield,
  Activity,
  Search,
  Bookmark,
  Sprout,
  HeartHandshake,
  Clock,
  Lightbulb,
  Award,
  TrendingDown,
  Pin,
  History,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { QUICK_ACCESS_TOOLS } from '@/data/quickAccessTools';
import { usePersonalPlaybook } from '@/hooks/usePersonalPlaybook';
import { useEmotionalContext } from '@/providers/EmotionalContextProvider';
import { getSmartRecommendation } from '@/services/playbook/playbookLearningService';
import type { PersonalToolRecord } from '@/types/personalPlaybook';
import { trackEvent, trackToolUsage } from '@/services/analytics/analyticsService';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Wind,
  MessageCircle,
  HeartCrack,
  ShieldOff,
  Eye: EyeIcon,
  Zap,
  Brain,
  Anchor,
};

export default function ToolsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { activeContext } = useEmotionalContext();
  const playbook = usePersonalPlaybook();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    void trackEvent('screen_view', { screen: 'tools' });
  }, [fadeAnim]);

  const handleQuickAccess = useCallback((route: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    void trackToolUsage('used', { tool_name: route, source: 'quick_access' });
    router.push(route as never);
  }, [router]);

  const handleNav = useCallback((route: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as never);
  }, [router]);

  const currentEmotion = activeContext?.latestEmotion ?? null;
  const currentIntensity = activeContext?.latestIntensity ?? 0;

  const smartRec = useMemo(() => {
    if (playbook.records.length === 0) return null;
    return getSmartRecommendation(currentEmotion, currentIntensity, playbook.records, playbook.logs);
  }, [currentEmotion, currentIntensity, playbook.records, playbook.logs]);

  const getWhatHelped = playbook.getWhatHelped;
  const whatHelpedLastTime = useMemo(() => {
    if (!currentEmotion) return null;
    return getWhatHelped(currentEmotion);
  }, [currentEmotion, getWhatHelped]);

  const topTool = playbook.stats?.mostEffectiveTool ?? null;
  const hasPlaybookData = playbook.hasData;

  const recentTools = useMemo(() => {
    return [...playbook.records]
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, 3);
  }, [playbook.records]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <Text style={styles.title}>Tools</Text>
          <Text style={styles.subtitle}>What do you need right now?</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {smartRec?.tool && currentIntensity >= 5 && (
            <TouchableOpacity
              style={styles.smartRecCard}
              onPress={() => handleNav('/tools/playbook')}
              activeOpacity={0.7}
              testID="smart-recommendation-card"
            >
              <View style={styles.smartRecIconWrap}>
                <Sparkles size={18} color={Colors.white} />
              </View>
              <View style={styles.smartRecContent}>
                <Text style={styles.smartRecLabel}>Recommended for you</Text>
                <Text style={styles.smartRecToolName}>{smartRec.tool.toolTitle}</Text>
                <Text style={styles.smartRecReason}>{smartRec.reason}</Text>
              </View>
              <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}

          {whatHelpedLastTime && whatHelpedLastTime.tools.length > 0 && (
            <View style={styles.whatHelpedLastTimeCard} testID="what-helped-last-time">
              <View style={styles.whatHelpedLastTimeHeader}>
                <History size={14} color={Colors.brandTeal} />
                <Text style={styles.whatHelpedLastTimeLabel}>
                  Last time you felt this way, these helped
                </Text>
              </View>
              {whatHelpedLastTime.tools.map((tool) => (
                <View key={tool.toolId} style={styles.whatHelpedLastTimeTool}>
                  <View style={styles.whatHelpedLastTimeDot} />
                  <Text style={styles.whatHelpedLastTimeToolName}>{tool.toolTitle}</Text>
                  {tool.avgDistressReduction > 0 && (
                    <View style={styles.reductionBadge}>
                      <TrendingDown size={10} color={Colors.success} />
                      <Text style={styles.reductionText}>-{tool.avgDistressReduction}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.quickAccessGrid}>
            {QUICK_ACCESS_TOOLS.map(tool => {
              const IconComp = ICON_MAP[tool.iconName];
              return (
                <TouchableOpacity
                  key={tool.id}
                  style={[styles.quickCard, { backgroundColor: tool.bgColor }]}
                  onPress={() => handleQuickAccess(tool.route)}
                  activeOpacity={0.7}
                  testID={`quick-${tool.id}`}
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: tool.color + '20' }]}>
                    {IconComp && <IconComp size={18} color={tool.color} />}
                  </View>
                  <Text style={[styles.quickLabel, { color: tool.color }]} numberOfLines={1}>
                    {tool.label}
                  </Text>
                  <Text style={styles.quickSublabel} numberOfLines={1}>
                    {tool.sublabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {topTool && (
            <TouchableOpacity
              style={styles.whatHelpedCard}
              onPress={() => handleNav('/tools/playbook')}
              activeOpacity={0.7}
              testID="what-helped-card"
            >
              <View style={styles.whatHelpedHeader}>
                <Lightbulb size={14} color={Colors.accent} />
                <Text style={styles.whatHelpedLabel}>What works for you</Text>
              </View>
              <View style={styles.whatHelpedBody}>
                <View style={styles.whatHelpedToolInfo}>
                  <Text style={styles.whatHelpedToolName}>{topTool.toolTitle}</Text>
                  <Text style={styles.whatHelpedToolMeta}>
                    {topTool.avgDistressReduction > 0 && `Reduces distress by ${topTool.avgDistressReduction} · `}
                    Used {topTool.totalUses}x
                  </Text>
                </View>
                <View style={styles.whatHelpedBadge}>
                  <Award size={12} color={Colors.success} />
                  <Text style={styles.whatHelpedBadgeText}>#1</Text>
                </View>
              </View>
              {playbook.records.length > 1 && (
                <View style={styles.whatHelpedMore}>
                  <Text style={styles.whatHelpedMoreText}>
                    +{playbook.records.length - 1} more tools tracked
                  </Text>
                  <ChevronRight size={14} color={Colors.textMuted} />
                </View>
              )}
            </TouchableOpacity>
          )}

          {playbook.pinnedTools.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderRow}>
                  <Pin size={15} color={Colors.accent} />
                  <Text style={styles.sectionTitle}>Pinned Tools</Text>
                </View>
              </View>
              {playbook.pinnedTools.slice(0, 3).map(tool => (
                <PinnedToolRow key={tool.toolId} tool={tool} onPress={() => handleNav('/tools/playbook')} />
              ))}
              <View style={{ height: 12 }} />
            </>
          )}

          <TouchableOpacity
            style={styles.matcherCard}
            onPress={() => handleNav('/tools/tool-matcher')}
            activeOpacity={0.7}
            testID="tool-matcher-card"
          >
            <View style={styles.matcherLeft}>
              <View style={styles.matcherIcon}>
                <Sparkles size={20} color={Colors.white} />
              </View>
              <View style={styles.matcherInfo}>
                <Text style={styles.matcherTitle}>Find the Right Tool</Text>
                <Text style={styles.matcherDesc}>Tell us how you feel and we'll match you with what helps</Text>
              </View>
            </View>
            <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skill Libraries</Text>
          </View>

          <View style={styles.libraryGrid}>
            <TouchableOpacity
              style={styles.libraryCard}
              onPress={() => handleNav('/tools/dbt-coach')}
              activeOpacity={0.7}
              testID="dbt-library-card"
            >
              <View style={[styles.libraryIcon, { backgroundColor: '#FDE8E3' }]}>
                <Shield size={20} color="#E17055" />
              </View>
              <Text style={styles.libraryTitle}>DBT Skills</Text>
              <Text style={styles.libraryDesc}>32 guided skills</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.libraryCard}
              onPress={() => handleNav('/tools/mentalization')}
              activeOpacity={0.7}
              testID="mbt-library-card"
            >
              <View style={[styles.libraryIcon, { backgroundColor: '#F0ECF7' }]}>
                <Search size={20} color="#9B8EC4" />
              </View>
              <Text style={styles.libraryTitle}>Perspective</Text>
              <Text style={styles.libraryDesc}>MBT-style tools</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.libraryCard}
              onPress={() => handleNav('/tools/relationship-recovery')}
              activeOpacity={0.7}
              testID="rr-library-card"
            >
              <View style={[styles.libraryIcon, { backgroundColor: '#F5E0E0' }]}>
                <HeartCrack size={20} color="#C47878" />
              </View>
              <Text style={styles.libraryTitle}>Recovery</Text>
              <Text style={styles.libraryDesc}>Post-conflict support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.libraryCard}
              onPress={() => handleNav('/tools/body-regulation')}
              activeOpacity={0.7}
              testID="body-library-card"
            >
              <View style={[styles.libraryIcon, { backgroundColor: '#E8F4F4' }]}>
                <Activity size={20} color="#4A8B8D" />
              </View>
              <Text style={styles.libraryTitle}>Body</Text>
              <Text style={styles.libraryDesc}>Physical regulation</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>More Tools</Text>
          </View>

          <TouchableOpacity
            style={[styles.featureCard, hasPlaybookData && styles.playbookFeatureCard]}
            onPress={() => handleNav('/tools/playbook')}
            activeOpacity={0.7}
            testID="playbook-card"
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: hasPlaybookData ? Colors.brandTealSoft : Colors.accentLight }]}>
                <Bookmark size={18} color={hasPlaybookData ? Colors.brandTeal : Colors.accent} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>My Playbook</Text>
                <Text style={styles.featureDesc}>
                  {hasPlaybookData
                    ? `${playbook.records.length} tools tracked · ${playbook.stats?.toolsThisWeek ?? 0} this week`
                    : 'Tools that work best for you'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => handleNav('/companion/simulator' as never)}
            activeOpacity={0.7}
            testID="simulator-card"
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: '#E3EFF7' }]}>
                <Zap size={18} color="#5B8FB9" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Response Simulator</Text>
                <Text style={styles.featureDesc}>Explore how different reactions play out</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => handleNav('/my-growth' as never)}
            activeOpacity={0.7}
            testID="growth-card"
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: '#E3EDE8' }]}>
                <Sprout size={18} color="#6B9080" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>My Growth</Text>
                <Text style={styles.featureDesc}>Values, strengths & identity reflections</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => handleNav('/relationship-profiles' as never)}
            activeOpacity={0.7}
            testID="relationship-card"
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: '#FFF5F9' }]}>
                <HeartHandshake size={18} color="#E84393" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Relationship Support</Text>
                <Text style={styles.featureDesc}>Profiles, copilot & spiral guard</Text>
              </View>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {recentTools.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderRow}>
                  <Clock size={15} color={Colors.textMuted} />
                  <Text style={styles.sectionTitle}>Recently Used</Text>
                </View>
              </View>
              {recentTools.map(tool => (
                <View key={tool.toolId} style={styles.recentChip}>
                  <Clock size={14} color={Colors.textMuted} />
                  <View style={styles.recentChipInfo}>
                    <Text style={styles.recentText}>{tool.toolTitle}</Text>
                    {tool.avgDistressReduction > 0 && (
                      <Text style={styles.recentMeta}>-{tool.avgDistressReduction} distress</Text>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function PinnedToolRow({ tool, onPress }: { tool: PersonalToolRecord; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.pinnedToolRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.pinnedToolLeft}>
        <Pin size={14} color={Colors.accent} fill={Colors.accent} />
        <Text style={styles.pinnedToolName}>{tool.toolTitle}</Text>
      </View>
      <View style={styles.pinnedToolRight}>
        {tool.avgDistressReduction > 0 && (
          <View style={styles.pinnedToolBadge}>
            <TrendingDown size={10} color={Colors.success} />
            <Text style={styles.pinnedToolBadgeText}>-{tool.avgDistressReduction}</Text>
          </View>
        )}
        <Text style={styles.pinnedToolUses}>{tool.totalUses}x</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.brandTeal,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 32,
  },
  smartRecCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#4A7A68',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  smartRecIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  smartRecContent: {
    flex: 1,
  },
  smartRecLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  smartRecToolName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 2,
  },
  smartRecReason: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 17,
  },
  whatHelpedLastTimeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.brandTeal + '25',
  },
  whatHelpedLastTimeHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  whatHelpedLastTimeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.brandTeal,
  },
  whatHelpedLastTimeTool: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 6,
  },
  whatHelpedLastTimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brandTeal,
  },
  whatHelpedLastTimeToolName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  reductionBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reductionText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  quickAccessGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    width: '48%' as unknown as number,
    flexGrow: 1,
    flexBasis: '47%' as unknown as number,
    borderRadius: 16,
    padding: 14,
    minHeight: 96,
  },
  quickIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  quickSublabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  whatHelpedCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.brandTeal + '20',
  },
  whatHelpedHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 10,
  },
  whatHelpedLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  whatHelpedBody: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  whatHelpedToolInfo: {
    flex: 1,
  },
  whatHelpedToolName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  whatHelpedToolMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  whatHelpedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  whatHelpedBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  whatHelpedMore: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  whatHelpedMoreText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  pinnedToolRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  pinnedToolLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flex: 1,
  },
  pinnedToolName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pinnedToolRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  pinnedToolBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pinnedToolBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  pinnedToolUses: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  matcherCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.brandNavy,
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
  },
  matcherLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    flex: 1,
  },
  matcherIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  matcherInfo: {
    flex: 1,
  },
  matcherTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 3,
  },
  matcherDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  libraryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 28,
  },
  libraryCard: {
    width: '48%' as unknown as number,
    flexGrow: 1,
    flexBasis: '47%' as unknown as number,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  libraryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  libraryTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  libraryDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  featureCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  playbookFeatureCard: {
    borderColor: Colors.brandTeal + '30',
  },
  featureLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    flex: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  recentChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  recentChipInfo: {
    flex: 1,
  },
  recentText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  recentMeta: {
    fontSize: 11,
    color: Colors.success,
    marginTop: 2,
    fontWeight: '500' as const,
  },
});
