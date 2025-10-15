self.addEventListener('install', event => {
  event.waitUntil(caches.open('mms-precache-dev').then(cache => cache.addAll(['/'])));
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.destination === 'style' || req.destination === 'script' || req.destination === 'image' || req.destination === 'font') {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open('mms-runtime-dev').then(cache => cache.put(req, copy));
        return res;
      }))
    );
    return;
  }
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/')));
  }
});
