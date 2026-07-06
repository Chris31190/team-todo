// Service Worker für Team To-do PWA
const CACHE = "team-todo-v1";
const SHELL = [
  "./",
  "./index.html",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.webmanifest"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Supabase-Anfragen niemals cachen (immer live)
  if (url.hostname.endsWith("supabase.co")) return;
  if (e.request.method !== "GET") return;
  // App-Shell (gleiche Origin): cache-first, im Hintergrund aktualisieren
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const net = fetch(e.request).then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || net;
      })
    );
  }
});
