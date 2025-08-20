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
    console.log('DevotionService: Getting hymn for month:', month);
    const db = getFirebaseDb();
    if (!db) {
      console.error('DevotionService: Database not initialized');
      return getFallbackHymnForMonth(month);
    }
    
    // Handle both formats - full month name (like "April") or normalized format (YYYY-MM)
    let monthName = month;
    
    // If we received a normalized month (YYYY-MM format), extract just the month
    if (month.includes('-') && month.length >= 7) {
      try {
        // Convert from YYYY-MM format to month name
        const date = new Date(month + '-01');
        if (!isNaN(date.getTime())) {
          monthName = date.toLocaleString('default', { month: 'long' });
          console.log('DevotionService: Converted normalized month to name:', monthName);
        }
      } catch (dateError) {
        console.error('DevotionService: Error converting month format:', dateError);
      }
    }
    
    // Try to use the lowercase month name as the document ID
    const docId = monthName.toLowerCase();
    console.log('DevotionService: Using lowercase document ID:', docId);
    
    // Debug: List all documents in the hymns collection
    try {
      const hymnsCollection = collection(db, 'hymns');
      const hymnsSnapshot = await getDocs(hymnsCollection);
      console.log('DevotionService: All hymn documents in collection:');
      hymnsSnapshot.forEach(doc => {
        console.log(`Document ID: ${doc.id}, Data:`, doc.data());
      });
    } catch (listError) {
      console.error('DevotionService: Error listing hymn documents:', listError);
    }
    
    const hymnRef = doc(db, 'hymns', docId);
    const hymnSnap = await getDoc(hymnRef);
    
    if (!hymnSnap.exists()) {
      console.log('DevotionService: No hymn found for month:', docId);
      return getFallbackHymnForMonth(monthName);
    }
    
    const hymnData = hymnSnap.data() as Hymn;
    console.log('DevotionService: Successfully fetched hymn data for month:', docId, hymnData);
    return hymnData;
  } catch (error) {
    console.error('DevotionService: Error fetching hymn:', error);
    return getFallbackHymnForMonth(month);
  }
}

// Fallback hymns in case Firebase access fails
function getFallbackHymnForMonth(month: string): Hymn {
  console.log('DevotionService: Using fallback hymn for month:', month);
  
  // Normalize month name for lookup
  let monthName = month.toLowerCase();
  
  // If we have a date format (YYYY-MM), extract the month
  if (monthName.includes('-') && monthName.length >= 7) {
    try {
      const date = new Date(month + '-01');
      if (!isNaN(date.getTime())) {
        monthName = date.toLocaleString('default', { month: 'long' }).toLowerCase();
      }
    } catch (e) {
      console.error('Error parsing month format:', e);
    }
  }
  
  // Default hymn in case the month doesn't match
  const defaultHymn: Hymn = {
    title: "Amazing Grace",
    author: "John Newton",
    lyrics: [
      { lineNumber: 1, text: "Amazing grace! how sweet the sound," },
      { lineNumber: 2, text: "That saved a wretch like me!" },
      { lineNumber: 3, text: "I once was lost, but now am found," },
      { lineNumber: 4, text: "Was blind, but now I see." },
      { lineNumber: 5, text: "" },
      { lineNumber: 6, text: "'Twas grace that taught my heart to fear," },
      { lineNumber: 7, text: "And grace my fears relieved;" },
      { lineNumber: 8, text: "How precious did that grace appear" },
      { lineNumber: 9, text: "The hour I first believed!" }
    ],
    month: "Default",
    updatedBy: "fallback"  // Add this marker to identify fallback data
  };
  
  // Map of fallback hymns for each month
  const fallbackHymns: Record<string, Hymn> = {
    january: {
      title: "Amazing Grace",
      author: "John Newton",
      lyrics: [
        { lineNumber: 1, text: "Amazing grace! how sweet the sound," },
        { lineNumber: 2, text: "That saved a wretch like me!" },
        { lineNumber: 3, text: "I once was lost, but now am found," },
        { lineNumber: 4, text: "Was blind, but now I see." }
      ],
      month: "January",
      updatedBy: "fallback"
    },
    february: {
      title: "Holy, Holy, Holy",
      author: "Reginald Heber",
      lyrics: [
        { lineNumber: 1, text: "Holy, holy, holy! Lord God Almighty!" },
        { lineNumber: 2, text: "Early in the morning our song shall rise to thee;" },
        { lineNumber: 3, text: "Holy, holy, holy! merciful and mighty," },
        { lineNumber: 4, text: "God in three persons, blessed Trinity!" }
      ],
      month: "February",
      updatedBy: "fallback"
    },
    march: {
      title: "Be Thou My Vision",
      author: "Ancient Irish Poem",
      lyrics: [
        { lineNumber: 1, text: "Be Thou my Vision, O Lord of my heart;" },
        { lineNumber: 2, text: "Naught be all else to me, save that Thou art;" },
        { lineNumber: 3, text: "Thou my best Thought, by day or by night," },
        { lineNumber: 4, text: "Waking or sleeping, Thy presence my light." }
      ],
      month: "March",
      updatedBy: "fallback"
    },
    april: {
      title: "When I Survey the Wondrous Cross",
      author: "Isaac Watts",
      lyrics: [
        { lineNumber: 1, text: "When I survey the wondrous cross" },
        { lineNumber: 2, text: "On which the Prince of glory died," },
        { lineNumber: 3, text: "My richest gain I count but loss," },
        { lineNumber: 4, text: "And pour contempt on all my pride." }
      ],
      month: "April",
      updatedBy: "fallback"
    },
    may: {
      title: "O Master, Let Me Walk With Thee",
      author: "Washington Gladden",
      lyrics: [
        { lineNumber: 1, text: "O Master, let me walk with Thee" },
        { lineNumber: 2, text: "In lowly paths of service free;" },
        { lineNumber: 3, text: "Tell me Thy secret; help me bear" },
        { lineNumber: 4, text: "The strain of toil, the fret of care." }
      ],
      month: "May",
      updatedBy: "fallback"
    },
    june: {
      title: "Great Is Thy Faithfulness",
      author: "Thomas O. Chisholm",
      lyrics: [
        { lineNumber: 1, text: "Great is Thy faithfulness, O God my Father," },
        { lineNumber: 2, text: "There is no shadow of turning with Thee;" },
        { lineNumber: 3, text: "Thou changest not, Thy compassions, they fail not" },
        { lineNumber: 4, text: "As Thou hast been Thou forever wilt be." }
      ],
      month: "June",
      updatedBy: "fallback"
    },
    july: {
      title: "Blessed Assurance",
      author: "Fanny Crosby",
      lyrics: [
        { lineNumber: 1, text: "Blessed assurance, Jesus is mine!" },
        { lineNumber: 2, text: "Oh, what a foretaste of glory divine!" },
        { lineNumber: 3, text: "Heir of salvation, purchase of God," },
        { lineNumber: 4, text: "Born of His Spirit, washed in His blood." }
      ],
      month: "July",
      updatedBy: "fallback"
    },
    august: {
      title: "It Is Well With My Soul",
      author: "Horatio G. Spafford",
      lyrics: [
        { lineNumber: 1, text: "When peace like a river attendeth my way," },
        { lineNumber: 2, text: "When sorrows like sea billows roll;" },
        { lineNumber: 3, text: "Whatever my lot, Thou hast taught me to say," },
        { lineNumber: 4, text: "It is well, it is well with my soul." }
      ],
      month: "August",
      updatedBy: "fallback"
    },
    september: {
      title: "Come, Thou Fount of Every Blessing",
      author: "Robert Robinson",
      lyrics: [
        { lineNumber: 1, text: "Come, Thou Fount of every blessing," },
        { lineNumber: 2, text: "Tune my heart to sing Thy grace;" },
        { lineNumber: 3, text: "Streams of mercy, never ceasing," },
        { lineNumber: 4, text: "Call for songs of loudest praise." }
      ],
      month: "September",
      updatedBy: "fallback"
    },
    october: {
      title: "A Mighty Fortress Is Our God",
      author: "Martin Luther",
      lyrics: [
        { lineNumber: 1, text: "A mighty fortress is our God," },
        { lineNumber: 2, text: "A bulwark never failing;" },
        { lineNumber: 3, text: "Our helper He, amid the flood" },
        { lineNumber: 4, text: "Of mortal ills prevailing." }
      ],
      month: "October",
      updatedBy: "fallback"
    },
    november: {
      title: "How Great Thou Art",
      author: "Carl Boberg",
      lyrics: [
        { lineNumber: 1, text: "O Lord my God, when I in awesome wonder" },
        { lineNumber: 2, text: "Consider all the worlds Thy hands have made," },
        { lineNumber: 3, text: "I see the stars, I hear the rolling thunder," },
        { lineNumber: 4, text: "Thy pow'r throughout the universe displayed," }
      ],
      month: "November",
      updatedBy: "fallback"
    },
    december: {
      title: "Joy to the World",
      author: "Isaac Watts",
      lyrics: [
        { lineNumber: 1, text: "Joy to the world! the Lord is come;" },
        { lineNumber: 2, text: "Let earth receive her King;" },
        { lineNumber: 3, text: "Let ev'ry heart prepare Him room," },
        { lineNumber: 4, text: "And heav'n and nature sing," }
      ],
      month: "December",
      updatedBy: "fallback"
    }
  };
  
  // Return the appropriate hymn or default if not found
  return fallbackHymns[monthName] || defaultHymn;
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

// Function to convert hymn lyrics from Firebase format to verses format for display
const convertHymnLyricsToVerses = (hymnData: Hymn | null): Array<{verse: number, lines: string[]}> => {
  if (!hymnData || !hymnData.lyrics || hymnData.lyrics.length === 0) {
    return [];
  }

  // Group lyrics by verse (assuming 4 lines per verse)
  const linesPerVerse = 4;
  const verses = [];
  
  // Sort lyrics by lineNumber to ensure correct order
  const sortedLyrics = [...hymnData.lyrics].sort((a, b) => a.lineNumber - b.lineNumber);
  
  // Group into verses of 4 lines each
  for (let i = 0; i < sortedLyrics.length; i += linesPerVerse) {
    const verseLines = sortedLyrics.slice(i, i + linesPerVerse).map(line => line.text);
    verses.push({
      verse: Math.floor(i / linesPerVerse) + 1,
      lines: verseLines
    });
  }
  
  return verses;
}; 