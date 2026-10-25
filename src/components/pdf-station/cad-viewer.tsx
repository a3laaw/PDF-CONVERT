"use client";

/* عارض الأوتوكاد — فتح DWG/DXF داخل المتصفح بدون أي خادم
   المحرك: @mlightcad/cad-simple-viewer (MIT) + libredwg-converter (WASM عامل ويب)
   الميزات: تكبير/تصغير/تحريك، لوحة طبقات بإظهار وإخفاء، تصدير PDF متجهي، طباعة مباشرة،
   تحديد منطقة معينة وطباعتها أو تصديرها PDF وحدها */

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
  Crop,
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

/* ── صناديق العالم للتحديد ── */
type WorldBox = { minX: number; minY: number; maxX: number; maxY: number };

/* عرض داخلي أعمق من MeasureView — للوصول إلى الرندر والتكبير لصندوق محدد */
type CadViewInternal = {
  width: number;
  height: number;
  screenToWorld: (p: Pt) => Pt;
  worldToScreen: (p: Pt) => Pt;
  zoomTo: (box: unknown, margin?: number) => void;
  _renderer?: {
    internalRenderer?: {
      render?: (...a: unknown[]) => unknown;
      domElement?: HTMLCanvasElement;
    };
  };
};

/* لقطة الكانفس مع عامل تحويل إحداثيات CSS إلى بكسلات المخزن */
type Capture = { snap: HTMLCanvasElement; sx: number; sy: number };

/* هل اللقطة فارغة تمامًا (كانفس WebGL مُسح) — فحص بالعيّنة */
function looksBlank(c: HTMLCanvasElement): boolean {
  try {
    const x = c.getContext("2d");
    if (!x) return true;
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let non = 0;
    const stride = Math.max(4, Math.floor(d.length / 4 / 300) * 4);
    for (let i = 0; i + 3 < d.length; i += stride)
      if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240) non++;
    return non < 2;
  } catch {
    return false;
  }
}

/* قلب الإضاءة مع حفظ الصبغة والتشبع (HSL) — الأداة الحقيقية في أوتوكاد عند الطباعة:
   الخلفية الداكنة تصبح بيضاء، الخطوط الفاتحة تصبح داكنة، والألوان تبقى بلونها */
function invertLightnessKeepHue(p: Uint8ClampedArray): void {
  for (let i = 0; i + 3 < p.length; i += 4) {
    const r = p[i] / 255;
    const g = p[i + 1] / 255;
    const b = p[i + 2] / 255;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const l = (mx + mn) / 2;
    const nl = 1 - l;
    const d = mx - mn;
    if (d === 0) {
      const v = Math.round(255 * nl);
      p[i] = v;
      p[i + 1] = v;
      p[i + 2] = v;
      continue;
    }
    if (nl === l) continue; /* رمادي 50% — لا يتغير */
    const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h: number;
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
    const q = nl < 0.5 ? nl * (1 + s) : nl + s - nl * s;
    const pp = 2 * nl - q;
    const f = (tt: number) => {
      let t = tt;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return pp + (q - pp) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return pp + (q - pp) * (2 / 3 - t) * 6;
      return pp;
    };
    p[i] = Math.round(255 * f(h + 1 / 3));
    p[i + 1] = Math.round(255 * f(h));
    p[i + 2] = Math.round(255 * f(h - 1 / 3));
  }
}

/* هل خلفية اللقطة داكنة؟ عيّنات من زوايا الكانفس — الخلفية موحدة فتكفي الزوايا */
function hasDarkBackground(snap: HTMLCanvasElement): boolean {
  try {
    const x = snap.getContext("2d");
    if (!x) return false;
    const w = snap.width;
    const h = snap.height;
    let dark = 0;
    const pts = [
      [2, 2],
      [w - 3, 2],
      [2, h - 3],
      [w - 3, h - 3],
      [w >> 1, 2],
      [2, h >> 1],
      [w - 3, h >> 1],
      [w >> 1, h - 3],
    ];
    for (const [px, py] of pts) {
      const d = x.getImageData(px, py, 1, 1).data;
      const l =
        (Math.max(d[0], d[1], d[2]) + Math.min(d[0], d[1], d[2])) / 2 / 255;
      if (l < 0.5) dark++;
    }
    return dark >= 5;
  } catch {
    return false;
  }
}

/* قصّ مستطيل (بإحداثيات CSS) من لقطة كاملة — خلفية بيضاء أمانًا للشفافية،
   وقلب إضاءة تلقائي لو الخلفية داكنة (ناتج جاهز للطباعة على ورق أبيض) */
function cropCapture(
  cap: Capture,
  p1: Pt,
  p2: Pt
): { url: string; w: number; h: number } | null {
  const { snap, sx, sy } = cap;
  let rx = Math.round(Math.min(p1.x, p2.x) * sx);
  let ry = Math.round(Math.min(p1.y, p2.y) * sy);
  let rw = Math.round(Math.abs(p2.x - p1.x) * sx);
  let rh = Math.round(Math.abs(p2.y - p1.y) * sy);
  rx = Math.max(0, Math.min(rx, snap.width - 2));
  ry = Math.max(0, Math.min(ry, snap.height - 2));
  rw = Math.max(2, Math.min(rw, snap.width - rx));
  rh = Math.max(2, Math.min(rh, snap.height - ry));
  if (rw < 8 || rh < 8) return null;
  const out = document.createElement("canvas");
  out.width = rw;
  out.height = rh;
  const x = out.getContext("2d", { willReadFrequently: true });
  if (!x) return null;
  x.fillStyle = "#ffffff";
  x.fillRect(0, 0, rw, rh);
  x.drawImage(snap, rx, ry, rw, rh, 0, 0, rw, rh);
  if (hasDarkBackground(snap)) {
    try {
      const d = x.getImageData(0, 0, rw, rh);
      invertLightnessKeepHue(d.data);
      x.putImageData(d, 0, 0);
    } catch {
      /* بعض البيئات تمنع قراءة بكسلات كانفس WebGL — نُبقي اللقطة كما هي */
    }
  }
  const url = out.toDataURL("image/png");
  if (!url || url.length < 2000) return null;
  return { url, w: rw, h: rh };
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

/* ── شمّ إصدار DWG من الترويسة (أول 6 بايتات) — لعرضه للمستخدم وتشخيص الفشل ── */
const DWG_VERSIONS: Record<string, string> = {
  AC1012: "13",
  AC1014: "14",
  AC1015: "2000",
  AC1018: "2004",
  AC1021: "2007",
  AC1024: "2010",
  AC1027: "2013",
  AC1032: "2018",
};

function dwgVersionLabel(buf: ArrayBuffer): string {
  try {
    const head = new TextDecoder("latin1").decode(buf.slice(0, 6));
    return DWG_VERSIONS[head.trim()] || "";
  } catch {
    return "";
  }
}

/* حجم مقروء — وحدات لاتينية مفهومة بكل اللغات */
function fmtSizeText(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/* تصنيف أخطاء فتح DWG — لاختيار الرسالة وتقرير إعادة المحاولة */
type OpenFailKind = "oom" | "timeout" | "invalid" | "crash";

function classifyOpenError(err: unknown): OpenFailKind {
  const msg = String(err instanceof Error ? err.message : err);
  const code =
    typeof err === "object" && err && "code" in err
      ? String((err as { code?: unknown }).code)
      : "";
  if (code === "worker_oom" || /out of memory|memory access|oom/i.test(msg))
    return "oom";
  if (/timeout|timed out/i.test(msg) || /timeout/i.test(code)) return "timeout";
  if (/invalid|not a valid|unsupported/i.test(msg) || /invalid/i.test(code))
    return "invalid";
  return "crash";
}

/* ── ضجيج الكيانات التالفة: المكتبة ترمي Illegal Parameters عند كيانات معطوبة
   (قوس/سبلاين بصفر قطر أو نقاط متطابقة) أثناء تحويل الكيانات ثم تتجاهله عمدًا
   وتكمل الفتح — فشل مرحلة ENTITY غير حرج بالتصميم (AcDbDatabaseConverter:
   «Tasks to convert entities are not critical… we can still continue»).
   نهدّئ هذه السطور حتى لا تظهر كأخطاء في الكونسول، مع إبقاء أنماط الانهيار
   القاتلة (نفاد ذاكرة wasm وغيرها) ظاهرة كما هي */
const FATAL_WASM_RE =
  /memory access out of bounds|worker_oom|out of memory|abort\(|runtime abort/i;
const BENIGN_ENTITY_STAGE_RE = /conversion stage ['"]?ENTITY['"]?/i;
/* رسالة هندسة الكيانات المعطوبة نفسها (AcCmErrors.ILLEGAL_PARAMETERS =
   new ReferenceError('Illegal Parameters')): مسارات أخرى غير مرحلة ENTITY
   تلتقطه وتسجله بصيغة بلا «conversion stage» فكانت تفلت من الفلتر —
   AcTrView2d سطر 4109 «Deferred entity geometry failed» و2461 «Transient
   entity geometry failed» و1526 «Failed to convert overlay entity» و3236
   و3612 — وكلها try/catch داخل المكتبة تكمل بعدها الرسم عادي (بلاغ المستخدم
   ×4 كان منها). مطابقة الرسالة ذاتها تكفي: تطبيقنا لا يرمي هذا النص أبدًا،
   والأنماط القاتلة تبقى ظاهرة */
const BENIGN_ILLEGAL_PARAMS_RE = /\billegal\s+parameters\b/i;

/* تنسيق وسيط سجل: الرمز يُلحق فقط عند وجوده — إلحاقه الأعمى كان يترك
   «code:» فارغة بعد سطر المرحلة فيلتقط الاستخراج اسم الخطأ التالي بدله
   (كان يعطي code:"Error" بدل code:"worker_oom" في تصنيف الانهيارات) */
const fmtErrArg = (a: unknown): string => {
  const m = a as { message?: string; name?: string; code?: string };
  const base = `${m?.name || ""} ${m?.message || a}`;
  return m?.code ? `${base} code:${m.code}` : base;
};

/* فلتر دائم يُثبَّت مرة واحدة لكل جلسة: تحويل الكيانات قد يستمر بعد إقفال
   نافذة المراقبة (تحويل مؤجل للنصوص والرموز) فتظهر سطور الضجيج نفسها لاحقًا */
let noiseFilterInstalled = false;
function installCadNoiseFilter(): void {
  if (noiseFilterInstalled || typeof window === "undefined") return;
  noiseFilterInstalled = true;
  const orig = console.error.bind(console);
  const quiet = console.debug?.bind(console) ?? orig;
  console.error = (...args: unknown[]) => {
    try {
      const s = args.map(fmtErrArg).join(" ");
      if (
        (BENIGN_ENTITY_STAGE_RE.test(s) || BENIGN_ILLEGAL_PARAMS_RE.test(s)) &&
        !FATAL_WASM_RE.test(s)
      ) {
        quiet(...args);
        return;
      }
    } catch {
      /* السجل لا يكسر التدفق */
    }
    orig(...args);
  };
}
installCadNoiseFilter();

/* شبكة أمان للرفض غير الملتقط: بعض المسارات المؤجلة قد تمرّر نفس الخطأ السليم
   كوعد مرفوض لا أحد يمسكه («Uncaught (in promise) ReferenceError») — نهدّئه
   هنا أيضًا بنفس الشرط الصارم، وأي رفض آخر يبقى ظاهرًا كما هو */
let benignRejectionNetInstalled = false;
function installBenignRejectionNet(): void {
  if (benignRejectionNetInstalled || typeof window === "undefined") return;
  benignRejectionNetInstalled = true;
  window.addEventListener("unhandledrejection", (ev) => {
    try {
      const r = ev?.reason as { message?: string } | string | undefined;
      const msg = typeof r === "string" ? r : r?.message;
      if (
        msg &&
        BENIGN_ILLEGAL_PARAMS_RE.test(msg) &&
        !FATAL_WASM_RE.test(msg)
      ) {
        ev.preventDefault();
        (console.debug?.bind(console) ?? console.error)(
          "[cad] رفض سليم من محرك الرسم (كيان معطوب تم تجاهله):",
          msg
        );
      }
    } catch {
      /* الشبكة لا تكسر التدفق */
    }
  });
}
installBenignRejectionNet();

/* مراقبة سجل الأخطاء: المكتبة تسجّل فشل التحليل في console.error لكن وعد openDocument
   لا يُحسم أبدًا عند انهيار عامل wasm (worker_oom) — فتظهر دوّامة أبدية بدل رسالة الخطأ.
   نكتشف سطر "Error occurred in conversion stage" ونرفض فورًا برمز الخطأ —
   إلا فشل مرحلة ENTITY غير القاتل: المكتبة تكمل بعده تحويل باقي الكيانات والملف
   يُفتح سليمًا، ورفضه كان يُسقط ملفات صالحة فيها كيانات تالفة */
function watchStageFailure(onFail: (code: string) => void): () => void {
  const orig = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      const s = args.map(fmtErrArg).join(" ");
      if (/conversion stage/i.test(s)) {
        const benign = BENIGN_ENTITY_STAGE_RE.test(s) && !FATAL_WASM_RE.test(s);
        if (benign) {
          /* كيان تالف واحد يُسقَط والباقي يكمل — سجل هادئ لا رفض ولا ضجيج */
          (console.debug?.bind(console) ?? orig)(...args);
          return;
        }
        const m = /code:\s*"?([A-Za-z_]+)"?/.exec(s);
        onFail(m ? m[1] : "worker_error");
      }
    } catch {
      /* السجل لا يكسر التدفق */
    }
    orig(...args);
  };
  return () => {
    console.error = orig;
  };
}

/* ── تحصين التكبير في محرك العارض: zoomTo في AcTrView2d يصل إلى
   this.activeLayoutView.zoomTo(…) بلا فحص — بينما screenToWorld/worldToScreen
   محميتان في المكتبة نفسها بفحص مشابه. أثناء تمريرة الملاءمة التقدمية عند فتح
   الملف أو تبديل التخطيط أو إغلاق العارض أثناء ملاءمة مؤجلة، قد لا يوجد تخطيط
   نشط بعد — فيرمي «Cannot read properties of undefined (reading 'zoomTo')»
   متكررًا في الكونسول. نغلّفه بالجذر: لا تخطيط نشط = لا شيء يُكبَّر */
let zoomProtoHardened = false;

type HardenedZoom = (
  this: { activeLayoutView?: unknown },
  box: unknown,
  margin?: number
) => void;

function hardenZoomOnProto(proto: object | null): boolean {
  if (!proto || proto === Object.prototype) return false;
  const p = proto as Record<string, unknown> & { __zoomSafe?: boolean };
  if (typeof p.zoomTo === "function") {
    if (!p.__zoomSafe) {
      const orig = p.zoomTo as HardenedZoom;
      p.zoomTo = function (
        this: { activeLayoutView?: unknown },
        box: unknown,
        margin?: number
      ) {
        let ready = false;
        try {
          ready = this?.activeLayoutView != null;
        } catch {
          ready = false;
        }
        if (!ready) return;
        orig.call(this, box, margin);
      };
      p.__zoomSafe = true;
    }
    zoomProtoHardened = true;
    return true;
  }
  return hardenZoomOnProto(Object.getPrototypeOf(proto));
}

/* ── تحصين عائلة التفاعلات الأخرى بنفس النمط: المكتبة تحمي screenToWorld/
   worldToScreen وتنسى بقية الدوال التي تصل إلى activeLayoutView مباشرة:
   · pick → activeLayoutView.pointToBox(…) — «reading 'pointToBox'» عند النقر
     أثناء سباق تهيئة/تفكيك التخطيط (بلاغ المستخدم الجديد)
   · flyTo → activeLayoutView.flyTo(…) بلا فحص
   · مُعادِل mode يكتب بلا فحص (القارئ محميّ في المكتبة نفسها) ومُعادِل center
     قارئه وكاتبه بلا فحص
   الجرد الكامل للاستخدامات غير المحمية في AcTrView2d: 797 (مُغطّى بتحصين
   _progressiveOpenFit) و907 و1284/1287 و1808 (zoomTo محصّن) و1989
   و2178-2215 (pick) */
type GuardedFn = (...args: unknown[]) => unknown;
type ViewLike = { activeLayoutView?: unknown };

const viewReady = (self: unknown): boolean => {
  try {
    return (self as ViewLike | null)?.activeLayoutView != null;
  } catch {
    return false;
  }
};

function guardVoidMethod(
  p: Record<string, unknown>,
  key: string,
  flag: string
): boolean {
  const orig = p[key];
  if (typeof orig !== "function" || p[flag] === true)
    return typeof orig === "function";
  p[key] = function (this: ViewLike, ...args: unknown[]) {
    if (!viewReady(this)) return undefined;
    return (orig as GuardedFn).apply(this, args);
  };
  p[flag] = true;
  return true;
}

/* pick يعيد مصفوفة النتائج — عند غياب التخطيط النشط لا شيء يُنتقى */
function guardPick(p: Record<string, unknown>): boolean {
  const orig = p.pick;
  if (typeof orig !== "function" || p.__pickSafe === true)
    return typeof orig === "function";
  p.pick = function (this: ViewLike, ...args: unknown[]) {
    if (!viewReady(this)) return [];
    return (orig as GuardedFn).apply(this, args);
  };
  p.__pickSafe = true;
  return true;
}

function guardAccessors(
  p: Record<string, unknown>,
  key: string,
  flag: string,
  fallback: unknown,
  guardSetOnly: boolean
): boolean {
  const desc = Object.getOwnPropertyDescriptor(p, key);
  if (!desc || p[flag] === true) return !!desc;
  const next: PropertyDescriptor = {
    configurable: desc.configurable,
    enumerable: desc.enumerable,
  };
  if (desc.get) {
    if (guardSetOnly) {
      next.get = desc.get;
    } else {
      const get = desc.get;
      next.get = function (this: ViewLike) {
        if (!viewReady(this)) return fallback;
        return get.call(this);
      };
    }
  }
  if (desc.set) {
    const set = desc.set;
    next.set = function (this: ViewLike, v: unknown) {
      if (!viewReady(this)) return;
      set.call(this, v);
    };
  }
  try {
    Object.defineProperty(p, key, next);
    p[flag] = true;
    return true;
  } catch {
    return false;
  }
}

function hardenCadInteractions(proto: object | null): boolean {
  if (!proto || (proto as unknown) === Object.prototype) return false;
  const p = proto as Record<string, unknown>;
  if (typeof p.pick !== "function" && typeof p.flyTo !== "function")
    return false; /* ليس صنف العارض */
  let any = false;
  if (guardPick(p)) any = true;
  if (guardVoidMethod(p, "flyTo", "__flySafe")) any = true;
  if (guardAccessors(p, "mode", "__modeSafe", undefined, true)) any = true;
  if (guardAccessors(p, "center", "__centerSafe", null, false)) any = true;
  return any;
}

async function hardenCadZoomTo(): Promise<void> {
  if (zoomProtoHardened) return;
  try {
    const mod = await import("@mlightcad/cad-simple-viewer");
    const proto = (mod as { AcTrView2d?: { prototype?: object } }).AcTrView2d
      ?.prototype;
    if (proto) {
      hardenZoomOnProto(proto);
      hardenCadInteractions(proto);
    }
  } catch {
    /* المكتبة غير جاهزة بعد — تُجرَّب مع الفتح القادم */
  }
}

/* تحصين على مستوى النسخة: إن تعذّر الوصول للصنف نمشي سلسلة نماذجه بحثًا عن
   zoomTo، ونغلّف دوال الملاءمة التقدمية المخزّنة على النسخة — مرجعها المغلق
   يصل إلى activeLayoutView.zoomTo مباشرة فيرمي عند غياب التخطيط */
function hardenViewInstance(view: unknown): void {
  if (!view || typeof view !== "object") return;
  if (!zoomProtoHardened) {
    const pr = Object.getPrototypeOf(view);
    hardenZoomOnProto(pr);
    hardenCadInteractions(pr);
  }
  const fit = (view as { _progressiveOpenFit?: object })._progressiveOpenFit;
  const f = fit as Record<string, unknown> & { __fitSafe?: boolean };
  if (f && !f.__fitSafe) {
    for (const k of Object.keys(f)) {
      const fn = f[k];
      if (typeof fn !== "function") continue;
      f[k] = function (...args: unknown[]) {
        try {
          return (fn as (...a: unknown[]) => unknown).apply(fit, args);
        } catch {
          /* ملاءمة على تخطيط غير جاهز — تُهمل بلا ضجيج */
        }
      };
    }
    f.__fitSafe = true;
  }
}

export function CadViewer({ fileName, file, onClose }: Props) {
  const { t } = useI18n();
  const boxRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("__loading__");
  const [error, setError] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<string | null>(null); /* «DWG 2013 · 12.4MB» */
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

  /* ── وضع تحديد منطقة (للطباعة أو التصدير PDF) ── */
  const [selectMode, setSelectMode] = useState(false);
  const [selBox, setSelBox] = useState<WorldBox | null>(null); /* بإحداثيات العالم */
  const [selDrag, setSelDrag] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const selBoxRef = useRef<WorldBox | null>(null);
  selBoxRef.current = selBox;
  const selDownRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const selPtrsRef = useRef<Map<number, Pt>>(new Map());
  const selPinchRef = useRef<{ d: number; cx: number; cy: number } | null>(null);
  const selPinchedRef = useRef(false);

  const isDwg = /\.dwg$/i.test(file.name);
  /* عدّاد إعادة فتح يدوي — زر «أعد المحاولة» في حوار الخطأ يعيد تشغيل دورة الفتح كاملة */
  const [openTick, setOpenTick] = useState(0);

  const getView = useCallback(() => {
    const mgr = mgrRef.current as { curView?: MeasureView } | null;
    return mgr?.curView &&
      typeof mgr.curView.screenToWorld === "function" &&
      typeof mgr.curView.worldToScreen === "function"
      ? mgr.curView
      : null;
  }, []);

  const getViewFull = useCallback((): CadViewInternal | null => {
    const mgr = mgrRef.current as { curView?: CadViewInternal } | null;
    const v = mgr?.curView;
    /* تحصين احتياطي على النسخة إن لم يكتمل تحصين الصنف (best-effort، مرة واحدة) */
    if (v) hardenViewInstance(v);
    return v && typeof v.screenToWorld === "function" && typeof v.zoomTo === "function"
      ? v
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
    setFileMeta(null);
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
        /* تحصين zoomTo قبل إنشاء أي عارض — يحيّد خطأ «reading 'zoomTo'»
         * القادم من ملاءمة المكتبة التقدمية أثناء الفتح نفسه */
        await hardenCadZoomTo();
        /* مدير واحد في الجلسة — نُصفّي القديم لنربط الكانفس بالحاوية الجديدة.
         * قبل التدمير: تحصين دوال الملاءمة المؤجلة على النسخة القديمة — إغلاق
         * العارض أثناء ملاءمة معلّقة كان يرمي «reading 'zoomTo'» في الكونسول */
        const existing = simple.AcApDocManager.tryGetInstance();
        if (existing) {
          try {
            hardenViewInstance(
              (existing as { curView?: unknown }).curView
            );
          } catch {
            /* لا جلسة نشطة — لا شيء يحتاج تحصينًا */
          }
          await existing.destroy();
        }
        /* DWG عبر LibreDWG (WASM) — وDXF عبر محوّل dxf-json — كلاهما مجاني.
         * مهلة صريحة 5 دقائق: الافتراضي يسقّف عند دقيقتين فتشمل الملفات الكبيرة قبل اكتمال التحليل */
        const { AcDbLibreDwgConverter } = await import(
          "@mlightcad/libredwg-converter"
        );
        AcDbDatabaseConverterManager.instance.register(
          AcDbFileType.DWG,
          new AcDbLibreDwgConverter({
            convertByEntityType: false,
            useWorker: true,
            parserWorkerUrl: dwgParserUrl,
            timeout: 300000,
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
            timeout: 300000,
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
        /* معلومات الملف للعرض: الإصدار والحجم — تبقى ظاهرة في رسائل الخطأ أيضًا */
        const ver = isDwg ? dwgVersionLabel(buf) : "";
        const sizeText = fmtSizeText(buf.byteLength);
        if (isDwg && ver) {
          setFileMeta(`DWG ${ver} · ${sizeText}`);
          setStatus(t("cad.readingDwgInfo", { version: ver, size: sizeText }));
        }
        /* نسخة احتياطية للبيانات — openDocument قد تنقل المخزن للعامل فتنفصل */
        const retryBuf = buf.slice(0);
        const { AcEdOpenMode } = await import("@mlightcad/cad-simple-viewer");
        const openFailKey = (kind: OpenFailKind) =>
          !isDwg
            ? "k:cad.openFail"
            : kind === "timeout"
              ? "k:cad.openFailTimeout"
              : kind === "invalid"
                ? "k:cad.openFailInvalid"
                : "k:cad.openFailDwg";
        let ok = false;
        let failKind: OpenFailKind = "crash";
        /* محاولتان: أخطاء العمال العابرة (سباقات التهيئة/النقل) تعتذر غالبًا من الثانية.
         * كل محاولة ملفوفة بحارسين: مراقبة سجل فشل التحليل (الوعد لا يُحسم عند انهيار
         * العامل) وحارس زمني شامل 5.5 د فوق مهلة المحوّل */
        const attemptOpen = (buffer: ArrayBuffer) =>
          new Promise<boolean>((resolve, reject) => {
            let settled = false;
            const finish = (fn: () => void) => {
              if (settled) return;
              settled = true;
              stopWatch();
              clearTimeout(guard);
              fn();
            };
            const stopWatch = watchStageFailure((code) => {
              finish(() =>
                reject(
                  Object.assign(new Error(`stage failure: ${code}`), { code })
                )
              );
            });
            const guard = setTimeout(() => {
              finish(() => reject(new Error("open watchdog timeout")));
            }, 330000);
            manager
              .openDocument(file.name, buffer, { mode: AcEdOpenMode.Read })
              .then((v) => finish(() => resolve(v)))
              .catch((e) => finish(() => reject(e)));
          });
        for (let attempt = 0; attempt < 2 && !ok; attempt++) {
          try {
            if (attempt > 0) {
              setStatus("k:cad.retryOpen");
              await new Promise((r) => setTimeout(r, 900));
              if (!alive) return;
            }
            ok = await attemptOpen(attempt === 0 ? buf : retryBuf);
          } catch (openErr) {
            /* أخطاء المحرك تصل إنجليزية خام — نصنفها ونعطي رسالة عربية مفيدة */
            if (!alive) return;
            failKind = classifyOpenError(openErr);
            /* الملف غير صالح أو انتهت المهلة — إعادة المحاولة لا تفيد */
            if (failKind === "invalid" || failKind === "timeout") break;
            ok = false;
          }
        }
        if (!alive) return;
        if (!ok) throw new Error(openFailKey(failKind));
        /* تحصين مبكر لدوال الملاءمة المؤجلة على النسخة الجديدة — تمريرة الملاءمة
         * التقدمية قد تُطلَق بعد الحسم مباشرة بينما التخطيط النشط لم يُسجَّل بعد */
        try {
          hardenViewInstance(
            (manager as unknown as { curView?: unknown }).curView
          );
        } catch {
          /* curView غير متاح بعد — التحصين الاحتياطي في getViewFull يكفي */
        }
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
  }, [file, openTick]);

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

  /* ── أحداث المؤشر على طبقة التحديد: سحب = مستطيل، قرصة = تكبير ── */
  const onSelectPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    const sp = evScreenPt(e);
    if (!sp) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* أحداث اصطناعية من الاختبارات بتكسر الالتقاط */
    }
    selPtrsRef.current.set(e.pointerId, sp);
    if (selPtrsRef.current.size === 2) {
      selPinchedRef.current = true;
      selPinchRef.current = pinchOf(selPtrsRef.current);
      setSelDrag(null);
      selDownRef.current = null;
      return;
    }
    selDownRef.current = { id: e.pointerId, x: sp.x, y: sp.y };
    setSelDrag({ x1: sp.x, y1: sp.y, x2: sp.x, y2: sp.y });
  };

  const onSelectPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const sp = evScreenPt(e);
    if (!sp) return;
    if (selPtrsRef.current.has(e.pointerId)) selPtrsRef.current.set(e.pointerId, sp);
    if (selPtrsRef.current.size === 2 && selPinchRef.current) {
      const p = pinchOf(selPtrsRef.current);
      const prev = selPinchRef.current.d;
      if (prev > 0 && Math.abs(p.d - prev) > 2) {
        const box = boxRef.current?.getBoundingClientRect();
        if (box)
          dispatchWheel(
            box.left + p.cx,
            box.top + p.cy,
            ((prev - p.d) / prev) * 300
          );
        selPinchRef.current = p;
      }
      return;
    }
    if (selPtrsRef.current.size > 1) return;
    setSelDrag((d) => (d ? { ...d, x2: sp.x, y2: sp.y } : d));
  };

  const onSelectPointerUp = (e: RPointerEvent<HTMLDivElement>) => {
    const sp = evScreenPt(e);
    const down = selDownRef.current;
    selDownRef.current = null;
    selPtrsRef.current.delete(e.pointerId);
    if (selPtrsRef.current.size < 2) selPinchRef.current = null;
    if (selPtrsRef.current.size > 0) return; /* لسه أصابع على الشاشة */
    const pinched = selPinchedRef.current;
    selPinchedRef.current = false;
    const drag = selDrag;
    setSelDrag(null);
    if (!sp || !down || down.id !== e.pointerId || pinched || !drag) return;
    if (Math.hypot(sp.x - down.x, sp.y - down.y) < 8) return; /* نقرة مش سحب */
    const w1 = screenToWorldSafe({ x: Math.min(drag.x1, sp.x), y: Math.min(drag.y1, sp.y) });
    const w2 = screenToWorldSafe({ x: Math.max(drag.x1, sp.x), y: Math.max(drag.y1, sp.y) });
    if (!w1 || !w2) return;
    setSelBox({
      minX: Math.min(w1.x, w2.x),
      minY: Math.min(w1.y, w2.y),
      maxX: Math.max(w1.x, w2.x),
      maxY: Math.max(w1.y, w2.y),
    });
  };

  const onSelectPointerCancel = (e: RPointerEvent<HTMLDivElement>) => {
    selPtrsRef.current.delete(e.pointerId);
    if (selPtrsRef.current.size < 2) selPinchRef.current = null;
    if (!selPtrsRef.current.size) {
      selPinchedRef.current = false;
      selDownRef.current = null;
      setSelDrag(null);
    }
  };

  /* ── القياس والتحديد: Escape يمسح الحالي — ولو مفيش شيء يخرج من الوضع ── */
  useEffect(() => {
    if (!measure && !selectMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectMode) {
        if (selBoxRef.current) {
          setSelBox(null);
        } else {
          setSelectMode(false);
          setSelDrag(null);
        }
        return;
      }
      if (mPtsRef.current.length) {
        setMPts([]);
        setMCursor(null);
      } else {
        setMeasure(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [measure, selectMode]);

  /* ── القياس: إعادة رسم دائمة أثناء الوضعين — الأشياء المرسومة تلتصق بأماكنها في العالم ── */
  useEffect(() => {
    if (!measure && !selectMode) return;
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
  }, [measure, selectMode, getView]);

  /* ── أزرار القياس ── */
  const toggleMeasure = () => {
    if (measure) {
      setMPts([]);
      setMCursor(null);
    } else {
      /* دخول القياس يغلق وضع التحديد — وضع واحد نشط في كل وقت */
      setSelectMode(false);
      setSelBox(null);
      setSelDrag(null);
    }
    setMeasure(!measure);
  };

  /* ── أزرار تحديد المنطقة ── */
  const toggleSelect = () => {
    if (selectMode) {
      setSelectMode(false);
      setSelBox(null);
      setSelDrag(null);
    } else {
      /* دخول التحديد يغلق القياس */
      setMeasure(false);
      setMPts([]);
      setMCursor(null);
      setSelBox(null);
      setSelDrag(null);
      setSelectMode(true);
    }
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

  /* ── التقاط إطار مضمون من كانفس WebGL ──
     العارض يُنشئ السياق بـ preserveDrawingBuffer:false — أي قراءة خارج مهمة الرسم
     تعطي صورة فارغة (مثبت بالفحص). الحل: نغلّف render الداخلي ونقرأ داخل نفس
     مهمة الرسم — البكسلات سليمة حتميًا. captureOn = رقم الإطار المطلوب التقاطه
     (2 = بعد نبضة الرجوع في زوج عجلة متعاكِس، 1 = أول إطار مباشرة) ── */
  const captureFrame = useCallback(
    (opts?: { trigger?: () => void; captureOn?: number }): Promise<Capture | null> => {
      const view = getViewFull();
      const ir = view?._renderer?.internalRenderer;
      const canvas =
        (boxRef.current?.querySelector("canvas") as HTMLCanvasElement | null) ??
        ir?.domElement ??
        null;
      if (!view || !canvas) return Promise.resolve(null);
      const readNow = (): Capture | null => {
        try {
          const c2 = document.createElement("canvas");
          c2.width = canvas.width;
          c2.height = canvas.height;
          const x = c2.getContext("2d");
          if (!x) return null;
          x.fillStyle = "#ffffff";
          x.fillRect(0, 0, c2.width, c2.height);
          x.drawImage(canvas, 0, 0);
          if (looksBlank(c2)) return null;
          return {
            snap: c2,
            sx: c2.width / Math.max(1, canvas.clientWidth || c2.width),
            sy: c2.height / Math.max(1, canvas.clientHeight || c2.height),
          };
        } catch {
          return null;
        }
      };
      const captureOn = Math.max(1, opts?.captureOn ?? 1);
      return new Promise<Capture | null>((resolve) => {
        let settled = false;
        let n = 0;
        let orig: ((...a: unknown[]) => unknown) | null = null;
        const finish = (v: Capture | null) => {
          if (settled) return;
          settled = true;
          if (orig && ir) {
            try {
              ir.render = orig;
            } catch {
              /* لا شيء */
            }
          }
          resolve(v);
        };
        if (ir && typeof ir.render === "function") {
          orig = ir.render.bind(ir);
          ir.render = function (...args: unknown[]) {
            const out = orig ? orig.apply(ir, args) : undefined;
            n++;
            if (!settled && n >= captureOn) finish(readNow());
            return out;
          };
        }
        let tries = 0;
        const attempt = () => {
          if (settled) return;
          tries++;
          /* بعد 4 محاولات نقرأ مباشرة — بعض البناءات تسمح بذلك */
          if (tries > 4) {
            finish(readNow());
            return;
          }
          n = 0;
          try {
            opts?.trigger?.();
          } catch {
            /* الزناد فشل — المحاولة التالية */
          }
          window.setTimeout(attempt, 750);
        };
        attempt();
      });
    },
    [getViewFull]
  );

  /* نبضة عجلة متعاكِسة في مركز الرسم: إطار جديد بلا أي تغيير يُرى
     (التكبير حول نفس النقطة بمعامل ومعاكسه = نفس الكاميرا تمامًا) */
  const wheelPairTrigger = useCallback(() => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    dispatchWheel(cx, cy, -50);
    window.setTimeout(() => dispatchWheel(cx, cy, 50), 90);
    /* المحاولات التالية لو المُصيّر جمع النبضتين في إطار واحد */
    window.setTimeout(() => dispatchWheel(cx, cy, -50), 300);
    window.setTimeout(() => dispatchWheel(cx, cy, 50), 380);
  }, []);

  /* نافذة الطباعة المشتركة: صورة PNG داخل صفحة بيضاء تطبع فور جاهزيتها */
  const openPrintWindow = useCallback(
    (url: string) => {
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
    },
    [fileName, t]
  );

  /* صناديق هندسية للتحديد: صندوق التحديد + صندوق الكاميرا الحالية للرجوع */
  const buildSelGeoms = useCallback(async () => {
    const view = getViewFull();
    const sel = selBoxRef.current;
    if (!view || !view.width || !view.height || !sel) return null;
    const { AcGeBox2d, AcGeVector2d } = await import("@mlightcad/geometry-engine");
    const tl = view.screenToWorld({ x: 0, y: 0 });
    const br = view.screenToWorld({ x: view.width, y: view.height });
    const saved = new AcGeBox2d().expandByPoint(tl).expandByPoint(br);
    const selGeom = new AcGeBox2d(
      new AcGeVector2d(Math.min(sel.minX, sel.maxX), Math.min(sel.minY, sel.maxY)),
      new AcGeVector2d(Math.max(sel.minX, sel.maxX), Math.max(sel.minY, sel.maxY))
    );
    return { view, saved, selGeom } as const;
  }, [getViewFull]);

  /* ── طباعة مباشرة: لقطة مضمونة للعرض الحالي في نافذة طباعة (بخلفية بيضاء) ── */
  const printView = useCallback(async () => {
    if (busy) return;
    setBusy("print");
    try {
      const cap = await captureFrame({ trigger: wheelPairTrigger, captureOn: 2 });
      const crop = cap
        ? cropCapture(
            cap,
            { x: 0, y: 0 },
            { x: cap.snap.width / cap.sx, y: cap.snap.height / cap.sy }
          )
        : null;
      if (!crop) throw new Error("لقطة فارغة");
      openPrintWindow(crop.url);
    } catch {
      toast.info(t("cad.printFallback"));
    } finally {
      setBusy("");
    }
  }, [busy, captureFrame, wheelPairTrigger, openPrintWindow, t]);

  /* ── تصدير المنطقة المحددة PDF: تكبير للمنطقة ← التقاط ← قصّ دقيق ← pdf-lib ── */
  const exportSelectionPdf = useCallback(async () => {
    if (busy || !selBox) return;
    setBusy("selpdf");
    let restore: (() => void) | null = null;
    try {
      const g = await buildSelGeoms();
      if (!g) throw new Error("noselection");
      restore = () => {
        try {
          g.view.zoomTo(g.saved, 1);
        } catch {
          /* الرجوع أفضل جهد */
        }
      };
      /* تمريرة الجودة: التكبير حتى يملأ التحديد الشاشة — الالتقاط بأقصى دقة متاحة */
      g.view.zoomTo(g.selGeom, 1.02);
      const cap = await captureFrame({ captureOn: 1 });
      if (!cap) throw new Error("capture");
      /* حساب مستطيل التحديد على الشاشة والكاميرا ما زالت مؤطرة للتحديد */
      const sel = selBoxRef.current;
      if (!sel) throw new Error("noselection");
      const p1 = g.view.worldToScreen({ x: sel.minX, y: sel.maxY });
      const p2 = g.view.worldToScreen({ x: sel.maxX, y: sel.minY });
      const crop = cropCapture(cap, p1, p2);
      if (!crop) throw new Error("crop");
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      pdf.setTitle(fileName.replace(/\.[^.]+$/, "") || fileName);
      const im = await pdf.embedPng(crop.url);
      /* 96dpi بكسل ← 72pt نقطة طباعة */
      const wPt = Math.max(72, crop.w * 0.75);
      const hPt = Math.max(72, crop.h * 0.75);
      const page = pdf.addPage([wPt, hPt]);
      page.drawImage(im, { x: 0, y: 0, width: wPt, height: hPt });
      const bytes = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.[^.]+$/, "") || "drawing"}-${t("cad.selFileSuffix")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success(t("cad.selPdfToast"));
    } catch {
      toast.error(t("cad.selFail"));
    } finally {
      restore?.();
      setBusy("");
    }
  }, [busy, selBox, buildSelGeoms, captureFrame, fileName, t]);

  /* ── طباعة المنطقة المحددة فقط ── */
  const printSelection = useCallback(async () => {
    if (busy || !selBox) return;
    setBusy("selprint");
    let restore: (() => void) | null = null;
    try {
      const g = await buildSelGeoms();
      if (!g) throw new Error("noselection");
      restore = () => {
        try {
          g.view.zoomTo(g.saved, 1);
        } catch {
          /* الرجوع أفضل جهد */
        }
      };
      g.view.zoomTo(g.selGeom, 1.02);
      const cap = await captureFrame({ captureOn: 1 });
      const sel = selBoxRef.current;
      if (!cap || !sel) throw new Error("capture");
      const p1 = g.view.worldToScreen({ x: sel.minX, y: sel.maxY });
      const p2 = g.view.worldToScreen({ x: sel.maxX, y: sel.minY });
      const crop = cropCapture(cap, p1, p2);
      if (!crop) throw new Error("crop");
      openPrintWindow(crop.url);
    } catch {
      toast.error(t("cad.selFail"));
    } finally {
      restore?.();
      setBusy("");
    }
  }, [busy, selBox, buildSelGeoms, captureFrame, openPrintWindow, t]);

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

  /* ── حسابات التحديد للإطار الحالي (إحداثيات العالم → شاشة) ── */
  const selRect = (() => {
    if (!selectMode || !selBox) return null;
    const a = worldToScreenSafe({ x: selBox.minX, y: selBox.maxY });
    const b = worldToScreenSafe({ x: selBox.maxX, y: selBox.minY });
    if (!a || !b) return null;
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      w: Math.abs(b.x - a.x),
      h: Math.abs(b.y - a.y),
    };
  })();
  const dragRect = selectMode && selDrag
    ? {
        x: Math.min(selDrag.x1, selDrag.x2),
        y: Math.min(selDrag.y1, selDrag.y2),
        w: Math.abs(selDrag.x2 - selDrag.x1),
        h: Math.abs(selDrag.y2 - selDrag.y1),
      }
    : null;

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
              : selectMode
                ? t("cad.selectHint")
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
        {/* زر تحديد منطقة — طباعة أو تصدير جزء محدد فقط */}
        <button
          onClick={toggleSelect}
          aria-label={t("cad.selectArea")}
          aria-pressed={selectMode}
          data-testid="cad-select-btn"
          title={t("cad.selectArea")}
          disabled={!!error}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition disabled:opacity-40",
            selectMode
              ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
              : "border border-white/15 bg-white/5 text-slate-300 hover:text-white"
          )}
        >
          <Crop className="size-4" aria-hidden />
          <span className="hidden sm:inline">{t("cad.selectArea")}</span>
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
                  {fileMeta && (
                    <p
                      className="mt-1 text-[10px] font-extrabold tracking-wide text-red-200/70"
                      style={{ direction: "ltr" }}
                      data-testid="cad-file-meta"
                    >
                      {fileMeta}
                    </p>
                  )}
                  <p className="mt-1 text-xs leading-relaxed text-red-200/80">
                    {error.startsWith("k:") ? t(error.slice(2)) : error}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setError(null);
                        setStatus("__loading__");
                        setOpenTick((v) => v + 1);
                      }}
                      data-testid="cad-retry-open"
                      className="bg-emerald-600 font-extrabold text-white hover:bg-emerald-700"
                    >
                      {t("cad.retryNow")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={onClose}
                      className="bg-white/10 font-extrabold text-white hover:bg-white/20"
                    >
                      {t("ws.cancel")}
                    </Button>
                  </div>
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

        {/* ══ وضع تحديد المنطقة: طبقة السحب + تعتيم خارج التحديد ══ */}
        {selectMode && (
          <div
            className="absolute inset-0 z-20 cursor-crosshair"
            style={{ touchAction: "none" }}
            data-testid="cad-select-layer"
            onPointerDown={onSelectPointerDown}
            onPointerMove={onSelectPointerMove}
            onPointerUp={onSelectPointerUp}
            onPointerCancel={onSelectPointerCancel}
            onWheel={forwardWheel}
            onContextMenu={(e) => e.preventDefault()}
          >
            <svg className="absolute inset-0 size-full overflow-visible">
              <defs>
                <mask id="cad-sel-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {dragRect && (
                    <rect x={dragRect.x} y={dragRect.y} width={dragRect.w} height={dragRect.h} fill="black" />
                  )}
                  {!dragRect && selRect && (
                    <rect x={selRect.x} y={selRect.y} width={selRect.w} height={selRect.h} fill="black" />
                  )}
                </mask>
              </defs>
              {(dragRect || selRect) && (
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="rgba(2,6,23,0.55)"
                  mask="url(#cad-sel-mask)"
                />
              )}
              {dragRect && (
                <rect
                  x={dragRect.x}
                  y={dragRect.y}
                  width={dragRect.w}
                  height={dragRect.h}
                  fill="rgba(34,211,238,0.10)"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
              )}
              {selRect && (
                <g data-testid="cad-select-rect">
                  <rect
                    x={selRect.x}
                    y={selRect.y}
                    width={selRect.w}
                    height={selRect.h}
                    fill="rgba(34,211,238,0.08)"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    strokeDasharray="9 5"
                  />
                  {[
                    [selRect.x, selRect.y],
                    [selRect.x + selRect.w, selRect.y],
                    [selRect.x, selRect.y + selRect.h],
                    [selRect.x + selRect.w, selRect.y + selRect.h],
                  ].map(([cx, cy], i) => (
                    <rect
                      key={i}
                      x={cx - 4}
                      y={cy - 4}
                      width={8}
                      height={8}
                      fill="#22d3ee"
                      stroke="#0e7490"
                      strokeWidth={1.5}
                    />
                  ))}
                </g>
              )}
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

        {/* ══ لوحة تحديد المنطقة: الأبعاد + الطباعة والتصدير ══ */}
        {selectMode && (
          <div
            className="absolute bottom-3 left-1/2 z-30 w-[min(94%,470px)] -translate-x-1/2 rounded-2xl border border-cyan-400/25 bg-slate-950/95 p-3 shadow-2xl backdrop-blur"
            data-testid="cad-select-chip"
          >
            <div className="flex items-center gap-2">
              <Crop className="size-4 shrink-0 text-cyan-400" aria-hidden />
              <p className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-300">
                {selBox ? t("cad.selReady") : t("cad.selNone")}
              </p>
              <button
                onClick={() => setSelBox(null)}
                aria-label={t("cad.selClear")}
                data-testid="cad-select-clear"
                disabled={!selBox}
                className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-extrabold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                {t("cad.selClear")}
              </button>
              <button
                onClick={() => {
                  setSelectMode(false);
                  setSelBox(null);
                  setSelDrag(null);
                }}
                aria-label={t("cad.mExit")}
                data-testid="cad-select-exit"
                className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-white/20"
              >
                {t("cad.mExit")}
              </button>
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="min-w-0 shrink-0" data-testid="cad-select-dims">
                {selBox ? (
                  <>
                    <p className="text-[10.5px] font-bold leading-none text-slate-400">
                      {t("cad.selDims")}
                    </p>
                    <p
                      className="mt-1 font-extrabold leading-none text-cyan-300"
                      style={{ direction: "ltr" }}
                    >
                      <span className="text-lg">
                        {fmtLen((selBox.maxX - selBox.minX) * mScale)}
                      </span>
                      <span className="mx-1 text-cyan-500/70">×</span>
                      <span className="text-lg">
                        {fmtLen((selBox.maxY - selBox.minY) * mScale)}
                      </span>
                      <span className="ml-1 text-[10px] text-slate-400">
                        {t("cad.mUnit")}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-[10.5px] leading-relaxed text-slate-500">
                    {t("cad.selHint2")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selBox || !!busy}
                  onClick={printSelection}
                  aria-label={t("cad.selPrint")}
                  data-testid="cad-select-print"
                  className="border-white/20 bg-white/5 px-3 font-extrabold text-white hover:bg-white/10"
                >
                  <Printer className="size-4" aria-hidden />
                  {busy === "selprint" ? t("cad.selExporting") : t("cad.selPrint")}
                </Button>
                <Button
                  size="sm"
                  disabled={!selBox || !!busy}
                  onClick={exportSelectionPdf}
                  aria-label={t("cad.selPdf")}
                  data-testid="cad-select-pdf"
                  className="bg-cyan-600 px-3 font-extrabold text-white hover:bg-cyan-700"
                >
                  <FileDown className="size-4" aria-hidden />
                  {busy === "selpdf" ? t("cad.selExporting") : t("cad.selPdf")}
                </Button>
              </div>
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
