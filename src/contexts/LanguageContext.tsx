import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { I18N_DATA } from '../constants/i18nData';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const humanizeKey = (key: string) => {
  const last = key.split('.').pop() || key;
  return last
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('medismart_language');
    return saved === 'en' || saved === 'ar' ? saved : 'ar';
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    localStorage.setItem('medismart_language', language);
  }, [direction, language]);

  const t = useMemo(
    () => (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: unknown = I18N_DATA[language];

      const resolveValue = (source: unknown): unknown => {
        let current = source;
        for (const segment of keys) {
          if (isObject(current) && segment in current) {
            current = current[segment];
          } else {
            return undefined;
          }
        }
        return current;
      };

      value = resolveValue(I18N_DATA[language]);

      if (typeof value !== 'string') {
        const fallbackLanguage: Language = language === 'ar' ? 'en' : 'ar';
        value = resolveValue(I18N_DATA[fallbackLanguage]);
      }

      if (typeof value !== 'string') {
        console.warn(`Missing translation key: ${key} (${language})`);
        return humanizeKey(key);
      }

      if (!params) return value;

      return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
        const pattern = new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g');
        return result.replace(pattern, String(paramValue));
      }, value);
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage: setLanguageState, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
