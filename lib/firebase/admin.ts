import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { isBrowser, shouldSkipFirebaseInit } from '@/lib/utils/environment';

// Track initialization attempts to prevent infinite recursion
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

export function initAdmin() {
  console.log('Firebase Admin: Initialization started, attempt:', initAttempts + 1);
  
  // Safety check to prevent infinite recursion
  if (initAttempts >= MAX_INIT_ATTEMPTS) {
    console.error('Firebase Admin: Maximum initialization attempts reached');
    throw new Error('Firebase Admin initialization failed after multiple attempts');
  }
  
  initAttempts++;
  
  // Skip initialization during build time if configured to do so
  if (shouldSkipFirebaseInit) {
    console.log('Firebase Admin: Skipping initialization during build time');
    throw new Error('Firebase Admin initialization skipped during build');
  }
  
  try {
    // Check if the app is already initialized
    if (getApps().length > 0) {
      console.log('Firebase Admin: Already initialized, returning existing app');
      return getApp();
    }
    
      // Check if all required environment variables are present
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      
    // Log environment variables status
    console.log('Firebase Admin: Environment Variables Status:', {
        projectId: !!projectId,
        clientEmail: !!clientEmail,
        privateKey: !!privateKey,
        privateKeyLength: privateKey ? privateKey.length : 0,
      });

      // Validate all required variables are present
      const missingVars = [];
      if (!projectId) missingVars.push('projectId');
      if (!clientEmail) missingVars.push('clientEmail');
      if (!privateKey) missingVars.push('privateKey');

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required environment variables: ${missingVars.join(', ')}`
        );
      }

    // Process the private key
      if (privateKey) {
      // Remove surrounding quotes if present
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
        console.log('Firebase Admin: Removed surrounding quotes from private key');
        }
        
      // Replace escaped newlines with actual newlines
        if (privateKey.includes('\\n')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
        console.log('Firebase Admin: Replaced escaped newlines in private key');
        }
        
      // Validate private key format after processing
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.warn('Firebase Admin: Private key may not be correctly formatted');
      }
    }

    try {
      // Prepare credentials object
      const credentials = {
        projectId,
        clientEmail,
        privateKey,
      };

      console.log('Firebase Admin: Initializing with cert');
      
      // Initialize the app with cert
        const app = initializeApp({
        credential: cert(credentials),
        });
      
      console.log('Firebase Admin: Initialized successfully');
      // Reset attempts counter on success
      initAttempts = 0;
        return app;
    } catch (error) {
      console.error('Firebase Admin: Error initializing with cert:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Firebase Admin: Initialization error:', error);
    console.error('Firebase Admin: Error details:', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
} 