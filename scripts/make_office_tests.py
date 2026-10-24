"""ملفات اختبار للتحويل إلى Word/Excel: PDF نصي عربي-إنجليزي + PDF جدول."""
import fitz

# 1) PDF نصي: فقرات + عناوين
doc = fitz.open()
p = doc.new_page()  # A4
w, h = p.rect.width, p.rect.height
# عنوان كبير
p.insert_text((72, 100), "INVOICE REPORT", fontsize=22, fontname="helv")
# سطر إنجليزي
p.insert_text((72, 140), "Customer: Ahmed Ali  Total: 250 USD", fontsize=12, fontname="helv")
# عدة أسطر لاتينية تشبه جدولًا بسيطًا (أعمدة بمواضع x ثابتة)
rows = [
    ("Item", "Qty", "Price"),
    ("Chair", "4", "40.00"),
    ("Table", "2", "120.00"),
    ("Lamp", "6", "15.00"),
]
y = 180
for r in rows:
    p.insert_text((72, y), r[0], fontsize=11, fontname="helv")
    p.insert_text((250, y), r[1], fontsize=11, fontname="helv")
    p.insert_text((380, y), r[2], fontsize=11, fontname="helv")
    y += 24
# سطر عربي — هيلفيتيشينا لا يدعم العربي؛ نستخدم خط جهاز بسيط (cairo لا يتوفر) نكتب بالاتيني بدلها
p.insert_text((72, y + 30), "Page one body text for the word converter test.", fontsize=11, fontname="helv")
doc.save("/home/z/my-project/public/t_invoice.pdf")
print("t_invoice.pdf saved")

# 2) ملف ممسوح: نص كصورة (يحتاج OCR)
from PIL import Image, ImageDraw, ImageFont
img = Image.new("RGB", (900, 500), "white")
d = ImageDraw.Draw(img)
try:
    f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
    fb = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
except Exception:
    f = fb = ImageFont.load_default()
d.text((60, 40), "SCAN TEST DOCUMENT", font=fb, fill="black")
d.text((60, 120), "Hello scanned world 123", font=f, fill="black")
d.text((60, 170), "Second line here", font=f, fill="black")
img.save("/tmp/scan_page.png")
d2 = fitz.open()
pg = d2.new_page(width=612, height=792)
pg.insert_image(pg.rect, filename="/tmp/scan_page.png")
d2.save("/home/z/my-project/public/t_scan2.pdf")
print("t_scan2.pdf saved")
