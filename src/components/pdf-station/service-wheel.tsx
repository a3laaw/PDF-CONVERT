"use client";

/* العجلة السينمائية — شاشة الرفع الرئيسية
   ترس خارجي يدور ببطء دائم (يتسارع ناعمًا عند التحويم ويقفز بدورة سريعة عند الاختيار)
   + 6 قطاعات خدمات كل قطاع زر حقيقي بـ clip-path يقود لوظيفة موجودة فعلًا
   + محور زجاجي بأيقونة ترس تدور عكسيًا
   + على الجوال (<sm): شبكة بطاقات أنيقة بنفس الوظائف
   كل الإحداثيات على مسرح ثابت 400×400 — القطاعات لا تدور (القراءة مريحة) والدوران للترس الزخرفي */

import { memo, useRef, useState } from "react";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  DraftingCompass,
  FileSpreadsheet,
  ScanText,
  PenTool,
  Settings,
  UploadCloud,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { FileKind, OpId } from "@/lib/types";

/* ─── تعريف الخدمة: تربط قسم العجلة بوظيفة حقيقية في مساحة العمل ───
   كل قسم «غرفة مستقلة»: امتداداته فقط + أدواته فقط.
   إضافة قسم جديد = سطر واحد هنا + مفاتيح wheel.svc.* في القواميس الثلاثة */
export type SectorTool = OpId | "editor" | "cad_viewer";

export interface ServicePick {
  id: "pdf" | "images" | "cad" | "office" | "ocr" | "edit";
  /** قيمة accept لمنتقي الملفات */
  accept: string;
  /** أنواع الملفات المسموحة في هذا القسم — تُرفض كل أخرى عند الإفلات والإضافة */
  kinds: FileKind[];
  /** أدوات القسم فقط — تظهر وحدها في شريط الأدوات داخل مساحة العمل */
  tools: SectorTool[];
  /** ما يُفعَّل تلقائيًا بعد إضافة الملفات */
  then?: { tool?: OpId; cad?: boolean; editor?: boolean };
}

export const WHEEL_SERVICES: ServicePick[] = [
  {
    id: "pdf",
    accept: ".pdf",
    kinds: ["pdf"],
    tools: [
      "editor", "compress", "merge", "merge_pages", "split", "extract",
      "delete", "rotate", "reorder", "page_numbers", "watermark",
      "remove_watermark", "sign", "protect", "unlock", "pdf_to_images",
      "extract_text", "image_crop",
    ],
  },
  {
    id: "images",
    accept: "image/*",
    kinds: ["image"],
    tools: ["compress", "rotate", "image_convert", "image_resize", "image_crop", "images_to_pdf"],
  },
  {
    id: "cad",
    accept: ".dwg,.dxf",
    kinds: ["cad"],
    tools: ["cad_viewer"],
    then: { cad: true },
  },
  {
    id: "office",
    accept: ".pdf",
    kinds: ["pdf"],
    tools: ["pdf_to_word", "pdf_to_excel"],
    then: { tool: "pdf_to_word" },
  },
  {
    id: "ocr",
    accept: ".pdf,image/*",
    kinds: ["pdf", "image"],
    tools: ["ocr", "extract_text"],
    then: { tool: "ocr" },
  },
  {
    id: "edit",
    accept: ".pdf,image/*",
    kinds: ["pdf", "image"],
    tools: ["editor"],
    then: { editor: true },
  },
];

/** هل يملك الملف نوعًا يقبله القسم؟ — فحص بالامتداد والـ MIME لحظة الإدخال
    (بوابة موحّدة للسحب والإفلات ولمنتقي الملفات — المرفوض يترفض برسالة ودودة) */
export function fileFitsSector(file: File, svc: ServicePick): boolean {
  const n = file.name.toLowerCase();
  const mime = file.type;
  if (svc.kinds.includes("pdf") && (mime === "application/pdf" || n.endsWith(".pdf"))) return true;
  if (svc.kinds.includes("image") && (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/.test(n))) return true;
  if (svc.kinds.includes("cad") && /\.(dwg|dxf|rvt)$/.test(n)) return true;
  return false;
}

/* ─── هندسة العجلة: مسرح 400×400 ─── */
const CX = 200;
const CY = 200;
const R_OUT = 198;
const R_IN = 116;
const R_LABEL = 158;
const SEG = 360 / WHEEL_SERVICES.length; // 60° لكل قسم
const GAP = 1.6; // فجوة بين القطاعات

/** إحداثيات قطبية — 0° أعلى منتصفًا والاتجاه مع عقارب الساعة
    التقريب لمنزلتين إلزامي: نتائج trig تختلف بفروق 1e-13 بين محرّك السيرفر ومحرّك المتصفح
    فترفض React مطابقة HTML المُسرَّد بالترطيب (خطأ hydration) — التقريب يوحّد الرقمين نهائيًا */
function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  const q = (n: number) => Math.round(n * 100) / 100;
  return { x: q(CX + r * Math.cos(a)), y: q(CY + r * Math.sin(a)) };
}

/** مسار قطاع حلقي من زاويتين — يُستخدم للـ SVG ولـ clip-path معًا */
function sectorPath(r0: number, r1: number, a0: number, a1: number) {
  const p1 = polar(r1, a0);
  const p2 = polar(r1, a1);
  const p3 = polar(r0, a1);
  const p4 = polar(r0, a0);
  const laf = a1 - a0 > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(2);
  return `M ${f(p1.x)} ${f(p1.y)} A ${r1} ${r1} 0 ${laf} 1 ${f(p2.x)} ${f(p2.y)} L ${f(p3.x)} ${f(p3.y)} A ${r0} ${r0} 0 ${laf} 0 ${f(p4.x)} ${f(p4.y)} Z`;
}

/* ألوان الخدمات — من هوية الموقع (بنفسجي الموقع + التركواز) وأسرتان مميزتان
   مُصدَّرة لشارة القسم في مساحة العمل */
export const SVC_COLOR: Record<ServicePick["id"], string> = {
  pdf: "#4f55e3",
  images: "#0d9488",
  cad: "#0284c7",
  office: "#2563eb",
  ocr: "#7c3aed",
  edit: "#d97706",
};

export const SVC_ICON: Record<ServicePick["id"], typeof FileText> = {
  pdf: FileText,
  images: ImageIcon,
  cad: DraftingCompass,
  office: FileSpreadsheet,
  ocr: ScanText,
  edit: PenTool,
};

/* جزيئات الخلفية — إعدادات ثابتة (لا Math.random كي لا يختل الترطيب) */
const PARTICLES = [
  { l: "6%", t: "18%", s: 5, d: "15s", dl: "0s" },
  { l: "14%", t: "64%", s: 3, d: "19s", dl: "-6s" },
  { l: "22%", t: "30%", s: 4, d: "13s", dl: "-3s" },
  { l: "32%", t: "78%", s: 3, d: "17s", dl: "-9s" },
  { l: "44%", t: "12%", s: 5, d: "21s", dl: "-12s" },
  { l: "55%", t: "82%", s: 4, d: "14s", dl: "-5s" },
  { l: "66%", t: "20%", s: 3, d: "18s", dl: "-2s" },
  { l: "74%", t: "58%", s: 5, d: "16s", dl: "-10s" },
  { l: "84%", t: "34%", s: 3, d: "20s", dl: "-7s" },
  { l: "91%", t: "70%", s: 4, d: "15s", dl: "-1s" },
  { l: "94%", t: "14%", s: 3, d: "22s", dl: "-14s" },
  { l: "3%", t: "44%", s: 4, d: "18s", dl: "-8s" },
];

/* ─── حلقة الترس الدوّارة (SVG زخرفي) ─── */
const GearRing = memo(function GearRing({ rotate }: { rotate: ReturnType<typeof useMotionValue<number>> }) {
  const ticks = Array.from({ length: 60 }, (_, i) => i * 6);
  return (
    <motion.div className="absolute inset-0" style={{ rotate }} aria-hidden>
      <svg viewBox="0 0 400 400" className="size-full">
        <circle cx={CX} cy={CY} r={R_OUT - 1} fill="none" stroke="#4f55e3" strokeOpacity={0.16} strokeWidth={1.5} strokeDasharray="3 9" />
        {ticks.map((a) => {
          const p1 = polar(R_OUT - 11, a);
          const p2 = polar(R_OUT - 3, a);
          const major = a % 30 === 0;
          return (
            <line
              key={a}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={major ? "#0d9488" : "#4f55e3"}
              strokeOpacity={major ? 0.35 : 0.18}
              strokeWidth={major ? 2.4 : 1.6}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={CX} cy={CY} r={R_OUT - 14} fill="none" stroke="#0d9488" strokeOpacity={0.14} strokeWidth={1} strokeDasharray="1 7" />
      </svg>
    </motion.div>
  );
});

/* ─── المكوّن الرئيسي ─── */
export function ServiceWheel({
  dragOver,
  onPick,
  onGeneric,
}: {
  dragOver: boolean;
  onPick: (svc: ServicePick) => void;
  /** الزر العام «اختر ملفاتك» — يفتح المنتقي بلا قسم (الوضع العام: كل الأدوات) */
  onGeneric?: () => void;
}) {
  const { t } = useI18n();
  const [hover, setHover] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  /* دوران الترس: سرعة مستهدفة + نعومة lerp — تحديث مباشر للنمط بلا re-render */
  const angle = useMotionValue(0);
  const vel = useRef(0.075); // درجة لكل 16.7ms — دورة كاملة ≈ 80 ثانية
  const hovering = useRef(false);
  const boost = useRef(0); // نبضة الاختيار: دورة سريعة تهدأ تدريجيًا

  useAnimationFrame((_, delta) => {
    const target = boost.current > 0.12 ? boost.current : hovering.current ? 0.6 : 0.075;
    vel.current += (target - vel.current) * Math.min(1, delta / 420);
    boost.current *= Math.pow(0.955, delta / 16.7);
    angle.set((angle.get() + vel.current * (delta / 16.7)) % 360);
  });

  const pick = (svc: ServicePick | null) => {
    if (picked) return;
    setPicked(svc ? svc.id : "all");
    boost.current = 3.4; // قفزة دورة سينمائية ثم تباطؤ لطيف
    window.setTimeout(() => (svc ? onPick(svc) : onGeneric?.()), 260);
    window.setTimeout(() => setPicked(null), 1500); /* أُلغي المنتقي؟ العجلة تعود */
  };

  const genPicked = picked != null;

  return (
    <section className="relative mt-6 overflow-hidden rounded-3xl border border-border/70 station-bg px-4 py-10 sm:py-14" data-testid="wheel-root">
      {/* هالات ضوئية ناعمة */}
      <div className="pointer-events-none absolute -top-24 left-[8%] size-72 rounded-full bg-[#4f55e3]/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-28 right-[6%] size-80 rounded-full bg-[#0d9488]/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute top-[38%] left-[45%] size-56 rounded-full bg-[#7c3aed]/8 blur-3xl" aria-hidden />
      {/* جزيئات عائمة خفيفة */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="wheel-float absolute rounded-full bg-primary/30"
            style={{ left: p.l, top: p.t, width: p.s, height: p.s, animationDuration: p.d, animationDelay: p.dl }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-white/80 px-4 py-1.5 text-sm font-bold text-primary shadow-sm">
          <Settings className="size-4 wheel-spin-slow" aria-hidden />
          {t("wheel.kicker")}
        </span>
        <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">{t("wheel.title")}</h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">{t("wheel.sub")}</p>
      </div>

      {/* ═══ العجلة — شاشات ≥ sm ═══ */}
      <motion.div
        className="relative mx-auto mt-8 hidden size-[400px] sm:block"
        animate={genPicked ? { scale: 1.06, opacity: 0.45 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => (hovering.current = true)}
        onMouseLeave={() => (hovering.current = false)}
        data-testid="wheel-stage"
      >
        {/* هالة خلف القطاعات */}
        <div
          className={cn(
            "absolute inset-2 rounded-full transition-all duration-500",
            dragOver ? "bg-primary/15 ring-4 ring-primary/40 ring-dashed" : "bg-white/50 shadow-[0_24px_70px_-24px_rgba(79,85,227,0.35)]"
          )}
          aria-hidden
        />
        <GearRing rotate={angle} />

        {/* القطاعات */}
        <svg viewBox="0 0 400 400" className="absolute inset-0" aria-hidden>
          {WHEEL_SERVICES.map((s, i) => {
            const a0 = i * SEG + GAP;
            const a1 = (i + 1) * SEG - GAP;
            const c = SVC_COLOR[s.id];
            const isHot = hover === s.id || picked === s.id;
            return (
              <path
                key={s.id}
                d={sectorPath(R_IN, R_OUT, a0, a1)}
                fill={isHot ? `${c}33` : `${c}17`}
                stroke={isHot ? `${c}aa` : `${c}59`}
                strokeWidth={isHot ? 2 : 1.4}
                className="wheel-seg-fill"
                style={{ ["--seg-glow" as string]: `${c}55` }}
              />
            );
          })}
        </svg>

        {/* أزرار القطاعات — HTML حقيقي بـ clip-path (تركيز ولوحة مفاتيح كاملة) */}
        {WHEEL_SERVICES.map((s, i) => {
          const a0 = i * SEG + GAP;
          const a1 = (i + 1) * SEG - GAP;
          const mid = (a0 + a1) / 2;
          const c = SVC_COLOR[s.id];
          const Icon = SVC_ICON[s.id];
          const lp = polar(R_LABEL, mid);
          const out = polar(7, mid); // انزلاق خارجي عند التحويم
          const isHot = hover === s.id || picked === s.id;
          return (
            <button
              key={s.id}
              type="button"
              data-testid={`wheel-seg-${s.id}`}
              aria-label={`${t(`wheel.svc.${s.id}`)} — ${t(`wheel.svc.${s.id}D`)}`}
              onClick={() => pick(s)}
              onMouseEnter={() => setHover(s.id)}
              onMouseLeave={() => setHover((h) => (h === s.id ? null : h))}
              onFocus={() => setHover(s.id)}
              onBlur={() => setHover((h) => (h === s.id ? null : h))}
              className="absolute inset-0 rounded-full outline-none"
              style={{ transform: isHot ? `translate(${out.x - CX}px, ${out.y - CY}px)` : undefined, transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)" }}
            >
              <span
                className="absolute inset-0"
                style={{ clipPath: `path("${sectorPath(R_IN, R_OUT, a0, a1)}")` }}
                aria-hidden
              />
              <span
                className={cn(
                  "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5",
                  isHot ? "scale-110" : "scale-100",
                  "transition-transform duration-300"
                )}
                style={{ left: lp.x, top: lp.y }}
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-xl text-white shadow-md transition-shadow",
                    isHot && "shadow-lg"
                  )}
                  style={{ backgroundColor: c, boxShadow: isHot ? `0 8px 22px -6px ${c}aa` : undefined }}
                >
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <span className="text-[13px] font-extrabold text-foreground leading-none whitespace-nowrap">
                  {t(`wheel.svc.${s.id}`)}
                </span>
              </span>
            </button>
          );
        })}

        {/* المحور الزجاجي */}
        <div className="absolute inset-[29%] flex flex-col items-center justify-center rounded-full border border-white/70 bg-white/85 shadow-inner backdrop-blur-md text-center px-3" data-testid="wheel-hub">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Settings className="size-5.5 wheel-spin-rev" aria-hidden />
          </span>
          <span className="mt-2 text-base font-black leading-tight">{t("site.name")}</span>
          <span className="mt-0.5 text-[10.5px] font-bold text-muted-foreground leading-tight">{t("wheel.hubSub")}</span>
        </div>
      </motion.div>

      {/* ═══ شبكة الجوال — < sm: بطاقات بنفس الوظائف ═══ */}
      <div className="relative mx-auto mt-8 grid max-w-md grid-cols-2 gap-3 sm:hidden" data-testid="wheel-grid">
        {WHEEL_SERVICES.map((s) => {
          const c = SVC_COLOR[s.id];
          const Icon = SVC_ICON[s.id];
          return (
            <button
              key={s.id}
              type="button"
              data-testid={`wheel-card-${s.id}`}
              aria-label={`${t(`wheel.svc.${s.id}`)} — ${t(`wheel.svc.${s.id}D`)}`}
              onClick={() => pick(s)}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white/90 p-3.5 text-start shadow-sm transition active:scale-95 hover:border-primary/40"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md" style={{ backgroundColor: c }}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold leading-tight">{t(`wheel.svc.${s.id}`)}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{t(`wheel.svc.${s.id}D`)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* زر عام + تلميح الإفلات */}
      <div className="relative mt-8 flex flex-col items-center gap-2.5">
        <Button
          size="lg"
          className="font-extrabold px-8 gap-2 shadow-lg shadow-primary/25"
          data-testid="wheel-pick-btn"
          onClick={() => pick(null)}
        >
          <UploadCloud className="size-5" aria-hidden />
          {t("hero.pick")}
        </Button>
        <p className={cn("text-xs font-bold transition-colors", dragOver ? "text-primary" : "text-muted-foreground")} data-testid="wheel-drop-hint">
          {t("wheel.dropHint")}
        </p>
      </div>
    </section>
  );
}
