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
  console.log('Devotions API: Handling GET request for date:', params.date);
  
  // Check if date is valid
  try {
    const dateObj = parseISO(params.date);
  } catch (error: any) {
    console.error('Devotions API: Invalid date format:', params.date);
    return NextResponse.json(
      { error: 'Invalid date format' },
      { status: 400 }
    );
  }
  
  try {
    // Initialize Firebase Admin
    console.log('Devotions API: Initializing Firebase Admin...');
    let db;
    
    try {
      initAdmin();
      db = getFirestore();
      if (!db) {
        throw new Error('Failed to get Firestore instance');
      }
    } catch (error) {
      console.error('Devotions API: Failed to initialize Firebase Admin:', error);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const isDev = process.env.NODE_ENV === 'development';
    let userId = 'anonymous';
    
    if (!isDev) {
      // Get the session cookie
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get('session');

      if (!sessionCookie?.value) {
        console.log('Devotions API: No session cookie found');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Verify the session cookie
      try {
        const auth = getAuth();
        const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true);
        userId = decodedClaims.uid;
      } catch (error) {
        console.error('Devotions API: Session verification failed:', error);
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        );
      }
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
      // Include legacy fields if they exist
      scriptureReference: data.scriptureReference,
      scriptureText: data.scriptureText,
      title: data.title,
      content: data.content,
      prayer: data.prayer,
      reflectionQuestions: data.reflectionQuestions
    };

    // Return response with caching headers
    return NextResponse.json(formattedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error: any) {
    console.error('Devotions API: Error processing request:', error);
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