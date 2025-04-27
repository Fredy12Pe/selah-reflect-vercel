"use client";

import { getFirebaseDb, getFirebaseAuth } from '@/lib/firebase/firebase';
import { doc, collection, setDoc, getDoc, getDocs, updateDoc, query, where, addDoc, deleteDoc, DocumentReference, CollectionReference, Firestore } from 'firebase/firestore';

/**
 * Safely get a document reference, checking for null db
 */
export function safeDoc(path: string, ...pathSegments: string[]): DocumentReference | null {
  const db = getFirebaseDb();
  if (!db) return null;
  return doc(db, path, ...pathSegments);
}

/**
 * Safely get a collection reference, checking for null db
 */
export function safeCollection(path: string, ...pathSegments: string[]): CollectionReference | null {
  const db = getFirebaseDb();
  if (!db) return null;
  return collection(db, path, ...pathSegments);
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
  if (!docRef) {
    console.error('Document reference is null');
    throw new Error('Document reference is null');
  }
  return getDoc(docRef);
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