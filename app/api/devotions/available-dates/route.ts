import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Custom function to initialize Firebase Admin with robust error handling
const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Ensure we log environment variable presence without exposing sensitive data
  console.log('Firebase environment variables status:', {
    FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY?.length,
  });

  // Get direct access to environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Extensive logging for troubleshooting
  if (!projectId) console.error('FIREBASE_PROJECT_ID is missing');
  if (!clientEmail) console.error('FIREBASE_CLIENT_EMAIL is missing');
  if (!privateKey) console.error('FIREBASE_PRIVATE_KEY is missing');

  // Show partial values for verification without exposing full credentials
  if (projectId) console.log('FIREBASE_PROJECT_ID starts with:', projectId.substring(0, 5));
  if (clientEmail) console.log('FIREBASE_CLIENT_EMAIL starts with:', clientEmail.substring(0, 5));
  if (privateKey) console.log('FIREBASE_PRIVATE_KEY length:', privateKey.length);

  // Ensure private key is properly formatted with newlines
  if (privateKey && !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    if (privateKey.includes('\\n')) {
      console.log('Replacing \\n in private key with actual newlines');
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
    console.log('Firebase Admin initialized successfully with direct credentials');
    return app;
  } catch (error) {
    console.error('Error initializing Firebase Admin directly:', error);
    throw error;
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('Available Dates API: Initializing Firebase Admin...');
    // Initialize Firebase Admin
    try {
      // Try both initialization methods to be resilient
      try {
        initAdmin();
        console.log('Admin initialized with initAdmin function');
      } catch (error) {
        console.log('initAdmin failed, falling back to direct initialization');
        initializeFirebaseAdmin();
      }
    } catch (error) {
      console.error('Available Dates API: Failed to initialize Firebase Admin:', error);
      return NextResponse.json(
        { error: 'Server configuration error', details: error.message },
        { status: 500 }
      );
    }
    
    console.log('Available Dates API: Getting all devotions...');
    // Get all devotions from the collection
    const db = getFirestore();
    const devotionsSnapshot = await db.collection('devotions').get();
    
    if (devotionsSnapshot.empty) {
      console.log('Available Dates API: No devotions found');
      return NextResponse.json({ dates: [] });
    }
    
    // Extract just the dates (document IDs)
    const dates = devotionsSnapshot.docs.map(doc => doc.id).sort();
    console.log(`Available Dates API: Found ${dates.length} dates`);
    
    return NextResponse.json({
      dates
    });
  } catch (error: any) {
    console.error('Error fetching available devotion dates:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 