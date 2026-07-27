import { JournalEntry, MessageDraft } from '@/types';
import { localizedText } from '@/lib/i18n/staticText';
import {
  TherapySummaryReport,
  EmotionalPatternInsight,
  RelationshipPatternInsight,
  ProgressHighlight,
  SuggestedFocusArea,
  CopingStrategyInsight,
} from '@/types/therapySummary';

function isWithinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function getEmotionalPatterns(entries: JournalEntry[], days: number): EmotionalPatternInsight[] {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const older = entries.filter(e => !isWithinDays(e.timestamp, days) && isWithinDays(e.timestamp, days * 2));

  const recentCounts: Record<string, { count: number; emoji: string }> = {};
  const olderCounts: Record<string, number> = {};

  recent.forEach(entry => {
    entry.checkIn.emotions.forEach(e => {
      if (!recentCounts[e.label]) recentCounts[e.label] = { count: 0, emoji: e.emoji };
      recentCounts[e.label].count += 1;
    });
  });

  older.forEach(entry => {
    entry.checkIn.emotions.forEach(e => {
      olderCounts[e.label] = (olderCounts[e.label] || 0) + 1;
    });
  });

  const totalRecent = Object.values(recentCounts).reduce((s, c) => s + c.count, 0);

  return Object.entries(recentCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([label, data], i) => {
      const olderCount = olderCounts[label] ?? 0;
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (data.count > olderCount + 1) trend = 'increasing';
      else if (data.count < olderCount - 1) trend = 'decreasing';

      const pct = totalRecent > 0 ? Math.round((data.count / totalRecent) * 100) : 0;
      const trendWord = trend === 'increasing' ? 'more often' : trend === 'decreasing' ? 'less frequently' : 'at a steady level';

      return {
        id: `ep_${i}`,
        label,
        emoji: data.emoji,
        frequency: data.count,
        trend,
        narrative: `You felt ${label.toLowerCase()} ${pct}% of the time recently, appearing ${trendWord} compared to before.`,
      };
    });
}

function getRelationshipPatterns(entries: JournalEntry[], drafts: MessageDraft[], days: number): RelationshipPatternInsight[] {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, days));
  const insights: RelationshipPatternInsight[] = [];
  let idCounter = 0;

  const relationshipTriggers: Record<string, number> = {};
  const emotionsWithRelTriggers: Record<string, number> = {};

  recent.forEach(entry => {
    const hasRelTrigger = entry.checkIn.triggers.some(t => t.category === 'relationship');
    if (hasRelTrigger) {
      entry.checkIn.triggers.filter(t => t.category === 'relationship').forEach(t => {
        relationshipTriggers[t.label] = (relationshipTriggers[t.label] || 0) + 1;
      });
      entry.checkIn.emotions.forEach(e => {
        emotionsWithRelTriggers[e.label] = (emotionsWithRelTriggers[e.label] || 0) + 1;
      });
    }
  });

  const topRelTrigger = Object.entries(relationshipTriggers).sort(([, a], [, b]) => b - a)[0];
  const topRelEmotion = Object.entries(emotionsWithRelTriggers).sort(([, a], [, b]) => b - a)[0];

  if (topRelTrigger) {
    insights.push({
      id: `rp_${idCounter++}`,
      pattern: `"${topRelTrigger[0]}" appears frequently in relationship contexts`,
      frequency: topRelTrigger[1],
      context: 'This trigger has been active in your recent check-ins.',
      suggestion: 'Consider exploring this pattern with grounding or journaling before responding.',
    });
  }

  if (topRelEmotion) {
    insights.push({
      id: `rp_${idCounter++}`,
      pattern: `You often feel ${topRelEmotion[0].toLowerCase()} during relationship interactions`,
      frequency: topRelEmotion[1],
      context: 'This emotion tends to appear alongside relationship-related triggers.',
      suggestion: 'Naming this emotion when it arises may help you respond more intentionally.',
    });
  }

  const rewriteCount = recentDrafts.filter(d => d.rewrittenText).length;
  const pauseCount = recentDrafts.filter(d => d.paused).length;

  if (rewriteCount > 0) {
    insights.push({
      id: `rp_${idCounter++}`,
      pattern: `You rewrote ${rewriteCount} message${rewriteCount !== 1 ? 's' : ''} before sending`,
      frequency: rewriteCount,
      context: 'Rewriting messages suggests you are being more thoughtful in communication.',
      suggestion: 'This is a sign of growing awareness — keep using the rewrite tool when emotions feel intense.',
    });
  }

  if (pauseCount > 0) {
    insights.push({
      id: `rp_${idCounter++}`,
      pattern: `You paused ${pauseCount} time${pauseCount !== 1 ? 's' : ''} before sending messages`,
      frequency: pauseCount,
      context: 'Pausing before sending is a powerful regulation skill.',
      suggestion: 'Continue building this habit — even a brief pause changes outcomes.',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: `rp_${idCounter++}`,
      pattern: 'No strong relationship patterns detected yet',
      frequency: 0,
      context: 'As you check in more, relationship insights will become clearer.',
      suggestion: 'Try noting the relationship context when you check in.',
    });
  }

  return insights.slice(0, 4);
}

function getProgressHighlights(entries: JournalEntry[], drafts: MessageDraft[], days: number): ProgressHighlight[] {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const older = entries.filter(e => !isWithinDays(e.timestamp, days) && isWithinDays(e.timestamp, days * 2));
  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, days));
  const highlights: ProgressHighlight[] = [];
  let idCounter = 0;

  const recentAvg = recent.length > 0
    ? recent.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / recent.length
    : 0;
  const olderAvg = older.length > 0
    ? older.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / older.length
    : 0;

  if (olderAvg > 0 && recentAvg < olderAvg) {
    const drop = Math.round(((olderAvg - recentAvg) / olderAvg) * 100);
    highlights.push({
      id: `ph_${idCounter++}`,
      icon: '📉',
      title: localizedText('Lower Distress', 'Menos malestar'),
      description: localizedText(
        `Your average distress dropped by ${drop}% compared to the previous period.`,
        `Tu malestar promedio bajó ${drop}% en comparación con el periodo anterior.`,
      ),
      type: 'growth',
    });
  }

  const pauseCount = recentDrafts.filter(d => d.paused).length;
  if (pauseCount > 0) {
    highlights.push({
      id: `ph_${idCounter++}`,
      icon: '⏸️',
      title: localizedText('Mindful Pausing', 'Pausas conscientes'),
      description: localizedText(
        `You paused before sending ${pauseCount} message${pauseCount !== 1 ? 's' : ''}. That shows real self-regulation.`,
        `Pausaste antes de enviar ${pauseCount} mensaje${pauseCount !== 1 ? 's' : ''}. Eso muestra autorregulación real.`,
      ),
      type: 'skill',
    });
  }

  const copingCount = recent.reduce((s, e) => s + (e.checkIn.copingUsed?.length ?? 0), 0);
  if (copingCount > 0) {
    highlights.push({
      id: `ph_${idCounter++}`,
      icon: '🧰',
      title: localizedText('Active Coping', 'Afrontamiento activo'),
      description: localizedText(
        `You used coping tools ${copingCount} time${copingCount !== 1 ? 's' : ''} recently. Reaching for support is a strength.`,
        `Usaste herramientas de afrontamiento ${copingCount} ${copingCount !== 1 ? 'veces' : 'vez'} recientemente. Buscar apoyo es una fortaleza.`,
      ),
      type: 'skill',
    });
  }

  if (recent.length >= 3) {
    highlights.push({
      id: `ph_${idCounter++}`,
      icon: '📋',
      title: localizedText('Consistent Check-Ins', 'Registros constantes'),
      description: localizedText(
        `You completed ${recent.length} check-in${recent.length !== 1 ? 's' : ''} recently. Showing up for yourself matters.`,
        `Completaste ${recent.length} registro${recent.length !== 1 ? 's' : ''} recientemente. Estar presente para ti importa.`,
      ),
      type: 'consistency',
    });
  }

  const reflections = recent.filter(e => e.reflection && e.reflection.length > 15).length;
  if (reflections >= 2) {
    highlights.push({
      id: `ph_${idCounter++}`,
      icon: '🪞',
      title: localizedText('Deeper Reflection', 'Reflexión más profunda'),
      description: localizedText(
        `You wrote thoughtful reflections ${reflections} times. Self-awareness is growing.`,
        `Escribiste reflexiones cuidadosas ${reflections} veces. Tu autoconciencia está creciendo.`,
      ),
      type: 'awareness',
    });
  }

  const rewriteCount = recentDrafts.filter(d => d.rewrittenText).length;
  if (rewriteCount > 0) {
    highlights.push({
      id: `ph_${idCounter++}`,
      icon: '✍️',
      title: localizedText('Clearer Communication', 'Comunicación más clara'),
      description: localizedText(
        `You rewrote ${rewriteCount} message${rewriteCount !== 1 ? 's' : ''} for clarity. That takes intentional effort.`,
        `Reescribiste ${rewriteCount} mensaje${rewriteCount !== 1 ? 's' : ''} para ganar claridad. Eso requiere intención.`,
      ),
      type: 'skill',
    });
  }

  if (highlights.length === 0) {
    highlights.push({
      id: `ph_${idCounter++}`,
      icon: '🌱',
      title: localizedText('Starting Your Journey', 'Comenzando tu camino'),
      description: localizedText(
        'Every check-in and every pause contributes to your growth. Keep going.',
        'Cada registro y cada pausa contribuyen a tu crecimiento. Sigue adelante.',
      ),
      type: 'growth',
    });
  }

  return highlights.slice(0, 5);
}

function getSuggestedFocusAreas(entries: JournalEntry[], drafts: MessageDraft[], days: number): SuggestedFocusArea[] {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, days));
  const areas: SuggestedFocusArea[] = [];
  let idCounter = 0;

  const avgDistress = recent.length > 0
    ? recent.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / recent.length
    : 0;

  const hasRelTriggers = recent.some(e => e.checkIn.triggers.some(t => t.category === 'relationship'));
  const hasAnxiety = recent.some(e => e.checkIn.emotions.some(em => ['Anxious', 'Afraid', 'Overwhelmed'].includes(em.label)));
  const hasImpulseUrges = recent.some(e => e.checkIn.urges.some(u => u.risk === 'high'));
  const lowReflections = recent.filter(e => e.reflection && e.reflection.length > 15).length < 2;

  if (avgDistress >= 6) {
    areas.push({
      id: `fa_${idCounter++}`,
      area: 'Distress Tolerance',
      reason: 'Your recent distress levels have been elevated. Practicing distress tolerance skills may help you ride the wave.',
      actionLabel: 'Try a grounding exercise',
      route: '/guided-regulation',
      priority: 'high',
    });
  }

  if (hasRelTriggers) {
    areas.push({
      id: `fa_${idCounter++}`,
      area: 'Relationship Communication',
      reason: 'Relationship triggers have been present. Focusing on secure communication may support more stability.',
      actionLabel: 'View relationship insights',
      route: '/relationship-insights',
      priority: 'high',
    });
  }

  if (hasAnxiety) {
    areas.push({
      id: `fa_${idCounter++}`,
      area: 'Mindfulness Practice',
      reason: 'Anxiety has been showing up recently. Mindfulness may help you return to the present moment.',
      actionLabel: 'Start a breathing exercise',
      route: '/guided-regulation',
      priority: 'medium',
    });
  }

  if (hasImpulseUrges) {
    areas.push({
      id: `fa_${idCounter++}`,
      area: 'Impulse Management',
      reason: 'Strong urges have been present. Building pause habits and using the STOP skill may help.',
      actionLabel: 'Explore DBT skills',
      route: '/profile/therapy-plan',
      priority: 'high',
    });
  }

  if (lowReflections) {
    areas.push({
      id: `fa_${idCounter++}`,
      area: 'Journaling Depth',
      reason: 'Writing more detailed reflections can deepen your self-awareness and help process emotions.',
      actionLabel: 'Start a check-in',
      route: '/check-in',
      priority: 'low',
    });
  }

  if (recentDrafts.length > 3 && recentDrafts.filter(d => d.paused).length < 2) {
    areas.push({
      id: `fa_${idCounter++}`,
      area: 'Message Pausing',
      reason: 'You have been drafting messages frequently. Pausing before sending may reduce regret.',
      actionLabel: 'Go to messages',
      route: '/(tabs)/messages',
      priority: 'medium',
    });
  }

  if (areas.length === 0) {
    areas.push({
      id: `fa_${idCounter++}`,
      area: 'Continue Building Awareness',
      reason: 'You are on a good path. Keep checking in and reflecting — clarity comes with consistency.',
      actionLabel: 'Check in now',
      route: '/check-in',
      priority: 'low',
    });
  }

  return areas.slice(0, 4);
}

function getCopingStrategies(entries: JournalEntry[], days: number): CopingStrategyInsight[] {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const sorted = [...recent].sort((a, b) => a.timestamp - b.timestamp);
  const toolData: Record<string, { totalBefore: number; totalAfter: number; count: number; improved: number }> = {};

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const coping = entry.checkIn.copingUsed;
    if (!coping || coping.length === 0) continue;

    const before = entry.checkIn.intensityLevel;
    const next = sorted[i + 1];
    const after = next ? next.checkIn.intensityLevel : Math.max(1, before - 2);

    coping.forEach(tool => {
      if (!toolData[tool]) toolData[tool] = { totalBefore: 0, totalAfter: 0, count: 0, improved: 0 };
      toolData[tool].totalBefore += before;
      toolData[tool].totalAfter += after;
      toolData[tool].count += 1;
      if (after < before) toolData[tool].improved += 1;
    });
  }

  return Object.entries(toolData)
    .map(([tool, data], i) => {
      const successRate = data.count > 0 ? Math.round((data.improved / data.count) * 100) : 0;
      let effectiveness: 'helpful' | 'moderate' | 'unclear' = 'unclear';
      if (successRate >= 60) effectiveness = 'helpful';
      else if (successRate >= 30) effectiveness = 'moderate';

      let narrative = '';
      if (effectiveness === 'helpful') {
        narrative = `${tool} appears to reduce your distress effectively. Keep reaching for this tool.`;
      } else if (effectiveness === 'moderate') {
        narrative = `${tool} seems to help sometimes. It may work best in certain situations.`;
      } else {
        narrative = `${tool} has been used ${data.count} time${data.count !== 1 ? 's' : ''}. More data will clarify its impact.`;
      }

      return {
        id: `cs_${i}`,
        tool,
        timesUsed: data.count,
        effectiveness,
        narrative,
      };
    })
    .sort((a, b) => b.timesUsed - a.timesUsed)
    .slice(0, 5);
}

function generateOverallNarrative(
  entries: JournalEntry[],
  drafts: MessageDraft[],
  days: number,
): string {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, days));

  if (recent.length < 2) {
    return localizedText(
      'As you continue checking in, your reflection reports will become richer and more personalized. Even starting is a meaningful step.',
      'A medida que sigas registrándote, tus reportes de reflexión serán más ricos y personalizados. Incluso empezar ya es un paso significativo.',
    );
  }

  const avgDistress = recent.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / recent.length;
  const topEmotion = getTopItem(recent.flatMap(e => e.checkIn.emotions.map(em => em.label)));
  const topTrigger = getTopItem(recent.flatMap(e => e.checkIn.triggers.map(t => t.label)));
  const pauseCount = recentDrafts.filter(d => d.paused).length;

  const parts: string[] = [];

  if (topEmotion) {
    parts.push(localizedText(
      `Over the past ${days} days, ${topEmotion.toLowerCase()} has been your most frequent emotional state.`,
      `Durante los últimos ${days} días, ${topEmotion.toLowerCase()} ha sido tu estado emocional más frecuente.`,
    ));
  }

  if (topTrigger) {
    parts.push(localizedText(
      `"${topTrigger}" appears to be a recurring trigger in your experience.`,
      `"${topTrigger}" parece ser un detonante recurrente en tu experiencia.`,
    ));
  }

  if (avgDistress >= 6) {
    parts.push(localizedText(
      'Your distress levels have been somewhat elevated, which suggests this has been a challenging period.',
      'Tus niveles de malestar han estado algo elevados, lo que sugiere que este ha sido un periodo desafiante.',
    ));
  } else if (avgDistress <= 3) {
    parts.push(localizedText(
      'Your distress has remained relatively low, which may reflect growing stabilization.',
      'Tu malestar se ha mantenido relativamente bajo, lo que puede reflejar más estabilidad.',
    ));
  }

  if (pauseCount > 0) {
    parts.push(localizedText(
      `You paused before sending ${pauseCount} message${pauseCount !== 1 ? 's' : ''}, showing increasing awareness in communication.`,
      `Pausaste antes de enviar ${pauseCount} mensaje${pauseCount !== 1 ? 's' : ''}, mostrando más conciencia en tu comunicación.`,
    ));
  }

  if (parts.length === 0) {
    return localizedText(
      'Your recent patterns suggest a period of gradual awareness-building. Keep showing up for yourself.',
      'Tus patrones recientes sugieren un periodo de construcción gradual de conciencia. Sigue presente para ti.',
    );
  }

  return parts.join(' ');
}

function generateClosingReflection(entries: JournalEntry[], days: number): string {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));

  if (recent.length < 2) {
    return localizedText(
      'Your journey is just beginning. Every moment of self-awareness counts.',
      'Tu camino apenas comienza. Cada momento de autoconciencia cuenta.',
    );
  }

  const copingCount = recent.reduce((s, e) => s + (e.checkIn.copingUsed?.length ?? 0), 0);
  const reflections = recent.filter(e => e.reflection && e.reflection.length > 15).length;

  if (copingCount > 3 && reflections > 2) {
    return localizedText(
      'You are actively using tools and reflecting on your experiences. This combination builds lasting emotional resilience.',
      'Estás usando herramientas activamente y reflexionando sobre tus experiencias. Esta combinación construye resiliencia emocional duradera.',
    );
  }

  if (copingCount > 0) {
    return localizedText(
      'You are beginning to reach for coping tools when things feel hard. That willingness to try is meaningful progress.',
      'Estás empezando a recurrir a herramientas de afrontamiento cuando las cosas se sienten difíciles. Esa disposición a intentar es progreso significativo.',
    );
  }

  if (reflections > 0) {
    return localizedText(
      'Your reflections show growing self-awareness. Understanding your patterns is a powerful step toward change.',
      'Tus reflexiones muestran una autoconciencia creciente. Entender tus patrones es un paso poderoso hacia el cambio.',
    );
  }

  return localizedText(
    'Showing up to check in with yourself takes courage. You are building a habit that supports your wellbeing.',
    'Presentarte para hacer registros contigo mismo/a requiere valentía. Estás construyendo un hábito que sostiene tu bienestar.',
  );
}

function getTopItem(items: string[]): string | null {
  const counts: Record<string, number> = {};
  items.forEach(item => { counts[item] = (counts[item] || 0) + 1; });
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  return sorted[0]?.[0] ?? null;
}

export function generateTherapySummary(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
  periodDays: number = 14,
): TherapySummaryReport {
  console.log('[TherapySummary] Generating report for', periodDays, 'days with', journalEntries.length, 'entries');

  const periodLabel = periodDays <= 7
    ? localizedText('This Week', 'Esta semana')
    : periodDays <= 14
      ? localizedText('Past Two Weeks', 'Últimas dos semanas')
      : localizedText('This Month', 'Este mes');

  const report: TherapySummaryReport = {
    id: `report_${Date.now()}`,
    generatedAt: Date.now(),
    periodLabel,
    periodDays,
    overallNarrative: generateOverallNarrative(journalEntries, messageDrafts, periodDays),
    emotionalPatterns: getEmotionalPatterns(journalEntries, periodDays),
    relationshipPatterns: getRelationshipPatterns(journalEntries, messageDrafts, periodDays),
    progressHighlights: getProgressHighlights(journalEntries, messageDrafts, periodDays),
    suggestedFocusAreas: getSuggestedFocusAreas(journalEntries, messageDrafts, periodDays),
    copingStrategies: getCopingStrategies(journalEntries, periodDays),
    closingReflection: generateClosingReflection(journalEntries, periodDays),
    hasEnoughData: journalEntries.filter(e => isWithinDays(e.timestamp, periodDays)).length >= 2,
  };

  console.log('[TherapySummary] Report generated:', {
    patterns: report.emotionalPatterns.length,
    relationships: report.relationshipPatterns.length,
    highlights: report.progressHighlights.length,
    focus: report.suggestedFocusAreas.length,
    coping: report.copingStrategies.length,
  });

  return report;
}
