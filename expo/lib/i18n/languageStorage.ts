import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import type { SupportedLanguage } from './resources';

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'es'];
export const SPANISH_LANGUAGE_SELECTION_ENABLED = false;
export const SELECTABLE_LANGUAGES: SupportedLanguage[] = SPANISH_LANGUAGE_SELECTION_ENABLED
  ? SUPPORTED_LANGUAGES
  : [DEFAULT_LANGUAGE];
export const LANGUAGE_STORAGE_KEY = 'bpd_app_language';

export type LanguageSource = 'manual' | 'device' | 'fallback';

export type ResolvedLanguage = {
  language: SupportedLanguage;
  source: LanguageSource;
};

export function normalizeLanguageTag(tag: string | null | undefined): SupportedLanguage | null {
  if (!tag) return null;
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'es' || normalized.startsWith('es-') || normalized.startsWith('es_')) return 'es';
  if (normalized === 'en' || normalized.startsWith('en-') || normalized.startsWith('en_')) return 'en';
  return null;
}

export function isLanguageSelectable(language: SupportedLanguage): boolean {
  return SELECTABLE_LANGUAGES.includes(language);
}

export function resolveLanguage(params: {
  manualOverride?: string | null;
  profileLanguage?: string | null;
  deviceLocales?: { languageTag?: string | null; languageCode?: string | null }[] | null;
}): ResolvedLanguage {
  const manual = normalizeLanguageTag(params.manualOverride);
  if (manual && isLanguageSelectable(manual)) return { language: manual, source: 'manual' };

  const profile = normalizeLanguageTag(params.profileLanguage);
  if (profile && isLanguageSelectable(profile)) return { language: profile, source: 'manual' };

  const deviceLocales = params.deviceLocales ?? [];
  for (const locale of deviceLocales) {
    const language = normalizeLanguageTag(locale.languageTag ?? locale.languageCode);
    if (language && isLanguageSelectable(language)) return { language, source: 'device' };
  }

  return { language: DEFAULT_LANGUAGE, source: 'fallback' };
}

export async function getStoredLanguageOverride(): Promise<SupportedLanguage | null> {
  try {
    return normalizeLanguageTag(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export async function setStoredLanguageOverride(language: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Language selection remains active for the session even if persistence fails.
  }
}

export async function clearStoredLanguageOverride(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch {
    // Best effort only.
  }
}

export async function resolveInitialLanguage(): Promise<ResolvedLanguage> {
  const manualOverride = await getStoredLanguageOverride();
  return resolveLanguage({
    manualOverride,
    deviceLocales: Localization.getLocales(),
  });
}
