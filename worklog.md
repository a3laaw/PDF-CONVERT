# سجل العمل — مشروع «محطّة PDF»

---
Task ID: 1
Agent: الوكيل الرئيسي (Z.ai)
Task: دراسة كاملة لملف PROMPT.md المرفوع (/home/z/my-project/upload/PROMPT.md — 6337 سطر، 276KB)

Work Log:
- قراءة الملف كاملاً على أجزاء: الأقسام 0-14 (الفكرة، نموذج العمل، القيود، البنية، المحركات، API، العمليات، MCP، Vercel، قاعدة البيانات، قواعد اللغة، الواجهة، معايير القبول)
- دراسة الكود الكامل للملفات الـ16: pdf_engine.py (~1785 سطر)، cad_engine.py (~497)، server.py (~637)، run_webapp.py، webapp/ops.py (~246)، webapp/interpreter.py (~831)، webapp/main.py (~557)، webapp/static/index.html (~385)، api/index.py (~224)، public/index.html (~361)، vercel.json، requirements-vercel.txt، requirements.txt، database/schema.sql، claude_desktop_config.example.json، README.md (~305)
- استخراج خريطة الأقسام عبر فهرسة العناوين

Stage Summary:
- **الفهم الكامل للمشروع**: منصة عربية 100% لأدوات PDF + CAD: موقع ويب (FastAPI محلي + Vercel Stateless) + أداة MCP (36 أداة)
- **المحركات**: pdf_engine (pypdf+PyMuPDF+Pillow، OCR بتمريرين، مطابقة الخطوط مع طبقة بحث مخفية word[::-1] render_mode=3)، cad_engine (DXF محلي عبر ezdxf+matplotlib، DWG عبر AutoCAD COM→ODA→APS، RVT عبر APS فقط)
- **المفسّر الهجين (interpreter.py)**: تطبيع عربي عميق + قاموس نوايا regex (فصحى/مصري/خليجي/شامي/إنجليزي) + بحث ضبابي للأخطاء الإملائية (cutoff 0.72) + تفكيك «و» الحذر + «هل تقصد؟» + LLM احتياطي (Groq/Gemini/OpenAI) + وصفات ذكية حسب أنواع الملفات
- **القيود الذهبية**: كل شيء بالعربية، لا دارك مود (ثيم #F4F6FB/#FFFFFF/#4F55E3)، تدفق مرقّم ١٢٣، لغة السوق، النواة بدون DB وبدون مفاتيح API، الملفات لا تُخزَّن في نسخة الويب العامة
- **ملاحظات تقنية مهمة اكتشفتها**:
  1. server.py يستورد `from mcp.server.mcpserver import MCPServer` — مسار غير قياسي في حزمة mcp الشائعة (القياسية: `from mcp.server.fastmcp import FastMCP`) — قد يحتاج تعديلاً حسب إصدار mcp المثبت
  2. webapp/main.py يكرّر تعريفات العمليات 31 بدل استيراد webapp/ops.py (تكرار مقصود؟ أو تقنية قديمة)
  3. OCR معطّل على Vercel (لا Tesseract binary) — مذكور برسالة واضحة
  4. حد طلب Vercel 4.5MB → الملفات تبقى في المتصفح في النسخة السحابية
  5. vercel.json يتضمن includeFiles للخطوط TTF
  6. هناك ملفات مشار إليها لكنها ليست في البرومبت: pyrevit_export_pdf.py، demo.py، test_mcp_client.py
- **لم يُطلب بعد أي بناء أو تعديل** — انتظار توجيه المستخدم
