/* ترتيب النص العربي واستخراجه من PDF — دوال نقية بلا أي اعتماديات
   الخلفية (مُثبتة تجريبيًا بملفات مولّدة):
   - pdf.js يعيد ترتيب RTL داخل كل عنصر بافتراض أن التدفق بصري (أغلب المولدات
     Word/LibreOffice/محركات التشكيل) → العربية تخرج منطقية صحيحة، لكن يبقى أثر
     تحليل رابطة اللام-ألف الهمزية: «اإل» بدل «الإ».
   - مولدات نادرة تكتب التدفق بترتيب منطقي → يخرج النص معكوسًا كليًا ويحتاج قلبًا
     مع حماية مقاطع الأرقام واللاتينية.
   - ترتيب الكلمات داخل السطر يُبنى من المواضع: سطر عربي يُقرأ يمين→يسار. */

const RTL_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export const hasArabic = (s: string) => RTL_RE.test(s);

const hasStrongLTR = (s: string) => /[A-Za-z0-9\u0660-\u0669]/.test(s);

/* قلب بصري → منطقي: يقلب السلسلة كلها ثم يعيد مقاطع الأرقام/اللاتينية لترتيبها الداخلي
   (النسبة % والعملات $ € £ تعامل جزءًا من المقطع الرقمي كي لا تقفز من طرف لطرف) */
export function reverseVisual(s: string): string {
  const rev = [...s].reverse().join("");
  return rev.replace(
    /[%$€£]?[0-9\u0660-\u0669A-Za-z][0-9\u0660-\u0669A-Za-z.,:%\-$€£]*/g,
    (m) => [...m].reverse().join("")
  );
}

/* أثر اللام-ألف الهمزية بعد القلب: «اإلحصاء» → «الإحصاء» (ولأخواتها) */
export function fixLamAlefHamza(s: string): string {
  return s.replace(/ا([إأآ])ل/g, "ال$1");
}

/* نقاط «طبيعية» كلمة عربية: بادئات التعريف/الجحور وسوابق الحروف + لواحق شائعة.
   كافية لتمييز النص المنطقي من المعكوس عند جمعها على مستوى المستند كله */
const AR_PREFIX_STRONG = /^(وال|بال|كال|فال|ال|لل)/;
const AR_PREFIX_WEAK = /^[وفبكل]/;
const AR_SUFFIX = /(ات|ون|ين|ان|ية|هم|هن|كم|كن|نا|ها|تي|ة|ه|ي)$/;

export function arScoreWord(w: string): number {
  if (!hasArabic(w)) return 0;
  let sc = 0;
  if (AR_PREFIX_STRONG.test(w)) sc += 2;
  else if (AR_PREFIX_WEAK.test(w) && w.length >= 3) sc += 0.5;
  if (AR_SUFFIX.test(w)) sc += 1;
  return sc;
}

export function arScore(text: string): number {
  let sc = 0;
  for (const w of text.split(/\s+/)) sc += arScoreWord(w);
  return sc;
}

export interface FixableWord {
  str: string;
}

/**
 * قرار على مستوى المستند كله: هل عناصر الاستخراج معكوسة (تخزين منطقي)؟
   نقارن مجموع نقاط الطبيعية للقراءة الحالية مقابل القراءة المقلوبة؛
   إن غلبت المقلوبة بوضوح قلبنا كل الكلمات العربية مرة واحدة (لا خلط اتجاهات).
   إصلاح أثر اللام-ألف الهمزية يُطبَّق دائمًا — فهو يحدث في الحالتين
   (أي ملف يستخدم رابطة اللام-ألف مع ترتيب بصري ينتج «اإل» حتى بدون قلب).
 */
export function fixArabicWordOrder<T extends FixableWord>(
  words: T[]
): { words: T[]; flipped: boolean } {
  const arabic = words.filter((w) => hasArabic(w.str));
  if (arabic.length < 4) return { words, flipped: false };
  let revWins = 0;
  for (const w of arabic) {
    if (arScore(reverseVisual(w.str)) > arScore(w.str) + 0.5) revWins++;
  }
  const flipped = revWins / arabic.length >= 0.6;
  const out = words.map((w) =>
    hasArabic(w.str)
      ? { ...w, str: fixLamAlefHamza(flipped ? reverseVisual(w.str) : w.str) }
      : w
  );
  return { words: out, flipped };
}

/**
 * ترتيب كلمات سطر واحد حسب المواضع مع معرفة الاتجاه:
   - سطر عربي: من اليمين لليسار (تنازليًا في x)، والمقاطع اللاتينية/الرقمية
     المتتالية تُعاد لترتيب التدفق الأصلي (pdf.js يحفظ ترتيب التدفق للاتينية
     وهو المنطقي في الحالتين: التخزين البصري والمنطقي على سواء).
   - سطر لاتيني: من اليسار لليمين كالمعتاد.
 */
export function orderLineWords<T extends FixableWord & { x: number }>(
  words: T[],
  rtl: boolean
): T[] {
  const tagged = words.map((w, i) => ({ w, i }));
  const sorted = tagged.sort((a, b) => (rtl ? b.w.x - a.w.x : a.w.x - b.w.x));
  if (!rtl) return sorted.map((s) => s.w);
  const out: T[] = [];
  let run: { w: T; i: number }[] = [];
  const flush = () => {
    if (run.length) {
      run.sort((a, b) => a.i - b.i);
      out.push(...run.map((r) => r.w));
      run = [];
    }
  };
  for (const s of sorted) {
    if (!hasArabic(s.w.str) && hasStrongLTR(s.w.str)) run.push(s);
    else {
      flush();
      out.push(s.w);
    }
  }
  flush();
  return out;
}

/* اتجاه سطر من نصه: وجود أي حرف عربي يجعله RTL */
export const isRtlLine = (text: string) => hasArabic(text);
