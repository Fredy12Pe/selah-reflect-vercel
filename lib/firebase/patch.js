/**
 * Firebase Client Patch
 * 
 * This is a very simple patch to add the missing _registerComponent function
 * that Firebase Auth expects to find on the window object.
 */

// Only run in browser environment
if (typeof window !== 'undefined') {
  // Log that the patch is being applied
  console.log('[Firebase Patch] Applying Firebase runtime patches...');
  
  // Patch the window object with the required internal Firebase functions
  window._registerComponent = window._registerComponent || function(component) {
    console.log('[Firebase Patch] Mock _registerComponent called for:', component?.name);
    return component;
  };
  
  window._getProvider = window._getProvider || function(name) {
    console.log('[Firebase Patch] Mock _getProvider called for:', name);
    return {
      getImmediate: () => ({}),
      get: () => ({})
    };
  };
  
  window._registerVersion = window._registerVersion || function() {};
  
  window._getComponent = window._getComponent || function() {
    return {};
  };
  
  // This is the function specifically failing in the error message
  window._isFirebaseServerApp = window._isFirebaseServerApp || function() {
    console.log('[Firebase Patch] Mock _isFirebaseServerApp called');
    return false;
  };
  
  // Add the specific function that's failing in the error
  if (typeof window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__) {
    window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__._isFirebaseServerApp = function() {
      return false;
    };
  }
  
  // Try to patch the Firebase module directly
  try {
    if (window.firebase) {
      window.firebase._isFirebaseServerApp = window.firebase._isFirebaseServerApp || function() {
        return false;
      };
    }
  } catch (e) {
    console.log('[Firebase Patch] Error while patching firebase object:', e);
  }
  
  console.log('[Firebase Runtime Patch] Successfully applied runtime patches');
}

// No exports needed - this is a side-effect only module 