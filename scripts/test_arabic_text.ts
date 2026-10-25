/* اختبار دوال ترتيب النص العربي — بيانات مبنية برمجيًا (القلب involutive فنستخدمه مولّدًا) */
import {
  reverseVisual,
  fixLamAlefHamza,
  arScore,
  fixArabicWordOrder,
  orderLineWords,
  hasArabic,
} from "../src/lib/arabic-text.ts";

let pass = 0;
let fail = 0;
function ck(name: string, cond: boolean, extra = "") {
  if (cond) {
    pass++;
    console.log(`PASS: ${name}`);
  } else {
    fail++;
    console.log(`FAIL: ${name} ${extra}`);
  }
}

/* 1) خاصية التسدد: القلب مرتين يعيد الأصل — عربي + أرقام + لاتيني + نسب مختلطة */
const samples = [
  "بلغ عدد السكان 12345 نسمة في عام 2020 حسب الإحصاء",
  "شركة النور للتجارة المحدودة تقدم تقرير PDF شامل",
  "السلام عليكم ورحمة الله وبركاته",
  "مراجعة حسابات 2024 بنسبة نمو 15.5% وربح $500",
];
for (const s of samples) {
  ck(`تسدد: «${s.slice(0, 20)}…»`, reverseVisual(reverseVisual(s)) === s, reverseVisual(reverseVisual(s)));
}

/* 2) حالة التخزين المنطقي: pdf.js يخرج بالعربية معكوسة والأرقام سليمة
   مخرج pdf.js المفترض = reverseVisual(المنطقي) — والقلب يعيده منطقيًا */
const pdfJsOutput = reverseVisual("بلغ عدد السكان 12345 نسمة");
ck("استعادة جملة معكوسة", reverseVisual(pdfJsOutput) === "بلغ عدد السكان 12345 نسمة", reverseVisual(pdfJsOutput));
ck("أرقام سليمة تبقى سليمة", reverseVisual("ةمسن 12345") === "12345 نسمة", reverseVisual("ةمسن 12345"));

/* 3) إصلاح اللام-ألف الهمزية */
ck("اإل → الإ", fixLamAlefHamza("اإلحصاء") === "الإحصاء", fixLamAlefHamza("اإلحصاء"));
ck("األ → الأ", fixLamAlefHamza("األسن") === "الأسن");
ck("اآل → الآ", fixLamAlefHamza("اآلن") === "الآن", fixLamAlefHamza("اآلن"));
ck("التعريف السليم لا يتأثر", fixLamAlefHamza("السلام عليكم") === "السلام عليكم");
ck("إلى لا تتأثر", fixLamAlefHamza("ذهبت إلى البيت") === "ذهبت إلى البيت");

/* 4) نقاط الطبيعية */
ck("التعريف يرفع النقاط", arScore("السلام عليكم ورحمة") > arScore(reverseVisual("السلام عليكم ورحمة")));
ck("نص منطقي أعلى من معكوس", arScore("بلغ عدد السكان") > arScore(reverseVisual("بلغ عدد السكان")));

/* 5) قرار المستند: كلمات pdf.js معكوسة (تخزين منطقي) → قلب كامل */
const LOGICAL = ["السلام عليكم", "ورحمة الله وبركاته", "بلغ عدد السكان 12345", "حسب الإحصاء السنوي", "شركة النور للتجارة"];
const reversedWords = LOGICAL.map((s) => ({ str: reverseVisual(s) }));
const fixed = fixArabicWordOrder(reversedWords).words;
ck(
  "قلب مستند معكوس: كل الكلمات تعاد منطقيًا",
  fixed.map((w) => w.str).join("|") === LOGICAL.join("|"),
  fixed.map((w) => w.str).join("|")
);

/* 5-ب) أثر «اإل» في النص السليم (تخزين بصني برابطة لام-ألف) يُصلح بدون قلب */
const withArtifact = LOGICAL.map((s) => ({ str: s.replace("الإحصاء", "اإلحصاء") }));
const fixedArtifact = fixArabicWordOrder(withArtifact);
ck(
  "إصلاح اللام-ألف بدون قلب",
  fixedArtifact.words.map((w) => w.str).join("|") === LOGICAL.join("|") && !fixedArtifact.flipped,
  fixedArtifact.words.map((w) => w.str).join("|")
);

/* 6) قرار المستند: نص سليم (تخزين بصري) → لا تغيير إطلاقًا */
const good = LOGICAL.map((s) => ({ str: s }));
const untouched = fixArabicWordOrder(good);
ck("نص سليم يبقى سليمًا (بلا قلب)", !untouched.flipped && untouched.words.every((w, i) => w.str === good[i].str));

/* 7) أقل من 4 كلمات عربية → قرار آمن بلا قلب */
const tiny = LOGICAL.slice(0, 2).map((s) => ({ str: reverseVisual(s) }));
ck("قليل الكلمات لا يُقلب (حذر)", fixArabicWordOrder(tiny).flipped === false);

/* 8) ترتيب كلمات السطر */
const rtlWords = [
  { str: "للتجارة", x: 100 },
  { str: "شركة", x: 300 },
  { str: "النور", x: 200 },
];
const ordered = orderLineWords(rtlWords, true);
ck("سطر عربي: يمين لليسار", ordered.map((w) => w.str).join(" ") === "شركة النور للتجارة", ordered.map((w) => w.str).join(" "));
/* سطر عربي فيه مقطع لاتيني — بترتيب تدفق واقعي (pdf.js: يسار-أولًا للمقاطع اللاتينية) */
const rtlMixed = [
  { str: "Hello", x: 180 },
  { str: "World", x: 220 },
  { str: "عربي", x: 350 },
  { str: "كلمة", x: 100 },
];
const orderedMixed = orderLineWords(rtlMixed, true);
ck("مقطع لاتيني داخل سطر عربي", orderedMixed.map((w) => w.str).join(" ") === "عربي Hello World كلمة", orderedMixed.map((w) => w.str).join(" "));
/* سطر لاتيني عادي */
const ltrWords = [
  { str: "Hello", x: 100 },
  { str: "World", x: 180 },
];
ck("سطر لاتيني يسار لليمين", orderLineWords(ltrWords, false).map((w) => w.str).join(" ") === "Hello World");
/* مقطعان لاتينيان منفصلان — بترتيب تدفق واقعي: يسار-أولًا لكل مقطع، والمولد يكتبها منطقيًا */
const twoRuns = [
  { str: "One", x: 220 },
  { str: "Two", x: 260 },
  { str: "A", x: 110 },
  { str: "B", x: 150 },
  { str: "عربي", x: 400 },
  { str: "عربية", x: 60 },
];
ck(
  "مقطعان لاتينيان منفصلان",
  orderLineWords(twoRuns, true).map((w) => w.str).join(" ") === "عربي One Two A B عربية",
  orderLineWords(twoRuns, true).map((w) => w.str).join(" ")
);

/* 9) دوال مساعدة */
ck("hasArabic", hasArabic("abc ع") && !hasArabic("abc 123"));

console.log(`\nالنتيجة: ${pass} نجاح / ${fail} فشل`);
process.exit(fail ? 1 : 0);
