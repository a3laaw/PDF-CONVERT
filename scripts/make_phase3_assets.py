#!/usr/bin/env python3
# أصول اختبار المرحلة 3 + OCR:
#  t_ma.pdf (3 صفحات A1 A2 A3) + t_mb.pdf (صفحتان B1 B2) — لدمج الصفحات
#  ocr_note.png (صورة بنص INVOICE 2026 TOTAL 250 + فاتورة) + ocr_scan.pdf (PDF ممسوح من الصورة)
import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

OUT = "/home/z/my-project/scripts/t_in"
import os
os.makedirs(OUT, exist_ok=True)

# ── ملفا الدمج ──
def make_pdf(path, labels):
    doc = fitz.open()
    for lab in labels:
        p = doc.new_page(width=595, height=842)
        p.insert_text((200, 400), lab, fontsize=120, fontname="helv", color=(0.1, 0.1, 0.4))
        p.insert_text((230, 470), f"page {lab}", fontsize=28, fontname="helv", color=(0.3, 0.3, 0.3))
    doc.save(path)
    doc.close()

make_pdf(f"{OUT}/t_ma.pdf", ["A1", "A2", "A3"])
make_pdf(f"{OUT}/t_mb.pdf", ["B1", "B2"])

# ── صورة OCR ──
W, H = 1000, 500
img = Image.new("RGB", (W, H), "white")
d = ImageDraw.Draw(img)
try:
    f_big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
    f_ar = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 56)
except Exception:
    f_big = f_ar = ImageFont.load_default()
d.text((80, 90), "INVOICE 2026", font=f_big, fill="black")
d.text((80, 220), "TOTAL 250", font=f_big, fill="black")
ar = get_display(arabic_reshaper.reshape("فاتورة مبيعات"))
d.text((80, 360), ar, font=f_ar, fill=(30, 30, 30))
img.save(f"{OUT}/ocr_note.png")

# ── PDF ممسوح (صورة فقط بلا طبقة نص) ──
img.convert("RGB").save(f"{OUT}/ocr_scan.pdf", "PDF", resolution=100)

# نسخ إلى public للتقديم عبر السيرفر
import shutil
for f in ["t_ma.pdf", "t_mb.pdf", "ocr_note.png", "ocr_scan.pdf"]:
    shutil.copy(f"{OUT}/{f}", f"/home/z/my-project/public/{f}")

print("ASSETS-OK")
for f in ["t_ma.pdf", "t_mb.pdf", "ocr_note.png", "ocr_scan.pdf"]:
    p = f"/home/z/my-project/public/{f}"
    print(f, os.path.getsize(p))
