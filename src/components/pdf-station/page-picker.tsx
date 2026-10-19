"use client";

import { useMemo, useState } from "react";
import { Grid3x3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pdfPageThumbs } from "@/lib/pdf-engine";
import { toHindiDigits } from "@/lib/arabic";

interface PdfFileLite {
  id: string;
  name: string;
  pages: number;
  file: File;
}

interface Props {
  pdfFiles: PdfFileLite[];
  initialSelected?: string;
  onConfirm: (pages: number[]) => void;
  triggerLabel?: string;
}

/** ميزة جديدة: اختيار الصفحات بصريًا من مصغّرات حقيقية */
export function PagePickerDialog({ pdfFiles, initialSelected, onConfirm, triggerLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(parseInitial(initialSelected));
  // معرّف الملف المعروض: مشتق من الملفات المتاحة
  const [requestedId, setRequestedId] = useState<string>("");
  const fileId = pdfFiles.some((f) => f.id === requestedId) ? requestedId : pdfFiles[0]?.id ?? "";

  const loadThumbs = (id: string) => {
    const f = pdfFiles.find((x) => x.id === id);
    if (!f) return;
    setLoading(true);
    setThumbs([]);
    pdfPageThumbs(f.file)
      .then((t) => setThumbs(t))
      .catch(() => toast.error("تعذر عرض الصفحات — أعد المحاولة"))
      .finally(() => setLoading(false));
  };

  const toggle = (n: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const quick = (which: "all" | "odd" | "even" | "none") => {
    const s = new Set<number>();
    for (let i = 1; i <= pageCount; i++) {
      if (which === "all") s.add(i);
      else if (which === "odd" && i % 2 === 1) s.add(i);
      else if (which === "even" && i % 2 === 0) s.add(i);
    }
    setSelected(s);
  };

  const ordered = useMemo(() => Array.from(selected).sort((a, b) => a - b), [selected]);
  const pageCount = thumbs.length || pdfFiles.find((x) => x.id === fileId)?.pages || 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && pdfFiles.length > 0) loadThumbs(fileId);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 text-xs">
          <Grid3x3 className="size-3.5" aria-hidden />
          {triggerLabel ?? "اختيار بصري"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3x3 className="size-5 text-primary" aria-hidden />
            اختر الصفحات بصريًا
          </DialogTitle>
          <DialogDescription>انقر على الصفحات لتحديدها — اختيار أسرع من كتابة الأرقام</DialogDescription>
        </DialogHeader>

        {pdfFiles.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            أضف ملف PDF أولًا لتظهر صفحاته هنا
          </p>
        ) : (
          <>
            {pdfFiles.length > 1 && (
              <Select
                value={fileId}
                onValueChange={(v) => {
                  setRequestedId(v);
                  setSelected(new Set());
                  loadThumbs(v);
                }}
              >
                <SelectTrigger className="w-full" aria-label="اختيار الملف">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pdfFiles.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="secondary" size="sm" onClick={() => quick("all")}>الكل</Button>
              <Button variant="secondary" size="sm" onClick={() => quick("odd")}>الفردية</Button>
              <Button variant="secondary" size="sm" onClick={() => quick("even")}>الزوجية</Button>
              <Button variant="ghost" size="sm" onClick={() => quick("none")}>إلغاء التحديد</Button>
              <span className="text-xs text-muted-foreground mr-auto">
                محدد: {toHindiDigits(ordered.length)} من {toHindiDigits(pageCount)}
              </span>
            </div>

            <ScrollArea className="flex-1 min-h-40 max-h-[46vh]">
              {loading ? (
                <div className="grid place-items-center py-12 gap-2">
                  <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
                  <p className="text-sm text-muted-foreground">جارٍ رسم المصغّرات…</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2 p-1">
                  {thumbs.map((src, i) => {
                    const n = i + 1;
                    const active = selected.has(n);
                    return (
                      <button
                        type="button"
                        key={n}
                        onClick={() => toggle(n)}
                        aria-pressed={active}
                        aria-label={`الصفحة ${n}`}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                          active ? "border-primary ring-2 ring-primary/25 scale-[1.02]" : "border-transparent hover:border-border"
                        }`}
                      >
                        <img src={src} alt={`الصفحة ${n}`} className="w-full h-auto bg-white" />
                        <span
                          className={`absolute top-1 left-1 grid place-items-center size-5 rounded-md text-[10px] font-extrabold ${
                            active ? "bg-primary text-primary-foreground" : "bg-black/45 text-white"
                          }`}
                        >
                          {toHindiDigits(n)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button
                onClick={() => {
                  onConfirm(ordered);
                  setOpen(false);
                }}
                disabled={ordered.length === 0}
                className="font-bold"
              >
                اعتماد {ordered.length > 0 ? `(${toHindiDigits(ordered.length)} صفحات)` : ""}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function parseInitial(initial?: string): Set<number> {
  if (!initial) return new Set();
  const set = new Set<number>();
  for (const part of initial.split(/[,،]/)) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (m) {
      const a = Number(m[1]);
      const b = m[2] ? Number(m[2]) : a;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) set.add(i);
    }
  }
  return set;
}
