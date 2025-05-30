const CACHE_NAME = 'linksense-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/settings',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icons/icon-192x192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにある場合はそれを返す
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// プッシュ通知の処理
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'LinkSenseからの通知',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '詳細を見る',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('LinkSense', options)
  );
});