// Dijital Muhtar - Service Worker v1.0
const CACHE_NAME = "dijital-muhtar-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
];

const CACHE_STRATEGIES = {
  // Cache-first (static assets, fonts)
  cacheFirst: [
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "unpkg.com/leaflet",
    "tur.traineddata",
    "/icons/",
    "/assets/",
  ],
  // Network-first (API calls, map tiles)
  networkFirst: [
    "overpass-api.de",
    "tile.openstreetmap.org",
    "generativelanguage.googleapis.com",
  ],
  // Stale-while-revalidate
  staleWhileRevalidate: [
    "unpkg.com",
    "cdnjs.cloudflare.com",
  ],
};

// ── Install ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activate ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ── Fetch ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension
  if (request.method !== "GET" || url.protocol === "chrome-extension:") return;

  // Determine strategy
  const isCacheFirst = CACHE_STRATEGIES.cacheFirst.some((p) => request.url.includes(p));
  const isNetworkFirst = CACHE_STRATEGIES.networkFirst.some((p) => request.url.includes(p));
  const isStaleWhileRevalidate = CACHE_STRATEGIES.staleWhileRevalidate.some((p) => request.url.includes(p));

  if (isCacheFirst) {
    event.respondWith(cacheFirst(request));
  } else if (isNetworkFirst) {
    event.respondWith(networkFirst(request));
  } else if (isStaleWhileRevalidate) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Default: network-first for HTML, cache-first for others
    if (request.headers.get("Accept")?.includes("text/html")) {
      event.respondWith(networkFirst(request));
    } else {
      event.respondWith(cacheFirst(request));
    }
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Çevrimdışı - İçerik yüklenemiyor.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Offline fallback for navigation
    if (request.headers.get("Accept")?.includes("text/html")) {
      return caches.match("/") || new Response("Çevrimdışısınız.", { status: 503 });
    }
    return new Response("Çevrimdışı", { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
    }
    return response;
  });
  return cached || fetchPromise;
}

// ── Background Sync (offline form submissions) ──
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-petitions") {
    console.log("[SW] Background sync: petitions");
  }
});

// ── Push Notifications ──
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || "Yeni bildirim",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    lang: "tr",
    dir: "ltr",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "Dijital Muhtar", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/")
  );
});
