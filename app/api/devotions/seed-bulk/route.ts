import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    const db = getFirestore();
    
    // Get devotion data from request body
    const devotions = await request.json();
    
    if (!Array.isArray(devotions)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array of devotions.' },
        { status: 400 }
      );
    }

    // Add all devotions in parallel
    await Promise.all(
      devotions.map(devotion => 
        db.collection('devotions').doc(devotion.date).set(devotion)
      )
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Devotions added successfully',
      count: devotions.length
    });
  } catch (error: any) {
    console.error('Error seeding devotions:', error);
    return NextResponse.json(
      { error: 'Failed to seed devotions' },
      { status: 500 }
    );
  }
} 