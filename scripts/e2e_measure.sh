#!/bin/bash
# E2E — أداة قياس المسافات في عارض الأوتوكاد (لقطات 67+) — v2 بمخرجات نظيفة
B="agent-browser"
S=/home/z/my-project/screenshots
pass=0; fail=0
ck() { if echo "$1" | rg -q "^OK"; then echo "PASS: $1"; pass=$((pass+1)); else echo "FAIL: $1"; fail=$((fail+1)); fi; }
# eval بنتيجة نظيفة بلا اقتباس + إعادة محاولة لو السياق تعب
EV() {
  local raw out
  raw=$($B eval "$1" 2>&1)
  out=$(echo "$raw" | tail -1 | tr -d '"')
  if echo "$raw" | rg -qi "error|✗|cannot|undefined is not"; then
    echo "EV_ERR: $(echo "$raw" | head -2 | tr '\n' ' | ')" >&2
  fi
  if [ "$out" = "{}" ] || [ -z "$out" ] || [ "$out" = "}" ]; then
    sleep 1.5
    out=$($B eval "$1" 2>&1 | tail -1 | tr -d '"')
  fi
  echo "$out"
}
# إحداثيات صندوق الكانفس بمحاولات متكررة — أساس كل النقرات
GET_BOX() {
  local box=""
  for i in 1 2 3 4; do
    box=$(EV "(() => { const el = document.querySelector('[data-testid=cad-canvas-box]'); if (!el) return 'NOBOX'; const b = el.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(v => Math.round(v)).join(' '); })()")
    if echo "$box" | rg -q "^[0-9]+ [0-9]+ [0-9]+ [0-9]+$"; then echo "$box"; return 0; fi
    echo "محاولة $i فشلت: $box" >&2
    sleep 2
  done
  echo ""
}
# تسخين سياق التنفيذ بعد open/reload — بعض الجولات بيكسر السياق
warmup() {
  for i in 1 2 3; do
    R=$($B eval "1+1" 2>/dev/null | tail -1 | tr -d '"')
    if [ "$R" = "2" ]; then return 0; fi
    sleep 2
    $B reload >/dev/null 2>&1
    sleep 2
  done
}
# نقر بأحداث ماوس حقيقية عند إحداثيات
click_at() { $B mouse move $1 $2 >/dev/null 2>&1; $B mouse down left >/dev/null 2>&1; $B mouse up left >/dev/null 2>&1; }
# تبديل اللغة برمجيًا — find text غير موثوق مع النص العربي الملتصق بالعلم
switch_lang() {
  EV "(() => { const sw = document.querySelector('[data-testid=lang-switcher]'); const btn = sw?.querySelector('button'); if (!btn) return 'FAIL no switcher'; if (btn.getAttribute('aria-expanded') !== 'true') btn.click(); return 'OK'; })()" >/dev/null
  sleep 0.5
  EV "(() => { const item=[...document.querySelectorAll('[data-testid=lang-switcher] button')].find(x => (x.textContent || '').includes('$1')); if (!item) return 'FAIL no item'; item.click(); return 'OK'; })()" >/dev/null
  sleep 0.8
}
# إحداثيات صندوق الكانفس: "L T W H"
BOXQ="(() => { const b = document.querySelector('[data-testid=cad-canvas-box]').getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(v => Math.round(v)).join(' '); })()"
probe() { EV "(() => { const btn = document.querySelector('[data-testid=cad-measure-btn]'); const chip = !!document.querySelector('[data-testid=cad-measure-chip]'); return 'PROBE pressed=' + btn?.getAttribute('aria-pressed') + ' chip=' + chip; })()"; }

cd /home/z/my-project

echo "══ 1) سطح المكتب: فتح الموقع وحقن DXF ══"
$B set viewport 1440 900 >/dev/null
$B open http://localhost:3000 >/dev/null
$B wait --load networkidle >/dev/null
# تصفير اللغة — لكن المتصفح نفسه إنجليزي فالـ i18n يكتشفه تلقائيًا: نضبط العربية صريحًا
$B eval "localStorage.removeItem('mahatta-locale')" >/dev/null 2>&1
$B reload >/dev/null
$B wait --load networkidle >/dev/null
warmup
sleep 1
R=$(EV "(() => document.documentElement.dir === 'rtl' ? 'OK rtl' : 'FIX')()")
if [ "$R" != "OK rtl" ]; then
  switch_lang "العربية"
fi
R=$(EV "(() => document.documentElement.dir === 'rtl' ? 'OK العربية جاهزة' : 'FAIL ما زالت ltr')()")
ck "$R"
R=$(EV "(async () => {
  const res = await fetch('/t.dxf');
  const file = new File([await res.blob()], 't.dxf', { type: 'application/dxf' });
  const input = document.querySelector('input[type=file]');
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return 'OK injected';
})()")
ck "$R"

echo "══ 2) فتح العارض ══"
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView && document.querySelector('[data-testid=cad-canvas-box] canvas')" --timeout 60000 >/dev/null 2>&1
sleep 3
$B screenshot $S/67-cad-viewer-open.png >/dev/null && echo "لقطة 67 ✓"

echo "══ 3) تفعيل القياس ونقطتان ══"
$B find role button click --name "قياس" >/dev/null 2>&1
sleep 1
probe
N=$(EV "(() => document.querySelectorAll('[data-testid=cad-measure-chip]').length + '')()")
ck "$([ "$N" = "1" ] && echo "OK chip ظهرت" || echo "FAIL chip مفقودة n=$N")"

BOX=$(EV "$BOXQ")
L=$(echo $BOX | cut -d' ' -f1); T=$(echo $BOX | cut -d' ' -f2)
W=$(echo $BOX | cut -d' ' -f3); H=$(echo $BOX | cut -d' ' -f4)
echo "الصندوق: L=$L T=$T W=$W H=$H"
AX=$(python3 -c "print(round($L + $W*0.30))"); AY=$(python3 -c "print(round($T + $H*0.40))")
BX=$(python3 -c "print(round($L + $W*0.70))"); BY=$(python3 -c "print(round($T + $H*0.60))")
echo "نقطة A=($AX,$AY) نقطة B=($BX,$BY)"
click_at $AX $AY; sleep 0.6
click_at $BX $BY; sleep 1

R=$(EV "(() => {
  const chip = document.querySelector('[data-testid=cad-measure-chip]');
  if (!chip) return 'FAIL لا توجد لوحة قراءات';
  const val = (document.querySelector('[data-testid=cad-measure-val]')?.textContent || '').trim();
  const chipNum = parseFloat(val.replace(/[^0-9.\-]/g, ''));
  const v = window.__cadMgr && window.__cadMgr.curView;
  if (!v) return 'FAIL لا يوجد curView';
  const box = document.querySelector('[data-testid=cad-canvas-box]').getBoundingClientRect();
  const ax = box.left + box.width*0.30, ay = box.top + box.height*0.40;
  const bx = box.left + box.width*0.70, by = box.top + box.height*0.60;
  const A = v.screenToWorld({x: ax - box.left, y: ay - box.top});
  const B2 = v.screenToWorld({x: bx - box.left, y: by - box.top});
  const exp = Math.hypot(B2.x - A.x, B2.y - A.y);
  const ok = Number.isFinite(chipNum) && Math.abs(chipNum - exp) < Math.max(0.02, exp * 0.01);
  const circles = document.querySelectorAll('[data-testid=cad-measure-layer] circle').length;
  return (ok ? 'OK' : 'FAIL') + ' chip=' + chipNum + ' expected=' + exp.toFixed(3) + ' نقاط=' + circles + ' | ' + val;
})()")
ck "$R"
$B screenshot $S/68-measure-two-points.png >/dev/null && echo "لقطة 68 ✓"

echo "══ 4) نقطة ثالثة: الإجمالي يكبر ══"
CX=$(python3 -c "print(round($L + $W*0.50))"); CY=$(python3 -c "print(round($T + $H*0.75))")
click_at $CX $CY; sleep 0.8
R=$(EV "(() => {
  const txt = document.querySelector('[data-testid=cad-measure-chip]')?.textContent || '';
  const m = txt.match(/الإجمالي\s*([0-9,.]+)/);
  const total = parseFloat(m ? m[1].replace(/,/g, '') : 'NaN');
  const circles = document.querySelectorAll('[data-testid=cad-measure-layer] circle').length;
  const lines = document.querySelectorAll('[data-testid=cad-measure-layer] line').length;
  return (total > 0 && circles >= 3 ? 'OK' : 'FAIL') + ' total=' + total + ' نقاط=' + circles + ' خطوط=' + lines;
})()")
ck "$R"

echo "══ 5) تكبير بالعجلة أثناء القياس: المسافة ثابتة ══"
$B mouse move $(python3 -c "print(round($L + $W/2))") $(python3 -c "print(round($T + $H/2))") >/dev/null 2>&1
BEF=$(EV "(() => { const t = (document.querySelector('[data-testid=cad-measure-val]')?.textContent || '').replace(/[^0-9.\-]/g,''); return (parseFloat(t) || 0) + ''; })()")
echo "قبل التكبير: $BEF"
$B mouse wheel -600 >/dev/null 2>&1
sleep 1.5
R=$(EV "(() => {
  const t = (document.querySelector('[data-testid=cad-measure-val]')?.textContent || '').replace(/[^0-9.\-]/g,'');
  const now = parseFloat(t) || 0;
  const bef = parseFloat('$BEF') || 0;
  const ok = bef > 0 && Math.abs(now - bef) < Math.max(0.05, bef * 0.02);
  return (ok ? 'OK' : 'FAIL') + ' قبل=' + bef + ' بعد=' + now;
})()")
ck "$R"
$B screenshot $S/69-measure-after-zoom.png >/dev/null && echo "لقطة 69 ✓"
probe

echo "══ 6) عامل التحويل 0.01 ══"
# نقطة رابعة حتمية (بدون تحريك الماوس بعدها) → اللوحة تعرض القطعة المكتملة C→D
DX=$(python3 -c "print(round($L + $W*0.40))"); DY=$(python3 -c "print(round($T + $H*0.30))")
click_at $DX $DY
sleep 0.8
R=$(EV "(() => {
  const input = document.querySelector('[data-testid=cad-measure-scale]');
  if (!input) return 'FAIL حقل المقياس مفقود';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, '0.01');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const val = (document.querySelector('[data-testid=cad-measure-val]')?.textContent || '').trim();
  return 'OK scale=' + input.value + ' val=' + val;
})()")
ck "$R"
R=$(EV "(() => {
  const v = window.__cadMgr && window.__cadMgr.curView;
  const box = document.querySelector('[data-testid=cad-canvas-box]').getBoundingClientRect();
  if (!v) return 'FAIL لا curView';
  const a = v.screenToWorld({x: box.width*0.50, y: box.height*0.75});
  const b = v.screenToWorld({x: box.width*0.40, y: box.height*0.30});
  const exp = Math.hypot(b.x - a.x, b.y - a.y) * 0.01;
  const chip = parseFloat((document.querySelector('[data-testid=cad-measure-val]')?.textContent || 'x').replace(/[^0-9.\\-]/g,''));
  const ok = Number.isFinite(chip) && Math.abs(chip - exp) < Math.max(0.01, exp * 0.06);
  return (ok ? 'OK' : 'FAIL') + ' chip=' + chip + ' expected=' + exp.toFixed(4);
})()")
ck "$R"
$B screenshot $S/73-measure-scale-001.png >/dev/null && echo "لقطة 73 ✓"
EV "(() => { const i = document.querySelector('[data-testid=cad-measure-scale]'); const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; s.call(i,'1'); i.dispatchEvent(new Event('input',{bubbles:true})); return 'x'; })()" >/dev/null

echo "══ 7) Escape يمسح ثم يخرج ══"
$B press Escape >/dev/null
sleep 0.4
R=$(EV "(() => {
  const layer = document.querySelector('[data-testid=cad-measure-layer]');
  const circles = layer ? layer.querySelectorAll('circle').length : -1;
  return (circles === 0 ? 'OK' : 'FAIL') + ' نقاط=' + circles;
})()")
ck "$R"
$B press Escape >/dev/null
sleep 0.4
N=$(EV "(() => document.querySelectorAll('[data-testid=cad-measure-chip]').length + '')()")
ck "$([ "$N" = "0" ] && echo "OK خرج من وضع القياس" || echo "FAIL اللوحة ما زالت n=$N")"

echo "══ 8) الإنجليزية ══"
$B find role button click --name "إغلاق العارض" >/dev/null 2>&1
sleep 0.6
switch_lang "English"
$B find role button click --name "CAD viewer" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView" --timeout 30000 >/dev/null 2>&1
sleep 2
$B find role button click --name "Measure" >/dev/null 2>&1
sleep 0.8
R=$(EV "(() => {
  const chip = document.querySelector('[data-testid=cad-measure-chip]')?.textContent || '';
  return (chip.includes('Click two points') ? 'OK' : 'FAIL') + ' chip=' + chip.slice(0, 90);
})()")
ck "$R"
click_at $AX $AY; sleep 0.5; click_at $BX $BY; sleep 1
R=$(EV "(() => {
  const val = (document.querySelector('[data-testid=cad-measure-val]')?.textContent || '').trim();
  const num = parseFloat(val.replace(/[^0-9.\-]/g, ''));
  return (Number.isFinite(num) && num > 0 ? 'OK' : 'FAIL') + ' val=' + val;
})()")
ck "$R"
$B screenshot $S/70-measure-english.png >/dev/null && echo "لقطة 70 ✓"
$B find role button click --name "Exit measuring" >/dev/null 2>&1
sleep 0.5
$B find role button click --name "Close viewer" >/dev/null 2>&1
sleep 0.6
switch_lang "العربية"
R=$(EV "(() => document.documentElement.dir === 'rtl' ? 'OK عادت العربية' : 'FAIL dir=' + document.documentElement.dir)()")
ck "$R"

echo "══ 9) الجوال 390 ══"
$B set viewport 390 844 >/dev/null
$B reload >/dev/null
$B wait --load networkidle >/dev/null
warmup
# شبكة أمان: لو العودة للعربية فشلت في الخطوة 8 نصلحها هنا
R=$(EV "(() => document.documentElement.dir === 'rtl' ? 'OK rtl' : 'FIX')()")
if [ "$R" != "OK rtl" ]; then
  switch_lang "العربية"
fi
R=$(EV "(async () => {
  const res = await fetch('/t.dxf');
  const file = new File([await res.blob()], 't.dxf', { type: 'application/dxf' });
  const input = document.querySelector('input[type=file]');
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return 'OK mobile injected';
})()")
ck "$R"
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView && document.querySelector('[data-testid=cad-canvas-box] canvas')" --timeout 60000 >/dev/null 2>&1
sleep 3
$B find role button click --name "قياس" >/dev/null 2>&1
sleep 0.8
probe
BOX=$(EV "$BOXQ")
L=$(echo $BOX | cut -d' ' -f1); T=$(echo $BOX | cut -d' ' -f2)
W=$(echo $BOX | cut -d' ' -f3); H=$(echo $BOX | cut -d' ' -f4)
MX1=$(python3 -c "print(round($L + $W*0.25))"); MY1=$(python3 -c "print(round($T + $H*0.35))")
MX2=$(python3 -c "print(round($L + $W*0.75))"); MY2=$(python3 -c "print(round($T + $H*0.55))")
click_at $MX1 $MY1; sleep 0.6; click_at $MX2 $MY2; sleep 1
R=$(EV "(() => {
  const chip = document.querySelector('[data-testid=cad-measure-chip]');
  if (!chip) return 'FAIL لا لوحة على الجوال';
  const r = chip.getBoundingClientRect();
  const inside = r.width <= window.innerWidth + 2 && r.left >= -2 && r.right <= window.innerWidth + 2;
  const val = (document.querySelector('[data-testid=cad-measure-val]')?.textContent || '').trim();
  const num = parseFloat(val.replace(/[^0-9.\-]/g, ''));
  return (inside && Number.isFinite(num) && num > 0 ? 'OK' : 'FAIL') + ' عرض=' + r.width.toFixed(0) + ' val=' + val;
})()")
ck "$R"
$B screenshot $S/71-measure-mobile.png >/dev/null && echo "لقطة 71 ✓"
$B find role button click --name "إنهاء القياس" >/dev/null 2>&1
sleep 0.5
N=$(EV "(() => document.querySelectorAll('[data-testid=cad-measure-chip]').length + '')()")
ck "$([ "$N" = "0" ] && echo "OK إنهاء القياس أغلق الوضع" || echo "FAIL ما زالت مفتوحة n=$N")"
$B screenshot $S/72-measure-mobile-exit.png >/dev/null && echo "لقطة 72 ✓"

echo "══ 10) انحدار: إغلاق العارض والموقع سليم ══"
$B find role button click --name "إغلاق العارض" >/dev/null 2>&1
sleep 0.6
N=$(EV "(() => document.querySelectorAll('[data-testid=cad-viewer-layer]').length + '')()")
ck "$([ "$N" = "0" ] && echo "OK العارض أُغلق" || echo "FAIL العارض مازال n=$N")"
E=$($B errors 2>&1 | tail -5)
echo "أخطاء الصفحة: $E"

echo ""
echo "════════ النتيجة: نجح=$pass فشل=$fail ════════"
