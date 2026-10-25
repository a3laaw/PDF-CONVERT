/* عامل الخدمة لمحوّل PDF — ذاكرة ذكية تحافظ على الشغل بدون إنترنت
 * القواعد:
 *  - التنقلات (HTML): الشبكة أولًا ثم الذاكرة — الصفحة دايمًا أحدث نسخة
 *  - الأصول المبطنة بـ/_next/static والخطوط والأيقونات: الذاكرة أولًا (روابط مُبطنة بالمحتوى)
 *  - عمال/wasm الكبيرة (/workers/): ذاكرة أولًا — تحميلها مرة واحدة يكفي للأبد تقريبًا
 *  - البقية same-origin GET: stale-while-revalidate
 *  - ما لا نلمسه أبدًا: /api/ وHMR (webpack-hmr/hot-update) وأي طلب غير GET — حتى لا نكسر التطوير
 */
const VERSION = "pdfc-v3";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const BIG = `${VERSION}-big`;

const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(new Request(u, { cache: "reload" })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/** هل هذا المسار يُمنع من التدخل كليًا (تطوير/واجهات برمجية)؟ */
const BYPASS_RE = /\/api\/|webpack-hmr|hot-update|_next\/original|__nextjs|\/__next|turbopack-hmr/;

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (BYPASS_RE.test(url.pathname)) return;

  /* التنقل: شبكة أولًا، وعند الفشل — الصفحة من الذاكرة (شغل بدون إنترنت) */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put("/", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("/", { ignoreSearch: true }).then((r) => r || Response.error()))
    );
    return;
  }

  /* عمال/wasm الكبيرة: ذاكرة أولًا (ملفات ثابتة بالاسم) */
  if (url.pathname.startsWith("/workers/")) {
    event.respondWith(
      caches.open(BIG).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone()).catch(() => {});
        return res;
      })
    );
    return;
  }

  /* الأيقونات والخطوط: ذاكرة أولًا — أسماء ثابتة لا تتغير */
  const cacheFirst =
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/logo.svg" ||
    url.pathname.startsWith("/fonts/");

  if (cacheFirst) {
    event.respondWith(
      caches.open(ASSETS).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok && res.type === "basic") c.put(req, res.clone()).catch(() => {});
        return res;
      })
    );
    return;
  }

  /* chunks التطبيق: شبكة أولًا وذاكرة رجوعًا — روابطها ثابتة في وضع التطوير
   * فلا يجوز تقديم نسخة قديمة منها، وفي الإنتاج المبطّن التجزئة تحمينا أصلًا */
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(ASSETS).then(async (c) => {
        try {
          const res = await fetch(req);
          if (res.ok && res.type === "basic") c.put(req, res.clone()).catch(() => {});
          return res;
        } catch {
          const hit = await c.match(req);
          return hit || Response.error();
        }
      })
    );
    return;
  }

  /* البقية (ملفات عامة مثل t.dxf): قديم-بينما-جديد — سرعة ثم تحديث صامت */
  event.respondWith(
    caches.open(ASSETS).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req)
        .then((res) => {
          if (res.ok && res.type === "basic") c.put(req, res.clone()).catch(() => {});
          return res;
        })
        .catch(() => hit || Response.error());
      return hit || net;
    })
  );
});
