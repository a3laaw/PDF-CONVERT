"use client";

/* لوحة «فصل» بعمودين — كما طلبها المستخدم:
   عمود «كل الصفحات» ← اسحب منه الورقة (أو انقر عليها) فتنتقل إلى «عمود الفصل»،
   وزر التنفيذ فوق عمود الفصل مباشرة. النقر على الورقة في عمود الفصل يُرجعها.
   التنفيذ ينتج ملفين: «الصفحات-المفصولة» و«الصفحات-المتبقية». */

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { pdfPageThumbs, splitPagesVisual } from "@/lib/pdf-engine";
import { useWorkspace } from "@/store/workspace";
import { toHindiDigits } from "@/lib/arabic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fmtPages = (n: number): string =>
  n === 1 ? "صفحة واحدة" : n === 2 ? "صفحتين" : `${toHindiDigits(n)} صفحات`;

interface Props {
  fileName: string;
  file: File;
  pages: number;
  onClose: () => void;
}

export function SplitPanel({ fileName, file, pages, onClose }: Props) {
  const addResults = useWorkspace((s) => s.addResults);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [thumbErr, setThumbErr] = useState(false);
  const [splitSet, setSplitSet] = useState<number[]>([]); // أرقام الصفحات 1..n
  const [dragPage, setDragPage] = useState<number | null>(null);
  const [overA, setOverA] = useState(false);
  const [overB, setOverB] = useState(false);
  const [busy, setBusy] = useState(false);
  /* طابع زمني لبداية السحب — يُبطّل النقر خلال 300مللي فقط حتى لا تعلّق السحوبات المجهضة النقرات */
  const draggedAt = useRef(0);

  /* مصغرات بعرض 150px — أوضح من مصغرات الشريط الجانبي */
  useEffect(() => {
    let alive = true;
    setThumbErr(false);
    pdfPageThumbs(file, 150)
      .then((arr) => {
        if (alive) setThumbs(arr);
      })
      .catch((err) => {
        console.error("thumbs failed:", err);
        if (alive) setThumbErr(true);
      });
    return () => {
      alive = false;
    };
  }, [file]);

  const total = thumbs.length || pages;
  const split = new Set(splitSet);

  const toSplit = (n: number) =>
    setSplitSet((s) => (s.includes(n) ? s : [...s, n].sort((a, b) => a - b)));
  const toSource = (n: number) => setSplitSet((s) => s.filter((x) => x !== n));
  const toggle = (n: number) => (split.has(n) ? toSource(n) : toSplit(n));

  /* الإفلات في أي عمود ينقل الورقة إليه */
  const dropIn = (zone: "a" | "b") => {
    const n = dragPage;
    setDragPage(null);
    setOverA(false);
    setOverB(false);
    if (!n) return;
    if (zone === "b") toSplit(n);
    else toSource(n);
  };

  const execute = async () => {
    if (busy || splitSet.length === 0) return;
    setBusy(true);
    try {
      const { separated, remainder } = await splitPagesVisual(file, splitSet);
      const items = [separated, remainder].filter(Boolean) as { name: string; blob: Blob }[];
      addResults(items);
      toast.success(remainder ? "تم الفصل — ملفان جاهزان" : "تم الفصل — الملف جاهز", {
        description: items.map((i) => i.name).join(" · "),
      });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الفصل — جرّب مرة أخرى");
    } finally {
      setBusy(false);
    }
  };

  const cardCls = (inSplit: boolean) =>
    cn(
      "group relative block cursor-grab overflow-hidden rounded-xl border-2 bg-white p-1.5 shadow-sm transition active:cursor-grabbing",
      inSplit ? "border-amber-400 ring-2 ring-amber-200" : "border-border hover:border-primary/60 hover:shadow-md"
    );

  const Card = ({ n, inSplit }: { n: number; inSplit: boolean }) => (
    <span
      role="button"
      tabIndex={0}
      aria-label={`صفحة ${toHindiDigits(n)} — ${inSplit ? "انقر لإرجاعها" : "انقر لفصلها"}`}
      draggable
      onDragStart={(e) => {
        draggedAt.current = Date.now();
        setDragPage(n);
        e.dataTransfer.setData("text/plain", String(n));
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        setDragPage(null);
        setOverA(false);
        setOverB(false);
        setTimeout(() => {
          draggedAt.current = 0;
        }, 0);
      }}
      onClick={() => {
        if (Date.now() - draggedAt.current < 300) return;
        toggle(n);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle(n);
        }
      }}
      className={cardCls(inSplit)}
    >
      {thumbs[n - 1] ? (
        <img
          src={thumbs[n - 1]}
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
      {inSplit && (
        <span
          aria-hidden
          className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-amber-500 text-white shadow"
        >
          <X className="size-3.5" />
        </span>
      )}
    </span>
  );

  return (
    <div
      dir="rtl"
      className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
      data-testid="split-panel"
      aria-label="لوحة فصل الصفحات"
    >
      {/* ══ رأس اللوحة ══ */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border bg-white px-3 py-2.5">
        <button
          onClick={onClose}
          aria-label="إغلاق لوحة الفصل"
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-600"
        >
          <X className="size-5" aria-hidden />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold leading-tight">فصل صفحات: {fileName}</p>
          <p className="text-[10px] leading-tight text-muted-foreground">
            اسحب الورقة إلى عمود الفصل أو انقر عليها — والنقر عليها في عمود الفصل يُرجعها
          </p>
        </div>
        <span className="flex-1" />
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-extrabold text-primary">
          {toHindiDigits(total)} صفحة
        </span>
      </div>

      {/* ══ الجسم: عمودان ══ */}
      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 max-lg:grid-cols-1 lg:grid-cols-2">
        {/* ── العمود الأول: كل الصفحات ── */}
        <section
          aria-label="كل الصفحات"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setOverA(true);
          }}
          onDragLeave={() => setOverA(false)}
          onDrop={(e) => {
            e.preventDefault();
            dropIn("a");
          }}
          className={cn(
            "flex min-h-[300px] flex-col rounded-2xl border-2 p-3 transition",
            overA && dragPage ? "border-primary bg-primary/5" : "border-border bg-slate-50/60"
          )}
        >
          <p className="mb-2 px-1 text-xs font-extrabold text-muted-foreground">
            كل الصفحات
            <span className="mr-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-muted-foreground ring-1 ring-border">
              {toHindiDigits(total - splitSet.length)}
            </span>
          </p>
          {thumbErr ? (
            <p className="m-auto py-8 text-center text-xs font-bold text-muted-foreground">
              تعذّر تحضير المصغرات — أغلق اللوحة وجرّب مرة أخرى
            </p>
          ) : thumbs.length === 0 ? (
            <p className="m-auto py-8 text-center text-xs font-bold text-muted-foreground">جارٍ التحضير…</p>
          ) : (
            <div className="grid max-h-[430px] grid-cols-3 gap-2 overflow-y-auto p-1 sm:grid-cols-4 lg:max-h-[460px] xl:grid-cols-5">
              {Array.from({ length: total }, (_, i) => i + 1)
                .filter((n) => !split.has(n))
                .map((n) => (
                  <Card key={n} n={n} inSplit={false} />
                ))}
            </div>
          )}
        </section>

        {/* ── العمود الثاني: عمود الفصل + زر التنفيذ فوقه ── */}
        <section
          aria-label="عمود الفصل"
          className={cn(
            "flex min-h-[300px] flex-col rounded-2xl border-2 p-3 transition",
            overB && dragPage ? "border-amber-500 bg-amber-50/60" : "border-border bg-white"
          )}
        >
          {/* زر التنفيذ — فوق عمود الفصل مباشرة كما طلب المستخدم */}
          <Button
            onClick={execute}
            disabled={splitSet.length === 0 || busy}
            data-testid="split-execute"
            className="h-11 w-full gap-2 bg-emerald-600 font-extrabold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                جارٍ الفصل…
              </>
            ) : (
              <>
                <Check className="size-4" aria-hidden />
                نفّذ الفصل
                {splitSet.length > 0 && (
                  <span className="text-xs opacity-90">{" ("}{fmtPages(splitSet.length)})</span>
                )}
              </>
            )}
          </Button>

          {/* منطقة الإفلات */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOverB(true);
            }}
            onDragLeave={() => setOverB(false)}
            onDrop={(e) => {
              e.preventDefault();
              dropIn("b");
            }}
            data-testid="split-dropzone"
            className={cn(
              "mt-3 flex min-h-[240px] flex-1 flex-col rounded-xl border-2 border-dashed p-2 transition",
              overB && dragPage ? "border-amber-500 bg-amber-50" : "border-amber-300/70 bg-amber-50/30"
            )}
          >
            {splitSet.length === 0 ? (
              <div className="m-auto flex flex-col items-center gap-2 py-8 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-600">
                  <ArrowLeft className="size-6" aria-hidden />
                </span>
                <p className="text-xs font-extrabold text-amber-700">عمود الفصل</p>
                <p className="max-w-[220px] text-[10px] font-bold leading-relaxed text-amber-600/80">
                  اسحب الورقة التي تريد فصلها إلى هنا — أو انقر عليها في العمود المجاور
                </p>
              </div>
            ) : (
              <div className="grid max-h-[380px] grid-cols-3 gap-2 overflow-y-auto p-1 sm:grid-cols-4 xl:grid-cols-5">
                {splitSet.map((n) => (
                  <Card key={n} n={n} inSplit />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ══ شريط التلميح ══ */}
      <div className="flex h-8 shrink-0 items-center justify-center border-t border-border bg-white px-3 text-center text-[10px] font-bold text-muted-foreground">
        التنفيذ ينتج ملفين: «الصفحات-المفصولة» و«الصفحات-المتبقية» — إن فصلت كل الصفحات يُنتج ملف المفصولة فقط
      </div>
    </div>
  );
}
