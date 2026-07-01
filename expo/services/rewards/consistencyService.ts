import { JournalEntry, MessageDraft } from '@/types';
import { ConsistencyMetrics, DEFAULT_CONSISTENCY_METRICS } from '@/types/reward';
import { Medication, MedicationLog } from '@/types/medication';
import { Appointment } from '@/types/appointment';
import { AIConversation } from '@/types/ai';
import { CalmMeDownSession } from '@/services/calm/calmSessionService';
import { DBTAcademyProgress } from '@/services/dbt/dbtAcademyService';
import { CommunityPost } from '@/types/community';
import { SavedCompanionInsight } from '@/services/companion/companionInsightService';

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStreak(dateKeys: string[]): number {
  if (dateKeys.length === 0) return 0;
  const sorted = [...new Set(dateKeys)].sort().reverse();
  const today = getDateKey(Date.now());
  const yesterday = getDateKey(Date.now() - 24 * 60 * 60 * 1000);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1]);
    const currDate = new Date(sorted[i]);
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function computeConsistencyMetrics(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
  medications: Medication[],
  medicationLogs: MedicationLog[],
  appointments: Appointment[],
  conversations: AIConversation[],
  calmSessions: CalmMeDownSession[] = [],
  savedInsights: SavedCompanionInsight[] = [],
  communityPosts: CommunityPost[] = [],
  dbtProgress?: DBTAcademyProgress | null,
): ConsistencyMetrics {
  try {
    const checkInDays = new Set(
      journalEntries
        .filter(e => e.checkIn && e.checkIn.intensityLevel > 0)
        .map(e => getDateKey(e.timestamp))
    ).size;

    const journalDays = new Set(
      journalEntries.map(e => getDateKey(e.timestamp))
    ).size;

    const pauseWins = messageDrafts.filter(d => d.paused).length;

    const weeklyReflections = journalEntries.filter(e =>
      e.reflection && e.reflection.length > 0
    ).length;

    const therapyPreps = appointments.filter(a =>
      a.preSessionNotes && (
        a.preSessionNotes.hardestLately.length > 0 ||
        a.preSessionNotes.questionsToAsk.length > 0 ||
        a.preSessionNotes.progressOrSetbacks.length > 0
      )
    ).length;

    const takenLogs = medicationLogs.filter(l => l.status === 'taken');
    const medicationAdherenceDays = new Set(
      takenLogs.map(l => getDateKey(l.timestamp))
    ).size;

    const companionSessions = conversations.length;

    const supportBeforeReaction = messageDrafts.filter(d =>
      d.paused || d.rewrittenText
    ).length;

    const appointmentsAttended = appointments.filter(a => a.completed).length;

    const checkInDateKeys = journalEntries
      .filter(e => e.checkIn && e.checkIn.intensityLevel > 0)
      .map(e => getDateKey(e.timestamp));
    const currentCheckInStreak = computeStreak(checkInDateKeys);

    const journalDateKeys = journalEntries.map(e => getDateKey(e.timestamp));
    const currentJournalStreak = computeStreak(journalDateKeys);
    const companionDateKeys = conversations.map(conversation => getDateKey(conversation.updatedAt || conversation.createdAt));
    const companionReflectionStreak = computeStreak(companionDateKeys);
    const communityPostCount = communityPosts.filter(post => post.author.id === 'current_user').length;
    const skillPracticeSessions = dbtProgress?.completedScenarioIds.length ?? 0;

    const metrics: ConsistencyMetrics = {
      checkInDays,
      journalDays,
      pauseWins,
      weeklyReflections,
      therapyPreps,
      medicationAdherenceDays,
      companionSessions,
      supportBeforeReaction,
      appointmentsAttended,
      currentCheckInStreak,
      currentJournalStreak,
      emotionalAwarenessStreak: currentCheckInStreak,
      companionReflectionStreak,
      skillPracticeStreak: dbtProgress?.currentStreak ?? 0,
      firstInsightCount: checkInDays >= 3 ? 1 : 0,
      savedInsightCount: savedInsights.length,
      calmMeDownSessions: calmSessions.length,
      communityPosts: communityPostCount,
      skillPracticeSessions,
    };

    console.log('[ConsistencyService] Computed metrics:', JSON.stringify(metrics));
    return metrics;
  } catch (err) {
    console.log('[ConsistencyService] Error computing metrics:', err);
    return { ...DEFAULT_CONSISTENCY_METRICS };
  }
}
