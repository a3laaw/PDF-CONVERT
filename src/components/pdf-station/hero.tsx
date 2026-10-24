"use client";

import { motion } from "framer-motion";
import { TrainFront, MousePointerClick, PenLine, Download, Lock, Languages, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandBar } from "./command-bar";
import { toHindiDigits } from "@/lib/arabic";
import { useI18n } from "@/lib/i18n";
import { TOOLS } from "@/lib/tools-catalog";

/** الواجهة الرئيسية: الترحيب + شريط الأمر + الوعود */
export function Hero({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();
  return (
    <section className="station-bg border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-white/70 px-4 py-1.5 text-sm font-bold text-primary shadow-sm">
            <Sparkles className="size-4" aria-hidden />
            {t("hero.badge")}
          </span>

          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold leading-[1.15] tracking-tight">
            {t("hero.title1")}
            <span className="text-primary"> {t("hero.title2")}</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed">
            {t("hero.sub1")}
            <br className="hidden md:block" />
            {t("hero.sub2")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8"
        >
          <CommandBar onInterpreted={onStart} />
        </motion.div>

        {/* التدفق المرقّم 123 */}
        <motion.ol
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto"
        >
          {[
            { n: 1, icon: MousePointerClick, k: "step1" },
            { n: 2, icon: PenLine, k: "step2" },
            { n: 3, icon: Download, k: "step3" },
          ].map(({ n, icon: Icon, k }) => (
            <li key={n} className="rounded-2xl bg-white/80 border border-border p-4 flex items-start gap-3 shadow-sm">
              <span className="grid place-items-center size-9 rounded-xl bg-secondary text-secondary-foreground font-extrabold shrink-0">
                {toHindiDigits(n)}
              </span>
              <span>
                <span className="block font-bold">{t(`hero.${k}T`)}</span>
                <span className="block text-sm text-muted-foreground mt-0.5">{t(`hero.${k}D`)}</span>
              </span>
              <Icon className="size-4 text-primary/50 mr-auto mt-1" aria-hidden />
            </li>
          ))}
        </motion.ol>

        {/* أرقام المحطة */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Stat icon={null} value={toHindiDigits(TOOLS.length)} label={t("hero.statTools")} />
          <Stat icon={<Languages className="size-4" />} value={toHindiDigits(3)} label={t("hero.statLangs")} />
          <Stat icon={<Lock className="size-4" />} value={toHindiDigits(0)} label={t("hero.statBytes")} />
        </div>

        <div className="mt-8 text-center">
          <Button size="lg" onClick={onStart} className="font-extrabold text-base px-8 gap-2 shadow-lg shadow-primary/25">
            <TrainFront className="size-5" aria-hidden />
            {t("hero.cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-2 shadow-sm">
      {icon && <span className="text-primary">{icon}</span>}
      <span className="font-extrabold text-primary text-lg">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
