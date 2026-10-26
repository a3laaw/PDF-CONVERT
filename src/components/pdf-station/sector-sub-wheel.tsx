"use client";

/* ═══ العجلة الفرعية — قائمة دائرية أنيقة بخدمات القسم المختار ═══
   تظهر بعد الضغط على قسم متعدد الأدوات في العجلة الرئيسية (pdf/صور/أوفيس/OCR)
   — أوتوكاد والأقسام ذات الأداة الواحدة تتجاوزها (سلوكها المباشر موثق ومعتمد).
   الأيقونات على حلقة حول محور الرفع — الرفع من المركز مقصوص على امتدادات القسم.
   حركات Framer Motion: دخول نابض + تتابع الأيقونات + فقاعة الاسم عند التحويم.
   كل الإحداثيات قطبية مقرّبة لمنزلتين — حتمية الترطيب (درس Task 50) */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, UploadCloud, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toolLabel } from "@/components/pdf-station/tool-menu-bar";
import { TOOL_ICONS } from "@/components/pdf-station/tool-icons";
import { SVC_COLOR, type ServicePick, type SectorTool } from "@/components/pdf-station/service-wheel";

/** إحداثيات قطبية حول مركز متغير — تقريب لمنزلتين إلزامي للترطيب */
function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  const q = (n: number) => Math.round(n * 100) / 100;
  return { x: q(cx + r * Math.cos(a)), y: q(cy + r * Math.sin(a)) };
}

/** تسمية الامتدادات المقبولة — من أنواع القسم مباشرة */
function kindsLabel(svc: ServicePick, t: (k: string) => string): string {
  const map: Record<string, string> = {
    pdf: "PDF",
    image: t("wheel.svc.images"),
    cad: "CAD",
  };
  return svc.kinds.map((k) => map[k] ?? k).join(" + ");
}

export function SectorSubWheel({
  svc,
  onClose,
  onEnterRoom,
  onToolPick,
  onGeneric,
}: {
  svc: ServicePick;
  onClose: () => void;
  /** المحور: رفع ملفات القسم — يضبط القسم ويفتح المنتقي بامتداداته فقط */
  onEnterRoom: () => void;
  /** أيقونة خدمة: القسم يضبط ثم المنتقي مفلتر بنوع الأداة (بلا قفز تلقائي — المحور 2) */
  onToolPick: (id: SectorTool) => void;
  /** «كل الأدوات»: الخروج للوضع العام بمنتجق بلا قسم */
  onGeneric: () => void;
}) {
  const { t } = useI18n();
  const [hov, setHov] = useState<number | null>(null);

  /* Esc يغلق — تنظيف صحيح للمستمع */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tools = svc.tools;
  /* نصف قطر الحلقة يتبع عدد الخدمات — والمسرح أطول من عرضه لمساحة العنوان والأسفل */
  const R = tools.length > 10 ? 116 : tools.length > 6 ? 104 : 92;
  const W = (R + 44) * 2;
  const H = W + 56;
  const CX = W / 2;
  const CY = H / 2 + 6;
  const c = SVC_COLOR[svc.id];

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
      data-testid="sw-root"
    >
      <motion.div
        className="relative overflow-visible rounded-[2rem] border border-border/80 bg-white/95 shadow-2xl shadow-black/20"
        style={{ width: W, height: H }}
        initial={{ scale: 0.75, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.86, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("sw.title", { name: t(`wheel.svc.${svc.id}`) })}
        data-testid="sw-panel"
      >
        {/* رأس اللوحة: العنوان + الإغلاق */}
        <div className="absolute inset-x-5 top-4 z-20 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black" style={{ color: c }}>
              {t("sw.title", { name: t(`wheel.svc.${svc.id}`) })}
            </p>
            <p className="text-[10.5px] font-bold text-muted-foreground">{t("sw.pick")}</p>
          </div>
          <button
            type="button"
            data-testid="sw-close"
            aria-label={t("sw.close")}
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-primary"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {/* حلقة الخدمات — أيقونات حقيقية حول المحور */}
        {tools.map((id, i) => {
          const TIcon = TOOL_ICONS[id];
          const p = polar(CX, CY, R, (i * 360) / tools.length);
          return (
            <motion.button
              key={id}
              type="button"
              data-testid={`sw-tool-${id}`}
              aria-label={toolLabel(id, t)}
              className="absolute z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border bg-white shadow-md transition-colors hover:border-current"
              style={{ left: p.x, top: p.y, borderColor: `${c}50`, color: c, backgroundColor: `${c}0f` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12 + i * 0.028, type: "spring", stiffness: 320, damping: 20 }}
              whileHover={{ scale: 1.16 }}
              whileTap={{ scale: 0.92 }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov((h) => (h === i ? null : h))}
              onFocus={() => setHov(i)}
              onBlur={() => setHov((h) => (h === i ? null : h))}
              onClick={() => onToolPick(id)}
            >
              <span className="[&>svg]:size-5">{TIcon ?? <LayoutGrid className="size-5" aria-hidden />}</span>
              <AnimatePresence>
                {hov === i && (
                  <motion.span
                    className="absolute top-[50px] z-30 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[10px] font-bold text-background shadow-lg"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    dir="auto"
                  >
                    {toolLabel(id, t)}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}

        {/* محور الرفع — مقصوص على امتدادات القسم */}
        <motion.button
          type="button"
          data-testid="sw-enter"
          onClick={onEnterRoom}
          className="absolute left-1/2 top-1/2 z-10 grid size-[116px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white text-center shadow-xl outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary/50"
          style={{ boxShadow: `0 20px 48px -18px ${c}99` }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, type: "spring", stiffness: 280, damping: 22 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          <span className="grid size-10 place-items-center rounded-2xl text-white shadow-md" style={{ backgroundColor: c }}>
            <UploadCloud className="size-5" aria-hidden />
          </span>
          <span className="mt-1.5 text-[12px] font-black leading-tight">{t("sw.upload")}</span>
          <span className="mt-0.5 text-[10px] font-bold text-muted-foreground" dir="auto">
            {kindsLabel(svc, t)}
          </span>
        </motion.button>

        {/* الخروج للوضع العام */}
        <button
          type="button"
          data-testid="sw-all"
          onClick={onGeneric}
          className="absolute inset-x-0 bottom-3.5 z-20 mx-auto flex w-fit items-center gap-1.5 rounded-full border border-border bg-white/90 px-4 py-1.5 text-[11px] font-extrabold text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-primary"
        >
          <LayoutGrid className="size-3.5" aria-hidden />
          {t("sw.all")}
        </button>
      </motion.div>
    </motion.div>
  );
}
