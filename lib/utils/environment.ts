/**
 * Environment detection utilities to help with SSR/SSG issues 
 * and prevent initialization errors during build time
 */

// Check if we're in a browser environment
export const isBrowser = () => typeof window !== 'undefined';

// Check if debug mode is enabled
export const isDebugMode = () => 
  process.env.DEBUG_MODE === 'true' || 
  (isBrowser() && localStorage.getItem('DEBUG_MODE') === 'true');

// Check if we're in a Netlify environment
export const isNetlify = process.env.NETLIFY === 'true';

// Check if we're in a Netlify build environment (not runtime)
export const isNetlifyBuild = 
  isNetlify && 
  process.env.NEXT_PUBLIC_NETLIFY_CONTEXT === 'production' && 
  !isBrowser();

// Check if API routes should be skipped (build time)
export const shouldSkipApiRoutes = process.env.SKIP_API_ROUTES === 'true';

// Check if Firebase Admin should be skipped (build time)
export const shouldSkipFirebaseAdmin = process.env.SKIP_FIREBASE_ADMIN === 'true';

// Check if we're in a build process that should skip Firebase initialization
export const isBuildProcess = 
  process.env.NEXT_PUBLIC_IS_NETLIFY_BUILD === 'true' || 
  isNetlifyBuild ||
  shouldSkipApiRoutes;

// Check for localStorage flag to skip Firebase (client-side override)
export const shouldSkipFirebaseFromLocalStorage = () => 
  isBrowser() && localStorage.getItem('SKIP_FIREBASE') === 'true';

// Check if Firebase initialization should be skipped (build time or client override)
export const shouldSkipFirebaseInit = 
  (process.env.SKIP_FIREBASE_INIT === 'true' && !isBrowser()) || 
  process.env.SKIP_FIREBASE_INIT_ON_BUILD === 'true' ||
  isBuildProcess ||
  shouldSkipFirebaseAdmin ||
  shouldSkipFirebaseFromLocalStorage();

// Safe function to conditionally run code only in browser environment
export const runInBrowser = (callback: () => any) => {
  if (isBrowser()) {
    return callback();
  }
  return null;
};

// Helper function to safely access Firebase services
export const safeFirebaseAccess = <T>(service: T | undefined, fallback: T): T => {
  if (!isBrowser()) return fallback;
  if (service === undefined) return fallback;
  return service;
}; 