import {
  SmartRecommendation,
  RecommendationToolId,
  UserContextSnapshot,
  ToolEffectiveness,
} from '@/types/smartRecommendation';

const URGENCY_MULTIPLIER: Record<string, number> = {
  immediate: 1.5,
  suggested: 1.0,
  gentle: 0.7,
};

const ONBOARDING_TOOL_MAP: Record<string, RecommendationToolId[]> = {
  relationship_spirals: ['relationship_copilot', 'message_guard', 'conflict_reflection'],
  fear_of_abandonment: ['reality_check', 'companion', 'self_soothe'],
  impulsive_messaging: ['message_guard', 'pause_mode', 'breathing_exercise'],
  emotional_overwhelm: ['crisis_regulation', 'guided_regulation', 'grounding_exercise', 'companion'],
  therapy_support: ['therapy_prep', 'weekly_reflection', 'journal'],
  building_stability: ['daily_ritual', 'check_in', 'movement_log'],
  understanding_patterns: ['learn_article', 'companion', 'weekly_reflection'],
  medication_routine: ['medication_log', 'daily_ritual', 'check_in'],
};

const PREFERRED_TOOL_MAP: Record<string, RecommendationToolId[]> = {
  ai_companion: ['companion'],
  journaling: ['journal', 'weekly_reflection'],
  grounding: ['grounding_exercise', 'breathing_exercise'],
  pause_before_messaging: ['message_guard', 'pause_mode'],
  relationship_support: ['relationship_copilot', 'relationship_hub'],
  reflections_insights: ['weekly_reflection', 'learn_article'],
  dbt_tools: ['opposite_action', 'reality_check', 'emotional_playbook'],
  routines_reminders: ['daily_ritual', 'check_in', 'medication_log'],
};

function applyOnboardingBoost(
  rec: SmartRecommendation,
  ctx: UserContextSnapshot,
): number {
  let boost = 0;

  for (const reason of ctx.primaryReasons) {
    const preferred = ONBOARDING_TOOL_MAP[reason] ?? [];
    if (preferred.includes(rec.toolId)) {
      boost += 12;
      break;
    }
  }

  for (const tool of ctx.preferredTools) {
    const mapped = PREFERRED_TOOL_MAP[tool] ?? [];
    if (mapped.includes(rec.toolId)) {
      boost += 8;
      break;
    }
  }

  return boost;
}

function applyEffectivenessBoost(
  rec: SmartRecommendation,
  effectiveness: ToolEffectiveness[],
): number {
  const match = effectiveness.find(e => e.toolId === rec.toolId);
  if (!match || match.usageCount < 2) return 0;

  if (match.effectivenessScore >= 0.7) return 10;
  if (match.effectivenessScore >= 0.5) return 5;
  if (match.effectivenessScore < 0.3 && match.usageCount >= 3) return -8;

  return 0;
}

function applyTimeOfDayBoost(rec: SmartRecommendation, ctx: UserContextSnapshot): number {
  if (ctx.isLateNight) {
    if (rec.toolId === 'self_soothe' || rec.toolId === 'pause_mode') return 10;
    if (rec.toolId === 'learn_article' || rec.toolId === 'weekly_reflection') return -5;
  }
  return 0;
}

function deduplicateByTool(recs: SmartRecommendation[]): SmartRecommendation[] {
  const seen = new Set<RecommendationToolId>();
  const result: SmartRecommendation[] = [];

  for (const rec of recs) {
    if (!seen.has(rec.toolId)) {
      seen.add(rec.toolId);
      result.push(rec);
    }
  }

  return result;
}

export function rankRecommendations(
  recommendations: SmartRecommendation[],
  ctx: UserContextSnapshot,
  effectiveness: ToolEffectiveness[] = [],
): SmartRecommendation[] {
  console.log('[Ranking] Ranking', recommendations.length, 'recommendations');

  const scored = recommendations.map(rec => {
    const urgencyMult = URGENCY_MULTIPLIER[rec.urgency] ?? 1.0;
    const onboardingBoost = applyOnboardingBoost(rec, ctx);
    const effectivenessBoost = applyEffectivenessBoost(rec, effectiveness);
    const timeBoost = applyTimeOfDayBoost(rec, ctx);

    const finalScore = Math.round(
      (rec.score * urgencyMult) + onboardingBoost + effectivenessBoost + timeBoost
    );

    return {
      ...rec,
      score: finalScore,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const deduped = deduplicateByTool(scored);

  console.log('[Ranking] Top 3:', deduped.slice(0, 3).map(r => `${r.title}(${r.score})`).join(', '));

  return deduped;
}
