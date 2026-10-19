import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  OUTPUTS_DIR,
  UUID_RE,
  ensureDirs,
  engineMerge,
  readThumbDataUrl,
  writeMeta,
  makeThumbFor,
} from "@/lib/server-convert";

export const runtime = "nodejs";
export const maxDuration = 300;

interface MergeItem {
  id: string;
  name?: string;
}

/** دمج عدة ملفات PDF ناتجة في ملف واحد */
export async function POST(req: NextRequest) {
  await ensureDirs();

  let body: { items?: MergeItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const items = (body.items || []).filter((i) => UUID_RE.test(i.id));
  if (items.length < 2) {
    return NextResponse.json(
      { error: "يلزم ملفان PDF على الأقل للدمج" },
      { status: 400 }
    );
  }
  if (items.length > 20) {
    return NextResponse.json(
      { error: "الحد الأقصى 20 ملفًا للدمج" },
      { status: 400 }
    );
  }

  // تحقق من وجود كل الملفات أولًا
  const paths: string[] = [];
  for (const item of items) {
    const p = path.join(OUTPUTS_DIR, `${item.id}.pdf`);
    try {
      await fs.access(p);
      paths.push(p);
    } catch {
      return NextResponse.json(
        { error: "أحد الملفات لم يعد موجودًا — أعد التحويل أولًا" },
        { status: 404 }
      );
    }
  }

  const id = randomUUID();
  const outPath = path.join(OUTPUTS_DIR, `${id}.pdf`);
  const thumbPath = path.join(OUTPUTS_DIR, `${id}.thumb.png`);
  try {
    const engine = await engineMerge(outPath, paths);
    // توليد مصغّرة عبر محرك الدمج نفسه (fitz)
    await makeThumbFor(outPath, thumbPath);
    const thumb = await readThumbDataUrl(thumbPath);
    const stat = await fs.stat(outPath);
    await writeMeta({
      id,
      name: "ملف-مدموج.pdf",
      outName: "ملف-مدموج.pdf",
      pages: engine.pages,
      engine: engine.engine,
      note: engine.note_ar,
      info: engine.info || {},
      createdAt: Date.now(),
    });
    await fs.unlink(thumbPath).catch(() => {});
    return NextResponse.json({
      result: {
        id,
        name: "ملف-مدموج.pdf",
        outName: "ملف-مدموج.pdf",
        size: stat.size,
        outSize: stat.size,
        pages: engine.pages,
        engine: engine.engine,
        note: engine.note_ar,
        info: engine.info || {},
        thumb,
        ok: true,
      },
    });
  } catch (e) {
    await fs.unlink(outPath).catch(() => {});
    const msg = e instanceof Error ? e.message : "خطأ غير معروف";
    return NextResponse.json(
      { error: `فشل الدمج: ${msg.slice(0, 160)}` },
      { status: 500 }
    );
  }
}
