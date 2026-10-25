#!/bin/bash
# اختبار فتح إصدارات DWG المختلفة عبر خط المستخدم الحقيقي في المتصفح
B="agent-browser"
cd /home/z/my-project
$B set viewport 1280 800 >/dev/null
for v in 2000 2004 2007 2010 2013 2018; do
  F="example_$v.dwg"
  $B open http://localhost:3000 >/dev/null
  $B wait --load networkidle >/dev/null
  sleep 0.5
  R=$($B eval "(async () => {
    const res = await fetch('/dwgtest/$F');
    if (!res.ok) return 'FETCH-' + res.status;
    const file = new File([await res.blob()], '$F', { type: 'application/acad' });
    const input = document.querySelector('input[type=file]');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return 'OK';
  })()" 2>/dev/null | tail -1 | tr -d '"')
  $B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
  $B wait --fn "window.__cadMgr && window.__cadMgr.curView" --timeout 40000 >/dev/null 2>&1
  sleep 4
  ST=$($B eval "(() => {
    const err = document.querySelector('.bg-red-950');
    const canvas = !!document.querySelector('[data-testid=cad-canvas-box] canvas');
    const txt = err ? err.innerText.replace(/\n/g, ' ').slice(0, 70) : '';
    return JSON.stringify({ canvas, err: txt });
  })()" 2>/dev/null | tail -1 | tr -d '"')
  echo "$F [$v] inject=$R → $ST"
  $B eval "(() => { const b = document.querySelector('[data-testid=cad-close]') || [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'إغلاق العارض'); if (b) b.click(); return 'x'; })()" >/dev/null 2>&1
  sleep 0.5
done
