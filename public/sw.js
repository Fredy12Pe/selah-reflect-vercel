// Service Worker for Selah Devotion PWA
const CACHE_NAME = 'selah-devotion-cache-v1';
const STATIC_CACHE_NAME = 'selah-devotion-static-v1';
const API_CACHE_NAME = 'selah-devotion-api-v1';

// Static files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/images/logo.png',
  '/images/logo192.png',
  '/images/logo512.png',
  '/hymn-bg.jpg',
  '/resources-bg.jpg'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker installing');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('selah-devotion-') && 
                 cacheName !== STATIC_CACHE_NAME &&
                 cacheName !== API_CACHE_NAME;
        }).map(cacheName => {
          console.log('Service Worker: Deleting old cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper function to check if a request is an API call
const isAPIRequest = (url) => {
  return url.includes('/api/') || 
         url.includes('api.esv.org') ||
         url.includes('bible-api.com');
};

// Helper function to check if a request is for a static asset
const isStaticAsset = (url) => {
  return url.endsWith('.js') ||
         url.endsWith('.css') ||
         url.endsWith('.png') ||
         url.endsWith('.jpg') ||
         url.endsWith('.jpeg') ||
         url.endsWith('.svg') ||
         url.endsWith('.ico') ||
         url.endsWith('.json') ||
         url.endsWith('.woff') ||
         url.endsWith('.woff2');
};

// Fetch event - network-first for API, cache-first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and browser extension requests
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle API requests (network-first strategy)
  if (isAPIRequest(url.href)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to save it in cache and return it
          const responseToCache = response.clone();
          
          // Only cache successful responses
          if (response.status === 200) {
            caches.open(API_CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle static assets (cache-first strategy)
  if (isStaticAsset(url.href)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cache but update in background
            const fetchPromise = fetch(event.request).then(response => {
              // Only cache valid responses
              if (response.status === 200) {
                const responseToCache = response.clone();
                caches.open(STATIC_CACHE_NAME).then(cache => {
                  cache.put(event.request, responseToCache);
                });
              }
              return response;
            }).catch(() => {
              // Swallow network errors when refreshing cache
            });
            
            // Return the cached response immediately
            return cachedResponse;
          }
          
          // If not in cache, fetch from network and cache
          return fetch(event.request)
            .then(response => {
              // Clone the response to save it in cache and return it
              const responseToCache = response.clone();
              
              if (response.status === 200) {
                caches.open(STATIC_CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              
              return response;
            });
        })
    );
    return;
  }
  
  // Default strategy for other requests (network with cache fallback)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses from navigation requests
        if (response.status === 200 && event.request.mode === 'navigate') {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Try to serve from cache, and if that fails, show offline page
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // For navigation requests, show a generic offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            // Otherwise just fail
            return new Response('Network error', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
}); 