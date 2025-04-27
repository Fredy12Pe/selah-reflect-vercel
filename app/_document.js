export default function FirebasePatch() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          // Patch Firebase internal functions to prevent errors
          window._registerComponent = function(component) {
            console.log('[Firebase Document Patch] Mock _registerComponent called', component?.name);
            return component;
          };
          
          window._getProvider = function(name) {
            return {
              getImmediate: function() { return {}; },
              get: function() { return {}; }
            };
          };
          
          window._registerVersion = function() {};
          window._getComponent = function() { return {}; };
          window._isFirebaseServerApp = function() { return false; };
          
          // Let the app know we've patched Firebase
          window.__FIREBASE_PATCHED = true;
          
          console.log('[Firebase Document Patch] Successfully patched Firebase internal functions');
        `,
      }}
    />
  );
} 