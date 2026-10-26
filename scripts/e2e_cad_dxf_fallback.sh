#!/bin/bash
# E2E — المسار الإسعافي DWG→DXF + زر تقرير الخطأ (لقطات 118+)
# 1) محرك dwg_write_dxf يعمل على الخيط الرئيسي في السياق الحقيقي (خطاف التطوير)
# 2) الـDXF الناتج يُفتح فعليًا عبر الواجهة (سلسلة كاملة = ما يفعله المسار الإسعافي حرفيًا)
# 3) حوار الخطأ فيه زر «انسخ تقرير الخطأ» ويعمل (حالة النسخ)
# 4) انحدار: DXF منحل يُفتح — الفتح الطبيعي سليم
B="agent-browser"
S=/home/z/my-project/screenshots
pass=0; fail=0
ck() { if echo "$1" | rg -q "^OK"; then echo "PASS: $1"; pass=$((pass+1)); else echo "FAIL: $1"; fail=$((fail+1)); fi; }
EV() {
  local raw out
  raw=$($B eval "$1" 2>&1)
  out=$(echo "$raw" | tail -1 | tr -d '"\\')
  if echo "$raw" | rg -qi "EV_ERR"; then :; fi
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
AR() {
  $B eval "localStorage.setItem('mahatta-locale','ar'); 'ok'" >/dev/null 2>&1
  $B reload >/dev/null 2>&1
  $B wait --load networkidle >/dev/null 2>&1
  warmup
}
inject() {
  EV "((F) => fetch('/dwgtest/' + F).then(r => r.blob()).then(b => { const input = document.querySelector('input[type=file]'); const dt = new DataTransfer(); dt.items.add(new File([b], F, { type: 'application/acad' })); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true })); return 'OK ' + F; }))('$1')"
}
injectBlob() {
  EV "((blob, name) => { const input = document.querySelector('input[type=file]'); const dt = new DataTransfer(); dt.items.add(new File([blob], name, { type: 'application/acad' })); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true })); return 'OK ' + name; })(window.__fbBlob, window.__fbName)"
}
OPEN_VIEWER="$B find role button click --name \"عارض أوتوكاد\" >/dev/null 2>&1; \$B wait --fn \"window.__cadMgr && window.__cadMgr.curView\" --timeout 60000 >/dev/null 2>&1; sleep 4"
CLOSE_VIEWER="EV \"(() => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'إغلاق العارض'); if (b) b.click(); return 'x'; })()\""

cd /home/z/my-project
$B set viewport 1440 900 >/dev/null

$B eval "(async () => { const regs = await navigator.serviceWorker.getRegistrations(); for (const r of regs) await r.unregister(); const keys = await caches.keys(); for (const k of keys) await caches.delete(k); return 'sw-clean'; })()" >/dev/null 2>&1  # حارس SW: الكاش القديم يحجب البناء الجديد (درس Task 51)
echo "══ 1) تحميل وحدة العارض (خطاف المحرك الإسعافي يظهر) ══"
$B open http://localhost:3000 >/dev/null
$B wait --load networkidle >/dev/null
AR
inject "degenerate.dxf" >/dev/null
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView" --timeout 60000 >/dev/null 2>&1
sleep 3
R=$(EV "(() => { return typeof window.__cadDwgToDxf === 'function' ? 'OK hook-exists' : 'FAIL no-hook'; })()")
ck "$R"
$B screenshot $S/118-hook-ready.png >/dev/null && echo "لقطة 118 ✓"
EV "(() => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'إغلاق العارض'); if (b) b.click(); return 'x'; })()" >/dev/null
sleep 1

echo "══ 2) المحرك الإسعافي: example_2018.dwg → DXF حقيقي على الخيط الرئيسي ══"
R=$(EV "(async () => {
  try {
    const res = await fetch('/dwgtest/example_2018.dwg');
    const buf = await res.arrayBuffer();
    const out = await window.__cadDwgToDxf(buf);
    if (!out || out.byteLength < 1000) return 'FAIL len=' + (out ? out.byteLength : 'null');
    const head = new TextDecoder().decode(out.slice(0, 64));
    if (!/section/i.test(head)) return 'FAIL head=' + JSON.stringify(head.slice(0, 30));
    window.__fbBlob = new Blob([out], { type: 'application/dxf' });
    window.__fbName = 'from_fallback_2018.dxf';
    return 'OK len=' + out.byteLength;
  } catch (e) { return 'FAIL ' + (e && e.message ? e.message : String(e)); }
})()")
echo "  $R"
ck "$R"

echo "══ 3) سلسلة كاملة: الـDXF الناتج يُفتح عبر الواجهة الفعلية ══"
$B open http://localhost:3000 >/dev/null
$B wait --load networkidle >/dev/null
AR
R=$(EV "(async () => {
  try {
    const res = await fetch('/dwgtest/example_2013.dwg');
    const buf = await res.arrayBuffer();
    const out = await window.__cadDwgToDxf(buf);
    if (!out || !/section/i.test(new TextDecoder().decode(out.slice(0, 64)))) return 'FAIL convert';
    window.__fbBlob = new Blob([out], { type: 'application/dxf' });
    window.__fbName = 'from_fallback_2013.dxf';
    return 'OK blob=' + out.byteLength;
  } catch (e) { return 'FAIL ' + (e && e.message ? e.message : String(e)); }
})()")
echo "  $R"
ck "$R"
R=$(injectBlob)
ck "$R"
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView" --timeout 60000 >/dev/null 2>&1
sleep 5
R=$(EV "(() => {
  const canvas = !!document.querySelector('[data-testid=cad-canvas-box] canvas');
  const err = document.querySelector('.bg-red-950');
  return (canvas && !err ? 'OK الناتج يُفتح كامل السلسلة' : 'FAIL canvas=' + canvas + ' err=' + (err ? (err.innerText || '').slice(0, 60) : 'none'));
})()")
echo "  $R"
ck "$R"
$B screenshot $S/119-fallback-dxf-opens.png >/dev/null && echo "لقطة 119 ✓"
EV "(() => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'إغلاق العارض'); if (b) b.click(); return 'x'; })()" >/dev/null
sleep 1

echo "══ 4) حوار الخطأ: زر تقرير التشخيص موجود ويعمل ══"
$B open http://localhost:3000 >/dev/null
$B wait --load networkidle >/dev/null
AR
inject "garbage_random.dxf" >/dev/null
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
sleep 8
R=$(EV "(() => {
  const err = document.querySelector('.bg-red-950');
  if (!err) return 'FAIL لا حوار خطأ';
  const btn = document.querySelector('[data-testid=cad-copy-report]');
  if (!btn) return 'FAIL لا زر التقرير';
  return 'OK زر التقرير ظاهر: ' + (btn.textContent || '').slice(0, 30);
})()")
echo "  $R"
ck "$R"
$B screenshot $S/120-error-dialog-report-btn.png >/dev/null && echo "لقطة 120 ✓"
R=$(EV "(async () => {
  const btn = document.querySelector('[data-testid=cad-copy-report]');
  if (!btn) return 'FAIL لا زر';
  btn.click();
  await new Promise(r => setTimeout(r, 700));
  const rep = window.__cadLastReport || '';
  const hasFields = rep.includes('failKind') && rep.includes('file') && rep.includes('engines') && rep.includes('dxfFallback');
  const after = document.querySelector('[data-testid=cad-copy-report]');
  const label = after ? (after.textContent || '') : '';
  return hasFields ? 'OK تقرير مكتمل (' + rep.length + ' حرفًا) label=' + label.slice(0, 20) : 'FAIL report=' + rep.slice(0, 60);
})()")
echo "  $R"
ck "$R"
$B screenshot $S/121-report-copied-state.png >/dev/null && echo "لقطة 121 ✓"
EV "(() => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'إغلاق العارض'); if (b) b.click(); return 'x'; })()" >/dev/null
sleep 1

echo "══ 5) انحدار: الفتح الطبيعي لإصدار 2000 سليم بعد كل التغييرات ══"
$B open http://localhost:3000 >/dev/null
$B wait --load networkidle >/dev/null
AR
inject "example_2000.dwg" >/dev/null
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView" --timeout 60000 >/dev/null 2>&1
sleep 4
R=$(EV "(() => {
  const canvas = !!document.querySelector('[data-testid=cad-canvas-box] canvas');
  const err = !!document.querySelector('.bg-red-950');
  return (canvas && !err ? 'OK 2000 يُفتح' : 'FAIL canvas=' + canvas + ' err=' + err);
})()")
echo "  $R"
ck "$R"
$B screenshot $S/122-regression-2000.png >/dev/null && echo "لقطة 122 ✓"

echo ""
echo "أخطاء الصفحة: $($B errors 2>&1 | tail -2 | tr '\n' ' | ')"
echo "════════ النتيجة: نجح=$pass فشل=$fail ════════"
[ "$fail" = "0" ] && echo "ALL GREEN ✓"
