/* ترقيع @mlightcad/dxf-json-converter — الحزمة تستورد AcDbFontNameCollector
   من @mlightcad/data-model لكنه غير موجود في أي إصدار منشور (خطأ تغليف).
   نستبدله بجمع بسيط لخطوط الكيانات محليًا — العارض يحمّل الخطوط عند الحاجة أصلًا.
   يُشغَّل تلقائيًا بعد bun install عبر postinstall. */
import fs from "fs";

const FILE = "node_modules/@mlightcad/dxf-json-converter/lib/AcDbDxfConverter.js";
let src = fs.readFileSync(FILE, "utf8");
let changed = false;

if (src.includes("AcDbFontNameCollector")) {
  /* 1) أخرجه من قائمة الاستيراد */
  src = src.replace(/(import\s*\{[^}]*?)\s*AcDbFontNameCollector\s*,?([^}]*\}\s*from\s*['"]@mlightcad\/data-model['"])/,
    (m, a, b) => {
      /* نظّف فاصلة زائدة محتملة */
      const join = a.trimEnd().endsWith("{") ? "" : ",";
      return a.trimEnd().endsWith("{")
        ? `${a}${b.replace(/^\s*,/, "")}`
        : `${a}${b.replace(/^\s*,/, ",")}`;
    });
  /* 2) عرّف جامع خطوط بديل محلي قبل أول استخدام */
  const STUB = `
/* ── بديل محلي لـ AcDbFontNameCollector (غير موجود في data-model المنشورة) ── */
var AcDbFontNameCollector = /** @class */ (function () {
  function AcDbFontNameCollector(opts) {
    this.styles = (opts && opts.styles) || [];
    this.textStyleVar = (opts && opts.textStyleVar) || "";
  }
  AcDbFontNameCollector.prototype.collect = function (entities, hooks) {
    var fonts = [];
    var push = function (f) {
      if (f && typeof f === "string" && fonts.indexOf(f) === -1) fonts.push(f);
    };
    for (var _i = 0, _a = entities !== null && entities !== void 0 ? entities : []; _i < _a.length; _i++) {
      var e = _a[_i];
      try {
        var info = hooks && hooks.getEntityFontInfo && hooks.getEntityFontInfo(e);
        if (info) {
          push(info.fontName);
          push(info.bigFontName);
        }
        if (e && e.layerFontName) push(e.layerFontName);
      } catch (_e) {}
    }
    return fonts;
  };
  return AcDbFontNameCollector;
}());
`;
  const anchor = src.indexOf("getFonts");
  const insertAt = src.indexOf("\n", src.indexOf("AcDbDxfConverter.prototype.getFonts"));
  if (insertAt > 0) {
    src = src.slice(0, insertAt + 1) + STUB + src.slice(insertAt + 1);
  } else {
    /* خطة بديلة: أدخله قبل أول `return new AcDbFontNameCollector` داخل دالة */
    const useAt = src.indexOf("return new AcDbFontNameCollector");
    src = src.slice(0, useAt) + STUB + src.slice(useAt);
  }
  changed = true;
  fs.writeFileSync(FILE, src);
  console.log("patched dxf-json-converter (local font collector stub)");
} else {
  console.log("dxf-json-converter already patched or fixed upstream");
}
if (changed) {
  /* تحقق سريع: لا يتبقى أي استيراد للرمز المفقود */
  const m = src.match(/import\s*\{[^}]*AcDbFontNameCollector[^}]*\}/);
  if (m) {
    console.error("PATCH FAILED — import still present");
    process.exit(1);
  }
}
