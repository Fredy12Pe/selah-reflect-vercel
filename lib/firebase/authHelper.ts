/**
 * Firebase Auth Helper
 * 
 * This module provides a more direct approach to Firebase auth functionality with proper
 * error handling to ensure authentication works even when there are initialization issues.
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  Auth, 
  UserCredential 
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Create a safe mock auth response
const mockUserCredential = {
  user: {
    uid: '',
    displayName: null,
    email: null,
    getIdToken: () => Promise.resolve('')
  }
} as unknown as UserCredential;

/**
 * Get the Firebase auth instance safely
 */
export function getAuthInstance(): Auth {
  try {
    // Check if we have an initialized app
    const app = getApps().length > 0 
      ? getApps()[0] 
      : initializeApp(firebaseConfig);
      
    // Get and return the auth instance
    return getAuth(app);
  } catch (error) {
    console.error('Error getting auth instance:', error);
    // Return a minimal implementation to prevent crashes
    return {
      currentUser: null,
      onAuthStateChanged: () => () => {}
    } as unknown as Auth;
  }
}

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    // Ensure auth has the required method before calling it
    if (auth && typeof (auth as any).signInWithPopup === 'function') {
      return await signInWithPopup(auth, provider);
    } else {
      console.error('Auth instance missing signInWithPopup method');
      throw new Error('Authentication service is unavailable');
    }
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export { GoogleAuthProvider, signInWithPopup }; 