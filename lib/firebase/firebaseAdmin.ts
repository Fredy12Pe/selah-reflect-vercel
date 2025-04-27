import * as admin from 'firebase-admin';
import { shouldSkipFirebaseInit } from '@/lib/utils/environment';

// Skip initialization during build time
if (shouldSkipFirebaseInit) {
  console.log('Skipping Firebase Admin initialization during build time');
} 
// Initialize Firebase Admin if not already initialized
else if (!admin.apps.length) {
  try {
    // Support both legacy env vars and new FIREBASE_ADMIN_* vars
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY)?.replace(/\\n/g, '\n');
    
    // Check if environment variables are available
    if (!projectId || !clientEmail || !privateKey) {
      console.error('Missing Firebase Admin credentials:', {
        projectId: !!projectId,
        clientEmail: !!clientEmail,
        privateKey: !!privateKey
      });
      throw new Error('Missing required Firebase Admin credentials');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL: `https://${projectId}.firebaseio.com`,
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export { admin }; 