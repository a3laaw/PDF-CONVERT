/* محرك PDF «محطّة PDF» — يعمل بالكامل داخل متصفح المستخدم (خصوصية تامة)
   pdf-lib للتعديل + pdfjs للعرض والاستخراج + Canvas للنص العربي المُشكَّل */

import { PDFDocument, PDFDict, PDFHexString, PDFName, PDFRawStream, PDFRef, PDFString, degrees, rgb, StandardFonts } from "pdf-lib";
import { toHindiDigits } from "./arabic";
import { parsePageRanges } from "./interpreter";
import { resultName, stripExt } from "./naming";
import { collectOfficeDoc, buildDocx, buildXlsx } from "./to-office";
import { protectPdf, unlockPdf } from "./qpdf";
import type { ResultFile } from "./types";

/* ─────────── أدوات داخلية ─────────── */

let workerReady = false;
async function getPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerReady) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    workerReady = true;
  }
  return pdfjs;
}

async function loadPdfLib(bytes: Uint8Array): Promise<PDFDocument> {
  return PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
}

/** نص عربي → PNG شفاف عبر Canvas (تشكيل حروف مثالي بواسطة المتصفح) */
async function arabicTextPng(
  text: string,
  opts: { size: number; color: string; bold?: boolean }
): Promise<{ bytes: Uint8Array; w: number; h: number }> {
  const font = `${opts.bold ? "700" : "500"} ${opts.size}px Tajawal, "Noto Sans Arabic", sans-serif`;
  try {
    await document.fonts.load(font, text);
  } catch {
    /* الخط غير متاح — نكمل بخط النظام */
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const pad = Math.ceil(opts.size * 0.25);
  canvas.width = Math.ceil(metrics.width) + pad * 2;
  canvas.height = Math.ceil(opts.size * 1.45);
  const ctx2 = canvas.getContext("2d")!;
  ctx2.clearRect(0, 0, canvas.width, canvas.height);
  ctx2.font = font;
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillStyle = opts.color;
  ctx2.direction = "rtl";
  ctx2.fillText(text, canvas.width / 2, canvas.height / 2);
  const dataUrl = canvas.toDataURL("image/png");
  const res = await fetch(dataUrl);
  const buf = new Uint8Array(await res.arrayBuffer());
  return { bytes: buf, w: canvas.width, h: canvas.height };
}

function resultFile(name: string, bytes: Uint8Array | Blob, fromStep: string, kind: ResultFile["kind"]): ResultFile {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes.buffer as ArrayBuffer], { type: mimeOf(name) });
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    blob,
    url: URL.createObjectURL(blob),
    size: blob.size,
    fromStep,
    kind,
  };
}

function mimeOf(name: string): string {
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".txt")) return "text/plain;charset=utf-8";
  if (name.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}

export interface EngineInput {
  id: string;
  name: string;
  kind: string;
  file: File;
}

/** تحميل بايتات ملف الإدخال */
async function bytesOf(input: EngineInput): Promise<Uint8Array> {
  return new Uint8Array(await input.file.arrayBuffer());
}

/* ─────────── محرك الصور — Canvas داخل المتصفح، بلا خادم ─────────── */

const IMG_EXTS = /\.(png|jpe?g|webp|gif|bmp)$/i;

/** فتح الصورة كـ ImageBitmap — يدعم PNG وJPG وWebP وBMP وأول إطار من GIF */
async function loadBitmap(file: File | Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error("تعذر قراءة الصورة — الصيغ المدعومة: PNG وJPG وWebP وBMP وGIF");
  }
}

/** كانفس بالأبعاد الأصلية يحوي الصورة مرسومة */
function canvasFromBitmap(bm: ImageBitmap, w = bm.width, h = bm.height): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  c.getContext("2d")!.drawImage(bm, 0, 0, c.width, c.height);
  return c;
}

/** ملء الخلفية بيضاء (الشفافية تُستبدل — لصيغ لا تدعم الشفافية مثل JPG) */
function fillWhite(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("تعذر إنشاء الصورة"))), mime, quality)
  );
}

/** تصدير بأول صيغة يدعمها المتصفح فعليًا — المتصفحات لا تدعم كل الصيغ */
async function exportCanvas(
  canvas: HTMLCanvasElement,
  mimes: string[],
  quality?: number
): Promise<{ blob: Blob; ext: string; mime: string }> {
  for (const m of mimes) {
    const blob = await canvasToBlob(canvas, m, quality);
    if (blob.type === m) {
      const ext = m === "image/png" ? "png" : m === "image/jpeg" ? "jpg" : "webp";
      return { blob, ext, mime: m };
    }
  }
  throw new Error("المتصفح لا يدعم صيغة الإخراج المطلوبة — جرّب PNG أو JPG");
}

const CONVERT_QUALITY: Record<string, number> = { عالية: 0.92, متوازنة: 0.8, مضغوطة: 0.6 };
const COMPRESS_QUALITY: Record<string, number> = { خفيف: 0.85, متوسط: 0.72, قوي: 0.55 };

/** تحويل صيغة صورة واحدة */
async function imageConvertOne(
  input: EngineInput,
  params: Record<string, string>,
  label: string
): Promise<ResultFile> {
  const format = params.format === "png" || params.format === "webp" ? params.format : "jpeg";
  const mime = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
  const bm = await loadBitmap(input.file);
  try {
    const canvas = canvasFromBitmap(bm);
    if (mime === "image/jpeg") fillWhite(canvas);
    const q = mime === "image/png" ? undefined : CONVERT_QUALITY[params.quality ?? "متوازنة"] ?? 0.8;
    const { blob } = await exportCanvas(canvas, [mime], q);
    return resultFile(resultName("image_convert", input.name, 0, `.${format === "jpeg" ? "jpg" : format}`), blob, label, "image");
  } finally {
    bm.close();
  }
}

/** تغيير أبعاد صورة واحدة — نسبة مئوية «50%» أو عرض بالبكسل «800» */
async function imageResizeOne(
  input: EngineInput,
  params: Record<string, string>,
  label: string
): Promise<ResultFile> {
  const raw = (params.value ?? "50%").trim();
  const m = raw.match(/^(\d+(?:\.\d+)?)\s*%?$/);
  if (!m) throw new Error("اكتب المقاس كنسبة مثل «50%» أو عرضًا بالبكسل مثل «800»");
  const bm = await loadBitmap(input.file);
  try {
    let w: number;
    let h: number;
    if (raw.includes("%")) {
      const pct = Math.min(400, Math.max(1, Number(m[1]))) / 100;
      w = Math.max(1, Math.round(bm.width * pct));
      h = Math.max(1, Math.round(bm.height * pct));
    } else {
      const target = Math.max(1, Math.round(Number(m[1])));
      const scale = target / bm.width;
      w = target;
      h = Math.max(1, Math.round(bm.height * scale));
    }
    if (w === bm.width && h === bm.height) {
      throw new Error("الصورة بهذه الأبعاد أصلًا — اكتب مقاسًا مختلفًا");
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    // إعادة الرسم بسلاسة
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bm, 0, 0, w, h);
    const isPng = IMG_EXTS.test(input.name) && /\.png$/i.test(input.name);
    const mimes = isPng ? ["image/png"] : ["image/jpeg", "image/png"];
    if (!isPng) fillWhite(canvas);
    const { blob, ext } = await exportCanvas(canvas, mimes, 0.9);
    return resultFile(resultName("image_resize", input.name, 0, `.${ext}`), blob, label, "image");
  } finally {
    bm.close();
  }
}

/** قص مركزي بنسبة أبعاد جاهزة */
const CROP_RATIOS: Record<string, number> = {
  "1:1": 1,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "16:9": 16 / 9,
  "A4طولي": 210 / 297,
  "A4عرضي": 297 / 210,
};

async function imageCropOne(
  input: EngineInput,
  params: Record<string, string>,
  label: string
): Promise<ResultFile> {
  const ratio = CROP_RATIOS[params.ratio ?? "1:1"] ?? 1;
  const bm = await loadBitmap(input.file);
  try {
    const srcAspect = bm.width / bm.height;
    let w = bm.width;
    let h = bm.height;
    if (srcAspect > ratio) w = Math.round(bm.height * ratio); // المصدر أعرض — نقص العرض
    else h = Math.round(bm.width / ratio); // المصدر أطول — نقص الارتفاع
    if (w === bm.width && h === bm.height) {
      throw new Error("الصورة بهذه النسبة أصلًا — لا حاجة للقص");
    }
    const x = Math.round((bm.width - w) / 2);
    const y = Math.round((bm.height - h) / 2);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bm, x, y, w, h, 0, 0, w, h);
    const mimes = /\.png$/i.test(input.name) ? ["image/png"] : ["image/jpeg", "image/png"];
    if (!mimes.includes("image/png")) fillWhite(canvas);
    const { blob, ext } = await exportCanvas(canvas, mimes, 0.9);
    return resultFile(resultName("image_crop", input.name, 0, `.${ext}`), blob, label, "image");
  } finally {
    bm.close();
  }
}

/** تصغير حجم صورة واحدة — الصيغة تُختار بذكاء: WebP تحفظ الشفافية، JPG للعادية */
async function imageCompressOne(
  input: EngineInput,
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile> {
  const level = params.level ?? "متوسط";
  const q = COMPRESS_QUALITY[level] ?? 0.72;
  ctx.onProgress?.(`جارٍ تصغير حجم «${input.name}»…`);
  const bm = await loadBitmap(input.file);
  try {
    const canvas = canvasFromBitmap(bm);
    const jpg = /\.jpe?g$/i.test(input.name);
    // الصور العادية تبقى JPG، وذات الشفافية تتحول WebP حفاظًا على الشفافية (وإن لم يتوفر فأبيض + JPG)
    const mimes = jpg ? ["image/jpeg"] : ["image/webp", "image/jpeg"];
    if (jpg) fillWhite(canvas);
    let out = await exportCanvas(canvas, mimes, q);
    if (!jpg && out.mime === "image/jpeg") {
      // سقط الإخراج إلى JPG — الشفافية صارت سوداء، نعيد التصدير بخلفية بيضاء
      fillWhite(canvas);
      out = await exportCanvas(canvas, ["image/jpeg"], q);
    }
    return resultFile(resultName("compress", input.name, 0, `.${out.ext}`), out.blob, label, "image");
  } finally {
    bm.close();
  }
}

/** تدوير/قلب صورة واحدة */
async function imageRotateOne(
  input: EngineInput,
  angle: string,
  label: string
): Promise<ResultFile> {
  const bm = await loadBitmap(input.file);
  try {
    const swap = angle === "90" || angle === "270";
    const canvas = document.createElement("canvas");
    canvas.width = swap ? bm.height : bm.width;
    canvas.height = swap ? bm.width : bm.height;
    const ctx = canvas.getContext("2d")!;
    if (angle === "flipH") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    } else if (angle === "flipV") {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    } else if (angle === "180") {
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate(Math.PI);
    } else if (angle === "270") {
      ctx.translate(0, canvas.width);
      ctx.rotate(-Math.PI / 2);
    } else {
      ctx.translate(canvas.height, 0);
      ctx.rotate(Math.PI / 2);
    }
    ctx.drawImage(bm, 0, 0);
    const mimes = /\.png$/i.test(input.name) ? ["image/png"] : ["image/jpeg", "image/png"];
    if (!mimes.includes("image/png")) fillWhite(canvas);
    const { blob, ext } = await exportCanvas(canvas, mimes, 0.92);
    return resultFile(resultName("rotate", input.name, 0, `.${ext}`), blob, label, "image");
  } finally {
    bm.close();
  }
}

/** تضمين أي صورة في PDF — png/jpg مباشرة، وwebp/gif/bmp عبر كانفس وسيط */
async function embedAnyImage(doc: PDFDocument, input: EngineInput): Promise<import("pdf-lib").PDFImage> {
  const bytes = await bytesOf(input);
  const name = input.name.toLowerCase();
  if (name.endsWith(".png")) return doc.embedPng(bytes);
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return doc.embedJpg(bytes);
  // صيغ لا يفهمها pdf-lib — نمرر عبر كانفس إلى PNG
  const bm = await loadBitmap(input.file);
  try {
    const canvas = canvasFromBitmap(bm);
    fillWhite(canvas);
    const pngBlob = await canvasToBlob(canvas, "image/png");
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    return doc.embedPng(pngBytes);
  } finally {
    bm.close();
  }
}

/* ─────────── العمليات ─────────── */

export interface RunContext {
  onProgress?: (msg: string) => void;
}

export async function runOp(
  op: string,
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext = {}
): Promise<ResultFile[]> {
  if (inputs.length === 0) {
    throw new Error("لا توجد ملفات مناسبة لهذه الخطوة — أضف ملفاتك أولًا");
  }
  switch (op) {
    case "merge":
      return opMerge(inputs, label, ctx);
    case "merge_pages":
      /* المسار البصري عبر اللوحة يسمى mergePagesVisual مباشرة — هذا المسار للأوامر النصية فقط */
      if (params.all === "1") return opMerge(inputs, label, ctx);
      throw new Error("أداة «دمج صفحات من الملفات» بصرية — افتحها من الشريط واختر الصفحات من اللوحة");
    case "ocr":
      return opOcr(inputs, params, label, ctx);
    case "compress":
      return opCompress(inputs, params, label, ctx);
    case "extract":
      return opExtractOrDelete(inputs, params, "extract", label, ctx);
    case "delete":
      return opExtractOrDelete(inputs, params, "delete", label, ctx);
    case "rotate":
      return opRotate(inputs, params, label, ctx);
    case "reorder":
      return opReorder(inputs, params, label, ctx);
    case "split":
      return opSplit(inputs, label, ctx);
    case "watermark":
      return opWatermark(inputs, params, label, ctx);
    case "remove_watermark":
      return opRemoveWatermark(inputs, params, label, ctx);
    case "page_numbers":
      return opPageNumbers(inputs, params, label, ctx);
    case "images_to_pdf":
      return opImagesToPdf(inputs, params, label, ctx);
    case "pdf_to_images":
      return opPdfToImages(inputs, params, label, ctx);
    case "extract_text":
      return opExtractText(inputs, label, ctx);
    case "metadata":
      return opMetadata(inputs, params, label, ctx);
    case "nup":
      return opNup(inputs, params, label, ctx);
    case "image_convert":
      return opImageConvert(inputs, params, label, ctx);
    case "image_resize":
      return opImageResize(inputs, params, label, ctx);
    case "image_crop":
      return opImageCrop(inputs, params, label, ctx);
    case "pdf_to_word":
      return opToOffice(inputs, "word", label, ctx);
    case "pdf_to_excel":
      return opToOffice(inputs, "excel", label, ctx);
    case "protect":
      return opProtectUnlock(inputs, params, "protect", label, ctx);
    case "unlock":
      return opProtectUnlock(inputs, params, "unlock", label, ctx);
    case "sign":
      throw new Error("أداة التوقيع بصرية — افتحها من الشريط وضع توقيعك على الصفحة");
    default:
      throw new Error("عملية غير معروفة");
  }
}

/* دمج */
async function opMerge(inputs: EngineInput[], label: string, ctx: RunContext): Promise<ResultFile[]> {
  ctx.onProgress?.(`جارٍ دمج ${inputs.length} ملفات…`);
  const out = await PDFDocument.create();
  for (const input of inputs) {
    const src = await loadPdfLib(await bytesOf(input));
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  const bytes = await out.save({ useObjectStreams: true });
  return [resultFile(resultName("merge", inputs[0].name), bytes, label, "pdf")];
}

/* تصغير الحجم — ثلاثة مستويات بذكاء:
   ملف نصي → ضغط الهيكل فقط (الترقيم الصوري يكبّر النصي)
   ملف ممسوح → إعادة بناء الصفحات كصور JPEG (توفير حقيقي) */
async function hasTextLayer(bytes: Uint8Array): Promise<boolean> {
  try {
    const pdfjs = await getPdfjs();
    const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    let len = 0;
    for (let i = 1; i <= Math.min(2, doc.numPages); i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      len += tc.items.reduce((acc, it) => acc + ("str" in it ? it.str.trim().length : 0), 0);
    }
    return len >= 20;
  } catch {
    return false;
  }
}

async function opCompress(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const level = params.level ?? "متوسط";
  const results: ResultFile[] = [];
  for (const input of inputs) {
    // ذكاء النوع: الصور تُصغّر بمحرك الصور، وPDF بمحرك الملفات — حتى في تحديد مختلط
    if (input.kind === "image") {
      results.push(await imageCompressOne(input, params, label, ctx));
      continue;
    }
    ctx.onProgress?.(`جارٍ تصغير حجم «${input.name}»…`);
    const bytes = await bytesOf(input);
    const textual = await hasTextLayer(bytes);
    if (!textual) {
      // ملف ممسوح: إعادة بناء بجودة حسب المستوى
      const pdfjs = await getPdfjs();
      const src = await pdfjs.getDocument({ data: bytes.slice() }).promise;
      const out = await PDFDocument.create();
      const scale = level === "متوسط" ? 1.5 : 1.05;
      const quality = level === "متوسط" ? 0.8 : 0.55;
      for (let i = 1; i <= src.numPages; i++) {
        ctx.onProgress?.(`إعادة بناء الصفحة ${i} من ${src.numPages}…`);
        const page = await src.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const c2 = canvas.getContext("2d")!;
        c2.fillStyle = "#ffffff";
        c2.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: c2, viewport } as never).promise;
        const jpegUrl = canvas.toDataURL("image/jpeg", quality);
        const res = await fetch(jpegUrl);
        const jpegBytes = new Uint8Array(await res.arrayBuffer());
        const img = await out.embedJpg(jpegBytes);
        const p = out.addPage([
          page.getViewport({ scale: 1 }).width,
          page.getViewport({ scale: 1 }).height,
        ]);
        p.drawImage(img, { x: 0, y: 0, width: p.getWidth(), height: p.getHeight() });
      }
      const saved = await out.save({ useObjectStreams: true });
      results.push(resultFile(resultName("compress", input.name), saved, label, "pdf"));
    } else {
      // ملف نصي: ضغط الهيكل + تنظيف البيانات في المتوسط والقوي
      const doc = await loadPdfLib(bytes);
      if (level !== "خفيف") {
        doc.setTitle("");
        doc.setAuthor("");
        doc.setSubject("");
        doc.setKeywords([]);
      }
      const saved = await doc.save({ useObjectStreams: true });
      results.push(resultFile(resultName("compress", input.name), saved, label, "pdf"));
    }
  }
  return results;
}

/* استخراج / حذف صفحات */
async function opExtractOrDelete(
  inputs: EngineInput[],
  params: Record<string, string>,
  mode: "extract" | "delete",
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ ${mode === "extract" ? "استخراج" : "حذف"} الصفحات من «${input.name}»…`);
    const src = await loadPdfLib(await bytesOf(input));
    const total = src.getPageCount();
    const pages = parsePageRanges(params.pages ?? "", total);
    const keep =
      mode === "extract"
        ? pages.map((p) => p - 1)
        : Array.from({ length: total }, (_, i) => i + 1)
            .filter((p) => !pages.includes(p))
            .map((p) => p - 1);
    if (keep.length === 0) {
      throw new Error("لا توجد صفحات متبقية بعد هذه العملية — راجع الأرقام المختارة");
    }
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, keep);
    copied.forEach((p) => out.addPage(p));
    const saved = await out.save({ useObjectStreams: true });
    results.push(resultFile(resultName(mode, input.name), saved, label, "pdf"));
  }
  return results;
}

/* تدوير */
async function opRotate(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const angle = Number.isFinite(Number(params.angle)) ? Number(params.angle ?? "90") : params.angle === "flipH" || params.angle === "flipV" ? params.angle : 90;
  const results: ResultFile[] = [];
  for (const input of inputs) {
    // ذكاء النوع: الصور تُدوّر/تُقلب بالكانفس — والقلب متاح للصور فقط
    if (input.kind === "image") {
      results.push(await imageRotateOne(input, String(angle), label));
      continue;
    }
    if (angle === "flipH" || angle === "flipV") {
      throw new Error("القلب الأفقي/الرأسي متاح للصور فقط — للصفحات اختر زاوية دوران 90 أو 180 أو 270");
    }
    ctx.onProgress?.(`جارٍ تدوير «${input.name}»…`);
    const doc = await loadPdfLib(await bytesOf(input));
    const total = doc.getPageCount();
    const pages = params.pages ? parsePageRanges(params.pages, total) : null;
    doc.getPages().forEach((page, idx) => {
      if (pages && !pages.includes(idx + 1)) return;
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + angle) % 360));
    });
    const saved = await doc.save({ useObjectStreams: true });
    results.push(resultFile(resultName("rotate", input.name), saved, label, "pdf"));
  }
  return results;
}

/* ترتيب */
async function opReorder(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ إعادة الترتيب…`);
    const src = await loadPdfLib(await bytesOf(input));
    const total = src.getPageCount();
    let order: number[];
    if (params.mode === "مخصص" && params.order) {
      order = parsePageRanges(params.order, total);
    } else {
      order = Array.from({ length: total }, (_, i) => total - i);
    }
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, order.map((p) => p - 1));
    copied.forEach((p) => out.addPage(p));
    const saved = await out.save({ useObjectStreams: true });
    results.push(resultFile(resultName("reorder", input.name), saved, label, "pdf"));
  }
  return results;
}

/* فصل كل صفحة */
async function opSplit(inputs: EngineInput[], label: string, ctx: RunContext): Promise<ResultFile[]> {
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ فصل صفحات «${input.name}»…`);
    const src = await loadPdfLib(await bytesOf(input));
    const total = src.getPageCount();
    for (let i = 0; i < total; i++) {
      ctx.onProgress?.(`فصل «${input.name}»: الصفحة ${toHindiDigits(i + 1)} من ${toHindiDigits(total)}`);
      const out = await PDFDocument.create();
      const [page] = await out.copyPages(src, [i]);
      out.addPage(page);
      const saved = await out.save({ useObjectStreams: true });
      results.push(resultFile(resultName("split", input.name, i), saved, label, "pdf"));
    }
  }
  return results;
}

/* فصل بصري بعمودين: الصفحات المسحوبة → ملف «المفصولة» والباقي → ملف «المتبقية» */
export interface SplitOutcome {
  separated: { name: string; blob: Blob } | null;
  remainder: { name: string; blob: Blob } | null;
}

export async function splitPagesVisual(file: File, pages: number[]): Promise<SplitOutcome> {
  const bytes = await bytesOf({ id: "", name: file.name, kind: "pdf", file });
  const src = await loadPdfLib(bytes);
  const total = src.getPageCount();
  const chosen = [...new Set(pages)].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  if (chosen.length === 0) throw new Error("عمود الفصل فارغ — اسحب صفحة واحدة على الأقل");
  const rest = Array.from({ length: total }, (_, i) => i + 1).filter((p) => !chosen.includes(p));

  const mk = async (pageNos: number[], name: string): Promise<{ name: string; blob: Blob }> => {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, pageNos.map((p) => p - 1));
    copied.forEach((p) => out.addPage(p));
    const saved = await out.save({ useObjectStreams: true });
    const blob = new Blob([saved as unknown as BlobPart], { type: "application/pdf" });
    return { name, blob };
  };

  const base = stripExt(file.name);
  const separated = await mk(chosen, `${base} — الصفحات-المفصولة.pdf`);
  const remainder = rest.length > 0 ? await mk(rest, `${base} — الصفحات-المتبقية.pdf`) : null;
  return { separated, remainder };
}

/* ─── المرحلة 3 — دمج صفحات من عدة ملفات بالترتيب المختار ───
   «صفحة من هنا وصفحة من ملف آخر» — الطلب في القائمة هو الترتيب النهائي
   وكل مصدر يُحمّل مرة واحدة مهما تكررت صفحاته */
export async function mergePagesVisual(
  picks: { file: File; page: number }[]
): Promise<{ name: string; blob: Blob }> {
  if (picks.length === 0) {
    throw new Error("لم تختر أي صفحة — اختر صفحة واحدة على الأقل من اللوحة");
  }
  const out = await PDFDocument.create();
  const cache = new Map<string, PDFDocument>();
  for (const pick of picks) {
    const key = `${pick.file.name}:${pick.file.size}`;
    let src = cache.get(key);
    if (!src) {
      src = await loadPdfLib(
        await bytesOf({ id: "", name: pick.file.name, kind: "pdf", file: pick.file })
      );
      cache.set(key, src);
    }
    const total = src.getPageCount();
    if (pick.page < 1 || pick.page > total) {
      throw new Error(
        `الصفحة ${toHindiDigits(pick.page)} في «${pick.file.name}» غير موجودة — الملف فيه ${toHindiDigits(total)} صفحات`
      );
    }
    const [copied] = await out.copyPages(src, [pick.page - 1]);
    out.addPage(copied);
  }
  const saved = await out.save({ useObjectStreams: true });
  const blob = new Blob([saved as unknown as BlobPart], { type: "application/pdf" });
  return { name: "دمج-الصفحات-المختارة.pdf", blob };
}

/* ─── المرحلة 1 — شريط الصفحات الذكي: أفعال سريعة على صفحة واحدة ───
   حذف/تدوير 90°/استخراج/تكرار — صفحة واحدة في نقرة، والناتج ملف جديد
   غير مدمَّر (الأصل يبقى كما هو في قائمة الملفات) */
export type PageQuickAction = "delete" | "rotate" | "extract" | "duplicate";

export async function pageQuickAction(
  file: File,
  action: PageQuickAction,
  page: number
): Promise<{ name: string; blob: Blob }> {
  const bytes = await bytesOf({ id: "", name: file.name, kind: "pdf", file });
  const doc = await loadPdfLib(bytes);
  const total = doc.getPageCount();
  if (page < 1 || page > total) {
    throw new Error(`الصفحة ${toHindiDigits(page)} غير موجودة — الملف فيه ${toHindiDigits(total)} صفحات`);
  }
  const toBlob = (saved: Uint8Array) =>
    new Blob([saved as unknown as BlobPart], { type: "application/pdf" });
  const base = stripExt(file.name);
  const n = toHindiDigits(page);

  if (action === "rotate") {
    const p = doc.getPage(page - 1);
    p.setRotation(degrees((p.getRotation().angle + 90) % 360));
    const saved = await doc.save({ useObjectStreams: true });
    return { name: `${base}-مدوّر-صفحة-${n}.pdf`, blob: toBlob(saved) };
  }

  if (action === "duplicate") {
    const [copied] = await doc.copyPages(doc, [page - 1]);
    doc.insertPage(page, copied);
    const saved = await doc.save({ useObjectStreams: true });
    return { name: `${base}-مكرر-صفحة-${n}.pdf`, blob: toBlob(saved) };
  }

  /* استخراج / حذف */
  const keep =
    action === "extract"
      ? [page - 1]
      : Array.from({ length: total }, (_, i) => i).filter((i) => i !== page - 1);
  if (keep.length === 0) throw new Error("لا يمكن حذف الصفحة الوحيدة في الملف");
  const out = await PDFDocument.create();
  const copied = await out.copyPages(doc, keep);
  copied.forEach((p) => out.addPage(p));
  const saved = await out.save({ useObjectStreams: true });
  return {
    name:
      action === "extract"
        ? `${base}-صفحة-${n}.pdf`
        : `${base}-بعد-حذف-صفحة-${n}.pdf`,
    blob: toBlob(saved),
  };
}

/* ختم (علامة مائية) */
async function opWatermark(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const text = params.text || "مسودة";
  const colorMap: Record<string, string> = { رمادي: "#6b7280", احمر: "#dc2626", ازرق: "#2563eb" };
  const color = colorMap[params.color ?? "رمادي"] ?? "#6b7280";
  const { bytes: png, w, h } = await arabicTextPng(text, { size: 88, color, bold: true });
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ ختم «${input.name}»…`);
    const doc = await loadPdfLib(await bytesOf(input));
    const img = await doc.embedPng(png);
    for (const page of doc.getPages()) {
      const pw = page.getWidth();
      const ph = page.getHeight();
      const targetW = pw * 0.62;
      const targetH = (h / w) * targetW;
      const theta = (45 * Math.PI) / 180;
      const cx = pw / 2;
      const cy = ph / 2;
      const ox = (targetW / 2) * Math.cos(theta) - (targetH / 2) * Math.sin(theta);
      const oy = (targetW / 2) * Math.sin(theta) + (targetH / 2) * Math.cos(theta);
      page.drawImage(img, {
        x: cx - ox,
        y: cy - oy,
        width: targetW,
        height: targetH,
        rotate: degrees(45),
        opacity: 0.16,
      });
    }
    const saved = await doc.save({ useObjectStreams: true });
    results.push(resultFile(resultName("watermark", input.name), saved, label, "pdf"));
  }
  return results;
}

/* حذف العلامة المائية — المعالجة على الخادم (PyMuPDF) مع حذف الملف فورًا.
   نحذف: نصوص العلامة المطابقة (بكل صيغ العربية: منطقي/معكوس/مُشكَّل) + الطوابع والتعليقات.
   لا تُحذف العلامات المرسومة كصور مدمجة داخل الصفحة. */
async function opRemoveWatermark(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ تنظيف العلامات من «${input.name}»…`);
    const fd = new FormData();
    fd.append("file", input.file, input.name);
    fd.append("texts", params.text ?? "");
    fd.append("annots", "1");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 180_000);
    let res: Response;
    try {
      res = await fetch("/api/unmark", { method: "POST", body: fd, signal: ctrl.signal });
    } catch {
      throw new Error("انقطع الاتصال بالخادم أثناء التنظيف — تحقق من الشبكة وأعد المحاولة");
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      let msg = "تعذر تنظيف العلامة المائية";
      try {
        const j = (await res.json()) as { error?: string };
        if (j?.error) msg = j.error;
      } catch {
        /* رد غير JSON */
      }
      throw new Error(msg);
    }
    const raw = res.headers.get("X-Unmark-Report");
    let report0: { pages?: number; annots?: number; hits?: number } | null = null;
    if (raw) {
      try {
        report0 = JSON.parse(decodeURIComponent(raw));
      } catch {
        /* بلا تقرير */
      }
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length === 0) throw new Error("جاء رد الخادم فارغًا — أعد المحاولة");
    const report = report0;
    if (report && (report.hits ?? 0) === 0 && (report.annots ?? 0) === 0) {
      // ملف نظيف في الدفعة — نتجاوزه دون إفشال البقية
      const { toast } = await import("sonner");
      toast.info(`«${input.name}»: لا توجد علامات مطابقة فيه — لم نغيّره`);
      continue;
    }
    const { toast } = await import("sonner");
    const parts: string[] = [];
    if (report?.hits) parts.push(`${toHindiDigits(report.hits)} موضع نصي`);
    if (report?.annots) parts.push(`${toHindiDigits(report.annots)} طابع/تعليق`);
    toast.success(`«${input.name}»: تم الحذف — ${parts.join(" و") || "بدون تغييرات"}`);
    const blob = new Blob([bytes], { type: "application/pdf" });
    results.push(resultFile(resultName("remove_watermark", input.name), blob, label, "pdf"));
  }
  if (results.length === 0 && inputs.length > 0) {
    throw new Error(
      "لم نجد ما يُحذف في الملفات المحددة — اكتب نص العلامة كما يظهر بالضبط، أو قد تكون العلامة مطبوعة داخل صور (تلك لا نستطيع حذفها)"
    );
  }
  return results;
}

/* ترقيم الصفحات */
async function opPageNumbers(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ ترقيم «${input.name}»…`);
    const doc = await loadPdfLib(await bytesOf(input));
    const total = doc.getPageCount();
    const fmt = params.format ?? "رقم فقط";
    for (let i = 1; i <= total; i++) {
      const shown = String(i);
      const text = fmt === "صفحة من" ? `صفحة ${shown} من ${total}` : shown;
      const { bytes: png, w, h } = await arabicTextPng(text, { size: 60, color: "#1b2438" });
      const img = await doc.embedPng(png);
      const page = doc.getPage(i - 1);
      const targetH = 22;
      const targetW = (w / h) * targetH;
      page.drawImage(img, {
        x: (page.getWidth() - targetW) / 2,
        y: 16,
        width: targetW,
        height: targetH,
        opacity: 0.85,
      });
    }
    const saved = await doc.save({ useObjectStreams: true });
    results.push(resultFile(resultName("page_numbers", input.name), saved, label, "pdf"));
  }
  return results;
}

/* صور إلى PDF — ملف واحد مرتّب أو ملف منفصل لكل صورة */
async function opImagesToPdf(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const perFile = params.grouping === "ملف لكل صورة";
  ctx.onProgress?.(
    perFile
      ? `جارٍ تحويل ${inputs.length} صور إلى ملف PDF لكل صورة…`
      : `جارٍ تحويل ${inputs.length} صور إلى PDF…`
  );
  if (perFile) {
    const results: ResultFile[] = [];
    for (const input of inputs) {
      const out = await PDFDocument.create();
      const img = await embedAnyImage(out, input);
      if ((params.layout ?? "ملائم تلقائي") === "A4") {
        const page = out.addPage([595.28, 841.89]);
        const margin = 28;
        const scale = Math.min((page.getWidth() - margin * 2) / img.width, (page.getHeight() - margin * 2) / img.height);
        page.drawImage(img, {
          x: (page.getWidth() - img.width * scale) / 2,
          y: (page.getHeight() - img.height * scale) / 2,
          width: img.width * scale,
          height: img.height * scale,
        });
      } else {
        const page = out.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const saved = await out.save({ useObjectStreams: true });
      results.push(resultFile(resultName("images_to_pdf", input.name), saved, label, "pdf"));
    }
    return results;
  }
  const out = await PDFDocument.create();
  for (const input of inputs) {
    const img = await embedAnyImage(out, input);
    if ((params.layout ?? "ملائم تلقائي") === "A4") {
      const page = out.addPage([595.28, 841.89]);
      const margin = 28;
      const maxW = page.getWidth() - margin * 2;
      const maxH = page.getHeight() - margin * 2;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      page.drawImage(img, {
        x: (page.getWidth() - img.width * scale) / 2,
        y: (page.getHeight() - img.height * scale) / 2,
        width: img.width * scale,
        height: img.height * scale,
      });
    } else {
      const page = out.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
  }
  const saved = await out.save({ useObjectStreams: true });
  return [resultFile(resultName("images_to_pdf", inputs[0].name), saved, label, "pdf")];
}

/* PDF إلى صور */
async function opPdfToImages(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const pdfjs = await getPdfjs();
  const format = params.format ?? "png";
  const scaleMap: Record<string, number> = { مضغوطة: 1.2, متوازنة: 2.0, عالية: 3.0 };
  const scale = scaleMap[params.quality ?? "متوازنة"] ?? 2.0;
  const results: ResultFile[] = [];
  for (const input of inputs) {
    const bytes = await bytesOf(input);
    const src = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    for (let i = 1; i <= src.numPages; i++) {
      ctx.onProgress?.(`تحويل الصفحة ${i} من ${src.numPages} إلى صورة…`);
      const page = await src.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const c2 = canvas.getContext("2d")!;
      c2.fillStyle = "#ffffff";
      c2.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: c2, viewport } as never).promise;
      const mime = format === "jpeg" ? "image/jpeg" : "image/png";
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("تعذر إنشاء الصورة"))), mime, 0.9)
      );
      const ext = format === "jpeg" ? "jpg" : "png";
      results.push(resultFile(resultName("pdf_to_images", input.name, i - 1, "." + ext), blob, label, "image"));
    }
  }
  return results;
}

/* استخراج النص */
async function opExtractText(inputs: EngineInput[], label: string, ctx: RunContext): Promise<ResultFile[]> {  const pdfjs = await getPdfjs();
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ استخراج نصوص «${input.name}»…`);
    const bytes = await bytesOf(input);
    const src = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    const chunks: string[] = [];
    for (let i = 1; i <= src.numPages; i++) {
      const page = await src.getPage(i);
      const content = await page.getTextContent();
      const line = content.items
        .map((it) => ("str" in it ? it.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      chunks.push(`── الصفحة ${toHindiDigits(i)} ──\n${line}`);
    }
    const text = chunks.join("\n\n");
    const blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
    results.push(resultFile(resultName("extract_text", input.name), blob, label, "other"));
  }
  return results;
}

/* ─── OCR — قراءة النص من الصور والصفحات الممسوحة ضوئيًا ───
   tesseract.js داخل المتصفح (خصوصية تامة) — عامل واحد يُعاد استخدامه لكل الصفحات
   أول تشغيل يحمّل بيانات اللغة ثم تتخزّن في المتصفح */
async function opOcr(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const lang = params.lang === "ara" || params.lang === "eng" ? params.lang : "ara+eng";
  const Tesseract = await import("tesseract.js");
  ctx.onProgress?.("تحضير محرك القراءة… (أول مرة يُحمّل ملف اللغة ثم يتخزّن)");
  let worker: import("tesseract.js").Worker;
  try {
    worker = await Tesseract.createWorker(lang, 1, {
      langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
    });
  } catch {
    throw new Error(
      "تعذّر تحميل بيانات اللغة لمحرك القراءة — يحتاج اتصالًا بالإنترنت أول مرة فقط، ثم جرّب مرة أخرى"
    );
  }
  try {
    const results: ResultFile[] = [];
    for (const input of inputs) {
      if (input.kind === "image") {
        ctx.onProgress?.(`جارٍ قراءة نص «${input.name}»…`);
        const bm = await loadBitmap(input.file);
        try {
          const canvas = canvasFromBitmap(bm);
          fillWhite(canvas);
          const { data } = await worker.recognize(canvas);
          const text = data.text.replace(/\n{3,}/g, "\n\n").trim();
          const blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
          results.push(resultFile(resultName("ocr", input.name), blob, label, "other"));
        } finally {
          bm.close();
        }
        continue;
      }
      const pdfjs = await getPdfjs();
      const bytes = await bytesOf(input);
      const src = await pdfjs.getDocument({ data: bytes.slice() }).promise;
      const chunks: string[] = [];
      for (let i = 1; i <= src.numPages; i++) {
        ctx.onProgress?.(`قراءة نص الصفحة ${toHindiDigits(i)} من ${toHindiDigits(src.numPages)}…`);
        const page = await src.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const c2 = canvas.getContext("2d")!;
        c2.fillStyle = "#ffffff";
        c2.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: c2, viewport } as never).promise;
        const { data } = await worker.recognize(canvas);
        chunks.push(`── الصفحة ${toHindiDigits(i)} ──\n${data.text.replace(/\n{3,}/g, "\n\n").trim()}`);
      }
      const text = chunks.join("\n\n");
      const blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
      results.push(resultFile(resultName("ocr", input.name), blob, label, "other"));
    }
    return results;
  } finally {
    await worker.terminate();
  }
}

/* التحويل إلى Word / Excel — نفس المسار الذكي: نص حقيقي مباشرة، ممسوح عبر OCR */
async function opToOffice(
  inputs: EngineInput[],
  target: "word" | "excel",
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ تحويل «${input.name}» إلى ${target === "word" ? "Word" : "Excel"}…`);
    const doc = await collectOfficeDoc(input, "ara+eng", (m) => ctx.onProgress?.(m));
    if (!doc.pages.some((p) => p.lines.length)) {
      throw new Error(
        target === "word"
          ? "ما قدرناش نقرأ نصًا من الملف — لو صورة غير واضحة جرّب أداة OCR أولًا"
          : "ما قدرناش نقرأ نصًا من الملف — الجداول في صور غير واضحة تحتاج أداة OCR بجودة أعلى"
      );
    }
    ctx.onProgress?.(
      doc.source === "text"
        ? `نُستخرج النص مباشرة (${toHindiDigits(doc.pages.length)} صفحات) — جارٍ بناء الملف…`
        : "القراءة تمت بالـOCR — جارٍ بناء الملف…"
    );
    const blob =
      target === "word" ? await buildDocx(doc, input.name) : await buildXlsx(doc, input.name);
    results.push(
      resultFile(
        resultName(target === "word" ? "pdf_to_word" : "pdf_to_excel", input.name),
        blob,
        label,
        "other"
      )
    );
  }
  return results;
}

/* بيانات الملف — تعديل الحقول أو مسحها كلها بضغطة (خصوصية) */
async function opMetadata(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const clear = params.mode === "clear";
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(
      clear ? `جارٍ مسح بيانات «${input.name}»…` : `جارٍ ضبط بيانات «${input.name}»…`
    );
    const doc = await loadPdfLib(await bytesOf(input));
    if (clear) {
      /* مسح حقيقي للخصوصية: حذف مفاتيح /Info + تعطيل القيم غير المباشرة
         + تصفير تدفق XMP (المرجع وحده لا يكفي — البقايا تظل مقروءة بالبايتات) */
      const infoObj = doc.context.trailerInfo.Info;
      const infoDict = infoObj ? doc.context.lookup(infoObj) : undefined;
      if (infoDict instanceof PDFDict) {
        for (const key of [
          "Title", "Author", "Subject", "Keywords",
          "Creator", "Producer", "CreationDate", "ModDate",
        ]) {
          const k = PDFName.of(key);
          const val = infoDict.get(k);
          if (val instanceof PDFRef) {
            const obj = doc.context.lookup(val);
            if (obj instanceof PDFString || obj instanceof PDFHexString) {
              doc.context.assign(val, PDFString.of(""));
            }
          }
          infoDict.delete(k);
        }
      }
      const metaVal = doc.catalog.get(PDFName.of("Metadata"));
      if (metaVal) {
        const resolved = doc.context.lookup(metaVal);
        if (resolved instanceof PDFRawStream) resolved.contents.fill(0);
        doc.catalog.delete(PDFName.of("Metadata"));
      }
    } else {
      if (params.title) doc.setTitle(params.title);
      if (params.author) doc.setAuthor(params.author);
      if (params.subject) doc.setSubject(params.subject);
      if (params.keywords) {
        const list = params.keywords
          .split(/[،,]/)
          .map((k) => k.trim())
          .filter(Boolean);
        if (list.length) doc.setKeywords(list);
      }
      doc.setModificationDate(new Date());
      doc.setProducer("محوّل PDF");
    }
    const saved = await doc.save({ useObjectStreams: true });
    results.push(resultFile(resultName("metadata", input.name), saved, label, "pdf"));
  }
  return results;
}

/* قراءة البيانات الحالية للعرض والتعبئة المسبقة — آمنة على الملفات المقفولة */
export interface PdfMetaInfo {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  created?: string;
  modified?: string;
  encrypted?: boolean;
}

export async function readPdfMetadata(file: File): Promise<PdfMetaInfo> {
  try {
    const doc = await loadPdfLib(new Uint8Array(await file.arrayBuffer()));
    const fmt = (d: Date | undefined) => {
      if (!d || Number.isNaN(d.getTime())) return undefined;
      return d.toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });
    };
    return {
      title: doc.getTitle() || undefined,
      author: doc.getAuthor() || undefined,
      subject: doc.getSubject() || undefined,
      keywords: doc.getKeywords() || undefined,
      creator: doc.getCreator() || undefined,
      producer: doc.getProducer() || undefined,
      created: fmt(doc.getCreationDate()),
      modified: fmt(doc.getModificationDate()),
    };
  } catch {
    return { encrypted: true };
  }
}

/* قفل/فتح القفل بكلمة سر — qpdf-wasm داخل المتصفح */
async function opProtectUnlock(
  inputs: EngineInput[],
  params: Record<string, string>,
  mode: "protect" | "unlock",
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(
      mode === "protect" ? `جارٍ قفل «${input.name}»…` : `جارٍ فتح قفل «${input.name}»…`
    );
    const bytes = await bytesOf(input);
    const out =
      mode === "protect"
        ? await protectPdf(bytes, (params.password ?? "").trim())
        : await unlockPdf(bytes, params.password ?? "");
    results.push(resultFile(resultName(mode, input.name), out, label, "pdf"));
  }
  return results;
}

/* عدة صفحات في الورقة */
async function opNup(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ تجميع الصفحات في أوراق…`);
    const src = await loadPdfLib(await bytesOf(input));
    const out = await PDFDocument.create();
    const indices = src.getPageIndices();
    for (let i = 0; i < indices.length; i += 2) {
      const pair = indices.slice(i, i + 2);
      const embedded = await out.embedPdf(src, pair);
      const page = out.addPage([841.89, 595.28]); // A4 عرضي
      const slotW = page.getWidth() / 2 - 18;
      const slotH = page.getHeight() - 24;
      embedded.forEach((emb, j) => {
        const scale = Math.min(slotW / emb.width, slotH / emb.height);
        const w = emb.width * scale;
        const h = emb.height * scale;
        const x = j === 0 ? page.getWidth() - 12 - w : 12; // RTL: الأولى يمين
        page.drawPage(emb, { x, y: (page.getHeight() - h) / 2, width: w, height: h });
      });
    }
    const saved = await out.save({ useObjectStreams: true });
    results.push(resultFile(resultName("nup", input.name), saved, label, "pdf"));
  }
  return results;
}

/* تحويل صيغة الصور */
async function opImageConvert(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ تحويل «${input.name}» إلى الصيغة الجديدة…`);
    results.push(await imageConvertOne(input, params, label));
  }
  return results;
}

/* تغيير أبعاد الصور */
async function opImageResize(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ تغيير أبعاد «${input.name}»…`);
    results.push(await imageResizeOne(input, params, label));
  }
  return results;
}

/* قص الصور بنسبة مركزي */
async function opImageCrop(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ قص «${input.name}»…`);
    results.push(await imageCropOne(input, params, label));
  }
  return results;
}

/* ─────────── الفحص والمصغّرات ─────────── */

export interface InspectInfo {
  pages: number;
  thumb?: string;
  scanned: boolean;
}

/** فحص PDF سريع: عدد الصفحات + مصغّرة + هل هو ممسوح ضوئيًا */
export async function inspectPdf(file: File): Promise<InspectInfo> {
  const pdfjs = await getPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const pages = doc.numPages;

  // مصغّرة الصفحة الأولى
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 0.4 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const c2 = canvas.getContext("2d")!;
  c2.fillStyle = "#ffffff";
  c2.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: c2, viewport } as never).promise;
  const thumb = canvas.toDataURL("image/png");

  // كشف الممسوح: نص الصفحتين الأوليين
  let textLen = 0;
  for (let i = 1; i <= Math.min(2, pages); i++) {
    const p = await doc.getPage(i);
    const tc = await p.getTextContent();
    textLen += tc.items.reduce((acc, it) => acc + ("str" in it ? it.str.trim().length : 0), 0);
  }
  return { pages, thumb, scanned: textLen < 20 };
}

/** مصغّرة صورة */
export async function inspectImage(file: File): Promise<{ thumb: string }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 220 / img.width);
      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve({ thumb: canvas.toDataURL("image/png") });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ thumb: "" });
    };
    img.src = url;
  });
}

/** مصغّرات كل صفحات PDF — للاختيار البصري */
export async function pdfPageThumbs(file: File, maxPages = 60): Promise<string[]> {
  const pdfjs = await getPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const thumbs: string[] = [];
  const n = Math.min(doc.numPages, maxPages);
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 0.32 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const c2 = canvas.getContext("2d")!;
    c2.fillStyle = "#ffffff";
    c2.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: c2, viewport } as never).promise;
    thumbs.push(canvas.toDataURL("image/png"));
  }
  return thumbs;
}

/** إنشاء ZIP من النتائج */
export async function zipResults(files: ResultFile[]): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const used = new Set<string>();
  for (const f of files) {
    let name = f.name;
    let k = 2;
    while (used.has(name)) {
      name = f.name.replace(/(\.[^.]+)$/, `-${k}$1`);
      k++;
    }
    used.add(name);
    zip.file(name, f.blob);
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

/** تنزيل ملف */
export function downloadBlob(blob: Blob, name: string): boolean {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // مهلة أطول حتى يبقى الرابط صالحًا إن احتاج المستخدم فتحه من تبويب مستقل
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return isEmbedded();
}

/** هل نعمل داخل إطار مضمّن (معاينة داخل تطبيق آخر)؟ — التنزيل قد يكون محجوبًا هناك */
export function isEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true; // منع الوصول عبر الحدود = إطار مضمّن من أصل مختلف
  }
}

/** فتح مخرج في تبويب مستقل — بديل موثوق حين تمنع المعاينة التنزيل المباشر */
export function openBlobInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    // حاجب النوافذ منع الفتح — نترك الرابط حيًا مدة أطول ونجرب عبر رابط مخفي
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

/* ─────────── ترقية التعديل: نص PDF حقيقي + حجب آمن ───────────
   النص المكتوب يُضمَّن بخط Tajawal كنص PDF أصلي (عربي مُشكَّل، قابل للتحديد والنسخ)
   والحجم يُقرأ 100% من بيانات النص المجاور — والحجب مستطيل معتم يخفي أي سطر بنقرة */

/** عنصر نصي بإحداثيات PDF الحقيقية (أساس السطر، y من أسفل الصفحة) */
export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  w: number;
  sizePt: number;
  bold?: boolean;
}

/** عناصر نص الصفحة + أبعادها بوحدات PDF */
export interface PageInfo {
  items: PdfTextItem[];
  w: number;
  h: number;
}

/** قراءة عناصر النص بإحداثياتها وأحجامها الحقيقية — أساس مطابقة الحجم + كشف الخط العريض */
export async function pageTextItems(file: File, pageNo: number): Promise<PageInfo> {
  const pdfjs = await getPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const page = await doc.getPage(Math.max(1, pageNo));
  const v1 = page.getViewport({ scale: 1 });
  const tc = await page.getTextContent();
  /* اسم الخط الحقيقي لكل عنصر → نكشف العريض منه (Arial-BoldMT / Helvetica-Bold …) */
  const boldById = new Map<string, boolean>();
  const boldOf = (fid: string | undefined): boolean => {
    if (!fid) return false;
    if (boldById.has(fid)) return boldById.get(fid)!;
    let bold = false;
    try {
      const fo = (
        page as unknown as {
          commonObjs?: { get?: (id: string) => unknown };
        }
      ).commonObjs?.get?.(fid);
      const nm = String(
        (fo as { name?: string; fallbackName?: string })?.name ??
          (fo as { fallbackName?: string })?.fallbackName ??
          fid
      );
      bold = /bold|black|heavy|semib|[-_.]bd\b/i.test(nm) && !/nobot/i.test(nm);
    } catch {
      bold = /bold|black|heavy|[-_.]bd\b/i.test(fid);
    }
    boldById.set(fid, bold);
    return bold;
  };
  const items: PdfTextItem[] = [];
  for (const it of tc.items as unknown as {
    str: string;
    transform: number[];
    width: number;
    fontName?: string;
  }[]) {
    if (!it.str || !it.str.trim()) continue;
    const t = it.transform;
    const sizePt = Math.hypot(t[2], t[3]) || Math.hypot(t[0], t[1]) || 12;
    items.push({ str: it.str, x: t[4], y: t[5], w: it.width || 0, sizePt, bold: boldOf(it.fontName) });
  }
  (doc as unknown as { destroy?: () => void }).destroy?.();
  return { items, w: v1.width, h: v1.height };
}

/** قناع حجب بإحداثيات طبيعية (y من الأعلى 0..1) — يُحوَّل لمستطيل PDF داخليًا */
export interface RealMaskNorm {
  page: number; // 1-based
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string; // hex
}

/** نص حقيقي بإحداثيات طبيعية: x ثبات اليمين، y أساس السطر (من الأعلى 0..1) */
export interface RealTextNorm {
  page: number;
  x: number;
  y: number;
  sizePt: number;
  text: string;
  color: string; // hex
  bold?: boolean;
}

let tajawalCache: Uint8Array | null = null;
async function getTajawal(): Promise<Uint8Array> {
  if (!tajawalCache) {
    const res = await fetch("/fonts/Tajawal-Regular.ttf");
    if (!res.ok) throw new Error("تعذّر تحميل خط الكتابة");
    tajawalCache = new Uint8Array(await res.arrayBuffer());
  }
  return tajawalCache.slice();
}

let tajawalBoldCache: Uint8Array | null = null;
async function getTajawalBold(): Promise<Uint8Array> {
  if (!tajawalBoldCache) {
    const res = await fetch("/fonts/Tajawal-Bold.ttf");
    if (!res.ok) throw new Error("تعذّر تحميل خط الكتابة العريض");
    tajawalBoldCache = new Uint8Array(await res.arrayBuffer());
  }
  return tajawalBoldCache.slice();
}

function hexToRgb01(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const v = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(v, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/* ── تخطيط bidi مبسّط: fontkit يعكس كامل السطر للـRTL فيكسر ترتيب الأرقام اللاتينية —
   الحل: نجزّئ السطر إلى جُمل (عربي / لاتيني-أرقام / محايد) ونرسم كل جملة بموضعها:
   العربية تُشكّل وتُعكس داخل جملتها فقط، والأرقام تُرسم LTR كما هي، والتدفق من اليمين لليسار */
const RTL_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LTR_RE = /[A-Za-z0-9\u00C0-\u024F\u0370-\u03FF]/;

function charKind(ch: string): "rtl" | "ltr" | "n" {
  if (RTL_RE.test(ch)) return "rtl";
  if (LTR_RE.test(ch)) return "ltr";
  return "n";
}

function runsOf(text: string): { t: string; k: "rtl" | "ltr" | "n" }[] {
  const raw: { t: string; k: "rtl" | "ltr" | "n" }[] = [];
  let i = 0;
  while (i < text.length) {
    const k = charKind(text[i]);
    let j = i + 1;
    while (j < text.length && charKind(text[j]) === k) j++;
    raw.push({ t: text.slice(i, j), k });
    i = j;
  }
  /* المحايدات تنصهر بالجارتين المتشابهتين — وإلا تبقى جملة محايدة مستقلة */
  const merged: { t: string; k: "rtl" | "ltr" | "n" }[] = [];
  for (let idx = 0; idx < raw.length; idx++) {
    const r = raw[idx];
    if (r.k === "n") {
      const prev = merged[merged.length - 1];
      const next = raw[idx + 1];
      if (prev && next && prev.k === next.k && prev.k !== "n") {
        prev.t += r.t;
        continue;
      }
    }
    merged.push(r);
  }
  return merged;
}

/** رسم نص مختلط (عربي + أرقام/لاتيني) مثبّت من اليمين — بنفس ترتيب bidi في معاينة المتصفح */
function drawBidiRight(
  pg: import("pdf-lib").PDFPage,
  font: import("pdf-lib").PDFFont,
  text: string,
  size: number,
  rightX: number,
  y: number,
  color: ReturnType<typeof rgb>,
  W: number
) {
  const hasRtl = [...text].some((ch) => charKind(ch) === "rtl");
  if (!hasRtl) {
    /* لاتيني خالص: لا انعكاس — يُرسم ككتلة واحدة مثبّتة من اليمين */
    const w = font.widthOfTextAtSize(text, size);
    pg.drawText(text, { x: Math.max(2, rightX - w), y, size, font, color });
    return;
  }
  const runs = runsOf(text);
  const widths = runs.map((r) => font.widthOfTextAtSize(r.t, size));
  const total = widths.reduce((a, b) => a + b, 0);
  let cursor = Math.min(W - 2, rightX); /* حافة اليمين */
  if (cursor - total < 2) cursor = total + 2; /* نزح الكتلة كلها لتبقى داخل الصفحة */
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    const w = widths[i];
    if (r.k !== "n" || r.t.trim()) {
      pg.drawText(r.t, { x: cursor - w, y, size, font, color });
    }
    cursor -= w;
  }
}

/** التمريرة الحقيقية: أقنعة الحجب أولًا ثم النصوص فوقها —
 *  فيعمل «الكتابة فوق نص محجوب» في حفظ واحد. الأقنعة والنصوص تُرسم أصلًا في الـPDF */
export async function drawRealEdits(
  pdfBytes: Uint8Array,
  masks: RealMaskNorm[],
  texts: RealTextNorm[]
): Promise<Uint8Array> {
  if (masks.length === 0 && texts.length === 0) return pdfBytes;
  const fontkitMod = await import("@pdf-lib/fontkit");
  const fontkit = ((fontkitMod as unknown as { default?: unknown }).default ??
    fontkitMod) as unknown as Parameters<PDFDocument["registerFontkit"]>[0];
  const out = await loadPdfLib(pdfBytes.slice());
  out.registerFontkit(fontkit);
  const fontReg = await out.embedFont(await getTajawal(), { subset: true });
  const fontBold = await out.embedFont(await getTajawalBold(), { subset: true });

  /* تجميع حسب الصفحة مع حفظ ترتيب: أقنعة ثم نصوص */
  const pages = new Map<number, { masks: RealMaskNorm[]; texts: RealTextNorm[] }>();
  for (const m of masks) {
    const e = pages.get(m.page) ?? { masks: [], texts: [] };
    e.masks.push(m);
    pages.set(m.page, e);
  }
  for (const t of texts) {
    const e = pages.get(t.page) ?? { masks: [], texts: [] };
    e.texts.push(t);
    pages.set(t.page, e);
  }

  for (const [pageNo, e] of pages) {
    const pg = out.getPage(pageNo - 1);
    const W = pg.getWidth();
    const H = pg.getHeight();
    for (const m of e.masks) {
      const [r, g, b] = hexToRgb01(m.color);
      const x = Math.max(0, Math.min(W, m.x0 * W));
      const x2 = Math.max(0, Math.min(W, m.x1 * W));
      const yBottom = Math.max(0, Math.min(H, (1 - m.y1) * H));
      const yTop = Math.max(0, Math.min(H, (1 - m.y0) * H));
      pg.drawRectangle({
        x,
        y: yBottom,
        width: Math.max(0.5, x2 - x),
        height: Math.max(0.5, yTop - yBottom),
        color: rgb(r, g, b),
      });
    }
    for (const t of e.texts) {
      const [r, g, b] = hexToRgb01(t.color);
      drawBidiRight(
        pg,
        t.bold ? fontBold : fontReg,
        t.text,
        t.sizePt,
        t.x * W, // مثبّت من اليمين مثل المعاينة تمامًا
        Math.max(t.sizePt * 0.25, Math.min(H - 2, (1 - t.y) * H)),
        rgb(r, g, b),
        W
      );
    }
  }
  return out.save();
}
