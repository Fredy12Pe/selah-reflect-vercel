import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase/firebase';
import { getFirebaseAuth } from '@/lib/firebase/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Authorized admin emails
const ADMIN_EMAILS = ['fredypedro3@gmail.com'];

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

    // Initialize Firebase
    const db = getFirebaseDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }

    // Get all documents from the devotions collection
    const devotionsRef = collection(db, 'devotions');
    const snapshot = await getDocs(devotionsRef);
    
    // Keep track of deleted documents
    const deletedDocs: string[] = [];
    const errors: string[] = [];

    // Delete each document that matches the old format (YYYY-MM-DD)
    for (const docSnapshot of snapshot.docs) {
      const docId = docSnapshot.id;
      if (/^\d{4}-\d{2}-\d{2}$/.test(docId)) {
        try {
          await deleteDoc(doc(db, 'devotions', docId));
          deletedDocs.push(docId);
        } catch (error) {
          errors.push(`Failed to delete ${docId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Return the results
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedDocs.length} old documents`,
      deletedDocuments: deletedDocs,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error deleting old data:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
} 