"use client";

import { useEffect, useRef } from "react";

/* خانات إعلانية غير مزعجة — بانرات عادية فقط:
   - لا نوافذ منبثقة، لا إعلانات تغطي المحتوى، لا نقرات إجبارية
   - تُفعّل بضبط NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXX في .env
   - بدون ضبط: لا يُرسم شيء إطلاقًا (لا فراغ ولا قفزة تخطيط) */

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let scriptInjected = false;

export function AdSlot({
  slot,
  format = "auto",
  className = "",
  minHeight = 0,
  testId,
}: {
  slot: string; // معرّف الوحدة في لوحة AdSense
  format?: string;
  className?: string;
  minHeight?: number;
  testId?: string;
}) {
  const insRef = useRef<HTMLModElement>(null);
  const enabled = CLIENT.startsWith("ca-pub-") && slot.length > 0;

  useEffect(() => {
    if (!enabled) return;
    /* سكربت AdSense مرة واحدة لكل صفحة */
    if (!scriptInjected) {
      scriptInjected = true;
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    try {
      (window.adsbygoogle ??= []).push({});
    } catch {
      /* حظر الإعلانات — بلا أثر */
    }
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      className={className}
      style={minHeight ? { minHeight } : undefined}
      data-testid={testId}
      aria-hidden
    >
      <ins
        ref={insRef}
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
