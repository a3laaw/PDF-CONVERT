/* أنواع «محطّة PDF» المشتركة */

export type FileKind = "pdf" | "image" | "cad" | "other";

export type OpId =
  | "merge"
  | "compress"
  | "extract"
  | "delete"
  | "rotate"
  | "reorder"
  | "split"
  | "watermark"
  | "remove_watermark"
  | "page_numbers"
  | "images_to_pdf"
  | "pdf_to_images"
  | "extract_text"
  | "metadata"
  | "nup";

/** ملف داخل مساحة العمل */
export interface WorkspaceFile {
  id: string;
  file: File;
  name: string;
  kind: FileKind;
  size: number;
  pages?: number;
  scanned?: boolean;
  thumb?: string; // dataURL
  addedAt: number;
}

export type FieldType = "text" | "select" | "number";

/** حقل معامل لخطوة — يولّد الواجهة منه */
export interface OpField {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  default?: string;
  hint?: string;
  pagesPicker?: boolean; // يضيف زر الاختيار البصري للصفحات
}

/** أداة في الكتالوج */
export interface ToolDef {
  id: OpId;
  name: string;
  desc: string;
  category: "تنظيم" | "الحجم" | "إضافات" | "تحويل" | "بيانات";
  emoji: string;
  keywords: string[]; // للبحث والتفسير الضبابي
  accepts: FileKind[]; // أنواع الملفات المقبولة
  fields: OpField[];
  outName: string; // اسم المخرج بالعربية
  promo?: boolean; // ميزة جديدة — تظهر بشارة
}

/** خطوة قابلة للتنفيذ */
export interface Step {
  id: string;
  op: OpId;
  label: string;
  params: Record<string, string>;
  source: string; // "@prev" | "@auto" | file id
}

/** ملف ناتج */
export interface ResultFile {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  size: number;
  fromStep: string;
  kind: FileKind;
}

export interface Recipe {
  id: string;
  title: string;
  desc: string;
  steps: { op: OpId; params: Record<string, string> }[];
  icon: string;
}

export interface HistoryItem {
  id: string;
  text: string;
  at: number;
  stepsCount: number;
}

export interface Suggest {
  segment: string;
  toolId: OpId;
  phrase: string;
}

export interface InterpretResult {
  steps: { op: OpId; params: Record<string, string>; label: string }[];
  explanation: string;
  confidence: number;
  unknown: string[];
  suggestions: Suggest[];
  engine: "قواعد اللغة" | "مطابقة ضبابية";
}
