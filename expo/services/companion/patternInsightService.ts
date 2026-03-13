import {
  CompanionMemoryStore,
} from '@/types/companionMemory';

export interface CompanionPatternInsight {
  id: string;
  category: 'trigger' | 'emotion' | 'relationship' | 'coping' | 'timing' | 'growth';
  title: string;
  narrative: string;
  importance: 'high' | 'medium' | 'low';
  generatedAt: number;
}

export function generateCompanionPatternInsights(
  store: CompanionMemoryStore,
): CompanionPatternInsight[] {
  const insights: CompanionPatternInsight[] = [];

  console.log('[CompanionPatternInsight] Generating insights from', store.episodicMemories.length, 'episodes,', store.semanticMemories.length, 'traits');

  insights.push(...detectTriggerPatterns(store));
  insights.push(...detectEmotionSpikePatterns(store));
  insights.push(...detectRelationshipCycles(store));
  insights.push(...detectCopingEffectiveness(store));
  insights.push(...detectGrowthSignals(store));

  return insights.slice(0, 12);
}

function detectTriggerPatterns(store: CompanionMemoryStore): CompanionPatternInsight[] {
  const insights: CompanionPatternInsight[] = [];
  const triggerCounts = new Map<string, number>();
  const recentEpisodes = store.episodicMemories.filter(
    m => Date.now() - m.timestamp < 30 * 24 * 60 * 60 * 1000,
  );

  for (const ep of recentEpisodes) {
    triggerCounts.set(ep.trigger, (triggerCounts.get(ep.trigger) ?? 0) + 1);
  }

  const sorted = Array.from(triggerCounts.entries()).sort(([, a], [, b]) => b - a);

  if (sorted.length > 0) {
    const [topTrigger, count] = sorted[0];
    if (count >= 3) {
      insights.push({
        id: `pat_trigger_top_${Date.now()}`,
        category: 'trigger',
        title: 'Most common trigger',
        narrative: `"${topTrigger}" has come up ${count} times in the past month. Recognizing this pattern is the first step toward responding differently.`,
        importance: 'high',
        generatedAt: Date.now(),
      });
    }
  }

  const weekRecent = recentEpisodes.filter(
    m => Date.now() - m.timestamp < 7 * 24 * 60 * 60 * 1000,
  );
  const weekTriggerCounts = new Map<string, number>();
  for (const ep of weekRecent) {
    weekTriggerCounts.set(ep.trigger, (weekTriggerCounts.get(ep.trigger) ?? 0) + 1);
  }

  for (const [trigger, weekCount] of weekTriggerCounts) {
    if (weekCount >= 3) {
      insights.push({
        id: `pat_trigger_spike_${trigger}_${Date.now()}`,
        category: 'trigger',
        title: 'Recurring trigger this week',
        narrative: `"${trigger}" has appeared ${weekCount} times this week. This might be a good time to explore what is driving this pattern.`,
        importance: 'high',
        generatedAt: Date.now(),
      });
    }
  }

  return insights;
}

function detectEmotionSpikePatterns(store: CompanionMemoryStore): CompanionPatternInsight[] {
  const insights: CompanionPatternInsight[] = [];
  const recentEpisodes = store.episodicMemories.filter(
    m => Date.now() - m.timestamp < 14 * 24 * 60 * 60 * 1000,
  );

  const highIntensity = recentEpisodes.filter(m => m.intensity && m.intensity >= 7);
  if (highIntensity.length >= 3) {
    const emotions = new Map<string, number>();
    for (const ep of highIntensity) {
      emotions.set(ep.emotion, (emotions.get(ep.emotion) ?? 0) + 1);
    }
    const topEmotion = Array.from(emotions.entries()).sort(([, a], [, b]) => b - a)[0];
    if (topEmotion) {
      insights.push({
        id: `pat_emotion_spike_${Date.now()}`,
        category: 'emotion',
        title: 'High-intensity emotion pattern',
        narrative: `"${topEmotion[0]}" has been reaching high intensity ${topEmotion[1]} times recently. It might help to have a plan ready for when this feeling arrives.`,
        importance: 'high',
        generatedAt: Date.now(),
      });
    }
  }

  return insights;
}

function detectRelationshipCycles(store: CompanionMemoryStore): CompanionPatternInsight[] {
  const insights: CompanionPatternInsight[] = [];
  const recentRelEpisodes = store.episodicMemories.filter(
    m => m.relationshipContext && Date.now() - m.timestamp < 30 * 24 * 60 * 60 * 1000,
  );

  if (recentRelEpisodes.length >= 3) {
    const triggerEmotionPairs = new Map<string, number>();
    for (const ep of recentRelEpisodes) {
      const key = `${ep.trigger}->${ep.emotion}`;
      triggerEmotionPairs.set(key, (triggerEmotionPairs.get(key) ?? 0) + 1);
    }

    const repeatedPairs = Array.from(triggerEmotionPairs.entries())
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a);

    if (repeatedPairs.length > 0) {
      const [pair, count] = repeatedPairs[0];
      const [trigger, emotion] = pair.split('->');
      insights.push({
        id: `pat_rel_cycle_${Date.now()}`,
        category: 'relationship',
        title: 'Relationship conflict cycle',
        narrative: `When "${trigger}" happens in relationships, it tends to bring up "${emotion}." This cycle has repeated ${count} times. Understanding this pattern can help you respond with more awareness.`,
        importance: 'high',
        generatedAt: Date.now(),
      });
    }
  }

  const abandonmentEpisodes = store.episodicMemories.filter(
    m => (m.trigger.toLowerCase().includes('abandon') || m.trigger.toLowerCase().includes('reject') || m.trigger.toLowerCase().includes('ignor')) &&
      Date.now() - m.timestamp < 30 * 24 * 60 * 60 * 1000,
  );

  if (abandonmentEpisodes.length >= 2) {
    insights.push({
      id: `pat_rel_abandon_${Date.now()}`,
      category: 'relationship',
      title: 'Abandonment sensitivity pattern',
      narrative: `Abandonment-related triggers have come up ${abandonmentEpisodes.length} times recently. This sensitivity is real and valid. Having a grounding plan for these moments can make a difference.`,
      importance: 'high',
      generatedAt: Date.now(),
    });
  }

  return insights;
}

function detectCopingEffectiveness(store: CompanionMemoryStore): CompanionPatternInsight[] {
  const insights: CompanionPatternInsight[] = [];
  const episodesWithCoping = store.episodicMemories.filter(
    m => m.copingUsed && m.copingUsed.length > 0 && m.outcome,
  );

  const copingOutcomes = new Map<string, { helped: number; total: number }>();
  for (const ep of episodesWithCoping) {
    for (const tool of ep.copingUsed!) {
      const existing = copingOutcomes.get(tool) ?? { helped: 0, total: 0 };
      existing.total += 1;
      if (ep.outcome === 'helped' || ep.outcome === 'managed') {
        existing.helped += 1;
      }
      copingOutcomes.set(tool, existing);
    }
  }

  const effective = Array.from(copingOutcomes.entries())
    .filter(([, stats]) => stats.total >= 2 && stats.helped / stats.total >= 0.5)
    .sort(([, a], [, b]) => (b.helped / b.total) - (a.helped / a.total));

  if (effective.length > 0) {
    const [tool, stats] = effective[0];
    const rate = Math.round((stats.helped / stats.total) * 100);
    insights.push({
      id: `pat_coping_effective_${Date.now()}`,
      category: 'coping',
      title: 'Your most effective tool',
      narrative: `"${tool}" has helped ${rate}% of the time across ${stats.total} uses. This is clearly working for you.`,
      importance: 'medium',
      generatedAt: Date.now(),
    });
  }

  return insights;
}

function detectGrowthSignals(store: CompanionMemoryStore): CompanionPatternInsight[] {
  const insights: CompanionPatternInsight[] = [];

  const recentSessions = store.sessionSummaries.filter(
    s => Date.now() - s.timestamp < 14 * 24 * 60 * 60 * 1000,
  );

  const sessionsWithInsights = recentSessions.filter(s => s.insight);
  if (sessionsWithInsights.length >= 2) {
    insights.push({
      id: `pat_growth_insight_${Date.now()}`,
      category: 'growth',
      title: 'Growing self-awareness',
      narrative: `You have had ${sessionsWithInsights.length} meaningful insights in the past two weeks. This kind of reflection builds real emotional resilience over time.`,
      importance: 'medium',
      generatedAt: Date.now(),
    });
  }

  const sessionsWithSkills = recentSessions.filter(s => s.skillsPracticed.length > 0);
  if (sessionsWithSkills.length >= 2) {
    const allSkills = sessionsWithSkills.flatMap(s => s.skillsPracticed);
    const uniqueSkills = [...new Set(allSkills)];
    insights.push({
      id: `pat_growth_skills_${Date.now()}`,
      category: 'growth',
      title: 'Consistent skill practice',
      narrative: `You have practiced ${uniqueSkills.length} different skill${uniqueSkills.length !== 1 ? 's' : ''} recently: ${uniqueSkills.slice(0, 3).join(', ')}. Building these habits creates lasting change.`,
      importance: 'medium',
      generatedAt: Date.now(),
    });
  }

  const recentEpisodes = store.episodicMemories.filter(
    m => Date.now() - m.timestamp < 14 * 24 * 60 * 60 * 1000,
  );
  const managedCount = recentEpisodes.filter(
    m => m.outcome === 'managed' || m.outcome === 'helped',
  ).length;

  if (managedCount >= 3) {
    insights.push({
      id: `pat_growth_managed_${Date.now()}`,
      category: 'growth',
      title: 'Managing emotional moments',
      narrative: `You successfully managed ${managedCount} emotional situations recently. Even when things feel hard, you are building real capacity.`,
      importance: 'medium',
      generatedAt: Date.now(),
    });
  }

  return insights;
}
