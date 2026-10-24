import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "محوّل PDF — كل أدوات ملفاتك بالعربي",
  description:
    "منصة عربية 100% لأدوات PDF والصور: ادمج، صغّر الحجم، دوّر، رقّم، أضف ختمًا، أزل العلامة المائية، حوّل الصور إلى PDF والعكس، استخرج النصوص. تعمل داخل متصفحك بالكامل: خصوصية تامة.",
  keywords: [
    "PDF",
    "أدوات PDF",
    "دمج PDF",
    "ضغط PDF",
    "محوّل PDF",
    "تحويل صور إلى PDF",
    "PDF إلى صور",
    "إزالة العلامة المائية",
    "أدوات عربية",
    "تعديل PDF",
  ],
  authors: [{ name: "محوّل PDF" }],
  openGraph: {
    title: "محوّل PDF",
    description:
      "كل أدوات PDF والصور في مكان واحد — عربي بالكامل، مجاني، وشغل كله داخل متصفحك.",
    siteName: "محوّل PDF",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F55E3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster position="bottom-right" dir="rtl" richColors closeButton />
      </body>
    </html>
  );
}
