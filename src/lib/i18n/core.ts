/* نظام اللغات — عربي (أساسي) + English + हिन्दी
   الفلسفة: القاموس مسطّح بمفاتيح مثل tools.merge.name —
   أي مفتاح ناقص يرجع للعربي ثم للمفتاح نفسه، فلا ينكسر شيء */

export const LOCALES = ["ar", "en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_META: Record<Locale, { name: string; dir: "rtl" | "ltr"; flag: string }> = {
  ar: { name: "العربية", dir: "rtl", flag: "ع" },
  en: { name: "English", dir: "ltr", flag: "E" },
  hi: { name: "हिन्दी", dir: "ltr", flag: "हि" },
};

export const STORAGE_KEY = "mahatta-locale";

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && (LOCALES as readonly string[]).includes(saved)) return saved as Locale;
  const nav = window.navigator.language?.slice(0, 2);
  if (nav === "en") return "en";
  if (nav === "hi") return "hi";
  return "ar";
}
