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
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

  // Log environment variable status (without exposing values)
  console.log('Firebase Admin environment variables status:', {
    projectId: !!projectId,
    clientEmail: !!clientEmail,
    privateKey: !!privateKey,
    privateKeyLength: privateKey.length
  });

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials');
  }

  // Handle private key formatting
  try {
    // If the key is JSON stringified, parse it
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = JSON.parse(privateKey);
    }
    
    // Replace literal \n with newlines if they exist
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Ensure the key has the correct header and footer
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
    }

    console.log('Private key format:', {
      hasHeader: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
      hasFooter: privateKey.includes('-----END PRIVATE KEY-----'),
      containsNewlines: privateKey.includes('\n'),
      length: privateKey.length
    });
  } catch (error) {
    console.error('Error formatting private key:', error);
    throw error;
  }

  // Initialize Firebase Admin
  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
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
          privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
          privateKeyFormat: process.env.FIREBASE_PRIVATE_KEY ? {
            startsWithQuote: process.env.FIREBASE_PRIVATE_KEY.startsWith('"'),
            endsWithQuote: process.env.FIREBASE_PRIVATE_KEY.endsWith('"'),
            containsHeader: process.env.FIREBASE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----'),
            containsFooter: process.env.FIREBASE_PRIVATE_KEY.includes('-----END PRIVATE KEY-----'),
            length: process.env.FIREBASE_PRIVATE_KEY.length
          } : null
        }
      });
    }

    // Try to read test documents from both months and hymns collections
    try {
      const db = getFirestore();
      
      // Test reading from months collection
      const monthRef = db.collection('months').doc('april');
      const monthDoc = await monthRef.get();
      
      // Test reading from hymns collection
      const hymnRef = db.collection('hymns').doc('hymn1');
      const hymnDoc = await hymnRef.get();
      
      return NextResponse.json({
        status: 'success',
        message: 'Firebase connection successful',
        monthData: {
          exists: monthDoc.exists,
          data: monthDoc.exists ? monthDoc.data() : null
        },
        hymnData: {
          exists: hymnDoc.exists,
          data: hymnDoc.exists ? hymnDoc.data() : null
        },
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