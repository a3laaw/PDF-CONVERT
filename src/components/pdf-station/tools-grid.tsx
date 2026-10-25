"use client";

/* ─── شبكة «كل الأدوات» المصنفة — تقسيم iLovePDF المعتمد ───
   تبويبات فلترة (الكل + 6 مجموعات) فوق كروت أدوات (أيقونة + اسم + سطر وصف)
   الكارت بلا ملفات يفتح المنتقي العام ويُنشّط الأداة تلقائيًا، ومع ملفات يقفز للأداة
   عارض CAD خارج الشبكة عمدًا — طريقه الوحيد غرفة أوتوكاد (عزل الأقسام Task 49) */

import { useState } from "react";
import { useI18n, toolKey } from "@/lib/i18n";
import { TOOLS, TOOL_GROUPS, type ToolGroup } from "@/lib/tools-catalog";
import { TOOL_ICONS } from "@/components/pdf-station/tool-icons";
import type { OpId } from "@/lib/types";
import { cn } from "@/lib/utils";

/** الأدوات المستثناة من الشبكة: عارض CAD حصري لغرفته */
const GRID_EXCLUDED = new Set<string>(["cad_viewer"]);

/** كارت المحرر — ليس OpId في الكتالوج لكنه أداة قائمة في مساحة العمل */
const EDITOR_CARD = { id: "editor" as const, category: "تعديل" };

export function ToolsGrid({ onPick }: { onPick: (id: OpId | "editor") => void }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<ToolGroup | "all">("all");

  const groupAr = TOOL_GROUPS.find((g) => g.id === tab)?.ar;
  const cards: { id: OpId | "editor"; category: string }[] = [
    ...TOOLS.filter((x) => !GRID_EXCLUDED.has(x.id)).map((x) => ({ id: x.id, category: x.category })),
    EDITOR_CARD,
  ];
  const shown = groupAr ? cards.filter((c) => c.category === groupAr) : cards;

  return (
    <section className="relative mt-8 overflow-hidden rounded-3xl border border-border/70 station-bg px-4 py-8 sm:px-6" data-testid="tools-grid">
      <div className="mx-auto max-w-5xl">
        {/* العنوان — بنَفس لغة صفحة iLovePDF: كل الأدوات في مكان واحد */}
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight">{t("grid.title")}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("grid.sub")}</p>
        </div>

        {/* تبويبات المجموعات — نمط iLovePDF */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5" role="tablist" aria-label={t("grid.title")}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "all"}
            data-testid="grid-tab-all"
            onClick={() => setTab("all")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-extrabold transition",
              tab === "all"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "border border-border bg-white/80 text-muted-foreground hover:border-primary/40 hover:text-primary"
            )}
          >
            {t("grp.all")}
          </button>
          {TOOL_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={tab === g.id}
              data-testid={`grid-tab-${g.id}`}
              onClick={() => setTab(g.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-extrabold transition",
                tab === g.id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "border border-border bg-white/80 text-muted-foreground hover:border-primary/40 hover:text-primary"
              )}
            >
              {t(`grp.${g.id}`)}
            </button>
          ))}
        </div>

        {/* شبكة الكروت */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4" data-testid="grid-cards">
          {shown.map((c) => {
            const Icon = TOOL_ICONS[c.id];
            return (
              <button
                key={c.id}
                type="button"
                data-testid={`tg-${c.id}`}
                onClick={() => onPick(c.id)}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-white p-3.5 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  {Icon ?? <span aria-hidden>{TOOLS_BY_EMOJI[c.id] ?? "🛠️"}</span>}
                </span>
                <span className="w-full">
                  <span className="block text-[13px] font-extrabold leading-tight">{t(toolKey(c.id, "name"))}</span>
                  <span className="mt-1 line-clamp-2 block text-[11px] leading-relaxed text-muted-foreground">
                    {t(toolKey(c.id, "desc"))}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* أداة بلا أيقونة SVG؟ تظهر بالإيموجي من الكتالوج */
const TOOLS_BY_EMOJI: Record<string, string> = Object.fromEntries(
  TOOLS.map((x) => [x.id, x.emoji])
);
