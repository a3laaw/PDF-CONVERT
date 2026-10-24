/* فحص وحدات buildDocx/buildXlsx في Node — مستند وهمي بنفس شكل المخرجات الحقيقية */
import { buildDocx, buildXlsx } from "../src/lib/to-office.ts";

const doc = {
  source: "text",
  medianSize: 12,
  pages: [
    {
      no: 1,
      lines: [
        { page: 1, sizePt: 22, words: [{ str: "INVOICE", x: 0, w: 10 }, { str: "REPORT", x: 60, w: 20 }] },
        { page: 1, sizePt: 11, words: [
          { str: "Item", x: 0, w: 20 }, { str: "Qty", x: 90, w: 10 }, { str: "Price", x: 180, w: 15 },
        ] },
        { page: 1, sizePt: 11, words: [
          { str: "Chair", x: 0, w: 20 }, { str: "4", x: 90, w: 10 }, { str: "40.00", x: 180, w: 15 },
        ] },
        { page: 1, sizePt: 12, words: [{ str: "نص عربي للتجربة", x: 0, w: 60 }] },
      ],
    },
  ],
};

const docxBlob = await buildDocx(doc, "test");
const docxBytes = new Uint8Array(await docxBlob.arrayBuffer());
console.log("docx bytes:", docxBytes.length, "zip:", docxBytes[0] === 0x50 && docxBytes[1] === 0x4b);
await import("node:fs").then((fs) => fs.writeFileSync("/tmp/test-out.docx", docxBytes));

const xlsxBlob = await buildXlsx(doc, "test");
const xlsxBytes = new Uint8Array(await xlsxBlob.arrayBuffer());
console.log("xlsx bytes:", xlsxBytes.length, "zip:", xlsxBytes[0] === 0x50 && xlsxBytes[1] === 0x4b);
await import("node:fs").then((fs) => fs.writeFileSync("/tmp/test-out.xlsx", xlsxBytes));
