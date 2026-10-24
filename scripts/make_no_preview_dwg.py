#!/usr/bin/env python3
"""Emulate user's DR-UR.dwg case: DWG with NO embedded preview at all.
Strip the DIB preview area from example_2018.dwg, then run engine preview+convert."""
import struct, subprocess, json, os

SRC = '/home/z/my-project/scripts/build/libredwg-0.14/test/test-data/example_2018.dwg'
OUT = '/home/z/my-project/scripts/t_out/e2e/no-embedded.dwg'
ENG = '/home/z/my-project/scripts/convert_to_pdf.py'
VENV = '/home/z/.venv/bin/python3'
WORK = '/home/z/my-project/scripts/t_out/e2e'

DWG_SENTINEL = bytes([0x1F, 0x25, 0x6D, 0x07, 0xD4, 0x36, 0x28, 0x28,
                      0x9D, 0x57, 0xCA, 0x3F, 0x9D, 0x44, 0x10, 0x2B])

with open(SRC, 'rb') as f:
    data = bytearray(f.read())

# locate the DIB exactly like the engine does, then zero it out
idx = data.find(DWG_SENTINEL)
stripped = False
if idx >= 0:
    start = idx + 16
    i = start
    limit = min(start + 8192, len(data) - 60)
    while i < limit:
        if struct.unpack_from('<I', data, i)[0] == 40:
            w, h = struct.unpack_from('<i', data, i + 4)[0], struct.unpack_from('<i', data, i + 8)[0]
            planes, bpp = struct.unpack_from('<HH', data, i + 12)
            comp = struct.unpack_from('<I', data, i + 16)[0]
            if 16 <= w <= 8192 and 16 <= abs(h) <= 8192 and bpp in (8, 16, 24, 32) and comp == 0:
                pal = (1 << bpp) * 4 if bpp <= 8 else 0
                row = ((w * bpp + 31) // 32) * 4
                px = row * abs(h)
                end = i + 40 + pal + px
                if end <= len(data):
                    data[i:end] = b'\x00' * (end - i)
                    stripped = True
                    print('stripped DIB at %d..%d (%dx%d bpp=%d)' % (i, end, w, abs(h), bpp))
                    break
        i += 1

with open(OUT, 'wb') as f:
    f.write(data)
print('stripped:', stripped, '| size:', os.path.getsize(OUT))

# verify old scanner finds nothing now
import importlib.util
spec = importlib.util.spec_from_file_location('eng', ENG)
eng = importlib.util.module_from_spec(spec)
spec.loader.exec_module(eng)
print('extract_dwg_preview on stripped file:', 'NONE (good)' if eng.extract_dwg_preview(bytes(data)) is None else 'STILL FOUND (bad)')

def run(cmd):
    p = subprocess.run([VENV, ENG] + cmd, capture_output=True, text=True, timeout=200)
    for line in p.stdout.splitlines():
        if line.startswith('@@RESULT@@'):
            return json.loads(line[len('@@RESULT@@'):])
    return None

png = f'{WORK}/no-embedded.preview.png'
pdf = f'{WORK}/no-embedded.pdf'
for f_ in (png, pdf):
    if os.path.exists(f_):
        os.remove(f_)

r = run(['preview', OUT, png])
print('PREVIEW:', json.dumps({k: r[k] for k in ('ok', 'engine', 'note_ar')}, ensure_ascii=False)[:160])
print('  quality:', r['info'].get('Quality'), '| source:', r['info'].get('Preview source'),
      '| entities:', r['info'].get('Entities (model)'), '| png:', os.path.getsize(png) if os.path.exists(png) else 0)

r = run(['convert', OUT, pdf])
print('CONVERT: ok=%s pages=%s engine=%s pdf=%s' % (r['ok'], r['pages'], r['engine'],
      os.path.getsize(pdf) if os.path.exists(pdf) else 0))
