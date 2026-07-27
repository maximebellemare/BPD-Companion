import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  ChevronRight,
  Shield,
  Star,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Timer,
  Anchor,
  Wind,
  BookOpen,
  Sparkles,
  Heart,
  Users,
  Edit3,
  Check,
  Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';
import { useLoopInterruptPlans } from '@/hooks/useLoopInterruptPlans';
import { useEmotionalLoops } from '@/hooks/useEmotionalLoops';
import { generateDefaultPlan } from '@/services/patterns/loopInterruptService';
import { InterruptPlan } from '@/types/emotionalLoop';

const STEP_ICONS: Record<string, typeof Timer> = {
  Timer, Anchor, Wind, BookOpen, Sparkles, Shield, Heart, Users,
};

export default function LoopInterruptPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useLanguage();
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const { plans, savePlan, toggleFavorite, markHelpful, deletePlan } = useLoopInterruptPlans();
  const report = useEmotionalLoops();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [editingTrigger, setEditingTrigger] = useState<boolean>(false);
  const [triggerText, setTriggerText] = useState<string>('');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const selectedPlan = useMemo(() => {
    if (planId) return plans.find(p => p.id === planId) ?? null;
    return null;
  }, [plans, planId]);

  useEffect(() => {
    if (selectedPlan) {
      setTriggerText(selectedPlan.triggerDescription);
    }
  }, [selectedPlan]);

  const allLoops = useMemo(() => [
    ...report.triggerChains,
    ...report.emotionChains,
    ...report.behaviorChains,
  ], [report]);

  const loopsWithoutPlans = useMemo(() => {
    const planLoopIds = new Set(plans.map(p => p.loopId));
    return allLoops.filter(l => !planLoopIds.has(l.id));
  }, [allLoops, plans]);

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleToggleFavorite = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleFavorite(id);
  }, [toggleFavorite]);

  const handleMarkHelpful = useCallback((id: string, helpful: boolean) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    markHelpful({ planId: id, helpful });
  }, [markHelpful]);

  const handleDeletePlan = useCallback((id: string) => {
    Alert.alert(
      'Remove Plan',
      'Are you sure you want to remove this interrupt plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deletePlan(id);
            if (planId === id) {
              router.back();
            }
          },
        },
      ],
    );
  }, [deletePlan, planId, router]);

  const handleStepPress = useCallback((route?: string) => {
    if (!route) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(route as never);
  }, [router]);

  const handleSaveTriggerText = useCallback(() => {
    if (!selectedPlan) return;
    setEditingTrigger(false);
    savePlan({ ...selectedPlan, triggerDescription: triggerText });
  }, [selectedPlan, triggerText, savePlan]);

  const handleCreateFromLoop = useCallback((loopId: string) => {
    const loop = allLoops.find(l => l.id === loopId);
    if (!loop) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const plan = generateDefaultPlan(loop);
    savePlan(plan);
    router.setParams({ planId: plan.id });
  }, [allLoops, savePlan, router]);

  if (selectedPlan) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Shield size={18} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Interrupt Plan</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} testID="close-plan">
            <X size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.triggerSection}>
              <Text style={styles.triggerLabel}>{localizedText('When I notice...', 'Cuando noto...')}</Text>
              {editingTrigger ? (
                <View style={styles.triggerEditRow}>
                  <TextInput
                    style={styles.triggerInput}
                    value={triggerText}
                    onChangeText={setTriggerText}
                    multiline
                    placeholder={localizedText('Describe what starts this loop...', 'Describe qué inicia este ciclo...')}
                    placeholderTextColor={Colors.textMuted}
                    testID="trigger-input"
                  />
                  <TouchableOpacity style={styles.triggerSaveBtn} onPress={handleSaveTriggerText}>
                    <Check size={18} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.triggerDisplay}
                  onPress={() => setEditingTrigger(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.triggerText}>{selectedPlan.triggerDescription}</Text>
                  <Edit3 size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.stepsLabel}>My steps:</Text>

            <View style={styles.stepsContainer}>
              {selectedPlan.steps.map((step, idx) => {
                const IconComp = STEP_ICONS[step.icon] ?? Shield;
                return (
                  <TouchableOpacity
                    key={step.id}
                    style={styles.stepCard}
                    onPress={() => handleStepPress(step.route)}
                    activeOpacity={step.route ? 0.7 : 1}
                    testID={`step-${idx}`}
                  >
                    <View style={styles.stepNumberWrap}>
                      <Text style={styles.stepNumber}>{idx + 1}</Text>
                    </View>
                    <View style={styles.stepIconWrap}>
                      <IconComp size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.stepTextWrap}>
                      <Text style={styles.stepTitle}>{step.label}</Text>
                      <Text style={styles.stepDesc}>{step.description}</Text>
                    </View>
                    {step.route && <ChevronRight size={14} color={Colors.textMuted} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, selectedPlan.isFavorite && styles.actionButtonActive]}
                onPress={() => handleToggleFavorite(selectedPlan.id)}
                activeOpacity={0.7}
                testID="toggle-favorite"
              >
                <Star
                  size={18}
                  color={selectedPlan.isFavorite ? '#67E8F9' : Colors.textMuted}
                  fill={selectedPlan.isFavorite ? '#67E8F9' : 'transparent'}
                />
                <Text style={[styles.actionButtonLabel, selectedPlan.isFavorite && { color: '#67E8F9' }]}>
                  {selectedPlan.isFavorite ? 'Favorited' : 'Favorite'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, selectedPlan.isHelpful === true && styles.actionButtonHelpful]}
                onPress={() => handleMarkHelpful(selectedPlan.id, true)}
                activeOpacity={0.7}
                testID="mark-helpful"
              >
                <ThumbsUp
                  size={16}
                  color={selectedPlan.isHelpful === true ? Colors.primary : Colors.textMuted}
                  fill={selectedPlan.isHelpful === true ? Colors.primaryLight : 'transparent'}
                />
                <Text style={[styles.actionButtonLabel, selectedPlan.isHelpful === true && { color: Colors.primary }]}>Helpful</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, selectedPlan.isHelpful === false && styles.actionButtonNotHelpful]}
                onPress={() => handleMarkHelpful(selectedPlan.id, false)}
                activeOpacity={0.7}
              >
                <ThumbsDown
                  size={16}
                  color={selectedPlan.isHelpful === false ? Colors.danger : Colors.textMuted}
                />
                <Text style={[styles.actionButtonLabel, selectedPlan.isHelpful === false && { color: Colors.danger }]}>Not yet</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePlan(selectedPlan.id)}
              activeOpacity={0.7}
              testID="delete-plan"
            >
              <Trash2 size={16} color={Colors.danger} />
              <Text style={styles.deleteButtonText}>Remove this plan</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Shield size={18} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Interrupt Plans</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton} testID="close-plans">
          <X size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {plans.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Shield size={32} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>{localizedText('No interrupt plans yet', 'Aún no hay planes de interrupción')}</Text>
              <Text style={styles.emptyDesc}>
                When you view a loop detail, you can create a personalized interrupt plan with steps to follow when that pattern starts.
              </Text>
            </View>
          )}

          {plans.length > 0 && (
            <>
              <Text style={styles.listSectionTitle}>{localizedText('Your Plans', 'Tus planes')}</Text>
              {plans.map(plan => (
                <PlanListItem
                  key={plan.id}
                  plan={plan}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    router.push(`/loop-interrupt-plan?planId=${plan.id}` as never);
                  }}
                />
              ))}
            </>
          )}

          {loopsWithoutPlans.length > 0 && (
            <>
              <Text style={[styles.listSectionTitle, { marginTop: 24 }]}>Create a plan for...</Text>
              {loopsWithoutPlans.slice(0, 5).map(loop => (
                <TouchableOpacity
                  key={loop.id}
                  style={styles.suggestCard}
                  onPress={() => handleCreateFromLoop(loop.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestIconWrap}>
                    <Plus size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.suggestTextWrap}>
                    <Text style={styles.suggestLabel} numberOfLines={1}>
                      {loop.nodes.map(n => n.label).join(' → ')}
                    </Text>
                    {loop.narrative ? (
                      <Text style={styles.suggestNarrative} numberOfLines={1}>{loop.narrative}</Text>
                    ) : null}
                  </View>
                  <ChevronRight size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const PlanListItem = React.memo(function PlanListItem({
  plan,
  onPress,
}: {
  plan: InterruptPlan;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.planItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.planItemLeft}>
        {plan.isFavorite && (
          <Star size={14} color="#67E8F9" fill="#67E8F9" style={{ marginRight: 6 }} />
        )}
        <View style={styles.planItemTextWrap}>
          <Text style={styles.planItemTrigger} numberOfLines={1}>{plan.triggerDescription}</Text>
          <Text style={styles.planItemSteps}>{plan.steps.length} step{plan.steps.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>
      <View style={styles.planItemRight}>
        {plan.isHelpful === true && (
          <ThumbsUp size={12} color={Colors.primary} fill={Colors.primaryLight} style={{ marginRight: 6 }} />
        )}
        <ChevronRight size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  triggerSection: {
    backgroundColor: Colors.warmGlow,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  triggerLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
    marginBottom: 8,
  },
  triggerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 23,
  },
  triggerEditRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  triggerInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    minHeight: 50,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  triggerSaveBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  stepsContainer: {
    gap: 8,
    marginBottom: 24,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  stepNumberWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextWrap: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stepDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionButtonActive: {
    borderColor: '#67E8F9',
    backgroundColor: '#FFFFFF',
  },
  actionButtonHelpful: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  actionButtonNotHelpful: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.danger,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  planItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planItemTextWrap: {
    flex: 1,
  },
  planItemTrigger: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  planItemSteps: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  planItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderStyle: 'dashed',
  },
  suggestIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestTextWrap: {
    flex: 1,
  },
  suggestLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  suggestNarrative: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
