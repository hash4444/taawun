import React, { useState, useEffect, ReactNode } from 'react';
import { Language, getTranslation } from '@/lib/i18n';
import { AppContext } from '@/contexts/app-context-base';

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
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

  // Load saved language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('taawun_language') as Language;
    if (savedLang) setLanguage(savedLang);
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
