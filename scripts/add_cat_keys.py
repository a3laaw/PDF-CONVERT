"""إضافة مفاتيح كتالوج الأدوات للقواميس الثلاثة."""
import io

BLOCKS = {
    "src/lib/i18n/ar.ts": '''
  /* كتالوج الأدوات */
  "cat.heading1": "كل الأدوات",
  "cat.heading2": "في خدمتك",
  "cat.sub": "اختر أداة لتضيفها خطوة في مساحة العمل — أو اكتب طلبك بالعربية ودع المحطة تفهمك",
  "cat.searchPlaceholder": "ابحث في الأدوات… دمج، ختم، تدوير",
  "cat.search": "بحث في الأدوات",
  "cat.favorites": "المفضلة",
  "cat.new": "جديد",
  "cat.fav": "إضافة",
  "cat.unfav": "إزالة",
  "cat.addStep": "إضافة للخطوات",
  "cat.addedStep": "أُضيفت خطوة",
  "cat.addedStepHint": "اضبط تفاصيلها من عمود الخطوات",
  "cat.noMatch": "لا توجد أدوات مطابقة — جرّب كلمة أخرى مثل «دمج» أو «ختم»",
''',
    "src/lib/i18n/en.ts": '''
  "cat.heading1": "All",
  "cat.heading2": "tools at your service",
  "cat.sub": "Pick a tool to add it as a step in the workspace — or just type what you need",
  "cat.searchPlaceholder": "Search tools… merge, stamp, rotate",
  "cat.search": "Search tools",
  "cat.favorites": "Favorites",
  "cat.new": "New",
  "cat.fav": "Add to favorites",
  "cat.unfav": "Remove from favorites",
  "cat.addStep": "Add as step",
  "cat.addedStep": "Step added",
  "cat.addedStepHint": "Set its details from the steps panel",
  "cat.noMatch": "No matching tools — try another word like \u201cmerge\u201d or \u201cstamp\u201d",
''',
    "src/lib/i18n/hi.ts": '''
  "cat.heading1": "सारे",
  "cat.heading2": "टूल्स आपकी सेवा में",
  "cat.sub": "कोई टूल चुनकर उसे वर्कस्पेस में स्टेप बनाएँ — या सीधे लिखें आपको क्या चाहिए",
  "cat.searchPlaceholder": "टूल्स खोजें… मिलाना, स्टाम्प, घुमाना",
  "cat.search": "टूल्स खोजें",
  "cat.favorites": "पसंदीदा",
  "cat.new": "नया",
  "cat.fav": "पसंदीदा में जोड़ें",
  "cat.unfav": "पसंदीदा से हटाएँ",
  "cat.addStep": "स्टेप जोड़ें",
  "cat.addedStep": "स्टेप जुड़ गया",
  "cat.addedStepHint": "स्टेप्स पैनल से डिटेल सेट करें",
  "cat.noMatch": "कोई टूल नहीं मिला — दूसरा शब्द आज़माएँ",
''',
}

ANCHOR = '"lang.label"'
for path, block in BLOCKS.items():
    s = io.open(path, encoding="utf-8").read()
    if '"cat.heading1"' in s:
        print("already patched:", path)
        continue
    assert ANCHOR in s, path
    s = s.replace(ANCHOR, block + "\n  " + ANCHOR, 1)
    io.open(path, "w", encoding="utf-8").write(s)
    print("patched", path)
