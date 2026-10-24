/* قاعدة تسمية النتائج — نفس اسم الملف الأصلي + لاحقة عربية للعملية
   يُستخدم في المحرك (الأسماء الفعلية) وفي الواجهة (معاينة الاسم قبل التنفيذ) */

import { toHindiDigits } from "./arabic";
import type { OpId } from "./types";

export const OP_SUFFIX: Partial<Record<OpId, string>> = {
  compress: "مصغر",
  merge: "مدمج",
  split: "مفصول-صفحات",
  extract: "صفحات-مختارة",
  delete: "بعد-الحذف",
  rotate: "مدوّر",
  reorder: "مرتب",
  page_numbers: "مرقّم",
  watermark: "مختوم",
  remove_watermark: "بدون-علامة",
  nup: "صفحتين-في-الورقة",
  metadata: "بعد-البيانات",
  extract_text: "نص",
};

/** إزالة الامتداد */
export function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

/** الامتداد مع النقطة أو سلسلة فارغة */
export function extOf(name: string): string {
  const m = name.match(/\.[^.]+$/);
  return m ? m[0] : "";
}

/** الاسم الناتج للعملية على ملف — index يُستخدم للعمليات متعددة النواتج (فصل/لصور) */
export function resultName(op: OpId, fileName: string, index = 0, ext?: string): string {
  const base = stripExt(fileName);
  switch (op) {
    case "split":
      return `${base}-مفصول-صفحات-${toHindiDigits(index + 1)}${ext ?? ".pdf"}`;
    case "pdf_to_images":
      return `${base}-صورة-${toHindiDigits(index + 1)}${ext ?? ".png"}`;
    case "images_to_pdf":
      return `${base}.pdf`;
    case "extract_text":
      return `${base}-نص.txt`;
    default: {
      const suffix = OP_SUFFIX[op] ?? "جديد";
      return `${base}-${suffix}${ext ?? (extOf(fileName) || ".pdf")}`;
    }
  }
}

/** منع تكرار الأسماء داخل دفعة واحدة — يضيف ٢ ٣ … عند التعارض */
export function uniqueName(name: string, taken: Set<string>): string {
  if (!taken.has(name)) {
    taken.add(name);
    return name;
  }
  const m = name.match(/^(.*?)(\.[^.]+)$/);
  const stem = m ? m[1] : name;
  const e = m ? m[2] : "";
  for (let i = 2; i < 1000; i++) {
    const cand = `${stem}-${toHindiDigits(i)}${e}`;
    if (!taken.has(cand)) {
      taken.add(cand);
      return cand;
    }
  }
  return name;
}
