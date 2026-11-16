import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EN, interpolate, translateText, type Lang } from './translate';

export type { Lang } from './translate';

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (spanish: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

const STORAGE_KEY = 'aegis.lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'es';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'es' ? stored : 'es';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.title =
      lang === 'es'
        ? 'A.E.G.I.S. | Sistema de Monitorización de Salud — Prototipo Funcional'
        : 'A.E.G.I.S. | Health Monitoring System — Functional Prototype';
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (spanish, params) => {
        if (lang === 'es') return interpolate(spanish, params);
        const english = EN[spanish];
        if (english !== undefined) return interpolate(english, params);
        return translateText(interpolate(spanish, params), lang);
      },
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
