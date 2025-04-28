import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase/admin';
import { shouldSkipApiRoutes, shouldSkipFirebaseAdmin } from '@/lib/utils/environment';

export async function GET() {
  try {
    // Skip verification in development if configured
    if (shouldSkipApiRoutes === true || shouldSkipFirebaseAdmin === true) {
      console.log('Verify API: Skipping verification in development');
      return NextResponse.json({ status: 'success', verified: true });
    }

    // Initialize Firebase Admin
    initAdmin();
    const auth = getAuth();
    const sessionCookie = cookies().get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ status: 'error', verified: false }, { status: 401 });
    }

    // Verify the session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    return NextResponse.json({
      status: 'success',
      verified: true,
      uid: decodedClaims.uid
    });
  } catch (error) {
    console.error('Verify endpoint error:', error);
    return NextResponse.json({ status: 'error', verified: false }, { status: 401 });
  }
} 