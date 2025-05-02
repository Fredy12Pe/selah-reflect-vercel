// Service Worker for Selah Devotion PWA
const CACHE_NAME = 'selah-devotion-cache-v2';
const STATIC_CACHE_NAME = 'selah-devotion-static-v2';
const API_CACHE_NAME = 'selah-devotion-api-v2';

// Static files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/images/logo.png',
  '/images/hymn-bg.jpg',
  '/images/resources-bg.jpg',
  '/fallback.html',
  '/auth/login'
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

// Helper to check if this is a history or devotion page navigation
const isAppNavigation = (url) => {
  return url.includes('/history') || 
         url.includes('/devotion/');
};

// Fetch event - improved handling for PWA installed version
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and browser extension requests
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // For navigation requests in PWA mode, always go to index.html first
  if (event.request.mode === 'navigate' && isAppNavigation(url.href)) {
    event.respondWith(
      caches.match('/')
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached index page for client-side routing
            return cachedResponse;
          }
          // Fall back to network if not cached
          return fetch(event.request);
        })
        .catch(() => {
          // If both cache and network fail, return cached fallback page
          return caches.match('/fallback.html') || 
                 new Response('Network error', { status: 503 });
        })
    );
    return;
  }
  
  // Handle API requests (network-first with improved error handling)
  if (isAPIRequest(url.href)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to save it in cache and return it
          const responseToCache = response.clone();
          
          // Cache successful responses
          if (response.status === 200) {
            caches.open(API_CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        })
        .catch(error => {
          console.log('API fetch failed, trying cache:', error);
          // If network fails, try to serve from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Return a custom offline response for API requests
              return new Response(JSON.stringify({
                error: 'You are offline. Please check your connection and try again.',
                offline: true,
                errorMessage: error.message
              }), {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'application/json'
                })
              });
            });
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
            // Return cache immediately
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
            })
            .catch(error => {
              console.error('Failed to fetch static asset:', error);
              // For image failures, return a transparent pixel
              if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
                return new Response(
                  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                  {
                    status: 200,
                    statusText: 'OK',
                    headers: new Headers({
                      'Content-Type': 'image/gif',
                      'Content-Length': '42',
                    })
                  }
                );
              }
              throw error;
            });
        })
    );
    return;
  }
  
  // Default strategy for other requests (network with cache fallback)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful responses
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Try to serve from cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // For navigation requests, show a fallback page
            if (event.request.mode === 'navigate') {
              return caches.match('/fallback.html') || caches.match('/');
            }
            
            // Otherwise return an error response
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