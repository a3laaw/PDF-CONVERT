import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

/** طبقة الخادم — تشغيل محرك بايثون convert_to_pdf.py وإدارة الملفات المؤقتة */

export const DATA_DIR = path.join(process.cwd(), "converter-data");
export const INPUTS_DIR = path.join(DATA_DIR, "inputs");
export const OUTPUTS_DIR = path.join(DATA_DIR, "outputs");
const SCRIPT = path.join(process.cwd(), "scripts", "convert_to_pdf.py");

/** اختيار مفسّر بايثون موثوق: بيئة المشروع الافتراضية أولًا ثم python3 من PATH */
async function resolvePython(): Promise<string> {
  const candidates = [
    process.env.PDF_ENGINE_PYTHON,
    "/home/z/.venv/bin/python3",
    "/usr/local/bin/python3",
    "/usr/bin/python3",
    "python3",
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    try {
      await fs.access(c.startsWith("/") ? c : c);
      // python3 من PATH لا نتحقق منه بـ fs.access لأنه يعتمد على PATH نفسه
      if (c !== "python3") return c;
      if (candidates.indexOf(c) === candidates.length - 1) return c;
    } catch {
      /* التالي */
    }
  }
  return "python3";
}

export const ALLOWED_EXTS = new Set([
  "dxf", "dwg", "rvt", "psd", "ai", "eps", "ps", "indd", "pdf",
  "png", "jpg", "jpeg", "webp", "bmp", "tif", "tiff", "gif",
]);
export const MAX_FILE_BYTES = 80 * 1024 * 1024; // 80MB
export const MAX_FILES = 15;

export interface EngineResult {
  ok: boolean;
  engine: string;
  pages: number;
  note_ar: string;
  info: Record<string, string>;
  error?: string;
}

export async function ensureDirs() {
  await fs.mkdir(INPUTS_DIR, { recursive: true });
  await fs.mkdir(OUTPUTS_DIR, { recursive: true });
}

/** حذف الملفات الأقدم من ساعتين — خصوصية أولًا */
export async function cleanupOld() {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const dir of [INPUTS_DIR, OUTPUTS_DIR]) {
    try {
      const entries = await fs.readdir(dir);
      for (const name of entries) {
        const p = path.join(dir, name);
        try {
          const st = await fs.stat(p);
          if (st.mtimeMs < cutoff) await fs.unlink(p);
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  }
}

interface EngineProc {
  code: number | null;
  stdout: string;
  stderr: string;
}

function runEngine(args: string[], timeoutMs = 240_000): Promise<EngineProc> {
  return new Promise(async (resolve, reject) => {
    const pythonBin = await resolvePython();
    const proc = spawn(pythonBin, [SCRIPT, ...args], { cwd: process.cwd() });
    let stdout = "";
    let stderr = "";
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        proc.kill("SIGKILL");
        done = true;
        reject(new Error("timeout: conversion took too long"));
      }
    }, timeoutMs);

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (e) => {
      if (!done) {
        clearTimeout(timer);
        done = true;
        reject(e);
      }
    });
    proc.on("close", (code) => {
      if (!done) {
        clearTimeout(timer);
        done = true;
        resolve({ code, stdout, stderr });
      }
    });
  });
}

export function parseEngineResult(stdout: string): EngineResult {
  const marker = "@@RESULT@@";
  const idx = stdout.lastIndexOf(marker);
  if (idx < 0) throw new Error("engine produced no result payload");
  const json = stdout.slice(idx + marker.length).trim();
  const parsed = JSON.parse(json) as EngineResult;
  return parsed;
}

export async function engineConvert(
  inputPath: string,
  outputPath: string,
  thumbPath: string
): Promise<EngineResult> {
  const proc = await runEngine(["convert", inputPath, outputPath, thumbPath]);
  const result = parseEngineResult(proc.stdout);
  if (!result.ok) {
    throw new Error(result.error || "conversion failed");
  }
  return result;
}

export async function engineMerge(
  outputPath: string,
  inputPaths: string[]
): Promise<EngineResult> {
  const proc = await runEngine(["merge", outputPath, ...inputPaths]);
  const result = parseEngineResult(proc.stdout);
  if (!result.ok) throw new Error(result.error || "merge failed");
  return result;
}

export interface UnmarkReport {
  pages: number;
  annots: number;
  hits: number;
}

/** معاينة سريعة بلا تحويل: أمر preview في المحرك يكتب PNG ويصف الجودة بصدق */
export interface EnginePreview {
  ok: boolean;
  kind: string;
  quality: string; // vector | flatten | preview | none
  note: string;
  info: Record<string, string>;
  error?: string;
}

export async function enginePreview(
  inputPath: string,
  pngPath: string
): Promise<EnginePreview> {
  const proc = await runEngine(["preview", inputPath, pngPath], 150_000);
  const r = parseEngineResult(proc.stdout);
  return {
    ok: r.ok,
    kind: r.info["Kind"] || "",
    quality: r.info["Quality"] || "",
    note: r.note_ar,
    info: r.info,
    error: r.error || undefined,
  };
}

/** حذف العلامة المائية: نصوص + طوابع/تعليقات عبر أمر unmark في المحرك */
export async function engineUnmark(
  inputPath: string,
  outputPath: string,
  texts: string,
  removeAnnots: boolean
): Promise<UnmarkReport> {
  const proc = await runEngine([
    "unmark",
    inputPath,
    outputPath,
    texts.slice(0, 400),
    removeAnnots ? "1" : "0",
  ]);
  const result = parseEngineResult(proc.stdout);
  if (!result.ok) throw new Error(result.error || "unmark failed");
  return {
    pages: result.pages,
    annots: Number(result.info["Annotations removed"] ?? 0) || 0,
    hits: Number(result.info["Text hits"] ?? 0) || 0,
  };
}

export async function makeThumbFor(
  pdfPath: string,
  thumbPath: string,
  width = 420
): Promise<void> {
  await runEngine(["thumb", pdfPath, thumbPath, String(width)], 60_000);
}

export async function readThumbDataUrl(thumbPath: string): Promise<string | null> {
  try {
    const buf = await fs.readFile(thumbPath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export interface StoredMeta {
  id: string;
  name: string; // اسم الملف الأصلي
  outName: string; // اسم الناتج المقترح
  pages: number;
  engine: string;
  note: string;
  info: Record<string, string>;
  createdAt: number;
}

export function metaPath(id: string): string {
  return path.join(OUTPUTS_DIR, `${id}.json`);
}

export async function writeMeta(meta: StoredMeta) {
  await fs.writeFile(metaPath(meta.id), JSON.stringify(meta), "utf8");
}

export async function readMeta(id: string): Promise<StoredMeta | null> {
  try {
    const raw = await fs.readFile(metaPath(id), "utf8");
    return JSON.parse(raw) as StoredMeta;
  } catch {
    return null;
  }
}

/** فحص صارم لمعرّف الملف (حماية من اجتياز المسارات) */
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function outputPathFor(id: string): string {
  return path.join(OUTPUTS_DIR, `${id}.pdf`);
}

/** أسماء ناتج آمنة: اقطع الامتداد وأضف pdf */
export function outNameFor(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, "") || "ملف";
  const safe = base.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "").slice(0, 120);
  return `${safe}.pdf`;
}
