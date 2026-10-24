"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LOCALES, LOCALE_META } from "@/lib/i18n/core";

/** شريط الأعلى: الاسم + وصف مختصر + مبدّل اللغة — مساحة عمل واحدة */
export function HeaderBar() {
  const { t, locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <span className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <ArrowLeftRight className="size-4.5" aria-hidden />
          </span>
          <span className="text-lg font-extrabold">{t("site.name")}</span>
        </span>
        <span className="mr-auto hidden text-xs font-bold text-muted-foreground sm:block">
          {t("site.tagline")}
        </span>
        <span className="flex-1 sm:hidden" aria-hidden />
        {/* مبدّل اللغة */}
        <div ref={wrapRef} className="relative" data-testid="lang-switcher">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={t("lang.label")}
            aria-expanded={open}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-2.5 py-1.5 text-xs font-extrabold text-muted-foreground hover:border-primary/40 hover:text-primary transition"
          >
            <Globe className="size-4" aria-hidden />
            {LOCALE_META[locale].name}
          </button>
          {open && (
            <div className="absolute end-0 top-full z-50 mt-1.5 w-40 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-xl">
              {LOCALES.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLocale(l);
                    setOpen(false);
                  }}
                  aria-pressed={locale === l}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-extrabold transition ${
                    locale === l
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`grid size-5 place-items-center rounded-md text-[10px] ${
                      locale === l ? "bg-primary text-white" : "bg-secondary text-secondary-foreground"
                    }`}
                    aria-hidden
                  >
                    {LOCALE_META[l].flag}
                  </span>
                  {LOCALE_META[l].name}
                  {locale === l && <span className="ms-auto text-primary">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
