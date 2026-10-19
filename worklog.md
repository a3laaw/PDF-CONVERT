# Worklog

---
Task ID: 1
Agent: Main Agent (Z.ai)
Task: تطوير نسخة محسّنة من «محطّة PDF» بميزة جديدة: تحويل ملفات AutoCAD (DWG/DXF) وRevit (RVT) وملفات Adobe (PSD/AI/EPS/INDD) إلى PDF — بناءً على طلب المستخدم «تحويل اتوكاد وريفيت وبقيت ادوبي الي pdf»

Work Log:
- حُمّلت مهارة fullstack-drive وتهيأت البيئة (Next.js 16 + App Router على المنفذ 3000)
- فحصت أدوات النظام: ezdxf 1.4.3، PyMuPDF (fitz)، Ghostscript، LibreOffice، reportlab، matplotlib متوفرة؛ ثُبّتت psd-tools 1.25.0 وolefile وarabic-reshaper وpython-bidi (بـ --break-system-packages للمفسّر الصحيح python3 -m pip)
- LibreDWG غير مثبت ولا يمكن تثبيته (لا sudo) → مسار DWG = أفضل جهد (استخراج المعاينة المدمجة)
- بنيت محرك التحويل scripts/convert_to_pdf.py (~590 سطر):
  * DXF → متجهي كامل عبر ezdxf + matplotlib (خلفية بيضاء/خطوط سوداء، تخطيطات ورق غير الفارغة، حتى 12 صفحة)
  * DWG → استخراج معاينة DIB المدمجة (image sentinel + brute-force BITMAPINFOHEADER) + كشف الإصدار AC10xx
  * RVT → حاوية OLE عبر olefile (تدفقات RevitPreview/BasicFileInfo + كشف إصدار Revit) مع fallback مسح PNG/JPEG/BMP
  * INDD → مسح أكبر JPEG مدمج
  * PSD → psd-tools composite مع تسطيح الخلفية البيضاء، fallback إلى Pillow
  * AI → PyMuPDF مباشرة (توافق PDF) مع fallback Ghostscript؛ EPS/PS → Ghostscript مع -dEPSCrop
  * الصور (PNG/JPG/WebP/BMP/TIFF/GIF) → Pillow مع دعم إطارات TIFF متعددة
  * PDF → تمرير؛ merge (fitz insert_pdf)؛ thumb (مصغرة PNG)
  * بروتوكول: السطر الأخير من stdout هو @@RESULT@@{json}؛ تحويل stdout المكتبات إلى stderr
  * صفحات معلومات PDF ب reportlab مع تشكيل عربي سليم (arabic_reshaper + bidi) وخط DejaVu
- أصلحت 3 أخطاء أثناء الاختبار: drawImage لا يقبل BytesIO (استُخدم ImageReader)؛ ezdxf 1.4 يتطلب config في Frontend constructor؛ أُضيف معالج INDD المفقود
- اختبرت المحرك على 9 عينات مولّدة (scripts/make_samples.py: DXF/PSD/AI/EPS مكتوبة يدوياً، DWG مركّب بsentinel+DIB، RVT بحاوية OLE حقيقية من LibreOffice + JPEG ملحق، INDD blob) — جميعها نجحت + الدمج
- بنيت طبقة الخادم: src/lib/server-convert.ts (spawn python، مهلة 240s، تنظيف تلقائي >2 ساعة، UUID guard ضد path traversal، meta JSON لكل ناتج) + 4 مسارات API:
  * POST /api/convert (حتى 15 ملف، 80MB للملف، رفض مع تبرير، تنفيذ متوازٍ محدود 3)
  * GET /api/file/[id] (inline للمعاينة / attachment مع filename* UTF-8 للأسماء العربية)
  * POST /api/merge (دمج حتى 20 PDF)
  * POST /api/zip (JSZip مع حفظ الأسماء العربية وتفادي التكرار)
- اختبارات curl E2E ناجحة: تحويل DXF/DWG/RVT، تنزيل باسم عربي، دمج 3 ملفات (4 صفحات)، ZIP بمحتويات عربية
- بنيت الواجهة (عربي RTL مطابق لهوية «محطّة PDF»): src/lib/convert-formats.ts (9 صيغ مع تسميات جودة صادقة) + src/components/pdf-station/convert-studio.tsx (~750 سطر: سحب وإفلات، قائمة انتظار بحالات لكل ملف، شريط تقدم، بطاقات نتائج بمصغرات، حوار معاينة iframe، دمج الكل، تنزيل ZIP، قسم صيغ، FAQ صادق حول قيود DWG/RVT/INDD)
- دمجت في التطبيق: تبويب ثالث «استوديو التحويل» في header-bar مع شارة خصوصية متغيرة حسب العرض؛ قسم تشويقي ConvertTeaser في الرئيسية؛ إدخال في CommandPalette (Ctrl+K)؛ تحديث metadata layout.tsx بكلمات مفتاحية للتحويل؛ تذييل متكيّف
- خضعت لتحقق متصفح agent-browser مكثف واكتشفت خللاً: طلبات POST المتوازية من التطبيق تتدلى في خادم تطوير Next.js/Turbopack (المشكلة ظهرت كطلبات pending لا تصل الخادم أبداً)
- أصلحت في الواجهة: معالجة تسلسلية للملفات + fetchWithTimeout (AbortController: 240s تحويل / 90s دمج-zip) + إعادة محاولة تلقائية واحدة
- أكملت التحقق E2E من المتصفح بعد حل قيد بيئة الاختبار (ملفات CDP المرفقة تكون 0-byte وغير قابلة للقراءة في sandbox → استُخدم File في الذاكرة بمحتوى DXF حقيقي مُدخل عبر DataTransfer + حدث change): التحويل عبر واجهة التطبيق نجح في 3.2s، النتائج ظهرت بمصغرة متجهية صحيحة، نافذة المعاينة بعارض PDF كامل تعمل، التجاوب على 390px ممتاز
- لمسات أخيرة: تخطي تخطيطات DXF الفارغة + أرقام هندية في الملاحظات؛ lint نهائي نظيف (0 أخطاء/0 تحذيرات)

Stage Summary:
- النسخة المحسّنة من «محطّة PDF» مكتملة وتعمل: استوديو تحويل CAD/Adobe→PDF بمحرك Python حقيقي + 4 مسارات API + واجهة عربية RTL متكاملة
- جودة التحويل صادقة ومعلنة: DXF/AI/EPS متجهي 100%، PSD تسطيح، DWG/RVT/INDD أفضل جهد (معاينة مدمجة + معلومات) مع شرح السبب في الواجهة
- ملفات المستخدم: يُحذف الأصل فور التحويل والنواتج بعد ساعتين تلقائياً
- الملفات الرئيسية: scripts/convert_to_pdf.py، src/lib/server-convert.ts، src/lib/convert-formats.ts، src/app/api/{convert,file/[id],merge,zip}/route.ts، src/components/pdf-station/convert-studio.tsx، تعديلات page/header-bar/command-palette/layout
- قيد بيئة الاختبار الموثق: رفع ملفات حقيقية عبر agent-browser CDP لا يعمل (0-byte) — الاختبار اليدوي/الإنتاج لا يتأثر (مثبت بـ curl E2E + اختبار File في الذاكرة عبر الواجهة)
