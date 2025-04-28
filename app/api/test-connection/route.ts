import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase
    const db = getFirebaseDb();
    if (!db) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to initialize Firebase',
        error: 'Database connection error'
      });
    }

    // Try to read a test document
    try {
      const testRef = doc(db, 'devotions', 'monday-april-21');
      const testDoc = await getDoc(testRef);
      
      return NextResponse.json({
        status: 'success',
        message: 'Firebase connection successful',
        exists: testDoc.exists(),
        data: testDoc.exists() ? testDoc.data() : null
      });
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to read from Firestore',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 