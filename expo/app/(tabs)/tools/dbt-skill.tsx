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
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  RotateCcw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { DBTProgress, DEFAULT_DBT_PROGRESS } from '@/types/dbt';
import {
  getSkillById,
  getModuleById,
  getDBTProgress,
  markSkillPracticed,
  toggleFavoriteSkill,
} from '@/services/dbt/dbtCoachService';

export default function DBTSkillScreen() {
  const { skillId } = useLocalSearchParams<{ skillId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState<DBTProgress>(DEFAULT_DBT_PROGRESS);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [practicing, setPracticing] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const stepAnim = useRef(new Animated.Value(0)).current;

  const skill = useMemo(() => getSkillById(skillId ?? ''), [skillId]);
  const module = useMemo(() => skill ? getModuleById(skill.moduleId) : undefined, [skill]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    getDBTProgress().then(setProgress).catch(e => console.log('Error loading progress:', e));
  }, []);

  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep, stepAnim]);

  const isFavorite = useMemo(() => {
    return skill ? progress.favoriteSkills.includes(skill.id) : false;
  }, [progress.favoriteSkills, skill]);

  const practiceCount = useMemo(() => {
    return skill ? (progress.completedSkills[skill.id] || 0) : 0;
  }, [progress.completedSkills, skill]);

  const handleToggleFavorite = useCallback(async () => {
    if (!skill) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await toggleFavoriteSkill(skill.id, progress);
    setProgress(updated);
  }, [skill, progress]);

  const handleStartPractice = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPracticing(true);
    setCurrentStep(0);
    setCompleted(false);
  }, []);

  const handleNextStep = useCallback(() => {
    if (!skill) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < skill.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCompleted(true);
      markSkillPracticed(skill.id, progress).then(setProgress).catch(e => console.log('Error marking practiced:', e));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [skill, currentStep, progress]);

  const handlePrevStep = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleRestart = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(0);
    setCompleted(false);
  }, []);

  const handleFinish = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPracticing(false);
    setCompleted(false);
    setCurrentStep(0);
  }, []);

  if (!skill || !module) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Skill not found</Text>
      </View>
    );
  }

  if (practicing && !completed) {
    const step = skill.steps[currentStep];
    const progressPercent = ((currentStep + 1) / skill.steps.length) * 100;

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.practiceHeader}>
          <TouchableOpacity
            onPress={handleFinish}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.practiceHeaderTitle}>{skill.title}</Text>
          <Text style={styles.stepCounter}>{currentStep + 1}/{skill.steps.length}</Text>
        </View>

        <View style={styles.practiceProgressBar}>
          <View style={[styles.practiceProgressFill, { width: `${progressPercent}%`, backgroundColor: module.color }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.practiceContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            <View style={[styles.stepIconCircle, { backgroundColor: module.bgColor }]}>
              <Text style={[styles.stepIconText, { color: module.color }]}>{currentStep + 1}</Text>
            </View>

            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepInstruction}>{step.instruction}</Text>

            {step.tip && (
              <View style={styles.tipCard}>
                <AlertCircle size={16} color={Colors.accent} />
                <Text style={styles.tipText}>{step.tip}</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={[styles.practiceFooter, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.practiceNav}>
            {currentStep > 0 ? (
              <TouchableOpacity
                style={styles.prevBtn}
                onPress={handlePrevStep}
                activeOpacity={0.7}
              >
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.prevBtnPlaceholder} />
            )}
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: module.color }]}
              onPress={handleNextStep}
              activeOpacity={0.7}
              testID="next-step-btn"
            >
              <Text style={styles.nextBtnText}>
                {currentStep < skill.steps.length - 1 ? 'Next' : 'Complete'}
              </Text>
              <ChevronRight size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (completed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.completedContent}>
          <View style={[styles.completedIcon, { backgroundColor: module.bgColor }]}>
            <CheckCircle size={48} color={module.color} />
          </View>
          <Text style={styles.completedTitle}>Well Done</Text>
          <Text style={styles.completedMessage}>
            You completed {skill.title}. Every time you practice, you strengthen this skill.
          </Text>
          <Text style={styles.completedCount}>
            Practiced {practiceCount + 1} time{practiceCount !== 0 ? 's' : ''}
          </Text>

          <View style={styles.completedActions}>
            <TouchableOpacity
              style={[styles.completedBtn, { backgroundColor: module.bgColor }]}
              onPress={handleRestart}
              activeOpacity={0.7}
            >
              <RotateCcw size={18} color={module.color} />
              <Text style={[styles.completedBtnText, { color: module.color }]}>Practice Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.completedBtn, { backgroundColor: module.color }]}
              onPress={handleFinish}
              activeOpacity={0.7}
            >
              <Text style={[styles.completedBtnText, { color: Colors.white }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.detailHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={styles.favoriteBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Star
              size={22}
              color={isFavorite ? '#E8A838' : Colors.textMuted}
              fill={isFavorite ? '#E8A838' : 'none'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.detailScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.skillBadge, { backgroundColor: module.bgColor }]}>
            <Text style={[styles.skillBadgeText, { color: module.color }]}>{module.title}</Text>
          </View>

          <Text style={styles.detailTitle}>{skill.title}</Text>
          <Text style={styles.detailSubtitle}>{skill.subtitle}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={14} color={Colors.textMuted} />
              <Text style={styles.metaText}>{skill.duration}</Text>
            </View>
            <View style={[styles.diffPill, { backgroundColor: getDiffColor(skill.difficulty).bg }]}>
              <Text style={[styles.diffPillText, { color: getDiffColor(skill.difficulty).text }]}>
                {skill.difficulty}
              </Text>
            </View>
            {practiceCount > 0 && (
              <View style={styles.metaItem}>
                <CheckCircle size={14} color={Colors.success} />
                <Text style={styles.metaText}>{practiceCount}x practiced</Text>
              </View>
            )}
          </View>

          <Text style={styles.detailDesc}>{skill.description}</Text>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Steps</Text>
            {skill.steps.map((step, i) => (
              <View key={i} style={styles.stepPreview}>
                <View style={[styles.stepPreviewNum, { backgroundColor: module.bgColor }]}>
                  <Text style={[styles.stepPreviewNumText, { color: module.color }]}>{i + 1}</Text>
                </View>
                <View style={styles.stepPreviewContent}>
                  <Text style={styles.stepPreviewTitle}>{step.title}</Text>
                  <Text style={styles.stepPreviewDesc} numberOfLines={2}>{step.instruction}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>When to Use</Text>
            {skill.whenToUse.map((item, i) => (
              <View key={i} style={styles.whenItem}>
                <View style={styles.whenDot} />
                <Text style={styles.whenText}>{item}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.detailFooter, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: module.color }]}
            onPress={handleStartPractice}
            activeOpacity={0.7}
            testID="start-practice-btn"
          >
            <Text style={styles.startBtnText}>Start Practice</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

function getDiffColor(difficulty: string): { bg: string; text: string } {
  switch (difficulty) {
    case 'beginner': return { bg: '#E0F5EF', text: '#00B894' };
    case 'intermediate': return { bg: '#FFF8F0', text: '#D4956A' };
    case 'advanced': return { bg: '#FDE8E3', text: '#E17055' };
    default: return { bg: Colors.surface, text: Colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 40,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailScroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  skillBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  skillBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  detailSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap' as const,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  diffPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  diffPillText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  detailDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 28,
  },
  detailSection: {
    marginBottom: 28,
  },
  detailSectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  stepPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepPreviewNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepPreviewNumText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  stepPreviewContent: {
    flex: 1,
  },
  stepPreviewTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  stepPreviewDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  whenItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  whenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 6,
  },
  whenText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  detailFooter: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  startBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  practiceHeaderTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stepCounter: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  practiceProgressBar: {
    height: 3,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden' as const,
    marginBottom: 8,
  },
  practiceProgressFill: {
    height: 3,
    borderRadius: 2,
  },
  practiceContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 120,
    alignItems: 'center',
  },
  stepIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center' as const,
    marginBottom: 28,
  },
  stepIconText: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  stepInstruction: {
    fontSize: 17,
    color: Colors.textSecondary,
    lineHeight: 28,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.accentLight,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.accent,
    lineHeight: 21,
  },
  practiceFooter: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
  },
  practiceNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  prevBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  prevBtnText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  prevBtnPlaceholder: {
    width: 60,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    flex: 1,
    maxWidth: 200,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  completedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  completedIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  completedMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 12,
  },
  completedCount: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 36,
  },
  completedActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  completedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  completedBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
