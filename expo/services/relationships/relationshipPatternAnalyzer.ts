import { JournalEntry, MessageDraft } from '@/types';
import { AIConversation } from '@/types/ai';
import { localizedText } from '@/lib/i18n/staticText';
import {
  RelationshipProfile,
  RelationshipEvent,
  RelationshipPatternInsight,
  RelationshipInterventionCard,
  RelationshipProfileAnalysis,
} from '@/types/relationship';

function withinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function matchesProfile(text: string, profile: RelationshipProfile): boolean {
  const lower = text.toLowerCase();
  const nameLower = profile.name.toLowerCase();
  if (nameLower.length >= 2 && lower.includes(nameLower)) return true;

  const typeKeywords: Record<string, string[]> = {
    partner: ['partner', 'boyfriend', 'girlfriend', 'husband', 'wife', 'babe', 'love'],
    ex: ['ex ', 'my ex', 'ex-'],
    friend: ['friend', 'bestie', 'bff'],
    parent: ['mom', 'dad', 'mother', 'father', 'parent'],
    sibling: ['sister', 'brother', 'sibling'],
    coworker: ['boss', 'coworker', 'colleague', 'manager'],
    therapist: ['therapist', 'counselor', 'doctor'],
    other: [],
  };

  const keywords = typeKeywords[profile.relationshipType] ?? [];
  return keywords.some(kw => lower.includes(kw));
}

function conversationText(conversation: AIConversation): string {
  return [
    conversation.title,
    conversation.preview,
    ...conversation.tags,
    ...conversation.messages.filter(message => message.role === 'user').map(message => message.content),
  ].join(' ');
}

export function buildEventsFromAppData(
  profile: RelationshipProfile,
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
  conversations: AIConversation[] = [],
): RelationshipEvent[] {
  const events: RelationshipEvent[] = [];
  const recentEntries = journalEntries.filter(e => withinDays(e.timestamp, 30));
  const recentDrafts = messageDrafts.filter(d => withinDays(d.timestamp, 30));
  const recentConversations = conversations.filter(c => withinDays(c.updatedAt, 30));

  recentEntries.forEach(entry => {
    const entryText = [
      entry.reflection ?? '',
      entry.checkIn.notes ?? '',
      ...entry.checkIn.triggers.map(t => t.label),
      ...entry.checkIn.emotions.map(e => e.label),
    ].join(' ');

    if (!matchesProfile(entryText, profile)) return;

    entry.checkIn.triggers
      .filter(t => t.category === 'relationship')
      .forEach(trigger => {
        events.push({
          id: `auto_trigger_${entry.id}_${trigger.id}`,
          profileId: profile.id,
          type: 'trigger',
          label: trigger.label,
          detail: localizedText(
            `From check-in on ${new Date(entry.timestamp).toLocaleDateString()}`,
            `Del registro del ${new Date(entry.timestamp).toLocaleDateString()}`,
          ),
          intensity: entry.checkIn.intensityLevel,
          timestamp: entry.timestamp,
          sourceType: 'check_in',
          sourceId: entry.id,
        });
      });

    entry.checkIn.emotions.forEach(emotion => {
      events.push({
        id: `auto_emotion_${entry.id}_${emotion.id}`,
        profileId: profile.id,
        type: 'emotion',
        label: emotion.label,
        detail: emotion.emoji,
        intensity: emotion.intensity ?? entry.checkIn.intensityLevel,
        timestamp: entry.timestamp,
        sourceType: 'check_in',
        sourceId: entry.id,
      });
    });

    if (entry.checkIn.intensityLevel >= 6) {
      events.push({
        id: `auto_distress_${entry.id}`,
        profileId: profile.id,
        type: 'distress',
        label: localizedText(
          `High distress (${entry.checkIn.intensityLevel}/10)`,
          `Malestar alto (${entry.checkIn.intensityLevel}/10)`,
        ),
        detail: entry.checkIn.notes || localizedText('Elevated distress during check-in', 'Malestar elevado durante el registro'),
        intensity: entry.checkIn.intensityLevel,
        timestamp: entry.timestamp,
        sourceType: 'check_in',
        sourceId: entry.id,
      });
    }

    if (entry.checkIn.copingUsed && entry.checkIn.copingUsed.length > 0) {
      entry.checkIn.copingUsed.forEach(tool => {
        events.push({
          id: `auto_coping_${entry.id}_${tool}`,
          profileId: profile.id,
          type: 'coping',
          label: tool,
          detail: localizedText('Used during check-in', 'Usado durante el registro'),
          intensity: 0,
          timestamp: entry.timestamp,
          sourceType: 'check_in',
          sourceId: entry.id,
        });
      });
    }
  });

  recentDrafts.forEach(draft => {
    if (!matchesProfile(draft.originalText, profile)) return;

    events.push({
      id: `auto_rewrite_${draft.id}`,
      profileId: profile.id,
      type: 'message_rewrite',
      label: draft.rewriteType
        ? localizedText(`Rewrite (${draft.rewriteType})`, `Reescritura (${draft.rewriteType})`)
        : localizedText('Message draft', 'Borrador de mensaje'),
      detail: draft.paused
        ? localizedText('Paused before sending', 'Pausado antes de enviar')
        : (draft.sent ? localizedText('Sent', 'Enviado') : localizedText('Not sent', 'No enviado')),
      intensity: 0,
      timestamp: draft.timestamp,
      sourceType: 'message',
      sourceId: draft.id,
    });
  });

  recentConversations.forEach(conversation => {
    if (!matchesProfile(conversationText(conversation), profile)) return;

    events.push({
      id: `auto_conversation_${conversation.id}`,
      profileId: profile.id,
      type: 'conversation',
      label: localizedText('Companion conversation', 'Conversación con Companion'),
      detail: conversation.preview || conversation.title,
      intensity: 0,
      timestamp: conversation.updatedAt,
      sourceType: 'conversation',
      sourceId: conversation.id,
    });
  });

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

function countByLabel(events: RelationshipEvent[], type: string): Map<string, number> {
  const counts = new Map<string, number>();
  events
    .filter(e => e.type === type)
    .forEach(e => {
      counts.set(e.label, (counts.get(e.label) ?? 0) + 1);
    });
  return counts;
}

function topEntry(counts: Map<string, number>): string | null {
  if (counts.size === 0) return null;
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

export function generateInsightsForProfile(
  profile: RelationshipProfile,
  events: RelationshipEvent[],
): RelationshipPatternInsight[] {
  const insights: RelationshipPatternInsight[] = [];
  const emotionCounts = countByLabel(events, 'emotion');
  const triggerCounts = countByLabel(events, 'trigger');
  const copingCounts = countByLabel(events, 'coping');
  const distressEvents = events.filter(e => e.type === 'distress');
  const rewriteEvents = events.filter(e => e.type === 'message_rewrite');

  const topEmotion = topEntry(emotionCounts);
  if (topEmotion) {
    const count = emotionCounts.get(topEmotion) ?? 0;
    insights.push({
      id: `ins_emotion_${profile.id}`,
      profileId: profile.id,
      type: 'emotional',
      title: localizedText(`${topEmotion} often appears`, `${topEmotion} aparece con frecuencia`),
      description: localizedText(
        `You seem to feel ${topEmotion.toLowerCase()} around ${profile.name} frequently (${count} time${count !== 1 ? 's' : ''} recently). This awareness may help you prepare.`,
        `Parece que sientes ${topEmotion.toLowerCase()} cerca de ${profile.name} con frecuencia (${count} ${count !== 1 ? 'veces' : 'vez'} recientemente). Esta conciencia puede ayudarte a prepararte.`,
      ),
      emoji: '💭',
      severity: count >= 5 ? 'important' : 'info',
      frequency: count,
    });
  }

  const topTrigger = topEntry(triggerCounts);
  if (topTrigger) {
    const count = triggerCounts.get(topTrigger) ?? 0;
    insights.push({
      id: `ins_trigger_${profile.id}`,
      profileId: profile.id,
      type: 'communication',
      title: localizedText(`Common trigger: ${topTrigger}`, `Detonante común: ${topTrigger}`),
      description: localizedText(
        `"${topTrigger}" tends to come up in connection with ${profile.name}. Recognizing this early may help you respond more calmly.`,
        `"${topTrigger}" suele aparecer en conexión con ${profile.name}. Reconocerlo temprano puede ayudarte a responder con más calma.`,
      ),
      emoji: '⚡',
      severity: count >= 4 ? 'gentle' : 'info',
      frequency: count,
    });
  }

  if (distressEvents.length >= 2) {
    const avgIntensity = distressEvents.reduce((s, e) => s + e.intensity, 0) / distressEvents.length;
    insights.push({
      id: `ins_distress_${profile.id}`,
      profileId: profile.id,
      type: 'emotional',
      title: localizedText('Elevated distress pattern', 'Patrón de malestar elevado'),
      description: localizedText(
        `Your average distress level around ${profile.name} is ${avgIntensity.toFixed(1)}/10. This doesn't mean something is wrong — it means this relationship matters to you.`,
        `Tu nivel promedio de malestar cerca de ${profile.name} es ${avgIntensity.toFixed(1)}/10. Esto no significa que algo esté mal; significa que esta relación te importa.`,
      ),
      emoji: '📊',
      severity: avgIntensity >= 7 ? 'important' : 'gentle',
      frequency: distressEvents.length,
    });
  }

  if (rewriteEvents.length >= 2) {
    const pausedCount = rewriteEvents.filter(e => e.detail.includes('Paused')).length;
    if (pausedCount > 0) {
      insights.push({
        id: `ins_pause_${profile.id}`,
        profileId: profile.id,
        type: 'growth',
        title: localizedText('Pausing before responding', 'Pausar antes de responder'),
        description: localizedText(
          `You paused before sending ${pausedCount} time${pausedCount !== 1 ? 's' : ''} with ${profile.name}. That takes real self-awareness and strength.`,
          `Pausaste antes de enviar ${pausedCount} ${pausedCount !== 1 ? 'veces' : 'vez'} con ${profile.name}. Eso requiere autoconciencia y fortaleza reales.`,
        ),
        emoji: '🌱',
        severity: 'info',
        frequency: pausedCount,
      });
    }

    insights.push({
      id: `ins_rewrite_${profile.id}`,
      profileId: profile.id,
      type: 'communication',
      title: localizedText('Active message support usage', 'Uso activo del apoyo para mensajes'),
      description: localizedText(
        `You've used message support ${rewriteEvents.length} time${rewriteEvents.length !== 1 ? 's' : ''} for messages related to ${profile.name}. This shows you're being thoughtful about communication.`,
        `Has usado apoyo para mensajes ${rewriteEvents.length} ${rewriteEvents.length !== 1 ? 'veces' : 'vez'} en mensajes relacionados con ${profile.name}. Esto muestra que estás cuidando tu comunicación.`,
      ),
      emoji: '✏️',
      severity: 'info',
      frequency: rewriteEvents.length,
    });
  }

  const topCoping = topEntry(copingCounts);
  if (topCoping) {
    const count = copingCounts.get(topCoping) ?? 0;
    insights.push({
      id: `ins_coping_${profile.id}`,
      profileId: profile.id,
      type: 'coping',
      title: localizedText(`${topCoping} seems to help`, `${topCoping} parece ayudar`),
      description: localizedText(
        `You've used "${topCoping}" ${count} time${count !== 1 ? 's' : ''} around situations involving ${profile.name}. It may be worth keeping this tool close.`,
        `Has usado "${topCoping}" ${count} ${count !== 1 ? 'veces' : 'vez'} en situaciones relacionadas con ${profile.name}. Puede valer la pena tener esta herramienta cerca.`,
      ),
      emoji: '💚',
      severity: 'info',
      frequency: count,
    });
  }

  if (profile.positiveInteractions.length > 0) {
    insights.push({
      id: `ins_positive_${profile.id}`,
      profileId: profile.id,
      type: 'growth',
      title: localizedText('Positive moments noted', 'Momentos positivos registrados'),
      description: localizedText(
        `You've recorded ${profile.positiveInteractions.length} positive interaction${profile.positiveInteractions.length !== 1 ? 's' : ''} with ${profile.name}. Holding onto these may help during harder moments.`,
        `Has registrado ${profile.positiveInteractions.length} interacción${profile.positiveInteractions.length !== 1 ? 'es' : ''} positiva${profile.positiveInteractions.length !== 1 ? 's' : ''} con ${profile.name}. Recordarlas puede ayudar en momentos más difíciles.`,
      ),
      emoji: '☀️',
      severity: 'info',
      frequency: profile.positiveInteractions.length,
    });
  }

  return insights.sort((a, b) => b.frequency - a.frequency);
}

export function generateInterventionsForProfile(
  profile: RelationshipProfile,
  events: RelationshipEvent[],
): RelationshipInterventionCard[] {
  const interventions: RelationshipInterventionCard[] = [];
  const distressEvents = events.filter(e => e.type === 'distress');
  const rewriteEvents = events.filter(e => e.type === 'message_rewrite');
  const recentDistress = distressEvents.filter(e => withinDays(e.timestamp, 7));

  if (recentDistress.length > 0) {
    interventions.push({
      id: `intv_ground_${profile.id}`,
      profileId: profile.id,
      title: localizedText('Try grounding before responding', 'Prueba conectar antes de responder'),
      description: localizedText(
        `A grounding exercise may help you respond to ${profile.name} from a calmer place.`,
        `Un ejercicio de conexión puede ayudarte a responderle a ${profile.name} desde un lugar más calmado.`,
      ),
      emoji: '🌿',
      actionRoute: '/exercise?id=c1',
      actionLabel: localizedText('Start grounding', 'Empezar conexión'),
    });
  }

  if (rewriteEvents.length >= 2) {
    interventions.push({
      id: `intv_pause_${profile.id}`,
      profileId: profile.id,
      title: localizedText('This may be a moment to pause', 'Este puede ser un momento para pausar'),
      description: localizedText(
        'A short pause before sending can protect both you and the relationship.',
        'Una pausa breve antes de enviar puede protegerte a ti y a la relación.',
      ),
      emoji: '⏸️',
      actionRoute: '/(tabs)/messages',
      actionLabel: localizedText('Use pause', 'Usar pausa'),
    });
  }

  interventions.push({
    id: `intv_simulate_${profile.id}`,
    profileId: profile.id,
    title: localizedText('Simulate your response first', 'Simula tu respuesta primero'),
    description: localizedText(
      `Would it help to explore different ways to respond to ${profile.name}?`,
      `¿Te ayudaría explorar distintas formas de responderle a ${profile.name}?`,
    ),
    emoji: '🔮',
    actionRoute: '/(tabs)/companion',
    actionLabel: localizedText('Open AI Companion', 'Abrir AI Companion'),
  });

  interventions.push({
    id: `intv_journal_${profile.id}`,
    profileId: profile.id,
    title: localizedText('Journal what you feel', 'Escribe lo que sientes'),
    description: localizedText(
      'Writing it out may release some of the pressure before you act on it.',
      'Escribirlo puede liberar parte de la presión antes de actuar.',
    ),
    emoji: '📝',
    actionRoute: '/check-in',
    actionLabel: localizedText('Check in', 'Hacer registro'),
  });

  return interventions;
}

export function analyzeRelationshipProfile(
  profile: RelationshipProfile,
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
  storedEvents: RelationshipEvent[],
  conversations: AIConversation[] = [],
): RelationshipProfileAnalysis {
  const autoEvents = buildEventsFromAppData(profile, journalEntries, messageDrafts, conversations);
  const profileStoredEvents = storedEvents.filter(e => e.profileId === profile.id);
  const allEvents = [...profileStoredEvents, ...autoEvents];

  const uniqueMap = new Map<string, RelationshipEvent>();
  allEvents.forEach(e => uniqueMap.set(e.id, e));
  const events = Array.from(uniqueMap.values()).sort((a, b) => b.timestamp - a.timestamp);

  const insights = generateInsightsForProfile(profile, events);
  const interventions = generateInterventionsForProfile(profile, events);

  const emotionCounts = countByLabel(events, 'emotion');
  const triggerCounts = countByLabel(events, 'trigger');
  const copingCounts = countByLabel(events, 'coping');

  const topEmotion = topEntry(emotionCounts);
  const topTrigger = topEntry(triggerCounts);
  const helpfulCopingTools = Array.from(copingCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label);

  const distressEvents = events.filter(e => e.type === 'distress');
  const recentDistressAvg = distressEvents.length > 0
    ? distressEvents.reduce((s, e) => s + e.intensity, 0) / distressEvents.length
    : 0;

  console.log('[RelationshipAnalyzer] Profile:', profile.name, 'Events:', events.length, 'Insights:', insights.length);

  return {
    profile,
    events,
    insights,
    interventions,
    topEmotion,
    topTrigger,
    helpfulCopingTools,
    recentDistressAvg,
    eventCount: events.length,
  };
}
