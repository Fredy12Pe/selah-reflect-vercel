import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { isBrowser, shouldSkipFirebaseInit } from '@/lib/utils/environment';

export function initAdmin() {
  // Skip initialization during build time if configured to do so
  if (shouldSkipFirebaseInit) {
    console.log('Skipping Firebase Admin initialization during build time');
    throw new Error('Firebase Admin initialization skipped during build');
  }
  
  try {
    if (getApps().length === 0) {
      // Check if all required environment variables are present
      // Support both legacy env vars and new FIREBASE_ADMIN_* vars
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      
      // Log all environment variables with sensitive data redacted
      console.log('Environment Variables Available:', Object.keys(process.env)
        .filter(key => key.includes('FIREBASE'))
        .reduce((obj, key) => {
          obj[key] = key.includes('KEY') ? '[REDACTED]' : !!process.env[key];
          return obj;
        }, {}));

      // Log the environment variables (excluding sensitive data)
      console.log('Firebase Admin Environment Variables Status:', {
        projectId: !!projectId,
        clientEmail: !!clientEmail,
        privateKey: !!privateKey,
        projectIdValue: projectId ? projectId.substring(0, 5) + '...' : null,
        clientEmailValue: clientEmail ? clientEmail.substring(0, 5) + '...' : null,
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
      const formattedPrivateKey = privateKey?.replace(/\\n/g, '\n');

      // Initialize the app
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });

      console.log('Firebase Admin initialized successfully');
      return app;
    } else {
      console.log('Firebase Admin already initialized');
      return getApps()[0];
    }
  } catch (error: any) {
    console.error('Error initializing Firebase Admin:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
} 