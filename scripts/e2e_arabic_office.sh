#!/bin/bash
# E2E — جودة العربية في تحويل Word/Excel/النص (لقطات 86+)
# الملفان t_ar_logical.pdf (تخزين منطقي) و t_ar_visual.pdf (تخزين بصري) في public/
B="agent-browser"
S=/home/z/my-project/screenshots
W=/home/z/my-project/scripts
O=$W/out
mkdir -p "$S" "$O"
pass=0; fail=0
ck() { if echo "$1" | rg -q "^OK"; then echo "PASS: $1"; pass=$((pass+1)); else echo "FAIL: $1"; fail=$((fail+1)); fi; }
EV() {
  local raw out
  raw=$($B eval "$1" 2>&1)
  out=$(echo "$raw" | tail -1 | tr -d '"')
  if [ "$out" = "{}" ] || [ -z "$out" ] || [ "$out" = "}" ]; then
    sleep 1.5
    out=$($B eval "$1" 2>&1 | tail -1 | tr -d '"')
  fi
  echo "$out"
}
warmup() {
  for i in 1 2 3; do
    R=$($B eval "1+1" 2>/dev/null | tail -1 | tr -d '"')
    if [ "$R" = "2" ]; then return 0; fi
    sleep 2; $B reload >/dev/null 2>&1; sleep 2
  done
}

PATCH='(() => {
  if (window.__patched) return "OK already";
  window.__cap = null;
  const orig = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function() {
    if (this.download && this.href && this.href.startsWith("blob:")) {
      window.__cap = { name: this.download, href: this.href };
      return;
    }
    orig.call(this);
  };
  window.__patched = true;
  return "OK patched";
})()'

GRAB='(async () => {
  if (!window.__cap) return "NOCAP";
  const b = await (await fetch(window.__cap.href)).blob();
  const buf = new Uint8Array(await b.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode.apply(null, buf.subarray(i, i + 8192));
  return "B64:" + btoa(s) + "|NAME:" + window.__cap.name;
})()'

INJECT='(async () => {
  const res = await fetch("/t_ar_logical.pdf");
  const file = new File([await res.blob()], "t_ar_logical.pdf", { type: "application/pdf" });
  const input = document.querySelector("input[type=file]");
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return "OK injected";
})()'

WAITRESULT='(async () => {
  for (let i = 0; i < 30; i++) {
    const btn = [...document.querySelectorAll("button")].find(b => b.className.includes("bg-emerald-600"));
    if (btn) { btn.click(); return "OK نتيجة جاهزة وحُفظت"; }
    await new Promise(r => setTimeout(r, 700));
  }
  return "FAIL مهلة انتظار النتيجة";
})()'

SAVE() { # $1=اسم الملف
  RAW=$(EV "$GRAB")
  B64=$(echo "$RAW" | sed -n 's/^B64://p' | sed 's/|NAME:.*//')
  if [ -z "$B64" ]; then echo "FAIL: لا بيانات تنزيل ($RAW)"; fail=$((fail+1)); return 1; fi
  echo "$B64" | base64 -d > "$O/$1" 2>/dev/null
  local SZ=$(stat -c%s "$O/$1" 2>/dev/null || echo 0)
  if [ "$SZ" -gt 250 ]; then echo "PASS: حُفظ $1 ($SZ بايت)"; pass=$((pass+1)); else echo "FAIL: $1 صغير جدًا ($SZ)"; fail=$((fail+1)); return 1; fi
}

echo "══ 1) فتح التطبيق (بناء إنتاجي) — عربي ══"
$B set viewport 1440 900 >/dev/null
$B open "http://localhost:3000/?op=pdf_to_word" >/dev/null 2>&1
$B wait --load networkidle >/dev/null 2>&1
$B eval "localStorage.setItem('mahatta-locale','ar')" >/dev/null 2>&1
$B reload >/dev/null 2>&1; $B wait --load networkidle >/dev/null 2>&1
warmup; sleep 1
EV "$PATCH" >/dev/null
EV "$INJECT" >/dev/null; sleep 3
$B screenshot "$S/86-arabic-word-tool.png" >/dev/null 2>&1 && echo "لقطة 86 ✓"

echo "══ 2) PDF → Word ══"
R=$(EV "(() => { const btn = document.querySelector('[aria-label=\"حوّل لـ Word\"]'); return btn ? 'OK زر Word جاهز' : 'FAIL لا زر Word'; })()")
ck "$R"
EV "(() => { document.querySelector('[aria-label=\"حوّل لـ Word\"]').click(); return 'OK clicked'; })()" >/dev/null
R=$(EV "$WAITRESULT"); ck "$R"
SAVE "e2e_word.docx" || true
sleep 1
$B screenshot "$S/87-arabic-word-result.png" >/dev/null 2>&1 && echo "لقطة 87 ✓"

echo "── فحص docx ──"
$B open "about:blank" >/dev/null 2>&1
DOCX=$($B eval "fetch('/t_ar_logical.pdf').then(() => 'warm')" 2>/dev/null | tail -1)
unzip -p "$O/e2e_word.docx" word/document.xml > "$O/e2e_word.xml" 2>/dev/null
ck "$(rg -q 'السلام عليكم ورحمة الله وبركاته' "$O/e2e_word.xml" && echo 'OK docx: الجملة الأولى منطقية سليمة' || echo 'FAIL docx: الجملة الأولى')"
ck "$(rg -q 'بلغ عدد السكان 12345 نسمة في عام 2020' "$O/e2e_word.xml" && echo 'OK docx: الأرقام بترتيب صحيح' || echo 'FAIL docx: الأرقام')"
ck "$(rg -q 'المشروع يتكون من ثلاث مراحل رئيسية' "$O/e2e_word.xml" && echo 'OK docx: سطر الكلمات المتفرقة مرتب' || echo 'FAIL docx: الكلمات المتفرقة')"
ck "$(rg -q '<w:szCs' "$O/e2e_word.xml" && echo 'OK docx: szCs موجود (حجم عربي صحيح)' || echo 'FAIL docx: szCs')"
ck "$(rg -q '<w:rtl' "$O/e2e_word.xml" && echo 'OK docx: rtl موجود' || echo 'FAIL docx: rtl')"
ck "$(rg -q 'اإل|األ|اآل' "$O/e2e_word.xml" && echo 'FAIL docx: أثر لام-ألف باقٍ' || echo 'OK docx: لا أثر لام-ألف همزية')"

echo "══ 3) PDF → Excel ══"
$B open "http://localhost:3000/?op=pdf_to_excel" >/dev/null 2>&1
$B wait --load networkidle >/dev/null 2>&1
warmup; sleep 1
EV "$PATCH" >/dev/null
EV "$INJECT" >/dev/null; sleep 3
EV "(() => { const b = document.querySelector('[aria-label=\"حوّل لـ Excel\"]'); return b ? (b.click(), 'OK') : 'FAIL'; })()" >/dev/null
R=$(EV "$WAITRESULT"); ck "$R"
SAVE "e2e_excel.xlsx" || true
$B screenshot "$S/88-arabic-excel.png" >/dev/null 2>&1 && echo "لقطة 88 ✓"

echo "── فحص xlsx ──"
XV=$(bun -e '
const XLSX = require("xlsx");
const wb = XLSX.readFile("/home/z/my-project/scripts/out/e2e_excel.xlsx");
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }).flat().join("|");
const rtl = wb.Workbook && wb.Workbook.Views && wb.Workbook.Views[0] && wb.Workbook.Views[0].RTL;
const c1 = rows.includes("السلام عليكم ورحمة الله وبركاته");
const c2 = rows.includes("بلغ عدد السكان 12345 نسمة في عام 2020 حسب الإحصاء");
const c3 = rows.includes("المشروع يتكون من ثلاث مراحل رئيسية");
console.log((rtl === true && c1 && c2 && c3 ? "OK xlsx: RTL + الثلاث جمل بترتيب سليم" : "FAIL xlsx: rtl=" + rtl + " ج1=" + c1 + " ج2=" + c2 + " ج3=" + c3));
' 2>&1 | tail -1)
ck "$XV"

echo "══ 4) استخراج النص ══"
$B open "http://localhost:3000/?op=extract_text" >/dev/null 2>&1
$B wait --load networkidle >/dev/null 2>&1
warmup; sleep 1
EV "$PATCH" >/dev/null
EV "$INJECT" >/dev/null; sleep 3
EV "(() => { const b = document.querySelector('[aria-label=\"استخرج النص\"]'); return b ? (b.click(), 'OK') : 'FAIL'; })()" >/dev/null
R=$(EV "$WAITRESULT"); ck "$R"
SAVE "e2e_text.txt" || true
$B screenshot "$S/89-arabic-extract.png" >/dev/null 2>&1 && echo "لقطة 89 ✓"
ck "$(rg -q 'السلام عليكم ورحمة الله وبركاته' "$O/e2e_text.txt" && echo 'OK نص: الجملة سليمة' || echo 'FAIL نص: الجملة')"
ck "$(rg -q 'حسب الإحصاء' "$O/e2e_text.txt" && echo 'OK نص: الإحصاء بلا أثر معكوس' || echo 'FAIL نص: الإحصاء')"

echo "══ 5) الملف البصري (تخزين بصري — الأغلبية) ══"
$B open "http://localhost:3000/?op=pdf_to_word" >/dev/null 2>&1
$B wait --load networkidle >/dev/null 2>&1
warmup; sleep 1
EV "$PATCH" >/dev/null
EV '(async () => {
  const res = await fetch("/t_ar_visual.pdf");
  const file = new File([await res.blob()], "t_ar_visual.pdf", { type: "application/pdf" });
  const input = document.querySelector("input[type=file]");
  const dt = new DataTransfer(); dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return "OK injected";
})()' >/dev/null; sleep 3
EV "(() => { document.querySelector('[aria-label=\"حوّل لـ Word\"]').click(); return 'OK clicked'; })()" >/dev/null
R=$(EV "$WAITRESULT"); ck "$R"
SAVE "e2e_word_visual.docx" || true
unzip -p "$O/e2e_word_visual.docx" word/document.xml > "$O/e2e_word_visual.xml" 2>/dev/null
ck "$(rg -q 'بلغ عدد السكان 12345 نسمة في عام 2020 حسب الإحصاء' "$O/e2e_word_visual.xml" && echo 'OK بصري: الجملة الرقمية سليمة' || echo 'FAIL بصري: الجملة الرقمية')"
ck "$(rg -q 'المشروع يتكون من ثلاث مراحل رئيسية' "$O/e2e_word_visual.xml" && echo 'OK بصري: ترتيب الكلمات من المواضع' || echo 'FAIL بصري: ترتيب الكلمات')"

echo "══ 6) جوال 390px ══"
$B set viewport 390 844 >/dev/null
$B open "http://localhost:3000/?op=pdf_to_word" >/dev/null 2>&1
$B wait --load networkidle >/dev/null 2>&1
warmup; sleep 1
EV "$INJECT" >/dev/null; sleep 3
R=$(EV "(() => document.documentElement.scrollWidth > window.innerWidth + 1 ? 'FAIL فيض أفقي' : 'OK لا فيض على الجوال')()")
ck "$R"
$B screenshot "$S/90-arabic-mobile-390.png" >/dev/null 2>&1 && echo "لقطة 90 ✓"

echo "══ 7) الإنجليزية ══"
$B set viewport 1440 900 >/dev/null
$B open "http://localhost:3000/?op=pdf_to_word" >/dev/null 2>&1
$B wait --load networkidle >/dev/null 2>&1
$B eval "localStorage.setItem('mahatta-locale','en')" >/dev/null 2>&1
$B reload >/dev/null 2>&1; $B wait --load networkidle >/dev/null 2>&1
warmup; sleep 1
EV "$INJECT" >/dev/null; sleep 3
for i in 1 2 3 4 5; do
  R=$(EV "(() => { const btn = document.querySelector('[aria-label=\"Convert to Word\"]'); const chip = document.body.textContent.includes('correct direction and word order'); return btn && chip ? 'OK إنجليزي: Convert to Word + تلميح محدث' : 'WAIT btn=' + !!btn + ' chip=' + chip; })()")
  echo "$R" | rg -q "^OK" && break
  sleep 2
done
ck "$R"
$B screenshot "$S/91-arabic-english.png" >/dev/null 2>&1 && echo "لقطة 91 ✓"

echo "══ 8) انحدار: أداة أخرى ══"
$B open "http://localhost:3000/?op=rotate" >/dev/null 2>&1
$B wait --load networkidle >/dev/null 2>&1
$B eval "localStorage.setItem('mahatta-locale','ar')" >/dev/null 2>&1
$B reload >/dev/null 2>&1; $B wait --load networkidle >/dev/null 2>&1
sleep 1
EV "$INJECT" >/dev/null; sleep 3
R=$(EV "(() => { const btn = document.querySelector('[aria-label^=\"دوّر\"]'); return btn ? 'OK أداة التدوير تعمل' : 'FAIL لا زر تدوير'; })()")
ck "$R"

echo ""
echo "══ النتيجة النهائية: PASS=$pass FAIL=$fail ══"
[ "$fail" = "0" ] && echo "ALL GREEN ✓" || echo "يوجد إخفاقات ✗"
