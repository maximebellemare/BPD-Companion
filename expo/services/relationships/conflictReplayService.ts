import { storageService } from '@/services/storage/storageService';
import {
  ConflictReplayEvent,
  ConflictReplayTimeline,
  ConflictTimelineStep,
  ConflictInsightCard,
  ConflictTrigger,
  ConflictAction,
  ConflictOutcome,
  CONFLICT_TRIGGER_META,
  CONFLICT_ACTION_META,
  CONFLICT_OUTCOME_META,
} from '@/types/conflictReplay';
import { JournalEntry, MessageDraft } from '@/types';
import { CopilotSession } from '@/types/relationshipCopilot';

const EVENTS_KEY = 'steady_conflict_replay_events';

export async function getConflictReplayEvents(): Promise<ConflictReplayEvent[]> {
  const data = await storageService.get<ConflictReplayEvent[]>(EVENTS_KEY);
  console.log('[ConflictReplay] Loaded', data?.length ?? 0, 'events');
  return data ?? [];
}

export async function saveConflictReplayEvents(events: ConflictReplayEvent[]): Promise<void> {
  await storageService.set(EVENTS_KEY, events);
  console.log('[ConflictReplay] Saved', events.length, 'events');
}

export async function addConflictReplayEvent(
  event: Omit<ConflictReplayEvent, 'id' | 'aiInsight' | 'learningSuggestions'>,
): Promise<ConflictReplayEvent> {
  const events = await getConflictReplayEvents();
  const aiInsight = generateAIInsight(event);
  const learningSuggestions = generateLearningSuggestions(event);

  const newEvent: ConflictReplayEvent = {
    ...event,
    id: `crep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    aiInsight,
    learningSuggestions,
  };

  const updated = [newEvent, ...events];
  await saveConflictReplayEvents(updated);
  console.log('[ConflictReplay] Added event:', newEvent.id);
  return newEvent;
}

export async function deleteConflictReplayEvent(id: string): Promise<void> {
  const events = await getConflictReplayEvents();
  const updated = events.filter(e => e.id !== id);
  await saveConflictReplayEvents(updated);
  console.log('[ConflictReplay] Deleted event:', id);
}

export function buildTimelineFromEvent(event: ConflictReplayEvent): ConflictReplayTimeline {
  const triggerMeta = CONFLICT_TRIGGER_META[event.trigger];
  const actionMeta = CONFLICT_ACTION_META[event.action];
  const outcomeMeta = CONFLICT_OUTCOME_META[event.outcome];

  const steps: ConflictTimelineStep[] = [
    {
      type: 'trigger',
      label: triggerMeta.label,
      detail: event.triggerDetail ?? 'Something activated a stress response.',
      emoji: triggerMeta.emoji,
      timestamp: event.timestamp,
    },
    {
      type: 'emotion',
      label: event.emotion,
      detail: `Intensity: ${event.emotionIntensity}/10 · Distress: ${event.distressLevel}/10`,
      emoji: '💭',
      intensity: event.emotionIntensity,
      timestamp: event.timestamp,
    },
    {
      type: 'urge',
      label: event.urge,
      detail: 'The strongest pull in the moment.',
      emoji: '⚡',
      timestamp: event.timestamp,
    },
    {
      type: 'action',
      label: actionMeta.label,
      detail: event.actionDetail ?? 'What you chose to do.',
      emoji: actionMeta.emoji,
      timestamp: event.timestamp,
    },
    {
      type: 'outcome',
      label: outcomeMeta.label,
      detail: event.outcomeNotes ?? 'How things turned out.',
      emoji: outcomeMeta.emoji,
      timestamp: event.timestamp,
    },
  ];

  return { event, steps };
}

function generateAIInsight(
  event: Omit<ConflictReplayEvent, 'id' | 'aiInsight' | 'learningSuggestions'>,
): string {
  const triggerMeta = CONFLICT_TRIGGER_META[event.trigger];
  const actionMeta = CONFLICT_ACTION_META[event.action];
  const outcomeMeta = CONFLICT_OUTCOME_META[event.outcome];

  const triggerInsights: Partial<Record<ConflictTrigger, string>> = {
    no_reply: 'This spiral may have begun with silence feeling unsafe.',
    tone_change: 'A shift in tone may have felt like a signal of withdrawal.',
    rejection: 'The feeling of rejection may have activated a deep vulnerability.',
    conflict: 'Conflict may have triggered a fight-or-flight response.',
    mixed_signals: 'Ambiguity in communication may have amplified uncertainty.',
    abandonment_fear: 'A deep fear of abandonment may have been activated.',
    shame: 'Shame may have made it harder to stay present and grounded.',
  };

  const base = triggerInsights[event.trigger] ?? `This moment seems to have started with ${triggerMeta.label.toLowerCase()}.`;

  const actionInsights: string[] = [];
  if (event.distressLevel >= 7) {
    actionInsights.push('Distress was high, which may have made clear thinking harder.');
  }
  if (['lashed_out', 'sought_reassurance'].includes(event.action)) {
    actionInsights.push(`${actionMeta.label} may have felt urgent in the moment but could have increased the emotional charge.`);
  }
  if (['paused', 'used_grounding', 'used_breathing', 'journaled'].includes(event.action)) {
    actionInsights.push(`Choosing to ${actionMeta.label.toLowerCase()} shows real self-awareness.`);
  }

  const outcomeInsights: string[] = [];
  if (['regret', 'shame', 'escalated'].includes(event.outcome)) {
    outcomeInsights.push(`The outcome — ${outcomeMeta.label.toLowerCase()} — may point to a pattern worth understanding gently.`);
  }
  if (['calm', 'resolved', 'relief'].includes(event.outcome)) {
    outcomeInsights.push(`Reaching ${outcomeMeta.label.toLowerCase()} afterward is a meaningful sign of regulation.`);
  }

  return [base, ...actionInsights, ...outcomeInsights].join(' ');
}

function generateLearningSuggestions(
  event: Omit<ConflictReplayEvent, 'id' | 'aiInsight' | 'learningSuggestions'>,
): string[] {
  const suggestions: string[] = [];

  if (event.distressLevel >= 6 && !['paused', 'used_grounding', 'used_breathing'].includes(event.action)) {
    suggestions.push('Try pausing for 2 minutes before responding when distress is high.');
  }

  if (['lashed_out', 'sent_message'].includes(event.action) && ['regret', 'shame', 'escalated'].includes(event.outcome)) {
    suggestions.push('A grounding exercise before messaging may help interrupt the urgency.');
    suggestions.push('Consider using Secure Message Rewrite next time.');
  }

  if (['sought_reassurance'].includes(event.action)) {
    suggestions.push('A Relationship Copilot session may help process the need before acting on it.');
  }

  if (['no_reply', 'tone_change', 'mixed_signals'].includes(event.trigger)) {
    suggestions.push('When communication feels uncertain, breathing exercises may settle the nervous system first.');
  }

  if (['abandonment_fear', 'rejection'].includes(event.trigger)) {
    suggestions.push('Journaling about the fear before responding may create space between feeling and action.');
  }

  if (['paused', 'used_grounding', 'used_breathing', 'journaled', 'talked_to_companion', 'used_copilot'].includes(event.action)) {
    suggestions.push('Keep using this approach — it seems to support better outcomes.');
  }

  if (suggestions.length === 0) {
    suggestions.push('Reflecting on this moment is already a step forward.');
    suggestions.push('Consider checking in with yourself before and after relationship-triggered moments.');
  }

  return suggestions.slice(0, 4);
}

export function generatePatternInsights(events: ConflictReplayEvent[]): ConflictInsightCard[] {
  const insights: ConflictInsightCard[] = [];
  if (events.length < 2) return insights;

  const triggerCounts = new Map<ConflictTrigger, number>();
  const actionCounts = new Map<ConflictAction, number>();
  const outcomeCounts = new Map<ConflictOutcome, number>();
  let totalDistress = 0;
  let positiveOutcomes = 0;
  let negativeOutcomes = 0;

  events.forEach(e => {
    triggerCounts.set(e.trigger, (triggerCounts.get(e.trigger) ?? 0) + 1);
    actionCounts.set(e.action, (actionCounts.get(e.action) ?? 0) + 1);
    outcomeCounts.set(e.outcome, (outcomeCounts.get(e.outcome) ?? 0) + 1);
    totalDistress += e.distressLevel;
    if (['calm', 'resolved', 'relief'].includes(e.outcome)) positiveOutcomes++;
    if (['regret', 'shame', 'escalated'].includes(e.outcome)) negativeOutcomes++;
  });

  const topTrigger = Array.from(triggerCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topTrigger && topTrigger[1] >= 2) {
    const meta = CONFLICT_TRIGGER_META[topTrigger[0]];
    insights.push({
      id: 'pat_trigger',
      title: `${meta.label} appears often`,
      narrative: `"${meta.label}" seems to be a recurring starting point. Recognizing this pattern early may help you prepare a gentler response.`,
      emoji: meta.emoji,
      type: 'pattern',
    });
  }

  const regulatedActions: ConflictAction[] = ['paused', 'used_grounding', 'used_breathing', 'journaled', 'talked_to_companion', 'used_copilot'];
  const regulatedCount = regulatedActions.reduce((sum, a) => sum + (actionCounts.get(a) ?? 0), 0);
  if (regulatedCount >= 2) {
    insights.push({
      id: 'pat_regulated',
      title: 'You are using regulation tools',
      narrative: `You chose a supportive action ${regulatedCount} time${regulatedCount !== 1 ? 's' : ''}. This builds a stronger habit of responding rather than reacting.`,
      emoji: '🌱',
      type: 'growth',
    });
  }

  const impulsiveActions: ConflictAction[] = ['lashed_out', 'sought_reassurance', 'sent_message'];
  const impulsiveCount = impulsiveActions.reduce((sum, a) => sum + (actionCounts.get(a) ?? 0), 0);
  if (impulsiveCount >= 2 && negativeOutcomes >= 2) {
    insights.push({
      id: 'pat_impulsive',
      title: 'Urgency may be driving some responses',
      narrative: 'When urgency leads the response, outcomes tend to feel harder. A small pause — even 60 seconds — may change the direction.',
      emoji: '⏳',
      type: 'warning',
    });
  }

  if (positiveOutcomes > negativeOutcomes && events.length >= 3) {
    insights.push({
      id: 'pat_positive',
      title: 'More positive outcomes than not',
      narrative: 'The majority of your recent conflict moments ended in a calmer place. That is meaningful progress.',
      emoji: '☀️',
      type: 'growth',
    });
  }

  const avgDistress = totalDistress / events.length;
  if (avgDistress >= 7) {
    insights.push({
      id: 'pat_distress',
      title: 'Distress tends to run high',
      narrative: `Your average distress during conflicts is ${avgDistress.toFixed(1)}/10. This doesn't mean you're failing — it means these moments carry real weight for you.`,
      emoji: '📊',
      type: 'pattern',
    });
  }

  return insights;
}

export function buildEventsFromAppData(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
  copilotSessions: CopilotSession[],
): ConflictReplayEvent[] {
  const events: ConflictReplayEvent[] = [];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  journalEntries
    .filter(e => e.timestamp > thirtyDaysAgo)
    .forEach(entry => {
      const relTriggers = entry.checkIn.triggers.filter(t => t.category === 'relationship');
      if (relTriggers.length === 0 && entry.checkIn.intensityLevel < 6) return;

      const topEmotion = entry.checkIn.emotions[0];
      const topUrge = entry.checkIn.urges[0];
      if (!topEmotion) return;

      const trigger = mapTriggerLabel(relTriggers[0]?.label);
      const action = mapCopingToAction(entry.checkIn.copingUsed);
      const outcome = mapJournalOutcome(entry.outcome);

      events.push({
        id: `crep_j_${entry.id}`,
        timestamp: entry.timestamp,
        trigger,
        triggerDetail: relTriggers[0]?.label ?? 'High distress check-in',
        emotion: topEmotion.label,
        emotionIntensity: topEmotion.intensity ?? entry.checkIn.intensityLevel,
        distressLevel: entry.checkIn.intensityLevel,
        urge: topUrge?.label ?? 'Unknown',
        action,
        outcome,
        outcomeNotes: entry.reflection,
      });
    });

  const draftsByHour = new Map<string, MessageDraft[]>();
  messageDrafts
    .filter(d => d.timestamp > thirtyDaysAgo)
    .forEach(d => {
      const hourKey = Math.floor(d.timestamp / (60 * 60 * 1000)).toString();
      const existing = draftsByHour.get(hourKey) ?? [];
      existing.push(d);
      draftsByHour.set(hourKey, existing);
    });

  draftsByHour.forEach((drafts) => {
    if (drafts.length === 0) return;
    const primary = drafts[0];
    const hadPause = drafts.some(d => d.paused);
    const hadRewrite = drafts.some(d => d.rewrittenText);
    const lastOutcome = drafts[drafts.length - 1].outcome;

    events.push({
      id: `crep_m_${primary.id}`,
      timestamp: primary.timestamp,
      trigger: drafts.length >= 3 ? 'no_reply' : 'conflict',
      triggerDetail: drafts.length >= 3 ? 'Multiple messages drafted quickly' : 'Message drafting',
      emotion: 'Anxious',
      emotionIntensity: Math.min(drafts.length * 2 + 3, 10),
      distressLevel: Math.min(drafts.length * 2 + 2, 10),
      urge: drafts.length >= 3 ? 'Send multiple messages' : 'Send message',
      action: hadPause ? 'paused' : hadRewrite ? 'rewrote_message' : 'sent_message',
      actionDetail: hadPause ? 'Paused before sending' : hadRewrite ? 'Rewrote the message' : 'Sent directly',
      outcome: lastOutcome === 'helped' ? 'calm' : lastOutcome === 'made_worse' ? 'regret' : 'neutral',
    });
  });

  copilotSessions
    .filter(s => s.timestamp > thirtyDaysAgo)
    .forEach(session => {
      const triggerMap: Record<string, ConflictTrigger> = {
        no_reply: 'no_reply',
        cold_tone: 'tone_change',
        conflict: 'conflict',
        rejected: 'rejection',
        need_reassurance: 'abandonment_fear',
        want_to_message: 'no_reply',
        spiraling: 'mixed_signals',
        shame_after_conflict: 'shame',
      };

      events.push({
        id: `crep_c_${session.id}`,
        timestamp: session.timestamp,
        trigger: triggerMap[session.intake.situation] ?? 'other',
        triggerDetail: session.intake.situation,
        emotion: session.intake.emotions[0] ?? 'Unknown',
        emotionIntensity: session.intake.intensity,
        distressLevel: session.intake.intensity,
        urge: session.intake.strongestUrge,
        action: 'used_copilot',
        actionDetail: 'Used Relationship Copilot',
        outcome: 'calm',
        outcomeNotes: session.result.affirmation,
      });
    });

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

function mapTriggerLabel(label?: string): ConflictTrigger {
  if (!label) return 'other';
  const lower = label.toLowerCase();
  if (lower.includes('reply') || lower.includes('response') || lower.includes('ignore')) return 'no_reply';
  if (lower.includes('tone') || lower.includes('cold')) return 'tone_change';
  if (lower.includes('reject')) return 'rejection';
  if (lower.includes('conflict') || lower.includes('argument') || lower.includes('fight')) return 'conflict';
  if (lower.includes('signal') || lower.includes('confus')) return 'mixed_signals';
  if (lower.includes('critic')) return 'criticism';
  if (lower.includes('boundary')) return 'boundary_crossed';
  if (lower.includes('abandon') || lower.includes('leave') || lower.includes('losing')) return 'abandonment_fear';
  if (lower.includes('shame') || lower.includes('embarrass')) return 'shame';
  return 'other';
}

function mapCopingToAction(copingUsed?: string[]): ConflictAction {
  if (!copingUsed || copingUsed.length === 0) return 'did_nothing';
  const joined = copingUsed.join(' ').toLowerCase();
  if (joined.includes('ground')) return 'used_grounding';
  if (joined.includes('breath')) return 'used_breathing';
  if (joined.includes('journal') || joined.includes('writ')) return 'journaled';
  if (joined.includes('pause') || joined.includes('wait')) return 'paused';
  return 'did_nothing';
}

function mapJournalOutcome(outcome?: string): ConflictOutcome {
  if (!outcome) return 'neutral';
  if (outcome === 'managed') return 'calm';
  if (outcome === 'struggled') return 'regret';
  return 'neutral';
}
