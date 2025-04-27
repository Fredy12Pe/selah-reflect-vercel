/**
 * Simplified Firebase Webpack Plugin
 * 
 * A lighter-weight alternative to the original complex patching plugin.
 * This plugin just adds necessary Firebase internal functions to the global scope.
 */

class SimpleFirebasePatchPlugin {
  apply(compiler) {
    // Apply a banner to all JavaScript files
    compiler.hooks.compilation.tap('SimpleFirebasePatchPlugin', (compilation) => {
      // Add the necessary content to the beginning of all JavaScript files
      compilation.hooks.processAssets.tap(
        {
          name: 'SimpleFirebasePatchPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        (assets) => {
          // Basic Firebase patch code that will be injected
          const patch = `
if (typeof window !== 'undefined') {
  // Add internal Firebase functions
  window._isFirebaseServerApp = window._isFirebaseServerApp || function() { return false; };
  window._registerComponent = window._registerComponent || function(c) { return c; };
  window._getProvider = window._getProvider || function() { return { getImmediate: function() { return {}; }, get: function() { return {}; } }; };
  window._registerVersion = window._registerVersion || function() {};
}
`;

          // Add this patch to all JS files
          Object.keys(assets).forEach((filename) => {
            if (/\.js$/.test(filename)) {
              // Get the original content
              const originalContent = assets[filename].source();
              
              // Only inject if it doesn't already contain our patch
              if (!originalContent.includes('window._isFirebaseServerApp = window._isFirebaseServerApp')) {
                // Create a new asset
                const patchedContent = patch + originalContent;
                compilation.updateAsset(
                  filename,
                  new compiler.webpack.sources.RawSource(patchedContent)
                );
              }
            }
          });
        }
      );
    });

    // Log when the plugin is being applied
    console.log('SimpleFirebasePatchPlugin applied');
  }
}

module.exports = SimpleFirebasePatchPlugin; 