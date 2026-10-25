#!/bin/bash
# تكملة E2E لـ PWA: إثبات اختصار ?op=merge بحقن ملف + اللقطة الختامية بالعربية
AB="agent-browser"
S=/home/z/my-project/screenshots
PASS=0; FAIL=0
ok(){ echo "  ✓ $1"; PASS=$((PASS+1)); }
bad(){ echo "  ✗ $1"; FAIL=$((FAIL+1)); }
EV(){ $AB eval "(() => { $1 })()" 2>/dev/null | tr -d '"'; }

$AB set offline off >/dev/null 2>&1
$AB set viewport 1440 900 >/dev/null 2>&1
echo "== اختصار ?op=merge مع ملف حقيقي (أونلاين) =="
$AB open "http://localhost:3000/?op=merge" >/dev/null 2>&1
$AB wait --load networkidle >/dev/null 2>&1; $AB wait 1200 >/dev/null 2>&1
EV "return 'w:'+(5+5)" >/dev/null 2>&1
# لغة عربية صريحة ثم إعادة تحميل حتى تكون الواجهة عربية
EV "localStorage.setItem('mahatta-locale','ar'); return 'ar-set'" >/dev/null 2>&1
$AB reload >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; $AB wait 1500 >/dev/null 2>&1
EV "return 'w:'+(6+6)" >/dev/null 2>&1
# حقن PDF عبر input المخفي: fetch → blob → DataTransfer → change
INJ=$(EV "
const resp = await fetch('/t_split5.pdf');
" )
# eval لا يدعم await مباشرة — نستخدم نمط المتغير العام
EV "window.__inj='pending'; fetch('/t_split5.pdf').then(r=>r.blob()).then(b=>{ const f=new File([b],'t_split5.pdf',{type:'application/pdf'}); const dt=new DataTransfer(); dt.items.add(f); const inp=document.querySelector('input[type=file]'); inp.files=dt.files; inp.dispatchEvent(new Event('change',{bubbles:true})); window.__inj='done'; }).catch(e=>{window.__inj='err:'+e.message}); return 'k'" >/dev/null 2>&1
sleep 3
INJ=$(EV "return window.__inj")
echo "$INJ" | grep -q "done" && ok "حقن t_split5.pdf نجح" || bad "حقن الملف فشل ($INJ)"
$AB wait 1500 >/dev/null 2>&1
# زر الدمج يجب أن يكون مفعلًا (bg-primary/10) لأن ?op=merge حدد الأداة
MERGE=$(EV "const btns=[...document.querySelectorAll('button')]; const m=btns.find(b=>b.textContent.includes('دمج')&&!b.textContent.includes('صفحات')); return m? (m.className.includes('bg-primary/10')?'merge-ACTIVE':'merge-idle') : 'no-btn'")
echo "$MERGE" | grep -q "merge-ACTIVE" && ok "اختصار PWA فعّل أداة الدمج تلقائيًا ($MERGE)" || bad "الدمج غير مفعل ($MERGE)"
$AB screenshot "$S/79-pwa-shortcut-merge-active.png" >/dev/null 2>&1 && ok "لقطة 79: الدمج مفعّل من الاختصار"

echo "== اللقطة الختامية: عربي سطح مكتب مع زر التثبيت =="
$AB open "http://localhost:3000/" >/dev/null 2>&1
$AB wait --load networkidle >/dev/null 2>&1; $AB wait 1500 >/dev/null 2>&1
EV "return 'w:'+(7+7)" >/dev/null 2>&1
T=$(EV "return document.title.slice(0,10)")
echo "$T" | grep -q "محوّل PDF" && ok "الصفحة عربية سليمة" || bad "العنوان غير متوقع ($T)"
$AB screenshot "$S/80-pwa-final-arabic.png" >/dev/null 2>&1 && ok "لقطة 80: ختامية عربية"
echo "PASS=$PASS FAIL=$FAIL"
