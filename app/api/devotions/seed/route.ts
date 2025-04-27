import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';
import { Devotion } from '@/lib/types/devotion';
import { format } from 'date-fns';

const sampleDevotion: Devotion = {
  date: format(new Date(), "yyyy-MM-dd"), // Today's date
  bibleText: "Luke 24:13-35",
  reflectionSections: [
    {
      passage: "Luke 24:21",
      questions: [
        "Think about the words: 'we had hoped....' How did the crucifixion of Jesus dash their hope?",
        "What are my false hopes? In what ways do they get in the way of my recognizing my true need?"
      ]
    },
    {
      passage: "Luke 24:32-35",
      questions: [
        "What made their hearts burn?",
        "The disciples had no option but to hasten back to Jerusalem and share with others how they had encountered Jesus. How does the gospel have this kind of effect on a person's life, turning him from the path that he is on and returning him to community?",
        "How have I experienced this to be true of my life?"
      ]
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    
    const db = getFirestore();
    await db.collection('devotions').doc(sampleDevotion.date).set(sampleDevotion);

    return NextResponse.json({ success: true, message: 'Sample devotion added', data: sampleDevotion });
  } catch (error: any) {
    console.error('Error seeding devotion:', error);
    return NextResponse.json(
      { error: 'Failed to seed devotion' },
      { status: 500 }
    );
  }
} 