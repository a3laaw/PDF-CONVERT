# دليل النشر على Google Cloud Run — محوّل PDF

الحاوية جاهزة (Dockerfile ثلاثي المراحل على bun) وبناء الإنتاج مُتحقق منه محليًا.
كل معالجة الملفات تحدث في متصفح المستخدم، فالخادم خفيف جدًا — **الحد المجاني يغطيك بالكامل**.

---

## 0) المتطلبات (مرة واحدة)

1. حساب Google عادي.
2. إنشاء مشروع من: https://console.cloud.google.com/projectcreate — احتفظ بـ **Project ID**.
3. تفعيل الفوترة للمشروع (تُطلب بطاقة للتقعيد فقط — لن يُخصم شيء ضمن الحد المجاني):
   https://console.cloud.google.com/billing

**الحد المجاني الشهري (Cloud Run):** 2 مليون طلب + 360,000 GB-ثانية ذاكرة + 180,000 vCPU-ثانية.
بناء Cloud Build: 120 دقيقة/يوم مجانًا. Artifact Registry: 0.5GB مجانًا.
هذا التطبيق (معالجة 100% في المتصفح) يستهلك جزءًا ضئيلًا من ذلك.

---

## الخيار أ — Cloud Shell من المتصفح (الأسهل، بلا تثبيت)

1. افتح: https://shell.cloud.google.com (نفس حساب المشروع).
2. انسخ المستودع وادخل إليه:
   ```bash
   git clone https://github.com/a3laaw/PDF-CONVERT.git && cd PDF-CONVERT
   ```
3. نفّذ أمر النشر (ضع Project ID مكان `MY_PROJECT`):
   ```bash
   chmod +x deploy/cloudrun-deploy.sh
   ./deploy/cloudrun-deploy.sh MY_PROJECT me-central1
   ```
4. أول سؤال `gcloud` سيسألك عن المنطقة — اختر الافتراضي الممرر. في النهاية يطبع رابطًا مثل:
   `https://pdf-converter-xxxx.a.run.app` — هذا هو موقعك المنشور.

## الخيار ب — من جهازك (gcloud مثبت محليًا)

```bash
gcloud auth login
gcloud components update
cd PDF-CONVERT
./deploy/cloudrun-deploy.sh MY_PROJECT me-central1
```

## الخيار ج — نشر تلقائي مع GitHub (CI/CD — الأفضل استمرارًا)

1. بعد دفع المستودع إلى GitHub، افتح:
   https://console.cloud.google.com/cloud-build/triggers
2. «Connect Repository» → اربط `a3laaw/PDF-CONVERT`.
3. أنشئ Trigger على فرع `main` بالنوع **Deploy to Cloud Run** (يقرأ Dockerfile تلقائيًا).
4. من بعدها: كل `git push` = بناء ونشر تلقائي — لا خطوة يدوية أبدًا.

---

## ملاحظات

- **المنطقة**: `me-central1` (الدوحة) أقرب للكويت/الخليج. بدائل: `me-west1` أو `europe-west1`.
- **التحديثات**: أعد أمر النشر نفسه — Cloud Build يبني الطبقات المتغيرة فقط غالبًا فيسرع.
- **PWA**: تعمل مباشرة على نطاق `*.run.app` (HTTPS مجاني تلقائي + عامل الخدمة يُسجل في الإنتاج فقط).
- **نطاق مخصص** (اختياري): Cloud Run → Manage Custom Domains — مجاني، شهادة تلقائية.
- **كبح التكلفة**: `--max-instances 10` مضبوط في السكربت — لو تجاوز الحد المجاني بشكل خيالي يتوقف التوسع عند 10.
- **الأسرار**: لا حاجة لأي متغيرات بيئة — لا قواعد بيانات ولا مفاتيح خارجية.

## حالة ما قبل النشر (متحقق منها محليًا)

- [x] `bun run build` ينجح (EXIT=0) — 8 مسارات (1 ثابت + 7 API ديناميكية).
- [x] الخادم المستقل `server.js` يعمل: الصفحة 200 + wasm محرك أوتوكاد 10.8MB يُخدم.
- [x] عامل الخدمة (PWA) يتفعل في الإنتاج فقط — سلوك صحيح على Cloud Run.
- [x] `.dockerignore` يستبعد الاختبارات والأسرار ويُبقي `patch_dxf_converter.mjs` اللازم لـ postinstall.
