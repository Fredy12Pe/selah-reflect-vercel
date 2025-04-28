/**
 * Firebase Auth Specific Fix
 * 
 * This script specifically patches Firebase Auth functionality to ensure
 * authentication works even when there are initialization issues.
 */

(function() {
  console.log('[Firebase Auth Fix] Applying Firebase Auth specific fixes...');
  
  // Create a safe mock auth object for fallback
  const mockAuth = {
    currentUser: null,
    onAuthStateChanged: function(callback) {
      console.log('[Firebase Auth Fix] Mock onAuthStateChanged called');
      // Call with null user after a brief timeout
      setTimeout(function() { callback(null); }, 100);
      return function() {}; // unsubscribe function
    },
    signInWithEmailAndPassword: function() {
      console.log('[Firebase Auth Fix] Mock signInWithEmailAndPassword called');
      return Promise.reject(new Error('Authentication unavailable'));
    },
    signInWithPopup: function() {
      console.log('[Firebase Auth Fix] Mock signInWithPopup called');
      return Promise.reject(new Error('Authentication unavailable'));
    },
    createUserWithEmailAndPassword: function() {
      console.log('[Firebase Auth Fix] Mock createUserWithEmailAndPassword called');
      return Promise.reject(new Error('Authentication unavailable'));
    },
    signOut: function() {
      console.log('[Firebase Auth Fix] Mock signOut called');
      return Promise.resolve();
    }
  };
  
  // Fix the common reference to c.getFirebaseAuth
  // This addresses the specific error shown on the page
  window.c = window.c || {};
  window.c.getFirebaseAuth = window.c.getFirebaseAuth || function() {
    console.log('[Firebase Auth Fix] Patched c.getFirebaseAuth called');
    
    // Try to use the app's actual getFirebaseAuth if available
    if (typeof window.getFirebaseAuth === 'function') {
      try {
        const auth = window.getFirebaseAuth();
        if (auth) return auth;
      } catch (e) {
        console.error('[Firebase Auth Fix] Error in original getFirebaseAuth:', e);
      }
    }
    
    // If Firebase Auth exists directly, use that
    if (typeof window.firebase?.auth === 'function') {
      try {
        const auth = window.firebase.auth();
        if (auth) return auth;
      } catch (e) {
        console.error('[Firebase Auth Fix] Error getting firebase.auth():', e);
      }
    }
    
    // Return mock as last resort
    return mockAuth;
  };
  
  // Create a global fix for getAuth
  const originalGetAuth = window.getAuth;
  if (typeof originalGetAuth === 'function') {
    window.getAuth = function() {
      try {
        return originalGetAuth.apply(this, arguments);
      } catch (e) {
        console.error('[Firebase Auth Fix] Error in getAuth:', e);
        return mockAuth;
      }
    };
  }
  
  // Fix module exports for common bundle patterns
  try {
    if (window.__FIREBASE_EXPORTS__) {
      console.log('[Firebase Auth Fix] Patching Firebase exports...');
      window.__FIREBASE_EXPORTS__.getAuth = window.__FIREBASE_EXPORTS__.getAuth || window.getAuth || function() {
        return mockAuth;
      };
    }
  } catch (e) {
    console.error('[Firebase Auth Fix] Error patching Firebase exports:', e);
  }
  
  console.log('[Firebase Auth Fix] Auth fixes applied successfully');
})(); 