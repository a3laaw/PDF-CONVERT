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
    "منصة عربية 100% لأدوات PDF: ادمج، صغّر الحجم، دوّر، رقّم، أضف ختمًا، حوّل الصور — وحدّثًا: استوديو التحويل من اتوكاد (DWG/DXF) وريفيت (RVT) وملفات أدوبي (PSD/AI/EPS/INDD) إلى PDF. تعمل داخل متصفحك بالكامل: خصوصية تامة.",
  keywords: [
    "PDF",
    "أدوات PDF",
    "دمج PDF",
    "ضغط PDF",
    "محوّل PDF",
    "تحويل صور",
    "أدوات عربية",
    "تحويل اتوكاد PDF",
    "DWG إلى PDF",
    "DXF إلى PDF",
    "ريفيت PDF",
    "RVT PDF",
    "PSD إلى PDF",
    "AI إلى PDF",
    "INDD PDF",
    "تحويل ملفات أدوبي",
  ],
  authors: [{ name: "محوّل PDF" }],
  openGraph: {
    title: "محوّل PDF",
  description:
    "كل أدوات PDF في مكان واحد + التحويل: اتوكاد وريفيت وأدوبي إلى PDF — عربي بالكامل، مجاني.",
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
