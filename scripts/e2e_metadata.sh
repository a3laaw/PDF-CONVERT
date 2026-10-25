#!/bin/bash
# E2E — أداة «بيانات الملف» الكاملة: تعبئة مسبقة + تعديل + مسح خصوصية (لقطات 81+)
B="agent-browser"
S=/home/z/my-project/screenshots
W=/home/z/my-project/scripts
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
# اعتراض التنزيلات: كل نقرة رابط تنزيل تُخزَّن بدل تنزيل حقيقي
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
# سحب الملف المعتقل إلى القرص عبر base64
GRAB='(async () => {
  if (!window.__cap) return "NOCAP";
  const b = await (await fetch(window.__cap.href)).blob();
  const buf = new Uint8Array(await b.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode.apply(null, buf.subarray(i, i + 8192));
  return "B64:" + btoa(s) + "|NAME:" + window.__cap.name;
})()'
# حقن t_meta.pdf
INJECT='(async () => {
  const res = await fetch("/t_meta.pdf");
  const file = new File([await res.blob()], "t_meta.pdf", { type: "application/pdf" });
  const input = document.querySelector("input[type=file]");
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return "OK injected";
})()'

cd /home/z/my-project
mkdir -p "$S"

echo "══ 1) سطح المكتب: فتح ?op=metadata بالعربية ══"
$B set viewport 1440 900 >/dev/null
$B open "http://localhost:3000/?op=metadata" >/dev/null 2>&1
$B wait --load networkidle >/dev/null 2>&1
$B eval "localStorage.setItem('mahatta-locale','ar')" >/dev/null 2>&1
$B reload >/dev/null 2>&1; $B wait --load networkidle >/dev/null 2>&1
warmup; sleep 1
R=$(EV "(() => document.documentElement.dir === 'rtl' ? 'OK rtl' : 'FAIL ltr')()")
ck "$R"

echo "══ 2) حقن الملف والتحقق من التعبئة المسبقة ══"
R=$(EV "$INJECT")
ck "$R"
sleep 2.5
R=$(EV "(() => { const chip = [...document.querySelectorAll('span')].find(s => s.getAttribute('aria-label') === 'القسم الحالي' || (s.className && s.className.includes && s.className.includes('bg-primary/10'))); return chip && chip.textContent.includes('بيانات الملف') ? 'OK أداة البيانات مفتوحة من ?op' : 'FAIL chip: ' + (chip ? chip.textContent : 'لا شارة'); })()")
ck "$R"
R=$(EV "(() => { const f = document.querySelector('[data-testid=field-title]'); return f ? (f.value.includes('تقرير المبيعات السري') ? 'OK عنوان مُعبّأ: ' + f.value : 'FAIL قيمة خاطئة: ' + f.value) : 'FAIL لا حقل'; })()")
ck "$R"
R=$(EV "(() => { const a = document.querySelector('[data-testid=field-author]'); return a && a.value.includes('أحمد العلي') ? 'OK مؤلف مُعبّأ' : 'FAIL مؤلف: ' + (a ? a.value : 'لا حقل'); })()")
ck "$R"
R=$(EV "(() => { const c = document.querySelector('[data-testid=meta-current]'); return c && c.textContent.includes('البيانات الحالية') && c.textContent.includes('Microsoft Word 2019') ? 'OK شارة البيانات الحالية تعرض المنتج' : 'FAIL شارة: ' + (c ? c.textContent : 'لا شارة'); })()")
ck "$R"
$B screenshot "$S/81-meta-prefill-desktop.png" >/dev/null 2>&1 && echo "لقطة 81 ✓"

echo "══ 3) تعديل البيانات وتنفيذها ══"
EV "$PATCH" >/dev/null
EV "(() => { const f = document.querySelector('[data-testid=field-title]'); const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; s.call(f,'عنوان جديد من الاختبار'); f.dispatchEvent(new Event('input',{bubbles:true})); return 'OK'; })()" >/dev/null
EV "(() => { const f = document.querySelector('[data-testid=field-subject]'); const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; s.call(f,'موضوع محدث بالكامل'); f.dispatchEvent(new Event('input',{bubbles:true})); return 'OK'; })()" >/dev/null
EV "(() => { const f = document.querySelector('[data-testid=field-keywords]'); const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; s.call(f,'اختبار, جودة'); f.dispatchEvent(new Event('input',{bubbles:true})); return 'OK'; })()" >/dev/null
$B screenshot "$S/82-meta-edited-fields.png" >/dev/null 2>&1 && echo "لقطة 82 ✓"
R=$(EV "(() => { const btn = document.querySelector('[aria-label=\"عدّل البيانات\"]'); if (!btn) return 'FAIL لا زر'; btn.click(); return 'OK نقرت التنفيذ'; })()")
ck "$R"
sleep 4
R=$(EV "(() => { const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'تحميل'); if (!btns.length) return 'FAIL لا زر تحميل'; btns[0].click(); return 'OK نقرت التحميل'; })()")
ck "$R"
sleep 2
OUT=$(EV "$GRAB")
echo "$OUT" | rg -q "^B64:" && { echo "$OUT" | sed 's/^B64://' | tr -d '"' | cut -d'|' -f1 | base64 -d > "$W/out_edited.pdf" 2>/dev/null; echo "PASS: نزّلنا الناتج المعدّل"; pass=$((pass+1)); } || { echo "FAIL: لا التقنا التنزيل ($OUT)"; fail=$((fail+1)); }
V=$(python3 -c "
import fitz
d = fitz.open('$W/out_edited.pdf')
m = d.metadata
ok = (m['title']=='عنوان جديد من الاختبار' and m['subject']=='موضوع محدث بالكامل'
      and 'اختبار' in (m['keywords'] or '') and m['producer']=='محوّل PDF' and d.page_count==3)
print('OK تحقق التعديل' if ok else 'FAIL title=%r subject=%r kw=%r producer=%r' % (m['title'], m['subject'], m['keywords'], m['producer']))
")
ck "$V"

echo "══ 4) وضع المسح الكامل (خصوصية) ══"
$B reload >/dev/null 2>&1; $B wait --load networkidle >/dev/null 2>&1
warmup; sleep 1
EV "$INJECT" >/dev/null; sleep 2.5
R=$(EV "(() => { const sel = document.querySelector('[data-testid=field-mode]'); if (!sel) return 'FAIL لا select وضع'; sel.value='clear'; sel.dispatchEvent(new Event('change',{bubbles:true})); return 'OK الوضع = مسح'; })()")
ck "$R"
sleep 1
R=$(EV "(() => { const gone = !document.querySelector('[data-testid=field-title]'); const sel = !!document.querySelector('[data-testid=field-mode]'); return gone && sel ? 'OK الحقول النصية اختفت وبقي الوضع' : 'FAIL gone=' + gone + ' sel=' + sel; })()")
ck "$R"
R=$(EV "(() => document.body.textContent.includes('سيُمسح كل شيء') ? 'OK تحذير المسح ظاهر' : 'FAIL لا تحذير')()")
ck "$R"
$B screenshot "$S/83-meta-clear-mode.png" >/dev/null 2>&1 && echo "لقطة 83 ✓"
EV "$PATCH" >/dev/null
R=$(EV "(() => { const btn = document.querySelector('[aria-label=\"عدّل البيانات\"]'); if (!btn) return 'FAIL لا زر'; btn.click(); return 'OK نفّذنا المسح'; })()")
ck "$R"
sleep 4
EV "(() => { const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'تحميل'); if (!btns.length) return 'FAIL لا زر تحميل'; btns[0].click(); return 'OK'; })()" >/dev/null
sleep 2
OUT=$(EV "$GRAB")
echo "$OUT" | rg -q "^B64:" && { echo "$OUT" | sed 's/^B64://' | tr -d '"' | cut -d'|' -f1 | base64 -d > "$W/out_cleared.pdf" 2>/dev/null; echo "PASS: نزّلنا الناتج الممسوح"; pass=$((pass+1)); } || { echo "FAIL: لا التقنا التنزيل ($OUT)"; fail=$((fail+1)); }
V=$(python3 -c "
import fitz
d = fitz.open('$W/out_cleared.pdf')
m = d.metadata
raw = open('$W/out_cleared.pdf','rb').read()
empty = not any([m['title'], m['author'], m['subject'], m['keywords'], m['creator'], m['producer']])
no_xmp = b'xmpmeta' not in raw and not d.xref_xml_metadata()
print('OK مسح كامل: بيانات فارغة + لا XMP' if (empty and no_xmp) else 'FAIL m=%r xmp=%s' % (m, b'xmpmeta' in raw))
")
ck "$V"
V=$(python3 -c "
import fitz
d = fitz.open('$W/out_cleared.pdf')
print('OK الصفحات سليمة بعد المسح' if d.page_count == 3 else 'FAIL صفحات')
")
ck "$V"

echo "══ 5) جوال 390px ══"
$B set viewport 390 844 >/dev/null
$B open "http://localhost:3000/?op=metadata" >/dev/null 2>&1
$B wait --load networkidle >/dev/null 2>&1
warmup; sleep 1
EV "$INJECT" >/dev/null; sleep 2.5
R=$(EV "(() => document.documentElement.scrollWidth > window.innerWidth + 1 ? 'FAIL فيض أفقي' : 'OK لا فيض على الجوال')()")
ck "$R"
R=$(EV "(() => { const f = document.querySelector('[data-testid=field-title]'); return f && f.value.includes('تقرير') ? 'OK تعبئة مسبقة على الجوال' : 'FAIL'; })()")
ck "$R"
$B screenshot "$S/84-meta-mobile-390.png" >/dev/null 2>&1 && echo "لقطة 84 ✓"

echo "══ 6) الإنجليزية ══"
$B set viewport 1440 900 >/dev/null
$B open "http://localhost:3000/?op=metadata" >/dev/null 2>&1
$B wait --load networkidle >/dev/null 2>&1
$B eval "localStorage.setItem('mahatta-locale','en')" >/dev/null 2>&1
$B reload >/dev/null 2>&1; $B wait --load networkidle >/dev/null 2>&1
warmup; sleep 1
EV "$INJECT" >/dev/null; sleep 2.5
for i in 1 2 3 4 5; do
  R=$(EV "(() => { const btn = document.querySelector('[aria-label=\"Edit info\"]'); const chip = document.body.textContent.includes('File info'); return btn && chip ? 'OK إنجليزي: Edit info + File info' : 'WAIT'; })()")
  echo "$R" | rg -q "^OK" && break
  sleep 2
done
ck "$R"
$B screenshot "$S/85-meta-english.png" >/dev/null 2>&1 && echo "لقطة 85 ✓"

echo "══ 7) انحدار: أداة أخرى تعمل ══"
$B open "http://localhost:3000/?op=rotate" >/dev/null 2>&1
$B wait --load networkidle >/dev/null 2>&1
$B eval "localStorage.setItem('mahatta-locale','ar')" >/dev/null 2>&1
$B reload >/dev/null 2>&1; $B wait --load networkidle >/dev/null 2>&1
sleep 1
EV "$INJECT" >/dev/null; sleep 3
R=$(EV "(() => { const btn = document.querySelector('[aria-label^=\"دوّر\"]'); return btn ? 'OK أداة التدوير تعمل (زرها: ' + btn.getAttribute('aria-label') + ')' : 'FAIL لا زر تدوير'; })()")
ck "$R"

echo ""
echo "══ النتيجة النهائية: PASS=$pass FAIL=$fail ══"
[ "$fail" = "0" ] && echo "ALL GREEN ✓" || echo "يوجد إخفاقات ✗"
