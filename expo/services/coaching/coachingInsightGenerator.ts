import {
  BehavioralCoachProfile,
  CoachingMoment,
  CoachAction,
} from '@/types/behavioralCoach';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pickActionForCategory(category: string): CoachAction | undefined {
  const actions: Record<string, CoachAction> = {
    trigger: { label: 'Try Grounding', route: '/exercise?id=c1', icon: 'wind' },
    emotion: { label: 'Check In', route: '/check-in', icon: 'heart' },
    urge: { label: 'Pause & Reflect', route: '/exercise?id=c5', icon: 'pause' },
    coping: { label: 'Open Tools', route: '/exercise?id=c1', icon: 'wrench' },
    growth: { label: 'View Progress', route: '/insights', icon: 'trending-up' },
    relationship: { label: 'Relationship Copilot', route: '/relationship-copilot', icon: 'users' },
    regulation: { label: 'Guided Regulation', route: '/guided-regulation', icon: 'zap' },
    timing: { label: 'Start Grounding', route: '/exercise?id=c1', icon: 'clock' },
  };
  return actions[category];
}

export function generateCoachingMoments(profile: BehavioralCoachProfile): CoachingMoment[] {
  const moments: CoachingMoment[] = [];

  profile.topPatternInsights.slice(0, 3).forEach(insight => {
    moments.push({
      id: makeId('cm-pattern'),
      timestamp: Date.now(),
      type: 'pattern_insight',
      title: insight.pattern,
      message: insight.coaching,
      detail: insight.observation,
      confidence: insight.frequency >= 5 ? 'high' : insight.frequency >= 3 ? 'moderate' : 'low',
      tone: 'reflective',
      basedOn: ['emotional_model', 'pattern_analysis'],
      suggestedAction: pickActionForCategory(insight.category),
      dismissed: false,
    });
  });

  profile.timingNudges.slice(0, 2).forEach(nudge => {
    moments.push({
      id: makeId('cm-timing'),
      timestamp: Date.now(),
      type: 'timing_nudge',
      title: nudge.context,
      message: nudge.suggestion,
      detail: nudge.reasoning,
      confidence: 'moderate',
      tone: 'grounding',
      basedOn: ['recent_activity', 'timing_analysis'],
      suggestedAction: pickActionForCategory('timing'),
      dismissed: false,
    });
  });

  profile.copingSuggestions.slice(0, 2).forEach(suggestion => {
    moments.push({
      id: makeId('cm-coping'),
      timestamp: Date.now(),
      type: 'coping_suggestion',
      title: suggestion.tool,
      message: `${suggestion.situation}, ${suggestion.tool.toLowerCase()} may help.`,
      detail: suggestion.why,
      confidence: suggestion.effectiveness >= 60 ? 'high' : 'moderate',
      tone: 'reflective',
      basedOn: ['coping_effectiveness', 'pattern_matching'],
      suggestedAction: pickActionForCategory('coping'),
      dismissed: false,
    });
  });

  profile.growthRecognitions.slice(0, 2).forEach(growth => {
    moments.push({
      id: makeId('cm-growth'),
      timestamp: Date.now(),
      type: 'growth_recognition',
      title: growth.area,
      message: growth.description,
      detail: growth.narrative,
      confidence: 'high',
      tone: 'celebratory',
      basedOn: ['progress_tracking', 'trend_analysis'],
      suggestedAction: pickActionForCategory('growth'),
      dismissed: false,
    });
  });

  profile.relationshipCoaching.slice(0, 2).forEach(rc => {
    moments.push({
      id: makeId('cm-rel'),
      timestamp: Date.now(),
      type: 'relationship_coaching',
      title: 'Relationship Pattern',
      message: rc.coaching,
      detail: rc.valuesAlignment,
      confidence: 'moderate',
      tone: 'reflective',
      basedOn: ['relationship_patterns', 'emotional_model'],
      suggestedAction: pickActionForCategory('relationship'),
      dismissed: false,
    });
  });

  profile.regulationTips.slice(0, 2).forEach(tip => {
    moments.push({
      id: makeId('cm-reg'),
      timestamp: Date.now(),
      type: 'regulation_tip',
      title: `When "${tip.trigger}" activates`,
      message: tip.suggestedShift,
      detail: `Current pattern: ${tip.currentPattern}`,
      confidence: 'moderate',
      tone: 'grounding',
      basedOn: ['escalation_patterns', 'regulation_analysis'],
      suggestedAction: pickActionForCategory('regulation'),
      dismissed: false,
    });
  });

  moments.sort((a, b) => {
    const confidenceOrder = { high: 3, moderate: 2, low: 1 };
    const typeOrder: Record<string, number> = {
      growth_recognition: 6,
      timing_nudge: 5,
      pattern_insight: 4,
      regulation_tip: 3,
      relationship_coaching: 2,
      coping_suggestion: 1,
    };
    const confDiff = (confidenceOrder[b.confidence] ?? 0) - (confidenceOrder[a.confidence] ?? 0);
    if (confDiff !== 0) return confDiff;
    return (typeOrder[b.type] ?? 0) - (typeOrder[a.type] ?? 0);
  });

  return moments;
}

export function generateHomeCoachingMessage(profile: BehavioralCoachProfile): string {
  if (profile.growthRecognitions.length > 0) {
    return profile.growthRecognitions[0].narrative;
  }

  if (profile.timingNudges.length > 0) {
    return profile.timingNudges[0].suggestion;
  }

  if (profile.topPatternInsights.length > 0) {
    return profile.topPatternInsights[0].coaching;
  }

  return 'Keep checking in. Every moment of awareness helps build clarity.';
}

export function generateProgressCoachingSummary(profile: BehavioralCoachProfile): string {
  const parts: string[] = [];

  if (profile.weeklyTheme) {
    parts.push(`This week's focus: ${profile.weeklyTheme}.`);
  }

  if (profile.growthRecognitions.length > 0) {
    parts.push(profile.growthRecognitions.map(g => g.description).join(' '));
  }

  if (profile.topPatternInsights.length > 0) {
    const topInsight = profile.topPatternInsights[0];
    parts.push(`Key pattern: ${topInsight.pattern}.`);
  }

  if (profile.copingSuggestions.length > 0) {
    const top = profile.copingSuggestions[0];
    parts.push(`${top.tool} appears most helpful right now (${top.effectiveness}% effective).`);
  }

  return parts.join(' ') || 'Your coaching profile is building as you use the app.';
}
