"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  X,
  Play,
  Loader2,
  CircleCheck,
  CircleAlert,
  Link2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { TOOLS_BY_ID } from "@/lib/tools-catalog";
import { toHindiDigits } from "@/lib/arabic";
import type { OpField } from "@/lib/types";
import { useWorkspace } from "@/store/workspace";
import { PagePickerDialog } from "./page-picker";
import { ResultsStrip } from "./results-strip";
import { PanelTitle } from "./file-panel";

/** عمود 2 — الخطوات: مرقّمة قابلة للتعديل والترتيب والتنفيذ */
export function StepsPanel() {
  const steps = useWorkspace((s) => s.steps);
  const files = useWorkspace((s) => s.files);
  const runState = useWorkspace((s) => s.runState);
  const runMessage = useWorkspace((s) => s.runMessage);
  const runProgress = useWorkspace((s) => s.runProgress);
  const moveStep = useWorkspace((s) => s.moveStep);
  const removeStep = useWorkspace((s) => s.removeStep);
  const clearSteps = useWorkspace((s) => s.clearSteps);
  const run = useWorkspace((s) => s.run);

  const running = runState === "running";

  return (
    <section aria-label="الخطوات" className="flex flex-col h-full">
      <PanelTitle
        num={2}
        title="الخطوات"
        sub={steps.length > 0 ? stepsWord(steps.length) : "من شريط الأمر أو من «مهام شائعة»"}
      />

      <div className="flex-1 mt-3 space-y-2.5 max-h-[34rem] overflow-y-auto pr-1 scroll-smooth">
        <AnimatePresence initial={false}>
          {steps.map((step, idx) => {
            const tool = TOOLS_BY_ID[step.op];
            return (
              <motion.article
                key={step.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="rounded-xl border border-border bg-white p-3 shadow-sm"
              >
                <header className="flex items-center gap-2">
                  <span className="grid place-items-center size-7 rounded-lg bg-secondary text-secondary-foreground font-extrabold text-sm shrink-0">
                    {toHindiDigits(idx + 1)}
                  </span>
                  <span className="text-xl" aria-hidden>
                    {tool.emoji}
                  </span>
                  <h3 className="font-bold text-sm flex-1 min-w-0 truncate">{step.label}</h3>

                  <span className="flex items-center gap-0.5 shrink-0">
                    <IconBtn label="تقديم الخطوة" onClick={() => moveStep(step.id, -1)} disabled={idx === 0 || running}>
                      <ChevronUp className="size-4" />
                    </IconBtn>
                    <IconBtn
                      label="تأخير الخطوة"
                      onClick={() => moveStep(step.id, 1)}
                      disabled={idx === steps.length - 1 || running}
                    >
                      <ChevronDown className="size-4" />
                    </IconBtn>
                    <IconBtn label="حذف الخطوة" onClick={() => removeStep(step.id)} disabled={running} danger>
                      <X className="size-4" />
                    </IconBtn>
                  </span>
                </header>

                <div className="mt-2.5 space-y-2">
                  <SourceSelect stepId={step.id} current={step.source} />
                  {tool.fields.map((field) => (
                    <FieldRow key={field.key} stepId={step.id} fieldKey={field.key} field={field} value={step.params[field.key] ?? ""} />
                  ))}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>

        {steps.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              لا خطوات بعد — اكتب طلبك في شريط الأمر بالأعلى، أو اختر من «مهام شائعة»، أو أضف أداة من الكتالوج.
            </p>
          </div>
        )}
      </div>

      {/* شريط التنفيذ */}
      {steps.length > 0 && (
        <div className="mt-3 space-y-2">
          {running && (
            <div className="space-y-1.5">
              <Progress value={runProgress * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-center" role="status">
                {runMessage}
              </p>
            </div>
          )}
          {!running && runMessage && (
            <p
              role="status"
              className={`text-xs font-bold text-center flex items-center justify-center gap-1.5 ${
                runState === "error" ? "text-destructive" : runState === "done" ? "text-emerald-700" : "text-muted-foreground"
              }`}
            >
              {runState === "error" ? (
                <CircleAlert className="size-3.5" aria-hidden />
              ) : runState === "done" ? (
                <CircleCheck className="size-3.5" aria-hidden />
              ) : null}
              {runMessage}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => void run()}
              disabled={running || files.length === 0}
              className="flex-1 font-extrabold gap-2 h-11"
              size="lg"
            >
              {running ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Play className="size-4" aria-hidden />}
              {running ? "جارٍ التنفيذ…" : "نفّذ الخطوات"}
            </Button>
            <Button variant="outline" onClick={clearSteps} disabled={running || steps.length === 0} className="gap-2">
              <Trash2 className="size-4" aria-hidden />
              إفراغ
            </Button>
          </div>
          {files.length === 0 && (
            <p className="text-[11px] text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-lg py-1.5">
              أضف ملفاتك أولًا من عمود «الملفات»
            </p>
          )}
        </div>
      )}

      <ResultsStrip />
    </section>
  );
}

/* اختيار مصدر الخطوة */
function SourceSelect({ stepId, current }: { stepId: string; current: string }) {
  const files = useWorkspace((s) => s.files);
  const updateStepSource = useWorkspace((s) => s.updateStepSource);
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 w-16">
        <Link2 className="size-3" aria-hidden />
        المصدر
      </span>
      <Select value={current || "@auto"} onValueChange={(v) => updateStepSource(stepId, v)}>
        <SelectTrigger className="h-8 text-xs flex-1" aria-label="مصدر الخطوة">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="@auto">تلقائي — الملفات المناسبة</SelectItem>
          <SelectItem value="@prev">نتيجة الخطوة السابقة</SelectItem>
          {files.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* صف حقل معامل — مع دعم الاختيار البصري للصفحات */
const FieldRow = memo(function FieldRow({
  stepId,
  fieldKey,
  field,
  value,
}: {
  stepId: string;
  fieldKey: string;
  field: OpField;
  value: string;
}) {
  const updateStepParams = useWorkspace((s) => s.updateStepParams);
  const files = useWorkspace((s) => s.files);
  const steps = useWorkspace((s) => s.steps);
  const step = steps.find((x) => x.id === stepId);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`${stepId}-${fieldKey}`} className="text-xs text-muted-foreground shrink-0 w-16 text-left">
        {field.label}
      </label>
      {field.type === "select" ? (
        <Select value={value || field.default || ""} onValueChange={(v) => updateStepParams(stepId, { [fieldKey]: v })}>
          <SelectTrigger id={`${stepId}-${fieldKey}`} className="h-8 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex-1 flex items-center gap-1.5">
          <Input
            id={`${stepId}-${fieldKey}`}
            value={value}
            onChange={(e) => updateStepParams(stepId, { [fieldKey]: e.target.value })}
            placeholder={field.placeholder}
            className="h-8 text-xs"
          />
          {field.pagesPicker && (
            <PagePickerDialog
              pdfFiles={files.filter((f) => f.kind === "pdf").map((f) => ({ id: f.id, name: f.name, pages: f.pages ?? 0, file: f.file }))}
              initialSelected={value}
              onConfirm={(pages) => updateStepParams(stepId, { [fieldKey]: pages.join(",") })}
              triggerLabel={value ? `محدد: ${value.split(",").length}` : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
});

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid place-items-center size-7 rounded-md transition-colors disabled:opacity-30 ${
        danger ? "text-muted-foreground hover:text-destructive hover:bg-red-50" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function stepsWord(n: number): string {
  if (n === 1) return "خطوة واحدة";
  if (n === 2) return "خطوتان";
  if (n <= 10) return `${toHindiDigits(n)} خطوات`;
  return `${toHindiDigits(n)} خطوةً`;
}
