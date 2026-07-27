import { JournalEntry, MessageDraft } from '@/types';
import { localizedText } from '@/lib/i18n/staticText';
import {
  EarlyWarningResult,
  DetectedPattern,
  EarlyWarningSuggestion,
  EmotionalTrend,
  WarningLevel,
} from '@/types/prediction';

function isWithinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function detectAbandonmentPattern(entries: JournalEntry[]): DetectedPattern | null {
  const weekEntries = entries.filter(e => isWithinDays(e.timestamp, 7));
  let abandonmentCount = 0;

  weekEntries.forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      const label = t.label.toLowerCase();
      if (
        label.includes('abandon') ||
        label.includes('reject') ||
        label.includes('left out') ||
        label.includes('ignored') ||
        t.category === 'relationship'
      ) {
        abandonmentCount++;
      }
    });
  });

  if (abandonmentCount >= 3) {
    return {
      id: 'abandonment_repeated',
      type: 'abandonment_trigger',
      label: localizedText('Repeated abandonment triggers', 'Detonantes repetidos de abandono'),
      description: localizedText(
        `You've experienced abandonment-related triggers ${abandonmentCount} times this week. This is a pattern worth being gentle about.`,
        `Has experimentado detonantes relacionados con abandono ${abandonmentCount} veces esta semana. Es un patrón para mirar con suavidad.`,
      ),
      severity: abandonmentCount >= 5 ? 'elevated' : 'moderate',
      dataPoints: abandonmentCount,
    };
  }
  return null;
}

function detectDistressRising(entries: JournalEntry[]): DetectedPattern | null {
  const recentEntries = entries
    .filter(e => isWithinDays(e.timestamp, 7))
    .sort((a, b) => b.timestamp - a.timestamp);

  if (recentEntries.length < 3) return null;

  const recentThree = recentEntries.slice(0, 3);
  const olderThree = recentEntries.slice(3, 6);

  if (olderThree.length === 0) return null;

  const recentAvg = recentThree.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / recentThree.length;
  const olderAvg = olderThree.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / olderThree.length;

  const increase = recentAvg - olderAvg;

  if (increase > 1) {
    return {
      id: 'distress_escalating',
      type: 'distress_rising',
      label: localizedText('Distress levels increasing', 'El malestar está aumentando'),
      description: localizedText(
        `Your recent distress levels have been climbing. A grounding exercise or journaling might help.`,
        'Tus niveles recientes de malestar han subido. Un ejercicio de anclaje o escribir puede ayudar.',
      ),
      severity: increase > 2 ? 'elevated' : 'moderate',
      dataPoints: recentThree.length,
    };
  }
  return null;
}

function detectEmotionalMessages(drafts: MessageDraft[]): DetectedPattern | null {
  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, 7));
  const emotionalCount = recentDrafts.filter(d => !d.sent || d.paused).length;

  if (emotionalCount >= 3) {
    return {
      id: 'emotional_messages_frequent',
      type: 'emotional_messages',
      label: localizedText('Frequent emotional messaging', 'Mensajes emocionales frecuentes'),
      description: localizedText(
        `You've drafted ${emotionalCount} emotional messages this week. Consider pausing before sending.`,
        `Has escrito ${emotionalCount} mensajes emocionales esta semana. Considera pausar antes de enviar.`,
      ),
      severity: emotionalCount >= 5 ? 'elevated' : 'moderate',
      dataPoints: emotionalCount,
    };
  }
  return null;
}

function detectRelationshipConflict(entries: JournalEntry[]): DetectedPattern | null {
  const weekEntries = entries.filter(e => isWithinDays(e.timestamp, 7));
  let conflictCount = 0;

  weekEntries.forEach(entry => {
    const hasRelationshipTrigger = entry.checkIn.triggers.some(t => t.category === 'relationship');
    const hasHighIntensity = entry.checkIn.intensityLevel >= 7;

    if (hasRelationshipTrigger && hasHighIntensity) {
      conflictCount++;
    }
  });

  if (conflictCount >= 2) {
    return {
      id: 'relationship_conflict_pattern',
      type: 'relationship_conflict',
      label: localizedText('Relationship stress pattern', 'Patrón de estrés relacional'),
      description: localizedText(
        `You've had ${conflictCount} high-intensity relationship moments this week. Your AI Companion can help process this.`,
        `Has tenido ${conflictCount} momentos relacionales de alta intensidad esta semana. AI Companion puede ayudarte a procesarlo.`,
      ),
      severity: conflictCount >= 3 ? 'elevated' : 'moderate',
      dataPoints: conflictCount,
    };
  }
  return null;
}

function detectUrgeFrequency(entries: JournalEntry[]): DetectedPattern | null {
  const weekEntries = entries.filter(e => isWithinDays(e.timestamp, 7));
  const highRiskUrges: string[] = [];

  weekEntries.forEach(entry => {
    entry.checkIn.urges.forEach(u => {
      if (u.risk === 'high' || u.risk === 'medium') {
        highRiskUrges.push(u.label);
      }
    });
  });

  if (highRiskUrges.length >= 3) {
    return {
      id: 'urge_frequency_high',
      type: 'urge_frequency',
      label: localizedText('Frequent strong urges', 'Impulsos fuertes frecuentes'),
      description: localizedText(
        `You've experienced ${highRiskUrges.length} strong urges this week. You're doing well to track them.`,
        `Has experimentado ${highRiskUrges.length} impulsos fuertes esta semana. Estás haciendo un buen trabajo al registrarlos.`,
      ),
      severity: highRiskUrges.length >= 5 ? 'elevated' : 'moderate',
      dataPoints: highRiskUrges.length,
    };
  }
  return null;
}

function computeEmotionalTrend(entries: JournalEntry[]): EmotionalTrend {
  const weekEntries = entries
    .filter(e => isWithinDays(e.timestamp, 7))
    .sort((a, b) => b.timestamp - a.timestamp);

  const avgDistress = weekEntries.length > 0
    ? Math.round((weekEntries.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / weekEntries.length) * 10) / 10
    : 0;

  const triggerCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};

  weekEntries.forEach(e => {
    e.checkIn.triggers.forEach(t => {
      triggerCounts[t.label] = (triggerCounts[t.label] || 0) + 1;
    });
    e.checkIn.emotions.forEach(em => {
      emotionCounts[em.label] = (emotionCounts[em.label] || 0) + 1;
    });
  });

  const topTrigger = Object.entries(triggerCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
  const topEmotion = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  let distressTrend: EmotionalTrend['distressTrend'] = 'unknown';
  let trendValue = 0;

  if (weekEntries.length >= 3) {
    const recent = weekEntries.slice(0, Math.min(3, weekEntries.length));
    const older = weekEntries.slice(Math.min(3, weekEntries.length), Math.min(6, weekEntries.length));
    if (older.length > 0) {
      const recentAvg = recent.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / recent.length;
      const olderAvg = older.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / older.length;
      trendValue = Math.round((recentAvg - olderAvg) * 10) / 10;
      if (trendValue > 0.5) distressTrend = 'rising';
      else if (trendValue < -0.5) distressTrend = 'falling';
      else distressTrend = 'stable';
    }
  }

  return {
    distressTrend,
    distressTrendValue: trendValue,
    topTriggerThisWeek: topTrigger,
    topEmotionThisWeek: topEmotion,
    averageDistressThisWeek: avgDistress,
    checkInsThisWeek: weekEntries.length,
  };
}

function determineWarningLevel(patterns: DetectedPattern[]): WarningLevel {
  if (patterns.length === 0) return 'none';
  if (patterns.some(p => p.severity === 'elevated')) return 'elevated';
  if (patterns.some(p => p.severity === 'moderate')) return 'moderate';
  return 'mild';
}

function generateSuggestions(patterns: DetectedPattern[]): EarlyWarningSuggestion[] {
  const suggestions: EarlyWarningSuggestion[] = [];
  const addedTypes = new Set<string>();

  patterns.forEach(pattern => {
    if (pattern.type === 'distress_rising' || pattern.type === 'urge_frequency') {
      if (!addedTypes.has('grounding')) {
        suggestions.push({
          id: 'suggest_grounding',
          type: 'grounding',
          title: localizedText('Grounding Exercise', 'Ejercicio de anclaje'),
          description: localizedText(
            'A short grounding exercise can help bring your body back to the present.',
            'Un ejercicio breve de anclaje puede ayudar a traer tu cuerpo de vuelta al presente.',
          ),
          route: '/exercise?id=c1',
          icon: 'Wind',
        });
        addedTypes.add('grounding');
      }
    }

    if (pattern.type === 'abandonment_trigger' || pattern.type === 'relationship_conflict') {
      if (!addedTypes.has('journaling')) {
        suggestions.push({
          id: 'suggest_journaling',
          type: 'journaling',
          title: localizedText('Journaling Reflection', 'Reflexión escrita'),
          description: localizedText(
            'Writing about what you\'re feeling can help you process and find clarity.',
            'Escribir sobre lo que sientes puede ayudarte a procesar y encontrar claridad.',
          ),
          route: '/check-in',
          icon: 'BookOpen',
        });
        addedTypes.add('journaling');
      }
    }

    if (pattern.type === 'emotional_messages') {
      if (!addedTypes.has('message_pause')) {
        suggestions.push({
          id: 'suggest_pause',
          type: 'message_pause',
          title: localizedText('Message Pause', 'Pausa antes del mensaje'),
          description: localizedText(
            'Taking a moment before responding can protect your relationships and peace.',
            'Tomarte un momento antes de responder puede proteger tus vínculos y tu paz.',
          ),
          route: '/(tabs)/messages',
          icon: 'Pause',
        });
        addedTypes.add('message_pause');
      }
    }

    if (pattern.type === 'relationship_conflict' || pattern.type === 'abandonment_trigger') {
      if (!addedTypes.has('ai_companion')) {
        suggestions.push({
          id: 'suggest_ai_companion',
          type: 'ai_companion',
          title: localizedText('Talk to AI Companion', 'Hablar con AI Companion'),
          description: localizedText(
            'Your AI Companion can help you work through what you\'re feeling right now.',
            'AI Companion puede ayudarte a procesar lo que estás sintiendo ahora.',
          ),
          route: '/(tabs)/companion',
          icon: 'MessageCircle',
        });
        addedTypes.add('ai_companion');
      }
    }
  });

  if (suggestions.length === 0 && patterns.length > 0) {
    suggestions.push({
      id: 'suggest_grounding_default',
      type: 'grounding',
      title: localizedText('Grounding Exercise', 'Ejercicio de anclaje'),
      description: localizedText(
        'A short grounding exercise might help you feel more centered.',
        'Un ejercicio breve de anclaje podría ayudarte a sentirte más centrado/a.',
      ),
      route: '/exercise?id=c1',
      icon: 'Wind',
    });
  }

  return suggestions;
}

function generateWarningMessage(patterns: DetectedPattern[], trend: EmotionalTrend): string | null {
  if (patterns.length === 0) return null;

  const elevated = patterns.filter(p => p.severity === 'elevated');
  if (elevated.length > 0) {
    return localizedText(
      "Your stress levels have been rising this week. You're doing a great job tracking — a short grounding exercise might help right now.",
      'Tus niveles de estrés han subido esta semana. Estás haciendo un gran trabajo al registrarlo; un ejercicio breve de anclaje podría ayudar ahora.',
    );
  }

  if (trend.distressTrend === 'rising') {
    return localizedText(
      "Your emotional intensity has been climbing lately. This is a good time to be gentle with yourself.",
      'Tu intensidad emocional ha estado subiendo últimamente. Es un buen momento para tratarte con suavidad.',
    );
  }

  if (patterns.some(p => p.type === 'emotional_messages')) {
    return localizedText(
      "You've been drafting a lot of emotional messages. Remember, it's okay to pause before sending.",
      'Has estado escribiendo muchos mensajes emocionales. Recuerda: está bien pausar antes de enviar.',
    );
  }

  if (patterns.some(p => p.type === 'abandonment_trigger')) {
    return localizedText(
      "Abandonment feelings have been showing up more often. You're not alone in this — your patterns tell a story of strength.",
      'Los sentimientos de abandono han aparecido más seguido. No estás solo/a en esto; tus patrones también cuentan una historia de fuerza.',
    );
  }

  return localizedText(
    "Some patterns are emerging in your recent data. Taking a moment for yourself could make a difference.",
    'Están apareciendo algunos patrones en tus datos recientes. Tomarte un momento para ti podría marcar diferencia.',
  );
}

export function analyzePatterns(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): EarlyWarningResult {
  const patterns: DetectedPattern[] = [];

  const abandonment = detectAbandonmentPattern(journalEntries);
  if (abandonment) patterns.push(abandonment);

  const distress = detectDistressRising(journalEntries);
  if (distress) patterns.push(distress);

  const messages = detectEmotionalMessages(messageDrafts);
  if (messages) patterns.push(messages);

  const relationship = detectRelationshipConflict(journalEntries);
  if (relationship) patterns.push(relationship);

  const urges = detectUrgeFrequency(journalEntries);
  if (urges) patterns.push(urges);

  const emotionalTrend = computeEmotionalTrend(journalEntries);
  const warningLevel = determineWarningLevel(patterns);
  const suggestions = generateSuggestions(patterns);
  const message = generateWarningMessage(patterns, emotionalTrend);

  console.log('[PatternPrediction] Analyzed patterns:', patterns.length, 'Warning level:', warningLevel);

  return {
    warningLevel,
    patterns,
    suggestions,
    emotionalTrend,
    message,
  };
}
