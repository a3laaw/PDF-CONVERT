"use client";

/* محرّر بأسلوب كانفا — شاشة كاملة فوق الملف
   الفلسفة: ما تراه في المحرر هو ما يُحفظ بالضبط (WYSIWYG)
   الإحداثيات والأحجام طبيعية نسبية للصفحة (0..1 والسماكة بأجزاء من الألف من الارتفاع)
   → تُرسم بأي دقة بدون فقدان وبنفس المظهر، والملف الماسوح ضوئيًا يُعامل كصفحة عادية
   لأننا نرسم فوق بكسلاتها مباشرة */

import { useCallback, useEffect, useRef, useState } from "react";
import { toHindiDigits } from "@/lib/arabic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  X,
  Check,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  MousePointer2,
} from "lucide-react";
import { toast } from "sonner";

/* ─────────── النموذج ─────────── */

type ToolId =
  | "select"
  | "pen"
  | "highlight"
  | "line"
  | "arrow"
  | "rect"
  | "ellipse"
  | "text";

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
  { v: "#F59E0B", label: "برتقالي", dot: "bg-amber-500" },
  { v: "#7C3AED", label: "بنفسجي", dot: "bg-violet-600" },
  { v: "#EC4899", label: "وردي", dot: "bg-pink-500" },
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
const svg = (paths: React.ReactNode, fill = false) => (
  <svg
    viewBox="0 0 24 24"
    fill={fill ? "currentColor" : "none"}
    stroke={fill ? "none" : "currentColor"}
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
  select: svg(<path d="M5 3l14 8-6.5 1.5L9 19z" />),
  pen: svg(
    <path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586M11 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" />
  ),
  highlight: svg(
    <>
      <rect x="3" y="14" width="18" height="4" rx="1" fill="currentColor" opacity="0.45" />
      <path d="M4.5 14L9 5h6l4.5 9" />
    </>
  ),
  line: svg(<path d="M5 19L19 5" />),
  arrow: svg(<path d="M5 19L19 5M19 5h-8M19 5v8" />),
  rect: svg(<rect x="4" y="6" width="16" height="12" rx="1" />),
  ellipse: svg(<ellipse cx="12" cy="12" rx="8" ry="6" />),
  text: svg(<path d="M4 7V5h16v2M12 5v14M9 19h6" />),
};
const TOOL_LABEL: Record<ToolId, string> = {
  select: "تحريك",
  pen: "قلم",
  highlight: "تظليل",
  line: "خط",
  arrow: "سهم",
  rect: "مستطيل",
  ellipse: "دائرة",
  text: "نص",
};
const TOOL_ORDER: ToolId[] = [
  "select",
  "pen",
  "highlight",
  "arrow",
  "line",
  "rect",
  "ellipse",
  "text",
];

/* ─────────── الرسم على سياق كانفس (الأحجام نسبية للارتفاع h) ─────────── */

function drawAnno(
  ctx: CanvasRenderingContext2D,
  a: Anno,
  w: number,
  h: number,
  fontFamily: string
) {
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
    for (let i = 1; i < s.pts.length; i++)
      ctx.lineTo(s.pts[i][0] * w, s.pts[i][1] * h);
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

/* ─────────── صندوق العنصر (للتحديد والتحريك) ─────────── */

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function annoBox(a: Anno, w: number, h: number, fam: string): Box {
  const pad = (a.width * (a.tool === "highlight" ? 4 : 1)) / 2000 + 0.005;
  if (a.tool === "pen" || a.tool === "highlight") {
    const xs = a.pts.map((p) => p[0]);
    const ys = a.pts.map((p) => p[1]);
    return {
      x0: Math.min(...xs) - pad,
      y0: Math.min(...ys) - pad,
      x1: Math.max(...xs) + pad,
      y1: Math.max(...ys) + pad,
    };
  }
  if (a.tool === "text") {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d")!;
    ctx.font = `700 ${a.size}px ${fam}`;
    const twNorm = (ctx.measureText(a.text).width * h) / 1000 / Math.max(1, w);
    const asc = a.size / 1000;
    return {
      x0: a.x - twNorm - pad,
      y0: a.y - asc * 1.05 - pad,
      x1: a.x + pad,
      y1: a.y + asc * 0.35 + pad,
    };
  }
  const s = a as ShapeAnno;
  return {
    x0: Math.min(s.x1, s.x2) - pad,
    y0: Math.min(s.y1, s.y2) - pad,
    x1: Math.max(s.x1, s.x2) + pad,
    y1: Math.max(s.y1, s.y2) + pad,
  };
}

function moveAnno(a: Anno, dx: number, dy: number): Anno {
  if (a.tool === "pen" || a.tool === "highlight")
    return { ...a, pts: a.pts.map(([px, py]) => [px + dx, py + dy]) };
  if (a.tool === "text") return { ...a, x: a.x + dx, y: a.y + dy };
  const s = a as ShapeAnno;
  return { ...s, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy };
}

const boxHit = (b: Box, x: number, y: number) =>
  x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;

/* عائلة الخط الفعلية على الصفحة (next/font يولّد اسمًا مُشفّرًا) */
const getFam = () =>
  typeof document !== "undefined"
    ? getComputedStyle(document.body).fontFamily || "sans-serif"
    : "sans-serif";

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
  const wrapRef = useRef<HTMLDivElement>(null); // منطقة الكانفس القابلة للتمرير
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
  const [typing, setTypingState] = useState<{ id: number; x: number; y: number; value: string } | null>(null);
  const typingRef = useRef<{ id: number; x: number; y: number; value: string } | null>(null);
  const typingSeq = useRef(0);
  const setTyping = (t: { id: number; x: number; y: number; value: string } | null) => {
    typingRef.current = t;
    setTypingState(t);
  };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [areaW, setAreaW] = useState(760);
  const drawing = useRef<Anno | null>(null);
  const drag = useRef<{ id: string; orig: Anno; sx: number; sy: number } | null>(null);
  const curList = doc.annos[page] ?? [];

  /* عرض المنطقة المتاحة → عرض الصفحة الأساسي */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAreaW(Math.max(260, el.clientWidth - 48)));
    ro.observe(el);
    setAreaW(Math.max(260, el.clientWidth - 48));
    return () => ro.disconnect();
  }, [ready]);

  /* ── تحميل الصفحة الأساسية بدقة عالية ── */
  useEffect(() => {
    let alive = true;
    setReady(false);
    setSelectedId(null);
    (async () => {
      const maxCssW = 900;
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

  /* انتظار جاهزية الخط ثم إعادة رسم (لضمان قياس نص عربي صحيح) */
  useEffect(() => {
    if (typeof document !== "undefined" && "fonts" in document)
      document.fonts.ready.then(() => setZoom((z) => z)).catch(() => undefined);
  }, []);

  /* ── إعادة رسم الطبقة التفاعلية ── */
  const repaint = useCallback(() => {
    const live = liveRef.current;
    const base = baseRef.current;
    if (!live || !base) return;
    live.width = base.width;
    live.height = base.height;
    const ctx = live.getContext("2d")!;
    ctx.clearRect(0, 0, live.width, live.height);
    const fam = getFam();
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
  const undo = () => {
    setSelectedId(null);
    setDoc((d) =>
      d.past.length
        ? {
            annos: d.past[d.past.length - 1],
            past: d.past.slice(0, -1),
            future: [d.annos, ...d.future].slice(0, 40),
          }
        : d
    );
  };
  const redo = () => {
    setSelectedId(null);
    setDoc((d) =>
      d.future.length
        ? { annos: d.future[0], past: [...d.past, d.annos], future: d.future.slice(1) }
        : d
    );
  };

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
    const [x, y] = norm(e);
    if (tool === "select") {
      const live = liveRef.current;
      if (!live) return;
      let hit: Anno | null = null;
      const list = doc.annos[page] ?? [];
      const fam = getFam();
      for (let i = list.length - 1; i >= 0; i--) {
        const b = annoBox(list[i], live.width, live.height, fam);
        if (boxHit(b, x, y)) {
          hit = list[i];
          break;
        }
      }
      setSelectedId(hit ? hit.id : null);
      if (hit) {
        drag.current = { id: hit.id, orig: hit, sx: x, sy: y };
        /* نقفل التاريخ قبل أول تحرك — الحركة كلها خطوة تراجع واحدة */
        setDoc((d) => ({ ...d, past: [...d.past.slice(-40), d.annos], future: [] }));
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return;
    }
    if (tool === "text") {
      setSelectedId(null);
      /* نثبّت أي حقل مفتوح أولًا حتى لا يضيع نصه */
      if (typingRef.current) commitText(typingRef.current.id);
      const tid = ++typingSeq.current;
      setTyping({ id: tid, x, y, value: "" });
      /* منع الافتراضي: mousedown كان سيسرق التركيز فيمحو الحقل فور ظهوره */
      e.preventDefault();
      return;
    }
    setSelectedId(null);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (tool === "pen" || tool === "highlight") {
      drawing.current = { id: uid(), tool, color, width: size, pts: [[x, y]] };
    } else {
      drawing.current = { id: uid(), tool, color, width: size, x1: x, y1: y, x2: x, y2: y };
    }
    repaint();
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [x, y] = norm(e);
    /* سحب عنصر محدد */
    const dg = drag.current;
    if (dg) {
      const dx = x - dg.sx;
      const dy = y - dg.sy;
      const moved = moveAnno(dg.orig, dx, dy);
      setDoc((d) => ({
        ...d,
        annos: {
          ...d.annos,
          [page]: (d.annos[page] ?? []).map((a) => (a.id === dg.id ? moved : a)),
        },
      }));
      return;
    }
    const d = drawing.current;
    if (!d) return;
    if (d.tool === "pen" || d.tool === "highlight") (d as StrokeAnno).pts.push([x, y]);
    else {
      (d as ShapeAnno).x2 = x;
      (d as ShapeAnno).y2 = y;
    }
    repaint();
  };

  const onUp = () => {
    /* إنهاء السحب — التاريخ قُفل عند بدء السحب */
    if (drag.current) {
      drag.current = null;
      return;
    }
    const d = drawing.current;
    drawing.current = null;
    if (!d) return;
    const t = d as StrokeAnno | ShapeAnno;
    const tiny =
      "pts" in t
        ? t.pts.length < 2
        : Math.abs(t.x2 - t.x1) < 0.004 && Math.abs(t.y2 - t.y1) < 0.004;
    if (!tiny) commit([...curList, d]);
    repaint();
  };

  const commitText = (id: number) => {
    const t = typingRef.current;
    if (!t || t.id !== id) return; /* حقل قديم — سبقه نقرة جديدة */
    typingRef.current = null;
    if (t.value.trim()) {
      commit([
        ...curList,
        {
          id: uid(),
          tool: "text",
          color,
          width: size,
          x: t.x,
          y: t.y,
          size: textSize,
          text: t.value.trim(),
        },
      ]);
    }
    setTypingState(null);
  };

  /* ── اختصارات لوحة المفاتيح ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        commit(curList.filter((a) => a.id !== selectedId));
        setSelectedId(null);
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, curList, page]);

  /* ── الحفظ ── */
  const save = async () => {
    if (busy) return;
    const touched = Object.keys(doc.annos)
      .map(Number)
      .filter((k) => (doc.annos[k] ?? []).length > 0);
    if (touched.length === 0) return;
    setBusy("جارٍ الحفظ…");
    try {
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
        const fam = getFam();
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
        for (const a of doc.annos[page] ?? []) drawAnno(ctx, a, c.width, c.height, getFam());
        const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), "image/png"));
        onSave(`${fileName.replace(/\.[^.]+$/, "")} (معدّل).png`, blob);
      }
    } catch {
      toast.error("تعذّر الحفظ — جرّب مرة أخرى");
    } finally {
      setBusy("");
    }
  };

  const maybeClose = () => {
    const hasAny = Object.values(doc.annos).some((v) => v.length > 0);
    if (hasAny && !window.confirm("هناك تعديلات غير محفوظة — إغلاق بدون حفظ؟")) return;
    onClose();
  };

  const hasAny = Object.values(doc.annos).some((v) => v.length > 0);
  const selItem = curList.find((a) => a.id === selectedId) ?? null;
  const pageNav = (
    <span className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-2 py-1">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        aria-label="الصفحة السابقة"
        className="grid size-6 place-items-center rounded-md text-base font-extrabold text-muted-foreground hover:bg-primary/5 hover:text-primary disabled:opacity-30"
      >
        ›
      </button>
      <span className="min-w-[72px] text-center text-[11px] font-extrabold text-muted-foreground">
        صفحة {toHindiDigits(page)} من {toHindiDigits(pages)}
      </span>
      <button
        onClick={() => onPage(Math.min(pages, page + 1))}
        disabled={page >= pages}
        aria-label="الصفحة التالية"
        className="grid size-6 place-items-center rounded-md text-base font-extrabold text-muted-foreground hover:bg-primary/5 hover:text-primary disabled:opacity-30"
      >
        ‹
      </button>
    </span>
  );

  const pageW = Math.round(areaW * zoom);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-200/95 backdrop-blur-sm"
      dir="rtl"
      data-testid="editor-layer"
      aria-label="محرر الملف"
    >
      {/* ══ الشريط العلوي ══ */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-white px-3 shadow-sm">
        <button
          onClick={maybeClose}
          aria-label="إغلاق المحرر"
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-600"
        >
          <X className="size-5" aria-hidden />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold leading-tight">تعديل: {fileName}</p>
          <p className="text-[10px] leading-tight text-muted-foreground">
            {kind === "pdf" ? "PDF — حتى الماسوح ضوئيًا" : "صورة"} · الشغل داخل متصفحك
          </p>
        </div>
        <span className="flex-1" />
        {kind === "pdf" && pages > 1 && pageNav}
        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
        <div className="flex items-center gap-0.5 rounded-xl border border-border bg-white px-1 py-0.5">
          <button
            onClick={undo}
            disabled={doc.past.length === 0}
            aria-label="تراجع"
            title="تراجع (Ctrl+Z)"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary disabled:opacity-30"
          >
            <Undo2 className="size-4" aria-hidden />
          </button>
          <button
            onClick={redo}
            disabled={doc.future.length === 0}
            aria-label="إعادة"
            title="إعادة (Ctrl+Y)"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary disabled:opacity-30"
          >
            <Redo2 className="size-4" aria-hidden />
          </button>
        </div>
        <div className="hidden items-center gap-0.5 rounded-xl border border-border bg-white px-1 py-0.5 md:flex">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z / 1.25))}
            aria-label="تصغير"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary"
          >
            <ZoomOut className="size-4" aria-hidden />
          </button>
          <span className="min-w-[44px] text-center text-[11px] font-extrabold text-muted-foreground">
            {toHindiDigits(Math.round(zoom * 100))}٪
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z * 1.25))}
            aria-label="تكبير"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary"
          >
            <ZoomIn className="size-4" aria-hidden />
          </button>
          <button
            onClick={() => setZoom(1)}
            aria-label="ملء العرض"
            title="ملء العرض"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary"
          >
            <Maximize className="size-4" aria-hidden />
          </button>
        </div>
        <Button
          size="sm"
          disabled={!hasAny || !!busy}
          onClick={save}
          className="bg-emerald-600 px-4 font-extrabold text-white hover:bg-emerald-700"
        >
          <Check className="size-4" aria-hidden />
          {busy || "حفظ التعديلات"}
        </Button>
      </div>

      {/* ══ الجسم: شريط أدوات + كانفس ══ */}
      <div className="flex min-h-0 flex-1 max-md:flex-col">
        {/* شريط الأدوات الجانبي (يمين) */}
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-l border-border bg-white p-2 max-md:border-b max-md:border-l-0 md:w-[84px] md:flex-col md:overflow-y-auto">
          {TOOL_ORDER.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTool(t);
                if (t !== "select") setSelectedId(null);
              }}
              aria-label={TOOL_LABEL[t]}
              title={TOOL_LABEL[t]}
              className={cn(
                "flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2.5 py-2 text-[9px] font-extrabold transition",
                tool === t
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
              )}
            >
              {TOOL_ICONS[t]}
              {TOOL_LABEL[t]}
            </button>
          ))}
          <span className="mx-1 hidden w-px bg-border md:block" aria-hidden />
          {/* الألوان */}
          <div className="flex items-center gap-1.5 max-md:pl-2 md:grid md:grid-cols-2 md:px-1">
            {COLORS.map((c) => (
              <button
                key={c.v}
                onClick={() => setColor(c.v)}
                aria-label={`لون ${c.label}`}
                title={`لون ${c.label}`}
                className={cn(
                  "size-6 shrink-0 rounded-full border-2 transition",
                  c.dot,
                  color === c.v ? "border-primary ring-2 ring-primary/25" : "border-white shadow"
                )}
              />
            ))}
            <label
              title="لون مخصص"
              className="relative grid size-6 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-rose-400 via-amber-300 to-sky-400 shadow"
            >
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="لون مخصص"
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
          <span className="mx-1 hidden w-px bg-border md:block" aria-hidden />
          {/* السماكة / حجم النص */}
          <div className="flex items-center gap-1 max-md:pl-2 md:flex-col md:px-1">
            {tool === "text"
              ? TEXT_SIZES.map((s) => (
                  <button
                    key={s.v}
                    onClick={() => setTextSize(s.v)}
                    className={cn(
                      "shrink-0 rounded-lg px-2 py-1 text-[10px] font-extrabold",
                      textSize === s.v ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))
              : SIZES.map((s) => (
                  <button
                    key={s.v}
                    onClick={() => setSize(s.v)}
                    className={cn(
                      "shrink-0 rounded-lg px-2 py-1 text-[10px] font-extrabold",
                      size === s.v ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
          </div>
          <span className="flex-1" aria-hidden />
          <button
            onClick={() => curList.length > 0 && commit([])}
            disabled={curList.length === 0}
            aria-label="مسح هذه الصفحة"
            title="مسح هذه الصفحة"
            className="flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-[9px] font-extrabold text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-30 md:flex-col"
          >
            <Trash2 className="size-5" aria-hidden />
            مسح الصفحة
          </button>
        </div>

        {/* منطقة الكانفس */}
        <div ref={wrapRef} className="min-h-0 min-w-0 flex-1 overflow-auto p-4 md:p-8">
          {ready && aspect ? (
            <div
              className="relative mx-auto shadow-2xl shadow-black/20"
              style={{ width: `${pageW}px`, aspectRatio: `${aspect}` }}
            >
              <canvas
                className="absolute inset-0 h-full w-full rounded-sm bg-white"
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
                  "absolute inset-0 h-full w-full touch-none rounded-sm",
                  tool === "select"
                    ? "cursor-default"
                    : tool === "text"
                      ? "cursor-text"
                      : "cursor-crosshair"
                )}
                aria-label="لوحة التعديل"
              />
              {/* صندوق تحديد العنصر */}
              {selItem &&
                (() => {
                  const live = liveRef.current;
                  if (!live) return null;
                  const b = annoBox(selItem, live.width, live.height, getFam());
                  return (
                    <div
                      className="pointer-events-none absolute z-10"
                      style={{
                        left: `${b.x0 * 100}%`,
                        top: `${b.y0 * 100}%`,
                        width: `${(b.x1 - b.x0) * 100}%`,
                        height: `${(b.y1 - b.y0) * 100}%`,
                      }}
                    >
                      <div className="absolute inset-0 rounded-sm border-2 border-dashed border-primary/70" />
                      <button
                        onClick={() => {
                          commit(curList.filter((a) => a.id !== selItem.id));
                          setSelectedId(null);
                        }}
                        aria-label="حذف المحدد"
                        title="حذف (Delete)"
                        className="pointer-events-auto absolute -top-10 right-0 grid size-8 place-items-center rounded-lg bg-red-500 text-white shadow-lg hover:bg-red-600"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  );
                })()}
              {/* إدخال النص */}
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
                      if (e.key === "Enter") commitText(typing.id);
                      if (e.key === "Escape") setTyping(null);
                    }}
                    onBlur={() => commitText(typing.id)}
                    placeholder="اكتب ثم Enter"
                    style={{ color, fontSize: `${Math.max(14, textSize * zoom * 0.35)}px` }}
                    className="rounded-lg border-2 border-primary/50 bg-white/95 px-2 py-1 font-bold shadow-lg outline-none"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto size-64 max-w-full animate-pulse rounded-md bg-white shadow-lg" />
          )}
        </div>
      </div>

      {/* ══ شريط التلميح السفلي ══ */}
      <div className="flex h-8 shrink-0 items-center justify-center gap-3 border-t border-border bg-white px-3 text-[10px] text-muted-foreground">
        <span>التعديلات تُطبع فوق الصفحة كما تراها تمامًا — الصفحات الأخرى تبقى كما هي</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">تراجع Ctrl+Z · إعادة Ctrl+Y · حذف المحدد Delete</span>
      </div>
    </div>
  );
}
