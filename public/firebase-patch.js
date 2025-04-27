// Firebase patch script for Next.js
(function() {
  // Ensure Firebase modules are initialized properly
  if (typeof window !== 'undefined') {
    // Create required Firebase globals if missing
    window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3___isFirebaseServerApp = 
      window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3___isFirebaseServerApp || 
      function() { return false; };
      
    // Fix for potential SSR hydration issues
    window.__FIREBASE_DEFAULTS__ = window.__FIREBASE_DEFAULTS__ || {};
    
    // Mark as ready to prevent initialization errors
    window.__firebaseIsSsrReady = true;
    
    console.log('Firebase patch script loaded successfully');
  }
})(); 