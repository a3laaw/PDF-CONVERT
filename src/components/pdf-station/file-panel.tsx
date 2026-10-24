"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileWarning,
  Trash2,
  ChevronUp,
  ChevronDown,
  ScanLine,
  FileStack,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatBytes, toHindiDigits } from "@/lib/arabic";
import { useWorkspace } from "@/store/workspace";

/** عمود 1 — الملفات: رفع، مصغّرات، وسوم، ترتيب الدمج */
export function FilePanel() {
  const files = useWorkspace((s) => s.files);
  const addFiles = useWorkspace((s) => s.addFiles);
  const removeFile = useWorkspace((s) => s.removeFile);
  const moveFile = useWorkspace((s) => s.moveFile);
  const clearFiles = useWorkspace((s) => s.clearFiles);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const arr = Array.from(list);
      const bad = arr.filter((f) => {
        const n = f.name.toLowerCase();
        return !(n.endsWith(".pdf") || /\.(png|jpe?g|webp|gif|bmp)$/.test(n) || /\.(dxf|dwg|rvt)$/.test(n));
      });
      const good = arr.filter((f) => !bad.includes(f));
      if (good.length > 0) void addFiles(good);
      if (bad.length > 0) {
        toast.warning(`تم تجاهل ${bad.length} من الملفات`, {
          description: "المدعوم حاليًا: PDF والصور فقط",
        });
      }
    },
    [addFiles]
  );

  return (
    <section aria-label="الملفات" className="flex flex-col h-full">
      <PanelTitle num={1} title="الملفات" sub={files.length > 0 ? `${fileWord(files.length)} — اسحب لتغيير ترتيب الدمج` : "ابدأ بإضافة ملفاتك"} />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onDrop(e.dataTransfer.files);
        }}
        aria-label="إضافة ملفات"
        className={`mt-3 w-full rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          dragOver
            ? "border-primary bg-secondary/70 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-secondary/40"
        }`}
      >
        <UploadCloud className={`mx-auto size-9 text-primary ${dragOver ? "animate-bounce" : ""}`} aria-hidden />
        <span className="block mt-2 font-bold">اسحب ملفاتك هنا أو انقر للاختيار</span>
        <span className="block text-xs text-muted-foreground mt-1">
          PDF · صور PNG/JPG — يبقى كل شيء داخل متصفحك
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => {
          onDrop(e.target.files);
          e.target.value = "";
        }}
      />

      {files.length > 1 && (
        <Button variant="ghost" size="sm" onClick={clearFiles} className="mt-2 text-destructive hover:text-destructive self-end">
          <Trash2 className="size-4" aria-hidden />
          مسح الكل
        </Button>
      )}

      <ScrollArea className="flex-1 mt-3 min-h-40 max-h-[26rem] pr-1">
        <AnimatePresence initial={false}>
          <ul className="space-y-2.5">
            {files.map((f, idx) => (
              <motion.li
                key={f.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="rounded-xl border border-border bg-white p-2.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                {f.thumb ? (
                  <img
                    src={f.thumb}
                    alt={`مصغّرة ${f.name}`}
                    className="size-14 rounded-lg object-cover border border-border bg-muted shrink-0"
                  />
                ) : (
                  <span className="grid place-items-center size-14 rounded-lg bg-muted text-muted-foreground shrink-0">
                    {f.kind === "pdf" ? (
                      <FileText className="size-6" aria-hidden />
                    ) : f.kind === "image" ? (
                      <ImageIcon className="size-6" aria-hidden />
                    ) : (
                      <FileWarning className="size-6" aria-hidden />
                    )}
                  </span>
                )}

                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sm truncate" title={f.name}>
                    {f.name}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-[11px] font-bold">
                      {formatBytes(f.size)}
                    </Badge>
                    {f.pages !== undefined && (
                      <Badge variant="outline" className="text-[11px] font-bold gap-1">
                        <FileStack className="size-3" aria-hidden />
                        {toHindiDigits(f.pages)} صفحة
                      </Badge>
                    )}
                    {f.scanned && (
                      <Badge className="text-[11px] font-bold gap-1 bg-amber-100 text-amber-800 border border-amber-200">
                        <ScanLine className="size-3" aria-hidden />
                        ممسوح ضوئيًا
                      </Badge>
                    )}
                  </span>
                </span>

                <span className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => moveFile(f.id, -1)}
                    disabled={idx === 0}
                    aria-label="تقديم في الترتيب"
                    className="grid place-items-center size-6 rounded-md hover:bg-secondary disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" aria-hidden />
                  </button>
                  <button
                    onClick={() => moveFile(f.id, 1)}
                    disabled={idx === files.length - 1}
                    aria-label="تأخير في الترتيب"
                    className="grid place-items-center size-6 rounded-md hover:bg-secondary disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" aria-hidden />
                  </button>
                </span>

                <button
                  onClick={() => removeFile(f.id)}
                  aria-label={`حذف ${f.name}`}
                  className="grid place-items-center size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 shrink-0"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </motion.li>
            ))}
          </ul>
        </AnimatePresence>
        {files.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            لا ملفات بعد — الرفع يتم داخل المتصفح فقط ولا يُرسل لأي خادم
          </p>
        )}
      </ScrollArea>
    </section>
  );
}

export function PanelTitle({ num, title, sub }: { num: number; title: string; sub?: string }) {
  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className="grid place-items-center size-7 rounded-lg bg-primary text-primary-foreground text-sm font-extrabold">
        {toHindiDigits(num)}
      </span>
      <h2 className="font-extrabold text-lg">{title}</h2>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function fileWord(n: number): string {
  if (n === 1) return "ملف واحد";
  if (n === 2) return "ملفان";
  if (n <= 10) return `${toHindiDigits(n)} ملفات`;
  return `${toHindiDigits(n)} ملفًا`;
}
