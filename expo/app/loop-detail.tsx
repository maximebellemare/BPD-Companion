import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  ChevronRight,
  ArrowRight,
  ArrowDown,
  Timer,
  Anchor,
  Wind,
  BookOpen,
  Sparkles,
  Shield,
  Heart,
  Users,
  Zap,
  Target,
  TrendingDown,
  CircleDot,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useEmotionalLoops } from '@/hooks/useEmotionalLoops';
import { useLoopInterruptPlans } from '@/hooks/useLoopInterruptPlans';
import { mapLoopDetail } from '@/services/patterns/loopMappingService';
import { generateDefaultPlan } from '@/services/patterns/loopInterruptService';
import { LoopNodeType, LoopPhase } from '@/types/emotionalLoop';
import { useLanguage } from '@/hooks/useLanguage';
import { localizedText } from '@/lib/i18n/staticText';

const NODE_COLORS: Record<LoopNodeType, { bg: string; text: string; border: string; accent: string }> = {
  trigger: { bg: '#FFFFFF', text: '#3B82F6', border: '#D9E2EC', accent: '#3B82F6' },
  emotion: { bg: '#FFFFFF', text: '#3B82F6', border: '#2E2A72', accent: '#3B82F6' },
  urge: { bg: '#FFFFFF', text: '#3B82F6', border: '#D9E2EC', accent: '#3B82F6' },
  behavior: { bg: '#FFFFFF', text: '#3B82F6', border: '#3B82F6', accent: '#3B82F6' },
  outcome: { bg: Colors.successLight, text: '#14B8A6', border: '#D9E2EC', accent: '#14B8A6' },
  coping: { bg: Colors.primaryLight, text: Colors.primaryDark, border: '#14B8A6', accent: Colors.primaryDark },
};

const PHASE_ICONS: Record<string, typeof Timer> = {
  trigger: Zap,
  emotion: Heart,
  urge: Target,
  behavior: ArrowRight,
  outcome: TrendingDown,
  coping: Shield,
};

const INTERVENTION_ICONS: Record<string, typeof Timer> = {
  Timer, Anchor, Wind, BookOpen, Sparkles, Shield, Heart, Users,
};

export default function LoopDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loopId } = useLocalSearchParams<{ loopId: string }>();
  const report = useEmotionalLoops();
  const { plans, savePlan } = useLoopInterruptPlans();
  useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const allLoops = useMemo(() => [
    ...report.triggerChains,
    ...report.emotionChains,
    ...report.behaviorChains,
  ], [report]);

  const loop = useMemo(() => allLoops.find(l => l.id === loopId), [allLoops, loopId]);

  const detail = useMemo(() => {
    if (!loop) return null;
    return mapLoopDetail(loop, report.interruptPoints);
  }, [loop, report.interruptPoints]);

  const existingPlan = useMemo(
    () => plans.find(p => p.loopId === loopId),
    [plans, loopId],
  );

  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const handleInterrupt = useCallback((route: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(route as never);
  }, [router]);

  const handleCreatePlan = useCallback(() => {
    if (!loop) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const plan = generateDefaultPlan(loop);
    savePlan(plan);
    router.push(`/loop-interrupt-plan?planId=${plan.id}` as never);
  }, [loop, savePlan, router]);

  const handleViewPlan = useCallback(() => {
    if (!existingPlan) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/loop-interrupt-plan?planId=${existingPlan.id}` as never);
  }, [existingPlan, router]);

  if (!loop || !detail) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{localizedText('Loop Detail', 'Detalle del bucle')}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {localizedText(
              'This loop could not be found. It may have changed as new data was added.',
              'No pudimos encontrar este bucle. Puede haber cambiado al agregarse nuevos datos.',
            )}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleClose}>
            <Text style={styles.backButtonText}>{localizedText('Go back', 'Volver')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const allPhases: { phase: LoopPhase; type: LoopNodeType }[] = [
    { phase: detail.triggerPhase, type: 'trigger' as const },
    { phase: detail.emotionalRise, type: 'emotion' as const },
    { phase: detail.urgePhase, type: 'urge' as const },
    { phase: detail.actionPhase, type: 'behavior' as const },
    { phase: detail.aftereffect, type: 'outcome' as const },
  ];
  const phases = allPhases.filter(p => p.phase.nodes.length > 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <CircleDot size={18} color={Colors.accent} />
          </View>
          <Text style={styles.headerTitle}>{localizedText('Loop Detail', 'Detalle del bucle')}</Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID="close-loop-detail"
        >
          <X size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryChain}>
              {loop.nodes.map((node, idx) => (
                <React.Fragment key={node.id}>
                  {idx > 0 && <ArrowRight size={14} color={Colors.textMuted} style={styles.chainArrow} />}
                  <View style={[styles.summaryNode, { backgroundColor: NODE_COLORS[node.type].bg, borderColor: NODE_COLORS[node.type].border }]}>
                    <Text style={[styles.summaryNodeLabel, { color: NODE_COLORS[node.type].text }]}>{node.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
            {loop.narrative ? (
              <Text style={styles.summaryNarrative}>{loop.narrative}</Text>
            ) : null}
            <View style={styles.summaryMeta}>
              <View style={styles.metaChip}>
                <Text style={styles.metaLabel}>{detail.frequencyLabel}</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaLabel}>{detail.distressLabel}</Text>
              </View>
              {detail.isRelationshipRelated && (
                <View style={[styles.metaChip, { backgroundColor: '#FFFFFF' }]}>
                  <Heart size={10} color="#3B82F6" />
                  <Text style={[styles.metaLabel, { color: '#3B82F6' }]}>{localizedText('Relationship', 'Relación')}</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.sectionTitle}>{localizedText('How this loop unfolds', 'Cómo se desarrolla este bucle')}</Text>

          <View style={styles.phasesContainer}>
            {phases.map((p, idx) => {
              const nodeColors = NODE_COLORS[p.type];
              const PhaseIcon = PHASE_ICONS[p.type] ?? CircleDot;
              return (
                <View key={p.type + idx}>
                  <View style={styles.phaseCard}>
                    <View style={styles.phaseHeader}>
                      <View style={[styles.phaseIconWrap, { backgroundColor: nodeColors.bg }]}>
                        <PhaseIcon size={16} color={nodeColors.accent} />
                      </View>
                      <View style={styles.phaseTextWrap}>
                        <Text style={styles.phaseLabel}>{p.phase.label}</Text>
                        {p.phase.intensity > 0 && (
                          <View style={styles.intensityBar}>
                            <View style={[styles.intensityFill, { width: `${Math.min(p.phase.intensity * 10, 100)}%`, backgroundColor: nodeColors.accent }]} />
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.phaseDescription}>{p.phase.description}</Text>
                    {p.phase.nodes.length > 0 && (
                      <View style={styles.phaseNodes}>
                        {p.phase.nodes.map(n => (
                          <View key={n.id} style={[styles.phaseNodeChip, { backgroundColor: nodeColors.bg, borderColor: nodeColors.border }]}>
                            <Text style={[styles.phaseNodeText, { color: nodeColors.text }]}>{n.label}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  {idx < phases.length - 1 && (
                    <View style={styles.phaseConnector}>
                      <ArrowDown size={16} color={Colors.textMuted} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {detail.interruptOptions.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{localizedText('Where to interrupt', 'Dónde interrumpirlo')}</Text>
              {detail.interruptOptions.slice(0, 4).map(point => (
                <View key={point.id} style={styles.interruptCard}>
                  <Text style={styles.interruptNarrative}>{point.narrative}</Text>
                  <View style={styles.interruptSuggestions}>
                    {point.suggestions.map(s => {
                      const IconComp = INTERVENTION_ICONS[s.icon] ?? Sparkles;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={styles.interruptAction}
                          onPress={() => handleInterrupt(s.route)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.interruptActionIcon}>
                            <IconComp size={14} color={Colors.primary} />
                          </View>
                          <Text style={styles.interruptActionLabel}>{s.label}</Text>
                          <ChevronRight size={12} color={Colors.textMuted} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={styles.planSection}>
            {existingPlan ? (
              <TouchableOpacity
                style={styles.planButton}
                onPress={handleViewPlan}
                activeOpacity={0.7}
                testID="view-interrupt-plan"
              >
                <View style={styles.planButtonIcon}>
                  <Shield size={20} color={Colors.white} />
                </View>
                <View style={styles.planButtonText}>
                  <Text style={styles.planButtonTitle}>{localizedText('View Your Interrupt Plan', 'Ver tu plan de interrupción')}</Text>
                  <Text style={styles.planButtonDesc}>{localizedText('You have a plan saved for this loop', 'Tienes un plan guardado para este bucle')}</Text>
                </View>
                <ChevronRight size={16} color={Colors.white} style={{ opacity: 0.7 }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.createPlanButton}
                onPress={handleCreatePlan}
                activeOpacity={0.7}
                testID="create-interrupt-plan"
              >
                <View style={styles.createPlanIcon}>
                  <Shield size={20} color={Colors.primary} />
                </View>
                <View style={styles.createPlanText}>
                  <Text style={styles.createPlanTitle}>{localizedText('Create an Interrupt Plan', 'Crear un plan de interrupción')}</Text>
                  <Text style={styles.createPlanDesc}>{localizedText('Save personalized steps to interrupt this loop', 'Guarda pasos personalizados para interrumpir este bucle')}</Text>
                </View>
                <ChevronRight size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
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
    backgroundColor: Colors.accentLight,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryChain: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  chainArrow: {
    marginHorizontal: 2,
  },
  summaryNode: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  summaryNodeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  summaryNarrative: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  summaryMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  phasesContainer: {
    marginBottom: 24,
  },
  phaseCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  phaseIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseTextWrap: {
    flex: 1,
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  intensityBar: {
    height: 3,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  intensityFill: {
    height: 3,
    borderRadius: 2,
  },
  phaseDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  phaseNodes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  phaseNodeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  phaseNodeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  phaseConnector: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  interruptCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  interruptNarrative: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 10,
  },
  interruptSuggestions: {
    gap: 6,
  },
  interruptAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  interruptActionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interruptActionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  planSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  planButtonIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planButtonText: {
    flex: 1,
  },
  planButtonTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 2,
  },
  planButtonDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  createPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    borderStyle: 'dashed',
  },
  createPlanIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPlanText: {
    flex: 1,
  },
  createPlanTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  createPlanDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
