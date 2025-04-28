import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase/firebase';

// Authorized admin emails
const ADMIN_EMAILS = ['fredypedro3@gmail.com']; 

// Types for the data structure
interface ReflectionSection {
  passage: string;
  questions: string[];
}

interface Devotion {
  date: string;
  bibleText: string;
  reflectionSections: ReflectionSection[];
}

interface ProcessedDevotion {
  date: string;
  bibleText: string;
  content: string;
  scriptureReference: string;
  scriptureText: string;
  title: string;
  reflectionQuestions: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

interface Hymn {
  title: string;
  lyrics: string[];
  author?: string;
}

interface MonthData {
  month: string;
  hymn: Hymn;
  devotions: Devotion[];
}

interface UploadData {
  [month: string]: MonthData;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and authorization
    const auth = getFirebaseAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Firebase Auth not initialized' },
        { status: 500 }
      );
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!ADMIN_EMAILS.includes(currentUser.email)) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Get the request data
    const data = await request.json() as UploadData;
    
    // Validate the data format
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Initialize Firebase
    const db = getFirebaseDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }

    // Process the data and save to Firestore
    let successCount = 0;
    let errorItems: Array<{ month: string; error: string }> = [];

    // Process each month in the data object
    for (const [monthKey, monthData] of Object.entries(data)) {
      try {
        // Validate month data structure
        if (!monthData || typeof monthData !== 'object') {
          throw new Error(`Invalid data structure for month: ${monthKey}`);
        }

        // Create a reference to the month document
        const monthRef = doc(db, 'months', monthKey.toLowerCase());
        
        // Save month data (without hymn to avoid duplication)
        const monthDoc = {
          month: monthData.month,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.email
        };

        await setDoc(monthRef, monthDoc, { merge: true });

        // Save hymn separately in hymns collection with proper structure
        if (monthData.hymn && monthData.hymn.title && monthData.hymn.lyrics) {
          const hymnRef = doc(db, 'hymns', monthKey.toLowerCase());
          const hymnDoc = {
            title: monthData.hymn.title,
            lyrics: monthData.hymn.lyrics,
            author: monthData.hymn.author || 'Unknown',
            monthId: monthKey.toLowerCase(),
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.email
          };
          await setDoc(hymnRef, hymnDoc, { merge: true });
        }

        // Save devotions
        if (monthData.devotions && Array.isArray(monthData.devotions)) {
          for (const devotion of monthData.devotions) {
            const devotionId = devotion.date.replace(/,/g, '').replace(/ /g, '-').toLowerCase();
            const devotionRef = doc(db, 'devotions', devotionId);
            
            // Transform reflectionSections into flat reflectionQuestions array
            const reflectionQuestions = devotion.reflectionSections.reduce((acc: string[], section) => {
              return [...acc, ...section.questions];
            }, []);
            
            const timestamp = new Date().toISOString();
            
            const devotionDoc: ProcessedDevotion = {
              date: devotion.date,
              bibleText: devotion.bibleText,
              content: `Reflection on ${devotion.bibleText}`,
              scriptureReference: devotion.bibleText,
              scriptureText: "",
              title: `${devotion.bibleText} - ${devotion.date}`,
              reflectionQuestions,
              createdAt: timestamp,
              createdBy: currentUser.email,
              updatedAt: timestamp,
              updatedBy: currentUser.email
            };

            await setDoc(devotionRef, devotionDoc, { merge: true });
          }
        }
        
        successCount++;
      } catch (error) {
        console.error(`Error saving month ${monthKey}:`, error);
        errorItems.push({ 
          month: monthKey, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Return the results
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${successCount} months with ${errorItems.length} errors`,
      errors: errorItems.length > 0 ? errorItems : undefined
    });
    
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
} 