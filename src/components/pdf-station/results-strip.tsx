"use client";

import { Archive, Download, FileCheck2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { downloadBlob, openBlobInNewTab } from "@/lib/pdf-engine";
import { formatBytes } from "@/lib/arabic";
import { toHindiDigits } from "@/lib/arabic";
import { useWorkspace } from "@/store/workspace";

/** ميزة جديدة: شريط النتائج — تحميل مباشر أو أرشيف ZIP واحد */
export function ResultsStrip() {
  const results = useWorkspace((s) => s.results);
  const runState = useWorkspace((s) => s.runState);
  const downloadAll = useWorkspace((s) => s.downloadAll);
  const clearResults = useWorkspace((s) => s.clearResults);
  if (results.length === 0) return null;

  return (
    <motion.section
      aria-label="النتائج"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-4 rounded-2xl border p-3 ${
        runState === "error" ? "border-red-200 bg-red-50/60" : "border-emerald-200 bg-emerald-50/50"
      }`}
    >
      <header className="flex items-center gap-2 flex-wrap">
        <span className="grid place-items-center size-8 rounded-lg bg-emerald-600 text-white">
          <FileCheck2 className="size-4" aria-hidden />
        </span>
        <h3 className="font-extrabold">
          النتائج جاهزة — {resultsWord(results.length)}
        </h3>
        <div className="mr-auto flex items-center gap-1.5">
          {results.length > 1 && (
            <Button size="sm" variant="outline" onClick={() => void downloadAll()} className="gap-1.5 font-bold">
              <Archive className="size-4" aria-hidden />
              تنزيل الكل ZIP
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={clearResults} className="gap-1.5 text-muted-foreground">
            <Trash2 className="size-4" aria-hidden />
            مسح
          </Button>
        </div>
      </header>

      <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {results.map((r) => (
            <motion.li
              key={r.id}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-border bg-white p-2.5 flex items-center gap-2.5 shadow-sm"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold truncate" title={r.name}>
                  {r.name}
                </span>
                <span className="block text-xs text-muted-foreground">{formatBytes(r.size)}</span>
              </span>
              <Button
                size="sm"
                onClick={() => {
                  const embedded = downloadBlob(r.blob, r.name);
                  if (embedded) {
                    // داخل معاينة مضمّنة: التنزيل قد يُمنع — نوفر بديلًا فوريًا
                    toast("بدأ التنزيل", {
                      description: "إن لم يظهر الملف فالمعاينة تمنع التنزيل المباشر — افتح النتيجة في تبويب مستقل",
                      action: { label: "فتح في تبويب", onClick: () => openBlobInNewTab(r.blob) },
                      duration: 10_000,
                    });
                  } else {
                    toast.success("بدأ التنزيل");
                  }
                }}
                className="gap-1.5 font-bold shrink-0"
              >
                <Download className="size-4" aria-hidden />
                تحميل
              </Button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}

function resultsWord(n: number): string {
  if (n === 1) return "نتيجة واحدة";
  if (n === 2) return "نتيجتان";
  if (n <= 10) return `${toHindiDigits(n)} نتائج`;
  return `${toHindiDigits(n)} نتيجةً`;
}
