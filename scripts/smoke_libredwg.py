#!/usr/bin/env python3
"""Smoke test: DXF -> dwgwrite -> DWG -> dwg2dxf -> render PNG (no-embedded-preview DWG simulation)."""
import subprocess, sys, os

BIN = '/home/z/.local/bin'
VENV = '/home/z/.venv/bin/python3'
WORK = '/home/z/my-project/scripts/build/smoke'
os.makedirs(WORK, exist_ok=True)

# 1. make a DXF sample with real geometry (ezdxf)
gen = r'''
import ezdxf
doc = ezdxf.new("R2018", setup=True)
msp = doc.modelspace()
msp.add_lwpolyline([(0,0),(210,0),(210,148),(0,148)], close=True)
msp.add_line((0,0),(210,148))
msp.add_circle((60,74), 25, dxfattribs={"color": 1})
msp.add_text("DR-UR TEST PLAN", dxfattribs={"height": 8, "insert": (10, 135)}).set_placement((10,135))
doc.saveas("%s/sample.dxf")
''' % WORK
r = subprocess.run([VENV, '-c', gen], capture_output=True, text=True)
print('gen dxf:', r.returncode, r.stderr[-300:] if r.returncode else 'ok')

# 2. dwgwrite: DXF -> DWG
r = subprocess.run([f'{BIN}/dwgwrite', '-o', f'{WORK}/sample.dwg', f'{WORK}/sample.dxf'],
                   capture_output=True, text=True, timeout=120)
print('dwgwrite rc:', r.returncode, 'out:', r.stdout[-200:], 'err:', r.stderr[-300:])
print('dwg size:', os.path.getsize(f'{WORK}/sample.dwg') if os.path.exists(f'{WORK}/sample.dwg') else 'MISSING')

# 3. header check + embedded preview scan (should be none)
with open(f'{WORK}/sample.dwg', 'rb') as f:
    data = f.read()
print('dwg version:', data[:6])

# 4. dwg2dxf: DWG -> DXF
out_dxf = f'{WORK}/roundtrip.dxf'
if os.path.exists(out_dxf):
    os.remove(out_dxf)
r = subprocess.run([f'{BIN}/dwg2dxf', '-o', out_dxf, f'{WORK}/sample.dwg'],
                   capture_output=True, text=True, timeout=120)
print('dwg2dxf rc:', r.returncode, 'err:', r.stderr[-300:])
print('dxf exists:', os.path.exists(out_dxf), os.path.getsize(out_dxf) if os.path.exists(out_dxf) else 0)

# 5. render with ezdxf (same chain as engine)
if os.path.exists(out_dxf):
    render = r'''
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from ezdxf import recover
from ezdxf.addons.drawing import RenderContext, Frontend
from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
from ezdxf.addons.drawing.config import Configuration, BackgroundPolicy, ColorPolicy
doc, auditor = recover.readfile("%s/roundtrip.dxf")
cfg = Configuration(background_policy=BackgroundPolicy.WHITE, color_policy=ColorPolicy.BLACK)
fig = plt.figure(figsize=(11.69, 8.27))
ax = fig.add_axes([0,0,1,1])
Frontend(RenderContext(doc), MatplotlibBackend(ax), config=cfg).draw_layout(doc.modelspace(), finalize=True)
fig.savefig("%s/preview.png", dpi=150, facecolor="white")
print("render ok, entities:", len(doc.modelspace()))
''' % (WORK, WORK)
    r = subprocess.run([VENV, '-c', render], capture_output=True, text=True)
    print('render rc:', r.returncode, r.stdout[-300:], r.stderr[-500:] if r.returncode else '')
    print('png size:', os.path.getsize(f'{WORK}/preview.png') if os.path.exists(f'{WORK}/preview.png') else 'MISSING')
