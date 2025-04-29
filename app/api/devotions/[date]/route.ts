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
    let dateObj;
  try {
      dateObj = parseISO(params.date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }
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
        console.error('Failed to get Firestore instance after initialization');
        throw new Error('Failed to get Firestore instance');
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      
      // More specific error messages
      let errorMessage = 'Server configuration error';
      if (error instanceof Error) {
        if (error.message.includes('Missing required environment variables')) {
          errorMessage = 'Firebase Admin configuration missing: ' + error.message;
        } else if (error.message.includes('initialization skipped during build')) {
          errorMessage = 'API not available during build';
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          date: params.date,
          notFound: true 
        },
        { status: 500 }
      );
    }
    
    // Check authentication
    let isAuthenticated = false;
    const auth = getAuth();

    // First try Bearer token
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        await auth.verifyIdToken(idToken);
        isAuthenticated = true;
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }

    // If token auth failed, try session cookie
    if (!isAuthenticated) {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get('session');
      if (sessionCookie?.value) {
        try {
          await auth.verifySessionCookie(sessionCookie.value, true);
          isAuthenticated = true;
        } catch (error) {
          console.error('Session verification failed:', error);
        }
      }
    }

    // Allow access in development
    if (process.env.NODE_ENV === 'development') {
      isAuthenticated = true;
    }

    if (!isAuthenticated) {
        return NextResponse.json(
        { error: 'You must be signed in to access devotions' },
          { status: 401 }
        );
      }

    // Get the devotion using Admin SDK
    const devotionDoc = await db.collection('devotions').doc(params.date).get();

    // Safely check if document exists - Admin SDK may implement exists differently
    const docExists = devotionDoc && (
      // As a property
      (typeof devotionDoc.exists === 'boolean' && devotionDoc.exists) ||
      // As a function - cast the function to avoid TypeScript complaints
      (typeof devotionDoc.exists === 'function' && (devotionDoc.exists as () => boolean)()) ||
      // Fallback - check if data() returns something
      (devotionDoc.data && typeof devotionDoc.data === 'function' && devotionDoc.data() !== null && Object.keys(devotionDoc.data() || {}).length > 0)
    );

    if (!docExists) {
      // Return a structured response for missing devotions
      return NextResponse.json({
        id: params.date,
        date: params.date,
        bibleText: '',
        reflectionSections: [],
        monthId: format(dateObj, 'MMMM').toLowerCase(),
        month: format(dateObj, 'MMMM'),
        title: 'No Devotion Available',
        content: 'No devotion is available for this date.',
        notFound: true
      }, { status: 200 });
    }

    const data = devotionDoc.data() as Devotion;

    // Format the response to match the Devotion type
    const formattedData: Devotion = {
      id: devotionDoc.id,
      date: data.date || devotionDoc.id,
      bibleText: data.bibleText || data.scriptureReference || '',
      
      // Enhanced handling for reflectionSections with better structure conversion
      reflectionSections: (() => {
        // If reflectionSections already exists with proper structure, use it
        if (data.reflectionSections && Array.isArray(data.reflectionSections)) {
          // Ensure each section has required fields
          return data.reflectionSections.map((section, index) => {
            // If it already has passage and questions
            if (section.passage && section.questions) {
              return section;
            }
            
            // If it has questions but no passage
            if (section.questions && !section.passage) {
              return {
                ...section,
                passage: `${data.bibleText || data.scriptureReference || ''} (Part ${index + 1})` 
              };
            }
            
            // Default case
            return {
              passage: `${data.bibleText || data.scriptureReference || ''} (Part ${index + 1})`,
              questions: Array.isArray(section.questions) ? section.questions : []
            };
          });
        }
        
        // If we have reflectionQuestions but no reflectionSections
        else if (data.reflectionQuestions && Array.isArray(data.reflectionQuestions)) {
          return [{
            passage: data.bibleText || data.scriptureReference || '',
            questions: data.reflectionQuestions
          }];
        }
        
        // Fallback to empty array
        return [];
      })(),
      
      monthId: data.monthId || format(dateObj, 'MMMM').toLowerCase(),
      month: data.month || format(dateObj, 'MMMM'),
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