import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Get environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Log environment variable status (without exposing values)
  console.log('Firebase Admin environment variables status:', {
    projectId: !!projectId,
    clientEmail: !!clientEmail,
    privateKey: !!privateKey
  });

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials');
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
};

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    try {
      initializeFirebaseAdmin();
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
      return NextResponse.json({
        status: 'error',
        message: 'Failed to initialize Firebase Admin',
        error: error instanceof Error ? error.message : 'Unknown error',
        envVars: {
          projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: !!process.env.FIREBASE_PRIVATE_KEY
        }
      });
    }

    // Try to read a test document
    try {
      const db = getFirestore();
      const testRef = db.collection('devotions').doc('monday-april-21');
      const testDoc = await testRef.get();
      
      return NextResponse.json({
        status: 'success',
        message: 'Firebase connection successful',
        exists: testDoc.exists,
        data: testDoc.exists ? testDoc.data() : null,
        envVars: {
          projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: !!process.env.FIREBASE_PRIVATE_KEY
        }
      });
    } catch (error) {
      console.error('Firestore read error:', error);
      return NextResponse.json({
        status: 'error',
        message: 'Failed to read from Firestore',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 