#!/usr/bin/env python3
"""استبدال كتلة INTENTS في interpreter.ts بأنماط بحواف كلمات"""
import re

path = "/home/z/my-project/src/lib/interpreter.ts"
with open(path, encoding="utf-8") as f:
    lines = f.readlines()

# إيجاد حدود الكتلة
start = next(i for i, l in enumerate(lines) if l.startswith("interface Intent {"))
end = next(i for i, l in enumerate(lines) if i > start and l.rstrip() == "];")

new_block = '''interface Intent {
  op: OpId;
  phrases: string[]; // ممثلات للاقتراح الضبابي
  match: (t: string) => boolean; // على النص المطبّع
  priority: number; // الأدنى أولًا
}

/** مطابقة كلمة كاملة (بحواف) — تمنع «الملف» أن تطابق «لف» */
function hasWord(t: string, ...words: string[]): boolean {
  return words.some((w) => new RegExp(`(?:^|[\\\\s,،-])${w}(?:[\\\\s,،-]|$)`).test(t));
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
      (hasWord(t, "طلع", "اعزل") && /\\d|صفحه/.test(t)),
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
];
'''

lines[start:end + 1] = [new_block]
with open(path, "w", encoding="utf-8") as f:
    f.writelines(lines)
print(f"replaced lines {start+1}..{end+1} — OK")
