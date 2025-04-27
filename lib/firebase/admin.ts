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
      let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      
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

      // Process the private key with more robust handling
      // First check if it's already in the correct format
      if (privateKey && !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.log('Private key needs formatting, converting escaped newlines');
        
        // Handle JSON stringified version from Vercel
        if (privateKey.includes('\\n')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
        
        // Double check if we have the header now
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          console.warn('Private key still doesn\'t have the expected format after replacing newlines');
        }
      }

      console.log('Initializing Firebase Admin with cert credentials');
      
      // Initialize the app
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
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
    
    // More detailed error message for private key issues
    if (error.message && (
        error.message.includes('private key') || 
        error.message.includes('DECODER') || 
        error.message.includes('unsupported')
      )) {
      console.error('This appears to be a private key formatting issue. Check that your private key:');
      console.error('1. Includes the BEGIN/END PRIVATE KEY headers');
      console.error('2. Has proper newlines (not \\n escape sequences)');
      console.error('3. Is not wrapped in extra quotes');
    }
    
    throw error;
  }
} 