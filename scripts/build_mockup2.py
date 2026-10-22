#!/usr/bin/env python3
"""تجميع التصور المبسّط v2: هيكل HTML + خط Tajawal المضمّن"""
src = open("/home/z/my-project/scripts/mockup2_src.html", encoding="utf-8").read()
fonts = open("/tmp/fonts/tajawal-embedded.css", encoding="utf-8").read()
final = src.replace("/*__TAJAWAL__*/", fonts)

out1 = "/home/z/my-project/download/تصور-الواجهة-المبسط.html"
open(out1, "w", encoding="utf-8").write(final)
import shutil
shutil.copyfile(out1, "/home/z/my-project/public/mockup2.html")
print("written:", out1, len(final), "bytes")
print("public copy: /home/z/my-project/public/mockup2.html")
