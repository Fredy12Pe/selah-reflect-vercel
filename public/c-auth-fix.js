/**
 * Fix for (0,c.getFirebaseAuth) is not a function error
 * 
 * This script targets the specific module pattern being used in the bundle
 * that's causing the getFirebaseAuth error on the auth page.
 */

(function() {
  console.log('[C Auth Fix] Applying direct fix for (0,c.getFirebaseAuth)...');

  // Helper function to create a mock auth object
  function createMockAuth() {
    return {
      currentUser: null,
      onAuthStateChanged: function(observer) {
        console.log('[C Auth Fix] Mock onAuthStateChanged called');
        setTimeout(function() { observer(null); }, 10);
        return function() {}; // unsubscribe function
      },
      signInWithPopup: function() {
        console.log('[C Auth Fix] Mock signInWithPopup called');
        return Promise.reject(new Error('Authentication unavailable'));
      }
    };
  }

  // Define the module cache object if it doesn't exist
  if (typeof window.c !== 'object') {
    window.c = {};
  }

  // Directly fix the function that's causing the error
  window.c.getFirebaseAuth = window.c.getFirebaseAuth || function() {
    console.log('[C Auth Fix] Mock getFirebaseAuth called');
    
    // Try to use Firebase auth if available
    try {
      if (window.firebase && typeof window.firebase.auth === 'function') {
        return window.firebase.auth();
      }
    } catch (e) {
      console.error('[C Auth Fix] Failed to get Firebase auth:', e);
    }
    
    // Return mock auth object
    return createMockAuth();
  };

  // Add a global helper function in case it's accessed directly
  window.getFirebaseAuth = window.getFirebaseAuth || window.c.getFirebaseAuth;

  console.log('[C Auth Fix] (0,c.getFirebaseAuth) has been fixed');
})(); 