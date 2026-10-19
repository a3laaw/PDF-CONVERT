/* إضافة ملفات الاختبار عبر DataTransfer داخل المتصفح */
const fs = require("fs");
const { execSync } = require("child_process");

const files = ["/tmp/contract.pdf", "/tmp/report.pdf"];
const parts = files.map((p) => {
  const b64 = fs.readFileSync(p).toString("base64");
  const name = p === "/tmp/contract.pdf" ? "عقد-الإيجار.pdf" : "تقرير-المشروع.pdf";
  return JSON.stringify({ name, b64 });
});

const js = `(async () => {
  const items = [${parts.join(",")}];
  const dt = new DataTransfer();
  for (const it of items) {
    const bin = atob(it.b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const f = new File([bytes], it.name, { type: "application/pdf" });
    dt.items.add(f);
  }
  const input = document.querySelector("input[type=file]");
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return "dispatched " + input.files.length + " files";
})()`;

fs.writeFileSync("/tmp/upload-eval.txt", js);
console.log("eval script ready");
