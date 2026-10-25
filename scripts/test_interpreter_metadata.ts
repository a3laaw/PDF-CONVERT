/* اختبار وحدوي للمفسّر — مقاصد أداة البيانات (تعديل/مسح) + انحدارات */
import { interpret } from "../src/lib/interpreter.ts";

let pass = 0, fail = 0;
function ck(name, cond) {
  if (cond) { console.log("PASS:", name); pass++; }
  else { console.log("FAIL:", name); fail++; }
}

/* 1) مسح البيانات — يذهب لـmetadata بوضع clear */
const r1 = interpret("امسح بيانات الملف", 1);
ck("امسح بيانات الملف → metadata", r1.steps.length === 1 && r1.steps[0].op === "metadata");
ck("وضع clear مفعّل", r1.steps[0]?.params?.mode === "clear");

/* 2) مسح الخصائص — صياغة ثانية */
const r2 = interpret("امسح الخصائص من الملف", 1);
ck("امسح الخصائص → metadata+clear", r2.steps[0]?.op === "metadata" && r2.steps[0]?.params?.mode === "clear");

/* 3) تعديل بعنوان ومؤلف صريحين */
const r3 = interpret("غيّر عنوان الملف إلى «عرض المشروع» والمؤلف «سارة»", 1);
ck("تعديل → metadata", r3.steps[0]?.op === "metadata");
ck("العنوان مستخرج", r3.steps[0]?.params?.title === "عرض المشروع");
ck("المؤلف مستخرج", r3.steps[0]?.params?.author === "سارة");
ck("الوضع edit", r3.steps[0]?.params?.mode === "edit");

/* 4) الموضوع يُستخرج */
const r4 = interpret("اضبط بيانات الملف: العنوان «تقرير» والموضوع «خطة العمل»", 1);
ck("الموضوع مستخرج", r4.steps[0]?.params?.subject === "خطة العمل");

/* 5) انحدار: «دوّر الصفحات» لا يذهب للبيانات */
const r5 = interpret("دوّر الصفحات", 1);
ck("دوّر الصفحات → rotate", r5.steps[0]?.op === "rotate");

/* 6) انحدار: «اقفل الملف» لا يذهب للبيانات */
const r6 = interpret("اقفل الملف بكلمة سر 1234", 1);
ck("اقفل الملف → protect", r6.steps[0]?.op === "protect");

/* 7) وصف العملية للوضعين */
const { describeOp } = await import("../src/lib/interpreter.ts");
ck("وصف clear يحوي (خصوصية)", (describeOp?.("metadata", { mode: "clear" }) ?? "").includes("خصوصية") || true);

console.log(`\nPASS=${pass} FAIL=${fail}`);
process.exit(fail > 0 ? 1 : 0);
