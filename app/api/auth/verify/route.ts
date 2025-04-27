import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase/admin';
import { shouldSkipApiRoutes, shouldSkipFirebaseAdmin } from '@/lib/utils/environment';

// Check if we're in build time
const isBuildTime = shouldSkipApiRoutes || shouldSkipFirebaseAdmin;

export async function GET(request: NextRequest) {
  // Return mock response during build time
  if (isBuildTime) {
    console.log('Skipping verify API route execution during build');
    return NextResponse.json({ 
      status: 'success', 
      uid: 'mock-user-id',
      note: 'Build time mock response'
    });
  }

  try {
    // Initialize Firebase Admin
    initAdmin();

    // Get the session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No session cookie found' },
        { status: 401 }
      );
    }

    // Verify the session cookie
    const auth = getAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    return NextResponse.json({
      status: 'success',
      uid: decodedClaims.uid,
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
} 