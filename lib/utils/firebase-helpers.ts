"use client";

import { getFirebaseDb, getFirebaseAuth } from '../firebase/firebase';
import { doc, collection, setDoc, getDoc, getDocs, updateDoc, query, where, addDoc, deleteDoc, DocumentReference, CollectionReference, Firestore } from 'firebase/firestore';

/**
 * Safely get a document reference, checking for null db
 * @param path Collection path or first segment
 * @param pathSegments Additional path segments (can include document ID)
 */
export function safeDoc(path: string, ...pathSegments: string[]): DocumentReference | null {
  try {
    const db = getFirebaseDb();
    if (!db) {
      console.error('Failed to get Firestore instance in safeDoc');
      return null;
    }
    
    // Validate the path and segments
    if (!path || typeof path !== 'string') {
      console.error('Invalid path provided to safeDoc:', path);
      return null;
    }
    
    // Remove any undefined or null segments
    const validSegments = pathSegments.filter(segment => segment !== undefined && segment !== null);
    
    // Create the document reference
    return doc(db, path, ...validSegments);
  } catch (error) {
    console.error('Error in safeDoc:', error);
    return null;
  }
}

/**
 * Safely get a collection reference, checking for null db
 */
export function safeCollection(path: string, ...pathSegments: string[]): CollectionReference | null {
  try {
    const db = getFirebaseDb();
    if (!db) {
      console.error('Failed to get Firestore instance in safeCollection');
      return null;
    }
    
    // Validate the path and segments
    if (!path || typeof path !== 'string') {
      console.error('Invalid path provided to safeCollection:', path);
      return null;
    }
    
    // Remove any undefined or null segments
    const validSegments = pathSegments.filter(segment => segment !== undefined && segment !== null);
    
    // Create the collection reference
    return collection(db, path, ...validSegments);
  } catch (error) {
    console.error('Error in safeCollection:', error);
    return null;
  }
}

/**
 * Safely set a document, checking for null references
 */
export async function safeSetDoc(docRef: DocumentReference | null, data: any, options?: any): Promise<void> {
  if (!docRef) {
    console.error('Document reference is null');
    throw new Error('Document reference is null');
  }
  return setDoc(docRef, data, options);
}

/**
 * Safely update a document, checking for null references
 */
export async function safeUpdateDoc(docRef: DocumentReference | null, data: any): Promise<void> {
  if (!docRef) {
    console.error('Document reference is null');
    throw new Error('Document reference is null');
  }
  return updateDoc(docRef, data);
}

/**
 * Safely get a document, checking for null references
 */
export async function safeGetDoc(docRef: DocumentReference | null) {
  try {
    if (!docRef) {
      console.error('Document reference is null in safeGetDoc');
      throw new Error('Document reference is null');
    }
    
    // Validate document reference has path
    if (!docRef.path) {
      console.error('Document reference path is invalid');
      throw new Error('Document reference path is invalid');
    }
    
    return await getDoc(docRef);
  } catch (error) {
    console.error('Error in safeGetDoc:', error);
    throw error;
  }
}

/**
 * Safely get a document and handle errors gracefully
 * Returns null instead of throwing errors (for UI use)
 */
export async function safeGetDocWithFallback<T = any>(
  docRef: DocumentReference | null, 
  fallback: T | null = null
): Promise<T | null> {
  try {
    if (!docRef) {
      console.error('Document reference is null in safeGetDocWithFallback');
      return fallback;
    }
    
    // Validate document reference has path
    if (!docRef.path) {
      console.error('Document reference path is invalid');
      return fallback;
    }
    
    const snapshot = await getDoc(docRef);
    
    // Check if document exists by directly checking the data
    // This approach avoids the exists() function/property TypeScript issues
    const data = snapshot.data();
    if (!data) {
      return fallback;
    }
    
    return data as T;
  } catch (error) {
    console.error('Error in safeGetDocWithFallback:', error);
    return fallback;
  }
}

/**
 * Safely get documents from a collection, checking for null references
 */
export async function safeGetDocs(collectionRef: CollectionReference | null) {
  if (!collectionRef) {
    console.error('Collection reference is null');
    throw new Error('Collection reference is null');
  }
  return getDocs(collectionRef);
}

/**
 * Get the Firestore instance with type safety
 */
export function getDb(): Firestore {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firestore is not available');
  }
  return db;
}

/**
 * A utility function to check if Firestore is properly initialized
 */
export const isFirestoreInitialized = (): boolean => {
  try {
    const db = getFirebaseDb();
    if (!db) return false;
    
    // Check for basic Firestore methods
    return typeof doc === 'function' && 
           typeof collection === 'function';
  } catch (error) {
    console.error('[Firebase Helper] Error checking Firestore initialization:', error);
    return false;
  }
};

/**
 * A convenience wrapper for safeDoc and safeGetDocWithFallback combined
 * Gets a document by collection and ID with fallback data
 */
export async function getDocumentWithFallback<T = any>(
  collectionPath: string,
  docId: string,
  fallback: T | null = null
): Promise<T | null> {
  try {
    const docRef = safeDoc(collectionPath, docId);
    return await safeGetDocWithFallback<T>(docRef, fallback);
  } catch (error) {
    console.error(`Error getting document ${collectionPath}/${docId}:`, error);
    return fallback;
  }
} 