/* Software Engineer LIFE — offline cache. Network-first (3.5 s timeout) so deploys show up instantly,
 * with a cache fallback so the game still opens on bad event Wi-Fi. */
const V = 'sel-v3';
const CORE = ['./', 'index.html', 'css/game.css', 'js/data.js', 'js/engine.js', 'js/render.js', 'js/audio.js', 'js/app.js', 'icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  const key = new Request(u.origin + u.pathname);   // ignore ?s=…&from=… so we keep one entry per file
  e.respondWith((async () => {
    const cache = await caches.open(V);
    try {
      const net = await Promise.race([fetch(r, { cache: 'no-cache' }), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500))]);
      if (net && net.ok) cache.put(key, net.clone());
      return net;
    } catch (err) {
      const hit = await cache.match(key);
      if (hit) return hit;
      if (r.mode === 'navigate') return cache.match('index.html');
      throw err;
    }
  })());
});
