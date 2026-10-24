/* المحرك الهجين لفهم الأوامر العربية — نسخة محسّنة بلافتتاح لهجات وطبقة «هل تقصد؟» */

import { normalizeArabic, ORDINAL_WORDS, similarity, toHindiDigits } from "./arabic";
import { TOOLS_BY_ID } from "./tools-catalog";
import type { InterpretResult, OpId, Suggest } from "./types";

/* ─────────── استخراج نطاقات الصفحات ─────────── */

/** يحوّل وصف صفحات عربي حر إلى قائمة أرقام صفحات فعلية */
export function parsePageRanges(raw: string, pageCount: number): number[] {
  if (!raw || !raw.trim()) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const t = normalizeArabic(raw).replace(/\s+/g, " ");
  const picked = new Set<number>();

  // «الكل»
  if (/الكل|كل الصفحات|all/.test(t)) return Array.from({ length: pageCount }, (_, i) => i + 1);

  // نطاقات: 1-3 | من 2 لحد 5 | من 2 الى 5 | من 2 حتى 5
  const rangeRe = /(\d+)\s*(?:-|لحد|الى|حتى|الي)\s*(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = rangeRe.exec(t))) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const [s, e] = a <= b ? [a, b] : [b, a];
    for (let i = s; i <= e; i++) if (i >= 1 && i <= pageCount) picked.add(i);
  }

  // أرقام مفردة: 1,3,7 أو «الصفحة 4»
  const soloRe = /(?<![\d-])(\d+)(?![\d-])/g;
  while ((m = soloRe.exec(t))) {
    const n = Number(m[1]);
    if (n >= 1 && n <= pageCount) picked.add(n);
  }

  // أسماء عربية: الأولى، الثانية، الأخيرة…
  for (const [word, idx] of Object.entries(ORDINAL_WORDS)) {
    const re = new RegExp(`(?:الصفحة\\s*)?${word}\\b`);
    if (re.test(t)) {
      if (idx === -1) picked.add(pageCount);
      else if (idx >= 1 && idx <= pageCount) picked.add(idx);
    }
  }

  return picked.size
    ? Array.from(picked).sort((a, b) => a - b)
    : Array.from({ length: pageCount }, (_, i) => i + 1);
}

/* ─────────── قاموس النوايا (فصحى + لهجات) ─────────── */

interface Intent {
  op: OpId;
  phrases: string[]; // ممثلات للاقتراح الضبابي
  match: (t: string) => boolean; // على النص المطبّع
  priority: number; // الأدنى أولًا
}

/** مطابقة كلمة كاملة (بحواف) — تمنع «الملف» أن تطابق «لف» */
function hasWord(t: string, ...words: string[]): boolean {
  return words.some((w) => new RegExp(`(?:^|[\\s,،-])${w}(?:[\\s,،-]|$)`).test(t));
}

const INTENTS: Intent[] = [
  // ترقيم — قبل الحذف/التدوير لأن «رقمهم» قد يتصادم
  {
    op: "page_numbers",
    priority: 1,
    phrases: ["رقّم الصفحات", "ترقيم", "أضف أرقام الصفحات"],
    match: (t) =>
      (/رقم|ترقيم|صفحه من|numbers/.test(t) || hasWord(t, "رقمهم", "رقمهالهم", "ارقام")) &&
      !/النص|الكلام/.test(t),
  },
  {
    op: "watermark",
    priority: 2,
    phrases: ["أضف ختم مسودة", "علامة مائية", "ختم سري"],
    match: (t) =>
      /علامه مائيه|وارتمارك|watermark/.test(t) || hasWord(t, "ختم", "طابع", "مسوده", "سري", "معتمد"),
  },
  {
    op: "compress",
    priority: 3,
    phrases: ["صغّر حجم الملف", "ضغط PDF", "خفف الحجم"],
    match: (t) =>
      /حجم اقل|compress/.test(t) || hasWord(t, "صغر", "ضغط", "اضغط", "خفف", "اصغر", "قلل"),
  },
  {
    op: "merge_pages",
    priority: 4,
    phrases: ["ادمج صفحة من هنا وصفحة من ملف آخر", "دمج صفحات من الملفات"],
    match: (t) =>
      /دمج صفحات|اجمع صفحات|اختر صفحات|صفحه من (هنا|ملف|اخر)/.test(t),
  },
  {
    op: "nup",
    priority: 4,
    phrases: ["صفحتين في الورقة", "عدة صفحات في الورقة"],
    match: (t) =>
      /صفحتين في الورقه|عدد صفحات في الورقه|صفحتين بجانب|توفير الورق|2 في 1/.test(t),
  },
  {
    op: "merge",
    priority: 5,
    phrases: ["ادمج الملفات", "اجمع الملفات", "وحّد الملفات"],
    match: (t) =>
      /كله ملف واحد|امسك مع بعض|اعملهم ملف واحد|بهم مع بعض|merge/.test(t) ||
      hasWord(t, "ادمج", "دمج", "اجمع", "وحد"),
  },
  {
    op: "split",
    priority: 6,
    phrases: ["قسّم لملف لكل صفحة", "فصل كل صفحة"],
    match: (t) =>
      /فصل كل صفحه|اعزل كل صفحه|split/.test(t) || hasWord(t, "قسم", "فرق", "فصل", "شطر"),
  },
  {
    op: "extract",
    priority: 7,
    phrases: ["استخرج الصفحات 1-3", "اعزل صفحة 5"],
    match: (t) =>
      /استخرج|انسخ الصفحات|هات الصفحات|extract/.test(t) ||
      (hasWord(t, "طلع", "اعزل") && /\d|صفحه/.test(t)),
  },
  {
    op: "delete",
    priority: 8,
    phrases: ["احذف الصفحة 2", "شيل الصفحات الفارغة"],
    match: (t) => /delete/.test(t) || hasWord(t, "احذف", "حذف", "شيل", "امسح", "انسف"),
  },
  {
    op: "rotate",
    priority: 9,
    phrases: ["دوّر الصفحات 90 درجة", "اقلب الملف"],
    match: (t) => /rotate|تدوير/.test(t) || hasWord(t, "دور", "لف", "اقلب", "مدور", "اتجاه", "دوّر"),
  },
  {
    op: "reorder",
    priority: 10,
    phrases: ["اعكس ترتيب الصفحات", "رتب الصفحات"],
    match: (t) =>
      /عكس الترتيب|reverse/.test(t) || hasWord(t, "رتب", "ترتيب", "اعكس", "بالعكس"),
  },
  {
    op: "images_to_pdf",
    priority: 11,
    phrases: ["حوّل الصور إلى PDF", "اجمع الصور في ملف"],
    match: (t) =>
      /صور? (الى|إلى|لـ)? ?pdf|صور? ?pdf|حوّ?ل الصور|حول الصور|اجمع الصور|صور في ملف/.test(t),
  },
  {
    op: "pdf_to_images",
    priority: 12,
    phrases: ["حوّل PDF إلى صور", "طلع الصور من الملف"],
    match: (t) =>
      /pdf (الى|إلى|لـ) ?صور|pdf لصور|حول.*الى صور|حول لصور|images/.test(t) ||
      hasWord(t, "طلع الصور"),
  },
  {
    op: "extract_text",
    priority: 13,
    phrases: ["استخرج النص", "انسخ كلام الملف"],
    match: (t) => /استخرج النص|انسخ الكلام|نص الملف|طلع النص|النصوص|extract text/.test(t),
  },
  {
    op: "metadata",
    priority: 14,
    phrases: ["غيّر بيانات الملف", "اضبط العنوان والمؤلف"],
    match: (t) => /بيانات الملف|خصائص|ميتاداتا|metadata/.test(t) || hasWord(t, "العنوان", "المؤلف"),
  },
  {
    op: "image_convert",
    priority: 15,
    phrases: ["حوّل الصورة إلى JPG", "غيّر صيغة الصورة إلى PNG"],
    match: (t) =>
      /صيغه|صيغة|to png|to jpg|to webp/.test(t) &&
      /صور|image/.test(t) &&
      /png|jpg|jpeg|webp/.test(t),
  },
  {
    op: "image_resize",
    priority: 16,
    phrases: ["صغّر مقاس الصورة 50%", "اضبط عرض الصورة 800"],
    match: (t) =>
      /مقاس|أبعاد|ابعاد|resize/.test(t) &&
      /صور|image|%|بكسل|عرض/.test(t),
  },
  {
    op: "image_crop",
    priority: 17,
    phrases: ["اقتصّ الصورة مربع", "قص الصورة 16:9"],
    match: (t) =>
      /قص|اقتصاص|اقتص|crop/.test(t) &&
      /صور|image|مربع|1:1|4:3|3:4|16:9/.test(t),
  },
  {
    op: "ocr",
    priority: 18,
    phrases: ["اقرأ نص الملف الممسوح ضوئيًا", "استخرج نص الصورة OCR"],
    match: (t) =>
      /ocr|مسح ضوئي|ممسوح ضوئي|نص من صور|اقرا النص|قراءه النص|صوره مكتوبه/.test(t),
  },
];

const SORTED_INTENTS = [...INTENTS].sort((a, b) => a.priority - b.priority);

/* ─────────── استخراج المعاملات من الجملة ─────────── */

function extractParams(op: OpId, original: string): Record<string, string> {
  const t = normalizeArabic(original);
  const params: Record<string, string> = {};

  switch (op) {
    case "compress": {
      if (/قوي|اقصي|بقوه|بقوة|كثير/.test(t)) params.level = "قوي";
      else if (/خفيف|بسيط|شويه/.test(t)) params.level = "خفيف";
      else params.level = "متوسط";
      break;
    }
    case "rotate": {
      if (/قلب افقي|مرايه|مرآة/.test(t)) params.angle = "flipH";
      else if (/قلب راسي|راسيا/.test(t)) params.angle = "flipV";
      else if (/180|نص دوره|نصف دوره|اقلب/.test(t)) params.angle = "180";
      else if (/270|يسار|3 ربع|ربع دوره يسار/.test(t)) params.angle = "270";
      else if (/90|يمين|ربع دوره|ربع/.test(t)) params.angle = "90";
      else params.angle = "90";
      break;
    }
    case "watermark": {
      const quoted = original.match(/[«"']([^»"']+)[»"']/);
      if (quoted) params.text = quoted[1];
      else if (/سري|سرى/.test(t)) params.text = "سري";
      else if (/معتمد/.test(t)) params.text = "معتمد";
      else if (/مسوده/.test(t)) params.text = "مسودة";
      else if (/موقت|نسخه/.test(t)) params.text = "نسخة غير رسمية";
      else params.text = "مسودة";
      if (/احمر|حمراء/.test(t)) params.color = "احمر";
      else if (/ازرق|زرقاء/.test(t)) params.color = "ازرق";
      else params.color = "رمادي";
      break;
    }
    case "page_numbers": {
      params.format = /صفحه \d+ من|من \d+|صفحه من/.test(t) ? "صفحة من" : "رقم فقط";
      break;
    }
    case "extract":
    case "delete": {
      const digits = original.match(/\d+\s*[-–]\s*\d+((\s*,\s*\d+)*)|\d+(\s*,\s*\d+)+|\d+/);
      params.pages = digits?.[0] ?? (/الاخيره|الاولي|الثانيه|الثالثه|الرابعه|الخامسه/.test(t) ? original : "");
      break;
    }
    case "reorder": {
      params.mode = /عكس|بالعكس|reverse/.test(t) ? "عكس" : "مخصص";
      params.order = original.match(/(\d+(?:\s*,\s*\d+)+)/)?.[0] ?? "";
      if (params.mode === "مخصص" && !params.order) params.mode = "عكس";
      break;
    }
    case "pdf_to_images": {
      params.format = /jpg|jpeg/.test(t) ? "jpeg" : "png";
      if (/عالي|طباعه|أعلى/.test(t)) params.quality = "عالية";
      else if (/سريع|مضغوط/.test(t)) params.quality = "مضغوطة";
      else params.quality = "متوازنة";
      break;
    }
    case "metadata": {
      const titleM = original.match(/العنوان\s*[«"']?([^«»"']{1,60})[»"']?/);
      const authorM = original.match(/(?:المؤلف|بقلم)\s*[«"']?([^«»"']{1,40})[»"']?/);
      params.title = titleM?.[1]?.trim() ?? "";
      params.author = authorM?.[1]?.trim() ?? "";
      break;
    }
    case "nup":
      params.per = "2";
      break;
    case "images_to_pdf":
      params.layout = /a4|ورقه/.test(t) ? "A4" : "ملائم تلقائي";
      params.grouping = /ملف لكل|كل صورة ملف|منفصل|منفصله/.test(t) ? "ملف لكل صورة" : "ملف واحد";
      break;
    case "image_convert": {
      params.format = /png/.test(t) ? "png" : /webp/.test(t) ? "webp" : "jpeg";
      if (/عالي|أعلى/.test(t)) params.quality = "عالية";
      else if (/مضغوط|خفيف/.test(t)) params.quality = "مضغوطة";
      else params.quality = "متوازنة";
      break;
    }
    case "image_resize": {
      const m = original.match(/(\d+(?:\.\d+)?)\s*%|عرض\s*(\d{2,5})|(\d{2,5})\s*بكسل/);
      params.value = m ? (m[1] ? `${m[1]}%` : m[2] ?? m[3]) : "50%";
      break;
    }
    case "image_crop": {
      params.ratio = /16\s*:?\s*9|سينمائي/.test(t)
        ? "16:9"
        : /3\s*:?\s*4/.test(t)
          ? "3:4"
          : /4\s*:?\s*3/.test(t)
            ? "4:3"
            : /a4|مستند/.test(t)
              ? "A4طولي"
              : "1:1";
      break;
    }
    case "ocr": {
      if (/انجليزي|english/.test(t) && !/عربي/.test(t)) params.lang = "eng";
      else if (/عربي/.test(t) && !/انجليزي|english/.test(t)) params.lang = "ara";
      else params.lang = "ara+eng";
      break;
    }
    case "merge_pages":
      params.all = "1";
      break;
    default:
      break;
  }
  return params;
}

/* ─────────── الوصف العربي للخطوة ─────────── */

export function stepLabel(op: OpId, params: Record<string, string>, filesCount = 0): string {
  const tool = TOOLS_BY_ID[op];
  switch (op) {
    case "merge":
      return filesCount > 0 ? `دمج ${arabicFiles(filesCount)}` : "دمج الملفات";
    case "compress":
      return `تصغير الحجم (${params.level ?? "متوسط"})`;
    case "extract": {
      const n = params.pages ? parsePageRanges(params.pages, 9999).length : 0;
      return n > 0 ? `استخراج ${toHindiDigits(n)} ${n === 1 ? "صفحة" : "صفحات"} (${params.pages})` : "استخراج صفحات";
    }
    case "delete":
      return params.pages ? `حذف الصفحات (${params.pages})` : "حذف صفحات";
    case "rotate":
      return params.angle === "180" ? "قلب الصفحات 180°" : `تدوير الصفحات ${params.angle}°`;
    case "reorder":
      return params.mode === "عكس" ? "عكس ترتيب الصفحات" : "ترتيب مخصص للصفحات";
    case "split":
      return "فصل كل صفحة في ملف";
    case "watermark":
      return `ختم «${params.text ?? "مسودة"}»`;
    case "page_numbers":
      return params.format === "صفحة من" ? "ترقيم: صفحة 3 من 10" : "ترقيم الصفحات";
    case "images_to_pdf":
      return params.grouping === "ملف لكل صورة"
        ? "صور إلى PDF — ملف لكل صورة"
        : "تحويل الصور إلى PDF";
    case "pdf_to_images":
      return `تحويل PDF إلى صور (${params.format?.toUpperCase() ?? "PNG"})`;
    case "extract_text":
      return "استخراج النصوص";
    case "metadata":
      return "ضبط بيانات الملف";
    case "nup":
      return "صفحتان في الورقة";
    case "image_convert":
      return `تحويل الصيغة إلى ${(params.format ?? "jpeg").toUpperCase()}`;
    case "image_resize":
      return `تغيير الأبعاد (${params.value ?? "50%"})`;
    case "image_crop":
      return `قص الصورة بنسبة ${params.ratio ?? "1:1"}`;
    case "merge_pages":
      return "دمج صفحات من عدة ملفات";
    case "ocr":
      return "قراءة النص بالمسح الضوئي (OCR)";
    default:
      return tool.name;
  }
}

function arabicFiles(n: number): string {
  if (n === 1) return "ملف واحد";
  if (n === 2) return "ملفين";
  if (n <= 10) return `${n} ملفات`;
  return `${n} ملفًا`;
}

/* ─────────── «هل تقصد؟» — المطابقة الضبابية ─────────── */

/** كلمات وظيفية شائعة تُستبعد من المطابقة الضبابية — تمنع «الملف↔المؤلف» */
const STOPWORDS = new Set([
  "الملف", "الملفات", "ملف", "ملفات", "صفحه", "صفحات", "الصفحة", "الصفحات",
  "من", "على", "في", "الى", "عن", "مع", "ثم", "كل", "هنا", "بقوه", "بقوة",
  "جدا", "شويه", "اريد", "ابغي", "ابى", "ممكن", "لو سمحت", "please", "the", "and",
]);

function fuzzySuggest(
  segment: string,
  mode: "strict" | "loose" = "loose"
): { suggestions: Suggest[]; topSim: number } {
  const t = normalizeArabic(segment);
  if (t.length < 3) return { suggestions: [], topSim: 0 };
  const scored: { op: OpId; sim: number }[] = [];
  const push = (op: OpId, sim: number) => scored.push({ op, sim });
  for (const intent of SORTED_INTENTS) {
    // الجملة كاملة مقابل العبارات الممثلة — أساس الوضعين
    for (const phrase of intent.phrases) {
      const sim = similarity(t, normalizeArabic(phrase));
      if (sim >= 0.55) push(intent.op, sim);
    }
    const tool = TOOLS_BY_ID[intent.op];
    // الجملة كاملة مقابل الكلمات المفتاحية
    for (const kw of tool.keywords) {
      const sim = similarity(t, normalizeArabic(kw));
      if (sim >= 0.72) push(intent.op, sim);
    }
    // اسم الأداة نفسه
    const nameSim = similarity(t, normalizeArabic(tool.name));
    if (nameSim >= 0.65) push(intent.op, nameSim);

    // كلمات الجملة مقابل الكلمات المفتاحية — للاقتراح فقط (لا للتنفيذ التلقائي)
    if (mode === "loose") {
      for (const kw of tool.keywords) {
        const nkw = normalizeArabic(kw);
        if (nkw.includes(" ")) continue; // نطابق كلمات مفردة فقط على الرموز المفردة
        for (const token of t.split(" ")) {
          if (token.length < 3 || STOPWORDS.has(token)) continue;
          const s2 = similarity(token, nkw);
          if (s2 >= 0.7) push(intent.op, s2);
        }
      }
    }
  }
  const best = new Map<OpId, Suggest>();
  let topSim = 0;
  for (const s of scored.sort((a, b) => b.sim - a.sim)) {
    if (!best.has(s.op)) {
      best.set(s.op, { segment, toolId: s.op, phrase: TOOLS_BY_ID[s.op].name });
    }
    if (best.size === 1) topSim = s.sim;
    if (best.size >= 3) break;
  }
  return { suggestions: Array.from(best.values()), topSim };
}

/* ─────────── التفسير الرئيسي ─────────── */

function matchSegment(segment: string): { op: OpId; params: Record<string, string> } | null {
  const t = normalizeArabic(segment);
  if (!t) return null;
  for (const intent of SORTED_INTENTS) {
    if (intent.match(t)) {
      return { op: intent.op, params: extractParams(intent.op, segment) };
    }
  }
  return null;
}

/** التفسير: تفكيك «ثم» ثم «و» بحذر، ومطابقة كل جزء */
export function interpret(text: string, filesCount: number): InterpretResult {
  const raw = text.trim();
  const steps: InterpretResult["steps"] = [];
  const unknown: string[] = [];

  const chunks = raw
    .split(/\s+(?:ثم|وبعدين|بعدين|وبعدها)\s+/i)
    .map((c) => c.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const m = matchSegment(chunk);
    if (m) {
      steps.push({ op: m.op, params: m.params, label: stepLabel(m.op, m.params, filesCount) });
      continue;
    }
    // جرّب التفكيك على «و» — كل جزء يجب أن يُفهم كأمر مستقل
    const andParts = chunk
      .split(/(?:^|\s)و(?:\s|$)/)
      .map((p) => p.trim())
      .filter((p) => p.length > 1);
    let allParsed = andParts.length > 1;
    const partResults: { op: OpId; params: Record<string, string> }[] = [];
    for (const part of andParts) {
      const pm = matchSegment(part);
      if (!pm) {
        allParsed = false;
        break;
      }
      partResults.push(pm);
    }
    if (allParsed && partResults.length > 1) {
      for (const pr of partResults) {
        steps.push({ op: pr.op, params: pr.params, label: stepLabel(pr.op, pr.params, filesCount) });
      }
    } else {
      // مطابقة ضبابية صارمة أخيرة للجملة كاملة — تنفيذ تلقائي فقط بقوة 0.72+
      const strict = fuzzySuggest(chunk, "strict");
      if (strict.suggestions.length && strict.topSim >= 0.72) {
        const op = strict.suggestions[0].toolId;
        steps.push({ op, params: extractParams(op, chunk), label: stepLabel(op, {}, filesCount) });
      } else {
        unknown.push(chunk);
      }
    }
  }

  const suggestions: Suggest[] = [];
  for (const seg of unknown) {
    suggestions.push(...fuzzySuggest(seg).suggestions);
  }

  const totalSegments = steps.length + unknown.length;
  const confidence = totalSegments === 0 ? 0 : steps.length / totalSegments;

  const explanation =
    steps.length > 0 ? steps.map((s) => s.label).join(" ← ") : "لم أفهم الطلب بعد — جرّب صياغة أخرى";

  return {
    steps,
    explanation,
    confidence,
    unknown,
    suggestions,
    engine: unknown.length ? "مطابقة ضبابية" : "قواعد اللغة",
  };
}

/* ─────────── المهام الشائعة الذكية ─────────── */

import type { Recipe } from "./types";

export function suggestRecipes(
  files: { kind: string; size: number; scanned?: boolean; pages?: number }[]
): Recipe[] {
  if (files.length === 0) {
    return [
      {
        id: "r-start",
        title: "ابدأ بهذه المهمة",
        desc: "ارفع ملفاتك ثم اكتب طلبك بالعربية — أو اختر أدوات جاهزة من الشبكة أدناه",
        steps: [],
        icon: "✨",
      },
    ];
  }
  const pdfs = files.filter((f) => f.kind === "pdf");
  const images = files.filter((f) => f.kind === "image");
  const big = pdfs.filter((f) => f.size > 3 * 1024 * 1024);
  const out: Recipe[] = [];

  if (pdfs.length >= 2) {
    out.push({
      id: "r-merge-compress",
      title: "تجميع المستندات",
      desc: "اجمع كل ملفاتك في مستند رسمي واحد ثم صغّر حجمه ليصلح للإرسال",
      steps: [
        { op: "merge", params: {} },
        { op: "compress", params: { level: "متوسط" } },
      ],
      icon: "📚",
    });
  }
  if (pdfs.length >= 1) {
    out.push({
      id: "r-number",
      title: "ترقيم قبل الطباعة",
      desc: "رقّم صفحات المستند بأرقام واضحة أسفل كل صفحة",
      steps: [{ op: "page_numbers", params: { format: "رقم فقط" } }],
      icon: "🔢",
    });
  }
  if (pdfs.length >= 1 && big.length >= 1) {
    out.push({
      id: "r-shrink",
      title: "ملف كبير؟ صغّره",
      desc: `عندك ملف أكبر من 3 ميجابايت — جرّب التصغير القوي ليتصفح أسرع`,
      steps: [{ op: "compress", params: { level: "قوي" } }],
      icon: "🗜️",
    });
  }
  if (pdfs.some((f) => f.scanned)) {
    out.push({
      id: "r-stamp",
      title: "ختم «مسودة» على الممسوح",
      desc: "الملف ممسوح ضوئيًا — أضف ختم مسودة لحمايته من الاعتبار الرسمي",
      steps: [{ op: "watermark", params: { text: "مسودة", color: "رمادي" } }],
      icon: "🪣",
    });
  }
  if (pdfs.some((f) => f.scanned)) {
    out.push({
      id: "r-ocr",
      title: "الممسوح نص؟ اقرأه",
      desc: "الملف ممسوح ضوئيًا بلا طبقة نص — استخرج كلامه بالقراءة الآلية OCR",
      steps: [{ op: "ocr", params: { lang: "ara+eng" } }],
      icon: "🔍",
    });
  }
  if (images.length >= 2) {
    out.push({
      id: "r-images",
      title: "صور إلى مستند واحد",
      desc: `حوّل ${images.length} صور إلى ملف PDF واحد مرتّب جاهز للمشاركة`,
      steps: [{ op: "images_to_pdf", params: { layout: "ملائم تلقائي" } }],
      icon: "🖼️",
    });
  }
  return out.slice(0, 4);
}
