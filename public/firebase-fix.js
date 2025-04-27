// Firebase initialization fix
(function() {
  window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3___isFirebaseServerApp = function() {
    return false;
  };
  
  window.__FIREBASE_DEFAULTS__ = window.__FIREBASE_DEFAULTS__ || {};
  
  if (typeof window !== 'undefined' && !window.__firebaseIsSsrReady) {
    window.__firebaseIsSsrReady = true;
  }
  
  console.log('Firebase client-side initialization patch applied');
})(); 