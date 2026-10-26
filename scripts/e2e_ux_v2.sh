#!/bin/bash
# E2E — تجربة المستخدم الجديدة (Task 52) — المحاور الأربعة المعتمدة:
#  (1) المحور 1 — فلترة المنتقي حسب نوع الأداة: كارت PDF → .pdf فقط · كارت صور → image/* · ثنائي → كلاهما
#  (2) المحور 2 — بلا قفز تلقائي بعد الرفع: لا أداة نشطة + تلميح «اختر أداة» في كل المداخل
#  (3) المحور 3 — الشريط المنسدل: 6 مجموعات بنمط iLovePDF · توزيع الأدوات · إغلاق Esc/خارجي · عزل الأقسام
#  (4) المحور 4 — مركز الترس: زر حقيقي يفتح شريط أيقونات مصغّرة (26) بتبويبات فلترة ونقر مباشر
#  (5) الجوال 390px + الكونسول (hydration=0 صرامة كاملة)
# دروس مثبتة: اللغة تُبذر في localStorage · النقر عبر eval .click() · الحقن عبر DataTransfer
# لقطات ux2_01+
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
openmenu() {
  EV "(() => { const b = document.querySelector('[data-testid=mb-g-$1]'); if (!b) return 'NO-MENU-$1'; b.click(); return 'OK menu-$1'; })()" >/dev/null
  sleep 0.45
}
menu_items() {
  EV "(() => Array.from(document.querySelectorAll('[data-testid^=tb-]')).map(b => b.dataset.testid.replace('tb-','')).sort().join(' '))()"
}
no_auto() {
  EV "(() => { const act = Array.from(document.querySelectorAll('[data-testid^=tb-]')).filter(b => b.className.includes('bg-primary/10')); const hint = document.querySelector('[data-testid=chooser-hint]'); return act.length === 0 && hint ? 'OK no auto tool + hint' : 'BAD active=' + act.length + ' hint=' + !!hint; })()"
}

cd /home/z/my-project
mkdir -p $S

echo "═══ فتح الصفحة ═══"
$B open http://localhost:3000 >/dev/null 2>&1
$B eval "(async () => { const regs = await navigator.serviceWorker.getRegistrations(); for (const r of regs) await r.unregister(); const keys = await caches.keys(); for (const k of keys) await caches.delete(k); return 'sw-clean'; })()" >/dev/null 2>&1
$B eval "(() => { localStorage.setItem('mahatta-locale', 'ar'); return 'ar-set'; })()" >/dev/null 2>&1
$B set viewport 1440 900 >/dev/null 2>&1
$B reload >/dev/null 2>&1
sleep 5
$B console --clear >/dev/null 2>&1
$B errors --clear >/dev/null 2>&1

echo "═══ (1) المحور 1: فلترة المنتقي حسب نوع الأداة ═══"
A1=$(EV "(() => { const i = document.querySelector('input[type=file]'); document.querySelector('[data-testid=tg-merge]')?.click(); return i?.accept ?? 'NO'; })()")
ck "$([ "$A1" = ".pdf" ] && echo "OK merge→.pdf only" || echo "BAD merge=$A1")"
A2=$(EV "(() => { const i = document.querySelector('input[type=file]'); document.querySelector('[data-testid=tg-image_convert]')?.click(); return i?.accept ?? 'NO'; })()")
ck "$([ "$A2" = "image/*" ] && echo "OK image_convert→image/* only" || echo "BAD cv=$A2")"
A3=$(EV "(() => { const i = document.querySelector('input[type=file]'); document.querySelector('[data-testid=tg-compress]')?.click(); return i?.accept ?? 'NO'; })()")
ck "$([ "$A3" = ".pdf,image/*" ] && echo "OK compress→both" || echo "BAD compress=$A3")"
A4=$(EV "(() => { const i = document.querySelector('input[type=file]'); document.querySelector('[data-testid=tg-pdf_to_word]')?.click(); return i?.accept ?? 'NO'; })()")
ck "$([ "$A4" = ".pdf,image/*" ] && echo "OK pdf_to_word→both" || echo "BAD w=$A4")"

echo "═══ (2) المحور 4: مركز الترس يفتح الأيقونات المصغّرة ═══"
$B reload >/dev/null 2>&1; sleep 4
HUB=$(EV "(() => { const h = document.querySelector('[data-testid=wheel-hub]'); return h ? h.tagName + ':' + (h.getAttribute('aria-expanded') ?? '?') : 'NO-HUB'; })()")
ck "$(echo "$HUB" | rg -q "^BUTTON:false" && echo "OK hub is button (closed)" || echo "BAD hub=$HUB")"
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-hub]')?.click(); return 'OK hub clicked'; })()")"
sleep 0.6
ck "$(EV "(() => document.querySelector('[data-testid=hub-strip]') ? 'OK strip open' : 'BAD no strip')()")"
N=$(EV "(() => document.querySelectorAll('[data-testid^=hub-icon-]').length)()")
ck "$([ "$N" = "26" ] && echo "OK 26 icons (25 tools + editor, no cad)" || echo "BAD icons=$N")"
T=$(EV "(() => document.querySelectorAll('[data-testid^=hub-tab-]').length)()")
ck "$([ "$T" = "7" ] && echo "OK 7 tabs (all + 6 groups)" || echo "BAD tabs=$T")"
$B screenshot $S/ux2_01_hub_strip.png >/dev/null 2>&1
ck "$(EV "(() => { document.querySelector('[data-testid=hub-tab-optimize]')?.click(); return 'OK'; })()")"
sleep 0.4
N=$(EV "(() => document.querySelectorAll('[data-testid^=hub-icon-]').length)()")
ck "$([ "$N" = "2" ] && echo "OK optimize filter=2 icons" || echo "BAD opt=$N")"
ck "$(EV "(() => { document.querySelector('[data-testid=hub-tab-all]')?.click(); return 'OK'; })()")"
sleep 0.3
ACC=$(EV "(() => { const i = document.querySelector('input[type=file]'); document.querySelector('[data-testid=hub-icon-merge]')?.click(); return i?.accept ?? 'NO'; })()")
ck "$([ "$ACC" = ".pdf" ] && echo "OK hub icon→pdf-only picker" || echo "BAD hub accept=$ACC")"
sleep 0.5
ck "$(EV "(() => document.querySelector('[data-testid=hub-strip]') ? 'BAD strip still open' : 'OK strip closed after pick')()")"

echo "═══ (3) المحور 2: الرفع العام بلا قفز تلقائي ═══"
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-pick-btn]')?.click(); return 'OK generic'; })()")"
sleep 0.6
ck "$(inject crop_annot.pdf application/pdf)"
sleep 3.5
ck "$(no_auto)"
$B screenshot $S/ux2_02_chooser.png >/dev/null 2>&1

echo "═══ (4) المحور 3: الشريط المنسدل — الوضع العام ═══"
G=$(EV "(() => document.querySelectorAll('[data-testid^=mb-g-]').length)()")
ck "$([ "$G" = "6" ] && echo "OK 6 group buttons" || echo "BAD groups=$G")"
ck "$(EV "(() => document.querySelector('[data-testid=tb-cad_viewer]') ? 'OK cad standalone' : 'BAD no cad')()")"
cnt() {
  # مكتفية ذاتيًا: إغلاق أي قائمة مفتوحة ← فتح قائمة المجموعة ← عدّ الأدوات داخلها
  EV "(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return 'pre'; })()" >/dev/null
  sleep 0.35
  openmenu $1
  EV "(() => { const p = document.querySelector('[data-testid=mb-panel-$1]'); return p ? p.querySelectorAll('[data-testid^=tb-]').length : -1; })()"
}
openmenu organize
V=$(cnt organize); ck "$([ "$V" = "7" ] && echo "OK تنظيم=7" || echo "BAD تنظيم=$V")"
V=$(cnt optimize); ck "$([ "$V" = "2" ] && echo "OK تحسين=2" || echo "BAD تحسين=$V")"
V=$(cnt convert);  ck "$([ "$V" = "5" ] && echo "OK تحويل=5" || echo "BAD تحويل=$V")"
V=$(cnt edit);     ck "$([ "$V" = "7" ] && echo "OK تعديل=7" || echo "BAD تعديل=$V")"
V=$(cnt protect);  ck "$([ "$V" = "3" ] && echo "OK حماية=3" || echo "BAD حماية=$V")"
V=$(cnt info);     ck "$([ "$V" = "2" ] && echo "OK معلومات=2" || echo "BAD معلومات=$V")"
$B screenshot $S/ux2_03_menu_open.png >/dev/null 2>&1
ck "$(EV "(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return 'OK esc'; })()")"
sleep 0.4
ck "$(EV "(() => document.querySelector('[data-testid^=mb-panel-]') ? 'BAD panel open' : 'OK Esc closes menu')()")"
openmenu organize
ck "$(EV "(() => { document.body.click(); return 'OK outside'; })()")"
sleep 0.4
ck "$(EV "(() => document.querySelector('[data-testid^=mb-panel-]') ? 'BAD panel open' : 'OK outside click closes')()")"
openmenu edit
ck "$(EV "(() => { document.querySelector('[data-testid=tb-rotate]')?.click(); return 'OK rotate'; })()")"
sleep 1.2
ACT=$(EV "(() => { const b = document.querySelector('[data-testid=mb-g-edit]'); return b && b.className.includes('bg-primary/10') ? 'OK edit group highlighted' : 'BAD not highlighted'; })()")
ck "$ACT"

echo "═══ (5) المحور 3: عزل الأقسام داخل الشريط ═══"
ck "$(remove_all)"
$B reload >/dev/null 2>&1; sleep 4
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-seg-pdf]')?.click(); return 'OK pdf'; })()")"
sleep 0.6
EV "(() => { const s = document.querySelector('[data-testid=sw-enter]'); if (!s) return 'NO-SUB'; s.click(); return 'OK sub-enter'; })()" >/dev/null  # العجلة الفرعية: الدخول من المحور
sleep 0.3
ck "$(inject crop_annot.pdf application/pdf)"
sleep 3.5
ck "$(no_auto)"
PV=$(cnt organize)
if [ "$PV" = "6" ]; then ck "OK pdf room organize=6"; else ck "FAIL pdf organize=$PV ($(menu_items))"; fi
V=$(cnt edit); ck "$([ "$V" = "6" ] && echo "OK pdf edit=6" || echo "BAD=$V")"
ck "$(EV "(() => document.querySelector('[data-testid=tb-cad_viewer]') ? 'BAD cad in pdf room' : 'OK no cad in pdf room')()")"
ck "$(EV "(() => document.querySelector('[data-testid=tb-image_convert]') ? 'BAD foreign tool in pdf' : 'OK no image tools')()")"

echo "═══ (6) غرفة الصور: 3 مجموعات فقط ═══"
ck "$(remove_all)"
$B reload >/dev/null 2>&1; sleep 4
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-seg-images]')?.click(); return 'OK images'; })()")"
sleep 0.6
EV "(() => { const s = document.querySelector('[data-testid=sw-enter]'); if (!s) return 'NO-SUB'; s.click(); return 'OK sub-enter'; })()" >/dev/null  # العجلة الفرعية
sleep 0.3
ck "$(inject crop_clean_me.png image/png)"
sleep 3.5
G=$(EV "(() => document.querySelectorAll('[data-testid^=mb-g-]').length)()")
ck "$([ "$G" = "3" ] && echo "OK images room=3 groups" || echo "BAD groups=$G")"
TOT=0
for g in organize optimize convert edit protect info; do
  V=$(cnt $g 2>/dev/null); [ "$V" -gt 0 ] 2>/dev/null && TOT=$((TOT+V))
done
ck "$([ "$TOT" = "6" ] && echo "OK images total=6 tools" || echo "BAD total=$TOT")"
ck "$(EV "(() => document.querySelector('[data-testid=tb-cad_viewer]') ? 'BAD cad in images room' : 'OK no cad in images room')()")"

echo "═══ (7) المحور 2: أقسام العجلة بلا قفز تلقائي ═══"
ck "$(remove_all)"
$B reload >/dev/null 2>&1; sleep 4
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-seg-office]')?.click(); return 'OK'; })()")"
sleep 0.6
EV "(() => { const s = document.querySelector('[data-testid=sw-enter]'); if (!s) return 'NO-SUB'; s.click(); return 'OK sub-enter'; })()" >/dev/null  # العجلة الفرعية
sleep 0.3
ck "$(inject crop_annot.pdf application/pdf)"
sleep 3.5
ck "$(no_auto)"
ck "$(remove_all)"
$B reload >/dev/null 2>&1; sleep 4
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-seg-edit]')?.click(); return 'OK'; })()")"
sleep 0.6
ck "$(inject crop_clean_me.png image/png)"
sleep 3.5
ck "$(no_auto)"

echo "═══ (8) الجوال 390px ═══"
ck "$(remove_all)"
$B set viewport 390 844 >/dev/null 2>&1
sleep 1.5
$B reload >/dev/null 2>&1; sleep 4
ck "$(EV "(() => document.querySelector('[data-testid=wheel-hub]') ? 'OK mobile hub' : 'BAD no hub')()")"
ck "$(EV "(() => { document.querySelector('[data-testid=wheel-hub]')?.click(); return 'OK'; })()")"
sleep 0.6
ck "$(EV "(() => document.querySelector('[data-testid=hub-strip]') ? 'OK mobile strip' : 'BAD no strip')()")"
$B screenshot $S/ux2_04_mobile_hub.png >/dev/null 2>&1
EV "(() => { const i = document.querySelector('input[type=file]'); document.querySelector('[data-testid=hub-icon-image_resize]')?.click(); return i?.accept ?? 'NO'; })()" >/dev/null
ACC=$(EV "(() => document.querySelector('input[type=file]')?.accept ?? 'NO')()")
ck "$([ "$ACC" = "image/*" ] && echo "OK mobile hub icon→image/*" || echo "BAD acc=$ACC")"
$B set viewport 1440 900 >/dev/null 2>&1

echo "═══ (9) الكونسول ═══"
HYD=$($B console 2>&1 | grep -c "hydrat")
ERRS=$($B console 2>&1 | awk '/^\[(error|critical)\]/ {print}' | grep -vc -e "hydrat" -e "conversion stage" || true)
if [ "$ERRS" = "0" ] && [ "$HYD" = "0" ]; then ck "OK console clean (hydration=$HYD)"; else ck "FAIL console errors=$ERRS hydration=$HYD"; fi

echo ""
echo "════════════════════════════"
echo "النتيجة: $pass ناجح / $fail فاشل"
echo "════════════════════════════"
exit $([ $fail -eq 0 ] && echo 0 || echo 1)
