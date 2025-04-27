/**
 * Safe storage module
 * This is a minimal implementation that won't cause browser errors related to Node.js dependencies
 */

// Just provide empty functions that don't break the app
export const ref = () => null;
export const getDownloadURL = async () => "";
export const uploadBytes = async () => ({ ref: null });
export const uploadString = async () => ({ ref: null });
export const deleteObject = async () => true;

// For backwards compatibility
export default {
  ref,
  getDownloadURL,
  uploadBytes,
  uploadString,
  deleteObject
}; 