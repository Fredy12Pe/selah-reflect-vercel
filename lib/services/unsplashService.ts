/**
 * Unsplash Service
 * 
 * Provides utility functions for fetching images from Unsplash API.
 * Requires NEXT_PUBLIC_UNSPLASH_ACCESS_KEY environment variable to be set.
 */

const UNSPLASH_API_URL = 'https://api.unsplash.com';
const ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

// Flag to disable API calls after consistent failures
let API_DISABLED = false;

/**
 * Types for Unsplash API responses
 */
export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

/**
 * Gets a random background image from Unsplash based on a search query
 * 
 * @param query - The search query (e.g. "bible", "nature", "prayer")
 * @param options - Additional options like date parameter for cache busting and signal for AbortController
 */
export async function getRandomBackgroundImage(
  query: string = 'landscape,mountains,nature',
  options: { dateParam?: string, signal?: AbortSignal } = {}
): Promise<UnsplashImage | null> {
  // If API has been consistently failing, don't even try
  if (API_DISABLED) {
    console.warn('UnsplashService: API calls are currently disabled due to previous failures');
    return null;
  }
  
  if (!ACCESS_KEY) {
    console.warn('Unsplash Access Key not set in environment variables');
    return null;
  }

  try {
    const cacheParam = options.dateParam ? `&v=${options.dateParam}` : '';
    const response = await fetch(
      `${UNSPLASH_API_URL}/photos/random?query=${encodeURIComponent(query)}&orientation=landscape${cacheParam}`,
      {
        headers: {
          Authorization: `Client-ID ${ACCESS_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: options.signal
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Unsplash API error: ${response.status} - "${errorText}"`);
      
      // If we get a 403 (Forbidden) or 429 (Too Many Requests), disable API calls for this session
      if (response.status === 403 || response.status === 429) {
        console.warn('UnsplashService: API key issue or rate limit exceeded, disabling API calls for this session');
        API_DISABLED = true;
      }
      
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error);
    return null;
  }
}

/**
 * Gets a daily image for devotions
 * Uses the date to ensure the same image is shown all day
 * 
 * @param date - ISO date string (YYYY-MM-DD)
 * @param query - Search query for the image
 */
export async function getDailyDevotionImage(
  date: string,
  query: string = 'landscape,mountains,forest,sunset,nature'
): Promise<string> {
  try {
    // Local fallback images
    const fallbackImages = {
      default: '/images/background.jpg',
      hymn: '/images/hymn-bg.jpg',
      resources: '/images/resources-bg.jpg',
      scripture: '/images/scripture-bg.jpg',
    };
    
    // Determine which fallback to use based on the query
    let fallbackImage = fallbackImages.default;
    if (query.includes('mountains') || query.includes('sunrise')) {
      fallbackImage = fallbackImages.hymn;
    } else if (query.includes('forest') || query.includes('lake')) {
      fallbackImage = fallbackImages.resources;
    } else if (query.includes('bible') || query.includes('scripture')) {
      fallbackImage = fallbackImages.scripture;
    }
    
    // If API is disabled or ACCESS_KEY is not available, don't even try the API call
    if (API_DISABLED || !ACCESS_KEY) {
      console.warn('UnsplashService: API disabled or Access Key not set, using local image');
      return fallbackImage;
    }
    
    // Use the date as a parameter for cache busting
    const dateParam = date.replace(/-/g, '');
    
    // Log information about the request to help debug
    console.log(`UnsplashService: Getting image for date=${date}, query=${query}`);
    
    // Add a timeout to the fetch call to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    try {
      // For today's date, force a unique request to bypass caching
      const isToday = new Date(date).toDateString() === new Date().toDateString();
      const cacheBuster = isToday ? `_${new Date().getHours()}` : '';
      
      const image = await getRandomBackgroundImage(query, { 
        dateParam: dateParam + cacheBuster,
        signal: controller.signal  
      });
      
      clearTimeout(timeoutId);
    
    if (image?.urls?.regular) {
        // Return direct Unsplash URL
      return image.urls.regular;
      } else {
        console.warn('UnsplashService: No image URL returned, using local image');
        return fallbackImage;
      }
    } catch (fetchError) {
      console.error('UnsplashService: API fetch error:', fetchError);
      return fallbackImage;
    }
  } catch (error) {
    console.error('UnsplashService: Error in getDailyDevotionImage:', error);
    return '/images/hymn-bg.jpg'; // Ultimate fallback
  }
}

/**
 * Generate attribution text for an Unsplash image
 */
export function getUnsplashAttribution(imageUrl: string | UnsplashImage): string {
  if (typeof imageUrl === 'string') {
    return 'Photo from Unsplash';
  }
  return `Photo by ${imageUrl.user.name} on Unsplash`;
} 