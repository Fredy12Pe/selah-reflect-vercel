/**
 * Simplified Firebase Configuration
 * This file handles Firebase initialization with better error handling
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { isBrowser, shouldSkipFirebaseInit } from '../utils/environment';

// Define type for storage
type FirebaseStorage = any;

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

// Safe empty instances for SSR
const emptyAuth = {} as Auth;
const emptyFirestore = {} as Firestore;
const emptyStorage = {} as FirebaseStorage;
const emptyApp = {} as FirebaseApp;

// Initialize Firebase instances
let app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with persistence
const auth: Auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

// Initialize Firestore with settings
const db: Firestore = getFirestore(app);
const storage = getStorage(app);

// Configure Firestore
if (typeof window !== "undefined") {
  const settings = {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
    cacheSizeBytes: 50 * 1024 * 1024 // 50MB cache size
  };
  
  // @ts-ignore - Type error in settings but it works
  db.settings(settings);
}

// Safe access functions
export const getFirebaseApp = (): FirebaseApp => {
  if (!isBrowser()) return emptyApp;
  return app || emptyApp;
};

export const getFirebaseAuth = (): Auth => {
  if (!isBrowser()) return emptyAuth;
  return auth || emptyAuth;
};

export const getFirebaseFirestore = (): Firestore => {
  if (!isBrowser()) return emptyFirestore;
  return db || emptyFirestore;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!isBrowser()) return emptyStorage;
  return storage || emptyStorage;
};

// Export firebase instances
export { app, auth, db, storage };

// Add TypeScript declaration for debugging
declare global {
  interface Window {
    firebase?: {
      app: FirebaseApp;
      auth: Auth;
      firestore: Firestore;
      storage: FirebaseStorage;
    };
  }
} 