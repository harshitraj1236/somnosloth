const CACHE_NAME = "somnosloth-v2";

const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/icon.svg"
];

// Install: precache app shell and skip waiting immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old stale caches (purges somnosloth-v1) and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First for navigation (HTML), Cache-First for static assets
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only intercept GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip non-http schemes, dev websocket / HMR, and Next.js internal dev routes
  if (!url.protocol.startsWith("http")) return;
  if (
    url.pathname.includes("webpack-hmr") ||
    url.pathname.includes("__nextjs") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // 1. Navigation requests (HTML document): Network-First with Cache Fallback
  // When online: loads fresh HTML and updates cache (prevents stale HTML hydration mismatch)
  // When offline: falls back smoothly to cached HTML
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match("/");
        })
    );
    return;
  }

  // 2. Next.js Static Assets (_next/static, css, js chunks, fonts, icons)
  // Cache-First with Dynamic Network Caching
  // Ensures ALL chunks, styles, and fonts are available in offline mode
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".json") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Fallback if offline and asset not yet cached
          return cachedResponse;
        });
      })
    );
    return;
  }

  // 3. All other requests: Network with fallback to cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
