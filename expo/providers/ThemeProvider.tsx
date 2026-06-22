import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import Colors, { applyColorTheme, darkColors, lightColors } from '@/constants/colors';
import { useProfile } from '@/providers/ProfileProvider';
import type { UserProfile } from '@/types/profile';

type ThemeName = UserProfile['appearancePreference'];

type AppThemeContextValue = {
  theme: ThemeName;
  colors: typeof lightColors;
  setTheme: (theme: ThemeName) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile, updateProfile } = useProfile();
  const theme = profile.appearancePreference;
  const colors = theme === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    applyColorTheme(theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeName) => {
    applyColorTheme(nextTheme);
    updateProfile({ appearancePreference: nextTheme });
  }, [updateProfile]);

  const value = useMemo(() => ({
    theme,
    colors,
    setTheme,
  }), [colors, setTheme, theme]);

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const value = useContext(AppThemeContext);
  if (!value) {
    return {
      theme: 'light',
      colors: Colors,
      setTheme: () => {},
    };
  }
  return value;
}
