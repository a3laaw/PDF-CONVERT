#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Universal design-file -> PDF conversion engine.
Usage:
  python3 convert_to_pdf.py convert <input_file> <output_pdf> [thumb_png]
  python3 convert_to_pdf.py merge <output_pdf> <input1> <input2> ...
  python3 convert_to_pdf.py unmark <input_pdf> <output_pdf> [texts_csv] [annots 1/0]
  python3 convert_to_pdf.py preview <input_file> <output_png>
Protocol: prints "@@RESULT@@{json}" as the LAST stdout line.
"""
import sys, os, io, json, re, struct, subprocess, datetime

RESULT = {"ok": False, "engine": "", "pages": 0, "note_ar": "", "info": {}, "error": ""}

_REAL_STDOUT = sys.stdout

def emit_result():
    sys.stdout = _REAL_STDOUT
    print("@@RESULT@@" + json.dumps(RESULT, ensure_ascii=False))
    sys.stdout.flush()

# Keep library noise away from the result protocol
sys.stdout = sys.stderr

# ---------------------------------------------------------------- Arabic text
import arabic_reshaper
from bidi.algorithm import get_display

RESHAPER = arabic_reshaper.ArabicReshaper({'delete_harakat': False, 'support_ligatures': True})

def ar(text: str) -> str:
    """Shape Arabic for visual rendering (reportlab does not shape)."""
    try:
        return get_display(RESHAPER.reshape(text))
    except Exception:
        return text

DEJAVU = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
DEJAVU_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

# ---------------------------------------------------------------- image scan
def _pil_open(data: bytes):
    from PIL import Image
    im = Image.open(io.BytesIO(data))
    im.load()
    return im

def _scan_png(data: bytes):
    sig = b'\x89PNG\r\n\x1a\n'
    out = []
    pos = 0
    while True:
        i = data.find(sig, pos)
        if i < 0:
            break
        try:
            w, h = struct.unpack_from('>II', data, i + 16)
            end = data.find(b'IEND', i)
            if 16 <= w <= 12000 and 16 <= h <= 12000 and end > i:
                out.append((w * h, data[i:end + 8]))
        except Exception:
            pass
        pos = i + 8
    return out

def _scan_jpeg(data: bytes):
    sig = b'\xff\xd8\xff'
    out = []
    pos = 0
    while True:
        i = data.find(sig, pos)
        if i < 0:
            break
        end = data.find(b'\xff\xd9', i + 2000)
        if end > i:
            cand = data[i:end + 2]
            try:
                im = _pil_open(cand)
                out.append((im.width * im.height, cand))
            except Exception:
                pass
            pos = end + 2
        else:
            pos = i + 3
    return out

def _scan_bmp(data: bytes):
    out = []
    pos = 0
    while True:
        i = data.find(b'BM', pos)
        if i < 0:
            break
        try:
            fsize = struct.unpack_from('<I', data, i + 2)[0]
            off = struct.unpack_from('<I', data, i + 10)[0]
            w = struct.unpack_from('<i', data, i + 18)[0]
            h = struct.unpack_from('<i', data, i + 22)[0]
            bpp = struct.unpack_from('<H', data, i + 28)[0]
            if (14 < off <= fsize <= len(data) - i and 16 <= w <= 12000
                    and 16 <= abs(h) <= 12000 and bpp in (8, 16, 24, 32)):
                out.append((w * abs(h), data[i:i + fsize]))
                pos = i + fsize
                continue
        except Exception:
            pass
        pos = i + 2
    return out

def scan_embedded_image(data: bytes):
    """Return the largest plausible embedded raster image as PIL Image."""
    cands = _scan_png(data) + _scan_jpeg(data) + _scan_bmp(data)
    if not cands:
        return None
    cands.sort(key=lambda t: t[0], reverse=True)
    try:
        return _pil_open(cands[0][1])
    except Exception:
        return None

def flatten_white(im):
    if im.mode in ('RGBA', 'LA', 'PA') or (im.mode == 'P' and 'transparency' in im.info):
        im = im.convert('RGBA')
        bg = __import__('PIL.Image', fromlist=['Image']).new('RGB', im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    if im.mode not in ('RGB', 'L'):
        return im.convert('RGB')
    return im

# ---------------------------------------------------------------- info page
def build_info_pdf(out_path, title, img=None, rows=None, note_ar='', note_en=''):
    """Best-effort result: preview image + metadata sheet (A4)."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor
    from reportlab.pdfgen import canvas as rl_canvas
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from PIL import Image as PILImage

    pdfmetrics.registerFont(TTFont('DjV', DEJAVU))
    pdfmetrics.registerFont(TTFont('DjV-B', DEJAVU_B))

    W, H = A4
    c = rl_canvas.Canvas(out_path, pagesize=A4)
    ink = HexColor('#1c1917')
    mut = HexColor('#78716c')
    acc = HexColor('#059669')
    line = HexColor('#e7e5e4')
    soft = HexColor('#fafaf9')

    # header band
    c.setFillColor(acc)
    c.rect(0, H - 26 * mm, W, 26 * mm, stroke=0, fill=1)
    c.setFillColor(HexColor('#ffffff'))
    c.setFont('DjV-B', 15)
    c.drawString(15 * mm, H - 14.5 * mm, 'PDF Conversion Result')
    c.setFont('DjV', 10.5)
    c.drawString(15 * mm, H - 20.5 * mm, 'Converted with design2pdf engine')
    # file name on the right (shaped, may be Arabic)
    c.setFont('DjV', 11)
    name = title
    while c.stringWidth(name, 'DjV', 11) > W - 110 * mm and len(name) > 8:
        name = name[:-2]
    c.drawRightString(W - 15 * mm, H - 14.5 * mm, name)
    today = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    c.drawRightString(W - 15 * mm, H - 20.5 * mm, today)

    y = H - 36 * mm

    # preview image
    if img is not None:
        im = flatten_white(img.convert('RGB') if img.mode != 'RGB' else img)
        box_w, box_h = W - 30 * mm, 120 * mm
        scale = min(box_w / im.width, box_h / im.height)
        dw, dh = im.width * scale, im.height * scale
        dx, dy = (W - dw) / 2.0, y - dh
        c.setFillColor(soft)
        c.setStrokeColor(line)
        c.rect(dx - 3, dy - 3, dw + 6, dh + 6, stroke=1, fill=1)
        tmp = io.BytesIO()
        im.save(tmp, 'PNG')
        tmp.seek(0)
        c.drawImage(ImageReader(tmp), dx, dy, dw, dh, mask='auto')
        y = dy - 10 * mm
    else:
        c.setFillColor(soft)
        c.setStrokeColor(line)
        c.rect(15 * mm, y - 40 * mm, W - 30 * mm, 40 * mm, stroke=1, fill=1)
        c.setFillColor(mut)
        c.setFont('DjV', 11)
        c.drawCentredString(W / 2, y - 22 * mm, 'No embedded preview found in this file')
        y = y - 50 * mm

    # info rows (RTL: labels on the right, values on the left)
    if rows:
        c.setFont('DjV-B', 12)
        c.setFillColor(ink)
        c.drawRightString(W - 15 * mm, y, ar('معلومات الملف'))
        y -= 7 * mm
        for label, value in rows:
            c.setStrokeColor(line)
            c.line(15 * mm, y - 1.5 * mm, W - 15 * mm, y - 1.5 * mm)
            c.setFillColor(mut)
            c.setFont('DjV', 10.5)
            c.drawRightString(W - 15 * mm, y - 5 * mm, ar(label))
            c.setFillColor(ink)
            c.setFont('DjV', 10.5)
            v = str(value)
            while c.stringWidth(v, 'DjV', 10.5) > W - 90 * mm and len(v) > 8:
                v = v[:-2]
            c.drawString(15 * mm, y - 5 * mm, v)
            y -= 10 * mm

    # notes
    y -= 4 * mm
    if note_ar:
        c.setFillColor(acc)
        c.setFont('DjV-B', 10.5)
        c.drawRightString(W - 15 * mm, y, ar('ملاحظة:'))
        c.setFillColor(ink)
        c.setFont('DjV', 10)
        txt = ar(note_ar)
        maxw = W - 30 * mm
        line_txt = ''
        yy = y
        for word in txt.split(' '):
            trial = (line_txt + ' ' + word).strip()
            if c.stringWidth(trial, 'DjV', 10) > maxw:
                c.drawRightString(W - 15 * mm, yy, line_txt)
                yy -= 5.2 * mm
                line_txt = word
            else:
                line_txt = trial
        if line_txt:
            c.drawRightString(W - 15 * mm, yy, line_txt)
    if note_en:
        c.setFillColor(mut)
        c.setFont('DjV', 8.5)
        c.drawString(15 * mm, 12 * mm, note_en)

    c.showPage()
    c.save()

def human_size(n):
    for unit in ('B', 'KB', 'MB', 'GB'):
        if n < 1024 or unit == 'GB':
            return ('%.0f %s' if unit == 'B' else '%.1f %s') % (n, unit)
        n /= 1024.0

# === CONVERTERS ===
DWG_VERSIONS = {
    'AC1006': 'AutoCAD R10', 'AC1009': 'AutoCAD R11/R12', 'AC1012': 'AutoCAD R13',
    'AC1014': 'AutoCAD R14', 'AC1015': 'AutoCAD 2000-2002', 'AC1018': 'AutoCAD 2004-2006',
    'AC1021': 'AutoCAD 2007-2009', 'AC1024': 'AutoCAD 2010-2012',
    'AC1027': 'AutoCAD 2013-2014', 'AC1032': 'AutoCAD 2018-2026',
}
DWG_SENTINEL = bytes([0x1F, 0x25, 0x6D, 0x07, 0xD4, 0x36, 0x28, 0x28,
                      0x9D, 0x57, 0xCA, 0x3F, 0x9D, 0x44, 0x10, 0x2B])

def extract_dwg_preview(data: bytes):
    """Locate the embedded preview DIB inside a DWG file (R13+)."""
    idx = data.find(DWG_SENTINEL)
    start = idx + 16 if idx >= 0 else 0
    limit = min(start + 8192, len(data) - 60)
    i = start
    while i < limit:
        try:
            if struct.unpack_from('<I', data, i)[0] != 40:
                i += 1
                continue
            w, h = struct.unpack_from('<i', data, i + 4)[0], struct.unpack_from('<i', data, i + 8)[0]
            planes, bpp = struct.unpack_from('<HH', data, i + 12)
            comp = struct.unpack_from('<I', data, i + 16)[0]
            if 16 <= w <= 8192 and 16 <= abs(h) <= 8192 and bpp in (8, 16, 24, 32) and comp == 0:
                pal = (1 << bpp) * 4 if bpp <= 8 else 0
                row = ((w * bpp + 31) // 32) * 4
                px = row * abs(h)
                end = i + 40 + pal + px
                if end <= len(data):
                    bmp = (b'BM' + struct.pack('<IHHI', 14 + 40 + pal + px, 0, 0, 14 + 40 + pal)
                           + data[i:end])
                    return _pil_open(bmp)
        except Exception:
            pass
        i += 1
    return None

def convert_dxf(inp, outp):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.backends.backend_pdf import PdfPages
    from ezdxf import recover
    from ezdxf.addons.drawing import RenderContext, Frontend
    from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
    from ezdxf.addons.drawing.config import Configuration, BackgroundPolicy, ColorPolicy

    doc, auditor = recover.readfile(inp)
    m = re.search(r'(?i)(r?\d{4}|20\d\d)', doc.dxfversion or '')
    cfg = (Configuration(background_policy=BackgroundPolicy.WHITE,
                         color_policy=ColorPolicy.BLACK))
    layouts = [('Model', doc.modelspace())]
    for name in doc.layout_names():
        if name.lower() != 'model':
            try:
                lay = doc.layout(name)
                if len(lay) > 0:  # تجاهل تخطيطات الورق الفارغة
                    layouts.append((name, lay))
            except Exception:
                pass
    count = 0
    with PdfPages(outp) as pdf:
        for lname, lay in layouts:
            if count >= 12:
                break
            try:
                fig = plt.figure(figsize=(11.69, 8.27))
                ax = fig.add_axes([0, 0, 1, 1])
                ctx = RenderContext(doc)
                out = MatplotlibBackend(ax)
                Frontend(ctx, out, config=cfg).draw_layout(lay, finalize=True)
                pdf.savefig(fig, facecolor='white')
                plt.close(fig)
                count += 1
            except Exception as e:
                print('layout skip:', lname, e, file=sys.stderr)
    if count == 0:
        raise RuntimeError('no drawable content in DXF')
    RESULT['pages'] = count
    RESULT['engine'] = 'ezdxf-vector'
    extra = len(layouts) - 1
    ar_num = '٠١٢٣٤٥٦٧٨٩'
    n_ar = ''.join(ar_num[int(d)] for d in str(len(layouts)))
    RESULT['note_ar'] = ('تم تحويل الرسم كمتجهات حقيقية (نصوص وخطوط قابلة للتكبير بدون فقدان جودة).'
                         + (' عدد التخطيطات: ' + n_ar + '.' if extra > 0 else ''))
    RESULT['info'] = {'DXF version': doc.dxfversion or '?', 'Layouts': len(layouts),
                      'Entities (model)': len(doc.modelspace())}
    if auditor and auditor.has_errors:
        RESULT['note_ar'] += ' تم تجاهل بعض الكيانات التالفة.'

def convert_dwg(inp, outp):
    with open(inp, 'rb') as f:
        data = f.read()
    ver_raw = data[:6].decode('ascii', 'ignore')
    ver = DWG_VERSIONS.get(ver_raw, ver_raw or '?')
    img = None
    try:
        img = extract_dwg_preview(data)
    except Exception as e:
        print('dwg preview error:', e, file=sys.stderr)
    RESULT['info'] = {'Format': 'AutoCAD DWG', 'Version': ver, 'File size': human_size(len(data))}
    if img is not None:
        RESULT['engine'] = 'dwg-preview'
        RESULT['note_ar'] = ('تم استخراج المعاينة المدمجة من ملف DWG. لتحويل متجهي كامل '
                             '100% استخدم AutoCAD أو ODA File Converter ثم ارفع ملف DXF هنا.')
    else:
        RESULT['engine'] = 'dwg-info'
        RESULT['note_ar'] = ('لم يُعثر على معاينة مدمجة في هذا الملف. صُدر الـ PDF بدون صورة، '
                             'ويمكنك تصدير DXF من AutoCAD للحصول على تحويل متجهي كامل.')
    build_info_pdf(outp, os.path.basename(inp), img,
                   [('الصيغة', 'AutoCAD DWG'), ('الإصدار', ver),
                    ('حجم الملف', human_size(len(data))),
                    ('طريقة التحويل', 'أفضل جهد — معاينة مدمجة' if img else 'بدون معاينة مدمجة')],
                   note_ar=RESULT['note_ar'],
                   note_en='DWG is a closed binary format; full vector conversion requires ODA/AutoCAD.')
    RESULT['pages'] = 1

def convert_rvt(inp, outp):
    import olefile
    with open(inp, 'rb') as f:
        data = f.read()
    info = {'Format': 'Autodesk Revit (RVT)', 'File size': human_size(len(data))}
    img, method = None, ''
    if olefile.isOleFile(inp):
        ole = olefile.OleFileIO(inp)
        try:
            streams = ['/'.join(s) for s in ole.listdir()]
            info['OLE streams'] = str(len(streams))
            basic = [s for s in streams if 'BasicFileInfo' in s]
            if basic:
                raw = ole.openstream(basic[0]).read()
                m = re.search(rb'Revit[^\d]{0,12}(\d{4})', raw) or re.search(rb'(\d{4})', raw)
                if m:
                    info['Revit version'] = m.group(1).decode()
            cands = [s for s in streams
                     if ('review' in s.lower()) or ('thumb' in s.lower())]
            for s in cands:
                try:
                    raw = ole.openstream(s).read()
                    img = scan_embedded_image(raw)
                    if img:
                        method = s
                        break
                except Exception:
                    continue
        finally:
            ole.close()
    if img is None:
        img = scan_embedded_image(data)
        method = 'scan'
    if img is not None:
        RESULT['engine'] = 'rvt-preview'
        RESULT['note_ar'] = ('تم استخراج معاينة المشروع المدمجة من ملف RVT. صيغة RVT مغلقة تماماً؛ '
                             'لتحويل كامل افتح المشروع في Revit ثم File > Export > PDF أو استخدم '
                             'Autodesk Viewer المجاني وأرفق الناتج هنا للدمج.')
    else:
        RESULT['engine'] = 'rvt-info'
        RESULT['note_ar'] = ('لم يُعثر على معاينة مدمجة قابلة للاستخراج. صيغة RVT تتطلب برنامج Revit '
                             'للتصدير الكامل؛ استخدم File > Export > PDF داخل Revit.')
    build_info_pdf(outp, os.path.basename(inp), img,
                   [(k if '\u0600' <= k[0] <= '\u06FF' or k.isascii() else k, v)
                    for k, v in [('الصيغة', info.get('Format', '')),
                                 ('إصدار Revit', info.get('Revit version', 'غير محدد')),
                                 ('حجم الملف', info.get('File size', '')),
                                 ('مصدر المعاينة', method or 'لا يوجد')]],
                   note_ar=RESULT['note_ar'],
                   note_en='RVT is proprietary; export via Revit (File > Export > PDF) for full fidelity.')
    RESULT['pages'] = 1
    RESULT['info'] = info

def convert_psd(inp, outp):
    from PIL import Image as PILImage
    img = None
    try:
        from psd_tools import PSDImage
        psd = PSDImage.open(inp)
        img = psd.composite()
        if img is not None:
            img = flatten_white(img)
            RESULT['info'] = {'Format': 'Photoshop PSD', 'Canvas': '%dx%d px' % psd.size,
                              'Layers': str(len(list(psd.descendants())))}
    except Exception as e:
        print('psd-tools fallback:', e, file=sys.stderr)
    if img is None:
        img = flatten_white(PILImage.open(inp))
        RESULT['info'] = {'Format': 'Photoshop PSD', 'Canvas': '%dx%d px' % img.size}
    img.convert('RGB').save(outp, 'PDF', resolution=150.0)
    RESULT['pages'] = 1
    RESULT['engine'] = 'psd-tools'
    RESULT['note_ar'] = 'تم تسطيح الطبقات ودمجها في صفحة PDF واحدة بجودة أصلية.'

def convert_ai(inp, outp):
    import fitz
    try:
        doc = fitz.open(inp)
        if doc.needs_pass:
            raise RuntimeError('encrypted PDF/AI file')
        doc.save(outp, garbage=3, deflate=True)
        RESULT['pages'] = doc.page_count
        RESULT['engine'] = 'pymupdf-vector'
        RESULT['note_ar'] = 'ملفات AI الحديثة متوافقة مع PDF؛ تم الحفاظ على المتجهات والطبقات القابلة للتحرير.'
        RESULT['info'] = {'Format': 'Adobe Illustrator', 'Pages': str(doc.page_count)}
        doc.close()
    except Exception as e:
        print('ai via gs fallback:', e, file=sys.stderr)
        convert_eps(inp, outp)

def convert_eps(inp, outp):
    r = subprocess.run(
        ['gs', '-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dNOPROMPT',
         '-sDEVICE=pdfwrite', '-dEPSCrop', '-o', outp, inp],
        capture_output=True, timeout=120)
    if r.returncode != 0 or not os.path.exists(outp) or os.path.getsize(outp) == 0:
        raise RuntimeError('Ghostscript failed: ' + r.stderr.decode('utf8', 'ignore')[:300])
    import fitz
    d = fitz.open(outp)
    RESULT['pages'] = d.page_count
    d.close()
    RESULT['engine'] = 'ghostscript'
    RESULT['note_ar'] = 'تمت المعالجة عبر Ghostscript مع الحفاظ على الرسم كمتجهات.'

def convert_image(inp, outp):
    from PIL import Image as PILImage
    im = PILImage.open(inp)
    frames = []
    n = getattr(im, 'n_frames', 1)
    for i in range(min(n, 30)):
        im.seek(i)
        frames.append(flatten_white(im.convert('RGBA')))
    first = frames[0]
    if len(frames) > 1:
        first.save(outp, 'PDF', resolution=150.0, save_all=True,
                   append_images=frames[1:])
    else:
        first.save(outp, 'PDF', resolution=150.0)
    RESULT['pages'] = len(frames)
    RESULT['engine'] = 'pillow'
    RESULT['info'] = {'Format': im.format or '?', 'Size': '%dx%d px' % im.size,
                      'Frames': str(len(frames))}
    RESULT['note_ar'] = 'تم تضمين الصورة داخل PDF بجودة عالية.'

def convert_indd(inp, outp):
    with open(inp, 'rb') as f:
        data = f.read()
    img = None
    try:
        img = scan_embedded_image(data)
    except Exception as e:
        print('indd scan error:', e, file=sys.stderr)
    RESULT['info'] = {'Format': 'Adobe InDesign (INDD)', 'File size': human_size(len(data))}
    if img is not None:
        RESULT['engine'] = 'indd-preview'
        RESULT['note_ar'] = ('تم استخراج معاينة مدمجة من ملف INDD. لتحويل مطابق 100% استخدم '
                             'InDesign ثم File > Export > Adobe PDF.')
    else:
        RESULT['engine'] = 'indd-info'
        RESULT['note_ar'] = ('لم يُعثر على معاينة مدمجة. صيغة INDD مغلقة وتتطلب InDesign للتصدير '
                             'الكامل؛ استخدم File > Export > Adobe PDF ثم ارفع الناتج هنا.')
    build_info_pdf(outp, os.path.basename(inp), img,
                   [('الصيغة', 'Adobe InDesign (INDD)'),
                    ('حجم الملف', human_size(len(data))),
                    ('طريقة التحويل', 'أفضل جهد — معاينة مدمجة' if img else 'بدون معاينة مدمجة')],
                   note_ar=RESULT['note_ar'],
                   note_en='INDD is proprietary; export via InDesign (File > Export > Adobe PDF).')
    RESULT['pages'] = 1

def convert_pdf_passthrough(inp, outp):
    import shutil
    shutil.copyfile(inp, outp)
    import fitz
    d = fitz.open(outp)
    RESULT['pages'] = d.page_count
    d.close()
    RESULT['engine'] = 'passthrough'
    RESULT['note_ar'] = 'الملف PDF أصلاً — تم تمريره كما هو.'

EXT_MAP = {
    'dxf': convert_dxf,
    'dwg': convert_dwg,
    'rvt': convert_rvt,
    'psd': convert_psd,
    'ai': convert_ai,
    'eps': convert_eps, 'ps': convert_eps,
    'indd': convert_indd,
    'pdf': convert_pdf_passthrough,
}
IMAGE_EXTS = {'png', 'jpg', 'jpeg', 'webp', 'bmp', 'tif', 'tiff', 'gif', 'heic'}

def make_thumb(pdf_path, png_path, width=420):
    import fitz
    d = fitz.open(pdf_path)
    page = d[0]
    z = width / max(1.0, page.rect.width)
    pix = page.get_pixmap(matrix=fitz.Matrix(z, z), alpha=False)
    pix.save(png_path)
    d.close()

def cmd_convert(inp, outp, thumb):
    ext = os.path.splitext(inp)[1].lower().lstrip('.')
    fn = EXT_MAP.get(ext)
    if fn is None and ext in IMAGE_EXTS:
        fn = convert_image
    if fn is None:
        RESULT['error'] = 'unsupported format: .' + ext
        return
    fn(inp, outp)
    if not os.path.exists(outp) or os.path.getsize(outp) == 0:
        raise RuntimeError('output PDF was not produced')
    if thumb:
        try:
            make_thumb(outp, thumb)
        except Exception as e:
            print('thumb error:', e, file=sys.stderr)
    RESULT['ok'] = True
    RESULT['info']['File size'] = human_size(os.path.getsize(inp))
    RESULT['info']['Output size'] = human_size(os.path.getsize(outp))

def cmd_thumb(pdf_path, png_path, width=420):
    if not os.path.exists(pdf_path):
        raise RuntimeError('pdf not found: ' + pdf_path)
    make_thumb(pdf_path, png_path, int(width))
    RESULT.update(ok=True, engine='thumb')

def cmd_merge(outp, inputs):
    import fitz
    merged = fitz.open()
    for p in inputs:
        src = fitz.open(p)
        merged.insert_pdf(src)
        src.close()
    merged.save(outp, garbage=3, deflate=True)
    RESULT.update(ok=True, pages=merged.page_count, engine='pymupdf-merge',
                  note_ar='تم دمج الملفات في ملف PDF واحد.',
                  info={'Inputs': str(len(inputs)),
                        'Output size': human_size(os.path.getsize(outp))})
    merged.close()

def _unmark_candidates(t):
    """صيغ البحث المحتملة لنفس الكلمة:
    منطقي كما هو / معكوس بصريًا / أشكال عرض مُشكَّلة / مُشكَّلة معكوسة
    لأن ملفات PDF تخزن العربية أحيانًا معكوسة أو بأشكال présentation"""
    cands = [t]
    if t[::-1] != t:
        cands.append(t[::-1])
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        shaped = arabic_reshaper.reshape(t)
        vis = get_display(shaped)
        for v in (shaped, vis):
            if v and v not in cands:
                cands.append(v)
    except Exception:
        pass
    return cands

def _collect_quads(page, texts):
    """اجمع quads الكلمات المطابقة من كل الصيغ مع إزالة التكرار"""
    quads = []
    for t in texts:
        for cand in _unmark_candidates(t):
            try:
                quads.extend(page.search_for(cand, quads=True))
            except Exception:
                pass
    kept = []
    for q in quads:
        r = q.rect
        dup = False
        for k in kept:
            kr = k.rect
            ix = max(0.0, min(r.x1, kr.x1) - max(r.x0, kr.x0))
            iy = max(0.0, min(r.y1, kr.y1) - max(r.y0, kr.y0))
            a = min(max(0.01, r.get_area()), max(0.01, kr.get_area()))
            if ix * iy > 0.6 * a:
                dup = True
                break
        if not dup:
            kept.append(q)
    return kept

def cmd_unmark(inp, outp, texts_raw='', annots='1'):
    """حذف العلامة المائية: نصوص مطابقة (redaction دقيق بالـ quads) + الطوابع والتعليقات.
    الصور والرسومات المتجهة لا تُمس — نحذف الحروف فقط لتبقى باقي الصفحة سليمة."""
    import fitz
    if not os.path.exists(inp):
        raise RuntimeError('pdf not found: ' + inp)
    doc = fitz.open(inp)
    if doc.needs_pass:
        raise RuntimeError('file is encrypted (password protected)')
    texts = [t.strip() for t in re.split(r'[,،;؛\n]+', texts_raw or '') if t.strip()]
    removed_annots = 0
    total_hits = 0
    for page in doc:
        if annots == '1':
            for a in list(page.annots() or []):
                page.delete_annot(a)
                removed_annots += 1
        if texts:
            quads = _collect_quads(page, texts)
            for q in quads:
                page.add_redact_annot(q, fill=False)
            if quads:
                total_hits += len(quads)
                try:
                    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                                          graphics=fitz.PDF_REDACT_LINE_ART_NONE)
                except TypeError:
                    page.apply_redactions()
    if doc.page_count == 0:
        raise RuntimeError('no pages')
    doc.save(outp, garbage=3, deflate=True)
    RESULT.update(ok=True, pages=doc.page_count, engine='pymupdf-unmark',
                  note_ar='تم تنظيف العلامة المائية.',
                  info={'Text hits': str(total_hits),
                        'Annotations removed': str(removed_annots),
                        'Searched words': str(len(texts)),
                        'Output size': human_size(os.path.getsize(outp))})
    doc.close()

# ---------------------------------------------------------------- fast preview
def _preview_kind(data: bytes, ext: str) -> str:
    """كشف النوع من المحتوى أولًا والامتداد احتياطًا (نفس فلسفة sniffKind في الواجهة)"""
    if data[:6].decode('ascii', 'ignore') in DWG_VERSIONS:
        return 'dwg'
    head = data[:4096]
    if head.startswith(b'AutoCAD Binary DXF'):
        return 'dxf'
    if b'$ACADVER' in head or re.match(rb'\s*0\r?\n(SECTION|EOF|COMMENT)', head):
        return 'dxf'
    if data[:4] == b'8BPS':
        return 'psd'
    if head.startswith(b'%!PS'):
        return 'ai' if (b'Illustrator' in head[:2048] or ext == 'ai') else 'eps'
    if data[:4] == b'\xd0\xcf\x11\xe0':
        return ext if ext in ('rvt',) else 'rvt'
    return ext

def _save_preview_png(img, out_png, max_w=1600):
    im = flatten_white(img)
    if im.width > max_w:
        h = max(1, int(im.height * max_w / im.width))
        im = im.resize((max_w, h))
    im.convert('RGB').save(out_png, 'PNG')

def _render_dxf_png(inp, out_png):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from ezdxf import recover
    from ezdxf.addons.drawing import RenderContext, Frontend
    from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
    from ezdxf.addons.drawing.config import Configuration, BackgroundPolicy, ColorPolicy
    doc, _auditor = recover.readfile(inp)
    cfg = (Configuration(background_policy=BackgroundPolicy.WHITE,
                         color_policy=ColorPolicy.BLACK))
    fig = plt.figure(figsize=(13.33, 7.5), dpi=130)
    ax = fig.add_axes([0, 0, 1, 1])
    out = MatplotlibBackend(ax)
    Frontend(RenderContext(doc), out, config=cfg).draw_layout(doc.modelspace(), finalize=True)
    fig.savefig(out_png, dpi=130, facecolor='white')
    plt.close(fig)

def _rvt_preview_image(data, info):
    import olefile
    img = None
    bio = io.BytesIO(data)
    if olefile.isOleFile(bio):
        ole = olefile.OleFileIO(bio)
        try:
            streams = ['/'.join(s) for s in ole.listdir()]
            info['OLE streams'] = str(len(streams))
            basic = [s for s in streams if 'BasicFileInfo' in s]
            if basic:
                raw = ole.openstream(basic[0]).read()
                m = re.search(rb'Revit[^\d]{0,12}(\d{4})', raw) or re.search(rb'(\d{4})', raw)
                if m:
                    info['Revit version'] = m.group(1).decode()
            for s in [x for x in streams
                      if ('review' in x.lower()) or ('thumb' in x.lower())]:
                try:
                    img = scan_embedded_image(ole.openstream(s).read())
                    if img:
                        info['Preview source'] = s
                        break
                except Exception:
                    continue
        finally:
            ole.close()
    if img is None:
        img = scan_embedded_image(data)
    return img

def cmd_preview(inp, out_png):
    """صورة معاينة سريعة للعرض داخل الاستوديوهات — بدون تحويل كامل.
    تكتب PNG عند توفر معاينة، وترد دائمًا JSON صادق (Quality: vector/flatten/preview/none)."""
    from PIL import Image as PILImage  # noqa: F401 (يتأكد من توفر Pillow مبكرًا)
    with open(inp, 'rb') as f:
        data = f.read()
    ext = (os.path.splitext(inp)[1][1:] or '').lower()
    kind = _preview_kind(data, ext)
    quality = 'preview'
    RESULT['info'] = {'Kind': kind, 'File size': human_size(len(data))}
    img = None

    if kind == 'dxf':
        quality = 'vector'
        RESULT['info']['Format'] = 'DXF'
        try:
            from ezdxf import recover
            doc, _ = recover.readfile(inp)
            RESULT['info']['DXF version'] = doc.dxfversion or '?'
            RESULT['info']['Entities (model)'] = str(len(doc.modelspace()))
        except Exception:
            pass
        _render_dxf_png(inp, out_png)
        RESULT['note_ar'] = ('معاينة متجهية للتخطيط الأول (Model) — الأصل خطوط حقيقية '
                             'تتحمل أي تكبير بدون فقدان.')
    elif kind == 'dwg':
        ver_raw = data[:6].decode('ascii', 'ignore')
        ver = DWG_VERSIONS.get(ver_raw, ver_raw or '?')
        RESULT['info']['Format'] = 'AutoCAD DWG'
        RESULT['info']['Version'] = ver
        try:
            img = extract_dwg_preview(data)
        except Exception as e:
            print('dwg preview error:', e, file=sys.stderr)
        if img is not None:
            RESULT['note_ar'] = ('المعاينة المدمجة التي يحفظها AutoCAD داخل الملف — '
                                 'تكفي للفحص قبل الطباعة، والجودة المتجهية الكاملة تتطلب DXF.')
        else:
            quality = 'none'
            RESULT['note_ar'] = ('لا توجد معاينة مدمجة داخل هذا الملف — التحويل سيُنتج صفحة '
                                 'معلومات فقط، والأفضل تصدير DXF من AutoCAD.')
    elif kind == 'rvt':
        RESULT['info']['Format'] = 'Autodesk Revit (RVT)'
        img = _rvt_preview_image(data, RESULT['info'])
        if img is not None:
            RESULT['note_ar'] = ('معاينة المشروع المدمجة من داخل حاوية RVT — صيغة RVT مغلقة '
                                 'والتصدير الكامل يتم من داخل Revit عبر File > Export > PDF.')
        else:
            quality = 'none'
            RESULT['note_ar'] = ('لم يُعثر على معاينة مدمجة قابلة للاستخراج — صيغة RVT تتطلب '
                                 'برنامج Revit نفسه للتصدير الكامل.')
    elif kind == 'psd':
        RESULT['info']['Format'] = 'Photoshop PSD'
        try:
            from psd_tools import PSDImage
            psd = PSDImage.open(inp)
            img = flatten_white(psd.composite())
            RESULT['info']['Canvas'] = '%dx%d px' % psd.size
            RESULT['info']['Layers'] = str(len(list(psd.descendants())))
        except Exception as e:
            print('psd-tools preview fallback:', e, file=sys.stderr)
        if img is None:
            img = flatten_white(PILImage.open(inp))
            RESULT['info']['Canvas'] = '%dx%d px' % img.size
        quality = 'flatten'
        RESULT['note_ar'] = 'معاينة الطبقات مدموجة على خلفية بيضاء — التحويل ينتج نفس الدمج بجودة أصلية.'
    elif kind == 'ai':
        import fitz
        try:
            doc = fitz.open(inp)
            if doc.needs_pass:
                raise RuntimeError('encrypted PDF/AI file')
            RESULT['info']['Format'] = 'Adobe Illustrator'
            RESULT['info']['Pages'] = str(doc.page_count)
            pix = doc[0].get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            pix.save(out_png)
            doc.close()
            quality = 'vector'
            RESULT['note_ar'] = 'معاينة الصفحة الأولى — ملفات AI الحديثة متوافقة مع PDF وتتحول متجهيًا كاملًا.'
        except Exception as e:
            print('ai fitz preview fallback gs:', e, file=sys.stderr)
            r = subprocess.run(
                ['gs', '-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dNOPROMPT',
                 '-sDEVICE=png16m', '-r110', '-dEPSCrop', '-o', out_png, inp],
                capture_output=True, timeout=120)
            if r.returncode != 0 or not os.path.exists(out_png):
                raise RuntimeError('Ghostscript failed: ' + r.stderr.decode('utf8', 'ignore')[:200])
            quality = 'vector'
            RESULT['info']['Format'] = 'Adobe Illustrator'
            RESULT['note_ar'] = 'معاينة عبر Ghostscript — الصفحة الأولى فقط.'
    elif kind == 'eps':
        r = subprocess.run(
            ['gs', '-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dNOPROMPT',
             '-sDEVICE=png16m', '-r110', '-dEPSCrop', '-o', out_png, inp],
            capture_output=True, timeout=120)
        if r.returncode != 0 or not os.path.exists(out_png):
            raise RuntimeError('Ghostscript failed: ' + r.stderr.decode('utf8', 'ignore')[:200])
        quality = 'vector'
        RESULT['info']['Format'] = 'EPS/PS'
        RESULT['note_ar'] = 'معاينة عبر Ghostscript مع احترام حدود الرسم (EPSCrop).'
    else:
        # INDD وأنواع غير معروفة: أكبر صورة مدمجة (أفضل جهد)
        RESULT['info'].setdefault('Format', ext.upper() or 'غير معروف')
        try:
            img = scan_embedded_image(data)
        except Exception as e:
            print('generic preview scan error:', e, file=sys.stderr)
        if img is not None:
            RESULT['note_ar'] = 'معاينة مدمجة (أكبر صورة داخل الملف) — أفضل جهد ممكن خارج البرنامج الأصلي.'
        else:
            quality = 'none'
            RESULT['note_ar'] = ('لم يُعثر على معاينة مدمجة — التصدير المطابق يتطلب البرنامج الأصلي '
                                 'ثم ارفع الناتج PDF هنا.')

    if os.path.exists(out_png) and os.path.getsize(out_png) > 0:
        RESULT.update(ok=True, engine='cad-preview', pages=1)
    elif img is not None:
        _save_preview_png(img, out_png)
        RESULT.update(ok=True, engine='cad-preview', pages=1)
    else:
        RESULT.update(ok=True, engine='cad-preview', pages=0)
    RESULT['info']['Quality'] = quality

def main():
    try:
        argv = sys.argv[1:]
        if not argv:
            RESULT['error'] = 'no command'
            return
        if argv[0] == 'convert':
            cmd_convert(argv[1], argv[2], argv[3] if len(argv) > 3 else None)
        elif argv[0] == 'thumb':
            cmd_thumb(argv[1], argv[2], argv[3] if len(argv) > 3 else 420)
        elif argv[0] == 'merge':
            cmd_merge(argv[1], argv[2:])
        elif argv[0] == 'unmark':
            cmd_unmark(argv[1], argv[2],
                       argv[3] if len(argv) > 3 else '',
                       argv[4] if len(argv) > 4 else '1')
        elif argv[0] == 'preview':
            cmd_preview(argv[1], argv[2])
        else:
            RESULT['error'] = 'unknown command: ' + argv[0]
    except FileNotFoundError as e:
        RESULT['error'] = 'file not found: ' + str(e)
    except Exception as e:
        RESULT['error'] = '%s: %s' % (type(e).__name__, str(e)[:400])
    finally:
        emit_result()

if __name__ == '__main__':
    main()
