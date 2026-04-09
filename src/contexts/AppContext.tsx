import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslation, TranslationKey } from '@/lib/i18n';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
