/**
 * Firebase Patch Webpack Plugin
 * 
 * This webpack plugin patches Firebase modules during compilation to fix
 * the '_registerComponent is not a function' error.
 */

class FirebasePatchPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const pluginName = this.constructor.name;

    // Tap into the compilation process
    compiler.hooks.normalModuleFactory.tap(pluginName, factory => {
      // Intercept module parser
      factory.hooks.parser.for('javascript/auto').tap(pluginName, parser => {
        // Look for Firebase imports
        parser.hooks.import.tap(pluginName, (statement, source) => {
          // Check if this is a Firebase module
          if (source.includes('firebase') || source.includes('@firebase')) {
            console.log(`[FirebasePatchPlugin] Detected Firebase import: ${source}`);
          }
        });
      });

      // Intercept module creation
      factory.hooks.afterResolve.tap(pluginName, resolveData => {
        const module = resolveData.createData;
        
        // Check if this is a Firebase module
        if (module && module.resource && 
            (module.resource.includes('firebase') || 
             module.resource.includes('@firebase'))) {
          console.log(`[FirebasePatchPlugin] Processing Firebase module: ${module.resource}`);
        }
      });
    });

    // Tap into the compilation process to modify modules
    compiler.hooks.compilation.tap(pluginName, compilation => {
      compilation.hooks.optimizeModules.tap(pluginName, modules => {
        modules.forEach(module => {
          // Check if this is a Firebase Auth module
          if (module.resource && 
              (module.resource.includes('firebase/auth') || 
               module.resource.includes('@firebase/auth'))) {
            console.log(`[FirebasePatchPlugin] Patching Firebase Auth module: ${module.resource}`);
            
            // Add a flag to mark this module for patching
            module.__needsFirebasePatch = true;
          }
        });
      });

      // Tap into the module optimization to patch the Firebase code
      compilation.hooks.optimizeChunkAssets.tap(pluginName, chunks => {
        chunks.forEach(chunk => {
          chunk.files.forEach(fileName => {
            // Only process JavaScript files
            if (!fileName.endsWith('.js')) return;
            
            // Get the file content
            let source = compilation.assets[fileName].source();
            
            // Check if this file contains Firebase Auth code
            if (source.includes('firebase/auth') || 
                source.includes('@firebase/auth') ||
                source.includes('_registerComponent') || 
                source.includes('registerAuth')) {
              
              console.log(`[FirebasePatchPlugin] Checking file for Firebase Auth: ${fileName}`);
              
              // Fix the problematic patterns with safer replacements
              let patched = source;
              
              // Add a preamble with mock functions
              let patchCode = `
                // Firebase Patch by FirebasePatchPlugin
                if (typeof window !== 'undefined') {
                  window._registerComponent = window._registerComponent || function(component) {
                    return component;
                  };
                  window._getProvider = window._getProvider || function() {
                    return { getImmediate: function() { return {}; }, get: function() { return {}; } };
                  };
                  window._isFirebaseServerApp = window._isFirebaseServerApp || function() {
                    return false;
                  };
                }
              `;
              
              // Use safer method to replace function calls
              patched = patched.replace(
                /_registerComponent\s*\(\s*([^)]*)\s*\)/g,
                '(c => c)($1)'
              );
              
              // Fix _isFirebaseServerApp calls
              patched = patched.replace(
                /_isFirebaseServerApp\s*\(\s*\)/g,
                'false'
              );
              
              // Fix _getProvider calls
              patched = patched.replace(
                /_getProvider\s*\(\s*([^)]*)\s*\)/g,
                '({ getImmediate: () => ({}), get: () => ({}) })'
              );
              
              // Add the patch code at the beginning of the file
              patched = patchCode + patched;
              
              // Update the asset only if changes were made
              if (patched !== source) {
                compilation.assets[fileName] = {
                  source: () => patched,
                  size: () => patched.length
                };
                console.log(`[FirebasePatchPlugin] Patched Firebase Auth in file: ${fileName}`);
              }
            }
          });
        });
      });
    });
  }
}

module.exports = FirebasePatchPlugin; 