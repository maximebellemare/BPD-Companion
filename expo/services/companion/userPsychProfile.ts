import {
  CompanionMemoryStore,
  UserPsychProfile,
  ProfileTrait,
} from '@/types/companionMemory';
import { storageService } from '@/services/storage/storageService';

const PROFILE_STORAGE_KEY = 'bpd_companion_psych_profile';

export async function loadPsychProfile(): Promise<UserPsychProfile> {
  try {
    const stored = await storageService.get<UserPsychProfile>(PROFILE_STORAGE_KEY);
    if (stored) {
      console.log('[PsychProfile] Loaded profile');
      return stored;
    }
    return createEmptyProfile();
  } catch (error) {
    console.log('[PsychProfile] Error loading:', error);
    return createEmptyProfile();
  }
}

export async function savePsychProfile(profile: UserPsychProfile): Promise<void> {
  try {
    profile.lastUpdated = Date.now();
    await storageService.set(PROFILE_STORAGE_KEY, profile);
    console.log('[PsychProfile] Saved profile');
  } catch (error) {
    console.log('[PsychProfile] Error saving:', error);
  }
}

function createEmptyProfile(): UserPsychProfile {
  return {
    commonTriggers: [],
    relationshipStyle: 'unknown',
    communicationPatterns: [],
    copingSuccessPatterns: [],
    emotionalBaseline: 5,
    peakDistressTimes: [],
    growthAreas: [],
    strengths: [],
    lastUpdated: 0,
  };
}

export function rebuildPsychProfile(store: CompanionMemoryStore): UserPsychProfile {
  console.log('[PsychProfile] Rebuilding from', store.episodicMemories.length, 'episodes');

  const profile = createEmptyProfile();

  profile.commonTriggers = buildTriggerTraits(store);
  profile.relationshipStyle = detectRelationshipStyle(store);
  profile.communicationPatterns = detectCommunicationPatterns(store);
  profile.copingSuccessPatterns = buildCopingTraits(store);
  profile.emotionalBaseline = calculateEmotionalBaseline(store);
  profile.peakDistressTimes = detectPeakTimes(store);
  profile.growthAreas = detectGrowthAreas(store);
  profile.strengths = detectStrengths(store);
  profile.lastUpdated = Date.now();

  return profile;
}

function buildTriggerTraits(store: CompanionMemoryStore): ProfileTrait[] {
  const triggerMap = new Map<string, { count: number; lastSeen: number }>();

  for (const ep of store.episodicMemories) {
    const existing = triggerMap.get(ep.trigger) ?? { count: 0, lastSeen: 0 };
    existing.count += 1;
    existing.lastSeen = Math.max(existing.lastSeen, ep.timestamp);
    triggerMap.set(ep.trigger, existing);
  }

  return Array.from(triggerMap.entries())
    .map(([label, data]) => ({
      label,
      frequency: data.count,
      lastSeen: data.lastSeen,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 8);
}

function detectRelationshipStyle(store: CompanionMemoryStore): string {
  const relEpisodes = store.episodicMemories.filter(m => m.relationshipContext);
  if (relEpisodes.length < 3) return 'not enough data';

  const abandonmentCount = relEpisodes.filter(m =>
    m.trigger.toLowerCase().includes('abandon') ||
    m.trigger.toLowerCase().includes('reject') ||
    m.trigger.toLowerCase().includes('left'),
  ).length;

  const conflictCount = relEpisodes.filter(m =>
    m.trigger.toLowerCase().includes('conflict') ||
    m.trigger.toLowerCase().includes('fight') ||
    m.trigger.toLowerCase().includes('argue'),
  ).length;

  const reassuranceTraits = store.semanticMemories.filter(m =>
    m.trait.toLowerCase().includes('reassurance') ||
    m.trait.toLowerCase().includes('need validation'),
  );

  if (abandonmentCount > conflictCount && abandonmentCount >= 2) {
    return 'abandonment-sensitive';
  }
  if (conflictCount > abandonmentCount && conflictCount >= 2) {
    return 'conflict-avoidant';
  }
  if (reassuranceTraits.length > 0) {
    return 'reassurance-seeking';
  }

  return 'mixed patterns';
}

function detectCommunicationPatterns(store: CompanionMemoryStore): string[] {
  const patterns: string[] = [];

  const messagingEpisodes = store.episodicMemories.filter(m =>
    m.tags.some(t => t.includes('message') || t.includes('text') || t.includes('communication')),
  );

  if (messagingEpisodes.length >= 2) {
    const urgentMessages = messagingEpisodes.filter(m =>
      m.intensity && m.intensity >= 7,
    );
    if (urgentMessages.length >= 2) {
      patterns.push('tends to message when emotions are high');
    }
  }

  const pauseTraits = store.semanticMemories.filter(m =>
    m.trait.toLowerCase().includes('pause') || m.trait.toLowerCase().includes('rewrite'),
  );
  if (pauseTraits.length > 0) {
    patterns.push('developing skill at pausing before responding');
  }

  const conflictEpisodes = store.episodicMemories.filter(m =>
    m.tags.some(t => t.includes('conflict')),
  );
  if (conflictEpisodes.length >= 2) {
    const hasRepair = conflictEpisodes.some(m =>
      m.outcome === 'managed' || m.lesson,
    );
    if (hasRepair) {
      patterns.push('showing capacity for post-conflict repair');
    }
  }

  return patterns;
}

function buildCopingTraits(store: CompanionMemoryStore): ProfileTrait[] {
  const copingMap = new Map<string, { helped: number; total: number; lastSeen: number }>();

  for (const ep of store.episodicMemories) {
    if (ep.copingUsed) {
      for (const tool of ep.copingUsed) {
        const existing = copingMap.get(tool) ?? { helped: 0, total: 0, lastSeen: 0 };
        existing.total += 1;
        if (ep.outcome === 'helped' || ep.outcome === 'managed') {
          existing.helped += 1;
        }
        existing.lastSeen = Math.max(existing.lastSeen, ep.timestamp);
        copingMap.set(tool, existing);
      }
    }
  }

  return Array.from(copingMap.entries())
    .map(([label, data]) => ({
      label,
      frequency: data.total,
      effectiveness: data.total > 0 ? data.helped / data.total : 0,
      lastSeen: data.lastSeen,
    }))
    .sort((a, b) => (b.effectiveness ?? 0) - (a.effectiveness ?? 0))
    .slice(0, 6);
}

function calculateEmotionalBaseline(store: CompanionMemoryStore): number {
  const recentEpisodes = store.episodicMemories.filter(
    m => m.intensity && Date.now() - m.timestamp < 30 * 24 * 60 * 60 * 1000,
  );

  if (recentEpisodes.length === 0) return 5;

  const total = recentEpisodes.reduce((sum, ep) => sum + (ep.intensity ?? 5), 0);
  return Math.round((total / recentEpisodes.length) * 10) / 10;
}

function detectPeakTimes(store: CompanionMemoryStore): string[] {
  const hourCounts = new Map<number, number>();

  for (const ep of store.episodicMemories) {
    if (ep.intensity && ep.intensity >= 7) {
      const hour = new Date(ep.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    }
  }

  const sorted = Array.from(hourCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return sorted.map(([hour]) => {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'late night';
  });
}

function detectGrowthAreas(store: CompanionMemoryStore): string[] {
  const areas: string[] = [];

  const recentEpisodes = store.episodicMemories.filter(
    m => Date.now() - m.timestamp < 30 * 24 * 60 * 60 * 1000,
  );

  const unmanagedHighDistress = recentEpisodes.filter(
    m => m.intensity && m.intensity >= 7 && (!m.copingUsed || m.copingUsed.length === 0),
  );
  if (unmanagedHighDistress.length >= 2) {
    areas.push('building coping strategies for high-intensity moments');
  }

  const relConflicts = recentEpisodes.filter(m => m.relationshipContext);
  const unresolved = relConflicts.filter(m => m.outcome === 'escalated' || !m.outcome);
  if (unresolved.length >= 2) {
    areas.push('navigating relationship conflicts');
  }

  const abandonmentEpisodes = recentEpisodes.filter(m =>
    m.trigger.toLowerCase().includes('abandon') || m.trigger.toLowerCase().includes('reject'),
  );
  if (abandonmentEpisodes.length >= 2) {
    areas.push('working with abandonment triggers');
  }

  return areas.slice(0, 4);
}

function detectStrengths(store: CompanionMemoryStore): string[] {
  const strengths: string[] = [];

  const sessionsWithInsights = store.sessionSummaries.filter(s => s.insight);
  if (sessionsWithInsights.length >= 3) {
    strengths.push('strong self-reflection ability');
  }

  const effectiveCoping = store.episodicMemories.filter(
    m => m.copingUsed && m.copingUsed.length > 0 && (m.outcome === 'helped' || m.outcome === 'managed'),
  );
  if (effectiveCoping.length >= 3) {
    strengths.push('growing capacity to use coping tools');
  }

  const sessionsWithSkills = store.sessionSummaries.filter(s => s.skillsPracticed.length > 0);
  if (sessionsWithSkills.length >= 2) {
    strengths.push('willingness to practice new skills');
  }

  if (store.episodicMemories.length >= 10) {
    strengths.push('consistent engagement with emotional support');
  }

  return strengths.slice(0, 4);
}

export function buildProfileContext(profile: UserPsychProfile): string {
  const parts: string[] = [];

  if (profile.commonTriggers.length === 0 && profile.strengths.length === 0) {
    return '';
  }

  parts.push('[User Emotional Profile]');

  if (profile.commonTriggers.length > 0) {
    parts.push(`Common triggers: ${profile.commonTriggers.slice(0, 3).map(t => `"${t.label}" (${t.frequency}x)`).join(', ')}.`);
  }

  if (profile.relationshipStyle !== 'unknown' && profile.relationshipStyle !== 'not enough data') {
    parts.push(`Relationship pattern: ${profile.relationshipStyle}.`);
  }

  if (profile.communicationPatterns.length > 0) {
    parts.push(`Communication: ${profile.communicationPatterns.join('; ')}.`);
  }

  if (profile.copingSuccessPatterns.length > 0) {
    const effective = profile.copingSuccessPatterns.filter(c => (c.effectiveness ?? 0) >= 0.5);
    if (effective.length > 0) {
      parts.push(`Effective coping: ${effective.map(c => `"${c.label}"`).join(', ')}.`);
    }
  }

  parts.push(`Emotional baseline: ${profile.emotionalBaseline}/10.`);

  if (profile.peakDistressTimes.length > 0) {
    parts.push(`Peak distress times: ${[...new Set(profile.peakDistressTimes)].join(', ')}.`);
  }

  if (profile.strengths.length > 0) {
    parts.push(`Strengths: ${profile.strengths.join('; ')}.`);
  }

  if (profile.growthAreas.length > 0) {
    parts.push(`Growth areas: ${profile.growthAreas.join('; ')}.`);
  }

  return parts.join('\n');
}
