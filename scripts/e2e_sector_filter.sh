#!/bin/bash
# E2E — «الغرفة المستقلة»: فلترة الامتدادات والأدوات حسب قسم العجلة (Task 49):
#  (1) قسم صور ← المنتقي image/* يظل ثابتًا بعد الإضافة (إصلاح: كان يرجع عامًا)
#  (2) شارة القسم تظهر باسم «صور» ولون القسم
#  (3) شريط الأدوات = 6 أدوات صور فقط — دمج/ختم/فصل/أوفيس مختفية تمامًا
#  (4) إفلات/إضافة PDF داخل قسم الصور ← توست رفض + عدد الملفات لا يتغير
#  (5) زر «كل الأدوات» ← الشارة تختفي والشريط يعود كاملًا والقبول يعم
#  (6) قسم PDF ← 18 أداة PDF فقط (بلا image_convert وبلا pdf_to_word) + إضافة صورة تترفض
#  (7) الزر العام «اختر ملفاتك» ← بلا شارة وكل الأدوات الـ25 (السلوك القديم سليم)
#  (8) الجوال 390px: بطاقة صور ← الشارة والـ 6 أدوات
#  (9) الكونسول: خطأ hydration الأساس المعروف فقط — لا أخطاء جديدة
# دروس مثبتة: mahatta-locale=ar · النقر عبر eval .click() · الحقن عبر input[type=file]+DataTransfer
# لقطات sector_01+
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
remove_all() {
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
# أدوات الشريط الظاهرة — أسماء testid مفصولة بمسافات
tb_list() {
  EV "(() => Array.from(document.querySelectorAll('[data-testid^=tb-]')).map(b => b.dataset.testid).join(' '))()"
}
tb_count() {
  EV "(() => document.querySelectorAll('[data-testid^=tb-]').length)()"
}
chip_state() {
  EV "(() => { const c = document.querySelector('[data-testid=sector-chip]'); return c ? 'OK chip: ' + c.textContent.slice(0, 40) : 'NO-CHIP'; })()"
}
pick_seg() {
  EV "(() => { const b = document.querySelector('[data-testid=wheel-seg-$1]'); if (!b) return 'NO-SEG'; b.click(); return 'OK picked $1'; })()"
}

cd /home/z/my-project
mkdir -p $S

echo "═══ فتح الصفحة ═══"
$B open http://localhost:3000 >/dev/null 2>&1
$B eval "(() => { localStorage.setItem('mahatta-locale', 'ar'); return 'ar-set'; })()" >/dev/null 2>&1  # الكوكي ميت — الكشف يقرأ localStorage فقط (i18n/core.ts)
$B reload >/dev/null 2>&1
sleep 5
warmup
$B console --clear >/dev/null 2>&1
$B errors --clear >/dev/null 2>&1
$B set viewport 1440 900 >/dev/null 2>&1 || true
$B reload >/dev/null 2>&1
sleep 4

echo "═══ 1) قسم صور: الغرفة المستقلة ═══"
ck "$(pick_seg images)"
sleep 0.6
ACC=$(seg_accept)
if [ "$ACC" = "image/*" ]; then ck "OK images accept=$ACC"; else ck "FAIL accept=$ACC"; fi
ck "$(inject crop_clean_me.png image/png)"
sleep 3.5
ck "$(chip_state)"
# القبول يظل مفلترًا بعد الإضافة — جوهر إصلاح «الامتداد فقط»
ACC2=$(seg_accept)
if [ "$ACC2" = "image/*" ]; then ck "OK accept stays sector-scoped ($ACC2)"; else ck "FAIL accept leaked ($ACC2)"; fi
# الشريط: 6 أدوات صور فقط
N=$(tb_count)
if [ "$N" = "6" ]; then ck "OK toolbar=6 image tools"; else ck "FAIL toolbar count=$N ($(tb_list))"; fi
LIST=$(tb_list)
case "$LIST" in
  *tb-merge*|*tb-watermark*|*tb-split*|*tb-pdf_to_word*|*tb-cad_viewer*) ck "FAIL foreign tools visible: $LIST" ;;
  *)
    SIX=1
    for T in tb-compress tb-rotate tb-image_convert tb-image_resize tb-image_crop tb-images_to_pdf; do
      echo "$LIST" | rg -q "(^| )$T( |$)" || SIX=0
    done
    if [ "$SIX" = "1" ]; then ck "OK exactly the 6 image tools"; else ck "FAIL missing tools: $LIST"; fi
    ;;
esac
$B screenshot $S/sector_01_images.png >/dev/null 2>&1

echo "═══ 2) رفض PDF داخل قسم الصور ═══"
BEFORE=$(files_count)
ck "$(inject crop_annot.pdf application/pdf)"
sleep 1.5
AFTER=$(files_count)
TOAST=$(EV "(() => { const t = document.querySelector('[data-sonner-toast]'); return t ? 'TOAST: ' + t.textContent.slice(0, 60) : 'NO-TOAST'; })()")
if [ "$BEFORE" = "$AFTER" ] && echo "$TOAST" | rg -q "لم يُقبل"; then
  ck "OK pdf rejected in images sector (files $BEFORE→$AFTER, $TOAST)"
else
  ck "FAIL rejection (files $BEFORE→$AFTER, $TOAST)"
fi

echo "═══ 3) زر «كل الأدوات» ← الوضع العام ═══"
ck "$(EV "(() => { const b = document.querySelector('[data-testid=sector-exit]'); if (!b) return 'NO-EXIT'; b.click(); return 'OK exit clicked'; })()")"
sleep 1
ck "$(EV "(() => document.querySelector('[data-testid=sector-chip]') ? 'BAD chip-still' : 'OK chip gone')()")"
N=$(tb_count)
if [ "$N" = "25" ]; then ck "OK all 25 tools back"; else ck "FAIL toolbar=$N"; fi
ACC3=$(seg_accept)
if [ "$ACC3" = ".pdf,image/*" ]; then ck "OK accept general again ($ACC3)"; else ck "FAIL accept=$ACC3"; fi

echo "═══ 4) قسم PDF: 18 أداة + رفض الصور ═══"
ck "$(remove_all)"
$B reload >/dev/null 2>&1; sleep 4
ck "$(pick_seg pdf)"
sleep 0.6
ck "$(inject crop_annot.pdf application/pdf)"
sleep 3.5
ck "$(chip_state)"
N=$(tb_count)
if [ "$N" = "18" ]; then ck "OK toolbar=18 pdf tools"; else ck "FAIL toolbar=$N ($(tb_list))"; fi
LIST=$(tb_list)
case "$LIST" in
  *tb-image_convert*|*tb-image_resize*|*tb-images_to_pdf*|*tb-pdf_to_word*|*tb-pdf_to_excel*) ck "FAIL image/office tools in pdf sector: $LIST" ;;
  *tb-editor*tb-merge*tb-split*tb-sign*tb-protect*) ck "OK pdf toolset correct" ;;
  *) ck "FAIL unexpected list: $LIST" ;;
esac
ck "$(inject crop_clean_me.png image/png)"
sleep 1.5
TOAST2=$(EV "(() => { const t = document.querySelector('[data-sonner-toast]'); return t ? 'TOAST: ' + t.textContent.slice(0, 60) : 'NO-TOAST'; })()")
if echo "$TOAST2" | rg -q "لم يُقبل"; then ck "OK image rejected in pdf sector ($TOAST2)"; else ck "FAIL no rejection ($TOAST2)"; fi
$B screenshot $S/sector_02_pdf.png >/dev/null 2>&1

echo "═══ 5) الزر العام: بلا قسم وكل الأدوات ═══"
ck "$(remove_all)"
$B reload >/dev/null 2>&1; sleep 4
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-pick-btn]').click(); return 'OK generic clicked'; })()")"
sleep 0.6
ck "$(inject crop_annot.pdf application/pdf)"
sleep 3.5
ck "$(EV "(() => document.querySelector('[data-testid=sector-chip]') ? 'BAD chip-on-generic' : 'OK no chip (generic mode)')()")"
N=$(tb_count)
if [ "$N" = "25" ]; then ck "OK generic keeps all 25 tools"; else ck "FAIL toolbar=$N"; fi
$B screenshot $S/sector_03_generic.png >/dev/null 2>&1

echo "═══ 6) قسم أوتوكاد: أداة واحدة فقط ═══"
ck "$(remove_all)"
$B reload >/dev/null 2>&1; sleep 4
ck "$(pick_seg cad)"
sleep 0.6
ACC4=$(seg_accept)
if [ "$ACC4" = ".dwg,.dxf" ]; then ck "OK cad accept=$ACC4"; else ck "FAIL cad accept=$ACC4"; fi
# إضافة PDF في قسم أوتوكاد ← رفض بلا حقن (الامتداد لا يطابق)
ck "$(inject crop_annot.pdf application/pdf)"
sleep 1.5
TOAST3=$(EV "(() => { const t = document.querySelector('[data-sonner-toast]'); return t ? 'TOAST: ' + t.textContent.slice(0, 60) : 'NO-TOAST'; })()")
if echo "$TOAST3" | rg -q "لم يُقبل"; then ck "OK pdf rejected in cad sector ($TOAST3)"; else ck "FAIL cad rejection ($TOAST3)"; fi

echo "═══ 7) الجوال 390px: بطاقة صور ═══"
ck "$(remove_all)"
sleep 1
$B set viewport 390 844 >/dev/null 2>&1
sleep 1.5
$B reload >/dev/null 2>&1; sleep 4
ck "$(EV "(() => { const b = document.querySelector('[data-testid=wheel-card-images]'); if (!b) return 'NO-CARD'; b.click(); return 'OK card clicked'; })()")"
sleep 0.6
ck "$(inject crop_clean_me.png image/png)"
sleep 3.5
ck "$(chip_state)"
N=$(tb_count)
if [ "$N" = "6" ]; then ck "OK mobile toolbar=6"; else ck "FAIL mobile toolbar=$N ($(tb_list))"; fi
$B screenshot $S/sector_04_mobile.png >/dev/null 2>&1

echo "═══ 8) الكونسول ═══"
HYD=$($B console 2>&1 | grep -c "hydrat")
ERRS=$($B console 2>&1 | awk '/^\[(error|critical)\]/ {print}' | grep -vc -e "hydrat" -e "conversion stage" || true)
if [ "$ERRS" = "0" ] && [ "$HYD" -le 12 ]; then ck "OK console clean (hydration baseline=$HYD)"; else ck "FAIL console errors=$ERRS hydration=$HYD"; fi

echo ""
echo "════════════════════════════"
echo "النتيجة: $pass ناجح / $fail فاشل"
echo "════════════════════════════"
exit $([ $fail -eq 0 ] && echo 0 || echo 1)
