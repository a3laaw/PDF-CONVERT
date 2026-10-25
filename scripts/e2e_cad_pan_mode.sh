#!/bin/bash
# E2E — وضع «يد التحريك» (علامة الايد):
#  (1) الزر موجود ومفعّل افتراضيًا بعد الفتح (aria-pressed=true)
#  (2) view.mode === PAN فعليًا على مستوى المكتبة
#  (3) سحب بالزر الشمال يحرّك الورقة — إحداثيات العالم لنقطة شاشة ثابتة تتغير
#  (4) الزر الأوسط يظل تحريكًا في وضع اليد (المكتبة تسقطه — نحن أعدناه)
#  (5) المؤشر يتغير (cursor SVG مختلف بين الوضعين)
#  (6) التبديل لإيقاف اليد: mode === SELECTION والسحب لا يحرّك الورقة (مربع تحديد)
#  (7) التلميح السفلي يظهر نص «اسحب الورقة»
#  (8) انحدار القياس — يعمل فوق وضع اليد دون تعارض
#  (9) انحدار تحديد المنطقة + تصدير PDF
# (10) الكونسول نظيف عبر الجلسة (لا zoomTo/pointToBox/Illegal Parameters)
# لقطات 123+
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
  EV "((F, T) => fetch('/dwgtest/' + F).then(r => r.blob()).then(b => { const input = document.querySelector('input[type=file]'); const dt = new DataTransfer(); dt.items.add(new File([b], F, { type: T })); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true })); return 'OK ' + F; }))('$1', '$2')"
}
GET_BOX() {
  EV "(() => { const b = document.querySelector('[data-testid=cad-canvas-box]'); if (!b) return '0 0 0 0'; const r = b.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round).join(' '); })()"
}
click_at() { $B mouse move $1 $2 >/dev/null 2>&1; $B mouse down left >/dev/null 2>&1; $B mouse up left >/dev/null 2>&1; }
drag_box() { $B mouse move $1 $2 >/dev/null 2>&1; $B mouse down left >/dev/null 2>&1; $B mouse move $3 $4 >/dev/null 2>&1; $B mouse move $5 $6 >/dev/null 2>&1; $B mouse up left >/dev/null 2>&1; }
CLOSE_VIEWER="(() => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'إغلاق العارض'); if (b) b.click(); return 'x'; })()"
console_errors() {
  $B console 2>/dev/null | awk '
    /^\[(debug|info|log|verbose)\]/ {bad=0; next}
    /^\[(error|warning|warn|critical)\]/ {bad=1}
    bad && /Illegal Parameters|zoomTo|pointToBox/ {print}
  ' | head -5
}

cd /home/z/my-project
mkdir -p $S
$B set viewport 1440 900 >/dev/null

echo "══ 0) لغة عربية ثابتة ══"
$B open http://localhost:3000 >/dev/null
$B wait --load networkidle >/dev/null
$B eval "localStorage.setItem('mahatta-locale','ar'); 'ok'" >/dev/null 2>&1
$B reload >/dev/null 2>&1
$B wait --load networkidle >/dev/null
warmup
R=$(EV "(() => document.documentElement.lang === 'ar' ? 'OK عربية' : 'FAIL لغة=' + document.documentElement.lang)()")
ck "$R"

echo "══ 1) فتح example_2000.dwg في العارض ══"
$B console --clear >/dev/null 2>&1
R=$(inject "example_2000.dwg" "application/acad")
ck "$R"
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView && document.querySelector('[data-testid=cad-canvas-box] canvas')" --timeout 90000 >/dev/null 2>&1
sleep 5
R=$(EV "(() => !!document.querySelector('[data-testid=cad-canvas-box] canvas') ? 'OK العارض فتح' : 'FAIL لا كانفس')()")
ck "$R"

echo "══ 2) زر يد التحريك موجود ومفعّل افتراضيًا ══"
R=$(EV "(() => {
  const b = document.querySelector('[data-testid=cad-pan-btn]');
  if (!b) return 'FAIL الزر غير موجود';
  return (b.getAttribute('aria-pressed') === 'true' ? 'OK مفعّل افتراضيًا aria-pressed=true' : 'FAIL aria-pressed=' + b.getAttribute('aria-pressed'));
})()")
ck "$R"

echo "══ 3) view.mode === PAN فعليًا في المكتبة ══"
R=$(EV "(() => {
  const m = window.__cadMgr.curView.mode;
  return (m === 1 ? 'OK mode=PAN(' + m + ')' : 'FAIL mode=' + m);
})()")
ck "$R"

echo "══ 4) التلميح السفلي: نص «اسحب الورقة» ظاهر ══"
R=$(EV "(() => {
  const ps = [...document.querySelectorAll('[data-testid=cad-viewer-layer] p')];
  const hit = ps.find(p => p.textContent.includes('اسحب الورقة'));
  return (hit ? 'OK التلميح ظاهر' : 'FAIL ' + ps.map(p => p.textContent.slice(0, 25)).join('|').slice(0, 90));
})()")
ck "$R"

echo "══ 5) السحب بالزر الشمال يحرّك الورقة فعليًا ══"
R=$(EV "(() => {
  const v = window.__cadMgr.curView;
  const p = v.screenToWorld({ x: 720, y: 450 });
  window.__wBefore = { x: p.x, y: p.y };
  return 'OK قبل=' + p.x.toFixed(0) + ',' + p.y.toFixed(0);
})()")
echo "  $R"
BOX=$(GET_BOX)
L=$(echo $BOX | cut -d' ' -f1); T=$(echo $BOX | cut -d' ' -f2)
W=$(echo $BOX | cut -d' ' -f3); H=$(echo $BOX | cut -d' ' -f4)
AX=$(python3 -c "print(round($L + $W*0.30))"); AY=$(python3 -c "print(round($T + $H*0.50))")
BX=$(python3 -c "print(round($L + $W*0.62))"); BY=$(python3 -c "print(round($T + $H*0.34))")
drag_box $AX $AY $(( (AX+BX)/2 )) $(( (AY+BY)/2 )) $BX $BY
sleep 1.2
R=$(EV "(() => {
  const v = window.__cadMgr.curView;
  const p = v.screenToWorld({ x: 720, y: 450 });
  const d = Math.hypot(p.x - window.__wBefore.x, p.y - window.__wBefore.y);
  window.__panDist = d;
  return (d > 1 ? 'OK إزاحة=' + d.toFixed(0) + ' وحدة عالم — الورقة تحرّكت' : 'FAIL إزاحة=' + d);
})()")
ck "$R"
$B screenshot $S/123-pan-drag-moved.png >/dev/null && echo "لقطة 123 ✓"

echo "══ 6) الزر الأوسط يظل تحريكًا في وضع اليد (أعدناه بعد سقوط المكتبة له) ══"
R=$(EV "(() => {
  const v = window.__cadMgr.curView;
  const p = v.screenToWorld({ x: 720, y: 450 });
  window.__wMidBefore = { x: p.x, y: p.y };
  return 'OK';
})()" ) >/dev/null
CX=$(python3 -c "print(round($L + $W*0.5))"); CY=$(python3 -c "print(round($T + $H*0.5))")
DX=$(python3 -c "print(round($L + $W*0.5 - 140))"); DY=$(python3 -c "print(round($T + $H*0.5 + 90))")
$B mouse move $CX $CY >/dev/null 2>&1
$B mouse down middle >/dev/null 2>&1
$B mouse move $DX $DY >/dev/null 2>&1
$B mouse move $((DX-60)) $((DY+40)) >/dev/null 2>&1
$B mouse up middle >/dev/null 2>&1
sleep 1.2
R=$(EV "(() => {
  const v = window.__cadMgr.curView;
  const p = v.screenToWorld({ x: 720, y: 450 });
  const d = Math.hypot(p.x - window.__wMidBefore.x, p.y - window.__wMidBefore.y);
  return (d > 1 ? 'OK إزاحة الزر الأوسط=' + d.toFixed(0) + ' وحدة' : 'FAIL إزاحة=' + d);
})()")
ck "$R"

echo "══ 7) المؤشر تغيّر بين الوضعين (علامة الايد مقابل الصليب) ══"
R=$(EV "(() => {
  const c = document.querySelector('[data-testid=cad-canvas-box] canvas');
  window.__curPan = c ? c.style.cursor : '';
  return (window.__curPan && window.__curPan !== 'auto' ? 'OK مؤشر وضع اليد len=' + window.__curPan.length : 'FAIL مؤشر=' + window.__curPan);
})()")
ck "$R"

click_pan_btn() {
  EV "(() => { const b = document.querySelector('[data-testid=cad-pan-btn]'); if (!b) return 'FAIL لا زر'; b.click(); return 'OK clicked'; })()" >/dev/null
}
echo "══ 8) إيقاف اليد: mode === SELECTION والسحب لا يحرّك الورقة ══"
click_pan_btn
sleep 0.8
R=$(EV "(() => {
  const b = document.querySelector('[data-testid=cad-pan-btn]');
  const m = window.__cadMgr.curView.mode;
  return (b.getAttribute('aria-pressed') === 'false' && m === 0 ? 'OK mode=SELECTION والزر مطفأ' : 'FAIL pressed=' + b.getAttribute('aria-pressed') + ' mode=' + m);
})()")
ck "$R"
R=$(EV "(() => {
  const v = window.__cadMgr.curView;
  const p = v.screenToWorld({ x: 720, y: 450 });
  window.__wSelBefore = { x: p.x, y: p.y };
  return 'OK';
})()") >/dev/null
drag_box $AX $AY $(( (AX+BX)/2 )) $(( (AY+BY)/2 )) $BX $BY
sleep 1
R=$(EV "(() => {
  const v = window.__cadMgr.curView;
  const p = v.screenToWorld({ x: 720, y: 450 });
  const d = Math.hypot(p.x - window.__wSelBefore.x, p.y - window.__wSelBefore.y);
  return (d < 1 ? 'OK الورقة ثابتة في وضع التحديد إزاحة=' + d.toFixed(3) : 'FAIL السحب حرّك الورقة إزاحة=' + d);
})()")
ck "$R"
R=$(EV "(() => {
  const c = document.querySelector('[data-testid=cad-canvas-box] canvas');
  const cur = c ? c.style.cursor : '';
  return (cur && cur !== window.__curPan ? 'OK المؤشر اختلف بعد الإيقاف' : 'FAIL المؤشر لم يتغير cur=' + cur.slice(0, 40));
})()")
ck "$R"
$B screenshot $S/124-pan-off-selection.png >/dev/null && echo "لقطة 124 ✓"

echo "══ 9) إعادة تفعيل اليد: تعود لحالة PAN ══"
click_pan_btn
sleep 0.8
R=$(EV "(() => {
  const b = document.querySelector('[data-testid=cad-pan-btn]');
  const m = window.__cadMgr.curView.mode;
  return (b.getAttribute('aria-pressed') === 'true' && m === 1 ? 'OK عاد PAN بعد إعادة التفعيل' : 'FAIL pressed=' + b.getAttribute('aria-pressed') + ' mode=' + m);
})()")
ck "$R"

echo "══ 10) انحدار القياس فوق وضع اليد ══"
$B find role button click --name "قياس" >/dev/null 2>&1
sleep 0.8
BOX=$(GET_BOX)
L=$(echo $BOX | cut -d' ' -f1); T=$(echo $BOX | cut -d' ' -f2)
W=$(echo $BOX | cut -d' ' -f3); H=$(echo $BOX | cut -d' ' -f4)
click_at $(python3 -c "print(round($L + $W*0.30))") $(python3 -c "print(round($T + $H*0.60))")
sleep 0.5
click_at $(python3 -c "print(round($L + $W*0.62))") $(python3 -c "print(round($T + $H*0.40))")
sleep 1.2
R=$(EV "(() => {
  const val = document.querySelector('[data-testid=cad-measure-val]')?.textContent || '';
  const segs = document.querySelectorAll('[data-testid=cad-measure-layer] line').length;
  return (/[0-9]/.test(val) && segs >= 1 ? 'OK القياس=' + val.trim().slice(0, 30) + ' خطوط=' + segs : 'FAIL val=' + val + ' segs=' + segs);
})()")
ck "$R"
$B screenshot $S/125-measure-over-pan.png >/dev/null && echo "لقطة 125 ✓"

echo "══ 11) انحدار تحديد المنطقة + تصدير PDF ══"
$B find role button click --name "قياس" >/dev/null 2>&1
sleep 0.5
$B find role button click --name "تحديد منطقة" >/dev/null 2>&1
sleep 0.8
BOX=$(GET_BOX)
L=$(echo $BOX | cut -d' ' -f1); T=$(echo $BOX | cut -d' ' -f2)
W=$(echo $BOX | cut -d' ' -f3); H=$(echo $BOX | cut -d' ' -f4)
AX=$(python3 -c "print(round($L + $W*0.25))"); AY=$(python3 -c "print(round($T + $H*0.30))")
BX=$(python3 -c "print(round($L + $W*0.65))"); BY=$(python3 -c "print(round($T + $H*0.62))")
drag_box $AX $AY $(( (AX+BX)/2 )) $(( (AY+BY)/2 )) $BX $BY
sleep 0.6
R=$(EV "(() => {
  const rect = document.querySelector('[data-testid=cad-select-rect] rect');
  const dims = (document.querySelector('[data-testid=cad-select-dims]')?.textContent || '').trim();
  const okRect = !!rect && parseFloat(rect.getAttribute('width')) > 40;
  return (okRect && /[0-9]/.test(dims) ? 'OK تحديد=' + Math.round(parseFloat(rect.getAttribute('width'))) + 'px أبعاد=' + dims.slice(0, 40) : 'FAIL rect=' + !!rect + ' dims=' + dims);
})()")
ck "$R"
EV "(() => {
  window.__lastDl = null;
  if (!window.__patchedDl) {
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      try { const h = this.href || ''; if (h.startsWith('blob:')) window.__lastDl = { name: this.download || '', href: h }; } catch (e) {}
      return orig.apply(this, arguments);
    };
    window.__patchedDl = true;
  }
  return 'OK patched';
})()" >/dev/null
EV "(() => { const b = document.querySelector('[data-testid=cad-select-pdf]'); if (!b) return 'FAIL'; b.click(); return 'OK exporting'; })()" >/dev/null
R=$(EV "(async () => {
  for (let i = 0; i < 60; i++) { if (window.__lastDl) break; await new Promise(r2 => setTimeout(r2, 500)); }
  const d = window.__lastDl;
  if (!d) return 'FAIL لا تنزيل';
  const r = await fetch(d.href);
  const blob = await r.blob();
  const head = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  const magic = String.fromCharCode(...head);
  return (magic === '%PDF-' ? 'OK تصدير PDF سليم حجم=' + blob.size + ' بايت' : 'FAIL magic=' + magic);
})()")
ck "$R"
$B screenshot $S/126-export-over-pan.png >/dev/null && echo "لقطة 126 ✓"

echo "══ 12) الكونسول نظيف عبر الجلسة كلها ══"
BAD=$(console_errors)
if [ -z "$BAD" ]; then ck "OK لا zoomTo/pointToBox/Illegal Parameters في الكونسول"; else fail=$((fail+1)); echo "FAIL: $BAD"; fi

EV "$CLOSE_VIEWER" >/dev/null
sleep 0.5

echo ""
echo "════════════════════════════════"
echo "النتيجة: $pass نجح · $fail فشل"
[ $fail -eq 0 ]
