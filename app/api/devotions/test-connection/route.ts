import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const results = {
    environment: process.env.NODE_ENV,
    firebaseInitialized: false,
    firestoreConnected: false,
    authStatus: 'unknown',
    cookiesPresent: false,
    sessionCookiePresent: false,
    collections: [],
    devotionsCount: 0,
    timestamp: new Date().toISOString(),
    availableDates: [],
    errors: [] as string[]
  };

  try {
    // Check environment variables
    results.envVars = {
      projectId: !!process.env.FIREBASE_PROJECT_ID || !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL || !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: !!process.env.FIREBASE_PRIVATE_KEY || !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    };

    // Check cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    results.cookiesPresent = allCookies.length > 0;
    results.sessionCookiePresent = !!cookieStore.get('session');
    results.cookieNames = allCookies.map(cookie => cookie.name);

    // Initialize Firebase Admin
    try {
      initAdmin();
      results.firebaseInitialized = true;
    } catch (error: any) {
      results.errors.push(`Firebase initialization error: ${error.message}`);
    }

    if (results.firebaseInitialized) {
      try {
        // Try to connect to Firestore
        const db = getFirestore();
        if (db) {
          results.firestoreConnected = true;

          // Try listing collections
          const collections = await db.listCollections();
          results.collections = collections.map(col => col.id);

          // Try getting devotions
          if (results.collections.includes('devotions')) {
            const devotionsCollection = await db.collection('devotions').get();
            results.devotionsCount = devotionsCollection.size;
            results.availableDates = devotionsCollection.docs.map(doc => doc.id).sort();
          }
        }
      } catch (firestoreError: any) {
        results.errors.push(`Firestore connection error: ${firestoreError.message}`);
      }

      // Try auth verification if session cookie is present
      if (results.sessionCookiePresent) {
        try {
          const auth = getAuth();
          const sessionCookie = cookieStore.get('session')!.value;
          const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
          results.authStatus = 'authenticated';
          results.userId = decodedClaims.uid;
        } catch (authError: any) {
          results.authStatus = 'invalid';
          results.errors.push(`Session verification error: ${authError.message}`);
        }
      } else {
        results.authStatus = 'no_session';
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    results.errors.push(`Global error: ${error.message}`);
    return NextResponse.json(results, { status: 500 });
  }
} 