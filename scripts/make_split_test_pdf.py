# ملف PDF تجريبي ٥ صفحات بأرقام كبيرة — لاختبار أداة «فصل» بالعمودين
import fitz

out = "/home/z/my-project/public/t_split5.pdf"
doc = fitz.open()
colors = [(0.9, 0.3, 0.3), (0.2, 0.5, 0.9), (0.2, 0.7, 0.4), (0.9, 0.7, 0.1), (0.6, 0.3, 0.8)]
for i in range(5):
    page = doc.new_page(width=595, height=842)
    c = colors[i]
    page.draw_rect(page.rect, color=c, width=6)
    page.insert_text((200, 420), f"PAGE {i+1}", fontsize=72, color=c)
    page.insert_text((230, 480), f"صفحة {i+1}", fontsize=36, color=c)
doc.save(out)
print("saved", out, doc.page_count)
