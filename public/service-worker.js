// Nixelo Service Worker
const CACHE_NAME = "nixelo-v2"; // Bump version for push notification support
const OFFLINE_URL = "/offline.html";

// Assets to cache on install
const STATIC_ASSETS = ["/", "/offline.html", "/manifest.json"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Nixelo Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

// Handle incoming push notifications
self.addEventListener("push", async (event) => {
  console.log("Push notification received");

  if (!event.data) {
    console.log("Push event but no data");
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (e) {
    console.error("Failed to parse push data:", e);
    return;
  }

  const { title, body, icon, data, tag, actions, requireInteraction } = notificationData;

  const options = {
    body: body || "You have a new notification",
    icon: icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: data || {},
    tag: tag || `nixelo-${Date.now()}`,
    renotify: true,
    requireInteraction: requireInteraction ?? false,
    actions: actions || [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title || "Nixelo", options));
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification.tag);

  event.notification.close();

  const url = event.notification.data?.url || "/";

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case "view":
        // Default: open the URL
        break;
      case "dismiss":
        // Just close the notification (already done above)
        return;
      default:
        // Unknown action, open URL
        break;
    }
  }

  // Focus existing window or open new one
  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Try to focus an existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Open new window if no existing window found
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});

// Handle notification close (dismissed without clicking)
self.addEventListener("notificationclose", (event) => {
  console.log("Notification dismissed:", event.notification.tag);
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            return caches.delete(cacheName);
          }),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response because it can only be consumed once
        const responseToCache = response.clone();

        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If the request is for a page and not in cache, show offline page
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }

          // For other requests, return a basic offline response
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({
              "Content-Type": "text/plain",
            }),
          });
        });
      }),
  );
});

// Handle messages from the app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        return self.clients.claim();
      }),
    );
  }
});
