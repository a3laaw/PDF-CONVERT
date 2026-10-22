#!/usr/bin/env python3
"""تضمين خط Tajawal كـ base64 داخل CSS واحد للتصور المستقل"""
import re, base64, urllib.request, sys

css = open("/tmp/fonts/tajawal.css", encoding="utf-8").read()
blocks = re.findall(r"/\* (\w+) \*/\s*(@font-face\s*\{[^}]+\})", css)
out = []
for subset, block in blocks:
    m = re.search(r"url\((https://[^)]+\.woff2)\)", block)
    w = re.search(r"font-weight:\s*(\d+)", block).group(1)
    url = m.group(1)
    data = urllib.request.urlopen(url, timeout=30).read()
    b64 = base64.b64encode(data).decode()
    newblock = block.replace(url, f"data:font/woff2;base64,{b64}")
    out.append(f"/* {subset} {w} */\n{newblock}")
    print(f"embedded {subset} w{w}: {len(data)} bytes", file=sys.stderr)

open("/tmp/fonts/tajawal-embedded.css", "w", encoding="utf-8").write("\n".join(out))
print("OK -> /tmp/fonts/tajawal-embedded.css", file=sys.stderr)
