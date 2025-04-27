// Firebase initialization fix
(function() {
  // Fix for the original error
  window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3___isFirebaseServerApp = function() {
    return false;
  };
  
  // Fix for the new error (note the single underscore)
  window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__._isFirebaseServerApp = function() {
    return false;
  };
  
  window.__FIREBASE_DEFAULTS__ = window.__FIREBASE_DEFAULTS__ || {};
  
  if (typeof window !== 'undefined' && !window.__firebaseIsSsrReady) {
    window.__firebaseIsSsrReady = true;
  }
  
  // Create empty module if it doesn't exist
  if (!window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__) {
    window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__ = {};
  }
  
  // Add the function to the module
  window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__._isFirebaseServerApp = function() {
    return false;
  };
  
  console.log('Firebase client-side initialization patch applied');
})(); 