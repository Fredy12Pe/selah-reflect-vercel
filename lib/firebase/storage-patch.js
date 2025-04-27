/**
 * Firebase Storage Browser Patch
 * 
 * This module provides a browser-compatible version of Firebase Storage
 * by directly importing from firebase/storage but wrapping it safely for browser use
 * 
 * Usage: import this file instead of 'firebase/storage'
 */

// Import directly from firebase/storage
import * as firebaseStorage from 'firebase/storage';

// Re-export specific named exports to ensure we're not using any that might cause issues
export const getStorage = firebaseStorage.getStorage;
export const getDownloadURL = firebaseStorage.getDownloadURL;
export const uploadBytes = firebaseStorage.uploadBytes;
export const uploadBytesResumable = firebaseStorage.uploadBytesResumable;
export const uploadString = firebaseStorage.uploadString;
export const ref = firebaseStorage.ref;
export const list = firebaseStorage.list;
export const listAll = firebaseStorage.listAll;
export const getMetadata = firebaseStorage.getMetadata;
export const updateMetadata = firebaseStorage.updateMetadata;
export const deleteObject = firebaseStorage.deleteObject;
export const StringFormat = firebaseStorage.StringFormat;
export const StorageError = firebaseStorage.StorageError;
export const StorageErrorCode = firebaseStorage.StorageErrorCode; 