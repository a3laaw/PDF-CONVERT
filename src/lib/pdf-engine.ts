/* محرك PDF «محطّة PDF» — يعمل بالكامل داخل متصفح المستخدم (خصوصية تامة)
   pdf-lib للتعديل + pdfjs للعرض والاستخراج + Canvas للنص العربي المُشكَّل */

import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import { toHindiDigits } from "./arabic";
import { parsePageRanges } from "./interpreter";
import { resultName } from "./naming";
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
  const angle = Number(params.angle ?? "90");
  const results: ResultFile[] = [];
  for (const input of inputs) {
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
    const hindi = (params.digits ?? "هندي") === "هندي";
    const fmt = params.format ?? "رقم فقط";
    for (let i = 1; i <= total; i++) {
      const shown = hindi ? toHindiDigits(i) : String(i);
      const text = fmt === "صفحة من" ? `صفحة ${shown} من ${hindi ? toHindiDigits(total) : total}` : shown;
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

/* صور إلى PDF */
async function opImagesToPdf(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  ctx.onProgress?.(`جارٍ تحويل ${inputs.length} صور إلى PDF…`);
  const out = await PDFDocument.create();
  for (const input of inputs) {
    const bytes = await bytesOf(input);
    const name = input.name.toLowerCase();
    let img;
    if (name.endsWith(".png")) img = await out.embedPng(bytes);
    else img = await out.embedJpg(bytes);
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
async function opExtractText(inputs: EngineInput[], label: string, ctx: RunContext): Promise<ResultFile[]> {
  const pdfjs = await getPdfjs();
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

/* بيانات الملف */
async function opMetadata(
  inputs: EngineInput[],
  params: Record<string, string>,
  label: string,
  ctx: RunContext
): Promise<ResultFile[]> {
  const results: ResultFile[] = [];
  for (const input of inputs) {
    ctx.onProgress?.(`جارٍ ضبط بيانات «${input.name}»…`);
    const doc = await loadPdfLib(await bytesOf(input));
    if (params.title) doc.setTitle(params.title);
    if (params.author) doc.setAuthor(params.author);
    doc.setModificationDate(new Date());
    doc.setProducer("محوّل PDF");
    const saved = await doc.save({ useObjectStreams: true });
    results.push(resultFile(resultName("metadata", input.name), saved, label, "pdf"));
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
