import { COACH_MODULES } from '@/data/coach/coachModules';
import { CoachModule, CoachModuleCategory } from '@/types/coachModule';

export function getAllCoachModules(): CoachModule[] {
  return COACH_MODULES;
}

export function getCoachModuleById(moduleId: string): CoachModule | undefined {
  return COACH_MODULES.find(m => m.id === moduleId);
}

export function getCoachModulesByCategory(category: CoachModuleCategory): CoachModule[] {
  return COACH_MODULES.filter(m => m.category === category);
}

export function getCoachModulesByTag(tag: string): CoachModule[] {
  return COACH_MODULES.filter(m => m.tags.includes(tag));
}

export function searchCoachModules(query: string): CoachModule[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];
  return COACH_MODULES.filter(
    m =>
      m.title.toLowerCase().includes(lower) ||
      m.introText.toLowerCase().includes(lower) ||
      m.tags.some(t => t.toLowerCase().includes(lower))
  );
}

export function getRecommendedModules(signals: string[]): CoachModule[] {
  const SIGNAL_MODULE_MAP: Record<string, string[]> = {
    high_distress: ['cm-grounding-spike', 'cm-riding-waves', 'cm-sitting-with-feelings'],
    relationship_trigger: ['cm-relationship-sensitivity', 'cm-pause-conflict', 'cm-repairing-conversations'],
    abandonment_fear: ['cm-abandonment-fear', 'cm-catastrophic-thoughts', 'cm-relationship-sensitivity'],
    emotional_overwhelm: ['cm-grounding-spike', 'cm-riding-waves', 'cm-emotional-triggers'],
    communication_anxiety: ['cm-slow-messages', 'cm-pause-conflict', 'cm-repairing-conversations'],
    identity_confusion: ['cm-sense-of-self', 'cm-self-compassion', 'cm-emotional-boundaries'],
    recent_conflict: ['cm-self-compassion', 'cm-repairing-conversations', 'cm-pause-conflict'],
    post_conflict_reflection: ['cm-self-compassion', 'cm-repairing-conversations', 'cm-emotional-patterns'],
    crisis_recovery: ['cm-grounding-spike', 'cm-self-compassion', 'cm-riding-waves'],
    calm_growth: ['cm-emotional-patterns', 'cm-sense-of-self', 'cm-emotional-boundaries'],
    self_worth_struggle: ['cm-self-compassion', 'cm-sense-of-self', 'cm-emotional-boundaries'],
    trigger_awareness: ['cm-emotional-triggers', 'cm-emotional-spirals', 'cm-catastrophic-thoughts'],
  };

  const moduleIds = new Set<string>();
  for (const signal of signals) {
    const ids = SIGNAL_MODULE_MAP[signal] ?? [];
    ids.forEach(id => moduleIds.add(id));
  }

  const result: CoachModule[] = [];
  for (const id of moduleIds) {
    const mod = COACH_MODULES.find(m => m.id === id);
    if (mod) result.push(mod);
  }

  console.log('[CoachService] Recommended modules for signals', signals, ':', result.map(m => m.id));
  return result.slice(0, 3);
}

export function getPostEventModules(flowSource: string): CoachModule[] {
  const FLOW_MODULE_MAP: Record<string, string[]> = {
    relationship_copilot: ['cm-pause-conflict', 'cm-repairing-conversations', 'cm-relationship-sensitivity'],
    crisis_regulation: ['cm-grounding-spike', 'cm-riding-waves', 'cm-sitting-with-feelings'],
    message_guard: ['cm-slow-messages', 'cm-pause-conflict', 'cm-catastrophic-thoughts'],
    spiral_detection: ['cm-emotional-spirals', 'cm-emotional-triggers', 'cm-grounding-spike'],
    weekly_reflection: ['cm-emotional-patterns', 'cm-sense-of-self', 'cm-self-compassion'],
    check_in: ['cm-emotional-triggers', 'cm-riding-waves', 'cm-emotional-patterns'],
  };

  const ids = FLOW_MODULE_MAP[flowSource] ?? [];
  return ids
    .map(id => COACH_MODULES.find(m => m.id === id))
    .filter((m): m is CoachModule => m !== undefined)
    .slice(0, 2);
}

export function generateSessionInsight(moduleId: string, responses: Record<string, string>): string {
  const mod = getCoachModuleById(moduleId);
  if (!mod) return 'You completed a guided learning session.';

  const responseValues = Object.values(responses).filter(r => r.trim().length > 0);
  const hasReflections = responseValues.length > 0;

  const insightTemplates: Record<string, string[]> = {
    emotional_regulation: [
      'You explored how your emotions move and what helps them settle.',
      'You practiced recognizing emotional patterns and finding calm within intensity.',
      'You took time to understand your emotional responses with compassion.',
    ],
    relationships: [
      'You explored how relationships affect your emotional world.',
      'You practiced understanding relationship sensitivity with self-awareness.',
      'You reflected on connection patterns and how to navigate them.',
    ],
    triggers_abandonment: [
      'You gently explored how abandonment fear shows up and how to hold it.',
      'You practiced staying grounded when fear of loss arises.',
    ],
    self_identity: [
      'You took steps toward building a stronger sense of who you are.',
      'You practiced self-compassion and self-awareness.',
    ],
    communication: [
      'You practiced more mindful communication strategies.',
      'You explored how to express yourself clearly during difficult moments.',
    ],
    crisis_coping: [
      'You practiced techniques for managing intense emotional moments.',
      'You built coping tools for when emotions feel overwhelming.',
    ],
    grounding: [
      'You practiced grounding yourself in the present moment.',
      'You explored sensory techniques for emotional regulation.',
    ],
  };

  const categoryInsights = insightTemplates[mod.category] ?? ['You completed a guided learning session.'];
  const baseInsight = categoryInsights[Math.floor(Math.random() * categoryInsights.length)];

  if (hasReflections) {
    return `${baseInsight} You shared ${responseValues.length} reflection${responseValues.length > 1 ? 's' : ''} along the way.`;
  }

  return baseInsight;
}

export function getSkillForModule(moduleId: string): string | null {
  const SKILL_MAP: Record<string, string> = {
    'cm-emotional-triggers': 'Trigger Recognition',
    'cm-pause-conflict': 'Conflict Pausing',
    'cm-abandonment-fear': 'Abandonment Management',
    'cm-emotional-spirals': 'Spiral Interruption',
    'cm-riding-waves': 'Emotional Wave Riding',
    'cm-slow-messages': 'Message Mindfulness',
    'cm-self-compassion': 'Self Compassion',
    'cm-grounding-spike': 'Grounding',
    'cm-relationship-sensitivity': 'Relationship Awareness',
    'cm-catastrophic-thoughts': 'Thought Reframing',
    'cm-emotional-patterns': 'Pattern Recognition',
    'cm-repairing-conversations': 'Conversation Repair',
    'cm-sense-of-self': 'Identity Building',
    'cm-sitting-with-feelings': 'Distress Tolerance',
    'cm-emotional-boundaries': 'Boundary Setting',
  };
  return SKILL_MAP[moduleId] ?? null;
}
