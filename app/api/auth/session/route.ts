import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase/admin';
import { shouldSkipApiRoutes, shouldSkipFirebaseAdmin } from '@/lib/utils/environment';
import { cookies } from 'next/headers';

// Session duration: 5 days
const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000; // in milliseconds

export async function POST(request: NextRequest) {
  console.log('Session API: Starting session creation');
  try {
    // Skip in development if configured
    if (shouldSkipApiRoutes === true || shouldSkipFirebaseAdmin === true) {
      console.log('Session API: Skipping in development mode');
      return NextResponse.json({ status: 'success', note: 'Development mode' });
    }

    // Initialize Firebase Admin
    console.log('Session API: Initializing Firebase Admin');
    initAdmin();

    const { idToken } = await request.json();
    console.log('Session API: Received ID token:', !!idToken);

    if (!idToken) {
      console.log('Session API: No ID token provided');
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    console.log('Session API: Verifying ID token');
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('Session API: Token verified for user:', decodedToken.uid);

    // Create a session cookie
    console.log('Session API: Creating session cookie');
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION });
    console.log('Session API: Session cookie created');

    // Set the cookie
    const cookieStore = cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: SESSION_DURATION / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      path: '/',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Session API Error:', error);
    
    // More specific error handling
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'ID token has expired' },
        { status: 401 }
      );
    } else if (error.code === 'auth/invalid-id-token') {
      return NextResponse.json(
        { error: 'Invalid ID token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
} 