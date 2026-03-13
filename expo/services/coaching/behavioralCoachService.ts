import { JournalEntry, MessageDraft } from '@/types';
import { PersonalEmotionalModel } from '@/types/emotionalModel';
import {
  BehavioralCoachProfile,
  CoachingMoment,
  PatternCoachInsight,
  TimingNudge,
  CopingSuggestion,
  GrowthRecognition,
  RelationshipCoachMoment,
  RegulationTip,
  CoachSessionSummary,
} from '@/types/behavioralCoach';
import { buildFullEmotionalModelState } from '@/services/emotionalModel/emotionalModelService';
import { generateCoachingMoments } from '@/services/coaching/coachingInsightGenerator';

let cachedProfile: BehavioralCoachProfile | null = null;
let cachedProfileDate = '';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function withinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function buildPatternInsights(model: PersonalEmotionalModel): PatternCoachInsight[] {
  const insights: PatternCoachInsight[] = [];

  model.topTriggers.slice(0, 4).forEach(trigger => {
    const topEmotion = trigger.commonEmotions[0]?.toLowerCase() ?? 'distress';
    const topUrge = trigger.commonUrges[0]?.toLowerCase() ?? 'react';

    let coaching = '';
    if (trigger.averageDistress >= 7) {
      coaching = `When "${trigger.label}" comes up, things tend to get intense quickly. A grounding step before responding may help you stay in a calmer place.`;
    } else if (trigger.trend === 'increasing') {
      coaching = `"${trigger.label}" seems to be showing up more often lately. Noticing this pattern early is already a strength.`;
    } else if (trigger.trend === 'decreasing') {
      coaching = `"${trigger.label}" appears to be showing up less. Whatever you are doing around this pattern may be working.`;
    } else {
      coaching = `When "${trigger.label}" activates ${topEmotion}, the urge to ${topUrge} often follows. A short pause at that moment may change the outcome.`;
    }

    insights.push({
      id: makeId('pi'),
      pattern: `${trigger.label} → ${topEmotion}`,
      observation: `"${trigger.label}" has appeared ${trigger.frequency} times, often connected to ${topEmotion}.`,
      coaching,
      frequency: trigger.frequency,
      lastSeen: Date.now(),
      category: 'trigger',
    });
  });

  model.emotionSequences.slice(0, 3).forEach(seq => {
    insights.push({
      id: makeId('pi-seq'),
      pattern: seq.chain.join(' → '),
      observation: seq.narrative,
      coaching: seq.averageIntensity >= 6
        ? `This emotional chain tends to build intensity. Interrupting between ${seq.chain[0]} and ${seq.chain[1]} may be the most effective place to pause.`
        : `This sequence appears regularly. Awareness of it is itself a form of regulation.`,
      frequency: seq.occurrences,
      lastSeen: Date.now(),
      category: 'emotion',
    });
  });

  model.frequentUrges.slice(0, 3).forEach(urge => {
    insights.push({
      id: makeId('pi-urge'),
      pattern: `Urge: ${urge.label}`,
      observation: `The urge to "${urge.label}" has appeared ${urge.frequency} times. You managed it about ${urge.managedRate}% of the time.`,
      coaching: urge.managedRate >= 50
        ? `You are managing this urge more often than not. That is a real skill being built.`
        : `This urge can feel very strong. A 2-minute delay before acting on it may help you choose a response that feels better afterward.`,
      frequency: urge.frequency,
      lastSeen: Date.now(),
      category: 'urge',
    });
  });

  return insights;
}

function buildTimingNudges(
  model: PersonalEmotionalModel,
  entries: JournalEntry[],
  drafts: MessageDraft[],
): TimingNudge[] {
  const nudges: TimingNudge[] = [];

  const recentHighDistress = entries.filter(
    e => withinDays(e.timestamp, 3) && e.checkIn.intensityLevel >= 7,
  );

  if (recentHighDistress.length >= 2) {
    nudges.push({
      id: makeId('tn'),
      context: 'Recent high distress',
      suggestion: 'Things have felt intense the last few days. Starting your day with a short grounding exercise may help set a calmer tone.',
      bestTimeWindow: 'morning',
      reasoning: `${recentHighDistress.length} high-intensity check-ins in the last 3 days`,
    });
  }

  const recentDrafts = drafts.filter(d => withinDays(d.timestamp, 2));
  if (recentDrafts.length >= 3) {
    nudges.push({
      id: makeId('tn-msg'),
      context: 'Frequent message drafting',
      suggestion: 'You have been drafting messages frequently. Before your next one, a short pause may help you write from a more grounded place.',
      bestTimeWindow: 'before_messaging',
      reasoning: `${recentDrafts.length} message drafts in 2 days`,
    });
  }

  const hasRelationshipStress = model.relationshipTriggers.some(r => r.escalationRisk === 'high');
  if (hasRelationshipStress) {
    nudges.push({
      id: makeId('tn-rel'),
      context: 'Relationship activation',
      suggestion: 'Relationship patterns have been active. Checking in with yourself before interactions may help you respond with more clarity.',
      bestTimeWindow: 'before_interaction',
      reasoning: 'High escalation risk in relationship triggers',
    });
  }

  return nudges;
}

function buildCopingSuggestions(model: PersonalEmotionalModel): CopingSuggestion[] {
  const suggestions: CopingSuggestion[] = [];

  model.effectiveCoping.slice(0, 4).forEach((coping, idx) => {
    const bestTrigger = coping.bestForTriggers[0] ?? 'general distress';
    const bestEmotion = coping.bestForEmotions[0] ?? 'distress';
    const altTool = model.effectiveCoping[idx + 1]?.tool;

    suggestions.push({
      id: makeId('cs'),
      situation: `When you feel ${bestEmotion.toLowerCase()} from "${bestTrigger}"`,
      tool: coping.tool,
      why: coping.narrative,
      effectiveness: coping.helpfulRate,
      alternativeTool: altTool,
    });
  });

  if (model.escalationPatterns.length > 0) {
    const topEscalation = model.escalationPatterns[0];
    const bestCoping = model.effectiveCoping[0];

    if (bestCoping) {
      suggestions.push({
        id: makeId('cs-esc'),
        situation: `During "${topEscalation.triggerPhase}" → "${topEscalation.emotionalPhase}" escalation`,
        tool: bestCoping.tool,
        why: `This escalation pattern reaches high distress. ${bestCoping.tool} may help interrupt it earlier.`,
        effectiveness: bestCoping.helpfulRate,
      });
    }
  }

  return suggestions;
}

function buildGrowthRecognitions(model: PersonalEmotionalModel): GrowthRecognition[] {
  const recognitions: GrowthRecognition[] = [];

  if (model.overallDistressTrend === 'improving') {
    recognitions.push({
      id: makeId('gr'),
      area: 'Emotional Regulation',
      description: 'Your overall distress levels are trending downward.',
      metric: 'distress_trend',
      direction: 'improving',
      narrative: 'This suggests the work you are doing is having a real effect. That matters.',
    });
  }

  model.topTriggers.filter(t => t.trend === 'decreasing').slice(0, 2).forEach(trigger => {
    recognitions.push({
      id: makeId('gr-trigger'),
      area: 'Trigger Management',
      description: `"${trigger.label}" appears to be showing up less frequently.`,
      metric: 'trigger_frequency',
      direction: 'improving',
      narrative: `Your relationship with "${trigger.label}" may be shifting. That is growth, even if it does not always feel like it.`,
    });
  });

  model.frequentUrges.filter(u => u.managedRate >= 60).slice(0, 2).forEach(urge => {
    recognitions.push({
      id: makeId('gr-urge'),
      area: 'Urge Management',
      description: `You are managing the urge to "${urge.label}" well — about ${urge.managedRate}% of the time.`,
      metric: 'urge_management',
      direction: 'improving',
      narrative: 'Managing urges consistently is one of the hardest things to do. You are building that skill.',
    });
  });

  model.effectiveCoping.filter(c => c.helpfulRate >= 60).slice(0, 2).forEach(coping => {
    recognitions.push({
      id: makeId('gr-coping'),
      area: 'Coping Toolkit',
      description: `${coping.tool} helps about ${coping.helpfulRate}% of the time.`,
      metric: 'coping_effectiveness',
      direction: 'maintained',
      narrative: `You have found a tool that works for you. Knowing what helps is powerful self-knowledge.`,
    });
  });

  return recognitions;
}

function buildRelationshipCoaching(model: PersonalEmotionalModel): RelationshipCoachMoment[] {
  const moments: RelationshipCoachMoment[] = [];

  model.relationshipTriggers.slice(0, 3).forEach(rel => {
    let coaching = '';
    let valuesAlignment = '';
    let suggestedResponse = '';

    if (rel.escalationRisk === 'high') {
      coaching = `"${rel.label}" tends to bring up intense ${rel.emotionalResponse.toLowerCase()}. When this happens, the urge to ${rel.typicalUrge.toLowerCase()} can feel overwhelming.`;
      valuesAlignment = 'What response would protect both connection and self-respect?';
      suggestedResponse = 'A short pause before responding may help you act from values rather than urgency.';
    } else {
      coaching = `"${rel.label}" often leads to ${rel.emotionalResponse.toLowerCase()}. Recognizing this pattern is itself a form of care.`;
      valuesAlignment = 'What do you actually need in this moment?';
      suggestedResponse = 'Try naming the feeling before acting on the urge.';
    }

    moments.push({
      id: makeId('rc'),
      pattern: `${rel.label} → ${rel.emotionalResponse} → ${rel.typicalUrge}`,
      coaching,
      valuesAlignment,
      suggestedResponse,
    });
  });

  return moments;
}

function buildRegulationTips(model: PersonalEmotionalModel): RegulationTip[] {
  const tips: RegulationTip[] = [];

  model.escalationPatterns.slice(0, 3).forEach(pattern => {
    const bestCoping = model.effectiveCoping[0];
    const tool = bestCoping?.tool ?? 'grounding';

    tips.push({
      id: makeId('rt'),
      trigger: pattern.triggerPhase,
      currentPattern: `${pattern.triggerPhase} → ${pattern.emotionalPhase} → ${pattern.urgePhase}`,
      suggestedShift: pattern.interruptionSuccess > 40
        ? `You have interrupted this pattern ${pattern.interruptionSuccess}% of the time. Keep using what works.`
        : `Try inserting a pause between ${pattern.emotionalPhase.toLowerCase()} and ${pattern.urgePhase.toLowerCase()}.`,
      distressRange: pattern.averagePeakDistress >= 7 ? 'high' : 'moderate',
      tool,
    });
  });

  if (model.averageDistress >= 6) {
    tips.push({
      id: makeId('rt-general'),
      trigger: 'general',
      currentPattern: 'Sustained elevated distress',
      suggestedShift: 'Starting with shorter regulation exercises may be more effective when distress is high. Build from 30-second grounding up.',
      distressRange: 'high',
      tool: 'grounding',
    });
  }

  return tips;
}

function buildDailySummary(profile: BehavioralCoachProfile): string {
  const parts: string[] = [];

  if (profile.growthRecognitions.length > 0) {
    parts.push(profile.growthRecognitions[0].narrative);
  }

  if (profile.timingNudges.length > 0) {
    parts.push(profile.timingNudges[0].suggestion);
  }

  if (profile.copingSuggestions.length > 0) {
    const top = profile.copingSuggestions[0];
    parts.push(`${top.tool} appears to be especially helpful for you right now.`);
  }

  if (parts.length === 0) {
    parts.push('Keep checking in. Every moment of self-awareness helps build a clearer picture.');
  }

  return parts.join(' ');
}

function buildWeeklyTheme(model: PersonalEmotionalModel): string {
  if (model.overallDistressTrend === 'improving') {
    return 'Building Momentum';
  }

  const hasRelStress = model.relationshipTriggers.some(r => r.escalationRisk === 'high');
  if (hasRelStress) {
    return 'Relationship Awareness';
  }

  if (model.averageDistress >= 7) {
    return 'Gentle Stabilization';
  }

  if (model.effectiveCoping.length > 0 && model.effectiveCoping[0].helpfulRate >= 60) {
    return 'Strengthening What Works';
  }

  return 'Self-Discovery';
}

export function buildBehavioralCoachProfile(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): BehavioralCoachProfile {
  const todayKey = getTodayKey();

  if (cachedProfile && cachedProfileDate === todayKey) {
    console.log('[BehavioralCoachService] Returning cached profile');
    return cachedProfile;
  }

  console.log('[BehavioralCoachService] Building coach profile...');

  const modelState = buildFullEmotionalModelState(journalEntries, messageDrafts);
  const model = modelState.model;

  const topPatternInsights = buildPatternInsights(model);
  const timingNudges = buildTimingNudges(model, journalEntries, messageDrafts);
  const copingSuggestions = buildCopingSuggestions(model);
  const growthRecognitions = buildGrowthRecognitions(model);
  const relationshipCoaching = buildRelationshipCoaching(model);
  const regulationTips = buildRegulationTips(model);

  const profile: BehavioralCoachProfile = {
    lastUpdated: Date.now(),
    totalMoments: topPatternInsights.length + timingNudges.length + copingSuggestions.length +
      growthRecognitions.length + relationshipCoaching.length + regulationTips.length,
    topPatternInsights,
    timingNudges,
    copingSuggestions,
    growthRecognitions,
    relationshipCoaching,
    regulationTips,
    dailySummary: '',
    weeklyTheme: buildWeeklyTheme(model),
  };

  profile.dailySummary = buildDailySummary(profile);

  cachedProfile = profile;
  cachedProfileDate = todayKey;

  console.log('[BehavioralCoachService] Profile built:', profile.totalMoments, 'moments');

  return profile;
}

export function getCoachSessionSummary(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): CoachSessionSummary {
  const profile = buildBehavioralCoachProfile(journalEntries, messageDrafts);
  const moments = generateCoachingMoments(profile);
  const hasEnoughData = journalEntries.length >= 3;

  let overallTone: 'encouraging' | 'grounding' | 'reflective' = 'reflective';
  if (profile.growthRecognitions.length > 0) {
    overallTone = 'encouraging';
  } else if (profile.regulationTips.length > 0 && profile.regulationTips.some(r => r.distressRange === 'high')) {
    overallTone = 'grounding';
  }

  return {
    date: getTodayKey(),
    moments,
    primaryFocus: profile.weeklyTheme,
    overallTone,
    hasEnoughData,
  };
}

export function getHomeCoachingMoment(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): CoachingMoment | null {
  if (journalEntries.length < 2) return null;

  const profile = buildBehavioralCoachProfile(journalEntries, messageDrafts);
  const moments = generateCoachingMoments(profile);

  return moments[0] ?? null;
}

export function getRelationshipCoachingContext(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): string {
  const profile = buildBehavioralCoachProfile(journalEntries, messageDrafts);

  if (profile.relationshipCoaching.length === 0) {
    return '';
  }

  const parts = profile.relationshipCoaching.slice(0, 2).map(rc =>
    `Pattern: ${rc.pattern}. Coaching: ${rc.coaching} Values question: ${rc.valuesAlignment}`
  );

  return 'BEHAVIORAL COACHING CONTEXT: ' + parts.join(' | ');
}

export function getCompanionCoachingContext(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): string {
  const profile = buildBehavioralCoachProfile(journalEntries, messageDrafts);

  const parts: string[] = [];

  if (profile.dailySummary) {
    parts.push(`Today's coaching focus: ${profile.dailySummary}`);
  }

  if (profile.weeklyTheme) {
    parts.push(`Weekly theme: ${profile.weeklyTheme}`);
  }

  if (profile.topPatternInsights.length > 0) {
    const top = profile.topPatternInsights[0];
    parts.push(`Key pattern: ${top.pattern}. ${top.coaching}`);
  }

  if (profile.growthRecognitions.length > 0) {
    parts.push(`Growth: ${profile.growthRecognitions[0].narrative}`);
  }

  return parts.length > 0 ? 'BEHAVIORAL COACH: ' + parts.join(' ') : '';
}

export function invalidateBehavioralCoachCache(): void {
  cachedProfile = null;
  cachedProfileDate = '';
  console.log('[BehavioralCoachService] Cache invalidated');
}
