import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";
import { OUTPUTS_DIR, UUID_RE } from "@/lib/server-convert";

export const runtime = "nodejs";
export const maxDuration = 120;

interface ZipItem {
  id: string;
  name?: string;
}

/** ضغط كل النواتج في ملف ZIP واحد للتنزيل */
export async function POST(req: NextRequest) {
  let body: { items?: ZipItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const items = (body.items || []).filter((i) => UUID_RE.test(i.id));
  if (items.length === 0) {
    return NextResponse.json({ error: "لا توجد ملفات للتنزيل" }, { status: 400 });
  }
  if (items.length > 30) {
    return NextResponse.json(
      { error: "الحد الأقصى 30 ملفًا في الأرشيف" },
      { status: 400 }
    );
  }

  const zip = new JSZip();
  const used = new Set<string>();
  let count = 0;

  for (const item of items) {
    const p = path.join(OUTPUTS_DIR, `${item.id}.pdf`);
    try {
      const data = await fs.readFile(p);
      let name = (item.name || `ملف-${count + 1}.pdf`).replace(
        /[\\/:*?"<>|\r\n]/g,
        ""
      );
      if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";
      // تفادي تكرار الأسماء داخل الأرشيف
      let finalName = name;
      let i = 2;
      while (used.has(finalName)) {
        finalName = name.replace(/\.pdf$/i, "") + `-${i}.pdf`;
        i++;
      }
      used.add(finalName);
      zip.file(finalName, data);
      count++;
    } catch {
      // تجاهل الملفات المفقودة — البقية تُنزَّل
    }
  }

  if (count === 0) {
    return NextResponse.json(
      { error: "الملفات لم تعد موجودة — ربما حُذفت تلقائيًا بعد ساعتين" },
      { status: 404 }
    );
  }

  const buf = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const headers = new Headers();
  headers.set("Content-Type", "application/zip");
  headers.set("Content-Length", String(buf.length));
  headers.set(
    "Content-Disposition",
    `attachment; filename="pdf-bundle-${stamp}.zip"`
  );
  return new NextResponse(new Uint8Array(buf), { status: 200, headers });
}
