import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase/admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// Custom function to initialize Firebase Admin with robust error handling
const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Ensure we log environment variable presence without exposing sensitive data
  console.log('Test Connection API - Firebase environment variables status:', {
    FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY?.length,
  });

  // Get direct access to environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Extensive logging for troubleshooting
  if (!projectId) console.error('Test Connection API - FIREBASE_PROJECT_ID is missing');
  if (!clientEmail) console.error('Test Connection API - FIREBASE_CLIENT_EMAIL is missing');
  if (!privateKey) console.error('Test Connection API - FIREBASE_PRIVATE_KEY is missing');

  // Show partial values for verification without exposing full credentials
  if (projectId) console.log('Test Connection API - FIREBASE_PROJECT_ID starts with:', projectId.substring(0, 5));
  if (clientEmail) console.log('Test Connection API - FIREBASE_CLIENT_EMAIL starts with:', clientEmail.substring(0, 5));
  if (privateKey) console.log('Test Connection API - FIREBASE_PRIVATE_KEY length:', privateKey.length);

  // Ensure private key is properly formatted with newlines
  if (privateKey && !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    if (privateKey.includes('\\n')) {
      console.log('Test Connection API - Replacing \\n in private key with actual newlines');
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
  }

  try {
    // Use hardcoded values as a last resort for debugging
    const app = initializeApp({
      credential: cert({
        projectId: projectId || 'selah-reflect-app',
        clientEmail: clientEmail || 'firebase-adminsdk-fbsvc@selah-reflect-app.iam.gserviceaccount.com',
        privateKey: privateKey || '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'
      })
    });
    console.log('Test Connection API - Firebase Admin initialized successfully with direct credentials');
    return app;
  } catch (error) {
    console.error('Test Connection API - Error initializing Firebase Admin directly:', error);
    throw error;
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('Test Connection API - Attempting to initialize Firebase Admin');
    let firebaseInitialized = false;
    
    try {
      // Try both initialization methods to be resilient
      try {
        initAdmin();
        console.log('Test Connection API - Admin initialized with initAdmin function');
        firebaseInitialized = true;
      } catch (error) {
        console.log('Test Connection API - initAdmin failed, falling back to direct initialization');
        initializeFirebaseAdmin();
        firebaseInitialized = true;
      }
    } catch (error) {
      console.error('Test Connection API - Failed to initialize Firebase Admin:', error);
      return NextResponse.json({
        status: 'error',
        message: 'Failed to initialize Firebase Admin',
        error: error.message,
        firebaseInitialized: false
      });
    }

    // Test Firestore connection
    try {
      const db = getFirestore();
      const testDoc = await db.collection('test').doc('connection').get();
      console.log('Test Connection API - Firestore connection test:', testDoc.exists ? 'successful' : 'doc not found but connection worked');
    } catch (error) {
      console.error('Test Connection API - Firestore connection error:', error);
      return NextResponse.json({
        status: 'error',
        message: 'Firestore connection failed',
        error: error.message,
        firebaseInitialized
      });
    }

    // If we get here, everything worked
    return NextResponse.json({
      status: 'success',
      message: 'Firebase connection successful',
      environmentVariables: {
        projectId: !!process.env.FIREBASE_PROJECT_ID,
        clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      },
      firebaseInitialized
    });
  } catch (error) {
    console.error('Test Connection API - Unexpected error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error during test connection',
      error: error.message
    }, { status: 500 });
  }
} 