import { JournalEntry, MessageDraft } from '@/types';
import { localizedText } from '@/lib/i18n/staticText';
import {
  CopingRecommendation,
  RecommendationResult,
  RecommendationPriority,
} from '@/types/recommendation';

function isWithinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function getRecentEmotions(entries: JournalEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  entries.filter(e => isWithinDays(e.timestamp, 7)).forEach(entry => {
    entry.checkIn.emotions.forEach(em => {
      counts[em.label] = (counts[em.label] || 0) + 1;
    });
  });
  return counts;
}

function getRecentTriggers(entries: JournalEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  entries.filter(e => isWithinDays(e.timestamp, 7)).forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      counts[t.label] = (counts[t.label] || 0) + 1;
    });
  });
  return counts;
}

function getRecentTriggerCategories(entries: JournalEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  entries.filter(e => isWithinDays(e.timestamp, 7)).forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
  });
  return counts;
}

function getRecentCopingUsed(entries: JournalEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  entries.filter(e => isWithinDays(e.timestamp, 7)).forEach(entry => {
    (entry.checkIn.copingUsed ?? []).forEach(c => {
      counts[c] = (counts[c] || 0) + 1;
    });
  });
  return counts;
}

function getAverageDistress(entries: JournalEntry[]): number {
  const recent = entries.filter(e => isWithinDays(e.timestamp, 7));
  if (recent.length === 0) return 0;
  return recent.reduce((sum, e) => sum + e.checkIn.intensityLevel, 0) / recent.length;
}

function getLatestDistress(entries: JournalEntry[]): number {
  const recent = entries
    .filter(e => isWithinDays(e.timestamp, 3))
    .sort((a, b) => b.timestamp - a.timestamp);
  return recent[0]?.checkIn.intensityLevel ?? 0;
}

function hasHighUrges(entries: JournalEntry[]): boolean {
  const recent = entries.filter(e => isWithinDays(e.timestamp, 3));
  return recent.some(entry =>
    entry.checkIn.urges.some(u => u.risk === 'high')
  );
}

function hasFrequentMessaging(drafts: MessageDraft[]): boolean {
  const recent = drafts.filter(d => isWithinDays(d.timestamp, 3));
  return recent.length >= 2;
}

function priorityScore(p: RecommendationPriority): number {
  if (p === 'high') return 3;
  if (p === 'medium') return 2;
  return 1;
}

export function generateRecommendations(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): RecommendationResult {
  const recommendations: CopingRecommendation[] = [];
  const addedCategories = new Set<string>();

  const recent = journalEntries.filter(e => isWithinDays(e.timestamp, 7));

  if (recent.length === 0) {
    console.log('[CopingRecommendation] No recent data, returning empty');
    return { recommendations: [], topRecommendation: null, hasData: false };
  }

  const avgDistress = getAverageDistress(journalEntries);
  const latestDistress = getLatestDistress(journalEntries);
  const emotionCounts = getRecentEmotions(journalEntries);
  const triggerCounts = getRecentTriggers(journalEntries);
  const triggerCategories = getRecentTriggerCategories(journalEntries);
  const _copingUsed = getRecentCopingUsed(journalEntries);
  const highUrges = hasHighUrges(journalEntries);
  const frequentMessaging = hasFrequentMessaging(messageDrafts);

  const topEmotion = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
  const _topTrigger = Object.entries(triggerCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

  if (latestDistress >= 7 || avgDistress >= 6) {
    if (!addedCategories.has('breathing')) {
      recommendations.push({
        id: 'rec_breathing_high',
        category: 'breathing',
        title: localizedText('Breathing Exercise', 'Ejercicio de respiración'),
        message: localizedText(
          'Breathing exercises may help right now. A few deep breaths can lower your distress.',
          'Un ejercicio de respiración puede ayudarte ahora. Unas respiraciones profundas pueden bajar el malestar.',
        ),
        route: '/exercise?id=c1',
        icon: 'Wind',
        priority: 'high',
        reason: localizedText(
          `Your distress has been elevated (${latestDistress >= 7 ? 'latest: ' + latestDistress : 'avg: ' + avgDistress.toFixed(1)}/10)`,
          `Tu malestar ha estado elevado (${latestDistress >= 7 ? 'último: ' + latestDistress : 'promedio: ' + avgDistress.toFixed(1)}/10)`,
        ),
      });
      addedCategories.add('breathing');
    }
  }

  if (latestDistress >= 8 || highUrges) {
    if (!addedCategories.has('grounding')) {
      recommendations.push({
        id: 'rec_grounding_crisis',
        category: 'grounding',
        title: localizedText('5-4-3-2-1 Grounding', 'Conexión 5-4-3-2-1'),
        message: localizedText(
          'A grounding exercise can help bring you back to the present moment.',
          'Un ejercicio de conexión a tierra puede ayudarte a volver al momento presente.',
        ),
        route: '/exercise?id=c1',
        icon: 'Anchor',
        priority: 'high',
        reason: highUrges
          ? localizedText('Strong urges detected recently', 'Se detectaron impulsos fuertes recientemente')
          : localizedText('Very high distress detected', 'Se detectó malestar muy alto'),
      });
      addedCategories.add('grounding');
    }
  }

  const anxiousEmotions = ['Anxious', 'Afraid', 'Overwhelmed'];
  const hasAnxiety = anxiousEmotions.some(e => (emotionCounts[e] ?? 0) >= 2);
  if (hasAnxiety && !addedCategories.has('breathing')) {
    recommendations.push({
      id: 'rec_breathing_anxiety',
      category: 'breathing',
      title: localizedText('Calming Breath', 'Respiración calmante'),
      message: localizedText(
        'You\'ve been feeling anxious lately. A breathing exercise could help settle your nervous system.',
        'Has sentido ansiedad últimamente. Un ejercicio de respiración podría ayudar a calmar tu sistema nervioso.',
      ),
      route: '/exercise?id=c1',
      icon: 'Wind',
      priority: 'medium',
      reason: localizedText(
        'Frequent anxiety-related emotions this week',
        'Emociones relacionadas con ansiedad frecuentes esta semana',
      ),
    });
    addedCategories.add('breathing');
  }

  const relationshipTriggers = triggerCategories['relationship'] ?? 0;
  if (relationshipTriggers >= 2) {
    if (!addedCategories.has('journaling')) {
      recommendations.push({
        id: 'rec_journal_relationship',
        category: 'journaling',
        title: localizedText('Write a Reflection', 'Escribe una reflexión'),
        message: localizedText(
          'Writing a short reflection could help process this trigger and find clarity.',
          'Escribir una reflexión breve puede ayudarte a procesar este detonante y encontrar claridad.',
        ),
        route: '/check-in',
        icon: 'BookOpen',
        priority: 'medium',
        reason: localizedText(
          `${relationshipTriggers} relationship triggers this week`,
          `${relationshipTriggers} detonantes relacionales esta semana`,
        ),
      });
      addedCategories.add('journaling');
    }
  }

  if (frequentMessaging) {
    if (!addedCategories.has('message_pause')) {
      recommendations.push({
        id: 'rec_pause_messaging',
        category: 'message_pause',
        title: localizedText('Pause Before Messaging', 'Pausa antes de escribir'),
        message: localizedText(
          'Try a grounding exercise before messaging someone. A brief pause can protect your peace.',
          'Prueba un ejercicio de conexión antes de escribirle a alguien. Una pausa breve puede proteger tu paz.',
        ),
        route: '/exercise?id=c1',
        icon: 'Timer',
        priority: 'medium',
        reason: localizedText(
          'Multiple emotional messages drafted recently',
          'Varios mensajes emocionales redactados recientemente',
        ),
      });
      addedCategories.add('message_pause');
    }
  }

  const sadEmotions = ['Sad', 'Abandoned', 'Empty', 'Desperate'];
  const hasSadness = sadEmotions.some(e => (emotionCounts[e] ?? 0) >= 2);
  if (hasSadness && !addedCategories.has('self_soothing')) {
    recommendations.push({
      id: 'rec_self_soothe',
      category: 'self_soothing',
      title: localizedText('Self-Soothe Kit', 'Kit de autoconsuelo'),
      message: localizedText(
        'You\'ve been carrying a lot of heavy feelings. A self-soothing exercise could bring some comfort.',
        'Has estado cargando emociones pesadas. Un ejercicio de autoconsuelo podría traer algo de alivio.',
      ),
      route: '/exercise?id=c3',
      icon: 'Heart',
      priority: 'medium',
      reason: localizedText(
        'Frequent sadness-related emotions this week',
        'Emociones relacionadas con tristeza frecuentes esta semana',
      ),
    });
    addedCategories.add('self_soothing');
  }

  const angryEmotions = ['Angry', 'Jealous'];
  const hasAnger = angryEmotions.some(e => (emotionCounts[e] ?? 0) >= 2);
  if (hasAnger && !addedCategories.has('opposite_action')) {
    recommendations.push({
      id: 'rec_opposite_action',
      category: 'opposite_action',
      title: localizedText('Opposite Action', 'Acción opuesta'),
      message: localizedText(
        'When anger is strong, doing the opposite of what it urges can break the cycle.',
        'Cuando el enojo es fuerte, hacer lo opuesto a lo que impulsa puede romper el ciclo.',
      ),
      route: '/exercise?id=c7',
      icon: 'RefreshCw',
      priority: 'medium',
      reason: localizedText(
        'Frequent anger-related emotions this week',
        'Emociones relacionadas con enojo frecuentes esta semana',
      ),
    });
    addedCategories.add('opposite_action');
  }

  const hasMisunderstanding = (emotionCounts['Misunderstood'] ?? 0) >= 1;
  if (hasMisunderstanding && !addedCategories.has('reality_check')) {
    recommendations.push({
      id: 'rec_reality_check',
      category: 'reality_check',
      title: localizedText('Check the Facts', 'Comprobar los hechos'),
      message: localizedText(
        'When you feel misunderstood, checking the facts can reveal a different perspective.',
        'Cuando te sientes incomprendido/a, comprobar los hechos puede mostrar otra perspectiva.',
      ),
      route: '/exercise?id=c5',
      icon: 'Search',
      priority: 'low',
      reason: localizedText('Feeling misunderstood recently', 'Te sentiste incomprendido/a recientemente'),
    });
    addedCategories.add('reality_check');
  }

  if (topEmotion && !addedCategories.has('ai_companion') && recent.length >= 3) {
    recommendations.push({
      id: 'rec_ai_companion',
      category: 'ai_companion',
      title: localizedText('Talk It Through', 'Hablarlo con calma'),
      message: localizedText(
        `You've been feeling ${topEmotion.toLowerCase()} often. Your AI Companion can help explore what's behind it.`,
        `Has sentido ${topEmotion.toLowerCase()} con frecuencia. Tu Companion puede ayudarte a explorar qué hay detrás.`,
      ),
      route: '/(tabs)/companion',
      icon: 'MessageCircle',
      priority: 'low',
      reason: localizedText(
        `"${topEmotion}" is your most frequent emotion this week`,
        `"${topEmotion}" es tu emoción más frecuente esta semana`,
      ),
    });
    addedCategories.add('ai_companion');
  }

  if (!addedCategories.has('breathing') && !addedCategories.has('grounding') && avgDistress >= 4) {
    recommendations.push({
      id: 'rec_breathing_default',
      category: 'breathing',
      title: localizedText('Quick Breathing', 'Respiración rápida'),
      message: localizedText(
        'A short breathing exercise can help you reset and feel more centered.',
        'Un ejercicio breve de respiración puede ayudarte a reiniciar y sentir más centro.',
      ),
      route: '/exercise?id=c1',
      icon: 'Wind',
      priority: 'low',
      reason: localizedText('General wellness recommendation', 'Recomendación general de bienestar'),
    });
  }

  recommendations.sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority));

  const topRecommendation = recommendations[0] ?? null;

  console.log('[CopingRecommendation] Generated', recommendations.length, 'recommendations. Top:', topRecommendation?.title);

  return {
    recommendations: recommendations.slice(0, 5),
    topRecommendation,
    hasData: true,
  };
}

export function generateCheckInRecommendations(
  intensityLevel: number,
  emotions: string[],
  triggers: string[],
  triggerCategories: string[],
  urges: { label: string; risk: string }[],
): CopingRecommendation[] {
  const recs: CopingRecommendation[] = [];

  if (intensityLevel >= 7) {
    recs.push({
      id: 'ci_rec_grounding',
      category: 'grounding',
      title: localizedText('5-4-3-2-1 Grounding', 'Conexión 5-4-3-2-1'),
      message: localizedText(
        'Your distress is high. A grounding exercise can help bring you back to the present.',
        'Tu malestar está alto. Un ejercicio de conexión puede ayudarte a volver al presente.',
      ),
      route: '/exercise?id=c1',
      icon: 'Anchor',
      priority: 'high',
      reason: localizedText(`Distress level: ${intensityLevel}/10`, `Nivel de malestar: ${intensityLevel}/10`),
    });
  }

  if (intensityLevel >= 5) {
    recs.push({
      id: 'ci_rec_breathing',
      category: 'breathing',
      title: localizedText('Breathing Exercise', 'Ejercicio de respiración'),
      message: localizedText(
        'A few minutes of focused breathing can help lower your intensity.',
        'Unos minutos de respiración enfocada pueden ayudarte a bajar la intensidad.',
      ),
      route: '/exercise?id=c1',
      icon: 'Wind',
      priority: intensityLevel >= 7 ? 'high' : 'medium',
      reason: localizedText('Elevated distress', 'Malestar elevado'),
    });
  }

  const hasRelationshipTrigger = triggerCategories.includes('relationship');
  if (hasRelationshipTrigger) {
    recs.push({
      id: 'ci_rec_reality_check',
      category: 'reality_check',
      title: localizedText('Check the Facts', 'Comprobar los hechos'),
      message: localizedText(
        'Before reacting, checking the facts can help you see the situation more clearly.',
        'Antes de reaccionar, comprobar los hechos puede ayudarte a ver la situación con más claridad.',
      ),
      route: '/exercise?id=c5',
      icon: 'Search',
      priority: 'medium',
      reason: localizedText('Relationship trigger detected', 'Detonante relacional detectado'),
    });
  }

  const hasHighUrge = urges.some(u => u.risk === 'high');
  if (hasHighUrge) {
    recs.push({
      id: 'ci_rec_opposite',
      category: 'opposite_action',
      title: localizedText('Opposite Action', 'Acción opuesta'),
      message: localizedText(
        'You\'re experiencing strong urges. Doing the opposite can help break the cycle.',
        'Estás sintiendo impulsos fuertes. Hacer lo opuesto puede ayudar a romper el ciclo.',
      ),
      route: '/exercise?id=c7',
      icon: 'RefreshCw',
      priority: 'high',
      reason: localizedText('High-risk urge detected', 'Impulso de alto riesgo detectado'),
    });
  }

  const sadEmotions = ['Sad', 'Abandoned', 'Empty', 'Desperate'];
  if (emotions.some(e => sadEmotions.includes(e))) {
    recs.push({
      id: 'ci_rec_soothe',
      category: 'self_soothing',
      title: localizedText('Self-Soothe', 'Autoconsuelo'),
      message: localizedText(
        'Being gentle with yourself right now can make a real difference.',
        'Tratarte con gentileza ahora puede hacer una diferencia real.',
      ),
      route: '/exercise?id=c3',
      icon: 'Heart',
      priority: 'medium',
      reason: localizedText('Sadness-related emotions', 'Emociones relacionadas con tristeza'),
    });
  }

  recs.sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority));

  console.log('[CopingRecommendation] Check-in recs:', recs.length);

  return recs.slice(0, 3);
}
