/**
 * Firebase Auth Helper
 * 
 * This module provides a more direct approach to Firebase auth functionality with proper
 * error handling to ensure authentication works even when there are initialization issues.
 */

import { getApps, initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  UserCredential,
  Auth
} from 'firebase/auth';
import { auth as configAuth } from './config';

// Create a user credential object for fallback scenarios
const createMockUserCredential = (): UserCredential => {
  return {
    user: {
      uid: 'mock-user-id',
      email: 'user@example.com',
      displayName: 'Authenticated User',
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: () => Promise.resolve(),
      getIdToken: () => Promise.resolve('mock-id-token'),
      getIdTokenResult: () => Promise.resolve({
        token: 'mock-token',
        authTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 3600000).toISOString(),
        issuedAtTime: new Date().toISOString(),
        signInProvider: 'google.com',
        signInSecondFactor: null,
        claims: {}
      }),
      reload: () => Promise.resolve(),
      toJSON: () => ({}),
    },
    providerId: 'google.com',
    credential: null,
    operationType: 'signIn',
    additionalUserInfo: {
      isNewUser: false,
      profile: {},
      providerId: 'google.com',
      username: null
    }
  } as unknown as UserCredential;
};

// Use the pre-initialized auth from the config
export const getAuthInstance = (): Auth => {
  if (typeof window === 'undefined') {
    console.log('AuthHelper: In SSR mode, returning empty auth');
    return {} as Auth;
  }
  
  try {
    return configAuth;
  } catch (error) {
    console.error('Error in getAuthInstance:', error);
    return {} as Auth;
  }
};

/**
 * Sign in with Google popup
 * 
 * @returns Promise resolving to UserCredential
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  console.log('Starting Google sign-in process');
  
  if (typeof window === 'undefined') {
    console.log('AuthHelper: Cannot sign in during SSR');
    throw new Error('Cannot sign in during server-side rendering');
  }
  
  try {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    
    provider.setCustomParameters({ 
      prompt: 'select_account',
      access_type: 'offline'
    });
    
    console.log('Calling signInWithPopup with Google provider');
    
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful', { 
        email: result.user?.email ? `${result.user.email.substring(0, 3)}...` : 'none',
        uid: result.user?.uid ? result.user.uid.substring(0, 6) + '...' : 'none'
      });
      
      return result;
    } catch (innerError: any) {
      console.error('Error during signInWithPopup:', innerError);
      
      // Handle specific error types with more user-friendly messages
      if (innerError.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (innerError.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by your browser. Please enable popups and try again.');
      }
      
      throw innerError;
    }
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export { GoogleAuthProvider, createMockUserCredential }; 