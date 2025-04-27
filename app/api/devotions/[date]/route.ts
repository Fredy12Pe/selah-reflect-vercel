import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';
import { Devotion } from '@/lib/types/devotion';

// Configure this route for static builds
export const dynamic = 'error';
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
  
  try {
    // Initialize Firebase Admin
    console.log('Devotions API: Initializing Firebase Admin...');
    initAdmin();
    
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
      console.log('Devotions API: Session verified for user:', decodedClaims.uid);
    } catch (error) {
      console.error('Devotions API: Session verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get the devotion using Admin SDK
    console.log('Devotions API: Getting Firestore document...');
    const db = getFirestore();
    const devotionDoc = await db.collection('devotions').doc(params.date).get();

    console.log('Devotions API: Document exists:', devotionDoc.exists);
    if (!devotionDoc.exists) {
      console.log('Devotions API: No devotion found for date:', params.date);
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
      firstSectionQuestions: data.reflectionSections?.[0]?.questions,
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