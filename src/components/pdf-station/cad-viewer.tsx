"use client";

/* عارض الأوتوكاد — فتح DWG/DXF داخل المتصفح بدون أي خادم
   المحرك: @mlightcad/cad-simple-viewer (MIT) + libredwg-converter (WASM عامل ويب)
   الميزات: تكبير/تصغير/تحريك، لوحة طبقات بإظهار وإخفاء، تصدير PDF متجهي، طباعة مباشرة */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PointerEvent as RPointerEvent,
  WheelEvent as RWheelEvent,
} from "react";
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
  Ruler,
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

/* ── أدوات وضع القياس ── */
type Pt = { x: number; y: number };

type MeasureView = {
  screenToWorld: (p: Pt) => Pt;
  worldToScreen: (p: Pt) => Pt;
};

/* مسافة بين نقطتين في إحداثيات العالم */
const ptDist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

/* تنسيق الأطوال بمنازل عشرية تتكيف مع الحجم — أرقام لاتينية أوضح فوق الرسم */
function fmtLen(v: number): string {
  const a = Math.abs(v);
  const d = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : 3;
  return v.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

/* رقم بإشارة للفروق ΔX وΔY */
const fmtSigned = (v: number) => `${v < 0 ? "-" : "+"}${fmtLen(Math.abs(v))}`;

/* هندسة القرصة: المسافة ومركز الإصبعين */
function pinchOf(m: Map<number, Pt>) {
  const [a, b] = [...m.values()];
  return {
    d: Math.hypot(b.x - a.x, b.y - a.y),
    cx: (a.x + b.x) / 2,
    cy: (a.y + b.y) / 2,
  };
}

/* ── فحص جهوزية العمال: ثلاث طبقات تحتمل البوابات الصارمة ──
   بعض بوابات المعاينة تمنع HEAD أو ترد عليه بغير 200 — والصفحة نفسها حُمّلت بـGET
   فنجرب: HEAD ← GET بنطاق بايتات ← GET كامل. نفشل فقط إن فشلت الثلاثة كلها */
const probeWorkerUrl = async (url: string): Promise<boolean> => {
  try {
    const r = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (r.ok) return true;
  } catch {
    /* البوابة رفضت HEAD — نكمل */
  }
  try {
    const r = await fetch(url, { headers: { Range: "bytes=0-0" }, cache: "no-store" });
    if (r.ok || r.status === 206) return true;
  } catch {
    /* نكمل للطبقة الثالثة */
  }
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (r.ok) return true;
  } catch {
    /* لا شيء نجح */
  }
  return false;
};

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

  /* ── وضع القياس ── */
  const [measure, setMeasure] = useState(false);
  const [mPts, setMPts] = useState<Pt[]>([]); /* نقاط بإحداثيات العالم */
  const [mCursor, setMCursor] = useState<Pt | null>(null);
  const [mScale, setMScale] = useState(1); /* عامل تحويل الوحدة */
  const [, setMFrame] = useState(0); /* إعادة رسم عند تغيّر العرض */
  const mPtsRef = useRef<Pt[]>([]);
  mPtsRef.current = mPts;
  const mDownRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const mPtrsRef = useRef<Map<number, Pt>>(new Map());
  const mPinchRef = useRef<{ d: number; cx: number; cy: number } | null>(null);
  const mPinchedRef = useRef(false);

  const isDwg = /\.dwg$/i.test(file.name);

  const getView = useCallback(() => {
    const mgr = mgrRef.current as { curView?: MeasureView } | null;
    return mgr?.curView &&
      typeof mgr.curView.screenToWorld === "function" &&
      typeof mgr.curView.worldToScreen === "function"
      ? mgr.curView
      : null;
  }, []);

  /* إحداثيات الشاشة المحلية للحاوية من حدث المؤشر */
  const evScreenPt = (e: { clientX: number; clientY: number }): Pt | null => {
    const box = boxRef.current;
    if (!box) return null;
    const r = box.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const screenToWorldSafe = (sp: Pt): Pt | null => {
    try {
      return getView()?.screenToWorld(sp) ?? null;
    } catch {
      return null;
    }
  };

  const worldToScreenSafe = (wp: Pt): Pt | null => {
    try {
      return getView()?.worldToScreen(wp) ?? null;
    } catch {
      return null;
    }
  };

  /* تمرير حدث عجلة للعارض تحته — التكبير يشتغل أثناء القياس */
  const dispatchWheel = (clientX: number, clientY: number, deltaY: number) => {
    const canvas = boxRef.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.dispatchEvent(
      new WheelEvent("wheel", {
        clientX,
        clientY,
        deltaX: 0,
        deltaY,
        deltaMode: 0,
        bubbles: true,
        cancelable: true,
      })
    );
  };

  /* ── تهيئة العارض وفتح الملف ── */
  useEffect(() => {
    let alive = true;
    /* ملف جديد = قياسات قديمة ملهاش لازمة */
    setMPts([]);
    setMCursor(null);
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
        const workersOk = await Promise.all([
          probeWorkerUrl(workerUrls.mtextRender),
          probeWorkerUrl(workerUrls.dwgParser),
        ]);
        if (!alive) return;
        if (!workersOk.every(Boolean))
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
        let ok: boolean;
        try {
          ok = await manager.openDocument(file.name, buf, {
            mode: AcEdOpenMode.Read,
          });
        } catch (openErr) {
          /* أخطاء المحرك تصل إنجليزية خام — نصنفها ونعطي رسالة عربية مفيدة.
           * worker_oom = انهيار wasm أثناء تحليل DWG معقد (خلل معروف في LibreDWG) */
          if (!alive) return;
          const msg = String(
            openErr instanceof Error ? openErr.message : openErr
          );
          const code =
            typeof openErr === "object" && openErr && "code" in openErr
              ? String((openErr as { code?: unknown }).code)
              : "";
          if (
            code === "worker_oom" ||
            /out of memory|memory access|oom/i.test(msg)
          )
            throw new Error("k:cad.openFailDwg");
          throw new Error("k:cad.openFail");
        }
        if (!alive) return;
        if (!ok)
          throw new Error(isDwg ? "k:cad.openFailDwg" : "k:cad.openFail");
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

  /* ── القياس: إعادة رسم دائمة أثناء الوضع — النقاط تلتصق بأماكنها في العالم مهما كبرت أو صغرت ── */
  useEffect(() => {
    if (!measure) return;
    let raf = 0;
    let last = "";
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const view = getView();
      if (!view) return;
      try {
        const a = view.worldToScreen({ x: 0, y: 0 });
        const key = `${a.x.toFixed(1)}|${a.y.toFixed(1)}`;
        if (key !== last) {
          last = key;
          setMFrame((f) => f + 1);
        }
      } catch {
        /* العرض لسه ما جهز */
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [measure, getView]);

  /* ── القياس: Escape يمسح النقاط — ولو مفيش نقاط يخرج من الوضع ── */
  useEffect(() => {
    if (!measure) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mPtsRef.current.length) {
        setMPts([]);
        setMCursor(null);
      } else {
        setMeasure(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [measure]);

  /* ── أزرار القياس ── */
  const toggleMeasure = () => {
    if (measure) {
      setMPts([]);
      setMCursor(null);
    }
    setMeasure(!measure);
  };

  const clearMeasure = () => {
    setMPts([]);
    setMCursor(null);
  };

  /* ── أحداث المؤشر على طبقة القياس ── */
  const onMeasurePointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    const sp = evScreenPt(e);
    if (!sp) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* أحداث اصطناعية من الاختبارات بتكسر الالتقاط */
    }
    mPtrsRef.current.set(e.pointerId, sp);
    if (mPtrsRef.current.size === 2) {
      mPinchedRef.current = true;
      mPinchRef.current = pinchOf(mPtrsRef.current);
    }
    mDownRef.current = { id: e.pointerId, x: sp.x, y: sp.y };
  };

  const onMeasurePointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const sp = evScreenPt(e);
    if (!sp) return;
    if (mPtrsRef.current.has(e.pointerId)) mPtrsRef.current.set(e.pointerId, sp);
    if (mPtrsRef.current.size === 2 && mPinchRef.current) {
      /* قرصة إصبعين = تكبير — بنحوّلها للعارض كحدث عجلة عند منتصف الإصبعين */
      const p = pinchOf(mPtrsRef.current);
      const prev = mPinchRef.current.d;
      if (prev > 0 && Math.abs(p.d - prev) > 2) {
        const box = boxRef.current?.getBoundingClientRect();
        if (box)
          dispatchWheel(
            box.left + p.cx,
            box.top + p.cy,
            ((prev - p.d) / prev) * 300
          );
        mPinchRef.current = p;
      }
      return;
    }
    if (mPtrsRef.current.size > 1) return;
    const w = screenToWorldSafe(sp);
    if (w) setMCursor(w);
  };

  const onMeasurePointerUp = (e: RPointerEvent<HTMLDivElement>) => {
    const sp = evScreenPt(e);
    const down = mDownRef.current;
    mDownRef.current = null;
    mPtrsRef.current.delete(e.pointerId);
    if (mPtrsRef.current.size < 2) mPinchRef.current = null;
    if (mPtrsRef.current.size > 0) return; /* لسه أصابع على الشاشة */
    const pinched = mPinchedRef.current;
    mPinchedRef.current = false;
    if (!sp || !down || down.id !== e.pointerId || pinched) return;
    if (Math.hypot(sp.x - down.x, sp.y - down.y) > 8) return; /* سحب مش نقرة */
    const w = screenToWorldSafe(sp);
    if (w) setMPts((p) => [...p, w]);
  };

  const onMeasurePointerCancel = (e: RPointerEvent<HTMLDivElement>) => {
    mPtrsRef.current.delete(e.pointerId);
    if (mPtrsRef.current.size < 2) mPinchRef.current = null;
    if (!mPtrsRef.current.size) {
      mPinchedRef.current = false;
      mDownRef.current = null;
    }
  };

  const forwardWheel = (e: RWheelEvent) => {
    dispatchWheel(e.clientX, e.clientY, e.deltaY);
  };

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

  /* ── حسابات القياس للإطار الحالي (إحداثيات العالم → شاشة) ── */
  const mScreen: (Pt | null)[] = measure ? mPts.map(worldToScreenSafe) : [];
  const mSegs: {
    ax: number;
    ay: number;
    bx: number;
    by: number;
    label: string;
  }[] = [];
  for (let i = 0; i + 1 < mScreen.length; i++) {
    const a = mScreen[i];
    const b = mScreen[i + 1];
    if (a && b)
      mSegs.push({
        ax: a.x,
        ay: a.y,
        bx: b.x,
        by: b.y,
        label: fmtLen(ptDist(mPts[i], mPts[i + 1]) * mScale),
      });
  }
  const mVertexes = mScreen.filter((p): p is Pt => !!p);
  const mRubberA =
    measure && mPts.length && mCursor
      ? worldToScreenSafe(mPts[mPts.length - 1])
      : null;
  const mRubberB = measure && mCursor ? worldToScreenSafe(mCursor) : null;

  /* زوج القياس الحالي: الشريط المطاطي حيًا أثناء الحركة — وعند التوقف نعرض آخر قطعة مكتملة */
  const rubberW: { a: Pt; b: Pt } | null =
    mCursor && mPts.length ? { a: mPts[mPts.length - 1], b: mCursor } : null;
  const rubberD = rubberW ? ptDist(rubberW.a, rubberW.b) : 0;
  const curW: { a: Pt; b: Pt } | null =
    rubberD > 1e-9
      ? rubberW
      : mPts.length > 1
        ? { a: mPts[mPts.length - 2], b: mPts[mPts.length - 1] }
        : null;
  const mCurD = curW ? ptDist(curW.a, curW.b) : null;
  const mCurAng =
    curW
      ? (Math.atan2(curW.b.y - curW.a.y, curW.b.x - curW.a.x) * 180) / Math.PI
      : null;
  const mTotalW =
    mPts.length > 1
      ? mPts.slice(1).reduce((s, p, i) => s + ptDist(mPts[i], p), 0)
      : 0;

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
            {status
              ? status.startsWith("k:")
                ? t(status.slice(2))
                : status
              : measure
                ? t("cad.measureHint")
                : t("cad.wheelHint")} · {t("ed.inBrowser")}
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
        {/* زر وضع القياس */}
        <button
          onClick={toggleMeasure}
          aria-label={t("cad.measure")}
          aria-pressed={measure}
          data-testid="cad-measure-btn"
          title={t("cad.measure")}
          disabled={!!error}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition disabled:opacity-40",
            measure
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25"
              : "border border-white/15 bg-white/5 text-slate-300 hover:text-white"
          )}
        >
          <Ruler className="size-4" aria-hidden />
          <span className="hidden sm:inline">{t("cad.measure")}</span>
        </button>
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

        {/* لوحة الطبقات — z-30 فوق طبقة القياس عشان تفضل قابلة للنقر أثناء القياس */}
        {showLayers && layers && (
          <div
            className="absolute bottom-4 right-4 top-4 z-30 flex w-64 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur"
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
        {/* ══ وضع القياس: طبقة التقاط النقرات + رسم الأبعاد ══ */}
        {measure && (
          <div
            className="absolute inset-0 z-20 cursor-crosshair"
            style={{ touchAction: "none" }}
            data-testid="cad-measure-layer"
            onPointerDown={onMeasurePointerDown}
            onPointerMove={onMeasurePointerMove}
            onPointerUp={onMeasurePointerUp}
            onPointerCancel={onMeasurePointerCancel}
            onWheel={forwardWheel}
            onContextMenu={(e) => e.preventDefault()}
          >
            <svg className="absolute inset-0 size-full overflow-visible">
              {mSegs.map((s, i) => (
                <g key={i}>
                  <line
                    x1={s.ax}
                    y1={s.ay}
                    x2={s.bx}
                    y2={s.by}
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    strokeDasharray="7 5"
                  />
                  <text
                    x={(s.ax + s.bx) / 2}
                    y={(s.ay + s.by) / 2 - 8}
                    textAnchor="middle"
                    fontSize={12.5}
                    fontWeight={800}
                    fill="#fde68a"
                    stroke="#0f172a"
                    strokeWidth={3.5}
                    paintOrder="stroke"
                    style={{ direction: "ltr" }}
                  >
                    {s.label}
                  </text>
                </g>
              ))}
              {mRubberA && mRubberB && (
                <line
                  x1={mRubberA.x}
                  y1={mRubberA.y}
                  x2={mRubberB.x}
                  y2={mRubberB.y}
                  stroke="#fbbf24"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  opacity={0.85}
                />
              )}
              {mVertexes.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={4.5}
                  fill="#fbbf24"
                  stroke="#78350f"
                  strokeWidth={1.5}
                />
              ))}
            </svg>
          </div>
        )}

        {/* ══ لوحة قراءات القياس ══ */}
        {measure && (
          <div
            className="absolute bottom-3 left-1/2 z-30 w-[min(94%,470px)] -translate-x-1/2 rounded-2xl border border-amber-400/25 bg-slate-950/95 p-3 shadow-2xl backdrop-blur"
            data-testid="cad-measure-chip"
          >
            <div className="flex items-center gap-2">
              <Ruler className="size-4 shrink-0 text-amber-400" aria-hidden />
              <p className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-300">
                {mCurD === null ? t("cad.mNone") : t("cad.measureHint")}
              </p>
              <button
                onClick={clearMeasure}
                aria-label={t("cad.mClear")}
                data-testid="cad-measure-clear"
                disabled={!mPts.length}
                className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-extrabold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                {t("cad.mClear")}
              </button>
              <button
                onClick={toggleMeasure}
                aria-label={t("cad.mExit")}
                data-testid="cad-measure-exit"
                className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-white/20"
              >
                {t("cad.mExit")}
              </button>
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="shrink-0">
                <p
                  className="font-extrabold leading-none text-amber-300"
                  data-testid="cad-measure-val"
                  style={{ direction: "ltr" }}
                >
                  <span className="text-2xl">
                    {mCurD !== null ? fmtLen(mCurD * mScale) : "—"}
                  </span>
                  <span className="ml-1 text-[11px] text-slate-400">
                    {t("cad.mUnit")}
                  </span>
                </p>
                {mCurD !== null && mScale !== 1 && (
                  <p
                    className="mt-1 text-[10px] text-slate-500"
                    style={{ direction: "ltr" }}
                  >
                    = {fmtLen(mCurD)} {t("cad.mUnit")} × {mScale}
                  </p>
                )}
              </div>
              <div
                className="text-left text-[10.5px] font-bold leading-relaxed text-slate-300"
                style={{ direction: "ltr" }}
              >
                <p>
                  {curW
                    ? `ΔX ${fmtSigned((curW.b.x - curW.a.x) * mScale)} · ΔY ${fmtSigned((curW.b.y - curW.a.y) * mScale)}`
                    : "ΔX — · ΔY —"}
                </p>
                <p>
                  {mCurAng !== null
                    ? `${t("cad.mAngle")} ${mCurAng.toFixed(1)}°`
                    : `${t("cad.mAngle")} —`}
                  {" · "}
                  {t("cad.mTotal")} {fmtLen(mTotalW * mScale)}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
              <label
                className="shrink-0 text-[10.5px] font-bold text-slate-400"
                htmlFor="cad-m-scale"
              >
                {t("cad.mScale")}
              </label>
              <input
                id="cad-m-scale"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={mScale}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setMScale(Number.isFinite(v) && v > 0 ? v : 1);
                }}
                data-testid="cad-measure-scale"
                className="w-20 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-center text-xs font-extrabold text-white outline-none focus:border-amber-400"
              />
              <span className="min-w-0 flex-1 truncate text-[10px] text-slate-500">
                {t("cad.mScaleHint")}
              </span>
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
