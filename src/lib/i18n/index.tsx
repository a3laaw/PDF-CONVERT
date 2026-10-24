"use client";

/* مزوّد اللغة — سياق React واحد للموقع كله
   يضبط lang/dir على <html> ويحفظ الاختيار في localStorage */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  detectLocale,
  LOCALE_META,
  STORAGE_KEY,
  type Locale,
} from "./core";
import { ar } from "./ar";
import { en } from "./en";
import { hi } from "./hi";

const DICTS: Record<Locale, Record<string, string>> = { ar, en, hi };

interface I18nValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (l: Locale) => void;
  /** ترجمة بمفتاح — يدعم تعويض {n} و{name}… */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  /* أول تركيب: نقرأ التفضيل المحفوظ أو لغة المتصفح — بعد التراكب لتفادي اختلاف الترطيب */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(detectLocale());
  }, []);

  useEffect(() => {
    const meta = LOCALE_META[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* تخزين محجوب — لا مشكلة، الاختيار يبقى للجلسة */
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = DICTS[locale][key] ?? ar[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replaceAll(`{${k}}`, String(v));
        }
      }
      return s;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, dir: LOCALE_META[locale].dir, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    /* خارج المزوّد: عربي افتراضي — آمن للاستخدام في أي مكان */
    return {
      locale: "ar",
      dir: "rtl",
      setLocale: () => undefined,
      t: (key, vars) => {
        let s = ar[key] ?? key;
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
        return s;
      },
    };
  }
  return ctx;
}

/** مفتاح أداة داخل القاموس */
export const toolKey = (id: string, field: "name" | "desc") => `tools.${id}.${field}`;
