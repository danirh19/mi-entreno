/* Mi Entreno — service worker · estrategia "red primero" con respaldo offline.
   Objetivo: que al abrir la app siempre se cargue la última versión publicada,
   y si no hay conexión, se use la última guardada. */
const CACHE = "mientreno-cache-v1";

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./"]).catch(() => {})));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;                 // no tocar POST (sincronización)
  const sameOrigin = req.url.indexOf(self.location.origin) === 0;

  e.respondWith(
    fetch(req).then(res => {
      if (sameOrigin && res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() =>
      caches.match(req).then(m => m || (req.mode === "navigate" ? caches.match("./") : Response.error()))
    )
  );
});
