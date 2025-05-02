// Script to fix service worker issues for home screen app
(function() {
  // Service worker URL
  const SW_URL = '/sw.js';
  
  // Register the service worker with the correct scope
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(SW_URL, { 
        scope: '/' 
      })
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Check if we need to update the service worker
        if (registration.active) {
          registration.update().then(() => {
            console.log('Service Worker update check complete');
          }).catch(err => {
            console.error('Service Worker update failed:', err);
          });
        }
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
      
      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New service worker activated, reloading for fresh content');
        window.location.reload();
      });
    }
  }
  
  // Prefetch common app routes for offline use
  function prefetchRoutes() {
    if (!('serviceWorker' in navigator)) return;
    
    // Routes to prefetch
    const routesToPrefetch = [
      '/',
      '/history',
      '/devotion/history',
      '/auth/login'
    ];
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayFormatted = `${yyyy}-${mm}-${dd}`;
    
    // Also prefetch today's devotion
    routesToPrefetch.push(`/devotion/${todayFormatted}`);
    routesToPrefetch.push(`/devotion/${todayFormatted}/reflection`);
    routesToPrefetch.push(`/devotion/${todayFormatted}/journal`);
    
    // Prefetch each route
    routesToPrefetch.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
      console.log(`Prefetching route: ${route}`);
    });
  }
  
  // Fix for history API usage in PWA mode
  function fixHistoryNavigation() {
    // Save original pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    // Create wrappers that handle URL storage in sessionStorage
    history.pushState = function(state, title, url) {
      // Store the URL we're navigating to
      if (url) {
        try {
          sessionStorage.setItem('lastNavigatedUrl', url);
        } catch (e) {
          console.warn('Could not save navigation state:', e);
        }
      }
      return originalPushState.apply(this, arguments);
    };
    
    history.replaceState = function(state, title, url) {
      // Store the URL we're navigating to
      if (url) {
        try {
          sessionStorage.setItem('lastNavigatedUrl', url);
        } catch (e) {
          console.warn('Could not save navigation state:', e);
        }
      }
      return originalReplaceState.apply(this, arguments);
    };
    
    // Handle page reloads to restore last URL
    window.addEventListener('load', () => {
      try {
        const lastUrl = sessionStorage.getItem('lastNavigatedUrl');
        if (lastUrl && window.location.pathname === '/' && !window.location.search) {
          console.log('Restoring navigation to:', lastUrl);
          history.replaceState(null, '', lastUrl);
        }
      } catch (e) {
        console.warn('Could not restore navigation state:', e);
      }
    });
  }
  
  // Add firebase persistence configuration for offline use
  function configureFirebasePersistence() {
    // This function will be invoked by the app after Firebase is loaded
    window.FIREBASE_PERSISTENCE_CONFIG = {
      enablePersistence: true,
      persistenceSettings: {
        synchronizeTabs: true
      }
    };
  }
  
  // Run all fixes
  function applyAllFixes() {
    registerServiceWorker();
    prefetchRoutes();
    fixHistoryNavigation();
    configureFirebasePersistence();
    
    console.log('Service worker fixes applied');
  }
  
  // Apply fixes after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAllFixes);
  } else {
    applyAllFixes();
  }
})(); 