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
      // Add persistence settings to avoid CORS issues
      const settings = {
        experimentalForceLongPolling: true,
        useFetchStreams: false
      };
      
      app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      
      // Apply settings safely with error handling
      try {
        // Check if settings method exists before calling it
        if (db && typeof (db as any).settings === 'function') {
          // @ts-ignore - Type error in settings but it works
          db.settings(settings);
          console.log('[Firebase] Firestore settings applied successfully');
        } else {
          console.warn('[Firebase] Firestore settings not applied: db.settings is not a function');
        }
      } catch (settingError) {
        console.error('[Firebase] Error applying Firestore settings:', settingError);
        // Continue without settings - app will use defaults
      }
      
      firestore = db;
    } else {
      console.log('[Firebase] Using existing Firebase app instance');
      app = getApps()[0];
      firestore = getFirestore(app);
    }
    
    // Initialize Firebase services
    console.log('[Firebase] Initializing Firebase Auth');
    auth = getAuth(app);
    
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
    console.log('[Firebase] Skipping getFirebaseAuth in non-browser environment');
    return null;
  }
  
  try {
    // Check if auth is already initialized
    if (auth && typeof auth.onAuthStateChanged === 'function') {
      console.log('[Firebase] Using existing Auth instance');
      return auth;
    }
    
    // Create a new instance if needed
    console.log('[Firebase] Creating new Auth instance');
    if (Object.keys(auth).length === 0 || !auth.onAuthStateChanged) {
      // Check if we have an app
      if (!app || Object.keys(app).length === 0) {
        console.log('[Firebase] Initializing app for Auth');
        app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      }
      
      // Get auth from the app
      auth = getAuth(app);
      
      // Handle edge case where auth might still be empty
      if (!auth || !auth.onAuthStateChanged) {
        console.error('[Firebase] Failed to get valid Auth instance');
        // Create a mock Auth object as fallback
        const mockAuth = {
          currentUser: null,
          onAuthStateChanged: (callback: any) => {
            console.log('[Firebase] Using mock onAuthStateChanged');
            setTimeout(() => callback(null), 10);
            return () => {}; // Unsubscribe function
          }
        } as unknown as Auth;
        
        return mockAuth;
      }
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