#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""صور اختبار لأدوات الصور: صورة عادية JPG + PNG شفاف + صورة عريضة للقص"""
import os
from PIL import Image, ImageDraw

OUT = "/home/z/my-project/scripts/t_in"
os.makedirs(OUT, exist_ok=True)

# 1) صورة JPG عادية 1200×800 — تدرجات وأشكال
im = Image.new("RGB", (1200, 800), (235, 240, 245))
d = ImageDraw.Draw(im)
for i in range(0, 1200, 60):
    d.line([(i, 0), (i, 800)], fill=(200 - (i // 60) * 6 % 180, 215, 230), width=30)
d.ellipse([420, 200, 780, 560], fill=(230, 90, 60))
d.rectangle([100, 550, 400, 720], fill=(40, 110, 190))
d.polygon([(800, 700), (950, 420), (1100, 700)], fill=(60, 160, 90))
im.save(f"{OUT}/test_photo.jpg", "JPEG", quality=92)

# 2) PNG شفاف 800×600 — خلفية شفافة تمامًا ودائرة معتمة
im2 = Image.new("RGBA", (800, 600), (0, 0, 0, 0))
d2 = ImageDraw.Draw(im2)
d2.ellipse([180, 100, 620, 500], fill=(70, 130, 220, 255))
d2.rectangle([300, 250, 500, 420], fill=(250, 200, 40, 230))
im2.save(f"{OUT}/test_alpha.png", "PNG")

# 3) صورة عريضة 1600×900 للقص (16:9 → 1:1 يقص العرض؛ و4:3 يقص العرض أيضًا)
im3 = Image.new("RGB", (1600, 900), (255, 255, 255))
d3 = ImageDraw.Draw(im3)
d3.rectangle([0, 0, 1600, 900], fill=(250, 245, 235))
d3.rectangle([0, 0, 1600, 900], outline=(120, 120, 120), width=8)
d3.rectangle([700, 350, 900, 550], fill=(200, 60, 60))
d3.text((40, 40), "WIDE 1600x900", fill=(30, 30, 30))
im3.save(f"{OUT}/test_wide.png", "PNG")

for n in ("test_photo.jpg", "test_alpha.png", "test_wide.png"):
    p = f"{OUT}/{n}"
    im_ = Image.open(p)
    print(n, im_.size, im_.mode, os.path.getsize(p), "bytes")
