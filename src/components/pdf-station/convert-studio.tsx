"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  UploadCloud, FileText, X, Loader2, CheckCircle2, XCircle, Download,
  Eye, Archive, Merge, Trash2, Layers, ShieldCheck, Info, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { toHindiDigits } from "@/lib/arabic";
import {
  CONVERT_FORMATS, ACCEPT_ATTR, QUALITY_STYLES, formatForFile,
  formatLabelForEngine,
} from "@/lib/convert-formats";

/* ─────────────────────────── الأنواع ─────────────────────────── */

type Status = "ready" | "converting" | "done" | "error";

interface QueueItem {
  uid: string;
  file: File;
  status: Status;
  error?: string;
}

interface ResultItem {
  id: string;
  name: string;
  outName: string;
  size: number;
  outSize: number;
  pages: number;
  engine: string;
  note: string;
  thumb: string | null;
  merged?: boolean;
}

interface ApiResult {
  id: string;
  name: string;
  outName: string;
  size: number;
  outSize: number;
  pages: number;
  engine: string;
  note: string;
  thumb: string | null;
  ok: boolean;
  error?: string;
}

/* ─────────────────────────── أدوات ─────────────────────────── */

const MAX_MB = 80;

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${toHindiDigits(bytes)} بايت`;
  if (bytes < 1024 * 1024) return `${toHindiDigits((bytes / 1024).toFixed(0))} ك.ب`;
  return `${toHindiDigits((bytes / 1024 / 1024).toFixed(1))} م.ب`;
}

type QualityKey = "vector" | "preview" | "native";

function qualityOf(engine: string): QualityKey {
  if (
    engine.includes("vector") ||
    engine.includes("flatten") ||
    engine.includes("ghostscript")
  ) {
    return "vector";
  }
  if (engine.includes("preview")) return "preview";
  return "native";
}

function downloadUrl(r: ResultItem): string {
  return `/api/file/${r.id}?download=1&name=${encodeURIComponent(r.outName)}`;
}

/** fetch مع مهلة زمنية (AbortController) لتفادي الطلبات المعلّقة */
async function fetchWithTimeout(
  url: string,
  opts: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** طلب مع إعادة محاولة تلقائية واحدة (يحلّ طلبات dev المتساقطة أثناء إعادة الترجمة) */
async function fetchWithRetry(
  url: string,
  opts: RequestInit,
  timeoutMs: number
): Promise<Response> {
  try {
    return await fetchWithTimeout(url, opts, timeoutMs);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    await new Promise((r) => setTimeout(r, 1500));
    return fetchWithTimeout(url, opts, timeoutMs);
  }
}

/* ─────────────────────────── الاستوديو ─────────────────────────── */

export function ConvertStudio() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ready = queue.filter((q) => q.status === "ready");
  const doneCount = results.length;
  const progress = queue.length
    ? Math.round(
        ((queue.filter((q) => q.status === "done" || q.status === "error").length) /
          queue.length) * 100
      )
    : 0;

  /* إضافة ملفات */
  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files);
    const accepted: QueueItem[] = [];
    for (const f of incoming) {
      const def = formatForFile(f.name);
      if (!def) {
        toast.error(`صيغة غير مدعومة: ${f.name}`, {
          description: "الصيغ المدعومة: DXF, DWG, RVT, PSD, AI, EPS, INDD, PDF والصور",
        });
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`${f.name} أكبر من ${toHindiDigits(MAX_MB)} م.ب`);
        continue;
      }
      accepted.push({ uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, file: f, status: "ready" });
    }
    if (accepted.length) {
      setQueue((prev) => [...prev, ...accepted].slice(0, 15));
      setResults([]);
    }
  }, []);

  /* التحويل */
  const convert = useCallback(async () => {
    const targets = queue.filter((q) => q.status === "ready");
    if (targets.length === 0) return;
    setBusy(true);
    setResults([]);
    // تظهر الملفات كقيد التحويل فورًا
    setQueue((prev) =>
      prev.map((q) =>
        targets.some((t) => t.uid === q.uid) ? { ...q, status: "converting" } : q
      )
    );

    const collected: ResultItem[] = [];
    // تسلسلي عمدًا: طلبات POST المتوازية قد تتدلى في خادم التطوير —
    // وتحديث الحالة لكل ملف يبقى واضحًا للمستخدم
    for (const item of targets) {
      setQueue((prev) =>
        prev.map((q) => (q.uid === item.uid ? { ...q, status: "converting" } : q))
      );
      try {
        const form = new FormData();
        form.append("files", item.file);
        const res = await fetchWithRetry("/api/convert", { method: "POST", body: form }, 240_000);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "فشل الطلب");
        const rejected = data?.rejected?.[0];
        if (rejected) throw new Error(rejected.reason || "مرفوض");
        const r = (data.results as ApiResult[])[0];
        if (!r) throw new Error("لا توجد نتيجة");
        if (!r.ok) throw new Error(r.error || "فشل التحويل");
        collected.push({
          id: r.id, name: r.name, outName: r.outName, size: r.size,
          outSize: r.outSize, pages: r.pages, engine: r.engine,
          note: r.note, thumb: r.thumb,
        });
        setQueue((prev) =>
          prev.map((q) => (q.uid === item.uid ? { ...q, status: "done" } : q))
        );
      } catch (e) {
        const msg =
          e instanceof DOMException && e.name === "AbortError"
            ? "انتهت المهلة — جرّب مرة أخرى أو استخدم ملفًا أصغر"
            : e instanceof Error
              ? e.message
              : "خطأ غير معروف";
        setQueue((prev) =>
          prev.map((q) =>
            q.uid === item.uid ? { ...q, status: "error", error: msg } : q
          )
        );
      }
      setResults([...collected]);
    }
    setBusy(false);
    const okCount = collected.length;
    if (okCount > 0) {
      toast.success(
        `تم تحويل ${toHindiDigits(okCount)} ${okCount === 1 ? "ملف" : "ملفات"} بنجاح`,
        { description: "نزّل الملفات أو ادمجها في ملف PDF واحد" }
      );
    }
  }, [queue]);

  const mergeAll = useCallback(async () => {
    if (results.length < 2) return;
    setBusy(true);
    try {
      const res = await fetchWithRetry(
        "/api/merge",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: results.map((r) => ({ id: r.id, name: r.outName })),
          }),
        },
        90_000
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "فشل الدمج");
      const merged = data.result as ApiResult;
      setResults((prev) => [
        ...prev,
        {
          id: merged.id, name: merged.name, outName: merged.outName,
          size: merged.outSize, outSize: merged.outSize, pages: merged.pages,
          engine: merged.engine, note: merged.note, thumb: merged.thumb,
          merged: true,
        },
      ]);
      toast.success("تم الدمج في ملف PDF واحد", {
        description: `عدد الصفحات: ${toHindiDigits(merged.pages)}`,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الدمج");
    } finally {
      setBusy(false);
    }
  }, [results]);

  const zipAll = useCallback(async () => {
    if (results.length === 0) return;
    setBusy(true);
    try {
      const res = await fetchWithRetry(
        "/api/zip",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: results.map((r) => ({ id: r.id, name: r.outName })),
          }),
        },
        90_000
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "فشل إنشاء الأرشيف");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pdf-bundle-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل الأرشيف");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل التنزيل");
    } finally {
      setBusy(false);
    }
  }, [results]);

  const reset = useCallback(() => {
    setQueue([]);
    setResults([]);
  }, []);

  const removeItem = useCallback((uid: string) => {
    setQueue((prev) => prev.filter((q) => q.uid !== uid));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* شريط العنوان */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2.5">
            <span className="grid place-items-center size-11 rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Layers className="size-5" aria-hidden />
            </span>
            استوديو التحويل
            <Badge className="bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold">
              جديد
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            حوّل ملفات <b>AutoCAD</b> و<b>Revit</b> و<b>Adobe</b> إلى PDF بجودة عالية —
            دفعة واحدة، مع معاينات وتنزيل مجمّع
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-xs font-bold border-amber-200 bg-amber-50 text-amber-700">
          <ShieldCheck className="size-3.5" aria-hidden />
          تُحذف ملفاتك تلقائيًا بعد ساعتين
        </Badge>
      </div>

      {/* منطقة الرفع */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-6"
      >
        <div
          role="button"
          tabIndex={0}
          aria-label="إضافة ملفات للتحويل"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
          }}
          className={`cursor-pointer rounded-3xl border-2 border-dashed transition-all p-8 md:p-12 text-center ${
            dragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border bg-white hover:border-primary/40 hover:bg-secondary/40"
          }`}
        >
          <span className="mx-auto grid place-items-center size-16 rounded-2xl bg-secondary">
            <UploadCloud className="size-8 text-primary" aria-hidden />
          </span>
          <p className="mt-4 text-lg font-extrabold">
            اسحب ملفاتك هنا أو انقر للاختيار
          </p>
          <p className="text-sm text-muted-foreground mt-1.5">
            DXF · DWG · RVT · PSD · AI · EPS · INDD · PNG · JPG · PDF — حتى{" "}
            {toHindiDigits(15)} ملفًا، {toHindiDigits(MAX_MB)} م.ب للملف
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT_ATTR}
            className="sr-only"
            aria-label="اختيار ملفات للتحويل"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </motion.div>

      {/* قائمة الانتظار */}
      <AnimatePresence>
        {queue.length > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            aria-label="قائمة الملفات"
          >
            <div className="mt-6 rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border/70">
                <h2 className="font-extrabold">
                  الملفات ({toHindiDigits(queue.length)})
                </h2>
                <div className="mr-auto flex flex-wrap items-center gap-2">
                  <Button
                    onClick={convert}
                    disabled={busy || ready.length === 0}
                    className="gap-2 font-bold"
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="size-4" aria-hidden />
                    )}
                    تحويل إلى PDF
                    {ready.length > 0 && ` (${toHindiDigits(ready.length)})`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={reset}
                    disabled={busy}
                    className="gap-2 text-destructive hover:text-destructive font-bold"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    مسح
                  </Button>
                </div>
              </div>

              {(busy || (queue.some((q) => q.status !== "ready") && queue.length > 1)) && (
                <div className="px-4 pt-3">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    جارٍ المعالجة… {toHindiDigits(progress)}٪
                  </p>
                </div>
              )}

              <ul className="divide-y divide-border/70 max-h-96 overflow-y-auto styled-scroll">
                <AnimatePresence initial={false}>
                  {queue.map((q) => {
                    const def = formatForFile(q.file.name);
                    return (
                      <motion.li
                        key={q.uid}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <span className="grid place-items-center size-10 rounded-xl bg-secondary text-lg shrink-0" aria-hidden>
                          {def?.emoji || "📄"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate" dir="auto">
                            {q.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fmtSize(q.file.size)}
                            {q.error && (
                              <span className="text-destructive"> — {q.error}</span>
                            )}
                          </p>
                        </div>
                        {q.status === "ready" && (
                          <Badge variant="outline" className="text-[11px] font-bold shrink-0">
                            بانتظار التحويل
                          </Badge>
                        )}
                        {q.status === "converting" && (
                          <Badge className="gap-1 text-[11px] font-bold bg-secondary shrink-0">
                            <Loader2 className="size-3 animate-spin" aria-hidden />
                            جارٍ التحويل…
                          </Badge>
                        )}
                        {q.status === "done" && (
                          <Badge className="gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <CheckCircle2 className="size-3" aria-hidden />
                            تم
                          </Badge>
                        )}
                        {q.status === "error" && (
                          <Badge className="gap-1 text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 shrink-0">
                            <XCircle className="size-3" aria-hidden />
                            فشل
                          </Badge>
                        )}
                        <button
                          onClick={() => removeItem(q.uid)}
                          disabled={busy}
                          aria-label={`إزالة ${q.file.name}`}
                          className="shrink-0 grid place-items-center size-8 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* النتائج */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8"
            aria-label="النتائج"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold">
                النتائج{" "}
                <span className="text-primary">({toHindiDigits(results.length)})</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={mergeAll}
                  disabled={busy || results.length < 2}
                  className="gap-2 font-bold"
                >
                  <Merge className="size-4" aria-hidden />
                  دمج الكل في PDF واحد
                </Button>
                <Button
                  variant="secondary"
                  onClick={zipAll}
                  disabled={busy}
                  className="gap-2 font-bold"
                >
                  <Archive className="size-4" aria-hidden />
                  تنزيل ZIP
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {results.map((r) => (
                  <motion.article
                    key={r.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col ${
                      r.merged
                        ? "border-primary/50 ring-2 ring-primary/20"
                        : "border-border"
                    }`}
                  >
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          className="relative block bg-stone-100 aspect-[4/3] w-full group"
                          aria-label={`معاينة ${r.outName}`}
                        >
                          {r.thumb ? (
                            <img
                              src={r.thumb}
                              alt={`معاينة ${r.outName}`}
                              className="absolute inset-0 size-full object-cover object-top"
                            />
                          ) : (
                            <span className="absolute inset-0 grid place-items-center text-muted-foreground">
                              <FileText className="size-10" aria-hidden />
                            </span>
                          )}
                          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors grid place-items-center">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-foreground">
                              <Eye className="size-3.5" aria-hidden />
                              معاينة
                            </span>
                          </span>
                          {r.merged && (
                            <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2.5 py-1 text-[10px] font-bold">
                              <Merge className="size-3" aria-hidden />
                              مدموج
                            </span>
                          )}
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle className="text-right" dir="auto">
                            {r.outName}
                          </DialogTitle>
                        </DialogHeader>
                        <iframe
                          src={`/api/file/${r.id}#toolbar=1&view=FitH`}
                          title={`معاينة ${r.outName}`}
                          className="flex-1 w-full rounded-xl border border-border bg-stone-50"
                        />
                        <div className="flex justify-end gap-2">
                          <Button asChild className="gap-2 font-bold">
                            <a href={downloadUrl(r)} download>
                              <Download className="size-4" aria-hidden />
                              تنزيل الملف
                            </a>
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <div>
                        <h3 className="font-extrabold text-sm truncate" dir="auto" title={r.outName}>
                          {r.outName}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {toHindiDigits(r.pages)} صفحة · {fmtSize(r.outSize)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`gap-1.5 text-[10px] font-bold w-fit ${QUALITY_STYLES[qualityOf(r.engine)].cls}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${QUALITY_STYLES[qualityOf(r.engine)].dot}`}
                          aria-hidden
                        />
                        {formatLabelForEngine(r.engine)}
                      </Badge>
                      {r.note && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                          {r.note}
                        </p>
                      )}
                      <Button asChild size="sm" variant="secondary" className="mt-auto gap-1.5 font-bold w-full">
                        <a href={downloadUrl(r)} download>
                          <Download className="size-3.5" aria-hidden />
                          تنزيل PDF
                        </a>
                      </Button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* الصيغ المدعومة */}
      <section className="mt-12" aria-label="الصيغ المدعومة">
        <h2 className="text-xl md:text-2xl font-extrabold">الصيغ المدعومة وجودة كل تحويل</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          نصارحك بوضوح: الصيغ المفتوحة تتحول بجودة متجهية كاملة، والصيغ المغلقة (DWG/RVT/INDD)
          تتحول بأفضل جهد ممكن خارج البرامج الأصلية
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONVERT_FORMATS.map((f, i) => (
            <motion.article
              key={f.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="grid place-items-center size-11 rounded-xl bg-secondary text-2xl shrink-0" aria-hidden>
                  {f.emoji}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold">{f.label}</h3>
                    <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                      {f.family}
                    </Badge>
                  </div>
                  <span
                    className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${QUALITY_STYLES[f.quality].cls}`}
                  >
                    <span className={`size-1.5 rounded-full ${QUALITY_STYLES[f.quality].dot}`} aria-hidden />
                    {f.qualityLabel}
                  </span>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* الأسئلة الشائعة */}
      <section className="mt-12" aria-label="أسئلة شائعة حول التحويل">
        <h2 className="text-xl md:text-2xl font-extrabold">أسئلة شائعة</h2>
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="q1">
            <AccordionTrigger className="font-bold text-right">
              هل يتحول ملف DWG إلى خطوط متجهية قابلة للتعديل؟
            </AccordionTrigger>
            <AccordionContent className="leading-relaxed">
              صيغة DWG مغلقة مملوكة لشركة Autodesk، ولا يمكن قراءتها بدقة خارج برامجها. يحوّلها
              الاستوديو بأسلوب «أفضل جهد»: يستخرج المعاينة المدمجة عالية الدقة وبيانات الإصدار في
              ملف PDF أنيق. إذا احتجت متجهات كاملة، صدّر من AutoCAD بصيغة DXF ثم ارفعها هنا —
              ستحصل عندها على تحويل متجهي 100% يحافظ على كل الخطوط والنصوص.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger className="font-bold text-right">
              ماذا عن ملفات Revit؟ الطريقة الوحيدة هي Revit نفسه؟
            </AccordionTrigger>
            <AccordionContent className="leading-relaxed">
              نعم، RVT صيغة ثنائية مغلقة تمامًا. يستخرج الاستوديو معاينة المشروع المدمجة داخل
              الملف ويكشف إصدار Revit المستخدم، مع تضمين كل ذلك في PDF. للتصدير الكامل افتح
              المشروع في Revit ثم File ← Export ← PDF، أو استخدم Autodesk Viewer المجاني
              عبر الإنترنت، ثم ادمج النواتج هنا في ملف واحد.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger className="font-bold text-right">
              ماذا يحدث لملفات Photoshop وIllustrator؟
            </AccordionTrigger>
            <AccordionContent className="leading-relaxed">
              PSD يُسطَّح بكل طبقاته إلى صفحة PDF واحدة بجودة أصلية عبر محرك psd-tools.
              أما AI (من الإصدار 9 فما فوق) فهو متوافق مع PDF بطبيعته — يُحوَّل مع الحفاظ
              الكامل على المتجهات والخطوط. وEPS/PS تُعالج عبر Ghostscript مع قصّ دقيق للحدود.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q4">
            <AccordionTrigger className="font-bold text-right">
              هل ملفاتي آمنة؟ وهل تُحذف من الخادم؟
            </AccordionTrigger>
            <AccordionContent className="leading-relaxed">
              نعم. أدوات PDF داخل مساحة العمل تعمل بالكامل داخل متصفحك. أما استوديو التحويل
              فيتطلب معالجة على الخادم (محرك بايثون متخصص)، لذا: يُحذف الملف الأصلي فور
              انتهاء التحويل مباشرة، وتُحذف النواتج تلقائيًا بعد ساعتين كحد أقصى، ولا نُجري
              أي نسخ احتياطي أو مشاركة — الحذف نهائي.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q5">
            <AccordionTrigger className="font-bold text-right">
              هل يمكنني تحويل عدة ملفات دفعة واحدة ودمجها؟
            </AccordionTrigger>
            <AccordionContent className="leading-relaxed">
              نعم — حتى 15 ملفًا في الدفعة الواحدة (80 م.ب للملف). بعد التحويل اضغط «دمج الكل
              في PDF واحد» لترتيبها في ملف واحد، أو «تنزيل ZIP» للحصول على أرشيف بكل النواتج
              بأسمائها العربية الأصلية.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* ملاحظة الخصوصية */}
      <div className="mt-10 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
        <Info className="size-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-amber-900 leading-relaxed">
          <b>لماذا يحتاج التحويل إلى خادم؟</b> قراءة صيغ مثل DXF وPSD وDWG تتطلب محركات
          تحليل متخصصة (ezdxf، psd-tools، Ghostscript) لا يمكن تشغيلها داخل المتصفح. بقية
          أدوات محوّل PDF تعمل داخل جهازك بالكامل دون رفع أي شيء.
        </p>
      </div>
    </div>
  );
}
