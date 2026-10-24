# -*- coding: utf-8 -*-
"""توليد PDF ماسوح ضوئيًا عربي (صفحة = صورة فقط، بلا أي نص رقمي)
للاختبار الحقيقي لطبقة التعديل — يحاكي وثيقة خرجت من ماسح ضوئي"""
import random

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import fitz

W, H = 1240, 1754  # A4 @150dpi
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def ar(t: str) -> str:
    return get_display(arabic_reshaper.reshape(t))


img = Image.new("RGB", (W, H), (252, 251, 248))
d = ImageDraw.Draw(img)

# إطار المستند
d.rectangle([70, 60, W - 70, H - 60], outline=(90, 90, 90), width=2)
d.rectangle([80, 70, W - 80, H - 70], outline=(140, 140, 140), width=1)

d.font = None
f_title = ImageFont.truetype(FONT_B, 44)
f_h = ImageFont.truetype(FONT_B, 30)
f_b = ImageFont.truetype(FONT, 26)

d.text((W - 120, 110), ar("إيصال استلام وثائق"), font=f_title, fill=(25, 25, 30), anchor="ra")
d.text((W - 120, 180), ar("بلدية المدينة — شؤون المخاطبات"), font=f_h, fill=(60, 60, 70), anchor="ra")

rows = [
    ("الاسم", "عبد الرحمن بن خالد العتيبي"),
    ("رقم الطلب", "٤٤١٧ / ٢٠٢٦"),
    ("نوع المعاملة", "تصديق وكالة شرعية"),
    ("تاريخ التقديم", "١٤ صفر ١٤٤٧هـ"),
    ("الرسوم", "٣٥ ريالًا مدفوعة"),
]
y = 280
for k, v in rows:
    d.line([120, y + 62, W - 120, y + 62], fill=(170, 170, 170), width=1)
    d.text((W - 140, y + 18), ar(k), font=f_h, fill=(30, 30, 35), anchor="ra")
    d.text((140, y + 20), ar(v), font=f_b, fill=(45, 45, 50), anchor="la")
    y += 76

d.text((W - 120, y + 40), ar("ملاحظات الموظف:"), font=f_h, fill=(30, 30, 35), anchor="ra")
notes = [
    "تم التحقق من هوية مقدم الطلب ومطابقة البطاقة للوجهين.",
    "الوثيقة الأصلية سليمة، وتُرفق صورة عليها ختم الدائرة.",
    "يُرجى المراجعة بعد خمسة أيام عمل لاستلام الرد الرسمي.",
]
yy = y + 96
for n in notes:
    d.text((W - 150, yy), ar("• " + n), font=f_b, fill=(50, 50, 55), anchor="ra")
    yy += 52

d.text((W - 120, yy + 60), ar("التوقيع: ــــــــــــــــ"), font=f_b, fill=(40, 40, 45), anchor="ra")
d.text((W - 120, yy + 130), ar("الختم الرسمي"), font=f_h, fill=(120, 40, 40), anchor="ra")

# ملمس ماسح ضوئي: ضجيج خفيف + تعتيم طفيف
random.seed(7)
px = img.load()
for _ in range(14000):
    x, yy2 = random.randrange(W), random.randrange(H)
    r, g, b = px[x, yy2]
    px[x, yy2] = (max(0, r - random.randrange(14)), max(0, g - random.randrange(14)), max(0, b - random.randrange(14)))
img = img.filter(ImageFilter.GaussianBlur(0.4))

img.save("/home/z/my-project/scripts/t_out/e2e/scanned_page.png")
doc = fitz.open()
page = doc.new_page(width=595, height=842)  # A4 pt
page.insert_image(page.rect, filename="/home/z/my-project/scripts/t_out/e2e/scanned_page.png")
doc.save("/home/z/my-project/scripts/t_out/e2e/scanned.pdf", deflate=True)
print("saved scanned.pdf, pages:", doc.page_count, "text_len:", len(doc[0].get_text()))
