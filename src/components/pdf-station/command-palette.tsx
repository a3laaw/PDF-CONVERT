"use client";

import { useEffect } from "react";
import { useCommandPalette } from "@/lib/use-command-palette";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { CATEGORIES, TOOLS } from "@/lib/tools-catalog";
import { toast } from "sonner";
import { useWorkspace } from "@/store/workspace";

/** ميزة جديدة: بحث سريع وتشغيل فوري للأدوات — Ctrl+K */
export function CommandPalette({
  onOpenWork,
  onOpenConvert,
}: {
  onOpenWork: () => void;
  onOpenConvert?: () => void;
}) {
  const { open, setOpen } = useCommandPalette();
  const addStep = useWorkspace((s) => s.addStep);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const pick = (id: string, name: string) => {
    addStep(id as never);
    setOpen(false);
    onOpenWork();
    toast.success(`أُضيفت خطوة: ${name}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="اكتب اسم الأداة… دمج، ختم، تدوير" />
      <CommandList>
        <CommandEmpty>لا نتائج مطابقة</CommandEmpty>
        {CATEGORIES.filter((c) => c !== "الكل").map((cat) => {
          const tools = TOOLS.filter((t) => t.category === cat);
          if (tools.length === 0) return null;
          return (
            <CommandGroup key={cat} heading={cat}>
              {tools.map((t) => (
                <CommandItem key={t.id} onSelect={() => pick(t.id, t.name)} value={`${t.name} ${t.keywords.join(" ")}`}>
                  <span aria-hidden className="text-lg">{t.emoji}</span>
                  <span className="font-bold">{t.name}</span>
                  <span className="text-xs text-muted-foreground mr-auto truncate max-w-40">{t.desc}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
        <CommandSeparator />
        <CommandGroup heading="التحويل">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              if (onOpenConvert) {
                onOpenConvert();
              } else {
                onOpenWork();
              }
              toast.success("تم فتح استوديو التحويل");
            }}
            value="استوديو التحويل اتوكاد ريفيت ادوبي dwg dxf rvt psd ai indd"
          >
            <span aria-hidden>🔄</span>
            <span className="font-bold">استوديو التحويل — اتوكاد وريفيت وأدوبي إلى PDF</span>
            <span className="text-xs text-muted-foreground mr-auto truncate max-w-40">
              DXF · DWG · RVT · PSD · AI · INDD
            </span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="مساعدة">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              onOpenWork();
            }}
            value="مساحة العمل"
          >
            <span aria-hidden>🚉</span>
            <span className="font-bold">الانتقال إلى مساحة العمل</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
