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
  // Check if we have cached data first
  try {
    const cachedDataKey = `devotion_${date}`;
    const cachedData = localStorage.getItem(cachedDataKey);
    if (cachedData) {
      console.log(`DevotionService: Using cached data for ${date}`);
      return JSON.parse(cachedData);
    }
  } catch (cacheError) {
    console.warn('DevotionService: Error accessing cache:', cacheError);
  }

  // Maximum number of retry attempts
  const MAX_RETRIES = 2;
  let retryCount = 0;
  let lastError: any = null;
  
  // Retry loop
  while (retryCount <= MAX_RETRIES) {
    try {
      console.log(`DevotionService: Getting devotion for date: ${date} (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      const baseUrl = getBaseUrl();
      console.log('DevotionService: Using base URL:', baseUrl);
      
      // First, check if user is authenticated
      const auth = getFirebaseAuth();
      if (!auth || !auth.currentUser) {
        console.log('DevotionService: User not authenticated');
      }
      
      try {
        // Add the user ID token to the request if available
        let headers: Record<string, string> = {
          'Cache-Control': 'no-cache',
        };
        
        try {
          if (auth && auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
          }
        } catch (tokenError) {
          console.warn('DevotionService: Could not get ID token:', tokenError);
        }

        // Add timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${baseUrl}/api/devotions/${date}`, {
          credentials: 'include',
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
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
          
          // Server errors (500s) might be temporary, so retry
          if (response.status >= 500) {
            lastError = new Error(errorMessage);
            throw lastError; // Trigger retry
          }
          
          console.error('DevotionService: API error:', errorMessage);
          throw new Error(errorMessage);
        }

        const devotionData = await response.json();
        console.log('DevotionService: Successfully fetched devotion data');
        
        // Cache the successful result
        try {
          localStorage.setItem(`devotion_${date}`, JSON.stringify(devotionData));
          console.log('DevotionService: Cached devotion data for future use');
        } catch (cacheError) {
          console.warn('DevotionService: Failed to cache devotion data', cacheError);
        }
        
        return devotionData as Devotion;
      } catch (fetchError) {
        // Handle abort errors specifically
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          console.log('DevotionService: Request timed out, retrying');
          retryCount++;
          continue;
        }
        
        // Network errors or server errors should be retried
        const isNetworkError = fetchError instanceof Error && 
          (fetchError.message.includes('network') || 
           fetchError.message.includes('fetch') ||
           fetchError.message.includes('Failed to fetch') ||
           fetchError.message.includes('Server error') ||
           fetchError.message.includes('Server configuration error') ||
           fetchError.message.includes('Internal server error') ||
           fetchError.message.includes('access control checks'));
           
        if (isNetworkError && retryCount < MAX_RETRIES) {
          console.log(`DevotionService: Network error, will retry (${retryCount + 1}/${MAX_RETRIES})`, fetchError);
          lastError = fetchError;
          retryCount++;
          
          // Exponential backoff: wait longer between retries
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          continue; // Try again
        }
        
        // Handle authentication and permission errors differently - don't retry
        if (fetchError instanceof Error) {
          if (fetchError.message.includes('sign in') || fetchError.message.includes('permission')) {
            throw fetchError;
          }
        }
        
        // If we've exhausted retries or it's not a retryable error
        console.error('DevotionService: Final fetch error:', fetchError);
        
        // Return with notFound flag
        return { 
          notFound: true, 
          date,
          error: fetchError instanceof Error ? fetchError.message : 'Network error'
        } as PartialDevotion;
      }
    } catch (error: any) {
      // This is the outermost error handler
      // If we still have retries left, continue the loop
      if (retryCount < MAX_RETRIES) {
        console.log(`DevotionService: Error, will retry (${retryCount + 1}/${MAX_RETRIES})`, error);
        lastError = error;
        retryCount++;
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        continue; // Try again
      }
      
      console.error('DevotionService: Error in getDevotionByDate after retries:', error);
      
      // Try fallback mechanism - direct Firestore access if API fails
      try {
        console.log('DevotionService: Attempting direct Firestore fallback');
        const db = getFirebaseDb();
        if (db) {
          const devotionRef = doc(db, DEVOTIONS_COLLECTION, date);
          const devotionSnap = await getDoc(devotionRef);
          
          if (devotionSnap.exists()) {
            const data = devotionSnap.data();
            const devotion = {
              ...data,
              id: devotionSnap.id,
              date: devotionSnap.id
            } as Devotion;
            
            // Cache this result
            try {
              localStorage.setItem(`devotion_${date}`, JSON.stringify(devotion));
            } catch (cacheError) {
              console.warn('DevotionService: Failed to cache fallback data', cacheError);
            }
            
            console.log('DevotionService: Retrieved data directly from Firestore');
            return devotion;
          }
        }
      } catch (firestoreError) {
        console.error('DevotionService: Firestore fallback failed:', firestoreError);
      }
      
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
  
  // This should only happen if all retries failed
  return { 
    notFound: true, 
    date,
    error: lastError?.message || 'Failed to fetch devotion after multiple attempts'
  } as PartialDevotion;
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
    
    // Use the full month name directly for fetching hymn data
    console.log('Getting hymn for month:', month);
    
    const hymnRef = doc(db, 'hymns', month);
    const hymnSnap = await getDoc(hymnRef);
    
    if (!hymnSnap.exists()) {
      console.log('No hymn found for month:', month);
      return null;
    }
    
    return hymnSnap.data() as Hymn;
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
  // Check if we have cached dates in sessionStorage
  try {
    const cachedDates = sessionStorage.getItem('availableDates');
    if (cachedDates) {
      console.log('Using cached available dates from sessionStorage');
      return JSON.parse(cachedDates);
    }
  } catch (storageError) {
    console.warn('Error accessing sessionStorage for dates cache:', storageError);
  }

  // If we don't have cached dates, fetch from API with error handling
  try {
    const baseUrl = getBaseUrl();
    console.log('Fetching available dates from API:', `${baseUrl}/api/devotions/available-dates`);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${baseUrl}/api/devotions/available-dates`, {
      credentials: 'include',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`API returned error status: ${response.status}`);
      throw new Error('Failed to fetch available dates');
    }

    const data = await response.json();
    const dates = data.dates || [];
    
    // Cache the result in sessionStorage
    try {
      sessionStorage.setItem('availableDates', JSON.stringify(dates));
      console.log(`Cached ${dates.length} available dates in sessionStorage`);
    } catch (storageError) {
      console.warn('Error saving to sessionStorage:', storageError);
    }
    
    return dates;
  } catch (error) {
    console.error('Error fetching available dates:', error);
    
    // Return hardcoded default dates for the past 30 days as a fallback
    const fallbackDates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const formattedDate = date.toISOString().split('T')[0];
      fallbackDates.push(formattedDate);
    }
    
    console.log('Using fallback dates due to error');
    return fallbackDates;
  }
} 