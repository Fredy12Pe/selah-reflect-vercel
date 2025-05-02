/**
 * Unsplash Service
 * 
 * Provides utility functions for fetching images from Unsplash API.
 * Requires NEXT_PUBLIC_UNSPLASH_ACCESS_KEY environment variable to be set.
 */

const UNSPLASH_API_URL = 'https://api.unsplash.com';
const ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

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
      console.error('Unsplash API error:', response.statusText);
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
      hymn: '/hymn-bg.jpg',
      resources: '/resources-bg.jpg',
      scripture: '/scripture-bg.jpg',
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
    
    // If ACCESS_KEY is not available, don't even try the API call
    if (!ACCESS_KEY) {
      console.warn('UnsplashService: Access Key not set, using local image');
      return fallbackImage;
    }
    
    // Use the date as a parameter for cache busting
    const dateParam = date.replace(/-/g, '');
    
    // Add a timeout to the fetch call to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    try {
      const image = await getRandomBackgroundImage(query, { 
        dateParam,
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
    return '/hymn-bg.jpg'; // Ultimate fallback
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