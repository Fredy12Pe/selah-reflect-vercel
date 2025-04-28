import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { Devotion } from '@/lib/types/devotion';
import { isFuture, parseISO, format, subDays } from 'date-fns';

// Configure this route for static builds
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 3600; // Cache for 1 hour

// Add generateStaticParams to make it compatible with static exports
export function generateStaticParams() {
  // This is just a placeholder to make the static export work
  // For static exports, this API will be called client-side
  return [{ date: 'placeholder' }];
}

// Custom function to initialize Firebase Admin with robust error handling
const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Get direct access to environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Extensive logging for troubleshooting
  if (!projectId) console.error('FIREBASE_PROJECT_ID is missing');
  if (!clientEmail) console.error('FIREBASE_CLIENT_EMAIL is missing');
  if (!privateKey) console.error('FIREBASE_PRIVATE_KEY is missing');

  // Ensure private key is properly formatted with newlines
  if (privateKey && !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    if (privateKey.includes('\\n')) {
      console.log('Replacing \\n in private key with actual newlines');
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
  }

  try {
    const app = initializeApp({
      credential: cert({
        projectId: projectId || 'selah-reflect-app',
        clientEmail: clientEmail || 'firebase-adminsdk-fbsvc@selah-reflect-app.iam.gserviceaccount.com',
        privateKey: privateKey || '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'
      })
    });
    console.log('Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    // Check if date is valid
    try {
      const dateObj = parseISO(params.date);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Initialize Firebase Admin
    let db;
    try {
      initAdmin();
      db = getFirestore();
      if (!db) {
        throw new Error('Failed to get Firestore instance');
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get the session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');

    // Check authentication
    let isAuthenticated = false;
    if (sessionCookie?.value) {
      try {
        const auth = getAuth();
        await auth.verifySessionCookie(sessionCookie.value, true);
        isAuthenticated = true;
      } catch (error) {
        console.error('Session verification failed:', error);
      }
    }

    // Allow access in development or if authenticated
    if (!isAuthenticated && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'You must be signed in to access devotions' },
        { status: 401 }
      );
    }

    // Get the devotion using Admin SDK
    const devotionDoc = await db.collection('devotions').doc(params.date).get();

    if (!devotionDoc.exists) {
      return NextResponse.json(
        { error: 'Devotion not found' },
        { status: 404 }
      );
    }

    const data = devotionDoc.data() as Devotion;

    // Format the response to match the Devotion type
    const formattedData: Devotion = {
      id: devotionDoc.id,
      date: data.date || devotionDoc.id,
      bibleText: data.bibleText || data.scriptureReference || '',
      reflectionSections: data.reflectionSections || 
        (data.reflectionQuestions ? [{ questions: data.reflectionQuestions }] : []),
      monthId: data.monthId,
      month: data.month,
      updatedAt: data.updatedAt,
      updatedBy: data.updatedBy,
      scriptureReference: data.scriptureReference,
      scriptureText: data.scriptureText,
      title: data.title,
      content: data.content,
      prayer: data.prayer,
      reflectionQuestions: data.reflectionQuestions
    };

    // Return response with caching headers
    const headers = new Headers({
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    });

    // Add CORS headers
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return NextResponse.json(formattedData, { headers });

  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 