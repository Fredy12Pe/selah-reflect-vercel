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

      // Handle various private key formats
      // Log key format for debugging (first and last few chars)
      if (privateKey) {
        console.log('Private key format check:', {
          length: privateKey.length,
          startsWith: privateKey.substring(0, 10) + '...',
          endsWith: '...' + privateKey.substring(privateKey.length - 10),
          includesBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
          includesEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
          includesEscapedNewlines: privateKey.includes('\\n'),
          includesActualNewlines: privateKey.includes('\n'),
          includesQuotes: privateKey.startsWith('"') || privateKey.endsWith('"'),
        });
      }

      // Process the private key with aggressive formatting
      if (privateKey) {
        // Remove any surrounding quotes
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          console.log('Removing surrounding quotes from private key');
          privateKey = privateKey.slice(1, -1);
        }
        
        // Replace escaped newlines
        if (privateKey.includes('\\n')) {
          console.log('Replacing \\n with actual newlines in private key');
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
        
        // If key doesn't have proper PEM format, add it
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          console.log('Adding PEM headers to private key');
          privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
        }
        
        // Log final format check
        console.log('Final private key format check:', {
          length: privateKey.length,
          hasBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
          hasEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
          hasNewlines: privateKey.includes('\n'),
        });
      }

      console.log('Initializing Firebase Admin with cert credentials');
      
      // Initialize the app with cert
      try {
        const app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log('Firebase Admin initialized successfully with cert');
        return app;
      } catch (certError) {
        console.error('Error initializing with cert:', certError);
        throw certError;
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
    
    // More detailed error message for private key issues
    if (error.message && (
        error.message.includes('private key') || 
        error.message.includes('PEM') ||
        error.message.includes('DECODER') || 
        error.message.includes('unsupported')
      )) {
      console.error('This appears to be a private key formatting issue. Check that your private key:');
      console.error('1. Includes the BEGIN/END PRIVATE KEY headers');
      console.error('2. Has proper newlines (not \\n escape sequences)');
      console.error('3. Is not wrapped in extra quotes');
      console.error('4. Private key value:', process.env.FIREBASE_PRIVATE_KEY ? '[LENGTH: ' + process.env.FIREBASE_PRIVATE_KEY.length + ']' : 'undefined');
    }
    
    throw error;
  }
} 