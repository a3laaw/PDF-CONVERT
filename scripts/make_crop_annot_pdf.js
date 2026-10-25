/* إنشاء PDF اختبار للتنظيف: فيه تعليق Ink حقيقي (كتابة ايد) + نص عادي */
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");

(async () => {
  const dir = "/home/z/my-project/test-assets";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  // صفحة 1: نص عادي + تعليق Ink (كتابة يد) فوق الزاوية
  const p1 = doc.addPage([595, 842]);
  p1.drawText("Clean me - handwriting removal test", { x: 60, y: 760, size: 22, font, color: rgb(0.1, 0.1, 0.55) });
  for (let i = 0; i < 8; i++) {
    p1.drawText(`Lorem ipsum dolor sit amet line ${i + 1} for crop testing.`, { x: 60, y: 700 - i * 30, size: 12, font });
  }
  // تعليق Ink: خطوط خربشة في الزاوية العلوية
  const inkAnnot = doc.context.obj({
    Type: "Annot",
    Subtype: "Ink",
    Rect: [400, 620, 560, 760],
    InkList: [[[400, 740], [450, 700], [500, 745], [550, 700]]],
    C: [0.8, 0.1, 0.1],
    F: 4,
  });
  const inkRef = doc.context.register(inkAnnot);
  p1.node.set(doc.context.obj([]) && require("pdf-lib").PDFName.of("Annots"), doc.context.obj([inkRef]));

  // صفحة 2: نص عادي فقط
  const p2 = doc.addPage([595, 842]);
  p2.drawText("Page two - no annotations here", { x: 60, y: 760, size: 20, font });
  for (let i = 0; i < 6; i++) {
    p2.drawText(`Second page content line ${i + 1}.`, { x: 60, y: 700 - i * 30, size: 12, font });
  }

  fs.writeFileSync(`${dir}/crop_annot.pdf`, await doc.save());
  console.log("made crop_annot.pdf (2 pages, ink annot on page 1)");
})();
