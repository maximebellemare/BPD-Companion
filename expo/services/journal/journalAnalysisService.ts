import {
  SmartJournalEntry,
  JournalAIInsight,
  JournalPatternResult,
  JournalWeeklyReport,
  JournalStats,
} from '@/types/journalEntry';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { assessInputSafety } from '@/services/ai/aiSafetyService';
import { SafetyAssessment, CRISIS_RESOURCES } from '@/types/aiSafety';
import { trackEvent } from '@/services/analytics/analyticsService';

function generateId(): string {
  return `sj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const insightSchema = z.object({
  primaryEmotion: z.string(),
  secondaryEmotion: z.string().optional(),
  likelyTrigger: z.string().optional(),
  interpretationPattern: z.string().optional(),
  cognitiveDistortion: z.string().optional(),
  mainUrge: z.string().optional(),
  copingSuggestion: z.string().optional(),
  summary: z.string(),
});

export interface JournalAnalysisResult {
  insight: JournalAIInsight;
  safetyAssessment?: SafetyAssessment;
}

export async function analyzeJournalEntry(
  entry: SmartJournalEntry
): Promise<JournalAnalysisResult> {
  console.log('[JournalAnalysis] Analyzing entry:', entry.id, entry.format);

  const safetyAssessment = assessInputSafety(entry.content);
  if (safetyAssessment.level !== 'safe') {
    console.log('[JournalAnalysis] Safety concern in journal entry:', safetyAssessment.level, safetyAssessment.signals.map(s => s.type).join(', '));
    void trackEvent('safety_concern_detected', {
      level: safetyAssessment.level,
      signals: safetyAssessment.signals.map(s => s.type).join(','),
      source: 'journal',
      distress_level: entry.distressLevel,
    });
  }

  const emotionLabels = entry.emotions.map(e => e.label).join(', ');
  const triggerLabels = entry.triggers.map(t => t.label).join(', ');

  const safetyPromptAddition = safetyAssessment.level === 'crisis'
    ? `\n\nIMPORTANT SAFETY NOTE: This entry contains crisis-level content. Your analysis MUST:\n- Acknowledge the pain directly and compassionately\n- NOT minimize or dismiss the distress\n- Include a coping suggestion that mentions reaching out to the ${CRISIS_RESOURCES.hotline988.name} (${CRISIS_RESOURCES.hotline988.action})\n- NOT use toxic positivity\n- Be warm, grounding, and present`
    : safetyAssessment.level === 'high_risk'
      ? `\n\nIMPORTANT: This entry shows significant distress. Your analysis should prioritize validation and suggest grounding or reaching out to a trusted person. Do not minimize the pain.`
      : '';

  try {
    const result = await generateObject({
      messages: [
        {
          role: 'user',
          content: `You are an emotionally intelligent analysis assistant for someone managing BPD. Analyze this journal entry and provide structured, specific insight.

Entry type: ${entry.format}
Content: ${entry.content}
${entry.guidedResponses ? `Guided responses: ${JSON.stringify(entry.guidedResponses)}` : ''}
${emotionLabels ? `Tagged emotions: ${emotionLabels}` : ''}
${triggerLabels ? `Tagged triggers: ${triggerLabels}` : ''}
Distress level: ${entry.distressLevel}/10

ANALYSIS RULES:
- Name the PRIMARY emotion using the user's own language, not clinical terms. "That ache of feeling invisible" is better than "sadness."
- For the SECONDARY emotion, look for what's underneath the surface feeling. Anger often hides hurt. Numbness often hides overwhelm.
- For the TRIGGER, be specific. Not just "relationship" but "silence after sending a vulnerable message" or "feeling dismissed during a conversation."
- For COGNITIVE DISTORTIONS, use plain language: "Your mind may be treating a possibility as a certainty" instead of "catastrophizing." "You seem to be reading their mind" instead of "mind reading."
- For the COPING SUGGESTION, recommend ONE specific, practical action — not a list. Tie it to the user's situation: "Before checking your phone again, try placing your feet on the ground and naming 3 things you see" rather than "try grounding exercises."
- For the SUMMARY, write 2-3 sentences that feel like a wise friend reflecting back what they see — validating, specific, and insightful. Reference the user's actual words when possible.
- If distress is 7+, prioritize validation and grounding over analysis. Keep it shorter and warmer.
- If there's a relationship trigger, note the pattern without taking sides.
- AVOID: generic summaries, clinical language, toxic positivity, "tell me more", listing multiple strategies.${safetyPromptAddition}`,
        },
      ],
      schema: insightSchema,
    });

    console.log('[JournalAnalysis] AI insight generated for entry:', entry.id);
    const insight: JournalAIInsight = { ...result, timestamp: Date.now() };

    if (safetyAssessment.level === 'crisis' && insight.copingSuggestion && !insight.copingSuggestion.includes('988')) {
      insight.copingSuggestion = `${insight.copingSuggestion} If you're in crisis, the ${CRISIS_RESOURCES.hotline988.name} is available 24/7 — ${CRISIS_RESOURCES.hotline988.action}.`;
    }

    return {
      insight,
      safetyAssessment: safetyAssessment.level !== 'safe' ? safetyAssessment : undefined,
    };
  } catch (error) {
    console.error('[JournalAnalysis] AI analysis failed:', error);
    const insight = buildLocalInsight(entry, safetyAssessment);
    return {
      insight,
      safetyAssessment: safetyAssessment.level !== 'safe' ? safetyAssessment : undefined,
    };
  }
}

function buildLocalInsight(entry: SmartJournalEntry, safetyAssessment?: SafetyAssessment): JournalAIInsight {
  const primary = entry.emotions[0]?.label ?? 'Unidentified emotion';
  const secondary = entry.emotions[1]?.label;
  const trigger = entry.triggers[0]?.label;

  let summary: string;
  let copingSuggestion: string;

  if (safetyAssessment && safetyAssessment.level === 'crisis') {
    summary = `What you're going through sounds incredibly painful. Writing about it takes courage, and your feelings are real and valid.`;
    copingSuggestion = `Right now, the most important thing is your safety. If you're having thoughts of hurting yourself, please reach out to the ${CRISIS_RESOURCES.hotline988.name} — ${CRISIS_RESOURCES.hotline988.action}. You can also try placing your feet on the ground and taking three slow breaths.`;
  } else if (safetyAssessment && safetyAssessment.level === 'high_risk') {
    summary = `You expressed ${primary.toLowerCase()}`;
    if (trigger) summary += ` connected to "${trigger}"`;
    summary += '. This sounds really heavy. You showed strength by putting it into words.';
    copingSuggestion = `Your distress is very high right now. Try the 5-4-3-2-1 grounding technique: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. If it feels like too much, reaching out to someone you trust — or the ${CRISIS_RESOURCES.hotline988.name} (${CRISIS_RESOURCES.hotline988.action}) — is a strong choice.`;
  } else {
    summary = `You expressed ${primary.toLowerCase()}`;
    if (trigger) summary += ` connected to "${trigger}"`;
    summary += '. Taking the time to write about this is a meaningful step toward understanding your emotional patterns.';

    copingSuggestion = 'Try grounding yourself with slow breathing for a few minutes.';
    if (entry.distressLevel >= 7) {
      copingSuggestion = 'Your distress is high. Consider the 5-4-3-2-1 grounding technique or reaching out to a safe person.';
    } else if (entry.distressLevel <= 3) {
      copingSuggestion = 'Your distress is manageable. This is a good moment to notice what helped you stay grounded.';
    }
  }

  return {
    primaryEmotion: primary,
    secondaryEmotion: secondary,
    likelyTrigger: trigger,
    summary,
    copingSuggestion,
    timestamp: Date.now(),
  };
}

export function detectJournalPatterns(
  entries: SmartJournalEntry[],
  days: number = 30
): JournalPatternResult {
  console.log('[JournalAnalysis] Detecting patterns from', entries.length, 'entries, period:', days, 'days');

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = entries.filter(e => e.timestamp >= cutoff);

  const triggerCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};
  const copingCounts: Record<string, { count: number; totalDistressAfter: number }> = {};

  recent.forEach(entry => {
    entry.triggers.forEach(t => {
      triggerCounts[t.label] = (triggerCounts[t.label] ?? 0) + 1;
    });
    entry.emotions.forEach(e => {
      emotionCounts[e.label] = (emotionCounts[e.label] ?? 0) + 1;
    });

    if (entry.aiInsight?.copingSuggestion) {
      const key = entry.aiInsight.copingSuggestion.slice(0, 40);
      if (!copingCounts[key]) copingCounts[key] = { count: 0, totalDistressAfter: 0 };
      copingCounts[key].count++;
      copingCounts[key].totalDistressAfter += entry.distressLevel;
    }
  });

  const commonTriggers = Object.entries(triggerCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const recurringEmotions = Object.entries(emotionCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const copingStrategies = Object.entries(copingCounts)
    .map(([label, data]) => ({
      label,
      effectiveness: data.count > 0 ? Math.round((1 - data.totalDistressAfter / (data.count * 10)) * 100) : 0,
    }))
    .sort((a, b) => b.effectiveness - a.effectiveness)
    .slice(0, 5);

  const emotionalCycles: string[] = [];
  if (commonTriggers.length > 0 && recurringEmotions.length > 0) {
    const topTrigger = commonTriggers[0].label;
    const topEmotion = recurringEmotions[0].label;
    emotionalCycles.push(
      `"${topTrigger}" often leads to ${topEmotion.toLowerCase()}.`
    );
  }

  const highDistressEntries = recent.filter(e => e.distressLevel >= 7);
  if (highDistressEntries.length > 0) {
    const relTrigs = highDistressEntries.flatMap(e => e.triggers.filter(t => t.category === 'relationship'));
    if (relTrigs.length > highDistressEntries.length * 0.4) {
      emotionalCycles.push('Relationship triggers are frequently connected to high distress.');
    }
  }

  const insights: string[] = [];
  if (commonTriggers.length >= 2) {
    insights.push(
      `Your top triggers are "${commonTriggers[0].label}" and "${commonTriggers[1].label}".`
    );
  }
  if (recurringEmotions.length >= 2) {
    insights.push(
      `You most frequently experience ${recurringEmotions[0].label.toLowerCase()} and ${recurringEmotions[1].label.toLowerCase()}.`
    );
  }
  const avgDistress = recent.length > 0
    ? Math.round((recent.reduce((s, e) => s + e.distressLevel, 0) / recent.length) * 10) / 10
    : 0;
  if (avgDistress > 0) {
    insights.push(`Your average distress level over this period is ${avgDistress}/10.`);
  }

  return {
    commonTriggers,
    recurringEmotions,
    emotionalCycles,
    copingStrategies,
    insights,
  };
}

export function generateWeeklyJournalReport(
  entries: SmartJournalEntry[]
): JournalWeeklyReport | null {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weekStart = now - weekMs;

  const weekEntries = entries.filter(e => e.timestamp >= weekStart);
  console.log('[JournalAnalysis] Generating weekly report from', weekEntries.length, 'entries');

  if (weekEntries.length === 0) return null;

  const triggerCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};

  weekEntries.forEach(entry => {
    entry.triggers.forEach(t => {
      triggerCounts[t.label] = (triggerCounts[t.label] ?? 0) + 1;
    });
    entry.emotions.forEach(e => {
      emotionCounts[e.label] = (emotionCounts[e.label] ?? 0) + 1;
    });
  });

  const mainTriggers = Object.entries(triggerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([label]) => label);

  const mostFrequentEmotions = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([label]) => label);

  const avgDistress = Math.round(
    (weekEntries.reduce((s, e) => s + e.distressLevel, 0) / weekEntries.length) * 10
  ) / 10;

  const prevWeekEntries = entries.filter(
    e => e.timestamp >= weekStart - weekMs && e.timestamp < weekStart
  );
  const prevAvg = prevWeekEntries.length > 0
    ? prevWeekEntries.reduce((s, e) => s + e.distressLevel, 0) / prevWeekEntries.length
    : avgDistress;

  let distressTrend: 'improving' | 'stable' | 'worsening' = 'stable';
  if (avgDistress < prevAvg - 0.5) distressTrend = 'improving';
  if (avgDistress > prevAvg + 0.5) distressTrend = 'worsening';

  const skillsThatHelped: string[] = [];
  weekEntries.forEach(entry => {
    if (entry.aiInsight?.copingSuggestion && entry.distressLevel <= 4) {
      const suggestion = entry.aiInsight.copingSuggestion.slice(0, 50);
      if (!skillsThatHelped.includes(suggestion)) skillsThatHelped.push(suggestion);
    }
  });

  const keyInsights: string[] = [];
  if (mainTriggers.length > 0) {
    keyInsights.push(`Your most common trigger this week was "${mainTriggers[0]}".`);
  }
  if (mostFrequentEmotions.length > 0) {
    keyInsights.push(`${mostFrequentEmotions[0]} was your most frequently expressed emotion.`);
  }
  if (distressTrend === 'improving') {
    keyInsights.push('Your overall distress is trending downward — that is meaningful progress.');
  }
  if (weekEntries.some(e => e.isImportant)) {
    keyInsights.push('You marked some entries as important this week. Consider revisiting them.');
  }

  let reflectionLetter = `This week you wrote ${weekEntries.length} journal ${weekEntries.length === 1 ? 'entry' : 'entries'}. `;
  if (mostFrequentEmotions.length > 0) {
    reflectionLetter += `You navigated ${mostFrequentEmotions.slice(0, 2).join(' and ').toLowerCase()}. `;
  }
  if (distressTrend === 'improving') {
    reflectionLetter += 'Your emotional intensity has been easing. That takes real effort. ';
  } else if (distressTrend === 'worsening') {
    reflectionLetter += 'Things have felt harder this week. Be gentle with yourself. ';
  }
  reflectionLetter += 'Showing up to reflect, even on difficult days, is a form of self-care.';

  return {
    id: generateId(),
    weekStart,
    weekEnd: now,
    entryCount: weekEntries.length,
    mainTriggers,
    mostFrequentEmotions,
    avgDistress,
    distressTrend,
    skillsThatHelped: skillsThatHelped.slice(0, 3),
    keyInsights,
    reflectionLetter,
    generatedAt: now,
  };
}

export function computeJournalStats(entries: SmartJournalEntry[]): JournalStats {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weekEntries = entries.filter(e => e.timestamp >= now - weekMs);

  const emotionCounts: Record<string, number> = {};
  const triggerCounts: Record<string, number> = {};

  entries.forEach(entry => {
    entry.emotions.forEach(e => {
      emotionCounts[e.label] = (emotionCounts[e.label] ?? 0) + 1;
    });
    entry.triggers.forEach(t => {
      triggerCounts[t.label] = (triggerCounts[t.label] ?? 0) + 1;
    });
  });

  const topEmotions = Object.entries(emotionCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topTriggers = Object.entries(triggerCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const avgDistress = entries.length > 0
    ? Math.round((entries.reduce((s, e) => s + e.distressLevel, 0) / entries.length) * 10) / 10
    : 0;

  return {
    totalEntries: entries.length,
    streakDays: computeStreak(entries),
    thisWeekEntries: weekEntries.length,
    avgDistress,
    topEmotions,
    topTriggers,
    importantCount: entries.filter(e => e.isImportant).length,
    therapyNoteCount: entries.filter(e => e.isTherapyNote).length,
  };
}

function computeStreak(entries: SmartJournalEntry[]): number {
  if (entries.length === 0) return 0;
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const dayStart = new Date(today);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const hasEntry = sorted.some(
      e => e.timestamp >= dayStart.getTime() && e.timestamp < dayEnd.getTime()
    );
    if (hasEntry) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}
