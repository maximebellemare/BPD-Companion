import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { i18n, SupportedLanguage } from '@/lib/i18n';
import {
  DEFAULT_LANGUAGE,
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
    await i18n.changeLanguage(nextLanguage);
    setLanguageState(nextLanguage);
    setSource('manual');
    void setStoredLanguageOverride(nextLanguage);
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
