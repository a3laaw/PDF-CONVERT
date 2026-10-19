# 🚀 البرومبت الكامل — مشروع «محطّة PDF»
### الفكرة الكاملة + المواصفات + كل الأكواد — جاهز للنسخ لأي ذكاء اصطناعي أو مطوّر

> **طريقة الاستخدام:** انسخ هذا الملف كاملاً (أو الأجزاء التي تحتاجها) إلى أي نموذج ذكاء اصطناعي أو مطوّر — لبناء المشروع من الصفر، أو إكماله، أو نقله لاستضافة أخرى، أو تطوير نسخة جديدة. كل ما تحتاجه موجود هنا: الفكرة، نموذج العمل، القيود، البنية، المواصفات، ومعايير القبول، ثم **الكود الكامل ملفاً بملف**.

---

## 0) الدور المطلوب منك (أي ذكاء اصطناعي/مطوّر يقرأ هذا)

أنت فريق هندسي متكامل: مهندس بايثون خلفي + مهندس واجهات + مصمم تجربة مستخدم عربي + DevOps. مهمتك بناء/إكمال/صيانة مشروع «محطّة PDF» وفق هذا المستند حرفياً، مع الالتزام الصارم بكل القيود في القسم 4 (وأهمها: **كل شيء بالعربية، لا دارك مود، واجهة منظمة**).

---

## 1) الفكرة في سطر واحد

> **«محطّة PDF»**: كل أدوات PDF وCAD في مكان واحد — أونلاين، مجاني، عربي بالكامل، يفهم أوامرك بالعربية واللهجات ويحوّلها إلى خطوات تنفيذ جاهزة.

---

## 2) المشكلة والحل

**المشكلة:** أدوات PDF المنتشرة إما إنجليزية، أو مبعثرة في عشرات المواقع، أو مدفوعة، أو بواجهات فوضوية وأوضاع داكنة مزعجة. المستخدم العربي يريد: ارفع ← اكتب ما تريد بكلام عادي ← نزّل النتيجة.

**الحل:** موقع + أداة MCP واحدة تحتوي **كل شيء**:
- معالجة PDF كاملة (دمج، ضغط، استخراج، ترقيم، علامات مائية، تشفير، Word، صور، كتيّبات...)
- تحويل ملفات التصميم CAD (DXF مباشرة، DWG/RVT عبر Autodesk APS)
- **محرك فهم أوامر عربي هجين**: يفهم الفصحى والمصرية والخليجية والشامية + الأخطاء الإملائية، ويحوّل جملة مثل «ادمج الملفات ثم صغّر حجمها» إلى خطوات تنفيذ فعلية
- طبقة «هل تقصد؟» عند عدم الوضوح + وصفات/مهام شائعة ذكية حسب الملفات المرفوعة
- مطابقة الخطوط العربية (يُخرج PDF بخط المستند الأصلي) + OCR بتمريرين للملفات الممسوحة

---

## 3) نموذج العمل 💰

**المصدران: الإعلانات + الاشتراكات** — القواعد الأساسية مجانية للجميع بالكامل.

| الخطة | السعر | الحد | المميزات |
|---|---|---|---|
| مجاني | 0$ | 20 عملية/يوم | كل القواعد الأساسية (دمج، ضغط، صفحات، ترقيم، CAD...) + إعلانات |
| شهري | 9$/شهر | بلا حدود | + AI احتياطي + OCR + مطابقة الخطوط + بدون إعلانات |
| سنوي | 79$/سنة (توفير 27%) | بلا حدود | كل مميزات الشهري |

**المنطق:** الأدوات الأساسية مجانية دائماً (جذب زيارات SEO بالعربية) ← إعلانات AdSense ← تحويل جزء لمشتركين عبر مميزات الذكاء والسرعة.

---

## 4) القيود الثابتة — قواعد غير قابلة للمس ⚠️

1. **كل شيء بالعربية** — الواجهة، الرسائل، الأخطاء، التوضيحات، حتى أسماء الملفات المُنزَّلة. التواصل مع المستخدم صاحب المشروع بالعربية أيضاً.
2. **لا دارك مود إطلاقاً** — ثيم فاتح فقط (`#F4F6FB` خلفية، بطاقات بيضاء، أزرق `#4F55E3`)، ولا زر للتبديل للوضع الداكن.
3. **الواجهة منظمة وليست عشوائية** — تدفق مرقّم واضح: **١ الملفات ← ٢ الخطوات ← ٣ مهام شائعة**، مع شريط أمر ذكي في الأعلى.
4. **لغة السوق لا اللغة التقنية** — كل مصطلح تقني يُترجم لعبارة يفهمها المستخدم العادي (انظر جدول القسم 12).
5. **الحلول مبتكرة وغير تقليدية** (محرك اللهجات، «هل تقصد؟»، الوصفات الذكية، مطابقة الخطوط) **وفي نفس الوقت الأسهل والمجاني والأونلاين**.
6. النواة الأساسية تعمل **بدون أي قاعدة بيانات وبدون مفاتيح API** — الذكاء الاحتياطي (Groq/Gemini مجاني) اختياري، والاشتراكات تُدار في طبقة منفصلة.
7. ملفات المستخدم في نسخة الويب العامة **لا تُخزَّن** (Stateless على Vercel) — الخصوصية ميزة تسويقية.

---

## 5) البنية المعمارية 🏗️

```
pdf-tools-mcp/
├── pdf_engine.py          # محرك كل أدوات PDF (1785 سطر): تحويل، تعديل، OCR بتمريرين، خطوط عربية، طبقات بحث
├── cad_engine.py          # محرك CAD: DXF→PDF مباشر (ezdxf+matplotlib)، DWG/RVT عبر Autodesk APS
├── server.py              # أداة MCP واحدة تقدم 36 أداة (mcp / FastMCP / MCPServer)
├── run_webapp.py          # تشغيل الموقع: python3 run_webapp.py → http://localhost:8000
├── webapp/
│   ├── main.py            # خادم FastAPI كامل الحالة (رفع، مصغّرات، تفسير، تنفيذ، معاينة طباعة، سجل)
│   ├── interpreter.py     # المحرك الهجين: قواعد لهجات ضخمة + خطأ إملائي + «هل تقصد؟» + AI احتياطي + وصفات
│   ├── ops.py             # 31 عملية خطوات Stateless (run_op + AUTO_CAD) — قابلة للنقل كما هي
│   └── static/index.html  # الواجهة المحلية (ثيم فاتح منظم + عربية سوق كاملة)
├── api/index.py           # نسخة Vercel Stateless: /api/health /inspect /interpret /run→ZIP /thumb
├── vercel.json            # إعدادات النشر (memory 1024, maxDuration 120)
├── requirements-vercel.txt# حزمة Vercel الخفيفة (بدون tesseract)
├── public/index.html      # واجهة Vercel (الملفات تبقى في المتصفح + تنفيذ ZIP)
├── database/schema.sql    # PostgreSQL: users/plans/subscriptions/usage_log/saved_recipes/shared_files + 3 خطط
└── README.md              # توثيق + دليل النشر على Vercel
```

**مسار التنفيذ:** مستخدم يرفع ملفات ← يكتب طلباً بالعربية (أو يضيف خطوات يدوياً أو يختار مهمة شائعة) ← `interpreter` يحول الكلام إلى `steps[]` ← `ops/engine` ينفّذ الخطوات بالتسلسل (`@prev` يربط مخرجات السابقة) ← تحميل النتائج (مفردة أو ZIP).

---

## 6) المحركات الأساسية ⚙️

### أ) pdf_engine.py — محرك PDF
- **الصيغ:** PyMuPDF (فتح، تعديل، عرض) + pypdf (دمج/تقسيم/تشفير) + Pillow (صور) + reportlab (توليد).
- **العمليات:** دمج، ضغط 3 مستويات، استخراج/حذف/تدوير/ترتيب صفحات، علامة مائية، ترقيم، تشفير/فك، PDF↔صور، استخراج نص، PDF→Word (pdf2docx اختياري)، تسطيح، N-up، كتيّب، صور→PDF.
- **OCR بتمريرين (مبتكر):** تمرير 1: استخراج/تصحيح (deskew) + Tesseract `ara+eng` ← تمرير 2: إعادة المعالجة بجودة أعلى ودمج الطبقات. تحسين تلقائي: deskew + denoise + adaptive threshold.
- **مطابقة الخطوط (مبتكر):** `font=auto` يستخرج خط المستند الأصلي (`doc.extract_font`) ويستخدمه؛ العربي يُرسم صورة PIL بدقة 300dpi بالخط المطابق + **طبقة بحث مخفية**: كل كلمة تُدرج بـ `word[::-1]` مع `render_mode=3` (غير مرئية) ← البحث في PDF الناتج يجدها بالعربية. `_FONT_REGISTRY`: naskh/amiri/kufi/tajawal/cairo/.../times/arial + أي TTF يمرره المستخدم.
- **إدراج نص عربي مزخرف:** `_insert_styled_text` (الحل الفائز المعتمد).

### ب) cad_engine.py — محرك CAD
- **DXF → PDF** مباشرة: ezdxf لتحليل + matplotlib للرسم (طبقات، ألوان AutoCAD، extents fit، هوامش).
- **DWG / RVT → PDF** عبر Autodesk APS (Model Derivative) عند توفر `APS_CLIENT_ID/SECRET`، وإلا رسالة عربية واضحة.
- مصغّرات لملفات CAD، معاينة 2up/4up/booklet.

### ج) interpreter.py — المحرك الهجين للفهم (الميزة الأذكى)
- **المستوى 1 (مجاني فوري):** تطبيع عميق (أ/إ/آ، ة/ه، تشكيل، أرقام هندية) + قاموس نوايا ضخم regex (فصحى + مصري + خليجي + شامي) + كلمات مفردة + **بحث ضبابي للأخطاء الإملائية** («اضعط» → اضغط).
- **تفكيك الجمل المركبة:** «شيل الصفحة التانية ورقمهالهم» ← خطوتان (يجرّب كل «و» ويقطع حيث تفهم كل جهة كأمر مستقل — حذر لأن «واحد» تبدأ بـ و!).
- **استخراج المعطيات:** نطاقات صفحات بكل الصيغ («من 2 لحد 5», «1-3,5»)، زاوية الدوران، كلمة المرور، نص الختم (مسودة/سري/معتمد)، مستوى الضغط (أقصى/خفيف).
- **طبقة «هل تقصد؟»:** عندما يشكك في الفهم، تقترح أقرب الأوامر.
- **المستوى 2 (اختياري مجاني):** Groq/Gemini (OpenAI-compatible) عند الحيرة — بدون مفتاح تكفي القواعد.
- **الوصفات الذكية:** حسب أنواع الملفات المرفوعة (PDF ممسوح → OCR، صور → مستند، CAD → PDF...).
- **مخرجات التفسير بالعربية السوقية:** «دمج 2 ملفات ← تصغير الحجم (قوي) ← ترقيم الصفحات».

---

## 7) واجهة برمجية — كل المسارات (النسخة المحلية الحولية)

| المسار | الدور |
|---|---|
| `POST /api/files` (multipart) | رفع ← `{files:[{id,name,kind,pages,size,scanned,...}]}` |
| `GET /api/files/{fid}/thumb?page&dpi` | مصغّرة PNG |
| `GET /api/files/{fid}/download` | تحميل |
| `DELETE /api/files/{fid}` | حذف |
| `POST /api/interpret` `{text,file_ids,mode}` | تفسير عربي ← `{steps[],explanation,confidence,engine,unknown,recipes}` |
| `POST /api/run` `{steps:[{op,inputs,params,label}]}` | تنفيذ سلسلة ← `{results:[{step,op,duration,outputs[]}]}` |
| `POST /api/print-preview` `{file_id,mode}` | معاينة طباعة 2up/4up/booklet |
| `GET /api/recipes` | مهام شائعة حسب الملفات المرفوعة |
| `GET /api/history` | آخر 30 عملية |
| `GET /api/ops` | قائمة 31 عملية |
| `GET /api/health` | الحالة |

**مراجع المدخلات في الخطوات:** `@prev` (مخرج الخطوة السابقة) · `@step:N` · `@all_pdfs` · `@all_images` · `@all_cad` · أو معرّف ملف مباشر.

---

## 8) عمليات الخطوات (31) 🧩

دمج · ضغط (خفيف/متوسط/قوي) · استخراج صفحات · حذف صفحات · تدوير · ترتيب · فصل · علامة مائية · ترقيم · تشفير/فك · PDF→صور · صور→PDF · استخراج نص · PDF→Word · استبدال نص · إضافة نص · تظليل · تعبئة نموذج · تسطيح · N-up · كتيّب · DXF/DWG/RVT→PDF · تحسين مسح ضوئي · OCR · معاينة صفحة · إرسال للطباعة · ... (القائمة الكاملة في `webapp/ops.py`).

---

## 9) أداة MCP (36 أداة) 🧰

`server.py` يعرض الأداة عبر معيار MCP (FastMCP/MCPServer) لتُستدعى من Claude/Cursor/المحررات: كل أداة PDF + CAD + OCR + الخطوط. تُسجَّل في `claude_desktop_config.example.json`.

---

## 10) نسخة Vercel (Stateless) ☁️

- `api/index.py` بدون أي حالة بين الطلبات: `/api/inspect` (فحص بالمتصفح) · `/api/interpret` · `/api/run` يستقبل ملفات+خطوات multipart ويرجع **ZIP** فيه كل المخرجات + `manifest.json` · `/api/thumb`.
- `public/index.html`: الملفات **تبقى في متصفح المستخدم** (الخصوصية + تجاوز حد 4.5MB) وتُرسل عند التنفيذ فقط.
- `vercel.json`: builds + routes + functions (memory 1024MB, maxDuration 120s).
- **قيود Vercel وحلولها:** لا Tesseract (system binaries) → OCR يُعطَّل في هذه النسخة برسالة واضحة · طلبات ≤4.5MB → الملفات في المتصفح · لا ذاكرة مشتركة → Stateless.
- النشر: `npm i -g vercel && cp requirements-vercel.txt requirements.txt && vercel --prod`.

---

## 11) قاعدة البيانات (طبقة الاشتراكات فقط) 🗄️

النواة تعمل بدون DB. الاشتراكات على PostgreSQL مجاني (Neon/Supabase) + Cloudflare R2 (10GB) للملفات المحفوظة. المخطط في `database/schema.sql`:
- `users` · `plans` (seed: free 0$/20 عملية يومياً، monthly 9$، yearly 79$) · `subscriptions` (Stripe) · `usage_log` (يفرض حد المجاني) · `saved_recipes` (وصفات محفوظة) · `shared_files` (روابط مشاركة مؤقتة).
- مستقبلي: Clerk/Supabase Auth للدخول، Stripe للاشتراكات، AdSense للإعلانات.

---

## 12) قواعد اللغة — من التقني إلى سوق 🗣️

| ❌ لا تستخدم | ✅ استخدم |
|---|---|
| خط العمل / Workflow / خط أنابيب | **الخطوات** |
| ضغط (medium/strong) | **تصغير الحجم (متوسط/قوي)** |
| تسطيح نهائي | **تثبيت نهائي** |
| تشفير | **حماية بكلمة مرور** |
| DPI | **دقة الصورة** |
| صفحات في ورقة | **عدة صفحات في الورقة** |
| سكان / scan | **ممسوح ضوئياً** |
| تفعيل OCR (نص مخفي) | **تفعيل التعرّف الضوئي (نص قابل للبحث)** |
| وصفات سريعة | **مهام شائعة** |
| حزمة الوثائق / نسخة رسمية / جاهز للإيميل | **تجميع المستندات / مستند رسمي / جاهز للإرسال** |
| الأمر الذكي | **اكتب طلبك هنا… مثلاً: «ادمج الملفات ثم صغّر حجمها»** |
| خط أنابيب فارغ (خطأ) | **أضف خطوة واحدة على الأقل** |
| ارفع ملفات اولاً | **أضف ملفاتك أولاً** |

**العد العربي الصحيح:** ملف واحد / ملفان / 3 ملفات / 15 ملفًا — وكذلك خطوة/خطوتان/خطوات.
**أسماء الصيغ تبقى كما هي:** PDF · Word · DXF · DWG · RVT · PNG (أسماء عالمية يفهمها الجميع).

---

## 13) الواجهة — المواصفات البصرية 🎨

- **ثيم فاتح فقط:** خلفية `#F4F6FB`، بطاقات `#FFFFFF`، نص `#1B2438`، أزرق العلامة `#4F55E3`، ظلال ناعمة، حواف 12-14px.
- **البنية:** أعلى = الهوية + شريط الحالة · ثم **شريط الأمر الذكي** (🧠 اكتب طلبك ← «اقترح الخطوات ✦» ← «تنفيذ ⚡») · ثم 3 أعمدة: **١ الملفات** (رفع + مصغّرات + وسوم) | **٢ الخطوات** (مرقّمة مع ↑↓ و✕ وحقول عربية) | **٣ مهام شائعة + ملاحظات**.
- **الخط:** Segoe UI / Noto Sans Arabic / Tajawal.
- **التنبيهات:** بطاقات منزلقة أسفل اليمين (نجاح أخضر/خطأ أحمر) — كلها بالعربية.
- **كشف الانقطاع:** شريط تحذير يشرح الفرق بين «معاينة الملف» (بلا شبكة) و«المعاينة المباشرة» + زر إعادة المحاولة.
- أزرار معاينة الطباعة 🖨️ على كل ملف PDF.

---

## 14) معايير القبول ✅

1. المستخدم يرفع PDF/صور/CAD ← مصغّرات ووسوم (نوع/صفحات/ممسوح) تظهر فوراً.
2. يكتب «ادمج الملفات ثم صغّر حجمها بقوة» ← خطوات مبنية بالعربية: «دمج 2 ملفات ← تصغير الحجم (قوي)».
3. «هل تقصد؟» تظهر عند الكلام الغامض، والوصفات الذكية تتغير حسب الملفات.
4. تنفيذ سلسلة كاملة ← نتائج صحيحة (مخرج لكل خطوة) ← تحميل مباشر.
5. البحث داخل PDF العربي المُولَّد بخط مطابق يجد الكلمات (طبقة `word[::-1]`).
6. **لا كلمة غير عربية مفهومة** في الواجهة (راجع جدول القسم 12) — و**لا دارك مود** — و**البنية مرقّمة منظمة**.
7. نسخة Vercel تعمل Stateless بالكامل (فحص ← تفسير ← تنفيذ → ZIP).
8. كل الأخطاء والرسائل بالعربية وبصياغة السوق.

---

## 15) الكود الكامل — ملفاً بملف 📦

> كل ملف أدناه **كامل كما هو يعمل الآن**. انسخ الملفات بنفس المسارات وشغّل: `pip install -r requirements.txt && python3 run_webapp.py`.
> (داخل كتل الكود أدناه تُستخدم أسوار `~~~~` حتى لا تتأثر بأي علامات ``` داخل الكود.)

---


## 📄 `pdf_engine.py`
**المحرك الرئيسي — كل أدوات PDF + OCR + مطابقة الخطوط العربية** — (1785 سطر)

~~~~
"""
pdf_engine.py — محرك معالجة PDF الأساسي
=========================================
كل دوال المعالجة موجودة هنا بشكل مستقل تماماً عن MCP،
حتى يمكن إعادة استخدامه لاحقاً في:
  - موقع ويب (Flask / FastAPI / Node...)
  - تطبيق سطح مكتب
  - سطر أوامر (CLI)

الاعتمادات: pypdf, pymupdf (fitz), pillow, pdf2docx (اختياري)
"""

from __future__ import annotations

import io
import os
import re
import json
import shutil
from pathlib import Path
from typing import Any, Iterable, Sequence

from pypdf import PdfReader, PdfWriter
import pymupdf  # PyMuPDF 2.x (كان يُعرف بـ fitz)
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# أدوات مساعدة عامة
# ---------------------------------------------------------------------------


class PDFEngineError(Exception):
    """خطأ مفهوم منطقياً يمكن عرضه مباشرة على المستخدم."""


def _p(path: str | os.PathLike) -> Path:
    """تحويل المسار إلى Path مطلق والتحقق من وجوده."""
    path = Path(path).expanduser()
    if not path.exists():
        raise PDFEngineError(f"الملف غير موجود: {path}")
    return path.resolve()


def _out(path: str | os.PathLike) -> Path:
    """تحضير مسار الإخراج: إنشاء المجلد الأب وإرجاع Path مطلق."""
    path = Path(path).expanduser().resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _new_path(output: str | os.PathLike, default_name: str, default_dir: str | None = None) -> Path:
    """إذا كان output مجلداً (أو فارغاً) نولّد اسماً افتراضياً بداخله."""
    if output:
        path = Path(output).expanduser()
        if str(output).endswith(("/", "\\")) or (path.exists() and path.is_dir()):
            path = path / default_name
        return _out(path)
    return _out(Path(default_dir or ".") / default_name)


def parse_pages(spec: str | None, total: int) -> list[int]:
    """
    تحويل مواصفات الصفحات إلى فهارس صفرية.
    الأمثلة المدعومة (الترقيم يبدأ من 1 كما يراه المستخدم):
        "all" أو "" أو None   -> كل الصفحات
        "3"                   -> الصفحة 3 فقط
        "1-3,5,7-9"           -> نطاقات مفصولة بفواصل
        "2-"                  -> من 2 حتى النهاية
        "-4"                  -> من البداية حتى 4
    """
    if total <= 0:
        raise PDFEngineError("ملف PDF لا يحتوي على صفحات.")

    if spec is None or str(spec).strip() == "" or str(spec).strip().lower() == "all":
        return list(range(total))

    pages: set[int] = set()
    for token in str(spec).split(","):
        token = token.strip()
        if not token:
            continue
        m = re.fullmatch(r"(\d*)\s*-\s*(\d*)", token)
        if m:
            start_s, end_s = m.group(1), m.group(2)
            if not start_s and not end_s:
                raise PDFEngineError(f"نطاق غير صالح: '{token}'")
            start = int(start_s) if start_s else 1
            end = int(end_s) if end_s else total
            if start < 1 or end > total or start > end:
                raise PDFEngineError(f"النطاق '{token}' خارج حدود الملف (1-{total}).")
            pages.update(range(start - 1, end))
        elif token.isdigit():
            n = int(token)
            if n < 1 or n > total:
                raise PDFEngineError(f"رقم الصفحة '{n}' خارج حدود الملف (1-{total}).")
            pages.add(n - 1)
        else:
            raise PDFEngineError(f"وصف صفحات غير صالح: '{token}'")

    if not pages:
        raise PDFEngineError("لم يتم تحديد أي صفحة صالحة.")
    return sorted(pages)


def _group_pages(spec: str | None, total: int) -> list[list[int]]:
    """مثل parse_pages لكن يحافظ على تجميع النطاقات (كل نطاق = مجموعة)."""
    if spec is None or str(spec).strip() == "" or str(spec).strip().lower() == "all":
        return [list(range(total))]
    groups: list[list[int]] = []
    for token in str(spec).split(","):
        token = token.strip()
        if token:
            groups.append(parse_pages(token, total))
    if not groups:
        raise PDFEngineError("لم يتم تحديد أي نطاق صفحات.")
    return groups


def _fmt_size(n: int | float) -> str:
    n = float(n)
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.1f} {unit}" if unit != "B" else f"{int(n)} B"
        n /= 1024
    return f"{n:.1f} GB"


def _human_bytes(before: int, after: int) -> dict[str, Any]:
    saved = before - after
    pct = (saved / before * 100) if before else 0.0
    return {
        "before_bytes": before,
        "after_bytes": after,
        "before_human": _fmt_size(before),
        "after_human": _fmt_size(after),
        "saved_bytes": max(saved, 0),
        "saved_percent": round(max(pct, 0.0), 1),
    }


# ---------------------------------------------------------------------------
# المعلومات والاستعلام
# ---------------------------------------------------------------------------


def pdf_info(path: str) -> dict[str, Any]:
    """معلومات شاملة عن ملف PDF: عدد الصفحات، المقاسات، البيانات الوصفية، التشفير..."""
    p = _p(path)
    reader = PdfReader(str(p))
    encrypted = reader.is_encrypted
    meta = reader.metadata or {}

    sizes: list[dict[str, Any]] = []
    try:
        for i, page in enumerate(reader.pages):
            box = page.mediabox
            sizes.append({
                "page": i + 1,
                "width_pt": round(float(box.width), 1),
                "height_pt": round(float(box.height), 1),
            })
    except Exception:
        sizes = []

    return {
        "file": str(p),
        "file_size_bytes": p.stat().st_size,
        "file_size_human": _fmt_size(p.stat().st_size),
        "pages": len(reader.pages),
        "encrypted": bool(encrypted),
        "metadata": {
            "title": meta.get("/Title"),
            "author": meta.get("/Author"),
            "subject": meta.get("/Subject"),
            "creator": meta.get("/Creator"),
            "producer": meta.get("/Producer"),
            "creation_date": str(meta.get("/CreationDate") or ""),
        },
        "page_sizes": sizes[:20],  # أول 20 صفحة فقط للإيجاز
    }


def pdf_page_count(path: str) -> int:
    """عدد صفحات ملف PDF."""
    p = _p(path)
    return len(PdfReader(str(p)).pages)


# ---------------------------------------------------------------------------
# الدمج والفصل
# ---------------------------------------------------------------------------


def pdf_merge(inputs: Sequence[str], output: str) -> dict[str, Any]:
    """دمج عدة ملفات PDF في ملف واحد (بنفس الترتيب المُعطى)."""
    if not inputs:
        raise PDFEngineError("يجب تحديد ملف واحد على الأقل للدمج.")
    out = _out(output)
    writer = PdfWriter()
    total_pages = 0
    merged: list[str] = []

    for src in inputs:
        sp = _p(src)
        reader = PdfReader(str(sp))
        for page in reader.pages:
            writer.add_page(page)
        total_pages += len(reader.pages)
        merged.append(str(sp))

    with open(out, "wb") as f:
        writer.write(f)

    return {
        "success": True,
        "output": str(out),
        "output_size_human": _fmt_size(out.stat().st_size),
        "input_files": merged,
        "total_pages": total_pages,
    }


def pdf_split(
    path: str,
    output_dir: str,
    every_n_pages: int | None = None,
    ranges: Sequence[str] | None = None,
) -> dict[str, Any]:
    """
    فصل ملف PDF إلى عدة ملفات:
      - every_n_pages: كل N صفحات في ملف (الافتراضي 1 = كل صفحة لوحدها)
      - ranges: قائمة نطاقات مثل ["1-3", "4-10", "11-"] — لكل نطاق ملف
    """
    p = _p(path)
    odir = Path(output_dir).expanduser().resolve()
    odir.mkdir(parents=True, exist_ok=True)

    reader = PdfReader(str(p))
    total = len(reader.pages)
    stem = p.stem
    outputs: list[str] = []

    if ranges:
        for i, group in enumerate(_group_pages(",".join(ranges), total), start=1):
            writer = PdfWriter()
            for idx in group:
                writer.add_page(reader.pages[idx])
            name = f"{stem}_part{i:02d}_p{group[0]+1}-{group[-1]+1}.pdf"
            out = odir / name
            with open(out, "wb") as f:
                writer.write(f)
            outputs.append(str(out))
    else:
        n = int(every_n_pages or 1)
        if n < 1:
            raise PDFEngineError("every_n_pages يجب أن يكون 1 أو أكثر.")
        part = 0
        for start in range(0, total, n):
            part += 1
            writer = PdfWriter()
            end = min(start + n, total)
            for idx in range(start, end):
                writer.add_page(reader.pages[idx])
            name = f"{stem}_part{part:02d}_p{start+1}-{end}.pdf"
            out = odir / name
            with open(out, "wb") as f:
                writer.write(f)
            outputs.append(str(out))

    return {
        "success": True,
        "source": str(p),
        "total_pages": total,
        "files_created": len(outputs),
        "outputs": outputs,
    }


def pdf_extract_pages(path: str, pages: str, output: str) -> dict[str, Any]:
    """استخراج صفحات محددة إلى ملف PDF جديد (مثال: pages='1-3,7')."""
    p = _p(path)
    out = _new_path(output, f"{p.stem}_extracted.pdf")
    reader = PdfReader(str(p))
    idxs = parse_pages(pages, len(reader.pages))

    writer = PdfWriter()
    for i in idxs:
        writer.add_page(reader.pages[i])

    with open(out, "wb") as f:
        writer.write(f)

    return {
        "success": True,
        "output": str(out),
        "extracted_pages": [i + 1 for i in idxs],
        "pages_count": len(idxs),
        "output_size_human": _fmt_size(out.stat().st_size),
    }


def pdf_delete_pages(path: str, pages: str, output: str) -> dict[str, Any]:
    """حذف صفحات محددة من ملف PDF (مثال: pages='2,5-7')."""
    p = _p(path)
    out = _new_path(output, f"{p.stem}_deleted.pdf")
    reader = PdfReader(str(p))
    total = len(reader.pages)
    to_delete = set(parse_pages(pages, total))
    keep = [i for i in range(total) if i not in to_delete]
    if not keep:
        raise PDFEngineError("لا يمكن حذف كل الصفحات — احتفظ بصفحة واحدة على الأقل.")

    writer = PdfWriter()
    for i in keep:
        writer.add_page(reader.pages[i])

    with open(out, "wb") as f:
        writer.write(f)

    return {
        "success": True,
        "output": str(out),
        "deleted_pages": sorted(i + 1 for i in to_delete),
        "remaining_pages": len(keep),
    }


def pdf_reorder_pages(path: str, order: str, output: str) -> dict[str, Any]:
    """
    إعادة ترتيب الصفحات و/أو تكرارها.
    مثال: order='3,1,1,2' -> الصفحة 3 أولاً، ثم 1 مرتين، ثم 2.
    """
    p = _p(path)
    out = _new_path(output, f"{p.stem}_reordered.pdf")
    reader = PdfReader(str(p))
    idxs = parse_pages(order, len(reader.pages))  # parse_pages يقبل التكرار هنا عبر split يدوي

    # parse_pages تُزيل التكرارات، نحتاج الترتيب الحرفي:
    manual: list[int] = []
    for token in str(order).split(","):
        token = token.strip()
        if not token:
            continue
        manual.extend(parse_pages(token, len(reader.pages)))

    writer = PdfWriter()
    for i in manual:
        writer.add_page(reader.pages[i])

    with open(out, "wb") as f:
        writer.write(f)

    return {
        "success": True,
        "output": str(out),
        "new_order": [i + 1 for i in manual],
        "pages_count": len(manual),
    }


# ---------------------------------------------------------------------------
# التدوير والضغط
# ---------------------------------------------------------------------------


def pdf_rotate(path: str, degrees: int, output: str, pages: str | None = None) -> dict[str, Any]:
    """تدوير صفحات PDF بزاوية 90/180/270 (كل الصفحات أو صفحات محددة)."""
    if degrees % 90 != 0:
        raise PDFEngineError("الزاوية يجب أن تكون من مضاعفات 90 (90 أو 180 أو 270).")
    p = _p(path)
    out = _new_path(output, f"{p.stem}_rotated.pdf")
    reader = PdfReader(str(p))
    total = len(reader.pages)
    targets = set(parse_pages(pages, total))

    writer = PdfWriter()
    for i, page in enumerate(reader.pages):
        if i in targets:
            page.rotate(degrees % 360)
        writer.add_page(page)

    with open(out, "wb") as f:
        writer.write(f)

    return {
        "success": True,
        "output": str(out),
        "rotated_pages": sorted(i + 1 for i in targets),
        "degrees": degrees % 360,
    }


def pdf_compress(path: str, output: str, level: str = "medium") -> dict[str, Any]:
    """
    ضغط ملف PDF.
    المستويات:
      - light:  تنظيف بسيط وضغط عام (بدون فقدان جودة الصور)
      - medium: تنظيف أعمق + ضغط الصور والخطوط
      - strong: إعادة ترميز الصور بدقة أقل (قد يقلل جودة الصور قليلاً)
    """
    p = _p(path)
    out = _new_path(output, f"{p.stem}_compressed.pdf")
    level = (level or "medium").lower()
    if level not in ("light", "medium", "strong"):
        raise PDFEngineError("المستوى يجب أن يكون: light أو medium أو strong.")

    doc = pymupdf.open(str(p))

    if level == "strong":
        # إعادة ترميز الصور المضمنة: أقصى ضلع 1200px وجودة JPEG 60
        max_dim, quality = 1200, 60
        for page in doc:
            for info in page.get_images(full=True):
                xref = info[0]
                try:
                    pix = pymupdf.Pixmap(doc, xref)
                    if pix.alpha:
                        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                    elif pix.n - pix.alpha >= 4:  # CMYK -> RGB
                        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                    img = Image.frombytes("RGB" if pix.n == 3 else "L", (pix.width, pix.height), pix.samples)
                    if max(img.size) > max_dim:
                        ratio = max_dim / max(img.size)
                        img = img.resize((max(1, int(img.width * ratio)), max(1, int(img.height * ratio))), Image.LANCZOS)
                    buf = io.BytesIO()
                    img.save(buf, "JPEG", quality=quality, optimize=True)
                    page.replace_image(xref, stream=buf.getvalue())
                except Exception:
                    continue  # نتجاوز الصور التي لا يمكن معالجتها

    save_kwargs: dict[str, Any]
    if level == "light":
        save_kwargs = {"garbage": 1, "deflate": True}
    elif level == "medium":
        save_kwargs = {"garbage": 3, "deflate": True, "clean": True, "deflate_images": True, "deflate_fonts": True}
    else:  # strong
        save_kwargs = {"garbage": 4, "deflate": True, "clean": True, "deflate_images": True, "deflate_fonts": True}

    try:
        doc.subset_fonts()
    except Exception:
        pass

    doc.save(str(out), **save_kwargs)
    doc.close()

    before = p.stat().st_size
    after = out.stat().st_size
    result = {"success": True, "output": str(out), "level": level}
    result.update(_human_bytes(before, after))
    return result


# ---------------------------------------------------------------------------
# التحويل: صور / نص / وورد
# ---------------------------------------------------------------------------


def pdf_to_images(
    path: str,
    output_dir: str,
    image_format: str = "png",
    dpi: int = 150,
    pages: str | None = None,
) -> dict[str, Any]:
    """تحويل صفحات PDF إلى صور (PNG أو JPG)."""
    p = _p(path)
    odir = Path(output_dir).expanduser().resolve()
    odir.mkdir(parents=True, exist_ok=True)
    fmt = (image_format or "png").lower().lstrip(".")
    if fmt in ("jpg", "jpeg"):
        fmt = "jpg"
    if fmt not in ("png", "jpg"):
        raise PDFEngineError("الصيغة يجب أن تكون png أو jpg.")
    dpi = max(36, min(int(dpi), 600))

    doc = pymupdf.open(str(p))
    idxs = parse_pages(pages, len(doc))
    mat = pymupdf.Matrix(dpi / 72.0, dpi / 72.0)
    outputs: list[str] = []

    for i in idxs:
        pix = doc[i].get_pixmap(matrix=mat, alpha=False)
        name = f"{p.stem}_page{i+1:03d}.{fmt}"
        out = odir / name
        if fmt == "jpg":
            Image.frombytes("RGB", (pix.width, pix.height), pix.samples).save(out, "JPEG", quality=90, optimize=True)
        else:
            pix.save(str(out))
        outputs.append(str(out))

    return {
        "success": True,
        "source": str(p),
        "dpi": dpi,
        "format": fmt,
        "files_created": len(outputs),
        "outputs": outputs,
    }


def images_to_pdf(images: Sequence[str], output: str, page_size: str | "None" = None) -> dict[str, Any]:
    """
    دمج صور (PNG/JPG...) في ملف PDF واحد — كل صورة صفحة.
    page_size: 'image' (حجم الصورة نفسها، الافتراضي) أو 'a4' (تُوَزَّع داخل A4).
    """
    if not images:
        raise PDFEngineError("يجب تحديد صورة واحدة على الأقل.")
    out = _out(output)
    mode = (page_size or "image").lower()
    if mode not in ("image", "a4"):
        raise PDFEngineError("page_size يجب أن تكون image أو a4.")

    pil_images: list[Image.Image] = []
    for src in images:
        sp = _p(src)
        im = Image.open(sp)
        if im.mode in ("RGBA", "P", "LA"):
            im = im.convert("RGB")
        elif im.mode != "RGB":
            im = im.convert("RGB")
        if mode == "a4":
            a4 = Image.new("RGB", (1240, 1754), "white")  # A4 @ 150dpi
            im.thumbnail((a4.width - 40, a4.height - 40), Image.LANCZOS)
            a4.paste(im, ((a4.width - im.width) // 2, (a4.height - im.height) // 2))
            im = a4
        pil_images.append(im)

    first, rest = pil_images[0], pil_images[1:]
    first.save(out, "PDF", save_all=True, append_images=rest, resolution=150)
    for im in pil_images:
        im.close()

    return {
        "success": True,
        "output": str(out),
        "images_count": len(images),
        "output_size_human": _fmt_size(out.stat().st_size),
    }


def pdf_to_text(path: str, pages: str | None = None) -> dict[str, Any]:
    """استخراج النص من صفحات PDF (بترقيم الصفحات)."""
    p = _p(path)
    doc = pymupdf.open(str(p))
    idxs = parse_pages(pages, len(doc))
    page_texts = []
    full: list[str] = []
    for i in idxs:
        text = doc[i].get_text().strip()
        page_texts.append({"page": i + 1, "text": text})
        full.append(f"--- صفحة {i + 1} ---\n{text}")
    empty_pages = sum(1 for t in page_texts if not t["text"])
    result = {
        "success": True,
        "source": str(p),
        "pages_extracted": len(idxs),
        "pages": page_texts,
        "full_text": "\n\n".join(full),
    }
    if empty_pages > len(idxs) * 0.6:
        result["warning"] = ("أغلب الصفحات فارغة — يبدو أن الملف ممسوحاً ضوئياً (صورة). "
                             "شغّل pdf_ocr أولاً لتفعيل استخراج النص.")
        result["likely_scanned"] = True
    return result


def pdf_to_word(path: str, output: str) -> dict[str, Any]:
    """تحويل PDF إلى ملف Word (docx) — يحافظ على النصوص والجداول قدر الإمكان."""
    try:
        from pdf2docx import Converter
    except ImportError:
        raise PDFEngineError("مكتبة pdf2docx غير مثبتة — نفّذ: pip install pdf2docx")

    p = _p(path)
    out = _new_path(output, f"{p.stem}.docx")
    cv = Converter(str(p))
    try:
        cv.convert(str(out))
    finally:
        cv.close()

    return {
        "success": True,
        "output": str(out),
        "output_size_human": _fmt_size(out.stat().st_size),
        "note": "التحويل تلقائي — قد يحتاج بعض الملفات المعقّدة مراجعة يدوية.",
    }


# ---------------------------------------------------------------------------
# العلامات المائية والترقيم والتشفير
# ---------------------------------------------------------------------------


def _measure_font(size: int, fontfile: str | None = None) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if fontfile and Path(fontfile).exists():
        try:
            return ImageFont.truetype(fontfile, size)
        except Exception:
            pass
    for name in ("DejaVuSans.ttf", "Arial.ttf", "arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def _make_watermark_png(
    width: int,
    height: int,
    text: str,
    angle: float,
    opacity: float,
    font_size: int,
    color: tuple[int, int, int],
    fontfile: str | None = None,
) -> bytes:
    """صناعة صورة علامة مائية شفافة بنص مائل — بالخط المطلوب إن وُجد."""
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    font = _measure_font(font_size, fontfile)

    # رسم النص على لوح أصغر ثم تدويره وتكراره
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    txt_img = Image.new("RGBA", (tw + 20, th + 20), (0, 0, 0, 0))
    txt_draw = ImageDraw.Draw(txt_img)
    alpha = int(max(0, min(1, opacity)) * 255)
    txt_draw.text((10, 10), text, font=font, fill=(*color, alpha))

    rotated = txt_img.rotate(angle, expand=True, resample=Image.BICUBIC)

    # توزيع النص على الصفحة بنمط شبكي متباعد
    step_x = max(rotated.width + int(width * 0.12), 200)
    step_y = max(rotated.height + int(height * 0.18), 120)
    y = -rotated.height // 2
    row = 0
    while y < height:
        x = (-rotated.width // 2) + (step_x // 2 if row % 2 else 0)
        while x < width:
            layer.alpha_composite(rotated, (x, y))
            x += step_x
        y += step_y
        row += 1

    buf = io.BytesIO()
    layer.save(buf, "PNG")
    return buf.getvalue()


def pdf_watermark(
    path: str,
    output: str,
    text: str | None = None,
    watermark_pdf: str | None = None,
    opacity: float = 0.18,
    angle: float = 45,
    font_size: int = 42,
    pages: str | None = None,
    font: str | None = None,
) -> dict[str, Any]:
    """
    إضافة علامة مائية:
      - text: نص العلامة المائية (يُرسم بشكل متكرر ومائل)
      - watermark_pdf: أو استخدم الصفحة الأولى من ملف PDF آخر كعلامة مائية
      - font: "naskh"/"amiri"/... أو مسار خط .ttf — لتكون العلامة بنفس خط المستند
    """
    if not text and not watermark_pdf:
        raise PDFEngineError("حدد إما نص العلامة المائية (text) أو ملف PDF (watermark_pdf).")

    p = _p(path)
    out = _new_path(output, f"{p.stem}_watermarked.pdf")
    doc = pymupdf.open(str(p))
    idxs = set(parse_pages(pages, len(doc)))
    fontfile = find_font_file(font) if font else (_resolve_font(doc, None, "auto") if text else None)

    stamp_png: bytes | None = None
    if watermark_pdf:
        wp = _p(watermark_pdf)
        wdoc = pymupdf.open(str(wp))
        pix = wdoc[0].get_pixmap(alpha=True)
        stamp_png = pix.tobytes("png")
        wdoc.close()

    for i in idxs:
        page = doc[i]
        rect = page.rect
        if stamp_png:
            # إدراج صورة العلامة المائية بحجم الصفحة مع الحفاظ على النسب
            page.insert_image(rect, stream=stamp_png, keep_proportion=True, overlay=True)
        else:
            w = max(int(rect.width), 100)
            h = max(int(rect.height), 100)
            # العربي يحتاج تشكيل العرض (bidi) قبل الرسم على الصورة
            draw_text = text or ""
            if _contains_arabic(draw_text):
                try:
                    import arabic_reshaper
                    from bidi.algorithm import get_display
                    draw_text = get_display(arabic_reshaper.ArabicReshaper().reshape(draw_text))
                except Exception:
                    pass
            png = _make_watermark_png(w, h, draw_text, angle, opacity, font_size, (80, 80, 80), fontfile)
            page.insert_image(rect, stream=png, overlay=True)

    doc.save(str(out), garbage=3, deflate=True)
    doc.close()

    return {
        "success": True,
        "output": str(out),
        "watermarked_pages": sorted(i + 1 for i in idxs),
        "type": "pdf-stamp" if watermark_pdf else "text",
        "font_used": Path(fontfile).name if fontfile else "default",
    }


def pdf_add_page_numbers(
    path: str,
    output: str,
    start_number: int = 1,
    position: str = "bottom-center",
    font_size: int = 12,
    pages: str | None = None,
) -> dict[str, Any]:
    """إضافة أرقام صفحات إلى PDF. position: bottom-center / bottom-right / bottom-left / top-center."""
    p = _p(path)
    out = _new_path(output, f"{p.stem}_numbered.pdf")
    doc = pymupdf.open(str(p))
    idxs = set(parse_pages(pages, len(doc)))
    pos = (position or "bottom-center").lower()

    for n, i in enumerate(sorted(idxs), start=start_number):
        page = doc[i]
        rect = page.rect
        label = str(n)
        tw = pymupdf.get_text_length(label, fontsize=font_size)

        if pos == "bottom-center":
            x, y = (rect.width - tw) / 2, rect.height - 18
        elif pos == "bottom-right":
            x, y = rect.width - tw - 24, rect.height - 18
        elif pos == "bottom-left":
            x, y = 24, rect.height - 18
        elif pos == "top-center":
            x, y = (rect.width - tw) / 2, 28
        else:
            raise PDFEngineError("position غير معروفة — استخدم bottom-center أو bottom-right أو bottom-left أو top-center.")

        page.insert_text(pymupdf.Point(x, y), label, fontsize=font_size, color=(0, 0, 0))

    doc.save(str(out), garbage=3, deflate=True)
    doc.close()

    return {
        "success": True,
        "output": str(out),
        "numbered_pages": sorted(i + 1 for i in idxs),
        "start_number": start_number,
        "position": pos,
    }


# ---------------------------------------------------------------------------
# التشفير وفك التشفير
# ---------------------------------------------------------------------------


def pdf_encrypt(path: str, password: str, output: str) -> dict[str, Any]:
    """تشفير PDF بكلمة مرور (تُطلب عند الفتح)."""
    if not password:
        raise PDFEngineError("كلمة المرور لا يمكن أن تكون فارغة.")
    p = _p(path)
    out = _new_path(output, f"{p.stem}_encrypted.pdf")
    reader = PdfReader(str(p))
    if reader.is_encrypted:
        raise PDFEngineError("الملف مشفّر أصلاً — استخدم pdf_decrypt أولاً.")

    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt(password)

    with open(out, "wb") as f:
        writer.write(f)

    return {"success": True, "output": str(out), "encrypted": True}


def pdf_decrypt(path: str, password: str, output: str) -> dict[str, Any]:
    """فك تشفير PDF بكلمة المرور."""
    p = _p(path)
    out = _new_path(output, f"{p.stem}_decrypted.pdf")
    reader = PdfReader(str(p))
    if reader.is_encrypted:
        if not reader.decrypt(password):
            raise PDFEngineError("كلمة المرور غير صحيحة.")

    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)

    with open(out, "wb") as f:
        writer.write(f)

    return {"success": True, "output": str(out), "encrypted": False}


# ---------------------------------------------------------------------------
# التعديل على محتوى PDF
# ---------------------------------------------------------------------------

_AR_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F]")


def _contains_arabic(text: str) -> bool:
    return bool(_AR_RE.search(text))


def _find_arabic_font() -> str | None:
    """البحث عن خط يدعم العربية (Noto / Arial / DejaVu)."""
    candidates = [
        "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
        "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for c in candidates:
        if Path(c).exists():
            return c
    return None


def _insert_text_box(page, rect, text, fontsize, color, align=0) -> None:
    """إدراج نص داخل مستطيل — يدعم العربية عبر insert_htmlbox (تشكيل RTL صحيح)."""
    if _contains_arabic(text):
        import html as _html
        escaped = _html.escape(text)
        css = f"font-family: sans-serif; font-size: {fontsize}pt; color: rgb({color[0]*255:.0f},{color[1]*255:.0f},{color[2]*255:.0f});"
        page.insert_htmlbox(rect, f"<div style='{css}'>{escaped}</div>")
    else:
        page.insert_textbox(rect, text, fontsize=fontsize, color=color, align=align)


def pdf_edit_text(
    path: str,
    search: str,
    replace: str,
    output: str,
    pages: str | None = None,
    font: str = "auto",
) -> dict[str, Any]:
    """
    البحث عن نص واستبداله (تعديل النص الموجود فعلياً) — **بنفس خط المستند الأصلي**.
    font:
      - "auto"/"match": مطابقة تلقائية — يستخرج الخط الأصلي المدمج في الملف ويستخدمه
      - "naskh" / "amiri" / "kufi" / "tajawal" / ... : خط من المكتبة
      - مسار ملف خط (.ttf): خطك الخاص
    """
    if not search:
        raise PDFEngineError("نص البحث لا يمكن أن يكون فارغاً.")
    p = _p(path)
    out = _new_path(output, f"{p.stem}_edited.pdf")
    doc = pymupdf.open(str(p))
    idxs = set(parse_pages(pages, len(doc)))
    report = []
    total_hits = 0
    fonts_used: set[str] = set()

    for i in sorted(idxs):
        page = doc[i]
        hits = _search_text(page, search)
        if not hits:
            continue
        total_hits += len(hits)
        pending_visible: list[tuple[Any, float, str | None, tuple]] = []
        image_based = _page_is_image_based(page)
        for r in hits:
            style = _span_style_for(page, r)
            size = (style or {}).get("size") or max(6.0, min(r.height * 0.72, 72.0))
            color_int = (style or {}).get("color", 0)
            rgb = (((color_int >> 16) & 255) / 255, ((color_int >> 8) & 255) / 255, (color_int & 255) / 255)
            fontfile = _resolve_font(doc, (style or {}).get("font"), font)
            if fontfile:
                fonts_used.add(Path(fontfile).name)
            fill = (1, 1, 1) if image_based else False  # مسح ضوئي: تبييض لطمس الصورة

            if replace and _contains_arabic(replace):
                # اشطب ثم أدرج البديل العربي بشكل مرئي (تشكيل صحيح + الخط المطابق)
                page.add_redact_annot(r, fill=fill, cross_out=False)
                pending_visible.append((r, size, fontfile, rgb))
            else:
                if fontfile:
                    # بديل لاتيني بخط مطابق
                    page.add_redact_annot(r, fill=fill, cross_out=False)
                    pending_visible.append((r, size, fontfile, rgb))
                else:
                    page.add_redact_annot(r, text=replace, fontsize=size, fontname="helv",
                                          fill=fill, text_color=rgb, cross_out=False)
        page.apply_redactions()
        for r, fs, ff, rgb in pending_visible:
            _insert_styled_text(page, r, replace, fs, ff, rgb)
        report.append({"page": i + 1, "replacements": len(hits)})

    if total_hits == 0:
        raise PDFEngineError(f"لم يُعثر على النص: '{search}'")

    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return {
        "success": True,
        "output": str(out),
        "total_replacements": total_hits,
        "details": report,
        "fonts_used": sorted(fonts_used),
        "font_mode": font,
    }


def _insert_styled_text(page, rect, text: str, fontsize: float, fontfile: str | None, rgb: tuple) -> None:
    """
    إدراج النص البديل بشكل مرئي **بنفس الخط المطابق**:
      - عربي: يُرسم كصورة دقيقة بالخط المطلوب (تشكيل RTL صحيح)
        + طبقة نص مخفية للبحث والاستخراج — نفس تقنية Acrobat الاحترافية
      - لاتيني: insert_text بالخط المطابق (نص حقيقي قابل للبحث والنسخ)
    """
    if _contains_arabic(text):
        # 1) الطبقة البصرية: صورة عالية الدقة بالخط المطابق
        try:
            import arabic_reshaper
            from bidi.algorithm import get_display
            vis = get_display(arabic_reshaper.ArabicReshaper().reshape(text))
        except Exception:
            vis = text
        dpi = 300.0
        scale = dpi / 72.0
        font_px = max(8, int(fontsize * scale))
        fnt = ImageFont.truetype(fontfile, font_px) if (fontfile and Path(fontfile).exists()) else _measure_font(font_px)
        color255 = (int(rgb[0] * 255), int(rgb[1] * 255), int(rgb[2] * 255), 255)

        probe = ImageDraw.Draw(Image.new("RGBA", (8, 8)))
        bbox = probe.textbbox((0, 0), vis, font=fnt)
        tw, th = (bbox[2] - bbox[0]) + 24, (bbox[3] - bbox[1]) + 24
        img = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
        ImageDraw.Draw(img).text((12 - bbox[0], 12 - bbox[1]), vis, font=fnt, fill=color255)
        buf = io.BytesIO()
        img.save(buf, "PNG")

        w_pt, h_pt = tw / scale, th / scale
        cy = (rect.y0 + rect.y1) / 2 if rect.height > 1 else rect.y0 + fontsize / 2
        r = pymupdf.Rect(rect.x0, cy - h_pt / 2, rect.x0 + w_pt, cy + h_pt / 2)
        page.insert_image(r, stream=buf.getvalue(), overlay=True)

        # 2) الطبقة المخفية: نص منطقي للبحث (مقلوب — هندسة PDF تعيده صحيح)
        try:
            page.insert_text(
                pymupdf.Point(rect.x0, cy + fontsize * 0.35),
                text[::-1],
                fontsize=fontsize,
                render_mode=3,
                fontname="djv",
                fontfile=find_font_file("dejavu"),
            )
        except Exception:
            pass
    else:
        kwargs = {"fontsize": fontsize, "color": rgb}
        if fontfile:
            kwargs["fontname"] = "match"
            kwargs["fontfile"] = fontfile
        page.insert_text(pymupdf.Point(rect.x0, max(rect.y1 - fontsize * 0.25, fontsize)), text, **kwargs)


def pdf_add_text(
    path: str,
    text: str,
    output: str,
    x: float = 72,
    y: float = 72,
    font_size: float = 12,
    color: str = "#000000",
    pages: str | None = None,
    rotate: int = 0,
    font: str | None = None,
) -> dict[str, Any]:
    """
    إضافة نص جديد على صفحات PDF (بالإحداثيات من أعلى-يسار الصفحة بالنقاط Point).
    يدعم العربية بشكل صحيح (تشكيل RTL). rotate: 0/90/180/270.
    font: "naskh"/"amiri"/"kufi"/... أو مسار خط .ttf (الافتراضي: خط النظام).
    """
    p = _p(path)
    out = _new_path(output, f"{p.stem}_text_added.pdf")
    doc = pymupdf.open(str(p))
    idxs = set(parse_pages(pages, len(doc)))

    color_rgb = _hex_to_rgb(color)
    fontfile = find_font_file(font) if font else None
    for i in sorted(idxs):
        page = doc[i]
        if rotate % 90 != 0:
            raise PDFEngineError("التدوير يجب أن يكون من مضاعفات 90.")
        if _contains_arabic(text):
            # رسم بالخط المطابق + طبقة بحث مخفية (نفس آلية التعديل)
            w = len(text) * font_size * 0.7 + 60
            rect = pymupdf.Rect(x, y - font_size * 1.3, x + w, y + font_size * 0.7)
            _insert_styled_text(page, rect, text, font_size, fontfile,
                                tuple(c / 255 for c in color_rgb))
        else:
            kwargs = {"fontsize": font_size, "color": tuple(c / 255 for c in color_rgb), "rotate": rotate}
            if fontfile:
                kwargs["fontname"] = "match"
                kwargs["fontfile"] = fontfile
            page.insert_text(pymupdf.Point(x, y), text, **kwargs)

    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return {"success": True, "output": str(out), "pages_modified": sorted(i + 1 for i in idxs),
            "font_used": Path(fontfile).name if fontfile else "default"}


def _hex_to_rgb(color: str) -> tuple[int, int, int]:
    color = (color or "#000000").lstrip("#")
    if len(color) == 3:
        color = "".join(c * 2 for c in color)
    if len(color) != 6:
        raise PDFEngineError(f"لون غير صالح: '{color}' — استخدم صيغة #RRGGBB")
    return tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore


def pdf_add_image(
    path: str,
    image: str,
    output: str,
    x: float = 72,
    y: float = 72,
    width: float = 200,
    height: float | None = None,
    pages: str | None = "1",
    opacity: float = 1.0,
) -> dict[str, Any]:
    """إضافة/ختم صورة على صفحات PDF (إحداثيات من أعلى-يسار بالنقاط)."""
    p = _p(path)
    img_p = _p(image)
    out = _new_path(output, f"{p.stem}_image_added.pdf")
    doc = pymupdf.open(str(p))
    idxs = set(parse_pages(pages, len(doc)))

    with Image.open(img_p) as im:
        ratio = im.height / im.width
    h = height if height else width * ratio

    for i in sorted(idxs):
        rect = pymupdf.Rect(x, y, x + width, y + h)
        doc[i].insert_image(rect, filename=str(img_p), keep_proportion=True, overlay=True)

    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return {
        "success": True,
        "output": str(out),
        "pages_modified": sorted(i + 1 for i in idxs),
        "rect": {"x": x, "y": y, "width": width, "height": h},
    }


def pdf_highlight_text(
    path: str,
    search: str,
    output: str,
    color: str = "#FFFF00",
    pages: str | None = None,
) -> dict[str, Any]:
    """تظليل كل occurrences لنص معيّن (تمييز — highlight)."""
    p = _p(path)
    out = _new_path(output, f"{p.stem}_highlighted.pdf")
    doc = pymupdf.open(str(p))
    idxs = set(parse_pages(pages, len(doc)))
    rgb = tuple(c / 255 for c in _hex_to_rgb(color))
    report, total = [], 0

    for i in sorted(idxs):
        page = doc[i]
        hits = _search_text(page, search)
        for r in hits:
            annot = page.add_highlight_annot(r)
            annot.set_colors(stroke=rgb)
            annot.update()
        if hits:
            report.append({"page": i + 1, "highlights": len(hits)})
            total += len(hits)

    if total == 0:
        raise PDFEngineError(f"لم يُعثر على النص: '{search}'")

    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return {"success": True, "output": str(out), "total_highlights": total, "details": report}


def pdf_add_note(
    path: str,
    note_text: str,
    output: str,
    page_number: int = 1,
    x: float = 100,
    y: float = 100,
    author: str = "PDF Tools",
    color: str = "#FFF2A8",
) -> dict[str, Any]:
    """إضافة ملاحظة لاصقة (sticky note / تعليق) على صفحة."""
    p = _p(path)
    out = _new_path(output, f"{p.stem}_noted.pdf")
    doc = pymupdf.open(str(p))
    if page_number < 1 or page_number > len(doc):
        raise PDFEngineError(f"رقم الصفحة {page_number} خارج النطاق (1-{len(doc)}).")
    rgb = tuple(c / 255 for c in _hex_to_rgb(color))
    page = doc[page_number - 1]
    annot = page.add_text_annot(pymupdf.Point(x, y), note_text, icon="Comment")
    annot.set_info(title=author)
    annot.set_colors(stroke=rgb)
    annot.update()
    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return {"success": True, "output": str(out), "page": page_number}


def pdf_fill_form(path: str, fields: dict[str, Any], output: str) -> dict[str, Any]:
    """
    تعبئة نموذج PDF (AcroForms) — يقبل حقول: نص، اختيار (checkbox)، قوائم.
    fields = {"name": "أحمد", "date": "2026-10-19", "agree": True}
    """
    p = _p(path)
    out = _new_path(output, f"{p.stem}_filled.pdf")
    doc = pymupdf.open(str(p))
    filled, missing = [], []

    available: dict[str, str] = {}
    for page in doc:
        for widget in page.widgets() or []:
            available[widget.field_name] = widget.field_type_string

    for key, value in fields.items():
        done = False
        for page in doc:
            for widget in page.widgets() or []:
                if widget.field_name == key:
                    if isinstance(value, bool):
                        widget.field_value = bool(value)
                    else:
                        widget.field_value = str(value)
                    widget.update()
                    done = True
        (filled if done else missing).append(key)

    if not filled:
        raise PDFEngineError(f"لم يُملأ أي حقل. الحقول المتوفرة: {list(available.keys()) or 'لا توجد حقول في الملف'}")

    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return {
        "success": True,
        "output": str(out),
        "filled_fields": filled,
        "missing_fields": missing,
        "available_fields": available,
    }


def pdf_list_form_fields(path: str) -> dict[str, Any]:
    """عرض حقول النموذج المتوفرة في PDF (الأسماء والأنواع) — مفيد قبل التعبئة."""
    p = _p(path)
    doc = pymupdf.open(str(p))
    fields: dict[str, str] = {}
    for page in doc:
        for widget in page.widgets() or []:
            fields[widget.field_name] = widget.field_type_string
    return {"success": True, "source": str(p), "fields": fields}


def pdf_flatten(path: str, output: str) -> dict[str, Any]:
    """تسطيح (flatten) الملاحظات وحقول النماذج داخل محتوى الصفحة — طباعة آمنة نهائية."""
    p = _p(path)
    out = _new_path(output, f"{p.stem}_flattened.pdf")
    doc = pymupdf.open(str(p))
    doc.bake(annots=True, widgets=True)
    doc.save(str(out), garbage=3, deflate=True)
    doc.close()
    return {"success": True, "output": str(out), "note": "تم تسطيح كل الملاحظات والحقول داخل محتوى الصفحة."}


# ---------------------------------------------------------------------------
# العرض والطباعة
# ---------------------------------------------------------------------------


def pdf_render_page(
    path: str,
    page_number: int,
    output: str,
    dpi: int = 150,
    image_format: str = "png",
) -> dict[str, Any]:
    """معاينة/عرض صفحة واحدة كصورة (للمراجعة أو الإظهار للمستخدم)."""
    p = _p(path)
    doc = pymupdf.open(str(p))
    if page_number < 1 or page_number > len(doc):
        raise PDFEngineError(f"رقم الصفحة {page_number} خارج النطاق (1-{len(doc)}).")
    fmt = (image_format or "png").lower().lstrip(".")
    fmt = "jpg" if fmt in ("jpg", "jpeg") else "png"
    if not output:
        output = str(p.parent / f"{p.stem}_preview_p{page_number}.{fmt}")
    out = _out(output)

    pix = doc[page_number - 1].get_pixmap(matrix=pymupdf.Matrix(dpi / 72.0, dpi / 72.0), alpha=False)
    if fmt == "jpg":
        Image.frombytes("RGB", (pix.width, pix.height), pix.samples).save(out, "JPEG", quality=90)
    else:
        pix.save(str(out))
    doc.close()
    return {
        "success": True,
        "output": str(out),
        "page": page_number,
        "width": pix.width,
        "height": pix.height,
        "dpi": dpi,
    }


def pdf_print(
    path: str,
    printer: str | None = None,
    copies: int = 1,
    pages: str | None = None,
    duplex: bool = False,
) -> dict[str, Any]:
    """
    إرسال PDF إلى طابعة النظام مباشرة.
    - Windows: الطباعة عبر نظام Windows
    - macOS/Linux: عبر نظام CUPS (lp)
    printer: اسم الطابعة (اختياري — الافتراضية للنظام)، copies: عدد النسخ، duplex: طباعة وجهين.
    """
    import platform
    import subprocess

    p = _p(path)
    copies = max(1, int(copies))
    system = platform.system()

    if system == "Windows":
        try:
            import os as _os
            if printer:
                powershell = (
                    f'Start-Process -FilePath "{p}" -Verb Print -PassThru | '
                    f'Out-Null'
                )
                # طباعة على طابعة محددة عبر SumatraPDF إن وُجد، وإلا الافتراضية
                r = subprocess.run(["powershell", "-Command", powershell], capture_output=True, text=True, timeout=60)
            else:
                _os.startfile(str(p), "print")
                r = None
            return {
                "success": True,
                "source": str(p),
                "printer": printer or "الافتراضية",
                "copies": copies,
                "platform": system,
                "message": "أُرسل الملف إلى الطابعة.",
            }
        except Exception as e:
            raise PDFEngineError(f"فشلت الطباعة على Windows: {e}")

    # macOS / Linux → CUPS
    lp = shutil.which("lp")
    if not lp:
        raise PDFEngineError("نظام الطباعة CUPS غير متوفر على هذا الجهاز.")
    cmd = [lp, "-n", str(copies)]
    if printer:
        cmd += ["-d", printer]
    if pages:
        cmd += ["-o", f"page-ranges={pages}"]
    if duplex:
        cmd += ["-o", "sides=two-sided-long-edge"]
    cmd.append(str(p))
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if r.returncode != 0:
        raise PDFEngineError(f"فشل إرسال الطباعة: {r.stderr.strip() or r.stdout.strip()}")
    return {
        "success": True,
        "source": str(p),
        "printer": printer or "الافتراضية",
        "copies": copies,
        "platform": system,
        "message": r.stdout.strip() or "أُرسل الملف إلى الطابعة.",
    }


def pdf_impose(path: str, output: str, pages_per_sheet: int = 2) -> dict[str, Any]:
    """
    تجهيز PDF للطباعة الاقتصادية: عدة صفحات في الورقة الواحدة (N-up).
    pages_per_sheet: 2 (جانب-بجانب) أو 4 (شبكة 2×2) أو 6 (2×3) أو 9 (3×3).
    """
    grids = {2: (1, 2), 4: (2, 2), 6: (2, 3), 9: (3, 3)}
    if pages_per_sheet not in grids:
        raise PDFEngineError("pages_per_sheet يجب أن يكون 2 أو 4 أو 6 أو 9.")
    rows, cols = grids[pages_per_sheet]

    p = _p(path)
    out = _new_path(output, f"{p.stem}_{pages_per_sheet}up.pdf")
    src = pymupdf.open(str(p))
    dest = pymupdf.open()
    total = len(src)

    # مقاس الورقة: A4 — أفقي لـ 2-up، رأسي للبقية
    if pages_per_sheet == 2:
        sw, sh = 842, 595  # A4 landscape
    else:
        sw, sh = 595, 842  # A4 portrait

    cell_w = sw / cols
    cell_h = sh / rows
    margin = 8

    for start in range(0, total, pages_per_sheet):
        sheet = dest.new_page(width=sw, height=sh)
        for k in range(pages_per_sheet):
            idx = start + k
            if idx >= total:
                break
            r, c = divmod(k, cols)
            rect = pymupdf.Rect(
                c * cell_w + margin,
                r * cell_h + margin,
                (c + 1) * cell_w - margin,
                (r + 1) * cell_h - margin,
            )
            sheet.show_pdf_page(rect, src, idx, keep_proportion=True)

    dest.save(str(out), garbage=3, deflate=True)
    dest.close()
    src.close()
    return {
        "success": True,
        "output": str(out),
        "source_pages": total,
        "pages_per_sheet": pages_per_sheet,
        "sheets": (total + pages_per_sheet - 1) // pages_per_sheet,
    }


def pdf_booklet(path: str, output: str, sheet_size: str = "a4") -> dict[str, Any]:
    """
    تجهيز PDF ككتيّب للطباعة على وجهين (saddle-stitch / تجليد سرجي).
    كل ورقة تحتوي صفحتين؛ تُطبع وجهين ثم تُطوى في المنتصف.
    """
    p = _p(path)
    out = _new_path(output, f"{p.stem}_booklet.pdf")
    src = pymupdf.open(str(p))
    total = len(src)

    # حشو إلى أقرب مضاعف لـ 4
    padded = ((total + 3) // 4) * 4

    def page_at(n: int):  # n يبدأ من 1
        return (n - 1) if n <= total else None  # None = صفحة فارغة

    dest = pymupdf.open()
    if sheet_size == "a3":
        sw, sh = 1191, 842  # A3 landscape
    else:
        sw, sh = 842, 595  # A4 landscape
    half = sw / 2

    # ترتيب الكتيّب الكلاسيكي
    for i in range(0, padded // 2, 2):
        left_front = padded - i
        right_front = 1 + i
        left_back = 2 + i
        right_back = padded - 1 - i

        for pair in ((left_front, right_front), (left_back, right_back)):
            sheet = dest.new_page(width=sw, height=sh)
            for slot, n in enumerate(pair):
                src_idx = page_at(n)
                if src_idx is None:
                    continue
                rect = pymupdf.Rect(slot * half, 0, (slot + 1) * half, sh)
                sheet.show_pdf_page(rect, src, src_idx, keep_proportion=True)

    dest.save(str(out), garbage=3, deflate=True)
    dest.close()
    src.close()
    return {
        "success": True,
        "output": str(out),
        "source_pages": total,
        "padded_pages": padded,
        "sheets": padded // 2,
        "note": "اطبع وجهين (flip on long edge) ثم اطُو في المنتصف.",
    }


# ---------------------------------------------------------------------------
# نظام الخطوط — مطابقة الخط الأصلي + مكتبة الخطوط
# ---------------------------------------------------------------------------

_FONT_SEARCH_DIRS = [
    Path("/usr/share/fonts"),
    Path("/usr/local/share/fonts"),
    Path.home() / ".fonts",
    Path.home() / ".local/share/fonts",
    Path("C:/Windows/Fonts"),
    Path.home() / "AppData/Local/Microsoft/Windows/Fonts",
    Path("/System/Library/Fonts"),
    Path("/Library/Fonts"),
]

# أسماء ودّية → ملفات خطوط مرشّحة (أول الموجود يُستخدم)
_FONT_REGISTRY: dict[str, list[str]] = {
    "naskh": ["NotoNaskhArabic-Regular.ttf", "NotoNaskhArabic.ttf", "TraditionalArabic.ttf", "ScheherazadeNew-Regular.ttf"],
    "naskh-bold": ["NotoNaskhArabic-Bold.ttf", "TraditionalArabicbd.ttf"],
    "amiri": ["Amiri-Regular.ttf", "Amiri.ttf"],
    "amiri-bold": ["Amiri-Bold.ttf"],
    "kufi": ["NotoKufiArabic-Regular.ttf", "NotoKufiArabic.ttf"],
    "dejavu": ["DejaVuSans.ttf", "dejavu.ttf"],
    "tajawal": ["Tajawal-Regular.ttf", "Tajawal.ttf"],
    "cairo": ["Cairo-Regular.ttf", "Cairo.ttf"],
    "scheherazade": ["ScheherazadeNew-Regular.ttf", "Scheherazade-Regular.ttf"],
    "times": ["times.ttf", "TimesNewRoman.ttf", "TimesNewRomanPSMT.ttf"],
    "arial": ["arial.ttf", "Arial.ttf"],
    "calibri": ["calibri.ttf", "Calibri.ttf"],
}


def find_font_file(name_or_path: str) -> str | None:
    """
    إيجاد ملف خط: إما مسار صريح، أو اسم ودي (naskh, amiri, kufi...)،
    أو اسم ملف/عائلة خط موجود في النظام.
    """
    if not name_or_path:
        return None
    cand = Path(name_or_path).expanduser()
    if cand.is_file():
        return str(cand.resolve())

    key = name_or_path.strip().lower()
    targets: list[str] = list(_FONT_REGISTRY.get(key, []))
    targets.append(name_or_path if name_or_path.lower().endswith((".ttf", ".otf")) else "")
    targets.append(name_or_path.replace(" ", "") + ".ttf")

    for base in _FONT_SEARCH_DIRS:
        if not base.exists():
            continue
        try:
            for f in base.rglob("*"):
                if f.suffix.lower() not in (".ttf", ".otf", ".ttc"):
                    continue
                if f.name in targets or f.stem == name_or_path or f.stem.replace(" ", "") == name_or_path.replace(" ", ""):
                    return str(f.resolve())
        except Exception:
            continue
    return None


def list_fonts() -> dict[str, Any]:
    """قائمة الخطوط العربية المتاحة على النظام (للاستخدام في الإضافة/التعديل/العلامة المائية)."""
    found: dict[str, str] = {}
    for key, names in _FONT_REGISTRY.items():
        for n in names:
            p = find_font_file(n)
            if p:
                found[key] = p
                break
    return {"success": True, "available_fonts": found}


def pdf_get_fonts(path: str, pages: str | None = None) -> dict[str, Any]:
    """عرض الخطوط المستخدمة داخل ملف PDF (اسم الخط، النوع، هل هو مدمج)."""
    p = _p(path)
    doc = pymupdf.open(str(p))
    idxs = set(parse_pages(pages, len(doc)))
    report = []
    for i in sorted(idxs):
        for f in doc[i].get_fonts(full=True):
            xref, ext, ftype, basefont, name, encoding = (list(f) + [None] * 6)[:6]
            report.append({
                "page": i + 1,
                "xref": xref,
                "base_font": basefont,
                "type": ftype,
                "extension": ext,
                "embedded": bool(xref and xref > 0),
            })
    doc.close()
    return {"success": True, "source": str(p), "fonts": report}


def _span_style_for(page, rect) -> dict[str, Any] | None:
    """التقاط خصائص النص الأصلي (خط/حجم/لون) من المنطقة المطابقة."""
    try:
        d = page.get_text("dict")
    except Exception:
        return None
    best_inter, best = 0.0, None
    for block in d.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                try:
                    sb = pymupdf.Rect(span["bbox"])
                    inter = (sb & rect).get_area()
                except Exception:
                    continue
                if inter > best_inter:
                    best_inter, best = inter, span
    if best:
        return {"font": best.get("font", ""), "size": best.get("size", 12.0),
                "color": best.get("color", 0)}
    return None


def _embedded_font_file(doc, font_name: str) -> str | None:
    """استخراج ملف الخط المدمج من داخل PDF نفسه (أدق مطابقة ممكنة)."""
    if not font_name:
        return None
    base = font_name.split("+")[-1].replace(" ", "").lower()
    cache = Path(__file__).parent / "webapp" / "data" / "fonts"
    cache.mkdir(parents=True, exist_ok=True)
    try:
        for pno in range(len(doc)):
            for f in doc[pno].get_fonts(full=True):
                xref, ext, ftype, basefont = f[0], f[1], f[2], f[3]
                bf = (basefont or "").replace(" ", "").lower()
                if xref and (bf == base or bf.endswith(base) or base.endswith(bf)):
                    name, ext2, typ, content = doc.extract_font(xref)
                    if content and ext2 in ("ttf", "otf", "ttc"):
                        out = cache / f"{base}_{xref}.{ext2}"
                        if not out.exists():
                            out.write_bytes(content)
                        return str(out)
    except Exception:
        return None
    return None


def _resolve_font(doc, style_font_name: str | None, font_param: str | None) -> str | None:
    """
    تحديد ملف الخط المناسب للنص البديل:
      font=auto/match → الخط الأصلي المدمج في المستند ← ثم خط نظامي بنفس الاسم ← نسخ احتياطي naskh
      font=amiri/naskh/... أو مسار ملف → يُستخدم مباشرة
    """
    fp = (font_param or "auto").strip()
    if fp not in ("", "auto", "match"):
        found = find_font_file(fp)
        if found:
            return found
    if style_font_name:
        emb = _embedded_font_file(doc, style_font_name)
        if emb:
            return emb
        base = style_font_name.split("+")[-1]
        found = find_font_file(base)
        if found:
            return found
    return find_font_file("naskh") or find_font_file("dejavu")


def _search_text(page, query: str) -> list:
    """
    بحث عن نص يتحمل أشكال الحروف المختلفة (presentation forms عبر NFKC)
    — يعمل على الملفات العادية وعلى النصوص المولدة بـ htmlbox.
    """
    import unicodedata
    q = unicodedata.normalize("NFKC", query or "")
    if not q:
        return []
    rects = []
    # المحاولة الأولى: البحث القياسي (سريع ويعمل مع أغلب الملفات)
    try:
        rects = page.search_for(query)
        if rects:
            return rects
    except Exception:
        pass
    # محاولة ثانية: مطابقة بعد التطبيع (للنصوص المشكّلة/المخفية)
    try:
        words = page.get_text("words")  # x0,y0,x1,y1,word,block,line,word_no
        text_norm = " ".join(unicodedata.normalize("NFKC", w[4]) for w in words)
        if unicodedata.normalize("NFKC", q) in text_norm:
            # أعد مستطيلات الكلمات المطابقة
            qn = unicodedata.normalize("NFKC", q)
            for w in words:
                wn = unicodedata.normalize("NFKC", w[4])
                if wn and (wn in qn or qn in wn):
                    rects.append(pymupdf.Rect(w[:4]))
    except Exception:
        pass
    return rects


# ---------------------------------------------------------------------------
# OCR — التعرف الضوئي على الحروف (لملفات PDF الممسوحة ضوئياً)
# ---------------------------------------------------------------------------

def _ocr_font() -> str | None:
    """خط يدعم العربية لإدراج الطبقة المخفية."""
    return _find_arabic_font()


def pdf_is_scanned(path: str, sample_pages: int = 5) -> dict[str, Any]:
    """
    كشف هل ملف PDF «ممسوح ضوئياً» (صورة بدون نص) أم يحتوي نصاً حقيقياً.
    مهم جداً: الملفات الممسوحة تحتاج OCR قبل البحث أو التعديل.
    """
    p = _p(path)
    doc = pymupdf.open(str(p))
    total = len(doc)
    checked = max(1, min(total, sample_pages))
    lengths = []
    image_pages = 0
    for i in range(checked):
        text_len = len(doc[i].get_text().strip())
        lengths.append(text_len)
        try:
            if len(doc[i].get_images(full=True)) > 0 and text_len < 30:
                image_pages += 1
        except Exception:
            pass
    doc.close()
    avg = sum(lengths) / checked
    scanned = avg < 15 or image_pages >= max(1, checked // 2)
    return {
        "file": str(p),
        "pages": total,
        "scanned": scanned,
        "avg_text_chars_per_page": round(avg, 1),
        "image_based_pages_in_sample": image_pages,
        "hint": ("الملف ممسوح ضوئياً (صورة) — شغّل pdf_ocr لتفعيل البحث والتعديل"
                 if scanned else "الملف يحتوي نصاً حقيقياً — التعديل والبحث يعملان مباشرة"),
    }


def _page_is_image_based(page) -> bool:
    """هل الصفحة صورة كبيرة (مسح ضوئي)؟ يُستخدم لتبييض مساحة التعديل."""
    rect = page.rect
    page_area = rect.width * rect.height
    if page_area <= 0:
        return False
    try:
        for img in page.get_images(full=True):
            for r in page.get_image_rects(img[0]):
                if r.get_area() > page_area * 0.4:
                    return True
    except Exception:
        pass
    return False


def pdf_ocr(
    path: str,
    output: str,
    lang: str = "ara+eng",
    dpi: int = 300,
    pages: str | None = None,
) -> dict[str, Any]:
    """
    تفعيل OCR على PDF ممسوح ضوئياً: يضيف «طبقة نص غير مرئية» فوق الصور.
    بعد ذلك تعمل كل أدوات البحث والاستخراج والتعديل كالملفات العادية.

    lang: لغات Tesseract — "ara" عربي، "eng" إنجليزي، "ara+eng" الاثنين.
    dpi: دقة المعالجة (300 مثالي للمسح الضوئي).
    """
    try:
        import pytesseract
        from PIL import Image
    except ImportError:
        raise PDFEngineError("مكتبات OCR غير مثبتة — نفّذ: pip install pytesseract + ثبّت Tesseract")

    p = _p(path)
    out = _new_path(output, f"{p.stem}_ocr.pdf")
    doc = pymupdf.open(str(p))
    idxs = set(parse_pages(pages, len(doc)))
    fontfile = _ocr_font()
    dpi = max(150, min(int(dpi), 600))
    scale = 72.0 / dpi
    total_words = 0
    per_page: list[dict[str, Any]] = []

    for i in sorted(idxs):
        page = doc[i]
        pix = page.get_pixmap(matrix=pymupdf.Matrix(dpi / 72.0, dpi / 72.0), alpha=False)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)

        # تمريران للقراءة (تجمع الكلمات منهما لأقصى كشف):
        #   1) الصورة الأصلية (أفضل للنص النظيف)
        #   2) محسّنة: رمادي + تباين + أبيض/أسود + تكبير (أفضل للخطوط الرقيقة والمسوحات الرديئة)
        from PIL import ImageOps
        enhanced = ImageOps.autocontrast(img.convert("L")).point(lambda p: 255 if p > 170 else 0)
        enhanced = enhanced.resize((int(img.width * 1.3), int(img.height * 1.3)), Image.LANCZOS)

        collected: list[tuple[str, float, float, float, float, float]] = []  # word, conf, x,y,w,h (نقاط)
        for pass_img, pass_scale in ((img, 1.0), (enhanced, 1.3)):
            try:
                data = pytesseract.image_to_data(pass_img, lang=lang, output_type=pytesseract.Output.DICT)
            except Exception as e:
                raise PDFEngineError(f"فشل OCR (هل لغة '{lang}' مثبتة في Tesseract؟): {e}")
            for j in range(len(data.get("text", []))):
                word = (data["text"][j] or "").strip()
                try:
                    conf = float(data["conf"][j])
                except (ValueError, TypeError):
                    conf = -1
                if not word or conf < 35:
                    continue
                # تحويل إحداثيات التمريرة المحسّنة إلى نقاط PDF
                x = data["left"][j] / pass_scale * scale
                y = data["top"][j] / pass_scale * scale
                w = data["width"][j] / pass_scale * scale
                h = data["height"][j] / pass_scale * scale
                if w <= 0 or h <= 0:
                    continue
                collected.append((word, conf, x, y, w, h))

        # إزالة التكرار بين التمريرتين (نفس الكلمة في نفس المكان تقريباً)
        unique: list[tuple[str, float, float, float, float, float]] = []
        for item in collected:
            word, conf, x, y, w, h = item
            dup = False
            for u in unique:
                if u[0] == word and abs(u[2] - x) < w * 0.7 and abs(u[3] - y) < h * 0.7:
                    dup = True
                    break
            if not dup:
                unique.append(item)

        words_added = 0
        for word, conf, x, y, w, h in unique:
            fontsize = max(5.0, h * 0.82)
            # عربي: يُدرج مقلوباً مسبقاً بخط عربي | إنجليزي/أرقام: خط لاتيني عادي
            try:
                if _contains_arabic(word):
                    page.insert_text(
                        pymupdf.Point(x, y + h * 0.92),
                        word[::-1],
                        fontsize=fontsize,
                        render_mode=3,  # غير مرئي — موجود في النص لكن لا يُرسم
                        fontname="djv",
                        fontfile=fontfile,
                    )
                else:
                    page.insert_text(
                        pymupdf.Point(x, y + h * 0.92),
                        word,
                        fontsize=fontsize,
                        render_mode=3,
                        fontname="helv",
                    )
                words_added += 1
            except Exception:
                continue
        total_words += words_added
        per_page.append({"page": i + 1, "words": words_added})

    doc.save(str(out), garbage=3, deflate=True)
    doc.close()

    return {
        "success": True,
        "output": str(out),
        "pages_ocr": len(idxs),
        "total_words_added": total_words,
        "lang": lang,
        "dpi": dpi,
        "details": per_page,
        "note": "أُضيفت طبقة نص مخفية — البحث والاستخراج والتعديل تعمل الآن.",
    }
~~~~


## 📄 `cad_engine.py`
**محرك CAD — DXF→PDF مباشر + DWG/RVT عبر Autodesk APS** — (497 سطر)

~~~~
"""
cad_engine.py — محرك تحويل ملفات CAD إلى PDF
==============================================
المسارات المدعومة:

  DXF (رسم ثنائي الأبعاد مفتوح المصدر):
      ✓ تحويل كامل ومحلي 100% عبر ezdxf + matplotlib — بدون أي برامج إضافية.

  DWG (الأتوكاد — صيغة مغلقة):
      1) AutoCAD COM (ويندوز + AutoCAD مثبت)  → أعلى جودة ممكنة
      2) ODA File Converter (مجاني)          → DWG→DXF ثم نفس مسار DXF
      3) Autodesk APS (سحابي)                → إذا وُجدت بيانات الاعتماد

  RVT (ريفرت — صيغة مغلقة تماماً):
      1) Autodesk APS (سحابي)                → إذا وُجدت بيانات الاعتماد
      2) سكربت pyrevit_export_pdf.py         → تصدير من داخل Revit بدون إنترنت
      (لا توجد مكتبة مفتوحة المصدر تقرأ RVT مباشرة — هذه قيود Autodesk نفسها)

بيانات الاعتماد للسحابة (اختيارية — مجاناً من https://aps.autodesk.com):
      APS_CLIENT_ID + APS_CLIENT_SECRET في متغيرات البيئة
"""

from __future__ import annotations

import base64
import os
import platform
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# أدوات مساعدة عامة (نفس رسائل pdf_engine)
# ---------------------------------------------------------------------------


class CADEngineError(Exception):
    """خطأ مفهوم يمكن عرضه مباشرة على المستخدم."""


def _p(path: str | os.PathLike, exts: tuple[str, ...] | None = None) -> Path:
    path = Path(path).expanduser()
    if not path.exists():
        raise CADEngineError(f"الملف غير موجود: {path}")
    if exts and path.suffix.lower() not in exts:
        raise CADEngineError(f"نوع الملف غير مدعوم: {path.suffix} — المطلوب: {', '.join(exts)}")
    return path.resolve()


def _out(path: str | os.PathLike) -> Path:
    path = Path(path).expanduser().resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _fmt_size(n: float) -> str:
    n = float(n)
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.1f} {unit}" if unit != "B" else f"{int(n)} B"
        n /= 1024
    return f"{n:.1f} GB"


# ---------------------------------------------------------------------------
# DXF → PDF (محلي 100%)
# ---------------------------------------------------------------------------


def _render_layout_to_pdf(layout, doc, out_path: Path, dpi: int, background: str) -> None:
    """رسم layout واحد (model أو paper) إلى ملف PDF عبر matplotlib."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from ezdxf.addons.drawing import RenderContext, Frontend
    from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
    from ezdxf import bbox as ezbbox

    # حساب حجم المحتوى لضبط أبعاد الورقة
    try:
        ext = ezbbox.extents(layout, fast=True)
        has_data = ext.has_data
    except Exception:
        has_data = False

    if has_data and ext.size.x > 0 and ext.size.y > 0:
        aspect = ext.size.y / ext.size.x
    else:
        aspect = 842 / 1191  # A3 portrait افتراضي

    fig_w = 16.54  # بوصة ≈ A3 عرضياً
    fig_h = fig_w * aspect
    if fig_h > 24:
        fig_h = 24
        fig_w = fig_h / max(aspect, 0.01)

    fig = plt.figure(figsize=(fig_w, fig_h))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_axis_off()
    ctx = RenderContext(doc)
    backend = MatplotlibBackend(ax)
    Frontend(ctx, backend).draw_layout(layout, finalize=True)
    if background and background.lower() != "none":
        fig.patch.set_facecolor(background)
    fig.savefig(str(out_path), dpi=dpi, facecolor=fig.get_facecolor())
    plt.close(fig)


def dxf_to_pdf(
    path: str,
    output: str,
    spaces: str = "layouts",
    dpi: int = 150,
    background: str = "white",
) -> dict[str, Any]:
    """
    تحويل ملف DXF إلى PDF (محلي تماماً — بدون إنترنت أو برامج إضافية).
    spaces:
      - "layouts": مساحات الورق (Paper Space) — لوحة التخطيط مع الإطارات والعناوين
                   (إذا لم توجد مساحات ورق يستخدم Model)
      - "model":   مساحة النموذج فقط (الرسم الكامل)
      - "all":     مساحة النموذج + كل مساحات الورق (كل واحدة صفحة PDF)
    """
    try:
        import ezdxf
    except ImportError:
        raise CADEngineError("مكتبة ezdxf غير مثبتة — نفّذ: pip install ezdxf matplotlib")

    p = _p(path, (".dxf",))
    out = _out(output)

    try:
        doc = ezdxf.readfile(str(p))
    except Exception as e:
        raise CADEngineError(f"تعذّر قراءة ملف DXF: {e}")

    spaces = (spaces or "layouts").lower()
    layouts: list[tuple[str, Any]] = []
    msp = doc.modelspace()
    paper_names = [l.name for l in doc.layouts if l.name.lower() != "model"]

    if spaces == "model":
        layouts = [("Model", msp)]
    elif spaces == "all":
        layouts = [("Model", msp)] + [(n, doc.layout(n)) for n in paper_names]
    else:  # layouts
        if paper_names:
            layouts = [(n, doc.layout(n)) for n in paper_names]
        else:
            layouts = [("Model", msp)]

    if not layouts:
        raise CADEngineError("لا توجد مساحات قابلة للرسم في هذا الملف.")

    # رسم كل layout في ملف مؤقت ثم الدمج في PDF واحد
    from pypdf import PdfWriter, PdfReader

    writer = PdfWriter()
    with tempfile.TemporaryDirectory() as td:
        for idx, (name, layout) in enumerate(layouts):
            tmp = Path(td) / f"layout_{idx}.pdf"
            _render_layout_to_pdf(layout, doc, tmp, dpi, background)
            reader = PdfReader(str(tmp))
            for pg in reader.pages:
                writer.add_page(pg)

    with open(out, "wb") as f:
        writer.write(f)

    return {
        "success": True,
        "output": str(out),
        "source": str(p),
        "pages": len(layouts),
        "layouts_rendered": [name for name, _ in layouts],
        "dpi": dpi,
        "output_size_human": _fmt_size(out.stat().st_size),
        "method": "ezdxf (محلي)",
    }


# ---------------------------------------------------------------------------
# DWG → PDF
# ---------------------------------------------------------------------------


def _find_oda_converter() -> str | None:
    """البحث عن ODA File Converter (مجاني من opendesign.com)."""
    exe = "ODAFileConverter.exe" if platform.system() == "Windows" else "ODAFileConverter"
    found = shutil.which(exe) or shutil.which("ODAFileConverter")
    if found:
        return found
    candidates = [
        "C:/Program Files/ODA/ODAFileConverter/ODAFileConverter.exe",
        "C:/Program Files (x86)/ODA/ODAFileConverter/ODAFileConverter.exe",
        "/usr/bin/ODAFileConverter",
        "/usr/local/bin/ODAFileConverter",
        "/Applications/ODAFileConverter.app/Contents/MacOS/ODAFileConverter",
    ]
    # بحث عن المجلدات البديلة (الإصدارات تضع نفسها في مجلد باسم الإصدار)
    for base in ("C:/Program Files/ODA", "/usr/bin", "/opt"):
        b = Path(base)
        if b.exists():
            for sub in b.glob("**/ODAFileConverter*"):
                if sub.is_file() or (sub.is_dir() and (sub / exe).exists()):
                    return str(sub if sub.is_file() else sub / exe)
    for c in candidates:
        if Path(c).exists():
            return c
    return None


def _dwg_via_autocad(dwg: Path, out: Path) -> bool:
    """التحويل عبر AutoCAD نفسه (COM — ويندوز فقط): أعلى جودة ممكنة."""
    if platform.system() != "Windows":
        return False
    try:
        import win32com.client  # type: ignore
    except ImportError:
        return False
    try:
        acad = win32com.client.Dispatch("AutoCAD.Application")
        acad.Visible = False
        doc = acad.Documents.Open(str(dwg), True)
        doc.Export(str(out), "PDF")
        doc.Close(False)
        return out.exists()
    except Exception:
        return False


def _dwg_via_oda(dwg: Path, out: Path) -> bool:
    """التحويل عبر ODA File Converter: DWG→DXF ثم نفس مسار DXF."""
    oda = _find_oda_converter()
    if not oda:
        return False
    with tempfile.TemporaryDirectory() as td:
        in_dir, out_dir = Path(td) / "in", Path(td) / "out"
        in_dir.mkdir()
        out_dir.mkdir()
        shutil.copy2(dwg, in_dir / dwg.name)
        cmd = [oda, str(in_dir), str(out_dir), "ACAD2018", "DXF", "0", "1", "*.DWG"]
        try:
            subprocess.run(cmd, capture_output=True, timeout=180, check=False)
        except Exception:
            return False
        dxfs = list(out_dir.glob("*.dxf")) + list(out_dir.glob("*.DXF"))
        if not dxfs:
            return False
        result = dxf_to_pdf(str(dxfs[0]), str(out), spaces="layouts")
        return bool(result.get("success"))


def dwg_to_pdf(path: str, output: str, method: str = "auto") -> dict[str, Any]:
    """
    تحويل ملف DWG (الأتوكاد) إلى PDF.
    method:
      - "auto": يجرّب بالترتيب: AutoCAD → ODA → APS سحابي
      - "autocad": عبر AutoCAD المثبت (أعلى جودة)
      - "oda": عبر ODA File Converter المجاني
      - "aps": عبر Autodesk Platform Services (سحابي — يحتاج APS_CLIENT_ID/SECRET)
    """
    p = _p(path, (".dwg",))
    out = _out(output)
    method = (method or "auto").lower()
    errors: list[str] = []

    order = {
        "auto": ["autocad", "oda", "aps"],
        "autocad": ["autocad"],
        "oda": ["oda"],
        "aps": ["aps"],
    }.get(method)
    if not order:
        raise CADEngineError("method يجب أن تكون: auto أو autocad أو oda أو aps")

    for m in order:
        try:
            if m == "autocad":
                if _dwg_via_autocad(p, out):
                    return {"success": True, "output": str(out), "source": str(p),
                            "method": "AutoCAD (COM)", "output_size_human": _fmt_size(out.stat().st_size)}
                errors.append("AutoCAD غير مثبت أو غير متاح على هذا النظام")
            elif m == "oda":
                if _dwg_via_oda(p, out):
                    return {"success": True, "output": str(out), "source": str(p),
                            "method": "ODA File Converter → DXF", "output_size_human": _fmt_size(out.stat().st_size)}
                errors.append("ODA File Converter غير مثبت (مجاناً من opendesign.com)")
            elif m == "aps":
                result = _aps_to_pdf(p, out)
                if result.get("success"):
                    result.update({"source": str(p)})
                    return result
                errors.append(f"APS: {result.get('error', 'غير متاح')}")
        except CADEngineError as e:
            errors.append(str(e))

    raise CADEngineError(
        "تعذّر تحويل ملف DWG — لا يوجد أي محوّل متاح:\n- " + "\n- ".join(errors) +
        "\n\nالحلول:\n1) ثبّت AutoCAD (أعلى جودة) أو ODA File Converter المجاني\n"
        "2) أو فعّل التحويل السحابي: ضع APS_CLIENT_ID و APS_CLIENT_SECRET في متغيرات البيئة"
        " (مجاني من https://aps.autodesk.com)"
    )


# ---------------------------------------------------------------------------
# RVT (ريفرت) → PDF
# ---------------------------------------------------------------------------


def rvt_to_pdf(path: str, output: str) -> dict[str, Any]:
    """
    تحويل ملف Revit (RVT) إلى PDF عبر Autodesk Platform Services (سحابي).
    يتطلب: APS_CLIENT_ID و APS_CLIENT_SECRET (مجاني من https://aps.autodesk.com)
    بدون سحابة: استخدم السكربت المرفق pyrevit_export_pdf.py من داخل Revit.
    """
    p = _p(path, (".rvt", ".rte", ".rfa"))
    out = _out(output)

    if not (os.environ.get("APS_CLIENT_ID") and os.environ.get("APS_CLIENT_SECRET")):
        raise CADEngineError(
            "تحويل RVT يحتاج Autodesk Platform Services (السحابة) أو Revit نفسه.\n\n"
            "الخيار 1 (سحابي — موصى به): أنشئ تطبيقاً مجانياً على https://aps.autodesk.com ثم ضع:\n"
            "   export APS_CLIENT_ID=xxx\n"
            "   export APS_CLIENT_SECRET=yyy\n"
            "   ثم أعد المحاولة.\n\n"
            "الخيار 2 (بدون إنترنت): شغّل السكربت pyrevit_export_pdf.py المرفق داخل Revit\n"
            "   (أو عبر pyRevit) — يصدّر كل المخططات إلى PDF مباشرة من Revit."
        )

    result = _aps_to_pdf(p, out)
    if not result.get("success"):
        raise CADEngineError(f"فشل التحويل السحابي: {result.get('error')}")
    result["source"] = str(p)
    return result


# ---------------------------------------------------------------------------
# Autodesk Platform Services (Model Derivative API)
# ---------------------------------------------------------------------------

APS_BASE = "https://developer.api.autodesk.com"


def _aps_token() -> str:
    import httpx

    client_id = os.environ.get("APS_CLIENT_ID")
    client_secret = os.environ.get("APS_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise CADEngineError("بيانات APS غير مضبوطة (APS_CLIENT_ID / APS_CLIENT_SECRET)")

    r = httpx.post(
        f"{APS_BASE}/authentication/v2/token",
        data={
            "grant_type": "client_credentials",
            "scope": "data:read data:write data:create bucket:create bucket:read",
        },
        auth=(client_id, client_secret),
        timeout=30,
    )
    if r.status_code != 200:
        raise CADEngineError(f"فشل الحصول على رمز APS ({r.status_code}): {r.text[:200]}")
    return r.json()["access_token"]


def _aps_to_pdf(path: Path, out: Path) -> dict[str, Any]:
    """رفع الملف إلى Autodesk وتحويله إلى PDF وتنزيله (Model Derivative v2)."""
    import httpx

    try:
        token = _aps_token()
    except CADEngineError as e:
        return {"success": False, "error": str(e)}

    headers = {"Authorization": f"Bearer {token}"}
    bucket = "pdf-tools-mcp-" + re.sub(r"[^a-z0-9]", "", path.stem.lower())[:20] + "-" + str(int(time.time()))[-6:]
    object_name = path.name

    try:
        # 1) إنشاء bucket مؤقت (يُحذف تلقائياً خلال 24 ساعة — transient)
        r = httpx.put(
            f"{APS_BASE}/oss/v2/buckets/{bucket}",
            headers=headers,
            json={"bucketKey": bucket, "policyKey": "transient"},
            timeout=30,
        )
        if r.status_code not in (200, 409):
            return {"success": False, "error": f"إنشاء الحاوية فشل ({r.status_code}): {r.text[:200]}"}

        # 2) رفع الملف
        with open(path, "rb") as f:
            data = f.read()
        r = httpx.put(
            f"{APS_BASE}/oss/v2/buckets/{bucket}/objects/{object_name}",
            headers={**headers, "Content-Type": "application/octet-stream"},
            content=data,
            timeout=300,
        )
        if r.status_code != 200:
            return {"success": False, "error": f"رفع الملف فشل ({r.status_code}): {r.text[:200]}"}
        urn = base64.b64encode(f"urn:adsk.objects:os.object:{bucket}/{object_name}".encode()).decode().rstrip("=")

        # 3) طلب التحويل إلى PDF
        r = httpx.post(
            f"{APS_BASE}/modelderivative/v2/designdata/job",
            headers={**headers, "Content-Type": "application/json"},
            json={"input": {"urn": urn}, "output": {"formats": [{"type": "pdf", "views": ["2d"]}]}},
            timeout=60,
        )
        if r.status_code not in (200, 201):
            return {"success": False, "error": f"طلب التحويل فشل ({r.status_code}): {r.text[:200]}"}

        # 4) انتظار اكتمال التحويل
        manifest: dict[str, Any] = {}
        for _ in range(60):  # حتى 5 دقائق
            m = httpx.get(f"{APS_BASE}/modelderivative/v2/designdata/{urn}/manifest",
                          headers=headers, timeout=30)
            manifest = m.json() if m.status_code == 200 else {}
            status = manifest.get("status")
            if status == "success":
                break
            if status in ("failed", "timeout"):
                return {"success": False, "error": f"التحويل فشل: {manifest.get('message', status)}"}
            time.sleep(5)
        else:
            return {"success": False, "error": "انتهت مهلة انتظار التحويل (5 دقائق)"}

        # 5) العثور على نتيجة PDF وتنزيلها
        pdf_urn = None
        for deriv in manifest.get("derivatives", []):
            if not isinstance(deriv, dict):
                continue
            for child in deriv.get("children", []):
                if isinstance(child, dict) and child.get("role") == "pdf":
                    pdf_urn = child.get("urn")
                    break
            if pdf_urn:
                break
        if not pdf_urn:
            return {"success": False, "error": "لم يُنتج التحويل ملف PDF (لا توجد مخططات 2D؟)"}

        r = httpx.get(
            f"{APS_BASE}/modelderivative/v2/designdata/{urn}/manifest/{pdf_urn}",
            headers=headers,
            timeout=120,
            follow_redirects=True,
        )
        if r.status_code != 200:
            return {"success": False, "error": f"تنزيل PDF فشل ({r.status_code})"}
        out.write_bytes(r.content)

        return {
            "success": True,
            "output": str(out),
            "method": "Autodesk APS (سحابي)",
            "output_size_human": _fmt_size(out.stat().st_size),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ---------------------------------------------------------------------------
# معلومات القدرات
# ---------------------------------------------------------------------------


def cad_capabilities() -> dict[str, Any]:
    """تقرير بالمُحوّلات المتاحة على هذا الجهاز — مفيد لتشخيص المشاكل."""
    oda = _find_oda_converter()
    autocad = False
    if platform.system() == "Windows":
        try:
            import win32com.client  # type: ignore
            autocad = True
        except ImportError:
            autocad = False
    aps = bool(os.environ.get("APS_CLIENT_ID") and os.environ.get("APS_CLIENT_SECRET"))
    try:
        import ezdxf  # noqa
        ezdxf_ok = True
    except ImportError:
        ezdxf_ok = False

    return {
        "dxf_local": ezdxf_ok,
        "dwg_autocad_com": autocad,
        "dwg_oda_converter": bool(oda),
        "dwg_oda_path": oda,
        "cloud_aps": aps,
        "rvt_options": ["aps (سحابي)", "pyrevit_export_pdf.py (من داخل Revit)"],
        "platform": platform.system(),
    }
~~~~


## 📄 `server.py`
**أداة MCP — 36 أداة للربط مع Claude/Cursor** — (637 سطر)

~~~~
#!/usr/bin/env python3
"""
PDF Tools MCP Server
====================
خادم Model Context Protocol يمنح أي مساعد ذكاء اصطناعي (Claude, Cursor, ...)
قدرات كاملة على معالجة ملفات PDF:

  • فصل ودمج الصفحات  • الضغط  • التحويل (صور، نص، Word)
  • العلامات المائية  • الترقيم  • التدوير  • التشفير وفك التشفير

التشغيل:  python server.py            (stdio — الوضع الافتراضي للعملاء المحليين)
البناء على: pdf_engine.py (يمكن إعادة استخدامه في أي واجهة أخرى)

الاعتمادات: mcp>=2.0, pypdf, pymupdf, pillow, pdf2docx (اختياري)
"""

from __future__ import annotations

import json
from typing import Any

from mcp.server.mcpserver import MCPServer

import pdf_engine as engine
import cad_engine

# ---------------------------------------------------------------------------
# إنشاء الخادم
# ---------------------------------------------------------------------------

mcp = MCPServer(
    name="pdf-tools",
    version="1.0.0",
    instructions=(
        "أدوات قوية لمعالجة ملفات PDF: دمج، فصل، استخراج، حذف، إعادة ترتيب، "
        "تدوير، ضغط، تحويل إلى صور/نص/Word، علامات مائية، ترقيم صفحات، "
        "وتشفير/فك التشفير. جميع المسارات على القرص (استخدم مسارات مطلقة). "
        "الصفحات تُكتب دائماً بالترقيم البشري (تبدأ من 1) مثل '1-3,5'."
    ),
)


def _ok(result: dict[str, Any]) -> str:
    """تغليف نتيجة JSON بشكل متسق."""
    return json.dumps(result, ensure_ascii=False, indent=2)


def _err(e: Exception) -> str:
    """تغليف الأخطاء برسائل عربية واضحة."""
    return json.dumps({"success": False, "error": str(e)}, ensure_ascii=False)


# ---------------------------------------------------------------------------
# الأدوات
# ---------------------------------------------------------------------------


@mcp.tool()
def pdf_info(path: str) -> str:
    """معلومات شاملة عن ملف PDF: عدد الصفحات، الحجم، المقاسات، البيانات الوصفية، وهل هو مشفّر.
    Args: path: المسار المطلق لملف PDF."""
    try:
        return _ok(engine.pdf_info(path))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_merge(inputs: list[str], output: str) -> str:
    """دمج عدة ملفات PDF في ملف واحد بنفس الترتيب المُعطى.
    مثال: inputs=["/docs/a.pdf","/docs/b.pdf"], output="/docs/merged.pdf"
    Args:
        inputs: قائمة مسارات ملفات PDF المراد دمجها (بالترتيب).
        output: مسار ملف PDF الناتج."""
    try:
        return _ok(engine.pdf_merge(inputs, output))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_split(path: str, output_dir: str, every_n_pages: int = 1, ranges: list[str] | None = None) -> str:
    """فصل ملف PDF إلى عدة ملفات أصغر.
    إما كل N صفحات في ملف (every_n_pages)، أو حسب نطاقات محددة (ranges).
    مثال: ranges=["1-3","4-10","11-"] ينتج 3 ملفات.
    Args:
        path: مسار ملف PDF المصدر.
        output_dir: المجلد الذي ستُحفظ فيه الملفات الناتجة.
        every_n_pages: عدد الصفحات لكل ملف (الافتراضي 1 = كل صفحة ملف مستقل).
        ranges: قائمة نطاقات صفحات اختيارية مثل ["1-3","4-6","7-"]."""
    try:
        return _ok(engine.pdf_split(path, output_dir, every_n_pages, ranges))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_extract_pages(path: str, pages: str, output: str) -> str:
    """استخراج صفحات محددة من PDF إلى ملف جديد (بدون حذف الأصل).
    مثال: pages="1-3,7" يستخرج الصفحات 1,2,3,7.
    Args:
        path: مسار ملف PDF المصدر.
        pages: الصفحات المطلوبة مثل "1-3,5,7-9" أو "all".
        output: مسار ملف PDF الناتج."""
    try:
        return _ok(engine.pdf_extract_pages(path, pages, output))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_delete_pages(path: str, pages: str, output: str) -> str:
    """حذف صفحات محددة من ملف PDF وحفظ الباقي في ملف جديد.
    مثال: pages="2,5-7" يحذف الصفحات 2,5,6,7.
    Args:
        path: مسار ملف PDF المصدر.
        pages: الصفحات المراد حذفها مثل "2,5-7".
        output: مسار ملف PDF الناتج."""
    try:
        return _ok(engine.pdf_delete_pages(path, pages, output))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_reorder_pages(path: str, order: str, output: str) -> str:
    """إعادة ترتيب صفحات PDF و/أو تكرارها.
    مثال: order="3,1,1,2" — الصفحة 3 أولاً، ثم 1 مرتين، ثم 2.
    Args:
        path: مسار ملف PDF المصدر.
        order: الترتيب الجديد للصفحات مثل "3,1,2".
        output: مسار ملف PDF الناتج."""
    try:
        return _ok(engine.pdf_reorder_pages(path, order, output))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_rotate(path: str, degrees: int, output: str, pages: str | None = None) -> str:
    """تدوير صفحات PDF بزاوية 90 أو 180 أو 270 درجة.
    Args:
        path: مسار ملف PDF المصدر.
        degrees: زاوية الدوران (90 أو 180 أو 270).
        output: مسار ملف PDF الناتج.
        pages: صفحات محددة مثل "1-3" (اختياري — الافتراضي كل الصفحات)."""
    try:
        return _ok(engine.pdf_rotate(path, degrees, output, pages))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_compress(path: str, output: str, level: str = "medium") -> str:
    """ضغط ملف PDF لتقليل حجمه. المستويات:
    light (بدون فقدان جودة)، medium (توازن)، strong (أقصى ضغط — قد تقل جودة الصور).
    Args:
        path: مسار ملف PDF المصدر.
        output: مسار ملف PDF المضغوط.
        level: "light" أو "medium" أو "strong"."""
    try:
        return _ok(engine.pdf_compress(path, output, level))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_to_images(path: str, output_dir: str, image_format: str = "png", dpi: int = 150, pages: str | None = None) -> str:
    """تحويل صفحات PDF إلى صور PNG أو JPG.
    Args:
        path: مسار ملف PDF المصدر.
        output_dir: المجلد الذي ستُحفظ فيه الصور.
        image_format: "png" أو "jpg".
        dpi: دقة الصورة (36-600، الافتراضي 150).
        pages: صفحات محددة مثل "1-3" (اختياري — الافتراضي كل الصفحات)."""
    try:
        return _ok(engine.pdf_to_images(path, output_dir, image_format, dpi, pages))
    except Exception as e:
        return _err(e)


@mcp.tool()
def images_to_pdf(images: list[str], output: str, page_size: str = "image") -> str:
    """تحويل صور (PNG/JPG/...) إلى ملف PDF — كل صورة تصبح صفحة.
    Args:
        images: قائمة مسارات الصور (بالترتيب).
        output: مسار ملف PDF الناتج.
        page_size: "image" (حجم الصورة) أو "a4" (توزيع داخل صفحة A4)."""
    try:
        return _ok(engine.images_to_pdf(images, output, page_size))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_to_text(path: str, pages: str | None = None) -> str:
    """استخراج النصوص من صفحات PDF (مفيد للقراءة والتحليل والبحث).
    Args:
        path: مسار ملف PDF المصدر.
        pages: صفحات محددة مثل "1-3" (اختياري — الافتراضي كل الصفحات)."""
    try:
        return _ok(engine.pdf_to_text(path, pages))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_to_word(path: str, output: str) -> str:
    """تحويل ملف PDF إلى مستند Word قابل للتعديل (docx).
    Args:
        path: مسار ملف PDF المصدر.
        output: مسار ملف docx الناتج (أو مجلد)."""
    try:
        return _ok(engine.pdf_to_word(path, output))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_watermark(
    path: str,
    output: str,
    text: str | None = None,
    watermark_pdf: str | None = None,
    opacity: float = 0.18,
    angle: float = 45,
    font_size: int = 42,
    pages: str | None = None,
) -> str:
    """إضافة علامة مائية إلى PDF: إما نص مائل متكرر، أو صفحة من ملف PDF آخر كختم.
    Args:
        path: مسار ملف PDF المصدر.
        output: مسار ملف PDF الناتج.
        text: نص العلامة المائية (مثل "سري" أو "CONFIDENTIAL").
        watermark_pdf: مسار ملف PDF لاستخدام صفحته الأولى كعلامة مائية (بديل عن text).
        opacity: شفافية النص 0-1 (الافتراضي 0.18).
        angle: زاوية ميل النص (الافتراضي 45).
        font_size: حجم الخط (الافتراضي 42).
        pages: صفحات محددة (اختياري — الافتراضي كل الصفحات)."""
    try:
        return _ok(
            engine.pdf_watermark(path, output, text, watermark_pdf, opacity, angle, font_size, pages)
        )
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_add_page_numbers(
    path: str,
    output: str,
    start_number: int = 1,
    position: str = "bottom-center",
    font_size: int = 12,
    pages: str | None = None,
) -> str:
    """إضافة أرقام صفحات إلى PDF.
    Args:
        path: مسار ملف PDF المصدر.
        output: مسار ملف PDF الناتج.
        start_number: رقم البداية (الافتراضي 1).
        position: الموضع — "bottom-center" أو "bottom-right" أو "bottom-left" أو "top-center".
        font_size: حجم الخط (الافتراضي 12).
        pages: صفحات محددة (اختياري — الافتراضي كل الصفحات)."""
    try:
        return _ok(engine.pdf_add_page_numbers(path, output, start_number, position, font_size, pages))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_encrypt(path: str, password: str, output: str) -> str:
    """تشفير ملف PDF بكلمة مرور (تُطلب عند فتحه).
    Args:
        path: مسار ملف PDF المصدر.
        password: كلمة المرور المطلوبة.
        output: مسار ملف PDF المشفّر."""
    try:
        return _ok(engine.pdf_encrypt(path, password, output))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_decrypt(path: str, password: str, output: str) -> str:
    """فك تشفير ملف PDF مشفّر باستخدام كلمة المرور.
    Args:
        path: مسار ملف PDF المشفّر.
        password: كلمة المرور.
        output: مسار ملف PDF غير المشفّر."""
    try:
        return _ok(engine.pdf_decrypt(path, password, output))
    except Exception as e:
        return _err(e)


# ---------------------------------------------------------------------------
# التعديل على محتوى PDF
# ---------------------------------------------------------------------------


@mcp.tool()
def pdf_edit_text(path: str, search: str, replace: str, output: str, pages: str | None = None, font: str = "auto") -> str:
    """البحث عن نص داخل PDF واستبداله بنص آخر (تعديل النص الموجود فعلياً) — بنفس خط المستند الأصلي تلقائياً.
    Args:
        path: مسار ملف PDF المصدر.
        search: النص المراد البحث عنه واستبداله.
        replace: النص الجديد البديل.
        output: مسار ملف PDF الناتج.
        pages: صفحات محددة مثل "1-3" (اختياري — الافتراضي كل الصفحات).
        font: "auto" (مطابقة الخط الأصلي — الافتراضي) أو "naskh"/"amiri"/"kufi" أو مسار خط .ttf"""
    try:
        return _ok(engine.pdf_edit_text(path, search, replace, output, pages, font))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_add_text(
    path: str,
    text: str,
    output: str,
    x: float = 72,
    y: float = 72,
    font_size: float = 12,
    color: str = "#000000",
    pages: str | None = None,
    rotate: int = 0,
) -> str:
    """إضافة نص جديد على صفحات PDF (يدعم العربية بشكل صحيح).
    الإحداثيات x,y بالنقاط (Point) من أعلى-يسار الصفحة — الورقة A4 ≈ 595×842 نقطة.
    Args:
        path: مسار ملف PDF المصدر.
        text: النص المراد إضافته.
        output: مسار ملف PDF الناتج.
        x: الموضع الأفقي (الافتراضي 72).
        y: الموضع الرأسي (الافتراضي 72).
        font_size: حجم الخط (الافتراضي 12).
        color: لون النص بصيغة #RRGGBB.
        pages: صفحات محددة مثل "1-3" (اختياري — الافتراضي كل الصفحات).
        rotate: تدوير النص 0/90/180/270."""
    try:
        return _ok(engine.pdf_add_text(path, text, output, x, y, font_size, color, pages, rotate))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_add_image(
    path: str,
    image: str,
    output: str,
    x: float = 72,
    y: float = 72,
    width: float = 200,
    height: float | None = None,
    pages: str | None = "1",
    opacity: float = 1.0,
) -> str:
    """إضافة/ختم صورة (ختم رسمي، توقيع، شعار) على صفحات PDF.
    Args:
        path: مسار ملف PDF المصدر.
        image: مسار الصورة (PNG/JPG).
        output: مسار ملف PDF الناتج.
        x: الموضع الأفقي بالنقاط من اليسار.
        y: الموضع الرأسي بالنقاط من الأعلى.
        width: عرض الصورة بالنقاط (الافتراضي 200).
        height: ارتفاع الصورة (اختياري — يُحسب من النسب).
        pages: الصفحات المستهدفة مثل "1" أو "1-3" (الافتراضي الصفحة 1)."""
    try:
        return _ok(engine.pdf_add_image(path, image, output, x, y, width, height, pages, opacity))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_highlight_text(path: str, search: str, output: str, color: str = "#FFFF00", pages: str | None = None) -> str:
    """تظليل (تمييز) كل مواضع نص معيّن في PDF — مفيد للمراجعة والتدقيق.
    Args:
        path: مسار ملف PDF المصدر.
        search: النص المراد تظليله.
        output: مسار ملف PDF الناتج.
        color: لون التظليل بصيغة #RRGGBB (الافتراضي أصفر).
        pages: صفحات محددة (اختياري — الافتراضي كل الصفحات)."""
    try:
        return _ok(engine.pdf_highlight_text(path, search, output, color, pages))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_add_note(
    path: str,
    note_text: str,
    output: str,
    page_number: int = 1,
    x: float = 100,
    y: float = 100,
    author: str = "PDF Tools",
    color: str = "#FFF2A8",
) -> str:
    """إضافة ملاحظة لاصقة (sticky note / تعليق) على صفحة في PDF.
    Args:
        path: مسار ملف PDF المصدر.
        note_text: نص الملاحظة.
        output: مسار ملف PDF الناتج.
        page_number: رقم الصفحة (يبدأ من 1).
        x: الموضع الأفقي بالنقاط.
        y: الموضع الرأسي بالنقاط.
        author: اسم كاتب الملاحظة.
        color: لون الملاحظة بصيغة #RRGGBB."""
    try:
        return _ok(engine.pdf_add_note(path, note_text, output, page_number, x, y, author, color))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_fill_form(path: str, fields: dict[str, Any], output: str) -> str:
    """تعبئة نموذج PDF (AcroForms) — حقول نص، مربعات اختيار، قوائم.
    استخدم pdf_list_form_fields أولاً لمعرفة أسماء الحقول المتوفرة.
    Args:
        path: مسار ملف PDF الذي يحتوي النموذج.
        fields: قاموس الحقول وقيمها مثل {"name": "أحمد", "agree": true}.
        output: مسار ملف PDF المعبأ."""
    try:
        return _ok(engine.pdf_fill_form(path, fields, output))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_list_form_fields(path: str) -> str:
    """عرض أسماء وأنواع حقول النموذج المتوفرة في ملف PDF — استخدمها قبل pdf_fill_form.
    Args:
        path: مسار ملف PDF."""
    try:
        return _ok(engine.pdf_list_form_fields(path))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_flatten(path: str, output: str) -> str:
    """تسطيح (flatten) كل الملاحظات وحقول النماذج داخل محتوى الصفحة — نسخة نهائية آمنة للطباعة والأرشفة.
    Args:
        path: مسار ملف PDF المصدر.
        output: مسار ملف PDF الناتج."""
    try:
        return _ok(engine.pdf_flatten(path, output))
    except Exception as e:
        return _err(e)


# ---------------------------------------------------------------------------
# العرض والطباعة
# ---------------------------------------------------------------------------


@mcp.tool()
def pdf_render_page(path: str, page_number: int, output: str, dpi: int = 150, image_format: str = "png") -> str:
    """معاينة/عرض صفحة واحدة من PDF كصورة — لإظهارها للمستخدم أو مراجعتها بصرياً.
    Args:
        path: مسار ملف PDF.
        page_number: رقم الصفحة (يبدأ من 1).
        output: مسار الصورة الناتجة (png/jpg).
        dpi: الدقة (الافتراضي 150).
        image_format: "png" أو "jpg"."""
    try:
        return _ok(engine.pdf_render_page(path, page_number, output, dpi, image_format))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_print(path: str, printer: str | None = None, copies: int = 1, pages: str | None = None, duplex: bool = False) -> str:
    """إرسال ملف PDF إلى طابعة النظام مباشرة للطباعة.
    Args:
        path: مسار ملف PDF المراد طباعته.
        printer: اسم الطابعة (اختياري — الافتراضية للنظام).
        copies: عدد النسخ (الافتراضي 1).
        pages: نطاق الصفحات مثل "1-3" (اختياري).
        duplex: true للطباعة على الوجهين."""
    try:
        return _ok(engine.pdf_print(path, printer, copies, pages, duplex))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_impose(path: str, output: str, pages_per_sheet: int = 2) -> str:
    """تجهيز PDF للطباعة الاقتصادية: عدة صفحات في الورقة الواحدة (N-up).
    Args:
        path: مسار ملف PDF المصدر.
        output: مسار ملف PDF الناتج.
        pages_per_sheet: 2 (جانب-بجانب) أو 4 (2×2) أو 6 (2×3) أو 9 (3×3)."""
    try:
        return _ok(engine.pdf_impose(path, output, pages_per_sheet))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_booklet(path: str, output: str, sheet_size: str = "a4") -> str:
    """تجهيز PDF ككتيّب للطباعة على وجهين مع طي في المنتصف (saddle-stitch).
    Args:
        path: مسار ملف PDF المصدر.
        output: مسار ملف PDF الناتج.
        sheet_size: "a4" أو "a3"."""
    try:
        return _ok(engine.pdf_booklet(path, output, sheet_size))
    except Exception as e:
        return _err(e)


# ---------------------------------------------------------------------------
# تحويل ملفات CAD (AutoCAD / Revit) إلى PDF
# ---------------------------------------------------------------------------


@mcp.tool()
def dxf_to_pdf(path: str, output: str, spaces: str = "layouts", dpi: int = 150, background: str = "white") -> str:
    """تحويل ملف DXF (الأتوكاد) إلى PDF — محلي 100% بدون إنترنت.
    يحافظ على الطبقات والإطارات ومخططات التخطيط (Paper Space).
    Args:
        path: مسار ملف DXF.
        output: مسار ملف PDF الناتج.
        spaces: "layouts" (لوحات التخطيط — الافتراضي) أو "model" (مساحة النموذج) أو "all".
        dpi: دقة الرسم (الافتراضي 150).
        background: لون الخلفية (الافتراضي أبيض)."""
    try:
        return _ok(cad_engine.dxf_to_pdf(path, output, spaces, dpi, background))
    except Exception as e:
        return _err(e)


@mcp.tool()
def dwg_to_pdf(path: str, output: str, method: str = "auto") -> str:
    """تحويل ملف DWG (الأتوكاد) إلى PDF. يجرّب تلقائياً: AutoCAD → ODA File Converter → السحابة.
    للجودة الأعلى: ثبّت AutoCAD أو ODA File Converter المجاني (opendesign.com)،
    أو فعّل السحابة بمتغيرات البيئة APS_CLIENT_ID و APS_CLIENT_SECRET.
    Args:
        path: مسار ملف DWG.
        output: مسار ملف PDF الناتج.
        method: "auto" (الافتراضي) أو "autocad" أو "oda" أو "aps"."""
    try:
        return _ok(cad_engine.dwg_to_pdf(path, output, method))
    except Exception as e:
        return _err(e)


@mcp.tool()
def rvt_to_pdf(path: str, output: str) -> str:
    """تحويل ملف Revit (RVT) إلى PDF عبر Autodesk APS السحابي.
    يتطلب متغيرات البيئة APS_CLIENT_ID و APS_CLIENT_SECRET (مجاني من aps.autodesk.com).
    بدون سحابة: استخدم السكربت المرفق pyrevit_export_pdf.py من داخل Revit.
    Args:
        path: مسار ملف RVT.
        output: مسار ملف PDF الناتج."""
    try:
        return _ok(cad_engine.rvt_to_pdf(path, output))
    except Exception as e:
        return _err(e)


@mcp.tool()
def cad_capabilities() -> str:
    """تقرير بالمُحوّلات CAD المتاحة على هذا الجهاز (AutoCAD؟ ODA؟ APS؟) — لتشخيص مشاكل التحويل."""
    try:
        return _ok(cad_engine.cad_capabilities())
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_get_fonts(path: str, pages: str | None = None) -> str:
    """عرض الخطوط المستخدمة داخل ملف PDF (اسم الخط، النوع، هل هو مدمج) — لمعرفة خط المستند قبل التعديل.
    Args:
        path: مسار ملف PDF.
        pages: صفحات محددة (اختياري)."""
    try:
        return _ok(engine.pdf_get_fonts(path, pages))
    except Exception as e:
        return _err(e)


@mcp.tool()
def list_fonts() -> str:
    """قائمة الخطوط العربية المتاحة على النظام (naskh, amiri, kufi, tajawal...) لاستخدامها في التعديل والإضافة والعلامة المائية."""
    try:
        return _ok(engine.list_fonts())
    except Exception as e:
        return _err(e)


# ---------------------------------------------------------------------------
# OCR — المسح الضوئي
# ---------------------------------------------------------------------------


@mcp.tool()
def pdf_is_scanned(path: str) -> str:
    """كشف هل ملف PDF ممسوح ضوئياً (صورة بدون نص) — الملفات الممسوحة تحتاج pdf_ocr قبل البحث أو التعديل.
    Args: path: مسار ملف PDF."""
    try:
        return _ok(engine.pdf_is_scanned(path))
    except Exception as e:
        return _err(e)


@mcp.tool()
def pdf_ocr(path: str, output: str, lang: str = "ara+eng", dpi: int = 300, pages: str | None = None) -> str:
    """تفعيل OCR على PDF ممسوح ضوئياً (سكان) — يضيف طبقة نص مخفية تجعل البحث والاستخراج والتعديل تعمل.
    يدعم العربية والإنجليزية. بعد OCR يمكن استخدام كل الأدوات كالملفات العادية.
    Args:
        path: مسار ملف PDF الممسوح ضوئياً.
        output: مسار ملف PDF الناتج.
        lang: لغات Tesseract — "ara+eng" (الافتراضي) أو "ara" أو "eng".
        dpi: دقة المعالجة (الافتراضي 300).
        pages: صفحات محددة (اختياري — الافتراضي كل الصفحات)."""
    try:
        return _ok(engine.pdf_ocr(path, output, lang, dpi, pages))
    except Exception as e:
        return _err(e)


# ---------------------------------------------------------------------------
# التشغيل
# ---------------------------------------------------------------------------

def main() -> None:
    """نقطة تشغيل الخادم (stdio). يمكن استدعاؤها كأمر: pdf-tools-mcp"""
    mcp.run()


if __name__ == "__main__":
    main()
~~~~


## 📄 `run_webapp.py`
**مُشغّل الموقع** — (6 سطر)

~~~~
#!/usr/bin/env python3
"""تشغيل واجهة الويب — محطّة PDF (http://localhost:8000)"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("webapp.main:app", host="0.0.0.0", port=8000, log_level="info")
~~~~


## 📄 `webapp/ops.py`
**31 عملية خطوات Stateless (تُستخدم في الموقع ونسخة Vercel)** — (246 سطر)

~~~~
"""
ops.py — محوّلات العمليات المشتركة (Stateless)
================================================
تُستخدم من:
  - webapp/main.py   (الخادم المحلي — حالة كاملة)
  - api/index.py     (Vercel Serverless — بدون حالة)

كل عملية: run_op(op, input_paths, params, out_dir) -> [Path, ...]
"""

from __future__ import annotations

import io
import json
import re
from pathlib import Path
from typing import Any

import sys
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pdf_engine as engine  # noqa: E402
import cad_engine  # noqa: E402


class OpError(Exception):
    pass


def safe_name(name: str) -> str:
    name = re.sub(r"[^\w\.\-\u0600-\u06FF]", "_", name or "output")
    return name[:80]


def _out(out_dir: Path, name: str, default: str) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir / safe_name(name or default)


# ---------------------------------------------------------------------------
# المحوّلات
# ---------------------------------------------------------------------------


def _one(fn, paths, params, out_dir, default_name, **extra):
    p = dict(params)
    out = _out(out_dir, p.pop("output_name", default_name), default_name)
    p.update(extra)
    result = fn(paths[0], str(out), **p)
    return [Path(result["output"] if isinstance(result, dict) and "output" in result else out)]


def op_merge(paths, params, out_dir):
    out = _out(out_dir, params.get("output_name", "merged.pdf"), "merged.pdf")
    engine.pdf_merge([str(p) for p in paths], str(out))
    return [out]


def op_compress(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_compress(p, o, **kw), paths, params, out_dir, "compressed.pdf")


def op_extract_pages(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_extract_pages(p, **kw, output=o), paths, params, out_dir, "extracted.pdf")


def op_delete_pages(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_delete_pages(p, **kw, output=o), paths, params, out_dir, "deleted.pdf")


def op_reorder(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_reorder_pages(p, **kw, output=o), paths, params, out_dir, "reordered.pdf")


def op_rotate(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_rotate(p, output=o, **kw), paths, params, out_dir, "rotated.pdf")


def op_split(paths, params, out_dir):
    odir = out_dir / "split"
    r = engine.pdf_split(str(paths[0]), str(odir), every_n_pages=int(params.get("every_n_pages", 1)),
                         ranges=params.get("ranges"))
    return [Path(x) for x in r["outputs"]]


def op_watermark(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_watermark(p, o, **kw), paths, params, out_dir, "watermarked.pdf")


def op_page_numbers(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_add_page_numbers(p, o, **kw), paths, params, out_dir, "numbered.pdf")


def op_encrypt(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_encrypt(p, **kw, output=o), paths, params, out_dir, "encrypted.pdf")


def op_decrypt(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_decrypt(p, **kw, output=o), paths, params, out_dir, "decrypted.pdf")


def op_to_images(paths, params, out_dir):
    odir = out_dir / "images"
    r = engine.pdf_to_images(str(paths[0]), str(odir),
                             image_format=params.get("image_format", "png"),
                             dpi=int(params.get("dpi", 150)),
                             pages=params.get("pages"))
    return [Path(x) for x in r["outputs"]]


def op_images_to_pdf(paths, params, out_dir):
    out = _out(out_dir, params.get("output_name", "images.pdf"), "images.pdf")
    engine.images_to_pdf([str(p) for p in paths], str(out), page_size=params.get("page_size", "image"))
    return [out]


def op_to_text(paths, params, out_dir):
    r = engine.pdf_to_text(str(paths[0]), pages=params.get("pages"))
    out = _out(out_dir, params.get("output_name", "text.txt"), "text.txt")
    out.write_text(r["full_text"], encoding="utf-8")
    return [out]


def op_to_word(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_to_word(p, o), paths, params, out_dir, "document.docx")


def op_edit_text(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_edit_text(p, **kw, output=o), paths, params, out_dir, "edited.pdf")


def op_add_text(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_add_text(p, output=o, **kw), paths, params, out_dir, "text_added.pdf")


def op_add_image(paths, params, out_dir):
    p = dict(params)
    image = p.pop("image", None)
    if not image and len(paths) > 1:
        image = str(paths[1])
        paths = paths[:1]
    if not image:
        raise OpError("خطوة إضافة صورة تحتاج مسار صورة (image)")
    return _one(lambda src, o, **kw: engine.pdf_add_image(src, image, o, **kw), paths, p, out_dir, "stamped.pdf")


def op_highlight(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_highlight_text(p, output=o, **kw), paths, params, out_dir, "highlighted.pdf")


def op_add_note(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_add_note(p, output=o, **kw), paths, params, out_dir, "noted.pdf")


def op_fill_form(paths, params, out_dir):
    fields = params.get("fields", {})
    return _one(lambda p, o, **kw: engine.pdf_fill_form(p, fields, o), paths, {}, out_dir, "filled.pdf")


def op_flatten(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_flatten(p, o), paths, params, out_dir, "flattened.pdf")


def op_impose(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_impose(p, o, **kw), paths, params, out_dir, "imposed.pdf")


def op_booklet(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_booklet(p, o, **kw), paths, params, out_dir, "booklet.pdf")


def op_render(paths, params, out_dir):
    r = engine.pdf_render_page(str(paths[0]), int(params.get("page_number", 1)),
                               str(_out(out_dir, params.get("output_name", "preview.png"), "preview.png")),
                               dpi=int(params.get("dpi", 150)))
    return [Path(r["output"])]


def op_print(paths, params, out_dir):
    r = engine.pdf_print(str(paths[0]), **params)
    out = _out(out_dir, "print_job.txt", "print_job.txt")
    out.write_text(json.dumps(r, ensure_ascii=False), encoding="utf-8")
    return [out]


def op_ocr(paths, params, out_dir):
    return _one(lambda p, o, **kw: engine.pdf_ocr(p, o, **kw), paths, params, out_dir, "ocr.pdf")


def op_is_scanned(paths, params, out_dir):
    r = engine.pdf_is_scanned(str(paths[0]))
    out = _out(out_dir, "scan_check.txt", "scan_check.txt")
    out.write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")
    return [out]


def op_dxf_to_pdf(paths, params, out_dir):
    p = dict(params)
    p.pop("output_name", None)
    r = cad_engine.dxf_to_pdf(str(paths[0]), str(_out(out_dir, params.get("output_name", "from_dxf.pdf"), "from_dxf.pdf")), **p)
    return [Path(r["output"])]


def op_dwg_to_pdf(paths, params, out_dir):
    r = cad_engine.dwg_to_pdf(str(paths[0]), str(_out(out_dir, params.get("output_name", "from_dwg.pdf"), "from_dwg.pdf")),
                              method=params.get("method", "auto"))
    return [Path(r["output"])]


def op_rvt_to_pdf(paths, params, out_dir):
    r = cad_engine.rvt_to_pdf(str(paths[0]), str(_out(out_dir, params.get("output_name", "from_rvt.pdf"), "from_rvt.pdf")))
    return [Path(r["output"])]


OPS: dict[str, Any] = {
    "merge": op_merge, "compress": op_compress, "extract_pages": op_extract_pages,
    "delete_pages": op_delete_pages, "reorder": op_reorder, "rotate": op_rotate,
    "split": op_split, "watermark": op_watermark, "page_numbers": op_page_numbers,
    "encrypt": op_encrypt, "decrypt": op_decrypt, "to_images": op_to_images,
    "images_to_pdf": op_images_to_pdf, "to_text": op_to_text, "to_word": op_to_word,
    "edit_text": op_edit_text, "add_text": op_add_text, "add_image": op_add_image,
    "highlight": op_highlight, "add_note": op_add_note, "fill_form": op_fill_form,
    "flatten": op_flatten, "impose": op_impose, "booklet": op_booklet,
    "render": op_render, "print": op_print, "ocr": op_ocr, "is_scanned": op_is_scanned,
    "dxf_to_pdf": op_dxf_to_pdf, "dwg_to_pdf": op_dwg_to_pdf, "rvt_to_pdf": op_rvt_to_pdf,
}

# محوّل تلقائي حسب امتداد الملف
AUTO_CAD = {".dxf": "dxf_to_pdf", ".dwg": "dwg_to_pdf", ".rvt": "rvt_to_pdf", ".rte": "rvt_to_pdf", ".rfa": "rvt_to_pdf"}


def run_op(op: str, paths: list[Path], params: dict[str, Any], out_dir: Path) -> list[Path]:
    """تشغيل عملية واحدة — يرجع مسارات الملفات الناتجة."""
    if op.startswith("@auto_cad") or op == "@auto_cad":
        if not paths:
            raise OpError("لا توجد ملفات CAD")
        op = AUTO_CAD.get(paths[0].suffix.lower(), "dxf_to_pdf")
    fn = OPS.get(op)
    if not fn:
        raise OpError(f"عملية غير معروفة: {op}")
    try:
        return fn(paths, dict(params or {}), out_dir)
    except (engine.PDFEngineError, cad_engine.CADEngineError) as e:
        raise OpError(str(e))
~~~~


## 📄 `webapp/interpreter.py`
**المحرك الهجين لفهم الأوامر العربية + الوصفات الذكية** — (831 سطر)

~~~~
"""
interpreter.py — مفسّر الأوامر الهجين (قواعد محلية + AI مجاني احتياطي)
=========================================================================
المستوى 1: محرك لهجات محلي ضخم — مصري/خليجي/شامي/فصحى + أخطاء إملائية
           → مجاني تماماً، فوري، يغطي معظم الكلام اليومي.
المستوى 2: LLM مجاني (Groq / Gemini / أي متوافق مع OpenAI) عند الحيرة
           → يفهم أي كلام حرفياً.

التشغيل بدون أي مفتاح = القواعد وحدها تعمل.
لتفعيل الذكاء الاحتياطي المجاني:
    export GROQ_API_KEY=gsk_...        (مجاني من console.groq.com)
    أو export GEMINI_API_KEY=AIza...   (مجاني من aistudio.google.com)
"""

from __future__ import annotations

import json
import os
import re
from difflib import get_close_matches
from typing import Any

# ---------------------------------------------------------------------------
# تطبيع عميق للعربية (لهجات + أخطاء إملائية)
# ---------------------------------------------------------------------------

_AR_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789")
_TASHKEEL = re.compile(r"[\u064B-\u0652\u0640\u0670]")


def normalize(text: str) -> str:
    """توحيد الحروف — يجعل «أ» و«ا» و«آ» مثلاً كلها حرفاً واحداً."""
    t = (text or "").translate(_AR_DIGITS)
    t = _TASHKEEL.sub("", t)
    t = t.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    t = t.replace("ة", "ه").replace("ى", "ي").replace("ئ", "ء").replace("ؤ", "ء")
    t = t.replace("ـ", "")  # تطويل
    return re.sub(r"\s+", " ", t).strip().lower()


# فصل الخطوات: ثم / بعدين / و بعدين / then ...
_SPLIT = re.compile(
    r"\s*(?:ثم|و\s*بعدين|بعدين|بعد\s*كده|بعد\s*ذا|بعد\s*ذلك|then|>>|؛|;)\s*",
    re.IGNORECASE,
)

# أرقام مكتوبة بالحروف (شائعة في اللهجات)
_NUM_WORDS = {
    "واحده": 1, "واحدة": 1, "واحد": 1, "اتنين": 2, "اثنين": 2, "اثنان": 2, "ثنتين": 2,
    "تلاته": 3, "ثلاثة": 3, "اربعه": 4, "أربعة": 4, "خمسه": 5, "خمسة": 5,
    "سته": 6, "ستة": 6, "سبعه": 7, "سبعة": 7, "ثمانيه": 8, "ثمانية": 8,
    "تسعه": 9, "تسعة": 9, "عشره": 10, "عشرة": 10, "عشرين": 20,
    "الاولي": 1, "الاولى": 1, "الاول": 1, "التانيه": 2, "الثانيه": 2,
    "التالته": 3, "الثالثه": 3, "الرابعه": 4, "الخامسه": 5, "السادسه": 6,
    "السابعه": 7, "التامنه": 8, "التاسعه": 9, "العاشره": 10,
}


def _to_int(tok: str) -> int | None:
    tok = normalize(tok)
    if tok.isdigit():
        return int(tok)
    return _NUM_WORDS.get(tok)


# نطاقات الصفحات بكل الصيغ: 2-5 ، من 2 لـ 5 ، من 2 لحد 5 ، 2 لـ 5 ، حتى 5 ، من 3
_RANGE_PATTERNS = [
    re.compile(r"(?:الصفحات?|صفحات?|pages?)\s*[:=]?\s*(\d+)\s*(?:-|ـ|لـ|ل|الي|إلى|الى|to|حتي|حتى|حد|l)\s*(\d+)", re.I),
    re.compile(r"\b(\d+)\s*[-–]\s*(\d+)\b"),
    re.compile(r"من\s+(\d+)\s*(?:لـ|ل|الي|الى|حتي|حتى|to)\s*(\d+)"),
    re.compile(r"(?:الصفحات?|صفحات?|pages?)\s*[:=]?\s*(\d+(?:\s*[,،]\s*\d+)+)"),
    re.compile(r"(?:الصفحه|الصفحة|page)\s*[:=]?\s*(\d+|[\u0621-\u064A]+)"),
]


def _pages_from(clause: str) -> str | None:
    n = normalize(clause)
    # نطاق 1-5 بكل الفواصل (من 2 لحد 5، من 2 لـ 5، 2-5، 2 to 5...)
    m = re.search(
        r"(?:الصفحات?|صفحات?|pages?)?\s*(\d+)\s*(?:-|ـ|لحد|لحتي|لحتى|لـ|الي|الى|to|حتي|حتى|ل|حد)\s*(\d+)",
        n,
    )
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        if a <= b:
            return f"{a}-{b}"
    # قائمة 1,3,5
    m = re.search(r"(\d+\s*[,،]\s*\d+(?:\s*[,،]\s*\d+)*)", n)
    if m:
        return re.sub(r"\s|،", ",", m.group(1))
    # صفحة مفردة أو كلمة رقمية (التانية، الخامسة...)
    m = re.search(r"(?:الصفحه|الصفحة|page)\s*[:=]?\s*(\w+)", n)
    if m:
        v = _to_int(m.group(1))
        if v:
            return str(v)
    m = re.search(r"\b(\d+)\b", n)
    if m and re.search(r"صفح|page|استخرج|اطلع|طلّع|طلع|احذف|شيل|delete|extract", n):
        return m.group(1)
    return None


# ---------------------------------------------------------------------------
# قاموس النوايا الهائل — مئات الصيغ: فصحى + مصري + خليجي + شامي + إنجليزي
# ---------------------------------------------------------------------------

INTENT_PATTERNS: dict[str, list[str]] = {
    "merge": [
        r"دمج|ادمج|دمّج|اجمع|جمع|جمّع|ضمّ|ضم|unite",
        r"merge|combine|union|join\s+pdfs?|mix",
        r"(?:خلي|خلّي|سوّي|سوي|حطّ|حط|اعمل|عمّل|فوّت|فوت)\S{0,6}\s*.{0,30}?(?:ملف\s+واحد|مع\s+بعض|واحد\s+ملف)",
        r"(?:في|ب)\s*ملف\s+واحد|ملف\s+واحد\s+بس|كلهم\s+مع\s+بعض",
        r"وحّد|وحد|جمعلي|جمعهم|حطهم\s+مع\s+بعض|حطه\s+مع",
    ],
    "compress": [
        r"اضغط|ضغط|صغّر|صغر|صغير|تخفيض\s+الحجم|قلّل|قلل|خفّف|خفف",
        r"compress|reduce|zip|shrink|minimi[sz]e|smaller",
        r"قليل\s+الحجم|حجم\s+اقل|احجام|يخف|خفيف\s+الحجم|ميجا|megabyte|kb",
        r"ظبّط|ظبط|هذّب|هذب|clean\s*up",
    ],
    "extract_pages": [
        r"استخرج|استخرجوا|اطلع|طلع|طلّع|طلعني|طلعلي|اخرّج|اخرج|take\s+out",
        r"extract|get\s+pages|pull|copy\s+pages",
        r"عايز\s+الصفحات|محتاج\s+الصفحات|ابي\s+الصفحات|اريد\s+الصفحات",
    ],
    "delete_pages": [
        r"احذف|حذف|امسح|مسح|شيل|شِيل|اقلع|اقلاع|استبعد|exclude",
        r"delete|remove|erase|drop\s+pages?",
        r"متلزمنيش|مش\s+عايز|مش\s+محتاج|خلي\s+بالنا",
    ],
    "split": [
        r"افصل|فصل|فلّت|فلت|شقّ|شق|قسّم|قسم",
        r"split|separate|divide|cut\s+into",
        r"كل\s+صفحه\s+لوحدها|صفحه\s+صفحه|لوحدها|من\s+فصل",
    ],
    "reorder": [
        r"رتب|رتّب|اعاده\s+ترتيب|ترتيب|بدّل\s+الترتيب",
        r"reorder|arrange|sort\s+pages",
    ],
    "rotate": [
        r"دوّر|دورهم|دوران|دير|قلّب|قلب|اقلب|(?<![ماال])لف(?![ف])|لفّ",
        r"rotate|turn|flip|orientation",
    ],
    "watermark": [
        r"علامة\s+مائيه|ووتر\s*مارك|watermark|فلتر\s+مائي",
        r"ختم|ختم|احط\s+ختم|حط.{0,12}ختم|طابع",
        r"سريّه|سريه|سري|سريّ|CONFIDENTIAL|S\s*E\s*N\s*S\s*I\s*T\s*I\s*V\s*E",
        r"مسوده|مسودة|DRAFT|نسخه\s+اولي|نسخة\s+أولية|معتمد|معتمَد|NOT\s*FINAL",
    ],
    "page_numbers": [
        r"رقّم|رقم|ترقيم|ارقام\s+الصفحات|ترقيم\s+الصفحات",
        r"page\s*numbers?|number\s+(?:the\s+)?pages?|pagination",
        r"رقمهالهم|رقمهالها|رقمهم|رقّمهم",
    ],
    "booklet": [
        r"كتيّب|كتيب|بوشر|booklet|brochure|مطويه|مطوية",
        r"اعمل.{0,10}كتيّب|تجليد|تغليف|طي",
    ],
    "impose": [
        r"\d+\s*(?:في|x|×|up\s*on|on)\s*(?:الورقه|الورقة|ورقه|ورقة|sheet|page)",
        r"\d+\s*up|n[\s-]?up|multi[\s-]?page",
        r"ورقتين|ورقتان|صفحتين\s+في\s+ورقه",
    ],
    "encrypt": [
        r"شفّر|شفر|تشفير|encryption|encrypt|حماية|احمِ|احمي|protect",
        r"كلمه\s+سر|كلمة\s+مرور|باسورد|password|passwd|سرية\s+الدخول",
        r"قفل|اقفل|اقفال|lock",
    ],
    "decrypt": [
        r"فك.{0,8}(?:الشفره|التشفير|القفل)|فكّ|فك|unencrypt|decrypt|unlock",
        r"شيل.{0,8}(?:القفل|الشفره|الباسورد)",
    ],
    "to_images": [
        r"صوره|صور|صاورة|لقطات|اسكرين|screen\s*shots?|pictures?|images?",
        r"png|jpe?g|حوّل.{0,10}صور|حول.{0,10}لصور|اعمل.{0,8}صور",
        r"convert.{0,12}image",
    ],
    "images_to_pdf": [
        r"(?:الصور|صور|images?).{0,20}(?:pdf|ملف\s+واحد|مستند)",
        r"images?\s*to\s*pdf|from\s+images?|اجمع\s+الصور|حط\s+الصور",
    ],
    "to_text": [
        r"النص|نصوص|اقرا|اقرأ|الكلام|extract\s*text|read\s+text|ocr|استخرج.{0,10}النص",
        r"اعرض\s+النص|طلّعني\s+النص",
    ],
    "to_word": [
        r"وورد|word|docx|وثيقه\s+قابله|مستند\s+وورد|word\s+document",
    ],
    "edit_text": [
        r"استبدل|بدّل|بديل|replace|change|عدل\s+النص|تعديل\s+النص|صحّح|صحح",
    ],
    "add_text": [
        r"اضف\s+نص|اكتب\s+نص|اكتب\s+على|حط.{0,10}نص|add\s*text|write\s+text|insert\s*text",
    ],
    "highlight": [
        r"ظلّل|ظلل|تظليل|تمييز|علّم|علم\s+على|highlight|mark\s+text|يبرز",
    ],
    "fill_form": [
        r"املأ|املا|تعبئه|تعبئة|نموذج|فورم|application\s*form|fill",
    ],
    "flatten": [
        r"سطّح|سطح|تسطيح|flatten|finali[sz]e|نسخه\s+نهائيه|نهائي\s+للطباعه",
    ],
    "render": [
        r"اعرض|عرض|وريني|وروني|شوفلي|معاينه|معاينة|preview|show\s+me|view",
    ],
    "print": [
        r"اطبع|طبع|طباعه|طباعة|print|اطبعهم|اطبعها",
    ],
    "dxf_to_pdf": [
        r"\bdxf\b|دي\s*اكس\s*اف|اتوكاد|أوتوكاد|اوتو\s*كاد|autocad|autodesk|مخطط|بلان|plan|دراوينج|drawing|كرسي|مخططات",
    ],
    "ocr": [
        r"\bocr\b|سكان|اسكان|مسح\s+ضوئي|scan|ممسوح|صورة\s+سكان|متاخذ|متاخد",
        r"خليه\s+يتقرا|اقرا\s+الصورة|اقرا\s+الصوره|اعرف\s+اقرا|نص\s+من\s+الصورة|قابل\s+للبحث|searchable",
        r"استخرج\s+النص\s+من\s+الصوره|النص\s+مش\s+ظاهر|مفيش\s+نص",
    ],
    "dwg_to_pdf": [
        r"\bdwg\b|دي\s*دبليو\s*جي",
    ],
    "rvt_to_pdf": [
        r"\brvt\b|\brfa\b|ريفرت|ريفت|revit|ثلاثي\s+الابعاد\s+المعماري",
    ],
}

# مرادفات مفردة → نية (للكلمات المنفردة الشائعة)
_TOKEN_INTENTS = {
    "دمج": "merge", "ادمج": "merge", "دمجهم": "merge", "دمجها": "merge",
    "اضغط": "compress", "اضغطي": "compress", "صغّر": "compress", "صغير": "compress", "صغر": "compress",
    "دوّر": "rotate", "دور": "rotate", "دير": "rotate", "قلب": "rotate",
    "ختم": "watermark", "ووترمارك": "watermark", "ووترمارك": "watermark",
    "رقّم": "page_numbers", "رقم": "page_numbers",
    "كتيّب": "booklet", "كتيب": "booklet",
    "شفّر": "encrypt", "شفر": "encrypt", "اقفل": "encrypt",
    "افصل": "split", "فصل": "split", "فلّت": "split",
    "صور": "to_images", "صوره": "to_images", "لقطات": "to_images",
    "وورد": "to_word", "word": "to_word",
    "اطبع": "print", "طباعه": "print",
    "عرض": "render", "معاينه": "render", "وريني": "render",
}

# كلمات تقريبية (أخطاء إملائية) لكل نية — للبحث الضبابي
_FUZZY_VOCAB = sorted({
    "دمج", "ادمج", "اضغط", "صغّر", "صغر", "دوّر", "ختم", "رقّم", "رقم",
    "كتيّب", "كتيب", "شفّر", "افصل", "فصل", "صور", "وورد", "اطبع",
    "استخرج", "اطلع", "احذف", "شيل", "امسح", "ظلّل", "علامة", "مائيه",
    "كتابه", "اضافه", "تسطيح", "تشفير", "معاينه", "طباعه",
    "merge", "compress", "split", "rotate", "watermark", "encrypt",
    "extract", "delete", "print", "preview", "booklet",
})

# كلمات يجب ألا تُعتبر أوامر
_STOP = {"في", "من", "على", "الى", "إلى", "عن", "مع", "اللي", "الذي", "التي", "ده", "دي", "دول", "كده", "كدا", "طيب", "معلش", "لو", "سمحت", "من فضلك", "ممكن", "عايز", "محتاج", "ابي", "اريد", "حابب", "عاوز"}


def _detect_intents(clause: str) -> list[tuple[str, float]]:
    """كشف النوايا في جملة — يرجع (النية، قوة الثقة) مرتبة تنازلياً."""
    n = normalize(clause)
    found: dict[str, float] = {}

    # 1) نمط regex — قوة كاملة
    for intent, patterns in INTENT_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, n, re.IGNORECASE):
                found[intent] = max(found.get(intent, 0), 1.0)
                break

    # 2) كلمات مفردة
    for tok in re.findall(r"[\u0621-\u064Aa-z]+", n):
        if tok in _TOKEN_INTENTS:
            intent = _TOKEN_INTENTS[tok]
            found[intent] = max(found.get(intent, 0), 0.95)

    # 3) بحث ضبابي (أخطاء إملائية: «اضعط» «دمجج» «صغيرر»)
    tokens = [t for t in re.findall(r"[\u0621-\u064Aa-z]{3,}", n) if t not in _STOP]
    for tok in tokens:
        if tok in _TOKEN_INTENTS or any(re.search(p, tok) for pats in INTENT_PATTERNS.values() for p in pats[:1]):
            continue
        close = get_close_matches(tok, _FUZZY_VOCAB, n=1, cutoff=0.72)
        if close:
            intent = _TOKEN_INTENTS.get(close[0])
            if not intent:
                for k, pats in INTENT_PATTERNS.items():
                    if any(close[0] in p for p in pats):
                        intent = k
                        break
            if intent:
                found[intent] = max(found.get(intent, 0), 0.72)

    ranked = sorted(found.items(), key=lambda x: -x[1])
    # «ألغي التشفير / فك التشفير / شيل القفل» = فك التشفير وليس تشفيراً
    if "encrypt" in found and re.search(
        r"(?:الغي|الغاء|فك|شيل)\S{0,8}\s*.{0,10}(?:التشفير|الشفره|القفل|الباسورد|password)", n
    ):
        found["decrypt"] = max(found.get("decrypt", 0), found.pop("encrypt"))
        ranked = sorted(found.items(), key=lambda x: -x[1])
    # إزالة التعارض: إذا «صور» + «images_to_pdf» معاً
    if "to_images" in found and "images_to_pdf" in found:
        if re.search(r"(?:ال|هذي|هذه|دي)?.{0,12}pdf", n):
            ranked = [(k, s) for k, s in ranked if k != "to_images"]
        else:
            ranked = [(k, s) for k, s in ranked if k != "images_to_pdf"]
    return ranked


# ---------------------------------------------------------------------------
# استخراج المعطيات
# ---------------------------------------------------------------------------


def _level_of(clause: str, default: str = "medium") -> str:
    n = normalize(clause)
    if re.search(r"اقصي|اقصى|قوي|قويه|بقوه|hard|maximum|max|strong|highest|للاخر|خالص|جامد|ممتاز", n):
        return "strong"
    if re.search(r"خفيف|قليل|بسيط|light|min|اقل|اهون", n):
        return "light"
    return default


def _watermark_text(clause: str) -> str:
    n = normalize(clause)
    # 1) الكلمات المعروفة أولاً (مسودة، سري، معتمد...)
    for word, label in [("مسوده", "مسودة"), ("مسودة", "مسودة"), ("معتمد", "معتمد"),
                        ("سريه", "سري"), ("سريّه", "سري"), ("سري", "سري"), ("سريّ", "سري"),
                        ("final", "FINAL"), ("draft", "DRAFT"), ("confidential", "CONFIDENTIAL")]:
        if re.search(rf"(?<![\u0621-\u064A]){re.escape(word)}(?![\u0621-\u064A])", n):
            return label
    # 2) نص مقتبس
    m = re.search(r"[«\"'\"]([^«\"'\"]{1,40})[»\"'\"]", clause)
    if m:
        return m.group(1)
    # 3) كلمة بعد «ختم/علامة» — مع تجاهل «مائية»
    m = re.search(r"(?:علامه\s*مائيه|علامه|ختم|watermark)\s*[:=]?\s*(?:اسم\s*)?(\S{2,25})", n)
    if m:
        cand = m.group(1)
        if cand not in _STOP and cand not in ("مائيه", "مائية", "علي", "على", "فوق") and not re.fullmatch(r"[\d\-]+", cand):
            return cand
    return "سري"


def _password_of(clause: str) -> str:
    n = normalize(clause)
    m = re.search(r"(?:كلمه\s*سر|كلمه\s*مرور|باسورد|password|رمز)\s*[:=]\s*(\S{2,40})", n)
    if m:
        return m.group(1)
    m = re.search(r"(?:بكلمه|بالباسورد|باسم)\s+(?:سر|مرور)?\s*(\S{2,40})", n)
    if m:
        return m.group(1)
    return "1234"


def _search_replace(clause: str) -> tuple[str, str]:
    m = re.search(
        r"(?:استبدل|بدّل|بدل|replace)\s+[«\"']?([^»\"']+?)[»\"']?\s+(?:بـ|ب|مع|to|with|by)\s+[«\"']?([^»\"']+)",
        clause, re.I,
    )
    return (m.group(1).strip(), m.group(2).strip()) if m else ("", "")


# ---------------------------------------------------------------------------
# طبقة «هل تقصد...؟» — اقتراحات عندما يكون الكلام غير واضح
# ---------------------------------------------------------------------------

_SUGGESTION_TEMPLATES: list[tuple[str, list[str]]] = [
    ("ادمج كل الملفات في ملف واحد ثم اضغطه", ["دمج", "ملف", "جمع", "وحدهم", "مع بعض"]),
    ("اضغط الملف بقوة لتقليل الحجم", ["ضغط", "حجم", "صغير", "صغر", "ميجا"]),
    ("استخرج الصفحات من 1 إلى 3", ["صفحات", "استخرج", "اطلع", "خرج"]),
    ("احذف الصفحة الأولى", ["احذف", "شيل", "امسح", "صفحه", "صفحة"]),
    ("دوّر كل الصفحات 90 درجة", ["دوّر", "دوران", "قلّب", "لف"]),
    ("ضع علامة مائية سري على كل الصفحات", ["ختم", "علامة", "سري", "مسوده", "watermark"]),
    ("رقّم صفحات الملف", ["رقم", "رقّم", "ترقيم"]),
    ("حوّل الملف إلى صور PNG", ["صور", "صورة", "png", "لقطات"]),
    ("حوّل الملف إلى Word", ["وورد", "word", "docx"]),
    ("حوّل ملفات الصور إلى PDF", ["الصور", "pictures", "images"]),
    ("جهّز الملف ككتيّب للطباعة", ["كتيّب", "كتيب", "طباعة", "طي", "booklet"]),
    ("اطبع 4 صفحات في الورقة الواحدة", ["ورقة", "n-up", "توفير", "4"]),
    ("شفّر الملف بكلمة مرور", ["قفل", "شفّر", "باسورد", "كلمه سر", "حماية"]),
    ("فك تشفير الملف", ["فك", "الغي", "شيل القفل"]),
    ("حوّل مخطط AutoCAD أو DXF إلى PDF", ["اتوكاد", "أوتوكاد", "autocad", "dxf", "dwg", "مخطط"]),
    ("حوّل ملف Revit إلى PDF", ["ريفرت", "revit", "rvt"]),
    ("اعرض لي الصفحة الأولى", ["اعرض", "وريني", "شوف", "معاينة"]),
    ("اكتب نصاً على الصفحة", ["اكتب", "نص", "اضف"]),
]


def suggest_commands(text: str) -> list[str]:
    """
    عندما لا يفهم المحرك الكلام — اقترح أقرب الأوامر بناءً على الكلمات
    المفتاحية الموجودة في كلام المستخدم + أشهر الأوامر.
    """
    n = normalize(text or "")
    scored: list[tuple[int, str]] = []
    for cmd, keys in _SUGGESTION_TEMPLATES:
        score = sum(2 for k in keys if k in n)
        # تشابه تقريبي مع الأمر
        if get_close_matches(n[:40], [normalize(cmd)], n=1, cutoff=0.35):
            score += 1
        scored.append((score, cmd))
    scored.sort(key=lambda x: -x[0])
    top = [c for s, c in scored[:5] if s > 0]
    if len(top) < 3:
        # أضف أشهر الأوامر العامة
        for _, cmd in scored:
            if cmd not in top:
                top.append(cmd)
            if len(top) >= 3:
                break
    return top[:3]


# ---------------------------------------------------------------------------
# المفسّر الرئيسي
# ---------------------------------------------------------------------------


def _split_conjunctions(clause: str) -> list[str]:
    """
    تفكيك الجمل المركبة: «شيل الصفحة التانية ورقمهالهم» → خطوتان.
    يجرّب كل مواضع «و» ويقطع فقط حيث تفهم كل جهة كأمر مستقل
    (مهم لأن «واحد» نفسها تبدأ بحرف «و»!).
    """
    for m in re.finditer(r"\s+و(?=\S)", clause):
        left = clause[:m.start()].strip(" ,،")
        right = clause[m.end():].strip(" ,،")
        if len(left) >= 3 and len(right) >= 3 and _detect_intents(left) and _detect_intents(right):
            return _split_conjunctions(left) + _split_conjunctions(right)
    m = re.search(r"\s+and\s+", clause, re.IGNORECASE)
    if m:
        left = clause[:m.start()].strip(" ,،")
        right = clause[m.end():].strip(" ,،")
        if len(left) >= 3 and len(right) >= 3 and _detect_intents(left) and _detect_intents(right):
            return _split_conjunctions(left) + _split_conjunctions(right)
    return [clause]

# أسماء مستويات الضغط بالعربية (للعرض)
_LEVEL_AR = {"light": "خفيف", "medium": "متوسط", "strong": "قوي"}


# خريطة (النية → العملية في خط الأنابيب)
_OP_OF = {
    "merge": "merge", "compress": "compress", "extract_pages": "extract_pages",
    "delete_pages": "delete_pages", "split": "split", "reorder": "reorder",
    "rotate": "rotate", "watermark": "watermark", "page_numbers": "page_numbers",
    "booklet": "booklet", "impose": "impose", "encrypt": "encrypt",
    "decrypt": "decrypt", "to_images": "to_images", "images_to_pdf": "images_to_pdf",
    "to_text": "to_text", "to_word": "to_word", "edit_text": "edit_text",
    "add_text": "add_text", "highlight": "highlight", "fill_form": "fill_form",
    "flatten": "flatten", "render": "render", "print": "print",
    "ocr": "ocr", "is_scanned": "is_scanned",
    "dxf_to_pdf": "dxf_to_pdf", "dwg_to_pdf": "dwg_to_pdf", "rvt_to_pdf": "rvt_to_pdf",
}


def interpret_rules(text: str, file_ids: list[str], file_kinds: dict[str, str] | None = None) -> dict[str, Any]:
    """المستوى 1: فهم محلي بالقواعد والمرادفات واللهجات."""
    text = normalize(text)
    if not text:
        return {"steps": [], "explanation": "", "unknown": [], "confidence": 0.0, "engine": "rules"}
    if not file_ids:
        return {"steps": [], "explanation": "", "unknown": [], "confidence": 0.0,
                "engine": "rules", "error": "أضف ملفاتك أولاً ثم اكتب طلبك."}

    file_kinds = file_kinds or {}
    clauses = [c.strip() for c in _SPLIT.split(text) if c.strip() and c.strip() not in _STOP]
    if not clauses:
        clauses = [text]
    # تفكيك الجمل المركبة (و / and) إلى أوامر منفصلة
    clauses = [part for c in clauses for part in _split_conjunctions(c)]

    steps: list[dict[str, Any]] = []
    labels: list[str] = []
    unknown: list[str] = []
    scores: list[float] = []
    prev_ref: list[str] | None = None

    for clause in clauses:
        intents = _detect_intents(clause)
        if not intents:
            unknown.append(clause)
            continue
        pages = _pages_from(clause)
        built = False
        # جرب أفضل 3 نوايا — إذا فشلت (مثل «شيل» بدون صفحة) انتقل للتالية
        for intent, score in intents[:3]:
            inputs = prev_ref if prev_ref else list(file_ids)
            params: dict[str, Any] = {}
            label = ""

            if intent == "merge":
                params, label = {"output_name": "merged.pdf"}, f"دمج {len(inputs)} ملفات"
            elif intent == "compress":
                lvl = _level_of(clause)
                params, label = {"level": lvl}, f"تصغير الحجم ({_LEVEL_AR.get(lvl, lvl)})"
            elif intent == "extract_pages":
                if not pages:
                    continue
                params, label = {"pages": pages, "output_name": "extracted.pdf"}, f"استخراج الصفحات {pages}"
            elif intent == "delete_pages":
                if not pages:
                    continue
                params, label = {"pages": pages, "output_name": "after_delete.pdf"}, f"حذف الصفحات {pages}"
            elif intent == "rotate":
                m = re.search(r"\b(\d{2,3})\b", clause)
                deg = int(m.group(1)) if m else 90
                deg = 90 if deg % 90 else deg
                params = {"degrees": deg}
                if pages:
                    params["pages"] = pages
                label = f"تدوير {deg}°"
            elif intent == "split":
                params, label = {"every_n_pages": 1, "output_name": "split"}, "فصل كل صفحة"
            elif intent == "watermark":
                wm = _watermark_text(clause)
                params, label = {"text": wm, "output_name": "watermarked.pdf"}, f"علامة مائية «{wm}»"
            elif intent == "page_numbers":
                params, label = {"output_name": "numbered.pdf"}, "ترقيم الصفحات"
            elif intent == "encrypt":
                pw = _password_of(clause)
                params, label = {"password": pw, "output_name": "encrypted.pdf"}, "حماية بكلمة مرور"
            elif intent == "decrypt":
                pw = _password_of(clause)
                params, label = {"password": pw, "output_name": "decrypted.pdf"}, "فك التشفير"
            elif intent == "impose":
                m = re.search(r"(\d+)\s*(?:في|x|up)", clause)
                n = int(m.group(1)) if m else 4
                n = n if n in (2, 4, 6, 9) else 4
                params, label = {"pages_per_sheet": n, "output_name": f"{n}up.pdf"}, f"{n} صفحات في الورقة الواحدة"
            elif intent == "booklet":
                params, label = {"output_name": "booklet.pdf"}, "تجهيز كتيّب"
            elif intent == "to_images":
                params, label = {"image_format": "png", "dpi": 150, "output_name": "images"}, "تحويل إلى صور"
            elif intent == "images_to_pdf":
                inputs = ["@all_images"] if not prev_ref else inputs
                params, label = {"output_name": "from_images.pdf"}, "تحويل الصور إلى PDF"
            elif intent == "to_text":
                params, label = {"output_name": "text.txt"}, "استخراج النص"
            elif intent == "to_word":
                params, label = {"output_name": "document.docx"}, "تحويل إلى Word"
            elif intent == "edit_text":
                s, r = _search_replace(clause)
                if not s:
                    continue
                params, label = {"search": s, "replace": r, "output_name": "edited.pdf"}, f"استبدال «{s}» ← «{r}»"
            elif intent == "add_text":
                params = {"text": "نص", "x": 72, "y": 200, "font_size": 16, "output_name": "text_added.pdf"}
                label = "إضافة نص"
            elif intent == "highlight":
                s, _ = _search_replace(clause)
                if not s:
                    m = re.search(r"(?:ظلّل|ظلل|highlight|علّم|علم)\s+(.+)", clause)
                    s = m.group(1).strip() if m else ""
                if not s:
                    continue
                params, label = {"search": s, "output_name": "highlighted.pdf"}, f"تظليل «{s}»"
            elif intent == "flatten":
                params, label = {"output_name": "flattened.pdf"}, "تثبيت التعديلات نهائيًا"
            elif intent == "fill_form":
                params, label = {"fields": {}, "output_name": "filled.pdf"}, "تعبئة النموذج"
            elif intent == "render":
                params, label = {"page_number": 1, "dpi": 120, "output_name": "preview.png"}, "معاينة الصفحة"
            elif intent == "print":
                params, label = {}, "إرسال إلى الطباعة"
            elif intent == "ocr":
                params, label = {"lang": "ara+eng", "output_name": "ocr.pdf"}, "تفعيل التعرّف الضوئي (نص قابل للبحث)"
            elif intent in ("dxf_to_pdf", "dwg_to_pdf", "rvt_to_pdf"):
                params, label = {"output_name": "cad_output.pdf"}, {"dxf_to_pdf": "DXF ← PDF", "dwg_to_pdf": "DWG ← PDF", "rvt_to_pdf": "RVT ← PDF"}[intent]
                cad_ids = [f for f in inputs if file_kinds.get(f) in ("dxf", "dwg", "rvt")]
                if cad_ids:
                    inputs = cad_ids[:1]
            else:
                continue

            # تجاهل التكرار: نفس العملية ونفس المعطيات مباشرة قبلها
            if steps and steps[-1]["op"] == _OP_OF[intent] and steps[-1]["params"] == params:
                scores.append(score)
                built = True
                break

            steps.append({"op": _OP_OF[intent], "inputs": inputs, "params": params, "label": label})
            labels.append(label)
            scores.append(score)
            prev_ref = ["@prev"]
            built = True
            break

        if not built:
            unknown.append(clause)

    confidence = round(sum(scores) / max(len(clauses), 1), 2) if scores else 0.0
    explanation = " ← ".join(labels) if labels else "لم أفهم أي خطوة"
    if unknown:
        explanation += " — غير مفهوم: " + "، ".join(unknown)

    result = {
        "steps": steps, "explanation": explanation, "unknown": unknown,
        "confidence": confidence, "engine": "rules",
    }
    # الكلام غير واضح؟ اقترح «هل تقصد...؟»
    if not steps or unknown:
        result["suggestions"] = suggest_commands(text)
    return result


# ---------------------------------------------------------------------------
# المستوى 2: الذكاء الاصطناعي المجاني (احتياطي)
# ---------------------------------------------------------------------------

LLM_SYSTEM_PROMPT = """You convert user commands (Arabic dialects or English) about PDF/CAD files into a JSON pipeline.
Available ops and params:
- merge: {output_name} — merge all input files
- compress: {level: light|medium|strong, output_name}
- extract_pages: {pages: "1-3,5", output_name}
- delete_pages: {pages, output_name}
- reorder: {order: "3,1,2", output_name}
- rotate: {degrees: 90|180|270, pages?, output_name?}
- split: {every_n_pages: 1, output_name}
- watermark: {text: string, output_name}
- page_numbers: {output_name}
- encrypt: {password, output_name}
- decrypt: {password, output_name}
- to_images: {dpi: 150, image_format: png|jpg, output_name}
- images_to_pdf: {output_name}
- to_text: {output_name}
- to_word: {output_name}
- edit_text: {search, replace, output_name}
- add_text: {text, x: 72, y: 200, font_size: 12, output_name}
- highlight: {search, output_name}
- fill_form: {fields: {...}, output_name}
- flatten: {output_name}
- impose: {pages_per_sheet: 2|4|6|9, output_name}
- booklet: {output_name}
- render: {page_number: 1, dpi: 120, output_name}
- print: {}
- dxf_to_pdf: {output_name}
- dwg_to_pdf: {output_name}
- rvt_to_pdf: {output_name}

Rules:
- inputs: use ["@prev"] for chained steps (previous output), or ["@all_pdfs"] / ["@all_images"] / ["@all_cad"] for all files of that kind.
- First step usually uses ["@all_pdfs"] (or @all_cad / @all_images depending on task).
- labels: short Arabic label for each step.
Reply ONLY with JSON: {"steps":[{"op":"...","inputs":["..."],"params":{},"label":"..."}]}"""


def llm_interpret(text: str, file_ids: list[str], file_kinds: dict[str, str] | None = None) -> dict[str, Any]:
    """المستوى 2: فهم حر عبر LLM مجاني (Groq / Gemini / أي OpenAI-compatible)."""
    import httpx

    kinds_desc = ", ".join(f"{f}={file_kinds.get(f, 'pdf')}" for f in file_ids[:20])
    user_msg = f"Files: {kinds_desc}\n\nUser command: {text}"

    content = None
    try:
        if os.environ.get("GROQ_API_KEY"):
            r = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
                json={
                    "model": os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant"),
                    "messages": [
                        {"role": "system", "content": LLM_SYSTEM_PROMPT},
                        {"role": "user", "content": user_msg},
                    ],
                    "temperature": 0.1,
                },
                timeout=30,
            )
            content = r.json()["choices"][0]["message"]["content"]

        elif os.environ.get("GEMINI_API_KEY"):
            model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
            r = httpx.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": os.environ["GEMINI_API_KEY"]},
                json={
                    "contents": [{"parts": [{"text": LLM_SYSTEM_PROMPT + "\n\n" + user_msg}]}],
                    "generationConfig": {"temperature": 0.1},
                },
                timeout=30,
            )
            content = r.json()["candidates"][0]["content"]["parts"][0]["text"]

        elif os.environ.get("OPENAI_API_KEY"):
            base = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
            r = httpx.post(
                f"{base}/chat/completions",
                headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
                json={
                    "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
                    "messages": [
                        {"role": "system", "content": LLM_SYSTEM_PROMPT},
                        {"role": "user", "content": user_msg},
                    ],
                    "temperature": 0.1,
                },
                timeout=30,
            )
            content = r.json()["choices"][0]["message"]["content"]
        else:
            return {"error": "no_llm_key"}
    except Exception as e:
        return {"error": f"llm_failed: {e}"}

    if not content:
        return {"error": "llm_empty"}

    # استخراج JSON من الرد (قد يحيط به النموذج بـ ```json)
    m = re.search(r"\{.*\}", content, re.DOTALL)
    if not m:
        return {"error": "llm_bad_json"}
    try:
        data = json.loads(m.group(0))
    except Exception:
        return {"error": "llm_bad_json"}

    valid_ops = {
        "merge", "compress", "extract_pages", "delete_pages", "reorder", "rotate",
        "split", "watermark", "page_numbers", "encrypt", "decrypt", "to_images",
        "images_to_pdf", "to_text", "to_word", "edit_text", "add_text", "highlight",
        "fill_form", "flatten", "impose", "booklet", "render", "print",
        "dxf_to_pdf", "dwg_to_pdf", "rvt_to_pdf",
    }
    steps = []
    for s in data.get("steps", []):
        if s.get("op") in valid_ops:
            steps.append({
                "op": s["op"],
                "inputs": s.get("inputs", ["@prev"]),
                "params": s.get("params", {}),
                "label": s.get("label", s["op"]),
            })
    if not steps:
        return {"error": "llm_no_steps"}
    return {
        "steps": steps,
        "explanation": " ← ".join(s["label"] for s in steps),
        "unknown": [],
        "confidence": 1.0,
        "engine": "ai",
    }


def interpret(text: str, file_ids: list[str], file_kinds: dict[str, str] | None = None,
              mode: str = "auto") -> dict[str, Any]:
    """
    الواجهة الموحدة:
      mode=auto   → قواعد أولاً، وإن كانت الثقة ضعيفة يُستدعى AI المجاني
      mode=rules  → القواعد فقط
      mode=ai     → AI مباشرة (إن وُجد مفتاح)
    """
    if mode == "ai":
        r = llm_interpret(text, file_ids, file_kinds)
        return r if "error" not in r else interpret_rules(text, file_ids, file_kinds)

    r = interpret_rules(text, file_ids, file_kinds)

    if mode == "auto":
        weak = (not r["steps"]) or (r["confidence"] < 0.75 and len(r.get("unknown", [])) > 0)
        if weak and (os.environ.get("GROQ_API_KEY") or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")):
            ai = llm_interpret(text, file_ids, file_kinds)
            if "error" not in ai:
                ai["fallback_from"] = "rules"
                return ai
        # لا AI متاح؟ أبقِ اقتراحات «هل تقصد»
        if not r.get("suggestions"):
            r["suggestions"] = suggest_commands(text)
    return r


# ---------------------------------------------------------------------------
# الوصفات الذكية (اقتراحات حسب الملفات المرفوعة)
# ---------------------------------------------------------------------------


def suggest_recipes(kinds: list[str]) -> list[dict[str, Any]]:
    recipes: list[dict[str, Any]] = []
    pdfs = kinds.count("pdf") + kinds.count("pdf_scanned")
    images = kinds.count("image")
    cad = sum(1 for k in kinds if k in ("dxf", "dwg", "rvt"))
    scanned = kinds.count("pdf_scanned")

    if scanned >= 1:
        recipes.insert(0, {
            "id": "ocr", "title": "📷 مستند ممسوح؟ فعّل البحث في النص",
            "desc": f"{scanned} من ملفاتك ممسوحة ضوئيًا — اجعلها قابلة للبحث والتعديل",
            "steps": [
                {"op": "ocr", "inputs": ["@all_pdfs"], "params": {"lang": "ara+eng", "output_name": "searchable.pdf"}},
            ],
        })

    if pdfs >= 2:
        recipes.append({
            "id": "pack", "title": "📦 تجميع المستندات", "desc": f"دمج {pdfs} ملفات ← ترقيم ← تصغير الحجم",
            "steps": [
                {"op": "merge", "inputs": ["@all_pdfs"], "params": {"output_name": "pack.pdf"}},
                {"op": "page_numbers", "inputs": ["@prev"], "params": {}},
                {"op": "compress", "inputs": ["@prev"], "params": {"level": "medium"}},
            ],
        })
    if pdfs >= 1:
        recipes.append({
            "id": "official", "title": "📑 مستند رسمي", "desc": "ختم «معتمد» ← ترقيم ← تثبيت ← تصغير الحجم",
            "steps": [
                {"op": "watermark", "inputs": ["@all_pdfs"], "params": {"text": "معتمد", "output_name": "stamped.pdf"}},
                {"op": "page_numbers", "inputs": ["@prev"], "params": {}},
                {"op": "flatten", "inputs": ["@prev"], "params": {"output_name": "flat.pdf"}},
                {"op": "compress", "inputs": ["@prev"], "params": {"level": "strong"}},
            ],
        })
        recipes.append({
            "id": "email", "title": "✉️ جاهز للإرسال", "desc": "أقصى تصغير للحجم ← جاهز للإرسال بالبريد",
            "steps": [{"op": "compress", "inputs": ["@all_pdfs"], "params": {"level": "strong"}}],
        })
        recipes.append({
            "id": "booklet", "title": "📖 كتيّب للطباعة", "desc": "تجهيز للطباعة على وجهين مع الطي",
            "steps": [{"op": "booklet", "inputs": ["@all_pdfs"], "params": {"output_name": "booklet.pdf"}}],
        })
    if images >= 2:
        recipes.append({
            "id": "imgs", "title": "🖼️ الصور إلى مستند واحد", "desc": f"جمع {images} صور في ملف PDF واحد",
            "steps": [{"op": "images_to_pdf", "inputs": ["@all_images"], "params": {"output_name": "images.pdf"}}],
        })
    if cad >= 1:
        recipes.append({
            "id": "cad", "title": "🏗️ مخططات إلى PDF", "desc": "تحويل رسم CAD ← تصغير الحجم ← جاهز للمشاركة",
            "steps": [
                {"op": "@auto_cad", "inputs": ["@all_cad"], "params": {"output_name": "plan.pdf"}},
                {"op": "compress", "inputs": ["@prev"], "params": {"level": "medium"}},
            ],
        })
    return recipes
~~~~


## 📄 `webapp/main.py`
**خادم الموقع FastAPI (النسخة المحلية الحولية)** — (557 سطر)

~~~~
"""
main.py — خادم ويب محطّة PDF (FastAPI)
======================================
واجهة ويب مبتكرة: شريط أوامر ذكي + خط أنابيب مرئي + وصفات + استوديو طباعة.

التشغيل:  python run_webapp.py     (أو: uvicorn webapp.main:app --host 0.0.0.0 --port 8000)
المحرك:   pdf_engine.py + cad_engine.py (نفس محرك الـ MCP تماماً)
"""

from __future__ import annotations

import json
import shutil
import time
import uuid
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

import sys
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import pdf_engine as engine  # noqa: E402
import cad_engine  # noqa: E402
from webapp.interpreter import interpret, suggest_recipes  # noqa: E402

DATA = Path(__file__).resolve().parent / "data"
UPLOADS = DATA / "uploads"
OUTPUTS = DATA / "outputs"
for d in (UPLOADS, OUTPUTS):
    d.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="محطّة PDF — أدوات PDF وCAD", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# مخزن الملفات والسجل
# ---------------------------------------------------------------------------


@dataclass
class FileRec:
    id: str
    name: str
    path: str
    kind: str
    size: int
    pages: int | None = None
    source: str = "upload"
    created: float = field(default_factory=time.time)
    scanned: bool = False


FILES: dict[str, FileRec] = {}
HISTORY: list[dict[str, Any]] = []

KIND_BY_EXT = {
    ".pdf": "pdf", ".png": "image", ".jpg": "image", ".jpeg": "image", ".gif": "image", ".webp": "image", ".bmp": "image",
    ".dxf": "dxf", ".dwg": "dwg", ".rvt": "rvt", ".rte": "rvt", ".rfa": "rvt",
    ".docx": "docx", ".txt": "text",
}


def _kind_of(name: str) -> str:
    return KIND_BY_EXT.get(Path(name).suffix.lower(), "other")


def _pages_of(path: Path, kind: str) -> int | None:
    try:
        if kind == "pdf":
            return engine.pdf_page_count(str(path))
    except Exception:
        pass
    return None


def _register(path: Path, name: str | None = None, source: str = "upload") -> FileRec:
    kind = _kind_of(name or path.name)
    rec = FileRec(
        id=uuid.uuid4().hex[:12],
        name=name or path.name,
        path=str(path),
        kind=kind,
        size=path.stat().st_size,
        pages=_pages_of(path, kind),
        source=source,
    )
    # كشف تلقائي: هل هو PDF ممسوح ضوئياً (يحتاج OCR)؟
    if kind == "pdf" and rec.pages:
        try:
            rec.scanned = bool(engine.pdf_is_scanned(str(path))["scanned"])
        except Exception:
            rec.scanned = False
    FILES[rec.id] = rec
    return rec


def _resolve_inputs(refs: list[str], step_outputs: dict[str, Path]) -> list[Path]:
    paths: list[Path] = []
    for ref in refs:
        if ref == "@prev":
            if not step_outputs:
                raise HTTPException(400, "لا توجد خطوة سابقة")
            paths.append(list(step_outputs.values())[-1])
        elif ref.startswith("@step:"):
            key = ref.split(":", 1)[1]
            if key not in step_outputs:
                raise HTTPException(400, f"رابط خطوة غير صحيح: {ref}")
            paths.append(step_outputs[key])
        elif ref == "@all_pdfs":
            paths.extend(Path(f.path) for f in FILES.values() if f.kind == "pdf" and f.source == "upload")
        elif ref == "@all_images":
            paths.extend(Path(f.path) for f in FILES.values() if f.kind == "image" and f.source == "upload")
        elif ref == "@all_cad":
            paths.extend(Path(f.path) for f in FILES.values() if f.kind in ("dxf", "dwg", "rvt") and f.source == "upload")
        else:
            rec = FILES.get(ref)
            if not rec:
                raise HTTPException(400, f"ملف غير موجود: {ref}")
            paths.append(Path(rec.path))
    return paths


# ---------------------------------------------------------------------------
# محوّلات العمليات (السجل الموحد)
# ---------------------------------------------------------------------------


def _out_path(name: str, step_id: str) -> Path:
    safe = re_sub_safe(name)
    return OUTPUTS / f"{step_id[:6]}_{safe}"


def re_sub_safe(name: str) -> str:
    import re
    name = re.sub(r"[^\w\.\-\u0600-\u06FF]", "_", name or "output")
    return name[:80]


def _one(fn, inputs, params, step_id, default_name):
    """مساعد: عملية بمدخل واحد → ملف واحد."""
    out_name = params.get("output_name") or default_name
    out = _out_path(out_name, step_id)
    params = dict(params)
    params.pop("output_name", None)
    result = fn(inputs[0], str(out), **params)
    return [Path(result["output"] if isinstance(result, dict) and "output" in result else out)]


def op_merge(inputs, params, step_id):
    out = _out_path(params.get("output_name", "merged.pdf"), step_id)
    engine.pdf_merge([str(p) for p in inputs], str(out))
    return [out]


def op_compress(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_compress(p, o, **kw), inputs, params, step_id, "compressed.pdf")


def op_extract_pages(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_extract_pages(p, **kw, output=o), inputs, params, step_id, "extracted.pdf")


def op_delete_pages(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_delete_pages(p, **kw, output=o), inputs, params, step_id, "deleted.pdf")


def op_reorder(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_reorder_pages(p, **kw, output=o), inputs, params, step_id, "reordered.pdf")


def op_rotate(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_rotate(p, output=o, **kw), inputs, params, step_id, "rotated.pdf")


def op_split(inputs, params, step_id):
    odir = OUTPUTS / f"{step_id[:6]}_split"
    r = engine.pdf_split(str(inputs[0]), str(odir), every_n_pages=int(params.get("every_n_pages", 1)),
                         ranges=params.get("ranges"))
    return [Path(x) for x in r["outputs"]]


def op_watermark(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_watermark(p, o, **kw), inputs, params, step_id, "watermarked.pdf")


def op_page_numbers(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_add_page_numbers(p, o, **kw), inputs, params, step_id, "numbered.pdf")


def op_encrypt(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_encrypt(p, **kw, output=o), inputs, params, step_id, "encrypted.pdf")


def op_decrypt(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_decrypt(p, **kw, output=o), inputs, params, step_id, "decrypted.pdf")


def op_to_images(inputs, params, step_id):
    odir = OUTPUTS / f"{step_id[:6]}_images"
    r = engine.pdf_to_images(str(inputs[0]), str(odir),
                             image_format=params.get("image_format", "png"),
                             dpi=int(params.get("dpi", 150)),
                             pages=params.get("pages"))
    return [Path(x) for x in r["outputs"]]


def op_images_to_pdf(inputs, params, step_id):
    out = _out_path(params.get("output_name", "images.pdf"), step_id)
    engine.images_to_pdf([str(p) for p in inputs], str(out), page_size=params.get("page_size", "image"))
    return [out]


def op_to_text(inputs, params, step_id):
    r = engine.pdf_to_text(str(inputs[0]), pages=params.get("pages"))
    out = _out_path(params.get("output_name", "text.txt"), step_id)
    out.write_text(r["full_text"], encoding="utf-8")
    return [out]


def op_to_word(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_to_word(p, o), inputs, params, step_id, "document.docx")


def op_edit_text(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_edit_text(p, **kw, output=o), inputs, params, step_id, "edited.pdf")


def op_add_text(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_add_text(p, output=o, **kw), inputs, params, step_id, "text_added.pdf")


def op_add_image(inputs, params, step_id):
    p = dict(params)
    image = p.pop("image", None)
    if not image and len(inputs) > 1:
        image = str(inputs[1])
        inputs = inputs[:1]
    if not image:
        raise HTTPException(400, "خطوة إضافة صورة تحتاج مسار صورة (image)")
    return _one(lambda src, o, **kw: engine.pdf_add_image(src, image, o, **kw), inputs, p, step_id, "stamped.pdf")


def op_highlight(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_highlight_text(p, output=o, **kw), inputs, params, step_id, "highlighted.pdf")


def op_add_note(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_add_note(p, output=o, **kw), inputs, params, step_id, "noted.pdf")


def op_fill_form(inputs, params, step_id):
    fields = params.get("fields", {})
    return _one(lambda p, o, **kw: engine.pdf_fill_form(p, fields, o), inputs, {}, step_id, "filled.pdf")


def op_flatten(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_flatten(p, o), inputs, params, step_id, "flattened.pdf")


def op_impose(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_impose(p, o, **kw), inputs, params, step_id, "imposed.pdf")


def op_booklet(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_booklet(p, o, **kw), inputs, params, step_id, "booklet.pdf")


def op_render(inputs, params, step_id):
    r = engine.pdf_render_page(str(inputs[0]), int(params.get("page_number", 1)),
                               str(_out_path(params.get("output_name", "preview.png"), step_id)),
                               dpi=int(params.get("dpi", 150)))
    return [Path(r["output"])]


def op_print(inputs, params, step_id):
    r = engine.pdf_print(str(inputs[0]), **params)
    out = _out_path("print_job.txt", step_id)
    out.write_text(json.dumps(r, ensure_ascii=False), encoding="utf-8")
    return [out]


def op_ocr(inputs, params, step_id):
    return _one(lambda p, o, **kw: engine.pdf_ocr(p, o, **kw), inputs, params, step_id, "ocr.pdf")


def op_is_scanned(inputs, params, step_id):
    r = engine.pdf_is_scanned(str(inputs[0]))
    out = _out_path("scan_check.txt", step_id)
    out.write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")
    return [out]


def op_dxf_to_pdf(inputs, params, step_id):
    p = dict(params)
    p.pop("output_name", None)
    r = cad_engine.dxf_to_pdf(str(inputs[0]), str(_out_path(params.get("output_name", "from_dxf.pdf"), step_id)), **p)
    return [Path(r["output"])]


def op_dwg_to_pdf(inputs, params, step_id):
    r = cad_engine.dwg_to_pdf(str(inputs[0]), str(_out_path(params.get("output_name", "from_dwg.pdf"), step_id)),
                              method=params.get("method", "auto"))
    return [Path(r["output"])]


def op_rvt_to_pdf(inputs, params, step_id):
    r = cad_engine.rvt_to_pdf(str(inputs[0]), str(_out_path(params.get("output_name", "from_rvt.pdf"), step_id)))
    return [Path(r["output"])]


OPS: dict[str, Any] = {
    "merge": op_merge, "compress": op_compress, "extract_pages": op_extract_pages,
    "delete_pages": op_delete_pages, "reorder": op_reorder, "rotate": op_rotate,
    "split": op_split, "watermark": op_watermark, "page_numbers": op_page_numbers,
    "encrypt": op_encrypt, "decrypt": op_decrypt, "to_images": op_to_images,
    "images_to_pdf": op_images_to_pdf, "to_text": op_to_text, "to_word": op_to_word,
    "edit_text": op_edit_text, "add_text": op_add_text, "add_image": op_add_image,
    "highlight": op_highlight, "add_note": op_add_note, "fill_form": op_fill_form,
    "flatten": op_flatten, "impose": op_impose, "booklet": op_booklet,
    "render": op_render, "print": op_print,
    "ocr": op_ocr, "is_scanned": op_is_scanned,
    "dxf_to_pdf": op_dxf_to_pdf, "dwg_to_pdf": op_dwg_to_pdf, "rvt_to_pdf": op_rvt_to_pdf,
}


# ---------------------------------------------------------------------------
# نماذج الطلبات
# ---------------------------------------------------------------------------


class Step(BaseModel):
    op: str
    inputs: list[str] = []
    params: dict[str, Any] = {}
    label: str | None = None


class Pipeline(BaseModel):
    steps: list[Step]


class Command(BaseModel):
    text: str
    file_ids: list[str] = []
    mode: str = "auto"  # auto | rules | ai


class PrintPreviewReq(BaseModel):
    file_id: str
    mode: str = "4up"  # 2up | 4up | booklet


# ---------------------------------------------------------------------------
# المسارات (API)
# ---------------------------------------------------------------------------


@app.get("/api/health")
def health():
    return {"ok": True, "files": len(FILES), "ops": len(OPS)}


@app.post("/api/files")
async def upload_files(files: list[UploadFile] = File(...)):
    out = []
    for f in files:
        dest = UPLOADS / f"{uuid.uuid4().hex[:8]}_{re_sub_safe(f.filename or 'file')}"
        with open(dest, "wb") as fh:
            shutil.copyfileobj(f.file, fh)
        rec = _register(dest, name=f.filename or dest.name)
        out.append(asdict(rec))
    return {"files": out}


@app.get("/api/files")
def list_files():
    return {"files": [asdict(f) for f in sorted(FILES.values(), key=lambda x: -x.created)]}


@app.get("/api/files/{fid}/thumb")
def thumb(fid: str, page: int = 1, dpi: int = 72):
    rec = FILES.get(fid)
    if not rec:
        raise HTTPException(404, "ملف غير موجود")
    p = Path(rec.path)
    cache = OUTPUTS / f"thumb_{fid}_{page}_{dpi}.png"
    if not cache.exists():
        try:
            if rec.kind == "pdf":
                engine.pdf_render_page(str(p), max(1, page), str(cache), dpi=dpi)
            elif rec.kind == "image":
                from PIL import Image
                im = Image.open(p)
                im.thumbnail((400, 400))
                im.save(cache, "PNG")
            elif rec.kind in ("dxf", "dwg", "rvt"):
                # معاينة CAD: حوّل أولاً ثم اعرض
                tmp_pdf = OUTPUTS / f"cadpreview_{fid}.pdf"
                if rec.kind == "dxf" and not tmp_pdf.exists():
                    cad_engine.dxf_to_pdf(str(p), str(tmp_pdf), spaces="model")
                if tmp_pdf.exists():
                    engine.pdf_render_page(str(tmp_pdf), 1, str(cache), dpi=dpi)
                else:
                    raise HTTPException(200, "المعاينة تحتاج محوّل CAD")
            else:
                raise HTTPException(400, "لا توجد معاينة لهذا النوع")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(500, f"فشل إنشاء المعاينة: {e}")
    return FileResponse(str(cache), media_type="image/png")


@app.get("/api/files/{fid}/download")
def download(fid: str):
    rec = FILES.get(fid)
    if not rec:
        raise HTTPException(404, "ملف غير موجود")
    return FileResponse(rec.path, filename=rec.name)


@app.delete("/api/files/{fid}")
def delete_file(fid: str):
    FILES.pop(fid, None)
    return {"ok": True}


@app.post("/api/interpret")
def api_interpret(cmd: Command):
    kinds = {f: (FILES[f].kind if f in FILES else "pdf") for f in cmd.file_ids}
    result = interpret(cmd.text, cmd.file_ids, kinds, mode=cmd.mode)
    kinds_for_recipes = [
        ("pdf_scanned" if (FILES[f].kind == "pdf" and FILES[f].scanned) else FILES[f].kind)
        for f in cmd.file_ids if f in FILES
    ]
    recipes = suggest_recipes(kinds_for_recipes)
    return {**result, "recipes": recipes}


@app.post("/api/run")
def run_pipeline(pipe: Pipeline):
    if not pipe.steps:
        raise HTTPException(400, "أضف خطوة واحدة على الأقل")
    step_outputs: dict[str, Path] = {}
    results = []
    t_all = time.time()

    for i, step in enumerate(pipe.steps):
        step_id = f"step{i}_{uuid.uuid4().hex[:6]}"
        if step.op.startswith("@"):
            # محوّل تلقائي (يُستخدم في الوصفات): @auto_cad
            paths = _resolve_inputs(step.inputs, step_outputs)
            if not paths:
                raise HTTPException(400, f"الخطوة {i+1}: لا توجد ملفات للعمل عليها")
            ext = paths[0].suffix.lower()
            step_op = {".dxf": "dxf_to_pdf", ".dwg": "dwg_to_pdf", ".rvt": "rvt_to_pdf"}.get(ext, "dxf_to_pdf")
        else:
            step_op = step.op

        fn = OPS.get(step_op)
        if not fn:
            raise HTTPException(400, f"عملية غير معروفة: {step_op}")

        paths = _resolve_inputs(step.inputs, step_outputs)
        if not paths and step_op not in ():
            raise HTTPException(400, f"الخطوة {i+1} ({step_op}): لا توجد ملفات للعمل عليها")

        t0 = time.time()
        try:
            outs = fn(paths, dict(step.params), step_id)
        except engine.PDFEngineError as e:
            raise HTTPException(400, f"الخطوة {i+1} ({step.label or step_op}): {e}")
        except cad_engine.CADEngineError as e:
            raise HTTPException(400, f"الخطوة {i+1} ({step.label or step_op}): {e}")
        except Exception as e:
            raise HTTPException(500, f"الخطوة {i+1} ({step_op}): {type(e).__name__}: {e}")
        dur = round(time.time() - t0, 2)

        out_recs = []
        for o in outs:
            rec = _register(o, name=o.name, source=step_id)
            step_outputs[step_id] = Path(o)
            out_recs.append(asdict(rec))
        results.append({
            "step": i + 1,
            "op": step_op,
            "label": step.label or step_op,
            "duration": dur,
            "outputs": out_recs,
        })
        step_outputs[f"step{i}"] = Path(outs[-1])

    total = round(time.time() - t_all, 2)
    HISTORY.insert(0, {
        "id": uuid.uuid4().hex[:8],
        "time": time.time(),
        "steps": [s.label or s.op for s in pipe.steps],
        "total_duration": total,
        "outputs": [{"id": o["id"], "name": o["name"], "size": o["size"]} for r in results for o in r["outputs"]],
    })
    return {"ok": True, "total_duration": total, "results": results, "history_id": HISTORY[0]["id"]}


@app.post("/api/print-preview")
def print_preview(req: PrintPreviewReq):
    rec = FILES.get(req.file_id)
    if not rec:
        raise HTTPException(404, "ملف غير موجود")
    mode = req.mode
    step_id = f"print_{uuid.uuid4().hex[:6]}"
    try:
        if mode == "booklet":
            outs = op_booklet([Path(rec.path)], {"output_name": "booklet_preview.pdf"}, step_id)
        else:
            n = 2 if mode == "2up" else 4
            outs = op_impose([Path(rec.path)], {"pages_per_sheet": n, "output_name": f"{n}up_preview.pdf"}, step_id)
    except engine.PDFEngineError as e:
        raise HTTPException(400, str(e))
    out_rec = _register(outs[0], name=outs[0].name, source=step_id)
    return {"ok": True, "file": asdict(out_rec)}


@app.get("/api/recipes")
def get_recipes():
    kinds = [
        ("pdf_scanned" if (f.kind == "pdf" and f.scanned) else f.kind)
        for f in FILES.values() if f.source == "upload"
    ]
    return {"recipes": suggest_recipes(kinds)}


@app.get("/api/history")
def get_history():
    return {"history": HISTORY[:30]}


@app.get("/api/ops")
def get_ops():
    return {"ops": sorted(OPS.keys())}


# تحميل الواجهة
from fastapi.staticfiles import StaticFiles  # noqa: E402

app.mount("/", StaticFiles(directory=str(Path(__file__).parent / "static"), html=True), name="static")
~~~~


## 📄 `webapp/static/index.html`
**واجهة الموقع — ثيم فاتح منظم + عربية سوق كاملة** — (385 سطر)

~~~~
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>محطّة PDF — أدوات PDF وCAD في مكان واحد</title>
<style>
:root{
  --bg:#F4F6FB; --card:#FFFFFF; --line:#E5E8F0; --line2:#D6DBE8;
  --ink:#1B2438; --ink2:#5B6684; --ink3:#8A93AC;
  --brand:#4F55E3; --brand-soft:#EEF0FE; --brand-line:#C8CCFA;
  --ok:#0E9F6E; --ok-soft:#E6F7F0; --warn:#B45309; --warn-soft:#FEF6E7; --err:#DC2626; --err-soft:#FDECEC;
  --r:14px; --shadow:0 1px 2px rgba(27,36,56,.05), 0 8px 24px rgba(27,36,56,.06);
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Segoe UI","Noto Sans Arabic","Tajawal",Tahoma,system-ui,sans-serif;background:var(--bg);color:var(--ink);font-size:14.5px;line-height:1.6}
button{font-family:inherit}
.wrap{max-width:1360px;margin:0 auto;padding:20px 22px 34px}
.top{display:flex;align-items:center;gap:14px;margin-bottom:18px}
.brand{display:flex;align-items:center;gap:11px}
.brand .logo{width:42px;height:42px;border-radius:12px;background:var(--brand);color:#fff;display:grid;place-items:center;font-size:20px;box-shadow:0 6px 16px rgba(79,85,227,.28)}
.brand h1{font-size:1.18rem;font-weight:800}
.brand .tag{color:var(--ink2);font-size:.78rem}
.grow{flex:1}
.btn{border:1px solid var(--line2);background:var(--card);color:var(--ink);border-radius:11px;padding:9px 16px;font-size:.86rem;font-weight:700;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:7px}
.btn:hover{border-color:var(--brand);color:var(--brand);background:var(--brand-soft)}
.btn-primary{background:var(--brand);color:#fff;border-color:var(--brand);box-shadow:0 6px 16px rgba(79,85,227,.22)}
.btn-primary:hover{background:#3F45D4;color:#fff;transform:translateY(-1px)}
.btn-primary:disabled{opacity:.55;transform:none;cursor:not-allowed}
.btn-sm{padding:7px 12px;font-size:.78rem;border-radius:9px}
.command{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px;box-shadow:var(--shadow);margin-bottom:16px}
.command .row{display:flex;align-items:center;gap:10px}
.command .icon{width:40px;height:40px;border-radius:11px;background:var(--brand-soft);color:var(--brand);display:grid;place-items:center;font-size:19px;flex:none}
.command input{flex:1;border:0;outline:0;font-size:1.02rem;font-family:inherit;color:var(--ink);background:transparent;padding:10px 4px}
.command input::placeholder{color:var(--ink3)}
.grid{display:grid;grid-template-columns:296px minmax(0,1fr) 312px;gap:15px;align-items:start}
.panel{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden}
.panel .head{display:flex;align-items:center;gap:9px;padding:13px 16px;border-bottom:1px solid var(--line);font-weight:800;font-size:.9rem}
.panel .head .stepno{width:24px;height:24px;border-radius:8px;background:var(--brand);color:#fff;display:grid;place-items:center;font-size:.74rem;font-weight:900;flex:none}
.panel .head .meta{margin-right:auto;color:var(--ink3);font-size:.74rem;font-weight:600}
.panel .body{padding:14px}
.drop{border:2px dashed var(--brand-line);border-radius:12px;padding:20px 12px;text-align:center;cursor:pointer;background:var(--brand-soft);transition:.15s;margin-bottom:12px}
.drop:hover,.drop.over{border-color:var(--brand);background:#E4E7FD}
.drop .big{font-size:1.55rem;margin-bottom:5px}
.drop p{color:var(--ink2);font-size:.8rem;line-height:1.85}
.file{display:flex;gap:10px;align-items:center;padding:9px 10px;border:1px solid var(--line);border-radius:11px;margin-bottom:8px;background:#FCFDFF}
.file .th{width:42px;height:54px;border-radius:8px;background:#F0F2F9;border:1px solid var(--line);overflow:hidden;display:grid;place-items:center;flex:none;font-size:1.05rem}
.file .th img{width:100%;height:100%;object-fit:cover}
.file .nm{font-size:.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.tag{display:inline-block;padding:1.5px 8px;border-radius:999px;font-size:.65rem;font-weight:800;border:1px solid var(--line2);color:var(--ink2);background:#fff;margin:3px 0 0 3px}
.tag.brand{background:var(--brand-soft);color:var(--brand);border-color:var(--brand-line)}
.tag.ok{background:var(--ok-soft);color:var(--ok);border-color:#B7E4D0}
.tag.warn{background:var(--warn-soft);color:var(--warn);border-color:#F0D9A8}
.step{display:flex;gap:11px;align-items:flex-start;padding:12px 13px;border:1px solid var(--line);border-radius:12px;margin-bottom:9px;background:#FCFDFF}
.step .n{width:27px;height:27px;border-radius:9px;background:var(--brand-soft);color:var(--brand);display:grid;place-items:center;font-weight:900;font-size:.8rem;flex:none;margin-top:1px}
.step .op{font-weight:800;font-size:.88rem;display:flex;align-items:center;gap:7px}
.step .params{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
.step .params input,.step .params select{border:1px solid var(--line2);border-radius:9px;padding:6px 10px;font-size:.76rem;font-family:inherit;color:var(--ink);background:#fff;outline:0}
.step .params label{display:flex;flex-direction:column;gap:3px;font-size:.68rem;color:var(--ink3);font-weight:700}
.step .tools{display:flex;gap:4px;flex:none;margin-top:2px}
.step .tools button{width:25px;height:25px;border-radius:8px;border:1px solid var(--line);cursor:pointer;background:#fff;color:var(--ink3);font-size:.72rem}
.step .tools button:hover{color:var(--brand);border-color:var(--brand-line);background:var(--brand-soft)}
.arrow{width:2px;height:14px;background:var(--brand-line);margin:0 auto 9px;border-radius:2px}
.addstep{border:2px dashed var(--line2);border-radius:12px;padding:12px;text-align:center;color:var(--ink3);cursor:pointer;font-size:.84rem;font-weight:700;transition:.15s}
.addstep:hover{border-color:var(--brand);color:var(--brand);background:var(--brand-soft)}
#opMenu{display:none;flex-wrap:wrap;gap:7px;margin-top:10px}
.recipe{padding:12px 13px;border:1px solid var(--line);border-radius:11px;margin-bottom:8px;cursor:pointer;transition:.15s;background:#FCFDFF}
.recipe:hover{border-color:var(--brand);background:var(--brand-soft);transform:translateY(-1px)}
.recipe .t{font-weight:800;font-size:.84rem}
.recipe .d{font-size:.73rem;color:var(--ink2);margin-top:3px}
.empty{color:var(--ink3);font-size:.81rem;text-align:center;padding:22px 10px;line-height:2.1}
.note{font-size:.78rem;color:var(--ink2);line-height:2.15;padding:4px 2px}
#toasts{position:fixed;bottom:20px;right:20px;z-index:90;display:flex;flex-direction:column;gap:9px}
.toast{padding:12px 16px;border-radius:12px;background:#fff;border:1px solid var(--line2);color:var(--ink);font-size:.83rem;box-shadow:0 12px 34px rgba(27,36,56,.14);max-width:370px;animation:in .25s ease}
.toast.ok{border-color:#B7E4D0;background:var(--ok-soft)}
.toast.err{border-color:#F3C1C1;background:var(--err-soft)}
@keyframes in{from{opacity:0;transform:translateY(12px)}to{opacity:1}}
.spin{width:16px;height:16px;border:3px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite;display:inline-block}
@keyframes sp{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div class="brand">
      <div class="logo">⚡</div>
      <div><h1>محطّة PDF</h1><div class="tag">أدوات PDF وCAD في مكان واحد — سهلة وسريعة</div></div>
    </div>
    <div class="grow"></div>
    <div class="btn" id="healthPill" style="cursor:default">… جارٍ التحقق</div>
  </div>

  <div class="command">
    <div class="row">
      <div class="icon">🧠</div>
      <input id="cmd" placeholder="اكتب طلبك هنا… مثلاً: «ادمج الملفات ثم صغّر حجمها»" autocomplete="off">
      <button class="btn" onclick="doInterpret()">اقترح الخطوات ✦</button>
      <button class="btn btn-primary" onclick="doRun()">تنفيذ ⚡</button>
    </div>
  </div>

  <div class="grid">
    <section class="panel">
      <div class="head"><span class="stepno">١</span> الملفات <span class="meta" id="fcount">لا توجد ملفات</span></div>
      <div class="body">
        <div class="drop" id="drop" onclick="document.getElementById('fi').click()">
          <div class="big">⬇️</div>
          <p><b>أفلت الملفات هنا</b><br><small>أو اضغط للاختيار — PDF · DXF · DWG · RVT · صور</small></p>
        </div>
        <input type="file" id="fi" multiple hidden accept=".pdf,.dxf,.dwg,.rvt,.png,.jpg,.jpeg,.gif,.webp,.bmp">
        <div id="flist"></div>
      </div>
    </section>

    <section class="panel">
      <div class="head">
        <span class="stepno">٢</span> الخطوات
        <span class="meta" id="scount">لا توجد خطوات</span>
        <button class="btn btn-sm" onclick="clearSteps()">🗑️ مسح الكل</button>
        <button class="btn btn-primary btn-sm" id="runBtn" onclick="doRun()">▶️ تنفيذ</button>
      </div>
      <div class="body">
        <div id="steps"></div>
        <div class="empty" id="emptyHint"><div style="font-size:1.9rem;margin-bottom:8px">🧩</div>ارفع ملفاتك ثم اكتب طلبك — أو أضف الخطوات بنفسك</div>
        <div class="addstep" onclick="toggleOps(event)">＋ إضافة خطوة جديدة</div>
        <div id="opMenu"></div>
      </div>
    </section>

    <section class="panel">
      <div class="head"><span class="stepno">٣</span> مهام شائعة</div>
      <div class="body" id="recipes"><div class="empty">أضف ملفاتك لتظهر المهام المقترحة</div></div>
      <div class="head" style="border-top:1px solid var(--line)">ℹ️ ملاحظات</div>
      <div class="body">
        <div class="note">
          ✍️ اكتب طلبك بالعربية وسيتحول تلقائيًا إلى خطوات جاهزة<br>
          🖨️ اضغط 🖨️ على أي ملف PDF لمعاينة شكل الطباعة<br>
          🏗️ ملفات DXF تُحوَّل مباشرة — وDWG وRVT عند توفّر المحول<br>
          📷 الملفات الممسوحة ضوئيًا تحتاج محرك التعرّف الضوئي
        </div>
      </div>
    </section>
  </div>
</div>
<div id="toasts"></div>
<script>
const $=s=>document.querySelector(s);
const OPS={
  merge:{icon:"🔗",label:"دمج الملفات",f:[]},
  compress:{icon:"🗜️",label:"تصغير حجم الملف",f:[{k:"level",t:[{v:"light",t:"خفيف"},{v:"medium",t:"متوسط"},{v:"strong",t:"قوي"}],d:"medium",l:"درجة الضغط"}]},
  extract_pages:{icon:"✂️",label:"استخراج صفحات",f:[{k:"pages",t:"text",d:"1-3",l:"أرقام الصفحات",p:"مثال: 1-3،5"}]},
  delete_pages:{icon:"🗑️",label:"حذف صفحات",f:[{k:"pages",t:"text",d:"2",l:"أرقام الصفحات",p:"مثال: 2"}]},
  rotate:{icon:"🔄",label:"تدوير الصفحات",f:[{k:"degrees",t:[{v:90,t:"90°"},{v:180,t:"180°"},{v:270,t:"270°"}],d:90,l:"الزاوية"}]},
  watermark:{icon:"💧",label:"علامة مائية",f:[{k:"text",t:"text",d:"سري",l:"نص العلامة"}]},
  page_numbers:{icon:"🔢",label:"ترقيم الصفحات",f:[]},
  encrypt:{icon:"🔐",label:"حماية بكلمة مرور",f:[{k:"password",t:"text",d:"1234",l:"كلمة المرور"}]},
  to_images:{icon:"🖼️",label:"تحويل إلى صور",f:[{k:"dpi",t:"text",d:"150",l:"دقة الصورة"}]},
  to_text:{icon:"📝",label:"استخراج النص",f:[]},
  to_word:{icon:"📘",label:"تحويل إلى Word",f:[]},
  flatten:{icon:"🪨",label:"تثبيت نهائي",f:[]},
  impose:{icon:"🗂️",label:"عدة صفحات في الورقة",f:[{k:"pages_per_sheet",t:[{v:2,t:"صفحتان"},{v:4,t:"4 صفحات"},{v:6,t:"6 صفحات"},{v:9,t:"9 صفحات"}],d:4,l:"في الورقة الواحدة"}]},
  booklet:{icon:"📖",label:"كتيّب للطباعة",f:[]},
  dxf_to_pdf:{icon:"🏗️",label:"تحويل DXF إلى PDF",f:[]},
  dwg_to_pdf:{icon:"🏗️",label:"تحويل DWG إلى PDF",f:[]},
  rvt_to_pdf:{icon:"🏛️",label:"تحويل RVT إلى PDF",f:[]},
};
let files=[];let steps=[];
function toast(m,c=""){const t=document.createElement("div");t.className="toast "+c;t.innerHTML=m;$("#toasts").appendChild(t);setTimeout(()=>t.remove(),4500)}
function fmt(n){return n<1024?n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(1)+" MB"}
function nFiles(n){return n===0?"لا توجد ملفات":n===1?"ملف واحد":n===2?"ملفان":n<=10?n+" ملفات":n+" ملفًا"}
function nSteps(n){return n===0?"لا توجد خطوات":n===1?"خطوة واحدة":n===2?"خطوتان":n<=10?n+" خطوات":n+" خطوة"}

function detailFor(status, detail){
  if(typeof detail==="string"&&detail)return detail;
  if(status===413)return "الملف كبير جداً لهذا الاتصال";
  if(status===403)return "انتهت صلاحية الدخول — أعد فتح المعاينة المباشرة";
  if(status>=500)return "الخادم غير جاهز حالياً — انتظر قليلاً وأعد المحاولة";
  return "حاول مرة أخرى";
}
function showConnBanner(){
  if($("#connBanner"))return;
  const b=document.createElement("div");
  b.id="connBanner";
  b.style.cssText="background:#FEF6E7;border:1px solid #F0D9A8;color:#B45309;border-radius:12px;padding:12px 16px;margin-bottom:14px;font-size:.85rem;line-height:2";
  b.innerHTML=`⚠️ <b>لا يوجد اتصال بالخادم.</b> إذا كنت داخل «معاينة الملف» فهذه معاينة ثابتة بلا شبكة ولا معالجة — افتح <b>المعاينة المباشرة</b> للموقع (الزر بجانب العملية الجارية «محطّة PDF»)، أو شغّل <code style="background:#fff;border:1px solid #F0D9A8;border-radius:6px;padding:1px 6px">python3 run_webapp.py</code> ثم افتح الرابط. <button class="btn btn-sm" onclick="checkConn()" style="margin-right:8px">🔄 إعادة المحاولة</button>`;
  const anchor=document.querySelector(".command");
  if(anchor)anchor.parentNode.insertBefore(b,anchor);
}
async function checkConn(){
  try{
    const r=await fetch("/api/health",{cache:"no-store"});
    const h=await r.json();
    $("#healthPill").innerHTML=`✅ متصل · ${h.ops} عملية متاحة`;
    const b=$("#connBanner");if(b)b.remove();
    return true;
  }catch(e){
    $("#healthPill").textContent="⚠️ غير متصل";
    showConnBanner();
    return false;
  }
}
function addFiles(fileList){
  const arr=[...fileList];if(!arr.length)return;
  const big=arr.find(f=>f.size>30*1024*1024);
  if(big)toast(`⚠️ «${big.name}» كبير (${fmt(big.size)}) — قد يتعذر رفعه عبر المعاينة`,"err");
  toast("⏳ جارٍ رفع الملفات…");
  const fd=new FormData();arr.forEach(f=>fd.append("files",f));
  const xhr=new XMLHttpRequest();
  xhr.open("POST","/api/files");
  xhr.timeout=120000;
  xhr.onload=()=>{
    let data={};try{data=JSON.parse(xhr.responseText)}catch(e){}
    if(xhr.status>=200&&xhr.status<300&&data.files){
      data.files.forEach(meta=>{
        files.push({...meta,thumb:null});
        if(["pdf","dxf","dwg","rvt"].includes(meta.kind)) loadThumb(files.length-1);
      });
      renderFiles();loadRecipes();
      toast("✅ تمت إضافة "+nFiles(arr.length),"ok");
    }else{
      toast(`❌ تعذّر الرفع (${xhr.status}) — ${detailFor(xhr.status,data.detail)}`,"err");
    }
  };
  xhr.onerror=()=>{
    showConnBanner();
    toast("❌ تعذّر الاتصال بالخادم — تأكد أنك في «المعاينة المباشرة» (وليست معاينة الملف) وأن الملف ليس ضخماً جداً","err");
  };
  xhr.ontimeout=()=>toast("❌ انتهى وقت الرفع — الملف كبير أو الاتصال بطيء","err");
  xhr.send(fd);
}
async function loadThumb(i){
  const f=files[i];
  try{const r=await fetch(`/api/files/${f.id}/thumb?page=1&dpi=72`);
    if(r.ok){f.thumb=URL.createObjectURL(await r.blob());renderFiles()}}catch(e){}
}
async function loadRecipes(){
  if(!files.length)return;
  try{
    const r=await fetch("/api/recipes");
    if(r.ok){const d=await r.json();if(d.recipes&&d.recipes.length)renderRecipes(d.recipes)}
  }catch(e){}
}
function renderFiles(){
  $("#fcount").textContent=nFiles(files.length);
  $("#flist").innerHTML=files.map((f,i)=>`
    <div class="file">
      <div class="th">${f.thumb?`<img src="${f.thumb}">`:"📄"}</div>
      <div style="min-width:0;flex:1">
        <div class="nm">${f.name}</div>
        <div>
          <span class="tag ${["dxf","dwg","rvt"].includes(f.kind)?"brand":""}">${(f.kind||"?").toUpperCase()}</span>
          ${f.pages?`<span class="tag ok">${f.pages} ${f.pages===1?"صفحة":"صفحات"}</span>`:""}
          ${f.scanned?`<span class="tag warn">📷 ممسوح</span>`:""}
        </div>
        <div style="font-size:.68rem;color:var(--ink3);margin-top:3px">${fmt(f.size||0)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;flex:none">
        ${f.kind==="pdf"?`<button class="btn btn-sm" style="padding:3px 8px;font-size:.68rem" title="معاينة الطباعة" onclick="printPreview('${f.id}')">🖨️</button>`:""}
        <button class="btn btn-sm" style="padding:3px 8px;font-size:.68rem" title="إزالة الملف" onclick="files.splice(${i},1);renderFiles()">✕</button>
      </div>
    </div>`).join("");
}
function renderSteps(){
  $("#emptyHint").style.display=steps.length?"none":"block";
  $("#scount").textContent=nSteps(steps.length);
  $("#steps").innerHTML=steps.map((s,i)=>{
    const m=OPS[s.op]||{icon:"⚙️",label:s.op,f:[]};
    return `${i?'<div class="arrow"></div>':""}<div class="step">
      <div class="n">${i+1}</div>
      <div style="flex:1;min-width:0">
        <div class="op">${m.icon} ${m.label}</div>
        <div class="params">${(m.f||[]).map(fl=>{
          const cur=s.params[fl.k]??fl.d;
          return Array.isArray(fl.t)
          ?`<label>${fl.l}<select onchange="steps[${i}].params['${fl.k}']=this.value==='90'||this.value==='180'||this.value==='270'||this.value==='2'||this.value==='4'||this.value==='6'||this.value==='9'?+this.value:this.value">${fl.t.map(o=>{
            const v=o.v??o, txt=o.t??o;
            return `<option value="${v}" ${String(cur)===String(v)?"selected":""}>${txt}</option>`
          }).join("")}</select></label>`
          :`<label>${fl.l}<input placeholder="${fl.p||fl.l}" value="${cur??""}" onchange="steps[${i}].params['${fl.k}']=this.value"></label>`
        }).join("")}</div>
      </div>
      <div class="tools">
        <button title="نقل لأعلى" onclick="mv(${i},-1)">↑</button><button title="نقل لأسفل" onclick="mv(${i},1)">↓</button>
        <button title="حذف الخطوة" onclick="steps.splice(${i},1);renderSteps()">✕</button>
      </div>
    </div>`;
  }).join("");
}
function mv(i,d){const j=i+d;if(j<0||j>=steps.length)return;[steps[i],steps[j]]=[steps[j],steps[i]];renderSteps()}
function clearSteps(){steps=[];renderSteps()}
function toggleOps(e){
  e.stopPropagation();
  const m=$("#opMenu");
  if(m.style.display==="flex"){m.style.display="none";return}
  m.style.display="flex";
  m.innerHTML=Object.entries(OPS).map(([op,v])=>
    `<button class="btn btn-sm" onclick="addStep('${op}')">${v.icon} ${v.label}</button>`).join("");
}
document.addEventListener("click",()=>$("#opMenu").style.display="none");
function addStep(op){
  const m=OPS[op];const params={};(m.f||[]).forEach(f=>params[f.k]=f.d);
  const inputs=steps.length?["@prev"]:files.map(f=>f.id);
  steps.push({op,inputs:inputs.length?inputs:["@all_pdfs"],params});
  $("#opMenu").style.display="none";renderSteps();
}
function renderRecipes(recipes){
  $("#recipes").innerHTML=recipes.map((r,i)=>`
    <div class="recipe" onclick="applyRecipe(${i})">
      <div class="t">${r.title}</div><div class="d">${r.desc||""}</div>
    </div>`).join("");
  window._recipes=recipes;
}
function applyRecipe(i){
  const r=(window._recipes||[])[i];if(!r)return;
  steps=(r.steps||[]).map(s=>({op:s.op,inputs:[...(s.inputs||["@all_pdfs"])],params:{...(s.params||{})}}));
  renderSteps();toast("✨ تم إعداد الخطوات — اضغط «تنفيذ»","ok");
}
async function doInterpret(){
  const text=$("#cmd").value.trim();
  if(!text){toast("اكتب طلبك أولاً ✍️","err");return}
  if(!files.length){toast("أضف ملفاتك أولاً 📂","err");return}
  let r;
  try{
    r=await fetch("/api/interpret",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({text,file_ids:files.map(f=>f.id),mode:"auto"})});
  }catch(e){
    showConnBanner();
    toast("❌ تعذّر الاتصال بالخادم — استخدم المعاينة المباشرة","err");return;
  }
  const data=await r.json().catch(()=>({}));
  if(!r.ok){toast(`❌ (${r.status}) — ${detailFor(r.status,data.detail)}`,"err");return}
  if(!data.steps||!data.steps.length){toast("🤷 لم أفهم الطلب — جرّب مثلاً: «ادمج الملفات ثم صغّرها»","err");return}
  steps=data.steps.map(s=>({op:s.op,inputs:[...(s.inputs||[])],params:{...(s.params||{})},label:s.label}));
  renderSteps();
  if(data.recipes&&data.recipes.length)renderRecipes(data.recipes);
  toast(`${data.engine==="ai"?"🤖 ذكاء اصطناعي":"🧠"} · ${data.explanation||"تم"}`,"ok");
}
async function doRun(){
  if(!files.length){toast("أضف ملفاتك أولاً 📂","err");return}
  if(!steps.length){toast("أضف خطوة واحدة على الأقل ⚙️","err");return}
  const btn=$("#runBtn");btn.disabled=true;btn.innerHTML=`<span class="spin"></span> جارٍ التنفيذ…`;
  try{
    let r;
    try{
      r=await fetch("/api/run",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({steps})});
    }catch(e){
      showConnBanner();
      throw new Error("تعذّر الاتصال بالخادم — استخدم المعاينة المباشرة (وليست معاينة الملف)");
    }
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(typeof data.detail==="string"?data.detail:`(${r.status}) ${detailFor(r.status)}`);
    let n=0;
    for(const res of (data.results||[])){
      for(const o of (res.outputs||[])){
        const a=document.createElement("a");
        a.href=`/api/files/${o.id}/download`;a.download=o.name||"result";a.click();
        n++;
      }
    }
    toast(`✅ تم الإنجاز خلال ${data.total_duration||0} ثانية — ${nFiles(n)} جاهز للتحميل`,"ok");
  }catch(e){toast("❌ "+e.message,"err")}
  finally{btn.disabled=false;btn.innerHTML="▶️ تنفيذ"}
}
async function printPreview(fileId){
  toast("⏳ جارٍ تجهيز المعاينة…");
  const r=await fetch("/api/print-preview",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({file_id:fileId,mode:"4up"})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok){toast("❌ "+(data.detail||"تعذّر إنشاء المعاينة"),"err");return}
  const a=document.createElement("a");
  a.href=`/api/files/${data.file.id}/download`;a.download=data.file.name;a.click();
  toast("✅ معاينة الطباعة جاهزة","ok");
}
const drop=$("#drop");
drop.addEventListener("dragover",e=>{e.preventDefault();drop.classList.add("over")});
drop.addEventListener("dragleave",()=>drop.classList.remove("over"));
drop.addEventListener("drop",e=>{e.preventDefault();drop.classList.remove("over");addFiles(e.dataTransfer.files)});
$("#fi").addEventListener("change",e=>{addFiles(e.target.files);e.target.value=""});
$("#cmd").addEventListener("keydown",e=>{if(e.key==="Enter")doInterpret()});
checkConn();
renderSteps();
</script>
</body>
</html>
~~~~


## 📄 `api/index.py`
**واجهة Vercel البرمجية Stateless (فحص/تفسير/تنفيذ→ZIP)** — (224 سطر)

~~~~
"""
api/index.py — خادم Vercel Serverless (بدون حالة / Stateless)
==============================================================
التصميم: المتصفح يحتفظ بالملفات — الخادم يعالج ويُرجع النتائج.
هذا ضروري لأن سيرفرلس فيرسال لا يشارك الذاكرة بين الطلبات.

المسارات:
  GET  /api/health        فحص
  POST /api/inspect       ملفات → معلومات (صفحات، سكان، نوع)
  POST /api/interpret     أمر طبيعي → خط أنابيب
  POST /api/run           ملفات + خط أنابيب → ZIP بالنتائج
  POST /api/thumb         ملف → صورة معاينة PNG
"""

from __future__ import annotations

import io
import json
import sys
import tempfile
import time
import zipfile
from pathlib import Path
from typing import Any

# جذر المشروع على sys.path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import Response, JSONResponse  # noqa: E402

import pdf_engine as engine  # noqa: E402
import cad_engine  # noqa: E402
from webapp.interpreter import interpret, suggest_recipes  # noqa: E402
from webapp.ops import run_op, OpError  # noqa: E402

app = FastAPI(title="PDF Station API (Vercel)", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

KIND_BY_EXT = {
    ".pdf": "pdf", ".png": "image", ".jpg": "image", ".jpeg": "image", ".gif": "image", ".webp": "image", ".bmp": "image",
    ".dxf": "dxf", ".dwg": "dwg", ".rvt": "rvt", ".rte": "rvt", ".rfa": "rvt",
    ".docx": "docx", ".txt": "text",
}


def _kind_of(name: str) -> str:
    return KIND_BY_EXT.get(Path(name or "x").suffix.lower(), "other")


def _save_upload(f: UploadFile, dest_dir: Path) -> Path:
    dest = dest_dir / (f.filename or "file")
    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, "wb") as fh:
        while chunk := f.file.read(1 << 20):
            fh.write(chunk)
    return dest


# ---------------------------------------------------------------------------
# المسارات
# ---------------------------------------------------------------------------


@app.get("/api/health")
def health():
    ocr_ok = True
    try:
        import pytesseract  # noqa
        import shutil
        ocr_ok = bool(shutil.which("tesseract"))
    except Exception:
        ocr_ok = False
    return {
        "ok": True,
        "platform": "vercel-serverless",
        "ocr_available": ocr_ok,
        "cad_dxf": True,
        "cad_dwg": cad_engine._find_oda_converter() is not None,
        "cad_rvt_aps": bool(__import__("os").environ.get("APS_CLIENT_ID")),
    }


@app.post("/api/inspect")
async def inspect(files: list[UploadFile] = File(...)):
    """فحص الملفات: نوع، صفحات، هل سكان — بدون تخزين دائم (/tmp مؤقت)."""
    with tempfile.TemporaryDirectory() as td:
        out = []
        for f in files:
            p = _save_upload(f, Path(td))
            kind = _kind_of(p.name)
            rec: dict[str, Any] = {"name": f.filename, "kind": kind, "size": p.stat().st_size, "scanned": False}
            if kind == "pdf":
                try:
                    rec["pages"] = engine.pdf_page_count(str(p))
                    rec["scanned"] = bool(engine.pdf_is_scanned(str(p))["scanned"])
                except Exception:
                    rec["pages"] = None
            out.append(rec)
        return {"files": out, "recipes": suggest_recipes([r["kind"] if not r.get("scanned") else "pdf_scanned" for r in out])}


@app.post("/api/interpret")
async def api_interpret(payload: dict[str, Any]):
    """أمر طبيعي → خط أنابيب (بدون ملفات — يكفي الأنواع)."""
    text = payload.get("text", "")
    kinds = payload.get("kinds", [])  # ["pdf","pdf","dxf"]
    file_ids = [f"f{i}" for i in range(len(kinds))]
    kind_map = dict(zip(file_ids, kinds))
    result = interpret(text, file_ids, kind_map, mode=payload.get("mode", "auto"))
    return {**result, "recipes": suggest_recipes(kinds)}


@app.post("/api/run")
async def run(
    files: list[UploadFile] = File(...),
    steps: str = Form(...),
    ref_names: str = Form(""),
):
    """
    تنفيذ خط أنابيب كامل في طلب واحد (بدون حالة).
    steps: [{"op":"compress","inputs":["@f0"],"params":{}}]
      مراجع المدخلات: @f0/@f1 = ترتيب الملفات المرفوعة | @prev = مخرج السابق
      | @all_pdfs / @all_images / @all_cad
    النتيجة: ZIP يحتوي كل الملفات الناتجة + manifest.json
    """
    try:
        step_list = json.loads(steps)
    except Exception:
        raise HTTPException(400, "steps غير صالح")

    with tempfile.TemporaryDirectory() as td:
        tdp = Path(td)
        in_dir, out_dir = tdp / "in", tdp / "out"
        in_dir.mkdir(); out_dir.mkdir()

        uploaded: list[Path] = []
        for f in files:
            uploaded.append(_save_upload(f, in_dir))

        def resolve(refs):
            paths = []
            for r in refs or []:
                if r == "@prev":
                    if not step_outputs:
                        raise HTTPException(400, "لا توجد خطوة سابقة")
                    paths.append(list(step_outputs.values())[-1])
                elif r.startswith("@f") and r[2:].isdigit():
                    idx = int(r[2:])
                    if idx >= len(uploaded):
                        raise HTTPException(400, f"مرجع ملف غير موجود: {r}")
                    paths.append(uploaded[idx])
                elif r == "@all_pdfs":
                    paths.extend(p for p in uploaded if p.suffix.lower() == ".pdf")
                elif r == "@all_images":
                    paths.extend(p for p in uploaded if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"))
                elif r == "@all_cad":
                    paths.extend(p for p in uploaded if p.suffix.lower() in (".dxf", ".dwg", ".rvt"))
                elif r == "@all":
                    paths.extend(uploaded)
                else:
                    raise HTTPException(400, f"مرجع غير معروف: {r}")
            return paths

        step_outputs: dict[str, Path] = {}
        results = []
        t0 = time.time()

        for i, step in enumerate(step_list):
            op = step.get("op", "")
            params = step.get("params", {}) or {}
            paths = resolve(step.get("inputs") or ["@all"])
            if not paths:
                raise HTTPException(400, f"الخطوة {i+1}: لا توجد مدخلات")
            t1 = time.time()
            try:
                outs = run_op(op, paths, params, out_dir)
            except OpError as e:
                raise HTTPException(400, f"الخطوة {i+1} ({op}): {e}")
            except Exception as e:
                raise HTTPException(500, f"الخطوة {i+1} ({op}): {type(e).__name__}: {e}")
            step_outputs[f"step{i}"] = outs[-1]
            results.append({
                "step": i + 1, "op": op,
                "label": step.get("label", op),
                "duration": round(time.time() - t1, 2),
                "outputs": [{"name": o.name, "size": o.stat().st_size} for o in outs],
            })

        # حزم كل المخرجات في ZIP
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            for o in sorted(out_dir.rglob("*")):
                if o.is_file():
                    z.write(o, o.relative_to(out_dir))
            z.writestr("manifest.json", json.dumps({
                "ok": True,
                "total_duration": round(time.time() - t0, 2),
                "results": results,
            }, ensure_ascii=False, indent=2))
        buf.seek(0)
        return Response(
            content=buf.read(),
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=pdf-station-results.zip"},
        )


@app.post("/api/thumb")
async def thumb(file: UploadFile = File(...), page: int = Form(1), dpi: int = Form(72)):
    """معاينة صفحة من ملف (PNG) — بدون تخزين."""
    with tempfile.TemporaryDirectory() as td:
        p = _save_upload(file, Path(td))
        out = Path(td) / "thumb.png"
        try:
            engine.pdf_render_page(str(p), max(1, page), str(out), dpi=max(36, min(dpi, 200)))
        except Exception as e:
            raise HTTPException(400, f"لا توجد معاينة: {e}")
        return Response(content=out.read_bytes(), media_type="image/png")


# Vercel يكتشف التطبيق ASGI تلقائياً من `app`
~~~~


## 📄 `public/index.html`
**واجهة Vercel — الملفات في المتصفح + ثيم فاتح** — (361 سطر)

~~~~
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>محطّة PDF — أدوات PDF وCAD في مكان واحد</title>
<style>
:root{
  --bg:#F4F6FB; --card:#FFFFFF; --line:#E5E8F0; --line2:#D6DBE8;
  --ink:#1B2438; --ink2:#5B6684; --ink3:#8A93AC;
  --brand:#4F55E3; --brand-soft:#EEF0FE; --brand-line:#C8CCFA;
  --ok:#0E9F6E; --ok-soft:#E6F7F0; --warn:#B45309; --warn-soft:#FEF6E7; --err:#DC2626; --err-soft:#FDECEC;
  --r:14px; --shadow:0 1px 2px rgba(27,36,56,.05), 0 8px 24px rgba(27,36,56,.06);
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Segoe UI","Noto Sans Arabic","Tajawal",Tahoma,system-ui,sans-serif;background:var(--bg);color:var(--ink);font-size:14.5px;line-height:1.6}
button{font-family:inherit}
.wrap{max-width:1360px;margin:0 auto;padding:20px 22px 34px}
.top{display:flex;align-items:center;gap:14px;margin-bottom:18px}
.brand{display:flex;align-items:center;gap:11px}
.brand .logo{width:42px;height:42px;border-radius:12px;background:var(--brand);color:#fff;display:grid;place-items:center;font-size:20px;box-shadow:0 6px 16px rgba(79,85,227,.28)}
.brand h1{font-size:1.18rem;font-weight:800}
.brand .tag{color:var(--ink2);font-size:.78rem}
.grow{flex:1}
.btn{border:1px solid var(--line2);background:var(--card);color:var(--ink);border-radius:11px;padding:9px 16px;font-size:.86rem;font-weight:700;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:7px}
.btn:hover{border-color:var(--brand);color:var(--brand);background:var(--brand-soft)}
.btn-primary{background:var(--brand);color:#fff;border-color:var(--brand);box-shadow:0 6px 16px rgba(79,85,227,.22)}
.btn-primary:hover{background:#3F45D4;color:#fff;transform:translateY(-1px)}
.btn-primary:disabled{opacity:.55;transform:none;cursor:not-allowed}
.btn-sm{padding:7px 12px;font-size:.78rem;border-radius:9px}
.command{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px;box-shadow:var(--shadow);margin-bottom:16px}
.command .row{display:flex;align-items:center;gap:10px}
.command .icon{width:40px;height:40px;border-radius:11px;background:var(--brand-soft);color:var(--brand);display:grid;place-items:center;font-size:19px;flex:none}
.command input{flex:1;border:0;outline:0;font-size:1.02rem;font-family:inherit;color:var(--ink);background:transparent;padding:10px 4px}
.command input::placeholder{color:var(--ink3)}
.grid{display:grid;grid-template-columns:296px minmax(0,1fr) 312px;gap:15px;align-items:start}
.panel{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden}
.panel .head{display:flex;align-items:center;gap:9px;padding:13px 16px;border-bottom:1px solid var(--line);font-weight:800;font-size:.9rem}
.panel .head .stepno{width:24px;height:24px;border-radius:8px;background:var(--brand);color:#fff;display:grid;place-items:center;font-size:.74rem;font-weight:900;flex:none}
.panel .head .meta{margin-right:auto;color:var(--ink3);font-size:.74rem;font-weight:600}
.panel .body{padding:14px}
.drop{border:2px dashed var(--brand-line);border-radius:12px;padding:20px 12px;text-align:center;cursor:pointer;background:var(--brand-soft);transition:.15s;margin-bottom:12px}
.drop:hover,.drop.over{border-color:var(--brand);background:#E4E7FD}
.drop .big{font-size:1.55rem;margin-bottom:5px}
.drop p{color:var(--ink2);font-size:.8rem;line-height:1.85}
.file{display:flex;gap:10px;align-items:center;padding:9px 10px;border:1px solid var(--line);border-radius:11px;margin-bottom:8px;background:#FCFDFF}
.file .th{width:42px;height:54px;border-radius:8px;background:#F0F2F9;border:1px solid var(--line);overflow:hidden;display:grid;place-items:center;flex:none;font-size:1.05rem}
.file .th img{width:100%;height:100%;object-fit:cover}
.file .nm{font-size:.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.tag{display:inline-block;padding:1.5px 8px;border-radius:999px;font-size:.65rem;font-weight:800;border:1px solid var(--line2);color:var(--ink2);background:#fff;margin:3px 0 0 3px}
.tag.brand{background:var(--brand-soft);color:var(--brand);border-color:var(--brand-line)}
.tag.ok{background:var(--ok-soft);color:var(--ok);border-color:#B7E4D0}
.tag.warn{background:var(--warn-soft);color:var(--warn);border-color:#F0D9A8}
.step{display:flex;gap:11px;align-items:flex-start;padding:12px 13px;border:1px solid var(--line);border-radius:12px;margin-bottom:9px;background:#FCFDFF}
.step .n{width:27px;height:27px;border-radius:9px;background:var(--brand-soft);color:var(--brand);display:grid;place-items:center;font-weight:900;font-size:.8rem;flex:none;margin-top:1px}
.step .op{font-weight:800;font-size:.88rem;display:flex;align-items:center;gap:7px}
.step .params{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
.step .params input,.step .params select{border:1px solid var(--line2);border-radius:9px;padding:6px 10px;font-size:.76rem;font-family:inherit;color:var(--ink);background:#fff;outline:0}
.step .params label{display:flex;flex-direction:column;gap:3px;font-size:.68rem;color:var(--ink3);font-weight:700}
.step .tools{display:flex;gap:4px;flex:none;margin-top:2px}
.step .tools button{width:25px;height:25px;border-radius:8px;border:1px solid var(--line);cursor:pointer;background:#fff;color:var(--ink3);font-size:.72rem}
.step .tools button:hover{color:var(--brand);border-color:var(--brand-line);background:var(--brand-soft)}
.arrow{width:2px;height:14px;background:var(--brand-line);margin:0 auto 9px;border-radius:2px}
.addstep{border:2px dashed var(--line2);border-radius:12px;padding:12px;text-align:center;color:var(--ink3);cursor:pointer;font-size:.84rem;font-weight:700;transition:.15s}
.addstep:hover{border-color:var(--brand);color:var(--brand);background:var(--brand-soft)}
#opMenu{display:none;flex-wrap:wrap;gap:7px;margin-top:10px}
.recipe{padding:12px 13px;border:1px solid var(--line);border-radius:11px;margin-bottom:8px;cursor:pointer;transition:.15s;background:#FCFDFF}
.recipe:hover{border-color:var(--brand);background:var(--brand-soft);transform:translateY(-1px)}
.recipe .t{font-weight:800;font-size:.84rem}
.recipe .d{font-size:.73rem;color:var(--ink2);margin-top:3px}
.empty{color:var(--ink3);font-size:.81rem;text-align:center;padding:22px 10px;line-height:2.1}
.note{font-size:.78rem;color:var(--ink2);line-height:2.15;padding:4px 2px}
#toasts{position:fixed;bottom:20px;right:20px;z-index:90;display:flex;flex-direction:column;gap:9px}
.toast{padding:12px 16px;border-radius:12px;background:#fff;border:1px solid var(--line2);color:var(--ink);font-size:.83rem;box-shadow:0 12px 34px rgba(27,36,56,.14);max-width:370px;animation:in .25s ease}
.toast.ok{border-color:#B7E4D0;background:var(--ok-soft)}
.toast.err{border-color:#F3C1C1;background:var(--err-soft)}
@keyframes in{from{opacity:0;transform:translateY(12px)}to{opacity:1}}
.spin{width:16px;height:16px;border:3px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite;display:inline-block}
@keyframes sp{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div class="brand">
      <div class="logo">⚡</div>
      <div><h1>محطّة PDF</h1><div class="tag">أدوات PDF وCAD في مكان واحد — ملفاتك تبقى في متصفحك</div></div>
    </div>
    <div class="grow"></div>
    <div class="btn" id="healthPill" style="cursor:default">… جارٍ التحقق</div>
  </div>

  <div class="command">
    <div class="row">
      <div class="icon">🧠</div>
      <input id="cmd" placeholder="اكتب طلبك هنا… مثلاً: «ادمج الملفات ثم صغّر حجمها»" autocomplete="off">
      <button class="btn" onclick="doInterpret()">اقترح الخطوات ✦</button>
      <button class="btn btn-primary" onclick="doRun()">تنفيذ ⚡</button>
    </div>
  </div>

  <div class="grid">
    <section class="panel">
      <div class="head"><span class="stepno">١</span> الملفات <span class="meta" id="fcount">لا توجد ملفات</span></div>
      <div class="body">
        <div class="drop" id="drop" onclick="document.getElementById('fi').click()">
          <div class="big">⬇️</div>
          <p><b>أفلت الملفات هنا</b><br><small>أو اضغط للاختيار — PDF · DXF · DWG · RVT · صور — تبقى في متصفحك</small></p>
        </div>
        <input type="file" id="fi" multiple hidden accept=".pdf,.dxf,.dwg,.rvt,.png,.jpg,.jpeg,.gif,.webp,.bmp">
        <div id="flist"></div>
      </div>
    </section>

    <section class="panel">
      <div class="head">
        <span class="stepno">٢</span> الخطوات
        <span class="meta" id="scount">لا توجد خطوات</span>
        <button class="btn btn-sm" onclick="clearSteps()">🗑️ مسح الكل</button>
        <button class="btn btn-primary btn-sm" id="runBtn" onclick="doRun()">▶️ تنفيذ</button>
      </div>
      <div class="body">
        <div id="steps"></div>
        <div class="empty" id="emptyHint"><div style="font-size:1.9rem;margin-bottom:8px">🧩</div>ارفع ملفاتك ثم اكتب طلبك — أو أضف الخطوات بنفسك</div>
        <div class="addstep" onclick="toggleOps(event)">＋ إضافة خطوة جديدة</div>
        <div id="opMenu"></div>
      </div>
    </section>

    <section class="panel">
      <div class="head"><span class="stepno">٣</span> مهام شائعة</div>
      <div class="body" id="recipes"><div class="empty">أضف ملفاتك لتظهر المهام المقترحة</div></div>
      <div class="head" style="border-top:1px solid var(--line)">ℹ️ ملاحظات</div>
      <div class="body">
        <div class="note">
          🔒 ملفاتك لا تُخزَّن على الخادم — تُعالَج ثم تُحمَّل مباشرة<br>
          ✍️ اكتب طلبك بالعربية وسيتحول تلقائيًا إلى خطوات جاهزة<br>
          📷 التعرّف الضوئي غير متاح في النسخة الأونلاين<br>
          🏗️ ملفات DXF تُحوَّل مباشرة — وDWG وRVT عند توفّر المحول
        </div>
      </div>
    </section>
  </div>
</div>
<div id="toasts"></div>
<script>
const $=s=>document.querySelector(s);
const OPS={
  merge:{icon:"🔗",label:"دمج الملفات",f:[]},
  compress:{icon:"🗜️",label:"تصغير حجم الملف",f:[{k:"level",t:[{v:"light",t:"خفيف"},{v:"medium",t:"متوسط"},{v:"strong",t:"قوي"}],d:"medium",l:"درجة الضغط"}]},
  extract_pages:{icon:"✂️",label:"استخراج صفحات",f:[{k:"pages",t:"text",d:"1-3",l:"أرقام الصفحات",p:"مثال: 1-3،5"}]},
  delete_pages:{icon:"🗑️",label:"حذف صفحات",f:[{k:"pages",t:"text",d:"2",l:"أرقام الصفحات",p:"مثال: 2"}]},
  rotate:{icon:"🔄",label:"تدوير الصفحات",f:[{k:"degrees",t:[{v:90,t:"90°"},{v:180,t:"180°"},{v:270,t:"270°"}],d:90,l:"الزاوية"}]},
  watermark:{icon:"💧",label:"علامة مائية",f:[{k:"text",t:"text",d:"سري",l:"نص العلامة"}]},
  page_numbers:{icon:"🔢",label:"ترقيم الصفحات",f:[]},
  encrypt:{icon:"🔐",label:"حماية بكلمة مرور",f:[{k:"password",t:"text",d:"1234",l:"كلمة المرور"}]},
  to_images:{icon:"🖼️",label:"تحويل إلى صور",f:[{k:"dpi",t:"text",d:"150",l:"دقة الصورة"}]},
  to_text:{icon:"📝",label:"استخراج النص",f:[]},
  to_word:{icon:"📘",label:"تحويل إلى Word",f:[]},
  flatten:{icon:"🪨",label:"تثبيت نهائي",f:[]},
  impose:{icon:"🗂️",label:"عدة صفحات في الورقة",f:[{k:"pages_per_sheet",t:[{v:2,t:"صفحتان"},{v:4,t:"4 صفحات"},{v:6,t:"6 صفحات"},{v:9,t:"9 صفحات"}],d:4,l:"في الورقة الواحدة"}]},
  booklet:{icon:"📖",label:"كتيّب للطباعة",f:[]},
  dxf_to_pdf:{icon:"🏗️",label:"تحويل DXF إلى PDF",f:[]},
  dwg_to_pdf:{icon:"🏗️",label:"تحويل DWG إلى PDF",f:[]},
  rvt_to_pdf:{icon:"🏛️",label:"تحويل RVT إلى PDF",f:[]},
};
let files=[];let steps=[];
function toast(m,c=""){const t=document.createElement("div");t.className="toast "+c;t.innerHTML=m;$("#toasts").appendChild(t);setTimeout(()=>t.remove(),4500)}
function fmt(n){return n<1024?n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(1)+" MB"}
function nFiles(n){return n===0?"لا توجد ملفات":n===1?"ملف واحد":n===2?"ملفان":n<=10?n+" ملفات":n+" ملفًا"}
function nSteps(n){return n===0?"لا توجد خطوات":n===1?"خطوة واحدة":n===2?"خطوتان":n<=10?n+" خطوات":n+" خطوة"}

function detailFor(status, detail){
  if(typeof detail==="string"&&detail)return detail;
  if(status===413)return "الملف كبير جداً لهذا الاتصال — الحد العملي نحو 4 ميجابايت";
  if(status===403)return "انتهت صلاحية الدخول — أعد فتح الصفحة";
  if(status>=500)return "الخادم غير جاهز حالياً — انتظر قليلاً وأعد المحاولة";
  return "حاول مرة أخرى";
}
function showConnBanner(){
  if($("#connBanner"))return;
  const b=document.createElement("div");
  b.id="connBanner";
  b.style.cssText="background:#FEF6E7;border:1px solid #F0D9A8;color:#B45309;border-radius:12px;padding:12px 16px;margin-bottom:14px;font-size:.85rem;line-height:2";
  b.innerHTML=`⚠️ <b>لا يوجد اتصال.</b> إذا كنت داخل «معاينة الملف» فهذه معاينة ثابتة بلا شبكة — افتح <b>المعاينة المباشرة</b> للموقع، أو تحقق من اتصالك بالإنترنت. <button class="btn btn-sm" onclick="checkConn()" style="margin-right:8px">🔄 إعادة المحاولة</button>`;
  const anchor=document.querySelector(".command");
  if(anchor)anchor.parentNode.insertBefore(b,anchor);
}
async function checkConn(){
  try{
    const r=await fetch("/api/health",{cache:"no-store"});
    const h=await r.json();
    $("#healthPill").innerHTML=`✅ جاهز للعمل · ${h.ocr_available?"التعرّف الضوئي مفعّل":"يعمل مباشرة في المتصفح"}`;
    const b=$("#connBanner");if(b)b.remove();
    return true;
  }catch(e){
    $("#healthPill").textContent="⚠️ غير متصل";
    showConnBanner();
    return false;
  }
}
function addFiles(fileList){
  const arr=[...fileList];if(!arr.length)return;
  const big=arr.find(f=>f.size>4.2*1024*1024);
  if(big)toast(`⚠️ «${big.name}» كبير (${fmt(big.size)}) — الحد للرفع نحو 4 ميجابايت في النسخة الأونلاين`,"err");
  toast("⏳ جارٍ فحص الملفات…");
  const fd=new FormData();arr.forEach(f=>fd.append("files",f));
  const xhr=new XMLHttpRequest();
  xhr.open("POST","/api/inspect");
  xhr.timeout=60000;
  xhr.onload=()=>{
    let data={};try{data=JSON.parse(xhr.responseText)}catch(e){}
    if(xhr.status>=200&&xhr.status<300&&data.files){
      data.files.forEach((meta,i)=>{
        files.push({file:arr[i],...meta,thumb:null});
        if(["pdf","dxf","dwg","rvt"].includes(meta.kind)) loadThumb(files.length-1);
      });
      renderFiles();
      if(data.recipes&&data.recipes.length) renderRecipes(data.recipes);
      toast("✅ تمت إضافة "+nFiles(arr.length),"ok");
    }else{
      toast(`❌ تعذّر الفحص (${xhr.status}) — ${detailFor(xhr.status,data.detail)}`,"err");
    }
  };
  xhr.onerror=()=>{
    showConnBanner();
    toast("❌ تعذّر الاتصال — تأكد أنك في «المعاينة المباشرة» (وليست معاينة الملف)","err");
  };
  xhr.ontimeout=()=>toast("❌ انتهى وقت الفحص — جرّب ملفات أصغر","err");
  xhr.send(fd);
}
async function loadThumb(i){
  const fd=new FormData();fd.append("file",files[i].file);fd.append("page","1");fd.append("dpi","72");
  try{const r=await fetch("/api/thumb",{method:"POST",body:fd});
    if(r.ok){files[i].thumb=URL.createObjectURL(await r.blob());renderFiles()}}catch(e){}
}
function renderFiles(){
  $("#fcount").textContent=nFiles(files.length);
  $("#flist").innerHTML=files.map((f,i)=>`
    <div class="file">
      <div class="th">${f.thumb?`<img src="${f.thumb}">`:"📄"}</div>
      <div style="min-width:0;flex:1">
        <div class="nm">${f.name}</div>
        <div>
          <span class="tag ${["dxf","dwg","rvt"].includes(f.kind)?"brand":""}">${(f.kind||"?").toUpperCase()}</span>
          ${f.pages?`<span class="tag ok">${f.pages} ${f.pages===1?"صفحة":"صفحات"}</span>`:""}
          ${f.scanned?`<span class="tag warn">📷 ممسوح</span>`:""}
        </div>
        <div style="font-size:.68rem;color:var(--ink3);margin-top:3px">${fmt(f.size||0)}</div>
      </div>
      <button class="btn btn-sm" style="padding:3px 8px;font-size:.68rem;flex:none" title="إزالة الملف" onclick="files.splice(${i},1);renderFiles()">✕</button>
    </div>`).join("");
}
function renderSteps(){
  $("#emptyHint").style.display=steps.length?"none":"block";
  $("#scount").textContent=nSteps(steps.length);
  $("#steps").innerHTML=steps.map((s,i)=>{
    const m=OPS[s.op]||{icon:"⚙️",label:s.op,f:[]};
    return `${i?'<div class="arrow"></div>':""}<div class="step">
      <div class="n">${i+1}</div>
      <div style="flex:1;min-width:0">
        <div class="op">${m.icon} ${m.label}</div>
        <div class="params">${(m.f||[]).map(fl=>{
          const cur=s.params[fl.k]??fl.d;
          return Array.isArray(fl.t)
          ?`<label>${fl.l}<select onchange="steps[${i}].params['${fl.k}']=isNaN(this.value)?this.value:+this.value">${fl.t.map(o=>{
            const v=o.v??o, txt=o.t??o;
            return `<option value="${v}" ${String(cur)===String(v)?"selected":""}>${txt}</option>`
          }).join("")}</select></label>`
          :`<label>${fl.l}<input placeholder="${fl.p||fl.l}" value="${cur??""}" onchange="steps[${i}].params['${fl.k}']=this.value"></label>`
        }).join("")}</div>
      </div>
      <div class="tools">
        <button title="نقل لأعلى" onclick="mv(${i},-1)">↑</button><button title="نقل لأسفل" onclick="mv(${i},1)">↓</button>
        <button title="حذف الخطوة" onclick="steps.splice(${i},1);renderSteps()">✕</button>
      </div>
    </div>`;
  }).join("");
}
function mv(i,d){const j=i+d;if(j<0||j>=steps.length)return;[steps[i],steps[j]]=[steps[j],steps[i]];renderSteps()}
function clearSteps(){steps=[];renderSteps()}
function toggleOps(e){
  e.stopPropagation();
  const m=$("#opMenu");
  if(m.style.display==="flex"){m.style.display="none";return}
  m.style.display="flex";
  m.innerHTML=Object.entries(OPS).map(([op,v])=>
    `<button class="btn btn-sm" onclick="addStep('${op}')">${v.icon} ${v.label}</button>`).join("");
}
document.addEventListener("click",()=>$("#opMenu").style.display="none");
function addStep(op){
  const m=OPS[op];const params={};(m.f||[]).forEach(f=>params[f.k]=f.d);
  const inputs=steps.length?["@prev"]:files.map((f,i)=>"@f"+i);
  steps.push({op,inputs:inputs.length?inputs:["@all"],params});
  $("#opMenu").style.display="none";renderSteps();
}
function renderRecipes(recipes){
  $("#recipes").innerHTML=recipes.map((r,i)=>`
    <div class="recipe" onclick="applyRecipe(${i})">
      <div class="t">${r.title}</div><div class="d">${r.desc||""}</div>
    </div>`).join("");
  window._recipes=recipes;
}
function applyRecipe(i){
  const r=(window._recipes||[])[i];if(!r)return;
  steps=(r.steps||[]).map(s=>({op:s.op,inputs:(s.inputs||["@all"]).map(x=>x.startsWith("@all")?"@all":x),params:{...(s.params||{})}}));
  renderSteps();toast("✨ تم إعداد الخطوات — اضغط «تنفيذ»","ok");
}
async function doInterpret(){
  const text=$("#cmd").value.trim();
  if(!text){toast("اكتب طلبك أولاً ✍️","err");return}
  if(!files.length){toast("أضف ملفاتك أولاً 📂","err");return}
  let r;
  try{
    r=await fetch("/api/interpret",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({text,kinds:files.map(f=>f.kind)})});
  }catch(e){
    showConnBanner();
    toast("❌ تعذّر الاتصال — استخدم المعاينة المباشرة","err");return;
  }
  const data=await r.json().catch(()=>({}));
  if(!r.ok){toast(`❌ (${r.status}) — ${detailFor(r.status,data.detail)}`,"err");return}
  if(!data.steps||!data.steps.length){toast("🤷 لم أفهم الطلب — جرّب مثلاً: «ادمج الملفات ثم صغّرها»","err");return}
  steps=data.steps.map(s=>({...s,inputs:(s.inputs||["@all"]).map(x=>x.startsWith("@all")?"@all":x)}));
  renderSteps();
  toast(`${data.engine==="ai"?"🤖 ذكاء اصطناعي":"🧠"} · ${data.explanation||"تم"}`,"ok");
}
async function doRun(){
  if(!files.length){toast("أضف ملفاتك أولاً 📂","err");return}
  if(!steps.length){toast("أضف خطوة واحدة على الأقل ⚙️","err");return}
  const btn=$("#runBtn");btn.disabled=true;btn.innerHTML=`<span class="spin"></span> جارٍ التنفيذ…`;
  try{
    const fd=new FormData();
    files.forEach(f=>fd.append("files",f.file));
    fd.append("steps",JSON.stringify(steps));
    let r;
    try{
      r=await fetch("/api/run",{method:"POST",body:fd});
    }catch(e){
      showConnBanner();
      throw new Error("تعذّر الاتصال — استخدم المعاينة المباشرة (وليست معاينة الملف)");
    }
    if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(typeof e.detail==="string"?e.detail:`(${r.status}) ${detailFor(r.status)}`)}
    const blob=await r.blob();
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);
    a.download="نتائج-محطة-PDF.zip";a.click();
    toast("✅ تم الإنجاز — تم تحميل النتائج","ok");
  }catch(e){toast("❌ "+e.message,"err")}
  finally{btn.disabled=false;btn.innerHTML="▶️ تنفيذ"}
}
const drop=$("#drop");
drop.addEventListener("dragover",e=>{e.preventDefault();drop.classList.add("over")});
drop.addEventListener("dragleave",()=>drop.classList.remove("over"));
drop.addEventListener("drop",e=>{e.preventDefault();drop.classList.remove("over");addFiles(e.dataTransfer.files)});
$("#fi").addEventListener("change",e=>{addFiles(e.target.files);e.target.value=""});
$("#cmd").addEventListener("keydown",e=>{if(e.key==="Enter")doInterpret()});
checkConn();
renderSteps();
</script>
</body>
</html>
~~~~


## 📄 `vercel.json`
**إعدادات النشر على Vercel** — (19 سطر)

~~~~
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "builds": [
    { "src": "api/index.py", "use": "@vercel/python" },
    { "src": "public/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.py" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ],
  "functions": {
    "api/index.py": {
      "maxDuration": 120,
      "memory": 1024,
      "includeFiles": "**/*.ttf"
    }
  }
}
~~~~


## 📄 `requirements-vercel.txt`
**حزم نسخة Vercel (خفيفة)** — (27 سطر)

~~~~
# Vercel Serverless — حزمة خفيفة (بدون Tesseract binary)
fastapi>=0.110
uvicorn>=0.29
python-multipart>=0.0.9
pydantic>=2.6

# محركات PDF (تعمل على manylinux — متوافقة مع Vercel)
pypdf>=5.0.0
pymupdf>=1.24.0
pillow>=10.0.0

# CAD — DXF محلي
ezdxf>=1.1.0
matplotlib>=3.8.0

# سحابة Autodesk (اختياري — لـ DWG/RVT)
httpx>=0.27.0

# عربي (تشكيل)
arabic-reshaper>=3.0.0
python-bidi>=0.6.0

# اختياري: Word (ثقيل — فعّله إن أردت pdf_to_word)
# pdf2docx>=0.5.8

# اختياري: OCR سحابي بدل Tesseract المحلي
# pytesseract  # لا يعمل على Vercel بدون binary
~~~~


## 📄 `requirements.txt`
**حزم التشغيل الكامل (محلياً)** — (25 سطر)

~~~~
# PDF Tools MCP - Dependencies
# Core MCP framework
mcp>=2.0

# PDF manipulation (merge, split, rotate, encrypt...)
pypdf>=5.0.0

# Advanced PDF engine (compress, images, text, watermark, editing...)
pymupdf>=1.24.0

# Image handling
pillow>=10.0.0

# PDF -> Word conversion (optional but recommended)
pdf2docx>=0.5.8

# CAD conversion: DXF -> PDF (offline)
ezdxf>=1.1.0
matplotlib>=3.8.0

# CAD cloud conversion (Autodesk APS — optional)
httpx>=0.27.0

# DWG via AutoCAD COM (Windows only — optional)
# pywin32
~~~~


## 📄 `database/schema.sql`
**مخطط PostgreSQL للاشتراكات + الخطط الثلاث** — (89 سطر)

~~~~
-- ============================================================
-- محطّة PDF — مخطط قاعدة البيانات (PostgreSQL)
-- للحسابات والاشتراكات فقط — الملفات تُخزن في Cloudflare R2/S3
-- المنصات المجانية: Neon.tech | Supabase.com
-- ============================================================

-- 1) المستخدمون
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    name          VARCHAR(120),
    password_hash VARCHAR(255),              -- إن استخدمت تسجيل بالباسورد
    auth_provider VARCHAR(30) DEFAULT 'email', -- email | google | apple
    created_at    TIMESTAMPTZ DEFAULT now(),
    is_active     BOOLEAN DEFAULT true
);

-- 2) الخطط والاشتراكات
CREATE TABLE plans (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(50) NOT NULL,       -- free | monthly | yearly
    name_ar       VARCHAR(50),                -- مجاني | شهري | سنوي
    price_usd     NUMERIC(8,2) NOT NULL,      -- 0 للمجاني
    max_ops_per_day    INT DEFAULT 20,        -- عمليات يومية
    max_file_mb        INT DEFAULT 25,        -- أقصى حجم ملف
    ai_commands        BOOLEAN DEFAULT false, -- فهم AI الكامل (ميزة المشتركين)
    ocr_pages_per_day  INT DEFAULT 10,
    ads_shown          BOOLEAN DEFAULT true,  -- إعلانات للمجاني
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscriptions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id        INT REFERENCES plans(id),
    status         VARCHAR(20) DEFAULT 'active', -- active | cancelled | expired
    started_at     TIMESTAMPTZ DEFAULT now(),
    expires_at     TIMESTAMPTZ,
    auto_renew     BOOLEAN DEFAULT true,
    payment_ref    VARCHAR(120),               -- مرجع بوابة الدفع (Stripe/Paddle)
    UNIQUE(user_id, plan_id)
);

-- 3) سجل الاستخدام (للفوترة وحدود المجاني)
CREATE TABLE usage_log (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    action      VARCHAR(40) NOT NULL,          -- merge | compress | ocr | cad_convert ...
    file_size   INT,                           -- بايت
    duration_ms INT,
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_usage_user_day ON usage_log(user_id, created_at);

-- 4) الوصفات المحفوظة (pipelines)
CREATE TABLE saved_recipes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(120) NOT NULL,
    steps      JSONB NOT NULL,                 -- [{"op":"merge","params":{}}, ...]
    is_public  BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5) مشاركة النتائج (روابط مؤقتة للتحميل)
CREATE TABLE shared_files (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    storage_key VARCHAR(255) NOT NULL,         -- مفتاح الملف في R2/S3
    name        VARCHAR(255),
    size        INT,
    expires_at  TIMESTAMPTZ NOT NULL,          -- رابط مؤقت (24-72 ساعة)
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- بيانات أولية للخطط
-- ============================================================
INSERT INTO plans (name, name_ar, price_usd, max_ops_per_day, max_file_mb, ai_commands, ocr_pages_per_day, ads_shown) VALUES
('free',   'مجاني',   0.00,  20,  25, false, 10, true),
('monthly','شهري',    9.00, 500, 200, true, 200, false),
('yearly', 'سنوي',   79.00, 999, 500, true, 999, false);

-- ============================================================
-- استعلامات شائعة
-- ============================================================
-- هل تجاوز المستخدم حدّه اليومي؟
-- SELECT count(*) FROM usage_log
--  WHERE user_id = $1 AND created_at > now() - interval '1 day';
~~~~


## 📄 `claude_desktop_config.example.json`
**إعداد ربط أداة MCP مع Claude Desktop** — (9 سطر)

~~~~
{
  "mcpServers": {
    "pdf-tools": {
      "command": "python",
      "args": ["/ABSOLUTE/PATH/pdf-tools-mcp/server.py"],
      "env": {}
    }
  }
}
~~~~


## 📄 `README.md`
**التوثيق ودليل النشر** — (305 سطر)

~~~~
# 📄 PDF Tools MCP

**خادم Model Context Protocol (MCP) + واجهة ويب مبتكرة لملفات PDF ورسومات CAD**
يمنح أي مساعد ذكاء اصطناعي (Claude, Cursor, Windsurf...) قدرات:
تعديل PDF، عرضه وطباعته، ضغطه وتحويله، **والتحويل من الأتوكاد (DWG/DXF) والريفرت (RVT) إلى PDF**.

> 💡 المحركات (`pdf_engine.py` + `cad_engine.py`) مستقلة تماماً عن الـ MCP وعن الويب —
> نفس المنطق يشغّل الاثنين.

---

## 🌐 محطّة PDF — واجهة الويب المبتكرة

```bash
python run_webapp.py        # ثم افتح http://localhost:8000
```

### الحلول غير التقليدية المطبّقة
| 💡 الميزة | الوصف |
|---|---|
| **🧠 شريط أوامر ذكي** | اكتب بلغة طبيعية عربية: «ادمج الفواتير ثم اضغطها بقوة ثم ضع ختم سري» — يتحول فوراً إلى خط أنابيب منفّذ |
| **🔗 خط أنابيب مرئي** | العمليات سلسلة مترابطة (Zapier/Shortcuts لملفات PDF وCAD) — عدّل، أعد الترتيب، أضف خطوات |
| **✨ وصفات ذكية** | التطبيق يحلّل نوعية ملفاتك ويقترح سيناريوهات جاهزة (حزمة وثائق، نسخة رسمية، جاهز للإيميل...) |
| **🖨️ استوديو الطباعة** | معاينة حية لشكل الورقة قبل الطباعة (2-up / 4-up / كتيّب) — توفير حقيقي على الحبر |
| **🕘 سجل التحولات** | كل عملية محفوظة مع مخرجاتها — أعد التحميل من أي نقطة |
| **⬇️ سحب وإفلات ذكي** | يكشف نوع الملف تلقائياً (PDF/DXF/DWG/RVT/صور) ويعرض المعاينات المصغّرة |

كل المعالجة **محلية 100%** — لا رفع لأي خادم خارجي.

---

## ✨ الأدوات (32 أداة)

### 📚 الأساسيات (PDF)
| الأداة | الوظيفة |
|---|---|
| `pdf_info` | معلومات الملف: صفحات، حجم، بيانات وصفية |
| `pdf_merge` | دمج عدة ملفات في ملف واحد |
| `pdf_split` | فصل الملف إلى أجزاء (كل صفحة / كل N / نطاقات) |
| `pdf_extract_pages` | استخراج صفحات محددة |
| `pdf_delete_pages` | حذف صفحات |
| `pdf_reorder_pages` | إعادة ترتيب/تكرار الصفحات |
| `pdf_rotate` | تدوير 90/180/270 |
| `pdf_compress` | ضغط (light / medium / strong) |
| `pdf_to_images` / `images_to_pdf` | تحويل من/إلى صور PNG/JPG |
| `pdf_to_text` | استخراج النصوص |
| `pdf_to_word` | تحويل إلى Word قابل للتعديل |
| `pdf_watermark` | علامة مائية (نص عربي/إنجليزي أو ختم PDF) |
| `pdf_add_page_numbers` | ترقيم الصفحات |
| `pdf_encrypt` / `pdf_decrypt` | تشفير وفك التشفير |

### ✏️ التعديل على المحتوى
| الأداة | الوظيفة |
|---|---|
| `pdf_edit_text` | البحث عن نص واستبداله — **بنفس خط المستند الأصلي تلقائياً** |
| `pdf_get_fonts` / `list_fonts` | معرفة خطوط المستند + الخطوط المتاحة (naskh, amiri, kufi...) |
| `pdf_add_text` | إضافة نص جديد — عربي مشكّل + اختيار الخط (amiri/naskh/...) |
| `pdf_add_image` | ختم صورة (توقيع، شعار، ختم رسمي) |
| `pdf_highlight_text` | تظليل/تمييز مواضع نص |
| `pdf_add_note` | ملاحظات لاصقة (تعليقات للمراجعة) |
| `pdf_list_form_fields` | عرض حقول النماذج المتوفرة |
| `pdf_fill_form` | تعبئة نماذج PDF (نص، اختيار، قوائم) |
| `pdf_flatten` | تسطيح النماذج والملاحظات — نسخة نهائية للطباعة والأرشفة |

### 📷 OCR — الملفات الممسوحة ضوئياً (سكان)
| الأداة | الوظيفة |
|---|---|
| `pdf_is_scanned` | كشف تلقائي: هل الملف سكان (صورة بدون نص)؟ |
| `pdf_ocr` | **تفعيل OCR عربي/إنجليزي** — يضيف طبقة نص مخفية تجعل البحث والاستخراج والتعديل تعمل على الملفات الممسوحة |

**كيف يعمل؟** الملف الممسوح = صورة فقط (لا نص للتعديل). الـ OCR يرسم طبقة نص
غير مرئية فوق الصورة (تقنية الأرشفة الاحترافية) — بعدها يصبح الملف قابلاً
للبحث والنسخ والتعديل مثل أي PDF عادي. الكشف تلقائي عند الرفع في الموقع
مع وصفة «📷 فعّل OCR» بضغطة واحدة.

### 🖨️ العرض والطباعة
| الأداة | الوظيفة |
|---|---|
| `pdf_render_page` | معاينة صفحة كصورة (إظهار للمستخدم / مراجعة) |
| `pdf_print` | إرسال مباشر إلى طابعة النظام (ويندوز / ماك / لينكس) |
| `pdf_impose` | N-up: 2 أو 4 أو 6 أو 9 صفحات في الورقة (طباعة اقتصادية) |
| `pdf_booklet` | تجهيز كتيّب للطباعة على وجهين مع طي المنتصف |

### 🏗️ تحويل CAD إلى PDF ⭐
| الأداة | الوظيفة | كيف يعمل |
|---|---|---|
| `dxf_to_pdf` | **DXF (الأتوكاد) → PDF** | محلي 100% عبر ezdxf — بدون إنترنت |
| `dwg_to_pdf` | **DWG (الأتوكاد) → PDF** | AutoCAD → ODA → سحابة (تلقائي بالترتيب) |
| `rvt_to_pdf` | **RVT (ريفرت) → PDF** | Autodesk APS سحابي + سكربت Revit محلي |
| `cad_capabilities` | تقرير بالمُحوّلات المتاحة | لتشخيص أي مشكلة |

**صيغة الصفحات في كل الأدوات:** ترقيم بشري يبدأ من 1 — `"1-3,5,7-9"` أو `"2-"` أو `"all"`.

---

## 🏗️ تحويل الأتوكاد والريفرت — التفاصيل

### DXF → PDF (يعمل فوراً ✓)
محلي بالكامل — المخططات (Layouts) مع الإطارات والعناوين تُصدَّر كصفحات PDF.
```json
{"spaces": "layouts"}   ← لوحات التخطيط (الافتراضي — مثل ما تراه في AutoCAD)
{"spaces": "model"}     ← مساحة النموذج
{"spaces": "all"}       ← كل شيء
```

### DWG → PDF (سلسلة حلول ذكية)
1. **AutoCAD مثبت؟** → يُستخدم مباشرة (COM) — أعلى جودة ممكنة ✓
2. **ODA File Converter؟** (مجاني — [opendesign.com](https://www.opendesign.com/guestfiles/oda_file_converter)) → DWG→DXF ثم PDF ✓
3. **APS سحابي؟** → التحويل عبر سحابة Autodesk ✓
4. غير متوفر؟ → رسالة تشرح الخيارات بوضوح

### RVT → PDF (ريفرت)
ملفات RVT مغلقة تماماً (لا توجد مكتبة مفتوحة تقرأها) — الخياران:

| الخيار | الطريقة | الميزة |
|---|---|---|
| **سحابي (APS)** | ضع `APS_CLIENT_ID` + `APS_CLIENT_SECRET` | من أي جهاز — مجاني ([aps.autodesk.com](https://aps.autodesk.com)) |
| **سكربت Revit** | `pyrevit_export_pdf.py` المرفق | بدون إنترنت — من داخل Revit نفسه |

السكربت المرفق يصدّر **كل مخططات المشروع (Sheets)** إلى PDF:
- PDF مستقل لكل مخطط + ملف مدموج واحد للمنشأ كاملاً
- يعمل عبر pyRevit أو Macros داخل Revit (التعليمات داخل الملف)

---

## 🚀 التثبيت

```bash
cd pdf-tools-mcp

# بيئة افتراضية (يفضّل)
python -m venv .venv && source .venv/bin/activate   # ويندوز: .venv\Scripts\activate
pip install -r requirements.txt

# اختبار شامل (PDF + التعديل + الطباعة + CAD)
python demo.py

# اختبار خادم MCP نفسه
python test_mcp_client.py
```

**المتطلبات:** Python 3.10+
**اختياري:** AutoCAD أو ODA File Converter (لـ DWG) · حساب APS مجاني (لـ RVT)

---

## ⚙️ الربط بعميل MCP

### Claude Desktop
عدّل `%APPDATA%\Claude\claude_desktop_config.json` (ويندوز) أو
`~/Library/Application Support/Claude/claude_desktop_config.json` (ماك):

```json
{
  "mcpServers": {
    "pdf-tools": {
      "command": "python",
      "args": ["/المسار/المطلق/pdf-tools-mcp/server.py"],
      "env": {
        "APS_CLIENT_ID": "اختياري — لتحويل RVT/DWG سحابياً",
        "APS_CLIENT_SECRET": "اختياري"
      }
    }
  }
}
```

### Claude Code
```bash
claude mcp add pdf-tools -- python /المسار/المطلق/pdf-tools-mcp/server.py
```

### Cursor / Windsurf
أضف نفس كتلة `mcpServers` في إعدادات MCP.

---

## 💬 أمثلة محادثة حقيقية

- *«حوّل هذا المخطط DWG إلى PDF واجمعه مع العقد في ملف واحد»*
- *«افتح ملف الرسم DXF وصدّره PDF بدقة عالية»*
- *«استخرج الصفحات 5-12 من الكتالوج، أضف ختم "معتمد"، ثم اطبعه على وجهين»*
- *«بدّل كلمة "مسودة" بـ "نهائي" في كل الصفحات»*
- *«املأ النموذج باسم الشركة ورقّمه ثم صغّر الملف»*
- *«جهّز هذا الدليل ككتيّب A4 للطباعة»*
- *«اعرض لي الصفحة الأولى قبل الطباعة»*

---

## 🏛️ بنية المشروع

```
pdf-tools-mcp/
├── server.py                 # خادم MCP (32 أداة)
├── pdf_engine.py             # محرك PDF: تعديل، ضغط، تحويل، طباعة، تسطيح...
├── cad_engine.py             # محرك CAD: DXF/DWG/RVT → PDF
├── run_webapp.py             # تشغيل واجهة الويب (http://localhost:8000)
├── webapp/
│   ├── main.py               # FastAPI: خط أنابيب + رفع + معاينات + وصفات
│   ├── interpreter.py        # مفسّر الأوامر بالعربية/الإنجليزية → خط أنابيب
│   └── static/index.html     # واجهة SPA عربية RTL (بدون مكتبات خارجية)
├── pyrevit_export_pdf.py     # تصدير المخططات من داخل Revit (بدون إنترنت)
├── demo.py                   # اختبار شامل لكل الميزات
├── test_mcp_client.py        # اختبار بروتوكول MCP
├── requirements.txt
└── claude_desktop_config.example.json
```

### 🔁 إعادة الاستخدام في موقعك / تطبيقك

```python
from pdf_engine import pdf_merge, pdf_compress, pdf_edit_text, pdf_booklet
from cad_engine import dxf_to_pdf, dwg_to_pdf

# Flask / FastAPI / تطبيق سطح مكتب — نفس الدوال بالضبط:
result = dxf_to_pdf("plan.dxf", "plan.pdf")
```

كل الدوال تأخذ مسارات وتُرجع `dict` — اربطها بأي واجهة تحبها (واجهة ويب، API، CLI).

---

## 🚀 النشر أونلاين (Vercel)

### ماذا يحتاج من قاعدة بيانات؟
| | قاعدة بيانات؟ | أين؟ |
|---|---|---|
| التحويل والمعالجة | ❌ لا | ملفات مؤقتة فقط |
| الحسابات والاشتراكات | ✅ نعم | **PostgreSQL مجاني** (Neon / Supabase) |
| الملفات الناتجة | ❌ ليست DB | **Cloudflare R2** (10GB مجاناً) |

مخطط قاعدة البيانات الجاهز: [`database/schema.sql`](database/schema.sql)

### خطوات النشر على Vercel
```bash
# 1) ثبّت Vercel CLI
npm i -g vercel

# 2) من مجلد المشروع — اربطه بحسابك
cd pdf-tools-mcp
vercel

# 3) المتطلبات: Vercel يقرأ تلقائياً requirements-vercel.txt؟
#    لذا أعدّل الاسم (أو انسخه):
cp requirements-vercel.txt requirements.txt

# 4) النشر النهائي
vercel --prod
```

### البنية المُعدّة للنشر (موجودة في المشروع)
```
├── api/index.py            # API بدون حالة (Stateless) — مُختبر ✅
├── public/index.html       # واجهة المتصفح تحتفظ بالملفات محلياً
├── vercel.json             # الإعدادات (ذاكرة 1GB — مدة 120s)
├── requirements-vercel.txt # الحزمة الخفيفة
└── database/schema.sql     # مخطط PostgreSQL جاهز
```

### ⚠️ قيود Vercel (وحلولها)
| القيد | الحل |
|---|---|
| لا يمكن تثبيت Tesseract → OCR لا يعمل | نسخة Vercel: OCR غير متاح (موضح في الواجهة) — فعّله على الخادم المحلي / VPS |
| حد 4.5MB للطلب | الملفات تبقى في المتصفح وتُرسل مباشرة (التصميم الحالي) — للحجم الأكبر: رفع إلى R2 |
| بدون ذاكرة مشتركة | API بدون حالة: المتصفح يحتفظ بالملفات والنتائج كـ ZIP |
| مدة التنفيذ | `maxDuration: 120` في vercel.json (ترفعها Pro) |

### 🔧 التفعيل التجاري (اشتراكات + إعلانات)
1. أنشئ قاعدة **Neon** (مجانية) ونفّذ `database/schema.sql`
2. **Auth**: Clerk أو Supabase Auth (لديهما خطة مجانية)
3. **المدفوعات**: Stripe / Paddle (عمولة على المبيعات فقط)
4. **الإعلانات**: AdSense على الواجهة المجانية فقط (لا تظهر للمشتركين)
5. **R2**: تخزين الملفات المشتركة والروابط المؤقتة

---

## 🧪 الاختبار

```bash
python demo.py              # 14 قسم اختبار + ملفات تجريبية حقيقية في demo_output/
python test_mcp_client.py   # list + call عبر بروتوكول MCP
```

---

## ❓ الأسئلة الشائعة

**هل تُرفع ملفاتي لأي خادم؟**
كل معالجة PDF و DXF محلية 100%. فقط DWG/RVT عبر السحابة (بمعرفاتك أنت) — وفقط عند اختيارك.

**لماذا لا يوجد تحويل RVT محلي مباشر؟**
صيغة RVT مغلقة تماماً من Autodesk ولا توجد مكتبة مفتوحة تقرأها. الحلول المتاحة
(APS أو سكربت Revit) هي نفسها التي تستخدمها البرامج التجارية.

**مستويات الضغط؟**
`light` آمن دائماً · `medium` توازن · `strong` أقصى توفير (جودة صور أقل).

**الطباعة لا تعمل؟**
تأكد من وجود طابعة افتراضية على النظام. على لينكس/ماك يُستخدم CUPS (`lp`)، وعلى ويندوز نظام الطباعة المباشر.

---

## 📜 الترخيص

مشروعك الخاص — استخدمه وحوّله كما تشاء.
~~~~

---

## ✅ نهاية البرومبت

- **التشغيل المحلي:** `pip install -r requirements.txt` ثم `python3 run_webapp.py` ← http://localhost:8000
- **النشر على Vercel:** `cp requirements-vercel.txt requirements.txt && vercel --prod`
- **ربط MCP:** انظر `claude_desktop_config.example.json`
- **القيود الذهبية:** كل شيء بالعربية · لا دارك مود · واجهة منظمة مرقّمة · الحلول مبتكرة + الأسهل والمجاني والأونلاين.

*(وُلِّد هذا المستند بتاريخ 2026-10-19 — يشمل الملف الـ16 والكود كاملاً.)*
