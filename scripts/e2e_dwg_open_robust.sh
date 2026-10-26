#!/bin/bash
# E2E — تحسينات فتح DWG: شمّ الإصدار/الحجم، تصنيف الأخطاء، إعادة المحاولة (لقطات 110+)
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
  EV "((F) => fetch('/dwgtest/' + F).then(r => r.blob()).then(b => { const input = document.querySelector('input[type=file]'); const dt = new DataTransfer(); dt.items.add(new File([b], F, { type: 'application/acad' })); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true })); return 'OK ' + F; }))('$1')"
}
OPEN_AND_WAIT="$B find role button click --name \"عارض أوتوكاد\" >/dev/null 2>&1; \$B wait --fn \"window.__cadMgr && window.__cadMgr.curView\" --timeout 60000 >/dev/null 2>&1; sleep 4"

cd /home/z/my-project
$B set viewport 1440 900 >/dev/null

$B eval "(async () => { const regs = await navigator.serviceWorker.getRegistrations(); for (const r of regs) await r.unregister(); const keys = await caches.keys(); for (const k of keys) await caches.delete(k); return 'sw-clean'; })()" >/dev/null 2>&1  # حارس SW: الكاش القديم يحجب البناء الجديد (درس Task 51)
echo "══ 1) الستة إصدارات كلها تُفتح بعد التغييرات ══"
for v in 2000 2004 2007 2010 2013 2018; do
  $B open http://localhost:3000 >/dev/null
  $B eval "localStorage.setItem('mahatta-locale','ar'); 'ok'" >/dev/null 2>&1  # بذر اللغة (درس Task 50)
  $B reload >/dev/null 2>&1
  $B wait --load networkidle >/dev/null
  warmup
  R=$(inject "example_$v.dwg")
  $B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
  $B wait --fn "window.__cadMgr && window.__cadMgr.curView" --timeout 60000 >/dev/null 2>&1
  sleep 4
  ST=$(EV "(() => {
    const err = document.querySelector('.bg-red-950');
    const canvas = !!document.querySelector('[data-testid=cad-canvas-box] canvas');
    const meta = document.querySelector('[data-testid=cad-file-meta]');
    return JSON.stringify({ canvas, err: err ? err.innerText.slice(0, 40) : null, meta: meta ? meta.textContent : null });
  })()")
  echo "  $v → $ST"
  if echo "$ST" | rg -q "canvas:true"; then pass=$((pass+1)); echo "PASS: example_$v.dwg فُتح"; else fail=$((fail+1)); echo "FAIL: example_$v.dwg"; fi
  EV "(() => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'إغلاق العارض'); if (b) b.click(); return 'x'; })()" >/dev/null
  sleep 0.5
done

echo "══ 2) ملف تالف: تصنيف صحيح + سطر بيانات الملف ══"
$B open http://localhost:3000 >/dev/null
$B eval "localStorage.setItem('mahatta-locale','ar'); 'ok'" >/dev/null 2>&1  # الكوكي ميت — الكشف يقرأ localStorage فقط (درس Task 50)
$B reload >/dev/null 2>&1
$B wait --load networkidle >/dev/null
warmup
R=$(inject "truncated_2000.dwg")
ck "$R"
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView" --timeout 60000 >/dev/null 2>&1
sleep 8
R=$(EV "(() => {
  const err = document.querySelector('.bg-red-950');
  if (!err) return 'FAIL لا حوار خطأ';
  const meta = document.querySelector('[data-testid=cad-file-meta]');
  const txt = err.innerText || '';
  const hasTitle = txt.includes('ما قدرناش نفتح الملف');
  const hasMeta = !!meta && /DWG 2013/.test(meta.textContent || '');
  return (hasTitle && hasMeta ? 'OK حوار خطأ + بيانات=' + (meta?.textContent || '') : 'FAIL title=' + hasTitle + ' meta=' + hasMeta);
})()")
ck "$R"
$B screenshot $S/110-corrupt-dwg-error.png >/dev/null && echo "لقطة 110 ✓"
EV "(() => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'إغلاق العارض'); if (b) b.click(); return 'x'; })()" >/dev/null
sleep 0.5

echo "══ 3) انحدار: t_ground.dwg الحقيقي يُفتح ══"
$B open http://localhost:3000 >/dev/null
$B eval "localStorage.setItem('mahatta-locale','ar'); 'ok'" >/dev/null 2>&1  # الكوكي ميت — الكشف يقرأ localStorage فقط (درس Task 50)
$B reload >/dev/null 2>&1
$B wait --load networkidle >/dev/null
warmup
R=$(EV "(async () => {
  const res = await fetch('/t_ground.dwg');
  const input = document.querySelector('input[type=file]');
  const dt = new DataTransfer();
  dt.items.add(new File([await res.blob()], 't_ground.dwg', { type: 'application/acad' }));
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return 'OK';
})()")
ck "$R"
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView" --timeout 60000 >/dev/null 2>&1
sleep 5
R=$(EV "(() => {
  const canvas = !!document.querySelector('[data-testid=cad-canvas-box] canvas');
  const err = !!document.querySelector('.bg-red-950');
  return (canvas && !err ? 'OK t_ground يُفتح' : 'FAIL canvas=' + canvas + ' err=' + err);
})()")
ck "$R"
$B screenshot $S/111-t-ground-opens.png >/dev/null && echo "لقطة 111 ✓"
EV "(() => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'إغلاق العارض'); if (b) b.click(); return 'x'; })()" >/dev/null

echo ""
echo "أخطاء الصفحة: $($B errors 2>&1 | tail -2 | tr '\n' ' | ')"
echo "════════ النتيجة: نجح=$pass فشل=$fail ════════"
