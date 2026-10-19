"use client";

import { useState } from "react";
import { Sparkles, Zap, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { interpret } from "@/lib/interpreter";
import { useWorkspace } from "@/store/workspace";
import type { Suggest } from "@/lib/types";

interface Props {
  variant?: "hero" | "compact";
  onInterpreted?: () => void;
}

/** شريط الأمر الذكي: اكتب طلبك ← اقترح الخطوات ← نفّذ */
export function CommandBar({ variant = "hero", onInterpreted }: Props) {
  const [text, setText] = useState("");
  const files = useWorkspace((s) => s.files);
  const addSteps = useWorkspace((s) => s.addSteps);
  const pushHistory = useWorkspace((s) => s.pushHistory);
  const setSuggestions = useWorkspace((s) => s.setSuggestions);
  const run = useWorkspace((s) => s.run);

  const doInterpret = (thenRun: boolean) => {
    if (!text.trim()) {
      toast.warning("اكتب طلبك أولًا…", { description: "مثال: ادمج الملفات ثم صغّر حجمها" });
      return;
    }
    const res = interpret(text, files.length);
    if (res.steps.length === 0) {
      setSuggestions(res.suggestions);
      toast.warning("لم أفهم الطلب تمامًا", {
        description:
          res.suggestions.length > 0
            ? `هل تقصد: ${res.suggestions[0].phrase}؟`
            : "جرّب صياغة مثل: «ادمج الملفات ثم صغّر حجمها بقوة»",
      });
      return;
    }
    addSteps(res.steps);
    pushHistory(text, res.steps.length);
    setSuggestions(res.suggestions);
    if (res.unknown.length > 0) {
      toast.info(`فهمت ${res.steps.length} من الطلب`, {
        description: `الجزء «${res.unknown[0]}» غير واضح — بقية الخطوات أُضيفت`,
      });
    } else {
      toast.success(res.explanation, { description: "أُضيفت الخطوات لعمود «الخطوات»" });
    }
    setText("");
    if (thenRun) {
      setTimeout(() => void run(), 150);
    }
    onInterpreted?.();
  };

  const compact = variant === "compact";

  return (
    <div className={compact ? "w-full" : "w-full max-w-3xl mx-auto"}>
      <div
        className={`hero-glass rounded-2xl border border-border shadow-lg shadow-indigo-100/60 p-2 flex flex-col sm:flex-row gap-2 items-stretch ${
          compact ? "rounded-xl" : ""
        }`}
      >
        <div className="relative flex-1">
          <Wand2 className="absolute top-1/2 -translate-y-1/2 right-3 size-5 text-primary/60" aria-hidden />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doInterpret(false);
              }
            }}
            placeholder="اكتب طلبك هنا… مثلاً: ادمج الملفات ثم صغّر حجمها"
            aria-label="اكتب طلبك بالعربية"
            className={`border-0 shadow-none bg-transparent text-right pr-10 h-12 ${
              compact ? "text-base" : "text-lg"
            } placeholder:text-muted-foreground/70`}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => doInterpret(false)}
            className="h-12 px-4 font-bold gap-2"
            variant="secondary"
          >
            <Sparkles className="size-4" aria-hidden />
            اقترح الخطوات
          </Button>
          <Button
            onClick={() => doInterpret(true)}
            className="h-12 px-5 font-bold gap-2"
            size="lg"
          >
            <Zap className="size-4" aria-hidden />
            تنفيذ
          </Button>
        </div>
      </div>
      {!compact && (
        <p className="text-center text-sm text-muted-foreground mt-3">
          يفهم الفصحى والمصرية والخليجية والشامية — ويصحّح الأخطاء الإملائية تلقائيًا
        </p>
      )}
      <SuggestionChips />
    </div>
  );
}

/** شرائح «هل تقصد؟» */
function SuggestionChips() {
  const suggestions = useWorkspace((s) => s.suggestions);
  const addStep = useWorkspace((s) => s.addStep);
  const setSuggestions = useWorkspace((s) => s.setSuggestions);
  if (suggestions.length === 0) return null;

  const accept = (s: Suggest) => {
    addStep(s.toolId);
    setSuggestions([]);
    toast.success(`أُضيفت خطوة: ${s.phrase}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 justify-center">
      <span className="text-sm font-bold text-amber-700">هل تقصد؟</span>
      {suggestions.map((s, i) => (
        <button
          key={`${s.toolId}-${i}`}
          onClick={() => accept(s)}
          className="rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 text-sm text-amber-900 transition-colors"
        >
          {s.phrase}
        </button>
      ))}
      <button
        onClick={() => setSuggestions([])}
        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
      >
        تجاهل
      </button>
    </div>
  );
}
