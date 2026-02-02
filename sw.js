/* Ventanas Rey - Service Worker (offline completo, cache seguro) */
const CACHE_VERSION = 'vr-v1.2.0';
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png",
  "./offline.html",
  "./ventana.html",
  "./cierre.html",
  "./rejilla.html",
  "./poligono.html",
  "./guillotina.html",
  "./estructura.html",
  "./grados.html",
  "./paleta.html",
  "./barras.html",
  "./chapas.html",
  "./reja.html",
  "./optimizar_chapa.html",
  "./optimizar_barra.html",
  "./presupuestos.html"
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // Cacheo seguro: si falta algún archivo, no rompe la instalación
    await Promise.allSettled(PRECACHE_URLS.map(async (u) => {
      try { await cache.add(u); } catch (e) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_VERSION ? caches.delete(k) : Promise.resolve())));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo mismo origen
  if (url.origin !== self.location.origin) return;

  // Navegación (HTML): red primero, luego caché, luego offline
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const copy = res.clone();
        const cache = await caches.open(CACHE_VERSION);
        cache.put(req, copy);
        return res;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || caches.match('./offline.html');
      }
    })());
    return;
  }

  // Recursos: caché primero, luego red; guarda si OK
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const res = await fetch(req);
      if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
        const copy = res.clone();
        const cache = await caches.open(CACHE_VERSION);
        cache.put(req, copy);
      }
      return res;
    } catch (e) {
      return caches.match('./offline.html');
    }
  })());
});
