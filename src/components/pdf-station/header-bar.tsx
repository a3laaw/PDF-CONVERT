"use client";

import { ArrowLeftRight } from "lucide-react";

/** شريط الأعلى: الاسم + وصف مختصر — مساحة عمل واحدة لأدوات PDF والصور */
export function HeaderBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <span className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <ArrowLeftRight className="size-4.5" aria-hidden />
          </span>
          <span className="text-lg font-extrabold">محوّل PDF</span>
        </span>
        <span className="mr-auto hidden text-xs font-bold text-muted-foreground sm:block">
          أدوات PDF والصور — كل الشغل داخل متصفحك
        </span>
      </div>
    </header>
  );
}
