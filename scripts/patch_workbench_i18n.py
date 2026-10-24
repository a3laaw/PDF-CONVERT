"""ترجمة دفعات نصوص workbench المتبقية — تعديل نصي دقيق."""
p = "src/components/pdf-station/workbench.tsx"
s = open(p, encoding="utf-8").read()

s = s.replace(
    'label={`حذف الصفحة ${toHindiDigits(i + 1)}`}',
    'label={`${t("qp.delete")} ${toHindiDigits(i + 1)}`}'
)
s = s.replace(
    'label={`تدوير الصفحة ${toHindiDigits(i + 1)} 90°`}',
    'label={`${t("qp.rotate")} ${toHindiDigits(i + 1)} 90°`}'
)
s = s.replace(
    'label={`استخراج الصفحة ${toHindiDigits(i + 1)}`}',
    'label={`${t("qp.extract")} ${toHindiDigits(i + 1)}`}'
)
s = s.replace(
    'label={`تكرار الصفحة ${toHindiDigits(i + 1)}`}',
    'label={`${t("qp.duplicate")} ${toHindiDigits(i + 1)}`}'
)
s = s.replace('aria-label="الصفحة السابقة"', 'aria-label={t("qp.prevPage")}')
s = s.replace('aria-label="الصفحة التالية"', 'aria-label={t("qp.nextPage")}')
s = s.replace(
    'تُحفظ باسم <b className="text-xs text-foreground">{expectedName}</b>',
    '{t("ws.savedAs")} <b className="text-xs text-foreground">{expectedName}</b>'
)
s = s.replace(
    'جاهز — {toHindiDigits(results.length)} {results.length === 1 ? t("msg.fileLabel") : t("ws.readyMany")}',
    '{t("ws.ready")} — {toHindiDigits(results.length)} {results.length === 1 ? t("ws.readyOne") : t("ws.readyMany")}'
)
s = s.replace("تحميل الكل (ZIP)", '{t("ws.downloadAll")}')
s = s.replace("رجوع للشغل", '{t("ws.backToWork")}')
s = s.replace(
    """                      className="shrink-0 bg-emerald-600 font-extrabold text-white hover:bg-emerald-700"
                    >
                      تحميل
                    </Button>""",
    """                      className="shrink-0 bg-emerald-600 font-extrabold text-white hover:bg-emerald-700"
                    >
                      {t("ws.download")}
                    </Button>"""
)
s = s.replace(
    "<span aria-hidden>{TOOLS_BY_ID[tool].emoji}</span>\n                  {TOOLS_BY_ID[tool].name}",
    '<span aria-hidden>{TOOLS_BY_ID[tool].emoji}</span>\n                  {t(toolKey(tool, "name"))}'
)
s = s.replace('{running ? "جارٍ التنفيذ…" : actionLabel(tool)}', '{running ? t("verb.running") : actionLabel(tool)}')

open(p, "w", encoding="utf-8").write(s)
print("done")
