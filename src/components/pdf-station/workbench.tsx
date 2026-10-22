"use client";

/* شاشة العمل الجديدة — عرض الملف + شريط أدوات واحد، بدون أوامر نصية ولا شرح */

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { useWorkspace } from "@/store/workspace";
import { TOOLS_BY_ID } from "@/lib/tools-catalog";
import { resultName } from "@/lib/naming";
import { downloadBlob, openBlobInNewTab, pdfPageThumbs } from "@/lib/pdf-engine";
import { toHindiDigits } from "@/lib/arabic";
import { toast } from "sonner";
import type { FileKind, OpId, ResultFile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─────────── أيقونات الأدوات ─────────── */
const svg = (paths: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-5"
    aria-hidden
  >
    {paths}
  </svg>
);

const TOOL_ICONS: Record<string, React.ReactNode> = {
  convert: svg(<path d="M4 7h13l-3-3M20 17H7l3 3" />),
  compress: svg(<path d="M4 9h16M4 15h10M9 4l-4 5 4 5" />),
  merge: svg(
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
  ),
  split: svg(
    <>
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="7" cy="17" r="2.5" />
      <path d="M9 8.5 20 19M9 15.5 20 5" />
    </>
  ),
  extract: svg(
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  delete: svg(
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  ),
  rotate: svg(<path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6" />),
  reorder: svg(<path d="M8 6v12M8 6 5 9M8 6l3 3M16 18V6M16 18l-3-3M16 18l3-3" />),
  page_numbers: svg(<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />),
  watermark: svg(
    <>
      <path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-4.5 5-9 5-9Z" />
      <path d="M5 21h14" />
    </>
  ),
  remove_watermark: svg(
    <>
      <path d="m7 21-4.3-4.3a2.4 2.4 0 0 1 0-3.4l9.6-9.6a2.4 2.4 0 0 1 3.4 0l5.6 5.6a2.4 2.4 0 0 1 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </>
  ),
  pdf_to_images: svg(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-4-4-8 8" />
    </>
  ),
  images_to_pdf: svg(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 15l4-4 4 4 5-6 5 6" />
    </>
  ),
  extract_text: svg(
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6M9 13h6M9 17h4" />
    </>
  ),
};

const TOOLBAR: { id: OpId | "convert"; label: string }[] = [
  { id: "convert", label: "تحويل" },
  { id: "compress", label: "تصغير" },
  { id: "merge", label: "دمج" },
  { id: "split", label: "فصل" },
  { id: "extract", label: "استخراج" },
  { id: "delete", label: "حذف" },
  { id: "rotate", label: "تدوير" },
  { id: "reorder", label: "ترتيب" },
  { id: "page_numbers", label: "ترقيم" },
  { id: "watermark", label: "ختم" },
  { id: "remove_watermark", label: "بدون علامة" },
  { id: "pdf_to_images", label: "لصور" },
  { id: "images_to_pdf", label: "من صور" },
  { id: "extract_text", label: "نص" },
];

/* ─────────── أدوات مساعدة ─────────── */

async function renderPageDataUrl(file: File, pageNo: number, maxW = 820): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const page = await doc.getPage(Math.max(1, pageNo));
  const v1 = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: Math.min(1.8, maxW / v1.width) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const c2 = canvas.getContext("2d")!;
  c2.fillStyle = "#ffffff";
  c2.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: c2, viewport } as never).promise;
  return canvas.toDataURL("image/jpeg", 0.85);
}

function fmtSize(b: number): string {
  if (b >= 1048576) return `${toHindiDigits((b / 1048576).toFixed(1).replace(".", "٫"))} م.ب`;
  return `${toHindiDigits(Math.max(1, Math.round(b / 1024)))} ك.ب`;
}

function extLabel(name: string): string {
  const e = name.match(/\.([^.]+)$/)?.[1]?.toUpperCase() ?? "ملف";
  return e === "JPG" ? "JPG" : e;
}

/* ─────────── المكوّن ─────────── */

export function Workbench({ onOpenConvert }: { onOpenConvert: () => void }) {
  const files = useWorkspace((s) => s.files);
  const results = useWorkspace((s) => s.results);
  const runState = useWorkspace((s) => s.runState);
  const runMessage = useWorkspace((s) => s.runMessage);
  const runProgress = useWorkspace((s) => s.runProgress);
  const addFiles = useWorkspace((s) => s.addFiles);
  const removeFile = useWorkspace((s) => s.removeFile);
  const runOnFiles = useWorkspace((s) => s.runOnFiles);
  const renameResult = useWorkspace((s) => s.renameResult);
  const clearResults = useWorkspace((s) => s.clearResults);
  const downloadAll = useWorkspace((s) => s.downloadAll);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [selFiles, setSelFiles] = useState<Set<string> | null>(null);
  const [tool, setTool] = useState<OpId | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [selPages, setSelPages] = useState<number[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(1);

  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const thumbsReq = useRef<Set<string>>(new Set());

  /* الملف النشط: المعيّن بالنقر أو آخر ملف أُضيف — اشتقاق بلا effects */
  const activeFile = files.find((f) => f.id === activeId) ?? files[files.length - 1] ?? null;
  const effectiveSel = selFiles ?? (activeFile ? new Set([activeFile.id]) : new Set<string>());
  const running = runState === "running";

  /* مصغرات صفحات الـ PDF النشط */
  useEffect(() => {
    if (!activeFile || activeFile.kind !== "pdf") return;
    if (thumbs[activeFile.id] || thumbsReq.current.has(activeFile.id)) return;
    thumbsReq.current.add(activeFile.id);
    pdfPageThumbs(activeFile.file, 60)
      .then((arr) => setThumbs((t) => ({ ...t, [activeFile.id]: arr })))
      .catch(() => thumbsReq.current.delete(activeFile.id));
  }, [activeFile, thumbs]);

  /* المعاينة الكبيرة للصفحة النشطة — مفتوحة بالمفتاح لتفادي setState المتزامن */
  const previewKey = activeFile ? `${activeFile.id}:${activeFile.kind === "image" ? "img" : page}` : "";
  const [previewState, setPreviewState] = useState<{ key: string; url: string } | null>(null);
  useEffect(() => {
    if (!activeFile || !previewKey) return;
    let alive = true;
    let objUrl: string | null = null;
    const done = (url: string) => {
      if (alive) setPreviewState({ key: previewKey, url });
    };
    if (activeFile.kind === "image") {
      Promise.resolve().then(() => {
        objUrl = URL.createObjectURL(activeFile.file);
        done(objUrl);
      });
    } else {
      renderPageDataUrl(activeFile.file, page)
        .then(done)
        .catch(() => undefined);
    }
    return () => {
      alive = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [activeFile, page, previewKey]);
  const preview = previewState && previewState.key === previewKey ? previewState.url : "";

  const pickTool = (id: OpId | "convert") => {
    if (id === "convert") {
      onOpenConvert();
      return;
    }
    setTool(id);
    const def: Record<string, string> = {};
    for (const f of TOOLS_BY_ID[id].fields) if (f.default !== undefined) def[f.key] = f.default;
    const pf = TOOLS_BY_ID[id].fields.find((f) => f.pagesPicker);
    if (pf) def[pf.key] = selPages.join(",");
    setParams(def);
  };

  const togglePage = (n: number) => {
    const next = selPages.includes(n)
      ? selPages.filter((x) => x !== n)
      : [...selPages, n].sort((a, b) => a - b);
    setSelPages(next);
    if (tool) {
      const pf = TOOLS_BY_ID[tool].fields.find((f) => f.pagesPicker);
      if (pf) setParams((p) => ({ ...p, [pf.key]: next.join(",") }));
    }
  };

  const toggleSel = (id: string) =>
    setSelFiles((s) => {
      const n = new Set(s ?? (activeFile ? [activeFile.id] : []));
      if (n.has(id)) {
        if (n.size > 1) n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });

  const expectedName = useMemo(() => {
    if (!tool || !activeFile) return null;
    const t = TOOLS_BY_ID[tool];
    const target = t.accepts.includes(activeFile.kind)
      ? activeFile
      : files.find((f) => effectiveSel.has(f.id) && t.accepts.includes(f.kind));
    return target ? resultName(tool, target.name) : null;
  }, [tool, activeFile, files, effectiveSel]);

  /* ذكاء الأدوات: كل أداة تعمل فقط لو المحدد فيهم نوع تقبله */
  const selKinds = useMemo(() => {
    const ks = new Set<FileKind>();
    for (const f of files) if (effectiveSel.has(f.id)) ks.add(f.kind);
    return ks;
  }, [files, effectiveSel]);

  const toolEnabled = (id: OpId): boolean => {
    const t = TOOLS_BY_ID[id];
    if (!t) return false;
    for (const k of selKinds) if (t.accepts.includes(k)) return true;
    return false;
  };

  const hintDisabled = (id: OpId) => {
    const t = TOOLS_BY_ID[id];
    if (!t) return;
    if (t.accepts.includes("image") && !t.accepts.includes("pdf"))
      toast.info("الأداة دي للصور — حدّد صورة من قائمة الملفات");
    else if (activeFile?.kind === "image")
      toast.info("الأداة دي لملفات PDF — للصور استخدم «من صور»");
    else if (activeFile && activeFile.kind !== "pdf")
      toast.info("النوع ده يتحول أولًا من تبويب «تحويل»");
    else toast.info("حدّد ملف PDF من قائمة الملفات أولًا");
  };

  const execute = async () => {
    if (!tool || running) return;
    const t = TOOLS_BY_ID[tool];
    const chosen = files.filter((f) => effectiveSel.has(f.id) && t.accepts.includes(f.kind));
    if (chosen.length === 0) {
      toast.error(t.accepts.includes("image") ? "حدد صورًا من قائمة الملفات أولًا" : "حدد ملف PDF من قائمة الملفات أولًا");
      return;
    }
    await runOnFiles(tool, params, chosen.map((f) => f.id));
    const st = useWorkspace.getState();
    if (st.runState === "error") toast.error(st.runMessage);
  };

  const download = (r: ResultFile) => {
    const embedded = downloadBlob(r.blob, r.name);
    if (embedded) {
      toast("بدأ التنزيل", {
        description: "إن لم يظهر الملف فافتح النتيجة في تبويب مستقل",
        action: { label: "فتح في تبويب", onClick: () => openBlobInNewTab(r.blob) },
        duration: 10_000,
      });
    } else {
      toast.success("بدأ التنزيل");
    }
  };

  const commitRename = () => {
    if (!renaming) return;
    const name = renaming.value.trim();
    if (name) renameResult(renaming.id, name);
    setRenaming(null);
  };

  return (
    <div
      className="mx-auto max-w-7xl px-4 py-5"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const fs = Array.from(e.dataTransfer.files);
        if (fs.length) addFiles(fs);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const fs = Array.from(e.target.files ?? []);
          if (fs.length) addFiles(fs);
          e.target.value = "";
        }}
      />

      {files.length === 0 ? (
        /* ─── لا ملفات: منطقة إفلات واحدة ─── */
        <div
          className={cn(
            "mt-8 rounded-3xl border-2 border-dashed bg-white/70 py-20 text-center transition",
            dragOver ? "border-primary bg-primary/5" : "border-primary/30"
          )}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Plus className="size-7" aria-hidden />
          </div>
          <h2 className="mt-4 text-xl font-extrabold">اسحب ملفاتك هنا</h2>
          <p className="mt-1 text-sm text-muted-foreground">PDF أو صور</p>
          <Button
            className="mt-5 px-8 font-extrabold"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            اختيار ملفات
          </Button>
        </div>
      ) : (
        <>
          {/* ─── شريط الأدوات ─── */}
          <div className="flex flex-wrap gap-0.5 rounded-2xl border border-border bg-white p-1.5 shadow-sm">
            {TOOLBAR.map(({ id, label }) => {
              const ok = id === "convert" || toolEnabled(id as OpId);
              return (
                <button
                  key={id}
                  onClick={() => (ok ? pickTool(id) : hintDisabled(id as OpId))}
                  className={cn(
                    "flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-bold transition",
                    tool === id
                      ? "bg-primary/10 text-primary outline outline-1 outline-primary/30"
                      : ok
                        ? "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                        : "cursor-not-allowed text-muted-foreground/30"
                  )}
                >
                  {TOOL_ICONS[id]}
                  {label}
                </button>
              );
            })}
          </div>

          {/* ─── الجسم: ملفات + صفحات + معاينة ─── */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[200px_130px_1fr]">
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-3">
              <p className="px-1 text-[11px] font-bold text-muted-foreground">الملفات</p>
              <div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto">
                {files.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setActiveId(f.id);
                      setPage(1);
                      setSelPages([]);
                    }}
                    className={cn(
                      "relative flex cursor-pointer items-center gap-2 rounded-xl border p-2",
                      f.id === activeId
                        ? "border-primary bg-primary/5"
                        : effectiveSel.has(f.id)
                          ? "border-primary/50"
                          : "border-border"
                    )}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSel(f.id);
                      }}
                      aria-label="تحديد الملف"
                      className={cn(
                        "absolute -left-1.5 -top-1.5 grid size-5 place-items-center rounded-full border text-[10px] font-extrabold",
                        effectiveSel.has(f.id)
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white text-transparent"
                      )}
                    >
                      ✓
                    </button>
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-red-50 text-[9px] font-extrabold text-red-600">
                      {f.kind === "image" ? "IMG" : "PDF"}
                    </span>
                    <span className="min-w-0">
                      <span className="block max-w-[108px] truncate text-xs font-bold">{f.name}</span>
                      <span className="block text-[10px] text-muted-foreground">
                        {f.pages ? `${toHindiDigits(f.pages)} صفحات · ` : ""}
                        {fmtSize(f.size)}
                      </span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(f.id);
                      }}
                      aria-label="إزالة الملف"
                      className="mr-auto text-muted-foreground/40 hover:text-red-500"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="rounded-xl border border-dashed border-border py-2.5 text-xs font-bold text-muted-foreground hover:border-primary/40 hover:text-primary"
                >
                  + إضافة ملف
                </button>
              </div>
            </div>

            <div className="hidden max-h-[560px] flex-col gap-2 overflow-y-auto rounded-2xl border border-border bg-white p-3 lg:flex">
              <p className="px-1 text-[11px] font-bold text-muted-foreground">الصفحات</p>
              {activeFile?.kind === "pdf" &&
                (thumbs[activeFile.id] ?? []).map((src, i) => (
                  <div
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      "relative shrink-0 cursor-pointer rounded-lg border bg-white p-1.5",
                      page === i + 1 ? "border-primary ring-2 ring-primary/15" : "border-border"
                    )}
                  >
                    <img src={src} alt={`صفحة ${toHindiDigits(i + 1)}`} className="w-full rounded" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePage(i + 1);
                      }}
                      aria-label="تحديد الصفحة"
                      className={cn(
                        "absolute -left-1.5 -top-1.5 grid size-5 place-items-center rounded-full border text-[10px] font-extrabold",
                        selPages.includes(i + 1)
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white text-muted-foreground"
                      )}
                    >
                      {selPages.includes(i + 1) ? "✓" : toHindiDigits(i + 1)}
                    </button>
                  </div>
                ))}
              {activeFile?.kind === "pdf" && !thumbs[activeFile.id] && (
                <p className="py-4 text-center text-[11px] text-muted-foreground">جارٍ التحضير…</p>
              )}
              {activeFile?.kind === "image" && activeFile.thumb && (
                <img src={activeFile.thumb} alt="" className="rounded-lg border border-border" />
              )}
            </div>

            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-border bg-slate-50 p-4">
              {preview ? (
                <img
                  src={preview}
                  alt="معاينة الملف"
                  className="max-h-[560px] max-w-full rounded-md bg-white shadow-xl shadow-black/10"
                />
              ) : (
                <div className="size-64 max-w-full animate-pulse rounded-md bg-white shadow-lg" />
              )}
              {activeFile?.kind === "pdf" && (activeFile.pages ?? 0) > 1 && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="الصفحة السابقة"
                    className="grid size-8 place-items-center rounded-lg border border-border bg-white text-lg font-extrabold text-muted-foreground"
                  >
                    ›
                  </button>
                  <span className="text-sm font-extrabold text-muted-foreground">
                    {toHindiDigits(page)} / {toHindiDigits(activeFile.pages ?? 1)}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(activeFile.pages ?? 1, p + 1))}
                    aria-label="الصفحة التالية"
                    className="grid size-8 place-items-center rounded-lg border border-border bg-white text-lg font-extrabold text-muted-foreground"
                  >
                    ‹
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── الشريط السفلي: خيارات + نفّذ + اسم النتيجة ─── */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-border bg-white p-3 shadow-sm">
            {tool === "remove_watermark" && (
              <span className="w-full text-[10px] text-muted-foreground">
                هذه الأداة تعالج الملف على الخادم ويُحذف فور انتهاء التنفيذ — والعلامات المرسومة داخل صور قد لا تُحذف
              </span>
            )}
            {tool ? (
              TOOLS_BY_ID[tool].fields.map((f) => (
                <span key={f.key} className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground">{f.label}</span>
                  {f.type === "select" ? (
                    <select
                      value={params[f.key] ?? f.default ?? ""}
                      onChange={(e) => setParams((p) => ({ ...p, [f.key]: e.target.value }))}
                      className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-bold"
                    >
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={params[f.key] ?? ""}
                      onChange={(e) => setParams((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-44 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold placeholder:font-normal placeholder:text-muted-foreground/60"
                    />
                  )}
                </span>
              ))
            ) : (
              <span className="px-1 text-xs font-bold text-muted-foreground">
                {activeFile?.kind === "image"
                  ? "الصور تتحول إلى PDF بأداة «من صور»"
                  : activeFile && activeFile.kind !== "pdf"
                    ? "الأنواع الأخرى تتحول من تبويب «تحويل»"
                    : "اختر أداة من الشريط"}
              </span>
            )}
            <span className="flex-1" />
            {expectedName && (
              <span className="text-[11px] text-muted-foreground">
                تُحفظ باسم <b className="text-xs text-foreground">{expectedName}</b>
              </span>
            )}
            <Button size="sm" disabled={!tool || running} onClick={execute} className="px-6 font-extrabold">
              {running ? "جارٍ التنفيذ…" : "نفّذ"}
            </Button>
          </div>
          {running && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.round(runProgress * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] font-bold text-muted-foreground">{runMessage}</p>
            </div>
          )}
        </>
      )}

      {/* ─── النتائج ─── */}
      {results.length > 0 && (
        <div className="mt-5 rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow-lg shadow-emerald-900/5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-500 font-extrabold text-white">
              ✓
            </span>
            <h3 className="font-extrabold text-emerald-600">
              جاهز — {toHindiDigits(results.length)} {results.length === 1 ? "ملف" : "ملفات"}
            </h3>
            <span className="flex-1" />
            {results.length > 1 && (
              <Button variant="outline" size="sm" onClick={downloadAll} className="font-bold">
                تحميل الكل (ZIP)
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearResults}
              className="text-muted-foreground"
            >
              رجوع للشغل
            </Button>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {results.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-50 text-[9px] font-extrabold text-red-600">
                  {extLabel(r.name)}
                </span>
                {renaming?.id === r.id ? (
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <input
                      autoFocus
                      value={renaming.value}
                      onChange={(e) => setRenaming({ id: r.id, value: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && commitRename()}
                      className="w-full rounded-lg border border-primary/40 px-2 py-1 text-xs font-bold"
                    />
                    <button
                      onClick={commitRename}
                      aria-label="حفظ الاسم"
                      className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500 text-white"
                    >
                      <Check className="size-3.5" aria-hidden />
                    </button>
                    <button
                      onClick={() => setRenaming(null)}
                      aria-label="إلغاء"
                      className="shrink-0 text-muted-foreground"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </span>
                ) : (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold">{r.name}</span>
                    <span className="block text-[10px] text-muted-foreground">{fmtSize(r.size)}</span>
                  </span>
                )}
                {renaming?.id !== r.id && (
                  <>
                    <button
                      onClick={() => setRenaming({ id: r.id, value: r.name })}
                      aria-label="إعادة تسمية"
                      className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </button>
                    <Button
                      size="sm"
                      onClick={() => download(r)}
                      className="shrink-0 bg-emerald-600 font-extrabold text-white hover:bg-emerald-700"
                    >
                      تحميل
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
