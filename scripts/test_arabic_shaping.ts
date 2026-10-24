/* اختبار حرج: هل pdf-lib + Tajawal يشكّل العربية سليمة؟
   نجرب طريقتين: drawText مباشر، وإعادة تشكيل يدوية بأشكال العرض إن فشلت الأولى */
import * as pdfLib from "pdf-lib";
import * as fontkit from "@pdf-lib/fontkit";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

mkdirSync("/home/z/my-project/scripts/t_out", { recursive: true });

async function main() {
  const out = await pdfLib.PDFDocument.create();
  out.registerFontkit(fontkit);
  const page = out.addPage([595, 842]);
  const reg = await out.embedFont(
    readFileSync("/home/z/my-project/public/fonts/Tajawal-Regular.ttf"),
    { subset: true }
  );

  // 1) drawText مباشر — pdf-lib يمرر عبر fontkit layout (نأمل تشكيلًا سليمًا)
  page.drawText("مرحبا العالم 123", { x: 60, y: 760, size: 24, font: reg });
  // 2) جملة كاملة للاختبار البصري
  page.drawText("السعر الكلي 150 ريال — عقد إيجار", { x: 60, y: 700, size: 18, font: reg });
  // 3) تشكيل يدوي بأشكال العرض U+FExx + عكس الاتجاه (الطريقة البديلة)
  const shaped = manualShape("مرحبا العالم");
  page.drawText(shaped, { x: 60, y: 640, size: 24, font: reg });

  const bytes = await out.save();
  writeFileSync("/home/z/my-project/scripts/t_out/arabic_test.pdf", bytes);
  console.log("SAVED", bytes.length);

  // فحص وجود أشكال العرض في cmap الخط
  const buf = readFileSync("/home/z/my-project/public/fonts/Tajawal-Regular.ttf");
  const hasFExx = checkPresentationForms(buf);
  console.log("PRESENTATION_FORMS_IN_CMAP:", hasFExx);
}

/** فحص سريع: هل جدول cmap يشمل FE70..FEFF */
function checkPresentationForms(buf: Buffer): boolean {
  // نبحث عن segmented coverage بأسلوب خشن: نحلل cmap format 4 يدويًا
  const numTables = buf.readUInt16BE(4);
  for (let i = 0; i < numTables; i++) {
    const off = 12 + i * 16;
    const tag = buf.toString("ascii", off, off + 4);
    if (tag !== "cmap") continue;
    const cmapOff = buf.readUInt32BE(off + 8);
    const nSub = buf.readUInt16BE(cmapOff + 2);
    for (let s = 0; s < nSub; s++) {
      const rec = cmapOff + 4 + s * 8;
      const fmt = buf.readUInt16BE(rec);
      const subOff = cmapOff + buf.readUInt32BE(rec + 4);
      if (fmt !== 4) continue;
      const segX2 = buf.readUInt16BE(subOff + 6);
      for (let e = 0; e < segX2 / 8; e++) {
        const end = buf.readUInt16BE(subOff + 14 + e * 2);
        if (end >= 0xFE70) return true;
      }
    }
  }
  return false;
}

/** إعادة تشكيل يدوية: أشكال عربية سياقية + عكس RTL */
function manualShape(text: string): string {
  // جدول مبسط لأشكال العرض [isolated, final, initial, medial]
  const FORMS: Record<string, [string, string, string, string]> = {
    "ا": ["\uFE8D", "\uFE8E", "\uFE8D", "\uFE8D"],
    "ب": ["\uFE8F", "\uFE90", "\uFE91", "\uFE92"],
    "ت": ["\uFE95", "\uFE96", "\uFE97", "\uFE98"],
    "ث": ["\uFE99", "\uFE9A", "\uFE9B", "\uFE9C"],
    "ج": ["\uFE9D", "\uFE9E", "\uFE9F", "\uFEA0"],
    "ح": ["\uFEA1", "\uFEA2", "\uFEA3", "\uFEA4"],
    "خ": ["\uFEA5", "\uFEA6", "\uFEA7", "\uFEA8"],
    "د": ["\uFEA9", "\uFEAA", "\uFEA9", "\uFEA9"],
    "ذ": ["\uFEAB", "\uFEAC", "\uFEAB", "\uFEAB"],
    "ر": ["\uFEAD", "\uFEAE", "\uFEAD", "\uFEAD"],
    "ز": ["\uFEAF", "\uFEB0", "\uFEAF", "\uFEAF"],
    "س": ["\uFEB1", "\uFEB2", "\uFEB3", "\uFEB4"],
    "ش": ["\uFEB5", "\uFEB6", "\uFEB7", "\uFEB8"],
    "ص": ["\uFEB9", "\uFEBA", "\uFEBB", "\uFEBC"],
    "ض": ["\uFEBD", "\uFEBE", "\uFEBF", "\uFEC0"],
    "ط": ["\uFEC1", "\uFEC2", "\uFEC3", "\uFEC4"],
    "ظ": ["\uFEC5", "\uFEC6", "\uFEC7", "\uFEC8"],
    "ع": ["\uFEC9", "\uFECA", "\uFECB", "\uFECC"],
    "غ": ["\uFECD", "\uFECE", "\uFECF", "\uFED0"],
    "ف": ["\uFED1", "\uFED2", "\uFED3", "\uFED4"],
    "ق": ["\uFED5", "\uFED6", "\uFED7", "\uFED8"],
    "ك": ["\uFED9", "\uFEDA", "\uFEDB", "\uFEDC"],
    "ل": ["\uFEDD", "\uFEDE", "\uFEDF", "\uFEE0"],
    "م": ["\uFEE1", "\uFEE2", "\uFEE3", "\uFEE4"],
    "ن": ["\uFEE5", "\uFEE6", "\uFEE7", "\uFEE8"],
    "ه": ["\uFEE9", "\uFEEA", "\uFEEB", "\uFEEC"],
    "و": ["\uFEED", "\uFEEE", "\uFEED", "\uFEED"],
    "ي": ["\uFEF1", "\uFEF2", "\uFEF3", "\uFEF4"],
    "أ": ["\uFE83", "\uFE84", "\uFE83", "\uFE83"],
    "إ": ["\uFE87", "\uFE88", "\uFE87", "\uFE87"],
    "آ": ["\uFE81", "\uFE82", "\uFE81", "\uFE81"],
    "ة": ["\uFE93", "\uFE94", "\uFE93", "\uFE93"],
    "ى": ["\uFEEF", "\uFEF0", "\uFEEF", "\uFEEF"],
    "ئ": ["\uFE89", "\uFE8A", "\uFE8B", "\uFE8C"],
    "ؤ": ["\uFE85", "\uFE86", "\uFE85", "\uFE85"],
    "لا": ["\uFEFB", "\uFEFC", "\uFEFB", "\uFEFC"],
  };
  const NON_JOINING = new Set(["ا", "د", "ذ", "ر", "ز", "و", "أ", "إ", "آ", "ة", "ى", "ؤ", "ء"]);
  const chars = [...text];
  const n = chars.length;
  const outArr: string[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const c = chars[i];
    if (!(c in FORMS)) {
      outArr[i] = c;
      continue;
    }
    const prevJoin = i > 0 && chars[i - 1] in FORMS && !NON_JOINING.has(chars[i - 1]);
    const nextJoin = i < n - 1 && chars[i + 1] in FORMS;
    let form = 0; // isolated
    if (prevJoin && nextJoin) form = 3;
    else if (prevJoin) form = 1;
    else if (nextJoin) form = 2;
    outArr[i] = FORMS[c][form];
  }
  return outArr.reverse().join("");
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
