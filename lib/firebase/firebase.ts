import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { isBrowser, shouldSkipFirebaseInit } from '../utils/environment';

// Import patches conditionally to avoid server-side issues
if (isBrowser()) {
  // Only import patches in browser environment
  require('../firebase/patch');
  require('../firebase/patchAuth');
}

// Firebase configuration
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Early debugging of environment vars
if (isBrowser()) {
  console.log('[Firebase Config] Environment Variables Present:', {
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

// Create placeholder objects that will be safely replaced in browser context
let app: FirebaseApp = {} as FirebaseApp;
let auth: Auth = {} as Auth;
let firestore: Firestore = {} as Firestore;
let storage: any = {};

// Initialize Firebase only in browser context
if (isBrowser() && !shouldSkipFirebaseInit) {
  try {
    console.log('[Firebase] Initializing in browser environment');
    
    // Check if app is already initialized
    if (getApps().length === 0) {
      console.log('[Firebase] Creating new Firebase app instance');
      app = initializeApp(firebaseConfig);
    } else {
      console.log('[Firebase] Using existing Firebase app instance');
      app = getApps()[0];
    }
    
    // Initialize Firebase services
    console.log('[Firebase] Initializing Firebase Auth');
    auth = getAuth(app);
    
    console.log('[Firebase] Initializing Firestore');
    firestore = getFirestore(app);
    
    console.log('[Firebase] Initializing Storage');
    storage = getStorage(app);
    
    console.log('[Firebase] All services initialized successfully');
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    // Keep using the placeholder objects on error
  }
} else {
  console.log('[Firebase] Skipping initialization (server context or build time)');
}

// Safe accessor functions with proper guards
export const getFirebaseAuth = (): Auth | null => {
  if (!isBrowser() || shouldSkipFirebaseInit) {
    return null;
  }
  
  try {
    if (auth && Object.keys(auth).length === 0) {
      app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      auth = getAuth(app);
    }
    return auth;
  } catch (error) {
    console.error('[Firebase] Error getting Auth:', error);
    return null;
  }
};

export const getFirebaseDb = (): Firestore | null => {
  if (!isBrowser() || shouldSkipFirebaseInit) {
    return null;
  }
  
  try {
    if (firestore && Object.keys(firestore).length === 0) {
      app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      firestore = getFirestore(app);
    }
    return firestore;
  } catch (error) {
    console.error('[Firebase] Error getting Firestore:', error);
    return null;
  }
};

export const getGoogleAuthProvider = (): GoogleAuthProvider | null => {
  if (!isBrowser() || shouldSkipFirebaseInit) {
    return null;
  }
  
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ 
      prompt: 'select_account',
    });
    return provider;
  } catch (error) {
    console.error('[Firebase] Error creating Google Auth Provider:', error);
    return null;
  }
};

// Export the initialized Firebase instances
export { app, auth, firestore, storage }; 