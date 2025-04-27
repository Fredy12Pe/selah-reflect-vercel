// Firebase patch script for Next.js
(function() {
  // Ensure Firebase modules are initialized properly
  if (typeof window !== 'undefined') {
    // Create the module object if it doesn't exist
    window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__ = window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__ || {};
    
    // Create required Firebase globals if missing (with double underscore)
    window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3___isFirebaseServerApp = 
      window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3___isFirebaseServerApp || 
      function() { return false; };
    
    // Create required Firebase globals if missing (with single underscore)
    window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__._isFirebaseServerApp = 
      window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__._isFirebaseServerApp || 
      function() { return false; };
      
    // Fix for potential SSR hydration issues
    window.__FIREBASE_DEFAULTS__ = window.__FIREBASE_DEFAULTS__ || {};
    
    // Mark as ready to prevent initialization errors
    window.__firebaseIsSsrReady = true;
    
    console.log('Firebase patch script loaded successfully');
  }
})(); 