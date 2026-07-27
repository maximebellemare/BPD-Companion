import { NotificationCategory } from '@/types/notifications';
import {
  NotificationRoute,
  NotificationQuickAction,
  NotificationQuickActionConfig,
} from '@/types/notificationRouting';
import { localizedField, localizedFields } from '@/lib/i18n/staticText';

const NOTIFICATION_ROUTES: NotificationRoute[] = [
  localizedFields({
    category: 'daily_checkin',
    route: '/check-in',
    entryTitle: "Let's take a quick check-in.",
    entrySubtitle: 'A moment to notice how you feel right now.',
    quickActions: ['check_in_now', 'dismiss'],
    contextKeys: ['latestIntensity', 'latestEmotion'],
  }, {
    entryTitle: { en: "Let's take a quick check-in.", es: 'Hagamos un check-in rápido.' },
    entrySubtitle: { en: 'A moment to notice how you feel right now.', es: 'Un momento para notar cómo te sientes ahora.' },
  }),
  localizedFields({
    category: 'weekly_reflection',
    route: '/weekly-reflection',
    entryTitle: 'Your reflection is ready.',
    entrySubtitle: 'A calm look back at your emotional week.',
    quickActions: ['view_reflection', 'dismiss'],
    contextKeys: ['recentCheckInCount'],
  }, {
    entryTitle: { en: 'Your reflection is ready.', es: 'Tu reflexión está lista.' },
    entrySubtitle: { en: 'A calm look back at your emotional week.', es: 'Una mirada tranquila a tu semana emocional.' },
  }),
  localizedFields({
    category: 'ritual_reminder',
    route: '/daily-ritual',
    entryTitle: 'Time for your ritual.',
    entrySubtitle: 'A small moment of calm can shift your whole day.',
    quickActions: ['open_ritual', 'dismiss'],
    contextKeys: [],
  }, {
    entryTitle: { en: 'Time for your ritual.', es: 'Momento de tu ritual.' },
    entrySubtitle: { en: 'A small moment of calm can shift your whole day.', es: 'Un pequeño momento de calma puede cambiar tu día.' },
  }),
  localizedFields({
    category: 'relationship_support',
    route: '/relationship-copilot',
    entryTitle: "Let's slow this down together.",
    entrySubtitle: 'A calmer approach to what feels intense right now.',
    quickActions: ['open_copilot', 'breathe', 'dismiss'],
    contextKeys: ['activeRelationshipContext', 'latestTrigger'],
  }, {
    entryTitle: { en: "Let's slow this down together.", es: 'Bajemos la velocidad juntos.' },
    entrySubtitle: { en: 'A calmer approach to what feels intense right now.', es: 'Una forma más calmada de acercarte a lo que se siente intenso ahora.' },
  }),
  localizedFields({
    category: 'calm_followup',
    route: '/check-in',
    entryTitle: 'A quieter moment to look back.',
    entrySubtitle: 'Things felt intense earlier. How are you now?',
    quickActions: ['check_in_now', 'journal', 'dismiss'],
    contextKeys: ['highDistressRecent', 'latestIntensity'],
  }, {
    entryTitle: { en: 'A quieter moment to look back.', es: 'Un momento más tranquilo para mirar atrás.' },
    entrySubtitle: { en: 'Things felt intense earlier. How are you now?', es: 'Antes se sintió intenso. ¿Cómo estás ahora?' },
  }),
  localizedFields({
    category: 'regulation_followup',
    route: '/check-in',
    entryTitle: 'Checking in after the intensity.',
    entrySubtitle: 'You showed up for yourself. How are things now?',
    quickActions: ['check_in_now', 'breathe', 'dismiss'],
    contextKeys: ['highDistressRecent', 'latestIntensity'],
  }, {
    entryTitle: { en: 'Checking in after the intensity.', es: 'Check-in después de la intensidad.' },
    entrySubtitle: { en: 'You showed up for yourself. How are things now?', es: 'Te presentaste por ti. ¿Cómo están las cosas ahora?' },
  }),
  localizedFields({
    category: 'premium_reflection',
    route: '/emotional-insights',
    entryTitle: 'A deeper look at your patterns.',
    entrySubtitle: 'Your emotional data reveals something worth noticing.',
    quickActions: ['reflect', 'dismiss'],
    contextKeys: [],
  }, {
    entryTitle: { en: 'A deeper look at your patterns.', es: 'Una mirada más profunda a tus patrones.' },
    entrySubtitle: { en: 'Your emotional data reveals something worth noticing.', es: 'Tus datos emocionales muestran algo que vale la pena notar.' },
  }),
  localizedFields({
    category: 'therapist_report',
    route: '/therapy-report',
    entryTitle: 'Your therapist report is ready.',
    entrySubtitle: 'Bring this to your next session — it may help.',
    quickActions: ['view_report', 'dismiss'],
    contextKeys: [],
  }, {
    entryTitle: { en: 'Your therapist report is ready.', es: 'Tu reporte para terapia está listo.' },
    entrySubtitle: { en: 'Bring this to your next session — it may help.', es: 'Llévalo a tu próxima sesión; puede ayudar en la conversación.' },
  }),
  localizedFields({
    category: 'reengagement',
    route: '/',
    entryTitle: 'Welcome back.',
    entrySubtitle: 'A calmer space is here whenever you need it.',
    quickActions: ['check_in_now', 'dismiss'],
    contextKeys: [],
  }, {
    entryTitle: { en: 'Welcome back.', es: 'Qué bueno verte de nuevo.' },
    entrySubtitle: { en: 'A calmer space is here whenever you need it.', es: 'Un espacio más calmado está aquí cuando lo necesites.' },
  }),
  localizedFields({
    category: 'streak_support',
    route: '/check-in',
    entryTitle: 'Keep your rhythm.',
    entrySubtitle: 'A quick check-in keeps your self-awareness growing.',
    quickActions: ['check_in_now', 'dismiss'],
    contextKeys: [],
  }, {
    entryTitle: { en: 'Keep your rhythm.', es: 'Mantén tu ritmo.' },
    entrySubtitle: { en: 'A quick check-in keeps your self-awareness growing.', es: 'Un check-in rápido mantiene creciendo tu autoconciencia.' },
  }),
  localizedFields({
    category: 'gentle_nudge',
    route: '/check-in',
    entryTitle: 'Before the day ends.',
    entrySubtitle: 'Even a quick reflection can bring closure to your day.',
    quickActions: ['check_in_now', 'journal', 'dismiss'],
    contextKeys: [],
  }, {
    entryTitle: { en: 'Before the day ends.', es: 'Antes de que termine el día.' },
    entrySubtitle: { en: 'Even a quick reflection can bring closure to your day.', es: 'Incluso una reflexión breve puede traer cierre al día.' },
  }),
];

export const QUICK_ACTION_CONFIGS: NotificationQuickActionConfig[] = [
  localizedField({ id: 'check_in_now', label: 'Check in now', route: '/check-in', icon: 'Heart' }, 'label', 'Check in now', 'Hacer check-in'),
  localizedField({ id: 'reflect', label: 'Reflect', route: '/emotional-insights', icon: 'Sparkles' }, 'label', 'Reflect', 'Reflexionar'),
  localizedField({ id: 'open_copilot', label: 'Open Copilot', route: '/relationship-copilot', icon: 'MessageCircle' }, 'label', 'Open Copilot', 'Abrir copilot'),
  localizedField({ id: 'breathe', label: 'Breathe', route: '/guided-regulation', icon: 'Wind' }, 'label', 'Breathe', 'Respirar'),
  localizedField({ id: 'journal', label: 'Journal', route: '/check-in', icon: 'BookOpen' }, 'label', 'Journal', 'Diario'),
  localizedField({ id: 'view_reflection', label: 'View Reflection', route: '/weekly-reflection', icon: 'Calendar' }, 'label', 'View Reflection', 'Ver reflexión'),
  localizedField({ id: 'view_report', label: 'View Report', route: '/therapy-report', icon: 'FileText' }, 'label', 'View Report', 'Ver reporte'),
  localizedField({ id: 'open_ritual', label: 'Start Ritual', route: '/daily-ritual', icon: 'Flame' }, 'label', 'Start Ritual', 'Empezar ritual'),
  localizedField({ id: 'dismiss', label: 'Not now', route: '', icon: 'X' }, 'label', 'Not now', 'Ahora no'),
];

class NotificationRoutingService {
  getRouteForCategory(category: NotificationCategory): NotificationRoute | null {
    const route = NOTIFICATION_ROUTES.find(r => r.category === category);
    if (!route) {
      console.log('[NotificationRouting] No route found for category:', category);
      return null;
    }
    return route;
  }

  resolveRoute(
    category: NotificationCategory,
    data?: Record<string, string>,
  ): string {
    if (data?.target_screen) {
      console.log('[NotificationRouting] Using target_screen from data:', data.target_screen);
      return data.target_screen;
    }

    const routeConfig = this.getRouteForCategory(category);
    if (routeConfig) {
      return routeConfig.route;
    }

    console.log('[NotificationRouting] Falling back to check-in for:', category);
    return '/check-in';
  }

  resolveQuickAction(action: NotificationQuickAction): string {
    const config = QUICK_ACTION_CONFIGS.find(c => c.id === action);
    return config?.route ?? '/check-in';
  }

  getEntryState(
    category: NotificationCategory,
  ): { title: string; subtitle: string } {
    const route = this.getRouteForCategory(category);
    if (route) {
      return {
        title: route.entryTitle,
        subtitle: route.entrySubtitle,
      };
    }
    return {
      title: 'Welcome back.',
      subtitle: 'Support is here when you need it.',
    };
  }

  getQuickActionsForCategory(category: NotificationCategory): NotificationQuickActionConfig[] {
    const route = this.getRouteForCategory(category);
    if (!route) return [];

    return route.quickActions
      .filter(a => a !== 'dismiss')
      .map(actionId => QUICK_ACTION_CONFIGS.find(c => c.id === actionId))
      .filter((c): c is NotificationQuickActionConfig => c !== undefined);
  }

  shouldPrefillContext(category: NotificationCategory): boolean {
    const route = this.getRouteForCategory(category);
    return (route?.contextKeys.length ?? 0) > 0;
  }

  getContextKeysForCategory(category: NotificationCategory): string[] {
    const route = this.getRouteForCategory(category);
    return route?.contextKeys ?? [];
  }

  buildNotificationData(
    category: NotificationCategory,
    extras?: Record<string, string>,
  ): Record<string, string> {
    const route = this.resolveRoute(category);
    return {
      category,
      target_screen: route,
      notification_entry: 'true',
      ...extras,
    };
  }
}

export const notificationRoutingService = new NotificationRoutingService();
