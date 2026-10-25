#!/bin/bash
# E2E — اختصارات لوحة المفاتيح «الكماليات» (Task 47):
#  (1) لوحة القص: Delete يحذف المنطقة المحددة من الصفحة — النسخة النضيفة تصير ملف العمل
#  (2) Ctrl+Z يتراجع: الملف الأصلي يعود ملف العمل النشط (+توست التراجع)
#  (3) Ctrl+Y يعيد: النسخة النضيفة تعود نشطة (+توست الإعادة)
#  (4) Esc يلغي التحديد (العدّاد: ما فيش تحديد)
#  (5) Backspace يعمل مثل Delete — ونضيفة-نضيفة
#  (6) Ctrl+Z ثانية يتراجع عن التنظيف الثاني (تاريخ متعدد الخطوات)
#  (7) المحرر (انحدار للاختصارات القائمة): رسم → Ctrl+Z يتراجع → Ctrl+Y يعيد →
#      تحديد العنصر → Delete يحذفه
#  (8) الكونسول نظيف عبر الجلسة
# دروس مثبتة: ضبط mahatta-locale=ar · إلغاء التحديد قبل كل سحب · انتظار الرِندر
# بعد pointerup · الأرقام لاتينية في الواجهة
# لقطات crop_kbd_01+
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
drag_sel() {
  EV "(() => { const st = document.querySelector('[data-testid=crop-stage]'); if (!st) return 'NO-STAGE'; const img = st.querySelector('img'); if (!img || !img.naturalWidth) return 'NO-IMG'; const r = st.getBoundingClientRect(); const mk = (t, x, y) => new PointerEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true }); st.dispatchEvent(mk('pointerdown', r.left + r.width * $1, r.top + r.height * $2)); window.dispatchEvent(mk('pointermove', r.left + r.width * $3, r.top + r.height * $4)); window.dispatchEvent(mk('pointerup', r.left + r.width * $3, r.top + r.height * $4)); return 'OK dragged'; })()"
  sleep 0.8
}
dims() { EV "(() => document.querySelector('[data-testid=crop-dims]')?.textContent ?? 'NO-DIMS')()"; }
kbd_line() { EV "(() => document.querySelector('[data-testid=crop-kbd]')?.textContent ?? 'NO-KBD')()"; }
key_press() { EV "((K, O) => { document.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: K, bubbles: true }, O || {}))); return 'OK ' + K; })('$1'${2:+, $2})"; }
wait_preview() {
  for i in 1 2 3 4 5 6 7 8; do
    R=$(EV "(() => { const img = document.querySelector('[data-testid=crop-stage] img'); return img && img.naturalWidth > 0 ? 'READY' : 'WAIT'; })()")
    if [ "$R" = "READY" ]; then return 0; fi
    sleep 1
  done
}
active_file() {
  EV "(() => document.querySelector('.border-primary.bg-primary\\\\/5 .truncate')?.textContent ?? 'NONE')()"
}
toast_all() { EV "(() => Array.from(document.querySelectorAll('[data-sonner-toast]')).map(t => t.textContent).join(' | '))()"; }
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

echo "── القسم 1: فتح لوحة القص + سطر الاختصارات ظاهر ──"
inject "crop_clean_me.png" "image/png" >/dev/null
sleep 1
ck "$(open_crop)"
sleep 1
wait_preview
K=$(kbd_line)
ck "$(echo "$K" | rg -q "Delete" && echo "$K" | rg -q "Ctrl\+Z" && echo 'OK kbd hint visible' || echo "BAD kbd: $K")"
set_ratio_free() { EV "(() => { const b = Array.from(document.querySelectorAll('[data-testid=crop-panel] button')).find(x => x.textContent === 'حر'); if (!b) return 'NO-FREE'; b.click(); return 'OK free'; })()" >/dev/null; }
set_ratio_free
clear_sel
ck "$(drag_sel 0.15 0.10 0.85 0.28)"
D=$(dims)
ck "$(echo "$D" | rg -q "560 × 180" && echo 'OK selection 560x180' || echo "BAD dims: $D")"
$B screenshot $S/crop_kbd_01_sel.png >/dev/null 2>&1

echo "── القسم 2: Delete يحذف المنطقة من الصفحة ──"
ck "$(key_press "Delete")"
sleep 2.2
A=$(active_file)
ck "$(echo "$A" | rg -q 'نضيفة' && echo "OK delete-key cleaned active=$A" || echo "BAD del active=$A")"
$B screenshot $S/crop_kbd_02_deleted.png >/dev/null 2>&1

echo "── القسم 3: Ctrl+Z يتراجع — الأصلي يعود ──"
ck "$(key_press "z" "{ ctrlKey: true }")"
sleep 1.8
A=$(active_file)
ck "$(echo "$A" | rg -q 'crop_clean_me.png' && echo "OK undo restored original active=$A" || echo "BAD undo active=$A")"
ck "$(echo "$(toast_all)" | rg -q 'تم التراجع' && echo 'OK undo toast' || echo "NO undo toast: $(toast_all)")"
wait_preview

echo "── القسم 4: Ctrl+Y يعيد — النضيفة تعود ──"
ck "$(key_press "y" "{ ctrlKey: true }")"
sleep 1.8
A=$(active_file)
ck "$(echo "$A" | rg -q 'نضيفة' && echo "OK redo restored cleaned active=$A" || echo "BAD redo active=$A")"
ck "$(echo "$(toast_all)" | rg -q 'تمت الإعادة' && echo 'OK redo toast' || echo "NO redo toast: $(toast_all)")"
wait_preview

echo "── القسم 5: Esc يلغي التحديد ──"
clear_sel
ck "$(drag_sel 0.20 0.35 0.75 0.60)"
ck "$(key_press "Escape")"
sleep 0.8
D=$(dims)
ck "$(echo "$D" | rg -q 'ما فيش تحديد' && echo 'OK escape cleared selection' || echo "BAD esc: $D")"

echo "── القسم 6: Backspace مثل Delete ──"
ck "$(drag_sel 0.15 0.10 0.85 0.28)"
ck "$(key_press "Backspace")"
sleep 2.2
A=$(active_file)
ck "$(echo "$A" | rg -q 'نضيفة-نضيفة' && echo "OK backspace cleaned again active=$A" || echo "BAD backspace active=$A")"
wait_preview

echo "── القسم 7: Ctrl+Z ثانية — تاريخ متعدد الخطوات ──"
ck "$(key_press "z" "{ ctrlKey: true }")"
sleep 1.8
A=$(active_file)
ck "$(echo "$A" | rg -q 'نضيفة.png' && ! echo "$A" | rg -q 'نضيفة-نضيفة' && echo "OK multi-step undo active=$A" || echo "BAD multi-undo active=$A")"
wait_preview

echo "── القسم 8: المحرر — انحدار الاختصارات القائمة ──"
ck "$(pick_card "crop_clean_me.png")"
sleep 1
EV "(() => { const b = document.querySelector('[data-testid=tb-editor]'); if (!b) return 'NO-EDITOR-BTN'; b.click(); return 'OK editor opening'; })()" >/dev/null
sleep 2.5
ck "$(EV "(() => !!document.querySelector('[data-testid=editor-layer]') ? 'OK editor open' : 'NO editor')()")"
UNDO_SEL='[data-testid=editor-layer] button[aria-label="تراجع"]'
B0=$(EV "(() => { const b = document.querySelector('$UNDO_SEL'); return b ? (b.disabled ? 'DISABLED' : 'ENABLED') : 'NO-BTN'; })()")
ck "$(echo "$B0" | rg -q 'DISABLED' && echo 'OK undo disabled before drawing' || echo "BAD undo0: $B0")"
EV "(() => { const c = document.querySelectorAll('canvas')[1]; if (!c) return 'NO-CANVAS'; const r = c.getBoundingClientRect(); const mk = (t, x, y) => new PointerEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true }); c.dispatchEvent(mk('pointerdown', r.left + r.width * 0.3, r.top + r.height * 0.3)); c.dispatchEvent(mk('pointermove', r.left + r.width * 0.42, r.top + r.height * 0.38)); c.dispatchEvent(mk('pointermove', r.left + r.width * 0.5, r.top + r.height * 0.35)); c.dispatchEvent(mk('pointerup', r.left + r.width * 0.5, r.top + r.height * 0.35)); return 'OK drew'; })()" >/dev/null
sleep 0.8
B1=$(EV "(() => { const b = document.querySelector('$UNDO_SEL'); return b ? (b.disabled ? 'DISABLED' : 'ENABLED') : 'NO-BTN'; })()")
ck "$(echo "$B1" | rg -q 'ENABLED' && echo 'OK undo enabled after pen stroke' || echo "BAD undo1: $B1")"
$B screenshot $S/crop_kbd_03_editor_draw.png >/dev/null 2>&1
ck "$(key_press "z" "{ ctrlKey: true }")"
sleep 0.8
B2=$(EV "(() => { const b = document.querySelector('$UNDO_SEL'); return b ? (b.disabled ? 'DISABLED' : 'ENABLED') : 'NO-BTN'; })()")
ck "$(echo "$B2" | rg -q 'DISABLED' && echo 'OK editor Ctrl+Z removed stroke' || echo "BAD editor-undo: $B2")"
ck "$(key_press "y" "{ ctrlKey: true }")"
sleep 0.8
B3=$(EV "(() => { const b = document.querySelector('$UNDO_SEL'); return b ? (b.disabled ? 'DISABLED' : 'ENABLED') : 'NO-BTN'; })()")
ck "$(echo "$B3" | rg -q 'ENABLED' && echo 'OK editor Ctrl+Y restored stroke' || echo "BAD editor-redo: $B3")"
EV "(() => { const b = Array.from(document.querySelectorAll('[data-testid=editor-layer] button')).find(x => x.getAttribute('aria-label') === 'تحريك'); if (!b) return 'NO-SELECT-TOOL'; b.click(); return 'OK select tool'; })()" >/dev/null
sleep 0.5
EV "(() => { const c = document.querySelectorAll('canvas')[1]; if (!c) return 'NO-CANVAS'; const r = c.getBoundingClientRect(); const mk = (t, x, y) => new PointerEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true }); c.dispatchEvent(mk('pointerdown', r.left + r.width * 0.4, r.top + r.height * 0.35)); c.dispatchEvent(mk('pointerup', r.left + r.width * 0.4, r.top + r.height * 0.35)); return 'OK clicked stroke'; })()" >/dev/null
sleep 0.8
SEL=$(EV "(() => !!document.querySelector('[data-testid=editor-layer] button[aria-label=\"حذف المحدد\"]') ? 'SELECTED' : 'NO-SEL')()")
ck "$(echo "$SEL" | rg -q 'SELECTED' && echo 'OK element selected' || echo "BAD select: $SEL")"
ck "$(key_press "Delete")"
sleep 0.8
DEL=$(EV "(() => !document.querySelector('[data-testid=editor-layer] button[aria-label=\"حذف المحدد\"]') ? 'DELETED' : 'STILL-THERE')()")
ck "$(echo "$DEL" | rg -q 'DELETED' && echo 'OK editor Delete-key removed element' || echo "BAD del: $DEL")"
$B screenshot $S/crop_kbd_04_editor_deleted.png >/dev/null 2>&1

echo "── القسم 9: الكونسول نظيف ──"
E=$(console_errors)
ck "$(echo -n "$E" | rg -q "." && echo "BAD console: $E" || echo 'OK console clean')"

echo ""
echo "═══════════════════════════"
echo "النتيجة: $pass ناجح / $fail فاشل"
echo "═══════════════════════════"
exit $fail
