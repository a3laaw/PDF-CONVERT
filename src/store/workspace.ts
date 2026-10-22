/* متجر مساحة العمل — الملفات، الخطوات، النتائج، السجل، المفضلة */

import { create } from "zustand";
import { nanoid } from "@/lib/nanoid";
import { toHindiDigits } from "@/lib/arabic";
import { inspectImage, inspectPdf, runOp, zipResults } from "@/lib/pdf-engine";
import { uniqueName } from "@/lib/naming";
import { stepLabel } from "@/lib/interpreter";
import { TOOLS_BY_ID } from "@/lib/tools-catalog";
import type {
  FileKind,
  HistoryItem,
  OpId,
  ResultFile,
  Step,
  WorkspaceFile,
} from "@/lib/types";

const HISTORY_KEY = "mahattapdf-history";
const FAVS_KEY = "mahattapdf-favorites";

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* التخزين ممتلئ — نتجاهل */
  }
}

export type RunState = "idle" | "running" | "done" | "error";

interface WorkspaceState {
  files: WorkspaceFile[];
  steps: Step[];
  results: ResultFile[];
  runState: RunState;
  runMessage: string;
  runProgress: number; // 0..1
  lastInterpret: string; // نص آخر تفسير
  suggestions: { segment: string; toolId: OpId; phrase: string }[];
  history: HistoryItem[];
  favorites: OpId[];

  addFiles: (list: File[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  moveFile: (id: string, dir: -1 | 1) => void;

  addStep: (op: OpId, params?: Record<string, string>) => void;
  addSteps: (list: { op: OpId; params?: Record<string, string> }[]) => void;
  removeStep: (id: string) => void;
  moveStep: (id: string, dir: -1 | 1) => void;
  updateStepParams: (id: string, params: Record<string, string>) => void;
  updateStepSource: (id: string, source: string) => void;
  clearSteps: () => void;
  setSuggestions: (s: WorkspaceState["suggestions"]) => void;

  run: () => Promise<void>;
  runOnFiles: (op: OpId, params: Record<string, string>, fileIds: string[]) => Promise<void>;
  renameResult: (id: string, name: string) => void;
  clearResults: () => void;
  downloadAll: () => Promise<void>;

  toggleFavorite: (op: OpId) => void;
  pushHistory: (text: string, stepsCount: number) => void;
  clearHistory: () => void;
}

function detectKind(name: string): FileKind {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "pdf";
  if (/\.(png|jpe?g|webp|gif|bmp)$/.test(n)) return "image";
  if (/\.(dxf|dwg|rvt)$/.test(n)) return "cad";
  return "other";
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  files: [],
  steps: [],
  results: [],
  runState: "idle",
  runMessage: "",
  runProgress: 0,
  lastInterpret: "",
  suggestions: [],
  history: loadJson<HistoryItem[]>(HISTORY_KEY, []),
  favorites: loadJson<OpId[]>(FAVS_KEY, []),

  addFiles: async (list) => {
    for (const file of list) {
      const kind = detectKind(file.name);
      const wf: WorkspaceFile = {
        id: nanoid(),
        file,
        name: file.name,
        kind,
        size: file.size,
        addedAt: Date.now(),
      };
      set((s) => ({ files: [...s.files, wf] }));
      // فحص غير معطّل للواجهة
      if (kind === "pdf") {
        inspectPdf(file)
          .then((info) =>
            set((s) => ({
              files: s.files.map((f) =>
                f.id === wf.id ? { ...f, pages: info.pages, thumb: info.thumb, scanned: info.scanned } : f
              ),
            }))
          )
          .catch(() => undefined);
      } else if (kind === "image") {
        inspectImage(file)
          .then(({ thumb }) =>
            set((s) => ({
              files: s.files.map((f) => (f.id === wf.id ? { ...f, thumb } : f)),
            }))
          )
          .catch(() => undefined);
      }
    }
  },

  removeFile: (id) => {
    set((s) => ({ files: s.files.filter((x) => x.id !== id) }));
  },

  clearFiles: () => set({ files: [], results: [] }),

  moveFile: (id, dir) =>
    set((s) => {
      const idx = s.files.findIndex((f) => f.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= s.files.length) return s;
      const files = [...s.files];
      [files[idx], files[target]] = [files[target], files[idx]];
      return { files };
    }),

  addStep: (op, params) =>
    set((s) => ({
      steps: [
        ...s.steps,
        {
          id: nanoid(),
          op,
          label: stepLabel(op, params ?? {}, s.files.length),
          params: { ...defaultsOf(op), ...(params ?? {}) },
          source: "@auto",
        },
      ],
    })),

  addSteps: (list) =>
    set((s) => ({
      steps: [
        ...s.steps,
        ...list.map(({ op, params }) => ({
          id: nanoid(),
          op,
          label: stepLabel(op, params ?? {}, s.files.length),
          params: { ...defaultsOf(op), ...(params ?? {}) },
          source: "@auto",
        })),
      ],
    })),

  removeStep: (id) => set((s) => ({ steps: s.steps.filter((x) => x.id !== id) })),

  moveStep: (id, dir) =>
    set((s) => {
      const idx = s.steps.findIndex((x) => x.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= s.steps.length) return s;
      const steps = [...s.steps];
      [steps[idx], steps[target]] = [steps[target], steps[idx]];
      return { steps };
    }),

  updateStepParams: (id, params) =>
    set((s) => ({
      steps: s.steps.map((x) =>
        x.id === id
          ? {
              ...x,
              params: { ...x.params, ...params },
              label: stepLabel(x.op, { ...x.params, ...params }, s.files.length),
            }
          : x
      ),
    })),

  updateStepSource: (id, source) =>
    set((s) => ({ steps: s.steps.map((x) => (x.id === id ? { ...x, source } : x)) })),

  clearSteps: () => set({ steps: [] }),
  setSuggestions: (sug) => set({ suggestions: sug }),

  run: async () => {
    const { steps, files } = get();
    if (steps.length === 0) return;
    set({ runState: "running", runProgress: 0, results: [], runMessage: "بدأ التنفيذ…" });
    const results: ResultFile[] = [];
    let prevOutputs: ResultFile[] = []; // ناتج الخطوة السابقة فقط — للتسلسل السليم
    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const tool = TOOLS_BY_ID[step.op];
        const toInput = (r: ResultFile) => ({
          id: r.id,
          name: r.name,
          kind: r.kind,
          file: new File([r.blob], r.name),
        });
        // تحديد المدخلات
        let inputs;
        if (step.source === "@prev") {
          if (prevOutputs.length === 0) throw new Error("لا توجد نتيجة من الخطوة السابقة لاستخدامها");
          inputs = prevOutputs.map(toInput);
        } else if (step.source !== "@auto" && step.source) {
          const f = files.find((x) => x.id === step.source);
          if (!f) throw new Error("الملف المحدد لهذه الخطوة غير موجود");
          inputs = [{ id: f.id, name: f.name, kind: f.kind, file: f.file }];
        } else {
          // تلقائي: ناتج الخطوة السابقة إن وُجد، وإلا الملفات المطابقة للأداة
          const fromPrev = prevOutputs.filter((r) => tool.accepts.includes(r.kind));
          const pool =
            fromPrev.length > 0
              ? fromPrev.map(toInput)
              : files
                  .filter((f) => tool.accepts.includes(f.kind))
                  .map((f) => ({ id: f.id, name: f.name, kind: f.kind, file: f.file }));
          if (pool.length === 0) {
            const need = tool.accepts.includes("image") ? "صور" : "ملفات PDF";
            throw new Error(`أضف ${need} أولًا لتنفيذ «${tool.name}»`);
          }
          inputs = pool;
        }
        const outs = await runOp(step.op, inputs, step.params, step.label, {
          onProgress: (msg) =>
            set((s) => ({
              runMessage: `الخطوة ${i + 1} من ${steps.length}: ${msg}`,
              runProgress: i / steps.length,
            })),
        });
        results.push(...outs);
        prevOutputs = outs;
        set({ runProgress: (i + 1) / steps.length });
      }
      set({
        results,
        runState: "done",
        runMessage: `تم! ${toHindiDigits(results.length)} ${results.length === 1 ? "نتيجة" : "نتائج"} جاهزة للتنزيل`,
        runProgress: 1,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "حدث خطأ غير متوقع أثناء التنفيذ";
      set({ runState: "error", runMessage: msg });
    }
  },

  clearResults: () => {
    get().results.forEach((r) => URL.revokeObjectURL(r.url));
    set({ results: [], runState: "idle", runMessage: "", runProgress: 0 });
  },

  /* تنفيذ أداة واحدة مباشرة على ملفات محددة — بدون خطوات أو أوامر نصية */
  runOnFiles: async (op, params, fileIds) => {
    const tool = TOOLS_BY_ID[op];
    const chosen = get().files.filter((f) => fileIds.includes(f.id) && tool.accepts.includes(f.kind));
    if (chosen.length === 0) {
      const need = tool.accepts.includes("image") ? "صور" : "ملفات PDF";
      set({
        runState: "error",
        runMessage: `هذه الأداة تحتاج ${need} — حدّد الملفات المناسبة أولًا`,
      });
      return;
    }
    const inputs = chosen.map((f) => ({ id: f.id, name: f.name, kind: f.kind, file: f.file }));
    set({ runState: "running", runProgress: 0.1, results: [], runMessage: `جارٍ «${tool.name}»…` });
    try {
      const outs = await runOp(op, inputs, params, tool.name, {
        onProgress: (msg) =>
          set((s) => ({ runMessage: msg, runProgress: Math.min(0.9, s.runProgress + 0.08) })),
      });
      const taken = new Set<string>();
      const final = outs.map((r) => ({ ...r, name: uniqueName(r.name, taken) }));
      set({
        results: final,
        runState: "done",
        runMessage: `تم! ${toHindiDigits(final.length)} ${final.length === 1 ? "ملف جاهز" : "ملفات جاهزة"}`,
        runProgress: 1,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "حدث خطأ غير متوقع أثناء التنفيذ";
      set({ runState: "error", runMessage: msg });
    }
  },

  renameResult: (id, name) =>
    set((s) => ({ results: s.results.map((r) => (r.id === id ? { ...r, name } : r)) })),

  downloadAll: async () => {
    const { results } = get();
    if (results.length === 0) return;
    const blob = await zipResults(results);
    const { downloadBlob, openBlobInNewTab } = await import("@/lib/pdf-engine");
    const embedded = downloadBlob(blob, "الملفات-الجاهزة.zip");
    const { toast } = await import("sonner");
    if (embedded) {
      toast("بدأ تنزيل الأرشيف", {
        description: "إن لم يظهر الملف فالمعاينة تمنع التنزيل المباشر — افتح الأرشيف في تبويب مستقل",
        action: { label: "فتح في تبويب", onClick: () => openBlobInNewTab(blob) },
        duration: 10_000,
      });
    }
  },

  toggleFavorite: (op) => {
    const favs = get().favorites.includes(op)
      ? get().favorites.filter((f) => f !== op)
      : [...get().favorites, op];
    set({ favorites: favs });
    saveJson(FAVS_KEY, favs);
  },

  pushHistory: (text, stepsCount) => {
    const item: HistoryItem = { id: nanoid(), text, at: Date.now(), stepsCount };
    const history = [item, ...get().history.filter((h) => h.text !== text)].slice(0, 20);
    set({ history });
    saveJson(HISTORY_KEY, history);
  },

  clearHistory: () => {
    set({ history: [] });
    saveJson(HISTORY_KEY, []);
  },
}));

function defaultsOf(op: OpId): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of TOOLS_BY_ID[op]?.fields ?? []) {
    if (f.default !== undefined) out[f.key] = f.default;
  }
  return out;
}

/* للفحص السريع من وحدة التحكم */
if (typeof window !== "undefined") {
  (window as unknown as { __mahatta: unknown }).__mahatta = useWorkspace;
}
