import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { isBrowser, shouldSkipFirebaseInit as shouldSkipInit } from '../utils/environment';

// Import patches conditionally to avoid server-side issues
if (isBrowser()) {
  // Only import patches in browser environment
  require('../firebase/patch');
  require('../firebase/patchAuth');
}

// Create a local variable for skipping initialization
let shouldSkipFirebaseInit = shouldSkipInit;

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
      
      // Check if Firebase config is valid
      if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
        console.error('[Firebase] Firebase configuration is incomplete:', 
          JSON.stringify({
            apiKey: !!firebaseConfig.apiKey,
            authDomain: !!firebaseConfig.authDomain,
            projectId: !!firebaseConfig.projectId,
          }));
        throw new Error('Firebase configuration is incomplete');
      }
      
      // Initialize Firebase app
      app = initializeApp(firebaseConfig);
      console.log('[Firebase] Firebase app initialized successfully');

      // Initialize Firestore synchronously
      try {
        console.log('[Firebase] Initializing Firestore');
        firestore = getFirestore(app);
        console.log('[Firebase] Firestore initialized successfully');
        
        // Apply settings synchronously
        if (typeof (firestore as any).settings === 'function') {
          (firestore as any).settings({
            experimentalForceLongPolling: true,
            useFetchStreams: false,
            cacheSizeBytes: 50 * 1024 * 1024 // 50MB cache size
          });
          console.log('[Firebase] Firestore settings applied successfully');
        }
      } catch (firestoreError) {
        console.error('[Firebase] Error initializing Firestore:', firestoreError);
      }
      
      // Initialize Auth
      try {
        console.log('[Firebase] Initializing Auth');
        auth = getAuth(app);
        console.log('[Firebase] Auth initialized successfully');
      } catch (authError) {
        console.error('[Firebase] Error initializing Auth:', authError);
      }
      
      // Initialize Storage
      try {
        console.log('[Firebase] Initializing Storage');
        storage = getStorage(app);
        console.log('[Firebase] Storage initialized successfully');
      } catch (storageError) {
        console.error('[Firebase] Error initializing Storage:', storageError);
      }
      
    } else {
      console.log('[Firebase] Using existing Firebase app instance');
      app = getApps()[0];
      
      // Initialize services from existing app
      try {
        firestore = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);
        console.log('[Firebase] Services initialized from existing app');
      } catch (error) {
        console.error('[Firebase] Error initializing services from existing app:', error);
      }
    }
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
  
  // If firestore is already initialized and valid, return it
  if (firestore && typeof firestore === 'object' && Object.keys(firestore).length > 0) {
    return firestore;
  }
  
  // If app is not initialized yet, return null
  if (!app || Object.keys(app).length === 0) {
    console.error('[Firebase] Firebase app not initialized');
    return null;
  }
  
  // Try to initialize Firestore if not already done
  try {
    console.log('[Firebase] Initializing Firestore on demand');
    firestore = getFirestore(app);
    
    // Apply settings
    if (firestore && typeof (firestore as any).settings === 'function') {
      (firestore as any).settings({
        experimentalForceLongPolling: true,
        useFetchStreams: false,
        cacheSizeBytes: 50 * 1024 * 1024 // 50MB cache size
      });
    }
    
    return firestore;
  } catch (error) {
    console.error('[Firebase] Error initializing Firestore on demand:', error);
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