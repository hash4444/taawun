import { createContext } from 'react';
import { Language, TranslationKey } from '@/lib/i18n';

export interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
