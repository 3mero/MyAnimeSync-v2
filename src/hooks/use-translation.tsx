'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations } from '@/i18n';

type Language = 'ar' | 'en';
type Translations = typeof translations.ar;

interface LanguageContextType {
  lang: Language;
  t: (key: keyof Translations, replacements?: Record<string, string>) => string;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start with 'ar' on both server and client to prevent hydration mismatch.
  const [lang, setLang] = useState<Language>('ar');

  // On client-side mount, safely read from localStorage.
  useEffect(() => {
    const storedLang = localStorage.getItem('anime-sync-lang') as Language;
    if (storedLang && ['ar', 'en'].includes(storedLang)) {
        setLang(storedLang);
    }
  }, []);


  // This effect syncs changes back to localStorage and document attributes
  useEffect(() => {
    localStorage.setItem('anime-sync-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = 'rtl'; // Always force RTL
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prevLang => (prevLang === 'ar' ? 'en' : 'ar'));
  };

  const t = (key: keyof Translations, replacements?: Record<string, string>): string => {
    let translation = translations[lang]?.[key] || translations['en']?.[key] || String(key);
    
    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            const regex = new RegExp(`{{${placeholder}}}`, 'g');
            translation = translation.replace(regex, replacements[placeholder]);
        });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
