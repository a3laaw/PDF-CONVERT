"use client";

/* لوحة «دمج صفحات من الملفات» — المرحلة 3:
   «صفحة من هنا وصفحة من ملف آخر» — انقر الصفحات بالترتيب الذي تريده
   فتتجمّع في سلة الدمج، ثم زر واحد يطلع ملفًا واحدًا.
   الترتيب في السلة هو الترتيب النهائي — يُعدَّل بالأسهم ويُحذف بعلامة × */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { mergePagesVisual, pdfPageThumbs } from "@/lib/pdf-engine";
import { useWorkspace } from "@/store/workspace";
import { toHindiDigits } from "@/lib/arabic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkspaceFile } from "@/lib/types";

/** عنصر في سلة الدمج — ملف + رقم صفحة */
interface Pick {
  fid: string;
  page: number;
}

interface Props {
  files: WorkspaceFile[]; // ملفات PDF فقط
  onClose: () => void;
}

export function MergePagesPanel({ files, onClose }: Props) {
  const addResults = useWorkspace((s) => s.addResults);
  const [viewId, setViewId] = useState<string>(files[0]?.id ?? "");
  const [thumbs, setThumbs] = useState<Record<string, string[]>>({});
  const [thumbErr, setThumbErr] = useState(false);
  const [basket, setBasket] = useState<Pick[]>([]);
  const [busy, setBusy] = useState(false);
  const reqRef = useRef<Set<string>>(new Set());

  const view = files.find((f) => f.id === viewId) ?? files[0] ?? null;

  /* مصغرات الملف المعروض — تُحضّر مرة واحدة لكل ملف وتتخزّن */
  useEffect(() => {
    if (!view || thumbs[view.id] || reqRef.current.has(view.id)) return;
    reqRef.current.add(view.id);
    setThumbErr(false);
    pdfPageThumbs(view.file, 60)
      .then((arr) => setThumbs((t) => ({ ...t, [view.id]: arr })))
      .catch(() => {
        reqRef.current.delete(view.id);
        setThumbErr(true);
      });
  }, [view, thumbs]);

  const fileName = (fid: string) => files.find((f) => f.id === fid)?.name ?? "";
  const shortName = (fid: string) => {
    const n = fileName(fid).replace(/\.pdf$/i, "");
    return n.length > 14 ? `${n.slice(0, 14)}…` : n;
  };
  const pickedCount = (fid: string, page: number) =>
    basket.filter((p) => p.fid === fid && p.page === page).length;

  /** النقر على صفحة مختارة يزيل كل نسخها من السلة — القرار من الحالة الأخيرة لا من إغلاق قديم */
  const toggle = (fid: string, page: number) =>
    setBasket((b) =>
      b.some((p) => p.fid === fid && p.page === page)
        ? b.filter((p) => !(p.fid === fid && p.page === page))
        : [...b, { fid, page }]
    );
  const removeAt = (i: number) => setBasket((b) => b.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) =>
    setBasket((b) => {
      const j = i + dir;
      if (j < 0 || j >= b.length) return b;
      const nb = [...b];
      [nb[i], nb[j]] = [nb[j], nb[i]];
      return nb;
    });
  const addAll = () => {
    if (!view) return;
    const total = thumbs[view.id]?.length ?? view.pages ?? 0;
    if (total === 0) return;
    setBasket((b) => [
      ...b,
      ...Array.from({ length: total }, (_, i) => ({ fid: view.id, page: i + 1 })),
    ]);
    toast(`أُضيفت كل صفحات «${shortName(view.id)}» إلى السلة`);
  };
  const clearBasket = () => setBasket([]);

  const execute = async () => {
    if (busy || basket.length === 0 || files.length === 0) return;
    setBusy(true);
    try {
      const picks = basket.map((p) => {
        const f = files.find((x) => x.id === p.fid);
        if (!f) throw new Error("أحد الملفات المختارة حُذف من القائمة — راجع السلة");
        return { file: f.file, page: p.page };
      });
      const { name, blob } = await mergePagesVisual(picks);
      addResults([{ name, blob }]);
      toast.success("تم الدمج — الملف جاهز", { description: name });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الدمج — جرّب مرة أخرى");
    } finally {
      setBusy(false);
    }
  };

  const viewTotal = view ? thumbs[view.id]?.length ?? view.pages ?? 0 : 0;

  return (
    <div
      dir="rtl"
      className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
      data-testid="merge-pages-panel"
      aria-label="لوحة دمج الصفحات من الملفات"
    >
      {/* ══ رأس اللوحة ══ */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border bg-white px-3 py-2.5">
        <button
          onClick={onClose}
          aria-label="إغلاق لوحة دمج الصفحات"
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-600"
        >
          <X className="size-5" aria-hidden />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold leading-tight">دمج صفحات من الملفات</p>
          <p className="text-[10px] leading-tight text-muted-foreground">
            صفحة من هنا وصفحة من ملف آخر — انقر الصفحات بالترتيب الذي تريده
          </p>
        </div>
        <span className="flex-1" />
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
            basket.length > 0 ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"
          )}
          data-testid="merge-basket-count"
        >
          السلة: {toHindiDigits(basket.length)} {basket.length === 1 ? "صفحة" : basket.length === 2 ? "صفحتين" : "صفحات"}
        </span>
      </div>

      {/* ══ شرائح الملفات ══ */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border bg-slate-50/60 px-3 py-2">
        {files.map((f) => (
          <button
            key={f.id}
            onClick={() => setViewId(f.id)}
            aria-label={`عرض صفحات ${f.name}`}
            className={cn(
              "flex max-w-[190px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-extrabold transition",
              f.id === view?.id
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary"
            )}
          >
            <span aria-hidden>📄</span>
            <span className="truncate">{f.name}</span>
            {f.pages ? (
              <span className={cn("shrink-0 rounded-full px-1.5 text-[9px]", f.id === view?.id ? "bg-white/20" : "bg-slate-100")}>
                {toHindiDigits(f.pages)}
              </span>
            ) : null}
          </button>
        ))}
        <span className="flex-1" />
        <button
          onClick={addAll}
          aria-label="أضف كل صفحات الملف المعروض"
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-primary/40 bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-primary hover:bg-primary/5"
        >
          <Copy className="size-3" aria-hidden />
          أضف كل صفحات الملف
        </button>
      </div>

      {/* ══ شبكة صفحات الملف المعروض ══ */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 p-3">
        {thumbErr ? (
          <p className="py-10 text-center text-xs font-bold text-muted-foreground">
            تعذّر تحضير المصغرات — أغلق اللوحة وجرّب مرة أخرى
          </p>
        ) : !view || viewTotal === 0 ? (
          <p className="py-10 text-center text-xs font-bold text-muted-foreground">جارٍ التحضير…</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 p-1 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: viewTotal }, (_, i) => i + 1).map((n) => {
              const count = pickedCount(view.id, n);
              return (
                <button
                  key={n}
                  onClick={() => toggle(view.id, n)}
                  aria-label={
                    count > 0
                      ? `صفحة ${toHindiDigits(n)} من ${view.name} — في السلة، انقر لإزالتها`
                      : `أضف صفحة ${toHindiDigits(n)} من ${view.name}`
                  }
                  className={cn(
                    "group relative block overflow-hidden rounded-xl border-2 bg-white p-1.5 shadow-sm transition hover:border-primary/60 hover:shadow-md",
                    count > 0 ? "border-emerald-500 ring-2 ring-emerald-200" : "border-border"
                  )}
                >
                  {thumbs[view.id]?.[n - 1] ? (
                    <img
                      src={thumbs[view.id][n - 1]}
                      alt={`صفحة ${toHindiDigits(n)}`}
                      draggable={false}
                      className="pointer-events-none w-full rounded-md"
                    />
                  ) : (
                    <span className="block aspect-[3/4] w-full animate-pulse rounded-md bg-slate-100" />
                  )}
                  <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-gray-900/75 text-[11px] font-extrabold text-white">
                    {toHindiDigits(n)}
                  </span>
                  {count > 0 && (
                    <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-emerald-500 text-white shadow">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ سلة الدمج + التنفيذ ══ */}
      <div className="shrink-0 border-t-2 border-emerald-100 bg-white p-3">
        <Button
          onClick={execute}
          disabled={basket.length === 0 || busy}
          data-testid="merge-pages-execute"
          className="h-11 w-full gap-2 bg-emerald-600 font-extrabold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              جارٍ الدمج…
            </>
          ) : (
            <>
              <Check className="size-4" aria-hidden />
              ادمج الصفحات
              {basket.length > 0 && (
                <span className="text-xs opacity-90">{" ("}{toHindiDigits(basket.length)})</span>
              )}
            </>
          )}
        </Button>

        {basket.length === 0 ? (
          <p className="mt-2.5 text-center text-[11px] font-bold text-amber-600">
            السلة فارغة — انقر صفحات من الملفات فوق بالترتيب الذي تريده
          </p>
        ) : (
          <>
            <div className="mt-2.5 flex flex-wrap items-stretch gap-1.5">
              {basket.map((p, i) => (
                <span
                  key={`${p.fid}-${p.page}-${i}`}
                  className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 py-1 pl-1 pr-2 text-[10px] font-extrabold text-emerald-800"
                >
                  <span className="grid size-4.5 place-items-center rounded-full bg-emerald-600 text-[9px] text-white">
                    {toHindiDigits(i + 1)}
                  </span>
                  <span className="max-w-[92px] truncate">{shortName(p.fid)}</span>
                  <span className="text-emerald-600">· صفحة {toHindiDigits(p.page)}</span>
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`تقديم العنصر ${toHindiDigits(i + 1)} في الترتيب`}
                    className="grid size-5 place-items-center rounded text-emerald-700 hover:bg-emerald-100 disabled:opacity-25"
                  >
                    <ChevronRight className="size-3.5" aria-hidden />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === basket.length - 1}
                    aria-label={`تأخير العنصر ${toHindiDigits(i + 1)} في الترتيب`}
                    className="grid size-5 place-items-center rounded text-emerald-700 hover:bg-emerald-100 disabled:opacity-25"
                  >
                    <ChevronLeft className="size-3.5" aria-hidden />
                  </button>
                  <button
                    onClick={() => removeAt(i)}
                    aria-label={`إزالة صفحة ${toHindiDigits(p.page)} من ${shortName(p.fid)}`}
                    className="grid size-5 place-items-center rounded text-red-500 hover:bg-red-50"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1">
              <p className="text-[9px] font-bold text-muted-foreground">
                الترتيب في السلة = ترتيب الصفحات في الملف النهائي — حرّكها بالأسهم أو احذفها بعلامة ×
              </p>
              <button
                onClick={clearBasket}
                aria-label="تفريغ السلة"
                className="shrink-0 text-[10px] font-extrabold text-muted-foreground hover:text-red-500"
              >
                تفريغ السلة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
