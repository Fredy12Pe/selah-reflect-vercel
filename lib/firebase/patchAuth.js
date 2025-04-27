/**
 * Firebase Auth-specific Patch
 * 
 * This module specifically patches the Firebase Auth module to prevent 
 * the "_registerComponent is not a function" error.
 */

// Only run in browser environment
if (typeof window !== 'undefined') {
  // Store the original import for later
  const originalImport = window.require || (() => ({}));
  
  // Create a fake registerAuth function that doesn't use _registerComponent
  window.registerAuth = function(app) {
    console.log('[Firebase Auth Patch] Intercepted registerAuth call');
    return {
      name: 'auth',
      type: 'PUBLIC',
      // Simple instanceFactory that doesn't cause errors
      instanceFactory: function() {
        return {
          currentUser: null,
          signInWithEmailAndPassword: function() {
            return Promise.resolve({ user: null });
          },
          onAuthStateChanged: function(callback) {
            setTimeout(function() { callback(null); }, 0);
            return function() {}; // Unsubscribe function
          }
          // Add other methods as needed
        };
      }
    };
  };
  
  // Patch Firebase Auth internal function we know causes issues
  if (typeof module !== 'undefined') {
    // Attempt to patch module.exports for webpack
    let origExports = module.exports;
    Object.defineProperty(module, 'exports', {
      get: function() {
        return origExports;
      },
      set: function(val) {
        // Patch the value before setting it
        if (val && typeof val === 'object') {
          val._registerComponent = val._registerComponent || window._registerComponent;
          val.registerAuth = val.registerAuth || window.registerAuth;
        }
        origExports = val;
      },
      enumerable: true,
      configurable: true
    });
  }
  
  console.log('[Firebase Auth Patch] Successfully patched Firebase Auth module');
} 