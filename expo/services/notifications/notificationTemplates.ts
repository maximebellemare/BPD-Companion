import { NotificationTemplate, NotificationCategory } from '@/types/notifications';

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    category: 'daily_checkin',
    variants: [
      { title: 'A moment for you', body: 'Take a moment to check in with yourself.' },
      { title: 'How are you today?', body: 'A quick check-in can bring clarity to your day.' },
      { title: 'Your daily check-in', body: 'Even a brief pause to notice how you feel can help.' },
      { title: 'Checking in', body: 'How are you feeling right now? Your awareness matters.' },
    ],
    deepLink: '/check-in',
  },
  {
    category: 'weekly_reflection',
    variants: [
      { title: 'Your weekly reflection is ready', body: 'Look back on this week with compassion and curiosity.' },
      { title: 'Time to reflect', body: 'Your week has a story. Take a moment to notice it.' },
      { title: 'Weekly reflection', body: 'A calm look back at your emotional week is waiting.' },
    ],
    deepLink: '/weekly-reflection',
  },
  {
    category: 'ritual_reminder',
    variants: [
      { title: 'Morning ritual', body: 'Start your day by noticing how you feel.' },
      { title: 'Midday pause', body: 'A short breath can reset your afternoon.' },
      { title: 'Evening reflection', body: 'What stood out emotionally today?' },
    ],
    deepLink: '/daily-ritual',
  },
  {
    category: 'relationship_support',
    variants: [
      { title: 'A gentle pause', body: 'You might benefit from slowing down before responding.' },
      { title: 'Before you respond', body: 'A short pause may help protect what matters to you right now.' },
      { title: 'Relationship support', body: 'Communication stress can be intense. Support is here if you need it.' },
    ],
    deepLink: '/relationship-copilot',
  },
  {
    category: 'calm_followup',
    variants: [
      { title: 'How are you now?', body: 'Things felt intense earlier. A calmer space is here when you need it.' },
      { title: 'Checking in with you', body: 'You showed up for yourself earlier. How are things now?' },
      { title: 'A quiet check-in', body: 'The intensity may have shifted. How are you feeling?' },
    ],
    deepLink: '/check-in',
  },
  {
    category: 'regulation_followup',
    variants: [
      { title: 'How are you feeling now?', body: 'Things felt intense earlier. You showed up for yourself — how are you now?' },
      { title: 'A moment to check in', body: 'After what you went through, it's worth noticing how you feel now.' },
      { title: 'Following up', body: 'High distress is exhausting. Take a gentle moment for yourself.' },
    ],
    deepLink: '/check-in',
  },
  {
    category: 'premium_reflection',
    variants: [
      { title: 'New insight available', body: 'A deeper look at your emotional patterns is ready.' },
      { title: 'Pattern insight', body: 'Your emotional data reveals something worth noticing.' },
    ],
    deepLink: '/emotional-insights',
  },
  {
    category: 'therapist_report',
    variants: [
      { title: 'Therapist report ready', body: 'A structured summary of your recent emotional patterns is ready.' },
      { title: 'Your report is ready', body: 'Bring this to your next session — it may help the conversation.' },
    ],
    deepLink: '/therapy-report',
  },
  {
    category: 'reengagement',
    variants: [
      { title: 'A calmer space is here', body: 'Whenever you need it, this space is waiting for you.' },
      { title: 'Welcome back', body: 'No pressure. Just a reminder that support is here.' },
    ],
    deepLink: '/check-in',
  },
  {
    category: 'streak_support',
    variants: [
      { title: 'Keep your rhythm going', body: 'A quick check-in today keeps your awareness growing.' },
      { title: 'Your rhythm matters', body: 'Showing up regularly builds self-awareness over time.' },
    ],
    deepLink: '/check-in',
  },
  {
    category: 'gentle_nudge',
    variants: [
      { title: 'End-of-day check-in', body: 'Even a quick one can help you process the day.' },
      { title: 'Before the day ends', body: 'A moment of reflection can bring closure to your day.' },
    ],
    deepLink: '/check-in',
  },
];

export function getRandomTemplate(category: NotificationCategory): { title: string; body: string; deepLink: string } {
  const template = NOTIFICATION_TEMPLATES.find(t => t.category === category);
  if (!template || template.variants.length === 0) {
    return {
      title: 'BPD Companion',
      body: 'A moment of support is here for you.',
      deepLink: '/check-in',
    };
  }

  const variant = template.variants[Math.floor(Math.random() * template.variants.length)];
  return {
    title: variant.title,
    body: variant.body,
    deepLink: template.deepLink,
  };
}

export function getTemplateForCategory(category: NotificationCategory): NotificationTemplate | undefined {
  return NOTIFICATION_TEMPLATES.find(t => t.category === category);
}
