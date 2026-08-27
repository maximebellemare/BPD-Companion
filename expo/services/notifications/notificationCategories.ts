import { NotificationCategoryConfig } from '@/types/notifications';
import { localizedFields } from '@/lib/i18n/staticText';

const ENGLISH_NOTIFICATION_CATEGORIES: NotificationCategoryConfig[] = [
  {
    id: 'daily_checkin',
    label: 'Daily Check-in',
    description: 'A gentle reminder to check in with yourself',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 9, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'weekly_reflection',
    label: 'Weekly Reflection',
    description: 'Notification when your weekly reflection is ready',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 10, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'ritual_reminder',
    label: 'Daily Rituals',
    description: 'Morning, midday, and evening ritual prompts',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 8, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'relationship_support',
    label: 'Relationship Support',
    description: 'Gentle pause reminders during relationship triggers',
    defaultEnabled: true,
    defaultTimeWindow: null,
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'calm_followup',
    label: 'Calm Follow-up',
    description: 'A check-in after intense moments settle',
    defaultEnabled: true,
    defaultTimeWindow: null,
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'regulation_followup',
    label: 'Regulation Follow-up',
    description: 'Check-in after high distress episodes',
    defaultEnabled: true,
    defaultTimeWindow: null,
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'premium_reflection',
    label: 'Membership Insights',
    description: 'Deeper emotional pattern insights',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 18, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: true,
    safetyExempt: false,
  },
  {
    id: 'therapist_report',
    label: 'Therapist Report',
    description: 'When a new therapist report is ready',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 10, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'reengagement',
    label: 'Gentle Re-engagement',
    description: 'Supportive nudge if you haven\'t visited in a while',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 11, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'streak_support',
    label: 'Streak Support',
    description: 'Encouragement to keep your check-in rhythm',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 20, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'gentle_nudge',
    label: 'Gentle Nudge',
    description: 'End-of-day check-in encouragement',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 20, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'premium_upgrade',
    label: 'Membership Insights Reminders',
    description: 'Occasional reminders about advanced features you\'ve shown interest in',
    defaultEnabled: true,
    defaultTimeWindow: { hour: 12, minute: 0 },
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: false,
  },
  {
    id: 'trial_reminder',
    label: 'Trial Reminder',
    description: 'A reminder before your store trial ends',
    defaultEnabled: true,
    defaultTimeWindow: null,
    respectsQuietHours: true,
    premiumOnly: false,
    safetyExempt: true,
  },
];

const NOTIFICATION_CATEGORY_ES: Record<string, { label: string; description: string }> = {
  daily_checkin: { label: 'Check-in diario', description: 'Un recordatorio suave para hacer check-in contigo' },
  weekly_reflection: { label: 'Reflexión semanal', description: 'Aviso cuando tu reflexión semanal está lista' },
  ritual_reminder: { label: 'Rituales diarios', description: 'Recordatorios de ritual de mañana, mediodía y noche' },
  relationship_support: { label: 'Apoyo relacional', description: 'Recordatorios suaves de pausa durante detonantes relacionales' },
  calm_followup: { label: 'Seguimiento de calma', description: 'Un check-in después de que bajan momentos intensos' },
  regulation_followup: { label: 'Seguimiento de regulación', description: 'Check-in después de episodios de malestar alto' },
  premium_reflection: { label: 'Insights de membresía', description: 'Insights más profundos sobre patrones emocionales' },
  therapist_report: { label: 'Reporte para terapia', description: 'Cuando hay un nuevo reporte para terapia listo' },
  reengagement: { label: 'Reconexión suave', description: 'Un recordatorio de apoyo si no has entrado en un tiempo' },
  streak_support: { label: 'Apoyo de racha', description: 'Ánimo para mantener tu ritmo de check-ins' },
  gentle_nudge: { label: 'Recordatorio suave', description: 'Ánimo para un check-in al final del día' },
  premium_upgrade: { label: 'Recordatorios de insights de membresía', description: 'Recordatorios ocasionales sobre funciones avanzadas que te interesaron' },
  trial_reminder: { label: 'Recordatorio de prueba', description: 'Un aviso antes de que termine tu prueba de la tienda' },
};

export const NOTIFICATION_CATEGORIES: NotificationCategoryConfig[] = ENGLISH_NOTIFICATION_CATEGORIES.map(category =>
  localizedFields({ ...category }, {
    label: { en: category.label, es: NOTIFICATION_CATEGORY_ES[category.id]?.label ?? category.label },
    description: {
      en: category.description,
      es: NOTIFICATION_CATEGORY_ES[category.id]?.description ?? category.description,
    },
  }),
);

export function getCategoryConfig(id: string): NotificationCategoryConfig | undefined {
  return NOTIFICATION_CATEGORIES.find(c => c.id === id);
}

export function getDeepLinkForCategory(category: string): string {
  switch (category) {
    case 'daily_checkin':
    case 'gentle_nudge':
    case 'reengagement':
      return '/check-in';
    case 'weekly_reflection':
      return '/weekly-reflection';
    case 'ritual_reminder':
      return '/daily-ritual';
    case 'relationship_support':
      return '/relationship-copilot';
    case 'calm_followup':
    case 'regulation_followup':
      return '/check-in';
    case 'premium_reflection':
      return '/emotional-insights';
    case 'therapist_report':
      return '/therapy-report';
    case 'streak_support':
      return '/check-in';
    case 'premium_upgrade':
    case 'trial_reminder':
      return '/upgrade';
    default:
      return '/check-in';
  }
}
