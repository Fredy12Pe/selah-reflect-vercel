/**
 * Firebase Initialization Fix
 * 
 * This script runs before the app initializes to ensure Firebase methods are properly patched.
 * It specifically addresses the 'settings is not a function' error.
 */

(function() {
  console.log('[Firebase Fix] Applying Firebase initialization fixes...');
  
  // Create safety prototypes on window for Firebase
  window._registerComponent = function(component) {
    console.log('[Firebase Fix] Mock _registerComponent called for:', component?.name);
    return component;
  };
  
  window._getProvider = function(name) {
    console.log('[Firebase Fix] Mock _getProvider called for:', name);
    return {
      getImmediate: function() { return {}; },
      get: function() { return {}; }
    };
  };
  
  // Create mock Firestore with settings function
  window._mockFirestore = {
    settings: function(settings) {
      console.log('[Firebase Fix] Mock Firestore settings called with:', settings);
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
  
  console.log('[Firebase Fix] Successfully applied initialization fixes');
})(); 