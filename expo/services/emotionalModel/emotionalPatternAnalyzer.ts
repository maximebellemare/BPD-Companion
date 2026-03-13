import { JournalEntry, MessageDraft } from '@/types';
import {
  EmotionalTriggerProfile,
  EmotionSequence,
  UrgeProfile,
  RelationshipTriggerProfile,
  CopingEffectiveness,
  EscalationPattern,
} from '@/types/emotionalModel';

function withinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function calculateTrend(
  entries: JournalEntry[],
  matchFn: (e: JournalEntry) => boolean,
): 'increasing' | 'stable' | 'decreasing' {
  const recent = entries.filter(e => withinDays(e.timestamp, 14)).filter(matchFn).length;
  const older = entries.filter(e => withinDays(e.timestamp, 28) && !withinDays(e.timestamp, 14)).filter(matchFn).length;

  if (older === 0 && recent === 0) return 'stable';
  if (older === 0) return recent > 2 ? 'increasing' : 'stable';

  const ratio = recent / older;
  if (ratio > 1.3) return 'increasing';
  if (ratio < 0.7) return 'decreasing';
  return 'stable';
}

export function analyzeTriggerProfiles(entries: JournalEntry[]): EmotionalTriggerProfile[] {
  const triggerMap = new Map<string, {
    count: number;
    totalDistress: number;
    emotions: Map<string, number>;
    urges: Map<string, number>;
  }>();

  entries.forEach(entry => {
    entry.checkIn.triggers.forEach(trigger => {
      const existing = triggerMap.get(trigger.label) ?? {
        count: 0,
        totalDistress: 0,
        emotions: new Map<string, number>(),
        urges: new Map<string, number>(),
      };

      existing.count++;
      existing.totalDistress += entry.checkIn.intensityLevel;

      entry.checkIn.emotions.forEach(em => {
        existing.emotions.set(em.label, (existing.emotions.get(em.label) ?? 0) + 1);
      });

      entry.checkIn.urges.forEach(u => {
        existing.urges.set(u.label, (existing.urges.get(u.label) ?? 0) + 1);
      });

      triggerMap.set(trigger.label, existing);
    });
  });

  const profiles: EmotionalTriggerProfile[] = [];

  triggerMap.forEach((data, label) => {
    const sortedEmotions = [...data.emotions.entries()].sort((a, b) => b[1] - a[1]);
    const sortedUrges = [...data.urges.entries()].sort((a, b) => b[1] - a[1]);

    profiles.push({
      label,
      frequency: data.count,
      averageDistress: Math.round((data.totalDistress / data.count) * 10) / 10,
      commonEmotions: sortedEmotions.slice(0, 3).map(([name]) => name),
      commonUrges: sortedUrges.slice(0, 3).map(([name]) => name),
      trend: calculateTrend(entries, e => e.checkIn.triggers.some(t => t.label === label)),
    });
  });

  return profiles.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
}

export function analyzeEmotionSequences(entries: JournalEntry[]): EmotionSequence[] {
  const sequenceMap = new Map<string, { chain: string[]; count: number; totalIntensity: number }>();
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (next.timestamp - current.timestamp > 48 * 60 * 60 * 1000) continue;

    const currentEmotions = current.checkIn.emotions.map(e => e.label);
    const nextEmotions = next.checkIn.emotions.map(e => e.label);

    currentEmotions.forEach(ce => {
      nextEmotions.forEach(ne => {
        if (ce !== ne) {
          const key = `${ce}→${ne}`;
          const existing = sequenceMap.get(key) ?? { chain: [ce, ne], count: 0, totalIntensity: 0 };
          existing.count++;
          existing.totalIntensity += next.checkIn.intensityLevel;
          sequenceMap.set(key, existing);
        }
      });
    });
  }

  const sequences: EmotionSequence[] = [];
  let seqIndex = 0;

  sequenceMap.forEach((data, _key) => {
    if (data.count >= 2) {
      const avgIntensity = Math.round((data.totalIntensity / data.count) * 10) / 10;
      sequences.push({
        id: `seq_${seqIndex++}`,
        chain: data.chain,
        occurrences: data.count,
        averageIntensity: avgIntensity,
        narrative: buildSequenceNarrative(data.chain, data.count, avgIntensity),
      });
    }
  });

  return sequences.sort((a, b) => b.occurrences - a.occurrences).slice(0, 8);
}

function buildSequenceNarrative(chain: string[], count: number, avgIntensity: number): string {
  const freq = count >= 5 ? 'often' : count >= 3 ? 'sometimes' : 'occasionally';
  const intensity = avgIntensity >= 7 ? 'with high intensity' : avgIntensity >= 5 ? 'with moderate intensity' : 'at lower intensity levels';
  return `${chain[0]} ${freq} seems to lead to ${chain[1]}, ${intensity}.`;
}

export function analyzeUrgeProfiles(entries: JournalEntry[]): UrgeProfile[] {
  const urgeMap = new Map<string, {
    count: number;
    totalIntensity: number;
    triggers: Map<string, number>;
    emotions: Map<string, number>;
    managedCount: number;
  }>();

  entries.forEach(entry => {
    const isManaged = entry.outcome === 'managed';

    entry.checkIn.urges.forEach(urge => {
      const existing = urgeMap.get(urge.label) ?? {
        count: 0,
        totalIntensity: 0,
        triggers: new Map<string, number>(),
        emotions: new Map<string, number>(),
        managedCount: 0,
      };

      existing.count++;
      existing.totalIntensity += entry.checkIn.intensityLevel;
      if (isManaged) existing.managedCount++;

      entry.checkIn.triggers.forEach(t => {
        existing.triggers.set(t.label, (existing.triggers.get(t.label) ?? 0) + 1);
      });

      entry.checkIn.emotions.forEach(em => {
        existing.emotions.set(em.label, (existing.emotions.get(em.label) ?? 0) + 1);
      });

      urgeMap.set(urge.label, existing);
    });
  });

  const profiles: UrgeProfile[] = [];

  urgeMap.forEach((data, label) => {
    const sortedTriggers = [...data.triggers.entries()].sort((a, b) => b[1] - a[1]);
    const sortedEmotions = [...data.emotions.entries()].sort((a, b) => b[1] - a[1]);

    profiles.push({
      label,
      frequency: data.count,
      averageIntensity: Math.round((data.totalIntensity / data.count) * 10) / 10,
      associatedTriggers: sortedTriggers.slice(0, 3).map(([name]) => name),
      associatedEmotions: sortedEmotions.slice(0, 3).map(([name]) => name),
      managedRate: data.count > 0 ? Math.round((data.managedCount / data.count) * 100) : 0,
    });
  });

  return profiles.sort((a, b) => b.frequency - a.frequency).slice(0, 8);
}

export function analyzeRelationshipTriggers(entries: JournalEntry[]): RelationshipTriggerProfile[] {
  const relEntries = entries.filter(e =>
    e.checkIn.triggers.some(t => t.category === 'relationship'),
  );

  const triggerMap = new Map<string, {
    count: number;
    emotions: Map<string, number>;
    urges: Map<string, number>;
    totalIntensity: number;
  }>();

  relEntries.forEach(entry => {
    entry.checkIn.triggers
      .filter(t => t.category === 'relationship')
      .forEach(trigger => {
        const existing = triggerMap.get(trigger.label) ?? {
          count: 0,
          emotions: new Map<string, number>(),
          urges: new Map<string, number>(),
          totalIntensity: 0,
        };

        existing.count++;
        existing.totalIntensity += entry.checkIn.intensityLevel;

        entry.checkIn.emotions.forEach(em => {
          existing.emotions.set(em.label, (existing.emotions.get(em.label) ?? 0) + 1);
        });

        entry.checkIn.urges.forEach(u => {
          existing.urges.set(u.label, (existing.urges.get(u.label) ?? 0) + 1);
        });

        triggerMap.set(trigger.label, existing);
      });
  });

  const profiles: RelationshipTriggerProfile[] = [];

  triggerMap.forEach((data, label) => {
    const topEmotion = [...data.emotions.entries()].sort((a, b) => b[1] - a[1])[0];
    const topUrge = [...data.urges.entries()].sort((a, b) => b[1] - a[1])[0];
    const avgIntensity = data.totalIntensity / data.count;

    const escalationRisk: 'low' | 'moderate' | 'high' =
      avgIntensity >= 7 ? 'high' : avgIntensity >= 5 ? 'moderate' : 'low';

    const emotionLabel = topEmotion ? topEmotion[0] : 'distress';
    const urgeLabel = topUrge ? topUrge[0] : 'react';

    profiles.push({
      label,
      frequency: data.count,
      emotionalResponse: emotionLabel,
      typicalUrge: urgeLabel,
      escalationRisk,
      narrative: buildRelationshipNarrative(label, emotionLabel, urgeLabel, data.count),
    });
  });

  return profiles.sort((a, b) => b.frequency - a.frequency).slice(0, 6);
}

function buildRelationshipNarrative(
  trigger: string,
  emotion: string,
  urge: string,
  count: number,
): string {
  const freq = count >= 5 ? 'often' : count >= 3 ? 'sometimes' : 'at times';
  return `"${trigger}" ${freq} seems to bring up ${emotion.toLowerCase()}, with an urge to ${urge.toLowerCase()}.`;
}

export function analyzeCopingEffectiveness(entries: JournalEntry[]): CopingEffectiveness[] {
  const copingMap = new Map<string, {
    count: number;
    helpfulCount: number;
    triggers: Map<string, number>;
    emotions: Map<string, number>;
  }>();

  entries.forEach(entry => {
    const isHelpful = entry.outcome === 'managed';

    entry.checkIn.copingUsed?.forEach(tool => {
      const existing = copingMap.get(tool) ?? {
        count: 0,
        helpfulCount: 0,
        triggers: new Map<string, number>(),
        emotions: new Map<string, number>(),
      };

      existing.count++;
      if (isHelpful) existing.helpfulCount++;

      entry.checkIn.triggers.forEach(t => {
        existing.triggers.set(t.label, (existing.triggers.get(t.label) ?? 0) + 1);
      });

      entry.checkIn.emotions.forEach(em => {
        existing.emotions.set(em.label, (existing.emotions.get(em.label) ?? 0) + 1);
      });

      copingMap.set(tool, existing);
    });
  });

  const profiles: CopingEffectiveness[] = [];

  copingMap.forEach((data, tool) => {
    const sortedTriggers = [...data.triggers.entries()].sort((a, b) => b[1] - a[1]);
    const sortedEmotions = [...data.emotions.entries()].sort((a, b) => b[1] - a[1]);
    const helpfulRate = data.count > 0 ? Math.round((data.helpfulCount / data.count) * 100) : 0;

    profiles.push({
      tool,
      timesUsed: data.count,
      helpfulRate,
      bestForTriggers: sortedTriggers.slice(0, 3).map(([name]) => name),
      bestForEmotions: sortedEmotions.slice(0, 3).map(([name]) => name),
      narrative: buildCopingNarrative(tool, helpfulRate, data.count),
    });
  });

  return profiles.sort((a, b) => b.helpfulRate - a.helpfulRate).slice(0, 8);
}

function buildCopingNarrative(tool: string, helpfulRate: number, count: number): string {
  if (count < 2) return `You've started using ${tool} — keep exploring what works for you.`;
  if (helpfulRate >= 70) return `${tool} appears to be one of your most effective tools, helping in about ${helpfulRate}% of situations.`;
  if (helpfulRate >= 40) return `${tool} seems to help in some situations — it may work best for specific triggers.`;
  return `${tool} has been used ${count} times. It may help to explore when it works best for you.`;
}

export function analyzeEscalationPatterns(entries: JournalEntry[]): EscalationPattern[] {
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const patternMap = new Map<string, {
    triggerPhase: string;
    emotionalPhase: string;
    urgePhase: string;
    behaviorPhase: string;
    count: number;
    totalPeakDistress: number;
    interruptedCount: number;
  }>();

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (entry.checkIn.intensityLevel < 6) continue;

    const trigger = entry.checkIn.triggers[0]?.label ?? 'unknown';
    const emotion = entry.checkIn.emotions[0]?.label ?? 'distress';
    const urge = entry.checkIn.urges[0]?.label ?? 'react';
    const behavior = entry.outcome === 'managed' ? 'coped' : entry.outcome === 'struggled' ? 'acted on urge' : 'uncertain';

    const key = `${trigger}|${emotion}|${urge}`;
    const existing = patternMap.get(key) ?? {
      triggerPhase: trigger,
      emotionalPhase: emotion,
      urgePhase: urge,
      behaviorPhase: behavior,
      count: 0,
      totalPeakDistress: 0,
      interruptedCount: 0,
    };

    existing.count++;
    existing.totalPeakDistress += entry.checkIn.intensityLevel;
    if (entry.outcome === 'managed') existing.interruptedCount++;

    patternMap.set(key, existing);
  }

  const patterns: EscalationPattern[] = [];
  let patternIndex = 0;

  patternMap.forEach((data) => {
    if (data.count >= 2) {
      const avgPeak = Math.round((data.totalPeakDistress / data.count) * 10) / 10;
      const interruptSuccess = Math.round((data.interruptedCount / data.count) * 100);

      patterns.push({
        id: `esc_${patternIndex++}`,
        triggerPhase: data.triggerPhase,
        emotionalPhase: data.emotionalPhase,
        urgePhase: data.urgePhase,
        behaviorPhase: data.behaviorPhase,
        frequency: data.count,
        averagePeakDistress: avgPeak,
        interruptionSuccess: interruptSuccess,
        narrative: buildEscalationNarrative(data.triggerPhase, data.emotionalPhase, data.urgePhase, avgPeak),
      });
    }
  });

  return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 6);
}

function buildEscalationNarrative(
  trigger: string,
  emotion: string,
  urge: string,
  avgPeak: number,
): string {
  const intensity = avgPeak >= 8 ? 'very intense' : avgPeak >= 6 ? 'moderately intense' : 'noticeable';
  return `When "${trigger}" occurs, ${emotion.toLowerCase()} tends to rise to ${intensity} levels, often bringing an urge to ${urge.toLowerCase()}.`;
}

export function analyzeMessagePatterns(
  drafts: MessageDraft[],
): { rewriteFrequency: number; pauseRate: number; sentAfterPauseRate: number } {
  if (drafts.length === 0) {
    return { rewriteFrequency: 0, pauseRate: 0, sentAfterPauseRate: 0 };
  }

  const rewriteCount = drafts.filter(d => d.rewrittenText).length;
  const pauseCount = drafts.filter(d => d.paused).length;
  const pausedAndSent = drafts.filter(d => d.paused && d.sent).length;

  return {
    rewriteFrequency: rewriteCount,
    pauseRate: drafts.length > 0 ? Math.round((pauseCount / drafts.length) * 100) : 0,
    sentAfterPauseRate: pauseCount > 0 ? Math.round((pausedAndSent / pauseCount) * 100) : 0,
  };
}
