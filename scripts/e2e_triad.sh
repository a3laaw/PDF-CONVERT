#!/bin/bash
# E2E — المحاور الثلاثة (Task 51):
#  (A) شبكة «كل الأدوات» المصنفة: تبويبات iLovePDF الستة + توزيع 26 كارتًا + كارت ← منتقي مفلتر بالنوع (المحور 1)
#  (B) زر «الرجوع للعجلة»: ديالوج الجلسة النظيفة (إلغاء يبقي / تأكيد يمسح) + الوضع العام والقسم
#  (C) شاشة الوجهين «الأصل ↔ المعدّل»: تدوير/ختم/ترقيم PDF + أبعاد/صيغة صورة + زر التنفيذ — فتح يدوي من القوائم
#  (D) الجوال 390px + الكونسول (hydration=0 صرامة كاملة)
# دروس مثبتة: اللغة تُبذر في localStorage · النقر عبر eval .click() · الحقن عبر DataTransfer
# لقطات triad_01-04
B="agent-browser"
S=/home/z/my-project/screenshots
pass=0; fail=0
ck() { if echo "$1" | rg -q "^OK"; then echo "PASS: $1"; pass=$((pass+1)); else echo "FAIL: $1"; fail=$((fail+1)); fi; }
EV() {
  local raw out
  raw=$($B eval "$1" 2>&1)
  out=$(echo "$raw" | tail -1 | tr -d '"\\')
  if [ "$out" = "{}" ] || [ -z "$out" ] || echo "$raw" | rg -qi "timed out"; then
    sleep 1.5
    out=$($B eval "$1" 2>&1 | tail -1 | tr -d '"\\')
  fi
  echo "$out"
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
# فتح قائمة مجموعة في الشريط المنسدل (المحور 3) — الأدوات داخلها فقط حينها في الـ DOM
openmenu() {
  EV "(() => { const b = document.querySelector('[data-testid=mb-g-$1]'); if (!b) return 'NO-MENU-$1'; b.click(); return 'OK menu-$1'; })()" >/dev/null
  sleep 0.45
}
cold() { $B reload >/dev/null 2>&1; sleep 3.5; }

cd /home/z/my-project
mkdir -p $S

echo "═══ فتح الصفحة ═══"
$B open http://localhost:3000 >/dev/null 2>&1
# إزالة أي SW قديم + كاشه — قشرة مخزنة تبتلع تحديثات الكود (حادثة موثقة في Task 51)
$B eval "(async () => { const regs = await navigator.serviceWorker.getRegistrations(); for (const r of regs) await r.unregister(); const keys = await caches.keys(); for (const k of keys) await caches.delete(k); return 'sw-clean'; })()" >/dev/null 2>&1
$B eval "(() => { localStorage.setItem('mahatta-locale', 'ar'); return 'ar-set'; })()" >/dev/null 2>&1
$B set viewport 1440 900 >/dev/null 2>&1
cold
$B console --clear >/dev/null 2>&1
$B errors --clear >/dev/null 2>&1

echo "═══ (A1) الشبكة بجوار العجلة ═══"
ck "$(EV "(() => document.querySelector('[data-testid=wheel-root]') && document.querySelector('[data-testid=tools-grid]') ? 'OK wheel+grid' : 'BAD missing')()")"
ck "$(EV "(() => { const tabs = document.querySelectorAll('[data-testid^=grid-tab-]').length; return tabs === 7 ? 'OK 7 tabs' : 'BAD tabs=' + tabs; })()")"

echo "═══ (A2) توزيع الكروت على المجموعات ═══"
cnt() { EV "(() => document.querySelectorAll('[data-testid^=tg-]').length)()"; }
ck "$([ "$(cnt)" = "26" ] && echo "OK all=26" || echo "BAD all=$(cnt)")"
tabclick() { EV "(() => { document.querySelector('[data-testid=grid-tab-$1]')?.click(); return 'OK tab-$1'; })()" >/dev/null; sleep 0.4; }
tabclick organize;  ck "$([ "$(cnt)" = "7" ] && echo "OK تنظيم=7" || echo "BAD تنظيم=$(cnt)")"
tabclick optimize;  ck "$([ "$(cnt)" = "2" ] && echo "OK تحسين=2" || echo "BAD تحسين=$(cnt)")"
tabclick convert;   ck "$([ "$(cnt)" = "5" ] && echo "OK تحويل=5" || echo "BAD تحويل=$(cnt)")"
tabclick edit;      ck "$([ "$(cnt)" = "7" ] && echo "OK تعديل=7" || echo "BAD تعديل=$(cnt)")"
tabclick protect;   ck "$([ "$(cnt)" = "3" ] && echo "OK حماية=3" || echo "BAD حماية=$(cnt)")"
tabclick info;      ck "$([ "$(cnt)" = "2" ] && echo "OK معلومات=2" || echo "BAD معلومات=$(cnt)")"
EV "(() => { document.querySelector('[data-testid=grid-tab-all]')?.click(); return 'all'; })()" >/dev/null
ck "$(EV "(() => { const n = document.querySelectorAll('[data-testid^=grid-tab-]:not([data-testid=grid-tab-all])').length; const names = ['tg-merge','tg-nup','tg-compress','tg-ocr','tg-pdf_to_word','tg-image_convert','tg-editor','tg-sign','tg-metadata'].filter(id => !document.querySelector('[data-testid=' + id + ']')); return n === 6 && names.length === 0 ? 'OK key cards present' : 'BAD missing=' + names.join(','); })()")"

echo "═══ (A3) كارت بلا ملفات ← منتقي مفلتر بالنوع + بلا تنشيط تلقائي ═══"
ck "$(EV "(() => { document.querySelector('[data-testid=tg-merge]')?.click(); return 'OK clicked merge card'; })()")"
sleep 0.8
ACC=$(EV "(() => document.querySelector('input[type=file]')?.accept ?? 'NO')()")
ck "$([ "$ACC" = ".pdf" ] && echo "OK pdf-only accept" || echo "BAD accept=$ACC")"
ck "$(inject crop_annot.pdf application/pdf)"
sleep 3.5
NOAUTO=$(EV "(() => { const act = Array.from(document.querySelectorAll('[data-testid^=tb-]')).filter(b => b.className.includes('bg-primary/10')); return act.length === 0 && document.querySelector('[data-testid=chooser-hint]') ? 'OK no auto tool + hint' : 'BAD active=' + act.length; })()")
ck "$NOAUTO"
openmenu optimize
ck "$(EV "(() => { const b = document.querySelector('[data-testid=tb-compress]'); if (!b) return 'NO-BTN'; b.click(); return 'OK compress picked'; })()")"
sleep 1.2
openmenu optimize
ck "$(EV "(() => { const b = document.querySelector('[data-testid=tb-compress]'); return b && b.className.includes('bg-primary/10') ? 'OK compress active' : 'BAD not active'; })()")"

echo "═══ (B1) زر الرجوع في الوضع العام + ديالوج ═══"
ck "$(EV "(() => document.querySelector('[data-testid=generic-bar]')?.querySelector('[data-testid=home-wheel]') ? 'OK home btn' : 'BAD no home')()")"
ck "$(EV "(() => { document.querySelector('[data-testid=home-wheel]')?.click(); return 'OK clicked home'; })()")"
sleep 0.6
ck "$(EV "(() => document.querySelector('[data-testid=clean-dialog]') ? 'OK dialog open' : 'BAD no dialog')()")"
$B screenshot $S/triad_02_dialog.png >/dev/null 2>&1
ck "$(EV "(() => { document.querySelector('[data-testid=clean-cancel]')?.click(); return 'OK cancelled'; })()")"
sleep 0.6
ck "$(EV "(() => { const n = document.querySelectorAll('button[aria-label=\"إزالة الملف\"]').length; return document.querySelector('[data-testid=clean-dialog]') || n === 0 ? 'BAD file lost/closed' : 'OK keep=' + n + ' file'; })()")"

echo "═══ (B2) تأكيد الجلسة النظيفة ═══"
ck "$(EV "(() => { document.querySelector('[data-testid=home-wheel]')?.click(); return 'OK'; })()")"
sleep 0.5
ck "$(EV "(() => { document.querySelector('[data-testid=clean-confirm]')?.click(); return 'OK confirmed'; })()")"
sleep 1.2
ck "$(EV "(() => document.querySelector('[data-testid=wheel-root]') ? 'OK wheel back' : 'BAD no wheel')()")"
ck "$(EV "(() => document.querySelector('[data-testid=tools-grid]') ? 'OK grid back too' : 'BAD no grid')()")"

echo "═══ (B3) الرجوع من داخل قسم ═══"
cold
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-seg-pdf]')?.click(); return 'OK pdf picked'; })()")"
sleep 0.8
EV "(() => { const s = document.querySelector('[data-testid=sw-enter]'); if (!s) return 'NO-SUB'; s.click(); return 'OK sub-enter'; })()" >/dev/null  # العجلة الفرعية: الدخول للمحور
sleep 0.3
ck "$(inject crop_annot.pdf application/pdf)"
sleep 3.5
ck "$(EV "(() => document.querySelector('[data-testid=sector-chip]')?.querySelector('[data-testid=sector-home]') ? 'OK sector home btn' : 'BAD')()")"
ck "$(EV "(() => { document.querySelector('[data-testid=sector-home]')?.click(); return 'OK'; })()")"
sleep 0.5
ck "$(EV "(() => { document.querySelector('[data-testid=clean-confirm]')?.click(); return 'OK'; })()")"
sleep 1.2
ck "$(EV "(() => document.querySelector('[data-testid=wheel-root]') ? 'OK wheel from sector' : 'BAD')()")"

echo "═══ (C1) شاشة الوجهين — تدوير PDF ═══"
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-pick-btn]')?.click(); return 'OK'; })()")"
sleep 0.8
ck "$(inject crop_annot.pdf application/pdf)"
sleep 3.5
openmenu edit
ck "$(EV "(() => { document.querySelector('[data-testid=tb-rotate]')?.click(); return 'OK rotate picked'; })()")"
sleep 1.5
ck "$(EV "(() => document.querySelector('[data-testid=compare-root]') ? 'OK compare-root' : 'BAD no compare')()")"
ck "$(EV "(() => { const o = document.querySelector('[data-testid=compare-original] img'); const p = document.querySelector('[data-testid=compare-preview] img'); return o && p && o.src.startsWith('data:image') && p.style.transform.includes('rotate(90') ? 'OK original+rotate90' : 'BAD o=' + !!o + ' p=' + !!p; })()")"
$B screenshot $S/triad_03_compare.png >/dev/null 2>&1
ck "$(EV "(() => { const s = document.querySelector('[data-testid=field-angle]'); if (!s) return 'BAD no field'; s.value = '180'; s.dispatchEvent(new Event('change', { bubbles: true })); return 'OK set 180'; })()")"
sleep 0.8
ck "$(EV "(() => { const p = document.querySelector('[data-testid=compare-preview] img'); return p && p.style.transform.includes('rotate(180') ? 'OK live rotate 180' : 'BAD t=' + (p?.style.transform ?? 'none'); })()")"
ck "$(EV "(() => { const b = document.querySelector('[data-testid=compare-execute]'); return b && !b.disabled ? 'OK execute btn' : 'BAD btn'; })()")"

echo "═══ (C2) الختم والترقيم — معاينة كانفس حية ═══"
openmenu edit
ck "$(EV "(() => { document.querySelector('[data-testid=tb-watermark]')?.click(); return 'OK'; })()")"
sleep 1.5
L1=$(EV "(() => document.querySelector('[data-testid=compare-preview] img')?.src.length ?? 0)()")
ck "$([ "${L1:-0}" -gt 1000 ] && echo "OK watermark canvas preview" || echo "BAD len=$L1")"
ck "$(EV "(() => { const s = document.querySelector('[data-testid=field-text]'); if (!s) return 'BAD'; const st = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; st.call(s, 'سري'); s.dispatchEvent(new Event('input', { bubbles: true })); return 'OK text=سري'; })()")"
sleep 1
L2=$(EV "(() => document.querySelector('[data-testid=compare-preview] img')?.src.length ?? 0)()")
ck "$([ "$L1" != "$L2" ] && echo "OK live update ($L1→$L2)" || echo "BAD same len")"
openmenu edit
ck "$(EV "(() => { document.querySelector('[data-testid=tb-page_numbers]')?.click(); return 'OK'; })()")"
sleep 1.5
ck "$(EV "(() => { const p = document.querySelector('[data-testid=compare-preview] img'); return p && p.src.startsWith('data:image') ? 'OK numbers preview' : 'BAD'; })()")"

echo "═══ (C3) صورة — أبعاد وصيغة ═══"
cold
ck "$(inject crop_clean_me.png image/png)"
sleep 3
openmenu edit
ck "$(EV "(() => { document.querySelector('[data-testid=tb-image_resize]')?.click(); return 'OK'; })()")"
sleep 1.5
ck "$(EV "(() => document.querySelector('[data-testid=compare-root]') ? 'OK resize compare' : 'BAD')()")"
ck "$(EV "(() => document.body.textContent.includes('px') ? 'OK dims label' : 'BAD no label')()")"
openmenu convert
ck "$(EV "(() => { document.querySelector('[data-testid=tb-image_convert]')?.click(); return 'OK'; })()")"
sleep 1
ck "$(EV "(() => document.body.textContent.includes('JPEG') ? 'OK format badge' : 'BAD')()")"

echo "═══ (D1) الجوال 390px ═══"
$B set viewport 390 844 >/dev/null 2>&1
sleep 1.5
ck "$(EV "(() => document.querySelector('[data-testid=compare-root]') ? 'OK compare on mobile' : 'BAD')()")"
$B screenshot $S/triad_04_compare_mobile.png >/dev/null 2>&1
$B set viewport 1440 900 >/dev/null 2>&1
ck "$(remove_all)"

echo "═══ (D2) لقطة الشبكة المصنفة ═══"
sleep 1.5
$B screenshot $S/triad_01_grid.png >/dev/null 2>&1

echo "═══ (D3) الكونسول ═══"
HYD=$($B console 2>&1 | grep -c "hydrat")
ERRS=$($B console 2>&1 | awk '/^\[(error|critical)\]/ {print}' | grep -vc -e "hydrat" -e "conversion stage" || true)
if [ "$ERRS" = "0" ] && [ "$HYD" = "0" ]; then ck "OK console clean (hydration=$HYD)"; else ck "FAIL console errors=$ERRS hydration=$HYD"; fi

echo ""
echo "════════════════════════════"
echo "النتيجة: $pass ناجح / $fail فاشل"
echo "════════════════════════════"
exit $([ $fail -eq 0 ] && echo 0 || echo 1)
