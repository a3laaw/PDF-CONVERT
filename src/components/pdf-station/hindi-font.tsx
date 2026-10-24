import { Noto_Sans_Devanagari } from "next/font/google";

/** خط الهندية (ديفاناغاري) — يُحمّل دائمًا بخانة متغيرة،
 *  والجذر في اللغة الهندية يستعمله أولًا ثم يكمل ببقية الخطوط */
export const hindiFont = Noto_Sans_Devanagari({
  variable: "--font-hindi",
  subsets: ["devanagari"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

/** غلاف صغير — لا يرسم شيئًا، مجرد حامل لمتغير الخط داخل الشجرة */
export function HindiFont() {
  return <span className={`${hindiFont.variable} hidden`} aria-hidden="true" />;
}
