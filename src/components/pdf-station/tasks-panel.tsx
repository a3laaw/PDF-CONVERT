"use client";

import { useMemo, useState } from "react";
import { Clock, RotateCcw, Sparkles, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { suggestRecipes } from "@/lib/interpreter";
import { interpret } from "@/lib/interpreter";
import { toHindiDigits } from "@/lib/arabic";
import { useWorkspace } from "@/store/workspace";
import { PanelTitle } from "./file-panel";

/** عمود ٣ — مهام شائعة تتغير حسب ملفاتك + سجل الطلبات */
export function TasksPanel() {
  const files = useWorkspace((s) => s.files);
  const history = useWorkspace((s) => s.history);
  const addSteps = useWorkspace((s) => s.addSteps);
  const pushHistory = useWorkspace((s) => s.pushHistory);
  const clearHistory = useWorkspace((s) => s.clearHistory);
  const run = useWorkspace((s) => s.run);
  const [tab, setTab] = useState("tasks");

  const recipes = useMemo(
    () =>
      suggestRecipes(
        files.map((f) => ({ kind: f.kind, size: f.size, scanned: f.scanned, pages: f.pages }))
      ),
    [files]
  );

  const applyRecipe = (steps: { op: string; params: Record<string, string> }[], title: string) => {
    if (steps.length === 0) {
      toast.info("أضف ملفاتك أولًا وستظهر مهام جاهزة هنا");
      return;
    }
    addSteps(steps as never);
    toast.success(`أُضيفت خطوات «${title}»`);
  };

  const rerunHistory = (text: string) => {
    const res = interpret(text, files.length);
    if (res.steps.length === 0) {
      toast.warning("لم أفهم هذا الطلب الآن", { description: text });
      return;
    }
    addSteps(res.steps);
    toast.success(res.explanation);
    setTimeout(() => void run(), 150);
  };

  return (
    <section aria-label="مهام شائعة وسجل" className="flex flex-col h-full">
      <PanelTitle num={3} title="مهام شائعة" sub="تتغير حسب ملفاتك" />

      <Tabs value={tab} onValueChange={setTab} className="mt-3 flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="tasks" className="gap-1.5 text-sm">
            <Sparkles className="size-3.5" aria-hidden />
            مقترحة
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-sm">
            <Clock className="size-3.5" aria-hidden />
            سجل الطلبات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="flex-1 mt-3">
          <ScrollArea className="h-full max-h-[30rem] pr-1">
            <ul className="space-y-2.5">
              {recipes.map((r, i) => (
                <motion.li
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl leading-none" aria-hidden>
                      {r.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm">{r.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
                      {r.steps.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          {r.steps.map((s, j) => (
                            <span
                              key={j}
                              className="rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold px-2 py-0.5"
                            >
                              {toHindiDigits(j + 1)}. {s.op === "merge" ? "دمج" : s.op === "compress" ? "تصغير الحجم" : s.op === "page_numbers" ? "ترقيم" : s.op === "watermark" ? "ختم" : "أداة"}
                            </span>
                          ))}
                          <Button
                            size="sm"
                            className="h-7 text-xs mr-auto font-bold"
                            onClick={() => applyRecipe(r.steps, r.title)}
                          >
                            <ListChecks className="size-3.5" aria-hidden />
                            جرّبها
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="flex-1 mt-3">
          {history.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              طلباتك السابقة ستظهر هنا — جاهزة لإعادة التشغيل بنقرة
            </p>
          ) : (
            <>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearHistory} className="text-destructive hover:text-destructive gap-1.5">
                  <Trash2 className="size-3.5" aria-hidden />
                  مسح السجل
                </Button>
              </div>
              <ScrollArea className="max-h-[26rem] pr-1">
                <ul className="space-y-2">
                  {history.map((h) => (
                    <li
                      key={h.id}
                      className="rounded-xl border border-border bg-white p-2.5 flex items-center gap-2 shadow-sm"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold truncate text-right" dir="rtl" title={h.text}>
                          {h.text}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {new Date(h.at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                          {h.stepsCount > 0 ? `${toHindiDigits(h.stepsCount)} خطوات` : "غير مفهوم"}
                        </span>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rerunHistory(h.text)}
                        className="gap-1.5 text-xs shrink-0"
                        aria-label={`إعادة تشغيل: ${h.text}`}
                      >
                        <RotateCcw className="size-3.5" aria-hidden />
                        إعادة
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
