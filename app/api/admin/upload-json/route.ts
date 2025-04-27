import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase/firebase';
import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getFirebaseAuth } from '@/lib/firebase/firebase';

// Authorized admin emails
const ADMIN_EMAILS = ['fredypedro3@gmail.com']; 

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and authorization
    const auth = getFirebaseAuth();
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
    const data = await request.json();
    
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
    let errorItems = [];

    // Process each item in the data object
    for (const [key, value] of Object.entries(data)) {
      try {
        // Create a document reference with the key as the ID
        const docRef = doc(db, 'data', key);
        
        // Set the document data
        await setDoc(docRef, {
          ...value,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.email
        });
        
        successCount++;
      } catch (error) {
        console.error(`Error saving item with key ${key}:`, error);
        errorItems.push({ key, error: error.message || 'Unknown error' });
      }
    }

    // Return the results
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${successCount} items with ${errorItems.length} errors`,
      errors: errorItems.length > 0 ? errorItems : undefined
    });
    
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 