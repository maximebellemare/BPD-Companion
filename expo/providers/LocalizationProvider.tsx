import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { i18n, SupportedLanguage } from '@/lib/i18n';
import {
  DEFAULT_LANGUAGE,
  isLanguageSelectable,
  LanguageSource,
  resolveInitialLanguage,
  setStoredLanguageOverride,
} from '@/lib/i18n/languageStorage';

type LocalizationContextValue = {
  language: SupportedLanguage;
  source: LanguageSource;
  isReady: boolean;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [source, setSource] = useState<LanguageSource>('fallback');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void resolveInitialLanguage()
      .then(async (resolved) => {
        await i18n.changeLanguage(resolved.language);
        if (!mounted) return;
        setLanguageState(resolved.language);
        setSource(resolved.source);
      })
      .finally(() => {
        if (mounted) setIsReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLanguage: SupportedLanguage) => {
    const selectableLanguage = isLanguageSelectable(nextLanguage) ? nextLanguage : DEFAULT_LANGUAGE;
    await i18n.changeLanguage(selectableLanguage);
    setLanguageState(selectableLanguage);
    setSource('manual');
    void setStoredLanguageOverride(selectableLanguage);
  }, []);

  const value = useMemo<LocalizationContextValue>(() => ({
    language,
    source,
    isReady,
    setLanguage,
  }), [isReady, language, setLanguage, source]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextValue {
  const value = useContext(LocalizationContext);
  if (!value) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return value;
}
