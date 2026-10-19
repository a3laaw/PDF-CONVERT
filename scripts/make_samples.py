#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate synthetic sample files for conversion testing."""
import os, struct, io, random

OUT = '/home/z/my-project/scripts/samples'
os.makedirs(OUT, exist_ok=True)

# ---------- 1. DXF (ezdxf) ----------
import ezdxf
doc = ezdxf.new('R2018', setup=True)
msp = doc.modelspace()
msp.add_line((0, 0), (100, 0))
msp.add_line((100, 0), (100, 60))
msp.add_line((100, 60), (0, 60))
msp.add_line((0, 60), (0, 0))
msp.add_circle((50, 30), radius=12).dxf.layer = 'Walls'
msp.add_lwpolyline([(10, 10), (90, 10), (90, 50), (10, 50)], close=True)
msp.add_text('SAMPLE PLAN', dxfattribs={'height': 5, 'insert': (30, 64)}).set_placement((30, 64))
msp.add_arc((50, 30), radius=20, start_angle=0, end_angle=180)
msp.add_insert('LINE', insert=(20, 20)) if 'LINE' in [b.name for b in doc.blocks] else None
doc.saveas(os.path.join(OUT, 'sample.dxf'))
print('dxf ok')

# ---------- 2. PNG / JPG (PIL) ----------
from PIL import Image, ImageDraw
im = Image.new('RGB', (900, 600), '#f0fdf4')
d = ImageDraw.Draw(im)
d.ellipse([250, 100, 650, 500], fill='#10b981', outline='#065f46', width=8)
d.rectangle([80, 80, 300, 300], outline='#1c1917', width=6)
d.text((60, 540), 'Sample Image', fill='#1c1917')
im.save(os.path.join(OUT, 'sample.png'))
im.save(os.path.join(OUT, 'sample.jpg'), quality=90)
print('png/jpg ok')

# ---------- 3. PSD (minimal flattened writer) ----------
def write_minimal_psd(path, rgb, w, h):
    with open(path, 'wb') as f:
        f.write(b'8BPS')                    # signature
        f.write(struct.pack('>H', 1))       # version
        f.write(b'\x00' * 6)                # reserved
        f.write(struct.pack('>H', 3))       # channels
        f.write(struct.pack('>II', h, w))   # height, width
        f.write(struct.pack('>H', 8))       # depth
        f.write(struct.pack('>H', 0))       # RGB mode
        f.write(struct.pack('>I', 0))       # color mode data
        f.write(struct.pack('>I', 0))       # image resources
        f.write(struct.pack('>I', 0))       # layer & mask
        f.write(struct.pack('>H', 0))       # compression: raw
        for ch in range(3):                 # planar channel data
            f.write(bytes(rgb[ch]))
random.seed(42)
r = bytearray(); g = bytearray(); b = bytearray()
for y in range(300):
    for x in range(500):
        r.append(x * 255 // 500); g.append(y * 255 // 300); b.append(180)
write_minimal_psd(os.path.join(OUT, 'sample.psd'), [r, g, b], 500, 300)
print('psd ok')

# ---------- 4. AI (fitz) ----------
import fitz
pdoc = fitz.open()
page = pdoc.new_page(width=595, height=842)
page.draw_rect(fitz.Rect(50, 50, 545, 792), color=(0.04, 0.47, 0.36), width=3)
page.draw_circle(fitz.Point(300, 300), 90, color=(0.1, 0.1, 0.1), width=2)
page.insert_text((80, 120), 'AI-compatible vector sample', fontsize=18)
pdoc.save(os.path.join(OUT, 'sample.ai'))
pdoc.close()
print('ai ok')

# ---------- 5. EPS (hand-written) ----------
eps = """%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 400 300
%%EndComments
0.04 0.58 0.36 setrgbcolor
200 150 100 0 360 arc fill
0 0 0 setrgbcolor
2 setlinewidth
20 20 moveto 380 20 lineto 380 280 lineto 20 280 lineto closepath stroke
showpage
%%EOF
"""
with open(os.path.join(OUT, 'sample.eps'), 'w') as f:
    f.write(eps)
print('eps ok')

# ---------- 6. synthetic DWG (header + sentinel + DIB) ----------
bmp = Image.new('RGB', (480, 320), '#0f766e')
d2 = ImageDraw.Draw(bmp)
d2.rectangle([40, 40, 440, 280], outline='#fef3c7', width=4)
d2.line([40, 160, 440, 160], fill='#fef3c7', width=2)
d2.line([240, 40, 240, 280], fill='#fef3c7', width=2)
buf = io.BytesIO()
bmp.save(buf, 'BMP')
bmp_bytes = buf.getvalue()
dib = bmp_bytes[14:]  # drop BITMAPFILEHEADER, keep DIB
dwg = bytearray()
dwg += b'AC1032\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'  # 18-byte header
dwg += b'\x00' * 90
sent = bytes([0x1F, 0x25, 0x6D, 0x07, 0xD4, 0x36, 0x28, 0x28, 0x9D, 0x57, 0xCA, 0x3F, 0x9D, 0x44, 0x10, 0x2B])
dwg += sent
dwg += b'\x00' * 6       # class + addresses
dwg += struct.pack('<HHHHH', 320, 480, 0, 1, 0)  # rows, cols, ?, type=BMP, ?
dwg += dib
dwg += b'\x00' * 500
with open(os.path.join(OUT, 'sample.dwg'), 'wb') as f:
    f.write(dwg)
print('dwg ok')

# ---------- 7. synthetic RVT (OLE + appended JPEG) ----------
tmp = os.path.join(OUT, 'plain.txt')
with open(tmp, 'w') as f:
    f.write('ole container simulation')
subprocess_ok = os.system(
    'libreoffice --headless --convert-to doc --outdir %s %s >/dev/null 2>&1' % (OUT, tmp))
doc_path = os.path.join(OUT, 'plain.doc')
if subprocess_ok == 0 and os.path.exists(doc_path) and os.path.getsize(doc_path) > 0:
    base = open(doc_path, 'rb').read()
else:
    base = b'NOT-OLE-' * 100
jpeg_buf = io.BytesIO()
Image.new('RGB', (640, 420), '#7c2d12').save(jpeg_buf, 'JPEG', quality=85)
with open(os.path.join(OUT, 'sample.rvt'), 'wb') as f:
    f.write(base)
    f.write(jpeg_buf.getvalue())
print('rvt ok (doc-ole=%s)' % bool(subprocess_ok == 0 and os.path.exists(doc_path)))

# ---------- 8. synthetic INDD (blob + embedded JPEG) ----------
ibuf = io.BytesIO()
Image.new('RGB', (700, 500), '#312e81').save(ibuf, 'JPEG', quality=88)
jp = ibuf.getvalue()
blob = os.urandom(20000) + jp + os.urandom(8000)
with open(os.path.join(OUT, 'sample.indd'), 'wb') as f:
    f.write(blob)
print('indd ok')

# ---------- 9. plain PDF ----------
m2 = fitz.open()
pg = m2.new_page()
pg.insert_text((72, 100), 'Merge test page', fontsize=20)
m2.save(os.path.join(OUT, 'sample.pdf'))
m2.close()
print('pdf ok')
print('ALL SAMPLES DONE ->', OUT)
