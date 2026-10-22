"use client";

import { ArrowLeftRight, FileOutput } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AppView = "home" | "convert";

interface Props {
  view: AppView;
  onViewChange: (v: AppView) => void;
}

/** شريط الأعلى: الاسم + تبويبان فقط */
export function HeaderBar({ view, onViewChange }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <span className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <ArrowLeftRight className="size-4.5" aria-hidden />
          </span>
          <span className="text-lg font-extrabold">محوّل PDF</span>
        </span>

        <nav className="mr-auto flex items-center gap-1" aria-label="التنقل الرئيسي">
          <Button
            variant={view === "home" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewChange("home")}
            className="font-bold"
          >
            الأدوات
          </Button>
          <Button
            variant={view === "convert" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewChange("convert")}
            className="gap-1.5 font-bold"
          >
            <FileOutput className="size-4" aria-hidden />
            تحويل
          </Button>
        </nav>
      </div>
    </header>
  );
}
