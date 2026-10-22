#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""تنظيف تجريبي للعلامة المائية المطبوعة داخل صورة المستخدم:
   الصفحة كلها JPEG مولّفة — العلامة «ALAA» رمادي فاتح (~222) داخل بكسلات الصورة.
   نبيّض نطاق الإضاءة الخاص بالعلامة فقط، ونحفظ النص الداكن والإطار الأزرق (243+)."""
from PIL import Image
import numpy as np
import fitz, os

SRC = "/tmp/wm_embedded.png"
OUT_PNG = "/tmp/wm_cleaned.png"
OUT_PDF = "/home/z/my-project/download/Formal Arabic Letter with ALAA Watermark-بدون-علامة.pdf"
CMP = "/home/z/my-project/scripts/t_out/wm_before_after.png"

im = Image.open(SRC).convert("RGB")
a = np.array(im).astype(np.int16)
lum = a.mean(axis=2)
sat = a.max(axis=2) - a.min(axis=2)  # فرق القنوات — الإطار أزرق أكثر

# نطاق العلامة: إضاءة 200-238 وإشباع منخفض (رمادي مائل للأزرق الخفيف)
mask = (lum >= 200) & (lum < 238) & (sat <= 20)
a[mask] = [255, 255, 255]
print("whitened pixels:", int(mask.sum()), "=", round(100 * mask.sum() / mask.size, 2), "%")

out = Image.fromarray(a.astype(np.uint8))
out.save(OUT_PNG)

# PDF جديد بمقاس الصفحة الأصلي تمامًا
src_doc = fitz.open("/home/z/my-project/upload/Formal Arabic Letter with ALAA Watermark.pdf")
pr = src_doc[0].rect
src_doc.close()
doc = fitz.open()
p = doc.new_page(width=pr.width, height=pr.height)
p.insert_image(pr, filename=OUT_PNG)
doc.save(OUT_PDF, deflate=True)
doc.close()
print("saved:", OUT_PDF, os.path.getsize(OUT_PDF), "bytes")

# صورة مقارنة: قبل/بعد (منتصف الصفحة حيث العلامة)
before = Image.open(SRC).convert("RGB").crop((300, 560, 1024, 1160))
after = out.crop((300, 560, 1024, 1160))
w, h = before.size
cmp_im = Image.new("RGB", (w, h * 2 + 20), "white")
cmp_im.paste(before, (0, 0))
cmp_im.paste(after, (0, h + 20))
cmp_im.save(CMP)
print("comparison:", CMP)
