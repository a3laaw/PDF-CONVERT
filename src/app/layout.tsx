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
  title: "محطّة PDF — كل أدوات PDF في مكان واحد",
  description:
    "منصة عربية 100% لأدوات PDF: ادمج، صغّر الحجم، دوّر، رقّم، أضف ختمًا، حوّل الصور — كل ذلك بالكتابة بالعربية أو بخطوة واحدة. تعمل داخل متصفحك بالكامل: خصوصية تامة.",
  keywords: [
    "PDF",
    "أدوات PDF",
    "دمج PDF",
    "ضغط PDF",
    "محطة PDF",
    "تحويل صور",
    "أدوات عربية",
  ],
  authors: [{ name: "محطّة PDF" }],
  openGraph: {
    title: "محطّة PDF",
    description: "كل أدوات PDF في مكان واحد — عربي بالكامل، مجاني، ويعمل داخل متصفحك.",
    siteName: "محطّة PDF",
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
