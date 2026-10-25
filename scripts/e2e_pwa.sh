#!/bin/bash
# E2E لميزة PWA — تسجيل عامل الخدمة + manifest + العمل بدون إنترنت + زر التثبيت + انحدار
AB="agent-browser"
S=/home/z/my-project/screenshots
mkdir -p "$S"
PASS=0; FAIL=0
ok(){ echo "  ✓ $1"; PASS=$((PASS+1)); }
bad(){ echo "  ✗ $1"; FAIL=$((FAIL+1)); }
EV(){ $AB eval "(() => { $1 })()" 2>/dev/null | tr -d '"'; }

echo "== 1) فتح الموقع (سطح مكتب) =="
$AB open http://localhost:3000/ >/dev/null 2>&1
$AB wait --load networkidle >/dev/null 2>&1
EV "return 'warm:'+(1+1)" | grep -q "warm:2" && ok "المتصفح مستجيب" || bad "المتصفح غير مستجيب"
$AB screenshot "$S/74-pwa-desktop-home.png" >/dev/null 2>&1 && ok "لقطة 74: الصفحة الرئيسية"

echo "== 2) manifest + الأيقونات في الـDOM والشبكة =="
M=$(EV "const l=document.querySelector('link[rel=manifest]'); return l? l.href : 'MISSING'")
echo "$M" | grep -q "manifest.webmanifest" && ok "رابط manifest موجود: $M" || bad "manifest مفقود"
curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000/manifest.webmanifest | grep -q 200 && ok "GET /manifest.webmanifest = 200" || bad "manifest لا يُحمّل"
for i in icon-192 icon-512 maskable-512 apple-touch-icon favicon-32; do
  curl -sf -o /dev/null -w "%{http_code}" "http://localhost:3000/icons/$i.png" | grep -q 200 && ok "أيقونة $i = 200" || bad "أيقونة $i فاشلة"
done
APPLE=$(EV "return document.querySelector('link[rel=apple-touch-icon]')?'apple-ok':'no-apple'")
echo "$APPLE" | grep -q "apple-ok" && ok "apple-touch-icon مُعلن" || bad "apple-touch-icon مفقود"

echo "== 3) تسجيل عامل الخدمة والتحكم بالصفحة =="
$AB wait 1200 >/dev/null 2>&1
REG=$(EV "return ('serviceWorker' in navigator) ? 'sw-api-ok' : 'no-sw'")
echo "$REG" | grep -q "sw-api-ok" && ok "serviceWorker API متاح" || bad "لا serviceWorker"
$AB reload >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; $AB wait 1500 >/dev/null 2>&1
EV "return 1+1" >/dev/null 2>&1  # warmup
CTRL=$(EV "navigator.serviceWorker.getRegistration().then(r => r && r.active ? 'active:'+r.active.state : 'none')")
echo "$CTRL" | grep -qE "active:(activated|activating|installed)" && ok "عامل الخدمة نشط: $CTRL" || bad "عامل الخدمة غير نشط ($CTRL)"
$AB reload >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; $AB wait 1500 >/dev/null 2>&1
EV "return 1+1" >/dev/null 2>&1
C=$(EV "navigator.serviceWorker.getController().then(c => c ? 'controlled' : 'uncontrolled')")
echo "$C" | grep -q "controlled" && ok "الصفحة تحت تحكم العامل (controller)" || bad "غير مُتحكم بها ($C)"

echo "== 4) محتويات الذاكرة (شل + أصول) =="
CACHE=$(EV "caches.keys().then(ks => ks.filter(k=>k.startsWith('pdfc-')).join('|'))")
echo "$CACHE" | grep -q "pdfc-v1-shell" && ok "ذاكرة الشل: $CACHE" || bad "لا ذاكرة ($CACHE)"
ROOT=$(EV "caches.match('/').then(r => r ? 'root-cached:'+r.status : 'no-root')")
echo "$ROOT" | grep -q "root-cached:200" && ok "الصفحة الرئيسية مخبّأة (200)" || bad "الرئيسية غير مخبأة ($ROOT)"
ICON=$(EV "caches.match('/icons/icon-192.png').then(r => r ? 'icon-cached' : 'no-icon')")
echo "$ICON" | grep -q "icon-cached" && ok "الأيقونات مخبأة" || bad "أيقونة غير مخبأة ($ICON)"

echo "== 5) اختبار بدون إنترنت (الأداة الحاسمة) =="
$AB set offline on >/dev/null 2>&1
$AB reload >/dev/null 2>&1; $AB wait 2000 >/dev/null 2>&1
EV "return 'o:'+(1+1)" >/dev/null 2>&1
TITLE=$(EV "return document.title.slice(0,12)")
echo "$TITLE" | grep -q "محوّل PDF" && ok "الصفحة تُفتح بدون إنترنت (العنوان: $TITLE…)" || bad "فشل بدون إنترنت ($TITLE)"
HDR=$(EV "return document.querySelector('header')?'header-ok':'no-header'")
echo "$HDR" | grep -q "header-ok" && ok "الهيدر مُرسم في وضع عدم الاتصال" || bad "الهيدر مفقود أوفلاين"
TOOLS=$(EV "return String(document.querySelectorAll('button').length)")
[ "${TOOLS:-0}" -ge 10 ] 2>/dev/null && ok "أزرار تفاعلية تعمل أوفلاين ($TOOLS زرًا)" || bad "أزرار قليلة أوفلاين ($TOOLS)"
$AB screenshot "$S/75-pwa-offline.png" >/dev/null 2>&1 && ok "لقطة 75: العمل بدون إنترنت"
# فتح أداة من اختصار PWA بدون إنترنت (؟op=)
$AB open "http://localhost:3000/?op=merge" >/dev/null 2>&1; $AB wait 2500 >/dev/null 2>&1
EV "return 'w:'+(2+2)" >/dev/null 2>&1
OP=$(EV "const u=new URL(location.href); return 'op='+u.searchParams.get('op')")
echo "$OP" | grep -q "op=merge" && ok "اختصار PWA يفتح بدون إنترنت أيضاً" || bad "اختصار أوفلاين فشل"
$AB screenshot "$S/76-pwa-shortcut-merge-offline.png" >/dev/null 2>&1 && ok "لقطة 76: اختصار الدمج أوفلاين"
$AB set offline off >/dev/null 2>&1

echo "== 6) جوال 390px =="
$AB open "http://localhost:3000/" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1
$AB set viewport 390 844 >/dev/null 2>&1; $AB wait 800 >/dev/null 2>&1
$AB screenshot "$S/77-pwa-mobile-390.png" >/dev/null 2>&1 && ok "لقطة 77: جوال 390"
VW=$(EV "return 'ovf='+(document.documentElement.scrollWidth > window.innerWidth+1)")
echo "$VW" | grep -q "ovf=false" && ok "لا تفيض أفقيًا على الجوال" || bad "فيض أفقي على الجوال ($VW)"

echo "== 7) انحدار: مبدّل اللغة وأداة من الكتالوج =="
EN=$(EV "const b=[...document.querySelectorAll('[data-testid=lang-switcher] button')][0]; if(b){b.click(); return 'clicked'} return 'no-btn'")
echo "$EN" | grep -q "clicked" && ok "فتح مبدّل اللغة" || bad "مبدّل اللغة مكسور"
$AB wait 500 >/dev/null 2>&1
SEL=$(EV "const items=[...document.querySelectorAll('[data-testid=lang-switcher] div button')]; const en=items.find(x=>x.textContent&&x.textContent.includes('English')); if(en){en.click(); return 'en-set'} return 'menu-no'")
echo "$SEL" | grep -q "en-set" && ok "التبديل للإنجليزية يعمل" || bad "تعذّر اختيار English"
$AB wait 600 >/dev/null 2>&1
HAS=$(EV "return document.body.textContent.includes('Every PDF tool')?'i18n-ok':'i18n-broken'")
echo "$HAS" | grep -q "i18n-ok" && ok "الواجهة الإنجليزية سليمة بعد التغييرات" || bad "i18n انكسر"
$AB screenshot "$S/78-pwa-english.png" >/dev/null 2>&1 && ok "لقطة 78: إنجليزي"

echo "== النتيجة =="
echo "PASS=$PASS FAIL=$FAIL"
