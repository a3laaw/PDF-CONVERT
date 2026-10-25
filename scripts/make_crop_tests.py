#!/usr/bin/env python3
"""ملفات اختبار القص الحر: صورة فيها كتابة ايد + صورة ثانية للدفعة"""
from PIL import Image, ImageDraw, ImageFont

base = "/home/z/my-project/test-assets"

# صورة 1: مستند أبيض فيه سطور + "كتابة ايد" حمراء في الركن
img = Image.new("RGB", (800, 1000), "#ffffff")
d = ImageDraw.Draw(img)
for y in range(120, 900, 60):
    d.line([(60, y), (740, y)], fill="#333333", width=3)
try:
    f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
except Exception:
    f = None
d.text((60, 40), "Test Document - Crop Feature", fill="#1a1a8c", font=f)
# كتابة اليد الحمراء — دايرة وخربشة في الركن العلوي
d.ellipse([560, 60, 740, 160], outline="#cc2222", width=6)
d.line([(580, 100), (720, 130)], fill="#cc2222", width=5)
d.line([(590, 140), (700, 80)], fill="#cc2222", width=5)
img.save(f"{base}/crop_clean_me.png")

# صورة 2: نسخة مختلفة قليلًا للدفعة
img2 = Image.new("RGB", (800, 1000), "#fefefe")
d2 = ImageDraw.Draw(img2)
for y in range(100, 950, 55):
    d2.line([(70, y), (730, y)], fill="#444444", width=3)
d2.text((70, 30), "Second Image For Batch", fill="#8c1a1a", font=f)
d2.ellipse([550, 70, 730, 170], outline="#2a8c22", width=6)
img2.save(f"{base}/crop_second.png")

print("made crop_clean_me.png + crop_second.png")
