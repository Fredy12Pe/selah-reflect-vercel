/**
 * Firebase Firestore Browser Patch
 * 
 * This module provides a browser-compatible version of Firebase Firestore
 * by directly importing from firebase/firestore but forcing browser imports
 */

// Import directly from firebase/firestore
import * as firebaseFirestore from 'firebase/firestore';

// Re-export all named exports to ensure browser compatibility
export const {
  // Firestore instance
  initializeFirestore,
  getFirestore,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  
  // Collection/Document References
  collection,
  collectionGroup,
  doc,
  
  // Queries
  endAt,
  endBefore,
  limit,
  limitToLast,
  orderBy,
  query,
  startAfter,
  startAt,
  where,
  
  // Reading Data
  getDoc,
  getDocFromCache,
  getDocFromServer,
  getDocs,
  getDocsFromCache,
  getDocsFromServer,
  onSnapshot,
  onSnapshotsInSync,
  
  // Writing Data
  addDoc,
  deleteDoc,
  setDoc,
  updateDoc,
  
  // Batched Writes
  writeBatch,
  
  // Transactions
  runTransaction,
  
  // Timestamp & Geo
  serverTimestamp,
  Timestamp,
  GeoPoint,
  
  // Data Types & Transformations
  increment,
  arrayRemove,
  arrayUnion,
  deleteField,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QuerySnapshot,
  
  // Document Fields
  FieldPath,
  FieldValue,
  
  // Local persistence
  persistentLocalCache,
  persistentMultipleTabManager,
  
  // Special types
  CACHE_SIZE_UNLIMITED 
} = firebaseFirestore; 