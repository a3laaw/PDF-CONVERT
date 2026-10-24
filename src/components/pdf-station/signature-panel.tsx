"use client";

/* لوحة التوقيع الإلكتروني — ارسم توقيعك بإيدك أو اكتبه، ثم انقر على الصفحة
   ليُثبّت مكانه وبالحجم الذي تريد. WYSIWYG: الشبح على المعاينة مطابق تمامًا
   لما يُحفظ في الملف (نفس النسب: الموضع جزء من الصفحة والعرض جزء من عرضها)
   كل تثبيت ينتج نسخة جديدة تبقى مفتوحة — تكمل توقيع صفحات أخرى على النسخة الأخيرة */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Eraser, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { resultName } from "@/lib/naming";
import { toHindiDigits } from "@/lib/arabic";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  file: File;
  fileName: string;
  page: number;
  pages: number;
  onPage: (p: number) => void;
  onClose: () => void;
  /** بعد كل تثبيت: النتيجة تُضاف وتصير ملف العمل النشط (تكمل التواقيع على النسخة الجديدة) */
  onApplied: (name: string, blob: Blob) => Promise<void>;
}

/** قصّ الهوامش الشفافة حول الرسم — توقيع ملاصق يوضع بدقة */
function trimToPng(canvas: HTMLCanvasElement): { dataUrl: string; w: number; h: number } | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const { width, height } = canvas;
  const img = ctx.getImageData(0, 0, width, height);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (img.data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const c = document.createElement("canvas");
  c.width = maxX - minX + 1;
  c.height = maxY - minY + 1;
  c.getContext("2d")!.drawImage(canvas, minX, minY, c.width, c.height, 0, 0, c.width, c.height);
  return { dataUrl: c.toDataURL("image/png"), w: c.width, h: c.height };
}

async function dataUrlBytes(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl);
  return new Uint8Array(await res.arrayBuffer());
}

/** معاينة صفحة PDF بجودة عالية */
async function renderPage(file: File, pageNo: number, maxW = 860): Promise<string> {
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
  return canvas.toDataURL("image/jpeg", 0.9);
}

export function SignaturePanel({ file, fileName, page, pages, onPage, onClose, onApplied }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"draw" | "type">("draw");
  const [ink, setInk] = useState("#1D4ED8");
  const [typed, setTyped] = useState("");
  const [sig, setSig] = useState<{ dataUrl: string; w: number; h: number } | null>(null);
  const [sizePct, setSizePct] = useState(22);
  const [pos, setPos] = useState<{ fx: number; fy: number } | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  /* معاينة الصفحة النشطة — تعاد عند تغيّر الملف (نسخة موقّعة جديدة) أو الصفحة */
  useEffect(() => {
    let alive = true;
    setPreview("");
    renderPage(file, page)
      .then((url) => alive && setPreview(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [file, page]);

  /* تجهيز كانفس الرسم عند فتح التبويب أو تغيّر لون الحبر — نظيف وبلون الحبر */
  useEffect(() => {
    if (tab !== "draw") return;
    const c = canvasRef.current;
    if (!c) return;
    c.width = 600;
    c.height = 220;
    const ctx = c.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = ink;
  }, [tab, ink]);

  const canvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  };

  const strokeTo = (p: { x: number; y: number }) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    /* التقاط المؤشر يفشل مع الأحداث الاصطناعية وبعض الأجهزة — الرسم يكمل بدونه */
    try {
      canvasRef.current!.setPointerCapture(e.pointerId);
    } catch {
      /* بلا التقاط */
    }
    drawing.current = true;
    last.current = canvasPos(e);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    strokeTo(canvasPos(e));
  };
  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const trimmed = trimToPng(canvasRef.current!);
    if (trimmed) setSig(trimmed);
  };

  const clearDraw = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setSig(null);
  };

  /* التوقيع المكتوب — بنفس خط الموقع وبحبر مائل قليلًا ليقارب التوقيع */
  const commitTyped = async () => {
    const text = typed.trim();
    if (!text) {
      toast.info(t("sig.typeEmpty"));
      return;
    }
    const font = `italic 600 84px Tajawal, "Noto Sans Arabic", sans-serif`;
    try {
      await document.fonts.load(font, text);
    } catch {
      /* الخط غير متاح — نكمل بخط النظام */
    }
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d")!;
    ctx.font = font;
    const m = ctx.measureText(text);
    c.width = Math.ceil(m.width) + 40;
    c.height = 160;
    const ctx2 = c.getContext("2d")!;
    ctx2.clearRect(0, 0, c.width, c.height);
    ctx2.font = font;
    ctx2.fillStyle = ink;
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.direction = "rtl";
    ctx2.fillText(text, c.width / 2, c.height / 2);
    const trimmed = trimToPng(c);
    if (trimmed) setSig(trimmed);
  };

  /* النقر على المعاينة = مكان التوقيع (ركن أعلى التوقيع) */
  const place = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sig) {
      toast.info(t("sig.needSig"));
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const fx = Math.min(0.98, Math.max(0, (e.clientX - r.left) / r.width));
    const fy = Math.min(0.98, Math.max(0, (e.clientY - r.top) / r.height));
    setPos({ fx, fy });
  };

  /* التثبيت: pdf-lib يضمّن التوقيع PNG شفافًا بنفس نسب المعاينة */
  const apply = async () => {
    if (!sig || !pos || busy) {
      toast.info(sig ? t("sig.needPos") : t("sig.needSig"));
      return;
    }
    setBusy(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
      const pg = doc.getPage(Math.max(0, page - 1));
      const pngBytes = await dataUrlBytes(sig.dataUrl);
      const png = await doc.embedPng(pngBytes);
      const w = (sizePct / 100) * pg.getWidth();
      const h = w * (sig.h / sig.w);
      const x = pos.fx * pg.getWidth();
      const y = pg.getHeight() - pos.fy * pg.getHeight() - h;
      pg.drawImage(png, { x, y, width: w, height: h });
      const saved = await doc.save({ useObjectStreams: true });
      const name = resultName("sign", fileName);
      const blob = new Blob([saved.buffer as ArrayBuffer], { type: "application/pdf" });
      await onApplied(name, blob);
      toast.success(`${t("sig.applied")} — ${t("sig.pageWord")} ${toHindiDigits(page)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("sig.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4">
      {/* الرأس: العنوان + تنقل الصفحات + إغلاق */}
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">✍️</span>
        <h3 className="font-extrabold">{t("sig.title")}</h3>
        <span className="flex-1" />
        {pages > 1 && (
          <span className="flex items-center gap-2">
            <button
              onClick={() => onPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              aria-label={t("qp.prevPage")}
              className="grid size-8 place-items-center rounded-lg border border-border bg-white text-lg font-extrabold text-muted-foreground disabled:opacity-30"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
            <span className="text-xs font-extrabold text-muted-foreground">
              {toHindiDigits(page)} / {toHindiDigits(pages)}
            </span>
            <button
              onClick={() => onPage(Math.min(pages, page + 1))}
              disabled={page >= pages}
              aria-label={t("qp.nextPage")}
              className="grid size-8 place-items-center rounded-lg border border-border bg-white text-lg font-extrabold text-muted-foreground disabled:opacity-30"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
          </span>
        )}
        <button
          onClick={onClose}
          aria-label={t("ws.closePanel")}
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* يمين: صناديق الرسم والكتابة */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {(["draw", "type"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTab(m)}
                aria-label={t(m === "draw" ? "sig.tabDraw" : "sig.tabType")}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-extrabold transition",
                  tab === m ? "bg-white text-primary shadow-sm" : "text-muted-foreground"
                )}
              >
                {t(m === "draw" ? "sig.tabDraw" : "sig.tabType")}
              </button>
            ))}
          </div>

          {tab === "draw" ? (
            <>
              <canvas
                ref={canvasRef}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerLeave={onUp}
                className="h-[130px] w-full touch-none rounded-xl border-2 border-dashed border-border bg-[linear-gradient(transparent_calc(100%-1px),rgba(0,0,0,0.08)_0)]"
                data-testid="sign-canvas"
              />
              <p className="text-[11px] text-muted-foreground">{t("sig.drawHint")}</p>
            </>
          ) : (
            <>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={t("sig.typePlaceholder")}
                data-testid="sign-typed"
                className="w-full rounded-xl border border-border px-3 py-2.5 text-sm font-bold placeholder:font-normal placeholder:text-muted-foreground/60"
              />
              <Button variant="outline" size="sm" onClick={commitTyped} className="font-extrabold">
                {t("sig.typeApply")}
              </Button>
              <p className="text-[11px] text-muted-foreground">{t("sig.typeHint")}</p>
            </>
          )}

          {/* لون الحبر */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground">{t("sig.ink")}</span>
            {[
              { v: "#1D4ED8", cls: "bg-blue-700" },
              { v: "#111827", cls: "bg-gray-900" },
            ].map((c) => (
              <button
                key={c.v}
                onClick={() => setInk(c.v)}
                aria-label={t(c.v === "#1D4ED8" ? "sig.inkBlue" : "sig.inkBlack")}
                className={cn(
                  "size-6 rounded-full border-2 transition",
                  c.cls,
                  ink === c.v ? "border-primary ring-2 ring-primary/25" : "border-border"
                )}
              />
            ))}
            <span className="flex-1" />
            <button
              onClick={() => {
                clearDraw();
                setSig(null);
                setPos(null);
              }}
              aria-label={t("sig.clear")}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-muted-foreground hover:bg-muted hover:text-red-600"
            >
              <Eraser className="size-3.5" aria-hidden />
              {t("sig.clear")}
            </button>
          </div>

          {/* حجم التوقيع */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground">{t("sig.size")}</span>
            <input
              type="range"
              min={8}
              max={60}
              value={sizePct}
              onChange={(e) => setSizePct(Number(e.target.value))}
              aria-label={t("sig.size")}
              data-testid="sign-size"
              className="h-1.5 flex-1 accent-[hsl(var(--primary))]"
            />
            <span className="w-10 text-[11px] font-extrabold text-muted-foreground">
              {toHindiDigits(sizePct)}%
            </span>
          </div>

          <Button
            onClick={apply}
            disabled={busy}
            data-testid="sign-apply"
            className="bg-emerald-600 font-extrabold text-white hover:bg-emerald-700"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
            {t("sig.apply")}
          </Button>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t("sig.placeHint")}</p>
        </div>

        {/* يسار: معاينة الصفحة مع شبح التوقيع */}
        <div className="flex min-h-[360px] items-start justify-center overflow-auto rounded-xl bg-slate-50 p-3">
          {preview ? (
            <div
              onClick={place}
              data-testid="sign-preview"
              className={cn(
                "relative inline-block overflow-hidden rounded-md bg-white shadow-xl shadow-black/10",
                sig ? "cursor-crosshair" : "cursor-default"
              )}
            >
              <img src={preview} alt="" className="max-h-[560px] w-auto select-none" draggable={false} />
              {sig && pos && (
                <img
                  src={sig.dataUrl}
                  alt=""
                  draggable={false}
                  data-testid="sign-ghost"
                  className="pointer-events-none absolute select-none"
                  style={{
                    left: `${pos.fx * 100}%`,
                    top: `${pos.fy * 100}%`,
                    width: `${sizePct}%`,
                  }}
                />
              )}
            </div>
          ) : (
            <div className="size-64 animate-pulse rounded-md bg-white shadow-lg" />
          )}
        </div>
      </div>
    </div>
  );
}
