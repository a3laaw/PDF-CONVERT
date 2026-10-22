#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""تجميع دراسة التطوير: حقن خط Tajawal المضمّن + فحص ما قبل التحويل"""
import os

SRC = "/home/z/my-project/scripts/study_src.html"
FONTS = "/tmp/fonts/tajawal-embedded.css"
OUT = "/home/z/my-project/public/study.html"

src = open(SRC, encoding="utf-8").read()
fonts = open(FONTS, encoding="utf-8").read()
assert "/*__TAJAWAL__*/" in src, "لا يوجد موضع حقن الخط"
final = src.replace("/*__TAJAWAL__*/", fonts)
open(OUT, "w", encoding="utf-8").write(final)
print("HTML جاهز:", OUT, os.path.getsize(OUT), "bytes")
