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
      console.log('[Firebase] Firebase app initialized');
      
      // Initialize Firestore with settings
      try {
        console.log('[Firebase] Initializing Firestore');
        firestore = getFirestore(app);
        
        // Add a delay before applying settings to ensure Firestore is ready
        setTimeout(() => {
          try {
            if (firestore && typeof (firestore as any).settings === 'function') {
              (firestore as any).settings({
                experimentalForceLongPolling: true,
                useFetchStreams: false,
                cacheSizeBytes: 50 * 1024 * 1024 // 50MB cache size
              });
              console.log('[Firebase] Firestore settings applied successfully');
            } else {
              console.warn('[Firebase] Firestore settings not applied: db.settings is not a function');
            }
          } catch (settingsError) {
            console.error('[Firebase] Error applying Firestore settings:', settingsError);
          }
        }, 500);
      } catch (firestoreError) {
        console.error('[Firebase] Error initializing Firestore:', firestoreError);
      }
    } else {
      console.log('[Firebase] Using existing Firebase app instance');
      app = getApps()[0];
      try {
        firestore = getFirestore(app);
      } catch (firestoreError) {
        console.error('[Firebase] Error getting existing Firestore:', firestoreError);
      }
    }
    
    // Initialize Firebase services
    try {
      console.log('[Firebase] Initializing Firebase Auth');
      auth = getAuth(app);
    } catch (authError) {
      console.error('[Firebase] Error initializing Auth:', authError);
    }
    
    try {
      console.log('[Firebase] Initializing Storage');
      storage = getStorage(app);
    } catch (storageError) {
      console.error('[Firebase] Error initializing Storage:', storageError);
    }
    
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
    console.log('[Firebase] Skipping getFirebaseDb in non-browser environment');
    return null;
  }
  
  try {
    // Check if Firestore is already initialized properly
    if (firestore && typeof (firestore as any).collection === 'function') {
      console.log('[Firebase] Using existing Firestore instance');
      return firestore;
    }
    
    // Need to initialize or reinitialize Firestore
    console.log('[Firebase] Creating new Firestore instance');
    
    // Check if we have a valid app
    if (!app || Object.keys(app).length === 0) {
      console.log('[Firebase] Initializing app for Firestore');
      app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    }
    
    try {
      // Initialize Firestore with the app
      firestore = getFirestore(app);
      
      // Apply settings immediately
      try {
        if (firestore && typeof (firestore as any).settings === 'function') {
          (firestore as any).settings({
            experimentalForceLongPolling: true,
            useFetchStreams: false,
            cacheSizeBytes: 50 * 1024 * 1024 // 50MB cache size
          });
          console.log('[Firebase] Applied Firestore settings on dynamic init');
        }
      } catch (settingsError) {
        console.warn('[Firebase] Error applying settings on dynamic init:', settingsError);
      }
      
      return firestore;
    } catch (initError) {
      console.error('[Firebase] Error initializing Firestore dynamically:', initError);
      return null;
    }
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