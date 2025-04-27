import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';
import { Devotion } from '@/lib/types/devotion';

// Bible passages with reflection questions for each day
const bibleReadings = [
  {
    bibleText: "Genesis 1:1-31",
    reflectionSections: [
      {
        passage: "Genesis 1:1-2",
        questions: [
          "How does the creation account shape your understanding of God's creative power?",
          "What does it mean to you personally that God created everything 'very good'?"
        ]
      },
      {
        passage: "Genesis 1:26-28",
        questions: [
          "What responsibility do we have as stewards of God's creation?",
          "How does being made in God's image impact how you view yourself and others?"
        ]
      }
    ]
  },
  {
    bibleText: "Psalm 23:1-6",
    reflectionSections: [
      {
        passage: "Psalm 23:1-3",
        questions: [
          "What does it mean to you that 'The Lord is my shepherd'?",
          "How has God restored your soul in difficult times?"
        ]
      },
      {
        passage: "Psalm 23:4-6",
        questions: [
          "How has God's presence comforted you in dark valleys?",
          "What does it mean to dwell in the house of the Lord forever?"
        ]
      }
    ]
  },
  {
    bibleText: "John 3:1-21",
    reflectionSections: [
      {
        passage: "John 3:3-8",
        questions: [
          "What does being 'born again' mean in your own spiritual journey?",
          "How would you explain the concept of spiritual rebirth to someone else?"
        ]
      },
      {
        passage: "John 3:16-17",
        questions: [
          "How does God's sacrificial love impact your daily life?",
          "What does it mean that Jesus came not to condemn but to save?"
        ]
      }
    ]
  },
  {
    bibleText: "Romans 8:18-39",
    reflectionSections: [
      {
        passage: "Romans 8:26-28",
        questions: [
          "How has the Holy Spirit helped you in times of weakness?",
          "How have you seen God work all things for good in difficult circumstances?"
        ]
      },
      {
        passage: "Romans 8:38-39",
        questions: [
          "What challenges have tested your faith in God's unfailing love?",
          "How does the promise that nothing can separate us from God's love bring you comfort?"
        ]
      }
    ]
  },
  {
    bibleText: "Philippians 4:4-13",
    reflectionSections: [
      {
        passage: "Philippians 4:6-7",
        questions: [
          "What anxieties do you need to bring to God in prayer today?",
          "How have you experienced God's peace that surpasses understanding?"
        ]
      },
      {
        passage: "Philippians 4:11-13",
        questions: [
          "What does it mean to be content in all circumstances?",
          "How has Christ's strength helped you through difficult situations?"
        ]
      }
    ]
  },
  {
    bibleText: "Matthew 5:1-12",
    reflectionSections: [
      {
        passage: "Matthew 5:3-6",
        questions: [
          "Which of the Beatitudes resonates most with you right now and why?",
          "How do these qualities differ from what our culture typically values?"
        ]
      },
      {
        passage: "Matthew 5:7-12",
        questions: [
          "What does it mean to be a peacemaker in today's divided world?",
          "How can you respond when facing persecution for your faith?"
        ]
      }
    ]
  },
  {
    bibleText: "1 Corinthians 13:1-13",
    reflectionSections: [
      {
        passage: "1 Corinthians 13:4-7",
        questions: [
          "Which aspect of love described here is most challenging for you to live out?",
          "How can you better demonstrate this kind of love in your relationships?"
        ]
      },
      {
        passage: "1 Corinthians 13:11-13",
        questions: [
          "What does it mean that we see dimly now but will see face to face?",
          "How does faith, hope, and love guide your daily decisions?"
        ]
      }
    ]
  },
  {
    bibleText: "Isaiah 40:25-31",
    reflectionSections: [
      {
        passage: "Isaiah 40:28-29",
        questions: [
          "How have you experienced God's unlimited understanding in your life?",
          "When have you felt God giving you strength when you were weary?"
        ]
      },
      {
        passage: "Isaiah 40:30-31",
        questions: [
          "What does it mean to wait upon the Lord in your current season?",
          "How has God renewed your strength when you've felt exhausted?"
        ]
      }
    ]
  },
  {
    bibleText: "James 1:2-18",
    reflectionSections: [
      {
        passage: "James 1:2-4",
        questions: [
          "How can trials produce perseverance and maturity in your faith?",
          "What current trial might God be using to develop your character?"
        ]
      },
      {
        passage: "James 1:12-15",
        questions: [
          "What's the difference between being tested and being tempted?",
          "How can you resist temptation when it feels overwhelming?"
        ]
      }
    ]
  },
  {
    bibleText: "Revelation 21:1-8",
    reflectionSections: [
      {
        passage: "Revelation 21:3-4",
        questions: [
          "How does the promise of God wiping away every tear bring you hope?",
          "What aspect of the new heaven and new earth do you look forward to most?"
        ]
      },
      {
        passage: "Revelation 21:5-7",
        questions: [
          "What does it mean that God is making all things new?",
          "How does your future inheritance as God's child affect your perspective today?"
        ]
      }
    ]
  }
];

// Function to generate devotions for a range of dates
function generateDevotions(startDateStr: string, endDateStr: string): Devotion[] {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date format. Please use yyyy-MM-dd format.');
  }
  
  const devotions: Devotion[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    
    // Get a consistent index based on the date so the same date always gets the same devotion
    const dateSum = dateStr.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const index = dateSum % bibleReadings.length;
    
    devotions.push({
      date: dateStr,
      ...bibleReadings[index]
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return devotions;
}

// Helper function to format a date as yyyy-MM-dd
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    
    // Verify auth and admin status
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // List of admin emails
    const ADMIN_EMAILS = ["fredypedro3@gmail.com"];

    try {
      const auth = getAuth();
      const decodedClaims = await auth.verifySessionCookie(sessionCookie.value);
      
      // Check if user is admin based on email
      if (!decodedClaims.email || !ADMIN_EMAILS.includes(decodedClaims.email)) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    // Get date range from request
    const body = await request.json();
    const { startDate, endDate } = body;
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }
    
    // Generate devotions
    const devotions = generateDevotions(startDate, endDate);
    
    // Save devotions to Firestore
    const db = getFirestore();
    const batch = db.batch();
    
    devotions.forEach(devotion => {
      const docRef = db.collection('devotions').doc(devotion.date);
      batch.set(docRef, devotion, { merge: true });
    });
    
    await batch.commit();
    
    return NextResponse.json({
      success: true,
      message: 'Devotions generated and saved successfully',
      count: devotions.length
    });
  } catch (error: any) {
    console.error('Error generating devotions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 