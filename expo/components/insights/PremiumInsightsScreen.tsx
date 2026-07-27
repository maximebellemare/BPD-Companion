import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Heart,
  Lock,
  MessageCircle,
  Pill,
  Sparkles,
  Target,
  Users,
  Wind,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { useAICompanion } from '@/providers/AICompanionProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { JournalEntry } from '@/types';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useMedications } from '@/providers/MedicationProvider';
import { useAppointments } from '@/providers/AppointmentProvider';
import { useRelationships } from '@/hooks/useRelationships';
import { APPOINTMENT_TYPE_LABELS, formatAppointmentDate, formatAppointmentTime } from '@/types/appointment';
import {
  loadSavedCompanionInsights,
  SavedCompanionInsight,
  deleteCompanionInsight,
} from '@/services/companion/companionInsightService';
import { buildRelationshipIntelligence } from '@/services/relationships/relationshipIntelligenceService';
import { RELATIONSHIP_TYPE_META } from '@/types/relationship';
import {
  AhaMoment,
  FavoriteAhaMoment,
  generateAhaMoments,
  loadFavoriteAhaMoments,
  removeFavoriteAhaMoment,
  saveFavoriteAhaMoment,
} from '@/services/insights/ahaMomentsService';
import {
  EmotionalStabilityScoreReport,
  generateEmotionalStabilityScore,
} from '@/services/insights/emotionalStabilityScoreService';
import {
  CalmMeDownSession,
  CalmMeDownSummary,
  loadCalmMeDownSessions,
  summarizeCalmMeDownSessions,
} from '@/services/calm/calmSessionService';
import { useRewards } from '@/providers/RewardsProvider';
import { ConsistencyMetrics, MilestoneDefinition } from '@/types/reward';
import { localizedText } from '@/lib/i18n/staticText';
import { useLanguage } from '@/hooks/useLanguage';

type CountItem = {
  label: string;
  count: number;
};

type InsightStage = 'forming' | 'early' | 'full';
type EducationalInsight = {
  title: string;
  value: string;
  why: string;
  watchFor: string[];
  nextStep: string;
  actionLabel: string;
  route: string;
  icon: React.ReactNode;
};

const FIRST_INSIGHT_COUNT = 3;
const FULL_INSIGHT_COUNT = 7;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isSameLocalDay(a: number, b: number): boolean {
  const first = new Date(a);
  const second = new Date(b);
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function countLabels(labels: string[]): CountItem[] {
  const counts = new Map<string, number>();
  for (const label of labels) {
    const clean = label.trim();
    if (!clean) continue;
    counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function averageIntensity(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, entry) => sum + entry.checkIn.intensityLevel, 0) / entries.length;
}

function includesAny(text: string, words: string[]): boolean {
  return words.some(word => text.includes(word));
}

function getSignalCounts(entries: JournalEntry[]) {
  const counts = {
    relationship: 0,
    abandonment: 0,
    conflict: 0,
    rejected: 0,
    sleep: 0,
    highIntensityWithSleep: 0,
    calm: 0,
    connected: 0,
    goodSleep: 0,
    exercise: 0,
    supportiveConversation: 0,
    positiveAfterSleep: 0,
    positiveAfterConnection: 0,
    positiveAfterExercise: 0,
  };

  for (const entry of entries) {
    const triggerText = entry.checkIn.triggers.map(trigger => normalize(trigger.label)).join(' ');
    const emotionText = entry.checkIn.emotions.map(emotion => normalize(emotion.label)).join(' ');
    const notesText = normalize(entry.checkIn.notes ?? '');
    const allText = `${triggerText} ${emotionText} ${notesText}`;

    if (entry.checkIn.triggers.some(trigger => trigger.category === 'relationship') ||
      includesAny(allText, ['relationship', 'partner', 'boyfriend', 'girlfriend', 'friend', 'ignored'])) {
      counts.relationship += 1;
    }
    if (includesAny(allText, ['abandon', 'leaving', 'left me', 'forgotten'])) counts.abandonment += 1;
    if (includesAny(allText, ['conflict', 'fight', 'argument', 'criticism'])) counts.conflict += 1;
    if (includesAny(allText, ['reject', 'rejected', 'dismissed'])) counts.rejected += 1;
    if (includesAny(allText, ['sleep', 'tired', 'exhausted', 'insomnia'])) {
      counts.sleep += 1;
      if (entry.checkIn.intensityLevel >= 7) counts.highIntensityWithSleep += 1;
    }
    const positiveEmotion = includesAny(emotionText, ['calm', 'hopeful', 'proud', 'grateful', 'happy', 'connected', 'motivated', 'okay']);
    if (includesAny(emotionText, ['calm', 'okay'])) counts.calm += 1;
    if (includesAny(emotionText, ['connected', 'grateful', 'happy'])) counts.connected += 1;
    if (includesAny(triggerText, ['good sleep'])) counts.goodSleep += 1;
    if (includesAny(triggerText, ['exercise'])) counts.exercise += 1;
    if (includesAny(triggerText, ['supportive conversation', 'felt connected'])) counts.supportiveConversation += 1;
    if (positiveEmotion && includesAny(triggerText, ['good sleep'])) counts.positiveAfterSleep += 1;
    if (positiveEmotion && includesAny(triggerText, ['supportive conversation', 'felt connected'])) counts.positiveAfterConnection += 1;
    if (positiveEmotion && includesAny(triggerText, ['exercise'])) counts.positiveAfterExercise += 1;
  }

  return counts;
}

function getSuggestedFocus(params: {
  topEmotion: CountItem | null;
  topTrigger: CountItem | null;
  average: number;
  signalCounts: ReturnType<typeof getSignalCounts>;
}): string {
  const { topEmotion, topTrigger, average, signalCounts } = params;
  if (signalCounts.positiveAfterSleep >= 2) return localizedText('Protect sleep when you can. Calm or positive check-ins often appear after good sleep.', 'Protege tu descanso cuando puedas. Los check-ins tranquilos o positivos suelen aparecer despues de dormir bien.');
  if (signalCounts.positiveAfterConnection >= 2) return localizedText('Notice supportive connection. It appears to help positive or grounded states show up.', 'Observa las conexiones que te apoyan. Parecen ayudar a que aparezcan estados mas positivos o estables.');
  if (signalCounts.positiveAfterExercise >= 2) return localizedText('Movement may be worth keeping close. Exercise appears near positive check-ins.', 'El movimiento puede ser un apoyo importante. El ejercicio aparece cerca de check-ins positivos.');
  if (average >= 7) return localizedText('Start with calming tools before deeper reflection for the next few check-ins.', 'Empieza con herramientas de calma antes de reflexionar mas a fondo en tus proximos check-ins.');
  if (signalCounts.relationship >= 2 || signalCounts.abandonment >= 2 || signalCounts.conflict >= 2) {
    return localizedText('Watch relationship moments closely and pause before texting or reacting.', 'Observa de cerca los momentos de relacion y haz una pausa antes de escribir o reaccionar.');
  }
  if (topTrigger) return localizedText(`Track "${topTrigger.label}" closely for the next few days.`, `Observa de cerca "${topTrigger.label}" durante los proximos dias.`);
  if (topEmotion) return localizedText(`Notice what tends to happen before "${topEmotion.label}" shows up.`, `Observa que suele pasar antes de que aparezca "${topEmotion.label}".`);
  return localizedText('Keep checking in once a day so your first pattern has enough signal.', 'Sigue haciendo un check-in al dia para que tu primer patron tenga suficiente informacion.');
}

function buildPatternSentences(params: {
  stage: InsightStage;
  topEmotion: CountItem | null;
  topTrigger: CountItem | null;
  signalCounts: ReturnType<typeof getSignalCounts>;
  average: number;
}): string[] {
  const { stage, topEmotion, topTrigger, signalCounts, average } = params;
  if (stage === 'forming') return [];

  const patterns: string[] = [];
  if (topEmotion && topTrigger) {
    patterns.push(localizedText(`Based on your check-ins, ${topEmotion.label.toLowerCase()} appears most often when ${topTrigger.label.toLowerCase()} is present.`, `Segun tus check-ins, ${topEmotion.label.toLowerCase()} aparece con mas frecuencia cuando ${topTrigger.label.toLowerCase()} esta presente.`));
  } else if (topEmotion) {
    patterns.push(localizedText(`${topEmotion.label} appears most often in your recent entries.`, `${topEmotion.label} aparece con mas frecuencia en tus entradas recientes.`));
  } else if (topTrigger) {
    patterns.push(localizedText(`${topTrigger.label} appears most often as a trigger in your recent entries.`, `${topTrigger.label} aparece con mas frecuencia como disparador en tus entradas recientes.`));
  }

  if (signalCounts.rejected > 0) {
    patterns.push(localizedText(`Feeling rejected has appeared in ${signalCounts.rejected} recent entr${signalCounts.rejected === 1 ? 'y' : 'ies'}.`, `Sentirte rechazado/a aparecio en ${signalCounts.rejected} entrada${signalCounts.rejected === 1 ? '' : 's'} reciente${signalCounts.rejected === 1 ? '' : 's'}.`));
  }
  if (signalCounts.relationship >= 2) {
    patterns.push(localizedText(`Relationship stress appears in ${signalCounts.relationship} recent check-ins.`, `El estres relacional aparece en ${signalCounts.relationship} check-ins recientes.`));
  }
  if (signalCounts.abandonment >= 2) {
    patterns.push(localizedText(`Abandonment-related language appears in ${signalCounts.abandonment} entries.`, `El lenguaje relacionado con abandono aparece en ${signalCounts.abandonment} entradas.`));
  }
  if (signalCounts.conflict >= 2) {
    patterns.push(localizedText('Conflict shows up repeatedly enough to watch for the next few days.', 'El conflicto aparece con suficiente frecuencia como para observarlo durante los proximos dias.'));
  }
  if (signalCounts.highIntensityWithSleep >= 1) {
    patterns.push(localizedText('High intensity check-ins are more common when sleep or exhaustion is mentioned.', 'Los check-ins de alta intensidad son mas comunes cuando se menciona sueno o agotamiento.'));
  }
  if (signalCounts.positiveAfterSleep >= 2) {
    patterns.push(localizedText(`Calm or positive days often appear after good sleep in ${signalCounts.positiveAfterSleep} recent check-ins.`, `Los dias tranquilos o positivos suelen aparecer despues de dormir bien en ${signalCounts.positiveAfterSleep} check-ins recientes.`));
  }
  if (signalCounts.positiveAfterConnection >= 2) {
    patterns.push(localizedText(`You felt more connected or positive after supportive conversations in ${signalCounts.positiveAfterConnection} recent check-ins.`, `Te sentiste mas conectado/a o positivo/a despues de conversaciones de apoyo en ${signalCounts.positiveAfterConnection} check-ins recientes.`));
  }
  if (signalCounts.positiveAfterExercise >= 2) {
    patterns.push(localizedText(`Exercise appeared on ${signalCounts.positiveAfterExercise} positive check-ins.`, `El ejercicio aparecio en ${signalCounts.positiveAfterExercise} check-ins positivos.`));
  }
  const hasPositivePattern =
    signalCounts.positiveAfterSleep >= 2 ||
    signalCounts.positiveAfterConnection >= 2 ||
    signalCounts.positiveAfterExercise >= 2;

  if (average >= 7 && !hasPositivePattern) {
    patterns.push(localizedText('Your recent intensity average is high, so calming first may help before trying to analyze.', 'Tu promedio de intensidad reciente es alto, asi que calmarte primero puede ayudar antes de analizar.'));
  }

  return patterns.slice(0, stage === 'full' ? 5 : 3);
}

function getStage(checkInCount: number): InsightStage {
  if (checkInCount < FIRST_INSIGHT_COUNT) return 'forming';
  if (checkInCount < FULL_INSIGHT_COUNT) return 'early';
  return 'full';
}

function getEmotionEducation(label: string): Pick<EducationalInsight, 'why' | 'watchFor' | 'nextStep' | 'actionLabel' | 'route'> {
  const emotion = normalize(label);
  if (includesAny(emotion, ['calm', 'hopeful', 'proud', 'grateful', 'happy', 'connected', 'motivated', 'okay'])) {
    return {
      why: localizedText('Positive and grounded states matter too. Tracking them helps you learn what supports regulation, connection, and a steadier baseline.', 'Los estados positivos y estables tambien importan. Registrarlos te ayuda a aprender que apoya la regulacion, la conexion y una base mas estable.'),
      watchFor: localizedText('en', 'es') === 'es' ? ['que paso antes de esto', 'que ayudo a que tu cuerpo se calmara', 'quien o que sostuvo esa sensacion'] : ['what happened before this', 'what helped your body settle', 'who or what supported the feeling'],
      nextStep: localizedText('Notice what influenced this state so you can repeat supportive conditions when possible.', 'Observa que influyo en este estado para repetir condiciones de apoyo cuando sea posible.'),
      actionLabel: localizedText('Reflect & Learn', 'Reflexiona y aprende'),
      route: '/reflect-and-learn',
    };
  }
  if (includesAny(emotion, ['anxious', 'anxiety', 'abandoned', 'rejected', 'overwhelmed'])) {
    return {
      why: localizedText('For many people with BPD traits, anxiety or rejection sensitivity can appear before emotional spirals, impulsive urges, or relationship conflict.', 'Para muchas personas con rasgos de TLP, la ansiedad o la sensibilidad al rechazo pueden aparecer antes de espirales emocionales, impulsos o conflictos relacionales.'),
      watchFor: localizedText('en', 'es') === 'es' ? ['buscar tranquilidad', 'enviar mensajes repetidos', 'anticipar lo peor'] : ['reassurance seeking', 'repeated texting', 'catastrophizing'],
      nextStep: localizedText('Talk it through with Companion before reacting.', 'Habla de esto con Companion antes de reaccionar.'),
      actionLabel: localizedText('Talk to Companion', 'Hablar con Companion'),
      route: '/(tabs)/companion',
    };
  }
  if (includesAny(emotion, ['angry', 'anger', 'triggered'])) {
    return {
      why: localizedText('Anger can sometimes be a signal that hurt, fear, shame, or a crossed boundary is underneath. Noticing it early can create space before reacting.', 'A veces el enojo senala que debajo hay dolor, miedo, verguenza o un limite cruzado. Notarlo temprano puede crear espacio antes de reaccionar.'),
      watchFor: localizedText('en', 'es') === 'es' ? ['escribir muy rapido', 'querer demostrar un punto', 'pensamientos de todo o nada'] : ['typing fast', 'wanting to prove a point', 'all-or-nothing thoughts'],
      nextStep: localizedText('Use Don’t Send It or pause before replying.', 'Usa No lo envies o haz una pausa antes de responder.'),
      actionLabel: localizedText('Open Don’t Send It', 'Abrir No lo envies'),
      route: '/dont-send-it',
    };
  }
  if (includesAny(emotion, ['sad', 'empty', 'numb', 'lonely', 'ashamed', 'shame'])) {
    return {
      why: localizedText('Low, empty, or shame-heavy emotions can make it harder to remember what is true and supportive. Naming them can reduce how alone they feel.', 'Las emociones bajas, vacias o cargadas de verguenza pueden hacer mas dificil recordar lo que es cierto y te apoya. Nombrarlas puede hacer que se sientan menos solas.'),
      watchFor: localizedText('en', 'es') === 'es' ? ['aislarte', 'culparte', 'asumir que otros estan molestos contigo'] : ['withdrawing', 'self-blame', 'assuming people are upset with you'],
      nextStep: localizedText('Write a short reflection or ask Companion to help name what happened.', 'Escribe una reflexion breve o pide a Companion que te ayude a nombrar lo que paso.'),
      actionLabel: localizedText('Reflect with Companion', 'Reflexionar con Companion'),
      route: '/(tabs)/companion',
    };
  }
  return {
    why: localizedText('Repeated emotions are useful signals. They can show what your nervous system keeps responding to, even when the situation changes.', 'Las emociones repetidas son senales utiles. Pueden mostrar a que sigue respondiendo tu sistema nervioso, incluso cuando la situacion cambia.'),
    watchFor: localizedText('en', 'es') === 'es' ? ['que paso antes', 'que impulso aparece despues', 'que ayuda a que pase'] : ['what happened before it', 'what urge follows it', 'what helps it pass'],
    nextStep: localizedText('Keep checking in so this pattern becomes clearer.', 'Sigue haciendo check-ins para que este patron se vuelva mas claro.'),
    actionLabel: localizedText('Check in today', 'Hacer check-in hoy'),
    route: '/(tabs)/(home)',
  };
}

function getTriggerEducation(label: string): Pick<EducationalInsight, 'why' | 'watchFor' | 'nextStep' | 'actionLabel' | 'route'> {
  const trigger = normalize(label);
  if (includesAny(trigger, ['good sleep', 'exercise', 'supportive conversation', 'felt connected', 'completed something', 'time outside', 'self-care', 'work progress', 'proud'])) {
    return {
      why: localizedText('Positive influences are part of your emotional map. They show what may help you feel more grounded, connected, or capable.', 'Las influencias positivas son parte de tu mapa emocional. Muestran que puede ayudarte a sentirte mas estable, conectado/a o capaz.'),
      watchFor: localizedText('en', 'es') === 'es' ? ['que hiciste antes del cambio positivo', 'que se sintio repetible', 'que apoyo estuvo presente'] : ['what you did before the positive shift', 'what felt repeatable', 'what support was present'],
      nextStep: localizedText('Save the influence and look for it again this week.', 'Guarda esta influencia y buscala de nuevo esta semana.'),
      actionLabel: localizedText('Check in today', 'Hacer check-in hoy'),
      route: '/(tabs)/(home)',
    };
  }
  if (includesAny(trigger, ['abandon', 'relationship', 'conflict', 'reply', 'ignored', 'criticism', 'family'])) {
    return {
      why: localizedText('Relationship triggers can feel urgent because connection and safety may feel uncertain in the moment. Tracking them helps you notice the pattern before the urge takes over.', 'Los disparadores relacionales pueden sentirse urgentes porque la conexion y la seguridad pueden sentirse inciertas en el momento. Registrarlos te ayuda a notar el patron antes de que el impulso tome el control.'),
      watchFor: localizedText('en', 'es') === 'es' ? ['revisar el telefono repetidamente', 'leer la mente', 'enviar un mensaje mas'] : ['checking your phone repeatedly', 'mind-reading', 'sending one more message'],
      nextStep: localizedText('Pause and talk through the trigger before choosing what to do.', 'Haz una pausa y habla del disparador antes de elegir que hacer.'),
      actionLabel: localizedText('Talk to Companion', 'Hablar con Companion'),
      route: '/(tabs)/companion',
    };
  }
  if (includesAny(trigger, ['sleep', 'tired', 'exhausted'])) {
    return {
      why: localizedText('Sleep disruption can make emotions feel sharper and coping feel harder. This does not explain everything, but it is worth watching.', 'Dormir mal puede hacer que las emociones se sientan mas intensas y que regularte cueste mas. No lo explica todo, pero vale la pena observarlo.'),
      watchFor: localizedText('en', 'es') === 'es' ? ['menos paciencia', 'suposiciones mas fuertes', 'reacciones mas intensas'] : ['lower patience', 'stronger assumptions', 'more intense reactions'],
      nextStep: localizedText('Choose a calming tool before analyzing the situation.', 'Elige una herramienta de calma antes de analizar la situacion.'),
      actionLabel: localizedText('Open Calm Me Down', 'Abrir Calmarme'),
      route: '/grounding-mode',
    };
  }
  if (includesAny(trigger, ['work', 'money'])) {
    return {
      why: localizedText('Practical stress can raise baseline tension, making emotional moments feel harder to regulate later.', 'El estres practico puede subir la tension de base y hacer que los momentos emocionales sean mas dificiles de regular despues.'),
      watchFor: localizedText('en', 'es') === 'es' ? ['rumiacion', 'evitacion', 'decisiones impulsivas'] : ['rumination', 'avoidance', 'snap decisions'],
      nextStep: localizedText('Use a short grounding reset, then decide on one small next action.', 'Usa un reinicio breve de grounding y luego elige una pequena accion.'),
      actionLabel: localizedText('Open Tools', 'Abrir herramientas'),
      route: '/(tabs)/tools',
    };
  }
  return {
    why: localizedText('A repeated trigger is a cue. It can help you prepare earlier instead of only responding after emotions peak.', 'Un disparador repetido es una senal. Puede ayudarte a prepararte antes, no solo responder cuando las emociones llegan al maximo.'),
    watchFor: localizedText('en', 'es') === 'es' ? ['tension corporal', 'pensamientos urgentes', 'impulsos'] : ['body tension', 'urgent thoughts', 'impulsive urges'],
    nextStep: localizedText('Track this trigger for a few more check-ins.', 'Observa este disparador durante algunos check-ins mas.'),
    actionLabel: localizedText('Check in today', 'Hacer check-in hoy'),
    route: '/(tabs)/(home)',
  };
}

function EducationalInsightCard({ insight }: { insight: EducationalInsight }) {
  useLanguage();
  const { colors } = useAppTheme();
  const router = useRouter();
  return (
    <View style={[styles.educationCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      <View style={styles.educationHeader}>
        <View style={[styles.statIcon, { backgroundColor: colors.surface }]}>{insight.icon}</View>
        <View style={styles.educationHeaderText}>
          <Text style={[styles.statTitle, { color: colors.textMuted }]}>{insight.title}</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{insight.value}</Text>
        </View>
      </View>

      <View style={[styles.whyBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.whyTitle, { color: colors.text }]}>{localizedText('Why this matters', 'Por que importa')}</Text>
        <Text style={[styles.whyText, { color: colors.textSecondary }]}>{insight.why}</Text>
      </View>

      <Text style={[styles.watchTitle, { color: colors.text }]}>{localizedText('What to watch for:', 'Que observar:')}</Text>
      {insight.watchFor.map(item => (
        <View key={item} style={styles.watchRow}>
          <View style={[styles.watchDot, { backgroundColor: colors.brandTeal }]} />
          <Text style={[styles.watchText, { color: colors.textSecondary }]}>{item}</Text>
        </View>
      ))}

      <Text style={[styles.nextStepText, { color: colors.text }]}>{localizedText('Suggested next step:', 'Siguiente paso sugerido:')} {insight.nextStep}</Text>
      <TouchableOpacity
        style={[styles.educationButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push(insight.route as never)}
        activeOpacity={0.84}
      >
        <Text style={styles.educationButtonText}>{insight.actionLabel}</Text>
        <ArrowRight size={16} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function HealthyProgressCard({
  metrics,
  recentMilestone,
}: {
  metrics: ConsistencyMetrics;
  recentMilestone: MilestoneDefinition | null;
}) {
  useLanguage();
  const { colors } = useAppTheme();
  const streaks = [
    {
      label: localizedText('Emotional Awareness Streak', 'Racha de conciencia emocional'),
      value: metrics.emotionalAwarenessStreak,
      body: localizedText('Days in a row with a check-in.', 'Dias seguidos con check-in.'),
      icon: <Heart size={18} color={colors.brandTeal} />,
    },
    {
      label: localizedText('Companion Reflection Streak', 'Racha de reflexion con Companion'),
      value: metrics.companionReflectionStreak,
      body: localizedText('Days in a row talking something through.', 'Dias seguidos hablando de algo.'),
      icon: <MessageCircle size={18} color={colors.primary} />,
    },
    {
      label: localizedText('Skill Practice Streak', 'Racha de practica de habilidades'),
      value: metrics.skillPracticeStreak,
      body: localizedText('Days in a row practicing DBT Academy.', 'Dias seguidos practicando DBT Academy.'),
      icon: <BookOpen size={18} color={colors.accent} />,
    },
  ];

  return (
    <View style={[styles.healthyCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      <View style={styles.healthyHeader}>
        <View style={[styles.healthyIcon, { backgroundColor: colors.primaryLight }]}>
          <Sparkles size={20} color={colors.primary} />
        </View>
        <View style={styles.healthyHeaderText}>
          <Text style={[styles.healthyKicker, { color: colors.brandTeal }]}>{localizedText('Healthy progress', 'Progreso saludable')}</Text>
          <Text style={[styles.healthyTitle, { color: colors.text }]}>{localizedText('Steady practice, not perfection', 'Practica constante, no perfeccion')}</Text>
        </View>
      </View>

      <View style={styles.streakList}>
        {streaks.map((streak) => (
          <View key={streak.label} style={[styles.streakRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={[styles.streakIcon, { backgroundColor: colors.card }]}>{streak.icon}</View>
            <View style={styles.streakCopy}>
              <Text style={[styles.streakLabel, { color: colors.text }]}>{streak.label}</Text>
              <Text style={[styles.streakBody, { color: colors.textSecondary }]}>{streak.body}</Text>
            </View>
            <Text style={[styles.streakValue, { color: colors.primary }]}>
              {streak.value}d
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.achievementNote, { backgroundColor: colors.brandTealSoft, borderColor: colors.borderLight }]}>
        <Text style={[styles.achievementKicker, { color: colors.brandTeal }]}>{localizedText('Meaningful milestone', 'Hito significativo')}</Text>
        <Text style={[styles.achievementTitle, { color: colors.text }]}>
          {recentMilestone?.title ?? localizedText('Your next milestone is forming', 'Tu proximo hito se esta formando')}
        </Text>
        <Text style={[styles.achievementBody, { color: colors.textSecondary }]}>
          {recentMilestone?.celebrationMessage ?? localizedText('Check-ins, reflections, skills, and pauses all count as healthy progress.', 'Los check-ins, reflexiones, habilidades y pausas tambien cuentan como progreso saludable.')}
        </Text>
      </View>
    </View>
  );
}

function AhaMomentCard({
  moment,
  isSaved,
  onToggleSave,
}: {
  moment: AhaMoment | FavoriteAhaMoment;
  isSaved: boolean;
  onToggleSave: (moment: AhaMoment | FavoriteAhaMoment) => void;
}) {
  useLanguage();
  const { colors } = useAppTheme();
  const SaveIcon = isSaved ? BookmarkCheck : Bookmark;
  return (
    <View style={[styles.ahaCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      <View style={styles.ahaHeader}>
        <View style={[styles.ahaIcon, { backgroundColor: colors.primaryLight }]}>
          <Sparkles size={17} color={colors.primary} />
        </View>
        <View style={styles.ahaHeaderText}>
          <Text style={[styles.ahaKicker, { color: colors.brandTeal }]}>{localizedText('Aha Moment', 'Momento de claridad')}</Text>
          <Text style={[styles.ahaTitle, { color: colors.text }]}>{moment.title}</Text>
        </View>
        <TouchableOpacity
          style={[styles.ahaSaveButton, { backgroundColor: isSaved ? colors.brandTealSoft : colors.surface }]}
          onPress={() => onToggleSave(moment)}
          activeOpacity={0.78}
          testID={`toggle-aha-${moment.id}`}
        >
          <SaveIcon size={16} color={isSaved ? colors.brandTeal : colors.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.ahaObservation, { color: colors.text }]}>{moment.observation}</Text>
      <Text style={[styles.ahaEvidence, { color: colors.textSecondary }]}>
        {localizedText('Why this showed up:', 'Por que aparecio:')} {moment.evidence}
      </Text>
      <View style={[styles.ahaConfidencePill, { backgroundColor: colors.brandTealSoft }]}>
        <Text style={[styles.ahaConfidenceText, { color: colors.brandTeal }]}>
          {isSaved ? localizedText('Saved for review', 'Guardado para revisar') : localizedText('High confidence', 'Alta confianza')}
        </Text>
      </View>
    </View>
  );
}

function EmotionalStabilityScoreCard({
  report,
}: {
  report: EmotionalStabilityScoreReport;
}) {
  useLanguage();
  const { colors } = useAppTheme();
  const changeLabel = report.weeklyChange === null
    ? localizedText('Building baseline', 'Creando base')
    : localizedText(`${report.weeklyChange >= 0 ? '+' : ''}${report.weeklyChange} this week`, `${report.weeklyChange >= 0 ? '+' : ''}${report.weeklyChange} esta semana`);
  const changeColor = report.trend === 'up'
    ? colors.success
    : report.trend === 'down'
      ? colors.danger
      : colors.textSecondary;
  const reasons = report.changeReasons.length > 0
    ? report.changeReasons
    : [localizedText('your recent data was fairly steady this week', 'tus datos recientes se mantuvieron bastante estables esta semana')];
  const helpfulFactors = report.factors.filter(factor => factor.score >= 65).slice(0, 2);
  const supportFactors = report.factors.filter(factor => factor.score < 65).slice(0, 2);

  return (
    <View style={[styles.stabilityCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      <View style={styles.stabilityTopRow}>
        <View style={[styles.stabilityScoreBadge, { backgroundColor: colors.primaryLight, borderColor: colors.borderLight }]}>
          <Text style={[styles.stabilityScoreNumber, { color: colors.primary }]}>{report.score}</Text>
          <Text style={[styles.stabilityScoreScale, { color: colors.textMuted }]}>/100</Text>
        </View>
        <View style={styles.stabilityHeaderText}>
          <Text style={[styles.stabilityKicker, { color: colors.brandTeal }]}>{localizedText('Reflection score', 'Puntaje de reflexion')}</Text>
          <Text style={[styles.stabilityTitle, { color: colors.text }]}>{localizedText('Emotional Awareness Score', 'Puntaje de conciencia emocional')}</Text>
          <Text style={[styles.stabilityChange, { color: changeColor }]}>{changeLabel}</Text>
        </View>
      </View>

      <Text style={[styles.stabilitySummary, { color: colors.textSecondary }]}>
        {localizedText('This is not a diagnosis or medical score. It reflects how consistently you check in, reflect, use coping tools, and notice patterns.', 'Esto no es un diagnostico ni un puntaje medico. Refleja que tan consistentemente haces check-ins, reflexionas, usas herramientas de afrontamiento y notas patrones.')}
      </Text>

      <View style={[styles.stabilityReasonBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.stabilityReasonTitle, { color: colors.text }]}>{localizedText('What changed it:', 'Que lo cambio:')}</Text>
        {reasons.map((reason) => (
          <View key={reason} style={styles.stabilityReasonRow}>
            <CheckCircle2 size={15} color={colors.brandTeal} />
            <Text style={[styles.stabilityReasonText, { color: colors.textSecondary }]}>{reason}</Text>
          </View>
        ))}
      </View>

      {helpfulFactors.length > 0 ? (
        <View style={[styles.stabilityReasonBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.stabilityReasonTitle, { color: colors.text }]}>{localizedText('What increased it:', 'Que lo aumento:')}</Text>
          {helpfulFactors.map((factor) => (
            <View key={factor.id} style={styles.stabilityReasonRow}>
              <CheckCircle2 size={15} color={colors.success} />
              <Text style={[styles.stabilityReasonText, { color: colors.textSecondary }]}>{factor.label}: {factor.summary}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {supportFactors.length > 0 ? (
        <View style={[styles.stabilityReasonBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.stabilityReasonTitle, { color: colors.text }]}>{localizedText('What lowered it:', 'Que lo bajo:')}</Text>
          {supportFactors.map((factor) => (
            <View key={factor.id} style={styles.stabilityReasonRow}>
              <Clock size={15} color={colors.accent} />
              <Text style={[styles.stabilityReasonText, { color: colors.textSecondary }]}>{factor.label}: {factor.summary}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={[styles.stabilitySummary, { color: colors.textSecondary }]}>
        {localizedText('Why it matters: more awareness makes it easier to notice spirals earlier and choose a skill before reacting.', 'Por que importa: mas conciencia hace mas facil notar espirales antes y elegir una habilidad antes de reaccionar.')}
      </Text>

      <Text style={[styles.stabilityFootnote, { color: colors.textMuted }]}>
        {localizedText('Personal reflection metric only. It is not medical advice and does not measure your worth or progress in therapy.', 'Solo es una metrica personal de reflexion. No es consejo medico y no mide tu valor ni tu progreso en terapia.')}
      </Text>
    </View>
  );
}

function CalmToolsHelpedCard({
  summary,
  hasEnoughSessions,
  onPress,
}: {
  summary: CalmMeDownSummary;
  hasEnoughSessions: boolean;
  onPress: () => void;
}) {
  useLanguage();
  const { colors } = useAppTheme();
  return (
    <View style={[styles.calmCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      <View style={styles.calmCardHeader}>
        <View style={[styles.calmIcon, { backgroundColor: colors.brandTealSoft }]}>
          <Wind size={20} color={colors.brandTeal} />
        </View>
        <View style={styles.calmHeaderText}>
          <Text style={[styles.calmKicker, { color: colors.brandTeal }]}>{localizedText('Regulation tools', 'Herramientas de regulacion')}</Text>
          <Text style={[styles.calmTitle, { color: colors.text }]}>{localizedText('Calm tools helped', 'Las herramientas de calma ayudaron')}</Text>
        </View>
      </View>

      {hasEnoughSessions ? (
        <>
          <Text style={[styles.calmSummary, { color: colors.text }]}>
            {localizedText(`Calm Me Down lowered intensity by ${summary.averageReduction.toFixed(1)} points on average.`, `Calmarme bajo la intensidad en ${summary.averageReduction.toFixed(1)} puntos en promedio.`)}
          </Text>
          <View style={styles.calmStatsRow}>
            <View style={[styles.calmStatPill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[styles.calmStatValue, { color: colors.text }]}>{summary.sessionCount}</Text>
              <Text style={[styles.calmStatLabel, { color: colors.textSecondary }]}>{localizedText('sessions', 'sesiones')}</Text>
            </View>
            <View style={[styles.calmStatPill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[styles.calmStatValue, { color: colors.text }]}>{summary.bestReduction.toFixed(1)}</Text>
              <Text style={[styles.calmStatLabel, { color: colors.textSecondary }]}>{localizedText('best drop', 'mejor bajada')}</Text>
            </View>
          </View>
          <Text style={[styles.calmDetail, { color: colors.textSecondary }]}>
            {localizedText('Most common trigger before using Calm Me Down:', 'Disparador mas comun antes de usar Calmarme:')} {summary.mostCommonTrigger ?? localizedText('still forming', 'aun formandose')}.
          </Text>
        </>
      ) : (
        <Text style={[styles.calmSummary, { color: colors.textSecondary }]}>
          {localizedText('Use Calm Me Down twice to see how it affects your intensity.', 'Usa Calmarme dos veces para ver como afecta tu intensidad.')}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.calmButton, { backgroundColor: colors.primary }]}
        onPress={onPress}
        activeOpacity={0.86}
        testID="insights-calm-me-down-btn"
      >
        <Text style={styles.calmButtonText}>{localizedText('Open Calm Me Down', 'Abrir Calmarme')}</Text>
        <ArrowRight size={16} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

function CareInsightsCard({
  title,
  body,
  detail,
  icon,
  onPress,
}: {
  title: string;
  body: string;
  detail?: string;
  icon: React.ReactNode;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.careCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={[styles.careIcon, { backgroundColor: colors.surface }]}>
        {icon}
      </View>
      <View style={styles.careTextWrap}>
        <Text style={[styles.careTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.careBody, { color: colors.textSecondary }]}>{body}</Text>
        {detail ? <Text style={[styles.careDetail, { color: colors.textMuted }]}>{detail}</Text> : null}
      </View>
      {onPress ? <ChevronRight size={17} color={colors.textMuted} /> : null}
    </Wrapper>
  );
}

export default function PremiumInsightsScreen() {
  useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { journalEntries, messageDrafts } = useApp();
  const { memoryProfile, companionMemorySystem, conversations } = useAICompanion();
  const medicationContext = useMedications();
  const appointmentContext = useAppointments();
  const medications = medicationContext?.medications ?? [];
  const medicationLogs = medicationContext?.logs ?? [];
  const upcomingAppointments = appointmentContext?.upcomingAppointments ?? [];
  const { profiles: relationshipProfiles, events: relationshipEvents } = useRelationships();
  const { hasPremiumAccess, state, isEntitlementActive } = useSubscription();
  const { metrics: rewardMetrics, recentMilestone } = useRewards();
  const [savedCompanionInsights, setSavedCompanionInsights] = useState<SavedCompanionInsight[]>([]);
  const [selectedSavedInsight, setSelectedSavedInsight] = useState<SavedCompanionInsight | null>(null);
  const [favoriteAhaMoments, setFavoriteAhaMoments] = useState<FavoriteAhaMoment[]>([]);
  const [calmSessions, setCalmSessions] = useState<CalmMeDownSession[]>([]);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    Promise.all([loadSavedCompanionInsights(), loadFavoriteAhaMoments(), loadCalmMeDownSessions()])
      .then(([companionInsights, ahaMoments, calmHistory]) => {
        if (!mounted) return;
        setSavedCompanionInsights(companionInsights);
        setFavoriteAhaMoments(ahaMoments);
        setCalmSessions(calmHistory);
      })
      .catch((error) => {
        console.log('[Insights] Failed to load saved insights:', error);
      });
    return () => {
      mounted = false;
    };
  }, []));

  const sortedEntries = useMemo(() => [...journalEntries].sort((a, b) => b.timestamp - a.timestamp), [journalEntries]);
  const recentEntries = useMemo(() => sortedEntries.slice(0, 12), [sortedEntries]);
  const todaysCheckIn = useMemo(() => sortedEntries.find(entry => isSameLocalDay(entry.timestamp, Date.now())) ?? null, [sortedEntries]);
  const checkInCount = sortedEntries.length;
  const stage = getStage(checkInCount);
  const topEmotion = useMemo(() => {
    return countLabels(recentEntries.flatMap(entry => entry.checkIn.emotions.map(emotion => emotion.label)))[0] ?? null;
  }, [recentEntries]);
  const topTrigger = useMemo(() => {
    return countLabels(recentEntries.flatMap(entry => entry.checkIn.triggers.map(trigger => trigger.label)))[0] ?? null;
  }, [recentEntries]);
  const average = memoryProfile.averageIntensity || averageIntensity(recentEntries);
  const signalCounts = useMemo(() => getSignalCounts(recentEntries), [recentEntries]);
  const suggestedFocus = getSuggestedFocus({ topEmotion, topTrigger, average, signalCounts });
  const patternSentences = buildPatternSentences({ stage, topEmotion, topTrigger, signalCounts, average });
  const hasPositivePattern =
    signalCounts.positiveAfterSleep >= 2 ||
    signalCounts.positiveAfterConnection >= 2 ||
    signalCounts.positiveAfterExercise >= 2;
  const educationalInsights = useMemo<EducationalInsight[]>(() => {
    if (stage === 'forming') {
      return [
        {
          title: todaysCheckIn ? localizedText('Today’s check-in complete', 'Check-in de hoy completado') : localizedText('Example insight', 'Ejemplo de insight'),
          value: todaysCheckIn ? localizedText('Your entry is saved for today.', 'Tu entrada de hoy esta guardada.') : localizedText('Anxiety may show up before urgency', 'La ansiedad puede aparecer antes de la urgencia'),
          why: localizedText('When enough check-ins are saved, BPD Companion will explain why a repeated emotion may matter and what to watch for.', 'Cuando haya suficientes check-ins guardados, BPD Companion explicara por que una emocion repetida puede importar y que observar.'),
          watchFor: localizedText('en', 'es') === 'es' ? ['buscar tranquilidad', 'enviar mensajes repetidos', 'anticipar lo peor'] : ['reassurance seeking', 'repeated texting', 'catastrophizing'],
          nextStep: todaysCheckIn
            ? localizedText('Today’s check-in is complete. You can review what is starting to form.', 'El check-in de hoy esta completo. Puedes revisar lo que empieza a formarse.')
            : localizedText('Complete a few more check-ins to unlock your real pattern.', 'Completa algunos check-ins mas para desbloquear tu patron real.'),
          actionLabel: todaysCheckIn ? localizedText('View today’s insights', 'Ver insights de hoy') : localizedText('Check in today', 'Hacer check-in hoy'),
          route: todaysCheckIn ? '/(tabs)/(home)' : '/(tabs)/(home)',
          icon: <Heart size={19} color={colors.brandTeal} />,
        },
      ];
    }

    const cards: EducationalInsight[] = [];
    if (topEmotion) {
      const education = getEmotionEducation(topEmotion.label);
      cards.push({
        title: localizedText('Most common emotion', 'Emocion mas comun'),
        value: localizedText(`${topEmotion.label} appeared in ${topEmotion.count} recent check-in${topEmotion.count === 1 ? '' : 's'}.`, `${topEmotion.label} aparecio en ${topEmotion.count} check-in${topEmotion.count === 1 ? '' : 's'} reciente${topEmotion.count === 1 ? '' : 's'}.`),
        icon: <Heart size={19} color={colors.brandTeal} />,
        ...education,
      });
    }
    if (topTrigger) {
      const education = getTriggerEducation(topTrigger.label);
      cards.push({
        title: hasPositivePattern ? localizedText('Most common influence', 'Influencia mas comun') : localizedText('Most common trigger', 'Disparador mas comun'),
        value: localizedText(`${topTrigger.label} appeared in ${topTrigger.count} recent check-in${topTrigger.count === 1 ? '' : 's'}.`, `${topTrigger.label} aparecio en ${topTrigger.count} check-in${topTrigger.count === 1 ? '' : 's'} reciente${topTrigger.count === 1 ? '' : 's'}.`),
        icon: <Target size={19} color={colors.accent} />,
        ...education,
      });
    }
    const shouldSuggestCalming = average >= 7 && !hasPositivePattern;
    cards.push({
      title: localizedText('What may help next', 'Que puede ayudar ahora'),
      value: suggestedFocus,
      why: localizedText('A next step matters because insight is most useful when it turns into one small, doable action before emotions peak.', 'Un siguiente paso importa porque un insight es mas util cuando se convierte en una accion pequena y posible antes de que las emociones suban.'),
      watchFor: hasPositivePattern
        ? (localizedText('en', 'es') === 'es' ? ['que ayudo a que el dia empezara mejor', 'conexion de apoyo', 'rutinas que vale la pena repetir'] : ['what helped the day start better', 'supportive connection', 'routines worth repeating'])
        : (localizedText('en', 'es') === 'es' ? ['intentar resolver todo a la vez', 'saltarte herramientas de calma', 'esperar hasta que la intensidad ya este alta'] : ['trying to solve everything at once', 'skipping calming tools', 'waiting until intensity is already high']),
      nextStep: shouldSuggestCalming ? localizedText('Use Calm Me Down before deeper reflection.', 'Usa Calmarme antes de una reflexion mas profunda.') : localizedText('Talk through the pattern with Companion.', 'Habla del patron con Companion.'),
      actionLabel: shouldSuggestCalming ? localizedText('Open Calm Me Down', 'Abrir Calmarme') : localizedText('Talk to Companion', 'Hablar con Companion'),
      route: shouldSuggestCalming ? '/grounding-mode' : '/(tabs)/companion',
      icon: <Brain size={19} color={colors.primary} />,
    });
    return cards;
  }, [average, colors.accent, colors.brandTeal, colors.primary, hasPositivePattern, stage, suggestedFocus, todaysCheckIn, topEmotion, topTrigger]);

  const handleOpenSavedInsight = useCallback((insight: SavedCompanionInsight) => {
    setSelectedSavedInsight(insight);
  }, []);

  const handleContinueSavedInsight = useCallback((insight: SavedCompanionInsight) => {
    router.push({
      pathname: '/(tabs)/companion/chat',
      params: { conversationId: insight.conversationId },
    } as never);
  }, [router]);

  const handleDeleteSavedInsight = useCallback(async (insight: SavedCompanionInsight) => {
    const updated = await deleteCompanionInsight(insight.id);
    setSavedCompanionInsights(updated);
    setSelectedSavedInsight(null);
  }, []);
  const ahaMoments = useMemo(() => generateAhaMoments(journalEntries), [journalEntries]);
  const stabilityScore = useMemo(
    () => generateEmotionalStabilityScore(journalEntries, messageDrafts),
    [journalEntries, messageDrafts],
  );
  const calmSummary = useMemo(() => summarizeCalmMeDownSessions(calmSessions), [calmSessions]);
  const nextCareAppointment = upcomingAppointments[0] ?? null;
  const medicationConsistency = useMemo(() => {
    const activeMedicationCount = medications.filter(medication => medication.active).length;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs = medicationLogs.filter(log => log.timestamp >= sevenDaysAgo);
    const taken = recentLogs.filter(log => log.status === 'taken').length;
    const missed = recentLogs.filter(log => log.status === 'missed').length;
    return { activeMedicationCount, taken, missed, total: recentLogs.length };
  }, [medicationLogs, medications]);
  const hasEnoughCalmSessions = calmSummary.sessionCount >= 2;
  const savedAhaIds = useMemo(
    () => new Set(favoriteAhaMoments.map(moment => moment.id)),
    [favoriteAhaMoments],
  );
  const relationshipIntelligence = useMemo(() => buildRelationshipIntelligence({
    profiles: relationshipProfiles,
    journalEntries,
    messageDrafts,
    conversations,
    storedEvents: relationshipEvents,
  }), [conversations, journalEntries, messageDrafts, relationshipEvents, relationshipProfiles]);
  const emotionalGPSLoop = companionMemorySystem.emotionalGPS.strongestLoop;
  const remainingForFirstInsight = Math.max(0, FIRST_INSIGHT_COUNT - checkInCount);
  const remainingForFullReport = Math.max(0, FULL_INSIGHT_COUNT - checkInCount);
  const accessLabel = isEntitlementActive
    ? localizedText('Membership active', 'Membresia activa')
    : state.isTrialActive
      ? localizedText('Store trial active', 'Prueba de la tienda activa')
      : localizedText('Membership required', 'Membresia requerida');
  const handleToggleAhaSave = async (moment: AhaMoment | FavoriteAhaMoment) => {
    try {
      const updated = savedAhaIds.has(moment.id)
        ? await removeFavoriteAhaMoment(moment.id)
        : await saveFavoriteAhaMoment(moment);
      setFavoriteAhaMoments(updated);
    } catch (error) {
      console.log('[Insights] Failed to update Aha Moment favorite:', error);
    }
  };

  if (!hasPremiumAccess) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.lockedContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.lockedIcon, { backgroundColor: colors.primaryLight }]}>
            <Lock size={34} color={colors.primary} />
          </View>
          <Text style={[styles.lockedTitle, { color: colors.text }]}>{localizedText('Keep your emotional patterns', 'Conserva tus patrones emocionales')}</Text>
          <Text style={[styles.lockedBody, { color: colors.textSecondary }]}>
            {localizedText('Membership keeps your pattern summaries, saved Companion insights, and first-week report available.', 'La membresia mantiene disponibles tus resumenes de patrones, insights guardados de Companion y tu reporte de la primera semana.')}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/upgrade' as never)}
            activeOpacity={0.86}
            testID="insights-upgrade-btn"
          >
            <Text style={styles.primaryButtonText}>{localizedText('Start membership', 'Iniciar membresia')}</Text>
            <ChevronRight size={18} color={Colors.white} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.brandTeal }]}>{accessLabel}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{localizedText('Your emotional patterns', 'Tus patrones emocionales')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {localizedText('Calm reflections based on your check-ins. No diagnosis, no certainty, just patterns you can notice sooner.', 'Reflexiones calmadas basadas en tus check-ins. Sin diagnosticos ni certezas, solo patrones que puedes notar antes.')}
          </Text>
        </View>

        {stage === 'forming' && (
          <View style={[styles.formingCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={[styles.formingIcon, { backgroundColor: colors.primaryLight }]}>
              <Sparkles size={24} color={colors.primary} />
            </View>
            <Text style={[styles.formingTitle, { color: colors.text }]}>
              {todaysCheckIn ? localizedText('Today’s check-in complete', 'Check-in de hoy completado') : localizedText('Your patterns are starting to form.', 'Tus patrones estan empezando a formarse.')}
            </Text>
            <Text style={[styles.formingText, { color: colors.textSecondary }]}>
              {todaysCheckIn
                ? localizedText('Your entry is saved for today. Keep checking in to unlock your first emotional pattern.', 'Tu entrada de hoy esta guardada. Sigue haciendo check-ins para desbloquear tu primer patron emocional.')
                : localizedText(`Complete ${remainingForFirstInsight} more check-in${remainingForFirstInsight === 1 ? '' : 's'} to unlock your first insight.`, `Completa ${remainingForFirstInsight} check-in${remainingForFirstInsight === 1 ? '' : 's'} mas para desbloquear tu primer insight.`)}
            </Text>
            <TouchableOpacity
              style={[styles.checkInButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/(home)' as never)}
              activeOpacity={0.86}
              testID="insights-check-in-btn"
            >
              <Text style={styles.checkInButtonText}>
                {todaysCheckIn ? localizedText('View today’s insights', 'Ver insights de hoy') : localizedText('Check in today', 'Hacer check-in hoy')}
              </Text>
              <ArrowRight size={17} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        <HealthyProgressCard metrics={rewardMetrics} recentMilestone={recentMilestone} />

        <EmotionalStabilityScoreCard report={stabilityScore} />

        <CalmToolsHelpedCard
          summary={calmSummary}
          hasEnoughSessions={hasEnoughCalmSessions}
          onPress={() => router.push('/grounding-mode' as never)}
        />

        <Section title={localizedText('Care support', 'Apoyo de cuidado')}>
          <View style={styles.patternList}>
            <CareInsightsCard
              title={localizedText('Upcoming care', 'Proxima atencion')}
              body={nextCareAppointment
                ? `${APPOINTMENT_TYPE_LABELS[nextCareAppointment.appointmentType]}: ${nextCareAppointment.providerName}`
                : localizedText('No upcoming appointments added yet.', 'Aun no agregaste proximas citas.')}
              detail={nextCareAppointment
                ? `${formatAppointmentDate(nextCareAppointment.dateTime)} at ${formatAppointmentTime(nextCareAppointment.dateTime)}`
                : localizedText('Add appointments to keep care moments visible.', 'Agrega citas para mantener visibles tus momentos de cuidado.')}
              icon={<Calendar size={18} color={colors.brandTeal} />}
              onPress={() => router.push('/appointments' as never)}
            />
            <CareInsightsCard
              title={localizedText('Medication consistency', 'Consistencia con medicamentos')}
              body={medicationConsistency.activeMedicationCount > 0
                ? localizedText(`You added ${medicationConsistency.activeMedicationCount} active medication${medicationConsistency.activeMedicationCount === 1 ? '' : 's'}.`, `Agregaste ${medicationConsistency.activeMedicationCount} medicamento${medicationConsistency.activeMedicationCount === 1 ? '' : 's'} activo${medicationConsistency.activeMedicationCount === 1 ? '' : 's'}.`)
                : localizedText('No medications added yet.', 'Aun no agregaste medicamentos.')}
              detail={medicationConsistency.total > 0
                ? localizedText(`Last 7 days: you marked ${medicationConsistency.taken} as taken and ${medicationConsistency.missed} as missed.`, `Ultimos 7 dias: marcaste ${medicationConsistency.taken} como tomados y ${medicationConsistency.missed} como omitidos.`)
                : localizedText('Medication tracking is for organization only and does not replace medical advice.', 'El seguimiento de medicamentos es solo para organizarte y no reemplaza el consejo medico.')}
              icon={<Pill size={18} color={colors.primary} />}
              onPress={() => router.push('/medications' as never)}
            />
            <Text style={[styles.medicalSafetyText, { color: colors.textMuted }]}>
              {localizedText('Medication tracking is for organization only and does not replace medical advice.', 'El seguimiento de medicamentos es solo para organizarte y no reemplaza el consejo medico.')}
            </Text>
          </View>
        </Section>

        <View style={styles.cardsGrid}>
          {educationalInsights.map((insight) => (
            <EducationalInsightCard key={`${insight.title}-${insight.value}`} insight={insight} />
          ))}
        </View>

        {stage === 'forming' && (
          <Section title={localizedText('Examples of future insights', 'Ejemplos de futuros insights')}>
            <View style={styles.patternList}>
              {[
                localizedText('Example: Anxiety appears most often when relationship stress is present.', 'Ejemplo: la ansiedad aparece con mas frecuencia cuando hay estres relacional.'),
                localizedText('Example: Feeling rejected has appeared in 3 recent entries.', 'Ejemplo: sentirse rechazado/a aparecio en 3 entradas recientes.'),
                localizedText('Example: High intensity check-ins are more common when sleep is mentioned.', 'Ejemplo: los check-ins de alta intensidad son mas comunes cuando se menciona el sueno.'),
              ].map((example) => (
                <View key={example} style={[styles.patternRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                  <Clock size={16} color={colors.textMuted} />
                  <Text style={[styles.patternText, { color: colors.textSecondary }]}>{example}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {stage !== 'forming' && (
          <Section title={localizedText('Patterns I’m noticing', 'Patrones que estoy notando')}>
            <View style={styles.patternList}>
              {emotionalGPSLoop ? (
                <View style={[styles.gpsCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                  <View style={[styles.gpsIcon, { backgroundColor: colors.primaryLight }]}>
                    <Brain size={18} color={colors.primary} />
                  </View>
                  <View style={styles.gpsTextWrap}>
                    <Text style={[styles.gpsTitle, { color: colors.text }]}>{localizedText("We've seen this pattern before.", 'Ya vimos este patron antes.')}</Text>
                    <Text style={[styles.gpsBody, { color: colors.textSecondary }]}>
                      {[
                        emotionalGPSLoop.trigger,
                        emotionalGPSLoop.emotion,
                        emotionalGPSLoop.fear,
                        emotionalGPSLoop.urge,
                        emotionalGPSLoop.commonAction,
                        emotionalGPSLoop.commonOutcome,
                      ].join(' -> ')}
                    </Text>
                    <Text style={[styles.gpsHelp, { color: colors.primary }]}>
                      {localizedText('Next interruption point:', 'Proximo punto de interrupcion:')} {emotionalGPSLoop.suggestedInterruption}.
                    </Text>
                  </View>
                </View>
              ) : null}
              {patternSentences.map((sentence) => (
                <View key={sentence} style={[styles.patternRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                  <CheckCircle2 size={16} color={colors.brandTeal} />
                  <Text style={[styles.patternText, { color: colors.text }]}>{sentence}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        <Section title={localizedText('Aha Moments', 'Momentos de claridad')}>
          {ahaMoments.length > 0 ? (
            <View style={styles.patternList}>
              {ahaMoments.map((moment) => (
                <AhaMomentCard
                  key={moment.id}
                  moment={moment}
                  isSaved={savedAhaIds.has(moment.id)}
                  onToggleSave={handleToggleAhaSave}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.emptySectionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Sparkles size={17} color={colors.textMuted} />
              <Text style={[styles.emptySectionText, { color: colors.textSecondary }]}>
                {localizedText('Aha Moments appear only when the app has high-confidence evidence. Keep checking in and reflecting to unlock rare observations.', 'Los momentos de claridad aparecen solo cuando la app tiene evidencia de alta confianza. Sigue haciendo check-ins y reflexionando para desbloquear observaciones poco frecuentes.')}
              </Text>
            </View>
          )}
        </Section>

        {favoriteAhaMoments.length > 0 ? (
          <Section title={localizedText('Saved Aha Moments', 'Momentos de claridad guardados')}>
            <View style={styles.patternList}>
              {favoriteAhaMoments.map((moment) => (
                <AhaMomentCard
                  key={`saved-${moment.id}`}
                  moment={moment}
                  isSaved
                  onToggleSave={handleToggleAhaSave}
                />
              ))}
            </View>
          </Section>
        ) : null}

        <Section title={localizedText('Relationship Intelligence', 'Inteligencia relacional')}>
          {relationshipProfiles.length === 0 ? (
            <View style={[styles.emptySectionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Users size={17} color={colors.textMuted} />
              <Text style={[styles.emptySectionText, { color: colors.textSecondary }]}>
                {localizedText('Add a partner, parent, friend, ex, or other person to start linking check-ins, journals, and Companion conversations.', 'Agrega una pareja, madre/padre, amistad, ex u otra persona para empezar a conectar check-ins, diarios y conversaciones con Companion.')}
              </Text>
              <TouchableOpacity
                style={[styles.smallInlineButton, { backgroundColor: colors.primaryLight }]}
                onPress={() => router.push('/profile/add-relationship' as never)}
                activeOpacity={0.78}
                testID="insights-add-relationship"
              >
                <Text style={[styles.smallInlineButtonText, { color: colors.primary }]}>{localizedText('Add', 'Agregar')}</Text>
              </TouchableOpacity>
            </View>
          ) : relationshipIntelligence.insights.length > 0 ? (
            <View style={styles.patternList}>
              {relationshipIntelligence.insights.slice(0, 3).map((insight) => {
                const meta = RELATIONSHIP_TYPE_META[insight.relationshipType];
                return (
                  <View
                    key={insight.id}
                    style={[styles.relationshipInsightCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                  >
                    <View style={[styles.relationshipIcon, { backgroundColor: colors.surface }]}>
                      <Text style={styles.relationshipEmoji}>{meta?.emoji ?? '👤'}</Text>
                    </View>
                    <View style={styles.relationshipTextWrap}>
                      <Text style={[styles.relationshipTitle, { color: colors.text }]}>{insight.title}</Text>
                      <Text style={[styles.relationshipBody, { color: colors.textSecondary }]}>{insight.description}</Text>
                      <Text style={[styles.relationshipEvidence, { color: colors.primary }]}>
                        {insight.confidence ? localizedText(`${insight.confidence[0].toUpperCase()}${insight.confidence.slice(1)} confidence · `, `Confianza ${insight.confidence} · `) : ''}{localizedText('Based on', 'Basado en')} {insight.evidence}.
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptySectionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Users size={17} color={colors.textMuted} />
              <Text style={[styles.emptySectionText, { color: colors.textSecondary }]}>
                {localizedText('Relationship links are building. Mention a saved person by name in check-ins, journals, or Companion conversations to unlock specific insights.', 'Los vinculos relacionales se estan formando. Menciona a una persona guardada por nombre en check-ins, diarios o conversaciones con Companion para desbloquear insights especificos.')}
              </Text>
            </View>
          )}
        </Section>

        <Section title={localizedText('Saved insights from Companion', 'Insights guardados de Companion')}>
          {savedCompanionInsights.length > 0 ? (
            <View style={styles.patternList}>
              {savedCompanionInsights.slice(0, stage === 'full' ? 4 : 2).map((insight) => (
                <TouchableOpacity
                  key={insight.id}
                  style={[styles.savedInsightCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                  onPress={() => handleOpenSavedInsight(insight)}
                  activeOpacity={0.78}
                >
                  <MessageCircle size={16} color={colors.brandTeal} />
                  <Text style={[styles.savedInsightText, { color: colors.text }]} numberOfLines={4}>
                    {insight.content}
                  </Text>
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptySectionCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <BookOpen size={17} color={colors.textMuted} />
              <Text style={[styles.emptySectionText, { color: colors.textSecondary }]}>
                {localizedText('Save a helpful Companion response and it will appear here.', 'Guarda una respuesta util de Companion y aparecera aqui.')}
              </Text>
            </View>
          )}
          {selectedSavedInsight ? (
            <View style={[styles.savedInsightDetailCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Text style={[styles.savedInsightDetailKicker, { color: colors.brandTeal }]}>
                {new Date(selectedSavedInsight.createdAt).toLocaleDateString()} · {localizedText('Saved from Companion', 'Guardado desde Companion')}
              </Text>
              {selectedSavedInsight.userMessage ? (
                <View style={[styles.savedInsightContextBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <Text style={[styles.savedInsightDetailLabel, { color: colors.text }]}>{localizedText('You wrote', 'Tu escribiste')}</Text>
                  <Text style={[styles.savedInsightDetailText, { color: colors.textSecondary }]}>{selectedSavedInsight.userMessage}</Text>
                </View>
              ) : null}
              <View style={[styles.savedInsightContextBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <Text style={[styles.savedInsightDetailLabel, { color: colors.text }]}>{localizedText('Saved response', 'Respuesta guardada')}</Text>
                <Text style={[styles.savedInsightDetailText, { color: colors.textSecondary }]}>{selectedSavedInsight.content}</Text>
              </View>
              <View style={styles.savedInsightDetailActions}>
                <TouchableOpacity
                  style={[styles.savedInsightDetailButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleContinueSavedInsight(selectedSavedInsight)}
                  activeOpacity={0.82}
                >
                  <MessageCircle size={15} color={Colors.white} />
                  <Text style={styles.savedInsightDetailPrimaryText}>{localizedText('Continue in Companion', 'Continuar en Companion')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.savedInsightDeleteButton, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  onPress={() => handleDeleteSavedInsight(selectedSavedInsight)}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.savedInsightDeleteText, { color: colors.danger }]}>{localizedText('Delete saved insight', 'Eliminar insight guardado')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </Section>

        <Section title={localizedText('Your first week report', 'Reporte de tu primera semana')}>
          {stage === 'full' ? (
            <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <View style={[styles.reportIcon, { backgroundColor: colors.brandTealSoft }]}>
                <Crown size={20} color={colors.brandTeal} />
              </View>
              <View style={styles.reportTextWrap}>
                <Text style={[styles.reportTitle, { color: colors.text }]}>{localizedText('Unlocked', 'Desbloqueado')}</Text>
                <Text style={[styles.reportText, { color: colors.textSecondary }]}>
                  {localizedText('You have enough check-ins to review your first emotional pattern report.', 'Tienes suficientes check-ins para revisar tu primer reporte de patrones emocionales.')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.reportButton, { backgroundColor: colors.primaryLight }]}
                onPress={() => router.push('/weekly-reflection' as never)}
                activeOpacity={0.8}
                testID="open-first-week-report"
              >
                <Text style={[styles.reportButtonText, { color: colors.primary }]}>{localizedText('Open', 'Abrir')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <View style={[styles.reportIcon, { backgroundColor: colors.surface }]}>
                <Lock size={19} color={colors.textMuted} />
              </View>
              <View style={styles.reportTextWrap}>
                <Text style={[styles.reportTitle, { color: colors.text }]}>{localizedText('Unlocks after 7 check-ins', 'Se desbloquea despues de 7 check-ins')}</Text>
                <Text style={[styles.reportText, { color: colors.textSecondary }]}>
                  {localizedText(`Complete ${remainingForFullReport} more check-in${remainingForFullReport === 1 ? '' : 's'} to unlock your first week report.`, `Completa ${remainingForFullReport} check-in${remainingForFullReport === 1 ? '' : 's'} mas para desbloquear el reporte de tu primera semana.`)}
                </Text>
              </View>
            </View>
          )}
        </Section>

        {stage !== 'full' && (
          <TouchableOpacity
            style={[styles.bottomCheckInButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/(home)' as never)}
            activeOpacity={0.86}
            testID="insights-bottom-check-in-btn"
          >
            <Text style={styles.checkInButtonText}>
              {todaysCheckIn ? localizedText('View today’s insights', 'Ver insights de hoy') : localizedText('Check in today', 'Hacer check-in hoy')}
            </Text>
            <ArrowRight size={17} color={Colors.white} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  formingCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
  },
  formingIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  formingTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  formingText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  checkInButton: {
    minHeight: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkInButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  stabilityCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
  },
  stabilityTopRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 13,
  },
  stabilityScoreBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stabilityScoreNumber: {
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: 0,
  },
  stabilityScoreScale: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: -2,
  },
  stabilityHeaderText: {
    flex: 1,
  },
  stabilityKicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  stabilityTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    marginBottom: 4,
  },
  stabilityChange: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  stabilitySummary: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    marginBottom: 12,
  },
  stabilityReasonBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 13,
    marginBottom: 12,
    gap: 8,
  },
  stabilityReasonTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 1,
  },
  stabilityReasonRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  stabilityReasonText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  stabilityFootnote: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  calmCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 2,
  },
  calmCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  calmIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calmHeaderText: {
    flex: 1,
  },
  calmKicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  calmTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
  },
  calmSummary: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '800',
    marginBottom: 12,
  },
  calmStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 11,
  },
  calmStatPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  calmStatValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  calmStatLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  calmDetail: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginBottom: 13,
  },
  calmButton: {
    minHeight: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  calmButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  careCard: {
    minHeight: 82,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  careIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  careTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    marginBottom: 3,
  },
  careBody: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  careDetail: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  medicalSafetyText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    paddingHorizontal: 3,
  },
  cardsGrid: {
    gap: 12,
    marginBottom: 18,
  },
  educationCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  educationHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 13,
  },
  educationHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  whyBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
    marginBottom: 13,
  },
  whyTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  whyText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  watchTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  watchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 7,
  },
  watchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  watchText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  nextStepText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    marginTop: 5,
    marginBottom: 12,
  },
  educationButton: {
    minHeight: 46,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  educationButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  statCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
    marginBottom: 6,
  },
  statNote: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  patternList: {
    gap: 9,
  },
  gpsCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  gpsIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsTextWrap: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 5,
  },
  gpsBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginBottom: 6,
  },
  gpsHelp: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
  },
  patternRow: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  patternText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  ahaCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
  },
  ahaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 12,
  },
  ahaIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ahaHeaderText: {
    flex: 1,
  },
  ahaKicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  ahaTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  ahaSaveButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ahaObservation: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '900',
    marginBottom: 9,
  },
  ahaEvidence: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginBottom: 11,
  },
  ahaConfidencePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ahaConfidenceText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  savedInsightCard: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  savedInsightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  savedInsightDetailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    gap: 12,
  },
  savedInsightDetailKicker: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  savedInsightContextBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  savedInsightDetailLabel: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
  },
  savedInsightDetailText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  savedInsightDetailActions: {
    gap: 9,
  },
  savedInsightDetailButton: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  savedInsightDetailPrimaryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  savedInsightDeleteButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedInsightDeleteText: {
    fontSize: 14,
    fontWeight: '900',
  },
  emptySectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  emptySectionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  smallInlineButton: {
    minHeight: 36,
    borderRadius: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallInlineButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  relationshipInsightCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  relationshipIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relationshipEmoji: {
    fontSize: 18,
  },
  relationshipTextWrap: {
    flex: 1,
  },
  relationshipTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    marginBottom: 5,
  },
  relationshipBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginBottom: 6,
  },
  relationshipEvidence: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  reportIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTextWrap: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  reportText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  reportButton: {
    minHeight: 38,
    borderRadius: 14,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  healthyCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  healthyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthyIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthyHeaderText: {
    flex: 1,
  },
  healthyKicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  healthyTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  streakList: {
    gap: 9,
  },
  streakRow: {
    minHeight: 72,
    borderRadius: 17,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  streakIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCopy: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
    marginBottom: 3,
  },
  streakBody: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  streakValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  achievementNote: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 14,
  },
  achievementKicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    marginBottom: 5,
  },
  achievementBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  bottomCheckInButton: {
    minHeight: 52,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockedContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  lockedIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  lockedTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  lockedBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 18,
  },
  primaryButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
});
