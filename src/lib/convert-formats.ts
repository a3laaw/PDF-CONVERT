/** بيانات الصيغ المدعومة في استوديو التحويل — تُستخدم في الواجهة */

export type Quality = "vector" | "preview" | "flatten" | "native";

export interface FormatDef {
  ext: string[]; // الامتدادات المقابلة
  label: string; // الاسم المعروض
  family: "CAD" | "Revit" | "Adobe" | "صور" | "PDF";
  emoji: string;
  quality: Quality;
  qualityLabel: string;
  desc: string;
}

export const QUALITY_STYLES: Record<Quality, { cls: string; dot: string }> = {
  vector: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  flatten: {
    cls: "bg-teal-50 text-teal-700 border-teal-200",
    dot: "bg-teal-500",
  },
  preview: {
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  native: {
    cls: "bg-stone-100 text-stone-700 border-stone-200",
    dot: "bg-stone-400",
  },
};

export const CONVERT_FORMATS: FormatDef[] = [
  {
    ext: ["dxf"],
    label: "DXF",
    family: "CAD",
    emoji: "📐",
    quality: "vector",
    qualityLabel: "متجهي 100%",
    desc: "تحويل كامل بجودة متجهية: خطوط ونصوص قابلة للتكبير دون فقدان، مع دعم جميع التخطيطات.",
  },
  {
    ext: ["dwg"],
    label: "DWG",
    family: "CAD",
    emoji: "🏗️",
    quality: "preview",
    qualityLabel: "أفضل جهد",
    desc: "استخراج المعاينة المدمجة عالية الدقة مع ورقة معلومات الإصدار — والتحويل المتجهي يتطلب تصدير DXF.",
  },
  {
    ext: ["rvt"],
    label: "RVT",
    family: "Revit",
    emoji: "🏢",
    quality: "preview",
    qualityLabel: "أفضل جهد",
    desc: "استخراج معاينة المشروع من داخل حاوية OLE مع كشف إصدار Revit — التصدير الكامل من داخل Revit.",
  },
  {
    ext: ["psd"],
    label: "PSD",
    family: "Adobe",
    emoji: "🎨",
    quality: "flatten",
    qualityLabel: "تسطيح الطبقات",
    desc: "دمج كل الطبقات بجودة أصلية في صفحة PDF واحدة عبر محرك psd-tools.",
  },
  {
    ext: ["ai"],
    label: "AI",
    family: "Adobe",
    emoji: "✒️",
    quality: "vector",
    qualityLabel: "متجهي 100%",
    desc: "ملفات AI الحديثة متوافقة مع PDF — تُحفظ المتجهات والخطوط كما هي تمامًا.",
  },
  {
    ext: ["eps", "ps"],
    label: "EPS/PS",
    family: "Adobe",
    emoji: "🖊️",
    quality: "vector",
    qualityLabel: "متجهي 100%",
    desc: "معالجة عبر Ghostscript مع احترام حدود الصورة (EPSCrop) والحفاظ على المتجهات.",
  },
  {
    ext: ["indd"],
    label: "INDD",
    family: "Adobe",
    emoji: "📕",
    quality: "preview",
    qualityLabel: "أفضل جهد",
    desc: "استخراج المعاينة المدمجة من ملف InDesign — التصدير المطابق يتطلب InDesign نفسه.",
  },
  {
    ext: ["png", "jpg", "jpeg", "webp", "bmp", "tif", "tiff", "gif"],
    label: "الصور",
    family: "صور",
    emoji: "🖼️",
    quality: "native",
    qualityLabel: "جودة أصلية",
    desc: "PNG وJPG وWebP وTIFF (متعدد الصفحات) وغيرها — تُضمَّن داخل PDF بدقتها الكاملة.",
  },
  {
    ext: ["pdf"],
    label: "PDF",
    family: "PDF",
    emoji: "📄",
    quality: "native",
    qualityLabel: "تمرير + دمج",
    desc: "مرّر ملفات PDF كما هي، أو ادمج عدة نواتج في ملف واحد بضغطة زر.",
  },
];

export const ACCEPT_ATTR = CONVERT_FORMATS.flatMap((f) => f.ext)
  .map((e) => `.${e}`)
  .join(",");

const EXT_TO_FORMAT = new Map<string, FormatDef>();
for (const f of CONVERT_FORMATS) {
  for (const e of f.ext) EXT_TO_FORMAT.set(e, f);
}

export function formatForFile(name: string): FormatDef | null {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return EXT_TO_FORMAT.get(ext) || null;
}

export function formatLabelForEngine(engine: string): string {
  if (engine.includes("vector")) return "متجهي كامل";
  if (engine.includes("preview")) return "معاينة مدمجة";
  if (engine.includes("psd")) return "تسطيح طبقات";
  if (engine.includes("ghostscript")) return "متجهي كامل";
  if (engine.includes("merge")) return "دمج";
  if (engine.includes("pillow")) return "تضمين صورة";
  return "تحويل";
}
