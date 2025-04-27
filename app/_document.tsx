// This is a client component
"use client";

import Script from "next/script";

/**
 * Firebase Patching Component
 * Ensures Firebase related patches are available early in the application lifecycle
 */
export default function FirebasePatch() {
  return (
    <Script id="firebase-early-patch" strategy="beforeInteractive">
      {`
        // Patch Firebase internal functions on window
        if (typeof window !== 'undefined') {
          // Add essential Firebase internal functions
          window._isFirebaseServerApp = function() { return false; };
          window._registerComponent = function(component) { return component; };
          window._getProvider = function() { 
            return { 
              getImmediate: function() { return {}; }, 
              get: function() { return {}; } 
            }; 
          };
          
          // Add to specific webpack modules by index (0-9)
          for (let i = 0; i < 10; i++) {
            const modName = \`__FIREBASE_APP__WEBPACK_IMPORTED_MODULE_\${i}__\`;
            window[modName] = window[modName] || {};
            window[modName]._isFirebaseServerApp = function() { return false; };
            window[modName]._registerComponent = function(c) { return c; };
          }
          
          console.log('[Firebase Early Patch] Successfully patched Firebase functions on window');
        }
      `}
    </Script>
  );
}
