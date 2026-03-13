import { JournalEntry, MessageDraft } from '@/types';
import { DetectedPattern } from '@/types/emotionalMirror';

function getHour(timestamp: number): number {
  return new Date(timestamp).getHours();
}

function detectRelationshipTriggers(entries: JournalEntry[]): DetectedPattern | null {
  const relationshipEntries = entries.filter(e =>
    e.checkIn.triggers.some(t => t.category === 'relationship')
  );

  if (relationshipEntries.length < 2) return null;

  const triggerLabels: Record<string, number> = {};
  relationshipEntries.forEach(e => {
    e.checkIn.triggers
      .filter(t => t.category === 'relationship')
      .forEach(t => {
        triggerLabels[t.label] = (triggerLabels[t.label] || 0) + 1;
      });
  });

  const topTrigger = Object.entries(triggerLabels).sort(([, a], [, b]) => b - a)[0];
  if (!topTrigger) return null;

  const avgIntensity = relationshipEntries.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / relationshipEntries.length;

  return {
    id: 'rel_trigger_pattern',
    patternType: 'relationship_trigger',
    description: `"${topTrigger[0]}" appeared ${topTrigger[1]} times in relationship-related check-ins this week.`,
    supportiveExplanation: 'Relationship situations often carry extra emotional weight. Noticing the pattern is the first step toward understanding it.',
    recommendedInsight: avgIntensity > 6
      ? 'When this trigger appears, pausing before responding has helped reduce distress in past situations.'
      : 'You seem to be managing this trigger with growing awareness.',
    occurrences: topTrigger[1],
    confidence: Math.min(topTrigger[1] / entries.length, 1),
  };
}

function detectTimeDistress(entries: JournalEntry[]): DetectedPattern | null {
  if (entries.length < 3) return null;

  const hourBuckets: Record<string, { total: number; count: number }> = {
    morning: { total: 0, count: 0 },
    afternoon: { total: 0, count: 0 },
    evening: { total: 0, count: 0 },
    night: { total: 0, count: 0 },
  };

  entries.forEach(e => {
    const hour = getHour(e.timestamp);
    const bucket = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    hourBuckets[bucket].total += e.checkIn.intensityLevel;
    hourBuckets[bucket].count += 1;
  });

  const averages = Object.entries(hourBuckets)
    .filter(([, v]) => v.count >= 2)
    .map(([label, v]) => ({ label, avg: v.total / v.count, count: v.count }))
    .sort((a, b) => b.avg - a.avg);

  if (averages.length === 0 || averages[0].avg < 5) return null;

  const peak = averages[0];
  const timeLabel = peak.label === 'morning' ? 'mornings'
    : peak.label === 'afternoon' ? 'afternoons'
    : peak.label === 'evening' ? 'evenings'
    : 'late nights';

  return {
    id: 'time_distress_pattern',
    patternType: 'time_distress',
    description: `Distress tends to be higher during ${timeLabel}, averaging ${Math.round(peak.avg * 10) / 10}/10.`,
    supportiveExplanation: 'Knowing when emotions tend to peak can help you prepare and be extra gentle with yourself during those times.',
    recommendedInsight: `Consider setting up a grounding practice before ${timeLabel} to create a buffer.`,
    occurrences: peak.count,
    confidence: peak.count >= 3 ? 0.8 : 0.5,
  };
}

function detectEmotionalLoops(entries: JournalEntry[]): DetectedPattern | null {
  if (entries.length < 3) return null;

  const emotionSequences: Record<string, number> = {};
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEmotions = sorted[i].checkIn.emotions.map(e => e.label);
    const nextEmotions = sorted[i + 1].checkIn.emotions.map(e => e.label);

    currentEmotions.forEach(curr => {
      nextEmotions.forEach(next => {
        if (curr === next) {
          emotionSequences[curr] = (emotionSequences[curr] || 0) + 1;
        }
      });
    });
  }

  const repeating = Object.entries(emotionSequences)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a);

  if (repeating.length === 0) return null;

  const top = repeating[0];
  return {
    id: 'emotional_loop_pattern',
    patternType: 'emotional_loop',
    description: `"${top[0]}" appeared across ${top[1] + 1} consecutive check-ins, forming a repeating pattern.`,
    supportiveExplanation: 'Emotional loops are common and natural. They often signal something important that wants your attention.',
    recommendedInsight: 'When you notice this emotion recurring, try naming it out loud. Sometimes acknowledgment alone can soften the loop.',
    occurrences: top[1],
    confidence: top[1] >= 3 ? 0.85 : 0.6,
  };
}

function detectCopingSuccess(entries: JournalEntry[]): DetectedPattern | null {
  const copingEntries = entries.filter(e => e.checkIn.copingUsed && e.checkIn.copingUsed.length > 0);
  if (copingEntries.length < 2) return null;

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const toolEffects: Record<string, { reductions: number[]; count: number }> = {};

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (!entry.checkIn.copingUsed || entry.checkIn.copingUsed.length === 0) continue;

    const next = sorted[i + 1];
    if (!next) continue;

    const reduction = entry.checkIn.intensityLevel - next.checkIn.intensityLevel;
    entry.checkIn.copingUsed.forEach(tool => {
      if (!toolEffects[tool]) toolEffects[tool] = { reductions: [], count: 0 };
      toolEffects[tool].reductions.push(reduction);
      toolEffects[tool].count += 1;
    });
  }

  const effective = Object.entries(toolEffects)
    .map(([tool, data]) => ({
      tool,
      avgReduction: data.reductions.reduce((s, r) => s + r, 0) / data.count,
      count: data.count,
    }))
    .filter(t => t.avgReduction > 0)
    .sort((a, b) => b.avgReduction - a.avgReduction);

  if (effective.length === 0) return null;

  const best = effective[0];
  return {
    id: 'coping_success_pattern',
    patternType: 'coping_success',
    description: `"${best.tool}" reduced distress by an average of ${Math.round(best.avgReduction * 10) / 10} points across ${best.count} uses.`,
    supportiveExplanation: 'Finding tools that work for you is a meaningful sign of self-awareness and growth.',
    recommendedInsight: `Keep "${best.tool}" accessible for moments of high distress. It has been genuinely helpful.`,
    occurrences: best.count,
    confidence: best.count >= 3 ? 0.9 : 0.6,
  };
}

function detectCommunicationAnxiety(entries: JournalEntry[], messageDrafts: MessageDraft[]): DetectedPattern | null {
  const rewriteCount = messageDrafts.filter(m => m.rewrittenText).length;
  const pauseCount = messageDrafts.filter(m => m.paused).length;

  if (rewriteCount + pauseCount < 2) return null;

  const commTriggerEntries = entries.filter(e =>
    e.checkIn.triggers.some(t =>
      t.label.toLowerCase().includes('message') ||
      t.label.toLowerCase().includes('text') ||
      t.label.toLowerCase().includes('reply') ||
      t.label.toLowerCase().includes('response')
    )
  );

  return {
    id: 'communication_anxiety_pattern',
    patternType: 'communication_anxiety',
    description: `You paused or rewrote messages ${rewriteCount + pauseCount} times this week, showing thoughtful communication.`,
    supportiveExplanation: 'The space between impulse and action is where emotional intelligence lives. You are practicing it.',
    recommendedInsight: commTriggerEntries.length > 0
      ? 'Communication seems to be a sensitive area right now. Being mindful of this is already powerful.'
      : 'Your ability to pause before reacting in messages is a meaningful skill.',
    occurrences: rewriteCount + pauseCount,
    confidence: 0.85,
  };
}

function detectAbandonmentFear(entries: JournalEntry[]): DetectedPattern | null {
  const abandonmentEntries = entries.filter(e =>
    e.checkIn.triggers.some(t =>
      t.label.toLowerCase().includes('abandon') ||
      t.label.toLowerCase().includes('rejection') ||
      t.label.toLowerCase().includes('ignored') ||
      t.label.toLowerCase().includes('silence') ||
      t.label.toLowerCase().includes('left out') ||
      t.label.toLowerCase().includes('alone')
    ) ||
    e.checkIn.emotions.some(em =>
      em.label.toLowerCase().includes('abandon') ||
      em.label.toLowerCase().includes('rejected') ||
      em.label.toLowerCase().includes('lonely')
    )
  );

  if (abandonmentEntries.length < 2) return null;

  const avgIntensity = abandonmentEntries.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / abandonmentEntries.length;

  return {
    id: 'abandonment_fear_pattern',
    patternType: 'abandonment_fear',
    description: `Abandonment-related feelings appeared ${abandonmentEntries.length} times, with average intensity of ${Math.round(avgIntensity * 10) / 10}/10.`,
    supportiveExplanation: 'Fear of abandonment often comes from deep emotional sensitivity. It makes complete sense that this feels so strong.',
    recommendedInsight: 'When these fears surface, grounding exercises can help anchor you in the present moment.',
    occurrences: abandonmentEntries.length,
    confidence: abandonmentEntries.length >= 3 ? 0.85 : 0.6,
  };
}

export function detectPatterns(
  entries: JournalEntry[],
  messageDrafts: MessageDraft[],
): DetectedPattern[] {
  console.log('[PatternDetection] Analyzing', entries.length, 'entries and', messageDrafts.length, 'message drafts');

  const patterns: DetectedPattern[] = [];

  const relTrigger = detectRelationshipTriggers(entries);
  if (relTrigger) patterns.push(relTrigger);

  const timeDistress = detectTimeDistress(entries);
  if (timeDistress) patterns.push(timeDistress);

  const emotionalLoop = detectEmotionalLoops(entries);
  if (emotionalLoop) patterns.push(emotionalLoop);

  const copingSuccess = detectCopingSuccess(entries);
  if (copingSuccess) patterns.push(copingSuccess);

  const commAnxiety = detectCommunicationAnxiety(entries, messageDrafts);
  if (commAnxiety) patterns.push(commAnxiety);

  const abandonment = detectAbandonmentFear(entries);
  if (abandonment) patterns.push(abandonment);

  console.log('[PatternDetection] Detected', patterns.length, 'patterns');
  return patterns.sort((a, b) => b.confidence - a.confidence);
}
