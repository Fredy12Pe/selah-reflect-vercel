import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('Available Dates API: Initializing Firebase Admin...');
    // Initialize Firebase Admin
    initAdmin();
    
    console.log('Available Dates API: Getting all devotions...');
    // Get all devotions from the collection
    const db = getFirestore();
    const devotionsSnapshot = await db.collection('devotions').get();
    
    if (devotionsSnapshot.empty) {
      console.log('Available Dates API: No devotions found');
      return NextResponse.json({ dates: [] });
    }
    
    // Extract just the dates (document IDs)
    const dates = devotionsSnapshot.docs.map(doc => doc.id).sort();
    console.log(`Available Dates API: Found ${dates.length} dates`);
    
    return NextResponse.json({
      dates
    });
  } catch (error: any) {
    console.error('Error fetching available devotion dates:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 