import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from '@/lib/firebase/firebase';
import { Devotion, DevotionInput, Meta, Hymn } from '@/lib/types/devotion';

const DEVOTIONS_COLLECTION = 'devotions';
const META_COLLECTION = 'meta';

// Near the top of the file, add a partial devotion type for error handling
interface PartialDevotion extends Partial<Devotion> {
  notFound?: boolean;
  error?: string;
}

// Helper function to get the base URL
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.origin;
  }
  // Server-side
  return process.env.NEXT_PUBLIC_BASE_URL || '';
}

export async function getDevotionByDate(date: string): Promise<Devotion | PartialDevotion | null> {
  try {
    console.log('DevotionService: Getting devotion for date:', date);
    const baseUrl = getBaseUrl();
    console.log('DevotionService: Using base URL:', baseUrl);
    
    try {
      const response = await fetch(`${baseUrl}/api/devotions/${date}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      console.log('DevotionService: Fetch response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.error('DevotionService: Authentication error (401)');
          throw new Error('You must be signed in to access devotions');
        }
        if (response.status === 404) {
          console.log(`DevotionService: No devotion found for date: ${date}`);
          // Return an object with notFound flag
          return { notFound: true, date } as PartialDevotion;
        }
        
        // Try to get error details from response
        let errorMessage = `Failed to fetch devotion: ${response.statusText}`;
        try {
          const data = await response.json();
          if (data && data.error) {
            errorMessage = data.error;
          }
        } catch (parseError) {
          console.error('DevotionService: Error parsing error response:', parseError);
        }
        
        console.error('DevotionService: API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const devotionData = await response.json();
      console.log('DevotionService: Successfully fetched devotion data');
      return devotionData as Devotion;
    } catch (fetchError) {
      // Handle network or fetch-specific errors
      console.error('DevotionService: Fetch error:', fetchError);
      
      if (fetchError instanceof Error) {
        // Only rethrow authentication and permission errors
        if (fetchError.message.includes('sign in') || fetchError.message.includes('permission')) {
          throw fetchError;
        }
      }
      
      // Return with notFound flag
      return { 
        notFound: true, 
        date,
        error: fetchError instanceof Error ? fetchError.message : 'Network error'
      } as PartialDevotion;
    }
  } catch (error: any) {
    console.error('DevotionService: Error in getDevotionByDate:', error);
    
    // Only rethrow authentication and permission errors
    if (error.message.includes('sign in') || error.message.includes('permission')) {
      throw error;
    }
    
    // For other errors, return an object with notFound flag
    return { 
      notFound: true, 
      date,
      error: error.message 
    } as PartialDevotion;
  }
}

export async function createOrUpdateDevotion(devotionInput: DevotionInput): Promise<void> {
  try {
    const { date, ...devotionData } = devotionInput;
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Database not initialized');
    }

    const devotionRef = doc(db, DEVOTIONS_COLLECTION, date);
    await setDoc(devotionRef, devotionData, { merge: true });
  } catch (error: any) {
    console.error('Error saving devotion:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to save devotions.');
    }
    throw new Error('Failed to save devotion. Please try again later.');
  }
}

export async function getHymnByMonth(month: string): Promise<Hymn | null> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      console.log('Database not initialized');
      return null;
    }
    
    const metaRef = doc(db, META_COLLECTION, 'hymns');
    const metaSnap = await getDoc(metaRef);

    if (!metaSnap.exists()) {
      console.log('No hymns data found');
      return null;
    }

    const hymns = metaSnap.data() as { [month: string]: Hymn };
    return hymns[month] || null;
  } catch (error) {
    console.error('Error fetching hymn:', error);
    throw new Error('Failed to fetch hymn');
  }
}

export async function createOrUpdateMeta(meta: Meta): Promise<void> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const metaRef = doc(db, META_COLLECTION, 'hymns');
    await setDoc(metaRef, meta.hymns, { merge: true });
  } catch (error) {
    console.error('Error saving meta:', error);
    throw new Error('Failed to save meta');
  }
}

export async function getDevotionsInRange(startDate: string, endDate: string): Promise<Devotion[]> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      console.log('Database not initialized');
      return [];
    }
    
    const q = query(
      collection(db, DEVOTIONS_COLLECTION),
      where('id', '>=', startDate),
      where('id', '<=', endDate),
      orderBy('id', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Devotion[];
  } catch (error) {
    console.error('Error getting devotions:', error);
    throw new Error('Failed to get devotions');
  }
}

export async function getLatestDevotion(): Promise<Devotion | null> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      console.log('Database not initialized');
      return null;
    }
    
    const q = query(
      collection(db, DEVOTIONS_COLLECTION),
      orderBy('id', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      ...doc.data(),
      id: doc.id,
    } as Devotion;
  } catch (error) {
    console.error('Error getting latest devotion:', error);
    throw new Error('Failed to get latest devotion');
  }
}

/**
 * Fetches a list of all available devotion dates from the API
 * @returns Array of dates in YYYY-MM-DD format
 */
export async function getAvailableDates(): Promise<string[]> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/devotions/available-dates`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available dates');
    }

    const data = await response.json();
    return data.dates || [];
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return [];
  }
} 