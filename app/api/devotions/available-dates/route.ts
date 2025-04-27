import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    
    // Get all devotions from the collection
    const db = getFirestore();
    const devotionsSnapshot = await db.collection('devotions').get();
    
    if (devotionsSnapshot.empty) {
      return NextResponse.json({ dates: [] });
    }
    
    // Extract just the dates (document IDs)
    const dates = devotionsSnapshot.docs.map(doc => doc.id).sort();
    
    return NextResponse.json({
      dates
    });
  } catch (error: any) {
    console.error('Error fetching available devotion dates:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 