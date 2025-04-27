"use client";

/**
 * Early Firebase initialization file
 * This code runs at the application root level to ensure Firebase is patched
 * before any Firebase code is loaded
 */

// Apply Firebase patches to the window object if it exists
if (typeof window !== "undefined") {
  // Fix for the _isFirebaseServerApp function that's causing the error
  window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__ =
    window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__ || {};
  window.__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_3__._isFirebaseServerApp =
    function () {
      console.log(
        "[Early Firebase Patch] Intercepted _isFirebaseServerApp call"
      );
      return false;
    };

  // Add the missing Firebase internal functions to window
  window._isFirebaseServerApp = function () {
    console.log("[Early Firebase Patch] Called _isFirebaseServerApp");
    return false;
  };

  window._registerComponent = function (component) {
    console.log("[Early Firebase Patch] Called _registerComponent");
    return component;
  };

  window._getProvider = function (name) {
    console.log("[Early Firebase Patch] Called _getProvider");
    return {
      getImmediate: () => ({}),
      get: () => ({}),
    };
  };

  // Add functions to the module-specific global objects too
  for (let i = 0; i < 10; i++) {
    const modName = `__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_${i}__`;
    window[modName] = window[modName] || {};
    window[modName]._isFirebaseServerApp = window._isFirebaseServerApp;
    window[modName]._registerComponent = window._registerComponent;
    window[modName]._getProvider = window._getProvider;
  }

  console.log("[Early Firebase] Applied essential patches to window object");
}
