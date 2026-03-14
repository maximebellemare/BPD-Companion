import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Shield,
  Waves,
  Users,
  Brain,
  ChevronLeft,
  Star,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  X,
  MessageCircle,
  HeartCrack,
  ShieldOff,
  Eye as EyeIcon,
  Wind,
  Heart,
  Flame,
  ChevronRight,
  Award,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { DBTModuleInfo, DBTProgress, DBTRecommendation, DEFAULT_DBT_PROGRESS } from '@/types/dbt';
import { DBT_SITUATIONAL_ENTRIES } from '@/data/dbtSkills';
import {
  getModules,
  getRecommendedSkills,
  getSkillById,
  getModuleProgress,
  getDBTProgress,
  searchSkills,
} from '@/services/dbt/dbtCoachService';
import { getBestSkillsForUser, getWeeklyStats } from '@/services/dbt/dbtPracticeService';
import { useApp } from '@/providers/AppProvider';

const MODULE_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Shield,
  Waves,
  Users,
  Brain,
};

const SITUATION_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  MessageCircle,
  HeartCrack,
  ShieldOff,
  Eye: EyeIcon,
  Zap,
  Flame,
  Wind,
  Heart,
};

interface BestSkill {
  skillId: string;
  score: number;
  reason: string;
}

interface WeeklyStatsData {
  practicesThisWeek: number;
  skillsTried: number;
  avgDistressReduction: number;
  mostUsedSkill: string | null;
}

export default function DBTCoachScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState<DBTProgress>(DEFAULT_DBT_PROGRESS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [bestSkills, setBestSkills] = useState<BestSkill[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatsData | null>(null);
  const { triggerPatterns, journalEntries } = useApp();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    getDBTProgress().then(setProgress).catch(e => console.log('[DBTCoach] Error loading progress:', e));
    getBestSkillsForUser().then(setBestSkills).catch(e => console.log('[DBTCoach] Error loading best skills:', e));
    getWeeklyStats().then(setWeeklyStats).catch(e => console.log('[DBTCoach] Error loading weekly stats:', e));
  }, []);

  const modules = useMemo(() => getModules(), []);

  const recommendations = useMemo<DBTRecommendation[]>(() => {
    const recentTriggers = Object.keys(triggerPatterns.triggerCounts);
    const recentEmotions = Object.keys(triggerPatterns.emotionCounts);
    const recentUrges = Object.keys(triggerPatterns.urgeCounts);
    const lastEntry = journalEntries[0];
    const distress = lastEntry?.checkIn?.intensityLevel ?? 3;
    return getRecommendedSkills(recentTriggers, recentEmotions, recentUrges, distress);
  }, [triggerPatterns, journalEntries]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchSkills(searchQuery);
  }, [searchQuery]);

  const handleModulePress = useCallback((moduleId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/tools/dbt-module?moduleId=${moduleId}` as never);
  }, [router]);

  const handleSkillPress = useCallback((skillId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/tools/dbt-skill?skillId=${skillId}` as never);
  }, [router]);

  const handleSituationPress = useCallback((situationId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const entry = DBT_SITUATIONAL_ENTRIES.find(e => e.id === situationId);
    if (entry && entry.skillIds.length > 0) {
      router.push(`/tools/dbt-skill?skillId=${entry.skillIds[0]}` as never);
    }
  }, [router]);

  const renderModuleCard = useCallback((module: DBTModuleInfo) => {
    const IconComponent = MODULE_ICONS[module.iconName];
    const { practiced, total } = getModuleProgress(module.id, progress);
    const progressPercent = total > 0 ? (practiced / total) * 100 : 0;

    return (
      <TouchableOpacity
        key={module.id}
        style={styles.moduleCard}
        onPress={() => handleModulePress(module.id)}
        activeOpacity={0.7}
        testID={`module-${module.id}`}
      >
        <View style={styles.moduleCardInner}>
          <View style={[styles.moduleIconWrap, { backgroundColor: module.bgColor }]}>
            {IconComponent && <IconComponent size={22} color={module.color} />}
          </View>
          <View style={styles.moduleInfo}>
            <Text style={styles.moduleTitle}>{module.title}</Text>
            <Text style={styles.moduleDesc} numberOfLines={1}>{module.description}</Text>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </View>
        <View style={styles.moduleFooter}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%`, backgroundColor: module.color },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {practiced}/{total} practiced
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [progress, handleModulePress]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>DBT Coach</Text>
            <Text style={styles.subtitle}>{progress.totalPractices > 0 ? `${progress.totalPractices} practices completed` : 'Guided skill training'}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search skills..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearching(true)}
              testID="dbt-search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setIsSearching(false); }}>
                <X size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isSearching && searchQuery.trim().length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {searchResults.length === 0 ? (
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No skills found for "{searchQuery}"</Text>
              </View>
            ) : (
              searchResults.map(skill => {
                const mod = modules.find(m => m.id === skill.moduleId);
                return (
                  <TouchableOpacity
                    key={skill.id}
                    style={styles.searchResultCard}
                    onPress={() => handleSkillPress(skill.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.searchResultLeft}>
                      <View style={[styles.searchResultDot, { backgroundColor: mod?.color ?? Colors.primary }]} />
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultTitle}>{skill.title}</Text>
                        <Text style={styles.searchResultModule}>{mod?.title ?? ''}</Text>
                      </View>
                    </View>
                    <View style={styles.searchResultMeta}>
                      <Clock size={12} color={Colors.textMuted} />
                      <Text style={styles.searchResultDuration}>{skill.duration}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's happening?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.situationScroll}>
                {DBT_SITUATIONAL_ENTRIES.map(entry => {
                  const IconComp = SITUATION_ICONS[entry.iconName];
                  return (
                    <TouchableOpacity
                      key={entry.id}
                      style={[styles.situationCard, { backgroundColor: entry.bgColor }]}
                      onPress={() => handleSituationPress(entry.id)}
                      activeOpacity={0.7}
                      testID={`situation-${entry.id}`}
                    >
                      <View style={[styles.situationIconWrap, { backgroundColor: entry.color + '20' }]}>
                        {IconComp && <IconComp size={16} color={entry.color} />}
                      </View>
                      <Text style={[styles.situationLabel, { color: entry.color }]} numberOfLines={1}>{entry.label}</Text>
                      <Text style={styles.situationSublabel} numberOfLines={1}>{entry.sublabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {weeklyStats && weeklyStats.practicesThisWeek > 0 && (
              <View style={styles.weeklyCard}>
                <View style={styles.weeklyHeader}>
                  <TrendingUp size={16} color={Colors.primary} />
                  <Text style={styles.weeklyTitle}>This Week</Text>
                </View>
                <View style={styles.weeklyStatsRow}>
                  <View style={styles.weeklyStat}>
                    <Text style={styles.weeklyStatValue}>{weeklyStats.practicesThisWeek}</Text>
                    <Text style={styles.weeklyStatLabel}>Practices</Text>
                  </View>
                  <View style={styles.weeklyStatDivider} />
                  <View style={styles.weeklyStat}>
                    <Text style={styles.weeklyStatValue}>{weeklyStats.skillsTried}</Text>
                    <Text style={styles.weeklyStatLabel}>Skills</Text>
                  </View>
                  {weeklyStats.avgDistressReduction > 0 && (
                    <>
                      <View style={styles.weeklyStatDivider} />
                      <View style={styles.weeklyStat}>
                        <View style={styles.weeklyReductionRow}>
                          <TrendingDown size={12} color={Colors.success} />
                          <Text style={[styles.weeklyStatValue, { color: Colors.success }]}>{weeklyStats.avgDistressReduction}</Text>
                        </View>
                        <Text style={styles.weeklyStatLabel}>Avg Reduction</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}

            {recommendations.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Zap size={16} color={Colors.accent} />
                  <Text style={styles.sectionTitle}>Recommended for You</Text>
                </View>
                {recommendations.map(rec => {
                  const skill = getSkillById(rec.skillId);
                  if (!skill) return null;
                  const mod = modules.find(m => m.id === skill.moduleId);
                  return (
                    <TouchableOpacity
                      key={rec.skillId}
                      style={styles.recCard}
                      onPress={() => handleSkillPress(rec.skillId)}
                      activeOpacity={0.7}
                      testID={`rec-${rec.skillId}`}
                    >
                      <View style={styles.recCardTop}>
                        <View style={[styles.recDot, { backgroundColor: mod?.color ?? Colors.primary }]} />
                        <View style={styles.recInfo}>
                          <Text style={styles.recTitle}>{skill.title}</Text>
                          <Text style={styles.recSubtitle} numberOfLines={1}>{skill.subtitle}</Text>
                        </View>
                        {skill.quickSteps && skill.quickSteps.length > 0 && (
                          <View style={styles.quickChip}>
                            <Zap size={10} color={Colors.accent} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.recReason}>{rec.reason}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {bestSkills.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Award size={16} color="#E8A838" />
                  <Text style={styles.sectionTitle}>Best Skills for You</Text>
                </View>
                {bestSkills.slice(0, 3).map(best => {
                  const skill = getSkillById(best.skillId);
                  if (!skill) return null;
                  const mod = modules.find(m => m.id === skill.moduleId);
                  return (
                    <TouchableOpacity
                      key={best.skillId}
                      style={styles.bestCard}
                      onPress={() => handleSkillPress(best.skillId)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.bestDot, { backgroundColor: mod?.color ?? Colors.primary }]} />
                      <View style={styles.bestInfo}>
                        <Text style={styles.bestTitle}>{skill.title}</Text>
                        <Text style={styles.bestReason}>{best.reason}</Text>
                      </View>
                      <ChevronRight size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {progress.favoriteSkills.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Star size={16} color="#E8A838" />
                  <Text style={styles.sectionTitle}>Favorites</Text>
                </View>
                {progress.favoriteSkills.map(skillId => {
                  const skill = getSkillById(skillId);
                  if (!skill) return null;
                  const mod = modules.find(m => m.id === skill.moduleId);
                  return (
                    <TouchableOpacity
                      key={skillId}
                      style={styles.favCard}
                      onPress={() => handleSkillPress(skillId)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.favDot, { backgroundColor: mod?.color ?? Colors.primary }]} />
                      <View style={styles.favInfo}>
                        <Text style={styles.favTitle}>{skill.title}</Text>
                        <Text style={styles.favMeta}>
                          Practiced {progress.completedSkills[skillId] || 0} times
                        </Text>
                      </View>
                      <ChevronRight size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Brain size={16} color={Colors.text} />
                <Text style={styles.sectionTitle}>Modules</Text>
              </View>
              {modules.map(renderModuleCard)}
            </View>

            <View style={styles.statsSection}>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{progress.totalPractices}</Text>
                  <Text style={styles.statLabel}>Total Practices</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {Object.keys(progress.completedSkills).filter(k => progress.completedSkills[k] > 0).length}
                  </Text>
                  <Text style={styles.statLabel}>Skills Tried</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{progress.favoriteSkills.length}</Text>
                  <Text style={styles.statLabel}>Favorites</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  situationScroll: {
    gap: 10,
    paddingRight: 20,
  },
  situationCard: {
    width: 120,
    borderRadius: 14,
    padding: 12,
    minHeight: 96,
  },
  situationIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  situationLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  situationSublabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  weeklyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  weeklyHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  weeklyTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  weeklyStatsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  weeklyStat: {
    flex: 1,
    alignItems: 'center' as const,
  },
  weeklyStatValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 2,
  },
  weeklyStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  weeklyStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderLight,
  },
  weeklyReductionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  recCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  recCardTop: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    marginBottom: 10,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  recInfo: {
    flex: 1,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  recSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  recReason: {
    fontSize: 13,
    color: Colors.accent,
    fontStyle: 'italic' as const,
    lineHeight: 18,
    paddingLeft: 22,
  },
  quickChip: {
    backgroundColor: Colors.accentLight,
    borderRadius: 6,
    padding: 4,
  },
  bestCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  bestDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bestInfo: {
    flex: 1,
  },
  bestTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  bestReason: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
  },
  favCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  favDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  favInfo: {
    flex: 1,
  },
  favTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  favMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  moduleCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  moduleCardInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    marginBottom: 14,
  },
  moduleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  moduleDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  moduleFooter: {
    gap: 6,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statsSection: {
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  emptySearch: {
    paddingTop: 40,
    alignItems: 'center' as const,
  },
  emptySearchText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  searchResultCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchResultLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  searchResultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  searchResultModule: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  searchResultMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginLeft: 8,
  },
  searchResultDuration: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
