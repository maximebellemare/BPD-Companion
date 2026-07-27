import { MemoryProfile } from '@/types/memory';
import { GraphPatternSummary, TriggerChain, CalmingPattern } from '@/types/memoryGraph';
import {
  CoachingNudge,
  CoachingInsight,
  CoachingCategory,
  CoachingSuggestedAction,
  CoachingWin,
} from '@/types/coaching';
import { localizedText } from '@/lib/i18n/staticText';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pickAction(category: CoachingCategory): CoachingSuggestedAction {
  const actions: Record<CoachingCategory, CoachingSuggestedAction> = {
    communication: { label: localizedText('Open Message Tool', 'Abrir herramienta de mensajes'), route: '/messages', icon: 'message-square' },
    emotional_regulation: { label: localizedText('Try Grounding', 'Probar anclaje'), route: '/exercise?id=c1', icon: 'wind' },
    reassurance_seeking: { label: localizedText('Pause & Reflect', 'Pausar y reflexionar'), route: '/exercise?id=c5', icon: 'pause' },
    conflict_recovery: { label: localizedText('Guided Regulation', 'Regulación guiada'), route: '/guided-regulation', icon: 'zap' },
    pause_training: { label: localizedText('Practice Pausing', 'Practicar la pausa'), route: '/exercise?id=c1', icon: 'timer' },
    self_soothing: { label: localizedText('Self-Soothe', 'Autoconsolarme'), route: '/exercise?id=c3', icon: 'heart' },
    shame_recovery: { label: localizedText('Ground Yourself', 'Anclarme'), route: '/exercise?id=c2', icon: 'sparkles' },
  };
  return actions[category];
}

export function buildCommunicationNudges(
  profile: MemoryProfile,
  graphSummary: GraphPatternSummary | null,
): CoachingNudge[] {
  const nudges: CoachingNudge[] = [];
  const { messageUsage } = profile;

  if (messageUsage.totalRewrites > 2) {
    nudges.push({
      id: makeId('comm-rewrite'),
      category: 'communication',
      title: localizedText('A pattern you might notice', 'Un patrón que podrías notar'),
      message: localizedText(
        `You've rewritten ${messageUsage.totalRewrites} messages recently. This suggests you're already building the habit of pausing before communicating.`,
        `Has reescrito ${messageUsage.totalRewrites} mensajes recientemente. Esto sugiere que ya estás construyendo el hábito de pausar antes de comunicarte.`,
      ),
      supportingDetail: localizedText(
        'One small shift: try reading your message aloud before deciding on the rewrite. Sometimes hearing it changes how it feels.',
        'Un cambio pequeño: lee el mensaje en voz alta antes de decidir la versión final. A veces escucharlo cambia cómo se siente.',
      ),
      suggestedAction: pickAction('communication'),
      intensity: 'gentle',
      relevanceScore: 0.7,
      basedOn: ['message_rewrites'],
      createdAt: Date.now(),
    });
  }

  if (messageUsage.totalPauses > 0 && messageUsage.pauseSuccessRate > 40) {
    nudges.push({
      id: makeId('comm-pause'),
      category: 'pause_training',
      title: localizedText('Pausing is working for you', 'Pausar te está ayudando'),
      message: localizedText(
        `When you pause before sending, it seems to help — you chose not to send ${messageUsage.notSentAfterPause} time${messageUsage.notSentAfterPause !== 1 ? 's' : ''} after pausing. That's real emotional regulation.`,
        `Cuando pausas antes de enviar, parece ayudarte: elegiste no enviar ${messageUsage.notSentAfterPause} vez${messageUsage.notSentAfterPause !== 1 ? 'es' : ''} después de pausar. Eso es regulación emocional real.`,
      ),
      suggestedAction: pickAction('pause_training'),
      intensity: 'gentle',
      relevanceScore: 0.8,
      basedOn: ['message_pauses'],
      createdAt: Date.now(),
    });
  }

  const relChains = graphSummary?.relationshipPatterns ?? [];
  if (relChains.length > 0) {
    const top = relChains[0];
    nudges.push({
      id: makeId('comm-rel'),
      category: 'communication',
      title: localizedText('Before you respond', 'Antes de responder'),
      message: localizedText(
        `When ${top.situation.toLowerCase()} happens, ${top.emotionalResponse.toLowerCase()} often follows. A 2-minute pause may help you respond from a calmer place.`,
        `Cuando aparece este patrón, una pausa de 2 minutos puede ayudarte a responder desde un lugar más calmado.`,
      ),
      supportingDetail: localizedText(
        'You don\'t have to act on the first feeling. The second wave is usually calmer.',
        'No tienes que actuar sobre la primera emoción. La segunda ola suele ser más tranquila.',
      ),
      suggestedAction: pickAction('communication'),
      intensity: 'moderate',
      relevanceScore: 0.75,
      basedOn: ['relationship_patterns'],
      createdAt: Date.now(),
    });
  }

  return nudges;
}

export function buildRegulationNudges(
  profile: MemoryProfile,
  graphSummary: GraphPatternSummary | null,
): CoachingNudge[] {
  const nudges: CoachingNudge[] = [];

  if (profile.intensityTrend === 'rising') {
    nudges.push({
      id: makeId('reg-rising'),
      category: 'emotional_regulation',
      title: localizedText('Intensity has been higher lately', 'La intensidad ha estado más alta últimamente'),
      message: localizedText(
        'Your recent check-ins suggest things have felt more intense. Being aware of this is already a meaningful step.',
        'Tus check-ins recientes sugieren que las cosas se han sentido más intensas. Notarlo ya es un paso importante.',
      ),
      supportingDetail: localizedText(
        'On days like this, even one grounding exercise before bed may help reset the next day.',
        'En días así, incluso un ejercicio de anclaje antes de dormir puede ayudar a empezar distinto mañana.',
      ),
      suggestedAction: pickAction('emotional_regulation'),
      intensity: 'moderate',
      relevanceScore: 0.85,
      basedOn: ['intensity_trend'],
      createdAt: Date.now(),
    });
  }

  if (profile.intensityTrend === 'falling') {
    nudges.push({
      id: makeId('reg-falling'),
      category: 'emotional_regulation',
      title: localizedText('Your intensity is easing', 'Tu intensidad está bajando'),
      message: localizedText(
        'Your average distress has been trending downward. Whatever you\'re doing seems to be helping — keep it up.',
        'Tu malestar promedio está bajando. Lo que estás haciendo parece estar ayudando; sigue así.',
      ),
      intensity: 'gentle',
      relevanceScore: 0.6,
      basedOn: ['intensity_trend'],
      createdAt: Date.now(),
    });
  }

  const calmingPatterns = graphSummary?.mostEffectiveCalming ?? [];
  if (calmingPatterns.length > 0) {
    const best = calmingPatterns[0];
    nudges.push({
      id: makeId('reg-coping'),
      category: 'emotional_regulation',
      title: localizedText('What seems to help most', 'Lo que parece ayudarte más'),
      message: localizedText(
        `${best.copingTool} appears to be especially helpful when you feel ${best.emotion.toLowerCase()}.`,
        `${best.copingTool} parece ayudarte especialmente en ese tipo de emoción.`,
      ),
      supportingDetail: localizedText(
        `You've used it ${best.timesUsed} time${best.timesUsed !== 1 ? 's' : ''}. Leaning into what works is a form of self-knowledge.`,
        `Lo has usado ${best.timesUsed} vez${best.timesUsed !== 1 ? 'es' : ''}. Volver a lo que funciona también es autoconocimiento.`,
      ),
      suggestedAction: pickAction('emotional_regulation'),
      intensity: 'gentle',
      relevanceScore: 0.7,
      basedOn: ['calming_patterns'],
      createdAt: Date.now(),
    });
  }

  return nudges;
}

export function buildReassuranceNudges(
  profile: MemoryProfile,
  graphSummary: GraphPatternSummary | null,
): CoachingNudge[] {
  const nudges: CoachingNudge[] = [];

  const hasReassuranceTrigger = profile.topTriggers.some(
    t => t.label.toLowerCase().includes('uncertain') ||
      t.label.toLowerCase().includes('no reply') ||
      t.label.toLowerCase().includes('silence') ||
      t.label.toLowerCase().includes('ignored')
  );

  const hasReassuranceUrge = profile.topUrges.some(
    u => u.label.toLowerCase().includes('text') ||
      u.label.toLowerCase().includes('reach out') ||
      u.label.toLowerCase().includes('reassurance') ||
      u.label.toLowerCase().includes('check')
  );

  if (hasReassuranceTrigger || hasReassuranceUrge) {
    nudges.push({
      id: makeId('reassure-comm'),
      category: 'reassurance_seeking',
      title: localizedText('When uncertainty feels urgent', 'Cuando la incertidumbre se siente urgente'),
      message: localizedText(
        'Communication uncertainty often triggers the urge to reach out quickly. A short pause may help you choose a response that feels more grounded.',
        'La incertidumbre en la comunicación suele activar la urgencia de escribir rápido. Una pausa breve puede ayudarte a elegir una respuesta más centrada.',
      ),
      supportingDetail: localizedText(
        'Try this: set a 2-minute timer. If the urge still feels strong after, you can act — but from a calmer place.',
        'Prueba esto: pon un temporizador de 2 minutos. Si después la urgencia sigue fuerte, puedes actuar, pero desde un lugar más calmado.',
      ),
      suggestedAction: pickAction('reassurance_seeking'),
      intensity: 'moderate',
      relevanceScore: 0.85,
      basedOn: ['trigger_patterns', 'urge_patterns'],
      createdAt: Date.now(),
    });
  }

  const triggerChains = graphSummary?.topTriggerChains ?? [];
  const abandonmentChain = triggerChains.find(
    tc => tc.trigger.label.toLowerCase().includes('abandon') ||
      tc.trigger.label.toLowerCase().includes('reject') ||
      tc.trigger.label.toLowerCase().includes('left out')
  );

  if (abandonmentChain) {
    const emotions = abandonmentChain.emotions.slice(0, 2).map(e => e.label.toLowerCase());
    const copingTools = abandonmentChain.copingTools.slice(0, 1).map(c => c.label);

    nudges.push({
      id: makeId('reassure-abandon'),
      category: 'reassurance_seeking',
      title: localizedText('When abandonment fear rises', 'Cuando sube el miedo al abandono'),
      message: localizedText(
        `"${abandonmentChain.trigger.label}" tends to bring up ${emotions.join(' and ')}. ${copingTools.length > 0 ? `${copingTools[0]} may help in those moments.` : 'A grounding exercise may help before acting.'}`,
        `"${abandonmentChain.trigger.label}" suele activar emociones intensas. ${copingTools.length > 0 ? `${copingTools[0]} puede ayudar en esos momentos.` : 'Un ejercicio de anclaje puede ayudar antes de actuar.'}`,
      ),
      suggestedAction: pickAction('reassurance_seeking'),
      intensity: 'moderate',
      relevanceScore: 0.9,
      basedOn: ['trigger_chains'],
      createdAt: Date.now(),
    });
  }

  return nudges;
}

export function buildShameNudges(profile: MemoryProfile, _graphSummary: GraphPatternSummary | null): CoachingNudge[] {
  const nudges: CoachingNudge[] = [];

  const hasShame = profile.topEmotions.some(
    e => e.label.toLowerCase().includes('shame') ||
      e.label.toLowerCase().includes('guilt') ||
      e.label.toLowerCase().includes('worthless')
  );

  if (hasShame) {
    nudges.push({
      id: makeId('shame-ground'),
      category: 'shame_recovery',
      title: localizedText('When shame feels heavy', 'Cuando la vergüenza pesa'),
      message: localizedText(
        'Shame often makes you want to withdraw or hide. A short grounding step may make it easier to respond with more clarity instead of disappearing.',
        'La vergüenza suele empujarte a retirarte o esconderte. Un paso breve de anclaje puede ayudarte a responder con más claridad en vez de desaparecer.',
      ),
      supportingDetail: localizedText(
        'Shame tells you something is wrong with you. That\'s the emotion talking, not the truth.',
        'La vergüenza dice que algo está mal contigo. Esa es la emoción hablando, no la verdad.',
      ),
      suggestedAction: pickAction('shame_recovery'),
      intensity: 'gentle',
      relevanceScore: 0.8,
      basedOn: ['emotion_patterns'],
      createdAt: Date.now(),
    });
  }

  const hasConflictTrigger = profile.topTriggers.some(
    t => t.label.toLowerCase().includes('conflict') ||
      t.label.toLowerCase().includes('argument') ||
      t.label.toLowerCase().includes('fight')
  );

  if (hasConflictTrigger && hasShame) {
    nudges.push({
      id: makeId('shame-conflict'),
      category: 'conflict_recovery',
      title: localizedText('After conflict', 'Después del conflicto'),
      message: localizedText(
        'Conflict seems to bring up shame for you. That\'s a very common pattern with BPD. Separating what happened from how you feel about yourself may help.',
        'El conflicto parece activar vergüenza en ti. Es un patrón muy común en el TLP. Separar lo que pasó de lo que sientes sobre ti puede ayudar.',
      ),
      suggestedAction: pickAction('conflict_recovery'),
      intensity: 'moderate',
      relevanceScore: 0.85,
      basedOn: ['trigger_patterns', 'emotion_patterns'],
      createdAt: Date.now(),
    });
  }

  return nudges;
}

export function buildSelfSoothingNudges(
  profile: MemoryProfile,
  _graphSummary: GraphPatternSummary | null,
): CoachingNudge[] {
  const nudges: CoachingNudge[] = [];

  if (profile.averageIntensity >= 6 && profile.copingToolsUsed.length > 0) {
    nudges.push({
      id: makeId('soothe-high'),
      category: 'self_soothing',
      title: localizedText('Your calming toolkit', 'Tu kit de calma'),
      message: localizedText(
        `When intensity is high, "${profile.copingToolsUsed[0].label}" has been your most-used tool. Your patterns suggest it may work best in the 6–7 intensity range.`,
        `Cuando la intensidad sube, "${profile.copingToolsUsed[0].label}" ha sido tu herramienta más usada. Tus patrones sugieren que puede ayudar especialmente en el rango 6–7.`,
      ),
      supportingDetail: localizedText(
        'After intensity peaks, journaling may help process what happened. Different tools for different moments.',
        'Después del pico de intensidad, escribir puede ayudarte a procesar lo ocurrido. Hay herramientas distintas para momentos distintos.',
      ),
      suggestedAction: pickAction('self_soothing'),
      intensity: 'gentle',
      relevanceScore: 0.7,
      basedOn: ['coping_usage', 'intensity_levels'],
      createdAt: Date.now(),
    });
  }

  return nudges;
}

export function buildCoachingInsights(
  profile: MemoryProfile,
  graphSummary: GraphPatternSummary | null,
): CoachingInsight[] {
  const insights: CoachingInsight[] = [];

  const triggerChains = graphSummary?.topTriggerChains ?? [];
  triggerChains.slice(0, 3).forEach((chain: TriggerChain) => {
    const emotionLabels = chain.emotions.slice(0, 2).map(e => e.label.toLowerCase());
    const copingLabels = chain.copingTools.slice(0, 1).map(c => c.label);

    insights.push({
      id: makeId('insight-chain'),
      pattern: `${chain.trigger.label} → ${emotionLabels.join(', ')}`,
      observation: localizedText(
        `When "${chain.trigger.label}" happens, ${emotionLabels.join(' and ')} often follow.`,
        `Cuando aparece "${chain.trigger.label}", suelen aparecer estas emociones: ${emotionLabels.join(', ')}.`,
      ),
      suggestion: copingLabels.length > 0
        ? localizedText(`${copingLabels[0]} may help in these moments.`, `${copingLabels[0]} puede ayudar en esos momentos.`)
        : localizedText('A brief grounding pause may help interrupt the cycle.', 'Una pausa breve de anclaje puede ayudar a interrumpir el ciclo.'),
      category: 'emotional_regulation',
      confidence: chain.occurrences >= 5 ? 'high' : chain.occurrences >= 3 ? 'medium' : 'low',
    });
  });

  if (profile.messageUsage.totalPauses > 3 && profile.messageUsage.pauseSuccessRate > 50) {
    insights.push({
      id: makeId('insight-pause'),
      pattern: localizedText('Pause → Calmer response', 'Pausa → respuesta más calmada'),
      observation: localizedText(
        'Pausing before sending seems to consistently help you make calmer choices.',
        'Pausar antes de enviar parece ayudarte de forma constante a elegir con más calma.',
      ),
      suggestion: localizedText(
        'Consider making the pause a default habit, even when urgency feels low.',
        'Considera convertir la pausa en un hábito, incluso cuando la urgencia parezca baja.',
      ),
      category: 'pause_training',
      confidence: 'high',
    });
  }

  const calmingPatterns = graphSummary?.mostEffectiveCalming ?? [];
  calmingPatterns.slice(0, 2).forEach((cp: CalmingPattern) => {
    insights.push({
      id: makeId('insight-calming'),
      pattern: `${cp.emotion} → ${cp.copingTool}`,
      observation: cp.narrative,
      suggestion: localizedText(
        `Keep ${cp.copingTool.toLowerCase()} easily accessible for moments of ${cp.emotion.toLowerCase()}.`,
        `Mantén ${cp.copingTool.toLowerCase()} fácil de usar cuando aparezca esa emoción.`,
      ),
      category: 'self_soothing',
      confidence: cp.timesUsed >= 4 ? 'high' : 'medium',
    });
  });

  return insights;
}

export function buildCoachingWins(
  profile: MemoryProfile,
  graphSummary: GraphPatternSummary | null,
): CoachingWin[] {
  const wins: CoachingWin[] = [];

  if (profile.intensityTrend === 'falling') {
    wins.push({
      id: makeId('win-intensity'),
      description: localizedText(
        'Your average distress intensity is trending downward.',
        'Tu intensidad promedio de malestar va bajando.',
      ),
      metric: 'distress_trend',
      changeDirection: 'positive',
      category: 'emotional_regulation',
    });
  }

  if (profile.messageUsage.totalPauses > 0) {
    wins.push({
      id: makeId('win-pause'),
      description: localizedText(
        `You've paused before reacting ${profile.messageUsage.totalPauses} time${profile.messageUsage.totalPauses !== 1 ? 's' : ''}. That takes real strength.`,
        `Has pausado antes de reaccionar ${profile.messageUsage.totalPauses} vez${profile.messageUsage.totalPauses !== 1 ? 'es' : ''}. Eso requiere mucha fuerza.`,
      ),
      metric: 'pause_count',
      changeDirection: 'positive',
      category: 'pause_training',
    });
  }

  if (profile.copingSuccessRate >= 50) {
    wins.push({
      id: makeId('win-coping'),
      description: localizedText(
        'You\'re managing emotions effectively more often than not.',
        'Estás manejando emociones de forma efectiva con más frecuencia que antes.',
      ),
      metric: 'coping_success',
      changeDirection: 'positive',
      category: 'emotional_regulation',
    });
  }

  if (profile.messageUsage.totalRewrites > 3) {
    wins.push({
      id: makeId('win-rewrite'),
      description: localizedText(
        'You\'re consistently choosing to rewrite messages before sending. That\'s mindful communication.',
        'Estás eligiendo reescribir mensajes antes de enviarlos con constancia. Eso es comunicación consciente.',
      ),
      metric: 'rewrite_count',
      changeDirection: 'positive',
      category: 'communication',
    });
  }

  const growthSignals = graphSummary?.growthSignals ?? [];
  growthSignals.filter(g => g.direction === 'improving').forEach(g => {
    wins.push({
      id: makeId('win-growth'),
      description: g.narrative,
      metric: g.metric,
      changeDirection: 'positive',
      category: 'emotional_regulation',
    });
  });

  return wins;
}

export function buildMessageCoachingNudge(
  profile: MemoryProfile,
  _graphSummary: GraphPatternSummary | null,
): CoachingNudge | null {
  const hasRelTrigger = profile.topTriggers.some(t =>
    t.label.toLowerCase().includes('abandon') ||
    t.label.toLowerCase().includes('reject') ||
    t.label.toLowerCase().includes('uncertain') ||
    t.label.toLowerCase().includes('ignored')
  );

  if (hasRelTrigger && profile.messageUsage.totalRewrites > 0) {
    return {
      id: makeId('msg-nudge'),
      category: 'communication',
      title: localizedText('Before you write', 'Antes de escribir'),
      message: localizedText(
        'You often use message support when feeling emotionally activated. That may be a strong moment to slow down and choose a secure tone.',
        'A menudo usas apoyo de mensajes cuando estás emocionalmente activado/a. Ese puede ser un buen momento para bajar el ritmo y elegir un tono seguro.',
      ),
      suggestedAction: pickAction('communication'),
      intensity: 'gentle',
      relevanceScore: 0.8,
      basedOn: ['trigger_patterns', 'message_usage'],
      createdAt: Date.now(),
    };
  }

  if (profile.messageUsage.totalPauses > 0) {
    return {
      id: makeId('msg-pause-nudge'),
      category: 'pause_training',
      title: localizedText('A gentle reminder', 'Un recordatorio suave'),
      message: localizedText(
        'Pausing has helped you before. Consider taking a breath before writing this message.',
        'Pausar ya te ha ayudado antes. Considera respirar antes de escribir este mensaje.',
      ),
      suggestedAction: pickAction('pause_training'),
      intensity: 'gentle',
      relevanceScore: 0.6,
      basedOn: ['pause_history'],
      createdAt: Date.now(),
    };
  }

  return null;
}
