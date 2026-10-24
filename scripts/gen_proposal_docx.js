/* مولّد تقرير «مقترح تطوير منصة محوّل PDF» — docx عربي RTL كامل
 * وصفة الغلاف R1 (Pure Paragraph) بلوحة GO-1 معدّلة للاتجاه من اليمين لليسار
 * البنية: قسم غلاف (هامش 0) + قسم محتويات + قسم متن (ترقيم من 1)
 * تشغيل: node scripts/gen_proposal_docx.js
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, PageNumber, NumberFormat, AlignmentType,
  HeadingLevel, WidthType, BorderStyle, ShadingType, SectionType,
  TableOfContents, TableLayoutType,
} = require("docx");
const fs = require("fs");
const path = require("path");
const { SECTIONS } = require("./proposal_content.js");

/* ── اللوحة GO-1 (Graphite Orange — مقترحات) ── */
const P = {
  bg: "1A2330", accent: "D4875A",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "D4875A", headerText: "FFFFFF", innerLine: "DDD0C8", surface: "F8F0EB" },
  headingColor: "1A2330", body: "000000", secondary: "606060",
};
const F = "Arial"; // خط يدعم العربية على كل المنصات
const fontAll = { ascii: F, hAnsi: F, cs: F, eastAsia: F };

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { ...noBorders, insideHorizontal: NB, insideVertical: NB };

/* ── مساعدات RTL ── */
function run(text, o = {}) {
  return new TextRun({
    text, rightToLeft: true,
    font: fontAll,
    size: o.size ?? 22, sizeComplexScript: o.size ?? 22,
    bold: o.bold ?? false, boldComplexScript: o.bold ?? false,
    italics: o.italics ?? false,
    color: o.color ?? P.body,
  });
}
function body(text, o = {}) {
  return new Paragraph({
    bidirectional: true,
    alignment: o.align ?? AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: o.after ?? 140, before: o.before },
    keepNext: o.keepNext,
    children: [run(text, o)],
  });
}
function bullet(text) {
  return new Paragraph({
    bidirectional: true,
    spacing: { line: 312, after: 100 },
    children: [run("•  ", { color: P.accent, bold: true }), run(text)],
  });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    bidirectional: true,
    spacing: { before: 380, after: 160, line: 360, lineRule: "atLeast" },
    children: [run(text, { size: 30, bold: true, color: P.headingColor })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    bidirectional: true,
    spacing: { before: 260, after: 120, line: 330, lineRule: "atLeast" },
    children: [run(text, { size: 26, bold: true, color: P.headingColor })],
  });
}

/* ── جدول RTL أفقي الخطوط (نمط الأعمال) ── */
function caption(text) {
  return new Paragraph({
    bidirectional: true, keepNext: true,
    spacing: { before: 160, after: 100, line: 312 },
    children: [run(text, { size: 21, bold: true, color: P.secondary })],
  });
}
function cellPara(text, o = {}) {
  return new Paragraph({
    bidirectional: true,
    spacing: { line: 276 },
    children: [run(text, { size: o.size ?? 20, bold: o.bold, color: o.color })],
  });
}
function tbl(headers, rows, widths) {
  return new Table({
    visuallyRightToLeft: true,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: P.accent },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: P.accent },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: P.table.innerLine },
      insideVertical: NB,
    },
    rows: [
      new TableRow({
        tableHeader: true, cantSplit: true,
        children: headers.map((t, i) => new TableCell({
          width: { size: widths[i], type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: P.table.headerBg },
          margins: { top: 70, bottom: 70, left: 110, right: 110 },
          children: [cellPara(t, { bold: true, color: P.table.headerText })],
        })),
      }),
      ...rows.map((r, ri) => new TableRow({
        cantSplit: true,
        children: r.map((t, i) => new TableCell({
          width: { size: widths[i], type: WidthType.PERCENTAGE },
          shading: ri % 2 === 0
            ? { type: ShadingType.CLEAR, fill: "FFFFFF" }
            : { type: ShadingType.CLEAR, fill: P.table.surface },
          margins: { top: 60, bottom: 60, left: 110, right: 110 },
          children: [cellPara(t)],
        })),
      })),
    ],
  });
}

/* ── الصور: أبعاد PNG من IHDR ── */
function pngSize(buf) { return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }; }
function figure(file, capText, displayW) {
  const p = path.join("/home/z/my-project/scripts/t_out/e2e", file);
  const buf = fs.readFileSync(p);
  const { w, h } = pngSize(buf);
  const dw = displayW, dh = Math.round(displayW * h / w);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, keepNext: true,
      spacing: { before: 200, after: 60 },
      children: [new ImageRun({ data: buf, transformation: { width: dw, height: dh }, type: "png" })],
    }),
    new Paragraph({
      bidirectional: true, alignment: AlignmentType.CENTER,
      spacing: { after: 220, line: 276 },
      children: [run(capText, { size: 18, color: P.secondary, italics: true })],
    }),
  ];
}

/* ── تخطيط عنوان الغلاف (مكيّف للعربية: عرض الحرف ≈ pt×12) ── */
function splitTitleLines(title, cpl) {
  if (title.length <= cpl) return [title];
  const breakAfter = new Set([..." \t", ..."-_—–·/"]);
  const lines = [];
  let rem = title;
  while (rem.length > cpl) {
    let at = -1;
    for (let i = cpl; i >= Math.floor(cpl * 0.6); i--) {
      if (i < rem.length && breakAfter.has(rem[i - 1])) { at = i; break; }
    }
    if (at === -1) {
      const lim = Math.min(rem.length, Math.ceil(cpl * 1.3));
      for (let i = cpl + 1; i < lim; i++) {
        if (breakAfter.has(rem[i - 1])) { at = i; break; }
      }
    }
    if (at === -1) at = cpl;
    lines.push(rem.slice(0, at).trim());
    rem = rem.slice(at).trim();
  }
  if (rem) lines.push(rem);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += " " + last;
  }
  return lines;
}
function calcTitleLayout(title, maxW, prefPt = 40, minPt = 24) {
  const cw = (pt) => pt * 12; // متوسط عرض الحرف العربي
  let pt = prefPt, lines;
  while (pt >= minPt) {
    const cpl = Math.floor(maxW / cw(pt));
    if (cpl < 2) { pt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    pt -= 2;
  }
  if (!lines || lines.length > 3) { lines = splitTitleLines(title, Math.floor(maxW / cw(minPt))); pt = minPt; }
  return { titlePt: pt, titleLines: lines };
}
function calcCoverSpacing(p) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false,
    metaLineCount = 0, fixedHeight = 400, pageHeight = 16838 } = p;
  const SAFETY = 1200;
  const usable = pageHeight - SAFETY;
  const contentH = titleLineCount * (titlePt * 23 + 200)
    + (hasSubtitle ? (12 * 23 + 600) : 0)
    + (hasEnglishLabel ? (9 * 23 + 600) : 0)
    + metaLineCount * (10 * 23 + 100)
    + fixedHeight + 3 * 300;
  const rem = Math.max(usable - contentH, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(rem * 0.45), rawBottom = Math.floor(rem * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  return { topSpacing, bottomSpacing };
}

/* ── الغلاف R1 معدّل RTL ── */
function buildCoverR1RTL(cfg) {
  const C = P.cover;
  const padR = 1200, padL = 800;
  const availableWidth = 11906 - padR - padL - 300;
  const { titlePt, titleLines } = calcTitleLayout(cfg.title, availableWidth, 40, 24);
  const sp = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!cfg.subtitle, hasEnglishLabel: !!cfg.englishLabel,
    metaLineCount: (cfg.metaLines || []).length, fixedHeight: 400,
  });
  const accentRight = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const ch = [];
  ch.push(new Paragraph({ spacing: { before: sp.topSpacing } }));
  if (cfg.englishLabel) {
    ch.push(new Paragraph({
      bidirectional: true,
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
      children: [new TextRun({
        text: cfg.englishLabel.split("").join(" "), size: 18, color: P.accent,
        font: fontAll, characterSpacing: 40,
      })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    ch.push(new Paragraph({
      bidirectional: true,
      indent: { right: padR, left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({
        text: titleLines[i], rightToLeft: true, size: titlePt * 2, sizeComplexScript: titlePt * 2,
        bold: true, boldComplexScript: true, color: C.titleColor, font: fontAll,
      })],
    }));
  }
  if (cfg.subtitle) {
    ch.push(new Paragraph({
      bidirectional: true,
      indent: { right: padR, left: padL }, spacing: { after: 800, line: 340, lineRule: "atLeast" },
      children: [new TextRun({
        text: cfg.subtitle, rightToLeft: true, size: 24, sizeComplexScript: 24,
        color: C.subtitleColor, font: fontAll,
      })],
    }));
  }
  for (const line of (cfg.metaLines || [])) {
    ch.push(new Paragraph({
      bidirectional: true,
      indent: { right: padR + 200, left: padL }, spacing: { after: 80, line: 312 },
      border: { right: accentRight },
      children: [new TextRun({
        text: line, rightToLeft: true, size: 24, sizeComplexScript: 24,
        color: C.metaColor, font: fontAll,
      })],
    }));
  }
  ch.push(new Paragraph({ spacing: { before: sp.bottomSpacing } }));
  ch.push(new Paragraph({
    bidirectional: true,
    indent: { right: padR, left: padL },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: cfg.footerRight, rightToLeft: true, size: 16, sizeComplexScript: 16, color: C.footerColor, font: fontAll }),
      new TextRun({ text: "                                   ", font: fontAll, size: 16 }),
      new TextRun({ text: cfg.footerLeft, rightToLeft: true, size: 16, sizeComplexScript: 16, color: C.footerColor, font: fontAll }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.bg },
        borders: noBorders,
        children: ch,
      })],
    })],
  })];
}

/* ── بناء متن الأقسام ── */
function buildBody() {
  const out = [];
  let figNo = 0;
  const figures = [
    ["36_latin_digits_split.png", "شكل 1: لوحة الفصل بعمودين — شارات الصفحات بأرقام لاتينية وزر التنفيذ فوق عمود الفصل", 560],
    ["39_mobile_latin_digits.png", "شكل 2: الجوال 390 بكسل — الأرقام اللاتينية في كل الواجهة بعد تسويتة اليوم", 240],
  ];
  for (const sec of SECTIONS) {
    out.push(h1(sec.h1));
    for (const b of sec.blocks) {
      if (b.paras) for (const t of b.paras) out.push(body(t));
      if (b.bullets) for (const t of b.bullets) out.push(bullet(t));
      if (b.table) {
        out.push(caption(b.table.caption));
        out.push(tbl(b.table.headers, b.table.rows, b.table.widths));
        out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      }
      if (b.figure) {
        const f = figures[figNo % figures.length];
        out.push(...figure(f[0], f[1], f[2]));
        figNo++;
      }
    }
  }
  /* الأشكال: نضعها في قسم الوضع الحالي والأرقام */
  return out;
}

/* إدراج الشكلين داخل قسمي محددين: نعيد البناء بدقة */
function buildBodyWithFigures() {
  const out = [];
  for (const sec of SECTIONS) {
    out.push(h1(sec.h1));
    for (const b of sec.blocks) {
      if (b.paras) for (const t of b.paras) out.push(body(t));
      if (b.bullets) for (const t of b.bullets) out.push(bullet(t));
      if (b.table) {
        out.push(caption(b.table.caption));
        out.push(tbl(b.table.headers, b.table.rows, b.table.widths));
        out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      }
    }
    if (sec.h1.startsWith("الوضع الحالي")) {
      out.push(...figure(
        "36_latin_digits_split.png",
        "شكل 1: لوحة الفصل بعمودين — شارات الصفحات بأرقام لاتينية وزر التنفيذ فوق عمود الفصل", 555));
    }
    if (sec.h1.startsWith("الأرقام")) {
      /* قسم الأرقام غير موجود كقسم مستقل — الشكل الثاني يُدرج في قسم الوضع الحالي */
    }
    if (sec.h1.startsWith("تقرير الصور")) {
      out.push(...figure(
        "39_mobile_latin_digits.png",
        "شكل 2: واجهة الجوال 390 بكسل — الأرقام اللاتينية موحدة على كل الشاشات", 235));
    }
  }
  return out;
}

/* ── الترويسة والتذييل ── */
const bodyHeader = new Header({
  children: [new Paragraph({
    bidirectional: true, alignment: AlignmentType.CENTER,
    spacing: { after: 0, line: 240 },
    children: [run("مقترح تطوير منصة محوّل PDF — أكتوبر 2026", { size: 18, color: "808080" })],
  })],
});
const bodyFooter = new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, line: 240 },
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: fontAll })],
  })],
});

/* ── الوثيقة ── */
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1417, right: 1417 };

const doc = new Document({
  creator: "محوّل PDF",
  title: "مقترح تطوير منصة محوّل PDF",
  description: "مقترح مزيج أكروبات × كانفا وتقرير النواقص والأفكار المقترحة",
  styles: {
    default: {
      document: {
        run: { font: fontAll, size: 22, color: P.body },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: fontAll, size: 30, bold: true, color: P.headingColor },
        paragraph: { spacing: { before: 380, after: 160 }, outlineLevel: 0 },
      },
      heading2: {
        run: { font: fontAll, size: 26, bold: true, color: P.headingColor },
        paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1 },
      },
    },
  },
  sections: [
    { /* 1) الغلاف — هامش صفر، بلا ترويسة أو ترقيم */
      properties: { page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR1RTL({
        englishLabel: "PRODUCT DEVELOPMENT PROPOSAL",
        title: "مقترح تطوير منصة محوّل PDF",
        subtitle: "مزيج أكروبات × كانفا — تقرير مفصل للنواقص والأفكار المقترحة قبل التنفيذ",
        metaLines: [
          "الإعداد: فريق تطوير محوّل PDF",
          "التاريخ: 24 أكتوبر 2026",
          "الحالة: بانتظار اعتمادك لتسلسل المراحل",
        ],
        footerRight: "كل الشغل داخل متصفحك — ملفاتك لا تغادر جهازك",
        footerLeft: "أكتوبر 2026",
      }),
    },
    { /* 2) المحتويات — بلا ترقيم ظاهر */
      properties: { type: SectionType.NEXT_PAGE, page: { size: pgSize, margin: pgMargin } },
      children: [
        new Paragraph({
          bidirectional: true, alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 360, line: 400, lineRule: "atLeast" },
          children: [run("المحتويات", { size: 32, bold: true, color: P.headingColor })],
        }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({
          bidirectional: true, spacing: { before: 200, line: 276 },
          children: [run("ملاحظة: هذه الفهرسة مولدة بحقول تلقائية — لضمان دقة أرقام الصفحات بعد أي تعديل، انقر عليها بزر الفأرة الأيمن واختر «تحديث الحقل».", { size: 18, color: "888888", italics: true })],
        }),
      ],
    },
    { /* 3) المتن — ترقيم لاتيني يبدأ من 1 */
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: { default: bodyHeader },
      footers: { default: bodyFooter },
      children: buildBodyWithFigures(),
    },
  ],
});

const OUT = "/home/z/my-project/download/مقترح-تطوير-منصة-محوّل-PDF.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log("SAVED:", OUT, buf.length, "bytes");
});
