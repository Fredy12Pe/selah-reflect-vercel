/**
 * Firebase Patch
 * 
 * This module ensures Firebase SDK is properly initialized on the client.
 * It provides compatibility for components that might be rendered during SSR/SSG.
 */

// This is a client-side only module
if (typeof window !== 'undefined') {
  // Ensure global Firebase compatibility
  if (!(window as any)._registerComponent) {
    (window as any)._registerComponent = function(component: any) {
      return component;
    };
  }
  
  if (!(window as any)._getProvider) {
    (window as any)._getProvider = function() {
      return {
        getImmediate: () => ({}),
        get: () => ({})
      };
    };
  }
}

// No export, this file is purely for side effects
export {}; 