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
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      
      // Log environment variables status
      console.log('Firebase Admin Environment Variables Status:', {
        projectId: !!projectId,
        clientEmail: !!clientEmail,
        privateKey: !!privateKey,
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
        }
        
        // Replace escaped newlines with actual newlines
        if (privateKey.includes('\\n')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
      }

      try {
        // Initialize the app with cert
        const app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log('Firebase Admin initialized successfully');
        return app;
      } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        throw error;
      }
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