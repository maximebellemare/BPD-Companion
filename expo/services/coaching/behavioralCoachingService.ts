import { JournalEntry, MessageDraft } from '@/types';
import { MemoryProfile } from '@/types/memory';
import { GraphPatternSummary } from '@/types/memoryGraph';
import {
  CoachingNudge,
  DailyCoaching,
  CoachingWin,
} from '@/types/coaching';
import {
  buildCommunicationNudges,
  buildRegulationNudges,
  buildReassuranceNudges,
  buildShameNudges,
  buildSelfSoothingNudges,
  buildCoachingInsights,
  buildCoachingWins,
  buildMessageCoachingNudge,
} from '@/services/coaching/coachingPromptBuilder';
import { buildMemoryProfile } from '@/services/memory/memoryProfileService';
import { getGraphPatternSummary } from '@/services/memory/emotionalMemoryGraphService';

let cachedCoaching: DailyCoaching | null = null;
let cachedDate = '';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildProfile(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): { memoryProfile: MemoryProfile; graphSummary: GraphPatternSummary | null } {
  const triggerCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};
  const urgeCounts: Record<string, number> = {};

  journalEntries.forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      triggerCounts[t.label] = (triggerCounts[t.label] || 0) + 1;
    });
    entry.checkIn.emotions.forEach(e => {
      emotionCounts[e.label] = (emotionCounts[e.label] || 0) + 1;
    });
    entry.checkIn.urges.forEach(u => {
      urgeCounts[u.label] = (urgeCounts[u.label] || 0) + 1;
    });
  });

  const memoryProfile = buildMemoryProfile(journalEntries, triggerCounts, emotionCounts, urgeCounts, messageDrafts);

  let graphSummary: GraphPatternSummary | null = null;
  try {
    graphSummary = getGraphPatternSummary(journalEntries, messageDrafts);
  } catch (err) {
    console.log('[BehavioralCoachingService] Graph summary unavailable:', err);
  }

  return { memoryProfile, graphSummary };
}

function pickFocusArea(profile: MemoryProfile): { area: string; description: string } {
  if (profile.intensityTrend === 'rising') {
    return {
      area: 'Emotional Regulation',
      description: 'Your intensity has been higher recently. Today\'s focus is on calming tools that work for you.',
    };
  }

  const relTriggers = profile.topTriggers.filter(t => {
    const label = t.label.toLowerCase();
    return label.includes('abandon') || label.includes('reject') || label.includes('uncertain') ||
      label.includes('conflict') || label.includes('ignored') || label.includes('partner');
  });

  if (relTriggers.length > 0) {
    return {
      area: 'Communication & Relationships',
      description: 'Relationship-related patterns have been active. Today\'s focus is on pausing and responding with care.',
    };
  }

  const hasShame = profile.topEmotions.some(e =>
    e.label.toLowerCase().includes('shame') || e.label.toLowerCase().includes('guilt')
  );

  if (hasShame) {
    return {
      area: 'Shame Recovery',
      description: 'Shame has been showing up in your patterns. Today\'s focus is on self-compassion and grounding.',
    };
  }

  if (profile.messageUsage.totalPauses > 0) {
    return {
      area: 'Pause Training',
      description: 'You\'ve been building a pause habit. Today\'s focus is on strengthening that skill.',
    };
  }

  return {
    area: 'Self-Awareness',
    description: 'Keep checking in. Every moment of awareness helps build a clearer picture.',
  };
}

export function generateDailyCoaching(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): DailyCoaching {
  const todayKey = getTodayKey();

  if (cachedCoaching && cachedDate === todayKey) {
    console.log('[BehavioralCoachingService] Returning cached daily coaching');
    return cachedCoaching;
  }

  console.log('[BehavioralCoachingService] Generating daily coaching...');

  const { memoryProfile, graphSummary } = buildProfile(journalEntries, messageDrafts);
  const { area, description } = pickFocusArea(memoryProfile);

  const allNudges: CoachingNudge[] = [
    ...buildCommunicationNudges(memoryProfile, graphSummary),
    ...buildRegulationNudges(memoryProfile, graphSummary),
    ...buildReassuranceNudges(memoryProfile, graphSummary),
    ...buildShameNudges(memoryProfile, graphSummary),
    ...buildSelfSoothingNudges(memoryProfile, graphSummary),
  ];

  allNudges.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const primaryNudge: CoachingNudge = allNudges[0] ?? {
    id: `default-${Date.now()}`,
    category: 'emotional_regulation',
    title: 'A gentle check-in',
    message: 'Take a moment to notice how you\'re feeling right now. Even small moments of awareness matter.',
    suggestedAction: { label: 'Check In', route: '/check-in', icon: 'heart' },
    intensity: 'gentle' as const,
    relevanceScore: 0.5,
    basedOn: ['general'],
    createdAt: Date.now(),
  };

  const secondaryNudges = allNudges.slice(1, 4);
  const insights = buildCoachingInsights(memoryProfile, graphSummary);

  const coaching: DailyCoaching = {
    date: todayKey,
    primaryNudge,
    secondaryNudges,
    insights,
    focusArea: area,
    focusDescription: description,
  };

  cachedCoaching = coaching;
  cachedDate = todayKey;

  console.log('[BehavioralCoachingService] Generated', allNudges.length, 'nudges,', insights.length, 'insights');

  return coaching;
}

export function getCoachingWins(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): CoachingWin[] {
  const { memoryProfile, graphSummary } = buildProfile(journalEntries, messageDrafts);
  return buildCoachingWins(memoryProfile, graphSummary);
}

export function getMessageCoachingNudge(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): CoachingNudge | null {
  const { memoryProfile, graphSummary } = buildProfile(journalEntries, messageDrafts);
  return buildMessageCoachingNudge(memoryProfile, graphSummary);
}

export function invalidateCoachingCache(): void {
  cachedCoaching = null;
  cachedDate = '';
  console.log('[BehavioralCoachingService] Cache invalidated');
}
