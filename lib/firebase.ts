"use client";

import { FirebaseApp } from 'firebase/app';
import { Auth, GoogleAuthProvider } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { isBrowser, shouldSkipFirebaseInit } from '@/lib/utils/environment';

// Import from updated config file
import { 
  app as configApp,
  auth as configAuth, 
  firestore as configFirestore, 
  storage as configStorage,
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage,
  getGoogleAuthProvider as getGoogleProviderFromConfig
} from './firebase/config';

// Re-export the Firebase config instances
export const app = configApp;
export const auth = configAuth;
export const db = configFirestore;
export const storage = configStorage;

// Re-export the getter functions
export { 
  getFirebaseApp, 
  getFirebaseAuth, 
  getFirebaseFirestore,
  getFirebaseStorage,
  getGoogleProviderFromConfig as getGoogleAuthProvider
};

/**
 * Storage utility functions (safe for SSR)
 */
export const uploadDevotionPDF = async (date: string, file: File): Promise<string> => {
  if (shouldSkipFirebaseInit || !isBrowser()) {
    console.log('Storage operation skipped during build or server rendering');
    return '#';
  }
  
  try {
    // Just return a placeholder URL since we're using mock storage
    return `/api/devotions/${date}/pdf`;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw new Error('Failed to upload devotion PDF');
  }
};

export const getDevotionPDFUrl = async (date: string): Promise<string> => {
  if (shouldSkipFirebaseInit || !isBrowser()) {
    console.log('Storage operation skipped during build or server rendering');
    return '#';
  }
  
  try {
    // Just return a placeholder URL since we're using mock storage
    return `/api/devotions/${date}/pdf`;
  } catch (error) {
    console.error('Error getting PDF URL:', error);
    throw new Error('Failed to get devotion PDF URL');
  }
};

/**
 * Safe utility functions that work both client and server-side
 */
export const getAppSafe = (): FirebaseApp | null => {
  if (typeof window === 'undefined') return null;
  return getFirebaseApp();
};

export const getAuthSafe = (): Auth | null => {
  if (typeof window === 'undefined') return null;
  return getFirebaseAuth();
};

export const getDbSafe = (): Firestore | null => {
  if (typeof window === 'undefined') return null;
  return getFirebaseFirestore();
};

export const getStorageSafe = () => {
  if (typeof window === 'undefined') return null;
  return getFirebaseStorage();
}; 