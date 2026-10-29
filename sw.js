const CACHE_NAME = 'romano-bloub-v3';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 安裝時預先快取核心外殼與外部樣式庫
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        CORE_ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    })
  );
});

// 啟動時清理舊版快取並立即接管頁面
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// 攔截請求：API 請求不快取；網頁與資源採用「網路優先 -> 失敗秒讀手機快取」
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Google Apps Script API 交由前端的離線佇列處理
  if (req.method !== 'GET' || req.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // 有網路時：抓最新檔案並順手更新進手機快取
        if (networkRes && (networkRes.status === 200 || networkRes.type === 'opaque')) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkRes;
      })
      .catch(() => {
        // 沒網路時：0.01 秒直接從手機快取拿出來，絕不跳 You're offline
        return caches.match(req).then((cachedRes) => {
          if (cachedRes) return cachedRes;
          if (req.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
        });
      })
  );
});
