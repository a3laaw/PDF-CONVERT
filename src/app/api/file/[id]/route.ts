import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
  UUID_RE,
  outputPathFor,
  readMeta,
} from "@/lib/server-convert";

export const runtime = "nodejs";

/** خدمة ملف PDF الناتج: inline للمعاينة أو attachment للتنزيل */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const filePath = outputPathFor(id);
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) throw new Error("not a file");
    const data = await fs.readFile(filePath);
    const meta = await readMeta(id);
    const url = new URL(req.url);
    const download = url.searchParams.get("download") === "1";
    const name =
      (url.searchParams.get("name") || meta?.outName || "document.pdf")
        .replace(/[\\/:*?"<>|\r\n]/g, "")
        .slice(0, 150) || "document.pdf";

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Length", String(stat.size));
    headers.set("Cache-Control", "private, max-age=600");
    if (download) {
      headers.set(
        "Content-Disposition",
        `attachment; filename="converted.pdf"; filename*=UTF-8''${encodeURIComponent(name)}`
      );
    } else {
      headers.set("Content-Disposition", `inline; filename="preview.pdf"`);
    }
    return new NextResponse(new Uint8Array(data), { status: 200, headers });
  } catch {
    return NextResponse.json(
      { error: "الملف غير موجود — ربما حُذف تلقائيًا بعد ساعتين" },
      { status: 404 }
    );
  }
}
