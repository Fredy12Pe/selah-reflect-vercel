/**
 * Firebase Patch
 * 
 * This module patches Firebase to prevent errors. Import this before any other Firebase imports.
 */

// Import our universal override
import firebaseOverride from '../shims/firebase-override';

// Patch window object (client-side only)
if (typeof window !== 'undefined') {
  // Create shim container if it doesn't exist
  window.__firebase_shims = window.__firebase_shims || {};
  
  // Add overrides to the window object
  window.__firebase_shims = {
    ...window.__firebase_shims,
    ...firebaseOverride
  };
  
  // Create a global _registerComponent function
  window._registerComponent = firebaseOverride._registerComponent;
  
  // Patch module.exports (used by some bundlers)
  if (typeof module !== 'undefined' && module.exports) {
    const originalExports = module.exports;
    module.exports = {
      ...originalExports,
      _registerComponent: firebaseOverride._registerComponent,
      _getProvider: firebaseOverride._getProvider,
      _registerVersion: firebaseOverride._registerVersion,
      _getComponent: firebaseOverride._getComponent,
      _isFirebaseServerApp: firebaseOverride._isFirebaseServerApp,
      registerAuth: firebaseOverride.registerAuth
    };
  }
  
  console.log('[Firebase Patch] Applied Firebase shims successfully');
}

// Export for direct imports
export default firebaseOverride; 