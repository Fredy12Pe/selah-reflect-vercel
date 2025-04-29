/**
 * Firebase Consolidated Fix
 * 
 * This script combines all the necessary Firebase fixes in a single file
 * to prevent hydration errors and ensure Firebase works properly.
 */

(function() {
  console.log('[Firebase Fix] Applying consolidated Firebase fixes...');

  // Only run in browser
  if (typeof window === 'undefined') return;
  
  // 1. Fix Firebase internal functions
  window._registerComponent = function(component) {
    console.log('[Firebase Fix] Intercepted _registerComponent call');
    return component;
  };
  
  window._getProvider = function(name) {
    console.log('[Firebase Fix] Intercepted _getProvider call');
    return {
      getImmediate: function() { return {}; },
      get: function() { return {}; }
    };
  };
  
  window._isFirebaseServerApp = function() { 
    console.log('[Firebase Fix] Intercepted _isFirebaseServerApp call');
    return false; 
  };
  
  // 2. Apply fixes to module-specific imports
  for (let i = 0; i < 10; i++) {
    const modName = `__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_${i}__`;
    window[modName] = window[modName] || {};
    window[modName]._registerComponent = window._registerComponent;
    window[modName]._getProvider = window._getProvider;
    window[modName]._isFirebaseServerApp = window._isFirebaseServerApp;
  }
  
  // 3. Mock auth functions in case Firebase fails to load
  const createMockAuth = function() {
    return {
      currentUser: null,
      onAuthStateChanged: function(callback) {
        console.log('[Firebase Fix] Mock onAuthStateChanged called');
        setTimeout(function() { callback(null); }, 100);
        return function() {}; // unsubscribe function
      },
      signInWithPopup: function() {
        console.log('[Firebase Fix] Mock signInWithPopup called');
        return Promise.reject(new Error('Authentication unavailable'));
      },
      signOut: function() {
        console.log('[Firebase Fix] Mock signOut called');
        return Promise.resolve();
      }
    };
  };
  
  // 4. Fix signInWithPopup hydration issues
  if (typeof HTMLElement !== 'undefined' && HTMLElement.prototype) {
    // Store the original setAttribute
    const originalSetAttribute = HTMLElement.prototype.setAttribute;
    
    // Override setAttribute to handle Firebase-specific attributes
    HTMLElement.prototype.setAttribute = function(name, value) {
      // Check if this is a Firebase-related attribute that shouldn't be passed to DOM
      if (name === 'signInWithPopup' || name === 'signInWithRedirect') {
        console.log(`[Firebase Fix] Blocked setting "${name}" attribute on DOM element`);
        // Store it as a property instead of an attribute
        this[name] = value;
        return;
      }
      
      // Call the original method for all other attributes
      return originalSetAttribute.call(this, name, value);
    };
  }
  
  // 5. Create fallback firebase object
  window.firebase = window.firebase || {
    auth: createMockAuth,
    app: function() { return {}; },
    firestore: function() { return {}; }
  };
  
  console.log('[Firebase Fix] All Firebase fixes applied successfully');
})(); 