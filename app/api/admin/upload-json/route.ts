import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Authorized admin emails
const ADMIN_EMAILS = ['fredypedro3@gmail.com']; 

// Initialize Firebase Admin
const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials');
  }

  // Handle private key formatting
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = JSON.parse(privateKey);
  }
  
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
};

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
    // Initialize Firebase Admin
    const app = initializeFirebaseAdmin();
    const db = getFirestore(app);

    // Get the request data
    const data = await request.json() as UploadData;
    
    // Validate the data format
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
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

        const normalizedMonthKey = monthKey.toLowerCase();

        // Create a reference to the month document
        const monthRef = db.collection('months').doc(normalizedMonthKey);
        
        // Save month data (without hymn to avoid duplication)
        const monthDoc = {
          month: monthData.month,
          updatedAt: new Date().toISOString(),
          updatedBy: ADMIN_EMAILS[0] // Use admin email since we're using admin SDK
        };

        await monthRef.set(monthDoc, { merge: true });

        // Save hymn separately in hymns collection
        if (monthData.hymn && monthData.hymn.title && monthData.hymn.lyrics) {
          try {
            const hymnRef = db.collection('hymns').doc(normalizedMonthKey);
            
            // Log the hymn data for debugging
            console.log(`Processing hymn for month ${normalizedMonthKey}:`, {
              title: monthData.hymn.title,
              lyricsLength: monthData.hymn.lyrics.length,
              hasAuthor: !!monthData.hymn.author
            });
            
            // Create base hymn document
            const hymnDoc = {
              title: monthData.hymn.title,
              lyrics: monthData.hymn.lyrics,
              monthId: normalizedMonthKey,
              updatedAt: new Date().toISOString(),
              updatedBy: ADMIN_EMAILS[0]
            };

            await hymnRef.set(hymnDoc, { merge: true });
            console.log(`Successfully saved hymn for ${normalizedMonthKey}`);
          } catch (error) {
            console.error(`Error saving hymn for ${normalizedMonthKey}:`, error);
            throw error;
          }
        }

        // Save devotions
        if (monthData.devotions && Array.isArray(monthData.devotions)) {
          for (const devotion of monthData.devotions) {
            const devotionId = devotion.date.toLowerCase().replace(/,/g, '').replace(/ /g, '-');
            const devotionRef = db.collection('devotions').doc(devotionId);
            
            const reflectionQuestions = (devotion.reflectionSections || []).reduce((acc: string[], section) => {
              if (section && Array.isArray(section.questions)) {
                return [...acc, ...section.questions];
              }
              return acc;
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
              createdBy: ADMIN_EMAILS[0],
              updatedAt: timestamp,
              updatedBy: ADMIN_EMAILS[0]
            };

            await devotionRef.set(devotionDoc, { merge: true });
          }
        }
        
        successCount++;
      } catch (error) {
        console.error(`Error processing month ${monthKey}:`, error);
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