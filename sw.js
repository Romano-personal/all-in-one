const CACHE_NAME = 'v1.0.1';
const urlsToCache = [
  './',
  './index.html'
];

// 安裝並快取核心檔案
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 攔截網路請求，優先使用快取（讓 App 載入更快，且支援離線開啟介面）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request);
      })
  );
});
