/**
 * Firebase Initialization Fix
 * 
 * This script runs before the app initializes to ensure Firebase methods are properly patched.
 * It specifically addresses initialization issues with Firebase Auth and Firestore.
 */

(function() {
  console.log('[Firebase Fix] Applying Firebase initialization fixes...');
  
  // Create safety prototypes on window for Firebase
  window._registerComponent = window._registerComponent || function(component) {
    console.log('[Firebase Fix] Mock _registerComponent called for:', component?.name);
    return component;
  };
  
  window._getProvider = window._getProvider || function(name) {
    console.log('[Firebase Fix] Mock _getProvider called for:', name);
    return {
      getImmediate: function() { return {}; },
      get: function() { return {}; }
    };
  };
  
  // Create mock Firestore and Auth objects
  window._mockFirestore = {
    settings: function(settings) {
      console.log('[Firebase Fix] Mock Firestore settings called with:', settings);
      return window._mockFirestore;
    },
    collection: function() { return { doc: function() { return {}; } }; }
  };
  
  window._mockAuth = {
    onAuthStateChanged: function(callback) { 
      console.log('[Firebase Fix] Mock Auth state change listener registered');
      setTimeout(function() { callback(null); }, 10);
      return function() {}; // unsubscribe function
    },
    signInWithPopup: function() {
      console.log('[Firebase Fix] Mock signInWithPopup called');
      return Promise.resolve({ user: null });
    },
    signOut: function() {
      console.log('[Firebase Fix] Mock signOut called');
      return Promise.resolve();
    }
  };
  
  // Fix for Firestore settings
  const originalGetFirestore = window.getFirestore;
  if (typeof originalGetFirestore === 'function') {
    window.getFirestore = function() {
      try {
        const firestoreInstance = originalGetFirestore.apply(this, arguments);
        
        // Only add settings if it doesn't exist
        if (firestoreInstance && typeof firestoreInstance.settings !== 'function') {
          console.log('[Firebase Fix] Adding missing settings method to Firestore');
          firestoreInstance.settings = function(settings) {
            console.log('[Firebase Fix] Using polyfilled settings method with:', settings);
            return firestoreInstance;
          };
        }
        
        return firestoreInstance;
      } catch (e) {
        console.error('[Firebase Fix] Error in getFirestore patch:', e);
        return window._mockFirestore;
      }
    };
  }
  
  // Fix for Auth issues
  const originalGetAuth = window.getAuth;
  if (typeof originalGetAuth === 'function') {
    window.getAuth = function() {
      try {
        const authInstance = originalGetAuth.apply(this, arguments);
        return authInstance;
      } catch (e) {
        console.error('[Firebase Fix] Error in getAuth patch:', e);
        return window._mockAuth;
      }
    };
  }
  
  // Add getFirebaseAuth if it's being referenced
  window.getFirebaseAuth = window.getFirebaseAuth || function() {
    console.log('[Firebase Fix] Using mock getFirebaseAuth');
    try {
      // Try to use real Auth if available
      if (typeof window.getAuth === 'function') {
        return window.getAuth();
      }
      return window._mockAuth;
    } catch (e) {
      console.error('[Firebase Fix] Error in getFirebaseAuth patch:', e);
      return window._mockAuth;
    }
  };
  
  // Handle possible missing Firebase modules
  window.firebase = window.firebase || {};
  window.firebase.auth = window.firebase.auth || window._mockAuth;
  
  console.log('[Firebase Fix] Successfully applied initialization fixes');
})(); 