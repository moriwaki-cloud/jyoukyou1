const CACHE_NAME = "joukyo-phrase-app-v4";
const ASSETS = [
  "./",
  "index.html",
  "style.css",
  "treatments.json",
  "manifest.json",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "js/storage.js",
  "js/nav.js",
  "js/treatment.js",
  "js/institution.js",
  "js/clinic.js",
  "js/finalpreview.js",
  "js/main.js"
];

// PDF生成に必要なCDNライブラリ。オフラインでのPDF作成を可能にするため
// ベストエフォートで先読みキャッシュするが、失敗してもコア機能のインストールは妨げない。
const CDN_ASSETS = [
  "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.2/dist/html2pdf.bundle.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(ASSETS);
      await Promise.all(
        CDN_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn("CDN precache failed:", url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
