import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase/admin';
import { shouldSkipApiRoutes, shouldSkipFirebaseAdmin } from '@/lib/utils/environment';

export async function GET(request: NextRequest) {
  console.log('Verify Session API: Starting session verification');
  
  try {
    // Check for development mode overrides
    if (process.env.NODE_ENV !== 'production' || shouldSkipApiRoutes || shouldSkipFirebaseAdmin) {
      console.log('Verify Session API: Development mode detected, returning authenticated');
      
      return NextResponse.json({ 
        authenticated: true,
        message: 'Development mode - auth check bypassed',
        environment: process.env.NODE_ENV
      });
    }
    
    // Check for session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    console.log('Verify Session API: Session cookie present:', !!sessionCookie);
    
    if (!sessionCookie?.value) {
      console.log('Verify Session API: No session cookie found');
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No session cookie found' 
      });
    }
    
    // Initialize Firebase Admin
    console.log('Verify Session API: Initializing Firebase Admin');
    try {
      initAdmin();
    } catch (adminError) {
      console.error('Verify Session API: Firebase Admin initialization failed:', adminError);
      
      // Return authenticated in development even if admin init fails
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ 
          authenticated: true,
          message: 'Development fallback after admin init failure',
          error: adminError instanceof Error ? adminError.message : String(adminError)
        });
      }
      
      return NextResponse.json(
        { error: 'Server configuration error', authenticated: false },
        { status: 500 }
      );
    }
    
    const auth = getAuth();

    // Verify the session cookie
    try {
      console.log('Verify Session API: Verifying session cookie');
      const decodedClaims = await auth.verifySessionCookie(sessionCookie.value);
      console.log('Verify Session API: Session verified for user:', decodedClaims.uid);
      
      return NextResponse.json({ 
        authenticated: true,
        user: {
          uid: decodedClaims.uid,
          email: decodedClaims.email,
          emailVerified: decodedClaims.email_verified,
        }
      });
    } catch (verifyError) {
      console.error('Verify Session API: Session verification failed:', verifyError);
      
      // Return success in development even if verification fails
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ 
          authenticated: true,
          message: 'Development fallback - session verification bypassed',
          error: verifyError instanceof Error ? verifyError.message : String(verifyError)
        });
      }
      
      return NextResponse.json({
        authenticated: false,
        error: 'Invalid session',
        details: verifyError instanceof Error ? verifyError.message : String(verifyError)
      });
    }
  } catch (error) {
    console.error('Verify Session API: Unexpected error:', error);
    
    // Return success in development mode
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ 
        authenticated: true,
        message: 'Development fallback - general error bypass',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return NextResponse.json(
      { error: 'Internal server error', authenticated: false },
      { status: 500 }
    );
  }
} 