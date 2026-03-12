import { UserProfile, PatternSummary } from '@/types/profile';
import { JournalEntry } from '@/types';
import { profileRepository } from '@/services/repositories';

export async function loadProfile(): Promise<UserProfile> {
  return profileRepository.load();
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  return profileRepository.save(profile);
}

export function computePatternSummary(journalEntries: JournalEntry[]): PatternSummary {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const _sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const recentEntries = journalEntries.filter(e => e.timestamp >= thirtyDaysAgo);

  const triggerCounts: Record<string, number> = {};
  const urgeCounts: Record<string, number> = {};
  const exerciseCounts: Record<string, number> = {};
  let totalIntensity = 0;

  recentEntries.forEach(entry => {
    totalIntensity += entry.checkIn.intensityLevel;

    entry.checkIn.triggers.forEach(t => {
      triggerCounts[t.label] = (triggerCounts[t.label] || 0) + 1;
    });

    entry.checkIn.urges.forEach(u => {
      urgeCounts[u.label] = (urgeCounts[u.label] || 0) + 1;
    });

    if (entry.checkIn.copingUsed) {
      entry.checkIn.copingUsed.forEach(c => {
        exerciseCounts[c] = (exerciseCounts[c] || 0) + 1;
      });
    }
  });

  const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0];
  const topUrge = Object.entries(urgeCounts).sort((a, b) => b[1] - a[1])[0];
  const topExercise = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0];

  const weeklyCheckIns: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = now - (i + 1) * 24 * 60 * 60 * 1000;
    const dayEnd = now - i * 24 * 60 * 60 * 1000;
    const count = journalEntries.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd).length;
    weeklyCheckIns.push(count);
  }

  let journalStreak = 0;
  const sortedEntries = [...journalEntries].sort((a, b) => b.timestamp - a.timestamp);
  if (sortedEntries.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = today.getTime();

    for (let i = 0; i < 365; i++) {
      const dayStart = checkDate;
      const dayEnd = checkDate + 24 * 60 * 60 * 1000;
      const hasEntry = sortedEntries.some(e => e.timestamp >= dayStart && e.timestamp < dayEnd);
      if (hasEntry) {
        journalStreak++;
        checkDate -= 24 * 60 * 60 * 1000;
      } else {
        break;
      }
    }
  }

  return {
    topTriggerThisMonth: topTrigger ? topTrigger[0] : null,
    averageDistressIntensity: recentEntries.length > 0 ? Math.round((totalIntensity / recentEntries.length) * 10) / 10 : 0,
    mostCommonUrge: topUrge ? topUrge[0] : null,
    mostUsedExercise: topExercise ? topExercise[0] : null,
    checkInCount: recentEntries.length,
    journalStreak,
    totalJournalEntries: journalEntries.length,
    weeklyCheckIns,
  };
}

export const TRIGGER_OPTIONS = [
  'Someone ignored me',
  'Feeling rejected',
  'Fear of abandonment',
  'Conflict with someone',
  'Perceived criticism',
  'Feeling not good enough',
  'Identity confusion',
  'Comparing myself',
  'Change in plans',
  'Being alone',
  'A painful memory',
  'Feeling invalidated',
  'Being left out',
  'Sudden mood shift',
];

export const URGE_OPTIONS = [
  'Send an angry text',
  'Push someone away',
  'Beg for reassurance',
  'Isolate completely',
  'Quit / end things',
  'Lash out at someone',
  'Cry uncontrollably',
  'Scroll obsessively',
  'Overspend',
  'Overeat or restrict',
];

export const COPING_OPTIONS = [
  '5-4-3-2-1 Grounding',
  'Ice Dive',
  'Self-Soothe Kit',
  'Compassionate Letter',
  'Check the Facts',
  'Mind Reading Check',
  'Opposite Action',
  'Ride the Wave',
  'Deep Breathing',
  'Walking',
  'Journaling',
  'Talking to someone',
  'Meditation',
  'Music',
];

export const RELATIONSHIP_TRIGGER_OPTIONS = [
  'Partner not responding',
  'Feeling replaced',
  'Unequal effort',
  'Mixed signals',
  'Being compared to others',
  'Plans being cancelled',
  'Feeling controlled',
  'Fear of losing them',
  'Jealousy spiral',
  'Feeling unimportant',
];

export const GROUNDING_TOOL_OPTIONS = [
  '5-4-3-2-1 Senses',
  'Ice / cold water',
  'Box breathing',
  'Body scan',
  'Name 5 colors',
  'Hold something textured',
  'Splash face with water',
  'Strong scent',
];

export const EMOTIONAL_SPIRAL_OPTIONS = [
  'Rejection → rage → guilt → shame',
  'Abandonment fear → clinginess → pushing away',
  'Criticism → self-hatred → isolation',
  'Jealousy → obsessive checking → confrontation',
  'Emptiness → impulsive behavior → regret',
  'Idealization → disappointment → devaluation',
  'Anxiety → overthinking → emotional shutdown',
  'Feeling unseen → anger → self-blame',
  'Love-bombing → withdrawing → panic',
  'Numbness → risky behavior → guilt spiral',
];

export const RELATIONSHIP_TYPE_OPTIONS = [
  'Partner',
  'Parent',
  'Sibling',
  'Friend',
  'Therapist',
  'Coworker',
  'Other',
];
