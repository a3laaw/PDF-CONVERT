#!/usr/bin/env python3
"""Smoke test 2: real DWG samples -> dwg2dxf -> ezdxf render (preview) + info."""
import subprocess, os, sys

BIN = '/home/z/.local/bin'
VENV = '/home/z/.venv/bin/python3'
TD = '/home/z/my-project/scripts/build/libredwg-0.14/test/test-data'
WORK = '/home/z/my-project/scripts/build/smoke'
os.makedirs(WORK, exist_ok=True)

RENDER = r'''
import sys, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from ezdxf import recover
from ezdxf.addons.drawing import RenderContext, Frontend
from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
from ezdxf.addons.drawing.config import Configuration, BackgroundPolicy, ColorPolicy
doc, auditor = recover.readfile(sys.argv[1])
cfg = Configuration(background_policy=BackgroundPolicy.WHITE, color_policy=ColorPolicy.BLACK)
fig = plt.figure(figsize=(11.69, 8.27))
ax = fig.add_axes([0,0,1,1])
Frontend(RenderContext(doc), MatplotlibBackend(ax), config=cfg).draw_layout(doc.modelspace(), finalize=True)
fig.savefig(sys.argv[2], dpi=150, facecolor="white")
print("RENDER_OK entities:", len(doc.modelspace()), "layouts:", doc.layout_names())
'''

for name in ['example_2018.dwg', 'sample_2018.dwg', 'example_2000.dwg']:
    src = f'{TD}/{name}'
    out_dxf = f'{WORK}/{name}.dxf'
    png = f'{WORK}/{name}.png'
    if os.path.exists(out_dxf):
        os.remove(out_dxf)
    with open(src, 'rb') as f:
        ver = f.read(6).decode()
    r = subprocess.run([f'{BIN}/dwg2dxf', '-o', out_dxf, src], capture_output=True, text=True, timeout=180)
    ok_dxf = os.path.exists(out_dxf) and os.path.getsize(out_dxf) > 100
    print(f'== {name} [{ver}] dwg2dxf rc={r.returncode} dxf={os.path.getsize(out_dxf) if ok_dxf else 0}')
    if r.stderr.strip():
        print('   stderr tail:', r.stderr.strip().splitlines()[-1][:120])
    if ok_dxf:
        r2 = subprocess.run([VENV, '-c', RENDER, out_dxf, png], capture_output=True, text=True, timeout=180)
        line = (r2.stdout.strip() or r2.stderr.strip().splitlines()[-1] if r2.stderr.strip() else '')[:150]
        print('   render rc=', r2.returncode, '|', line)
        if os.path.exists(png):
            print('   png:', os.path.getsize(png))
