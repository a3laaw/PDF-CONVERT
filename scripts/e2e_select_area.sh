#!/bin/bash
# E2E — ميزة «تحديد منطقة» في عارض الأوتوكاد: طباعة أو تصدير PDF لجزء محدد فقط
# لقطات 102+ — يتبع نفس نمط e2e_measure.sh
B="agent-browser"
S=/home/z/my-project/screenshots
pass=0; fail=0
ck() { if echo "$1" | rg -q "^OK"; then echo "PASS: $1"; pass=$((pass+1)); else echo "FAIL: $1"; fail=$((fail+1)); fi; }
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
GET_BOX() {
  local box=""
  for i in 1 2 3 4; do
    box=$(EV "(() => { const el = document.querySelector('[data-testid=cad-canvas-box]'); if (!el) return 'NOBOX'; const b = el.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(v => Math.round(v)).join(' '); })()")
    if echo "$box" | rg -q "^[0-9]+ [0-9]+ [0-9]+ [0-9]+$"; then echo "$box"; return 0; fi
    sleep 2
  done
  echo ""
}
warmup() {
  for i in 1 2 3; do
    R=$($B eval "1+1" 2>/dev/null | tail -1 | tr -d '"')
    if [ "$R" = "2" ]; then return 0; fi
    sleep 2
    $B reload >/dev/null 2>&1
    sleep 2
  done
}
click_at() { $B mouse move $1 $2 >/dev/null 2>&1; $B mouse down left >/dev/null 2>&1; $B mouse up left >/dev/null 2>&1; }
drag_box() { $B mouse move $1 $2 >/dev/null 2>&1; $B mouse down left >/dev/null 2>&1; $B mouse move $3 $4 >/dev/null 2>&1; $B mouse move $5 $6 >/dev/null 2>&1; $B mouse up left >/dev/null 2>&1; }
switch_lang() {
  EV "(() => { const sw = document.querySelector('[data-testid=lang-switcher]'); const btn = sw?.querySelector('button'); if (!btn) return 'FAIL no switcher'; if (btn.getAttribute('aria-expanded') !== 'true') btn.click(); return 'OK'; })()" >/dev/null
  sleep 0.5
  EV "(() => { const item=[...document.querySelectorAll('[data-testid=lang-switcher] button')].find(x => (x.textContent || '').includes('$1')); if (!item) return 'FAIL no item'; item.click(); return 'OK'; })()" >/dev/null
  sleep 0.8
}
INJECT_DWG="(() => {
  const input = document.querySelector('input[type=file]');
  if (!input) return 'FAIL no input';
  return fetch('/sample_2000.dwg').then(r => r.blob()).then(b => {
    const f = new File([b], 'sample_2000.dwg', { type: 'application/acad' });
    const dt = new DataTransfer();
    dt.items.add(f);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return 'OK injected';
  });
})()"
BOXQ="(() => { const b = document.querySelector('[data-testid=cad-canvas-box]').getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map(v => Math.round(v)).join(' '); })()"

cd /home/z/my-project

echo "══ 1) سطح المكتب: فتح الموقع وحقن DWG ══"
$B set viewport 1440 900 >/dev/null
$B open http://localhost:3000 >/dev/null
$B wait --load networkidle >/dev/null
$B eval "localStorage.removeItem('mahatta-locale')" >/dev/null 2>&1
$B reload >/dev/null
$B wait --load networkidle >/dev/null
warmup
sleep 1
R=$(EV "(() => document.documentElement.dir === 'rtl' ? 'OK rtl' : 'FIX')()")
if [ "$R" != "OK rtl" ]; then switch_lang "العربية"; fi
R=$(EV "$INJECT_DWG")
ck "$R"
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView && document.querySelector('[data-testid=cad-canvas-box] canvas')" --timeout 60000 >/dev/null 2>&1
sleep 3
R=$(EV "(() => { const c = !!document.querySelector('[data-testid=cad-canvas-box] canvas'); const e = !!document.querySelector('.bg-red-950'); return (c && !e ? 'OK العارض جاهز' : 'FAIL العارض غير جاهز e=' + e); })()")
ck "$R"

echo "══ 2) تفعيل وضع تحديد المنطقة ══"
$B find role button click --name "تحديد منطقة" >/dev/null 2>&1
sleep 0.8
R=$(EV "(() => {
  const btn = document.querySelector('[data-testid=cad-select-btn]');
  const layer = !!document.querySelector('[data-testid=cad-select-layer]');
  const chip = document.querySelector('[data-testid=cad-select-chip]');
  const pressed = btn?.getAttribute('aria-pressed');
  const hint = chip?.textContent || '';
  return (pressed === 'true' && layer && chip && hint.includes('اسحب') ? 'OK الوضع نشط واللوحة ظهرت' : 'FAIL pressed=' + pressed + ' layer=' + layer);
})()")
ck "$R"
$B screenshot $S/102-select-mode-on.png >/dev/null && echo "لقطة 102 ✓"

echo "══ 3) السحب يخلق مستطيلًا بأبعاد ══"
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
  const pdf = document.querySelector('[data-testid=cad-select-pdf]');
  const pr = document.querySelector('[data-testid=cad-select-print]');
  const okRect = !!rect && parseFloat(rect.getAttribute('width')) > 40 && parseFloat(rect.getAttribute('height')) > 40;
  const okDims = /[0-9]/.test(dims);
  const okBtns = pdf && pr && !pdf.disabled && !pr.disabled;
  return (okRect && okDims && okBtns ? 'OK مستطيل=' + Math.round(parseFloat(rect.getAttribute('width'))) + 'px أبعاد=' + dims.replace(/\\s+/g, ' ').slice(0, 60) : 'FAIL rect=' + okRect + ' dims=' + okDims + ' btns=' + okBtns);
})()")
ck "$R"
$B screenshot $S/103-selection-committed.png >/dev/null && echo "لقطة 103 ✓"

echo "══ 4) التحديد يلتصق بإحداثيات العالم عند التكبير ══"
$B mouse move $(python3 -c "print(round($L + $W/2))") $(python3 -c "print(round($T + $H/2))") >/dev/null 2>&1
R=$(EV "(() => {
  const v = window.__cadMgr?.curView;
  const rect = document.querySelector('[data-testid=cad-select-rect] rect');
  if (!v || !rect) return 'FAIL لا rect';
  const box = document.querySelector('[data-testid=cad-canvas-box]').getBoundingClientRect();
  const rx = parseFloat(rect.getAttribute('x')) + box.left;
  const ry = parseFloat(rect.getAttribute('y')) + box.top;
  const w1 = v.screenToWorld({ x: rx - box.left, y: ry - box.top });
  window.__w1 = w1;
  return 'OK before=' + w1.x.toFixed(2) + ',' + w1.y.toFixed(2);
})()")
echo "  $R"
$B mouse wheel -600 >/dev/null 2>&1
sleep 1.5
R=$(EV "(() => {
  const v = window.__cadMgr?.curView;
  const rect = document.querySelector('[data-testid=cad-select-rect] rect');
  if (!v || !rect) return 'FAIL لا rect بعد التكبير';
  const box = document.querySelector('[data-testid=cad-canvas-box]').getBoundingClientRect();
  const rx = parseFloat(rect.getAttribute('x')) + box.left;
  const ry = parseFloat(rect.getAttribute('y')) + box.top;
  const w2 = v.screenToWorld({ x: rx - box.left, y: ry - box.top });
  const w1 = window.__w1;
  const d = Math.hypot(w2.x - w1.x, w2.y - w1.y);
  const ext = Math.abs(w2.x) + Math.abs(w2.y) + 1;
  return (d / ext < 0.02 ? 'OK التحديد ثابت في العالم انحراف=' + d.toFixed(4) : 'FAIL انحراف=' + d.toFixed(4) + ' ext=' + ext.toFixed(2));
})()")
ck "$R"
$B screenshot $S/104-selection-after-zoom.png >/dev/null && echo "لقطة 104 ✓"

echo "══ 5) تصدير التحديد PDF — تنزيل حقيقي بمحتوى صحيح ══"
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
  for (let i = 0; i < 40; i++) { if (window.__lastDl) break; await new Promise(r2 => setTimeout(r2, 200)); }
  const d = window.__lastDl;
  if (!d) return 'FAIL لا تنزيل خلال 8 ثوانٍ';
  const r = await fetch(d.href);
  const blob = await r.blob();
  const b64 = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
  window.__pdfB64 = b64;
  return 'OK name=' + d.name + ' bytes=' + blob.size;
})()")
ck "$R"
R=$(EV "(async () => {
  const b64 = window.__pdfB64 || '';
  if (!b64) return 'FAIL لا بيانات';
  let s = '';
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  s = new TextDecoder('latin1').decode(u8);
  const magic = s.slice(0, 5) === '%PDF-' ? 'OK' : 'FAIL';
  const mi = s.indexOf('MediaBox');
  const box = mi >= 0 ? s.slice(mi, mi + 40) : 'none';
  const imgs = s.split('/Image').length - 1;
  window.__pdfS = s;
  return magic + ' صور مدمجة=' + imgs + ' ' + box.replace(/\\s+/g, ' ');
})()")
ck "$R"
# ملاحظة: فحص MediaBox النصي غير ممكن داخل المتصفح — pdf-lib يضغط ObjectStreams
# فلا يظهر النص خامًا. التحقق من الأبعاد والمحتوى يتم على المضيف بـ fitz (موثق في worklog):
#   pages=1 · mediabox = قصّ البكسل × 0.75pt · خلفية بيضاء > 95% · حبر > 0.1%
R=$(EV "(() => {
  const s = window.__pdfS || '';
  const hasPage = s.length > 4000;
  const imgs = s.split('/Image').length - 1;
  return (hasPage && imgs >= 1 ? 'OK بنية PDF سليمة حجم=' + s.length + ' صور=' + imgs : 'FAIL حجم=' + s.length);
})()")
ck "$R"
$B screenshot $S/105-export-done.png >/dev/null && echo "لقطة 105 ✓"

echo "══ 6) طباعة التحديد — نافذة بصورة بيضاء الخلفية ══"
EV "(() => { document.querySelector('[data-testid=cad-select-print]').click(); return 'OK printing'; })()" >/dev/null
sleep 3
R=$(EV "(() => {
  const tabs = 'popup-check';
  return 'OK check-tabs';
})()")
POP=$($B tab 2>&1 | rg -c "about:blank" || echo 0)
if [ "$POP" -ge 1 ]; then
  TABID=$($B tab 2>&1 | rg -o "t[0-9]+" | tail -1)
  $B tab "$TABID" >/dev/null 2>&1
  sleep 0.5
  R=$(EV "(async () => {
    const img = document.querySelector('img');
    if (!img) return 'FAIL لا صورة في نافذة الطباعة';
    await img.decode().catch(() => {});
    const c = document.createElement('canvas');
    c.width = 100; c.height = 80;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0, 100, 80);
    const d = x.getImageData(0, 0, 100, 80).data;
    let white = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 240 && d[i+1] > 240 && d[i+2] > 240) white++;
    const pct = Math.round(100 * white / 8000);
    return (pct > 55 && pct < 100 ? 'OK خلفية بيضاء ' + pct + '% srcLen=' + img.src.length : 'FAIL نسبة البياض ' + pct + '%');
  })()")
  ck "$R"
  $B tab close "$TABID" >/dev/null 2>&1
  $B tab t1 >/dev/null 2>&1
else
  ck "FAIL لم تُفتح نافذة الطباعة"
fi
sleep 1

echo "══ 7) مسح التحديد ثم Escape ══"
EV "(() => { const b = document.querySelector('[data-testid=cad-select-clear]'); if (b) b.click(); return 'x'; })()" >/dev/null
sleep 0.4
R=$(EV "(() => {
  const rect = !!document.querySelector('[data-testid=cad-select-rect]');
  const pdf = document.querySelector('[data-testid=cad-select-pdf]');
  return (!rect && pdf && pdf.disabled ? 'OK المسح يعمل والزر معطّل' : 'FAIL rect=' + rect + ' disabled=' + (pdf ? pdf.disabled : 'nobtn'));
})()")
ck "$R"
drag_box $AX $AY $(( (AX+BX)/2 )) $(( (AY+BY)/2 )) $BX $BY
sleep 0.5
$B press Escape >/dev/null
sleep 0.4
R=$(EV "(() => {
  const rect = !!document.querySelector('[data-testid=cad-select-rect]');
  const layer = !!document.querySelector('[data-testid=cad-select-layer]');
  return (!rect && layer ? 'OK Escape مسح التحديد والوضع باقٍ' : 'FAIL rect=' + rect + ' layer=' + layer);
})()")
ck "$R"
$B press Escape >/dev/null
sleep 0.4
R=$(EV "(() => !document.querySelector('[data-testid=cad-select-layer]') ? 'OK Escape الثاني خرج من الوضع' : 'FAIL الوضع ما زال نشطًا')()")
ck "$R"

echo "══ 8) التعارض: دخول القياس يغلق التحديد والعكس ══"
$B find role button click --name "تحديد منطقة" >/dev/null 2>&1
sleep 0.5
$B find role button click --name "قياس" >/dev/null 2>&1
sleep 0.5
R=$(EV "(() => {
  const sel = document.querySelector('[data-testid=cad-select-btn]')?.getAttribute('aria-pressed');
  const mea = document.querySelector('[data-testid=cad-measure-btn]')?.getAttribute('aria-pressed');
  return (sel === 'false' && mea === 'true' ? 'OK القياس أغلق التحديد' : 'FAIL sel=' + sel + ' mea=' + mea);
})()")
ck "$R"
$B find role button click --name "قياس" >/dev/null 2>&1
sleep 0.4
$B find role button click --name "تحديد منطقة" >/dev/null 2>&1
sleep 0.5
R=$(EV "(() => {
  const sel = document.querySelector('[data-testid=cad-select-btn]')?.getAttribute('aria-pressed');
  const mea = document.querySelector('[data-testid=cad-measure-btn]')?.getAttribute('aria-pressed');
  return (sel === 'true' && mea === 'false' ? 'OK التحديد أغلق القياس' : 'FAIL sel=' + sel + ' mea=' + mea);
})()")
ck "$R"

echo "══ 9) زر الطباعة الكاملة — خلفية بيضاء (الإصلاح الجذري) ══"
EV "(() => { document.querySelector('[data-testid=cad-select-exit]')?.click(); return 'x'; })()" >/dev/null
sleep 0.4
EV "(() => {
  const p = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'طباعة');
  if (p) p.click();
  return 'x';
})()" >/dev/null
sleep 3.5
POP=$($B tab 2>&1 | rg -c "about:blank" || echo 0)
if [ "$POP" -ge 1 ]; then
  TABID=$($B tab 2>&1 | rg -o "t[0-9]+" | tail -1)
  $B tab "$TABID" >/dev/null 2>&1
  sleep 0.5
  R=$(EV "(async () => {
    const img = document.querySelector('img');
    if (!img) return 'FAIL لا صورة';
    await img.decode().catch(() => {});
    const c = document.createElement('canvas');
    c.width = 100; c.height = 80;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0, 100, 80);
    const d = x.getImageData(0, 0, 100, 80).data;
    let white = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 240 && d[i+1] > 240 && d[i+2] > 240) white++;
    const pct = Math.round(100 * white / 8000);
    return (pct > 55 ? 'OK طباعة كاملة بيضاء ' + pct + '%' : 'FAIL بياض=' + pct + '%');
  })()")
  ck "$R"
  $B tab close "$TABID" >/dev/null 2>&1
  $B tab t1 >/dev/null 2>&1
else
  ck "FAIL لم تُفتح نافذة الطباعة الكاملة"
fi
sleep 1

echo "══ 10) الإنجليزية ══"
$B find role button click --name "إغلاق العارض" >/dev/null 2>&1
sleep 0.6
switch_lang "English"
$B find role button click --name "CAD viewer" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView" --timeout 30000 >/dev/null 2>&1
sleep 2.5
$B find role button click --name "Select area" >/dev/null 2>&1
sleep 0.8
R=$(EV "(() => {
  const chip = document.querySelector('[data-testid=cad-select-chip]')?.textContent || '';
  return (chip.includes('Drag') || chip.includes('No area') ? 'OK إنجليزي: ' + chip.slice(0, 70) : 'FAIL chip=' + chip.slice(0, 70));
})()")
ck "$R"
BOX=$(GET_BOX)
L=$(echo $BOX | cut -d' ' -f1); T=$(echo $BOX | cut -d' ' -f2)
W=$(echo $BOX | cut -d' ' -f3); H=$(echo $BOX | cut -d' ' -f4)
AX=$(python3 -c "print(round($L + $W*0.25))"); AY=$(python3 -c "print(round($T + $H*0.30))")
BX=$(python3 -c "print(round($L + $W*0.65))"); BY=$(python3 -c "print(round($T + $H*0.62))")
drag_box $AX $AY $(( (AX+BX)/2 )) $(( (AY+BY)/2 )) $BX $BY
sleep 0.6
R=$(EV "(() => {
  const dims = document.querySelector('[data-testid=cad-select-dims]')?.textContent || '';
  const pr = document.querySelector('[data-testid=cad-select-print]');
  const okPr = pr && (pr.textContent || '').includes('Print selection');
  return (/Selection size/.test(dims) && okPr ? 'OK أبعاد إنجليزية + زر طباعة' : 'FAIL dims=' + dims.slice(0, 50) + ' pr=' + okPr);
})()")
ck "$R"
$B screenshot $S/106-select-english.png >/dev/null && echo "لقطة 106 ✓"
$B find role button click --name "Close viewer" >/dev/null 2>&1
sleep 0.6
switch_lang "العربية"
sleep 0.5

echo "══ 11) الجوال 390 ══"
$B set viewport 390 844 >/dev/null
$B reload >/dev/null
$B wait --load networkidle >/dev/null
warmup
R=$(EV "(() => document.documentElement.dir === 'rtl' ? 'OK rtl' : 'FIX')()")
if [ "$R" != "OK rtl" ]; then switch_lang "العربية"; fi
R=$(EV "$INJECT_DWG")
ck "$R"
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView && document.querySelector('[data-testid=cad-canvas-box] canvas')" --timeout 60000 >/dev/null 2>&1
sleep 3
$B find role button click --name "تحديد منطقة" >/dev/null 2>&1
sleep 0.8
BOX=$(GET_BOX)
L=$(echo $BOX | cut -d' ' -f1); T=$(echo $BOX | cut -d' ' -f2)
W=$(echo $BOX | cut -d' ' -f3); H=$(echo $BOX | cut -d' ' -f4)
MX1=$(python3 -c "print(round($L + $W*0.20))"); MY1=$(python3 -c "print(round($T + $H*0.30))")
MX2=$(python3 -c "print(round($L + $W*0.80))"); MY2=$(python3 -c "print(round($T + $H*0.55))")
drag_box $MX1 $MY1 $(( (MX1+MX2)/2 )) $(( (MY1+MY2)/2 )) $MX2 $MY2
sleep 0.6
R=$(EV "(() => {
  const chip = document.querySelector('[data-testid=cad-select-chip]');
  if (!chip) return 'FAIL لا لوحة على الجوال';
  const r = chip.getBoundingClientRect();
  const inside = r.width <= window.innerWidth + 2 && r.left >= -2 && r.right <= window.innerWidth + 2;
  const rect = !!document.querySelector('[data-testid=cad-select-rect] rect');
  return (inside && rect ? 'OK جوال: لوحة داخل الشاشة عرض=' + r.width.toFixed(0) : 'FAIL inside=' + inside + ' rect=' + rect + ' عرض=' + (r ? r.width.toFixed(0) : '?'));
})()")
ck "$R"
$B screenshot $S/107-select-mobile.png >/dev/null && echo "لقطة 107 ✓"
R=$(EV "(() => { const b = document.querySelector('[data-testid=cad-select-exit]'); if (!b) return 'FAIL'; b.click(); return 'OK خروج جوال'; })()")
ck "$R"
$B screenshot $S/108-mobile-after-exit.png >/dev/null && echo "لقطة 108 ✓"

echo "══ 12) انحدار: القياس ما زال يعمل بعد كل التغييرات ══"
$B set viewport 1440 900 >/dev/null
$B reload >/dev/null
$B wait --load networkidle >/dev/null
warmup
R=$(EV "$INJECT_DWG")
ck "$R"
$B find role button click --name "عارض أوتوكاد" >/dev/null 2>&1
$B wait --fn "window.__cadMgr && window.__cadMgr.curView && document.querySelector('[data-testid=cad-canvas-box] canvas')" --timeout 60000 >/dev/null 2>&1
sleep 3
$B find role button click --name "قياس" >/dev/null 2>&1
sleep 0.8
BOX=$(GET_BOX)
L=$(echo $BOX | cut -d' ' -f1); T=$(echo $BOX | cut -d' ' -f2)
W=$(echo $BOX | cut -d' ' -f3); H=$(echo $BOX | cut -d' ' -f4)
click_at $(python3 -c "print(round($L + $W*0.30))") $(python3 -c "print(round($T + $H*0.40))")
sleep 0.6
click_at $(python3 -c "print(round($L + $W*0.70))") $(python3 -c "print(round($T + $H*0.60))")
sleep 1
R=$(EV "(() => {
  const val = (document.querySelector('[data-testid=cad-measure-val]')?.textContent || '').trim();
  const num = parseFloat(val.replace(/[^0-9.\\-]/g, ''));
  return (Number.isFinite(num) && num > 0 ? 'OK القياس يعمل=' + val : 'FAIL val=' + val);
})()")
ck "$R"
$B find role button click --name "إنهاء القياس" >/dev/null 2>&1
sleep 0.4
$B find role button click --name "إغلاق العارض" >/dev/null 2>&1
sleep 0.6
R=$(EV "(() => document.querySelectorAll('[data-testid=cad-viewer-layer]').length === 0 ? 'OK العارض أُغلق' : 'FAIL العارض ما زال مفتوحًا')()")
ck "$R"
$B screenshot $S/109-final-home.png >/dev/null && echo "لقطة 109 ✓"

echo ""
echo "أخطاء الصفحة: $($B errors 2>&1 | tail -3 | tr '\n' ' | ')"
echo "════════ النتيجة: نجح=$pass فشل=$fail ════════"
