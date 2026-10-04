/* Hotel System service worker: offline app shell. Data lives on-device (localStorage) in mock mode. */
const CACHE = "hotel-system-v8";
const SHELL = ["/dashboard", "/dashboard/madeni", "/dashboard/mauzo", "/dashboard/msaidizi", "/dashboard/oda", "/dashboard/matumizi", "/dashboard/zaidi", "/dashboard/menu", "/dashboard/stock", "/dashboard/ripoti", "/dashboard/reconcile", "/dashboard/settings", "/onboarding", "/icon.svg", "/icon-192.png", "/icon-512.png", "/icon-maskable.png", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET" || new URL(request.url).pathname.startsWith("/api/")) return;
  // Network-first for navigations (cache fallback offline); stale-while-revalidate for assets.
  if (request.mode === "navigate") {
    e.respondWith(fetch(request).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); return res; }).catch(() => caches.match(request).then((r) => r || caches.match("/dashboard"))));
    return;
  }
  e.respondWith(caches.match(request).then((cached) => {
    const net = fetch(request).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); } return res; }).catch(() => cached);
    return cached || net;
  }));
});
