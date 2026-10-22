#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""تجهيز عينات اختبار «الذكية» داخل public/ للحقن في المتصفح:
   1) t_real.pdf  — PDF حقيقي من صفحتين
   2) t_fake.pdf  — بايتات PNG لكن باسم .pdf (لفحص التوقيع الرقمي)
   3) t_wm.pdf    — PDF بعلامة مائية نصية «مسودة» لإعادة التحقق من بدون علامة
"""
import fitz, shutil, os

AR_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
PUB = "/home/z/my-project/public"

# 1) PDF حقيقي
doc = fitz.open()
for i in range(2):
    p = doc.new_page(width=595, height=842)
    p.insert_text((72, 120), f"Real PDF - page {i+1}", fontsize=16, fontname="helv")
    p.insert_text((72, 160), "This file must be detected as a real PDF.", fontsize=11, fontname="helv")
doc.save(f"{PUB}/t_real.pdf", deflate=True)
doc.close()

# 2) مزيف: صورة PNG لكن باسم .pdf
img = fitz.open()
p = img.new_page(width=200, height=150)
p.insert_text((40, 80), "IMG", fontsize=40, fontname="helv")
pix = p.get_pixmap(dpi=72)
pix.save(f"{PUB}/t_fake_tmp.png")          # PNG حقيقي
shutil.move(f"{PUB}/t_fake_tmp.png", f"{PUB}/t_fake.pdf")  # نعيد التسمية فقط
img.close()
head = open(f"{PUB}/t_fake.pdf", "rb").read(4)
assert head[:4] == b"\x89PNG", "t_fake.pdf ليس PNG!"

# 3) علامة مائية «مسودة»
wm = fitz.open()
for i in range(2):
    p = wm.new_page(width=595, height=842)
    p.insert_text((72, 120), "Project Report", fontsize=16, fontname="helv")
    p.insert_text((72, 160), "Normal body content survives.", fontsize=11, fontname="helv")
    p.insert_text((80, 500), "مسودة", fontsize=64, fontname="F0", fontfile=AR_FONT,
                  morph=(p.rect.tl, fitz.Matrix(1, 1).prerotate(45)),
                  fill_opacity=0.18, color=(0.4, 0.4, 0.4))
wm.save(f"{PUB}/t_wm.pdf", deflate=True)
wm.close()

for f in ("t_real.pdf", "t_fake.pdf", "t_wm.pdf"):
    path = f"{PUB}/{f}"
    print(f, os.path.getsize(path), "bytes | magic:", open(path, "rb").read(4))
