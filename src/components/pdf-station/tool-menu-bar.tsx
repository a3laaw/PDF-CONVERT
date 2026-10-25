"use client";

/* ─── شريط الأدوات المنسدل — المحور 3 (نمط iLovePDF المعتمد) ───
   6 أزرار مجموعات: تنظيم · تحسين · تحويل · تعديل · حماية · معلومات
   كل زر يفتح قائمة منسدلة بأدوات مجموعته (أيقونة صغيرة + اسم)
   والشريط كله يظهر حسب الحالة فقط: بلا قسم = كل الأدوات · داخل قسم = أدوات القسم وحدها
   عارض CAD زر مستقل خارج المجموعات — طريقه الوحيد غرفته (عزل Task 49)
   إغلاق القائمة: نقر خارجها أو Esc */

import { useEffect, useRef, useState } from "react";
import { ChevronDown, DraftingCompass } from "lucide-react";
import { useI18n, toolKey } from "@/lib/i18n";
import { type ToolGroup } from "@/lib/tools-catalog";
import { TOOL_ICONS } from "@/components/pdf-station/tool-icons";
import type { OpId } from "@/lib/types";
import type { ServicePick, SectorTool } from "@/components/pdf-station/service-wheel";
import { cn } from "@/lib/utils";

/** مجموعات شريط الأدوات — المصدر الوحيد للتقسيم (أيقونات مركز الترس تستخدمه أيضًا)
    المحرر داخل «تعديل» — بيانات الملف داخل «معلومات» — n-up داخل «تنظيم» */
export const MENU_GROUPS: { gid: ToolGroup; ids: (OpId | "editor")[] }[] = [
  { gid: "organize", ids: ["merge", "merge_pages", "split", "extract", "delete", "reorder", "nup"] },
  { gid: "optimize", ids: ["compress", "ocr"] },
  { gid: "convert", ids: ["pdf_to_images", "images_to_pdf", "pdf_to_word", "pdf_to_excel", "image_convert"] },
  { gid: "edit", ids: ["editor", "rotate", "page_numbers", "watermark", "remove_watermark", "image_crop", "image_resize"] },
  { gid: "protect", ids: ["sign", "protect", "unlock"] },
  { gid: "info", ids: ["extract_text", "metadata"] },
];

/** اسم قصير للأداة: tb.* إن وُجد وإلا الاسم الكامل من الكتالوج (metadata/nup) */
export function toolLabel(id: OpId | "editor", t: (k: string) => string): string {
  const short = t(`tb.${id}`);
  if (short !== `tb.${id}`) return short;
  return t(toolKey(id, "name"));
}

export function ToolMenuBar({
  sector,
  tool,
  editing,
  cadOpen,
  editorEnabled,
  cadEnabled,
  toolEnabled,
  onActivate,
}: {
  sector: ServicePick | null;
  tool: OpId | null;
  editing: boolean;
  cadOpen: boolean;
  editorEnabled: boolean;
  cadEnabled: boolean;
  toolEnabled: (id: OpId) => boolean;
  onActivate: (id: SectorTool) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState<ToolGroup | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  /* إغلاق القائمة بالنقر خارجها وبـ Esc — click وليس mousedown ليعمل مع النقر الاصطناعي كذلك */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* المجموعات الظاهرة: داخل القسم تُحصر بأدوات القسم — المجموعة الفارغة تختفي كليًا */
  const groups = MENU_GROUPS.map((g) => ({
    ...g,
    ids: sector ? g.ids.filter((id) => sector.tools.includes(id)) : g.ids,
  })).filter((g) => g.ids.length > 0);
  const showCad = !sector || sector.tools.includes("cad_viewer");
  const activeId: SectorTool | null = editing ? "editor" : cadOpen ? "cad_viewer" : tool;
  const activeGroup =
    activeId && activeId !== "cad_viewer"
      ? groups.find((g) => g.ids.includes(activeId))?.gid ?? null
      : null;

  return (
    <div
      ref={rootRef}
      role="toolbar"
      aria-label={t("mb.aria")}
      data-testid="tool-menubar"
      className="relative z-30 flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-white p-1.5 shadow-sm"
    >
      {groups.map((g) => {
        const isOpen = open === g.gid;
        const isActive = activeGroup === g.gid;
        return (
          <div key={g.gid} className="relative">
            <button
              type="button"
              data-testid={`mb-g-${g.gid}`}
              aria-expanded={isOpen}
              aria-haspopup="true"
              onClick={() => setOpen(isOpen ? null : g.gid)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition",
                isOpen
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : isActive
                    ? "bg-primary/10 text-primary outline outline-1 outline-primary/30"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
              )}
            >
              {t(`grp.${g.gid}`)}
              <ChevronDown className={cn("size-3.5 transition-transform", isOpen && "rotate-180")} aria-hidden />
            </button>

            {isOpen && (
              <div
                role="menu"
                data-testid={`mb-panel-${g.gid}`}
                className="absolute top-full z-40 mt-1.5 min-w-[230px] rounded-2xl border border-border bg-white p-1.5 shadow-xl shadow-black/10 start-0"
              >
                <div className={cn("grid gap-0.5", g.ids.length > 3 ? "grid-cols-2" : "grid-cols-1")}>
                  {g.ids.map((id) => {
                    const isEditor = id === "editor";
                    const ok = isEditor ? editorEnabled : toolEnabled(id);
                    const active = isEditor ? editing : tool === id;
                    const Icon = TOOL_ICONS[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        role="menuitem"
                        data-testid={`tb-${id}`}
                        onClick={() => {
                          setOpen(null);
                          onActivate(id);
                        }}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-start text-[12px] font-bold transition",
                          active
                            ? "bg-primary/10 text-primary"
                            : ok
                              ? "text-foreground hover:bg-primary/5 hover:text-primary"
                              : "cursor-not-allowed text-muted-foreground/35"
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-7 shrink-0 place-items-center rounded-lg [&>svg]:size-4",
                            active ? "bg-primary text-white" : "bg-secondary/70 text-primary"
                          )}
                        >
                          {Icon ?? <span aria-hidden>🛠️</span>}
                        </span>
                        <span className="whitespace-nowrap">{toolLabel(id, t)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* عارض أوتوكاد — زر مستقل في نهاية الشريط */}
      {showCad && (
        <button
          type="button"
          data-testid="tb-cad_viewer"
          onClick={() => onActivate("cad_viewer")}
          className={cn(
            "ms-auto flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-extrabold transition",
            cadOpen
              ? "bg-primary/10 text-primary outline outline-1 outline-primary/30"
              : cadEnabled
                ? "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                : "cursor-not-allowed text-muted-foreground/30"
          )}
        >
          <DraftingCompass className="size-4" aria-hidden />
          {t("tb.cad_viewer")}
        </button>
      )}
    </div>
  );
}
