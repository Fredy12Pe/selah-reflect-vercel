/**
 * Simplified Firebase Configuration
 * This file handles Firebase initialization with better error handling
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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
let app: FirebaseApp = emptyApp;
let auth: Auth = emptyAuth;
let firestore: Firestore = emptyFirestore;
let storage: FirebaseStorage = emptyStorage;
let googleProvider: GoogleAuthProvider | null = null;

if (isBrowser() && !shouldSkipFirebaseInit) {
  try {
    // Check if Firebase is already initialized
    if (!getApps().length) {
      console.log('[Firebase] Initializing Firebase app...');
      app = initializeApp(firebaseConfig);
      console.log('[Firebase] App initialized successfully');
    } else {
      console.log('[Firebase] Using existing Firebase app');
      app = getApps()[0];
    }

    // Initialize Firebase services
    try {
      auth = getAuth(app);
      console.log('[Firebase] Auth initialized');
    } catch (error) {
      console.error('[Firebase] Auth initialization error:', error);
    }

    try {
      firestore = getFirestore(app);
      console.log('[Firebase] Firestore initialized');
    } catch (error) {
      console.error('[Firebase] Firestore initialization error:', error);
    }

    try {
      storage = getStorage(app);
      console.log('[Firebase] Storage initialized');
    } catch (error) {
      console.error('[Firebase] Storage initialization error:', error);
    }

    try {
      googleProvider = new GoogleAuthProvider();
      console.log('[Firebase] Google provider initialized');
    } catch (error) {
      console.error('[Firebase] Google provider initialization error:', error);
    }

    // Add Firebase to window for debugging
    if (typeof window !== 'undefined') {
      window.firebase = { app, auth, firestore, storage };
    }
  } catch (error) {
    console.error('[Firebase] Global initialization error:', error);
  }
} else {
  console.log('[Firebase] Skipping Firebase initialization in server environment or due to configuration');
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
  return firestore || emptyFirestore;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!isBrowser()) return emptyStorage;
  return storage || emptyStorage;
};

export const getGoogleAuthProvider = (): GoogleAuthProvider => {
  if (!isBrowser() || !googleProvider) return new GoogleAuthProvider();
  return googleProvider;
};

// Export firebase instances
export { app, auth, firestore, storage, googleProvider };

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