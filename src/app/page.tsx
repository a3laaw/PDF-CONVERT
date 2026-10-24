"use client";

import { Lock } from "lucide-react";
import { HeaderBar } from "@/components/pdf-station/header-bar";
import { Workbench } from "@/components/pdf-station/workbench";

/** «محوّل PDF» — مساحة عمل واحدة: أدوات PDF والصور، عرض أولًا ثم الإجراء */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <HeaderBar />

      <main className="flex-1">
        <Workbench />
      </main>

      <footer className="mt-auto border-t border-border/70 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3.5">
          <p className="text-xs text-muted-foreground">
            <span className="text-sm font-extrabold text-foreground">محوّل PDF</span> — كل أدوات
            ملفاتك بالعربي
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            الشغل يتم داخل متصفحك — ملفاتك لا تُرفع لأي خادم
          </p>
        </div>
      </footer>
    </div>
  );
}
