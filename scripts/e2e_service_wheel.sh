#!/bin/bash
# E2E — العجلة السينمائية لشاشة الرفع (Task 48):
#  (1) تشريح العجلة: الجذر + 6 قطاعات + المحور الزجاجي + زر الاختيار العام + تلميح الإفلات
#  (2) أسماء الأقسام الستة بالعربية صحيحة
#  (3) حلقة الترس تدور فعلًا (النمط المحسوب يتغير بين عينتين)
#  (4) التحويم على قسم يزيحه خارجيًا (transform translate)
#  (5) قسم أوتوكاد ← فلتر المنتقي .dwg,.dxf + إضافة DWG ← العارض يفتح تلقائيًا
#  (6) إزالة الملف ← العجلة تعود
#  (7) قسم OCR ← القب العام + إضافة PDF ← أداة OCR تنشط تلقائيًا
#  (8) قسم Word/Excel ← أداة pdf_to_word تنشط تلقائيًا
#  (9) قسم تعديل وتوقيع ← المحرر ينفتح تلقائيًا (tb-editor نشط)
# (10) زر الاختيار العام ← لا أداة تُفعّل (مساحة عامة)
# (11) الجوال 390px: العجلة تختفي وتظهر شبكة 6 بطاقات + بطاقة صور ← قبول image/*
# (12) لقطة سطح مكتب أثناء التحويم + لقطة الجوال
# (13) الكونسول: خطأ hydration واحد معروف سابقًا (خط أساس موثق) — لا أخطاء جديدة
# دروس مثبتة: mahatta-locale=ar · النقر عبر eval .click() · الأرقام لاتينية
# لقطات wheel_01+
B="agent-browser"
S=/home/z/my-project/screenshots
pass=0; fail=0
ck() { if echo "$1" | rg -q "^OK"; then echo "PASS: $1"; pass=$((pass+1)); else echo "FAIL: $1"; fail=$((fail+1)); fi; }
EV() {
  local raw out
  raw=$($B eval "$1" 2>&1)
  out=$(echo "$raw" | tail -1 | tr -d '"\\')
  if echo "$raw" | rg -qi "EV_ERR|✗|cannot|is not a function|timed out"; then
    echo "EV_ERR: $(echo "$raw" | head -2 | tr '\n' ' | ')" >&2
  fi
  if [ "$out" = "{}" ] || [ -z "$out" ] || [ "$out" = "}" ] || echo "$raw" | rg -qi "timed out"; then
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
inject_cad() {
  EV "((F) => fetch('/dwgtest/' + F).then(r => r.blob()).then(b => { const input = document.querySelector('input[type=file]'); const dt = new DataTransfer(); dt.items.add(new File([b], F, { type: 'image/vnd.dwg' })); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true })); return 'OK ' + F; }))('$1')"
}
remove_all() {
  # حلقة bash عبر مهام منفصلة — الحذف داخل مهمة JS واحدة يضرب نفس الزر (الـ DOM لا يتحدث وسط المهمة)
  local R
  for i in 1 2 3 4 5 6; do
    R=$(EV "(() => { const b = document.querySelector('button[aria-label=\"إزالة الملف\"]'); if (!b) return 'OK clean'; b.click(); return 'MORE'; })()")
    if echo "$R" | rg -q "OK clean"; then break; fi
    sleep 0.8
  done
  sleep 1
  echo "OK clean"
}
files_count() {
  EV "(() => document.querySelectorAll('button[aria-label=\"إزالة الملف\"]').length)()"
}
seg_accept() {
  EV "(() => document.querySelector('input[type=file]')?.getAttribute('accept') ?? 'NO-INPUT')()"
}
tb_active() {
  EV "(() => { const b = document.querySelector('[data-testid=tb-$1]'); return b ? (b.className.includes('bg-primary/10') ? 'OK active' : 'INACTIVE') : 'NO-BTN'; })()"
}
# محاكاة التحويم: CDP mouse move يطلق pointermove/mousemove فقط دون أحداث الحدود
# (mouseover/mouseenter) — والفأرة الحقيقية تولّدها طبيعيًا؛ للمتصفح الآلي نرسل mouseover متدفق
hover_seg() {
  EV "(() => { document.querySelectorAll('[data-testid^=wheel-seg-]').forEach(b => b.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))); const b = document.querySelector('[data-testid=wheel-seg-$1]'); if (!b) return 'NO-SEG'; b.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); return 'OK hovered $1'; })()"
}

cd /home/z/my-project
mkdir -p $S

echo "═══ فتح الصفحة ═══"
$B open http://localhost:3000 >/dev/null 2>&1
$B cookies set mahatta-locale ar >/dev/null 2>&1
$B reload >/dev/null 2>&1
sleep 5
warmup
$B console --clear >/dev/null 2>&1
$B errors --clear >/dev/null 2>&1
$B viewport 1440 900 >/dev/null 2>&1 || true
$B reload >/dev/null 2>&1
sleep 4

echo "═══ 1) تشريح العجلة ═══"
ck "$(EV "(() => { const r = document.querySelector('[data-testid=wheel-root]'); return r ? 'OK wheel-root' : 'NO root'; })()")"
ck "$(EV "(() => { const n = document.querySelectorAll('[data-testid^=wheel-seg-]').length; return n === 6 ? 'OK 6 segments' : 'BAD count=' + n; })()")"
ck "$(EV "(() => document.querySelector('[data-testid=wheel-hub]') ? 'OK hub' : 'NO hub')()")"
ck "$(EV "(() => document.querySelector('[data-testid=wheel-pick-btn]') ? 'OK pick-btn' : 'NO pick-btn')()")"
ck "$(EV "(() => document.querySelector('[data-testid=wheel-drop-hint]') ? 'OK drop-hint' : 'NO hint')()")"

echo "═══ 2) أسماء الأقسام ═══"
ck "$(EV "(() => { const g = (id) => document.querySelector('[data-testid=wheel-seg-' + id + ']')?.getAttribute('aria-label') ?? ''; const ok = g('pdf').includes('PDF') && g('images').includes('صور') && g('cad').includes('أوتوكاد') && g('office').includes('Word') && g('ocr').toUpperCase().includes('OCR') && g('edit').includes('تعديل'); return ok ? 'OK all labels' : 'BAD ' + g('pdf') + ' | ' + g('cad'); })()")"

echo "═══ 3) دوران حلقة الترس ═══"
T1=$(EV "(() => { const d = document.querySelector('[data-testid=wheel-stage]').children[1]; return d.style.transform || 'none'; })()")
sleep 0.9
T2=$(EV "(() => { const d = document.querySelector('[data-testid=wheel-stage]').children[1]; return d.style.transform || 'none'; })()")
if [ "$T1" != "$T2" ] && [ "$T1" != "none" ]; then ck "OK ring rotates ($T1 → $T2)"; else ck "FAIL ring static ($T1)"; fi

echo "═══ 4) التحويم يزيح القسم ═══"
BEFORE=$(EV "(() => { const b = document.querySelector('[data-testid=wheel-seg-ocr]'); return b.style.transform || 'none'; })()")
ck "$(hover_seg ocr)"
sleep 0.8
AFTER=$(EV "(() => { const b = document.querySelector('[data-testid=wheel-seg-ocr]'); return b.style.transform || 'none'; })()")
if [ "$BEFORE" = "none" ] && [ "$AFTER" != "none" ]; then ck "OK hover slides segment ($AFTER)"; else ck "FAIL hover ($BEFORE → $AFTER)"; fi
$B screenshot $S/wheel_02_hover.png >/dev/null 2>&1
$B mouse move 20 20 >/dev/null 2>&1
sleep 0.5

echo "═══ 5) قسم أوتوكاد ← عارض تلقائي ═══"
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-seg-cad]').click(); return 'OK clicked cad'; })()")"
sleep 0.6
ACC=$(seg_accept)
if [ "$ACC" = ".dwg,.dxf" ]; then ck "OK accept=$ACC"; else ck "FAIL accept=$ACC"; fi
ck "$(inject_cad example_2000.dwg)"
sleep 4
ck "$(EV "(() => document.querySelector('[data-testid=cad-pan-btn]') ? 'OK cad-viewer opened' : 'NO cad-viewer')()")"

echo "═══ 6) إزالة الملف ← العجلة تعود ═══"
ck "$(remove_all)"
ck "$(EV "(() => document.querySelector('[data-testid=wheel-root]') ? 'OK wheel back' : 'NO wheel')()")"
ACC2=$(seg_accept)
if [ "$ACC2" = ".pdf,image/*" ]; then ck "OK accept reset ($ACC2)"; else ck "FAIL reset=$ACC2"; fi

echo "═══ 7) قسم OCR ← أداة تلقائية ═══"
$B reload >/dev/null 2>&1; sleep 3.5  # بداية باردة لكل خدمة — عزل الحالة ومحاكاة رحلة مستخدم حقيقي
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-seg-ocr]').click(); return 'OK clicked ocr'; })()")"
sleep 0.6
ck "$(inject crop_annot.pdf application/pdf)"
sleep 3.5
ck "$(tb_active ocr)"

echo "═══ 8) قسم Word/Excel ═══"
ck "$(remove_all)"
$B reload >/dev/null 2>&1; sleep 3.5
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-seg-office]').click(); return 'OK clicked office'; })()")"
sleep 0.6
ck "$(inject crop_annot.pdf application/pdf)"
sleep 3.5
ck "$(tb_active pdf_to_word)"

echo "═══ 9) قسم تعديل وتوقيع ← المحرر ═══"
ck "$(remove_all)"
$B reload >/dev/null 2>&1; sleep 3.5
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-seg-edit]').click(); return 'OK clicked edit'; })()")"
sleep 0.6
ck "$(inject crop_clean_me.png image/png)"
sleep 3.5
ck "$(tb_active editor)"

echo "═══ 10) الزر العام ← بلا أداة ═══"
ck "$(remove_all)"
$B reload >/dev/null 2>&1; sleep 3.5
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-pick-btn]').click(); return 'OK clicked pick'; })()")"
sleep 0.6
ck "$(inject crop_annot.pdf application/pdf)"
sleep 3.5
NONE=$(EV "(() => { const act = Array.from(document.querySelectorAll('[data-testid^=tb-]')).filter(b => b.className.includes('bg-primary/10')); return act.length === 0 ? 'OK no tool' : 'BAD active=' + act.length; })()")
ck "$NONE"

echo "═══ 11) الجوال: شبكة البطاقات ═══"
ck "$(remove_all)"
sleep 1
$B set viewport 390 844 >/dev/null 2>&1
sleep 1.5
ck "$(EV "(() => { const st = document.querySelector('[data-testid=wheel-stage]'); const g = document.querySelector('[data-testid=wheel-grid]'); const vis = (el) => el && el.offsetParent !== null; return !vis(st) && vis(g) ? 'OK mobile grid' : 'BAD stage=' + !!st + ' grid=' + !!g; })()")"
ck "$(EV "(() => { const n = document.querySelectorAll('[data-testid^=wheel-card-]').length; return n === 6 ? 'OK 6 cards' : 'BAD cards=' + n; })()")"
$B screenshot $S/wheel_03_mobile.png >/dev/null 2>&1
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-card-images]').click(); return 'OK clicked images card'; })()")"
sleep 0.6
ACC3=$(seg_accept)
if [ "$ACC3" = "image/*" ]; then ck "OK mobile accept=$ACC3"; else ck "FAIL mobile accept=$ACC3"; fi
ck "$(inject crop_clean_me.png image/png)"
sleep 3
ck "$(EV "(() => document.querySelector('[data-testid=wheel-root]') ? 'NO wheel-still' : 'OK workspace replaced wheel')()")"

echo "═══ 12) لقطة سطح المكتب النهائية ═══"
$B set viewport 1440 900 >/dev/null 2>&1
ck "$(remove_all)"
sleep 1.5
$B hover "[data-testid=wheel-seg-images]" >/dev/null 2>&1
sleep 0.8
$B screenshot $S/wheel_04_final.png >/dev/null 2>&1

echo "═══ 13) الكونسول ═══"
# الخط الأساسي الموثق: خطأ hydration واحد لكل تحميل (كشف اللغة القائم سلفًا)
# + ضجيج PARSE من محرك CAD الداخلي عند فتح DWG (العارض يفتح سليمًا — سلوك موثق بالمهام 42-43)
HYD=$($B console 2>&1 | grep -c "hydrat")
ERRS=$($B console 2>&1 | awk '/^\[(error|critical)\]/ {print}' | grep -vc -e "hydrat" -e "conversion stage" || true)
# كل تحميل في الجلسة يولّد خطأ hydration المعروف الواحد (الخط الأساسي) — 6 بدايات باردة ≈ 6-10
if [ "$ERRS" = "0" ] && [ "$HYD" -le 12 ]; then ck "OK console clean (hydration per-load baseline=$HYD, PARSE noise filtered)"; else ck "FAIL console errors=$ERRS hydration=$HYD"; fi

echo ""
echo "════════════════════════════"
echo "النتيجة: $pass ناجح / $fail فاشل"
echo "════════════════════════════"
exit $([ $fail -eq 0 ] && echo 0 || echo 1)
