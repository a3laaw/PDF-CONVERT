import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  ALLOWED_EXTS,
  MAX_FILES,
  MAX_FILE_BYTES,
  INPUTS_DIR,
  OUTPUTS_DIR,
  ensureDirs,
  cleanupOld,
  engineConvert,
  readThumbDataUrl,
  writeMeta,
  outNameFor,
} from "@/lib/server-convert";

export const runtime = "nodejs";
export const maxDuration = 300;

interface ApiResult {
  id: string;
  name: string;
  outName: string;
  size: number;
  outSize: number;
  pages: number;
  engine: string;
  note: string;
  info: Record<string, string>;
  thumb: string | null;
  ok: boolean;
  error?: string;
}

/** تحويل ملف واحد على الخادم عبر محرك بايثون */
async function convertOne(file: File): Promise<ApiResult> {
  const id = randomUUID();
  const origName = file.name || "file";
  const ext = (origName.split(".").pop() || "").toLowerCase();
  const inputPath = path.join(INPUTS_DIR, `${id}.${ext || "bin"}`);
  const outputPath = path.join(OUTPUTS_DIR, `${id}.pdf`);
  const thumbPath = path.join(OUTPUTS_DIR, `${id}.thumb.png`);

  const base: ApiResult = {
    id,
    name: origName,
    outName: outNameFor(origName),
    size: file.size,
    outSize: 0,
    pages: 0,
    engine: "",
    note: "",
    info: {},
    thumb: null,
    ok: false,
  };

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buf);
    const engine = await engineConvert(inputPath, outputPath, thumbPath);
    const stat = await fs.stat(outputPath);
    const thumb = await readThumbDataUrl(thumbPath);
    await writeMeta({
      id,
      name: origName,
      outName: outNameFor(origName),
      pages: engine.pages,
      engine: engine.engine,
      note: engine.note_ar,
      info: engine.info || {},
      createdAt: Date.now(),
    });
    // نظّف المدخلات فورًا — لا نحتفظ بالأصل
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(thumbPath).catch(() => {});
    return {
      ...base,
      ok: true,
      outSize: stat.size,
      pages: engine.pages,
      engine: engine.engine,
      note: engine.note_ar,
      info: engine.info || {},
      thumb,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطأ غير معروف";
    // نظّف أي مخلفات فاشلة
    for (const p of [inputPath, outputPath, thumbPath]) {
      await fs.unlink(p).catch(() => {});
    }
    return { ...base, ok: false, error: humanizeError(msg, ext) };
  }
}

function humanizeError(msg: string, ext: string): string {
  if (msg.startsWith("unsupported format")) return "صيغة غير مدعومة — راجع قائمة الصيغ";
  if (msg.startsWith("timeout")) return "انتهت مهلة التحويل — الملف كبير جدًا أو معطوب";
  if (/FileDataError|cannot open|Bad|bad/i.test(msg)) {
    return `تعذّر قراءة ملف ${ext.toUpperCase()} — قد يكون معطوبًا أو محميًا بكلمة مرور`;
  }
  if (/no drawable content/i.test(msg)) return "الملف لا يحتوي محتوى رسوميًا قابلًا للعرض";
  return `فشل التحويل: ${msg.slice(0, 140)}`;
}

export async function POST(req: NextRequest) {
  await ensureDirs();
  await cleanupOld();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "لم تُرسل أي ملفات" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `الحد الأقصى ${MAX_FILES} ملفات في المرة الواحدة` },
      { status: 400 }
    );
  }

  const rejected: { name: string; reason: string }[] = [];
  const accepted: File[] = [];
  for (const f of files) {
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      rejected.push({ name: f.name, reason: "صيغة غير مدعومة" });
    } else if (f.size > MAX_FILE_BYTES) {
      rejected.push({ name: f.name, reason: "أكبر من 80MB" });
    } else if (f.size === 0) {
      rejected.push({ name: f.name, reason: "ملف فارغ" });
    } else {
      accepted.push(f);
    }
  }

  // تنفيذ متوازٍ محدود لتسريع الدفعة دون إثقال الخادم
  const results: ApiResult[] = [];
  const CONCURRENCY = 3;
  let cursor = 0;
  async function worker() {
    while (cursor < accepted.length) {
      const idx = cursor++;
      results[idx] = await convertOne(accepted[idx]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, accepted.length) }, () => worker())
  );

  return NextResponse.json({ results, rejected });
}
