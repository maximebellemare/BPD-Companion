import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/providers/AppProvider';
import {
  loadTherapyPlanState,
  saveTherapyPlanState,
  generateWeeklyPlan,
  togglePlanItemCompleted,
  getPlanProgress,
  shouldRegeneratePlan,
} from '@/services/therapy/adaptiveTherapyService';
import { TherapyPlanState } from '@/types/therapy';

export function useTherapyPlan() {
  const { journalEntries, messageDrafts } = useApp();
  const [state, setState] = useState<TherapyPlanState>({
    currentPlan: null,
    previousPlans: [],
    lastGeneratedAt: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const loaded = await loadTherapyPlanState();
        if (mounted) {
          setState(loaded);
          if (shouldRegeneratePlan(loaded) && journalEntries.length > 0) {
            console.log('[useTherapyPlan] Plan needs regeneration');
            const newPlan = generateWeeklyPlan(journalEntries, messageDrafts);
            const updated: TherapyPlanState = {
              currentPlan: newPlan,
              previousPlans: loaded.currentPlan
                ? [loaded.currentPlan, ...loaded.previousPlans].slice(0, 8)
                : loaded.previousPlans,
              lastGeneratedAt: Date.now(),
            };
            setState(updated);
            await saveTherapyPlanState(updated);
          }
        }
      } catch (error) {
        console.log('[useTherapyPlan] Error loading:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [journalEntries, messageDrafts]);

  const regeneratePlan = useCallback(async () => {
    setIsGenerating(true);
    try {
      const newPlan = generateWeeklyPlan(journalEntries, messageDrafts);
      const updated: TherapyPlanState = {
        currentPlan: newPlan,
        previousPlans: state.currentPlan
          ? [state.currentPlan, ...state.previousPlans].slice(0, 8)
          : state.previousPlans,
        lastGeneratedAt: Date.now(),
      };
      setState(updated);
      await saveTherapyPlanState(updated);
      console.log('[useTherapyPlan] Plan regenerated');
    } catch (error) {
      console.log('[useTherapyPlan] Error regenerating:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [journalEntries, messageDrafts, state]);

  const toggleItemCompleted = useCallback(async (itemId: string) => {
    if (!state.currentPlan) return;
    const updatedPlan = togglePlanItemCompleted(state.currentPlan, itemId);
    const updated: TherapyPlanState = {
      ...state,
      currentPlan: updatedPlan,
    };
    setState(updated);
    await saveTherapyPlanState(updated);
  }, [state]);

  const progress = useMemo(() => {
    if (!state.currentPlan) return { completed: 0, total: 0, percentage: 0 };
    return getPlanProgress(state.currentPlan);
  }, [state.currentPlan]);

  const todayItem = useMemo(() => {
    if (!state.currentPlan) return null;
    const dayOfWeek = new Date().getDay();
    const dayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
    return state.currentPlan.items.find(i => i.day === dayNum) ?? state.currentPlan.items.find(i => !i.completed) ?? null;
  }, [state.currentPlan]);

  return {
    plan: state.currentPlan,
    previousPlans: state.previousPlans,
    isLoading,
    isGenerating,
    progress,
    todayItem,
    regeneratePlan,
    toggleItemCompleted,
  };
}
