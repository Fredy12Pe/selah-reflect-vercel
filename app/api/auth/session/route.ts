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
    // Get the ID token from the request
    let idToken;
    try {
      const body = await request.json();
      idToken = body.idToken;
      console.log('Session API: Received ID token:', !!idToken);
    } catch (error) {
      console.error('Session API: Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    if (!idToken) {
      console.log('Session API: No ID token provided');
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Skip in development if configured
    if (shouldSkipApiRoutes === true || shouldSkipFirebaseAdmin === true) {
      console.log('Session API: Development mode detected, creating mock session');
      
      // Set a mock cookie in development
      const cookieStore = cookies();
      cookieStore.set('session', 'mock-session-' + Date.now(), {
        maxAge: SESSION_DURATION / 1000, // Convert to seconds
        httpOnly: true,
        secure: false, // Not secure in development
        sameSite: 'lax',
        path: '/',
      });
      
      return NextResponse.json({
        status: 'success',
        message: 'Development mode - mock session created'
      });
    }

    // Initialize Firebase Admin
    console.log('Session API: Initializing Firebase Admin');
    initAdmin();

    // Verify the ID token
    console.log('Session API: Verifying ID token');
    const auth = getAuth();
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
      console.log('Session API: Token verified for user:', decodedToken.uid);
    } catch (tokenError) {
      console.error('Session API: Token verification failed:', tokenError);
      return NextResponse.json(
        { error: 'Invalid ID token: ' + (tokenError instanceof Error ? tokenError.message : 'Unknown error') },
        { status: 401 }
      );
    }

    // Create a session cookie
    console.log('Session API: Creating session cookie');
    let sessionCookie;
    try {
      sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION });
      console.log('Session API: Session cookie created');
    } catch (cookieError) {
      console.error('Session API: Error creating session cookie:', cookieError);
      return NextResponse.json(
        { error: 'Failed to create session cookie' },
        { status: 500 }
      );
    }

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
      { error: 'Failed to create session: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 