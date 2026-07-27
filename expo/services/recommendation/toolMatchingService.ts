import {
  SmartRecommendation,
  RecommendationToolId,
  RecommendationSignal,
  RecommendationUrgency,
  UserContextSnapshot,
} from '@/types/smartRecommendation';
import { localizedText } from '@/lib/i18n/staticText';

interface ToolCandidate {
  toolId: RecommendationToolId;
  title: string;
  route: string;
  icon: string;
  signals: RecommendationSignal[];
  urgency: RecommendationUrgency;
  message: string;
  reason: string;
  baseScore: number;
  contextTags: string[];
}

function generateId(toolId: string, signal: string): string {
  return `sr_${toolId}_${signal}_${Date.now()}`;
}

function matchRelationshipDistress(ctx: UserContextSnapshot): ToolCandidate[] {
  const candidates: ToolCandidate[] = [];

  if (!ctx.isRelationshipActivated && ctx.latestTriggerCategory !== 'relationship') {
    return candidates;
  }

  if (ctx.recentRewriteCount > 0 || ctx.recentDraftCount >= 2) {
    candidates.push({
      toolId: 'message_guard',
      title: localizedText('Message Guard', 'Protector de mensajes'),
      route: '/message-guard',
      icon: 'Shield',
      signals: ['relationship_distress', 'frequent_messaging'],
      urgency: ctx.distressLevel >= 7 ? 'immediate' : 'suggested',
      message: localizedText(
        'Pausing before sending may protect your peace right now.',
        'Pausar antes de enviar puede proteger tu paz ahora mismo.',
      ),
      reason: localizedText(
        'Relationship stress and messaging activity detected',
        'Estrés relacional y actividad de mensajes detectados',
      ),
      baseScore: 85,
      contextTags: ['relationship', 'messaging'],
    });
  }

  candidates.push({
    toolId: 'relationship_copilot',
    title: localizedText('Relationship Copilot', 'Copiloto de relaciones'),
    route: '/relationship-copilot',
    icon: 'Heart',
    signals: ['relationship_distress'],
    urgency: ctx.distressLevel >= 7 ? 'immediate' : 'suggested',
    message: localizedText(
      'This may help you work through what\'s happening.',
      'Esto puede ayudarte a procesar lo que está pasando.',
    ),
    reason: localizedText('Relationship distress seems active', 'El malestar relacional parece activo'),
    baseScore: 80,
    contextTags: ['relationship'],
  });

  return candidates;
}

function matchHighActivation(ctx: UserContextSnapshot): ToolCandidate[] {
  const candidates: ToolCandidate[] = [];

  if (ctx.distressLevel < 7 && !ctx.hasHighUrges) return candidates;

  if (ctx.distressLevel >= 8 || ctx.hasHighUrges) {
    candidates.push({
      toolId: 'crisis_regulation',
      title: localizedText('Crisis Regulation', 'Regulación en crisis'),
      route: '/crisis-regulation',
      icon: 'Shield',
      signals: ['high_distress'],
      urgency: 'immediate',
      message: localizedText(
        'Your distress is very high. This can help you regulate step by step.',
        'Tu malestar está muy alto. Esto puede ayudarte a regularte paso a paso.',
      ),
      reason: localizedText('Very high distress detected', 'Malestar muy alto detectado'),
      baseScore: 95,
      contextTags: ['crisis', 'regulation'],
    });
  }

  candidates.push({
    toolId: 'guided_regulation',
    title: localizedText('Guided Regulation', 'Regulación guiada'),
    route: '/guided-regulation',
    icon: 'Wind',
    signals: ['high_activation'],
    urgency: ctx.distressLevel >= 8 ? 'immediate' : 'suggested',
    message: localizedText(
      'A guided regulation can help bring the intensity down.',
      'Una regulación guiada puede ayudar a bajar la intensidad.',
    ),
    reason: localizedText('Elevated activation detected', 'Activación elevada detectada'),
    baseScore: 78,
    contextTags: ['regulation'],
  });

  candidates.push({
    toolId: 'breathing_exercise',
    title: localizedText('Breathing Exercise', 'Ejercicio de respiración'),
    route: '/exercise?id=c1',
    icon: 'Wind',
    signals: ['high_activation'],
    urgency: 'suggested',
    message: localizedText(
      'A few deep breaths may help settle your nervous system.',
      'Unas respiraciones profundas pueden ayudar a calmar tu sistema nervioso.',
    ),
    reason: localizedText('Distress is elevated', 'El malestar está elevado'),
    baseScore: 70,
    contextTags: ['grounding', 'quick'],
  });

  return candidates;
}

function matchShameAfterConflict(ctx: UserContextSnapshot): ToolCandidate[] {
  const shameEmotions = ['Ashamed', 'Guilty', 'Regretful', 'Embarrassed'];
  const conflictTriggers = ['conflict', 'argument', 'fight'];

  const hasShame = ctx.topEmotionsThisWeek.some(e =>
    shameEmotions.some(s => e.toLowerCase().includes(s.toLowerCase()))
  );
  const hasConflict = ctx.topTriggersThisWeek.some(t =>
    conflictTriggers.some(c => t.toLowerCase().includes(c.toLowerCase()))
  ) || ctx.latestTriggerCategory === 'relationship';

  if (!hasShame || !hasConflict) return [];

  return [{
    toolId: 'conflict_reflection',
    title: localizedText('After-Conflict Reflection', 'Reflexión después del conflicto'),
    route: '/conflict-replay',
    icon: 'BookOpen',
    signals: ['shame_after_conflict'],
    urgency: 'suggested',
    message: localizedText(
      'Processing what happened can ease the weight you\'re carrying.',
      'Procesar lo que pasó puede aliviar el peso que estás cargando.',
    ),
    reason: localizedText('Shame after a recent conflict', 'Vergüenza después de un conflicto reciente'),
    baseScore: 72,
    contextTags: ['conflict', 'reflection'],
  }];
}

function matchTherapyContext(ctx: UserContextSnapshot): ToolCandidate[] {
  const candidates: ToolCandidate[] = [];

  if (!ctx.hasUpcomingAppointment) return candidates;

  if (ctx.appointmentWithinHours !== null && ctx.appointmentWithinHours <= 24) {
    candidates.push({
      toolId: 'therapy_prep',
      title: localizedText('Therapy Prep', 'Preparación para terapia'),
      route: '/appointments',
      icon: 'FileText',
      signals: ['pre_therapy'],
      urgency: ctx.appointmentWithinHours <= 4 ? 'immediate' : 'suggested',
      message: localizedText(
        'Your appointment is coming up. Preparing can make it more productive.',
        'Tu cita se acerca. Prepararte puede hacerla más útil.',
      ),
      reason: localizedText(
        `Appointment within ${ctx.appointmentWithinHours <= 4 ? 'a few hours' : '24 hours'}`,
        `Cita dentro de ${ctx.appointmentWithinHours <= 4 ? 'unas horas' : '24 horas'}`,
      ),
      baseScore: ctx.appointmentWithinHours <= 4 ? 88 : 68,
      contextTags: ['therapy', 'preparation'],
    });
  }

  return candidates;
}

function matchMedicationContext(ctx: UserContextSnapshot): ToolCandidate[] {
  const candidates: ToolCandidate[] = [];

  if (ctx.hasMissedMedication && ctx.distressLevel >= 5) {
    candidates.push({
      toolId: 'medication_log',
      title: localizedText('Log Medication', 'Registrar medicamento'),
      route: '/medications',
      icon: 'Pill',
      signals: ['missed_medication'],
      urgency: 'suggested',
      message: localizedText(
        'A missed medication was noted. Logging it may help track the connection.',
        'Se registró una dosis omitida. Anotarla puede ayudar a ver la conexión.',
      ),
      reason: localizedText('Missed medication with elevated distress', 'Medicamento omitido con malestar elevado'),
      baseScore: 65,
      contextTags: ['medication', 'tracking'],
    });
  } else if (ctx.hasMedicationDue) {
    candidates.push({
      toolId: 'medication_log',
      title: localizedText('Medication Due', 'Medicamento pendiente'),
      route: '/medications',
      icon: 'Pill',
      signals: ['medication_due'],
      urgency: 'gentle',
      message: localizedText(
        'You have a medication due. A quick log keeps things on track.',
        'Tienes un medicamento pendiente. Un registro rápido ayuda a mantener el seguimiento.',
      ),
      reason: localizedText('Medication is due', 'Hay un medicamento pendiente'),
      baseScore: 45,
      contextTags: ['medication'],
    });
  }

  return candidates;
}

function matchDailyRoutine(ctx: UserContextSnapshot): ToolCandidate[] {
  const candidates: ToolCandidate[] = [];

  if (ctx.recentCheckInCount === 0) {
    candidates.push({
      toolId: 'check_in',
      title: localizedText('Daily Check-In', 'Registro diario'),
      route: '/check-in',
      icon: 'Heart',
      signals: ['no_check_in_today'],
      urgency: 'gentle',
      message: localizedText(
        'Start your day with a quick emotional check-in.',
        'Empieza tu día con un registro emocional breve.',
      ),
      reason: localizedText('No check-in recorded recently', 'No hay registros recientes'),
      baseScore: 55,
      contextTags: ['routine', 'check-in'],
    });
  }

  if (ctx.recentMovementCount === 0 && ctx.distressLevel >= 4) {
    candidates.push({
      toolId: 'movement_log',
      title: localizedText('Calming Movement', 'Movimiento calmante'),
      route: '/movement-log',
      icon: 'Activity',
      signals: ['no_movement_recent'],
      urgency: 'gentle',
      message: localizedText(
        'Movement tends to help on harder days. Even a short walk counts.',
        'El movimiento suele ayudar en días difíciles. Incluso una caminata breve cuenta.',
      ),
      reason: localizedText('No recent movement and elevated distress', 'Sin movimiento reciente y malestar elevado'),
      baseScore: 40,
      contextTags: ['movement', 'regulation'],
    });
  }

  return candidates;
}

function matchEmotionalOverwhelm(ctx: UserContextSnapshot): ToolCandidate[] {
  const overwhelmEmotions = ['Overwhelmed', 'Desperate', 'Panicked', 'Afraid'];
  const hasOverwhelm = ctx.topEmotionsThisWeek.some(e =>
    overwhelmEmotions.some(o => e.toLowerCase().includes(o.toLowerCase()))
  ) || ctx.latestEmotion?.toLowerCase().includes('overwhelm');

  if (!hasOverwhelm && ctx.distressLevel < 6) return [];

  const candidates: ToolCandidate[] = [];

  if (hasOverwhelm || ctx.distressLevel >= 6) {
    candidates.push({
      toolId: 'companion',
      title: localizedText('Talk It Through', 'Hablarlo con calma'),
      route: '/(tabs)/companion',
      icon: 'MessageCircle',
      signals: ['emotional_overwhelm'],
      urgency: 'suggested',
      message: localizedText(
        'Sometimes talking through what\'s happening can bring clarity.',
        'A veces hablar lo que ocurre puede traer claridad.',
      ),
      reason: localizedText('Emotional overwhelm detected', 'Sobrecarga emocional detectada'),
      baseScore: 62,
      contextTags: ['companion', 'support'],
    });
  }

  if (ctx.distressLevel >= 5) {
    candidates.push({
      toolId: 'grounding_exercise',
      title: localizedText('5-4-3-2-1 Grounding', 'Conexión 5-4-3-2-1'),
      route: '/exercise?id=c1',
      icon: 'Anchor',
      signals: ['emotional_overwhelm'],
      urgency: 'suggested',
      message: localizedText(
        'Grounding can help bring you back to the present moment.',
        'La conexión a tierra puede ayudarte a volver al momento presente.',
      ),
      reason: localizedText('Elevated emotional intensity', 'Intensidad emocional elevada'),
      baseScore: 68,
      contextTags: ['grounding', 'quick'],
    });
  }

  return candidates;
}

function matchRepeatedTrigger(ctx: UserContextSnapshot): ToolCandidate[] {
  if (ctx.topTriggersThisWeek.length === 0) return [];

  const topTrigger = ctx.topTriggersThisWeek[0];

  return [{
    toolId: 'learn_article',
    title: localizedText('Understand This Pattern', 'Entender este patrón'),
    route: '/(tabs)/learn',
    icon: 'BookOpen',
    signals: ['repeated_trigger'],
    urgency: 'gentle',
    message: localizedText(
      `"${topTrigger}" keeps coming up. Learning about it may help.`,
      `"${topTrigger}" sigue apareciendo. Aprender sobre esto puede ayudar.`,
    ),
    reason: localizedText(`Recurring trigger: ${topTrigger}`, `Detonante recurrente: ${topTrigger}`),
    baseScore: 42,
    contextTags: ['learning', 'patterns'],
  }];
}

function matchCalmGrowth(ctx: UserContextSnapshot): ToolCandidate[] {
  if (ctx.emotionalZone !== 'calm' && ctx.emotionalZone !== 'recovering') return [];

  const candidates: ToolCandidate[] = [];

  if (ctx.journalStreakDays >= 2) {
    candidates.push({
      toolId: 'weekly_reflection',
      title: localizedText('Weekly Reflection', 'Reflexión semanal'),
      route: '/weekly-reflection',
      icon: 'BookOpen',
      signals: ['growth_opportunity'],
      urgency: 'gentle',
      message: localizedText(
        'A good moment to reflect on how the week has been.',
        'Un buen momento para reflexionar sobre cómo estuvo la semana.',
      ),
      reason: localizedText('Consistent check-ins this week', 'Registros constantes esta semana'),
      baseScore: 48,
      contextTags: ['reflection', 'growth'],
    });
  }

  candidates.push({
    toolId: 'daily_ritual',
    title: localizedText('Daily Ritual', 'Ritual diario'),
    route: '/daily-ritual',
    icon: 'Sparkles',
    signals: ['calm_state'],
    urgency: 'gentle',
    message: localizedText(
      'A calm moment for your daily practice.',
      'Un momento tranquilo para tu práctica diaria.',
    ),
    reason: localizedText('A peaceful time for consistency', 'Un momento tranquilo para sostener constancia'),
    baseScore: 38,
    contextTags: ['routine', 'stability'],
  });

  return candidates;
}

function matchAbandonmentFear(ctx: UserContextSnapshot): ToolCandidate[] {
  const abandonmentEmotions = ['Abandoned', 'Rejected', 'Alone', 'Unwanted'];
  const hasAbandonment = ctx.topEmotionsThisWeek.some(e =>
    abandonmentEmotions.some(a => e.toLowerCase().includes(a.toLowerCase()))
  ) || ctx.latestEmotion?.toLowerCase().includes('abandon');

  if (!hasAbandonment) return [];

  return [
    {
      toolId: 'reality_check',
      title: localizedText('Check the Facts', 'Comprobar los hechos'),
      route: '/exercise?id=c5',
      icon: 'Search',
      signals: ['abandonment_fear'],
      urgency: 'suggested',
      message: localizedText(
        'When fear of abandonment is strong, checking facts can offer perspective.',
        'Cuando el miedo al abandono está fuerte, comprobar los hechos puede dar perspectiva.',
      ),
      reason: localizedText('Abandonment-related feelings detected', 'Sentimientos relacionados con abandono detectados'),
      baseScore: 66,
      contextTags: ['abandonment', 'dbt'],
    },
    {
      toolId: 'companion',
      title: localizedText('Talk About It', 'Hablar de esto'),
      route: '/(tabs)/companion',
      icon: 'MessageCircle',
      signals: ['abandonment_fear'],
      urgency: 'suggested',
      message: localizedText(
        'Your Companion can help explore what\'s behind this feeling.',
        'Tu Companion puede ayudarte a explorar qué hay detrás de esta emoción.',
      ),
      reason: localizedText('Abandonment fear is active', 'El miedo al abandono está activo'),
      baseScore: 58,
      contextTags: ['companion', 'abandonment'],
    },
  ];
}

function matchLateNight(ctx: UserContextSnapshot): ToolCandidate[] {
  if (!ctx.isLateNight) return [];

  const candidates: ToolCandidate[] = [];

  if (ctx.distressLevel >= 5) {
    candidates.push({
      toolId: 'self_soothe',
      title: localizedText('Self-Soothe', 'Autoconsuelo'),
      route: '/exercise?id=c3',
      icon: 'Heart',
      signals: ['late_night'],
      urgency: 'suggested',
      message: localizedText(
        'Late-night distress is harder. Be gentle with yourself.',
        'El malestar de noche suele sentirse más difícil. Trátate con gentileza.',
      ),
      reason: localizedText('Late night with elevated distress', 'Noche con malestar elevado'),
      baseScore: 64,
      contextTags: ['night', 'soothing'],
    });
  }

  if (ctx.recentDraftCount > 0) {
    candidates.push({
      toolId: 'pause_mode',
      title: localizedText('Pause Mode', 'Modo pausa'),
      route: '/message-guard',
      icon: 'Timer',
      signals: ['late_night', 'frequent_messaging'],
      urgency: 'immediate',
      message: localizedText(
        'Late-night messages often feel different in the morning. Pause first.',
        'Los mensajes de noche suelen sentirse distintos por la mañana. Pausa primero.',
      ),
      reason: localizedText('Late night messaging activity', 'Actividad de mensajes durante la noche'),
      baseScore: 82,
      contextTags: ['night', 'messaging', 'pause'],
    });
  }

  return candidates;
}

export function matchToolsToContext(ctx: UserContextSnapshot): ToolCandidate[] {
  console.log('[ToolMatching] Matching tools for zone:', ctx.emotionalZone, 'distress:', ctx.distressLevel);

  const allCandidates: ToolCandidate[] = [
    ...matchHighActivation(ctx),
    ...matchRelationshipDistress(ctx),
    ...matchLateNight(ctx),
    ...matchShameAfterConflict(ctx),
    ...matchAbandonmentFear(ctx),
    ...matchEmotionalOverwhelm(ctx),
    ...matchTherapyContext(ctx),
    ...matchMedicationContext(ctx),
    ...matchDailyRoutine(ctx),
    ...matchRepeatedTrigger(ctx),
    ...matchCalmGrowth(ctx),
  ];

  console.log('[ToolMatching] Found', allCandidates.length, 'raw candidates');
  return allCandidates;
}

export function candidatesToRecommendations(candidates: ToolCandidate[]): SmartRecommendation[] {
  return candidates.map(c => ({
    id: generateId(c.toolId, c.signals[0]),
    toolId: c.toolId,
    title: c.title,
    message: c.message,
    route: c.route,
    icon: c.icon,
    urgency: c.urgency,
    signal: c.signals[0],
    reason: c.reason,
    score: c.baseScore,
    contextTags: c.contextTags,
  }));
}
