'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale } from '@/lib/site-copy';

type Theme = 'light' | 'dark';

type AppPreferencesContextValue = {
  locale: Locale;
  theme: Theme;
  mounted: boolean;
  toggleLocale: () => void;
  toggleTheme: () => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

// Keeps language and theme in one place so pages do not manage this separately.
// If we add user settings later, this is where saved preferences should connect.
export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read browser-only values after mount to avoid Next hydration mismatch.
    const storedLocale = window.localStorage.getItem('site-locale');
    const storedTheme = window.localStorage.getItem('site-theme') as Theme | null;

    if (storedLocale === 'ar' || storedLocale === 'en') {
      setLocale(storedLocale);
    }

    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.lang = locale;
    root.dir = locale === 'ar' ? 'rtl' : 'ltr';

    if (mounted) {
      // For now this is local storage. Later it can sync with profile settings.
      window.localStorage.setItem('site-theme', theme);
      window.localStorage.setItem('site-locale', locale);
    }
  }, [locale, mounted, theme]);

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      locale,
      theme,
      mounted,
      toggleLocale: () => setLocale((current) => (current === 'en' ? 'ar' : 'en')),
      toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [locale, mounted, theme]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);
  if (!context) {
    throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  }
  return context;
}
