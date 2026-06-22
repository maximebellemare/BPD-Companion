import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
  ChevronLeft,
  Bookmark,
  Pin,
  TrendingUp,
  TrendingDown,
  Zap,
  Sparkles,
  Eye,
  ShieldOff,
  MessageCircle,
  HeartCrack,
  AlertCircle,
  UserX,
  CloudOff,
  Flame,
  Target,
  Award,
  BarChart3,
  Lightbulb,
  Heart,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePersonalPlaybook } from '@/hooks/usePersonalPlaybook';
import {
  SITUATION_CATEGORIES,
  getEmotionToolProfiles,
  getToolTrends,
} from '@/services/playbook/playbookLearningService';
import type {
  PersonalToolRecord,
  PlaybookInsight,
  PlaybookMilestone,
  SituationRecommendation,
} from '@/types/personalPlaybook';
import type { EmotionToolProfile } from '@/services/playbook/playbookLearningService';
import { trackEvent } from '@/services/analytics/analyticsService';

const SITUATION_ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  ShieldOff,
  Zap,
  Eye,
  Flame,
  AlertCircle,
  UserX,
  MessageCircle,
  HeartCrack,
  TrendingUp,
  CloudOff,
};

const EMOTION_COLORS: Record<string, { bg: string; accent: string }> = {
  anger: { bg: 'rgba(59, 130, 246, 0.18)', accent: '#3B82F6' },
  shame: { bg: 'rgba(103, 232, 249, 0.18)', accent: '#67E8F9' },
  fear: { bg: '#FFFFFF', accent: '#3B82F6' },
  sadness: { bg: '#FFFFFF', accent: '#2E2A72' },
  anxiety: { bg: '#FFFFFF', accent: '#3B82F6' },
  loneliness: { bg: '#FFFFFF', accent: '#2E2A72' },
  hurt: { bg: 'rgba(59, 130, 246, 0.18)', accent: '#3B82F6' },
  rejection: { bg: 'rgba(59, 130, 246, 0.18)', accent: '#3B82F6' },
  overwhelm: { bg: '#FFFFFF', accent: '#3B82F6' },
  confusion: { bg: 'rgba(59, 130, 246, 0.18)', accent: '#3B82F6' },
  relief: { bg: '#FFFFFF', accent: '#14B8A6' },
  hope: { bg: 'rgba(20, 184, 166, 0.18)', accent: '#14B8A6' },
  jealousy: { bg: '#FFFFFF', accent: '#3B82F6' },
  guilt: { bg: 'rgba(103, 232, 249, 0.18)', accent: '#67E8F9' },
};

function getEmotionColor(emotion: string): { bg: string; accent: string } {
  const lower = emotion.toLowerCase();
  return EMOTION_COLORS[lower] ?? { bg: Colors.surface, accent: Colors.textSecondary };
}

type ActiveTab = 'overview' | 'situations' | 'emotions' | 'insights';

export default function PlaybookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const playbook = usePersonalPlaybook();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    void trackEvent('playbook_opened');
  }, []);

  const pinTool = playbook.pinTool;
  const handlePin = useCallback(async (toolId: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await pinTool(toolId);
  }, [pinTool]);

  const handleTabPress = useCallback((tab: ActiveTab) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setActiveTab(tab);
  }, []);

  const activeSituations = useMemo(
    () => playbook.recommendations.filter(r => r.tools.length > 0),
    [playbook.recommendations],
  );

  const emotionProfiles = useMemo(
    () => getEmotionToolProfiles(playbook.records, playbook.logs),
    [playbook.records, playbook.logs],
  );

  const trends = useMemo(
    () => getToolTrends(playbook.logs),
    [playbook.logs],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <Bookmark size={20} color={Colors.brandTeal} />
              <Text style={styles.title}>My Playbook</Text>
            </View>
            <Text style={styles.subtitle}>What works best for you</Text>
          </View>
        </View>

        {playbook.hasData && playbook.stats && (
          <View style={styles.statsStrip}>
            <StatPill label="Tools Used" value={String(playbook.stats.totalToolUses)} color={Colors.brandTeal} />
            <StatPill label="This Week" value={String(playbook.stats.toolsThisWeek)} color={Colors.brandLilac} />
            <StatPill
              label="Avg Reduction"
              value={playbook.stats.avgDistressReduction > 0 ? `-${playbook.stats.avgDistressReduction}` : '–'}
              color={Colors.success}
            />
            {playbook.stats.streakDays > 0 && (
              <StatPill label="Streak" value={`${playbook.stats.streakDays}d`} color={Colors.accent} />
            )}
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRowContent}
          style={styles.tabRow}
        >
          {(['overview', 'situations', 'emotions', 'insights'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.7}
              testID={`playbook-tab-${tab}`}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab === 'overview' ? 'Overview' : tab === 'situations' ? 'By Situation' : tab === 'emotions' ? 'By Emotion' : 'Insights'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!playbook.hasData ? (
            <EmptyPlaybook onExplore={() => router.back()} />
          ) : activeTab === 'overview' ? (
            <OverviewTab
              pinnedTools={playbook.pinnedTools}
              topTools={playbook.topTools}
              milestones={playbook.milestones}
              stats={playbook.stats}
              insights={playbook.insights}
              trends={trends}
              onPin={handlePin}
            />
          ) : activeTab === 'situations' ? (
            <SituationsTab
              activeSituations={activeSituations}
              allSituations={SITUATION_CATEGORIES}
            />
          ) : activeTab === 'emotions' ? (
            <EmotionsTab profiles={emotionProfiles} />
          ) : (
            <InsightsTab insights={playbook.insights} milestones={playbook.milestones} />
          )}
          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statPill, { borderColor: color + '30' }]}>
      <Text style={[styles.statPillValue, { color }]}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

function EmptyPlaybook({ onExplore }: { onExplore: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Bookmark size={36} color={Colors.brandTeal} />
      </View>
      <Text style={styles.emptyTitle}>Your personal playbook</Text>
      <Text style={styles.emptyDesc}>
        As you use tools and rate what helps, your playbook learns which strategies work best for you — and when.
      </Text>
      <View style={styles.emptySteps}>
        <EmptyStep number="1" text="Use a tool from the library" />
        <EmptyStep number="2" text="Rate if it helped after" />
        <EmptyStep number="3" text="Your playbook builds itself" />
      </View>
      <TouchableOpacity style={styles.emptyBtn} onPress={onExplore} activeOpacity={0.7}>
        <Text style={styles.emptyBtnText}>Explore Tools</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyStep({ number, text }: { number: string; text: string }) {
  return (
    <View style={styles.emptyStep}>
      <View style={styles.emptyStepNum}>
        <Text style={styles.emptyStepNumText}>{number}</Text>
      </View>
      <Text style={styles.emptyStepText}>{text}</Text>
    </View>
  );
}

function OverviewTab({
  pinnedTools,
  topTools,
  milestones,
  stats,
  insights,
  trends,
  onPin,
}: {
  pinnedTools: PersonalToolRecord[];
  topTools: PersonalToolRecord[];
  milestones: PlaybookMilestone[];
  stats: import('@/types/personalPlaybook').PlaybookStats | null;
  insights: PlaybookInsight[];
  trends: { improving: boolean; weeklyUsage: number; weeklyReduction: number; prevWeeklyUsage: number };
  onPin: (toolId: string) => void;
}) {
  const achievedMilestones = milestones.filter(m => m.achieved);
  const nextMilestone = milestones.find(m => !m.achieved);
  const topInsight = insights[0];

  return (
    <>
      {topInsight && (
        <View style={styles.insightBanner}>
          <Lightbulb size={16} color={Colors.accent} />
          <Text style={styles.insightBannerText}>{topInsight.text}</Text>
        </View>
      )}

      {trends.weeklyUsage > 0 && (
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            {trends.improving ? (
              <TrendingUp size={14} color={Colors.success} />
            ) : (
              <TrendingDown size={14} color={Colors.textMuted} />
            )}
            <Text style={[styles.trendLabel, trends.improving && { color: Colors.success }]}>
              {trends.improving ? 'Building momentum' : 'This week'}
            </Text>
          </View>
          <Text style={styles.trendText}>
            {trends.weeklyUsage} tool{trends.weeklyUsage !== 1 ? 's' : ''} used this week
            {trends.weeklyReduction > 0 && ` · avg -${trends.weeklyReduction} distress`}
            {trends.prevWeeklyUsage > 0 && trends.weeklyUsage > trends.prevWeeklyUsage && ' · up from last week'}
          </Text>
        </View>
      )}

      {stats?.mostEffectiveTool && (
        <View style={styles.topToolCard}>
          <View style={styles.topToolBadge}>
            <Award size={14} color={Colors.white} />
            <Text style={styles.topToolBadgeText}>Most Effective</Text>
          </View>
          <Text style={styles.topToolName}>{stats.mostEffectiveTool.toolTitle}</Text>
          <View style={styles.topToolStats}>
            <View style={styles.topToolStat}>
              <Text style={styles.topToolStatValue}>
                -{stats.mostEffectiveTool.avgDistressReduction}
              </Text>
              <Text style={styles.topToolStatLabel}>avg reduction</Text>
            </View>
            <View style={styles.topToolStatDivider} />
            <View style={styles.topToolStat}>
              <Text style={styles.topToolStatValue}>{stats.mostEffectiveTool.totalUses}x</Text>
              <Text style={styles.topToolStatLabel}>used</Text>
            </View>
            <View style={styles.topToolStatDivider} />
            <View style={styles.topToolStat}>
              <Text style={styles.topToolStatValue}>{stats.mostEffectiveTool.effectivenessScore}%</Text>
              <Text style={styles.topToolStatLabel}>effective</Text>
            </View>
          </View>
          <View style={styles.topToolBar}>
            <View
              style={[
                styles.topToolBarFill,
                { width: `${Math.min(stats.mostEffectiveTool.effectivenessScore, 100)}%` },
              ]}
            />
          </View>
        </View>
      )}

      {pinnedTools.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Pin size={15} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Quick Access</Text>
          </View>
          {pinnedTools.map(tool => (
            <ToolCard key={tool.toolId} tool={tool} isPinned onPin={onPin} />
          ))}
        </View>
      )}

      {topTools.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={15} color={Colors.success} />
            <Text style={styles.sectionTitle}>Top Performing Tools</Text>
          </View>
          {topTools.map((tool, idx) => (
            <ToolCard key={tool.toolId} tool={tool} rank={idx + 1} isPinned={tool.pinned} onPin={onPin} />
          ))}
        </View>
      )}

      {nextMilestone && (
        <View style={styles.milestoneCard}>
          <View style={styles.milestoneHeader}>
            <Target size={16} color={Colors.brandLilac} />
            <Text style={styles.milestoneTitle}>Next Milestone</Text>
          </View>
          <Text style={styles.milestoneName}>{nextMilestone.label}</Text>
          <Text style={styles.milestoneDesc}>{nextMilestone.description}</Text>
          <View style={styles.milestoneBar}>
            <View
              style={[
                styles.milestoneBarFill,
                { width: `${Math.min((nextMilestone.current / nextMilestone.target) * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.milestoneProgress}>
            {nextMilestone.current} / {nextMilestone.target}
          </Text>
        </View>
      )}

      {achievedMilestones.length > 0 && (
        <View style={styles.achievedRow}>
          {achievedMilestones.map(m => (
            <View key={m.id} style={styles.achievedBadge}>
              <Award size={12} color={Colors.success} />
              <Text style={styles.achievedText}>{m.label}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function SituationsTab({
  activeSituations,
  allSituations,
}: {
  activeSituations: SituationRecommendation[];
  allSituations: typeof SITUATION_CATEGORIES;
}) {
  const activeSitIds = new Set(activeSituations.map(s => s.situation));
  const emptySituations = allSituations.filter(s => !activeSitIds.has(s.id));

  return (
    <>
      {activeSituations.length > 0 ? (
        <>
          <Text style={styles.situationIntro}>
            Based on your tool usage, here's what works best in different moments.
          </Text>
          {activeSituations.map(rec => {
            const cat = allSituations.find(c => c.id === rec.situation);
            if (!cat) return null;
            const IconComp = SITUATION_ICON_MAP[cat.iconName];
            return (
              <View key={rec.situation} style={styles.situationCard}>
                <View style={styles.situationHeader}>
                  <View style={[styles.situationIconWrap, { backgroundColor: cat.bgColor }]}>
                    {IconComp && <IconComp size={18} color={cat.color} />}
                  </View>
                  <View style={styles.situationInfo}>
                    <Text style={styles.situationLabel}>{cat.label}</Text>
                    <Text style={styles.situationDesc}>{cat.description}</Text>
                  </View>
                </View>
                {rec.insight && (
                  <View style={styles.situationInsight}>
                    <Lightbulb size={12} color={Colors.accent} />
                    <Text style={styles.situationInsightText}>{rec.insight}</Text>
                  </View>
                )}
                <View style={styles.situationTools}>
                  {rec.tools.map((tool, idx) => (
                    <View key={tool.toolId} style={styles.situationToolRow}>
                      <View style={styles.situationToolRank}>
                        <Text style={styles.situationToolRankText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.situationToolInfo}>
                        <Text style={styles.situationToolName}>{tool.toolTitle}</Text>
                        <Text style={styles.situationToolMeta}>
                          {tool.avgDistressReduction > 0 && `-${tool.avgDistressReduction} distress · `}
                          {tool.totalUses}x used
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </>
      ) : (
        <View style={styles.emptyTab}>
          <BarChart3 size={28} color={Colors.textMuted} />
          <Text style={styles.emptyTabTitle}>Building situation data</Text>
          <Text style={styles.emptyTabDesc}>
            Keep using tools and tracking how they help. Your playbook will learn which tools work best for each emotional situation.
          </Text>
        </View>
      )}

      {emptySituations.length > 0 && activeSituations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle2}>Not enough data yet</Text>
          <View style={styles.emptySituationGrid}>
            {emptySituations.map(cat => {
              const IconComp = SITUATION_ICON_MAP[cat.iconName];
              return (
                <View key={cat.id} style={styles.emptySituationChip}>
                  {IconComp && <IconComp size={14} color={cat.color} />}
                  <Text style={styles.emptySituationText}>{cat.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </>
  );
}

function EmotionsTab({ profiles }: { profiles: EmotionToolProfile[] }) {
  if (profiles.length === 0) {
    return (
      <View style={styles.emptyTab}>
        <Heart size={28} color={Colors.textMuted} />
        <Text style={styles.emptyTabTitle}>Learning your patterns</Text>
        <Text style={styles.emptyTabDesc}>
          As you log emotions when using tools, your playbook will show which tools work best for each feeling.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.situationIntro}>
        Tools that work best for you, organized by how you're feeling.
      </Text>
      {profiles.map(profile => {
        const colors = getEmotionColor(profile.emotion);
        return (
          <View key={profile.emotion} style={styles.emotionCard}>
            <View style={styles.emotionHeader}>
              <View style={[styles.emotionDot, { backgroundColor: colors.accent }]} />
              <Text style={styles.emotionName}>
                {profile.emotion.charAt(0).toUpperCase() + profile.emotion.slice(1)}
              </Text>
              <View style={[styles.emotionMeta, { backgroundColor: colors.bg }]}>
                <Text style={[styles.emotionMetaText, { color: colors.accent }]}>
                  {profile.totalUses}x · avg -{profile.avgReduction}
                </Text>
              </View>
            </View>
            <View style={styles.emotionToolsList}>
              {profile.bestTools.map((tool, idx) => (
                <View key={tool.toolId} style={styles.emotionToolRow}>
                  <View style={[styles.emotionToolRank, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.emotionToolRankText, { color: colors.accent }]}>{idx + 1}</Text>
                  </View>
                  <View style={styles.emotionToolInfo}>
                    <Text style={styles.emotionToolName}>{tool.toolTitle}</Text>
                    <Text style={styles.emotionToolMeta}>
                      {tool.avgDistressReduction > 0 ? `-${tool.avgDistressReduction} distress` : `${tool.totalUses}x used`}
                    </Text>
                  </View>
                  {tool.effectivenessScore > 50 && (
                    <View style={styles.emotionToolEffective}>
                      <Sparkles size={10} color={Colors.success} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </>
  );
}

function InsightsTab({
  insights,
  milestones,
}: {
  insights: PlaybookInsight[];
  milestones: PlaybookMilestone[];
}) {
  const achievedMilestones = milestones.filter(m => m.achieved);

  if (insights.length === 0 && achievedMilestones.length === 0) {
    return (
      <View style={styles.emptyTab}>
        <Sparkles size={28} color={Colors.textMuted} />
        <Text style={styles.emptyTabTitle}>Tool insights are building</Text>
        <Text style={styles.emptyTabDesc}>
          Mark which tools help after you use them. BPD Companion will show what lowers intensity for you.
        </Text>
      </View>
    );
  }

  const insightColors: Record<string, { bg: string; accent: string }> = {
    pattern: { bg: 'rgba(59, 130, 246, 0.18)', accent: Colors.brandLilac },
    effectiveness: { bg: Colors.successLight, accent: Colors.success },
    milestone: { bg: Colors.accentLight, accent: Colors.accent },
    suggestion: { bg: Colors.brandTealSoft, accent: Colors.brandTeal },
  };

  return (
    <>
      {insights.map(insight => {
        const colors = insightColors[insight.type] ?? insightColors.pattern;
        return (
          <View key={insight.id} style={[styles.insightCard, { borderLeftColor: colors.accent }]}>
            <View style={[styles.insightBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.insightBadgeText, { color: colors.accent }]}>
                {insight.type === 'pattern' ? 'Pattern' : insight.type === 'effectiveness' ? 'Effectiveness' : insight.type === 'milestone' ? 'Milestone' : 'Suggestion'}
              </Text>
            </View>
            <Text style={styles.insightText}>{insight.text}</Text>
          </View>
        );
      })}

      {achievedMilestones.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={15} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Milestones Achieved</Text>
          </View>
          {achievedMilestones.map(m => (
            <View key={m.id} style={styles.milestoneAchievedCard}>
              <Award size={18} color={Colors.success} />
              <View style={styles.milestoneAchievedInfo}>
                <Text style={styles.milestoneAchievedName}>{m.label}</Text>
                <Text style={styles.milestoneAchievedDesc}>{m.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function ToolCard({
  tool,
  rank,
  isPinned,
  onPin,
}: {
  tool: PersonalToolRecord;
  rank?: number;
  isPinned: boolean;
  onPin: (toolId: string) => void;
}) {
  const helpRate = tool.totalUses > 0 ? Math.round((tool.helpfulCount / tool.totalUses) * 100) : 0;

  return (
    <View style={styles.toolCard}>
      <View style={styles.toolCardLeft}>
        {rank && (
          <View style={styles.toolRank}>
            <Text style={styles.toolRankText}>{rank}</Text>
          </View>
        )}
        <View style={styles.toolCardInfo}>
          <Text style={styles.toolCardTitle}>{tool.toolTitle}</Text>
          <View style={styles.toolCardMetaRow}>
            {tool.avgDistressReduction > 0 && (
              <View style={styles.toolMetaBadge}>
                <Zap size={10} color={Colors.success} />
                <Text style={styles.toolMetaGreen}>-{tool.avgDistressReduction}</Text>
              </View>
            )}
            <Text style={styles.toolCardMeta}>{tool.totalUses}x used</Text>
            {helpRate > 0 && <Text style={styles.toolCardMeta}>· {helpRate}% helpful</Text>}
          </View>
          {tool.situations.length > 0 && (
            <View style={styles.toolSituationTags}>
              {tool.situations.slice(0, 2).map(sit => {
                const cat = SITUATION_CATEGORIES.find(c => c.id === sit);
                return cat ? (
                  <View key={sit} style={[styles.toolSituationTag, { backgroundColor: cat.bgColor }]}>
                    <Text style={[styles.toolSituationTagText, { color: cat.color }]}>{cat.label}</Text>
                  </View>
                ) : null;
              })}
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onPin(tool.toolId)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.pinBtn}
      >
        <Pin size={16} color={isPinned ? Colors.accent : Colors.textMuted} fill={isPinned ? Colors.accent : 'none'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginLeft: 28,
  },
  statsStrip: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  statPill: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  statPillValue: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  statPillLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    marginTop: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  tabRow: {
    maxHeight: 48,
  },
  tabRowContent: {
    paddingHorizontal: 20,
    gap: 6,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.brandNavy,
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 32,
  },
  emptySteps: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  emptyStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyStepNum: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Colors.brandTealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStepNumText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.brandTeal,
  },
  emptyStepText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
    flex: 1,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 15,
  },
  emptyBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  insightBannerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.accent,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  trendCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  trendLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  trendText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  topToolCard: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 20,
    marginBottom: 22,
  },
  topToolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  topToolBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  topToolName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 14,
  },
  topToolStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  topToolStat: {
    alignItems: 'center',
  },
  topToolStatValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  topToolStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    fontWeight: '500' as const,
  },
  topToolStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  topToolBar: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  topToolBarFill: {
    height: 5,
    backgroundColor: '#14B8A6',
    borderRadius: 3,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionTitle2: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toolCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  toolRank: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolRankText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  toolCardInfo: {
    flex: 1,
  },
  toolCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  toolCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  toolMetaGreen: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  toolCardMeta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  toolSituationTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  toolSituationTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  toolSituationTagText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  pinBtn: {
    padding: 6,
  },
  milestoneCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.brandLilac + '25',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.brandLilac,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  milestoneName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  milestoneDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  milestoneBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  milestoneBarFill: {
    height: 6,
    backgroundColor: Colors.brandLilac,
    borderRadius: 3,
  },
  milestoneProgress: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  achievedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  achievedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  situationIntro: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 18,
  },
  situationCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  situationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  situationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  situationInfo: {
    flex: 1,
  },
  situationLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  situationDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  situationInsight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.warmGlow,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  situationInsightText: {
    flex: 1,
    fontSize: 12,
    color: Colors.accent,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  situationTools: {
    gap: 8,
  },
  situationToolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  situationToolRank: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  situationToolRankText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  situationToolInfo: {
    flex: 1,
  },
  situationToolName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  situationToolMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  emotionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  emotionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emotionName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  emotionMeta: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emotionMetaText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  emotionToolsList: {
    gap: 8,
  },
  emotionToolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emotionToolRank: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionToolRankText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  emotionToolInfo: {
    flex: 1,
  },
  emotionToolName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emotionToolMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  emotionToolEffective: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTab: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 24,
  },
  emptyTabTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTabDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptySituationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptySituationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptySituationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  insightCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  insightBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  insightBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  milestoneAchievedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.successLight,
  },
  milestoneAchievedInfo: {
    flex: 1,
  },
  milestoneAchievedName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  milestoneAchievedDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
