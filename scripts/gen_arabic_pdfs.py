# -*- coding: utf-8 -*-
# توليد ملفين PDF عربيين نقيين لاختبار التحويل (reportlab بلا تشكيل — حروف من القاعدة مباشرة):
#   1) t_ar_logical.pdf — التدفق يكتب الجمل بالترتيب المنطقي (مولدات نادرة)
#   2) t_ar_visual.pdf — التدفق يكتبها بالترتيب البصري (أغلب المولدات: Word وغيرها)
#   + سطر كلماته عناصر منفصلة (drawString لكل كلمة) لاختبار ترتيب الكلمات عبر العناصر
import os
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT = "/usr/share/fonts/truetype/freefont/FreeSerif.ttf"
pdfmetrics.registerFont(TTFont("FreeSerif", FONT))

SENTENCES = [
    "السلام عليكم ورحمة الله وبركاته",
    "بلغ عدد السكان 12345 نسمة في عام 2020 حسب الإحصاء",
    "هذا تقرير مالي عن شركة النور للتجارة المحدودة",
    "الملف مرفق مع مجلد المستندات المهمة في المكتب",
    "المشروع يتكون من ثلاث مراحل رئيسية",
]


def reverse_visual(s):
    """قلب بصري مع إبقاء مقاطع الأرقام/اللاتينية بترتيبها الداخلي (محاكاة محرك تشكيل سليم)"""
    import re

    runs = re.findall(r"[0-9A-Za-z][0-9A-Za-z.,:%\-/]*|[^0-9A-Za-z]+", s)
    return "".join(r[::-1] if not re.match(r"[0-9A-Za-z]", r) else r for r in runs[::-1])


def make(name, transform):
    path = os.path.join("public", name)
    c = canvas.Canvas(path, pagesize=(595, 842))
    y = 760
    for i, s in enumerate(SENTENCES):
        c.setFont("FreeSerif", 16)
        # سطر الكلمات المنفصلة: كل كلمة في موضعها البصري الصحيح —
        # الكلمات المنطقية تُرسم من اليمين لليسار، وحروف كل كلمة تتبع التحويل
        if i == len(SENTENCES) - 1:
            x = 520  # نبدأ من اليمين
            for w in s.split(" "):
                wt = transform(w)
                w_width = pdfmetrics.stringWidth(wt, "FreeSerif", 16)
                c.drawString(x - w_width, y, wt)  # نهاية الكلمة عند x
                x -= w_width + 12  # مسافة بين الكلمات
        else:
            c.drawCentredString(297, y, transform(s))
        y -= 48
    c.save()
    print("OK", name)


make("t_ar_logical.pdf", lambda s: s)
make("t_ar_visual.pdf", reverse_visual)
