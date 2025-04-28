import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    const auth = getAuth();

    // First try Bearer token
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        await auth.verifyIdToken(idToken);
        return NextResponse.json({ status: 'authenticated' });
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }

    // If token auth failed, try session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    if (sessionCookie?.value) {
      try {
        await auth.verifySessionCookie(sessionCookie.value, true);
        return NextResponse.json({ status: 'authenticated' });
      } catch (error) {
        console.error('Session verification failed:', error);
      }
    }

    // Allow in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ status: 'authenticated' });
    }

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 