/**
 * Simplified Firebase Configuration
 * This file handles Firebase initialization with better error handling
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
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

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: any;

// Only initialize Firebase in the browser
if (typeof window !== 'undefined') {
  try {
    // Initialize or get existing app
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Initialize Auth with persistence
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Error setting auth persistence:", error);
      });
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Storage
    storage = getStorage(app);
    
    console.log('[Firebase] Services initialized successfully');
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    // Provide empty instances on error
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
    storage = {};
  }
} else {
  // Provide empty instances for SSR
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {};
}

// Configure Firestore
if (typeof window !== "undefined") {
  try {
    // Only apply settings if db is properly initialized and has the settings method
    if (db && typeof db.settings === 'function') {
      const settings = {
        experimentalForceLongPolling: true,
        useFetchStreams: false,
        cacheSizeBytes: 50 * 1024 * 1024 // 50MB cache size
      };
      
      // @ts-ignore - Type error in settings but it works
      db.settings(settings);
      console.log('[Firebase] Firestore settings applied successfully');
    } else {
      console.warn('[Firebase] Firestore settings not applied: db.settings is not a function');
    }
  } catch (error) {
    console.error('[Firebase] Error applying Firestore settings:', error);
    // Continue without settings - app will use defaults
  }
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