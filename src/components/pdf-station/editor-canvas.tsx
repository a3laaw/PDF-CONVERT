"use client";

/* محرّر بأسلوب كانفا — شاشة كاملة فوق الملف
   الفلسفة: ما تراه في المحرر هو ما يُحفظ بالضبط (WYSIWYG)
   الإحداثيات والأحجام طبيعية نسبية للصفحة (0..1 والسماكة بأجزاء من الألف من الارتفاع)
   → تُرسم بأي دقة بدون فقدان وبنفس المظهر، والملف الماسوح ضوئيًا يُعامل كصفحة عادية
   لأننا نرسم فوق بكسلاتها مباشرة */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  drawRealEdits,
  pageTextItems,
  type PageInfo,
  type RealMaskNorm,
  type RealTextNorm,
} from "@/lib/pdf-engine";
import { toHindiDigits } from "@/lib/arabic";
import { useI18n } from "@/lib/i18n";
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
  | "mask"
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
interface MaskAnno extends BaseAnno {
  tool: "mask";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
interface TextAnno extends BaseAnno {
  tool: "text";
  x: number;
  y: number;
  /** حجم الخط بوحدة ‰ من ارتفاع الصفحة */
  size: number;
  text: string;
  /** نص PDF حقيقي: يُكتب بخط مضمّن بحجمه الأصلي بالنقاط — لا صورة */
  real?: { sizePt: number; bold?: boolean };
}
type Anno = StrokeAnno | ShapeAnno | MaskAnno | TextAnno;

interface TypingBox {
  id: number;
  x: number;
  y: number;
  value: string;
  /** الحجم بالنقاط — للنص الحقيقي في PDF */
  sizePt?: number;
  /** هل الحجم مأخوذ من النص المجاور؟ */
  snap?: boolean;
  /** خط عريض مأخوذ من النص المجاور */
  bold?: boolean;
  /** وضع تعديل نص موجود: النقر على سطر يفتحه هنا، والتأكيد يخفيه ويكتب بديله */
  edit?: {
    orig: string;
    /** حدود السطر الأصلي بإحداثيات PDF — لقناع الإخفاء */
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

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
/* ‰ من ارتفاع الصفحة: على A4 (ارتفاع 842pt) متوسط ≈ 3pt */
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
/* ألوان الحجب: أبيض لخلفية نظيفة، أسود لحجب صارم، أصفر للتظليل اللافت */
const MASK_COLORS = [
  { v: "#FFFFFF", label: "أبيض" },
  { v: "#111827", label: "أسود" },
  { v: "#FDE047", label: "أصفر" },
];

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
  mask: svg(
    <>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M4 12h16M4 15.5h16" opacity={0.55} />
    </>
  ),
  text: svg(<path d="M4 7V5h16v2M12 5v14M9 19h6" />),
};
/* مفاتيح أسماء الأدوات — الترجمة من القاموس عبر ed.tool.* */
const TOOL_KEY: Record<ToolId, string> = {
  select: "select",
  pen: "pen",
  highlight: "highlight",
  line: "line",
  arrow: "arrow",
  rect: "rect",
  ellipse: "ellipse",
  mask: "mask",
  text: "text",
};
const TOOL_ORDER: ToolId[] = [
  "select",
  "pen",
  "highlight",
  "arrow",
  "line",
  "rect",
  "ellipse",
  "mask",
  "text",
];

/* ─────────── الرسم على سياق كانفس (الأحجام نسبية للارتفاع h) ─────────── */

function drawAnno(
  ctx: CanvasRenderingContext2D,
  a: Anno,
  w: number,
  h: number,
  fontFamily: string,
  mode: "preview" | "raster" = "preview"
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
  } else if (a.tool === "mask") {
    /* الحجب يُرسم أصلًا كمستطيل pdf-lib عند الحفظ — التراكب النقطي يتجاهله */
    if (mode === "raster") {
      ctx.restore();
      return;
    }
    const s = a as MaskAnno;
    const x = Math.min(s.x0, s.x1) * w;
    const y = Math.min(s.y0, s.y1) * h;
    const bw = Math.abs(s.x1 - s.x0) * w;
    const bh = Math.abs(s.y1 - s.y0) * h;
    ctx.fillStyle = a.color;
    ctx.fillRect(x, y, bw, bh);
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(37,99,235,0.85)";
    ctx.lineWidth = Math.max(1, h / 400);
    ctx.strokeRect(x, y, bw, bh);
    ctx.setLineDash([]);
  } else {
    const s = a as TextAnno;
    if (s.real && mode === "raster") {
      /* النص الحقيقي يُكتب أصلًا بخط مضمّن — التراكب النقطي يتجاهله */
      ctx.restore();
      return;
    }
    ctx.fillStyle = a.color;
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.font = s.real
      ? `${s.real.bold ? 700 : 400} ${s.size * pm}px ${fontFamily}` /* نفس وزن الخط المضمّن */
      : `700 ${s.size * pm}px ${fontFamily}`;
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
  if (a.tool === "mask") {
    const s = a as MaskAnno;
    return {
      x0: Math.min(s.x0, s.x1) - pad,
      y0: Math.min(s.y0, s.y1) - pad,
      x1: Math.max(s.x0, s.x1) + pad,
      y1: Math.max(s.y0, s.y1) + pad,
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
  if (a.tool === "mask") {
    const m = a as MaskAnno;
    return { ...m, x0: m.x0 + dx, y0: m.y0 + dy, x1: m.x1 + dx, y1: m.y1 + dy };
  }
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
  const { t } = useI18n();
  const wrapRef = useRef<HTMLDivElement>(null); // منطقة الكانفس القابلة للتمرير
  const baseRef = useRef<HTMLCanvasElement | null>(null); // طبقة الصفحة (عرض فقط)
  const liveRef = useRef<HTMLCanvasElement>(null); // طبقة الرسم التفاعلية
  const [ready, setReady] = useState(false);
  const [aspect, setAspect] = useState<number | null>(null);
  const [tool, setTool] = useState<ToolId>("pen");
  const [color, setColor] = useState(COLORS[0].v);
  const [size, setSize] = useState(3.5);
  const [textSize, setTextSize] = useState(36);
  /* الحجب: لون القناع + حجم النص الحقيقي بالنقاط (يُقرأ من النص المجاور عند النقر) */
  const [maskColor, setMaskColor] = useState(MASK_COLORS[0].v);
  const [sizePt, setSizePt] = useState(14);
  /* وزن الخط للنص الجديد: يُلتقط من النص المجاور عند النقر، ويُبدّل يدويًا من حقل الكتابة */
  const [boldSnap, setBoldSnap] = useState(false);
  /* أبعاد الصفحة الحالية بوحدات PDF — لتحويل ‰ ↔ نقاط */
  const pageDims = useRef<{ w: number; h: number }>({ w: 595, h: 842 });
  /* عناصر نص الصفحة الحالية — أساس مطابقة الحجم والحجب بالنقر (undefined = تحميل، فارغة = بلا نص) */
  const [pageInfo, setPageInfo] = useState<PageInfo | null | undefined>(undefined);
  const itemsCache = useRef<Map<number, PageInfo>>(new Map());
  const [doc, setDoc] = useState<EditorDoc>({ annos: {}, past: [], future: [] });
  const [busy, setBusy] = useState<string>("");
  const [typing, setTypingState] = useState<TypingBox | null>(null);
  const typingRef = useRef<TypingBox | null>(null);
  const typingSeq = useRef(0);
  const setTyping = (t: TypingBox | null) => {
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
        pageDims.current = { w: img.naturalWidth || 1, h: img.naturalHeight || 1 };
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
        pageDims.current = { w: v1.width, h: v1.height };
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

  /* عناصر نص الصفحة — تُحمّل عند اختيار أدوات النص/الحجب (أساس مطابقة الحجم والحجب بالنقر) */
  useEffect(() => {
    if (kind !== "pdf" || (tool !== "text" && tool !== "mask") || !file) return;
    const cached = itemsCache.current.get(page);
    if (cached) {
      setPageInfo(cached);
      return;
    }
    let alive = true;
    setPageInfo(undefined);
    (window as unknown as { __edbg?: unknown }).__edbg = null;
    pageTextItems(file, page)
      .then((info) => {
        itemsCache.current.set(page, info);
        (window as unknown as { __edbg?: unknown }).__edbg = info;
        if (alive) setPageInfo(info);
      })
      .catch((err) => {
        (window as unknown as { __edbg?: { err?: string } }).__edbg = { err: String(err) };
        if (alive)
          setPageInfo({ items: [], w: pageDims.current.w, h: pageDims.current.h });
      });
    return () => {
      alive = false;
    };
  }, [kind, tool, page, file]);

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

  /* نقرة → إحداثيات PDF الحقيقية */
  const pdfAt = (nx: number, ny: number): [number, number] => [
    nx * pageDims.current.w,
    (1 - ny) * pageDims.current.h,
  ];

  /* العنصر النصي تحت النقرة (بهامش) — الأقرب لوسط السطر */
  const hitTextItem = (nx: number, ny: number, padPt = 6) => {
    if (!pageInfo) return null;
    const [px, py] = pdfAt(nx, ny);
    let best: PageInfo["items"][number] | null = null;
    let bestD = Infinity;
    for (const it of pageInfo.items) {
      if (!it.str.trim()) continue;
      const x0 = it.x - padPt;
      const x1 = it.x + it.w + padPt;
      const y0 = it.y - it.sizePt * 0.35;
      const y1 = it.y + it.sizePt * 1.15;
      if (px < x0 || px > x1 || py < y0 || py > y1) continue;
      const d = Math.abs(py - (it.y + it.sizePt * 0.4));
      if (d < bestD) {
        bestD = d;
        best = it;
      }
    }
    return best;
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
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* مؤشر غير فعّال (اصطناعي/منفصل) — الرسم يعمل بدونه */
        }
      }
      return;
    }
    if (tool === "text") {
      setSelectedId(null);
      /* نثبّت أي حقل مفتوح أولًا حتى لا يضيع نصه */
      if (typingRef.current) commitText(typingRef.current.id);
      const tid = ++typingSeq.current;
      /* مطابقة الحجم والوزن: نقرأها من النص المجاور من بيانات الصفحة الحقيقية */
      const near = kind === "pdf" ? hitTextItem(x, y, 10) : null;
      if (near) {
        const pt = Math.round(near.sizePt * 10) / 10;
        setSizePt(pt);
        if (near.bold) setBoldSnap(true);
        else setBoldSnap(false);
        /* نقر على سطر موجود → وضع تعديل: النص يُعبّأ مسبقًا، والتأكيد يخفي الأصل ويكتب البديل بنفس الموضع */
        const W = pageDims.current.w;
        const H = pageDims.current.h;
        const padPt = near.sizePt * 0.22;
        setTyping({
          id: tid,
          x,
          y: Math.min(1, Math.max(0, 1 - near.y / pageDims.current.h)),
          value: near.str,
          sizePt: pt,
          snap: true,
          bold: near.bold,
          edit: {
            orig: near.str,
            x0: Math.max(0, (near.x - padPt) / W),
            y0: Math.max(0, 1 - (near.y + near.sizePt * 1.2 + padPt) / H),
            x1: Math.min(1, (near.x + near.w + padPt) / W),
            y1: Math.min(1, 1 - (near.y - padPt * 0.6) / H),
          },
        });
      } else {
        setTyping({ id: tid, x, y, value: "", sizePt, bold: boldSnap });
      }
      /* منع الافتراضي: mousedown كان سيسرق التركيز فيمحو الحقل فور ظهوره */
      e.preventDefault();
      return;
    }
    if (tool === "mask") {
      setSelectedId(null);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* مؤشر غير فعّال — الرسم يعمل بدونه */
      }
      drawing.current = { id: uid(), tool: "mask", color: maskColor, width: 0, x0: x, y0: y, x1: x, y1: y };
      repaint();
      return;
    }
    setSelectedId(null);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* مؤشر غير فعّال — الرسم يعمل بدونه */
    }
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
    if (d.tool === "mask") {
      const m = d as MaskAnno;
      const tiny = Math.abs(m.x1 - m.x0) < 0.006 && Math.abs(m.y1 - m.y0) < 0.006;
      if (tiny) {
        /* نقرة على نص → حجب تلقائي بحدود السطر نفسه */
        const it = hitTextItem(m.x1, m.y1, 4);
        if (it) {
          const padPt = it.sizePt * 0.22;
          const W = pageDims.current.w;
          const H = pageDims.current.h;
          const txt = it.str.trim();
          commit([
            ...curList,
            {
              id: m.id,
              tool: "mask",
              color: maskColor,
              width: 0,
              x0: Math.max(0, (it.x - padPt) / W),
              y0: Math.max(0, 1 - (it.y + it.sizePt * 1.2 + padPt) / H),
              x1: Math.min(1, (it.x + it.w + padPt) / W),
              y1: Math.min(1, 1 - (it.y - padPt * 0.6) / H),
            },
          ]);
          toast.success(`${t("ed.tool.mask")}: «${txt.slice(0, 24)}${txt.length > 24 ? "…" : ""}»`);
        } else {
          toast.info(t("ed.hint"));
        }
        repaint();
        return;
      }
      commit([...curList, m]);
      repaint();
      return;
    }
    const st = d as StrokeAnno | ShapeAnno;
    const tiny =
      "pts" in st
        ? st.pts.length < 2
        : Math.abs(st.x2 - st.x1) < 0.004 && Math.abs(st.y2 - st.y1) < 0.004;
    if (!tiny) commit([...curList, d]);
    repaint();
  };

  const commitText = (id: number) => {
    const tb = typingRef.current;
    if (!tb || tb.id !== id) return; /* حقل قديم — سبقه نقرة جديدة */
    typingRef.current = null;
    const isPdf = kind === "pdf";
    const pt = tb.sizePt ?? sizePt;
    /* وضع تعديل نص موجود: تأكيد بنفس النص = إلغاء، وتأكيد بنص مغاير = إخفاء الأصل + كتابة البديل مكانه */
    if (tb.edit) {
      const next = tb.value.trim();
      setTypingState(null);
      if (!next || next === tb.edit.orig) return;
      const base = curList;
      const maskAnno: MaskAnno = {
        id: uid(),
        tool: "mask",
        color: maskColor,
        width: 0,
        x0: tb.edit.x0,
        y0: tb.edit.y0,
        x1: tb.edit.x1,
        y1: tb.edit.y1,
      };
      const textAnno: TextAnno = {
        id: uid(),
        tool: "text",
        color,
        width: size,
        x: tb.x,
        y: tb.y,
        size: isPdf ? (pt / pageDims.current.h) * 1000 : textSize,
        text: next,
        real: isPdf ? { sizePt: pt, bold: tb.bold ?? boldSnap } : undefined,
      };
      commit([...base, maskAnno, textAnno]);
      toast.success(t("ed.editedToast"));
      return;
    }
    if (tb.value.trim()) {
      /* للـPDF: نص حقيقي بحجم النقاط الأصلي — ‰ للمعاينة تُشتق من أبعاد الصفحة
         للصورة: كما كان — حجم نسبي يُطبع في الـPNG */
      commit([
        ...curList,
        {
          id: uid(),
          tool: "text",
          color,
          width: size,
          x: tb.x,
          y: tb.y,
          size: isPdf ? (pt / pageDims.current.h) * 1000 : textSize,
          text: tb.value.trim(),
          real: isPdf ? { sizePt: pt, bold: tb.bold ?? boldSnap } : undefined,
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
    setBusy(t("ed.saving"));
    try {
      if (kind === "pdf") {
        let bytes = new Uint8Array(await file.arrayBuffer()) as Uint8Array;
        /* التمريرة الحقيقية أولًا: أقنعة الحجب + نصوص بخط مضمّن (عربي مُشكّل قابل للتحديد) */
        const masks: RealMaskNorm[] = [];
        const texts: RealTextNorm[] = [];
        const rasterPages: number[] = [];
        for (const pg of touched) {
          let hasRaster = false;
          for (const a of doc.annos[pg] ?? []) {
            if (a.tool === "mask") {
              const m = a as MaskAnno;
              masks.push({
                page: pg,
                x0: Math.min(m.x0, m.x1),
                y0: Math.min(m.y0, m.y1),
                x1: Math.max(m.x0, m.x1),
                y1: Math.max(m.y0, m.y1),
                color: m.color,
              });
            } else if (a.tool === "text" && (a as TextAnno).real) {
              const s = a as TextAnno;
              texts.push({
                page: pg,
                x: s.x,
                y: s.y,
                sizePt: s.real!.sizePt,
                text: s.text,
                color: s.color,
                bold: s.real!.bold,
              });
            } else hasRaster = true;
          }
          if (hasRaster) rasterPages.push(pg);
        }
        if (masks.length || texts.length)
          bytes = await drawRealEdits(bytes, masks, texts);
        /* التراكب النقطي لما لا يُرسم أصلًا (قلم/أشكال/تظليل) — كما كان تمامًا */
        if (rasterPages.length) {
          const { PDFDocument } = await import("pdf-lib");
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          const jdoc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
          const out = await PDFDocument.load(bytes.slice(), {
            ignoreEncryption: true,
            updateMetadata: false,
          });
          const fam = getFam();
          for (const pg of rasterPages) {
            const p = await jdoc.getPage(pg);
            const v1 = p.getViewport({ scale: 1 });
            const targetW = Math.min(2400, Math.max(1400, Math.round(v1.width * 2.2)));
            const viewport = p.getViewport({ scale: targetW / v1.width });
            const c = document.createElement("canvas");
            c.width = Math.floor(viewport.width);
            c.height = Math.floor(viewport.height);
            const ctx = c.getContext("2d")!;
            for (const a of doc.annos[pg] ?? [])
              drawAnno(ctx, a, c.width, c.height, fam, "raster");
            const pngBlob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), "image/png"));
            const img = await out.embedPng(await pngBlob.arrayBuffer());
            const pgObj = out.getPage(pg - 1);
            pgObj.drawImage(img, { x: 0, y: 0, width: pgObj.getWidth(), height: pgObj.getHeight() });
          }
          (jdoc as unknown as { destroy?: () => void }).destroy?.();
          bytes = await out.save();
        }
        const pdfBlob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
        onSave(`${fileName.replace(/\.pdf$/i, "")} (${t("ed.modifiedSuffix")}).pdf`, pdfBlob);
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
        onSave(`${fileName.replace(/\.[^.]+$/, "")} (${t("ed.modifiedSuffix")}).png`, blob);
      }
    } catch {
      toast.error(t("ed.saveFail"));
    } finally {
      setBusy("");
    }
  };

  const maybeClose = () => {
    const hasAny = Object.values(doc.annos).some((v) => v.length > 0);
    if (hasAny && !window.confirm(t("ed.unsavedConfirm"))) return;
    onClose();
  };

  const hasAny = Object.values(doc.annos).some((v) => v.length > 0);
  const selItem = curList.find((a) => a.id === selectedId) ?? null;
  const pageNav = (
    <span className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-2 py-1">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        aria-label={t("qp.prevPage")}
        className="grid size-6 place-items-center rounded-md text-base font-extrabold text-muted-foreground hover:bg-primary/5 hover:text-primary disabled:opacity-30"
      >
        ›
      </button>
      <span className="min-w-[72px] text-center text-[11px] font-extrabold text-muted-foreground">
        {t("ed.pageOf", { n: toHindiDigits(page), total: toHindiDigits(pages) })}
      </span>
      <button
        onClick={() => onPage(Math.min(pages, page + 1))}
        disabled={page >= pages}
        aria-label={t("qp.nextPage")}
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
          aria-label={t("ed.close")}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-600"
        >
          <X className="size-5" aria-hidden />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold leading-tight">{t("ed.title")}: {fileName}</p>
          <p className="text-[10px] leading-tight text-muted-foreground">
            {kind === "pdf" ? t("ed.pdfNote") : t("ed.imageNote")} · {t("ed.inBrowser")}
          </p>
        </div>
        <span className="flex-1" />
        {kind === "pdf" && pages > 1 && pageNav}
        <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
        <div className="flex items-center gap-0.5 rounded-xl border border-border bg-white px-1 py-0.5">
          <button
            onClick={undo}
            disabled={doc.past.length === 0}
            aria-label={t("ed.undo")}
            title={t("ed.hintShortcuts")}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary disabled:opacity-30"
          >
            <Undo2 className="size-4" aria-hidden />
          </button>
          <button
            onClick={redo}
            disabled={doc.future.length === 0}
            aria-label={t("ed.redo")}
            title={t("ed.hintShortcuts")}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary disabled:opacity-30"
          >
            <Redo2 className="size-4" aria-hidden />
          </button>
        </div>
        <div className="hidden items-center gap-0.5 rounded-xl border border-border bg-white px-1 py-0.5 md:flex">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z / 1.25))}
            aria-label={t("ed.zoomOut")}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary"
          >
            <ZoomOut className="size-4" aria-hidden />
          </button>
          <span className="min-w-[44px] text-center text-[11px] font-extrabold text-muted-foreground">
            {toHindiDigits(Math.round(zoom * 100))}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z * 1.25))}
            aria-label={t("ed.zoomIn")}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary"
          >
            <ZoomIn className="size-4" aria-hidden />
          </button>
          <button
            onClick={() => setZoom(1)}
            aria-label={t("ed.fit")}
            title={t("ed.fit")}
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
          {busy || t("ed.save")}
        </Button>
      </div>

      {/* ══ الجسم: شريط أدوات + كانفس ══ */}
      <div className="flex min-h-0 flex-1 max-md:flex-col">
        {/* شريط الأدوات الجانبي (يمين) */}
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-l border-border bg-white p-2 max-md:border-b max-md:border-l-0 md:w-[84px] md:flex-col md:overflow-y-auto">
          {TOOL_ORDER.map((tl) => (
            <button
              key={tl}
              onClick={() => {
                setTool(tl);
                if (tl !== "select") setSelectedId(null);
              }}
              aria-label={t(`ed.tool.${TOOL_KEY[tl]}`)}
              title={t(`ed.tool.${TOOL_KEY[tl]}`)}
              className={cn(
                "flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2.5 py-2 text-[9px] font-extrabold transition",
                tool === tl
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
              )}
            >
              {TOOL_ICONS[tl]}
              {t(`ed.tool.${TOOL_KEY[tl]}`)}
            </button>
          ))}
          <span className="mx-1 hidden w-px bg-border md:block" aria-hidden />
          {/* الألوان */}
          <div className="flex items-center gap-1.5 max-md:pl-2 md:grid md:grid-cols-2 md:px-1">
            {COLORS.map((c) => (
              <button
                key={c.v}
                onClick={() => setColor(c.v)}
                aria-label={`${t("ed.colorPrefix")} ${c.label}`}
                title={`${t("ed.colorPrefix")} ${c.label}`}
                className={cn(
                  "size-6 shrink-0 rounded-full border-2 transition",
                  c.dot,
                  color === c.v ? "border-primary ring-2 ring-primary/25" : "border-white shadow"
                )}
              />
            ))}
            <label
              title={t("ed.customColor")}
              className="relative grid size-6 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-rose-400 via-amber-300 to-sky-400 shadow"
            >
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label={t("ed.customColor")}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
          <span className="mx-1 hidden w-px bg-border md:block" aria-hidden />
          {/* السماكة / حجم النص */}
          <div className="flex items-center gap-1 max-md:pl-2 md:flex-col md:px-1">
            {tool === "mask"
              ? MASK_COLORS.map((s) => (
                  <button
                    key={s.v}
                    onClick={() => setMaskColor(s.v)}
                    aria-label={`${t("ed.maskPrefix")} ${s.label}`}
                    title={`${t("ed.maskPrefix")} ${s.label}`}
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold",
                      maskColor === s.v ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}
                  >
                    <span
                      className="size-4 rounded border border-border"
                      style={{ background: s.v }}
                      aria-hidden
                    />
                    {s.label}
                  </button>
                ))
              : tool === "text"
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
            aria-label={t("ed.clearPage")}
            title={t("ed.clearPage")}
            className="flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-[9px] font-extrabold text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-30 md:flex-col"
          >
            <Trash2 className="size-5" aria-hidden />
            {t("ed.clearPage")}
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
                aria-label={t("ed.title")}
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
                      {/* أدوات دقيقة للنص المحدد: حجم أكبر/أصغر + وزن عريض */}
                      {selItem.tool === "text" && (
                        <div className="pointer-events-auto absolute -top-10 left-0 flex items-center gap-0.5 rounded-lg border border-border bg-white px-1 py-0.5 shadow-lg">
                          <button
                            onClick={() => {
                              const s = selItem as TextAnno;
                              const pt = Math.max(4, (s.real?.sizePt ?? 14) - 1);
                              commit(
                                curList.map((a) =>
                                  a.id === selItem.id
                                    ? {
                                        ...(a as TextAnno),
                                        size: (pt / pageDims.current.h) * 1000,
                                        real: s.real
                                          ? { ...s.real, sizePt: pt }
                                          : { sizePt: pt },
                                      }
                                    : a
                                )
                              );
                            }}
                            aria-label={t("ed.textSmaller")}
                            title={t("ed.textSmaller")}
                            className="grid size-6 place-items-center rounded-md text-xs font-extrabold text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          >
                            −
                          </button>
                          <span className="min-w-[34px] text-center text-[10px] font-extrabold text-muted-foreground">
                            {toHindiDigits(Math.round((selItem as TextAnno).real?.sizePt ?? 14))}pt
                          </span>
                          <button
                            onClick={() => {
                              const s = selItem as TextAnno;
                              const pt = Math.min(96, (s.real?.sizePt ?? 14) + 1);
                              commit(
                                curList.map((a) =>
                                  a.id === selItem.id
                                    ? {
                                        ...(a as TextAnno),
                                        size: (pt / pageDims.current.h) * 1000,
                                        real: s.real
                                          ? { ...s.real, sizePt: pt }
                                          : { sizePt: pt },
                                      }
                                    : a
                                )
                              );
                            }}
                            aria-label={t("ed.textBigger")}
                            title={t("ed.textBigger")}
                            className="grid size-6 place-items-center rounded-md text-xs font-extrabold text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          >
                            +
                          </button>
                          <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
                          <button
                            onClick={() =>
                              commit(
                                curList.map((a) =>
                                  a.id === selItem.id
                                    ? {
                                        ...(a as TextAnno),
                                        real: {
                                          sizePt:
                                            (a as TextAnno).real?.sizePt ?? 14,
                                          bold: !((a as TextAnno).real?.bold ?? false),
                                        },
                                      }
                                    : a
                                )
                              )
                            }
                            aria-label={t("ed.toggleBold")}
                            title={t("ed.toggleBold")}
                            className={cn(
                              "grid size-6 place-items-center rounded-md text-[11px] font-extrabold",
                              (selItem as TextAnno).real?.bold
                                ? "bg-primary text-white"
                                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            )}
                          >
                            B
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          commit(curList.filter((a) => a.id !== selItem.id));
                          setSelectedId(null);
                        }}
                        aria-label={t("ed.deleteSelected")}
                        title={t("ed.deleteSelected")}
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
                  className="absolute z-10 flex flex-col gap-1"
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
                    placeholder={t("ed.typeAndEnter")}
                    style={{
                      color,
                      fontSize: `${Math.max(
                        13,
                        kind === "pdf"
                          ? (typing.sizePt ?? sizePt) * (pageW / pageDims.current.w)
                          : textSize * zoom * 0.35
                      )}px`,
                    }}
                    className="rounded-lg border-2 border-primary/50 bg-white/95 px-2 py-1 font-bold shadow-lg outline-none"
                  />
                  {kind === "pdf" && (
                    <span className="flex w-fit items-center gap-1 rounded-lg border border-border bg-white/95 px-2 py-0.5 text-[10px] font-extrabold text-muted-foreground shadow">
                      {typing.edit ? (
                        <b className="text-amber-600">{t("ed.editingExisting")}</b>
                      ) : typing.snap ? (
                        "حجم النص هنا"
                      ) : (
                        "حجم الخط"
                      )}
                      <input
                        type="number"
                        min={4}
                        max={96}
                        step={0.5}
                        value={typing.sizePt ?? sizePt}
                        onChange={(e) =>
                          setTyping({
                            ...typing,
                            sizePt: Math.max(4, Math.min(96, Number(e.target.value) || 14)),
                          })
                        }
                        aria-label={t("ed.fontSizePt")}
                        className="w-11 rounded border border-border px-1 text-center text-[11px] font-extrabold text-foreground outline-none"
                      />
                      pt
                      <span aria-hidden>·</span>
                      <button
                        onClick={() =>
                          setTyping({ ...typing, bold: !(typing.bold ?? boldSnap) })
                        }
                        aria-label={t("ed.toggleBold")}
                        title={t("ed.toggleBold")}
                        className={cn(
                          "grid size-5 place-items-center rounded text-[10px] font-extrabold",
                          (typing.bold ?? boldSnap)
                            ? "bg-primary text-white"
                            : "border border-border text-muted-foreground"
                        )}
                      >
                        B
                      </button>
                      <span aria-hidden>·</span>
                      Tajawal
                    </span>
                  )}
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
        <span>{t("ed.hint")}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">{t("ed.hintShortcuts")}</span>
      </div>
    </div>
  );
}
