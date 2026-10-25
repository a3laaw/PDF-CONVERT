/* ─────────── أيقونات الأدوات — مصدر واحد يشترك فيه شريط الأدوات وشبكة «كل الأدوات» ───────────
   مستخلصة من workbench.tsx سلفًا + أيقونتان جديدتان (metadata · nup) لبطاقتي الشبكة المصنفة */

import type { ReactNode } from "react";

const svg = (paths: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-5"
    aria-hidden
  >
    {paths}
  </svg>
);

export const TOOL_ICONS: Record<string, ReactNode> = {
  editor: svg(
    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  ),
  cad_viewer: svg(
    <>
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" />
      <path d="m14 17 3 3 4-4" />
    </>
  ),
  compress: svg(<path d="M4 9h16M4 15h10M9 4l-4 5 4 5" />),
  merge: svg(
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
  ),
  merge_pages: svg(
    <>
      <rect x="3" y="3" width="9" height="9" rx="2" />
      <rect x="12" y="12" width="9" height="9" rx="2" />
      <path d="M13.5 7.5h5M16 5v5" />
    </>
  ),
  split: svg(
    <>
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="7" cy="17" r="2.5" />
      <path d="M9 8.5 20 19M9 15.5 20 5" />
    </>
  ),
  extract: svg(
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  delete: svg(
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  ),
  rotate: svg(<path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6" />),
  reorder: svg(<path d="M8 6v12M8 6 5 9M8 6l3 3M16 18V6M16 18l-3-3M16 18l3-3" />),
  page_numbers: svg(<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />),
  watermark: svg(
    <>
      <path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-4.5 5-9 5-9Z" />
      <path d="M5 21h14" />
    </>
  ),
  remove_watermark: svg(
    <>
      <path d="m7 21-4.3-4.3a2.4 2.4 0 0 1 0-3.4l9.6-9.6a2.4 2.4 0 0 1 3.4 0l5.6 5.6a2.4 2.4 0 0 1 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </>
  ),
  pdf_to_images: svg(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-4-4-8 8" />
    </>
  ),
  images_to_pdf: svg(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 15l4-4 4 4 5-6 5 6" />
    </>
  ),
  image_convert: svg(
    <>
      <path d="M20 5H7l3 3M4 19h13l-3-3" />
    </>
  ),
  image_resize: svg(
    <>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-8 8M3 21l8-8" />
    </>
  ),
  image_crop: svg(
    <>
      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </>
  ),
  extract_text: svg(
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6M9 13h6M9 17h4" />
    </>
  ),
  ocr: svg(
    <>
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
      <circle cx="11.5" cy="11.5" r="3" />
      <path d="m13.8 13.8 2.7 2.7" />
    </>
  ),
  pdf_to_word: svg(
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6" />
      <path d="M8 13.5 9.5 17l1.5-3.5M12.5 17v-3.5l2 3.5 2-3.5V17" />
    </>
  ),
  pdf_to_excel: svg(
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
      <path d="M14 3v6h6" />
      <path d="m8.5 13.5 7 5M15.5 13.5l-7 5" />
    </>
  ),
  sign: svg(
    <>
      <path d="M3 17c3 0 4.5-2.5 5.5-5 1-2.4 2-4 3-4s.8 2.2 0 4.5c-.9 2.6-.6 4.5 1.5 4.5s3.5-2 4-4.5" />
      <path d="M17.5 4.5 19.5 2.5 21.5 4.5 19.5 6.5Z" />
      <path d="M3 21h18" />
    </>
  ),
  protect: svg(
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  unlock: svg(
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.8-1.2" />
      <circle cx="12" cy="16" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  /* جديد للشبكة المصنفة — كانتا خارج الشريط (بالِيتة فقط) فلم تكن لهما أيقونة */
  metadata: svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  nup: svg(
    <>
      <rect x="7" y="3" width="13" height="13" rx="2" />
      <path d="M17 20H6a2 2 0 0 1-2-2V7" />
      <path d="M11 7.5h5M11 11.5h5" />
    </>
  ),
};
