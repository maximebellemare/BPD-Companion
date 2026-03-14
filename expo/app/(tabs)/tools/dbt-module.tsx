import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Shield,
  Waves,
  Users,
  Brain,
  Clock,
  ChevronRight,
  Star,
  CheckCircle2,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { DBTModule, DBTProgress, DEFAULT_DBT_PROGRESS } from '@/types/dbt';
import {
  getModuleById,
  getSkillsByModule,
  getDBTProgress,
} from '@/services/dbt/dbtCoachService';

const MODULE_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Shield,
  Waves,
  Users,
  Brain,
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: '#E0F5EF', text: '#00B894' },
  intermediate: { bg: '#FFF8F0', text: '#D4956A' },
  advanced: { bg: '#FDE8E3', text: '#E17055' },
};

export default function DBTModuleScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState<DBTProgress>(DEFAULT_DBT_PROGRESS);

  const module = useMemo(() => getModuleById(moduleId as DBTModule), [moduleId]);
  const skills = useMemo(() => getSkillsByModule(moduleId as DBTModule), [moduleId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    getDBTProgress().then(setProgress).catch(e => console.log('[DBTModule] Error loading progress:', e));
  }, []);

  const handleSkillPress = useCallback((skillId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/tools/dbt-skill?skillId=${skillId}` as never);
  }, [router]);

  if (!module) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Module not found</Text>
      </View>
    );
  }

  const IconComponent = MODULE_ICONS[module.iconName];
  const practicedCount = skills.filter(s => (progress.completedSkills[s.id] || 0) > 0).length;

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
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.moduleBanner, { backgroundColor: module.bgColor }]}>
            <View style={[styles.bannerIcon, { backgroundColor: module.color + '20' }]}>
              {IconComponent && <IconComponent size={32} color={module.color} />}
            </View>
            <Text style={[styles.bannerTitle, { color: module.color }]}>{module.title}</Text>
            <Text style={styles.bannerDesc}>{module.description}</Text>
            <View style={styles.bannerStats}>
              <Text style={styles.bannerStatText}>{skills.length} skills</Text>
              <View style={styles.bannerStatDot} />
              <Text style={styles.bannerStatText}>
                {practicedCount} practiced
              </Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>{skills.length} skills available</Text>
          </View>

          <View style={styles.skillsList}>
            {skills.map((skill, index) => {
              const practiced = (progress.completedSkills[skill.id] || 0) > 0;
              const isFavorite = progress.favoriteSkills.includes(skill.id);
              const diffStyle = DIFFICULTY_COLORS[skill.difficulty] ?? { bg: Colors.surface, text: Colors.textSecondary };
              const hasQuick = skill.quickSteps && skill.quickSteps.length > 0;
              const practiceCount = progress.completedSkills[skill.id] || 0;

              return (
                <TouchableOpacity
                  key={skill.id}
                  style={styles.skillCard}
                  onPress={() => handleSkillPress(skill.id)}
                  activeOpacity={0.7}
                  testID={`skill-${skill.id}`}
                >
                  <View style={styles.skillCardTop}>
                    <View style={styles.skillCardLeft}>
                      <View style={styles.skillNumber}>
                        {practiced ? (
                          <CheckCircle2 size={18} color={Colors.success} />
                        ) : (
                          <Text style={styles.skillNumberText}>{index + 1}</Text>
                        )}
                      </View>
                      <View style={styles.skillInfo}>
                        <View style={styles.skillTitleRow}>
                          <Text style={styles.skillTitle} numberOfLines={1}>{skill.title}</Text>
                          {isFavorite && <Star size={14} color="#E8A838" fill="#E8A838" />}
                        </View>
                        <Text style={styles.skillSubtitle} numberOfLines={2}>{skill.subtitle}</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={Colors.textMuted} />
                  </View>
                  <View style={styles.skillCardBottom}>
                    <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg }]}>
                      <Text style={[styles.diffText, { color: diffStyle.text }]}>{skill.difficulty}</Text>
                    </View>
                    <View style={styles.durationBadge}>
                      <Clock size={12} color={Colors.textMuted} />
                      <Text style={styles.durationText}>{skill.duration}</Text>
                    </View>
                    {hasQuick && (
                      <View style={styles.quickBadge}>
                        <Zap size={10} color={Colors.accent} />
                        <Text style={styles.quickText}>Quick mode</Text>
                      </View>
                    )}
                    {practiceCount > 0 && (
                      <Text style={styles.practiceCount}>
                        {practiceCount}x
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  moduleBanner: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  bannerIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  bannerDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 16,
  },
  bannerStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  bannerStatText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  bannerStatDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  filterRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 14,
  },
  filterLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  skillsList: {
    gap: 10,
  },
  skillCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  skillCardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  skillCardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    flex: 1,
  },
  skillNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 2,
  },
  skillNumberText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  skillInfo: {
    flex: 1,
  },
  skillTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 4,
  },
  skillTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  skillSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  skillCardBottom: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  durationBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  quickBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quickText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  practiceCount: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500' as const,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 40,
  },
});
