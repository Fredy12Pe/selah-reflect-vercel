/**
 * Simplified Firebase Configuration
 * This file handles Firebase initialization with better error handling
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  Auth, 
  connectAuthEmulator, 
  signInAnonymously 
} from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug log the configuration (but not in production)
if (process.env.NODE_ENV !== 'production') {
  console.log('[Firebase Config] Environment variables:', {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓' : '✗',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓' : '✗',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓' : '✗',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✓' : '✗',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✓' : '✗',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✓' : '✗',
  });
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: any;

// Create empty implementations for SSR mode
const createEmptyAuth = (): Auth => ({
  currentUser: null,
  onAuthStateChanged: () => () => {},
  signInWithPopup: async () => ({ user: null, credential: null }) as any,
  signOut: async () => {},
} as unknown as Auth);

const createEmptyFirestore = (): Firestore => ({
  collection: () => ({}),
  doc: () => ({}),
} as unknown as Firestore);

// Function to sign in anonymously
export const signInAnonymousUser = async () => {
  if (typeof window === 'undefined' || !auth) return null;
  
  try {
    const userCredential = await signInAnonymously(auth);
    console.log('[Firebase] Anonymous sign-in successful');
    return userCredential.user;
  } catch (error) {
    console.error('[Firebase] Anonymous sign-in error:', error);
    return null;
  }
};

// Only initialize Firebase in the client
if (typeof window !== 'undefined') {
  try {
    if (!firebaseConfig.apiKey) {
      throw new Error("Firebase configuration is missing required fields");
    }
    
    // Initialize Firebase app if not already initialized
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log('[Firebase] App initialized');
    } else {
      app = getApps()[0];
      console.log('[Firebase] Using existing app instance');
    }
    
    try {
      // Initialize Auth with local persistence
      auth = getAuth(app);
      
      // Ensure persistence is set to local storage - this is critical for maintaining sessions
      setPersistence(auth, browserLocalPersistence)
        .then(() => {
          console.log('[Firebase] Auth persistence set to local');
          
          // Check if user is already signed in
          if (!auth.currentUser) {
            console.log('[Firebase] No user currently signed in');
          } else {
            console.log('[Firebase] User already signed in:', auth.currentUser.uid);
          }
        })
        .catch(error => console.error('[Firebase] Error setting auth persistence:', error));
    } catch (authError) {
      console.error('[Firebase] Auth initialization error:', authError);
      auth = createEmptyAuth();
    }
    
    try {
      // Initialize Firestore with settings for better offline support
      db = getFirestore(app);
      
      // Apply Firestore settings
      if (db && typeof (db as any).settings === 'function') {
        (db as any).settings({
          experimentalForceLongPolling: true,
          ignoreUndefinedProperties: true,
          cacheSizeBytes: 50 * 1024 * 1024 // 50MB cache
        });
      }
    } catch (dbError) {
      console.error('[Firebase] Firestore initialization error:', dbError);
      db = createEmptyFirestore();
    }
    
    try {
      // Initialize Storage
      storage = getStorage(app);
    } catch (storageError) {
      console.error('[Firebase] Storage initialization error:', storageError);
      storage = {};
    }
    
    // Make available globally for debugging
    if (process.env.NODE_ENV !== 'production') {
      window.firebase = {
        app,
        auth,
        firestore: db,
        storage
      };
    }
    
    console.log('[Firebase] Services initialized successfully');
  } catch (error) {
    console.error('[Firebase] Core initialization error:', error);
    // Provide fallback implementations
    app = {} as FirebaseApp;
    auth = createEmptyAuth();
    db = createEmptyFirestore();
    storage = {};
  }
} else {
  // Server-side rendering - use empty implementations
  console.log('[Firebase] Using empty implementations for SSR');
  app = {} as FirebaseApp;
  auth = createEmptyAuth();
  db = createEmptyFirestore();
  storage = {};
}

export { app, auth, db, storage };

// Add TypeScript declaration for debugging
declare global {
  interface Window {
    firebase?: {
      app: FirebaseApp;
      auth: Auth;
      firestore: Firestore;
      storage: any;
    };
  }
} 