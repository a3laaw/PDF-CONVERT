/* إنشاء ملفات PDF للاختبار */
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");

(async () => {
  const dir = "/home/z/my-project/test-assets";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  async function makeDoc(name, pages, title) {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 1; i <= pages; i++) {
      const p = doc.addPage([595, 842]);
      p.drawText(`${title} - Page ${i}`, { x: 60, y: 760, size: 28, font, color: rgb(0.2, 0.2, 0.7) });
      p.drawText("This is test content for mahattat PDF station.", { x: 60, y: 700, size: 12, font });
      p.drawText(`Lorem ipsum dolor sit amet, consectetur adipiscing elit ${i}.`, { x: 60, y: 670, size: 12, font });
      p.drawRectangle({ x: 60, y: 300 + i * 20, width: 200, height: 60, color: rgb(0.9, 0.92, 0.99) });
    }
    fs.writeFileSync(`${dir}/${name}`, await doc.save());
    console.log("made", name, pages, "pages");
  }

  await makeDoc("عقد-الإيجار.pdf", 6, "Rental Contract");
  await makeDoc("تقرير-المشروع.pdf", 4, "Project Report");
})();
