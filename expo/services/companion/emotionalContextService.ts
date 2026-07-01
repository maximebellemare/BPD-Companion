import { JournalEntry, MessageDraft } from '@/types';
import { MemoryProfile } from '@/types/memory';
import { CompanionMemoryStore, WeeklyCompanionInsight } from '@/types/companionMemory';
import { CompanionPatternInsight } from './patternInsightService';
import { SmartJournalEntry } from '@/types/journalEntry';
import { EnhancedMessageOutcome } from '@/types/messageOutcome';
import { buildCompanionContextEnrichment } from '@/services/crossLoop/crossLoopBridgeService';
import { Appointment, APPOINTMENT_TYPE_LABELS, formatAppointmentDate, formatAppointmentTime } from '@/types/appointment';
import { Medication, MedicationLog } from '@/types/medication';

export interface LiveEmotionalContext {
  recentDistressLevel: 'low' | 'moderate' | 'high' | 'unknown';
  recentDistressScore: number;
  recentMood: string | null;
  recentTrigger: string | null;
  recentJournalTheme: string | null;
  daysSinceLastCheckIn: number;
  messageGuardRecentUse: boolean;
  recentRelationshipActivity: boolean;
  recentCrisisEvent: boolean;
  appointmentContext: string | null;
  medicationContext: string | null;
  movementContext: string | null;
  weeklyReflectionAvailable: boolean;
  currentTimeContext: string;
  streakContext: string | null;
  contextNarrative: string;
}

export function buildLiveEmotionalContext(params: {
  journalEntries: JournalEntry[];
  messageDrafts: MessageDraft[];
  memoryProfile: MemoryProfile;
  memoryStore: CompanionMemoryStore | null;
  weeklyInsights: WeeklyCompanionInsight[];
  patternInsights: CompanionPatternInsight[];
  smartJournalEntries?: SmartJournalEntry[];
  messageOutcomes?: EnhancedMessageOutcome[];
  appointments?: Appointment[];
  medications?: Medication[];
  medicationLogs?: MedicationLog[];
}): LiveEmotionalContext {
  const { journalEntries, messageDrafts, memoryProfile, memoryStore, weeklyInsights, patternInsights, smartJournalEntries, messageOutcomes, appointments = [], medications = [], medicationLogs = [] } = params;

  console.log('[EmotionalContext] Building live context from', journalEntries.length, 'entries,', messageDrafts.length, 'drafts');

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const threeDaysMs = 3 * oneDayMs;

  const recentEntries = journalEntries.filter(e => now - e.timestamp < threeDaysMs);
  const todayEntries = journalEntries.filter(e => now - e.timestamp < oneDayMs);
  const recentDrafts = messageDrafts.filter(d => now - d.timestamp < threeDaysMs);

  const recentDistressScore = todayEntries.length > 0
    ? Math.round(todayEntries.reduce((sum, e) => sum + (e.checkIn?.intensityLevel ?? 5), 0) / todayEntries.length)
    : recentEntries.length > 0
      ? Math.round(recentEntries.slice(0, 3).reduce((sum, e) => sum + (e.checkIn?.intensityLevel ?? 5), 0) / Math.min(recentEntries.length, 3))
      : 0;

  const recentDistressLevel: LiveEmotionalContext['recentDistressLevel'] = recentDistressScore === 0
    ? 'unknown'
    : recentDistressScore >= 7
      ? 'high'
      : recentDistressScore >= 4
        ? 'moderate'
        : 'low';

  const latestEntry = recentEntries[0];
  const recentMood = latestEntry?.checkIn?.emotions?.[0]?.label ?? null;
  const recentTrigger = latestEntry?.checkIn?.triggers?.[0]?.label ?? null;

  const recentJournalTheme = extractJournalTheme(recentEntries);

  const daysSinceLastCheckIn = journalEntries.length > 0
    ? Math.floor((now - journalEntries[0].timestamp) / oneDayMs)
    : -1;

  const messageGuardRecentUse = recentDrafts.some(d => d.rewrittenText || d.paused);
  const recentRelationshipActivity = recentDrafts.length > 0 ||
    recentEntries.some(e => e.checkIn?.triggers?.some(t => t.label.toLowerCase().includes('relationship') || t.label.toLowerCase().includes('partner') || t.label.toLowerCase().includes('conflict')));

  const recentCrisisEvent = memoryStore?.episodicMemories.some(
    m => (m.emotion === 'intense distress' || m.intensity && m.intensity >= 9) && now - m.timestamp < threeDaysMs,
  ) ?? false;

  const appointmentContext = buildAppointmentContext(appointments, now);
  const medicationContext = buildMedicationContext(medications, medicationLogs, now);
  const movementContext = null;

  const weeklyReflectionAvailable = weeklyInsights.length > 0 && now - weeklyInsights[0].generatedAt < 10 * oneDayMs;

  const hour = new Date().getHours();
  const currentTimeContext = hour >= 22 || hour < 5
    ? 'late_night'
    : hour >= 5 && hour < 9
      ? 'early_morning'
      : hour >= 9 && hour < 12
        ? 'morning'
        : hour >= 12 && hour < 17
          ? 'afternoon'
          : 'evening';

  const streakContext = memoryProfile.recentCheckInCount >= 3
    ? `${memoryProfile.recentCheckInCount} recent check-ins`
    : null;

  const crossLoopEnrichment = (smartJournalEntries || messageOutcomes)
    ? buildCompanionContextEnrichment(smartJournalEntries ?? [], messageOutcomes ?? [])
    : null;

  const contextNarrative = buildContextNarrative({
    recentDistressLevel,
    recentDistressScore,
    recentMood,
    recentTrigger,
    recentJournalTheme,
    daysSinceLastCheckIn,
    messageGuardRecentUse,
    recentRelationshipActivity,
    recentCrisisEvent,
    weeklyReflectionAvailable,
    currentTimeContext,
    streakContext,
    patternInsights,
    memoryProfile,
    crossLoopEnrichment,
    appointmentContext,
    medicationContext,
  });

  return {
    recentDistressLevel,
    recentDistressScore,
    recentMood,
    recentTrigger,
    recentJournalTheme,
    daysSinceLastCheckIn,
    messageGuardRecentUse,
    recentRelationshipActivity,
    recentCrisisEvent,
    appointmentContext,
    medicationContext,
    movementContext,
    weeklyReflectionAvailable,
    currentTimeContext,
    streakContext,
    contextNarrative,
  };
}

function buildAppointmentContext(appointments: Appointment[], now: number): string | null {
  const upcoming = appointments
    .filter(appointment => !appointment.completed && appointment.dateTime >= now)
    .sort((a, b) => a.dateTime - b.dateTime)
    .slice(0, 2);
  const recentCompleted = appointments
    .filter(appointment => appointment.completed && now - appointment.dateTime < 30 * 24 * 60 * 60 * 1000)
    .sort((a, b) => b.dateTime - a.dateTime)
    .slice(0, 2);

  const parts: string[] = [];
  if (upcoming.length > 0) {
    parts.push(`Upcoming appointments: ${upcoming.map(appointment => `${APPOINTMENT_TYPE_LABELS[appointment.appointmentType]} "${appointment.providerName}" ${formatAppointmentDate(appointment.dateTime)} at ${formatAppointmentTime(appointment.dateTime)}`).join('; ')}.`);
  }
  if (recentCompleted.length > 0) {
    parts.push(`Recent completed appointments: ${recentCompleted.map(appointment => `${APPOINTMENT_TYPE_LABELS[appointment.appointmentType]} "${appointment.providerName}"`).join('; ')}.`);
    const reflections = recentCompleted
      .map(formatAppointmentReflection)
      .filter(Boolean);
    if (reflections.length > 0) {
      parts.push(`Recent appointment reflections: ${reflections.join('; ')}.`);
    }
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

function formatAppointmentReflection(appointment: Appointment): string | null {
  const notes = appointment.postSessionNotes;
  if (!notes) return null;

  const details = [
    notes.whatStoodOut ? `stood out: ${notes.whatStoodOut}` : null,
    notes.remember ? `remember: ${notes.remember}` : null,
    notes.actionItems ? `action items: ${notes.actionItems}` : null,
    notes.followUpQuestions ? `follow-up questions: ${notes.followUpQuestions}` : null,
    notes.mainTakeaways ? `takeaway: ${notes.mainTakeaways}` : null,
    notes.thingsToPractice ? `practice: ${notes.thingsToPractice}` : null,
  ]
    .filter(Boolean)
    .slice(0, 3);

  if (details.length === 0) return null;

  return `${APPOINTMENT_TYPE_LABELS[appointment.appointmentType]} "${appointment.providerName}" (${details.join(', ')})`;
}

function buildMedicationContext(medications: Medication[], logs: MedicationLog[], now: number): string | null {
  const activeMedicationNames = medications
    .filter(medication => medication.active)
    .map(medication => medication.name)
    .filter(Boolean)
    .slice(0, 6);
  if (activeMedicationNames.length === 0) return null;

  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentLogs = logs.filter(log => log.timestamp >= sevenDaysAgo);
  const taken = recentLogs.filter(log => log.status === 'taken').length;
  const missed = recentLogs.filter(log => log.status === 'missed').length;

  const parts = [`Medication names the user added: ${activeMedicationNames.join(', ')}.`];
  if (recentLogs.length > 0) {
    parts.push(`Medication tracking in the last 7 days: user marked ${taken} dose${taken === 1 ? '' : 's'} as taken and ${missed} dose${missed === 1 ? '' : 's'} as missed.`);
  }
  parts.push('Medication tracking is for organization only and does not replace medical advice.');

  return parts.join(' ');
}

function extractJournalTheme(entries: JournalEntry[]): string | null {
  if (entries.length === 0) return null;

  const themes: Record<string, number> = {};
  for (const entry of entries.slice(0, 5)) {
    const trigger = entry.checkIn?.triggers?.[0]?.label;
    if (trigger) {
      const t = trigger.toLowerCase();
      themes[t] = (themes[t] ?? 0) + 1;
    }
    const mood = entry.checkIn?.emotions?.[0]?.label;
    if (mood) {
      const m = mood.toLowerCase();
      themes[m] = (themes[m] ?? 0) + 1;
    }
  }

  const sorted = Object.entries(themes).sort(([, a], [, b]) => b - a);
  return sorted.length > 0 ? sorted[0][0] : null;
}

function buildContextNarrative(params: {
  recentDistressLevel: string;
  recentDistressScore: number;
  recentMood: string | null;
  recentTrigger: string | null;
  recentJournalTheme: string | null;
  daysSinceLastCheckIn: number;
  messageGuardRecentUse: boolean;
  recentRelationshipActivity: boolean;
  recentCrisisEvent: boolean;
  weeklyReflectionAvailable: boolean;
  currentTimeContext: string;
  streakContext: string | null;
  patternInsights: CompanionPatternInsight[];
  memoryProfile: MemoryProfile;
  crossLoopEnrichment: ReturnType<typeof buildCompanionContextEnrichment> | null;
  appointmentContext: string | null;
  medicationContext: string | null;
}): string {
  const parts: string[] = [];

  parts.push('[LIVE EMOTIONAL CONTEXT]');

  if (params.recentDistressLevel === 'high') {
    parts.push('Recent distress has been high. Use shorter, more grounding responses. Avoid overwhelming the user.');
  } else if (params.recentDistressLevel === 'moderate') {
    parts.push('Recent distress is moderate. Balance validation with exploration.');
  } else if (params.recentDistressLevel === 'low') {
    parts.push('Recent distress is relatively low. Good time for deeper reflection or pattern exploration.');
  }

  if (params.recentMood) {
    parts.push(`Most recent mood: "${params.recentMood}".`);
  }

  if (params.recentTrigger) {
    parts.push(`Most recent trigger: "${params.recentTrigger}". Be aware this might still be active.`);
  }

  if (params.recentCrisisEvent) {
    parts.push('A high-distress event happened recently. Be extra gentle and check in on how they are doing now.');
  }

  if (params.messageGuardRecentUse) {
    parts.push('The user recently used message guard. They may be dealing with communication-related stress.');
  }

  if (params.recentRelationshipActivity) {
    parts.push('Recent relationship-related activity detected. Be aware of possible relationship triggers.');
  }

  if (params.currentTimeContext === 'late_night') {
    parts.push('It is late at night. Late-night conversations may involve more vulnerability and less regulated thinking. Be especially warm and grounding.');
  }

  if (params.daysSinceLastCheckIn > 3 && params.daysSinceLastCheckIn >= 0) {
    parts.push('The user has not checked in for a few days. Gently acknowledge their return if appropriate.');
  }

  if (params.weeklyReflectionAvailable) {
    parts.push('A weekly reflection is available. You can offer to discuss it if the timing feels right.');
  }

  if (params.appointmentContext) {
    parts.push(params.appointmentContext);
  }

  if (params.medicationContext) {
    parts.push(params.medicationContext);
  }

  if (params.memoryProfile.intensityTrend === 'falling') {
    parts.push('The user\'s distress trend is improving. Acknowledge growth when natural.');
  } else if (params.memoryProfile.intensityTrend === 'rising') {
    parts.push('The user\'s distress trend is rising. Be attentive to escalation and offer more proactive support.');
  }

  if (params.patternInsights.length > 0) {
    const topInsight = params.patternInsights[0];
    parts.push(`Top pattern insight: ${topInsight.title} — ${topInsight.narrative.substring(0, 100)}`);
  }

  if (params.crossLoopEnrichment) {
    if (params.crossLoopEnrichment.recentSmartJournalNarrative) {
      parts.push(params.crossLoopEnrichment.recentSmartJournalNarrative);
    }
    if (params.crossLoopEnrichment.recentMessageOutcomeNarrative) {
      parts.push(params.crossLoopEnrichment.recentMessageOutcomeNarrative);
    }
    for (const insight of params.crossLoopEnrichment.crossSystemInsights) {
      parts.push(insight);
    }
  }

  return parts.join('\n');
}
