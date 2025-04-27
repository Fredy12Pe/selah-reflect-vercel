import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    
    // Get all devotions from the collection
    const db = getFirestore();
    const devotionsSnapshot = await db.collection('devotions').get();
    
    if (devotionsSnapshot.empty) {
      return NextResponse.json({ message: 'No devotions found', dates: [] });
    }
    
    // Extract dates and sample data
    const devotions = devotionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        bibleText: data.bibleText,
        hasReflectionSections: Array.isArray(data.reflectionSections),
        keys: Object.keys(data),
      };
    });
    
    return NextResponse.json({
      message: `Found ${devotions.length} devotions`,
      devotions,
    });
  } catch (error: any) {
    console.error('Error listing devotions:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 