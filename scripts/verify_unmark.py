#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""تحقق صارم من أمر unmark عبر الـ API: الحقل الصحيح texts + كل صيغ تخزين العربية"""
import subprocess, json, urllib.parse, sys

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    t = "مسودة"
    forms = [t, t[::-1], arabic_reshaper.reshape(t), get_display(arabic_reshaper.reshape(t))]
except ImportError:
    forms = ["مسودة", "مسودة"[::-1]]

def norm(s):
    """توحيد أشكال العرض إلى المنطقية للمقارنة"""
    try:
        return get_display(arabic_reshaper.reshape(s))[::-1]
    except Exception:
        return s

def text_of(path):
    import fitz
    d = fitz.open(path)
    return "\n".join(p.get_text() for p in d)

ORIG = "/home/z/my-project/public/t_wm.pdf"
OUT = "/tmp/unmark_out2.pdf"

r = subprocess.run(
    ["curl", "-s", "-D", "/tmp/h2.txt", "-o", OUT,
     "-F", f"file=@{ORIG}", "-F", "texts=مسودة", "-F", "annots=1",
     "http://localhost:3000/api/unmark"],
    capture_output=True)
if r.returncode != 0:
    sys.exit("curl failed")

hdr = open("/tmp/h2.txt").read()
report = None
for line in hdr.splitlines():
    if line.lower().startswith("x-unmark-report:"):
        report = json.loads(urllib.parse.unquote(line.split(":", 1)[1].strip()))
print("report:", report)

orig_txt = text_of(ORIG)
out_txt = text_of(OUT)

def found(txt, word):
    """هل الكلمة موجودة بأي صيغة تخزين؟"""
    try:
        shaped = arabic_reshaper.reshape(word)
        cands = {word, word[::-1], shaped, get_display(shaped), norm(word)}
    except Exception:
        cands = {word, word[::-1]}
    return any(c in txt for c in cands)

wm_before = found(orig_txt, "مسودة")
wm_after = found(out_txt, "مسودة")
body_before = "Project Report" in orig_txt
body_after = "Project Report" in out_txt

print(f"watermark in original: {wm_before}")
print(f"watermark in output:   {wm_after}")
print(f"body in original: {body_before} | body in output: {body_after}")

assert wm_before is True, "العينة الأصلية يجب أن تحوي العلامة"
assert wm_after is False, "الناتج ما زال يحوي العلامة!"
assert body_after is True, "النص الأساسي اتأذى!"
assert report and report["hits"] > 0, f"تقرير hits غير منطقي: {report}"
print("PASS ✓ — العلامة حُذفت والنص الأساسي سليم والتقرير صادق")
