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
      console.log('Session API: Received ID token:', {
        length: idToken ? idToken.length : 0,
        type: typeof idToken,
        firstChars: idToken ? (idToken.substring(0, 10) + '...') : 'none'
      });
      
      // Basic token validation - less strict
      if (!idToken || typeof idToken !== 'string') {
        console.error('Session API: Invalid token format received');
        return NextResponse.json(
          { error: 'Invalid token format' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Session API: Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Handle development mode
    if (process.env.NODE_ENV !== 'production' || shouldSkipApiRoutes || shouldSkipFirebaseAdmin) {
      console.log('Session API: Development mode or skip flags detected, creating mock session');
      
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
    try {
      initAdmin();
    } catch (adminError) {
      console.error('Session API: Firebase Admin initialization failed:', adminError);
      
      // In case of admin initialization error, create a mock session for development
      if (process.env.NODE_ENV !== 'production') {
        console.log('Session API: Using dev fallback after admin init failure');
        const cookieStore = cookies();
        cookieStore.set('session', 'mock-session-fallback-' + Date.now(), {
          maxAge: SESSION_DURATION / 1000,
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
        });
        
        return NextResponse.json({
          status: 'success',
          message: 'Development fallback session created after admin init failure'
        });
      }
      
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify the ID token
    console.log('Session API: Verifying ID token');
    const auth = getAuth();
    
    let decodedToken;
    try {
      // Clean the token
      idToken = idToken.trim();
      decodedToken = await auth.verifyIdToken(idToken);
      console.log('Session API: Token verified for user:', decodedToken.uid);
    } catch (tokenError) {
      console.error('Session API: Token verification failed:', tokenError);
      
      // Detailed error logging to help diagnose the issue
      const errorMessage = tokenError instanceof Error ? tokenError.message : 'Unknown error';
      console.error('Session API: Error details:', errorMessage);
      
      // For development, create a fallback session
      if (process.env.NODE_ENV !== 'production') {
        console.log('Session API: Creating dev fallback after token verification failure');
        const cookieStore = cookies();
        cookieStore.set('session', 'mock-session-token-failed-' + Date.now(), {
          maxAge: SESSION_DURATION / 1000,
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
        });
        
        return NextResponse.json({
          status: 'success',
          message: 'Development fallback session created after token verification failure'
        });
      }
      
      return NextResponse.json(
        { error: 'Invalid ID token: ' + errorMessage },
        { status: 401 }
      );
    }

    // Create a session cookie
    console.log('Session API: Creating session cookie');
    let sessionCookie;
    try {
      sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION });
      console.log('Session API: Session cookie created successfully');
    } catch (cookieError) {
      console.error('Session API: Error creating session cookie:', cookieError);
      
      // Development fallback
      if (process.env.NODE_ENV !== 'production') {
        console.log('Session API: Using dev fallback after session cookie creation failure');
        const cookieStore = cookies();
        cookieStore.set('session', 'mock-session-cookie-failed-' + Date.now(), {
          maxAge: SESSION_DURATION / 1000,
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
        });
        
        return NextResponse.json({
          status: 'success',
          message: 'Development fallback session created after cookie creation failure'
        });
      }
      
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
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Session API Error:', error);
    
    // Development fallback for any other errors
    if (process.env.NODE_ENV !== 'production') {
      console.log('Session API: Using dev fallback after general error');
      const cookieStore = cookies();
      cookieStore.set('session', 'mock-session-general-error-' + Date.now(), {
        maxAge: SESSION_DURATION / 1000,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
      
      return NextResponse.json({
        status: 'success',
        message: 'Development fallback session created after general error'
      });
    }
    
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