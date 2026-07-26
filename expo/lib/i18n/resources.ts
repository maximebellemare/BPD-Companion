import commonEn from '@/locales/en/common.json';
import commonEs from '@/locales/es/common.json';
import authEn from '@/locales/en/auth.json';
import authEs from '@/locales/es/auth.json';
import onboardingEn from '@/locales/en/onboarding.json';
import onboardingEs from '@/locales/es/onboarding.json';
import subscriptionEn from '@/locales/en/subscription.json';
import subscriptionEs from '@/locales/es/subscription.json';
import navigationEn from '@/locales/en/navigation.json';
import navigationEs from '@/locales/es/navigation.json';
import todayEn from '@/locales/en/today.json';
import todayEs from '@/locales/es/today.json';
import toolsEn from '@/locales/en/tools.json';
import toolsEs from '@/locales/es/tools.json';
import companionEn from '@/locales/en/companion.json';
import companionEs from '@/locales/es/companion.json';
import safetyEn from '@/locales/en/safety.json';
import safetyEs from '@/locales/es/safety.json';
import notificationsEn from '@/locales/en/notifications.json';
import notificationsEs from '@/locales/es/notifications.json';
import profileEn from '@/locales/en/profile.json';
import profileEs from '@/locales/es/profile.json';
import legalEn from '@/locales/en/legal.json';
import legalEs from '@/locales/es/legal.json';

export const i18nResources = {
  en: {
    common: commonEn,
    auth: authEn,
    onboarding: onboardingEn,
    subscription: subscriptionEn,
    navigation: navigationEn,
    today: todayEn,
    tools: toolsEn,
    companion: companionEn,
    safety: safetyEn,
    notifications: notificationsEn,
    profile: profileEn,
    legal: legalEn,
  },
  es: {
    common: commonEs,
    auth: authEs,
    onboarding: onboardingEs,
    subscription: subscriptionEs,
    navigation: navigationEs,
    today: todayEs,
    tools: toolsEs,
    companion: companionEs,
    safety: safetyEs,
    notifications: notificationsEs,
    profile: profileEs,
    legal: legalEs,
  },
} as const;

export const i18nNamespaces = Object.keys(i18nResources.en);

export type SupportedLanguage = keyof typeof i18nResources;
