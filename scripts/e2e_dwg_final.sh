#!/bin/bash
# E2E نهائي: فتح ملفات DWG التي كانت تنهار — بعد إصلاح wasm + فحص الجهوزية المتين
B="agent-browser"
cd /home/z/my-project
S=/home/z/my-project/screenshots
pass=0; fail=0
ck() { if echo "$1" | rg -q "^OK|^PASS"; then echo "PASS: $1"; pass=$((pass+1)); else echo "FAIL: $1"; fail=$((fail+1)); fi; }
EV() {
  local raw out
  raw=$($B eval "$1" 2>&1)
  out=$(echo "$raw" | tail -1 | tr -d '"\\')
  if [ "$out" = "{}" ] || [ -z "$out" ] || [ "$out" = "}" ]; then
    sleep 1.5
    out=$($B eval "$1" 2>&1 | tail -1 | tr -d '"\\')
  fi
  echo "$out"
}

echo "══ 0) تنظيف عامل الخدمة والذاكرات القديمة ══"
$B set viewport 1440 900 >/dev/null
$B open http://localhost:3000 >/dev/null
$B wait --load networkidle >/dev/null
EV "(async () => {
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const r of regs) await r.unregister();
  const keys = await caches.keys();
  for (const k of keys) await caches.delete(k);
  return 'cleaned ' + keys.length;
})()"
$B reload >/dev/null
$B wait --load networkidle >/dev/null
sleep 3
R=$(EV "(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  return reg && reg.active ? 'SW:' + (reg.active.scriptURL.includes('sw.js') ? 'ok' : 'other') : 'SW:none';
})()")
echo "  SW state: $R"
# انتظار تفعيل v3
sleep 3
R=$(EV "(async () => {
  const keys = await caches.keys();
  return 'caches:' + keys.join(',');
})()")
echo "  $R"

EV "(() => { localStorage.setItem('mahatta-locale', 'ar'); return 'ar'; })()" >/dev/null
$B reload >/dev/null
$B wait --load networkidle >/dev/null
sleep 2
ck "$(EV "(() => document.documentElement.dir === 'rtl' ? 'OK rtl' : 'FAIL ltr')()")"

open_in_viewer() {
  local path="$1" name="$2"
  EV "(async () => {
    const res = await fetch('$path');
    const blob = await res.blob();
    const file = new File([blob], '$name', { type: 'application/acad' });
    const input = document.querySelector('input[type=file]');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return 'injected ' + blob.size;
  })()"
  sleep 2
  EV "(() => {
    const btn = [...document.querySelectorAll('button')].find(b => (b.textContent || '').trim() === 'عارض أوتوكاد' || (b.getAttribute('aria-label') || '') === 'عارض أوتوكاد');
    if (!btn) return 'NO-BTN';
    btn.click();
    return 'OK clicked';
  })()"
  sleep 7
}

viewer_state() {
  EV "(() => {
    const box = document.querySelector('[data-testid=cad-canvas-box]');
    const canvas = !!box?.querySelector('canvas');
    const bodyTxt = document.body.innerText;
    const dlg = bodyTxt.includes('ما قدرناش');
    const dxfHint = bodyTxt.includes('Save As');
    return JSON.stringify({ canvas, errDlg: dlg, dxfHint });
  })()"
}

close_viewer() {
  EV "(() => {
    const btn = document.querySelector('[aria-label=\"إغلاق العارض\"]');
    if (btn) { btn.click(); return 'closed'; }
    return 'no-close';
  })()" >/dev/null
  sleep 2
  EV "(async () => {
    const rm = [...document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || '').includes('إزالة الملف'));
    if (rm) { rm.click(); return 'removed'; }
    return 'keep';
  })()" >/dev/null
  sleep 1
}

echo "══ 1) الملف المنهار سابقًا: ground floor.dwg (R2000-582KB) ══"
open_in_viewer "/t_ground.dwg" "ground floor.dwg"
ST=$(viewer_state)
echo "  $ST"
ck "$(echo "$ST" | rg -q "canvas:true" && echo 'OK canvas يرندر' || echo 'FAIL لا كانفس')"
if echo "$ST" | rg -q "errDlg:true"; then
  echo "  ← رسالة الخطأ:"
  EV "(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const out = [];
    while (walker.nextNode()) { const t = walker.currentNode.textContent.trim(); if (t.length > 40 && (t.includes('—') || t.includes('Save As'))) out.push(t.slice(0, 160)); if (out.length > 2) break; }
    return JSON.stringify(out);
  })()"
fi
$B screenshot $S/94_dwg2000_after_fix.png >/dev/null 2>&1
close_viewer

echo "══ 2) R2000 أساسي: sample_2000.dwg ══"
open_in_viewer "/sample_2000.dwg" "sample 2000.dwg"
ST=$(viewer_state)
echo "  $ST"
ck "$(echo "$ST" | rg -q "canvas:true" && echo 'OK canvas يرندر' || echo 'FAIL لا كانفس')"
$B screenshot $S/95_r14_after_fix.png >/dev/null 2>&1
close_viewer

echo "══ 3) DXF انحدار: t.dxf ══"
open_in_viewer "/t.dxf" "t.dxf"
ST=$(viewer_state)
echo "  $ST"
ck "$(echo "$ST" | rg -q "canvas:true" && echo 'OK dxf يرندر' || echo 'FAIL dxf')"
$B screenshot $S/96_dxf_regress.png >/dev/null 2>&1
close_viewer

echo "══ النتيجة: $pass ناجح / $fail فاشل ══"
