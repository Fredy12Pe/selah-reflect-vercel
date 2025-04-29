import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { Devotion, Hymn, ReflectionSection } from '@/lib/types/devotion';

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

interface MonthData {
  month: string;
  hymn: {
    title: string;
    lyrics: string[];
    author?: string;
  };
  devotions: Array<{
    date: string;
    bibleText: string;
    reflectionSections: Array<{
      passage?: string;
      questions: string[];
    }>;
  }>;
}

interface UploadData {
  [month: string]: MonthData;
}

// Helper function to convert date string to sortable format
function getDateKey(dateStr: string): string {
  const months: { [key: string]: string } = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
  };
  
  // Extract month and day from "Day, Month DD" format
  const parts = dateStr.split(', ');
  if (parts.length !== 2) return dateStr;
  
  const [dayName, monthDay] = parts;
  const [month, day] = monthDay.split(' ');
  const monthNum = months[month] || '01';
  const dayNum = day.padStart(2, '0');
  
  // Use 2025 as the year for future dates
  const year = '2025';
  
  return `${year}-${monthNum}-${dayNum}`;
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
        
        // Save month data
        const monthDoc = {
          month: monthData.month,
          updatedAt: new Date().toISOString(),
          updatedBy: ADMIN_EMAILS[0]
        };

        await monthRef.set(monthDoc, { merge: true });

        // Save hymn with improved structure
        if (monthData.hymn && monthData.hymn.title && monthData.hymn.lyrics) {
          try {
            const hymnRef = db.collection('hymns').doc(normalizedMonthKey);
            
            // Create hymn document with better structure
            const hymnDoc = {
              title: monthData.hymn.title,
              lyrics: monthData.hymn.lyrics.map((line, index) => ({
                lineNumber: index + 1,
                text: line
              })),
              author: monthData.hymn.author || 'Unknown',
              monthId: normalizedMonthKey,
              month: monthData.month,
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

        // Sort and save devotions
        if (monthData.devotions && Array.isArray(monthData.devotions)) {
          // Sort devotions by date
          const sortedDevotions = [...monthData.devotions].sort((a, b) => {
            const dateA = getDateKey(a.date);
            const dateB = getDateKey(b.date);
            return dateA.localeCompare(dateB);
          });

          for (const devotion of sortedDevotions) {
            try {
              // Create a chronological ID using the date
              const dateKey = getDateKey(devotion.date);
              console.log('Processing devotion for date:', dateKey);
              
              // Use the dateKey directly as the document ID
              const devotionRef = db.collection('devotions').doc(dateKey);
              
              // Create the devotion document with the correct structure
              const devotionDoc = {
                id: dateKey,
                date: dateKey,
                bibleText: devotion.bibleText,
                reflectionSections: devotion.reflectionSections.map(section => ({
                  passage: section.passage || devotion.bibleText,
                  questions: section.questions || []
                })),
                monthId: normalizedMonthKey,
                month: monthData.month,
                updatedAt: new Date().toISOString(),
                updatedBy: ADMIN_EMAILS[0]
              };

              await devotionRef.set(devotionDoc);
              console.log(`Successfully saved devotion for ${dateKey}`);
        successCount++;
            } catch (error) {
              console.error(`Error saving devotion for date ${devotion.date}:`, error);
              errorItems.push({
                month: `${monthKey} - ${devotion.date}`,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        }
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
      message: `Successfully processed ${successCount} devotions with ${errorItems.length} errors`,
      errorItems: errorItems.length > 0 ? errorItems : undefined
    });
    
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 