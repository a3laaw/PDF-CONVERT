#!/usr/bin/env python3
"""معالجة لاحقة لملف المقترح:
1) حذف <w:pgNumType/> الفارغ (يربك WPS)
2) ترقيع حقول PAGE في التذييل: PAGE → PAGE \* arabic \* MERGEFORMAT (أرقام لاتينية — قرار المنتج)
"""
import sys, zipfile, shutil, re, os

SRC = "/home/z/my-project/download/مقترح-تطوير-منصة-محوّل-PDF.docx"
TMP = SRC + ".tmp"

with zipfile.ZipFile(SRC, "r") as zin:
    names = zin.namelist()
    data = {n: zin.read(n) for n in names}

# 1) إزالة pgNumType الفارغ من document.xml
doc = data["word/document.xml"].decode("utf-8")
before = doc.count("<w:pgNumType/>")
doc = doc.replace("<w:pgNumType/>", "")
data["word/document.xml"] = doc.encode("utf-8")
print(f"removed empty pgNumType: {before}")

# 2) ترقيع تذييلات PAGE
patched = 0
for n in names:
    if re.match(r"word/footer\d*\.xml", n):
        x = data[n].decode("utf-8")
        x2, k = re.subn(
            r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
            r"\1 PAGE \\* arabic \\* MERGEFORMAT \2",
            x,
        )
        if k:
            data[n] = x2.encode("utf-8")
            patched += k
            print(f"patched {n}: {k} field(s)")
print(f"footer fields patched: {patched}")

with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as zout:
    for n in names:
        zout.writestr(n, data[n])
shutil.move(TMP, SRC)
print("OK:", SRC)
