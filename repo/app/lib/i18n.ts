import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, TranslationKey } from './translations';

export type SupportedLanguage = 'auto' | 'en' | 'zh' | 'ja' | 'ko' | 'es' | 'fr';

export const LANGUAGE_OPTIONS: { code: SupportedLanguage; label: string }[] = [
  { code: 'auto', label: 'Auto' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
];

const STORAGE_KEY = '@tennishq_language';

function resolveLanguage(lang: SupportedLanguage): string {
  if (lang === 'auto') return 'en';
  return lang;
}

function translate(key: TranslationKey, lang: string): string {
  const langTranslations = translations[lang as keyof typeof translations];
  if (langTranslations && key in langTranslations) {
    return langTranslations[key as keyof typeof langTranslations];
  }
  return translations.en[key] || key;
}

export function getPlayerName(
  player: { name: string; nameLocalized?: Record<string, string> },
  lang: string,
): string {
  if (lang === 'en' || !player.nameLocalized?.[lang]) return player.name;
  return player.nameLocalized[lang];
}

interface LanguageContextType {
  language: SupportedLanguage;
  resolvedLanguage: string;
  setLanguage: (lang: SupportedLanguage) => void;
  getPlayerName: (player: { name: string; nameLocalized?: Record<string, string> }) => string;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'auto',
  resolvedLanguage: 'en',
  setLanguage: () => {},
  getPlayerName: (p) => p.name,
  t: (key) => translations.en[key] || key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('auto');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setLanguageState(val as SupportedLanguage);
    });
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  };

  const resolved = resolveLanguage(language);

  return React.createElement(
    LanguageContext.Provider,
    {
      value: {
        language,
        resolvedLanguage: resolved,
        setLanguage,
        getPlayerName: (player) => getPlayerName(player, resolved),
        t: (key) => translate(key, resolved),
      },
    },
    children,
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export type { TranslationKey };
