/* توليد PDF اختباري ببيانات وصفية معروفة — لاختبار أداة «بيانات الملف» */
import { PDFDocument, PDFName, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "node:fs";

const doc = await PDFDocument.create();
doc.setTitle("تقرير المبيعات السري");
doc.setAuthor("أحمد العلي");
doc.setSubject("وثيقة داخلية للفصل الثالث");
doc.setKeywords(["سري", "مالية", "مبيعات"]);
doc.setCreator("Microsoft Word 2019");
doc.setProducer("Microsoft Word 2019");
doc.setCreationDate(new Date("2024-03-15T10:30:00Z"));
doc.setModificationDate(new Date("2024-09-01T14:00:00Z"));

const font = await doc.embedFont(StandardFonts.Helvetica);
const page = doc.addPage([595, 842]);
page.drawRectangle({ x: 0, y: 780, width: 595, height: 62, color: rgb(0.31, 0.33, 0.89) });
page.drawText("Confidential Sales Report - Q3", {
  x: 50, y: 800, size: 20, font, color: rgb(1, 1, 1),
});
page.drawText("This PDF carries known metadata for the metadata-tool E2E test.", {
  x: 50, y: 740, size: 11, font,
});
for (let i = 2; i <= 3; i++) {
  const p = doc.addPage([595, 842]);
  p.drawText(`Page ${i}`, { x: 50, y: 780, size: 16, font });
}

/* XMP صريح لاختبار مسحه أيضًا */
const xmp = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Microsoft Word 2019">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">تقرير المبيعات السري</rdf:li></rdf:Alt></dc:title>
      <dc:creator><rdf:Seq><rdf:li>أحمد العلي</rdf:li></rdf:Seq></dc:creator>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
const xmpStream = doc.context.stream(xmp, { Type: "Metadata", Subtype: "XML" });
doc.catalog.set(PDFName.of("Metadata"), doc.context.register(xmpStream));

const bytes = await doc.save({ useObjectStreams: false });
writeFileSync("/home/z/my-project/public/t_meta.pdf", bytes);
console.log("OK t_meta.pdf", bytes.length, "bytes");
