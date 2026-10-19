"use client";

import { useState } from "react";
import { Lock, Languages, Wand2, Gauge, FileOutput, Layers, Eye, Archive } from "lucide-react";
import { HeaderBar, type AppView } from "@/components/pdf-station/header-bar";
import { Hero } from "@/components/pdf-station/hero";
import { CommandBar } from "@/components/pdf-station/command-bar";
import { FilePanel } from "@/components/pdf-station/file-panel";
import { StepsPanel } from "@/components/pdf-station/steps-panel";
import { TasksPanel } from "@/components/pdf-station/tasks-panel";
import { ToolsCatalog } from "@/components/pdf-station/tools-catalog";
import { CommandPalette } from "@/components/pdf-station/command-palette";
import { ConvertStudio } from "@/components/pdf-station/convert-studio";
import { useCommandPalette } from "@/lib/use-command-palette";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toHindiDigits } from "@/lib/arabic";

/** «محطّة PDF» — النسخة المحسّنة: كل شيء في صفحة واحدة + استوديو التحويل */
export default function Home() {
  const [view, setView] = useState<AppView>("home");
  const palette = useCommandPalette();
  const openPalette = () => palette.setOpen(true);

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderBar view={view} onViewChange={setView} onOpenPalette={openPalette} />

      <main className="flex-1">
        {view === "home" && (
          <>
            <Hero onStart={() => setView("work")} />
            <ConvertTeaser onStart={() => setView("convert")} />
            <ToolsCatalog onAdded={() => setView("work")} />
            <FeaturesStrip />
          </>
        )}
        {view === "work" && (
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
        {view === "convert" && (
          <div className="station-bg min-h-full">
            <ConvertStudio />
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
            {view === "convert"
              ? "الاستوديو يعالج على الخادم: يُحذف الملف الأصلي فور التحويل والنواتج بعد ساعتين"
              : "المعالجة تتم داخل متصفحك بالكامل — ملفاتك لا تُرسل لأي خادم"}
          </p>
        </div>
      </footer>

      <CommandPalette
        onOpenWork={() => setView("work")}
        onOpenConvert={() => setView("convert")}
      />
    </div>
  );
}

/** قسم استوديو التحويل في الصفحة الرئيسية */
function ConvertTeaser({ onStart }: { onStart: () => void }) {
  const items = [
    {
      icon: Layers,
      title: "9 عائلات صيغ",
      desc: "AutoCAD (DXF متجهي كامل)، Revit، Photoshop، Illustrator، InDesign، EPS والصور",
    },
    {
      icon: Eye,
      title: "معاينة فورية",
      desc: "شاهد مصغّرة كل ملف PDF قبل التنزيل، وافتح معاينة كاملة بنقرة واحدة",
    },
    {
      icon: Archive,
      title: "دمج وأرشفة",
      desc: "ادمج كل النواتج في ملف PDF واحد أو نزّلها أرشيف ZIP بأسماء عربية",
    },
  ];
  return (
    <section aria-label="استوديو التحويل الجديد" className="border-b border-border/60 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-primary/20 bg-gradient-to-l from-secondary via-white to-white p-6 md:p-10 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                <FileOutput className="size-3.5" aria-hidden />
                الميزة الجديدة في النسخة المحسّنة
              </span>
              <h2 className="mt-3 text-2xl md:text-4xl font-extrabold leading-tight">
                استوديو التحويل:{" "}
                <span className="text-primary">اتوكاد وريفيت وأدوبي ← PDF</span>
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                هل لديك مخططات DWG وDXF، مشاريع RVT، تصاميم PSD وAI وINDD؟ ارفعها دفعة
                واحدة واحصل على PDF منظّم لكل ملف — DXF وAI بجودة متجهية 100%، وباقي
                الصيغ بأفضل جهد ممكن مع معاينات مدمجة، بصراحة وبدون وعود زائفة.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={onStart} size="lg" className="gap-2 font-extrabold shadow-md">
                  <FileOutput className="size-5" aria-hidden />
                  افتح استوديو التحويل
                </Button>
                <p className="text-xs text-muted-foreground self-center">
                  حتى {toHindiDigits(15)} ملفًا · {toHindiDigits(80)} م.ب للملف · حذف تلقائي بعد ساعتين
                </p>
              </div>
            </div>
            <div className="grid gap-3 w-full md:w-auto md:min-w-72">
              {items.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3 rounded-2xl border border-border bg-white p-3.5">
                  <span className="grid place-items-center size-10 rounded-xl bg-secondary text-primary shrink-0">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
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
