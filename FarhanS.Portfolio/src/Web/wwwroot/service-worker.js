// This is the production service worker for FarhanS.Portfolio
// It provides offline support and caching for better performance

// Increment this version when you update your service worker
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `farhans-portfolio-${CACHE_VERSION}`;

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

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // For non-API and non-navigational requests, use a "Cache First" strategy
  if (!event.request.url.includes('/api/') && !isNavigationRequest(event.request)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Return cached response
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request).then(response => {
          // Don't cache responses from external domains
          if (!response.ok || !event.request.url.startsWith(self.location.origin)) {
            return response;
          }
          
          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();
          
          // Update the cache with the new response
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        }).catch(error => {
          // If both cache and network fail, show a default offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          // For non-navigational requests, just propagate the error
          throw error;
        });
      })
    );
  } else {
    // For API requests and navigation, use a "Network First" strategy
    // This ensures users always get the latest data/pages when online
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          // Return cached response or the offline page
          return cachedResponse || caches.match('/index.html');
        });
      })
    );
  }
});

// Determine if a request is a navigation request
function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept').includes('text/html'))
  );
}

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
