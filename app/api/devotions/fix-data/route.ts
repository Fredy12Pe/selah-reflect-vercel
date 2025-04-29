import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';
import { format, parseISO } from 'date-fns';
import { Devotion, ReflectionSection } from '@/lib/types/devotion';

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    const db = getFirestore();
    
    // Get date from query string
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }
    
    // Get the document
    const devotionDoc = await db.collection('devotions').doc(date).get();
    
    if (!devotionDoc.exists) {
      return NextResponse.json(
        { error: 'Devotion not found for this date' },
        { status: 404 }
      );
    }
    
    const data = devotionDoc.data() as Partial<Devotion>;
    
    return NextResponse.json({
      message: 'Current data in Firestore',
      date,
      data,
      hasReflectionSections: !!data?.reflectionSections,
      reflectionSectionsCount: Array.isArray(data?.reflectionSections) ? data.reflectionSections.length : 0,
      hasOldFormat: !!data?.reflectionQuestions,
      reflectionQuestionsCount: Array.isArray(data?.reflectionQuestions) ? data.reflectionQuestions.length : 0
    });
  } catch (error: any) {
    console.error('Error checking devotion data:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

interface UpdateDevotionRequest {
  date: string;
  bibleText?: string;
  reflectionSections?: ReflectionSection[];
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    const db = getFirestore();
    
    // Get data from request body
    const { date, bibleText, reflectionSections } = await request.json() as UpdateDevotionRequest;
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }
    
    // Get the document
    const devotionDoc = await db.collection('devotions').doc(date).get();
    
    const data = devotionDoc.exists ? (devotionDoc.data() as Partial<Devotion>) : {};
    
    // Prepare updated data
    const updatedData = {
      ...data,
      // Add these fields if provided
      ...(bibleText && { bibleText }),
      // If reflectionSections is provided, update or create them
      ...(reflectionSections && { 
        reflectionSections,
        // Also update the legacy field for backward compatibility
        reflectionQuestions: reflectionSections.flatMap(section => section.questions || [])
      }),
      updatedAt: new Date().toISOString(),
    };
    
    // Update or create the document
    await db.collection('devotions').doc(date).set(updatedData, { merge: true });
    
    // Get the updated document
    const updatedDoc = await db.collection('devotions').doc(date).get();
    
    return NextResponse.json({
      message: 'Devotion data updated successfully',
      date,
      data: updatedDoc.data()
    });
  } catch (error: any) {
    console.error('Error updating devotion data:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 