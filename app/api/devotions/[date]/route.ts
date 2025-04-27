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

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  console.log('Devotions API: Handling GET request for date:', params.date);
  
  // Check if date is valid
  try {
    const dateObj = parseISO(params.date);
  } catch (error) {
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
      // Try both initialization methods to be resilient
      try {
        initAdmin();
        console.log('Admin initialized with initAdmin function');
      } catch (error) {
        console.log('initAdmin failed, falling back to direct initialization');
        initializeFirebaseAdmin();
      }

      db = getFirestore();
      if (!db) {
        throw new Error('Failed to get Firestore instance');
      }
    } catch (error) {
      console.error('Devotions API: Failed to initialize Firebase Admin:', error);
      return NextResponse.json(
        { error: 'Server configuration error', details: error.message },
        { status: 500 }
      );
    }
    
    // TEMPORARY: Skip session cookie check for testing
    // Remove this and uncomment the original code after debugging
    const isDev = true; // Force skip auth for testing
    let userId = 'anonymous';
    
    /* Original authentication code - temporarily disabled
    const isDev = process.env.NODE_ENV === 'development';
    let userId = 'anonymous';
    
    if (!isDev) {
      // Get the session cookie
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get('session');
      console.log('Devotions API: Session cookie details:', {
        present: !!sessionCookie,
        name: sessionCookie?.name,
        value: sessionCookie?.value ? '[REDACTED]' : undefined,
      });

      if (!sessionCookie?.value) {
        console.log('Devotions API: No session cookie found');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Verify the session cookie
      try {
        console.log('Devotions API: Verifying session cookie...');
        const auth = getAuth();
        const decodedClaims = await auth.verifySessionCookie(sessionCookie.value, true);
        userId = decodedClaims.uid;
        console.log('Devotions API: Session verified for user:', userId);
      } catch (error) {
        console.error('Devotions API: Session verification failed:', error);
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        );
      }
    }
    */

    // Get the devotion using Admin SDK
    console.log('Devotions API: Getting Firestore document...');
    const devotionDoc = await db.collection('devotions').doc(params.date).get();

    console.log('Devotions API: Document exists:', devotionDoc.exists);
    if (!devotionDoc.exists) {
      console.log('Devotions API: No devotion found for date:', params.date);
      
      // Try to find the most recent available devotion as a fallback
      try {
        const dateObj = parseISO(params.date);
        
        // Check up to 30 days back for an existing devotion
        for (let i = 1; i <= 30; i++) {
          const prevDate = subDays(dateObj, i);
          const prevDateStr = format(prevDate, 'yyyy-MM-dd');
          console.log('Devotions API: Trying previous date:', prevDateStr);
          
          const prevDevotionDoc = await db.collection('devotions').doc(prevDateStr).get();
          if (prevDevotionDoc.exists) {
            console.log('Devotions API: Found devotion for previous date:', prevDateStr);
            return NextResponse.json(
              { 
                error: 'Devotion not found', 
                message: `No devotion for ${params.date}, but found one for ${prevDateStr}`,
                suggestedDate: prevDateStr
              },
              { status: 404 }
            );
          }
        }
      } catch (error) {
        console.error('Devotions API: Error finding previous devotion:', error);
      }
      
      return NextResponse.json(
        { error: 'Devotion not found' },
        { status: 404 }
      );
    }

    const data = devotionDoc.data() as Devotion;
    console.log('Devotions API: Retrieved data:', {
      id: devotionDoc.id,
      date: data.date,
      bibleText: data.bibleText,
      hasReflectionSections: Array.isArray(data.reflectionSections),
      sectionCount: Array.isArray(data.reflectionSections) ? data.reflectionSections.length : 0,
    });

    // Format the response to match the Devotion type
    const formattedData: Devotion = {
      id: devotionDoc.id,
      date: data.date,
      bibleText: data.bibleText,
      reflectionSections: data.reflectionSections || []
    };

    return NextResponse.json(formattedData);

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