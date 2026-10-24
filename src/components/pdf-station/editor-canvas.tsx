"use client";

/* طبقة التعديل المباشر — رسم وتظليل وأشكال ونص عربي فوق صفحة PDF أو صورة
   الفلسفة: ما تراه في المحرر هو ما يُحفظ بالضبط (Canvas → PNG يُطبع فوق الصفحة)
   الإحداثيات والأحجام طبيعية نسبية للصفحة (0..1 والسماكة بأجزاء من الألف من الارتفاع)
   → تُرسم بأي دقة بدون فقدان وبنفس المظهر */

import { useCallback, useEffect, useRef, useState } from "react";
import { toHindiDigits } from "@/lib/arabic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Check, Undo2, Redo2, Trash2 } from "lucide-react";

/* ─────────── النموذج ─────────── */

type ToolId = "pen" | "highlight" | "line" | "arrow" | "rect" | "ellipse" | "text";

interface BaseAnno {
  id: string;
  tool: ToolId;
  color: string;
  /** سماكة بوحدة ‰ من ارتفاع الصفحة (مستقلة عن الدقة) */
  width: number;
}
interface StrokeAnno extends BaseAnno {
  tool: "pen" | "highlight";
  pts: [number, number][];
}
interface ShapeAnno extends BaseAnno {
  tool: "line" | "arrow" | "rect" | "ellipse";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
interface TextAnno extends BaseAnno {
  tool: "text";
  x: number;
  y: number;
  /** حجم الخط بوحدة ‰ من ارتفاع الصفحة */
  size: number;
  text: string;
}
type Anno = StrokeAnno | ShapeAnno | TextAnno;

interface EditorDoc {
  annos: Record<number, Anno[]>;
  past: Record<number, Anno[]>[];
  future: Record<number, Anno[]>[];
}

const COLORS = [
  { v: "#111827", label: "أسود", dot: "bg-gray-900" },
  { v: "#DC2626", label: "أحمر", dot: "bg-red-600" },
  { v: "#2563EB", label: "أزرق", dot: "bg-blue-600" },
  { v: "#16A34A", label: "أخضر", dot: "bg-green-600" },
];
/* ‰ من ارتفاع الصفحة: على A4 (ارتفاع ٨٤٢pt) متوسط ≈ ٣pt */
const SIZES = [
  { v: 2, label: "رفيع" },
  { v: 3.5, label: "متوسط" },
  { v: 6, label: "عريض" },
];
const TEXT_SIZES = [
  { v: 24, label: "صغير" },
  { v: 36, label: "متوسط" },
  { v: 52, label: "كبير" },
];
const HIGHLIGHT_COLOR = "#FDE047";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

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
const TOOL_ICONS: Record<ToolId, React.ReactNode> = {
  pen: svg(
    <path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586M11 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" />
  ),
  highlight: svg(<path d="M9 11l6 6M4.5 19.5L9 15l-2-2-4.5 4.5v2h2zM14 4l6 6-7 7-6-6z" />),
  line: svg(<path d="M5 19L19 5" />),
  arrow: svg(<path d="M5 19L19 5M19 5h-8M19 5v8" />),
  rect: svg(<rect x="4" y="6" width="16" height="12" rx="1" />),
  ellipse: svg(<ellipse cx="12" cy="12" rx="8" ry="6" />),
  text: svg(<path d="M4 7V5h16v2M12 5v14M9 19h6" />),
};
const TOOL_LABEL: Record<ToolId, string> = {
  pen: "قلم",
  highlight: "تظليل",
  line: "خط",
  arrow: "سهم",
  rect: "مستطيل",
  ellipse: "دائرة",
  text: "نص",
};

/* ─────────── الرسم على سياق كانفس (الأحجام نسبية للارتفاع h) ─────────── */

function drawAnno(ctx: CanvasRenderingContext2D, a: Anno, w: number, h: number, fontFamily: string) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const pm = h / 1000; // وحدة الألف من الارتفاع → بكسل
  if (a.tool === "pen" || a.tool === "highlight") {
    const s = a as StrokeAnno;
    if (s.pts.length === 0) {
      ctx.restore();
      return;
    }
    ctx.strokeStyle = a.tool === "highlight" ? HIGHLIGHT_COLOR : a.color;
    ctx.globalAlpha = a.tool === "highlight" ? 0.42 : 1;
    ctx.lineWidth = a.tool === "highlight" ? a.width * 4 * pm : a.width * pm;
    ctx.beginPath();
    ctx.moveTo(s.pts[0][0] * w, s.pts[0][1] * h);
    for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i][0] * w, s.pts[i][1] * h);
    if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] * w + pm, s.pts[0][1] * h);
    ctx.stroke();
  } else if (a.tool === "line" || a.tool === "arrow") {
    const s = a as ShapeAnno;
    ctx.strokeStyle = a.color;
    ctx.lineWidth = a.width * pm;
    ctx.beginPath();
    ctx.moveTo(s.x1 * w, s.y1 * h);
    ctx.lineTo(s.x2 * w, s.y2 * h);
    ctx.stroke();
    if (a.tool === "arrow") {
      const ang = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
      const head = Math.max(8, a.width * 4) * pm;
      for (const off of [2.6, -2.6]) {
        ctx.beginPath();
        ctx.moveTo(s.x2 * w, s.y2 * h);
        ctx.lineTo(s.x2 * w - head * Math.cos(ang - off), s.y2 * h - head * Math.sin(ang - off));
        ctx.stroke();
      }
    }
  } else if (a.tool === "rect" || a.tool === "ellipse") {
    const s = a as ShapeAnno;
    ctx.strokeStyle = a.color;
    ctx.lineWidth = a.width * pm;
    const x = Math.min(s.x1, s.x2) * w;
    const y = Math.min(s.y1, s.y2) * h;
    const bw = Math.abs(s.x2 - s.x1) * w;
    const bh = Math.abs(s.y2 - s.y1) * h;
    ctx.beginPath();
    if (a.tool === "rect") ctx.rect(x, y, bw, bh);
    else ctx.ellipse(x + bw / 2, y + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const s = a as TextAnno;
    ctx.fillStyle = a.color;
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.font = `700 ${s.size * pm}px ${fontFamily}`;
    ctx.fillText(s.text, s.x * w, s.y * h);
  }
  ctx.restore();
}

/* ─────────── المكوّن ─────────── */

interface Props {
  fileName: string;
  kind: "pdf" | "image";
  file: File;
  page: number;
  pages: number;
  onPage: (p: number) => void;
  onClose: () => void;
  onSave: (name: string, blob: Blob) => void;
}

export function EditorCanvas({ fileName, kind, file, page, pages, onPage, onClose, onSave }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null); // طبقة الصفحة (عرض فقط)
  const liveRef = useRef<HTMLCanvasElement>(null); // طبقة الرسم التفاعلية
  const [ready, setReady] = useState(false);
  const [aspect, setAspect] = useState<number | null>(null);
  const [tool, setTool] = useState<ToolId>("pen");
  const [color, setColor] = useState(COLORS[0].v);
  const [size, setSize] = useState(3.5);
  const [textSize, setTextSize] = useState(36);
  const [doc, setDoc] = useState<EditorDoc>({ annos: {}, past: [], future: [] });
  const [busy, setBusy] = useState<string>("");
  const [typing, setTyping] = useState<{ x: number; y: number; value: string } | null>(null);
  const drawing = useRef<Anno | null>(null);
  const curList = doc.annos[page] ?? [];

  /* ── تحميل الصفحة الأساسية بدقة عالية ── */
  useEffect(() => {
    let alive = true;
    setReady(false);
    (async () => {
      const wrap = wrapRef.current;
      const maxCssW = Math.min(wrap?.clientWidth || 640, 900);
      if (kind === "image") {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.src = url;
        await img.decode().catch(() => undefined);
        if (!alive) return;
        const scale = Math.min(2, (maxCssW * 2) / img.naturalWidth);
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * scale);
        c.height = Math.round(img.naturalHeight * scale);
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        baseRef.current = c;
        setAspect(c.width / c.height);
      } else {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pdoc = await pdfjs.getDocument({ data: bytes }).promise;
        const p = await pdoc.getPage(Math.min(Math.max(1, page), pdoc.numPages));
        const v1 = p.getViewport({ scale: 1 });
        const targetW = Math.max(1000, Math.min(1800, Math.round(maxCssW * 2)));
        const viewport = p.getViewport({ scale: targetW / v1.width });
        const c = document.createElement("canvas");
        c.width = Math.floor(viewport.width);
        c.height = Math.floor(viewport.height);
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        await p.render({ canvasContext: ctx, viewport } as never).promise;
        if (!alive) return;
        baseRef.current = c;
        setAspect(c.width / c.height);
        (pdoc as unknown as { destroy?: () => void }).destroy?.();
      }
      if (alive) setReady(true);
    })().catch(() => setReady(true));
    return () => {
      alive = false;
    };
  }, [file, kind, page]);

  /* ── إعادة رسم الطبقة التفاعلية ── */
  const repaint = useCallback(() => {
    const live = liveRef.current;
    const base = baseRef.current;
    if (!live || !base) return;
    live.width = base.width;
    live.height = base.height;
    const ctx = live.getContext("2d")!;
    ctx.clearRect(0, 0, live.width, live.height);
    const fam = getComputedStyle(document.body).fontFamily || "sans-serif";
    for (const a of doc.annos[page] ?? []) drawAnno(ctx, a, live.width, live.height, fam);
    if (drawing.current) drawAnno(ctx, drawing.current, live.width, live.height, fam);
  }, [doc.annos, page]);

  useEffect(() => {
    repaint();
  }, [repaint, ready]);

  /* ── التاريخ (ذرّي — آمن مع StrictMode) ── */
  const commit = (next: Anno[]) =>
    setDoc((d) => ({
      annos: { ...d.annos, [page]: next },
      past: [...d.past.slice(-40), d.annos],
      future: [],
    }));
  const undo = () =>
    setDoc((d) =>
      d.past.length
        ? {
            annos: d.past[d.past.length - 1],
            past: d.past.slice(0, -1),
            future: [d.annos, ...d.future].slice(0, 40),
          }
        : d
    );
  const redo = () =>
    setDoc((d) =>
      d.future.length
        ? { annos: d.future[0], past: [...d.past, d.annos], future: d.future.slice(1) }
        : d
    );

  /* ── المؤشر → إحداثيات طبيعية ── */
  const norm = (e: React.PointerEvent): [number, number] => {
    const r = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    ];
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (typing) return;
    if (tool === "text") {
      const [x, y] = norm(e);
      setTyping({ x, y, value: "" });
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = norm(e);
    if (tool === "pen" || tool === "highlight") {
      drawing.current = { id: uid(), tool, color, width: size, pts: [[x, y]] };
    } else {
      drawing.current = { id: uid(), tool, color, width: size, x1: x, y1: y, x2: x, y2: y };
    }
    repaint();
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drawing.current;
    if (!d) return;
    const [x, y] = norm(e);
    if (d.tool === "pen" || d.tool === "highlight") (d as StrokeAnno).pts.push([x, y]);
    else {
      (d as ShapeAnno).x2 = x;
      (d as ShapeAnno).y2 = y;
    }
    repaint();
  };
  const onUp = () => {
    const d = drawing.current;
    drawing.current = null;
    if (!d) return;
    const t = d as StrokeAnno | ShapeAnno;
    const tiny =
      "pts" in t ? t.pts.length < 2 : Math.abs(t.x2 - t.x1) < 0.004 && Math.abs(t.y2 - t.y1) < 0.004;
    if (!tiny) commit([...curList, d]);
    repaint();
  };

  const commitText = () => {
    if (typing && typing.value.trim()) {
      commit([
        ...curList,
        {
          id: uid(),
          tool: "text",
          color,
          width: size,
          x: typing.x,
          y: typing.y,
          size: textSize,
          text: typing.value.trim(),
        },
      ]);
    }
    setTyping(null);
  };

  /* ── الحفظ ── */
  const save = async () => {
    if (busy) return;
    const touched = Object.keys(doc.annos)
      .map(Number)
      .filter((k) => (doc.annos[k] ?? []).length > 0);
    if (touched.length === 0) return;
    setBusy("جارٍ الحفظ…");
    try {
      const fam = getComputedStyle(document.body).fontFamily || "sans-serif";
      if (kind === "pdf") {
        const { PDFDocument } = await import("pdf-lib");
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const jdoc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
        const out = await PDFDocument.load(bytes.slice(), {
          ignoreEncryption: true,
          updateMetadata: false,
        });
        for (const pg of touched) {
          const p = await jdoc.getPage(pg);
          const v1 = p.getViewport({ scale: 1 });
          const targetW = Math.min(2400, Math.max(1400, Math.round(v1.width * 2.2)));
          const viewport = p.getViewport({ scale: targetW / v1.width });
          const c = document.createElement("canvas");
          c.width = Math.floor(viewport.width);
          c.height = Math.floor(viewport.height);
          const ctx = c.getContext("2d")!;
          for (const a of doc.annos[pg] ?? []) drawAnno(ctx, a, c.width, c.height, fam);
          const pngBlob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), "image/png"));
          const img = await out.embedPng(await pngBlob.arrayBuffer());
          const pgObj = out.getPage(pg - 1);
          pgObj.drawImage(img, { x: 0, y: 0, width: pgObj.getWidth(), height: pgObj.getHeight() });
        }
        (jdoc as unknown as { destroy?: () => void }).destroy?.();
        const outBytes = await out.save();
        const pdfBlob = new Blob([outBytes as unknown as BlobPart], { type: "application/pdf" });
        onSave(`${fileName.replace(/\.pdf$/i, "")} (معدّل).pdf`, pdfBlob);
      } else {
        const base = baseRef.current!;
        const scale = Math.min(2.2, 2600 / base.width);
        const c = document.createElement("canvas");
        c.width = Math.round(base.width * scale);
        c.height = Math.round(base.height * scale);
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(base, 0, 0, c.width, c.height);
        for (const a of doc.annos[page] ?? []) drawAnno(ctx, a, c.width, c.height, fam);
        const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), "image/png"));
        onSave(`${fileName.replace(/\.[^.]+$/, "")} (معدّل).png`, blob);
      }
    } finally {
      setBusy("");
    }
  };

  const hasAny = Object.values(doc.annos).some((v) => v.length > 0);

  return (
    <div className="flex flex-col" data-testid="editor-layer">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-white p-2 shadow-sm">
        {(Object.keys(TOOL_ICONS) as ToolId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            aria-label={TOOL_LABEL[t]}
            title={TOOL_LABEL[t]}
            className={cn(
              "flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold transition",
              tool === t
                ? "bg-primary/10 text-primary outline outline-1 outline-primary/30"
                : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
            )}
          >
            {TOOL_ICONS[t]}
            <span className="hidden md:inline">{TOOL_LABEL[t]}</span>
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-border" aria-hidden />
        {COLORS.map((c) => (
          <button
            key={c.v}
            onClick={() => setColor(c.v)}
            aria-label={`لون ${c.label}`}
            title={`لون ${c.label}`}
            className={cn(
              "size-6 rounded-full border-2 transition",
              c.dot,
              color === c.v ? "border-primary ring-2 ring-primary/25" : "border-white shadow"
            )}
          />
        ))}
        {tool === "text" ? (
          <span className="flex items-center gap-0.5">
            {TEXT_SIZES.map((s) => (
              <button
                key={s.v}
                onClick={() => setTextSize(s.v)}
                className={cn(
                  "rounded-lg px-2 py-1 text-[10px] font-extrabold",
                  textSize === s.v ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </span>
        ) : (
          <span className="flex items-center gap-0.5">
            {SIZES.map((s) => (
              <button
                key={s.v}
                onClick={() => setSize(s.v)}
                className={cn(
                  "rounded-lg px-2 py-1 text-[10px] font-extrabold",
                  size === s.v ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </span>
        )}
        <span className="mx-1 h-6 w-px bg-border" aria-hidden />
        <button
          onClick={undo}
          disabled={doc.past.length === 0}
          aria-label="تراجع"
          title="تراجع"
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary disabled:opacity-30"
        >
          <Undo2 className="size-4" aria-hidden />
        </button>
        <button
          onClick={redo}
          disabled={doc.future.length === 0}
          aria-label="إعادة"
          title="إعادة"
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary disabled:opacity-30"
        >
          <Redo2 className="size-4" aria-hidden />
        </button>
        <button
          onClick={() => curList.length > 0 && commit([])}
          disabled={curList.length === 0}
          aria-label="مسح هذه الصفحة"
          title="مسح هذه الصفحة"
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>

        <span className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onClose} className="font-bold text-muted-foreground">
          <X className="size-4" aria-hidden />
          إغلاق
        </Button>
        <Button
          size="sm"
          disabled={!hasAny || !!busy}
          onClick={save}
          className="bg-emerald-600 font-extrabold text-white hover:bg-emerald-700"
        >
          <Check className="size-4" aria-hidden />
          {busy || "حفظ التعديلات"}
        </Button>
      </div>

      {/* الكانفس */}
      <div
        ref={wrapRef}
        className="relative mt-3 flex min-h-[420px] flex-1 items-start justify-center overflow-auto rounded-2xl border border-border bg-slate-50 p-4"
      >
        {ready && aspect ? (
          <div
            className="relative shadow-xl shadow-black/10"
            style={{ width: "min(100%, 900px)", aspectRatio: `${aspect}` }}
          >
            <canvas
              className="absolute inset-0 h-full w-full rounded-md bg-white"
              key={`${page}-${ready}`}
              ref={(el) => {
                if (el && baseRef.current) {
                  el.width = baseRef.current.width;
                  el.height = baseRef.current.height;
                  el.getContext("2d")!.drawImage(baseRef.current, 0, 0);
                }
              }}
            />
            <canvas
              ref={liveRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
              className={cn(
                "absolute inset-0 h-full w-full touch-none rounded-md",
                tool === "text" ? "cursor-text" : "cursor-crosshair"
              )}
              aria-label="لوحة التعديل"
            />
            {typing && (
              <div
                className="absolute z-10"
                style={{
                  left: `${typing.x * 100}%`,
                  top: `${typing.y * 100}%`,
                  transform: "translateY(-90%)",
                }}
                dir="rtl"
              >
                <input
                  autoFocus
                  value={typing.value}
                  onChange={(e) => setTyping({ ...typing, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitText();
                    if (e.key === "Escape") setTyping(null);
                  }}
                  onBlur={commitText}
                  placeholder="اكتب ثم Enter"
                  className="rounded-lg border-2 border-primary/50 bg-white/95 px-2 py-1 font-bold shadow-lg outline-none"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="size-64 max-w-full animate-pulse rounded-md bg-white shadow-lg" />
        )}
      </div>

      {/* ترقيم الصفحات داخل المحرر */}
      {kind === "pdf" && pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            onClick={() => onPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="الصفحة السابقة"
            className="grid size-8 place-items-center rounded-lg border border-border bg-white text-lg font-extrabold text-muted-foreground disabled:opacity-30"
          >
            ›
          </button>
          <span className="text-sm font-extrabold text-muted-foreground">
            صفحة {toHindiDigits(page)} من {toHindiDigits(pages)}
            {(doc.annos[page] ?? []).length > 0 && " · عليها تعديلات"}
          </span>
          <button
            onClick={() => onPage(Math.min(pages, page + 1))}
            disabled={page >= pages}
            aria-label="الصفحة التالية"
            className="grid size-8 place-items-center rounded-lg border border-border bg-white text-lg font-extrabold text-muted-foreground disabled:opacity-30"
          >
            ‹
          </button>
        </div>
      )}
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        التعديلات تُطبع فوق الصفحة كما تراها تمامًا — الصفحات الأخرى تبقى بلا تغيير
      </p>
    </div>
  );
}
