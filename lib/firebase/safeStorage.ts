/**
 * Safe storage module with TypeScript types
 * This is a minimal implementation that won't cause browser errors related to Node.js dependencies
 */

// Use a generic type instead of importing from firebase/storage
type StorageReference = any;

// Mock types for Firebase Storage
interface UploadResult {
  ref: StorageReference | null;
}

// Just provide empty functions that don't break the app with proper types
export const ref = (): StorageReference | null => null;
export const getDownloadURL = async (): Promise<string> => "";
export const uploadBytes = async (): Promise<UploadResult> => ({ ref: null });
export const uploadString = async (): Promise<UploadResult> => ({ ref: null });
export const deleteObject = async (): Promise<boolean> => true;

// For backwards compatibility
export default {
  ref,
  getDownloadURL,
  uploadBytes,
  uploadString,
  deleteObject
}; 