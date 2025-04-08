// This is the production service worker for FarhanS.Portfolio
// It provides offline support and caching for better performance

// Increment this version when you update your service worker
// Added timestamp to automatically refresh on each deployment
const CACHE_VERSION = 'v1.0.1';
// Use dynamic timestamp to force cache refresh on new deployments
const BUILD_TIMESTAMP = new Date().getTime();
const CACHE_NAME = `farhans-portfolio-${CACHE_VERSION}-${BUILD_TIMESTAMP}`;

// Assets to cache on install
// Add or remove assets based on your application's needs
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/FarhanS.Portfolio.styles.css',
  '/lib/bootstrap/dist/css/bootstrap.min.css',
  '/favicon.png',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/_framework/blazor.webassembly.js',
  '/service-worker-assets.js'
];

// Install event - precache all essential assets
self.addEventListener('install', event => {
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service worker pre-caching assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('farhans-portfolio-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Service worker removing old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Immediately claim clients so the updated service worker controls all pages
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network with improved refresh logic
self.addEventListener('fetch', event => {
  // Check for service-worker-assets.js which contains file hashes
  if (event.request.url.includes('service-worker-assets.js')) {
    // Always get the latest assets manifest from the network
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Check for framework files to ensure we get the latest version
  if (event.request.url.includes('/_framework/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        // Cache the new framework files
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Fall back to cache if network fails
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // For HTML navigation requests use a "Network First" strategy to ensure fresh content
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request).then(response => {
        // Clone the response as it can only be consumed once
        const responseToCache = response.clone();
        
        // Update the cache with the new response
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Fall back to cache if network fails
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || caches.match('/index.html');
        });
      })
    );
    return;
  }

  // For non-API requests, use a "Cache First" strategy but with network update
  if (!event.request.url.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        // Start a network fetch to update the cache in the background
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Don't cache responses from external domains or failed responses
          if (networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
            // Update the cache with the new response
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          // Silently fail if network fetch fails - we'll use cache instead
          return null;
        });
        
        // Return cached response immediately if available
        // If not, wait for the network response
        return cachedResponse || fetchPromise;
      })
    );
  } else {
    // For API requests, use a "Network First" strategy
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});

// Determine if a request is a navigation request
function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept') &&
      request.headers.get('accept').includes('text/html'))
  );
}

// Add a message listener to handle version checks and updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_VERSION') {
    // Respond with current cache version
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      timestamp: BUILD_TIMESTAMP
    });
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    // Skip waiting and activate immediately when requested
    self.skipWaiting();
  }
});

// Optional: Sync event for background syncing when back online
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    // Implement background sync logic here if needed
    console.log('Service worker performing background sync');
  }
});

// Handle push notifications if your app uses them
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data
    };
    
    event.waitUntil(
      self.registration.showNotification('FarhanS.Portfolio', options)
    );
  }
});
