/* غلاف qpdf-wasm — حماية وفك حماية PDF بكلمة سر، بالكامل داخل المتصفح
   المحرك: qpdf (Apache-2.0) مُترجم إلى WASM — يُحمّل مرة واحدة من /workers
   كل عملية تشغّل نسخة نظيفة مستقلة (نظام ملفات معزول + بلا حالة سابقة) */

interface QpdfModule {
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    readFile: (path: string) => Uint8Array;
  };
  callMain: (args: string[]) => number;
}

type Factory = (opts: Record<string, unknown>) => Promise<unknown>;

let loading: Promise<Factory | null> | null = null;


/** تحميل سكربت qpdf.js العالمي مرة واحدة — يرجّع دالة المصنع أو null عند الفشل */
function loadFactory(): Promise<Factory | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (loading) return loading;
  loading = new Promise(async (resolve) => {
    /* جلب الكود وتنفيذه يدويًا — أضمن من وسم <script>: التحكم الكامل في UMD
       (نضع exports نظيفًا ونزيل module وdefine مؤقتًا كي يكتب qpdf.js المصنع
       في exports["Module"] حتمًا، ثم نعيد كل شيء كما كان) */
    try {
      const code = await fetch(`/workers/qpdf.js?v=${Date.now()}`).then((r) => {
        if (!r.ok) throw new Error(`http ${r.status}`);
        return r.text();
      });
      const w = window as unknown as {
        Module?: unknown;
        exports?: unknown;
        module?: unknown;
        define?: unknown;
      };
      const prevExports = w.exports;
      const prevModule = w.module;
      const prevDefine = w.define;
      const hadExports = "exports" in w;
      const hadModule = "module" in w;
      const hadDefine = "define" in w;
      w.exports = {};
      delete w.module;
      delete w.define;
      new Function(code)();
      const factory = (w.exports as { Module?: unknown } | undefined)?.Module;
      /* استعادة الحالة العالمية كما كانت */
      if (hadExports) w.exports = prevExports;
      else delete w.exports;
      if (hadModule) w.module = prevModule;
      if (hadDefine) w.define = prevDefine;
      delete w.Module; /* نسخة var التي يتركها السكربت */
      resolve(typeof factory === "function" ? (factory as Factory) : null);
    } catch (e) {
      resolve(null);
    }
  });
  return loading;
}

/** نسخة نظيفة لكل عملية — نظام ملفات خاص يُرمى بعد الانتهاء؛ يُلتقط رسائل qpdf */
async function freshModuleWith(
  streams?: { print?: (s: string) => void; printErr?: (s: string) => void }
): Promise<QpdfModule> {
  const factory = await loadFactory();
  if (!factory) throw new Error("تعذّر تحميل محرك الحماية — تأكد من الاتصال ثم أعد المحاولة");
  const inst: Record<string, unknown> = {
    locateFile: (f: string) => `/workers/${f}`,
    print: streams?.print ?? (() => {}),
    printErr: streams?.printErr ?? (() => {}),
  };
  await factory(inst);
  return inst as unknown as QpdfModule;
}

async function freshModule(print?: (s: string) => void): Promise<QpdfModule> {
  return freshModuleWith(print ? { print } : undefined);
}

/** هل الملف مشفر أصلًا؟ — pdf-lib يكشف /Encrypt بدون كلمة سر */
async function isEncrypted(bytes: Uint8Array): Promise<boolean> {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    return doc.isEncrypted;
  } catch {
    return false;
  }
}

/** تشفير ملف PDF بكلمة سر (AES-256) — قفل فتح وقفل تعديل معًا */
export async function protectPdf(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  if (!password) throw new Error("اكتب كلمة السر أولًا — من غيرها مفيش قفل");
  if (await isEncrypted(bytes))
    throw new Error("الملف مقفول بكلمة سر من قبل — افك القفل الأول لو عايز تغيّره");
  const m = await freshModule();
  const outPath = "/out.pdf";
  m.FS.writeFile("/in.pdf", bytes);
  const rc = m.callMain([
    "--encrypt",
    password,
    password,
    "256",
    "--extract=n",
    "--modify=none",
    "--",
    "/in.pdf",
    outPath,
  ]);
  if (rc !== 0) throw new Error("تعذّر قفل الملف — جرّب كلمة سر أبسط (حروف وأرقام)");
  const out = m.FS.readFile(outPath);
  if (!out || out.length < 100) throw new Error("تعذّر قفل الملف — جرّب كلمة سر أبسط");
  return out;
}

/** فحص كلمة السر بـ pdf.js — أسرع وأدق من رسائل qpdf (التي تذهب لـ stderr خارج التقاطنا)
   يرجّع: ok = تفتح بهذا الباسورد، wrong = الباسورد غلط، needed = الملف يطلب باسورد */
async function passwordCheck(
  bytes: Uint8Array,
  password: string
): Promise<"ok" | "wrong" | "needed"> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const task = pdfjs.getDocument({ data: bytes.slice(), password });
    await task.promise;
    await task.destroy();
    return "ok";
  } catch (e) {
    const err = e as { name?: string; code?: number };
    if (err?.name === "PasswordException") return err.code === 2 ? "wrong" : "needed";
    /* ملف تالف لباب آخر — نسيبه لـ qpdf يحكم */
    return "ok";
  }
}

/** فك التشفير بكلمة السر — يرجّع ملفًا نظيفًا مفتوحًا للجميع
   الملفات المقفولة على التعديل فقط (بلا باسورد فتح) تُفك حتى من غير كلمة سر */
export async function unlockPdf(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  if (!(await isEncrypted(bytes)))
    throw new Error("الملف ده مش مقفول من الأساس — مفيش حاجة نفتحها");
  const pw = password.trim();
  if (pw) {
    const check = await passwordCheck(bytes, pw);
    if (check === "wrong") throw new Error("كلمة السر غلط — راجعها وحاول تاني");
    if (check === "needed") throw new Error("اكتب كلمة سر الملف — من غيرها مينفعش نفتحه");
  } else {
    /* بلا باسورد: نفتح الملف بدون فحص — لو طلب باسورد نطالب به */
    const check = await passwordCheck(bytes, "");
    if (check === "needed")
      throw new Error("اكتب كلمة سر الملف — من غيرها مينفعش نفتحه");
  }
  const args = [`--decrypt`, "/in.pdf", "/out.pdf"];
  const m = await freshModule();
  m.FS.writeFile("/in.pdf", bytes);
  const rc = m.callMain(pw ? [`--password=${pw}`, ...args] : args);
  if (rc !== 0)
    throw new Error("تعذّر فتح القفل — تأكد إن الملف مقفول بكلمة سر ومعاك صحتها");
  const out = m.FS.readFile("/out.pdf");
  if (!out || out.length < 100) throw new Error("تعذّر فتح القفل — جرّب تاني");
  return out;
}
