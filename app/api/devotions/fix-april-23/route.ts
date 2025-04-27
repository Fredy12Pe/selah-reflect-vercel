import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    const db = getFirestore();
    
    // The correct date format from the database
    const dateToFix = "2025-04-23";
    
    // Updated reflection sections with correct questions
    const updatedReflectionSections = [
      {
        passage: "General",
        questions: [
          "Reflect on Jesus' greeting to his disciples.",
          "The disciples were frightened because they thought they were seeing a ghost when Jesus appeared. What does Jesus do to settle the disciples' doubts about his resurrection (vv. 36, 39, 43, 44)?",
          "Reflect on Jesus' question: \"Why are you troubled, and why do doubts arise in your hearts?\" (v. 38). How does the reality of the resurrection give me peace in the midst of fears?"
        ]
      }
    ];

    // Update document in Firestore
    const devotionRef = db.collection('devotions').doc(dateToFix);
    
    // First check if the document exists
    const doc = await devotionRef.get();
    if (!doc.exists) {
      return NextResponse.json({ 
        success: false, 
        message: `Devotion for ${dateToFix} not found` 
      }, { status: 404 });
    }
    
    // Get current data for comparison
    const currentData = doc.data();
    
    // Update only the reflection sections field
    await devotionRef.update({
      reflectionSections: updatedReflectionSections
    });

    return NextResponse.json({ 
      success: true, 
      message: 'April 23 devotion questions updated successfully',
      date: dateToFix,
      previousQuestions: currentData?.reflectionSections || "No previous questions",
      updatedQuestions: updatedReflectionSections[0].questions
    });
  } catch (error: any) {
    console.error('Error updating April 23 devotion:', error);
    return NextResponse.json(
      { error: 'Failed to update April 23 devotion', message: error.message },
      { status: 500 }
    );
  }
} 