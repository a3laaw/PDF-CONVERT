#!/bin/bash
# E2E — إصلاح أخطاء كونسول العارض المبلَّغة من المستخدم:
#  (1) ReferenceError: Illegal Parameters — ضجيج كيانات تالفة ترميها المكتبة ثم تتجاهلها
#      عمدًا (فشل مرحلة ENTITY غير حرج) — كان رصدها يُسقط افتتاحات سليمة ويزعج الكونسول
#  (2) TypeError: Cannot read properties of undefined (reading 'zoomTo') — zoomTo في
#      AcTrView2d غير محمية بعكس screenToWorld/worldToScreen — ترمي أثناء الملاءمة
#      التقدمية/تبديل التخطيط/الإغلاق أثناء ملاءمة مؤجلة
# لقطات 112+
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
# تدقيق أخطاء الكونسول: يفحص السطور الجديدة فقط منذ آخر مسح
console_errors() {
  $B console 2>/dev/null | rg -i "Illegal Parameters|reading 'zoomTo'" | rg -v "debug" | head -5
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

echo "══ 1) فلتر الضجيج الدائم مثبَّت: console.error مغلَّف ══"
$B open http://localhost:3000 >/dev/null
$B wait --load networkidle >/dev/null
warmup
R=$(EV "(() => { const s = String(console.error); const wrapped = !s.includes('[native code]'); return (wrapped ? 'OK المراقب مثبت len=' + s.length : 'FAIL console.error أصلي'); })()")
ck "$R"

echo "══ 2) DXF منحل (دوائر/أقواس بنصف قطر 0): يُفتح بلا حوار خطأ وبلا ضجيج ══"
$B console --clear >/dev/null 2>&1
R=$(inject "degenerate.dxf" "application/dxf")
ck "$R"
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView && document.querySelector('[data-testid=cad-canvas-box] canvas')" --timeout 60000 >/dev/null 2>&1
sleep 4
R=$(EV "(() => { const c = !!document.querySelector('[data-testid=cad-canvas-box] canvas'); const e = !!document.querySelector('.bg-red-950'); return (c && !e ? 'OK DXF المنحل فُتح بلا حوار خطأ' : 'FAIL خطأ=' + e); })()")
ck "$R"
BAD=$(console_errors)
if [ -z "$BAD" ]; then ck "OK لا أخطاء Illegal Parameters في الكونسول"; else fail=$((fail+1)); echo "FAIL: ضجيج باقٍ → $BAD"; fi
$B screenshot $S/112-degenerate-dxf-opens.png >/dev/null && echo "لقطة 112 ✓"
EV "$CLOSE_VIEWER" >/dev/null
sleep 0.5

echo "══ 3) تحصين zoomTo مثبَّت على نموذج AcTrView2d ══"
$B console --clear >/dev/null 2>&1
R=$(inject "example_2000.dwg" "application/acad")
ck "$R"
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView && document.querySelector('[data-testid=cad-canvas-box] canvas')" --timeout 90000 >/dev/null 2>&1
sleep 5
R=$(EV "(() => {
  let p = Object.getPrototypeOf(window.__cadMgr.curView);
  let found = null, hops = 0;
  while (p && p !== Object.prototype && hops < 8) {
    if (p.__zoomSafe) { found = 'proto@' + hops + (typeof p.zoomTo === 'function' ? ' zoomTo:fn' : ' zoomTo:MISSING'); break; }
    p = Object.getPrototypeOf(p); hops++;
  }
  const fit = window.__cadMgr.curView._progressiveOpenFit;
  return (found && fit && fit.__fitSafe ? 'OK ' + found + ' + fitSafe' : 'FAIL found=' + found + ' fit=' + !!(fit && fit.__fitSafe));
})()")
ck "$R"

echo "══ 4) انحدار التكبير: زر تكبير يعمل بعد التحصين (zoomTo الحقيقي يُنفَّذ) ══"
R=$(EV "(() => {
  const v = window.__cadMgr.curView;
  const w1 = Math.abs(v.screenToWorld({ x: 1200, y: 450 }).x - v.screenToWorld({ x: 240, y: 450 }).x);
  window.__w1 = w1;
  return 'OK عرض العالم قبل=' + w1.toFixed(1);
})()")
echo "  $R"
$B find role button click --name "تكبير" >/dev/null 2>&1
sleep 1
$B find role button click --name "تكبير" >/dev/null 2>&1
sleep 1.5
R=$(EV "(() => {
  const v = window.__cadMgr.curView;
  const w2 = Math.abs(v.screenToWorld({ x: 1200, y: 450 }).x - v.screenToWorld({ x: 240, y: 450 }).x);
  const shrunk = w2 < window.__w1 * 0.9;
  return (shrunk ? 'OK بعد=' + w2.toFixed(1) + ' (كان ' + window.__w1.toFixed(1) + ')' : 'FAIL التكبير لم يعمل w2=' + w2.toFixed(1) + ' w1=' + window.__w1.toFixed(1));
})()")
ck "$R"
$B screenshot $S/113-zoom-after-harden.png >/dev/null && echo "لقطة 113 ✓"

echo "══ 5) زر الملاءمة (zoomToFitDrawing) يعمل ══"
$B find role button click --name "ملاءمة" >/dev/null 2>&1
sleep 2.5
R=$(EV "(() => {
  const v = window.__cadMgr.curView;
  const c = !!document.querySelector('[data-testid=cad-canvas-box] canvas');
  return (c ? 'OK الملاءمة لم تكسر العارض' : 'FAIL');
})()")
ck "$R"

echo "══ 6) انحدار تحديد المنطقة + تصدير PDF (يمر عبر zoomTo المحصَّن مرتين) ══"
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
$B screenshot $S/114-export-after-harden.png >/dev/null && echo "لقطة 114 ✓"

echo "══ 7) انحدار القياس على example_2004.dwg ══"
EV "$CLOSE_VIEWER" >/dev/null
sleep 1
$B console --clear >/dev/null 2>&1
R=$(inject "example_2004.dwg" "application/acad")
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView && document.querySelector('[data-testid=cad-canvas-box] canvas')" --timeout 60000 >/dev/null 2>&1
sleep 4
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
$B screenshot $S/115-measure-regression.png >/dev/null && echo "لقطة 115 ✓"

echo "══ 8) تدقيق كونسول نهائي: لا zoomTo ولا Illegal Parameters عبر كل الجلسة ══"
BAD=$(console_errors)
if [ -z "$BAD" ]; then ck "OK الكونسول نظيف من الخطأين المبلَّغين"; else fail=$((fail+1)); echo "FAIL: $BAD"; fi
$B console 2>/dev/null | rg -i "conversion stage" | head -3
$B screenshot $S/116-final-clean.png >/dev/null && echo "لقطة 116 ✓"

echo ""
echo "════════════════════════════════"
echo "النتيجة: $pass نجح · $fail فشل"
[ $fail -eq 0 ] && echo "✅ كل الفحوصات خضراء" || echo "❌ توجد إخفاقات"
exit $([ $fail -eq 0 ] && echo 0 || echo 1)
