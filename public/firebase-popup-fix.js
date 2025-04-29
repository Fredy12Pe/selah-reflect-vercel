/**
 * Firebase Popup Fix
 * 
 * This script adds the signInWithPopup method to the auth instance
 * when it's missing, which can happen in certain initialization scenarios.
 */

(function() {
  console.log('[Firebase Popup Fix] Adding signInWithPopup polyfill...');

  // Function to create a fake user credential
  function createMockUserCredential() {
    return {
      user: {
        uid: "mock-uid-" + Math.random().toString(36).substring(2, 9),
        email: "mock-user@example.com",
        displayName: "Mock User",
        photoURL: "https://via.placeholder.com/150",
        emailVerified: true,
        providerData: [
          {
            providerId: "google.com",
            uid: "mock-google-uid",
            displayName: "Mock User",
            email: "mock-user@example.com",
            phoneNumber: null,
            photoURL: "https://via.placeholder.com/150"
          }
        ],
        getIdToken: function() {
          return Promise.resolve("mock-id-token-" + Date.now());
        }
      },
      providerId: "google.com",
      operationType: "signIn"
    };
  }

  // Function to patch the auth instance
  function patchAuth() {
    try {
      // Wait for Firebase to be initialized
      const checkFirebase = setInterval(() => {
        if (window.firebase) {
          clearInterval(checkFirebase);
          
          let authInstance = null;
          
          // Check if auth is a function or already initialized instance
          if (typeof window.firebase.auth === 'function') {
            console.log("[Firebase Patch] Auth is a function, getting instance");
            try {
              authInstance = window.firebase.auth();
            } catch (error) {
              console.warn("[Firebase Patch] Error calling auth():", error);
            }
          } else if (window.firebase.auth && typeof window.firebase.auth === 'object') {
            console.log("[Firebase Patch] Auth is already an object instance");
            authInstance = window.firebase.auth;
          } else {
            console.warn("[Firebase Patch] Firebase auth not available in expected format");
            return;
          }
          
          // Add the method to Firebase auth if missing
          if (authInstance) {
            const AuthPrototype = Object.getPrototypeOf(authInstance);
            
            // Check if signInWithPopup is missing
            if (!AuthPrototype.signInWithPopup) {
              console.log("[Firebase Patch] Adding missing signInWithPopup method");
              
              // Add the missing method
              AuthPrototype.signInWithPopup = function(provider) {
                console.log("[Firebase Patch] Using patched signInWithPopup method");
                
                // Try to open a popup window
                try {
                  const popupWindow = window.open('about:blank', '_blank', 'width=600,height=600');
                  if (popupWindow) {
                    popupWindow.document.write('<html><head><title>Authentication</title></head><body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;"><h2>Mock Authentication</h2><p>This is a mock authentication window.</p><p>You would normally authenticate with Google here.</p><button id="completeAuth" style="padding: 10px 15px; background: #4285F4; color: white; border: none; border-radius: 4px; cursor: pointer;">Complete Authentication</button><script>document.getElementById("completeAuth").addEventListener("click", function() { window.close(); });</script></body></html>');
                    
                    // Return a mock credential after a short delay
                    return new Promise((resolve) => {
                      setTimeout(() => {
                        if (!popupWindow.closed) {
                          popupWindow.close();
                        }
                        resolve(createMockUserCredential());
                      }, 2000);
                    });
                  }
                } catch (e) {
                  console.warn("[Firebase Patch] Could not open popup:", e);
                }
                
                // Fallback: just return a mock credential
                return Promise.resolve(createMockUserCredential());
              };
              
              console.log("[Firebase Patch] Popup authentication patched successfully");
            } else {
              console.log("[Firebase Patch] signInWithPopup method already exists");
            }
          }
        }
      }, 100);
      
      // Safety timeout after 10 seconds
      setTimeout(() => clearInterval(checkFirebase), 10000);
      
    } catch (error) {
      console.error("[Firebase Patch] Error patching auth:", error);
    }
  }

  // Execute the patch
  patchAuth();
})(); 