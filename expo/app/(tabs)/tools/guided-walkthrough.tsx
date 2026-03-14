import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
  ChevronRight,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { MENTALIZATION_TOOLS } from '@/data/mentalizationTools';
import { RELATIONSHIP_RECOVERY_TOOLS } from '@/data/relationshipRecoveryTools';
import { BODY_REGULATION_TOOLS } from '@/data/bodyRegulationTools';
import { DBT_SKILLS } from '@/data/dbtSkills';
import { saveToolOutcome, addToPlaybook } from '@/services/tools/toolOutcomeService';
import { ToolOutcome, PlaybookEntry } from '@/types/tools';

interface StepData {
  title: string;
  instruction: string;
  tip?: string;
}

interface ToolData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  steps: StepData[];
  whenToUse: string[];
  color: string;
  bgColor: string;
}

function getToolData(toolId: string, toolType: string): ToolData | null {
  if (toolType === 'mentalization') {
    const tool = MENTALIZATION_TOOLS.find(t => t.id === toolId);
    if (!tool) return null;
    return {
      id: tool.id,
      title: tool.title,
      subtitle: tool.subtitle,
      description: tool.description,
      duration: tool.duration,
      steps: tool.prompts.map(p => ({ title: p.title, instruction: p.instruction, tip: p.tip })),
      whenToUse: tool.whenToUse,
      color: '#9B8EC4',
      bgColor: '#F0ECF7',
    };
  }

  if (toolType === 'relationship-recovery') {
    const tool = RELATIONSHIP_RECOVERY_TOOLS.find(t => t.id === toolId);
    if (!tool) return null;
    return {
      id: tool.id,
      title: tool.title,
      subtitle: tool.subtitle,
      description: tool.description,
      duration: tool.duration,
      steps: tool.steps,
      whenToUse: tool.whenToUse,
      color: '#C47878',
      bgColor: '#F5E0E0',
    };
  }

  if (toolType === 'body-regulation') {
    const tool = BODY_REGULATION_TOOLS.find(t => t.id === toolId);
    if (!tool) return null;
    return {
      id: tool.id,
      title: tool.title,
      subtitle: tool.subtitle,
      description: tool.description,
      duration: tool.duration,
      steps: tool.steps,
      whenToUse: tool.whenToUse,
      color: '#4A8B8D',
      bgColor: '#E8F4F4',
    };
  }

  if (toolType === 'dbt') {
    const skill = DBT_SKILLS.find(s => s.id === toolId);
    if (!skill) return null;
    const moduleColors: Record<string, { color: string; bgColor: string }> = {
      'distress-tolerance': { color: '#E17055', bgColor: '#FDE8E3' },
      'emotional-regulation': { color: '#6B9080', bgColor: '#E3EDE8' },
      'interpersonal-effectiveness': { color: '#5B8FB9', bgColor: '#E3EFF7' },
      'mindfulness': { color: '#C77DBA', bgColor: '#F5E6F3' },
    };
    const colors = moduleColors[skill.moduleId] ?? { color: Colors.primary, bgColor: Colors.primaryLight };
    return {
      id: skill.id,
      title: skill.title,
      subtitle: skill.subtitle,
      description: skill.description,
      duration: skill.duration,
      steps: skill.steps,
      whenToUse: skill.whenToUse,
      color: colors.color,
      bgColor: colors.bgColor,
    };
  }

  return null;
}

export default function GuidedWalkthroughScreen() {
  const { toolId, toolType } = useLocalSearchParams<{ toolId: string; toolType: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [completed, setCompleted] = useState<boolean>(false);
  const [distressBefore] = useState<number>(0);
  const [distressAfter] = useState<number>(0);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const tool = useMemo(() => getToolData(toolId ?? '', toolType ?? ''), [toolId, toolType]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep, stepAnim]);

  const handleStart = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStep(0);
  }, []);

  const handleNext = useCallback(() => {
    if (!tool) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < tool.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setCompleted(true);
      setShowFeedback(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [tool, currentStep]);

  const handlePrev = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleRestart = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(0);
    setCompleted(false);
    setShowFeedback(false);
  }, []);

  const handleFeedback = useCallback(async (helpful: boolean) => {
    if (!tool) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const outcome: ToolOutcome = {
      id: `outcome-${Date.now()}`,
      toolId: tool.id,
      toolType: (toolType ?? 'mentalization') as ToolOutcome['toolType'],
      timestamp: Date.now(),
      distressBefore,
      distressAfter,
      helpful,
      urgeReduced: null,
    };
    await saveToolOutcome(outcome);

    if (helpful) {
      const entry: PlaybookEntry = {
        toolId: tool.id,
        toolType: (toolType ?? 'mentalization') as PlaybookEntry['toolType'],
        toolTitle: tool.title,
        pinned: false,
        addedAt: Date.now(),
        useCount: 1,
        avgHelpfulness: 1,
        bestForSituations: [],
      };
      await addToPlaybook(entry);
    }

    setShowFeedback(false);
  }, [tool, toolType, distressBefore, distressAfter]);

  const handleFinish = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  if (!tool) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Tool not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.errorLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (currentStep === -1) {
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
          </View>

          <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.typeBadge, { backgroundColor: tool.bgColor }]}>
              <Text style={[styles.typeBadgeText, { color: tool.color }]}>
                {(toolType ?? '').replace(/-/g, ' ')}
              </Text>
            </View>

            <Text style={styles.detailTitle}>{tool.title}</Text>
            <Text style={styles.detailSubtitle}>{tool.subtitle}</Text>

            <View style={styles.metaRow}>
              <View style={[styles.durationPill, { backgroundColor: tool.bgColor }]}>
                <Text style={[styles.durationPillText, { color: tool.color }]}>{tool.duration}</Text>
              </View>
              <Text style={styles.stepCount}>{tool.steps.length} steps</Text>
            </View>

            <Text style={styles.detailDesc}>{tool.description}</Text>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Steps Overview</Text>
              {tool.steps.map((step, i) => (
                <View key={i} style={styles.stepPreview}>
                  <View style={[styles.stepPreviewNum, { backgroundColor: tool.bgColor }]}>
                    <Text style={[styles.stepPreviewNumText, { color: tool.color }]}>{i + 1}</Text>
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
              {tool.whenToUse.map((item, i) => (
                <View key={i} style={styles.whenItem}>
                  <View style={[styles.whenDot, { backgroundColor: tool.color }]} />
                  <Text style={styles.whenText}>{item}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.startFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: tool.color }]}
              onPress={handleStart}
              activeOpacity={0.7}
              testID="start-walkthrough-btn"
            >
              <Text style={styles.startBtnText}>Begin</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }

  if (completed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.completedContent}>
          <View style={[styles.completedIcon, { backgroundColor: tool.bgColor }]}>
            <CheckCircle size={48} color={tool.color} />
          </View>
          <Text style={styles.completedTitle}>Well Done</Text>
          <Text style={styles.completedMessage}>
            You completed {tool.title}. Every time you practice a skill, it becomes more available when you need it.
          </Text>

          {showFeedback && (
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>Did this help?</Text>
              <Text style={styles.feedbackDesc}>Your feedback helps personalize your toolkit</Text>
              <View style={styles.feedbackRow}>
                <TouchableOpacity
                  style={[styles.feedbackBtn, styles.feedbackBtnYes]}
                  onPress={() => handleFeedback(true)}
                  activeOpacity={0.7}
                >
                  <ThumbsUp size={20} color={Colors.success} />
                  <Text style={[styles.feedbackBtnText, { color: Colors.success }]}>Yes, helpful</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.feedbackBtn, styles.feedbackBtnNo]}
                  onPress={() => handleFeedback(false)}
                  activeOpacity={0.7}
                >
                  <ThumbsDown size={20} color={Colors.textMuted} />
                  <Text style={[styles.feedbackBtnText, { color: Colors.textMuted }]}>Not really</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.completedActions}>
            <TouchableOpacity
              style={[styles.completedBtn, { backgroundColor: tool.bgColor }]}
              onPress={handleRestart}
              activeOpacity={0.7}
            >
              <RotateCcw size={18} color={tool.color} />
              <Text style={[styles.completedBtnText, { color: tool.color }]}>Practice Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.completedBtn, { backgroundColor: tool.color }]}
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

  const stepData = tool.steps[currentStep];
  const progressPercent = ((currentStep + 1) / tool.steps.length) * 100;

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
        <Text style={styles.practiceHeaderTitle} numberOfLines={1}>{tool.title}</Text>
        <Text style={styles.stepCounter}>{currentStep + 1}/{tool.steps.length}</Text>
      </View>

      <View style={styles.practiceProgressBar}>
        <View style={[styles.practiceProgressFill, { width: `${progressPercent}%`, backgroundColor: tool.color }]} />
      </View>

      <ScrollView contentContainerStyle={styles.practiceContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{
          opacity: stepAnim,
          transform: [{ translateY: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }}>
          <View style={[styles.stepIconCircle, { backgroundColor: tool.bgColor }]}>
            <Text style={[styles.stepIconText, { color: tool.color }]}>{currentStep + 1}</Text>
          </View>

          <Text style={styles.stepTitle}>{stepData.title}</Text>
          <Text style={styles.stepInstruction}>{stepData.instruction}</Text>

          {stepData.tip && (
            <View style={styles.tipCard}>
              <AlertCircle size={16} color={tool.color} />
              <Text style={[styles.tipText, { color: tool.color }]}>{stepData.tip}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.practiceFooter, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.practiceNav}>
          {currentStep > 0 ? (
            <TouchableOpacity style={styles.prevBtn} onPress={handlePrev} activeOpacity={0.7}>
              <Text style={styles.prevBtnText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.prevBtnPlaceholder} />
          )}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: tool.color }]}
            onPress={handleNext}
            activeOpacity={0.7}
            testID="walkthrough-next-btn"
          >
            <Text style={styles.nextBtnText}>
              {currentStep < tool.steps.length - 1 ? 'Next' : 'Complete'}
            </Text>
            <ChevronRight size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.paceHint}>Take your time. There's no rush.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorLink: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  detailScroll: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  typeBadge: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 14,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
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
  },
  durationPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationPillText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  stepCount: {
    fontSize: 13,
    color: Colors.textMuted,
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
    marginBottom: 14,
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
    marginTop: 7,
  },
  whenText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  startFooter: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
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
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 160,
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
    backgroundColor: Colors.warmGlow,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  practiceFooter: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
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
  paceHint: {
    textAlign: 'center' as const,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 10,
    fontStyle: 'italic' as const,
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
    marginBottom: 28,
  },
  feedbackSection: {
    alignItems: 'center',
    marginBottom: 28,
    width: '100%',
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  feedbackDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  feedbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  feedbackBtnYes: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success + '40',
  },
  feedbackBtnNo: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderLight,
  },
  feedbackBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
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
