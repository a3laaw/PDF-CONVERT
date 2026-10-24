"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  UploadCloud, FileText, Loader2, CheckCircle2, XCircle, Download,
  Eye, Trash2, RefreshCw, Merge, ShieldCheck, ZoomIn, ZoomOut,
  RotateCcw, X, ImageOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toHindiDigits } from "@/lib/arabic";
import { QUALITY_STYLES, type Quality } from "@/lib/convert-formats";

/* ─────────────── تعريف العائلات ─────────────── */

export type CadFamily = "dwg" | "rvt" | "adobe";

interface FamilyDef {
  title: string;
  badge: string;
  accept: string;
  exts: Set<string>;
  hero: string;
  truth: string;
}

const FAMILIES: Record<CadFamily, FamilyDef> = {
  dwg: {
    title: "استوديو أوتوكاد",
    badge: "DWG · DXF",
    accept: ".dxf,.dwg",
    exts: new Set(["dxf", "dwg"]),
    hero: "اعرض المخطط على الشاشة أولًا، ثم حوّله إلى PDF بأداة واحدة",
    truth: "DXF يُعرض ويُحوّل متجهيًا 100% · DWG يُعرض بالمعاينة المدمجة (أفضل جهد)",
  },
  rvt: {
    title: "استوديو ريفيت",
    badge: "RVT",
    accept: ".rvt",
    exts: new Set(["rvt"]),
    hero: "اعرض معاينة المشروع أولًا، ثم حوّلها إلى PDF",
    truth: "RVT صيغة مغلقة — العرض بالمعاينة المدمجة إن وُجدت، والتصدير الكامل من داخل Revit",
  },
  adobe: {
    title: "استوديو أدوبي",
    badge: "PSD · AI · EPS · INDD",
    accept: ".psd,.ai,.eps,.ps,.indd",
    exts: new Set(["psd", "ai", "eps", "ps", "indd"]),
    hero: "اعرض التصميم أولًا، ثم حوّله إلى PDF",
    truth: "PSD تسطيح طبقات · AI وEPS متجهي 100% · INDD أفضل جهد",
  },
};

/* ─────────────── الأنواع ─────────────── */

type PStatus = "loading" | "ready" | "nopreview" | "error";

interface CadItem {
  uid: string;
  file: File;
  status: PStatus;
  preview?: string | null;
  quality?: string;
  note?: string;
  info?: Record<string, string>;
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
}

const MAX_MB = 80;

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${toHindiDigits(bytes)} بايت`;
  if (bytes < 1024 * 1024) return `${toHindiDigits((bytes / 1024).toFixed(0))} ك.ب`;
  return `${toHindiDigits((bytes / 1024 / 1024).toFixed(1))} م.ب`;
}

function extOf(name: string): string {
  return (name.split(".").pop() || "").toLowerCase();
}

function qualityBadge(q?: string): { label: string; key: Quality | null } {
  if (q === "vector") return { label: "متجهي 100%", key: "vector" };
  if (q === "flatten") return { label: "تسطيح طبقات", key: "flatten" };
  if (q === "preview") return { label: "معاينة مدمجة", key: "preview" };
  return { label: "", key: null };
}

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

/* ─────────────── الاستوديو ─────────────── */

export function CadStudio({ family }: { family: CadFamily }) {
  const F = FAMILIES[family];
  const [items, setItems] = useState<CadItem[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openPdf, setOpenPdf] = useState<ResultItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = items.find((i) => i.uid === activeId) ?? null;
  const loadingCount = items.filter((i) => i.status === "loading").length;
  const progress = items.length
    ? Math.round(
        ((items.filter((i) => i.status !== "loading").length) / items.length) * 100
      )
    : 0;
  const convertibles = useMemo(
    () => items.filter((i) => i.status === "ready" || i.status === "nopreview"),
    [items]
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);
      const accepted: CadItem[] = [];
      for (const f of incoming) {
        if (!F.exts.has(extOf(f.name))) {
          toast.error(`صيغة غير مدعومة هنا: ${f.name}`, {
            description: `الاستوديو يقبل: ${F.badge}`,
          });
          continue;
        }
        if (f.size > MAX_MB * 1024 * 1024) {
          toast.error(`${f.name} أكبر من ${toHindiDigits(MAX_MB)} م.ب`);
          continue;
        }
        accepted.push({
          uid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file: f,
          status: "loading",
        });
      }
      if (!accepted.length) return;
      setItems((prev) => [...prev, ...accepted].slice(0, 15));
      setResults([]);
      setActiveId(accepted[0].uid);
      setZoom(1);

      // معاينة تسلسلية عمدًا — طلبات POST المتوازية تتدلى في خادم التطوير
      (async () => {
        for (const it of accepted) {
          try {
            const form = new FormData();
            form.append("file", it.file);
            const res = await fetchWithRetry(
              "/api/cad-preview",
              { method: "POST", body: form },
              150_000
            );
            const d = await res.json();
            if (!res.ok || !d?.ok) {
              throw new Error(d?.error || "فشل استخراج المعاينة");
            }
            setItems((prev) =>
              prev.map((q) =>
                q.uid === it.uid
                  ? {
                      ...q,
                      status: d.preview ? ("ready" as PStatus) : ("nopreview" as PStatus),
                      preview: d.preview ?? null,
                      quality: d.quality || "",
                      note: d.note || "",
                      info: d.info || {},
                    }
                  : q
              )
            );
          } catch (e) {
            const msg =
              e instanceof DOMException && e.name === "AbortError"
                ? "انتهت مهلة المعاينة — جرّب مرة أخرى"
                : e instanceof Error
                  ? e.message
                  : "خطأ غير معروف";
            setItems((prev) =>
              prev.map((q) =>
                q.uid === it.uid ? { ...q, status: "error", error: msg } : q
              )
            );
          }
        }
      })();
    },
    [F]
  );

  /* التحويل إلى PDF — نفس قاعدة التسمية: اسم الملف الأصلي + .pdf */
  const convert = useCallback(async () => {
    const targets = items.filter(
      (i) => i.status === "ready" || i.status === "nopreview"
    );
    if (targets.length === 0 || busy) return;
    setBusy(true);
    setResults([]);
    const collected: ResultItem[] = [];
    for (const it of targets) {
      try {
        const form = new FormData();
        form.append("files", it.file);
        const res = await fetchWithRetry(
          "/api/convert",
          { method: "POST", body: form },
          240_000
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "فشل الطلب");
        const rejected = data?.rejected?.[0];
        if (rejected) throw new Error(rejected.reason || "مرفوض");
        const r = data?.results?.[0];
        if (!r) throw new Error("لا توجد نتيجة");
        if (!r.ok) throw new Error(r.error || "فشل التحويل");
        collected.push({
          id: r.id,
          name: r.name,
          outName: r.outName,
          size: r.size,
          outSize: r.outSize,
          pages: r.pages,
          engine: r.engine,
          note: r.note,
          thumb: r.thumb,
        });
      } catch (e) {
        const msg =
          e instanceof DOMException && e.name === "AbortError"
            ? "انتهت المهلة — جرّب مرة أخرى"
            : e instanceof Error
              ? e.message
              : "خطأ غير معروف";
        toast.error(`تعذر تحويل ${it.file.name}`, { description: msg });
      }
      setResults([...collected]);
    }
    setBusy(false);
    if (collected.length > 0) {
      toast.success(
        `تم تحويل ${toHindiDigits(collected.length)} ${collected.length === 1 ? "ملف" : "ملفات"} إلى PDF`,
        { description: "نزّل النواتج أو شاهدها قبل الطباعة" }
      );
    }
  }, [items, busy]);

  const mergeAll = useCallback(async () => {
    if (results.length < 2 || busy) return;
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
      setResults([
        {
          id: data.id,
          name: "دمج",
          outName: data.outName || "مدمج.pdf",
          size: data.size || 0,
          outSize: data.outSize || data.size || 0,
          pages: data.pages || 0,
          engine: "pymupdf-merge",
          note: "تم دمج نواتج الاستوديو في ملف واحد",
          thumb: null,
        },
      ]);
      toast.success("تم الدمج في ملف PDF واحد");
    } catch (e) {
      toast.error("فشل الدمج", {
        description: e instanceof Error ? e.message : "خطأ غير معروف",
      });
    } finally {
      setBusy(false);
    }
  }, [results, busy]);

  const pickActive = (uid: string) => {
    setActiveId(uid);
    setZoom(1);
  };

  const zoomPct = `${toHindiDigits(Math.round(zoom * 100))}٪`;
  const singleName =
    convertibles.length >= 1
      ? `${convertibles[0].file.name.replace(/\.[^.]+$/, "")}.pdf`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl px-4 py-8"
    >
      {/* الترويسة */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{F.title}</h1>
        <Badge variant="secondary" className="font-bold">{F.badge}</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{F.hero}</p>
      <p className="mt-1 text-xs font-semibold text-amber-700">{F.truth}</p>

      {/* منطقة الإفلات */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`إضافة ملفات إلى ${F.title}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={`mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-white hover:bg-stone-50"
        }`}
      >
        <UploadCloud className="mx-auto size-10 text-primary/70" aria-hidden />
        <p className="mt-3 font-extrabold">اسحب ملفاتك هنا أو اضغط للاختيار</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {F.badge} — حتى {toHindiDigits(15)} ملفًا، {toHindiDigits(80)} م.ب للملف
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={F.accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* شريط التقدم أثناء استخراج المعاينات */}
      {loadingCount > 0 && (
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            جاري استخراج المعاينة من الخادم… ({toHindiDigits(loadingCount)} باقي)
          </p>
        </div>
      )}

      {/* مساحة العمل: سكة الملفات + العارض */}
      {items.length > 0 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* سكة الملفات */}
          <ul className="flex gap-3 overflow-x-auto rounded-2xl border border-border bg-white p-3 shadow-sm lg:flex-col lg:overflow-visible" aria-label="قائمة الملفات">
            {items.map((it) => {
              const qb = qualityBadge(it.quality);
              return (
                <li key={it.uid}>
                  <button
                    onClick={() => pickActive(it.uid)}
                    className={`flex w-full min-w-[220px] items-center gap-3 rounded-xl border p-2 text-right transition-colors lg:min-w-0 ${
                      it.uid === activeId
                        ? "border-primary/60 bg-primary/5"
                        : "border-transparent hover:bg-stone-50"
                    }`}
                  >
                    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-stone-50">
                      {it.preview ? (
                        <img
                          src={it.preview}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <FileText className="size-5 text-muted-foreground" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {it.file.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="font-bold uppercase">{extOf(it.file.name)}</span>
                        <span>·</span>
                        <span>{fmtSize(it.file.size)}</span>
                        {qb.key && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-1.5 ${QUALITY_STYLES[qb.key].cls}`}
                          >
                            <span className={`size-1.5 rounded-full ${QUALITY_STYLES[qb.key].dot}`} />
                            {qb.label}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0">
                      {it.status === "loading" && (
                        <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
                      )}
                      {it.status === "ready" && (
                        <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                      )}
                      {it.status === "nopreview" && (
                        <ImageOff className="size-4 text-amber-600" aria-hidden />
                      )}
                      {it.status === "error" && (
                        <XCircle className="size-4 text-destructive" aria-hidden />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* العارض الكبير */}
          <div className="rounded-2xl border border-border bg-white shadow-sm" aria-label="عارض الملف">
            {active && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 p-3">
                  <p className="min-w-0 truncate text-sm font-extrabold">
                    {active.file.name}
                  </p>
                  {active.status === "ready" && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="تصغير"
                        disabled={zoom <= 1}
                        onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                      >
                        <ZoomOut className="size-4" aria-hidden />
                      </Button>
                      <span className="min-w-12 text-center text-xs font-bold">
                        {zoomPct}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="تكبير"
                        disabled={zoom >= 4}
                        onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
                      >
                        <ZoomIn className="size-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="إعادة الضبط"
                        onClick={() => setZoom(1)}
                      >
                        <RotateCcw className="size-4" aria-hidden />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  {active.status === "loading" && (
                    <div className="grid h-72 place-items-center text-center">
                      <div>
                        <Loader2 className="mx-auto size-8 animate-spin text-primary" aria-hidden />
                        <p className="mt-3 text-sm font-bold">
                          جاري استخراج المعاينة من الخادم…
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          الأصل يُحذف فور اكتمال المعاينة
                        </p>
                      </div>
                    </div>
                  )}

                  {active.status === "ready" && active.preview && (
                    <div className="overflow-auto rounded-xl border border-border/70 bg-stone-100" style={{ maxHeight: 520 }}>
                      <img
                        src={active.preview}
                        alt={`معاينة ${active.file.name}`}
                        className="mx-auto block"
                        style={{
                          width: `${zoom * 100}%`,
                          maxWidth: zoom === 1 ? "100%" : "none",
                        }}
                      />
                    </div>
                  )}

                  {active.status === "nopreview" && (
                    <div className="grid h-72 place-items-center rounded-xl border border-amber-200 bg-amber-50/60 text-center">
                      <div className="px-6">
                        <ImageOff className="mx-auto size-8 text-amber-600" aria-hidden />
                        <p className="mt-3 text-sm font-extrabold">
                          لا توجد معاينة مدمجة داخل هذا الملف
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {active.note || F.truth}
                        </p>
                        <p className="mt-2 text-xs font-bold text-amber-700">
                          يبقى التحويل متاحًا — سينتج صفحة معلومات بالـ PDF
                        </p>
                      </div>
                    </div>
                  )}

                  {active.status === "error" && (
                    <div className="grid h-72 place-items-center rounded-xl border border-red-200 bg-red-50/60 text-center">
                      <div className="px-6">
                        <XCircle className="mx-auto size-8 text-destructive" aria-hidden />
                        <p className="mt-3 text-sm font-extrabold">تعذرت المعاينة</p>
                        <p className="mt-1 text-xs text-muted-foreground">{active.error}</p>
                      </div>
                    </div>
                  )}

                  {/* المعلومات الصادقة تحت العارض */}
                  {active.status !== "loading" && active.status !== "error" && (
                    <div className="mt-3">
                      {active.note && (
                        <p className="text-xs leading-5 text-muted-foreground">
                          <ShieldCheck className="ml-1 inline size-3.5 text-emerald-600" aria-hidden />
                          {active.note}
                        </p>
                      )}
                      {active.info && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {Object.entries(active.info)
                            .filter(([k]) => k !== "Kind" && k !== "Quality")
                            .map(([k, v]) => (
                              <Badge key={k} variant="outline" className="text-[11px] font-semibold">
                                {k}: {v}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* شريط الإجراء + الخصوصية */}
      {items.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            onClick={convert}
            disabled={busy || loadingCount > 0 || convertibles.length === 0}
            className="gap-2 font-bold"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" aria-hidden />
            )}
            تحويل إلى PDF
            {convertibles.length > 0 && ` (${toHindiDigits(convertibles.length)})`}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setItems([]);
              setResults([]);
              setActiveId(null);
            }}
            disabled={busy}
            className="gap-2 text-destructive hover:text-destructive font-bold"
          >
            <Trash2 className="size-4" aria-hidden />
            مسح
          </Button>
          {singleName && (
            <p className="text-xs text-muted-foreground">
              تُحفظ باسم <span className="font-bold text-foreground">{singleName}</span>
            </p>
          )}
          <p className="flex items-center gap-1 text-xs text-muted-foreground sm:mr-auto">
            <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden />
            العرض والتحويل على الخادم — يُحذف الأصل فورًا والنواتج بعد ساعتين
          </p>
        </div>
      )}

      {/* النتائج */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            aria-label="النتائج"
          >
            <div className="mt-6 rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold">
                  النتائج ({toHindiDigits(results.length)})
                </h2>
                <div className="mr-auto flex gap-2">
                  {results.length >= 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={mergeAll}
                      disabled={busy}
                      className="gap-1.5 font-bold"
                    >
                      <Merge className="size-4" aria-hidden />
                      دمج الكل في PDF واحد
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-border p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-stone-50">
                        {r.thumb ? (
                          <img src={r.thumb} alt="" className="size-full object-cover" />
                        ) : (
                          <FileText className="size-6 text-muted-foreground" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-extrabold" dir="auto">
                          {r.outName}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {fmtSize(r.outSize)} · {toHindiDigits(r.pages)}{" "}
                          {r.pages === 1 ? "صفحة" : "صفحات"}
                        </span>
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5 font-bold"
                        onClick={() => setOpenPdf(r)}
                      >
                        <Eye className="size-4" aria-hidden />
                        معاينة
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5 font-bold"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = `/api/file/${r.id}?download=1&name=${encodeURIComponent(r.outName)}`;
                          a.click();
                          toast.success("بدأ التنزيل");
                        }}
                      >
                        <Download className="size-4" aria-hidden />
                        تحميل
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* حوار معاينة الناتج PDF */}
      <Dialog open={!!openPdf} onOpenChange={(o) => !o && setOpenPdf(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle dir="auto" className="truncate pl-6 text-right">
              {openPdf?.outName}
            </DialogTitle>
          </DialogHeader>
          {openPdf && (
            <div className="overflow-hidden rounded-lg border border-border">
              <iframe
                src={`/api/file/${openPdf.id}`}
                title={`معاينة ${openPdf.outName}`}
                className="h-[65vh] w-full bg-white"
              />
            </div>
          )}
          <Button
            className="gap-2 font-bold"
            onClick={() => {
              const a = document.createElement("a");
              a.href = `/api/file/${openPdf!.id}?download=1&name=${encodeURIComponent(openPdf!.outName)}`;
              a.click();
              toast.success("بدأ التنزيل");
            }}
          >
            <Download className="size-4" aria-hidden />
            تنزيل الملف
          </Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
