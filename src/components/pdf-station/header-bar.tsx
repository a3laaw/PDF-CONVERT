"use client";

import { ArrowLeftRight, DraftingCompass, Building2, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AppView = "home" | "cad-dwg" | "cad-rvt" | "cad-adobe";

interface Props {
  view: AppView;
  onViewChange: (v: AppView) => void;
}

const TABS: { id: AppView; label: string; icon?: React.ReactNode }[] = [
  { id: "home", label: "الأدوات" },
  { id: "cad-dwg", label: "أوتوكاد", icon: <DraftingCompass className="size-4" aria-hidden /> },
  { id: "cad-rvt", label: "ريفيت", icon: <Building2 className="size-4" aria-hidden /> },
  { id: "cad-adobe", label: "أدوبي", icon: <PenTool className="size-4" aria-hidden /> },
];

/** شريط الأعلى: الاسم + أربعة استوديوهات (PDF / أوتوكاد / ريفيت / أدوبي) */
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

        <nav className="mr-auto flex items-center gap-1 overflow-x-auto" aria-label="التنقل الرئيسي">
          {TABS.map((t) => (
            <Button
              key={t.id}
              variant={view === t.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewChange(t.id)}
              className="gap-1.5 font-bold"
            >
              {t.icon}
              {t.label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
