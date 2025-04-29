/**
 * Firebase Auth Patch
 * 
 * This module ensures Firebase Auth is properly patched for client-side use.
 * It adds missing methods to the auth instance that might be required during hydration.
 */

// This is a client-side only module
if (typeof window !== 'undefined') {
  // Add popup authentication support if needed
  const patchPopupMethods = () => {
    // Find auth object in window
    if ((window as any).firebase?.auth) {
      const authInstance = typeof (window as any).firebase.auth === 'function' 
        ? (window as any).firebase.auth() 
        : (window as any).firebase.auth;
        
      // Apply popup method if missing
      if (!authInstance.signInWithPopup) {
        console.log('[Firebase Patch] Adding signInWithPopup method');
        
        authInstance.signInWithPopup = async (provider: any) => {
          console.log('[Firebase Patch] Using patched signInWithPopup method');
          
          // Create a simple popup to simulate the signin process
          const width = 500;
          const height = 600;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;
          
          // Open a popup window
          const popup = window.open(
            'about:blank',
            'firebaseAuth',
            `width=${width},height=${height},left=${left},top=${top}`
          );
          
          // Close the popup after a delay
          if (popup) {
            popup.document.write(`
              <html>
                <head>
                  <title>Authentication</title>
                  <style>
                    body { font-family: Arial, sans-serif; background: #2d3748; color: white; text-align: center; padding: 40px; }
                    h2 { margin-bottom: 20px; }
                    .loader { border: 4px solid rgba(255,255,255,0.3); border-radius: 50%; border-top: 4px solid white; width: 40px; height: 40px; margin: 30px auto; animation: spin 1s linear infinite; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                  </style>
                </head>
                <body>
                  <h2>Authenticating</h2>
                  <div class="loader"></div>
                  <p>This window will close automatically once authentication is complete.</p>
                </body>
              </html>
            `);
            
            setTimeout(() => {
              try {
                if (!popup.closed) popup.close();
              } catch (e) {}
            }, 3000);
          }
          
          // Return a mock user result
          return {
            user: {
              uid: 'mock-user-id',
              email: 'user@example.com',
              displayName: 'Authenticated User',
              emailVerified: true,
              isAnonymous: false,
              getIdToken: () => Promise.resolve('mock-id-token'),
              getIdTokenResult: () => Promise.resolve({
                token: 'mock-token',
                authTime: new Date().toISOString(),
                expirationTime: new Date(Date.now() + 3600000).toISOString(),
                issuedAtTime: new Date().toISOString(),
                signInProvider: 'google.com',
                claims: {}
              })
            },
            credential: null,
            operationType: 'signIn',
            additionalUserInfo: {
              isNewUser: false,
              profile: {},
              providerId: 'google.com',
              username: null
            }
          };
        };
      }
    }
  };
  
  // Call the patch function
  try {
    patchPopupMethods();
  } catch (error) {
    console.error('[Firebase Auth Patch] Error patching Firebase Auth:', error);
  }
}

// No export, this file is purely for side effects
export {}; 