"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { normalizeArabic, toHindiDigits } from "@/lib/arabic";
import { CATEGORIES, TOOLS } from "@/lib/tools-catalog";
import type { OpId } from "@/lib/types";
import { useWorkspace } from "@/store/workspace";

/** كتالوج الأدوات — بحث فوري + تصنيفات + مفضلة */
export function ToolsCatalog({ onAdded }: { onAdded?: () => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("الكل");
  const [onlyFavs, setOnlyFavs] = useState(false);
  const favorites = useWorkspace((s) => s.favorites);
  const toggleFavorite = useWorkspace((s) => s.toggleFavorite);
  const addStep = useWorkspace((s) => s.addStep);

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
    toast.success(`أُضيفت خطوة: ${name}`, { description: "اضبط تفاصيلها من عمود الخطوات" });
    onAdded?.();
  };

  return (
    <section aria-label="كتالوج الأدوات" className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold">
            كل الأدوات <span className="text-primary">{toHindiDigits(TOOLS.length)}</span> في خدمتك
          </h2>
          <p className="text-muted-foreground mt-1">
            اختر أداة لتضيفها خطوة في مساحة العمل — أو اكتب طلبك بالعربية ودع المحطة تفهمك
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 -translate-y-1/2 right-3 size-4 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في الأدوات… دمج، ختم، تدوير"
            aria-label="بحث في الأدوات"
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
            {c}
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
          المفضلة ({toHindiDigits(favorites.length)})
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((t) => {
            const isFav = favorites.includes(t.id);
            return (
              <motion.article
                key={t.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.16 }}
                className="group relative rounded-2xl border border-border bg-white p-4 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all flex flex-col"
              >
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center size-11 rounded-xl bg-secondary text-2xl shrink-0" aria-hidden>
                    {t.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold leading-snug flex items-center gap-1.5 flex-wrap">
                      {t.name}
                      {t.promo && (
                        <Badge className="bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold">
                          جديد
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(t.id)}
                    aria-label={isFav ? `إزالة ${t.name} من المفضلة` : `إضافة ${t.name} للمفضلة`}
                    aria-pressed={isFav}
                    className="shrink-0 grid place-items-center size-8 rounded-lg hover:bg-amber-50"
                  >
                    <Star className={`size-4 ${isFav ? "fill-amber-400 text-amber-500" : "text-muted-foreground"}`} aria-hidden />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-bold text-muted-foreground">
                    {t.category}
                  </Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => addTool(t.id, t.name)}
                    className="mr-auto gap-1.5 text-xs font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    إضافة للخطوات
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          لا توجد أدوات مطابقة — جرّب كلمة أخرى مثل «دمج» أو «ختم»
        </p>
      )}
    </section>
  );
}
