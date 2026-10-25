"use client";

/* شاشة العمل الجديدة — عرض الملف + شريط أدوات واحد، بدون أوامر نصية ولا شرح */

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, FileOutput, Pencil, Plus, RotateCw, Trash2, X } from "lucide-react";
import { useWorkspace } from "@/store/workspace";
import { TOOLS_BY_ID } from "@/lib/tools-catalog";
import { resultName } from "@/lib/naming";
import { downloadBlob, openBlobInNewTab, pageQuickAction, pdfPageThumbs, readPdfMetadata } from "@/lib/pdf-engine";
import type { PdfMetaInfo } from "@/lib/pdf-engine";
import { EditorCanvas } from "@/components/pdf-station/editor-canvas";
import { CadViewer } from "@/components/pdf-station/cad-viewer";
import { SplitPanel } from "@/components/pdf-station/split-panel";
import { MergePagesPanel } from "@/components/pdf-station/merge-pages-panel";
import { SignaturePanel } from "@/components/pdf-station/signature-panel";
import { toHindiDigits } from "@/lib/arabic";
import { useI18n, toolKey } from "@/lib/i18n";
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
  editor: svg(
    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  ),
  cad_viewer: svg(
    <>
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" />
      <path d="m14 17 3 3 4-4" />
    </>
  ),
  compress: svg(<path d="M4 9h16M4 15h10M9 4l-4 5 4 5" />),
  merge: svg(
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
  ),
  merge_pages: svg(
    <>
      <rect x="3" y="3" width="9" height="9" rx="2" />
      <rect x="12" y="12" width="9" height="9" rx="2" />
      <path d="M13.5 7.5h5M16 5v5" />
    </>
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
  image_convert: svg(
    <>
      <path d="M20 5H7l3 3M4 19h13l-3-3" />
    </>
  ),
  image_resize: svg(
    <>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-8 8M3 21l8-8" />
    </>
  ),
  image_crop: svg(
    <>
      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </>
  ),
  extract_text: svg(
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6M9 13h6M9 17h4" />
    </>
  ),
  ocr: svg(
    <>
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
      <circle cx="11.5" cy="11.5" r="3" />
      <path d="m13.8 13.8 2.7 2.7" />
    </>
  ),
  pdf_to_word: svg(
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6" />
      <path d="M8 13.5 9.5 17l1.5-3.5M12.5 17v-3.5l2 3.5 2-3.5V17" />
    </>
  ),
  pdf_to_excel: svg(
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6" />
      <path d="m8.5 13.5 7 5M15.5 13.5l-7 5" />
    </>
  ),
  sign: svg(
    <>
      <path d="M3 17c3 0 4.5-2.5 5.5-5 1-2.4 2-4 3-4s.8 2.2 0 4.5c-.9 2.6-.6 4.5 1.5 4.5s3.5-2 4-4.5" />
      <path d="M17.5 4.5 19.5 2.5 21.5 4.5 19.5 6.5Z" />
      <path d="M3 21h18" />
    </>
  ),
  protect: svg(
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  unlock: svg(
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.8-1.2" />
      <circle cx="12" cy="16" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
};

const TOOLBAR: { id: OpId | "editor" | "cad_viewer"; label: string }[] = [
  { id: "editor", label: "تعديل" },
  { id: "cad_viewer", label: "عارض أوتوكاد" },
  { id: "compress", label: "تصغير" },
  { id: "merge", label: "دمج" },
  { id: "merge_pages", label: "دمج صفحات" },
  { id: "split", label: "فصل" },
  { id: "extract", label: "استخراج" },
  { id: "delete", label: "حذف" },
  { id: "rotate", label: "تدوير" },
  { id: "reorder", label: "ترتيب" },
  { id: "page_numbers", label: "ترقيم" },
  { id: "watermark", label: "ختم" },
  { id: "remove_watermark", label: "بدون علامة" },
  { id: "sign", label: "توقيع" },
  { id: "protect", label: "قفل" },
  { id: "unlock", label: "فتح قفل" },
  { id: "pdf_to_images", label: "لصور" },
  { id: "images_to_pdf", label: "من صور" },
  { id: "image_convert", label: "صيغة" },
  { id: "image_resize", label: "أبعاد" },
  { id: "image_crop", label: "قص" },
  { id: "extract_text", label: "نص" },
  { id: "ocr", label: "OCR" },
  { id: "pdf_to_word", label: "لـ Word" },
  { id: "pdf_to_excel", label: "لـ Excel" },
];

/* المرحلة 2 — الأدوات السياقية: لكل قسم زرّه الخاص بفعله العربي، لا يظهر إلا داخل قسمه */
const TOOL_ACTION: Partial<Record<OpId, { verb: string }>> = {
  compress: { verb: "صغّر الحجم" },
  merge: { verb: "ادمج الملفات" },
  merge_pages: { verb: "ادمج الصفحات المختارة" },
  extract: { verb: "استخرج الصفحات" },
  delete: { verb: "احذف الصفحات" },
  rotate: { verb: "دوّر الصفحات" },
  reorder: { verb: "رتّب الصفحات" },
  page_numbers: { verb: "رقّم الصفحات" },
  watermark: { verb: "ضع الختم" },
  remove_watermark: { verb: "نظّف العلامات" },
  pdf_to_images: { verb: "حوّل لصور" },
  images_to_pdf: { verb: "اعمل PDF من الصور" },
  image_convert: { verb: "حوّل الصيغة" },
  image_resize: { verb: "غيّر الأبعاد" },
  image_crop: { verb: "اقتصّ الصورة" },
  extract_text: { verb: "استخرج النص" },
  ocr: { verb: "اقرأ النص الممسوح" },
  pdf_to_word: { verb: "حوّل لـ Word" },
  pdf_to_excel: { verb: "حوّل لـ Excel" },
  sign: { verb: "ثبّت التوقيع" },
  protect: { verb: "اقفل الملف" },
  unlock: { verb: "افتح القفل" },
  metadata: { verb: "عدّل البيانات" },
};

/* الأدوات التي تعمل على صفحات محددة — زرّها يعرض عدد الصفحات المختارة */
const PAGES_TOOLS: OpId[] = ["extract", "delete", "rotate"];

function pagesLabel(n: number): string {
  return n === 1 ? "صفحة واحدة" : n === 2 ? "صفحتين" : `${toHindiDigits(n)} صفحات`;
}

/* نفس الدالة عبر القاموس — تُستخدم داخل المكوّن */
function pagesWordT(n: number, t: (k: string) => string): string {
  return n === 1
    ? t("ws.pagesWordOne")
    : n === 2
      ? t("ws.pagesWordTwo")
      : `${toHindiDigits(n)} ${t("ws.pagesWordMany")}`;
}

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
  if (b >= 1048576) return `${toHindiDigits((b / 1048576).toFixed(1))} م.ب`;
  return `${toHindiDigits(Math.max(1, Math.round(b / 1024)))} ك.ب`;
}

/* زرّ إجراء سريع على صفحة (شريط الصفحات الذكي — المرحلة 1) */
function QuickPageBtn({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-6 place-items-center rounded-md bg-white text-muted-foreground shadow-sm ring-1 ring-border transition",
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-primary/10 hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}

function extLabel(name: string): string {
  const e = name.match(/\.([^.]+)$/)?.[1]?.toUpperCase() ?? "ملف";
  return e === "JPG" ? "JPG" : e;
}

/* ─────────── المكوّن ─────────── */

export function Workbench() {
  const { t } = useI18n();
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
  const addEditorResult = useWorkspace((s) => s.addEditorResult);
  const appendResult = useWorkspace((s) => s.appendResult);
  const addResultAsFile = useWorkspace((s) => s.addResultAsFile);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [selFiles, setSelFiles] = useState<Set<string> | null>(null);
  const [tool, setTool] = useState<OpId | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [selPages, setSelPages] = useState<number[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(1);
  const [metaInfo, setMetaInfo] = useState<PdfMetaInfo | null>(null);

  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cadOpen, setCadOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const thumbsReq = useRef<Set<string>>(new Set());
  const bottomBarRef = useRef<HTMLDivElement>(null);

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

  /* اختصارات PWA (?op=merge مثلاً) تفتح الأداة مباشرة عند الإقلاع */
  useEffect(() => {
    const op = new URLSearchParams(window.location.search).get("op");
    if (op && TOOLS_BY_ID[op as OpId]) setTool(op as OpId);
  }, []);

  /* أداة البيانات: قراءة الخصائص الحالية + تعبئة الحقول مسبقًا (عند تغيير الأداة أو الملف) */
  useEffect(() => {
    if (tool !== "metadata") return;
    if (!activeFile || activeFile.kind !== "pdf") return;
    let alive = true;
    readPdfMetadata(activeFile.file)
      .then((info) => {
        if (!alive) return;
        setMetaInfo(info);
        setParams((p) => ({
          ...p,
          mode: p.mode || "edit",
          title: info.title ?? "",
          author: info.author ?? "",
          subject: info.subject ?? "",
          keywords: info.keywords ?? "",
        }));
      })
      .catch(() => alive && setMetaInfo({ encrypted: true }));
    return () => {
      alive = false;
    };
  }, [tool, activeFile]);

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
    } else if (activeFile.kind === "pdf") {
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

  const editorEnabled =
    activeFile?.kind === "pdf" || activeFile?.kind === "image";
  const cadEnabled = activeFile?.kind === "cad";

  /* وضع الفصل البصري بعمودين + وضع دمج الصفحات من عدة ملفات (المرحلة 3) + التوقيع */
  const splitMode = tool === "split" && activeFile?.kind === "pdf";
  const mergePagesMode = tool === "merge_pages";
  const signMode = tool === "sign" && activeFile?.kind === "pdf";

  const pickTool = (id: OpId) => {
    setTool(id);
    const def: Record<string, string> = {};
    for (const f of TOOLS_BY_ID[id].fields) if (f.default !== undefined) def[f.key] = f.default;
    const pf = TOOLS_BY_ID[id].fields.find((f) => f.pagesPicker);
    if (pf) def[pf.key] = selPages.join(",");
    setParams(def);
    /* على الجوال: القسم السفلي بعيد عن الشريط — مرّر إليه ليظهر زرّ الأداة السياقي فورًا */
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      window.setTimeout(
        () => bottomBarRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
        80
      );
    }
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
    /* دمج الصفحات يعمل على كل ملفات PDF في المساحة — لا يشترط تحديدًا */
    if (id === "merge_pages") return files.some((f) => f.kind === "pdf");
    for (const k of selKinds) if (t.accepts.includes(k)) return true;
    return false;
  };

  const hintDisabled = (id: OpId) => {
    const def = TOOLS_BY_ID[id];
    if (!def) return;
    if (id === "merge_pages") {
      toast.info(t("msg.addPdfFirst"));
      return;
    }
    if (def.accepts.includes("image") && !def.accepts.includes("pdf"))
      toast.info(t("msg.forImages"));
    else if (activeFile?.kind === "cad")
      toast.info(t("cad.openFromBar"));
    else if (activeFile?.kind === "image")
      toast.info(t("msg.forPdfUseImages"));
    else if (activeFile && activeFile.kind !== "pdf")
      toast.info(t("msg.kinds"));
    else toast.info(t("msg.selectPdf"));
  };

  const editorSave = (name: string, blob: Blob) => {
    addEditorResult(name, blob);
    setEditing(false);
    toast.success(t("ed.savedToast"));
  };

  /* نتيجة التوقيع: تُضاف للنتائج وتصير ملف العمل النشط — لتكمل التواقيع على النسخة الأخيرة */
  const signApplied = async (name: string, blob: Blob) => {
    appendResult(name, blob, "sign");
    const newId = await addResultAsFile(name, blob);
    setActiveId(newId);
  };

  /* اسم زرّ الأداة السياقي: الفعل + عدد الصفحات المختارة إن وُجد */
  const actionLabel = (id: OpId): string => {
    /* من القاموس أولاً — وإن غاب المفتاح رجع للعربي في TOOL_ACTION */
    let verb = t(`verb.${id}`);
    if (verb === `verb.${id}`) verb = TOOL_ACTION[id]?.verb ?? t("verb.run");
    /* التدوير والتصغير مشتركان بين PDF والصور — الفعل يتبع نوع الملف النشط المعروض */
    if (activeFile?.kind === "image") {
      if (id === "rotate") verb = t("verb.rotateImg");
      if (id === "compress") verb = t("verb.compressImg");
    }
    if (PAGES_TOOLS.includes(id) && selPages.length > 0)
      return `${verb} (${pagesWordT(selPages.length, t)})`;
    return verb;
  };

  /* المرحلة 1 — أفعال شريط الصفحات السريعة: صفحة واحدة في نقرة
     حذف/تدوير/تكرار → الناتج يصير ملف العمل النشط فورًا (الأصل يبقى محفوظًا)
     استخراج → ملف مستقل يبقى في القائمة دون تحويل التركيز */
  const [quickBusy, setQuickBusy] = useState(false);
  const quickAction = async (
    action: "delete" | "rotate" | "extract" | "duplicate",
    pageNo: number
  ) => {
    if (!activeFile || activeFile.kind !== "pdf" || running || quickBusy) return;
    setQuickBusy(true);
    try {
      const { name, blob } = await pageQuickAction(activeFile.file, action, pageNo);
      appendResult(name, blob, "page-quick");
      if (action === "extract") {
        toast.success(`اتسحبت الصفحة ${toHindiDigits(pageNo)} في ملف مستقل`);
      } else {
        const newId = await addResultAsFile(name, blob);
        setActiveId(newId);
        setPage(1);
        setSelPages([]);
        toast.success(
          action === "delete"
            ? `حُذفت الصفحة ${toHindiDigits(pageNo)} — أكمل على النسخة الجديدة`
            : action === "rotate"
              ? `اتدوّرت الصفحة ${toHindiDigits(pageNo)} 90° — أكمل على النسخة الجديدة`
              : `اتكررت الصفحة ${toHindiDigits(pageNo)} — أكمل على النسخة الجديدة`
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر تنفيذ الإجراء");
    } finally {
      setQuickBusy(false);
    }
  };

  const execute = async () => {
    if (!tool || running) return;
    const def = TOOLS_BY_ID[tool];
    const chosen = files.filter((f) => effectiveSel.has(f.id) && def.accepts.includes(f.kind));
    if (chosen.length === 0) {
      toast.error(def.accepts.includes("image") ? t("msg.forImages") : t("msg.selectPdf"));
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
          <h2 className="mt-4 text-xl font-extrabold">{t("hero.drop")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("hero.dropHint")}</p>
          <Button
            className="mt-5 px-8 font-extrabold"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            {t("hero.pick")}
          </Button>
        </div>
      ) : (
        <>
          {/* ─── شريط الأدوات ─── */}
          <div className="flex flex-wrap gap-0.5 rounded-2xl border border-border bg-white p-1.5 shadow-sm">
            {TOOLBAR.map(({ id }) => {
              const isEditor = id === "editor";
              const isCad = id === "cad_viewer";
              const ok = isEditor ? editorEnabled : isCad ? cadEnabled : toolEnabled(id as OpId);
              const active = isEditor ? editing : isCad ? cadOpen : tool === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (isEditor) {
                      if (ok) {
                        setTool(null);
                        setEditing(true);
                      } else toast.info(t("msg.selectPdfOrImage"));
                      return;
                    }
                    if (isCad) {
                      if (ok) {
                        setTool(null);
                        setEditing(false);
                        setCadOpen(true);
                      } else toast.info(t("cad.addFirst"));
                      return;
                    }
                    if (ok) {
                      setEditing(false);
                      /* النقر على «فصل» أو «دمج صفحات» أو «توقيع» وهي مفتوحة يغلقها */
                      if ((id === "split" || id === "merge_pages" || id === "sign") && tool === id)
                        setTool(null);
                      else pickTool(id as OpId);
                    } else hintDisabled(id as OpId);
                  }}
                  className={cn(
                    "flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-bold transition",
                    active
                      ? "bg-primary/10 text-primary outline outline-1 outline-primary/30"
                      : ok
                        ? "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                        : "cursor-not-allowed text-muted-foreground/30"
                  )}
                >
                  {TOOL_ICONS[id]}
                  {t(`tb.${id}`)}
                </button>
              );
            })}
          </div>

          {/* ─── الجسم: ملفات + (فصل بعمودين | صفحات + معاينة) ─── */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[200px_130px_1fr]">
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-3">
              <p className="px-1 text-[11px] font-bold text-muted-foreground">{t("ws.files")}</p>
              <div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto">
                {files.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setActiveId(f.id);
                      setPage(1);
                      setSelPages([]);
                      /* النقر على الكارت = هذا هو ملف العمل — يفضّل تحديدًا قديمًا عالقًا */
                      setSelFiles(null);
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
                      aria-label={t("ws.selectFile")}
                      className={cn(
                        "absolute -left-1.5 -top-1.5 grid size-5 place-items-center rounded-full border text-[10px] font-extrabold",
                        effectiveSel.has(f.id)
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white text-transparent"
                      )}
                    >
                      ✓
                    </button>
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg text-[9px] font-extrabold",
                        f.kind === "pdf"
                          ? "bg-red-50 text-red-600"
                          : f.kind === "image"
                            ? "bg-sky-50 text-sky-600"
                            : "bg-amber-50 text-amber-600"
                      )}
                    >
                      {f.kind === "image" ? "IMG" : f.kind === "pdf" ? "PDF" : "؟"}
                    </span>
                    <span className="min-w-0">
                      <span className="block max-w-[108px] truncate text-xs font-bold">{f.name}</span>
                      <span className="block text-[10px] text-muted-foreground">
                        {f.pages ? `${toHindiDigits(f.pages)} ${t("ws.pagesCount")} · ` : ""}
                        {fmtSize(f.size)}
                      </span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(f.id);
                      }}
                      aria-label={t("ws.removeFile")}
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
                  {t("hero.addFile")}
                </button>
              </div>
            </div>

            {splitMode ? (
              <div className="lg:col-span-2">
                <SplitPanel
                  fileName={activeFile.name}
                  file={activeFile.file}
                  pages={activeFile.pages ?? thumbs[activeFile.id]?.length ?? 1}
                  onClose={() => setTool(null)}
                />
              </div>
            ) : mergePagesMode ? (
              <div className="lg:col-span-2">
                <MergePagesPanel
                  files={files.filter((f) => f.kind === "pdf")}
                  onClose={() => setTool(null)}
                />
              </div>
            ) : signMode ? (
              <div className="lg:col-span-2">
                <SignaturePanel
                  file={activeFile.file}
                  fileName={activeFile.name}
                  page={page}
                  pages={activeFile.pages ?? 1}
                  onPage={setPage}
                  onClose={() => setTool(null)}
                  onApplied={signApplied}
                />
              </div>
            ) : (
            <>
            <div className="hidden max-h-[560px] flex-col gap-2 overflow-y-auto rounded-2xl border border-border bg-white p-3 lg:flex">
              <p className="px-1 text-[11px] font-bold text-muted-foreground">الصفحات</p>
              {activeFile?.kind === "pdf" &&
                (thumbs[activeFile.id] ?? []).map((src, i) => (
                  <div
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      "group relative shrink-0 cursor-pointer rounded-lg border bg-white p-1.5",
                      page === i + 1 ? "border-primary ring-2 ring-primary/15" : "border-border"
                    )}
                  >
                    <img src={src} alt={`صفحة ${toHindiDigits(i + 1)}`} className="w-full rounded" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePage(i + 1);
                      }}
                      aria-label={t("ws.selectPage")}
                      className={cn(
                        "absolute -left-1.5 -top-1.5 z-10 grid size-5 place-items-center rounded-full border text-[10px] font-extrabold",
                        selPages.includes(i + 1)
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white text-muted-foreground"
                      )}
                    >
                      {selPages.includes(i + 1) ? "✓" : toHindiDigits(i + 1)}
                    </button>
                    {/* أفعال سريعة على الصفحة — دايمة على الصفحة النشطة، وبالمرور/التركيز للباقي */}
                    <div
                      className={cn(
                        "absolute inset-x-1 bottom-1 z-10 justify-center gap-1 rounded-lg bg-white/95 p-1 shadow-md ring-1 ring-border",
                        page === i + 1 ? "flex" : "hidden group-hover:flex group-focus-within:flex"
                      )}
                    >
                      <QuickPageBtn
                        label={`${t("qp.delete")} ${toHindiDigits(i + 1)}`}
                        danger
                        onClick={() => quickAction("delete", i + 1)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </QuickPageBtn>
                      <QuickPageBtn
                        label={`${t("qp.rotate")} ${toHindiDigits(i + 1)} 90°`}
                        onClick={() => quickAction("rotate", i + 1)}
                      >
                        <RotateCw className="size-3.5" aria-hidden />
                      </QuickPageBtn>
                      <QuickPageBtn
                        label={`${t("qp.extract")} ${toHindiDigits(i + 1)}`}
                        onClick={() => quickAction("extract", i + 1)}
                      >
                        <FileOutput className="size-3.5" aria-hidden />
                      </QuickPageBtn>
                      <QuickPageBtn
                        label={`${t("qp.duplicate")} ${toHindiDigits(i + 1)}`}
                        onClick={() => quickAction("duplicate", i + 1)}
                      >
                        <Copy className="size-3.5" aria-hidden />
                      </QuickPageBtn>
                    </div>
                  </div>
                ))}
              {activeFile?.kind === "pdf" && !thumbs[activeFile.id] && (
                <p className="py-4 text-center text-[11px] text-muted-foreground">{t("ws.preparing")}</p>
              )}
              {activeFile?.kind === "image" && activeFile.thumb && (
                <img src={activeFile.thumb} alt="" className="rounded-lg border border-border" />
              )}
            </div>

            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-border bg-slate-50 p-4">
              {activeFile?.kind === "cad" && !cadOpen ? (
                <div className="flex max-w-md flex-col items-center gap-4 text-center">
                  <span className="grid size-16 place-items-center rounded-2xl bg-amber-50 text-3xl">📐</span>
                  <div>
                    <h3 className="text-lg font-extrabold">{t("cad.ctaTitle")}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t("cad.ctaBody")}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setTool(null);
                      setEditing(false);
                      setCadOpen(true);
                    }}
                    className="bg-amber-600 px-8 font-extrabold text-white hover:bg-amber-700"
                  >
                    {t("cad.ctaOpen")}
                  </Button>
                </div>
              ) : cadOpen && activeFile ? (
                <CadViewer
                  fileName={activeFile.name}
                  file={activeFile.file}
                  onClose={() => setCadOpen(false)}
                />
              ) : editing && activeFile ? (
                <EditorCanvas
                  fileName={activeFile.name}
                  kind={activeFile.kind === "image" ? "image" : "pdf"}
                  file={activeFile.file}
                  page={page}
                  pages={activeFile.pages ?? 1}
                  onPage={setPage}
                  onClose={() => setEditing(false)}
                  onSave={editorSave}
                />
              ) : (
                <>
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
                        aria-label={t("qp.prevPage")}
                        className="grid size-8 place-items-center rounded-lg border border-border bg-white text-lg font-extrabold text-muted-foreground"
                      >
                        ›
                      </button>
                      <span className="text-sm font-extrabold text-muted-foreground">
                        {toHindiDigits(page)} / {toHindiDigits(activeFile.pages ?? 1)}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(activeFile.pages ?? 1, p + 1))}
                        aria-label={t("qp.nextPage")}
                        className="grid size-8 place-items-center rounded-lg border border-border bg-white text-lg font-extrabold text-muted-foreground"
                      >
                        ‹
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            </>
            )}

            {/* الجوال — شريط الصفحات الأفقي بأزرار الأفعال السريعة (الرِيل المخفي تحت 1024px) */}
            {activeFile?.kind === "pdf" && !editing && !splitMode && !mergePagesMode && !signMode && (
              <div className="lg:hidden">
                <p className="px-1 pb-1.5 text-[11px] font-bold text-muted-foreground">
                  {t("ws.pagesHint")}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {(thumbs[activeFile.id] ?? []).map((src, i) => (
                    <div
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={cn(
                        "relative w-[110px] shrink-0 cursor-pointer rounded-lg border bg-white p-1.5",
                        page === i + 1 ? "border-primary ring-2 ring-primary/15" : "border-border"
                      )}
                    >
                      <img src={src} alt={`صفحة ${toHindiDigits(i + 1)}`} className="h-28 w-full rounded object-cover object-top" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePage(i + 1);
                        }}
                        aria-label={t("ws.selectPage")}
                        className={cn(
                          "absolute -left-1.5 -top-1.5 z-10 grid size-5 place-items-center rounded-full border text-[10px] font-extrabold",
                          selPages.includes(i + 1)
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-white text-muted-foreground"
                        )}
                      >
                        {selPages.includes(i + 1) ? "✓" : toHindiDigits(i + 1)}
                      </button>
                      <div className="mt-1 flex items-center justify-center gap-0.5">
                        <QuickPageBtn
                          label={`${t("qp.delete")} ${toHindiDigits(i + 1)}`}
                          danger
                          onClick={() => quickAction("delete", i + 1)}
                        >
                          <Trash2 className="size-3" aria-hidden />
                        </QuickPageBtn>
                        <QuickPageBtn
                          label={`${t("qp.rotate")} ${toHindiDigits(i + 1)} 90°`}
                          onClick={() => quickAction("rotate", i + 1)}
                        >
                          <RotateCw className="size-3" aria-hidden />
                        </QuickPageBtn>
                        <QuickPageBtn
                          label={`${t("qp.extract")} ${toHindiDigits(i + 1)}`}
                          onClick={() => quickAction("extract", i + 1)}
                        >
                          <FileOutput className="size-3" aria-hidden />
                        </QuickPageBtn>
                        <QuickPageBtn
                          label={`${t("qp.duplicate")} ${toHindiDigits(i + 1)}`}
                          onClick={() => quickAction("duplicate", i + 1)}
                        >
                          <Copy className="size-3" aria-hidden />
                        </QuickPageBtn>
                      </div>
                    </div>
                  ))}
                  {!thumbs[activeFile.id] && (
                    <p className="py-4 text-[11px] text-muted-foreground">{t("ws.preparing")}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── الشريط السفلي: قسم الأداة + زرّها السياقي + اسم النتيجة (يُخفى أثناء التعديل والفصل والتوقيع) ─── */}
          {!editing && !splitMode && !mergePagesMode && !signMode && (
            <>
              <div
                ref={bottomBarRef}
                className="mt-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-border bg-white p-3 shadow-sm scroll-mt-24"
              >
            {tool === "remove_watermark" && (
              <span className="w-full text-[10px] text-muted-foreground">
                {t("ws.hintRemoveWm")}
              </span>
            )}
            {tool === "extract_text" && activeFile?.scanned && (
              <span className="w-full text-[10px] font-bold text-amber-600">
                {t("ws.hintScanned")}
              </span>
            )}
            {tool === "ocr" && (
              <span className="w-full text-[10px] text-muted-foreground">
                {t("ws.hintOcr")}
              </span>
            )}
            {(tool === "pdf_to_word" || tool === "pdf_to_excel") && (
              <span className="w-full text-[10px] text-muted-foreground">
                {t("ws.hintOffice")}
              </span>
            )}
            {tool === "metadata" && metaInfo && (
              <span
                data-testid="meta-current"
                className="w-full text-[10px] text-muted-foreground"
              >
                {metaInfo.encrypted
                  ? t("meta.encrypted")
                  : metaInfo.title || metaInfo.author || metaInfo.producer || metaInfo.created
                    ? `${t("meta.current")}: ${metaInfo.title ? `«${metaInfo.title}»` : "—"} · ${metaInfo.author ? `«${metaInfo.author}»` : "—"}${metaInfo.producer ? ` · ${metaInfo.producer}` : ""}${metaInfo.created ? ` · ${t("meta.created")} ${metaInfo.created}` : ""}`
                    : t("meta.none")}
              </span>
            )}
            {tool === "metadata" && params.mode === "clear" && (
              <span className="w-full text-[10px] font-bold text-amber-600">
                {t("meta.clearHint")}
              </span>
            )}
            {tool ? (
              <>
                <span
                  aria-label={t("ws.currentSection")}
                  className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-extrabold text-primary"
                >
                  <span aria-hidden>{TOOLS_BY_ID[tool].emoji}</span>
                  {t(toolKey(tool, "name"))}
                </span>
                {TOOLS_BY_ID[tool].fields
                  .filter(
                    (f) =>
                      !(
                        tool === "metadata" &&
                        params.mode === "clear" &&
                        ["title", "author", "subject", "keywords"].includes(f.key)
                      )
                  )
                  .map((f) => (
                  <span key={f.key} className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground">{f.label}</span>
                    {f.type === "select" ? (
                      <select
                        value={params[f.key] ?? f.default ?? ""}
                        onChange={(e) => setParams((p) => ({ ...p, [f.key]: e.target.value }))}
                        data-testid={`field-${f.key}`}
                        className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-bold"
                      >
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : f.type === "password" ? (
                      <input
                        type="password"
                        value={params[f.key] ?? ""}
                        onChange={(e) => setParams((p) => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        autoComplete="new-password"
                        data-testid={`field-${f.key}`}
                        className="w-44 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold placeholder:font-normal placeholder:text-muted-foreground/60"
                      />
                    ) : (
                      <input
                        value={params[f.key] ?? ""}
                        onChange={(e) => setParams((p) => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        data-testid={`field-${f.key}`}
                        className="w-44 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold placeholder:font-normal placeholder:text-muted-foreground/60"
                      />
                    )}
                  </span>
                ))}
              </>
            ) : (
              <span className="px-1 text-xs font-bold text-muted-foreground">
                {activeFile?.kind === "image"
                  ? t("ws.noToolImage")
                  : activeFile && activeFile.kind !== "pdf" && activeFile.kind !== "cad"
                    ? t("ws.noToolOther")
                    : t("ws.noTool")}
              </span>
            )}
            <span className="flex-1" />
            {expectedName && (
              <span className="text-[11px] text-muted-foreground">
                {t("ws.savedAs")} <b className="text-xs text-foreground">{expectedName}</b>
              </span>
            )}
            {tool && (
              <Button
                size="sm"
                disabled={running}
                onClick={execute}
                aria-label={actionLabel(tool)}
                className="px-6 font-extrabold"
              >
                {running ? t("verb.running") : actionLabel(tool)}
              </Button>
            )}
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
              {t("ws.ready")} — {toHindiDigits(results.length)} {results.length === 1 ? t("ws.readyOne") : t("ws.readyMany")}
            </h3>
            <span className="flex-1" />
            {results.length > 1 && (
              <Button variant="outline" size="sm" onClick={downloadAll} className="font-bold">
                {t("ws.downloadAll")}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearResults}
              className="text-muted-foreground"
            >
              {t("ws.backToWork")}
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
                      aria-label={t("ws.saveName")}
                      className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500 text-white"
                    >
                      <Check className="size-3.5" aria-hidden />
                    </button>
                    <button
                      onClick={() => setRenaming(null)}
                      aria-label={t("ws.cancel")}
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
                      aria-label={t("ws.rename")}
                      className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </button>
                    <Button
                      size="sm"
                      onClick={() => download(r)}
                      className="shrink-0 bg-emerald-600 font-extrabold text-white hover:bg-emerald-700"
                    >
                      {t("ws.download")}
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
