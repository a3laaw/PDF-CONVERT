"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { HeaderBar, type AppView } from "@/components/pdf-station/header-bar";
import { Workbench } from "@/components/pdf-station/workbench";
import { ConvertStudio } from "@/components/pdf-station/convert-studio";

/** «محوّل PDF» — عرض الملف + شريط أدوات، بدون أي خطوات إضافية */
export default function Home() {
  const [view, setView] = useState<AppView>("home");

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderBar view={view} onViewChange={setView} />

      <main className="flex-1">
        {view === "home" ? (
          <Workbench onOpenConvert={() => setView("convert")} />
        ) : (
          <ConvertStudio />
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
            {view === "convert"
              ? "التحويل على الخادم: يُحذف الملف الأصلي فورًا والنواتج بعد ساعتين"
              : "الشغل يتم داخل متصفحك — ملفاتك لا تُرفع لأي خادم"}
          </p>
        </div>
      </footer>
    </div>
  );
}
