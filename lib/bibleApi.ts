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
export function cleanVerseCache(forceCleanAll = false) {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          if (forceCleanAll) {
            keysToRemove.push(key);
          } else {
            const { timestamp } = JSON.parse(localStorage.getItem(key) || '{}');
            if (Date.now() - timestamp > CACHE_EXPIRATION) {
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          keysToRemove.push(key); // If we can't parse it, remove it
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log(`Cleaned ${keysToRemove.length} ${forceCleanAll ? 'all' : 'expired'} verse cache entries`);
    }
  } catch (error) {
    console.warn('Error cleaning verse cache:', error);
  }
}

// Helper to check available environment variables for debugging
function logAvailableEnvVars() {
  if (typeof window !== 'undefined') {
    console.log('Client-side environment variables:');
    console.log('NEXT_PUBLIC_ESV_API_KEY exists:', !!process.env.NEXT_PUBLIC_ESV_API_KEY);
    console.log('NEXT_PUBLIC_ESV_BIBLE_API_KEY exists:', !!process.env.NEXT_PUBLIC_ESV_BIBLE_API_KEY);
  }
}

// Helper to get the base URL of the app
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || '';
}

export async function getVerse(reference: string, scriptureText?: string) {
  if (!reference) {
    console.error('Empty reference passed to getVerse');
    return createScriptureVerse(reference, scriptureText);
  }
  
  // Sanitize the reference to avoid common API issues
  const sanitizedReference = reference.replace(/\s*\(ESV\)/i, '').trim();
  
  try {
    console.log(`Getting verse for reference: ${sanitizedReference}`);
    
    // Always create a fallback verse immediately so we have something to return
    const fallbackVerse = createScriptureVerse(sanitizedReference, scriptureText);
    
    // If we're offline, don't even try to fetch
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Device is offline, using fallback scripture text');
      return fallbackVerse;
    }
    
    // Check for any cached version first
    const cachedEsv = getCachedVerse(sanitizedReference, 'esv');
    if (cachedEsv) {
      console.log('Using cached ESV verse');
      return cachedEsv;
    }
    
    const cachedBibleApi = getCachedVerse(sanitizedReference, 'bible-api');
    if (cachedBibleApi) {
      console.log('Using cached Bible API verse');
      return cachedBibleApi;
    }
    
    // Use our server-side API proxy endpoint
    console.log('Fetching verse from server API');
    const baseUrl = getBaseUrl();
    const apiUrl = `${baseUrl}/api/bible/${encodeURIComponent(sanitizedReference)}`;
    
    console.log(`Making request to: ${apiUrl}`);
    
    // Use a timeout for the request to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        // Add cache control headers to avoid caching errors
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        
        // Track API errors for debugging
        incrementApiErrorCount();
        
        // If we have a fallback text, use it immediately rather than proceeding
        if (scriptureText) {
          console.log('Using provided scripture text as fallback');
          return fallbackVerse;
        }
        
        // Otherwise try to get error details from the response
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
          
          if (errorData.fallback) {
            console.log('Using fallback data from API');
            return errorData.fallback;
          }
        } catch (parseError) {
          console.error('Failed to parse error response');
        }
        
        throw new Error(`Failed to fetch verse: ${response.statusText}`);
      }
      
      // Successfully got a response, try to parse it
      const data = await response.json();
      
      // If we got a successful response but it's actually a fallback,
      // and we have scriptureText, prefer the scriptureText
      if (data.source === 'fallback' && scriptureText) {
        console.log('API returned fallback data, using provided scripture text instead');
        return fallbackVerse;
      }
      
      console.log('Successfully fetched verse data:', data.source || 'unknown source');
      
      // Create a standard result format
      const result = {
        reference: data.reference || sanitizedReference,
        text: data.text || (scriptureText || sanitizedReference),
        verses: data.verses || [{ verse: 1, text: data.text || (scriptureText || sanitizedReference) }],
      };
      
      // Cache the result with the appropriate source
      const source = data.source || 'api';
      cacheVerse(sanitizedReference, source, result);
      console.log(`API success (${source}), cached result`);
      
      return result;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error in getVerse:', fetchError);
      
      // Track API errors for debugging
      incrementApiErrorCount();
      
      // Use the prepared fallback verse if available
      if (scriptureText) {
        return fallbackVerse;
      }
      
      // Create a minimal fallback object when fetch fails
      return createScriptureVerse(sanitizedReference, "Could not load verse. Please check your connection and try again.");
    }
  } catch (error) {
    console.error('All verse fetching methods failed:', error);
    
    // Return the fallback with the provided scripture text if available
    return createScriptureVerse(sanitizedReference, scriptureText);
  }
}

// Create a fallback verse object when API requests fail
export function createScriptureVerse(reference: string, scriptureText?: string) {
  const displayRef = reference || 'Scripture';
  const text = scriptureText || "Scripture text not available. Please check your connection.";
  
  return {
    reference: displayRef,
    text: text,
    verses: scriptureText ? [{ verse: 1, text: scriptureText }] : 
            [{ verse: 1, text: "Scripture text not available. Please check your connection." }]
  };
}

// Track API errors to help with debugging
function incrementApiErrorCount() {
  try {
    const apiErrorKey = 'bible_api_error_count';
    let errorCount = 0;
    
    const storedCount = localStorage.getItem(apiErrorKey);
    if (storedCount) {
      errorCount = parseInt(storedCount, 10);
    }
    
    errorCount++;
    localStorage.setItem(apiErrorKey, errorCount.toString());
    
    console.log(`API error count: ${errorCount}`);
    
    // If we have too many errors, clear the cache next time
    if (errorCount > 5 && errorCount % 5 === 0) {
      console.log('High error count detected, will clean cache on next app start');
    }
  } catch (e) {
    // Ignore errors with localStorage
  }
}

// Call this function during app initialization to try to fix any issues
export function checkAndFixBibleApi() {
  if (typeof window !== 'undefined') {
    // Clean cache 
    console.log('Checking Bible API configuration...');
    
    // Check if we're getting API errors
    const apiErrorKey = 'bible_api_error_count';
    let errorCount = 0;
    
    try {
      const storedCount = localStorage.getItem(apiErrorKey);
      if (storedCount) {
        errorCount = parseInt(storedCount, 10);
      }
    } catch (e) {}
    
    // If we've had repeated errors, clean cache
    if (errorCount > 5) {
      try {
        console.log('Detected repeated Bible API errors, clearing cache...');
        cleanVerseCache(true); // Force clean all
        localStorage.setItem(apiErrorKey, '0');
      } catch (e) {}
    }
    
    // Log environment variables for debugging
    logAvailableEnvVars();
  }
}

// Run cache cleaning and API check when this module loads
if (typeof window !== 'undefined') {
  // Wait until the app is fully loaded
  setTimeout(() => {
    cleanVerseCache();
    checkAndFixBibleApi();
  }, 5000);
}

export function getTodaysVerse() {
  // This is a placeholder - you'll need to implement your own verse selection logic
  // You could store verses in Firestore or have a predefined list
  return 'John 3:16';
} 