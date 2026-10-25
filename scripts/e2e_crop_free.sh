#!/bin/bash
# E2E — القص الحر «زي الرسام» (قص وتنظيف):
#  (1) أداة «قص» تفتح اللوحة لصورة، والمعاينة تظهر
#  (2) سحب حر يحرّك التحديد والعدّاد يعرض بكسل الصورة الأصلية بدقة
#  (3) النسب الجاهزة تعمل: 1:1 مربع تام بالبكسل (مع تصحيح نسبة أبعاد الصورة)
#  (4) نقرة بلا سحب خارج التحديد تُلغيه (العدّاد يعود «ما فيش تحديد»)
#  (5) «احفظ القطعة» يضيف ملف مستقل لشريط النتائج والأصل سليم
#  (6) «احذفها من الصفحة» ينتج نسخة نضيفة تصير ملف العمل النشط
#  (7) PDF: معاينة الصفحة + تنقل 1 / 2
#  (8) PDF: «احفظ القطعة» ينتج PNG مستقل باسم الصفحة
#  (9) PDF: «احذفها» يشال تعليق Ink حقيقيًا (+1 تعليق) ويغطي بالأبيض
# (10) PDF: «طبّق على كل الصفحات» ينتج نسخة إضافية بالغطاء
# (11) الصور: «طبّق على كل الصور» ينضف الدفعة كاملة
# (12) الكونسول نظيف من الأخطاء عبر الجلسة كلها
# دروس مثبتة: الأرقام لاتينية في كل الواجهة (قرار المنتج) · قبل كل سحب
# يُلغى التحديد السابق كي لا يتحول السحب لنمط تحريك · الانتظار بعد السحب
# لفراغ رِندر React قبل قراءة العدّاد
# لقطات 127+
B="agent-browser"
S=/home/z/my-project/screenshots
pass=0; fail=0
ck() { if echo "$1" | rg -q "^OK"; then echo "PASS: $1"; pass=$((pass+1)); else echo "FAIL: $1"; fail=$((fail+1)); fi; }
EV() {
  local raw out
  raw=$($B eval "$1" 2>&1)
  out=$(echo "$raw" | tail -1 | tr -d '"\\')
  if echo "$raw" | rg -qi "EV_ERR|✗|cannot|is not a function"; then
    echo "EV_ERR: $(echo "$raw" | head -2 | tr '\n' ' | ')" >&2
  fi
  if [ "$out" = "{}" ] || [ -z "$out" ] || [ "$out" = "}" ]; then
    sleep 1.5
    out=$($B eval "$1" 2>&1 | tail -1 | tr -d '"\\')
  fi
  echo "$out"
}
warmup() {
  for i in 1 2 3; do
    R=$($B eval "1+1" 2>/dev/null | tail -1 | tr -d '"\\')
    if [ "$R" = "2" ]; then return 0; fi
    sleep 2
    $B reload >/dev/null 2>&1
    sleep 2
  done
}
inject() {
  EV "((F, T) => fetch('/croptest/' + F).then(r => r.blob()).then(b => { const input = document.querySelector('input[type=file]'); const dt = new DataTransfer(); dt.items.add(new File([b], F, { type: T })); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true })); return 'OK ' + F; }))('$1', '$2')"
}
open_crop() {
  EV "(() => { const b = document.querySelector('[data-testid=tb-image_crop]'); if (!b) return 'NO-BTN'; if (b.className.includes('cursor-not-allowed')) return 'DISABLED'; b.click(); return 'OK clicked'; })()"
}
pick_card() {
  EV "((N) => { const cards = Array.from(document.querySelectorAll('.relative.flex.cursor-pointer')).filter(c => c.textContent.includes(N)); if (!cards.length) return 'NO-CARD'; cards[0].click(); return 'OK card'; })('$1')"
}
clear_sel() {
  EV "(() => { const b = document.querySelector('[data-testid=crop-clear]'); if (b && !b.disabled) { b.click(); return 'OK cleared'; } return 'OK no-sel'; })()" >/dev/null
}
set_ratio() {
  EV "(() => { const b = document.querySelector('[data-testid=crop-ratio-$1]'); if (!b) return 'NO-RATIO'; b.click(); return 'OK ratio'; })()" >/dev/null
}
drag_sel() {
  EV "(() => { const st = document.querySelector('[data-testid=crop-stage]'); if (!st) return 'NO-STAGE'; const img = st.querySelector('img'); if (!img || !img.naturalWidth) return 'NO-IMG'; const r = st.getBoundingClientRect(); const mk = (t, x, y) => new PointerEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true }); st.dispatchEvent(mk('pointerdown', r.left + r.width * $1, r.top + r.height * $2)); window.dispatchEvent(mk('pointermove', r.left + r.width * $3, r.top + r.height * $4)); window.dispatchEvent(mk('pointerup', r.left + r.width * $3, r.top + r.height * $4)); return 'OK dragged'; })()"
  sleep 0.8
}
dims() { EV "(() => document.querySelector('[data-testid=crop-dims]')?.textContent ?? 'NO-DIMS')()"; }
wait_preview() {
  for i in 1 2 3 4 5 6 7 8; do
    R=$(EV "(() => { const img = document.querySelector('[data-testid=crop-stage] img'); return img && img.naturalWidth > 0 ? 'READY' : 'WAIT'; })()")
    if [ "$R" = "READY" ]; then return 0; fi
    sleep 1
  done
}
result_names() {
  EV "(() => JSON.stringify(Array.from(document.querySelectorAll('.flex.items-center.gap-3.rounded-xl .truncate')).map(e => e.textContent)))()"
}
active_file() {
  EV "(() => document.querySelector('.border-primary.bg-primary\\\\/5 .truncate')?.textContent ?? 'NONE')()"
}
console_errors() {
  $B console 2>/dev/null | awk '
    /^\[(debug|info|log|verbose)\]/ {bad=0; next}
    /^\[(error|critical)\]/ {bad=1}
    bad {print}
  ' | grep -v "boom-real-test" | head -5
}

cd /home/z/my-project
mkdir -p $S
$B set viewport 1440 900 >/dev/null
$B open http://localhost:3000 >/dev/null 2>&1
$B cookies set mahatta-locale ar >/dev/null 2>&1
$B reload >/dev/null 2>&1
warmup
$B console --clear >/dev/null 2>&1

echo "── القسم 1: صورة — فتح اللوحة والسحب الحر ──"
inject "crop_clean_me.png" "image/png" >/dev/null
sleep 1
ck "$(open_crop)"
sleep 1
wait_preview
ck "$(EV "(() => !!document.querySelector('[data-testid=crop-panel]') ? 'OK panel open' : 'NO panel')()")"
set_ratio "free"
ck "$(drag_sel 0.15 0.10 0.85 0.28)"
D=$(dims)
ck "$(echo "$D" | rg -q "560 × 180" && echo 'OK dims 560x180 exact' || echo "BAD dims: $D")"
$B screenshot $S/crop_01_image_sel.png >/dev/null 2>&1

echo "── القسم 2: النسبة 1:1 مربع تام ──"
set_ratio "sq"
clear_sel
ck "$(drag_sel 0.10 0.40 0.60 0.90)"
D=$(dims)
ck "$(echo "$D" | rg -q "400 × 400" && echo 'OK 1:1 square 400x400' || echo "BAD square: $D")"

echo "── القسم 3: نقرة بلا سحب خارج التحديد تُلغيه ──"
ck "$(drag_sel 0.92 0.92 0.925 0.922)"
D=$(dims)
ck "$(echo "$D" | rg -q "ما فيش تحديد" && echo 'OK click clears selection' || echo "BAD clear: $D")"

echo "── القسم 4: احفظ القطعة ──"
set_ratio "free"
clear_sel
ck "$(drag_sel 0.15 0.10 0.85 0.28)"
EV "(() => { document.querySelector('[data-testid=crop-save]')?.click(); return 'OK save'; })()" >/dev/null
sleep 1.5
ck "$(echo "$(result_names)" | rg -q 'قطعة-من-crop_clean_me' && echo 'OK piece saved' || echo "NO piece: $(result_names)")"
$B screenshot $S/crop_02_piece_saved.png >/dev/null 2>&1

echo "── القسم 5: احذفها من الصفحة (نسخة نضيفة) ──"
EV "(() => { document.querySelector('[data-testid=crop-clean]')?.click(); return 'OK clean'; })()" >/dev/null
sleep 1.8
A=$(active_file)
ck "$(echo "$A" | rg -q 'نضيفة' && echo "OK cleaned active=$A" || echo "BAD clean active=$A")"
$B screenshot $S/crop_03_cleaned.png >/dev/null 2>&1

echo "── القسم 6: PDF — معاينة وتنقل وقطعة ──"
inject "crop_annot.pdf" "application/pdf" >/dev/null
sleep 1.2
ck "$(pick_card "crop_annot.pdf")"
sleep 1
wait_preview
ck "$(EV "(() => { const img = document.querySelector('[data-testid=crop-stage] img'); const nav = Array.from(document.querySelectorAll('[data-testid=crop-panel] span')).map(s => s.textContent).find(x => x?.includes('/')); return img && img.src.startsWith('data:image/jpeg') && nav === '1 / 2' ? 'OK pdf preview + nav ' + nav : 'BAD pdf preview nav=' + nav; })()")"
set_ratio "free"
clear_sel
ck "$(drag_sel 0.58 0.05 0.97 0.30)"
D=$(dims)
ck "$(echo "$D" | rg -q "232 × 210" && echo 'OK pdf region 232x210' || echo "BAD pdf dims: $D")"
EV "(() => { document.querySelector('[data-testid=crop-save]')?.click(); return 'OK save'; })()" >/dev/null
sleep 1.5
ck "$(echo "$(result_names)" | rg -q 'قطعة-صفحة-1-من-crop_annot' && echo 'OK pdf piece saved' || echo "NO pdf piece: $(result_names)")"
$B screenshot $S/crop_04_pdf_sel.png >/dev/null 2>&1

echo "── القسم 7: PDF — تنظيف حقيقي لتعليق Ink ──"
clear_sel
ck "$(drag_sel 0.58 0.05 0.97 0.30)"
EV "(() => { document.querySelector('[data-testid=crop-clean]')?.click(); return 'OK clean'; })()" >/dev/null
sleep 2.2
R=$(EV "(() => { const toasts = Array.from(document.querySelectorAll('[data-sonner-toast]')).map(t => t.textContent).join(' '); return toasts.includes('+1 تعليق') ? 'OK annot truly deleted' : 'BAD: ' + toasts.slice(0, 90); })()")
ck "$R"
A=$(active_file)
ck "$(echo "$A" | rg -q 'نضيفة.pdf' && echo "OK cleaned pdf active=$A" || echo "BAD active=$A")"

echo "── القسم 8: PDF — طبّق على كل الصفحات ──"
EV "(() => { const cb = document.querySelector('[data-testid=crop-all]'); if (cb && !cb.checked) cb.click(); return 'OK all=' + !!cb?.checked; })()" >/dev/null
clear_sel
ck "$(drag_sel 0.05 0.02 0.50 0.12)"
EV "(() => { document.querySelector('[data-testid=crop-clean]')?.click(); return 'OK clean all'; })()" >/dev/null
sleep 2.4
ck "$(echo "$(result_names)" | rg -q 'crop_annot-نضيفة-نضيفة' && echo 'OK multi-clean copy made' || echo "NO second clean: $(result_names)")"
$B screenshot $S/crop_05_pdf_allpages.png >/dev/null 2>&1

echo "── القسم 9: الصور — طبّق على كل الصور ──"
inject "crop_second.png" "image/png" >/dev/null
sleep 1
ck "$(pick_card "crop_second.png")"
sleep 1
wait_preview
EV "(() => { const cb = document.querySelector('[data-testid=crop-all]'); if (!cb) return 'NO-CB'; if (!cb.checked) cb.click(); return 'OK checked'; })()" >/dev/null
clear_sel
ck "$(drag_sel 0.55 0.02 0.98 0.22)"
EV "(() => { document.querySelector('[data-testid=crop-clean]')?.click(); return 'OK batch clean'; })()" >/dev/null
sleep 2.5
R=$(EV "(() => { const toasts = Array.from(document.querySelectorAll('[data-sonner-toast]')).map(t => t.textContent).join(' '); return toasts.includes('انضفت كلها') ? 'OK batch cleaned' : 'BAD batch: ' + toasts.slice(0, 80); })()")
ck "$R"
$B screenshot $S/crop_06_batch_images.png >/dev/null 2>&1

echo "── القسم 10: الكونسول نظيف ──"
E=$(console_errors)
ck "$(echo -n "$E" | rg -q "." && echo "BAD console: $E" || echo 'OK console clean')"

echo ""
echo "═══════════════════════════"
echo "النتيجة: $pass ناجح / $fail فاشل"
echo "═══════════════════════════"
exit $fail
