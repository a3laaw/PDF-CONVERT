import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
  ensureDirs,
  cleanupOld,
  INPUTS_DIR,
  OUTPUTS_DIR,
  MAX_FILE_BYTES,
  enginePreview,
} from "@/lib/server-convert";

/** معاينة سريعة قبل التحويل: يرفع المستخدم ملف CAD/Adobe فيرد صورة PNG + معلومات صادقة.
 *  الأصل يُحذف من الخادم فور انتهاء المعاينة (خصوصية أولًا). */

const PREVIEW_EXTS = new Set(["dxf", "dwg", "rvt", "psd", "ai", "eps", "ps", "indd"]);

function arEngineError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("timeout")) return "انتهت وقت المعاينة — الملف كبير أو معقد جدًا";
  if (m.includes("no drawable content")) return "ملف DXF بلا محتوى رسم قابل للعرض";
  if (m.includes("encrypt") || m.includes("password")) return "الملف محمي بكلمة مرور";
  if (m.includes("not found")) return "تعذر قراءة الملف على الخادم";
  if (m.includes("ghostscript")) return "تعذرت معالجة ملف الرسم (EPS/AI)";
  return "تعذر استخراج المعاينة: " + raw.slice(0, 140);
}

export async function POST(req: NextRequest) {
  await ensureDirs();
  await cleanupOld();

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file") ?? form.get("files");
    if (f && typeof f !== "string") file = f as File;
  } catch {
    return NextResponse.json(
      { ok: false, error: "صيغة الطلب غير صحيحة" },
      { status: 400 }
    );
  }
  if (!file) {
    return NextResponse.json(
      { ok: false, error: "لا يوجد ملف في الطلب" },
      { status: 400 }
    );
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!PREVIEW_EXTS.has(ext)) {
    return NextResponse.json(
      { ok: false, error: `صيغة غير مدعومة للعرض هنا: ${ext || "؟"}` },
      { status: 415 }
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "الملف أكبر من 80 م.ب" },
      { status: 413 }
    );
  }

  const id = crypto.randomUUID();
  const inPath = path.join(INPUTS_DIR, `${id}.${ext}`);
  const pngPath = path.join(OUTPUTS_DIR, `${id}.png`);

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inPath, buf);
    const r = await enginePreview(inPath, pngPath);

    let preview: string | null = null;
    try {
      const png = await fs.readFile(pngPath);
      preview = `data:image/png;base64,${png.toString("base64")}`;
    } catch {
      preview = null; // لا توجد معاينة — معلومات فقط
    }

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: arEngineError(r.error || "خطأ غير معروف"), name: file.name }
      );
    }
    return NextResponse.json({
      ok: true,
      name: file.name,
      size: file.size,
      kind: r.kind,
      quality: r.quality,
      note: r.note,
      info: r.info,
      preview,
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "خطأ غير معروف";
    return NextResponse.json({
      ok: false,
      error: raw.startsWith("timeout") ? "انتهت وقت المعاينة — جرّب مرة أخرى" : arEngineError(raw),
      name: file.name,
    });
  } finally {
    await fs.unlink(inPath).catch(() => {});
    await fs.unlink(pngPath).catch(() => {});
  }
}
