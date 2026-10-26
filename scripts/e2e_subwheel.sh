#!/bin/bash
# E2E — العجلة الفرعية + الازدواجية اللغوية (Task 54)
# (1) قسم متعدد الأدوات ← قائمة دائرية بخدماته فقط (18 لـPDF · 6 لـصور · 2 لأوفيس/OCR)
# (2) أيقونة خدمة ← قسم يُضبط + منتقي مفلتر بنوع الأداة + إغلاق العجلة الفرعية
# (3) محور الرفع ← امتدادات القسم · «كل الأدوات» ← الوضع العام
# (4) أوتوكاد والأداة الواحدة يتجاوزان العجلة الفرعية (سلوك موثق)
# (5) إغلاق: Esc + زر X + خلفية · (6) أسماء ثنائية على القطاعات · (7) الجوال · (8) كونسول نظيف
B="agent-browser"
S=/home/z/my-project/screenshots
pass=0; fail=0
ck() { if echo "$1" | rg -q "^OK"; then echo "PASS: $1"; pass=$((pass+1)); else echo "FAIL: $1"; fail=$((fail+1)); fi; }
EV() {
  local raw out
  raw=$($B eval "$1" 2>&1)
  out=$(echo "$raw" | tail -1 | tr -d '"\\')
  if echo "$raw" | rg -qi "error|✗|cannot|undefined is not"; then
    echo "EV_ERR: $(echo "$raw" | head -2 | tr '\n' ' | ')" >&2
  fi
  if [ "$out" = "{}" ] || [ -z "$out" ] || [ "$out" = "}" ]; then
    sleep 1.5
    out=$($B eval "$1" 2>&1 | tail -1 | tr -d '"\\')
  fi
  echo "$out"
}
inject() {
  EV "((F, T) => fetch('/croptest/' + F).then(r => r.blob()).then(b => { const input = document.querySelector('input[type=file]'); const dt = new DataTransfer(); dt.items.add(new File([b], F, { type: T })); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true })); return 'OK ' + F; }))('$1', '$2')"
}
open_page() {
  $B open http://localhost:3000 >/dev/null 2>&1
  $B eval "(() => { localStorage.setItem('mahatta-locale','ar'); return 'ok'; })()" >/dev/null 2>&1
  $B reload >/dev/null 2>&1
  $B wait --load networkidle >/dev/null 2>&1
  sleep 2.5
}
seg_click() { EV "(() => { const b = document.querySelector('[data-testid=wheel-seg-$1]'); if (!b) return 'NO-SEG'; b.click(); return 'OK'; })()" >/dev/null; sleep 0.8; }
SW_STATE="(() => { const r = document.querySelector('[data-testid=sw-root]'); return JSON.stringify({ open: !!r, tools: document.querySelectorAll('[data-testid^=sw-tool-]').length, enter: !!document.querySelector('[data-testid=sw-enter]'), all: !!document.querySelector('[data-testid=sw-all]'), title: document.querySelector('[data-testid=sw-panel] p')?.textContent ?? '' }); })()"
ACCEPT="(() => document.querySelector('input[type=file]')?.accept ?? 'none')()"

cd /home/z/my-project
mkdir -p $S
$B set viewport 1440 900 >/dev/null 2>&1

echo "═══ 1) قسم PDF ← العجلة الفرعية بـ18 خدمة ═══"
open_page
seg_click pdf
ST=$(EV "$SW_STATE")
echo "$ST" | rg -q 'open:true' && ck "OK العجلة الفرعية ظهرت لـPDF" || ck "FAIL لم تظهر: $ST"
echo "$ST" | rg -q 'tools:18' && ck "OK 18 أداة في عجلة PDF" || ck "FAIL tools: $ST"
echo "$ST" | rg -q 'enter:true' && echo "$ST" | rg -q 'all:true' && ck "OK المحور و«كل الأدوات» موجودان" || ck "FAIL أزرار: $ST"
echo "$ST" | rg -q 'title:خدمات PDF' && ck "OK العنوان «خدمات PDF»" || ck "FAIL title: $ST"

echo "═══ 2) أيقونة خدمة (دمج) ← منتقي .pdf + إغلاق ═══"
EV "(() => { document.querySelector('[data-testid=sw-tool-merge]')?.click(); return 'x'; })()" >/dev/null
sleep 0.5
ck "$(EV "(() => !document.querySelector('[data-testid=sw-root]') ? 'OK أغلقت بعد اختيار الخدمة' : 'FAIL ما زالت مفتوحة')()")"
A=$(EV "$ACCEPT"); [ "$A" = ".pdf" ] && ck "OK قبول الدمج .pdf" || ck "FAIL accept=$A"

echo "═══ 3) Esc يغلق + OCR بأداتين ═══"
sleep 2
seg_click ocr
ck "$(EV "(() => document.querySelector('[data-testid=sw-root]') ? 'OK عجلة OCR ظهرت' : 'FAIL')()")"
ck "$(EV "(() => { const ids = [...document.querySelectorAll('[data-testid^=sw-tool-]')].map(b => b.getAttribute('data-testid')).sort().join(','); return ids === 'sw-tool-extract_text,sw-tool-ocr' ? 'OK أداتا OCR بالضبط' : 'FAIL ' + ids; })()")"
EV "(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return 'x'; })()" >/dev/null
sleep 0.4
ck "$(EV "(() => !document.querySelector('[data-testid=sw-root]') ? 'OK Esc أغلق' : 'FAIL Esc')()")"

echo "═══ 4) محور الرفع ← امتدادات القسم ═══"
sleep 1.5
seg_click ocr
EV "(() => { document.querySelector('[data-testid=sw-enter]')?.click(); return 'x'; })()" >/dev/null
sleep 0.5
A=$(EV "$ACCEPT"); [ "$A" = ".pdf,image/*" ] && ck "OK محور OCR يقبل .pdf,image/*" || ck "FAIL accept=$A"
ck "$(EV "(() => !document.querySelector('[data-testid=sw-root]') ? 'OK أغلقت من المحور' : 'FAIL')()")"

echo "═══ 5) الصور 6 · أوفيس 2 ═══"
sleep 1.5
seg_click images
N=$(EV "$SW_STATE"); echo "$N" | rg -q 'tools:6' && ck "OK عجلة الصور 6 أدوات" || ck "FAIL images: $N"
EV "(() => { document.querySelector('[data-testid=sw-close]')?.click(); return 'x'; })()" >/dev/null
sleep 1.5
seg_click office
N=$(EV "$SW_STATE"); echo "$N" | rg -q 'tools:2' && ck "OK عجلة أوفيس أداتان" || ck "FAIL office: $N"
EV "(() => { document.querySelector('[data-testid=sw-close]')?.click(); return 'x'; })()" >/dev/null

echo "═══ 6) أوتوكاد يتجاوز العجلة الفرعية ═══"
sleep 2
seg_click cad
ck "$(EV "(() => !document.querySelector('[data-testid=sw-root]') ? 'OK أوتوكاد بلا عجلة فرعية' : 'FAIL ظهرت لأوتوكاد')()")"
A=$(EV "$ACCEPT"); [ "$A" = ".dwg,.dxf" ] && ck "OK قبول أوتوكاد .dwg,.dxf" || ck "FAIL accept=$A"

echo "═══ 7) التعديل (أداة واحدة) يتجاوز كذلك ═══"
sleep 2
seg_click edit
ck "$(EV "(() => !document.querySelector('[data-testid=sw-root]') ? 'OK التعديل بلا عجلة فرعية' : 'FAIL ظهرت للتعديل')()")"
A=$(EV "$ACCEPT"); [ "$A" = ".pdf,image/*" ] && ck "OK قبول التعديل .pdf,image/*" || ck "FAIL accept=$A"

echo "═══ 8) الخلفية و«كل الأدوات» يغلقان ═══"
sleep 2
seg_click pdf
EV "(() => { document.querySelector('[data-testid=sw-root]')?.click(); return 'x'; })()" >/dev/null
sleep 0.4
ck "$(EV "(() => !document.querySelector('[data-testid=sw-root]') ? 'OK نقرة الخلفية أغلقت' : 'FAIL الخلفية')()")"
sleep 1.5
seg_click pdf
EV "(() => { document.querySelector('[data-testid=sw-all]')?.click(); return 'x'; })()" >/dev/null
sleep 0.5
A=$(EV "$ACCEPT"); [ "$A" = ".pdf,image/*" ] && ck "OK «كل الأدوات» → الوضع العام" || ck "FAIL all=$A"
ck "$(EV "(() => !document.querySelector('[data-testid=sw-root]') ? 'OK أغلقت من زر الكل' : 'FAIL')()")"

echo "═══ 9) الازدواجية اللغوية على القطاعات (عربي + إنجليزي) ═══"
sleep 1.5
ck "$(EV "(() => { const subs = [...document.querySelectorAll('section [data-testid^=wheel-seg-] span[dir=ltr]')].map(s => s.textContent); const want = ['PDF','Images','AutoCAD','Office','OCR','Sign & Edit']; return JSON.stringify(subs) === JSON.stringify(want) ? 'OK الأسماء الإنجليزية الست ظاهرة على العربية' : 'FAIL ' + JSON.stringify(subs); })()")"
ck "$(EV "(() => { const segs = [...document.querySelectorAll('section [data-testid^=wheel-seg-]')]; const names = segs.map(b => { const sp = [...b.querySelectorAll('span')].filter(s => !s.hasAttribute('dir') && s.textContent.trim()); return sp.length ? sp[sp.length - 1].textContent.trim() : 'EMPTY'; }); return (names.length === 6 && names.every(n => n !== 'EMPTY')) ? 'OK six-arabic-names' : 'FAIL ' + JSON.stringify(names); })()")"

echo "═══ 10) الجوال 390px ═══"
$B set viewport 390 844 >/dev/null 2>&1
sleep 1
$B reload >/dev/null 2>&1; sleep 4
EV "(() => { document.querySelector('[data-testid=wheel-card-pdf]')?.click(); return 'x'; })()" >/dev/null
sleep 1
ck "$(EV "(() => document.querySelector('[data-testid=sw-root]') ? 'OK عجلة فرعية على الجوال' : 'FAIL الجوال')()")"
EV "(() => { document.querySelector('[data-testid=sw-tool-merge]')?.click(); return 'x'; })()" >/dev/null
sleep 0.5
A=$(EV "$ACCEPT"); [ "$A" = ".pdf" ] && ck "OK جوال: قبول الدمج .pdf" || ck "FAIL mobile=$A"
$B screenshot $S/subwheel_mobile.png >/dev/null 2>&1 && echo "لقطة جوال ✓"

echo "═══ 11) لقطة سطح المكتب + كونسول ═══"
$B set viewport 1440 900 >/dev/null 2>&1
sleep 1
$B reload >/dev/null 2>&1; sleep 4
seg_click pdf
$B screenshot $S/subwheel_pdf.png >/dev/null 2>&1 && echo "لقطة سطح المكتب ✓"
EV "(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return 'x'; })()" >/dev/null
H=$($B console 2>&1 | grep -ci "hydration\|mismatch" || true)
[ "${H:-0}" = "0" ] && ck "OK كونسول بلا أخطاء ترطيب" || ck "FAIL hydration=$H"

echo ""
echo "════════ النتيجة: نجح=$pass فشل=$fail ════════"
