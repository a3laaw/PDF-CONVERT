#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""معالجة لاحقة للدراسة: ميتاداتا + أرقام صفحات (الغلاف والختام بلا رقم) + فحص فساد النص"""
import fitz
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from io import BytesIO

SRC = "/home/z/my-project/download/الدراسة-الكاملة-لتطوير-محوّل-PDF.pdf"

# ─── ١) أرقام الصفحات: الغلاف مخفي، المحتوى يبدأ من ١، صفحة الختام الداكنة بلا رقم ───
reader = PdfReader(SRC)
n = len(reader.pages)
w = float(reader.pages[0].mediabox.width)
h = float(reader.pages[0].mediabox.height)
writer = PdfWriter()
for i, page in enumerate(reader.pages):
    if 1 <= i <= n - 2:  # من الصفحة الفيزيائية الثانية إلى ما قبل الختام
        buf = BytesIO()
        c = canvas.Canvas(buf, pagesize=(w, h))
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0.42, 0.50, 0.62)
        c.drawCentredString(w / 2, 22, str(i))  # الغلاف صفحة ١ منطقيًّا بلا رقم ظاهر
        c.save()
        buf.seek(0)
        overlay = PdfReader(buf).pages[0]
        page.merge_page(overlay)
    writer.add_page(page)

writer.add_metadata({
    "/Title": "الدراسة الكاملة للتطوير القادم — محوّل PDF",
    "/Author": "محوّل PDF",
    "/Subject": "خريطة طريق التطوير: توحيد إزالة العلامات، التحرير المباشر، OCR سحابي، واستكمال أدوات أكروبات",
    "/Creator": "محوّل PDF",
})
with open(SRC, "wb") as f:
    writer.write(f)
print(f"metadata + page numbers done | pages: {n}")

# ─── ٢) فحص فساد النص وعد الكلمات العربية الحقيقي ───
doc = fitz.open(SRC)
bad = 0
words = 0
for p in doc:
    t = p.get_text()
    bad += t.count("\ufffd")
    words += len([x for x in t.split() if any("\u0600" <= ch <= "\u06ff" for ch in x)])
print(f"arabic words: {words} | U+FFFD: {bad} | pages: {doc.page_count}")
assert bad == 0, "فساد ترميز!"

# ─── ٣) لقطات للفحص البصري ───
for idx in [0, 1, 5, 8, 9, 11, 13]:
    if idx < doc.page_count:
        doc[idx].get_pixmap(dpi=72).save(f"/tmp/study_p{idx+1}.png")
print("previews saved: /tmp/study_p*.png")
