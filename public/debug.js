/**
 * Firebase Debugging Script
 * This script helps identify where Firebase initialization is failing
 */

// Debug script added on: 2025-04-26T03:30:00Z
// This forces a rebuild in Netlify

(function() {
  console.log('[Debug] Starting debug script...');
  
  // Create visual debug output
  function createDebugOutput() {
    const debugEl = document.createElement('div');
    debugEl.id = 'firebase-debug';
    debugEl.style.position = 'fixed';
    debugEl.style.zIndex = '99999';
    debugEl.style.top = '10px';
    debugEl.style.right = '10px';
    debugEl.style.width = '300px';
    debugEl.style.maxHeight = '80vh';
    debugEl.style.overflow = 'auto';
    debugEl.style.background = 'rgba(0,0,0,0.8)';
    debugEl.style.color = 'white';
    debugEl.style.padding = '15px';
    debugEl.style.borderRadius = '8px';
    debugEl.style.fontFamily = 'monospace';
    debugEl.style.fontSize = '12px';
    
    document.body.appendChild(debugEl);
    return debugEl;
  }
  
  // Add log message to debug output
  function logMessage(message, type = 'info') {
    const debugEl = document.getElementById('firebase-debug') || createDebugOutput();
    
    const entry = document.createElement('div');
    entry.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
    entry.style.padding = '5px 0';
    entry.style.color = type === 'error' ? '#ff5555' : 
                         type === 'warning' ? '#ffaa00' : 
                         type === 'success' ? '#55ff55' : '#ffffff';
    
    const time = new Date().toISOString().split('T')[1].split('.')[0];
    entry.textContent = `[${time}] ${message}`;
    
    debugEl.appendChild(entry);
    debugEl.scrollTop = debugEl.scrollHeight;
    console.log(`[Debug] ${message}`);
  }
  
  // Check if Firebase is available
  function checkFirebase() {
    logMessage('Checking Firebase availability...');
    
    // Check for Firebase on window
    if (typeof firebase !== 'undefined') {
      logMessage('Firebase object found on window', 'success');
    } else {
      logMessage('Firebase object NOT found on window', 'error');
    }
    
    // Check for Firebase patches
    logMessage('Checking Firebase patches...');
    if (typeof window._registerComponent === 'function') {
      logMessage('_registerComponent patch found', 'success');
    } else {
      logMessage('_registerComponent patch NOT found', 'error');
    }
    
    // Check for React initialization
    logMessage('Checking React initialization...');
    if (document.getElementById('__next') || document.getElementById('root')) {
      logMessage('React app container found', 'success');
    } else {
      logMessage('React app container NOT found', 'warning');
    }
    
    // Check for auth state
    logMessage('Checking auth state...');
    if (typeof firebase !== 'undefined' && firebase.auth) {
      logMessage('Firebase auth available', 'success');
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          logMessage(`User authenticated: ${user.uid}`, 'success');
        } else {
          logMessage('No user authenticated', 'warning');
        }
      }, function(error) {
        logMessage(`Auth state error: ${error.message}`, 'error');
      });
    } else {
      logMessage('Firebase auth NOT available', 'error');
    }
    
    // Report loading state
    logMessage('Checking for loading indicators...');
    const loadingEls = document.querySelectorAll('.loading, #loading, [data-loading=true]');
    if (loadingEls.length > 0) {
      logMessage(`Found ${loadingEls.length} loading indicators`, 'warning');
    } else {
      logMessage('No loading indicators found', 'success');
    }
  }
  
  // Run initial checks
  setTimeout(function() {
    logMessage('Starting Firebase debug checks...');
    checkFirebase();
    
    // Continue checking
    setInterval(checkFirebase, 5000);
    
    // Report any errors
    window.addEventListener('error', function(event) {
      logMessage(`Global error: ${event.message}`, 'error');
    });
  }, 2000); // Wait for page to load
  
  console.log('[Debug] Debug script initialized');
})(); 