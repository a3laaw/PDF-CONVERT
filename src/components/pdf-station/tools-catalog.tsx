"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { normalizeArabic, toHindiDigits } from "@/lib/arabic";
import { useI18n } from "@/lib/i18n";
import { CATEGORIES, TOOLS } from "@/lib/tools-catalog";
import type { OpId } from "@/lib/types";
import { useWorkspace } from "@/store/workspace";

/** كتالوج الأدوات — بحث فوري + تصنيفات + مفضلة */
export function ToolsCatalog({ onAdded }: { onAdded?: () => void }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("الكل");
  const [onlyFavs, setOnlyFavs] = useState(false);
  const favorites = useWorkspace((s) => s.favorites);
  const toggleFavorite = useWorkspace((s) => s.toggleFavorite);
  const addStep = useWorkspace((s) => s.addStep);

  const catKey: Record<string, string> = {
    "الكل": "cat.all",
    "تنظيم": "cat.organize",
    "الحجم": "cat.size",
    "إضافات": "cat.addons",
    "تحويل": "cat.convert",
    "بيانات": "cat.meta",
  };

  const filtered = useMemo(() => {
    const q = normalizeArabic(query);
    return TOOLS.filter((t) => {
      if (onlyFavs && !favorites.includes(t.id)) return false;
      if (category !== "الكل" && t.category !== category) return false;
      if (!q) return true;
      const hay = normalizeArabic(`${t.name} ${t.desc} ${t.keywords.join(" ")} ${t.category}`);
      return hay.includes(q);
    });
  }, [query, category, onlyFavs, favorites]);

  const addTool = (id: OpId, name: string) => {
    addStep(id);
    toast.success(`${t("cat.addedStep")}: ${name}`, { description: t("cat.addedStepHint") });
    onAdded?.();
  };

  return (
    <section aria-label="كتالوج الأدوات" className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold">
            {t("cat.heading1")} <span className="text-primary">{toHindiDigits(TOOLS.length)}</span> {t("cat.heading2")}
          </h2>
          <p className="text-muted-foreground mt-1">{t("cat.sub")}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 -translate-y-1/2 right-3 size-4 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("cat.searchPlaceholder")}
            aria-label={t("cat.search")}
            className="pr-9 bg-white"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors border ${
              category === c
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-white border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {t(catKey[c] ?? c)}
          </button>
        ))}
        <button
          onClick={() => setOnlyFavs((v) => !v)}
          aria-pressed={onlyFavs}
          className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors border gap-1.5 inline-flex items-center ${
            onlyFavs
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-white border-border text-muted-foreground hover:border-amber-300"
          }`}
        >
          <Star className={`size-3.5 ${onlyFavs ? "fill-amber-400 text-amber-500" : ""}`} aria-hidden />
          {t("cat.favorites")} ({toHindiDigits(favorites.length)})
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((t2) => {
            const isFav = favorites.includes(t2.id);
            return (
              <motion.article
                key={t2.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.16 }}
                className="group relative rounded-2xl border border-border bg-white p-4 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all flex flex-col"
              >
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center size-11 rounded-xl bg-secondary text-2xl shrink-0" aria-hidden>
                    {t2.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold leading-snug flex items-center gap-1.5 flex-wrap">
                      {t(`tools.${t2.id}.name`) === `tools.${t2.id}.name` ? t2.name : t(`tools.${t2.id}.name`)}
                      {t2.promo && (
                        <Badge className="bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold">
                          {t("cat.new")}
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(`tools.${t2.id}.desc`) === `tools.${t2.id}.desc` ? t2.desc : t(`tools.${t2.id}.desc`)}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(t2.id)}
                    aria-label={isFav ? `${t("cat.unfav")} ${t(`tools.${t2.id}.name`)}` : `${t("cat.fav")} ${t(`tools.${t2.id}.name`)}`}
                    aria-pressed={isFav}
                    className="shrink-0 grid place-items-center size-8 rounded-lg hover:bg-amber-50"
                  >
                    <Star className={`size-4 ${isFav ? "fill-amber-400 text-amber-500" : "text-muted-foreground"}`} aria-hidden />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-bold text-muted-foreground">
                    {t(catKey[t2.category] ?? t2.category)}
                  </Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => addTool(t2.id, t(`tools.${t2.id}.name`) === `tools.${t2.id}.name` ? t2.name : t(`tools.${t2.id}.name`))}
                    className="mr-auto gap-1.5 text-xs font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    {t("cat.addStep")}
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          {t("cat.noMatch")}
        </p>
      )}
    </section>
  );
}
