"use client";

import { useState } from "react";
import { Lock, Languages, Wand2, Gauge } from "lucide-react";
import { HeaderBar } from "@/components/pdf-station/header-bar";
import { Hero } from "@/components/pdf-station/hero";
import { CommandBar } from "@/components/pdf-station/command-bar";
import { FilePanel } from "@/components/pdf-station/file-panel";
import { StepsPanel } from "@/components/pdf-station/steps-panel";
import { TasksPanel } from "@/components/pdf-station/tasks-panel";
import { ToolsCatalog } from "@/components/pdf-station/tools-catalog";
import { CommandPalette } from "@/components/pdf-station/command-palette";
import { useCommandPalette } from "@/lib/use-command-palette";

/** «محطّة PDF» — النسخة المحسّنة: كل شيء في صفحة واحدة */
export default function Home() {
  const [view, setView] = useState<"home" | "work">("home");
  const palette = useCommandPalette();
  const openPalette = () => palette.setOpen(true);

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderBar view={view} onViewChange={setView} onOpenPalette={openPalette} />

      <main className="flex-1">
        {view === "home" ? (
          <>
            <Hero onStart={() => setView("work")} />
            <ToolsCatalog onAdded={() => setView("work")} />
            <FeaturesStrip />
          </>
        ) : (
          <div className="station-bg min-h-full">
            <div className="mx-auto max-w-7xl px-4 py-6">
              <CommandBar variant="compact" />

              <div className="mt-6 grid gap-5 lg:grid-cols-3">
                <div className="rounded-2xl border border-border bg-white/70 backdrop-blur p-4 shadow-sm">
                  <FilePanel />
                </div>
                <div className="rounded-2xl border border-border bg-white/70 backdrop-blur p-4 shadow-sm">
                  <StepsPanel />
                </div>
                <div className="rounded-2xl border border-border bg-white/70 backdrop-blur p-4 shadow-sm">
                  <TasksPanel />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-border/70 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-extrabold text-foreground">محطّة PDF</span> — كل أدوات PDF في مكان
            واحد · عربي ١٠٠٪ · مجاني
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock className="size-3.5" aria-hidden />
            المعالجة تتم داخل متصفحك بالكامل — ملفاتك لا تُرسل لأي خادم
          </p>
        </div>
      </footer>

      <CommandPalette onOpenWork={() => setView("work")} />
    </div>
  );
}

/** شريط المزايا أسفل الكتالوج */
function FeaturesStrip() {
  const items = [
    {
      icon: Wand2,
      title: "يفهم لهجتك",
      desc: "«شيل الصفحة التانية ورقمهالهم» — جملة واحدة، خطوتان، بدون تعقيد. المفسّر الذكي يصحح الأخطاء الإملائية ويقترح «هل تقصد؟» عند الغموض.",
    },
    {
      icon: Lock,
      title: "خصوصية مطلقة",
      desc: "خلافاً لأي أداة أخرى، المعالجة تجري كاملة داخل متصفحك: لا رفع، لا تخزين، لا انتظار. أغلق التبويب ويختفي كل شيء.",
    },
    {
      icon: Gauge,
      title: "خطوات متسلسلة",
      desc: "دمج ← تصغير ← ترقيم في ضغطة واحدة. كل خطوة تستخدم نتيجة ما قبلها تلقائيًا، مع أزرار تعديل وترتيب عربية.",
    },
    {
      icon: Languages,
      title: "عربي حتى الأسماء",
      desc: "الملفات تُنزَّل بأسماء عربية: «الملف-المدموج.pdf»، «بعد-الترقيم.pdf» — والأرقام تُعرض ١٢٣ كما تحب.",
    },
  ];
  return (
    <section aria-label="لماذا المحطة" className="border-t border-border/60 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-6 md:grid-cols-2">
        {items.map(({ icon: Icon, title, desc }) => (
          <article key={title} className="flex gap-4">
            <span className="grid place-items-center size-12 rounded-2xl bg-secondary text-primary shrink-0">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-extrabold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
