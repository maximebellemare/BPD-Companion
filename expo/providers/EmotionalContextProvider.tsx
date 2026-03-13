import { useMemo, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/providers/AppProvider';
import { JournalEntry, MessageDraft } from '@/types';
import { SafetyState } from '@/types/safetyPredictor';
import { predictEmotionalSafety } from '@/services/prediction/emotionalPredictor';

export type EmotionalZone = 'calm' | 'activated' | 'relationship_distress' | 'crisis' | 'recovering';

export type JourneyPhase =
  | 'idle'
  | 'triggered'
  | 'copilot_active'
  | 'regulating'
  | 'composing'
  | 'awaiting_outcome'
  | 'reflecting';

export interface ActiveContext {
  latestTrigger: string | null;
  latestTriggerCategory: string | null;
  latestEmotion: string | null;
  latestUrge: string | null;
  latestIntensity: number;
  latestIntent: string | null;
  latestDesiredOutcome: string | null;
  activeRelationshipContext: boolean;
  recentRewriteCount: number;
  recentPauseCount: number;
  recentCheckInCount: number;
  highDistressRecent: boolean;
  topCopingRecommendation: string | null;
}

export interface OutcomeRecord {
  id: string;
  timestamp: number;
  draftId: string | null;
  outcome: 'helped' | 'made_worse' | 'neutral' | 'not_sent';
  notes: string;
  journeyPhaseCompleted: JourneyPhase;
}

const _STORAGE_KEY = 'bpd_emotional_context';
const OUTCOMES_KEY = 'bpd_outcomes';

function computeEmotionalZone(
  entries: JournalEntry[],
  drafts: MessageDraft[],
): EmotionalZone {
  const recentHours = 4 * 60 * 60 * 1000;
  const now = Date.now();
  const recentEntries = entries.filter(e => now - e.timestamp < recentHours);
  const recentDrafts = drafts.filter(d => now - d.timestamp < recentHours);

  if (recentEntries.length === 0 && recentDrafts.length === 0) return 'calm';

  const maxIntensity = recentEntries.reduce(
    (max, e) => Math.max(max, e.checkIn.intensityLevel), 0
  );

  if (maxIntensity >= 8) return 'crisis';

  const hasRelTrigger = recentEntries.some(e =>
    e.checkIn.triggers.some(t => t.category === 'relationship')
  );
  const rewriteCount = recentDrafts.filter(d => d.rewrittenText).length;

  if (hasRelTrigger || rewriteCount >= 2) return 'relationship_distress';

  const recentManaged = recentEntries.filter(e => e.outcome === 'managed').length;
  if (recentManaged > 0 && maxIntensity < 4) return 'recovering';

  if (maxIntensity >= 5) return 'activated';

  return 'calm';
}

function computeActiveContext(
  entries: JournalEntry[],
  drafts: MessageDraft[],
): ActiveContext {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const recentEntries = entries.filter(e => now - e.timestamp < dayMs);
  const weekEntries = entries.filter(e => now - e.timestamp < weekMs);
  const recentDrafts = drafts.filter(d => now - d.timestamp < dayMs);
  const weekDrafts = drafts.filter(d => now - d.timestamp < weekMs);

  const latest = recentEntries[0];

  const latestTrigger = latest?.checkIn.triggers[0]?.label ?? null;
  const latestTriggerCategory = latest?.checkIn.triggers[0]?.category ?? null;
  const latestEmotion = latest?.checkIn.emotions[0]?.label ?? null;
  const latestUrge = latest?.checkIn.urges[0]?.label ?? null;
  const latestIntensity = latest?.checkIn.intensityLevel ?? 0;

  const activeRelationshipContext = recentEntries.some(e =>
    e.checkIn.triggers.some(t => t.category === 'relationship')
  ) || recentDrafts.length > 0;

  const recentRewriteCount = weekDrafts.filter(d => d.rewrittenText).length;
  const recentPauseCount = weekDrafts.filter(d => d.paused).length;
  const recentCheckInCount = weekEntries.length;
  const highDistressRecent = recentEntries.some(e => e.checkIn.intensityLevel >= 7);

  const copingCounts: Record<string, number> = {};
  weekEntries.forEach(e => {
    e.checkIn.copingUsed?.forEach(c => {
      copingCounts[c] = (copingCounts[c] || 0) + 1;
    });
  });
  const topCoping = Object.entries(copingCounts).sort(([, a], [, b]) => b - a)[0];

  return {
    latestTrigger,
    latestTriggerCategory,
    latestEmotion,
    latestUrge,
    latestIntensity,
    latestIntent: null,
    latestDesiredOutcome: null,
    activeRelationshipContext,
    recentRewriteCount,
    recentPauseCount,
    recentCheckInCount,
    highDistressRecent,
    topCopingRecommendation: topCoping?.[0] ?? null,
  };
}

function computeJourneyPhase(
  zone: EmotionalZone,
  context: ActiveContext,
  drafts: MessageDraft[],
): JourneyPhase {
  const hourMs = 60 * 60 * 1000;
  const now = Date.now();
  const veryRecentDrafts = drafts.filter(d => now - d.timestamp < hourMs);

  const hasUnrecordedOutcome = veryRecentDrafts.some(
    d => d.sent && !d.outcome && d.rewrittenText
  );

  if (hasUnrecordedOutcome) return 'awaiting_outcome';

  if (zone === 'crisis') return 'regulating';

  if (zone === 'relationship_distress') {
    if (veryRecentDrafts.some(d => d.rewrittenText && !d.sent)) return 'composing';
    return 'copilot_active';
  }

  if (zone === 'activated') return 'triggered';

  if (zone === 'recovering') return 'reflecting';

  return 'idle';
}

export interface HomePriority {
  key: string;
  priority: number;
  visible: boolean;
}

function computeHomePriorities(
  zone: EmotionalZone,
  context: ActiveContext,
  phase: JourneyPhase,
  safetyState: SafetyState = 'calm',
): HomePriority[] {
  const priorities: HomePriority[] = [];

  const add = (key: string, priority: number, visible: boolean) => {
    priorities.push({ key, priority, visible });
  };

  const isCrisis = zone === 'crisis';
  const isRelDistress = zone === 'relationship_distress';
  const isActivated = zone === 'activated';
  const isRecovering = zone === 'recovering';
  const isCalm = zone === 'calm';

  add('crisis_mode', isCrisis ? 1 : 99, isCrisis);
  add('crisis_regulation', isCrisis || (isActivated && context.highDistressRecent) ? 2 : 99,
    isCrisis || (isActivated && context.highDistressRecent));

  add('journey_flow', phase !== 'idle' ? 3 : 99, phase !== 'idle');

  add('relationship_guard', isRelDistress ? 4 : 99, isRelDistress);
  add('relationship_copilot', isRelDistress || context.activeRelationshipContext ? 5 : 99,
    isRelDistress || context.activeRelationshipContext);
  add('relationship_spiral', isRelDistress ? 6 : 99, isRelDistress);

  add('message_guard', (isRelDistress || context.recentRewriteCount > 0) ? 7 : 99,
    isRelDistress || context.recentRewriteCount > 0);

  add('personalized_suggestions', !isCrisis ? 10 : 99, !isCrisis);
  add('ai_companion', !isCrisis ? 11 : 99, !isCrisis);
  add('coaching', !isCrisis && context.recentCheckInCount >= 1 ? 12 : 99,
    !isCrisis && context.recentCheckInCount >= 1);

  add('daily_reflection', isCalm || isRecovering ? 13 : 20, true);
  add('weekly_ritual', isCalm || isRecovering ? 14 : 21, true);

  add('weekly_reflection', isRecovering || isCalm ? 15 : 22,
    context.recentCheckInCount >= 2);
  add('therapy_report', isRecovering || isCalm ? 16 : 23,
    context.recentCheckInCount >= 2);

  add('emotional_loops', !isCrisis ? 17 : 99, !isCrisis);
  add('progress_dashboard', isCalm || isRecovering ? 18 : 25, true);

  add('relationship_hub', !isCrisis && !isRelDistress ? 19 : 8,
    isRelDistress || context.recentRewriteCount > 0);

  add('home_insights', isCalm || isRecovering ? 20 : 30, true);
  add('emotional_profile', !isCrisis ? 24 : 99, !isCrisis);
  add('reflection_mirror', isRecovering || isCalm ? 25 : 99, isRecovering || isCalm);
  add('emotional_timeline', !isCrisis ? 26 : 99, !isCrisis);
  add('identity_builder', isCalm ? 27 : 99, isCalm);

  add('safety_predictor', safetyState !== 'calm' ? (safetyState === 'critical' ? 2 : safetyState === 'high_distress' ? 4 : 9) : 99, safetyState !== 'calm');

  add('storm_warning', 28, true);
  add('emotional_storm', 29, true);
  add('early_support', !isCrisis ? 30 : 99, !isCrisis);
  add('early_warning', !isCrisis ? 31 : 99, !isCrisis);
  add('breakthrough_moments', isCalm || isRecovering ? 19 : 24, !isCrisis);
  add('emotional_insights', isCalm || isRecovering ? 21 : 28, !isCrisis);
  add('emotional_trends', !isCrisis ? 32 : 99, !isCrisis);
  add('smart_coping', !isCrisis ? 33 : 99, !isCrisis);
  add('upgrade_prompt', isCalm || isRecovering ? 35 : 99, isCalm || isRecovering);
  add('insights_banner', 36, true);

  return priorities.sort((a, b) => a.priority - b.priority);
};

export const [EmotionalContextProvider, useEmotionalContext] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { journalEntries, messageDrafts } = useApp();
  const [journeyOverride, setJourneyOverride] = useState<JourneyPhase | null>(null);
  const [outcomes, setOutcomes] = useState<OutcomeRecord[]>([]);

  const outcomesQuery = useQuery({
    queryKey: ['emotional_outcomes'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(OUTCOMES_KEY);
        return stored ? JSON.parse(stored) as OutcomeRecord[] : [];
      } catch {
        return [];
      }
    },
  });

  const saveOutcomesMutation = useMutation({
    mutationFn: async (records: OutcomeRecord[]) => {
      await AsyncStorage.setItem(OUTCOMES_KEY, JSON.stringify(records));
      return records;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['emotional_outcomes'] });
    },
  });

  const zone = useMemo<EmotionalZone>(
    () => computeEmotionalZone(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const activeContext = useMemo<ActiveContext>(
    () => computeActiveContext(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const computedPhase = useMemo<JourneyPhase>(
    () => computeJourneyPhase(zone, activeContext, messageDrafts),
    [zone, activeContext, messageDrafts],
  );

  const journeyPhase = journeyOverride ?? computedPhase;

  const safetyPrediction = useMemo(
    () => predictEmotionalSafety(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );

  const homePriorities = useMemo(
    () => computeHomePriorities(zone, activeContext, journeyPhase, safetyPrediction.state),
    [zone, activeContext, journeyPhase, safetyPrediction.state],
  );

  const recordOutcome = useCallback((record: OutcomeRecord) => {
    const updated = [record, ...outcomes].slice(0, 100);
    setOutcomes(updated);
    saveOutcomesMutation.mutate(updated);
    console.log('[EmotionalContext] Outcome recorded:', record.outcome);
  }, [outcomes, saveOutcomesMutation]);

  const advanceJourney = useCallback((phase: JourneyPhase | null) => {
    console.log('[EmotionalContext] Journey advanced to:', phase);
    setJourneyOverride(phase);
  }, []);

  const getCardPriority = useCallback((key: string): number => {
    const item = homePriorities.find(p => p.key === key);
    return item?.priority ?? 99;
  }, [homePriorities]);

  const isCardVisible = useCallback((key: string): boolean => {
    const item = homePriorities.find(p => p.key === key);
    return item?.visible ?? true;
  }, [homePriorities]);

  const journeyLabel = useMemo(() => {
    switch (journeyPhase) {
      case 'triggered': return 'You seem activated right now';
      case 'copilot_active': return 'Relationship support is available';
      case 'regulating': return 'Take a moment to regulate';
      case 'composing': return 'Composing with care';
      case 'awaiting_outcome': return 'How did that go?';
      case 'reflecting': return 'A good moment to reflect';
      default: return null;
    }
  }, [journeyPhase]);

  const journeySuggestion = useMemo(() => {
    switch (journeyPhase) {
      case 'triggered':
        if (activeContext.activeRelationshipContext) {
          return { label: 'Open Relationship Copilot', route: '/relationship-copilot' };
        }
        return { label: 'Start Guided Regulation', route: '/guided-regulation' };
      case 'copilot_active':
        return { label: 'Open Relationship Copilot', route: '/relationship-copilot' };
      case 'regulating':
        return { label: 'Crisis Regulation', route: '/crisis-regulation' };
      case 'composing':
        return { label: 'Open Message Guard', route: '/message-guard' };
      case 'awaiting_outcome':
        return { label: 'Record how it went', route: '/(tabs)/messages' };
      case 'reflecting':
        return { label: 'Weekly Reflection', route: '/weekly-reflection' };
      default:
        return null;
    }
  }, [journeyPhase, activeContext.activeRelationshipContext]);

  return useMemo(() => ({
    zone,
    activeContext,
    journeyPhase,
    journeyLabel,
    journeySuggestion,
    homePriorities,
    outcomes,
    recordOutcome,
    advanceJourney,
    getCardPriority,
    isCardVisible,
    safetyPrediction,
    isLoading: outcomesQuery.isLoading,
  }), [
    zone,
    activeContext,
    journeyPhase,
    journeyLabel,
    journeySuggestion,
    homePriorities,
    outcomes,
    recordOutcome,
    advanceJourney,
    getCardPriority,
    isCardVisible,
    safetyPrediction,
    outcomesQuery.isLoading,
  ]);
});
