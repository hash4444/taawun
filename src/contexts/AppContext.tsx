import React, { useState, useEffect, ReactNode } from 'react';
import { Language, SUPPORTED_LANGUAGES, getTranslation, type TranslationKey } from '@/lib/i18n';
import { AppContext } from '@/contexts/app-context-base';

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(() => {
    try { const saved = localStorage.getItem('taawun_language'); return SUPPORTED_LANGUAGES.some(item => item.code === saved) ? saved as Language : 'en'; } catch { return 'en'; }
  });
  const setLanguage = (next: Language) => updateLanguage(SUPPORTED_LANGUAGES.some(item => item.code === next) ? next : 'en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const isRTL = language === 'ar';
  const t = (key: TranslationKey) => getTranslation(language, key);

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [isRTL, language]);

  // Apply theme class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Restore appearance; the launch language is validated in the state initializer.
  useEffect(() => {
    const savedTheme = localStorage.getItem('taawun_theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem('taawun_language', language);
  }, [language]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('taawun_theme', theme);
  }, [theme]);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL,
        theme,
        setTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
