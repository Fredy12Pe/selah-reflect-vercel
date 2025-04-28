import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase/admin';
import { shouldSkipApiRoutes, shouldSkipFirebaseAdmin } from '@/lib/utils/environment';
import { cookies } from 'next/headers';

// Session duration: 5 days
const SESSION_DURATION = 60 * 60 * 24 * 5;

// Check if we're in build time
const isBuildTime = shouldSkipApiRoutes || shouldSkipFirebaseAdmin;

export async function POST(request: NextRequest) {
  // Return mock response during build time
  if (isBuildTime) {
    console.log('Skipping session API route execution during build');
    return NextResponse.json({ status: 'success', note: 'Build time mock response' });
  }

  console.log('Session API: Starting session creation');
  try {
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
    const expiresIn = 60 * 60 * 24 * 30 * 1000; // 30 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    console.log('Session API: Session cookie created');

    // Set the cookie with secure attributes
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    // Create response with cookie header
    const response = new NextResponse(
      JSON.stringify({ status: 'success' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Session API: Cookie header set:', sessionCookie.replace(sessionCookie, '[REDACTED]'));
    return response;
  } catch (error: any) {
    console.error('Session API Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 401 }
    );
  }
} 