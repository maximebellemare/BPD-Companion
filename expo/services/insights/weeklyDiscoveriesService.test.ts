import {
  buildWeeklyProgressHistoryItem,
  generateWeeklyDiscoveries,
  getWeeklyDiscoveryItems,
  mergeWeeklyProgressHistory,
} from '@/services/insights/weeklyDiscoveriesService';
import type { JournalEntry, MessageDraft } from '@/types';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Weekly discoveries regression failed: ${message}`);
}

const NOW = new Date('2026-08-27T12:00:00.000Z').getTime();

function entry(id: string, daysAgo: number, emotion: string, trigger: string, intensity: number): JournalEntry {
  const timestamp = NOW - daysAgo * 24 * 60 * 60 * 1000;
  return {
    id,
    timestamp,
    reflection: `${emotion} around ${trigger}`,
    checkIn: {
      id: `checkin_${id}`,
      timestamp,
      emotions: [{ id: `emotion_${id}`, label: emotion, emoji: '', intensity }],
      triggers: [{ id: `trigger_${id}`, label: trigger, category: 'relationship' }],
      urges: [],
      bodySensations: [],
      intensityLevel: intensity,
      notes: trigger,
      copingUsed: intensity < 7 ? ['grounding'] : [],
    },
  };
}

export function assertWeeklyDiscoveriesRetentionScenarios(): true {
  const journalEntries = [
    entry('recent_1', 1, 'Anxious', 'Delayed reply', 6),
    entry('recent_2', 2, 'Anxious', 'Delayed reply', 5),
    entry('recent_3', 4, 'Sad', 'Conflict', 4),
    entry('old_1', 8, 'Angry', 'Criticism', 8),
    entry('old_2', 9, 'Angry', 'Criticism', 8),
  ];
  const drafts: MessageDraft[] = [
    {
      id: 'draft_1',
      timestamp: NOW - 2 * 24 * 60 * 60 * 1000,
      originalText: 'Why are you ignoring me?',
      sent: false,
      paused: true,
      outcome: 'not_sent',
    },
  ];
  const report = generateWeeklyDiscoveries(journalEntries, drafts, NOW);
  const sameWeekReport = generateWeeklyDiscoveries(journalEntries, drafts, NOW + 60 * 60 * 1000);
  const nextWeekReport = generateWeeklyDiscoveries(journalEntries, drafts, NOW + 7 * 24 * 60 * 60 * 1000);
  const items = getWeeklyDiscoveryItems(report);
  const history = buildWeeklyProgressHistoryItem(report);
  const sameWeekHistory = buildWeeklyProgressHistoryItem(sameWeekReport);
  const nextWeekHistory = buildWeeklyProgressHistoryItem(nextWeekReport);

  assert(report.hasEnoughData, 'weekly report has enough data');
  assert(items.length === 5, 'weekly discoveries still expose five existing items');
  assert(report.id === sameWeekReport.id, 'same calendar week uses a stable report key');
  assert(report.id !== nextWeekReport.id, 'new week gets a new report key');
  assert(history.weekStart === report.weekStart, 'saved progress history keeps week start');
  assert(history.weekEnd === report.weekEnd, 'saved progress history keeps week end');
  assert(history.checkInCount === report.weekEntryCount, 'saved progress history keeps check-in count');
  assert(history.messageMomentCount === report.weekDraftCount, 'saved progress history keeps message moment count');
  assert(history.strongestPatternTitle === report.strongestEmotionalPattern.title, 'saved history captures strongest pattern title');
  assert(history.biggestImprovementTitle === report.biggestImprovement.title, 'saved history captures improvement title');
  assert(history.id === sameWeekHistory.id, 'same week progress history uses one stable key');
  assert(history.id !== nextWeekHistory.id, 'different weeks create separate progress history keys');

  const mergedSameWeek = mergeWeeklyProgressHistory([history], sameWeekHistory, NOW + 1);
  assert(mergedSameWeek.length === 1, 'duplicate generation for the same week is prevented');

  const manyWeeks = Array.from({ length: 60 }, (_, index) => ({
    ...history,
    id: `weekly_progress_old_${index}`,
  }));
  const capped = mergeWeeklyProgressHistory(manyWeeks, nextWeekHistory, NOW + 2);
  assert(capped.length === 52, 'weekly progress history keeps at most 52 snapshots');

  return true;
}

export const weeklyDiscoveriesRetentionTestsPassed =
  assertWeeklyDiscoveriesRetentionScenarios();
