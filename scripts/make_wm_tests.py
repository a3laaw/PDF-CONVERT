#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""بناء ملفات اختبار للعلامة المائية + تحقق شامل من أمر unmark"""
import os, sys, json, subprocess

BASE = "/home/z/my-project/scripts/wm_tests"
os.makedirs(BASE, exist_ok=True)
ENGINE = "/home/z/my-project/scripts/convert_to_pdf.py"
PY = sys.executable

import fitz

AR_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def make_text_watermark_pdf(path):
    """3 صفحات: نص أساسي عربي/إنجليزي + علامة مائية نصية مائلة «مسودة» + «سري» في صفحة ٢"""
    fontbuf = open(AR_FONT, "rb").read()
    doc = fitz.open()
    for i in range(3):
        page = doc.new_page(width=595, height=842)
        page.insert_text((72, 120), "Project Report - Section " + str(i + 1), fontsize=16, fontname="helv")
        page.insert_text((72, 160), "This is the normal body content that must survive.", fontsize=11, fontname="helv")
        # علامة مائية مائلة شفافة (نص حقيقي قابل للاستخراج)
        page.insert_text((80, 500), "مسودة", fontsize=64, fontname="F0", fontfile=AR_FONT,
                         morph=(page.rect.tl, fitz.Matrix(1, 1).prerotate(45)),
                         fill_opacity=0.18, color=(0.4, 0.4, 0.4))
        # نص عربي أساسي يجب أن يبقى
        page.insert_text((72, 220), "هذا نص عربي أساسي يجب أن يبقى", fontsize=14,
                         fontname="F1", fontfile=AR_FONT)
    # «سري» في صفحة ٢
    page2 = doc[1]
    page2.insert_text((200, 700), "سري", fontsize=40, fontname="F2", fontfile=AR_FONT,
                      fill_opacity=0.15, color=(0.6, 0.2, 0.2))
    doc.save(path)
    doc.close()

def make_annot_watermark_pdf(path):
    """صفحة بنص + طابع تعليق (Stamp) + تعليق نصي حر (FreeText)"""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((72, 120), "Contract draft v3", fontsize=16, fontname="helv")
    page.insert_text((72, 160), "Normal content stays here.", fontsize=11, fontname="helv")
    st = page.add_stamp_annot(rect=fitz.Rect(200, 380, 420, 460), stamp=1)
    st.set_info(title="Approver")
    st.update()
    ft = page.add_freetext_annot(rect=fitz.Rect(72, 520, 300, 560), text="DO NOT COPY",
                                  fontsize=14, fill_color=(1, 1, 0.6))
    ft.update()
    doc.save(path)
    doc.close()

def verify(out, expect_text_zero, expect_annots_zero, keep_words):
    d = fitz.open(out)
    rep = {"pages": d.page_count}
    total_hits = 0
    for w in expect_text_zero:
        # العلامة يجب أن تختفي بكل صيغها
        hits = sum(len(p.search_for(c)) for p in d for c in {w, w[::-1]})
        rep[f"hits[{w}]"] = hits
        total_hits += hits
    rep["annots"] = sum(len(list(p.annots() or [])) for p in d)
    kept = {}
    for w in keep_words:
        # المحتوى الأساسي: يُقبل أن يكون مخزنًا منطقيًا أو بصريًا
        kept[w] = sum(len(p.search_for(c)) for p in d for c in {w, w[::-1]})
    rep["kept"] = kept
    d.close()
    return rep

def run_cli(inp, outp, texts, annots):
    r = subprocess.run([PY, ENGINE, "unmark", inp, outp, texts, annots],
                       capture_output=True, text=True)
    last = [l for l in r.stdout.strip().splitlines() if l.startswith("@@RESULT@@")]
    return json.loads(last[-1][10:]) if last else {"ok": False, "error": "no result", "stderr": r.stderr[-400:]}

def main():
    t1 = os.path.join(BASE, "text-wm.pdf")
    t2 = os.path.join(BASE, "annot-wm.pdf")
    make_text_watermark_pdf(t1)
    make_annot_watermark_pdf(t2)
    print("built:", os.path.getsize(t1), os.path.getsize(t2))

    # 1) إزالة نصية + طوابع معًا
    o1 = os.path.join(BASE, "text-wm-clean.pdf")
    res1 = run_cli(t1, o1, "مسودة، سري", "1")
    print("R1:", json.dumps(res1, ensure_ascii=False))
    assert res1["ok"] and res1["pages"] == 3, "engine failed"
    assert int(res1["info"]["Text hits"]) >= 4, "expected >=4 text hits"
    v1 = verify(o1, ["مسودة", "سري"], True, ["Project Report", "normal body", "عربي أساسي"])
    print("V1:", json.dumps(v1, ensure_ascii=False))
    assert all(v == 0 for k, v in v1.items() if k.startswith("hits[")), "watermark text still present"
    assert all(v > 0 for v in v1["kept"].values()), "base content damaged"

    # 2) طوابع فقط (بدون نصوص)
    o2 = os.path.join(BASE, "annot-wm-clean.pdf")
    res2 = run_cli(t2, o2, "", "1")
    print("R2:", json.dumps(res2, ensure_ascii=False))
    assert res2["ok"], "engine failed"
    assert int(res2["info"]["Annotations removed"]) == 2, f"expected 2 annots, got {res2['info']}"
    v2 = verify(o2, [], True, ["Contract draft"])
    print("V2:", json.dumps(v2, ensure_ascii=False))
    assert v2["annots"] == 0, "annots remain"
    assert v2["kept"]["Contract draft"] > 0, "base content damaged"

    # 3) نص غير موجود → صفر إصابات لكن نجاح
    o3 = os.path.join(BASE, "text-wm-nothing.pdf")
    res3 = run_cli(t1, o3, "كلمة-غير-موجودة", "0")
    print("R3:", json.dumps(res3, ensure_ascii=False))
    assert res3["ok"] and int(res3["info"]["Text hits"]) == 0 and int(res3["info"]["Annotations removed"]) == 0

    # 4) دمج سليم بعد التعديل (regression)
    r4 = subprocess.run([PY, ENGINE, "merge", os.path.join(BASE, "merged.pdf"), o1, o2],
                        capture_output=True, text=True)
    last = [l for l in r4.stdout.strip().splitlines() if l.startswith("@@RESULT@@")]
    res4 = json.loads(last[-1][10:]) if last else {"ok": False}
    print("R4:", json.dumps(res4, ensure_ascii=False))
    assert res4["ok"] and res4["pages"] == 4

    print("ALL-PYTHON-TESTS-PASSED")

if __name__ == "__main__":
    main()
