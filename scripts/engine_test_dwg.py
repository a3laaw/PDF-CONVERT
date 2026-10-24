#!/usr/bin/env python3
"""Engine E2E: preview + convert on real DWG samples via updated convert_to_pdf.py."""
import subprocess, json, os, sys

VENV = '/home/z/.venv/bin/python3'
ENG = '/home/z/my-project/scripts/convert_to_pdf.py'
TD = '/home/z/my-project/scripts/build/libredwg-0.14/test/test-data'
WORK = '/home/z/my-project/scripts/build/engine-test'
os.makedirs(WORK, exist_ok=True)

def run(cmd):
    p = subprocess.run([VENV, ENG] + cmd, capture_output=True, text=True, timeout=200)
    result = None
    for line in p.stdout.splitlines():
        if line.startswith('@@RESULT@@'):
            result = json.loads(line[len('@@RESULT@@'):])
    return p, result

for name in ['example_2018.dwg', 'sample_2018.dwg', 'example_2000.dwg']:
    src = f'{TD}/{name}'
    png = f'{WORK}/{name}.preview.png'
    pdf = f'{WORK}/{name}.pdf'
    for f in (png, pdf):
        if os.path.exists(f):
            os.remove(f)
    print(f'===== {name} =====')
    # preview
    p, r = run(['preview', src, png])
    if r:
        print('PREVIEW ok=%s quality=%s engine=%s png=%s' % (
            r['ok'], r['info'].get('Quality'), r['engine'],
            os.path.getsize(png) if os.path.exists(png) else 0))
        print('  info:', {k: v for k, v in r['info'].items() if k != 'Quality'})
        print('  note:', r['note_ar'][:100])
    else:
        print('PREVIEW NO RESULT, stderr:', p.stderr[-300:])
    # convert
    p, r = run(['convert', src, pdf])
    if r:
        print('CONVERT ok=%s pages=%s engine=%s pdf=%s' % (
            r['ok'], r['pages'], r['engine'],
            os.path.getsize(pdf) if os.path.exists(pdf) else 0))
        print('  info:', r['info'])
        print('  note:', r['note_ar'][:110])
        if r['ok'] and os.path.exists(pdf):
            import fitz
            d = fitz.open(pdf)
            pix = d[0].get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False)
            pix.save(f'{WORK}/{name}.page1.png')
            txt = d[0].get_text()[:60].replace('\n', ' ')
            print('  pdf pages=%d text-sample="%s"' % (d.page_count, txt))
            d.close()
    else:
        print('CONVERT NO RESULT, stderr:', p.stderr[-300:])
