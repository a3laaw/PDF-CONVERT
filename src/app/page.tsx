"use client";

import { Lock } from "lucide-react";
import { HeaderBar } from "@/components/pdf-station/header-bar";
import { Workbench } from "@/components/pdf-station/workbench";
import { AdSlot } from "@/components/pdf-station/ad-slot";
import { useI18n } from "@/lib/i18n";

/** «محوّل PDF» — مساحة عمل واحدة: أدوات PDF والصور، عرض أولًا ثم الإجراء */
export default function Home() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col">
      <HeaderBar />

      {/* بانر علوي غير مزعج — يظهر فقط عند ضبط مفاتيح AdSense */}
      <AdSlot slot="top-banner" className="mx-auto max-w-7xl px-4 pt-3" minHeight={0} testId="ad-top" />

      <main className="flex-1">
        <Workbench />
      </main>

      <footer className="mt-auto border-t border-border/70 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3.5">
          <p className="text-xs text-muted-foreground">
            <span className="text-sm font-extrabold text-foreground">{t("site.name")}</span> —{" "}
            {t("site.footerBrand")}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            {t("site.footerPrivacy")}
          </p>
        </div>
      </footer>
    </div>
  );
}
