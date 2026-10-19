"use client";

import { TrainFront, ShieldCheck, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toHindiDigits } from "@/lib/arabic";

interface Props {
  view: "home" | "work";
  onViewChange: (v: "home" | "work") => void;
  onOpenPalette: () => void;
}

/** شريط الأعلى: الهوية + الحالة + التبويبات */
export function HeaderBar({ view, onViewChange, onOpenPalette }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-3">
        <button
          onClick={() => onViewChange("home")}
          className="flex items-center gap-3 text-right"
          aria-label="العودة للرئيسية"
        >
          <span className="station-pulse grid place-items-center size-10 rounded-xl bg-primary text-primary-foreground shadow-md">
            <TrainFront className="size-5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block font-extrabold text-lg">محطّة PDF</span>
            <span className="block text-xs text-muted-foreground">كل أدوات PDF في محطة واحدة</span>
          </span>
        </button>

        <nav className="mr-auto flex items-center gap-1" aria-label="التنقل الرئيسي">
          <Button
            variant={view === "home" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewChange("home")}
            className="font-bold"
          >
            الرئيسية
          </Button>
          <Button
            variant={view === "work" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewChange("work")}
            className="font-bold"
          >
            مساحة العمل
          </Button>

          <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 mr-2">
            <ShieldCheck className="size-3.5" aria-hidden />
            يعمل داخل متصفحك — لا يُرفع أي ملف
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPalette}
            className="gap-2 text-xs text-muted-foreground"
            aria-label="بحث سريع في الأدوات"
          >
            <Command className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">بحث سريع</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold">Ctrl+K</kbd>
          </Button>
        </nav>
      </div>
      <div className="h-0.5 bg-gradient-to-l from-primary via-primary/40 to-transparent" />
      <span className="sr-only">
        محطّة PDF — النسخة المحسّنة رقم {toHindiDigits(2)}
      </span>
    </header>
  );
}
