import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';
import { format, parseISO } from 'date-fns';
import { Devotion, ReflectionSection } from '@/lib/types/devotion';

// GET endpoint to fetch available dates
export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    const db = getFirestore();
    
    // Get all devotions
    const devotionsSnapshot = await db.collection('devotions').get();
    
    if (devotionsSnapshot.empty) {
      return NextResponse.json({
        message: 'No devotions found',
        dates: []
      });
    }
    
    // Extract data about each devotion
    const devotionsData = devotionsSnapshot.docs.map(doc => {
      const data = doc.data() as Partial<Devotion>;
      return {
        date: doc.id,
        bibleText: data.bibleText || data.scriptureReference || '',
        hasReflectionSections: !!data.reflectionSections,
        reflectionSectionsCount: Array.isArray(data.reflectionSections) ? data.reflectionSections.length : 0,
        // Check if any sections are missing passage field
        hasMissingPassages: Array.isArray(data.reflectionSections) ? 
          data.reflectionSections.some((section: any) => !section.passage) : false,
      };
    });
    
    // Sort by date descending (newest first)
    devotionsData.sort((a, b) => b.date.localeCompare(a.date));
    
    return NextResponse.json({
      message: 'Retrieved devotions data',
      devotions: devotionsData
    });
  } catch (error: any) {
    console.error('Error getting devotions:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

interface BulkUpdateRequest {
  dates: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    initAdmin();
    const db = getFirestore();
    
    // Get dates from request body
    const { dates } = await request.json() as BulkUpdateRequest;
    
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { error: 'At least one date is required' },
        { status: 400 }
      );
    }
    
    const results: { [date: string]: string } = {};
    const batch = db.batch();
    
    // Process each date
    for (const date of dates) {
      try {
        // Get the current document
        const devotionDoc = await db.collection('devotions').doc(date).get();
        
        if (!devotionDoc.exists) {
          results[date] = 'Not found';
          continue;
        }
        
        const data = devotionDoc.data() as Partial<Devotion>;
        const docRef = db.collection('devotions').doc(date);
        
        // Get the Bible text to use as default passage
        const bibleText = data.bibleText || data.scriptureReference || '';
        
        // If there are reflection sections, ensure each has a passage
        if (data.reflectionSections && Array.isArray(data.reflectionSections)) {
          const updatedSections = data.reflectionSections.map((section: any) => ({
            passage: section.passage || bibleText,
            questions: section.questions || [],
            // Preserve any other properties
            ...(section.title && { title: section.title }),
            ...(section.content && { content: section.content })
          }));
          
          // Update the document in the batch
          batch.update(docRef, { 
            reflectionSections: updatedSections,
            updatedAt: new Date().toISOString()
          });
          
          results[date] = 'Updated';
        } 
        // If there are only reflection questions but no sections, create sections
        else if (data.reflectionQuestions && Array.isArray(data.reflectionQuestions)) {
          const newSections = [{
            passage: bibleText,
            questions: data.reflectionQuestions
          }];
          
          // Update the document in the batch
          batch.update(docRef, { 
            reflectionSections: newSections,
            updatedAt: new Date().toISOString()
          });
          
          results[date] = 'Created sections';
        } else {
          results[date] = 'No questions or sections to update';
        }
      } catch (error) {
        console.error(`Error processing date ${date}:`, error);
        results[date] = 'Error';
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return NextResponse.json({
      message: 'Bulk update completed',
      results
    });
  } catch (error: any) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 