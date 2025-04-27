import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    
    // Date to test
    const date = '2025-04-23';
    
    // Get the devotion using Admin SDK without auth check
    const db = getFirestore();
    const devotionDoc = await db.collection('devotions').doc(date).get();

    if (!devotionDoc.exists) {
      return NextResponse.json(
        { error: 'Devotion not found' },
        { status: 404 }
      );
    }

    const data = devotionDoc.data();
    
    return NextResponse.json({
      id: devotionDoc.id,
      ...data,
      _debug: {
        hasData: !!data,
        keys: data ? Object.keys(data) : [],
        hasBibleText: data?.bibleText ? true : false,
        hasScriptureReference: data?.scriptureReference ? true : false,
      }
    });
  } catch (error: any) {
    console.error('Error fetching test devotion:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 