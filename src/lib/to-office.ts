/* التحويل إلى Word وExcel — داخل المتصفح بالكامل
   المسار الذكي:
   - PDF بنص حقيقي → استخراج عناصر النص بمواضعها من pdf.js → سطور وفقاطع
   - PDF ممسوح ضوئيًا أو صورة → قراءة OCR (tesseract.js) بكلماتها ومواضعها
   النتيجة تقريبية بطبيعتها — نوضح ذلك للمستخدم دائمًا */

import type { EngineInput } from "./pdf-engine";
import {
  hasArabic,
  fixArabicWordOrder,
  orderLineWords,
  isRtlLine,
} from "./arabic-text";

export { hasArabic };

/* ─────────── النموذج ─────────── */

export interface OfficeWord {
  str: string;
  x: number; // بداية الكلمة أفقيًا (وحدة موحدة داخل الصفحة)
  w: number; // عرض الكلمة
}

export interface OfficeLine {
  page: number; // 1-based
  sizePt: number; // حجم تمثيلي للسطر
  words: OfficeWord[];
}

export interface OfficePage {
  no: number;
  lines: OfficeLine[];
}

export interface OfficeDoc {
  source: "text" | "ocr";
  pages: OfficePage[];
  medianSize: number;
}

function median(nums: number[]): number {
  if (!nums.length) return 12;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/* ─────────── 1) جمع السطور ─────────── */

/** هل الملف PDF وبه طبقة نص حقيقية كافية؟ */
async function pdfHasText(input: EngineInput): Promise<boolean> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const bytes = new Uint8Array(await input.file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data: bytes }).promise;
    let len = 0;
    for (let i = 1; i <= Math.min(2, doc.numPages); i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      len += tc.items.reduce((a, it) => a + ("str" in it ? it.str.trim().length : 0), 0);
    }
    (doc as unknown as { destroy?: () => void }).destroy?.();
    return len >= 20;
  } catch {
    return false;
  }
}

/** سطور PDF النصي: تجميع العناصر المتجاورة عموديًا في سطر واحد */
async function linesFromTextPdf(input: EngineInput): Promise<OfficePage[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const pages: OfficePage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const raw: { str: string; x: number; y: number; w: number; sizePt: number }[] = [];
    for (const it of tc.items as unknown as {
      str: string;
      transform: number[];
      width: number;
    }[]) {
      if (!it.str || !it.str.trim()) continue;
      const t = it.transform;
      const sizePt = Math.hypot(t[2], t[3]) || Math.hypot(t[0], t[1]) || 12;
      /* NFKC: أشكال العرض العربية ‎(FB50–FEFF)‎ ترجع لحروفها الأساسية */
      raw.push({ str: it.str.normalize("NFKC"), x: t[4], y: t[5], w: it.width || 0, sizePt });
    }
    /* تجميع: نفس السطر لو مركز العنصر قريب من مركز السطر الجاري (نصف حجم الخط) */
    raw.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines: { items: typeof raw; y: number; half: number }[] = [];
    for (const it of raw) {
      const cy = it.y + it.sizePt * 0.35;
      const cur = lines[lines.length - 1];
      if (cur && Math.abs(cy - cur.y) <= Math.max(cur.half, it.sizePt * 0.7)) {
        cur.items.push(it);
        cur.half = Math.max(cur.half, it.sizePt * 0.7);
      } else {
        lines.push({ items: [it], y: cy, half: it.sizePt * 0.7 });
      }
    }
    const officeLines: OfficeLine[] = lines
      .map((l) => {
        const words = l.items
          .slice()
          .sort((a, b) => a.x - b.x)
          .map((it) => ({ str: it.str, x: it.x, w: it.w }));
        return {
          page: i,
          sizePt: Math.round(median(l.items.map((it) => it.sizePt)) * 10) / 10,
          words,
        };
      })
      .filter((l) => l.words.some((w) => w.str.trim()));
    pages.push({ no: i, lines: officeLines });
  }
  (doc as unknown as { destroy?: () => void }).destroy?.();
  return pages;
}

/** سطور OCR: من blocks → paragraphs → lines → words بمواضعها */
async function linesFromOcr(
  input: EngineInput,
  lang: string,
  onProgress?: (m: string) => void
): Promise<OfficePage[]> {
  const Tesseract = await import("tesseract.js");
  let worker: import("tesseract.js").Worker;
  try {
    worker = await Tesseract.createWorker(lang, 1, {
      langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
    });
  } catch {
    throw new Error(
      "تعذّر تحميل بيانات اللغة للقراءة — يحتاج اتصالًا بالإنترنت أول مرة فقط، ثم جرّب مرة أخرى"
    );
  }
  try {
    const pages: OfficePage[] = [];

    const readCanvas = async (canvas: HTMLCanvasElement, pageNo: number) => {
      const { data } = await worker.recognize(canvas);
      const lines: OfficeLine[] = [];
      const blocks =
        (data as unknown as {
          blocks?: {
            paragraphs?: {
              lines?: {
                words?: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }[];
              }[];
            }[];
          }[];
        }).blocks ?? [];
      for (const block of blocks) {
        for (const para of block.paragraphs ?? []) {
          for (const line of para.lines ?? []) {
            const words = (line.words ?? [])
              .filter((w) => w.text && w.text.trim())
              .map((w) => ({
                str: w.text.normalize("NFKC"),
                x: w.bbox.x0,
                w: Math.max(1, w.bbox.x1 - w.bbox.x0),
                yMid: (w.bbox.y0 + w.bbox.y1) / 2,
                h: Math.max(1, w.bbox.y1 - w.bbox.y0),
              }));
            if (!words.length) continue;
            /* تجميع كلمات السطر الواحد: نفس منتصف العمود تقريبًا */
            const grouped: (typeof words)[] = [];
            for (const w of words) {
              const cur = grouped[grouped.length - 1];
              if (cur && Math.abs(w.yMid - (cur[0].yMid ?? w.yMid)) <= w.h * 0.7) cur.push(w);
              else grouped.push([w]);
            }
            for (const g of grouped) {
              const sizePt = Math.round(median(g.map((w) => w.h)) * 10) / 10;
              lines.push({
                page: pageNo,
                sizePt,
                words: g.map(({ str, x, w }) => ({ str, x, w })),
              });
            }
          }
        }
      }
      /* fallback: النص الخام إن ما ظهرت كلمات */
      if (!lines.length && data.text.trim()) {
        for (const row of data.text.split("\n")) {
          if (row.trim())
            lines.push({ page: pageNo, sizePt: 12, words: [{ str: row.trim().normalize("NFKC"), x: 0, w: 1 }] });
        }
      }
      pages.push({ no: pageNo, lines });
    };

    if (input.kind === "image") {
      onProgress?.(`جارٍ قراءة «${input.name}»…`);
      const url = URL.createObjectURL(input.file);
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const c2 = canvas.getContext("2d")!;
        c2.fillStyle = "#ffffff";
        c2.fillRect(0, 0, canvas.width, canvas.height);
        c2.drawImage(img, 0, 0);
        await readCanvas(canvas, 1);
      } finally {
        URL.revokeObjectURL(url);
      }
      return pages;
    }

    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const bytes = new Uint8Array(await input.file.arrayBuffer());
    const src = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    for (let i = 1; i <= src.numPages; i++) {
      onProgress?.(`قراءة نص الصفحة ${i} من ${src.numPages}…`);
      const page = await src.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const c2 = canvas.getContext("2d")!;
      c2.fillStyle = "#ffffff";
      c2.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: c2, viewport } as never).promise;
      await readCanvas(canvas, i);
    }
    (src as unknown as { destroy?: () => void }).destroy?.();
    return pages;
  } finally {
    await worker.terminate();
  }
}

/** قرار المستند كله: إن كانت عناصر الاستخراج معكوسة (تخزين منطقي نادر) نقلبها مرة واحدة،
    وإصلاح أثر اللام-ألف الهمزية يطبق دائمًا */
function fixDocArabic(pages: OfficePage[]): OfficePage[] {
  const all = pages.flatMap((p) => p.lines.flatMap((l) => l.words));
  const { words: fixed } = fixArabicWordOrder(all);
  if (fixed === all) return pages;
  let k = 0;
  return pages.map((p) => ({
    ...p,
    lines: p.lines.map((l) => ({
      ...l,
      words: l.words.map((w) => fixed[k++]),
    })),
  }));
}

/** نقطة الدخول: ملف PDF أو صورة → مستند سطور */
export async function collectOfficeDoc(
  input: EngineInput,
  lang = "ara+eng",
  onProgress?: (m: string) => void
): Promise<OfficeDoc> {
  if (input.kind === "image") {
    const pages = fixDocArabic(await linesFromOcr(input, lang, onProgress));
    const all = pages.flatMap((p) => p.lines);
    return { source: "ocr", pages, medianSize: median(all.map((l) => l.sizePt)) || 12 };
  }
  onProgress?.("فحص طبقة النص…");
  if (await pdfHasText(input)) {
    onProgress?.("استخراج النصوص بمواضعها…");
    const pages = fixDocArabic(await linesFromTextPdf(input));
    const all = pages.flatMap((p) => p.lines);
    return { source: "text", pages, medianSize: median(all.map((l) => l.sizePt)) || 12 };
  }
  onProgress?.("الملف ممسوح ضوئيًا — جارٍ قراءة النص بالـOCR…");
  const pages = fixDocArabic(await linesFromOcr(input, lang, onProgress));
  const all = pages.flatMap((p) => p.lines);
  return { source: "ocr", pages, medianSize: median(all.map((l) => l.sizePt)) || 12 };
}

/** نص سطر مرتب الاتجاه — يُستخدم في Word وExcel والنص الخام */
export function orderedLineText(line: OfficeLine): { text: string; rtl: boolean } {
  const rtl = isRtlLine(line.words.map((w) => w.str).join(" "));
  const text = orderLineWords(line.words, rtl)
    .map((w) => w.str)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return { text, rtl };
}

/** صياغة المستند نصًا خامًا مرتب الاتجاه — تستعملها أداة استخراج النصوص */
export function officeDocToText(doc: OfficeDoc): string {
  return doc.pages
    .map((p) => {
      const body = p.lines
        .map((l) => orderedLineText(l).text)
        .filter((t) => t)
        .join("\n");
      return `── الصفحة ${p.no} ──\n${body}`;
    })
    .join("\n\n");
}

/* ─────────── 2) بناء Word ─────────── */

/** ملف Word: سطر لكل فقرة — عربي RTL بخط Arial، عناوين بحجم أكبر تُكتب عريضة */
export async function buildDocx(doc: OfficeDoc, baseName: string): Promise<Blob> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    HeadingLevel,
  } = await import("docx");

  const headingThreshold = Math.max(doc.medianSize * 1.3, doc.medianSize + 3);
  const children: import("docx").Paragraph[] = [];

  doc.pages.forEach((page, idx) => {
    if (idx > 0) {
      /* فاصل صفحة بين صفحات الملف الأصلي */
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", break: 1 })],
        })
      );
    }
    if (doc.pages.length > 1 && page.lines.length) {
      children.push(
        new Paragraph({
          bidirectional: true,
          children: [
            new TextRun({
              text: `── الصفحة ${page.no} ──`,
              rightToLeft: true,
              boldComplexScript: true,
              bold: true,
              sizeComplexScript: true,
              size: 18,
              color: "8A8A8A",
              font: "Arial",
            }),
          ],
        })
      );
    }
    for (const line of page.lines) {
      const { text, rtl } = orderedLineText(line);
      if (!text) continue;
      const isHeading = line.sizePt >= headingThreshold;
      children.push(
        new Paragraph({
          bidirectional: rtl,
          alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
          heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text,
              rightToLeft: rtl,
              bold: isHeading,
              /* النص العربي في Word يستخدم خصائص النص المركب (szCs/bCs) —
                 بدونها يخرج العربي بحجم ووزن خاطئين مهما ضبطنا size/bold */
              sizeComplexScript: true,
              boldComplexScript: isHeading,
              size: Math.max(16, Math.round(line.sizePt * 2)),
              font: "Arial",
            }),
          ],
        })
      );
    }
  });

  const d = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 24, sizeComplexScript: true } },
      },
    },
    sections: [{ properties: {}, children: children.length ? children : [new Paragraph("")] }],
  });
  const blob = await Packer.toBlob(d);
  void baseName;
  return blob;
}

/* ─────────── 3) بناء Excel ─────────── */

/** تقسيم سطر إلى خلايا: فجوة أفقية كبيرة = عمود جديد — بترتيب قراءة السطر */
function lineToCells(line: OfficeLine): string[] {
  const rtl = isRtlLine(line.words.map((w) => w.str).join(" "));
  const words = orderLineWords(line.words, rtl);
  const cells: string[] = [];
  let cur = "";
  let prev: (typeof words)[number] | null = null;
  const gapUnit = Math.max(line.sizePt * 0.8, 4);
  for (const w of words) {
    /* الفجوة تُقاس باتجاه القراءة: لاتيني ننظر يمين الكلمة السابقة، عربي ننظر يسارها */
    const gap =
      prev === null
        ? 0
        : rtl
          ? prev.x - (w.x + w.w)
          : w.x - (prev.x + prev.w);
    if (prev !== null && gap > gapUnit) {
      cells.push(cur.trim());
      cur = "";
    }
    cur += (cur && !cur.endsWith(" ") ? " " : "") + w.str;
    prev = w;
  }
  if (cur.trim()) cells.push(cur.trim());
  return cells.length ? cells : [""];
}

/** ملف Excel: صف لكل سطر — الجداول تُلتقط بالفجوات الأفقية (تقريبي) */
export async function buildXlsx(doc: OfficeDoc, baseName: string): Promise<Blob> {
  const XLSX = await import("xlsx");
  const rows: (string | number)[][] = [];
  doc.pages.forEach((page, idx) => {
    if (doc.pages.length > 1 && page.lines.length) {
      rows.push([`── الصفحة ${page.no} ──`]);
    }
    for (const line of page.lines) {
      const { text } = orderedLineText(line);
      if (!text) continue;
      rows.push(lineToCells(line));
    }
    void idx;
  });
  const ws = XLSX.utils.aoa_to_sheet(rows.length ? rows : [[""]]);
  const wb = XLSX.utils.book_new();
  /* ورقة من اليمين لليسار لو المحتوى عربي */
  const anyText = rows.flat().join(" ");
  wb.Workbook = { Views: [{ RTL: hasArabic(anyText) }] };
  XLSX.utils.book_append_sheet(wb, ws, "البيانات");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  void baseName;
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
