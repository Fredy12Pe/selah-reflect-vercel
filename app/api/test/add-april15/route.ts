import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    
    // Date to add
    const date = '2025-04-15';
    
    // Create the devotion data
    const devotionData = {
      date: date,
      bibleText: "Luke 23:26-34",
      reflectionSections: [
        {
          passage: "General",
          questions: [
            "How does Simon of Cyrene's experience teach us about unexpected ways we might be called to follow Jesus?",
            "Reflect on Jesus' focus on others even during His suffering. How can you show similar concern for others during your own difficulties?",
            "Consider Jesus' words of forgiveness from the cross. How does this challenge your own approach to those who hurt you?"
          ]
        }
      ]
    };
    
    // Add to Firestore
    const db = getFirestore();
    await db.collection('devotions').doc(date).set(devotionData);
    
    return NextResponse.json({
      success: true,
      message: 'Added April 15 devotion successfully',
      devotion: devotionData
    });
  } catch (error: any) {
    console.error('Error adding April 15 devotion:', error);
    return NextResponse.json(
      { error: 'Failed to add devotion', message: error.message },
      { status: 500 }
    );
  }
} 