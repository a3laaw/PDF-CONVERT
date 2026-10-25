"use client";

/* طبقة PWA: تسجيل عامل الخدمة + التقاط زر «تثبيت» + شارة «بدون اتصال»
 * المزوّد يلف التطبيق داخل I18nProvider، وزر التثبيت يوضع في شريط الأعلى عبر usePwaInstall */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Download, WifiOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

/** حدث beforeinstallprompt — غير معرّف في مكتبة TypeScript القياسية */
interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaState {
  canInstall: boolean;
  installed: boolean;
  promptInstall: () => void;
}

const PwaCtx = createContext<PwaState>({ canInstall: false, installed: false, promptInstall: () => {} });

/** هوك زر التثبيت — يُستهلك في شريط الأعلى */
export function usePwaInstall(): PwaState {
  return useContext(PwaCtx);
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
  /* init آمن للخادم: navigator موجود في Node 21+ لكن بلا onLine — نعتمد window ووجود الخاصية
   * وإلا رسم الخادم شارة «بدون اتصال» زائفة في HTML الأولي وتركت يتيمة بعد الهيدراشن */
  const [offline, setOffline] = useState(
    () => (typeof window !== "undefined" && "onLine" in navigator ? !navigator.onLine : false)
  );

  useEffect(() => {
    /* تسجيل عامل الخدمة — فاشل بصمت إن لم يتوفر (بيئات تطوير قديمة) */
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((reg) => {
          /* فحص تحديث كل 30 ثانية — التحديث الجديد يسري بعد إعادة تحميل عادية */
          setInterval(() => reg.update().catch(() => {}), 30_000);
        })
        .catch(() => {});
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success(t("pwa.installed"));
    };
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    /* أحداث online/offline قد تفوت (استئناف الجهاز، تبويب بالخلفية، محاكاة) —
     * نعيد المزامنة عند العودة للتبويب وكل نبضة قليلة، وsetState بنفس القيمة لا يعيد الرسم */
    const resync = () => setOffline(!navigator.onLine);
    const onVis = () => {
      if (document.visibilityState === "visible") resync();
    };
    const iv = window.setInterval(resync, 4000);

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", resync);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", resync);
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(iv);
    };
  }, [t]);

  const promptInstall = useCallback(() => {
    if (!deferred) return;
    void deferred
      .prompt()
      .then(() => deferred.userChoice)
      .then(() => setDeferred(null))
      .catch(() => setDeferred(null));
  }, [deferred]);

  return (
    <PwaCtx.Provider value={{ canInstall: !!deferred && !installed, installed, promptInstall }}>
      {children}
      {!offline ? null : (
        <div
          data-testid="pwa-offline"
          role="status"
          className="fixed inset-x-0 bottom-20 z-50 mx-auto flex w-fit max-w-[92vw] items-center gap-2 rounded-full border border-border bg-foreground/90 px-4 py-2 text-xs font-extrabold text-background shadow-xl backdrop-blur-sm"
        >
          <WifiOff className="size-4 shrink-0" aria-hidden />
          {t("pwa.offline")}
        </div>
      )}
    </PwaCtx.Provider>
  );
}

/** زر «ثبّت التطبيق» — يظهر فقط حين يسمح المتصفح (beforeinstallprompt) */
export function PwaInstallButton() {
  const { t } = useI18n();
  const { canInstall, promptInstall } = usePwaInstall();
  if (!canInstall) return null;
  return (
    <button
      data-testid="pwa-install"
      onClick={promptInstall}
      aria-label={t("pwa.install")}
      className="flex items-center gap-1.5 rounded-xl bg-primary px-2.5 py-1.5 text-xs font-extrabold text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-primary/90"
    >
      <Download className="size-4" aria-hidden />
      <span className="hidden sm:inline">{t("pwa.install")}</span>
    </button>
  );
}
