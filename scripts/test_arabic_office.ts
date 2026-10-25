/* اختبار تكامل: PDF عربي → استخراج pdf.js → الإصلاح → buildDocx/buildXlsx
   نفحص محتوى الملفين الناتجين فعلًا (فك الضغط وقراءة XML) */
import fs from "node:fs";
import { fixArabicWordOrder, hasArabic } from "../src/lib/arabic-text.ts";
import { orderedLineText, buildDocx, buildXlsx, type OfficeDoc } from "../src/lib/to-office.ts";

let pass = 0;
let fail = 0;
const ck = (name: string, cond: boolean, extra = "") => {
  if (cond) {
    pass++;
    console.log(`PASS: ${name}`);
  } else {
    fail++;
    console.log(`FAIL: ${name} ${extra}`);
  }
};

const OUT = "/home/z/my-project/scripts/out";
fs.mkdirSync(OUT, { recursive: true });

/** استخراج عناصر pdf.js من ملف — نفس مخرجات الإنتاج بعد NFKC */
async function extractPages(file: string) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const pages: { no: number; lines: { page: number; sizePt: number; words: { str: string; x: number; w: number }[] }[] }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const items = tc.items
      .filter((it: { str?: string }) => it.str && it.str.trim())
      .map((it: { str: string; transform: number[]; width: number }) => ({
        str: it.str.normalize("NFKC"),
        x: it.transform[4],
        w: it.width || 0,
        y: it.transform[5],
      }));
    /* تجميع أولي حسب y (أسطر الجمل في ملفاتنا منفصلة عموديًا) */
    const lines: typeof pages[number]["lines"] = [];
    for (const it of items) {
      const cur = lines[lines.length - 1];
      if (cur && Math.abs(it.y - cur.y) <= 3) {
        cur.words.push({ str: it.str, x: it.x, w: it.w });
      } else {
        lines.push({ page: i, sizePt: 16, words: [{ str: it.str, x: it.x, w: it.w }] });
        lines[lines.length - 1].y = it.y;
      }
    }
    for (const l of lines) delete (l as unknown as { y?: number }).y;
    pages.push({ no: i, lines });
  }
  (doc as unknown as { destroy?: () => void }).destroy?.();
  return pages;
}

const EXPECTED = ["السلام عليكم", "بلغ عدد السكان 12345", "شركة النور", "الإحصاء"];

for (const name of ["t_ar_logical.pdf", "t_ar_visual.pdf"]) {
  console.log(`\n═══════ ${name} ═══════`);
  const pages = await extractPages(`/home/z/my-project/public/${name}`);
  /* قرار المستند مثل fixDocArabic في الإنتاج */
  const all = pages.flatMap((p) => p.lines.flatMap((l) => l.words));
  const { words: fixed } = fixArabicWordOrder(all);
  let k = 0;
  const docPages = pages.map((p) => ({
    ...p,
    lines: p.lines.map((l) => ({ ...l, words: l.words.map((w) => fixed[k++]) })),
  }));
  const doc: OfficeDoc = { source: "text", pages: docPages, medianSize: 16 };
  /* أول سطر عنوان بحجم أكبر لاختبار bCs (عريضة النص المركب) */
  doc.pages[0].lines[0].sizePt = 24;

  const texts = doc.pages.flatMap((p) => p.lines.map((l) => orderedLineText(l).text));
  console.log("السطور:");
  for (const t of texts) console.log(`  «${t}»`);

  for (const e of EXPECTED) {
    ck(`${name}: يحوي «${e}»`, texts.some((t) => t.includes(e)));
  }

  if (name === "t_ar_logical.pdf") {
    /* بناء Word وExcel من هذا المستند وفحص XML */
    const docxBlob = await buildDocx(doc, "test");
    fs.writeFileSync(`${OUT}/test.docx`, Buffer.from(await docxBlob.arrayBuffer()));
    const xlsxBlob = await buildXlsx(doc, "test");
    fs.writeFileSync(`${OUT}/test.xlsx`, Buffer.from(await xlsxBlob.arrayBuffer()));
    console.log("حُفظ scripts/out/test.docx و test.xlsx");
  }
}

/* فحص الملفين الناتجين: docx XML + قراءة xlsx بـSheetJS */
const { execSync } = await import("node:child_process");
execSync(`cd ${OUT} && rm -rf dx && unzip -oq test.docx -d dx`);
const docXml = fs.readFileSync(`${OUT}/dx/word/document.xml`, "utf8");

const XLSX = await import("xlsx");
const wb = XLSX.read(fs.readFileSync(`${OUT}/test.xlsx`));
const ws = wb.Sheets[wb.SheetNames[0]];
const rowsFlat = (XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][]).flat().join("|");
const viewRtl = (wb.Workbook as { Views?: { RTL?: boolean }[] } | undefined)?.Views?.[0]?.RTL;

ck("docx: النص المنطقي «السلام عليكم» موجود", docXml.includes("السلام عليكم"));
ck("docx: szCs (حجم النص المركب) موجود", docXml.includes("<w:szCs"));
ck("docx: bCs (عريضة مركبة) موجود", docXml.includes("<w:bCs"));
ck("docx: rtl على التشغيلات العربية", docXml.includes("<w:rtl/>") || docXml.includes("<w:rtl "));
ck("docx: bidi على الفقرات", docXml.includes("<w:bidi/>") || docXml.includes("<w:bidi "));
ck("docx: «الإحصاء» مصلحة", docXml.includes("الإحصاء") && !docXml.includes("اإلحصاء"));
ck("xlsx: ورقة RTL", viewRtl === true, String(viewRtl));
ck("xlsx: «السلام عليكم» في الخلايا", rowsFlat.includes("السلام عليكم"));
ck("xlsx: «12345» بالترتيب الصحيح", rowsFlat.includes("بلغ عدد السكان 12345 نسمة في عام 2020 حسب الإحصاء"), rowsFlat.slice(0, 400));
ck("xlsx: سطر الكلمات المنفصلة مرتب", rowsFlat.includes("المشروع يتكون من ثلاث مراحل رئيسية"), rowsFlat.slice(0, 400));

console.log(`\nالنتيجة: ${pass} نجاح / ${fail} فشل`);
process.exit(fail ? 1 : 0);
