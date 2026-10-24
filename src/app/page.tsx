"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { HeaderBar, type AppView } from "@/components/pdf-station/header-bar";
import { Workbench } from "@/components/pdf-station/workbench";
import { CadStudio, type CadFamily } from "@/components/pdf-station/cad-studio";

/** «محوّل PDF» — أربعة استوديوهات بنفس النمط: عرض أولًا ثم الإجراء */
export default function Home() {
  const [view, setView] = useState<AppView>("home");
  const isCad = view.startsWith("cad-");

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderBar view={view} onViewChange={setView} />

      <main className="flex-1">
        {view === "home" ? (
          <Workbench onOpenStudio={(v) => setView(v)} />
        ) : (
          <CadStudio key={view} family={view.slice(4) as CadFamily} />
        )}
      </main>

      <footer className="mt-auto border-t border-border/70 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3.5">
          <p className="text-xs text-muted-foreground">
            <span className="text-sm font-extrabold text-foreground">محوّل PDF</span> — كل أدوات
            ملفاتك بالعربي
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            {isCad
              ? "العرض والتحويل على الخادم: يُحذف الملف الأصلي فورًا والنواتج بعد ساعتين"
              : "الشغل يتم داخل متصفحك — ملفاتك لا تُرفع لأي خادم"}
          </p>
        </div>
      </footer>
    </div>
  );
}
