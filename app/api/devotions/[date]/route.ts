import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';
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

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  console.log('Devotions API: Handling GET request for date:', params.date);
  
  // Check if date is valid
  try {
    const dateObj = parseISO(params.date);
    if (isFuture(dateObj)) {
      console.log('Devotions API: Request for future date rejected:', params.date);
      return NextResponse.json(
        { error: 'Future dates are not available' },
        { status: 404 }
      );
    }
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 