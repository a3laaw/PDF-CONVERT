/* فحص سلوك pdf.js في استخراج النص العربي — الحالتان منطقي/بصري */
import fs from "node:fs";

const EXPECT = [
  "السلام عليكم ورحمة الله وبركاته",
  "بلغ عدد السكان 12345 نسمة في عام 2020 حسب الإحصاء",
  "هذا تقرير مالي عن شركة النور للتجارة المحدودة",
  "الملف مرفق مع مجلد المستندات المهمة في المكتب",
];

async function extract(file) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(`public/${file}`));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const page = await doc.getPage(1);
  const tc = await page.getTextContent();
  const items = tc.items
    .filter((it) => it.str && it.str.trim())
    .map((it) => ({ str: it.str, x: Math.round(it.transform[4]), dir: it.dir }));
  (doc).destroy?.();
  return items;
}

for (const file of ["t_ar_logical.pdf", "t_ar_visual.pdf"]) {
  console.log(`\n═══════ ${file} ═══════`);
  const items = await extract(file);
  console.log(`عناصر: ${items.length}`);
  for (const it of items) console.log(`  x=${it.x} dir=${it.dir} «${it.str}»`);

  /* تجميع سطر تقريبي: كل العناصر هنا في أسطر منفصلة عموديًا — نطبع كما هي */
  const line = items.map((i) => i.str).join(" ‖ ");
  console.log(`السطر المجمّع (بترتيب y ثم x تصاعدي): «${items.slice().sort((a,b)=>b.x-a.x).map(i=>i.str).join(" ")}»`);
}
void EXPECT;
