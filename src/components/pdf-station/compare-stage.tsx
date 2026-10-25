"use client";

/* ─── شاشة الوجهين: «الأصل ↔ المعدّل» + زر تنفيذ ───
   قشرة مقارنة موحدة للأدوات الست ذات المعاينة الحية:
   تدوير (PDF وصورة) · ختم · ترقيم الصفحات · أبعاد الصورة · صيغة الصورة
   اليمين: الأصل كما هو (مرجع ثابت) — اليسار: معاينة تتحدث لحظيًا مع الإعدادات
   زر التنفيذ ينشئ نسخة جديدة (الأصل يبقى محفوظًا دائمًا — فلسفة الإصدارات) */

import { useEffect, useMemo, useRef, useState } from "react";
import { renderPageToCanvas } from "@/lib/pdf-engine";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { OpId } from "@/lib/types";
import { cn } from "@/lib/utils";

/** الأدوات التي تخدمها القشرة */
export const COMPARE_TOOLS: ReadonlySet<string> = new Set([
  "rotate",
  "watermark",
  "page_numbers",
  "image_resize",
  "image_convert",
]);

/** ألوان الختم — نفس خريطة محرك التنفيذ */
const WM_COLORS: Record<string, string> = {
  "رمادي": "#6b7280",
  "احمر": "#dc2626",
  "ازرق": "#2563eb",
};

export function CompareStage({
  tool,
  kind,
  file,
  page,
  pages,
  params,
  busy,
  onExecute,
  executeLabel,
}: {
  tool: OpId;
  kind: "pdf" | "image";
  file: File;
  page: number;
  pages: number;
  params: Record<string, string>;
  busy: boolean;
  onExecute: () => void;
  executeLabel: string;
}) {
  const { t } = useI18n();
  /* وجه الأصل: صفحة PDF مصيَّرة أو رابط كائن الصورة */
  const [orig, setOrig] = useState<string | null>(null);
  /* وجه المعاينة: مخرَج تركيب الكانفس لأدوات الختم والترقيم */
  const [preview, setPreview] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const objUrl = useRef<string | null>(null);

  /* مصدر الأصل — يُعاد توليده مع كل تغيير صفحة/ملف (الضبط داخل النداءات التزامنية كي لا ينتهك ترتيب التأثيرات) */
  useEffect(() => {
    let alive = true;
    if (kind === "pdf") {
      renderPageToCanvas(file, page, 560)
        .then((c) => {
          if (!alive) return;
          setPreview(null);
          setOrig(c.canvas.toDataURL("image/jpeg", 0.85));
        })
        .catch(() => undefined);
    } else {
      if (objUrl.current) URL.revokeObjectURL(objUrl.current);
      const u = URL.createObjectURL(file);
      objUrl.current = u;
      const id = window.setTimeout(() => {
        if (alive) setOrig(u);
      }, 0);
      return () => {
        alive = false;
        window.clearTimeout(id);
      };
    }
    return () => {
      alive = false;
    };
  }, [file, page, kind]);

  /* أبعاد الصورة الأصلية لعرض المقاس المتوقع في أداة الأبعاد */
  useEffect(() => {
    if (kind !== "image" || !orig) return;
    const im = new Image();
    im.onload = () => setImgDims({ w: im.naturalWidth, h: im.naturalHeight });
    im.src = orig;
  }, [kind, orig]);

  /* تركيب المعاينة على كانفس — الختم والترقيم يرسمَان فوق صفحة الأصل */
  useEffect(() => {
    if (tool !== "watermark" && tool !== "page_numbers") return;
    if (!orig) return;
    const im = new Image();
    im.onload = () => {
      const c = document.createElement("canvas");
      c.width = im.naturalWidth;
      c.height = im.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(im, 0, 0);
      if (tool === "watermark") {
        const text = (params.text || "مسودة").trim();
        const color = WM_COLORS[params.color] ?? WM_COLORS["رمادي"];
        ctx.save();
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate((-25 * Math.PI) / 180);
        ctx.font = `bold ${Math.max(28, Math.round(c.width / 12))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = color;
        ctx.fillText(text, 0, 0);
        ctx.restore();
      } else {
        const label = params.format === "صفحة من" ? `صفحة ${page} من ${pages}` : String(page);
        ctx.font = `bold ${Math.max(14, Math.round(c.width / 34))}px sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "alphabetic";
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#1e293b";
        ctx.fillText(label, c.width - c.width * 0.05, c.height - c.height * 0.04);
      }
      setPreview(c.toDataURL("image/jpeg", 0.9));
    };
    im.src = orig;
  }, [orig, tool, params.text, params.color, params.format, page, pages]);

  useEffect(
    () => () => {
      if (objUrl.current) URL.revokeObjectURL(objUrl.current);
    },
    []
  );

  /* تحويل التدوير — CSS على وجه المعاينة */
  const rotateStyle = useMemo<React.CSSProperties | null>(() => {
    if (tool !== "rotate") return null;
    const a = params.angle ?? "90";
    if (a === "flipH") return { transform: "scaleX(-1)" };
    if (a === "flipV") return { transform: "scaleY(-1)" };
    const deg = a === "180" ? 180 : a === "270" ? 270 : 90;
    return { transform: `rotate(${deg}deg)` };
  }, [tool, params.angle]);

  /* الأبعاد — عرض المعاينة يتبع النسبة/البكسل مع تسمية المقاس المتوقع */
  const resizeView = useMemo(() => {
    if (tool !== "image_resize") return null;
    const v = (params.value ?? "50%").trim();
    const pct = v.endsWith("%") ? Math.min(200, Math.max(5, parseFloat(v) || 50)) / 100 : null;
    const px = pct === null ? Math.max(20, parseInt(v, 10) || 400) : null;
    const outW = pct !== null && imgDims ? Math.round(imgDims.w * pct) : px ?? 0;
    const outH =
      pct !== null && imgDims ? Math.round(imgDims.h * pct) : imgDims ? Math.round((imgDims.h * (px ?? 1)) / (imgDims.w || 1)) : 0;
    return { widthCss: pct !== null ? `${pct * 100}%` : `${Math.min(px ?? 400, 560)}px`, outW, outH };
  }, [tool, params.value, imgDims]);

  const convFormat = tool === "image_convert" ? (params.format ?? "jpeg").toUpperCase() : null;
  const canvasTool = tool === "watermark" || tool === "page_numbers";
  const paneBox = "flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-3";

  return (
    <div data-testid="compare-root" className="flex w-full flex-col items-center">
      <div className="grid w-full gap-3 md:grid-cols-2">
        {/* ── الأصل ── */}
        <div className="rounded-2xl border border-border bg-white p-2.5" data-testid="compare-original">
          <span className="mb-2 inline-block rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-extrabold text-muted-foreground">
            {t("cmp.original")}
          </span>
          <div className={paneBox}>
            {orig ? (
              <img src={orig} alt={t("cmp.original")} className="max-h-[360px] max-w-full rounded-md bg-white shadow-md" />
            ) : (
              <div className="size-48 animate-pulse rounded-md bg-white shadow-sm" />
            )}
          </div>
        </div>

        {/* ── بعد التعديل ── */}
        <div className="rounded-2xl border-2 border-primary/30 bg-white p-2.5" data-testid="compare-preview">
          <span className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-extrabold text-primary">
            {t("cmp.modified")}
          </span>
          <div className={paneBox}>
            {!orig ? (
              <div className="size-48 animate-pulse rounded-md bg-white shadow-sm" />
            ) : tool === "rotate" && rotateStyle ? (
              <img src={orig} alt={t("cmp.modified")} style={rotateStyle} className="max-h-[360px] max-w-full rounded-md bg-white shadow-md transition-transform duration-300" />
            ) : canvasTool && preview ? (
              <img src={preview} alt={t("cmp.modified")} className="max-h-[360px] max-w-full rounded-md bg-white shadow-md" />
            ) : canvasTool ? (
              <div className="size-48 animate-pulse rounded-md bg-white shadow-sm" />
            ) : tool === "image_resize" && resizeView ? (
              <img src={orig} alt={t("cmp.modified")} style={{ width: resizeView.widthCss }} className="rounded-md bg-white shadow-md" />
            ) : (
              <img src={orig} alt={t("cmp.modified")} className="max-h-[360px] max-w-full rounded-md bg-white shadow-md" />
            )}
          </div>
          {/* تسميات النتيجة المتوقعة */}
          {tool === "image_resize" && resizeView && resizeView.outW > 0 && (
            <p className="mt-1.5 text-center text-[11px] font-bold text-muted-foreground">
              {resizeView.outW} × {resizeView.outH} px
            </p>
          )}
          {convFormat && (
            <p className="mt-1.5 text-center">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-700">
                {convFormat} · {t("cmp.hint")}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* زر التنفيذ — من القشرة نفسها كما طلب المستخدم */}
      <Button
        size="lg"
        disabled={busy}
        onClick={onExecute}
        data-testid="compare-execute"
        className={cn("mt-4 px-10 font-extrabold shadow-lg shadow-primary/25")}
      >
        {busy ? t("verb.running") : executeLabel}
      </Button>
    </div>
  );
}
