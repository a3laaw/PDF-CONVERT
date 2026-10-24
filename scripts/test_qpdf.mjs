/* اختبار qpdf-wasm بمسار المتصفح الحقيقي: تحميل qpdf.js كسكربت عالمي + locateFile
   (نفس آلية التشغيل في public/workers) */
import { readFileSync, copyFileSync } from "node:fs";

// محاكاة بيئة المتصفح بدقة: window موجود وprocess غير موجود
globalThis.window = globalThis;
globalThis.process = undefined;
globalThis.exports = {};
const code = readFileSync("/home/z/my-project/node_modules/@jspawn/qpdf-wasm/qpdf.js", "utf8");
(0, eval)(code);
const factory = globalThis.exports.Module ?? globalThis.Module;
if (typeof factory !== "function") throw new Error("Module factory not found");

const wasmBin = readFileSync("/home/z/my-project/node_modules/@jspawn/qpdf-wasm/qpdf.wasm");

function makeModule(printErr) {
  const b64 = wasmBin.toString("base64");
  const inst = { locateFile: () => `data:application/octet-stream;base64,${b64}` };
  if (printErr) inst.printErr = printErr;
  return factory(inst).then(() => inst);
}

// ملف PDF بسيط للاختبار
const { PDFDocument, StandardFonts } = await import("pdf-lib");
const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const page = doc.addPage([595, 842]);
page.drawText("SECRET CONTENT 12345", { x: 60, y: 700, size: 24, font });
const plain = await doc.save();

// 1) تشفير AES-256 بكلمة سر
const enc = await (async () => {
  const m = await makeModule();
  m.FS.writeFile("/plain.pdf", plain);
  const rc = m.callMain(["--encrypt", "loay123", "loay123", "256", "--", "/plain.pdf", "/enc.pdf"]);
  const out = m.FS.readFile("/enc.pdf");
  const s = Buffer.from(out).toString("latin1");
  console.log("ENCRYPT rc =", rc, "bytes =", out.length, "/Encrypt:", s.includes("/Encrypt"), "AESV3:", s.includes("AESV3"));
  return out;
})();

// 2) فك التشفير بالباسورد الصحيح
{
  const m = await makeModule();
  m.FS.writeFile("/enc.pdf", enc);
  const rc = m.callMain(["--password=loay123", "--decrypt", "/enc.pdf", "/dec.pdf"]);
  const dec = m.FS.readFile("/dec.pdf");
  const stillEnc = Buffer.from(dec).toString("latin1").includes("/Encrypt");
  const d2 = await PDFDocument.load(dec, { ignoreEncryption: false });
  console.log("DECRYPT rc =", rc, "still-encrypted:", stillEnc, "opens-clean:", d2.getPageCount() === 1);
}

// 3) فك التشفير بباسورد غلط — يفترض يفشل مع رسالة
{
  let err = "";
  const m = await makeModule((s) => { err += s + "\n"; });
  m.FS.writeFile("/enc.pdf", enc);
  const rc = m.callMain(["--password=WRONG", "--decrypt", "/enc.pdf", "/dec2.pdf"]);
  console.log("WRONG-PW rc =", rc, "| stderr:", err.trim().split("\n")[0]?.slice(0, 120));
  let ok = true;
  try { m.FS.readFile("/dec2.pdf"); } catch { ok = false; }
  console.log("WRONG-PW output-exists:", ok);
}

// 4) ملف غير مشفر + decrypt — يمرر كما هو (sanity)
{
  const m = await makeModule();
  m.FS.writeFile("/plain.pdf", plain);
  const rc = m.callMain(["--decrypt", "/plain.pdf", "/dec3.pdf"]);
  const dec = m.FS.readFile("/dec3.pdf");
  console.log("PLAIN-PASS-THROUGH rc =", rc, "bytes =", dec.length);
}

// نسخ أصول المتصفح إلى public/workers
copyFileSync("/home/z/my-project/node_modules/@jspawn/qpdf-wasm/qpdf.js", "/home/z/my-project/public/workers/qpdf.js");
copyFileSync("/home/z/my-project/node_modules/@jspawn/qpdf-wasm/qpdf.wasm", "/home/z/my-project/public/workers/qpdf.wasm");
console.log("copied to public/workers — DONE");
