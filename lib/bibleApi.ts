const BIBLE_API_BASE_URL = 'https://bible-api.com';
const ESV_API_BASE_URL = 'https://api.esv.org/v3/passage/text';
const CACHE_PREFIX = 'bible_verse_cache_';
const CACHE_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Function to save a verse to localStorage cache
export function cacheVerse(reference: string, version: string, data: any) {
  try {
    const cacheKey = `${CACHE_PREFIX}${version}_${reference.replace(/\s+/g, '_')}`;
    const cacheItem = {
      timestamp: Date.now(),
      data: data
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    console.log(`Cached verse: ${reference} (${version})`);
  } catch (error) {
    console.warn('Failed to cache verse:', error);
  }
}

// Function to get a verse from localStorage cache
export function getCachedVerse(reference: string, version: string = 'esv') {
  try {
    const cacheKey = `${CACHE_PREFIX}${version}_${reference.replace(/\s+/g, '_')}`;
    const cachedItem = localStorage.getItem(cacheKey);
    
    if (!cachedItem) return null;
    
    const { timestamp, data } = JSON.parse(cachedItem);
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_EXPIRATION) {
      console.log(`Cache expired for: ${reference}`);
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    console.log(`Using cached verse: ${reference} (${version})`);
    return data;
  } catch (error) {
    console.warn('Error retrieving cached verse:', error);
    return null;
  }
}

// Clear old cached verses to free up storage
export function cleanVerseCache() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const { timestamp } = JSON.parse(localStorage.getItem(key) || '{}');
          if (Date.now() - timestamp > CACHE_EXPIRATION) {
            keysToRemove.push(key);
          }
        } catch (e) {
          keysToRemove.push(key); // If we can't parse it, remove it
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log(`Cleaned ${keysToRemove.length} expired verse cache entries`);
    }
  } catch (error) {
    console.warn('Error cleaning verse cache:', error);
  }
}

export async function getESVVerse(reference: string) {
  // First check cache
  const cachedVerse = getCachedVerse(reference, 'esv');
  if (cachedVerse) return cachedVerse;
  
  try {
    const esvApiKey = process.env.NEXT_PUBLIC_ESV_BIBLE_API_KEY;
    
    if (!esvApiKey) {
      throw new Error('ESV API key is not configured');
    }
    
    const response = await fetch(
      `${ESV_API_BASE_URL}/?q=${encodeURIComponent(reference)}&include-passage-references=true&include-verse-numbers=true&include-footnotes=false`,
      {
        headers: {
          'Authorization': `Token ${esvApiKey}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`ESV API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.passages || data.passages.length === 0) {
      throw new Error('No verses found');
    }
    
    // Process ESV data into our standard format
    const text = data.passages[0];
    const verseRegex = /\[(\d+)\](.*?)(?=\[\d+\]|$)/g;
    const verses = [];
    let match;
    
    while ((match = verseRegex.exec(text)) !== null) {
      verses.push({
        verse: parseInt(match[1]),
        text: match[2].trim(),
      });
    }
    
    const result = {
      reference: data.passage_meta[0]?.canonical || reference,
      text: text,
      verses: verses.length > 0 ? verses : [{verse: 1, text}],
    };
    
    // Cache the result
    cacheVerse(reference, 'esv', result);
    
    return result;
  } catch (error) {
    console.error('Error fetching ESV verse:', error);
    throw error;
  }
}

export async function getVerse(reference: string) {
  try {
    // Check for any cached version first
    const cachedEsv = getCachedVerse(reference, 'esv');
    if (cachedEsv) return cachedEsv;
    
    const cachedBibleApi = getCachedVerse(reference, 'bible-api');
    if (cachedBibleApi) return cachedBibleApi;
    
    // Try ESV API first
    try {
      return await getESVVerse(reference);
    } catch (esvError) {
      console.log('Falling back to bible-api.com:', esvError);
      // Continue to fallback
    }
    
    // Fallback to bible-api.com
    const response = await fetch(`${BIBLE_API_BASE_URL}/${encodeURIComponent(reference)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch verse');
    }
    const data = await response.json();
    
    const result = {
      reference: data.reference,
      text: data.text,
      verses: data.verses,
    };
    
    // Cache the result
    cacheVerse(reference, 'bible-api', result);
    
    return result;
  } catch (error) {
    console.error('Error fetching verse:', error);
    throw error;
  }
}

// Run cache cleaning when this module loads
if (typeof window !== 'undefined') {
  // Wait until the app is fully loaded
  setTimeout(cleanVerseCache, 5000);
}

export function getTodaysVerse() {
  // This is a placeholder - you'll need to implement your own verse selection logic
  // You could store verses in Firestore or have a predefined list
  return 'Luke 23:26-34';
} 