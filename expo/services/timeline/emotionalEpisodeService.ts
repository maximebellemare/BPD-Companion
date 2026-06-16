import { JournalEntry, MessageDraft } from '@/types';
import {
  EmotionalEpisode,
  EpisodeNode,
  EpisodeNodeType,
  EpisodeOutcome,
  EpisodeReplayState,
} from '@/types/emotionalEpisode';

const EPISODE_GAP_MS = 4 * 60 * 60 * 1000;

const EMOTION_COLORS: Record<string, string> = {
  anxious: '#67E8F9',
  anxiety: '#67E8F9',
  abandoned: '#67E8F9',
  fear: '#67E8F9',
  angry: '#3B82F6',
  anger: '#3B82F6',
  hurt: '#67E8F9',
  ashamed: '#3B82F6',
  shame: '#3B82F6',
  confused: '#2E2A72',
  numb: '#3B82F6',
  sad: '#3B82F6',
  sadness: '#3B82F6',
  happy: '#14B8A6',
  calm: '#14B8A6',
  relieved: '#14B8A6',
  overwhelmed: '#3B82F6',
  panicked: '#3B82F6',
  lonely: '#3B82F6',
  frustrated: '#3B82F6',
  jealous: '#14B8A6',
  guilty: '#3B82F6',
  hopeless: '#2E2A72',
};

function getEmotionColor(emotion: string): string {
  const lower = emotion.toLowerCase();
  for (const [key, color] of Object.entries(EMOTION_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#2E2A72';
}

function getNodeColor(type: EpisodeNodeType, label: string): string {
  switch (type) {
    case 'trigger': return '#3B82F6';
    case 'emotion': return getEmotionColor(label);
    case 'urge': return '#3B82F6';
    case 'behavior': return '#67E8F9';
    case 'coping': return '#14B8A6';
    case 'outcome': return '#14B8A6';
    default: return '#2E2A72';
  }
}

function determineOutcome(entries: JournalEntry[], drafts: MessageDraft[]): EpisodeOutcome {
  const hasManaged = entries.some(e => e.outcome === 'managed');
  const hasStruggled = entries.some(e => e.outcome === 'struggled');
  const hasPaused = drafts.some(d => d.paused);
  const hasHelped = drafts.some(d => d.outcome === 'helped');

  if (hasManaged || hasPaused || hasHelped) return 'managed';
  if (hasStruggled) return 'escalated';

  const intensities = entries.map(e => e.checkIn.intensityLevel);
  if (intensities.length >= 2) {
    const first = intensities[0];
    const last = intensities[intensities.length - 1];
    if (last < first - 2) return 'deescalated';
    if (last > first + 2) return 'escalated';
  }

  return 'neutral';
}

function buildNodes(entries: JournalEntry[], drafts: MessageDraft[]): EpisodeNode[] {
  const nodes: EpisodeNode[] = [];
  let nodeIndex = 0;

  const allItems: { timestamp: number; entry?: JournalEntry; draft?: MessageDraft }[] = [
    ...entries.map(e => ({ timestamp: e.timestamp, entry: e })),
    ...drafts.map(d => ({ timestamp: d.timestamp, draft: d })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  for (const item of allItems) {
    if (item.entry) {
      const e = item.entry;

      e.checkIn.triggers.forEach(t => {
        nodes.push({
          id: `node-${nodeIndex++}`,
          type: 'trigger',
          label: t.label,
          timestamp: e.timestamp,
          color: getNodeColor('trigger', t.label),
        });
      });

      e.checkIn.emotions.forEach(em => {
        nodes.push({
          id: `node-${nodeIndex++}`,
          type: 'emotion',
          label: em.label,
          timestamp: e.timestamp,
          intensity: em.intensity ?? e.checkIn.intensityLevel,
          color: getNodeColor('emotion', em.label),
        });
      });

      e.checkIn.urges.forEach(u => {
        nodes.push({
          id: `node-${nodeIndex++}`,
          type: 'urge',
          label: u.label,
          timestamp: e.timestamp,
          color: getNodeColor('urge', u.label),
        });
      });

      if (e.checkIn.copingUsed && e.checkIn.copingUsed.length > 0) {
        e.checkIn.copingUsed.forEach(c => {
          nodes.push({
            id: `node-${nodeIndex++}`,
            type: 'coping',
            label: c,
            timestamp: e.timestamp,
            color: getNodeColor('coping', c),
          });
        });
      }

      if (e.outcome) {
        nodes.push({
          id: `node-${nodeIndex++}`,
          type: 'outcome',
          label: e.outcome === 'managed' ? 'Managed well' : e.outcome === 'struggled' ? 'Struggled' : 'Neutral',
          timestamp: e.timestamp,
          color: getNodeColor('outcome', e.outcome),
        });
      }
    }

    if (item.draft) {
      const d = item.draft;
      const action = d.paused
        ? 'Paused before sending'
        : d.rewriteType
          ? `Rewrote message (${d.rewriteType})`
          : d.sent
            ? 'Sent message'
            : 'Drafted message';

      nodes.push({
        id: `node-${nodeIndex++}`,
        type: 'behavior',
        label: action,
        timestamp: d.timestamp,
        color: d.paused ? getNodeColor('coping', action) : getNodeColor('behavior', action),
      });
    }
  }

  return nodes;
}

function generateReflection(episode: {
  triggers: string[];
  emotions: string[];
  urges: string[];
  copingUsed: string[];
  outcome: EpisodeOutcome;
  peakIntensity: number;
  isRelationshipRelated: boolean;
}): string {
  const parts: string[] = [];

  if (episode.triggers.length > 0) {
    const triggerStr = episode.triggers.slice(0, 2).join(' and ');
    parts.push(`This episode seems to have started with ${triggerStr}.`);
  }

  if (episode.emotions.length > 0) {
    const emotionStr = episode.emotions.slice(0, 3).join(', ');
    parts.push(`The emotions that came up — ${emotionStr} — may reflect what was most activated in this moment.`);
  }

  if (episode.peakIntensity >= 7) {
    parts.push('Intensity reached a high point during this episode.');
  }

  if (episode.urges.length > 0) {
    const urgeStr = episode.urges.slice(0, 2).join(' and ');
    parts.push(`The urge to ${urgeStr.toLowerCase()} appeared during this episode.`);
  }

  if (episode.copingUsed.length > 0) {
    parts.push(`Using ${episode.copingUsed[0].toLowerCase()} may have helped during this moment.`);
  }

  if (episode.outcome === 'managed') {
    parts.push('It looks like you were able to manage this one. That matters.');
  } else if (episode.outcome === 'escalated') {
    parts.push('This one seems to have been more difficult. That is okay — noticing the pattern is a step forward.');
  } else if (episode.outcome === 'deescalated') {
    parts.push('It appears that things settled down during this episode.');
  }

  if (episode.isRelationshipRelated) {
    parts.push('This episode seems connected to a relationship situation.');
  }

  return parts.length > 0
    ? parts.join(' ')
    : 'This episode does not have enough detail for a full reflection yet.';
}

function generateInterruptSuggestion(episode: {
  triggers: string[];
  emotions: string[];
  urges: string[];
  peakIntensity: number;
  isRelationshipRelated: boolean;
}): string {
  if (episode.isRelationshipRelated && episode.urges.some(u =>
    u.toLowerCase().includes('text') || u.toLowerCase().includes('call') || u.toLowerCase().includes('reassurance')
  )) {
    return 'A short pause before reaching out — even 2 minutes — might help interrupt the urgency next time.';
  }

  if (episode.peakIntensity >= 7) {
    return 'Grounding or breathing before the intensity peaks could help create a small gap between the trigger and the reaction.';
  }

  if (episode.emotions.some(e => e.toLowerCase().includes('shame') || e.toLowerCase().includes('ashamed'))) {
    return 'Naming the shame early — before withdrawal sets in — might help keep you connected to what you actually need.';
  }

  if (episode.emotions.some(e => e.toLowerCase().includes('anxi') || e.toLowerCase().includes('panic'))) {
    return 'When anxiety starts to build, a grounding exercise may help slow the emotional acceleration.';
  }

  if (episode.urges.some(u => u.toLowerCase().includes('withdraw') || u.toLowerCase().includes('isolate'))) {
    return 'Before pulling away, a short check-in with yourself about what you actually need might open a different path.';
  }

  return 'Noticing the pattern is already an interrupt. Next time, a brief pause at the first emotional shift may help.';
}

export function buildEmotionalEpisodes(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): EmotionalEpisode[] {
  const sorted = [...journalEntries].sort((a, b) => a.timestamp - b.timestamp);
  if (sorted.length === 0) return [];

  const episodeGroups: { entries: JournalEntry[]; drafts: MessageDraft[] }[] = [];
  let currentGroup: { entries: JournalEntry[]; drafts: MessageDraft[] } = {
    entries: [sorted[0]],
    drafts: [],
  };

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].timestamp - sorted[i - 1].timestamp;
    if (gap <= EPISODE_GAP_MS) {
      currentGroup.entries.push(sorted[i]);
    } else {
      episodeGroups.push(currentGroup);
      currentGroup = { entries: [sorted[i]], drafts: [] };
    }
  }
  episodeGroups.push(currentGroup);

  messageDrafts.forEach(draft => {
    for (const group of episodeGroups) {
      const start = group.entries[0].timestamp - 30 * 60 * 1000;
      const end = group.entries[group.entries.length - 1].timestamp + 30 * 60 * 1000;
      if (draft.timestamp >= start && draft.timestamp <= end) {
        group.drafts.push(draft);
        return;
      }
    }
  });

  return episodeGroups.map((group, idx) => {
    const entries = group.entries;
    const drafts = group.drafts;

    const allEmotions: string[] = [];
    const allTriggers: string[] = [];
    const allUrges: string[] = [];
    const allCoping: string[] = [];
    let peakIntensity = 0;
    let totalIntensity = 0;
    let intensityCount = 0;
    let isRelationshipRelated = false;

    entries.forEach(e => {
      e.checkIn.emotions.forEach(em => {
        if (!allEmotions.includes(em.label)) allEmotions.push(em.label);
      });
      e.checkIn.triggers.forEach(t => {
        if (!allTriggers.includes(t.label)) allTriggers.push(t.label);
        if (t.category === 'relationship') isRelationshipRelated = true;
      });
      e.checkIn.urges.forEach(u => {
        if (!allUrges.includes(u.label)) allUrges.push(u.label);
      });
      if (e.checkIn.copingUsed) {
        e.checkIn.copingUsed.forEach(c => {
          if (!allCoping.includes(c)) allCoping.push(c);
        });
      }
      if (e.checkIn.intensityLevel > peakIntensity) {
        peakIntensity = e.checkIn.intensityLevel;
      }
      totalIntensity += e.checkIn.intensityLevel;
      intensityCount++;
    });

    const nodes = buildNodes(entries, drafts);
    const outcome = determineOutcome(entries, drafts);

    const episodeData = {
      triggers: allTriggers,
      emotions: allEmotions,
      urges: allUrges,
      copingUsed: allCoping,
      outcome,
      peakIntensity,
      isRelationshipRelated,
    };

    return {
      id: `episode-${idx}-${entries[0].timestamp}`,
      startTime: entries[0].timestamp,
      endTime: entries[entries.length - 1].timestamp,
      nodes,
      peakIntensity,
      averageIntensity: intensityCount > 0 ? totalIntensity / intensityCount : 0,
      dominantEmotion: allEmotions[0] ?? 'Unknown',
      triggers: allTriggers,
      emotions: allEmotions,
      urges: allUrges,
      copingUsed: allCoping,
      outcome,
      reflection: generateReflection(episodeData),
      interruptSuggestion: generateInterruptSuggestion(episodeData),
      isRelationshipRelated,
    };
  }).sort((a, b) => b.startTime - a.startTime);
}

export function buildEpisodeReplayState(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): EpisodeReplayState {
  const episodes = buildEmotionalEpisodes(journalEntries, messageDrafts);
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentEpisodes = episodes.filter(e => e.startTime >= weekAgo);

  const triggerCounts: Record<string, number> = {};
  episodes.forEach(ep => {
    ep.triggers.forEach(t => {
      triggerCounts[t] = (triggerCounts[t] || 0) + 1;
    });
  });

  const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
  const topPattern = sortedTriggers.length > 0
    ? `${sortedTriggers[0][0]} appears in ${sortedTriggers[0][1]} episode${sortedTriggers[0][1] !== 1 ? 's' : ''}`
    : null;

  return {
    episodes,
    selectedEpisode: null,
    recentEpisodeCount: recentEpisodes.length,
    highIntensityCount: episodes.filter(e => e.peakIntensity >= 7).length,
    managedCount: episodes.filter(e => e.outcome === 'managed' || e.outcome === 'deescalated').length,
    topPattern,
  };
}
