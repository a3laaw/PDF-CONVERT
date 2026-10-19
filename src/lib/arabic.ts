/* أدوات اللغة العربية — تطبيع، أرقام، عَدّ سليم */

/** تحويل الأرقام الهندية/العربية (٠-٩) إلى لاتينية (0-9) */
export function arabicDigitsToLatin(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** تحويل أرقام لاتينية إلى هندية (للعرض بالواجهة ١٢٣) */
export function toHindiDigits(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

/** تطبيع عربي عميق: تشكيل، همزات، تاء مربوطة، ألف مقصورة، تطويل، مسافات */
export function normalizeArabic(text: string): string {
  let t = arabicDigitsToLatin(text);
  t = t.replace(/[\u064B-\u0652\u0670\u0640]/g, ""); // تشكيل + تطويل
  t = t.replace(/[أإآٱ]/g, "ا");
  t = t.replace(/ة/g, "ه");
  t = t.replace(/ى/g, "ي");
  t = t.replace(/ؤ/g, "و");
  t = t.replace(/ئ/g, "ي");
  t = t.replace(/[،؛]/g, ",");
  t = t.replace(/[–—ـ]/g, "-");
  t = t.toLowerCase();
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

/** عَدّ عربي سليم: ملف واحد / ملفان / 3 ملفات / 15 ملفًا */
export function arabicCount(n: number, unit: string, unitTwo?: string): string {
  const two = unitTwo ?? `${unit}ان`;
  if (n === 0) return `لا ${unit === "ملف" ? "ملفات" : `${unit}`} `;
  if (n === 1) return `${unit} واحد`;
  if (n === 2) return two;
  if (n <= 10) return `${n} ${unit}ات`;
  return `${n} ${unit}ًا`;
}

/** مسافة مقروءة للحجم */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
}

/** ترتيب عربي بالكلمات: الأولى → العاشرة */
export const ORDINAL_WORDS: Record<string, number> = {
  "الاولي": 1,
  "الثانيه": 2,
  "الثالثه": 3,
  "الرابعه": 4,
  "الخامسه": 5,
  "السادسه": 6,
  "السابعه": 7,
  "الثامنه": 8,
  "التاسعه": 9,
  "العاشره": 10,
  "الاخيره": -1,
  "الاول": 1,
  "الثاني": 2,
  "الثالث": 3,
  "الاخير": -1,
};

/** مسافة ليفنشتاين للبحث الضبابي */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** تشابه نسبي 0..1 */
export function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}
