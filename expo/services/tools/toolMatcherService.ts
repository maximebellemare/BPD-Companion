import { ToolMatchResult } from '@/types/tools';
import { DBT_SKILLS } from '@/data/dbtSkills';
import { MENTALIZATION_TOOLS } from '@/data/mentalizationTools';
import { RELATIONSHIP_RECOVERY_TOOLS } from '@/data/relationshipRecoveryTools';
import { BODY_REGULATION_TOOLS } from '@/data/bodyRegulationTools';

interface MatchContext {
  emotions: string[];
  triggers: string[];
  urges: string[];
  distressLevel: number;
  relationshipContext: boolean;
}

const EMOTION_TOOL_MAP: Record<string, string[]> = {
  anger: ['dt-stop', 'er-opposite-action', 'br-movement-reset', 'rr-come-down-anger', 'br-temperature-shift'],
  shame: ['rr-shame-recovery', 'mbt-self-view', 'er-opposite-action', 'mbt-need-underneath'],
  fear: ['dt-tip', 'br-paced-breathing', 'er-check-facts', 'mbt-assumptions'],
  sadness: ['dt-self-soothe', 'er-wave', 'br-body-scan', 'mbt-their-feelings'],
  loneliness: ['dt-self-soothe', 'mbt-need-underneath', 'ie-validation', 'br-sensory-grounding'],
  abandonment: ['mbt-assumptions', 'er-check-facts', 'rr-repair-without-panic', 'dt-stop'],
  jealousy: ['er-check-facts', 'mbt-other-explanation', 'mbt-story-mind', 'dt-pros-cons'],
  confusion: ['mbt-assumptions', 'mbt-story-mind', 'er-check-facts', 'mf-wise-mind'],
  overwhelm: ['br-60-second-settle', 'dt-tip', 'br-paced-breathing', 'br-post-trigger-reset'],
  anxiety: ['br-paced-breathing', 'mf-one-mindfully', 'er-check-facts', 'br-sensory-grounding'],
  numbness: ['br-sensory-grounding', 'br-body-scan', 'mf-observe', 'br-movement-reset'],
  desperation: ['dt-stop', 'dt-tip', 'br-temperature-shift', 'dt-pros-cons'],
};

const URGE_TOOL_MAP: Record<string, string[]> = {
  'text': ['dt-stop', 'dt-pros-cons', 'mbt-assumptions', 'ie-dear-man'],
  'push away': ['mbt-their-feelings', 'ie-give', 'rr-withdrew', 'er-opposite-action'],
  'reassurance': ['mbt-need-underneath', 'er-check-facts', 'mbt-assumptions'],
  'isolate': ['er-opposite-action', 'br-movement-reset', 'dt-self-soothe'],
  'lash out': ['dt-stop', 'br-temperature-shift', 'dt-tip', 'rr-come-down-anger'],
  'quit': ['dt-pros-cons', 'mbt-story-mind', 'mf-wise-mind', 'rr-stop-replaying'],
};

function getToolInfo(toolId: string): { title: string; type: string; route: string } | null {
  const dbt = DBT_SKILLS.find(s => s.id === toolId);
  if (dbt) return { title: dbt.title, type: 'dbt', route: `/tools/dbt-skill?skillId=${toolId}` };

  const mbt = MENTALIZATION_TOOLS.find(t => t.id === toolId);
  if (mbt) return { title: mbt.title, type: 'mentalization', route: `/tools/guided-walkthrough?toolId=${toolId}&toolType=mentalization` };

  const rr = RELATIONSHIP_RECOVERY_TOOLS.find(t => t.id === toolId);
  if (rr) return { title: rr.title, type: 'relationship-recovery', route: `/tools/guided-walkthrough?toolId=${toolId}&toolType=relationship-recovery` };

  const br = BODY_REGULATION_TOOLS.find(t => t.id === toolId);
  if (br) return { title: br.title, type: 'body-regulation', route: `/tools/guided-walkthrough?toolId=${toolId}&toolType=body-regulation` };

  return null;
}

function generateReason(toolId: string, context: MatchContext): string {
  const info = getToolInfo(toolId);
  if (!info) return '';

  if (context.distressLevel >= 7) {
    if (['dt-tip', 'dt-stop', 'br-temperature-shift', 'br-60-second-settle'].includes(toolId)) {
      return 'Your distress is high — this can help reduce intensity quickly.';
    }
  }

  if (context.relationshipContext) {
    if (info.type === 'relationship-recovery') return 'This can help process what happened in the relationship.';
    if (info.type === 'mentalization') return 'This may help you understand both perspectives more clearly.';
    if (['ie-dear-man', 'ie-give', 'ie-fast'].includes(toolId)) return 'This helps communicate needs while protecting the relationship.';
  }

  if (context.emotions.some(e => e.toLowerCase().includes('sham'))) {
    if (['rr-shame-recovery', 'mbt-self-view'].includes(toolId)) return 'This addresses shame directly by separating behavior from identity.';
  }

  if (context.emotions.some(e => e.toLowerCase().includes('ang'))) {
    if (['dt-stop', 'rr-come-down-anger', 'br-movement-reset'].includes(toolId)) return 'This helps safely process and reduce anger.';
  }

  return `${info.title} may help with what you're experiencing right now.`;
}

export function matchTools(context: MatchContext): ToolMatchResult[] {
  const scores: Record<string, number> = {};

  context.emotions.forEach(emotion => {
    const lower = emotion.toLowerCase();
    Object.entries(EMOTION_TOOL_MAP).forEach(([key, toolIds]) => {
      if (lower.includes(key)) {
        toolIds.forEach((id, idx) => {
          scores[id] = (scores[id] || 0) + (toolIds.length - idx);
        });
      }
    });
  });

  context.urges.forEach(urge => {
    const lower = urge.toLowerCase();
    Object.entries(URGE_TOOL_MAP).forEach(([key, toolIds]) => {
      if (lower.includes(key)) {
        toolIds.forEach((id, idx) => {
          scores[id] = (scores[id] || 0) + (toolIds.length - idx);
        });
      }
    });
  });

  if (context.distressLevel >= 7) {
    ['dt-tip', 'dt-stop', 'br-temperature-shift', 'br-60-second-settle'].forEach(id => {
      scores[id] = (scores[id] || 0) + 5;
    });
  }

  if (context.relationshipContext) {
    ['mbt-assumptions', 'mbt-their-feelings', 'ie-dear-man', 'rr-said-too-much', 'rr-repair-without-panic'].forEach(id => {
      scores[id] = (scores[id] || 0) + 3;
    });
  }

  if (Object.keys(scores).length === 0) {
    ['mf-wise-mind', 'br-paced-breathing', 'mf-observe'].forEach(id => {
      scores[id] = (scores[id] || 0) + 3;
    });
  }

  const maxScore = Math.max(...Object.values(scores), 1);

  const results: ToolMatchResult[] = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([toolId, score]) => {
      const info = getToolInfo(toolId);
      if (!info) return null;
      return {
        toolId,
        toolType: info.type,
        toolTitle: info.title,
        reason: generateReason(toolId, context),
        confidence: Math.round((score / maxScore) * 100),
        route: info.route,
      };
    })
    .filter((r): r is ToolMatchResult => r !== null);

  return results;
}
