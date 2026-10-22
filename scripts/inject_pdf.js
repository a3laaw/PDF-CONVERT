(() => {
  // بناء PDF حقيقي من 5 صفحات يدويًا (كائنات PDF صالحة)
  const kids = [];
  for (let i = 1; i <= 5; i++) kids.push((4 + i * 2) + " 0 R");
  let objs = "";
  objs += "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  objs += "2 0 obj\n<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count 5 >>\nendobj\n";
  for (let i = 1; i <= 5; i++) {
    const c = 4 + i * 2, f = 3 + i * 2;
    objs += c + " 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents " + f + " 0 R /Resources << /Font << /F1 20 0 R >> >> >>\nendobj\n";
    const txt = "BT /F1 36 Tf 72 760 Td (Page " + i + " of 5) Tj ET";
    objs += f + " 0 obj\n<< /Length " + txt.length + " >>\nstream\n" + txt + "\nendstream\nendobj\n";
  }
  objs += "20 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
  const sorted = objs.split("endobj\n").filter(function (s) { return s.trim(); }).map(function (s) { return s + "endobj\n"; });
  // إعادة الترقيم تصاعديًا: 1,2,3... مع خريطة قديم→جديد
  const renumber = [];
  sorted.forEach(function (o, idx) {
    const m = o.match(/^(\d+) 0 obj/);
    renumber[parseInt(m[1], 10)] = idx + 1;
  });
  let out = "%PDF-1.4\n";
  const offsets = [0];
  sorted.forEach(function (o, idx) {
    const oldNum = parseInt(o.match(/^(\d+) 0 obj/)[1], 10);
    const body = o.replace(/^(\d+) 0 obj/, (renumber[oldNum]) + " 0 obj");
    // إعادة توجيه المراجع الداخلية
    const fixed = body.replace(/(\d+) 0 R/g, function (_, n) { return renumber[parseInt(n, 10)] + " 0 R"; });
    offsets.push(out.length);
    out += fixed;
  });
  const xrefPos = out.length;
  out += "xref\n0 " + (sorted.length + 1) + "\n0000000000 65535 f \n";
  for (let i = 1; i <= sorted.length; i++) out += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  out += "trailer\n<< /Size " + (sorted.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefPos + "\n%%EOF";
  const file = new File([out], "اختبار-5-صفحات.pdf", { type: "application/pdf" });
  const dt = new DataTransfer(); dt.items.add(file);
  const input = document.querySelector('input[type=file]');
  if (!input) return "NO_INPUT";
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return "INJECTED size=" + out.length;
})()
