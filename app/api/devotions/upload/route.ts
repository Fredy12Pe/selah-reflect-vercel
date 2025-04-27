import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';
import { Devotion } from '@/lib/types/devotion';

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    
    // Get the session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the session cookie
    try {
      const auth = getAuth();
      await auth.verifySessionCookie(sessionCookie.value, true);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get the devotion data from the request
    const devotionData: Devotion = await request.json();

    // Validate the devotion data
    if (!devotionData.date || !devotionData.scriptureReference || !devotionData.reflectionQuestions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure reflection questions are provided
    if (!Array.isArray(devotionData.reflectionQuestions) || devotionData.reflectionQuestions.length < 1) {
      return NextResponse.json(
        { error: 'Must provide at least one reflection question' },
        { status: 400 }
      );
    }

    // Create reflection sections from the scripture reference and questions
    const reflectionSections = [{
      passage: devotionData.scriptureReference,
      questions: devotionData.reflectionQuestions || []
    }];

    // Format the devotion data
    const formattedDevotion: Devotion = {
      date: devotionData.date,
      title: devotionData.title,
      scriptureReference: devotionData.scriptureReference,
      scriptureText: devotionData.scriptureText,
      content: devotionData.content,
      prayer: devotionData.prayer,
      bibleText: devotionData.scriptureReference, // Using scriptureReference as bibleText
      reflectionSections: reflectionSections,
      reflectionQuestions: devotionData.reflectionQuestions
    };

    // Save to Firestore
    const db = getFirestore();
    await db.collection('devotions').doc(devotionData.date).set(formattedDevotion);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error uploading devotion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 