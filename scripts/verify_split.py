# تحقق مادي من نواتج «فصل» — المفصولة = صفحات ٢ و٤، المتبقية = ١ و٣ و٥
import fitz

def nums(doc):
    res = []
    for p in doc:
        words = p.get_text().split()
        for i, w in enumerate(words):
            if w == "PAGE" and i + 1 < len(words) and words[i + 1].isdigit():
                res.append(int(words[i + 1]))
    return res

sep = fitz.open("/tmp/separated.pdf")
rem = fitz.open("/tmp/remainder.pdf")
print("المفصولة: عدد الصفحات =", sep.page_count, "→ صفحات:", nums(sep))
print("المتبقية: عدد الصفحات =", rem.page_count, "→ صفحات:", nums(rem))

assert nums(sep) == [2, 4], f"WRONG separated: {nums(sep)}"
assert nums(rem) == [1, 3, 5], f"WRONG remainder: {nums(rem)}"
print("✅ VERIFIED: المفصولة = صفحة ٢ و٤ — المتبقية = صفحة ١ و٣ و٥")
