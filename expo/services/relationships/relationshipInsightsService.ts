import { MessageDraft, JournalEntry } from '@/types';
import { localizedText } from '@/lib/i18n/staticText';
import {
  RelationshipContext,
  EmotionalState,
  MessageIntent,
  MessageOutcome,
  RELATIONSHIP_OPTIONS,
  EMOTIONAL_STATE_OPTIONS,
  INTENT_OPTIONS,
} from '@/types/messages';
import {
  RelationshipPattern,
  RelationshipInsight,
  RelationshipSuggestion,
  RelationshipAnalysis,
  EmotionalFrequency,
  IntentFrequency,
  OutcomeFrequency,
  StyleFrequency,
} from '@/types/relationships';

interface ParsedDraft {
  draft: MessageDraft;
  relationship: RelationshipContext | null;
  emotion: EmotionalState | null;
  intent: MessageIntent | null;
  outcome: MessageOutcome | null;
}

function inferRelationshipFromText(text: string): RelationshipContext | null {
  const lower = text.toLowerCase();
  if (lower.includes('partner') || lower.includes('boyfriend') || lower.includes('girlfriend') || lower.includes('husband') || lower.includes('wife') || lower.includes('babe') || lower.includes('love you')) {
    return 'romantic_partner';
  }
  if (lower.includes('ex ') || lower.includes('my ex') || lower.includes('ex-')) {
    return 'ex';
  }
  if (lower.includes('mom') || lower.includes('dad') || lower.includes('mother') || lower.includes('father') || lower.includes('sister') || lower.includes('brother') || lower.includes('parent')) {
    return 'family';
  }
  if (lower.includes('boss') || lower.includes('coworker') || lower.includes('colleague') || lower.includes('work')) {
    return 'coworker';
  }
  if (lower.includes('friend') || lower.includes('bestie') || lower.includes('bff')) {
    return 'friend';
  }
  return null;
}

function inferEmotionFromText(text: string): EmotionalState | null {
  const lower = text.toLowerCase();
  if (lower.includes('abandon') || lower.includes('left me') || lower.includes('ignore') || lower.includes('ghosting') || lower.includes('not respond')) {
    return 'abandoned';
  }
  if (lower.includes('angry') || lower.includes('furious') || lower.includes('pissed') || lower.includes('hate')) {
    return 'angry';
  }
  if (lower.includes('anxious') || lower.includes('worried') || lower.includes('panic') || lower.includes('scared')) {
    return 'anxious';
  }
  if (lower.includes('shame') || lower.includes('embarrass') || lower.includes('stupid')) {
    return 'ashamed';
  }
  if (lower.includes('confus') || lower.includes("don't understand") || lower.includes('mixed signal')) {
    return 'confused';
  }
  if (lower.includes('hurt') || lower.includes('pain') || lower.includes('cry') || lower.includes('crying')) {
    return 'hurt';
  }
  return null;
}

function inferIntentFromRewriteType(rewriteType: string | undefined): MessageIntent | null {
  switch (rewriteType) {
    case 'softer':
    case 'warmer':
      return 'reconnect';
    case 'boundaried':
      return 'set_boundary';
    case 'secure':
      return 'ask_reassurance';
    case 'clearer':
      return 'express_hurt';
    case 'delay':
    case 'nosend':
      return 'pause_not_send';
    default:
      return null;
  }
}

function parseDrafts(drafts: MessageDraft[]): ParsedDraft[] {
  return drafts.map(draft => ({
    draft,
    relationship: inferRelationshipFromText(draft.originalText),
    emotion: inferEmotionFromText(draft.originalText),
    intent: inferIntentFromRewriteType(draft.rewriteType),
    outcome: draft.outcome ?? null,
  }));
}

function buildPatterns(parsed: ParsedDraft[]): RelationshipPattern[] {
  const byRelationship = new Map<RelationshipContext, ParsedDraft[]>();

  for (const p of parsed) {
    const rel = p.relationship;
    if (!rel) continue;
    const existing = byRelationship.get(rel) ?? [];
    existing.push(p);
    byRelationship.set(rel, existing);
  }

  const patterns: RelationshipPattern[] = [];

  for (const [relationship, drafts] of byRelationship) {
    const total = drafts.length;

    const emotionCounts = new Map<EmotionalState, number>();
    const intentCounts = new Map<MessageIntent, number>();
    const outcomeCounts = new Map<MessageOutcome, number>();
    const styleCounts = new Map<string, number>();

    for (const d of drafts) {
      if (d.emotion) {
        emotionCounts.set(d.emotion, (emotionCounts.get(d.emotion) ?? 0) + 1);
      }
      if (d.intent) {
        intentCounts.set(d.intent, (intentCounts.get(d.intent) ?? 0) + 1);
      }
      if (d.outcome) {
        outcomeCounts.set(d.outcome, (outcomeCounts.get(d.outcome) ?? 0) + 1);
      }
      if (d.draft.rewriteType) {
        styleCounts.set(d.draft.rewriteType, (styleCounts.get(d.draft.rewriteType) ?? 0) + 1);
      }
    }

    const emotionalTriggers: EmotionalFrequency[] = Array.from(emotionCounts.entries())
      .map(([emotion, count]) => ({ emotion, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);

    const commonIntents: IntentFrequency[] = Array.from(intentCounts.entries())
      .map(([intent, count]) => ({ intent, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);

    const outcomes: OutcomeFrequency[] = Array.from(outcomeCounts.entries())
      .map(([outcome, count]) => ({ outcome, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);

    const rewriteStyles: StyleFrequency[] = Array.from(styleCounts.entries())
      .map(([style, count]) => ({ style, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);

    const conflictOutcomes = (outcomeCounts.get('made_worse') ?? 0) + (outcomeCounts.get('not_sent') ?? 0);
    const conflictRate = total > 0 ? Math.round((conflictOutcomes / total) * 100) : 0;

    patterns.push({
      relationship,
      emotionalTriggers,
      commonIntents,
      outcomes,
      totalInteractions: total,
      conflictRate,
      rewriteStyles,
    });
  }

  return patterns.sort((a, b) => b.totalInteractions - a.totalInteractions);
}

function generateInsights(
  patterns: RelationshipPattern[],
  journalEntries: JournalEntry[],
): RelationshipInsight[] {
  const insights: RelationshipInsight[] = [];

  for (const pattern of patterns) {
    const relLabel = RELATIONSHIP_OPTIONS.find(r => r.value === pattern.relationship)?.label ?? pattern.relationship;

    if (pattern.emotionalTriggers.length > 0) {
      const topEmotion = pattern.emotionalTriggers[0];
      const emotionLabel = EMOTIONAL_STATE_OPTIONS.find(e => e.value === topEmotion.emotion)?.label ?? topEmotion.emotion;
      insights.push({
        id: `emotion_${pattern.relationship}`,
        type: 'pattern',
        title: localizedText(
          `${emotionLabel} is your top emotion with ${relLabel}`,
          `${emotionLabel} es tu emoción principal con ${relLabel}`,
        ),
        description: localizedText(
          `You feel ${emotionLabel.toLowerCase()} in ${topEmotion.percentage}% of messages involving your ${relLabel.toLowerCase()}. Recognizing this pattern is the first step to changing it.`,
          `Sientes ${emotionLabel.toLowerCase()} en el ${topEmotion.percentage}% de los mensajes relacionados con ${relLabel.toLowerCase()}. Reconocer este patrón es el primer paso para cambiarlo.`,
        ),
        emoji: EMOTIONAL_STATE_OPTIONS.find(e => e.value === topEmotion.emotion)?.emoji ?? '💭',
        severity: topEmotion.percentage > 60 ? 'important' : 'info',
      });
    }

    if (pattern.commonIntents.length > 0) {
      const topIntent = pattern.commonIntents[0];
      const intentLabel = INTENT_OPTIONS.find(i => i.value === topIntent.intent)?.label ?? topIntent.intent;
      insights.push({
        id: `intent_${pattern.relationship}`,
        type: 'pattern',
        title: localizedText(`Most common intent: ${intentLabel}`, `Intención más común: ${intentLabel}`),
        description: localizedText(
          `When messaging your ${relLabel.toLowerCase()}, you most often want to ${intentLabel.toLowerCase()} (${topIntent.percentage}% of the time).`,
          `Cuando escribes a ${relLabel.toLowerCase()}, la mayoría de las veces quieres ${intentLabel.toLowerCase()} (${topIntent.percentage}% de las veces).`,
        ),
        emoji: INTENT_OPTIONS.find(i => i.value === topIntent.intent)?.emoji ?? '💬',
        severity: 'info',
      });
    }

    if (pattern.conflictRate > 40) {
      insights.push({
        id: `conflict_${pattern.relationship}`,
        type: 'trend',
        title: localizedText(`Higher conflict rate with ${relLabel}`, `Mayor tasa de conflicto con ${relLabel}`),
        description: localizedText(
          `${pattern.conflictRate}% of your messages with your ${relLabel.toLowerCase()} have difficult outcomes. This is common with BPD — you're already working on it by being here.`,
          `El ${pattern.conflictRate}% de tus mensajes con ${relLabel.toLowerCase()} tienen resultados difíciles. Esto es común con TLP; ya estás trabajando en ello al estar aquí.`,
        ),
        emoji: '⚡',
        severity: 'gentle',
      });
    }

    if (pattern.emotionalTriggers.some(e => e.emotion === 'abandoned' && e.percentage > 30)) {
      insights.push({
        id: `abandon_${pattern.relationship}`,
        type: 'trigger',
        title: localizedText(`Abandonment patterns with ${relLabel}`, `Patrones de abandono con ${relLabel}`),
        description: localizedText(
          `You often feel abandoned when messages go unanswered for long periods. This is a very common BPD trigger — your feelings are valid, and awareness helps.`,
          'A menudo te sientes abandonado/a cuando los mensajes quedan sin respuesta por mucho tiempo. Este es un detonante muy común en el TLP; tus sentimientos son válidos y la conciencia ayuda.',
        ),
        emoji: '🥀',
        severity: 'gentle',
      });
    }

    if (pattern.rewriteStyles.some(s => (s.style === 'softer' || s.style === 'warmer' || s.style === 'secure') && s.percentage > 30)) {
      const reassuranceStyle = pattern.rewriteStyles.find(s => s.style === 'softer' || s.style === 'warmer' || s.style === 'secure');
      if (reassuranceStyle) {
        insights.push({
          id: `reassurance_${pattern.relationship}`,
          type: 'pattern',
          title: localizedText(`Reassurance seeking with ${relLabel}`, `Búsqueda de seguridad con ${relLabel}`),
          description: localizedText(
            `Most rewrites with your ${relLabel.toLowerCase()} involve softer or warmer tones, which often signals reassurance seeking. This awareness can help you communicate more securely.`,
            `La mayoría de las reescrituras con ${relLabel.toLowerCase()} usan tonos más suaves o cálidos, lo que suele señalar búsqueda de seguridad. Esta conciencia puede ayudarte a comunicarte con más seguridad.`,
          ),
          emoji: '🤲',
          severity: 'info',
        });
      }
    }
  }

  const relationshipTriggers = journalEntries
    .filter(e => e.checkIn.triggers.some(t => t.category === 'relationship'))
    .length;

  if (relationshipTriggers > 3) {
    insights.push({
      id: 'journal_relationship_triggers',
      type: 'trigger',
      title: localizedText('Relationship triggers are frequent', 'Los detonantes relacionales son frecuentes'),
      description: localizedText(
        `${relationshipTriggers} of your check-ins involve relationship triggers. Your relationships are important to you — that's why they affect you deeply.`,
        `${relationshipTriggers} de tus registros incluyen detonantes relacionales. Tus relaciones son importantes para ti; por eso te afectan con tanta profundidad.`,
      ),
      emoji: '💔',
      severity: relationshipTriggers > 7 ? 'important' : 'gentle',
    });
  }

  return insights;
}

function generateSuggestions(
  patterns: RelationshipPattern[],
): RelationshipSuggestion[] {
  const suggestions: RelationshipSuggestion[] = [];

  const hasHighConflict = patterns.some(p => p.conflictRate > 40);
  const hasAbandonmentPattern = patterns.some(p =>
    p.emotionalTriggers.some(e => e.emotion === 'abandoned' && e.percentage > 25)
  );
  const hasAngerPattern = patterns.some(p =>
    p.emotionalTriggers.some(e => e.emotion === 'angry' && e.percentage > 25)
  );
  const frequentMessaging = patterns.some(p => p.totalInteractions > 5);

  if (hasAbandonmentPattern) {
    suggestions.push({
      id: 'sug_pause',
      title: localizedText('Try a pause before responding', 'Prueba una pausa antes de responder'),
      description: localizedText(
        'When you notice abandonment feelings rising, a 2-minute pause can help you respond from a calmer place rather than reacting to fear.',
        'Cuando notes que sube el miedo al abandono, una pausa de 2 minutos puede ayudarte a responder desde un lugar más calmado en vez de reaccionar al miedo.',
      ),
      emoji: '⏸️',
      actionLabel: localizedText('Use pause flow', 'Usar flujo de pausa'),
    });
  }

  if (hasHighConflict) {
    suggestions.push({
      id: 'sug_boundary',
      title: localizedText('Use boundary-style messages', 'Usa mensajes con límites'),
      description: localizedText(
        'Your conflict patterns suggest boundaries could help. Boundary messages protect your dignity while keeping the door open.',
        'Tus patrones de conflicto sugieren que los límites podrían ayudar. Los mensajes con límites protegen tu dignidad sin cerrar la puerta.',
      ),
      emoji: '🛡️',
      actionLabel: localizedText('Try boundary rewrite', 'Probar reescritura con límites'),
    });
  }

  if (hasAngerPattern) {
    suggestions.push({
      id: 'sug_ground',
      title: localizedText('Ground before messaging', 'Conéctate antes de escribir'),
      description: localizedText(
        'When anger drives your messaging, a quick grounding exercise can help you communicate what you actually need instead of reacting.',
        'Cuando el enojo guía tus mensajes, un ejercicio rápido de conexión puede ayudarte a comunicar lo que realmente necesitas en vez de reaccionar.',
      ),
      emoji: '🌿',
      actionLabel: localizedText('Try grounding', 'Probar conexión'),
      actionRoute: '/exercise?id=c1',
    });
  }

  if (frequentMessaging) {
    suggestions.push({
      id: 'sug_journal',
      title: localizedText('Journal before texting', 'Escribe antes de mandar el mensaje'),
      description: localizedText(
        'Writing your feelings in a journal first can help you process emotions before directing them at someone. The relief comes from expressing, not necessarily sending.',
        'Escribir primero lo que sientes puede ayudarte a procesar emociones antes de dirigirlas hacia alguien. El alivio viene de expresar, no necesariamente de enviar.',
      ),
      emoji: '📝',
      actionLabel: localizedText('Open journal', 'Abrir diario'),
    });
  }

  suggestions.push({
    id: 'sug_secure',
    title: localizedText('Practice secure communication', 'Practica comunicación segura'),
    description: localizedText(
      'The "secure" rewrite style helps you name your vulnerability without demanding the other person fix it. Over time, this builds healthier patterns.',
      'El estilo de reescritura segura te ayuda a nombrar tu vulnerabilidad sin exigir que la otra persona la arregle. Con el tiempo, esto construye patrones más sanos.',
    ),
    emoji: '🌱',
    actionLabel: localizedText('Learn more', 'Aprender más'),
  });

  return suggestions;
}

function determineConflictTrend(
  drafts: MessageDraft[],
): 'rising' | 'stable' | 'falling' | 'insufficient_data' {
  const withOutcomes = drafts.filter(d => d.outcome && d.outcomeTimestamp);
  if (withOutcomes.length < 4) return 'insufficient_data';

  const sorted = [...withOutcomes].sort((a, b) => (a.outcomeTimestamp ?? 0) - (b.outcomeTimestamp ?? 0));
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const conflictScore = (items: MessageDraft[]) => {
    const conflicts = items.filter(d => d.outcome === 'made_worse' || d.outcome === 'not_sent').length;
    return items.length > 0 ? conflicts / items.length : 0;
  };

  const firstScore = conflictScore(firstHalf);
  const secondScore = conflictScore(secondHalf);
  const diff = secondScore - firstScore;

  if (diff > 0.15) return 'rising';
  if (diff < -0.15) return 'falling';
  return 'stable';
}

export function analyzeRelationshipPatterns(
  messageDrafts: MessageDraft[],
  journalEntries: JournalEntry[],
): RelationshipAnalysis {
  console.log('[RelationshipInsights] Analyzing', messageDrafts.length, 'drafts and', journalEntries.length, 'journal entries');

  const parsed = parseDrafts(messageDrafts);
  const patterns = buildPatterns(parsed);
  const insights = generateInsights(patterns, journalEntries);
  const suggestions = generateSuggestions(patterns);
  const overallConflictTrend = determineConflictTrend(messageDrafts);

  const allEmotions = new Map<EmotionalState, number>();
  for (const p of parsed) {
    if (p.emotion) {
      allEmotions.set(p.emotion, (allEmotions.get(p.emotion) ?? 0) + 1);
    }
  }
  const mostCommonEmotion = allEmotions.size > 0
    ? Array.from(allEmotions.entries()).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  const topTriggerRelationship = patterns.length > 0 ? patterns[0].relationship : null;

  console.log('[RelationshipInsights] Found', patterns.length, 'patterns,', insights.length, 'insights,', suggestions.length, 'suggestions');

  return {
    patterns,
    insights,
    suggestions,
    topTriggerRelationship,
    mostCommonEmotion,
    overallConflictTrend,
    totalMessagesAnalyzed: messageDrafts.length,
  };
}
