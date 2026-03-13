import {
  SmartRecommendationResult,
  UserContextSnapshot,
  RecommendationSignal,
  ToolEffectiveness,
} from '@/types/smartRecommendation';
import { matchToolsToContext, candidatesToRecommendations } from './toolMatchingService';
import { rankRecommendations } from './recommendationRankingService';
import { JournalEntry, MessageDraft } from '@/types';
import { OnboardingProfile } from '@/types/onboarding';
import { Medication, MedicationLog } from '@/types/medication';
import { Appointment } from '@/types/appointment';
import { MovementEntry } from '@/types/movement';

const MAX_RECOMMENDATIONS = 4;

function isWithinMs(timestamp: number, ms: number): boolean {
  return Date.now() - timestamp < ms;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function getTopCounts(items: string[], limit: number = 5): string[] {
  const counts: Record<string, number> = {};
  items.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([key]) => key);
}

export function buildContextSnapshot(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
  onboardingProfile: OnboardingProfile,
  medications: Medication[] = [],
  medicationLogs: MedicationLog[] = [],
  appointments: Appointment[] = [],
  movementEntries: MovementEntry[] = [],
): UserContextSnapshot {
  const now = Date.now();
  const recentEntries = journalEntries.filter(e => isWithinMs(e.timestamp, DAY_MS));
  const weekEntries = journalEntries.filter(e => isWithinMs(e.timestamp, WEEK_MS));
  const recentDrafts = messageDrafts.filter(d => isWithinMs(d.timestamp, DAY_MS));
  const weekDrafts = messageDrafts.filter(d => isWithinMs(d.timestamp, WEEK_MS));

  const latest = recentEntries[0];
  const latestDistress = latest?.checkIn.intensityLevel ?? 0;

  const weekEmotions = weekEntries.flatMap(e => e.checkIn.emotions.map(em => em.label));
  const weekTriggers = weekEntries.flatMap(e => e.checkIn.triggers.map(t => t.label));

  const avgDistress = weekEntries.length > 0
    ? weekEntries.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / weekEntries.length
    : 0;

  const isRelActivated = recentEntries.some(e =>
    e.checkIn.triggers.some(t => t.category === 'relationship')
  ) || recentDrafts.length >= 2;

  const hasHighUrges = recentEntries.some(e =>
    e.checkIn.urges.some(u => u.risk === 'high')
  );

  const activeMeds = medications.filter(m => m.active);
  const todayLogs = medicationLogs.filter(l => isWithinMs(l.timestamp, DAY_MS));
  const hasMedicationDue = activeMeds.length > 0 && todayLogs.length < activeMeds.length;
  const hasMissedMedication = todayLogs.some(l => l.status === 'missed');

  const upcomingAppts = appointments.filter(a =>
    !a.completed && a.dateTime > now && a.dateTime - now < 2 * DAY_MS
  ).sort((a, b) => a.dateTime - b.dateTime);

  const hasUpcomingAppointment = upcomingAppts.length > 0;
  const appointmentWithinHours = hasUpcomingAppointment
    ? Math.round((upcomingAppts[0].dateTime - now) / (60 * 60 * 1000))
    : null;

  const recentMovement = movementEntries.filter(e => isWithinMs(e.timestamp, 2 * DAY_MS));

  const hour = new Date().getHours();
  const isLateNight = hour >= 23 || hour < 5;

  const checkInDays = new Set(
    weekEntries.map(e => new Date(e.timestamp).toDateString())
  ).size;

  let emotionalZone: string = 'calm';
  if (latestDistress >= 8 || hasHighUrges) emotionalZone = 'crisis';
  else if (isRelActivated) emotionalZone = 'relationship_distress';
  else if (latestDistress >= 5) emotionalZone = 'activated';
  else if (weekEntries.some(e => e.outcome === 'managed') && latestDistress < 4) emotionalZone = 'recovering';

  return {
    distressLevel: latestDistress,
    latestEmotion: latest?.checkIn.emotions[0]?.label ?? null,
    latestTrigger: latest?.checkIn.triggers[0]?.label ?? null,
    latestTriggerCategory: latest?.checkIn.triggers[0]?.category ?? null,
    emotionalZone,
    isRelationshipActivated: isRelActivated,
    hasHighUrges,
    recentCheckInCount: recentEntries.length,
    recentDraftCount: recentDrafts.length,
    recentPauseCount: weekDrafts.filter(d => d.paused).length,
    recentRewriteCount: weekDrafts.filter(d => d.rewrittenText).length,
    hasMedicationDue,
    hasMissedMedication,
    hasUpcomingAppointment,
    appointmentWithinHours,
    recentMovementCount: recentMovement.length,
    isLateNight,
    primaryReasons: onboardingProfile.primaryReasons,
    hardestMoments: onboardingProfile.hardestMoments,
    preferredTools: onboardingProfile.preferredTools,
    topEmotionsThisWeek: getTopCounts(weekEmotions),
    topTriggersThisWeek: getTopCounts(weekTriggers),
    averageDistressThisWeek: Math.round(avgDistress * 10) / 10,
    journalStreakDays: checkInDays,
  };
}

export function generateSmartRecommendations(
  ctx: UserContextSnapshot,
  effectiveness: ToolEffectiveness[] = [],
): SmartRecommendationResult {
  console.log('[RecommendationEngine] Generating for zone:', ctx.emotionalZone);

  const hasAnyData = ctx.recentCheckInCount > 0
    || ctx.recentDraftCount > 0
    || ctx.hasMedicationDue
    || ctx.hasUpcomingAppointment;

  if (!hasAnyData && ctx.averageDistressThisWeek === 0 && ctx.primaryReasons.length === 0) {
    console.log('[RecommendationEngine] No data available');
    return {
      recommendations: [],
      topRecommendation: null,
      signals: [],
      hasData: false,
    };
  }

  const candidates = matchToolsToContext(ctx);
  const recommendations = candidatesToRecommendations(candidates);
  const ranked = rankRecommendations(recommendations, ctx, effectiveness);
  const top = ranked.slice(0, MAX_RECOMMENDATIONS);

  const signals = Array.from(new Set(
    top.flatMap(r => [r.signal])
  )) as RecommendationSignal[];

  console.log('[RecommendationEngine] Generated', top.length, 'recommendations. Signals:', signals.join(', '));

  return {
    recommendations: top,
    topRecommendation: top[0] ?? null,
    signals,
    hasData: true,
  };
}
