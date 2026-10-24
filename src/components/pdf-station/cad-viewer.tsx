"use client";

/* عارض الأوتوكاد — فتح DWG/DXF داخل المتصفح بدون أي خادم
   المحرك: @mlightcad/cad-simple-viewer (MIT) + libredwg-converter (WASM عامل ويب)
   الميزات: تكبير/تصغير/تحريك، لوحة طبقات بإظهار وإخفاء، تصدير PDF متجهي، طباعة مباشرة */

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Layers,
  FileDown,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

interface Props {
  fileName: string;
  file: File;
  onClose: () => void;
}

interface LayerRow {
  name: string;
  cssColor: string;
  isOn: boolean;
}

/* مفاتيح أزرار الشريط — الترجمة عبر القاموس */
const TOOLBAR_ACTIONS = {
  zoomIn: "cad.zoomIn",
  zoomOut: "cad.zoomOut",
  fit: "cad.fit",
  layers: "cad.layers",
  pdf: "cad.exportPdf",
  print: "cad.print",
} as const;

export function CadViewer({ fileName, file, onClose }: Props) {
  const { t } = useI18n();
  const boxRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("__loading__");
  const [error, setError] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerRow[] | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [busy, setBusy] = useState("");
  const mgrRef = useRef<unknown>(null);

  const isDwg = /\.dwg$/i.test(file.name);

  /* ── تهيئة العارض وفتح الملف ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setStatus("k:cad.preparing");
        const dwgParserUrl = "/workers/libredwg-parser-worker.js";
        const workerUrls = {
          dwgParser: dwgParserUrl,
          mtextRender: "/workers/mtext-renderer-worker.js",
        };
        const [{ AcDbDatabaseConverterManager, AcDbFileType }, simple] =
          await Promise.all([
            import("@mlightcad/data-model"),
            import("@mlightcad/cad-simple-viewer"),
          ]);
        /* مدير واحد في الجلسة — نُصفّي القديم لنربط الكانفس بالحاوية الجديدة */
        const existing = simple.AcApDocManager.tryGetInstance();
        if (existing) await existing.destroy();
        /* DWG عبر LibreDWG (WASM) — وDXF عبر محوّل dxf-json — كلاهما مجاني */
        const { AcDbLibreDwgConverter } = await import(
          "@mlightcad/libredwg-converter"
        );
        AcDbDatabaseConverterManager.instance.register(
          AcDbFileType.DWG,
          new AcDbLibreDwgConverter({
            convertByEntityType: false,
            useWorker: true,
            parserWorkerUrl: dwgParserUrl,
          })
        );
        const { AcDbDxfConverter } = await import(
          "@mlightcad/dxf-json-converter"
        );
        AcDbDatabaseConverterManager.instance.register(
          AcDbFileType.DXF,
          new AcDbDxfConverter({
            useWorker: true,
            parserWorkerUrl: "/workers/dxf-parser-worker.js",
          })
        );
        const ready = await simple.AcApDocManager.checkWebworkerReadiness(
          workerUrls
        );
        if (!alive) return;
        if (!ready)
          throw new Error("k:cad.workersFail");
        const box = boxRef.current;
        if (!box) return;
        const manager = simple.AcApDocManager.createInstance({
          container: box,
          autoResize: true,
          webworkerFileUrls: workerUrls,
        });
        if (!manager) throw new Error("k:cad.engineFail");
        mgrRef.current = manager;
        /* للفحص الآلي والأدوات المتقدمة */
        (window as unknown as { __cadMgr?: unknown }).__cadMgr = manager;
        setStatus(isDwg ? "k:cad.readingDwg" : "k:cad.readingDxf");
        const buf = await file.arrayBuffer();
        const { AcEdOpenMode } = await import("@mlightcad/cad-simple-viewer");
        const ok = await manager.openDocument(file.name, buf, {
          mode: AcEdOpenMode.Read,
        });
        if (!alive) return;
        if (!ok)
          throw new Error("k:cad.openFail");
        /* الطبقات: قائمة حية تتحدث مع أي تغيير */
        const doc = manager.curDocument;
        const refresh = () => {
          if (!alive) return;
          try {
            setLayers(
              doc.layerStore
                .getLayers()
                .map((l) => ({ name: l.name, cssColor: l.cssColor, isOn: l.isOn }))
            );
          } catch {
            /* ملف بلا جدول طبقات */
          }
        };
        refresh();
        doc.layerStore.events.changed.addEventListener(refresh);
        setStatus("");
        /* بعض الملفات تُسجّل طبقاتها بعد اكتمال التحويل — نُعيد القراءة قليلًا */
        const late = setInterval(() => {
          if (!alive) {
            clearInterval(late);
            return;
          }
          try {
            const rows = doc.layerStore.getLayers();
            if (rows.length) {
              setLayers(
                rows.map((l) => ({ name: l.name, cssColor: l.cssColor, isOn: l.isOn }))
              );
              clearInterval(late);
            }
          } catch {
            clearInterval(late);
          }
        }, 1200);
        setTimeout(() => clearInterval(late), 20000);
      } catch (e) {
        if (alive) {
          setError(
            e instanceof Error ? e.message : "حدث خطأ غير متوقع أثناء الفتح"
          );
          setStatus("");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [file]);

  /* ── التكبير والملاءمة — نفس أسلوب أمر ZOOM الداخلي: صندوق الشاشة الحالي → تكبير حول مركزه ── */
  const zoomBy = useCallback(async (factor: number) => {
    const mgr = mgrRef.current as {
      curView?: {
        width: number;
        height: number;
        screenToWorld: (p: { x: number; y: number }) => { x: number; y: number };
        zoomTo: (box: unknown, margin?: number) => void;
      };
    } | null;
    const view = mgr?.curView;
    if (!view || !view.width || !view.height || !view.screenToWorld) return;
    try {
      const { AcGeBox2d, AcGeVector2d } = await import("@mlightcad/geometry-engine");
      const tl = view.screenToWorld({ x: 0, y: 0 });
      const br = view.screenToWorld({ x: view.width, y: view.height });
      const box = new AcGeBox2d().expandByPoint(tl).expandByPoint(br);
      const cx = (box.min.x + box.max.x) / 2;
      const cy = (box.min.y + box.max.y) / 2;
      const hw = ((box.max.x - box.min.x) / 2) * factor;
      const hh = ((box.max.y - box.min.y) / 2) * factor;
      if (!Number.isFinite(hw) || !Number.isFinite(hh) || hw <= 0 || hh <= 0) return;
      view.zoomTo(
        new AcGeBox2d(new AcGeVector2d(cx - hw, cy - hh), new AcGeVector2d(cx + hw, cy + hh)),
        1
      );
    } catch {
      /* إن تعذّر الاستيراد: العجلة والتكبير باللمس متاحان دائمًا */
    }
  }, []);

  const fit = useCallback(() => {
    const mgr = mgrRef.current as {
      curView?: { zoomToFitDrawing: () => void };
    } | null;
    if (mgr?.curView) mgr.curView.zoomToFitDrawing();
  }, []);

  /* ── تصدير PDF متجهي (ينزّل الملف مباشرة) ── */
  const exportPdf = useCallback(async () => {
    const mgr = mgrRef.current as
      | { context: unknown; curView?: { waitUntilIdle?: (cb: () => void) => void } }
      | null;
    if (!mgr || busy) return;
    setBusy("pdf");
    try {
      const { AcApPdfConvertor } = await import("@mlightcad/cad-pdf-plugin");
      await new AcApPdfConvertor().convert(mgr.context as never, {
        modelSpaceFit: "extents",
      });
      toast.success(t("cad.exportToast"));
    } catch {
      toast.error(t("cad.exportFail"));
    } finally {
      setBusy("");
    }
  }, [busy]);

  /* ── طباعة مباشرة: لقطة الكانفس الحالي في نافذة طباعة ── */
  const printView = useCallback(() => {
    const canvas = boxRef.current?.querySelector("canvas");
    if (!canvas) return;
    try {
      const url = (canvas as HTMLCanvasElement).toDataURL("image/png");
      if (!url || url.length < 2000)
        throw new Error("لقطة فارغة");
      const w = window.open("", "_blank", "width=980,height=720");
      if (!w) {
        toast.error(t("cad.printBlocked"));
        return;
      }
      w.document.write(
        `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>${fileName}</title>
<style>@page{margin:8mm}body{margin:0;display:grid;place-items:center;background:#fff}
img{max-width:100%;max-height:96vh;object-fit:contain}</style></head>
<body><img src="${url}" alt="" onload="setTimeout(()=>window.print(),150)"></body></html>`
      );
      w.document.close();
    } catch {
      toast.info(t("cad.printFallback"));
    }
  }, [fileName]);

  /* ── تبديل طبقة ── */
  const toggleLayer = (name: string, on: boolean) => {
    const mgr = mgrRef.current as {
      curDocument?: {
        layerStore: { setLayerOn: (n: string, on: boolean) => boolean };
      };
    } | null;
    mgr?.curDocument?.layerStore.setLayerOn(name, on);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-900"
      dir="rtl"
      data-testid="cad-viewer-layer"
      aria-label={t("cad.title")}
    >
      {/* ══ الشريط العلوي ══ */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-slate-950 px-3">
        <button
          onClick={onClose}
          aria-label={t("cad.close")}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-300 hover:bg-red-500/15 hover:text-red-400"
        >
          <X className="size-5" aria-hidden />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold leading-tight text-white">
            {t("cad.viewing", { name: fileName })}
          </p>
          <p className="text-[10px] leading-tight text-slate-400">
            {status ? (status.startsWith("k:") ? t(status.slice(2)) : status) : t("cad.wheelHint")} · {t("ed.inBrowser")}
          </p>
        </div>
        <span className="flex-1" />
        <div className="flex items-center gap-0.5 rounded-xl border border-white/15 bg-white/5 px-1 py-0.5">
          <button
            onClick={() => zoomBy(0.8)}
            aria-label={t(TOOLBAR_ACTIONS.zoomIn)}
            title={t(TOOLBAR_ACTIONS.zoomIn)}
            className="grid size-8 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <ZoomIn className="size-4" aria-hidden />
          </button>
          <button
            onClick={() => zoomBy(1.25)}
            aria-label={t(TOOLBAR_ACTIONS.zoomOut)}
            title={t(TOOLBAR_ACTIONS.zoomOut)}
            className="grid size-8 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <ZoomOut className="size-4" aria-hidden />
          </button>
          <button
            onClick={fit}
            aria-label={t(TOOLBAR_ACTIONS.fit)}
            title={t(TOOLBAR_ACTIONS.fit)}
            className="grid size-8 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <Maximize className="size-4" aria-hidden />
          </button>
        </div>
        {layers && layers.length > 0 && (
          <button
            onClick={() => setShowLayers((v) => !v)}
            aria-label={t(TOOLBAR_ACTIONS.layers)}
            aria-expanded={showLayers}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition",
              showLayers
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "border border-white/15 bg-white/5 text-slate-300 hover:text-white"
            )}
          >
            <Layers className="size-4" aria-hidden />
            {t(TOOLBAR_ACTIONS.layers)}
          </button>
        )}
        <Button
          size="sm"
          disabled={!!busy || !!error}
          onClick={exportPdf}
          aria-label={t(TOOLBAR_ACTIONS.pdf)}
          className="bg-emerald-600 px-3 font-extrabold text-white hover:bg-emerald-700"
        >
          <FileDown className="size-4" aria-hidden />
          {busy === "pdf" ? t("cad.exporting") : t(TOOLBAR_ACTIONS.pdf)}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={printView}
          aria-label={t(TOOLBAR_ACTIONS.print)}
          className="border-white/20 bg-white/5 px-3 font-extrabold text-white hover:bg-white/10"
        >
          <Printer className="size-4" aria-hidden />
          {t(TOOLBAR_ACTIONS.print)}
        </Button>
      </div>

      {/* ══ منطقة العرض ══ */}
      <div className="relative min-h-0 flex-1">
        <div ref={boxRef} className="absolute inset-0" data-testid="cad-canvas-box" />

        {/* طبقة التحميل / الخطأ */}
        {(status || error) && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div
              className={cn(
                "pointer-events-auto max-w-sm rounded-2xl px-6 py-5 text-center shadow-2xl",
                error ? "bg-red-950 text-red-100" : "bg-slate-800 text-slate-100"
              )}
            >
              {error ? (
                <>
                  <p className="text-sm font-extrabold">{t("cad.openFailTitle")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-red-200/80">
                    {error.startsWith("k:") ? t(error.slice(2)) : error}
                  </p>
                  <Button
                    size="sm"
                    onClick={onClose}
                    className="mt-3 bg-white/10 font-extrabold text-white hover:bg-white/20"
                  >
                    {t("ws.cancel")}
                  </Button>
                </>
              ) : (
                <>
                  <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <p className="mt-3 text-xs font-bold leading-relaxed">{status === "__loading__" ? t("cad.loadingEngine") : status.startsWith("k:") ? t(status.slice(2)) : status}</p>
                  {isDwg && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      {t("cad.dwgOnDevice")}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* لوحة الطبقات */}
        {showLayers && layers && (
          <div
            className="absolute bottom-4 right-4 top-4 z-10 flex w-64 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur"
            data-testid="cad-layers-panel"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
              <p className="text-xs font-extrabold text-white">
                {t(TOOLBAR_ACTIONS.layers)} ({layers.length})
              </p>
              <button
                onClick={() => setShowLayers(false)}
                aria-label={t("cad.closeLayers")}
                className="grid size-6 place-items-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {layers.map((l) => (
                <button
                  key={l.name}
                  onClick={() => toggleLayer(l.name, !l.isOn)}
                  aria-label={t(l.isOn ? "cad.hideLayer" : "cad.showLayer", { name: l.name })}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-right transition hover:bg-white/5"
                >
                  <span
                    className="size-3 shrink-0 rounded-sm border border-white/20"
                    style={{ background: l.cssColor }}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[11px] font-bold",
                      l.isOn ? "text-white" : "text-slate-500 line-through"
                    )}
                  >
                    {l.name}
                  </span>
                  <span
                    className={cn(
                      "grid size-4.5 shrink-0 place-items-center rounded border text-[9px] font-extrabold",
                      l.isOn
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                        : "border-white/20 text-transparent"
                    )}
                    aria-hidden
                  >
                    ✓
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ شريط التلميح ══ */}
      <div className="flex h-8 shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-slate-950 px-3 text-[10px] text-slate-400">
        <span>{t("cad.privacy")}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">{t("cad.pdfNote")}</span>
      </div>
    </div>
  );
}
