"use client";

/* لوحة القص الحر «زي الرسام» — اسحب مستطيلًا بأي مكان من داخل الصفحة:
   «احفظ القطعة» يقتطعها ملفًا مستقلًا (الأصل سليم)،
   و«احذفها من الصفحة» يمسحها نهائيًا — تنظيف كتابة الايد والطوابع والعلامات.
   WYSIWYG: ما تراه محددًا على المعاينة هو ما يُقتطع أو يُمسح بالضبط */

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Eraser, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  imageCropFree,
  pdfCleanRegion,
  pdfCropPiece,
  renderPageToCanvas,
  type CropRectNorm,
} from "@/lib/pdf-engine";
import { stripExt } from "@/lib/naming";
import { toHindiDigits } from "@/lib/arabic";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  file: File;
  fileName: string;
  kind: "image" | "pdf";
  page: number;
  pages: number;
  onPage: (p: number) => void;
  /** كل صور المساحة — لزر «طبّق على كل الصور» */
  batchImages: { file: File; name: string }[];
  onClose: () => void;
  /** نتيجة تُضاف لشريط النتائج فقط (القطع المستقلة) */
  onSavePiece: (name: string, blob: Blob) => Promise<void>;
  /** نتيجة تنظيف: تُضاف وتصير ملف العمل النشط — تكمل التنضيف على النسخة الجديدة */
  onCleaned: (name: string, blob: Blob) => Promise<void>;
  /** تراجع عن آخر تنظيف (Ctrl+Z) — يعيد تفعيل النسخة السابقة؛ يعيد true إن وجد ما يُتراجع عنه */
  onUndo: () => boolean;
  /** إعادة آخر تنظيف مُتراجع عنه (Ctrl+Y / Ctrl+Shift+Z)؛ يعيد true إن وجد */
  onRedo: () => boolean;
}

/* ─────────── رياضيات التحديد ─────────── */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function normRect(r: CropRectNorm): CropRectNorm {
  return {
    x0: Math.min(r.x0, r.x1),
    y0: Math.min(r.y0, r.y1),
    x1: Math.max(r.x0, r.x1),
    y1: Math.max(r.y0, r.y1),
  };
}

/** مستطيل بنسبة مقفولة بالبكسل: يمدد من نقطة الارتكاز نحو المؤشر ويحترم حدود الصفحة
 *  aspectHOverW = ارتفاع الصفحة / عرضها — لأن النسب الطبيعية x وy مقسومة على بعدين مختلفين */
function ratioRect(
  anchor: { x: number; y: number },
  p: { x: number; y: number },
  ratio: number | null,
  aspectHOverW = 1
): CropRectNorm {
  let w = p.x - anchor.x;
  let h = p.y - anchor.y;
  if (ratio) {
    const r = ratio * aspectHOverW;
    const sw = w >= 0 ? 1 : -1;
    const sh = h >= 0 ? 1 : -1;
    const maxW = sw > 0 ? 1 - anchor.x : anchor.x;
    const maxH = sh > 0 ? 1 - anchor.y : anchor.y;
    let aw = Math.min(Math.abs(w), maxW);
    let ah = aw / r;
    if (ah > maxH) {
      ah = maxH;
      aw = ah * r;
    }
    w = sw * aw;
    h = sh * ah;
  }
  return normRect({ x0: anchor.x, y0: anchor.y, x1: anchor.x + w, y1: anchor.y + h });
}

interface DragState {
  mode: "new" | "move" | "resize";
  handle?: "nw" | "ne" | "sw" | "se";
  anchor?: { x: number; y: number };
  start?: { x: number; y: number };
  orig?: CropRectNorm;
}

export function CropPanel({
  file,
  fileName,
  kind,
  page,
  pages,
  onPage,
  batchImages,
  onClose,
  onSavePiece,
  onCleaned,
  onUndo,
  onRedo,
}: Props) {
  const { t } = useI18n();
  const [preview, setPreview] = useState("");
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [pt, setPt] = useState<{ w: number; h: number } | null>(null);
  const [sel, setSel] = useState<CropRectNorm | null>(null);
  const [ratio, setRatio] = useState<string>("free");
  const [applyAll, setApplyAll] = useState(false);
  const [busy, setBusy] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const ratioRef = useRef<number | null>(null);
  /* أساس العدّاد بالمرجع — مستمعا السحب ثابتان ولا يلتقطان قديم state */
  const dimsBaseRef = useRef<{ w: number; h: number } | null>(null);
  const dimsBase = kind === "image" ? nat : pt;
  dimsBaseRef.current = dimsBase;

  /* المعاينة — صورة مباشرة أو صفحة PDF مرسومة، وتُعاد عند تغيّر الملف أو الصفحة */
  useEffect(() => {
    let alive = true;
    setPreview("");
    setSel(null);
    if (kind === "image") {
      const url = URL.createObjectURL(file);
      if (alive) setPreview(url);
      return () => {
        alive = false;
        URL.revokeObjectURL(url);
      };
    }
    renderPageToCanvas(file, page, 900)
      .then(({ canvas, ptW, ptH }) => {
        if (!alive) return;
        setPreview(canvas.toDataURL("image/jpeg", 0.9));
        setPt({ w: ptW, h: ptH });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [file, page, kind]);

  const RATIOS: { id: string; label: string; v: number | null }[] = useMemo(
    () => [
      { id: "free", label: t("crop.free"), v: null },
      { id: "sq", label: "1:1", v: 1 },
      { id: "43", label: "4:3", v: 4 / 3 },
      { id: "34", label: "3:4", v: 3 / 4 },
      { id: "169", label: "16:9", v: 16 / 9 },
      { id: "a4p", label: "A4", v: 210 / 297 },
      { id: "a4l", label: "A4 عرضي", v: 297 / 210 },
    ],
    [t]
  );
  const ratioValue = RATIOS.find((r) => r.id === ratio)?.v ?? null;
  ratioRef.current = ratioValue;

  /* مستمعا السحب على النافذة — يعملان أثناء السحب فقط ويهذّبان خارج حدود الصفحة */
  useEffect(() => {
    const posOf = (e: PointerEvent) => {
      const r = stageRef.current?.getBoundingClientRect();
      if (!r || r.width === 0 || r.height === 0) return null;
      return {
        x: clamp01((e.clientX - r.left) / r.width),
        y: clamp01((e.clientY - r.top) / r.height),
      };
    };
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      const p = posOf(e);
      if (!d || !p) return;
      if (d.mode === "new" || d.mode === "resize") {
        const anchor =
          d.mode === "new"
            ? d.anchor!
            : d.handle === "nw"
              ? { x: d.orig!.x1, y: d.orig!.y1 }
              : d.handle === "ne"
                ? { x: d.orig!.x0, y: d.orig!.y1 }
                : d.handle === "sw"
                  ? { x: d.orig!.x1, y: d.orig!.y0 }
                  : { x: d.orig!.x0, y: d.orig!.y0 };
        const base = dimsBaseRef.current;
        const aspect = base && base.w > 0 ? base.h / base.w : 1;
        setSel(ratioRect(anchor, p, ratioRef.current, aspect));
      } else if (d.mode === "move" && d.orig && d.start) {
        let dx = p.x - d.start.x;
        let dy = p.y - d.start.y;
        dx = Math.max(-d.orig.x0, Math.min(1 - d.orig.x1, dx));
        dy = Math.max(-d.orig.y0, Math.min(1 - d.orig.y1, dy));
        setSel({
          x0: d.orig.x0 + dx,
          y0: d.orig.y0 + dy,
          x1: d.orig.x1 + dx,
          y1: d.orig.y1 + dy,
        });
      }
    };
    const onUp = () => {
      const d = drag.current;
      drag.current = null;
      if (d?.mode === "new") {
        setSel((s) => {
          /* نقرة بلا سحب = إلغاء التحديد (سلوك بديهي) */
          if (s && s.x1 - s.x0 < 0.015 && s.y1 - s.y0 < 0.015) return null;
          return s;
        });
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onStageDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    e.preventDefault();
    const p = {
      x: clamp01((e.clientX - r.left) / r.width),
      y: clamp01((e.clientY - r.top) / r.height),
    };
    const handle = (e.target as HTMLElement).dataset?.handle as DragState["handle"] | undefined;
    if (handle && sel) {
      drag.current = { mode: "resize", handle, orig: sel };
      return;
    }
    if (sel && p.x >= sel.x0 && p.x <= sel.x1 && p.y >= sel.y0 && p.y <= sel.y1) {
      drag.current = { mode: "move", start: p, orig: sel };
      return;
    }
    drag.current = { mode: "new", anchor: p };
    setSel({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };

  /* عدّاد الأبعاد الحي — بكسل الصورة الأصلية أو نقاط صفحة الـPDF */
  const dims = useMemo(() => {
    if (!sel || sel.x1 - sel.x0 < 0.005) return null;
    const base = kind === "image" ? nat : pt;
    if (!base) return null;
    return {
      w: Math.max(1, Math.round((sel.x1 - sel.x0) * base.w)),
      h: Math.max(1, Math.round((sel.y1 - sel.y0) * base.h)),
    };
  }, [sel, kind, nat, pt]);

  const needSel = () => toast.info(t("crop.needSel"));

  /* احفظ القطعة — ملف مستقل في شريط النتائج، الأصل سليم */
  const savePiece = async () => {
    if (!sel || busy) return needSel();
    setBusy(true);
    try {
      if (kind === "image") {
        const targets =
          applyAll && batchImages.length > 1
            ? batchImages
            : [{ file, name: fileName }];
        for (const img of targets) {
          const r = await imageCropFree(img, sel, "save");
          await onSavePiece(`قطعة-من-${stripExt(img.name)}.${r.ext}`, r.blob);
        }
        toast.success(
          targets.length > 1
            ? `${t("crop.piecesSaved")} (${toHindiDigits(targets.length)})`
            : t("crop.pieceSaved")
        );
      } else {
        const targets =
          applyAll && pages > 1
            ? Array.from({ length: pages }, (_, i) => i + 1)
            : [page];
        for (const p of targets) {
          const r = await pdfCropPiece(file, p, sel);
          await onSavePiece(
            `قطعة-صفحة-${toHindiDigits(p)}-من-${stripExt(fileName)}.png`,
            r.blob
          );
        }
        toast.success(
          targets.length > 1
            ? `${t("crop.piecesSaved")} (${toHindiDigits(targets.length)})`
            : t("crop.pieceSaved")
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("crop.failed"));
    } finally {
      setBusy(false);
    }
  };

  /* احذفها من الصفحة — تنظيف نهائي، والنسخة النظيفة تصير ملف العمل */
  const cleanRegion = async () => {
    if (!sel || busy) return needSel();
    setBusy(true);
    try {
      if (kind === "image") {
        const r = await imageCropFree({ file, name: fileName }, sel, "clean");
        await onCleaned(`${stripExt(fileName)}-نضيفة.${r.ext}`, r.blob);
        /* باقي صور الدفعة بنفس التحديد — نسخ نظيفة تُضاف للنتائج */
        if (applyAll && batchImages.length > 1) {
          let n = 0;
          for (const img of batchImages) {
            if (img.name === fileName) continue;
            const rc = await imageCropFree(img, sel, "clean");
            await onSavePiece(`${stripExt(img.name)}-نضيفة.${rc.ext}`, rc.blob);
            n++;
          }
          toast.success(`${t("crop.cleanedMany")} (${toHindiDigits(n + 1)})`);
        } else {
          toast.success(t("crop.cleaned"));
        }
      } else {
        const r = await pdfCleanRegion(file, page, sel, applyAll && pages > 1);
        await onCleaned(`${stripExt(fileName)}-نضيفة.pdf`, new Blob([r.bytes.buffer as ArrayBuffer], { type: "application/pdf" }));
        toast.success(
          r.removedAnnots > 0
            ? `${t("crop.cleaned")} +${toHindiDigits(r.removedAnnots)} ${t("crop.annotsWord")}`
            : t("crop.cleaned")
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("crop.failed"));
    } finally {
      setBusy(false);
    }
  };

  /* ── اختصارات لوحة المفاتيح — كماليات زي الرسام ──
     Delete / Backspace: يحذف المنطقة المحددة من الصفحة (تنظيف نهائي)
     Ctrl+Z: تراجع عن آخر تنظيف — وإن لم يوجد ما يُتراجع عنه فَلغي التحديد
     Ctrl+Shift+Z أو Ctrl+Y: إعادة · Esc: إلغاء التحديد */
  const cleanRef = useRef(cleanRegion);
  cleanRef.current = cleanRegion;
  const undoRef = useRef(onUndo);
  undoRef.current = onUndo;
  const redoRef = useRef(onRedo);
  redoRef.current = onRedo;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable)) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (sel && !busy) {
          e.preventDefault();
          cleanRef.current();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          if (redoRef.current()) toast.success(t("crop.redone"));
        } else if (undoRef.current()) {
          toast.success(t("crop.undone"));
        } else {
          setSel(null); /* لا تاريخ؟ التراجع يلغي التحديد زي الرسام */
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        if (redoRef.current()) toast.success(t("crop.redone"));
        return;
      }
      if (e.key === "Escape" && sel) setSel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, busy, t]);

  const sw = sel ? (sel.x1 - sel.x0) * 100 : 0;
  const sh = sel ? (sel.y1 - sel.y0) * 100 : 0;

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4"
      data-testid="crop-panel"
    >
      {/* الرأس: العنوان + تنقل الصفحات + إغلاق */}
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">✂️</span>
        <h3 className="font-extrabold">{t("crop.title")}</h3>
        <span className="flex-1" />
        {kind === "pdf" && pages > 1 && (
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

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* يمين: النسب والعدّاد والأزرار */}
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-1.5 text-[11px] font-bold text-muted-foreground">{t("crop.ratio")}</p>
            <div className="flex flex-wrap gap-1">
              {RATIOS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRatio(r.id)}
                  aria-label={`${t("crop.ratio")}: ${r.label}`}
                  data-testid={`crop-ratio-${r.id}`}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition",
                    ratio === r.id
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:text-primary"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* عدّاد الأبعاد الحي */}
          <div
            data-testid="crop-dims"
            className="rounded-xl border border-border bg-slate-50 px-3 py-2 text-center font-mono text-sm font-extrabold text-foreground"
          >
            {dims
              ? `${toHindiDigits(dims.w)} × ${toHindiDigits(dims.h)}`
              : t("crop.noSel")}
          </div>

          {(kind === "pdf" ? pages > 1 : batchImages.length > 1) && (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2">
              <input
                type="checkbox"
                checked={applyAll}
                onChange={(e) => setApplyAll(e.target.checked)}
                data-testid="crop-all"
                className="size-4 accent-[var(--primary)]"
              />
              <span className="text-xs font-bold">
                {kind === "pdf" ? t("crop.allPages") : t("crop.allImages")}
              </span>
            </label>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={savePiece}
              disabled={busy}
              data-testid="crop-save"
              className="bg-emerald-600 font-extrabold text-white hover:bg-emerald-700"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
              {t("crop.save")}
            </Button>
            <Button
              onClick={cleanRegion}
              disabled={busy}
              variant="outline"
              data-testid="crop-clean"
              title={`${t("crop.clean")} · Delete`}
              className="border-red-200 font-extrabold text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Eraser className="size-4" aria-hidden />
              {t("crop.clean")}
            </Button>
          </div>

          <button
            onClick={() => setSel(null)}
            disabled={!sel || busy}
            data-testid="crop-clear"
            className="rounded-lg py-1 text-[11px] font-bold text-muted-foreground hover:text-primary disabled:opacity-40"
          >
            {t("crop.clear")}
          </button>

          <p
            data-testid="crop-kbd"
            className="rounded-lg bg-muted/60 px-2.5 py-1.5 text-[10px] font-bold leading-relaxed text-muted-foreground"
          >
            {t("crop.kbd")}
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t("crop.hint")}</p>
          <p className="text-[10px] leading-relaxed text-muted-foreground/80">{t("crop.cleanNote")}</p>
        </div>

        {/* يسار: معاينة السحب — غشاء داكن خارج التحديد زي الرسام */}
        <div className="flex min-h-[360px] items-start justify-center overflow-auto rounded-xl bg-slate-50 p-3">
          {preview ? (
            <div
              ref={stageRef}
              onPointerDown={onStageDown}
              data-testid="crop-stage"
              className="relative inline-block touch-none overflow-hidden rounded-md bg-white shadow-xl shadow-black/10"
              style={{ cursor: sel ? "default" : "crosshair" }}
            >
              <img
                src={preview}
                alt=""
                draggable={false}
                onLoad={(e) =>
                  setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
                }
                className="max-h-[560px] w-auto select-none"
              />
              {sel && sw > 0 && sh > 0 && (
                <>
                  <div
                    data-testid="crop-sel"
                    className="absolute border border-dashed border-sky-400"
                    style={{
                      left: `${sel.x0 * 100}%`,
                      top: `${sel.y0 * 100}%`,
                      width: `${sw}%`,
                      height: `${sh}%`,
                      boxShadow: "0 0 0 9999px rgba(15,23,42,0.55)",
                    }}
                  >
                    {(["nw", "ne", "sw", "se"] as const).map((h) => (
                      <span
                        key={h}
                        data-handle={h}
                        className={cn(
                          "absolute z-10 size-3 rounded-sm border-2 border-white bg-sky-500 shadow",
                          h === "nw" && "-left-1.5 -top-1.5 cursor-nwse-resize",
                          h === "ne" && "-right-1.5 -top-1.5 cursor-nesw-resize",
                          h === "sw" && "-bottom-1.5 -left-1.5 cursor-nesw-resize",
                          h === "se" && "-bottom-1.5 -right-1.5 cursor-nwse-resize"
                        )}
                      />
                    ))}
                  </div>
                  {dims && (
                    <span
                      className="pointer-events-none absolute z-10 rounded-md bg-sky-600 px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-white shadow"
                      style={{
                        left: `${sel.x0 * 100}%`,
                        top: `calc(${sel.y0 * 100}% - 22px)`,
                      }}
                    >
                      {toHindiDigits(dims.w)} × {toHindiDigits(dims.h)}
                    </span>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
              <p className="text-xs font-bold text-muted-foreground">{t("crop.busyRender")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
