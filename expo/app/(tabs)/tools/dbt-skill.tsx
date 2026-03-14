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
  Zap,
  ThumbsUp,
  ThumbsDown,
  TrendingDown,
  BookOpen,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { DBTProgress, DBTPracticeLog, DEFAULT_DBT_PROGRESS } from '@/types/dbt';
import {
  getSkillById,
  getModuleById,
  getDBTProgress,
  markSkillPracticed,
  toggleFavoriteSkill,
} from '@/services/dbt/dbtCoachService';
import { savePracticeLog, getSkillInsight } from '@/services/dbt/dbtPracticeService';

type PracticeMode = 'full' | 'quick';
type ScreenState = 'detail' | 'practicing' | 'distress-before' | 'distress-after' | 'feedback' | 'completed';

export default function DBTSkillScreen() {
  const { skillId } = useLocalSearchParams<{ skillId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState<DBTProgress>(DEFAULT_DBT_PROGRESS);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [screenState, setScreenState] = useState<ScreenState>('detail');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('full');
  const [distressBefore, setDistressBefore] = useState<number>(5);
  const [distressAfter, setDistressAfter] = useState<number>(3);
  const [_helpful, setHelpful] = useState<boolean | null>(null);
  const [insightData, setInsightData] = useState<{ totalUses: number; avgDistressReduction: number } | null>(null);
  const stepAnim = useRef(new Animated.Value(0)).current;

  const skill = useMemo(() => getSkillById(skillId ?? ''), [skillId]);
  const module = useMemo(() => skill ? getModuleById(skill.moduleId) : undefined, [skill]);
  const hasQuickMode = useMemo(() => skill?.quickSteps && skill.quickSteps.length > 0, [skill]);

  const activeSteps = useMemo(() => {
    if (!skill) return [];
    if (practiceMode === 'quick' && skill.quickSteps && skill.quickSteps.length > 0) {
      return skill.quickSteps.map(qs => ({ title: qs.title, instruction: qs.instruction, tip: undefined, letter: qs.letter }));
    }
    return skill.steps.map(s => ({ ...s, letter: undefined }));
  }, [skill, practiceMode]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    getDBTProgress().then(setProgress).catch(e => console.log('[DBTSkill] Error loading progress:', e));
  }, []);

  useEffect(() => {
    if (skill) {
      getSkillInsight(skill.id).then(insight => {
        if (insight) {
          setInsightData({ totalUses: insight.totalUses, avgDistressReduction: insight.avgDistressReduction });
        }
      }).catch(e => console.log('[DBTSkill] Error loading insight:', e));
    }
  }, [skill]);

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

  const handleStartPractice = useCallback((mode: PracticeMode) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPracticeMode(mode);
    setScreenState('distress-before');
    setCurrentStep(0);
    setHelpful(null);
  }, []);

  const handleDistressBeforeSet = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreenState('practicing');
  }, []);

  const handleNextStep = useCallback(() => {
    if (!skill) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setScreenState('distress-after');
    }
  }, [skill, currentStep, activeSteps.length]);

  const handlePrevStep = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleDistressAfterSet = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreenState('feedback');
  }, []);

  const handleFeedback = useCallback(async (isHelpful: boolean) => {
    if (!skill) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHelpful(isHelpful);

    const log: DBTPracticeLog = {
      id: `practice-${Date.now()}`,
      skillId: skill.id,
      moduleId: skill.moduleId,
      timestamp: Date.now(),
      distressBefore,
      distressAfter,
      helpful: isHelpful,
      quickMode: practiceMode === 'quick',
    };

    await savePracticeLog(log);
    const updated = await markSkillPracticed(skill.id, progress);
    setProgress(updated);
    setScreenState('completed');
  }, [skill, distressBefore, distressAfter, practiceMode, progress]);

  const handleRestart = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(0);
    setScreenState('distress-before');
    setHelpful(null);
  }, []);

  const handleFinish = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreenState('detail');
    setCurrentStep(0);
    setHelpful(null);
  }, []);

  if (!skill || !module) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Skill not found</Text>
      </View>
    );
  }

  if (screenState === 'distress-before') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.distressHeader}>
          <TouchableOpacity onPress={handleFinish} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.distressHeaderTitle}>Before Practice</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.distressContent}>
          <Text style={styles.distressQuestion}>How intense is your distress right now?</Text>
          <Text style={styles.distressValue}>{distressBefore}</Text>
          <View style={styles.distressScale}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.distressDot,
                  distressBefore === val && { backgroundColor: module.color, transform: [{ scale: 1.3 }] },
                  distressBefore !== val && { backgroundColor: Colors.borderLight },
                ]}
                onPress={() => { void Haptics.selectionAsync(); setDistressBefore(val); }}
                testID={`distress-before-${val}`}
              >
                <Text style={[styles.distressDotText, distressBefore === val && { color: Colors.white, fontWeight: '700' as const }]}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.distressLabels}>
            <Text style={styles.distressLabel}>Low</Text>
            <Text style={styles.distressLabel}>High</Text>
          </View>
          <TouchableOpacity
            style={[styles.distressContinueBtn, { backgroundColor: module.color }]}
            onPress={handleDistressBeforeSet}
            activeOpacity={0.7}
            testID="distress-before-continue"
          >
            <Text style={styles.distressContinueText}>Start {practiceMode === 'quick' ? 'Quick' : 'Full'} Practice</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (screenState === 'distress-after') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.distressHeader}>
          <View style={{ width: 36 }} />
          <Text style={styles.distressHeaderTitle}>After Practice</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.distressContent}>
          <Text style={styles.distressQuestion}>How intense is your distress now?</Text>
          <Text style={styles.distressValue}>{distressAfter}</Text>
          <View style={styles.distressScale}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.distressDot,
                  distressAfter === val && { backgroundColor: module.color, transform: [{ scale: 1.3 }] },
                  distressAfter !== val && { backgroundColor: Colors.borderLight },
                ]}
                onPress={() => { void Haptics.selectionAsync(); setDistressAfter(val); }}
                testID={`distress-after-${val}`}
              >
                <Text style={[styles.distressDotText, distressAfter === val && { color: Colors.white, fontWeight: '700' as const }]}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.distressLabels}>
            <Text style={styles.distressLabel}>Low</Text>
            <Text style={styles.distressLabel}>High</Text>
          </View>
          {distressBefore > distressAfter && (
            <View style={styles.distressReductionCard}>
              <TrendingDown size={16} color={Colors.success} />
              <Text style={styles.distressReductionText}>
                Distress reduced by {distressBefore - distressAfter} point{distressBefore - distressAfter > 1 ? 's' : ''}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.distressContinueBtn, { backgroundColor: module.color }]}
            onPress={handleDistressAfterSet}
            activeOpacity={0.7}
            testID="distress-after-continue"
          >
            <Text style={styles.distressContinueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (screenState === 'feedback') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.feedbackContent}>
          <View style={[styles.feedbackIconCircle, { backgroundColor: module.bgColor }]}>
            <CheckCircle size={40} color={module.color} />
          </View>
          <Text style={styles.feedbackTitle}>Did this help?</Text>
          <Text style={styles.feedbackSubtitle}>Your feedback helps the app learn what works best for you</Text>
          <View style={styles.feedbackButtons}>
            <TouchableOpacity
              style={[styles.feedbackBtn, styles.feedbackBtnYes]}
              onPress={() => handleFeedback(true)}
              activeOpacity={0.7}
              testID="feedback-yes"
            >
              <ThumbsUp size={22} color={Colors.success} />
              <Text style={[styles.feedbackBtnText, { color: Colors.success }]}>Yes, it helped</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.feedbackBtn, styles.feedbackBtnNo]}
              onPress={() => handleFeedback(false)}
              activeOpacity={0.7}
              testID="feedback-no"
            >
              <ThumbsDown size={22} color={Colors.textMuted} />
              <Text style={[styles.feedbackBtnText, { color: Colors.textMuted }]}>Not this time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (screenState === 'completed') {
    const reduction = distressBefore - distressAfter;
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.completedContent}>
          <View style={[styles.completedIcon, { backgroundColor: module.bgColor }]}>
            <CheckCircle size={48} color={module.color} />
          </View>
          <Text style={styles.completedTitle}>Well Done</Text>
          <Text style={styles.completedMessage}>
            You completed {skill.title}. Every practice strengthens this skill.
          </Text>

          {reduction > 0 && (
            <View style={styles.completedStatCard}>
              <TrendingDown size={18} color={Colors.success} />
              <Text style={styles.completedStatText}>
                Distress went from {distressBefore} → {distressAfter} ({reduction > 0 ? '-' : ''}{reduction})
              </Text>
            </View>
          )}

          <Text style={styles.completedCount}>
            Practiced {practiceCount + 1} time{practiceCount !== 0 ? 's' : ''} total
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

  if (screenState === 'practicing') {
    const step = activeSteps[currentStep];
    const progressPercent = ((currentStep + 1) / activeSteps.length) * 100;

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
          <View style={styles.practiceHeaderCenter}>
            <Text style={styles.practiceHeaderTitle}>{skill.title}</Text>
            {practiceMode === 'quick' && (
              <View style={styles.quickBadge}>
                <Zap size={10} color={Colors.white} />
                <Text style={styles.quickBadgeText}>Quick</Text>
              </View>
            )}
          </View>
          <Text style={styles.stepCounter}>{currentStep + 1}/{activeSteps.length}</Text>
        </View>

        <View style={styles.practiceProgressBar}>
          <View style={[styles.practiceProgressFill, { width: `${progressPercent}%`, backgroundColor: module.color }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.practiceContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: stepAnim, transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            {step?.letter ? (
              <View style={[styles.stepLetterCircle, { backgroundColor: module.bgColor }]}>
                <Text style={[styles.stepLetterText, { color: module.color }]}>{step.letter}</Text>
              </View>
            ) : (
              <View style={[styles.stepIconCircle, { backgroundColor: module.bgColor }]}>
                <Text style={[styles.stepIconText, { color: module.color }]}>{currentStep + 1}</Text>
              </View>
            )}

            <Text style={styles.stepTitle}>{step?.title}</Text>
            <Text style={styles.stepInstruction}>{step?.instruction}</Text>

            {step?.tip && (
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
                {currentStep < activeSteps.length - 1 ? 'Next' : 'Complete'}
              </Text>
              <ChevronRight size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
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

          {insightData && insightData.totalUses >= 2 && (
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <TrendingDown size={14} color={Colors.success} />
                <Text style={styles.insightTitle}>Your Stats</Text>
              </View>
              <Text style={styles.insightText}>
                Avg distress reduction: {insightData.avgDistressReduction > 0 ? '-' : ''}{insightData.avgDistressReduction} points across {insightData.totalUses} practices
              </Text>
            </View>
          )}

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
          <View style={styles.startButtons}>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: module.color }]}
              onPress={() => handleStartPractice('full')}
              activeOpacity={0.7}
              testID="start-practice-btn"
            >
              <BookOpen size={18} color={Colors.white} />
              <Text style={styles.startBtnText}>Full Practice</Text>
            </TouchableOpacity>
            {hasQuickMode && (
              <TouchableOpacity
                style={[styles.quickStartBtn, { backgroundColor: module.bgColor, borderColor: module.color }]}
                onPress={() => handleStartPractice('quick')}
                activeOpacity={0.7}
                testID="start-quick-btn"
              >
                <Zap size={18} color={module.color} />
                <Text style={[styles.quickStartBtnText, { color: module.color }]}>Quick</Text>
              </TouchableOpacity>
            )}
          </View>
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
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
  favoriteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  detailScroll: {
    paddingHorizontal: 20,
    paddingBottom: 140,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap' as const,
  },
  metaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
  insightCard: {
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  insightHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  insightText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
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
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    marginBottom: 12,
  },
  stepPreviewNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
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
  startButtons: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  startBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: 8,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  quickStartBtn: {
    width: 90,
    height: 54,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: 6,
    borderWidth: 1.5,
  },
  quickStartBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  distressHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  distressHeaderTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  distressContent: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
  },
  distressQuestion: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 32,
    lineHeight: 28,
  },
  distressValue: {
    fontSize: 56,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 32,
  },
  distressScale: {
    flexDirection: 'row' as const,
    gap: 6,
    marginBottom: 8,
  },
  distressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  distressDotText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  distressLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    width: '100%' as const,
    paddingHorizontal: 4,
    marginBottom: 32,
  },
  distressLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  distressReductionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 24,
  },
  distressReductionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  distressContinueBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%' as const,
  },
  distressContinueText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  feedbackContent: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
  },
  feedbackIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  feedbackSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 36,
  },
  feedbackButtons: {
    gap: 12,
    width: '100%' as const,
  },
  feedbackBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  feedbackBtnYes: {
    backgroundColor: Colors.successLight,
  },
  feedbackBtnNo: {
    backgroundColor: Colors.surface,
  },
  feedbackBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  practiceHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  practiceHeaderCenter: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  practiceHeaderTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  quickBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  quickBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.white,
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
    alignItems: 'center' as const,
  },
  stepIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    alignSelf: 'center' as const,
    marginBottom: 28,
  },
  stepIconText: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  stepLetterCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    alignSelf: 'center' as const,
    marginBottom: 28,
  },
  stepLetterText: {
    fontSize: 28,
    fontWeight: '800' as const,
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
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  completedIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
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
    marginBottom: 16,
  },
  completedStatCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  completedStatText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  completedCount: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 36,
  },
  completedActions: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%' as const,
  },
  completedBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  completedBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
