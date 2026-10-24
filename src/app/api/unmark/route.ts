import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  MAX_FILE_BYTES,
  INPUTS_DIR,
  OUTPUTS_DIR,
  ensureDirs,
  cleanupOld,
  engineUnmark,
  outNameFor,
} from "@/lib/server-convert";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * حذف العلامة المائية — أداة الخادم الوحيدة في شاشة العمل
 * POST multipart: file (PDF) + texts (كلمات مفصولة بفاصلة) + annots (1/0)
 * الرد: PDF النظيف binary + تقرير في ترويسة X-Unmark-Report
 * الخصوصية: يُحذف الأصل والناتج من القرص فور إرسال الرد
 */
export async function POST(req: NextRequest) {
  await ensureDirs();
  await cleanupOld();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "لم يُرسل أي ملف" }, { status: 400 });
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ext !== "pdf") {
    return NextResponse.json(
      { error: "هذه الأداة تقبل ملفات PDF فقط" },
      { status: 400 }
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "الملف فارغ" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "الملف أكبر من 80MB" },
      { status: 400 }
    );
  }

  const texts = (form.get("texts") as string | null) ?? "";
  const removeAnnots = (form.get("annots") as string | null) !== "0";

  const id = randomUUID();
  const inputPath = path.join(INPUTS_DIR, `${id}.pdf`);
  const outputPath = path.join(OUTPUTS_DIR, `${id}.pdf`);

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buf);
    const report = await engineUnmark(inputPath, outputPath, texts, removeAnnots);
    const out = await fs.readFile(outputPath);
    // خصوصية: لا نحتفظ بأي نسخة على القرص
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});

    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(out.length),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(outNameFor(file.name))}`,
        "X-Unmark-Report": encodeURIComponent(
          JSON.stringify({ ...report, bytes: out.length })
        ),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    for (const p of [inputPath, outputPath]) {
      await fs.unlink(p).catch(() => {});
    }
    const msg = e instanceof Error ? e.message : "خطأ غير معروف";
    let human = `تعذر تنظيف العلامة: ${msg.slice(0, 120)}`;
    if (/encrypted|password/i.test(msg)) {
      human = "الملف محمي بكلمة مرور — فك الحماية أولًا ثم أعد المحاولة";
    } else if (/timeout/i.test(msg)) {
      human = "انتهت مهلة المعالجة — الملف كبير جدًا";
    }
    return NextResponse.json({ error: human }, { status: 500 });
  }
}
