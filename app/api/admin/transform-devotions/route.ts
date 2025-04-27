import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    console.log('Transform API: Initializing Firebase Admin...');
    initAdmin();
    const db = getFirestore();
    
    // Get all devotions
    console.log('Transform API: Getting all devotions...');
    const devotionsSnapshot = await db.collection('devotions').get();
    
    if (devotionsSnapshot.empty) {
      console.log('Transform API: No devotions found');
      return NextResponse.json({ message: 'No devotions found to transform' });
    }
    
    const results = { 
      total: devotionsSnapshot.size,
      processed: 0,
      transformed: 0,
      skipped: 0,
      errors: 0,
      details: []
    };
    
    // Process each devotion
    for (const doc of devotionsSnapshot.docs) {
      try {
        const data = doc.data();
        results.processed++;
        
        // Check if document needs transformation
        const needsTransform = (
          (data.scriptureReference && !data.bibleText) || 
          (data.reflectionQuestions && !data.reflectionSections)
        );
        
        if (!needsTransform) {
          console.log(`Transform API: Skipping ${doc.id} - already in new format`);
          results.skipped++;
          results.details.push({
            id: doc.id,
            status: 'skipped',
            reason: 'Already in new format'
          });
          continue;
        }
        
        // Create the updated document
        const updatedData = { ...data };
        
        // Transform scriptureReference to bibleText if needed
        if (data.scriptureReference && !data.bibleText) {
          updatedData.bibleText = data.scriptureReference;
        }
        
        // Transform reflectionQuestions to reflectionSections if needed
        if (data.reflectionQuestions && !data.reflectionSections) {
          updatedData.reflectionSections = [
            {
              passage: data.scriptureReference || data.bibleText || '',
              questions: data.reflectionQuestions
            }
          ];
        }
        
        // Update the document
        await db.collection('devotions').doc(doc.id).update(updatedData);
        console.log(`Transform API: Transformed document ${doc.id}`);
        results.transformed++;
        results.details.push({
          id: doc.id,
          status: 'transformed',
          from: {
            hasBibleText: !!data.bibleText,
            hasScriptureReference: !!data.scriptureReference,
            hasReflectionSections: !!data.reflectionSections,
            hasReflectionQuestions: !!data.reflectionQuestions
          },
          to: {
            hasBibleText: !!updatedData.bibleText,
            hasScriptureReference: !!updatedData.scriptureReference,
            hasReflectionSections: !!updatedData.reflectionSections,
            hasReflectionQuestions: !!updatedData.reflectionQuestions
          }
        });
      } catch (error) {
        console.error(`Transform API: Error processing ${doc.id}:`, error);
        results.errors++;
        results.details.push({
          id: doc.id,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      message: `Transformed ${results.transformed} of ${results.total} devotions`,
      results
    });
  } catch (error: any) {
    console.error('Transform API: Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 