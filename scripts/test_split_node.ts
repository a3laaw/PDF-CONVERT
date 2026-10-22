/* اختبار حقيقي لمحرك الفصل خارج المتصفح — يعمل بـ bun
   يولد PDF من 5 صفحات بمحتوى مميز، ينفذ opSplit، يكتب النواتج على القرص */
import { runOp } from "../src/lib/pdf-engine";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { writeFileSync, mkdirSync } from "fs";

async function main() {
  // 1) توليد PDF حقيقي من 5 صفحات بنص مميز لكل صفحة
  const src = await PDFDocument.create();
  const font = await src.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 5; i++) {
    const page = src.addPage([595, 842]);
    page.drawText(`MARKER-PAGE-${i}`, { x: 72, y: 760, size: 36, font });
  }
  const bytes = await src.save();
  const file = new File([bytes], "engine-test-5p.pdf", { type: "application/pdf" });

  // 2) تنفيذ نفس العملية التي ينفذها التطبيق
  const outs = await runOp(
    "split",
    [{ id: "t1", name: "engine-test-5p.pdf", kind: "pdf", file }],
    {},
    "اختبار",
    { onProgress: (m) => console.error("progress:", m) }
  );

  // 3) كتابة النواتج للتحقق الخارجي بـ PyMuPDF
  mkdirSync("/tmp/split-check", { recursive: true });
  console.log(JSON.stringify({ count: outs.length, names: outs.map((o) => o.name) }));
  for (let i = 0; i < outs.length; i++) {
    const buf = new Uint8Array(await outs[i].blob.arrayBuffer());
    writeFileSync(`/tmp/split-check/out-${i + 1}.pdf`, buf);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
