/**
 * Firebase Patch Bootstrap
 * 
 * This file is imported directly by Next.js and patched the window object
 * before any other Firebase code loads.
 */

if (typeof window !== 'undefined') {
  // Mock internal Firebase functions to prevent errors
  window._registerComponent = window._registerComponent || function(component) {
    console.log('[Firebase Root Patch] Mock _registerComponent called for:', component?.name);
    return component;
  };
  
  window._getProvider = window._getProvider || function(name) {
    console.log('[Firebase Root Patch] Mock _getProvider called for:', name);
    return {
      getImmediate: () => ({}),
      get: () => ({})
    };
  };
  
  window._registerVersion = window._registerVersion || function() {};
  window._getComponent = window._getComponent || function() { return {}; };
  window._isFirebaseServerApp = window._isFirebaseServerApp || function() { return false; };
  
  // Fix App Check errors
  window.__PRIVATE_FirebaseAppCheckTokenProvider = window.__PRIVATE_FirebaseAppCheckTokenProvider || class {
    constructor() {
      this.app = {};
      this.appCheck = null;
    }
    getToken() {
      return Promise.resolve({
        token: "mock-app-check-token",
        expirationTime: new Date(Date.now() + 3600000)
      });
    }
    invalidateToken() {}
  };
  
  // Mock standard auth functions
  window.registerAuth = window.registerAuth || function() {
    return {
      name: 'auth',
      type: 'PUBLIC',
      instanceFactory: () => ({})
    };
  };
  
  console.log('[Firebase Root Patch] Successfully applied root-level Firebase patches');
} 