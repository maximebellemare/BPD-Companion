import { JournalEntry, MessageDraft } from '@/types';
import {
  EmotionalModelInsight,
  AIPersonalizationContext,
  PersonalEmotionalModel,
} from '@/types/emotionalModel';
import {
  analyzeTriggerProfiles,
  analyzeEmotionSequences,
  analyzeUrgeProfiles,
  analyzeRelationshipTriggers,
  analyzeCopingEffectiveness,
  analyzeEscalationPatterns,
  analyzeMessagePatterns,
} from '@/services/emotionalModel/emotionalPatternAnalyzer';

function calculateOverallTrend(
  entries: JournalEntry[],
): 'improving' | 'stable' | 'worsening' | 'unknown' {
  if (entries.length < 5) return 'unknown';

  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const recentFive = sorted.slice(0, 5);
  const olderFive = sorted.slice(5, 10);

  if (olderFive.length < 3) return 'unknown';

  const recentAvg = recentFive.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / recentFive.length;
  const olderAvg = olderFive.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / olderFive.length;

  const diff = recentAvg - olderAvg;
  if (diff < -0.8) return 'improving';
  if (diff > 0.8) return 'worsening';
  return 'stable';
}

function buildModelNarrative(model: PersonalEmotionalModel): string {
  const parts: string[] = [];

  if (model.dataPointCount < 3) {
    return 'Your emotional profile is still forming. As you continue checking in, patterns will become clearer here.';
  }

  if (model.topTriggers.length > 0) {
    const top = model.topTriggers[0];
    parts.push(`Your most frequent trigger appears to be "${top.label}," which often brings up ${top.commonEmotions[0]?.toLowerCase() ?? 'distress'}.`);
  }

  if (model.overallDistressTrend === 'improving') {
    parts.push('Your overall distress levels seem to be trending downward — that may reflect the work you are doing.');
  } else if (model.overallDistressTrend === 'worsening') {
    parts.push('Things may have felt more intense lately. Being aware of that is itself a form of care.');
  }

  if (model.effectiveCoping.length > 0) {
    const best = model.effectiveCoping[0];
    parts.push(`"${best.tool}" appears to be one of your most effective coping strategies.`);
  }

  if (model.relationshipTriggers.length > 0) {
    parts.push('Relationship dynamics seem to play a significant role in your emotional patterns.');
  }

  if (parts.length === 0) {
    parts.push('Your emotional profile is building. Each check-in adds depth to this understanding.');
  }

  return parts.join(' ');
}

function identifyGrowthAreas(model: PersonalEmotionalModel): string[] {
  const areas: string[] = [];

  if (model.overallDistressTrend === 'improving') {
    areas.push('Distress levels are trending downward');
  }

  const highManagedUrges = model.frequentUrges.filter(u => u.managedRate >= 60);
  if (highManagedUrges.length > 0) {
    areas.push(`Managing "${highManagedUrges[0].label}" urges more effectively`);
  }

  const effectiveTools = model.effectiveCoping.filter(c => c.helpfulRate >= 60);
  if (effectiveTools.length > 0) {
    areas.push(`Building strong coping with ${effectiveTools[0].tool}`);
  }

  const decreasingTriggers = model.topTriggers.filter(t => t.trend === 'decreasing');
  if (decreasingTriggers.length > 0) {
    areas.push(`"${decreasingTriggers[0].label}" triggers may be becoming less frequent`);
  }

  return areas;
}

function identifyAttentionAreas(model: PersonalEmotionalModel): string[] {
  const areas: string[] = [];

  const highDistressTriggers = model.topTriggers.filter(t => t.averageDistress >= 7);
  if (highDistressTriggers.length > 0) {
    areas.push(`"${highDistressTriggers[0].label}" tends to bring high distress`);
  }

  const increasingTriggers = model.topTriggers.filter(t => t.trend === 'increasing');
  if (increasingTriggers.length > 0) {
    areas.push(`"${increasingTriggers[0].label}" triggers may be becoming more frequent`);
  }

  const highRiskRelationship = model.relationshipTriggers.filter(r => r.escalationRisk === 'high');
  if (highRiskRelationship.length > 0) {
    areas.push(`Relationship trigger "${highRiskRelationship[0].label}" often reaches high intensity`);
  }

  const lowManagedUrges = model.frequentUrges.filter(u => u.managedRate < 30 && u.frequency >= 3);
  if (lowManagedUrges.length > 0) {
    areas.push(`The urge to "${lowManagedUrges[0].label}" may benefit from more support`);
  }

  return areas;
}

export function buildPersonalEmotionalModel(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): PersonalEmotionalModel {
  console.log('[EmotionalMemoryBuilder] Building model from', journalEntries.length, 'entries and', messageDrafts.length, 'drafts');

  const topTriggers = analyzeTriggerProfiles(journalEntries);
  const emotionSequences = analyzeEmotionSequences(journalEntries);
  const frequentUrges = analyzeUrgeProfiles(journalEntries);
  const relationshipTriggers = analyzeRelationshipTriggers(journalEntries);
  const effectiveCoping = analyzeCopingEffectiveness(journalEntries);
  const escalationPatterns = analyzeEscalationPatterns(journalEntries);
  const overallDistressTrend = calculateOverallTrend(journalEntries);

  const recentEntries = journalEntries.slice(0, 20);
  const averageDistress = recentEntries.length > 0
    ? Math.round((recentEntries.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / recentEntries.length) * 10) / 10
    : 0;

  const model: PersonalEmotionalModel = {
    id: 'personal_model',
    lastUpdated: Date.now(),
    dataPointCount: journalEntries.length,
    topTriggers,
    emotionSequences,
    frequentUrges,
    relationshipTriggers,
    effectiveCoping,
    escalationPatterns,
    overallDistressTrend,
    averageDistress,
    modelNarrative: '',
    growthAreas: [],
    attentionAreas: [],
  };

  model.modelNarrative = buildModelNarrative(model);
  model.growthAreas = identifyGrowthAreas(model);
  model.attentionAreas = identifyAttentionAreas(model);

  console.log('[EmotionalMemoryBuilder] Model built:', {
    triggers: topTriggers.length,
    sequences: emotionSequences.length,
    urges: frequentUrges.length,
    relTriggers: relationshipTriggers.length,
    coping: effectiveCoping.length,
    escalation: escalationPatterns.length,
    trend: overallDistressTrend,
  });

  return model;
}

export function generateModelInsights(model: PersonalEmotionalModel): EmotionalModelInsight[] {
  const insights: EmotionalModelInsight[] = [];
  let idx = 0;

  model.topTriggers.slice(0, 3).forEach(trigger => {
    insights.push({
      id: `insight_trigger_${idx++}`,
      category: 'trigger',
      title: trigger.label,
      narrative: `"${trigger.label}" has appeared ${trigger.frequency} times. It often seems connected to ${trigger.commonEmotions[0]?.toLowerCase() ?? 'emotional distress'}.`,
      confidence: trigger.frequency >= 5 ? 'high' : trigger.frequency >= 3 ? 'moderate' : 'low',
      sentiment: trigger.trend === 'decreasing' ? 'positive' : trigger.averageDistress >= 7 ? 'cautious' : 'neutral',
      icon: 'Zap',
    });
  });

  model.emotionSequences.slice(0, 2).forEach(seq => {
    insights.push({
      id: `insight_seq_${idx++}`,
      category: 'emotion',
      title: seq.chain.join(' → '),
      narrative: seq.narrative,
      confidence: seq.occurrences >= 4 ? 'high' : 'moderate',
      sentiment: 'neutral',
      icon: 'GitBranch',
    });
  });

  model.effectiveCoping.slice(0, 2).forEach(coping => {
    insights.push({
      id: `insight_coping_${idx++}`,
      category: 'coping',
      title: coping.tool,
      narrative: coping.narrative,
      confidence: coping.timesUsed >= 5 ? 'high' : 'moderate',
      sentiment: coping.helpfulRate >= 50 ? 'positive' : 'neutral',
      icon: 'Leaf',
    });
  });

  model.relationshipTriggers.slice(0, 2).forEach(rel => {
    insights.push({
      id: `insight_rel_${idx++}`,
      category: 'relationship',
      title: rel.label,
      narrative: rel.narrative,
      confidence: rel.frequency >= 4 ? 'high' : 'moderate',
      sentiment: rel.escalationRisk === 'high' ? 'cautious' : 'neutral',
      icon: 'Users',
    });
  });

  model.growthAreas.slice(0, 2).forEach(area => {
    insights.push({
      id: `insight_growth_${idx++}`,
      category: 'growth',
      title: 'Growth Signal',
      narrative: area,
      confidence: 'moderate',
      sentiment: 'positive',
      icon: 'TrendingUp',
    });
  });

  model.attentionAreas.slice(0, 2).forEach(area => {
    insights.push({
      id: `insight_attn_${idx++}`,
      category: 'escalation',
      title: 'Gentle Focus',
      narrative: area,
      confidence: 'moderate',
      sentiment: 'cautious',
      icon: 'AlertCircle',
    });
  });

  return insights;
}

export function buildAIPersonalizationContext(
  model: PersonalEmotionalModel,
  _messageDrafts: MessageDraft[],
): AIPersonalizationContext {
  const msgPatterns = analyzeMessagePatterns(_messageDrafts);

  const topTriggersSummary = model.topTriggers.length > 0
    ? `Top triggers: ${model.topTriggers.slice(0, 3).map(t => `"${t.label}" (${t.frequency}×, avg distress ${t.averageDistress})`).join(', ')}.`
    : '';

  const emotionPatternsSummary = model.emotionSequences.length > 0
    ? `Common emotion sequences: ${model.emotionSequences.slice(0, 3).map(s => s.chain.join(' → ')).join('; ')}.`
    : '';

  const urgeTendenciesSummary = model.frequentUrges.length > 0
    ? `Frequent urges: ${model.frequentUrges.slice(0, 3).map(u => `"${u.label}" (managed ${u.managedRate}% of the time)`).join(', ')}.`
    : '';

  const relationshipPatternsSummary = model.relationshipTriggers.length > 0
    ? `Relationship triggers: ${model.relationshipTriggers.slice(0, 3).map(r => `"${r.label}" → ${r.emotionalResponse}`).join(', ')}.`
    : '';

  const copingStrengthsSummary = model.effectiveCoping.length > 0
    ? `Most effective coping: ${model.effectiveCoping.slice(0, 3).map(c => `${c.tool} (${c.helpfulRate}% helpful)`).join(', ')}.`
    : '';

  const escalationRiskSummary = model.escalationPatterns.length > 0
    ? `Escalation patterns: ${model.escalationPatterns.slice(0, 2).map(e => `${e.triggerPhase} → ${e.emotionalPhase} → ${e.urgePhase}`).join('; ')}.`
    : '';

  const growthNarrative = model.growthAreas.length > 0
    ? `Growth signals: ${model.growthAreas.join('. ')}.`
    : '';

  const messagePart = msgPatterns.rewriteFrequency > 0
    ? ` Message rewrites: ${msgPatterns.rewriteFrequency}. Pause rate: ${msgPatterns.pauseRate}%.`
    : '';

  const parts = [
    topTriggersSummary,
    emotionPatternsSummary,
    urgeTendenciesSummary,
    relationshipPatternsSummary,
    copingStrengthsSummary,
    escalationRiskSummary,
    growthNarrative,
    model.overallDistressTrend !== 'unknown' ? `Overall trend: ${model.overallDistressTrend}.` : '',
    model.averageDistress > 0 ? `Average distress: ${model.averageDistress}/10.` : '',
    messagePart,
  ].filter(Boolean);

  return {
    topTriggersSummary,
    emotionPatternsSummary,
    urgeTendenciesSummary,
    relationshipPatternsSummary,
    copingStrengthsSummary,
    escalationRiskSummary,
    growthNarrative,
    fullContextString: parts.join(' '),
  };
}
