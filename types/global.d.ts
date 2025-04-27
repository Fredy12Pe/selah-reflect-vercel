/// <reference types="next" />

// Extend the global Window interface
interface Window {
  _isFirebaseServerApp: () => boolean;
  _registerComponent: (component: any) => any;
  _getProvider: (name: string) => { getImmediate: () => any; get: () => any };
  [key: string]: any; // Allow any string index
} 