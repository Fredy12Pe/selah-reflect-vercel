/**
 * Browser-only Firebase Storage implementation
 * 
 * This file provides a safe version of Firebase Storage that works reliably in browser environments
 * and avoids Node.js dependencies.
 */

import { getApp } from 'firebase/app';
import { 
  getDownloadURL as _getDownloadURL,
  getStorage as _getStorage,
  ref as _ref,
  uploadBytes as _uploadBytes,
  uploadString as _uploadString,
  deleteObject as _deleteObject,
  StorageReference
} from '@firebase/storage';

// Create storage instance lazily only in browser
const getStorage = () => {
  if (typeof window === 'undefined') {
    console.warn('Storage is only available in browser environment');
    return null;
  }
  
  try {
    return _getStorage(getApp());
  } catch (error) {
    console.error('Error initializing Firebase Storage:', error);
    return null;
  }
};

// Safe storage reference function
export const ref = (path: string) => {
  const storage = getStorage();
  if (!storage) return null;
  
  try {
    return _ref(storage, path);
  } catch (error) {
    console.error(`Error creating ref for path ${path}:`, error);
    return null;
  }
};

// Safe download URL function
export const getDownloadURL = async (reference: any) => {
  if (!reference) {
    console.error('Invalid storage reference');
    return null;
  }
  
  try {
    return await _getDownloadURL(reference);
  } catch (error) {
    console.error('Error getting download URL:', error);
    return null;
  }
};

// Safe upload function
export const uploadBytes = async (reference: any, data: Blob | Uint8Array | ArrayBuffer) => {
  if (!reference) {
    console.error('Invalid storage reference');
    return null;
  }
  
  try {
    return await _uploadBytes(reference, data);
  } catch (error) {
    console.error('Error uploading bytes:', error);
    return null;
  }
};

// Safe upload string function
export const uploadString = async (reference: any, data: string, format?: any) => {
  if (!reference) {
    console.error('Invalid storage reference');
    return null;
  }
  
  try {
    return await _uploadString(reference, data, format);
  } catch (error) {
    console.error('Error uploading string:', error);
    return null;
  }
};

// Safe delete function
export const deleteObject = async (reference: any) => {
  if (!reference) {
    console.error('Invalid storage reference');
    return false;
  }
  
  try {
    await _deleteObject(reference);
    return true;
  } catch (error) {
    console.error('Error deleting object:', error);
    return false;
  }
}; 