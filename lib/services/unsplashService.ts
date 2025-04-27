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
 * @param options - Additional options like date parameter for cache busting
 */
export async function getRandomBackgroundImage(
  query: string = 'landscape,mountains,nature',
  options: { dateParam?: string } = {}
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
    // Use the date as a parameter for cache busting
    const dateParam = date.replace(/-/g, '');
    const image = await getRandomBackgroundImage(query, { dateParam });
    
    if (image) {
      return image.urls.regular;
    }
    
    // Fallback to direct Unsplash source URL if API call fails
    return `https://source.unsplash.com/featured/?${encodeURIComponent(query)}&v=${dateParam}`;
  } catch (error) {
    console.error('Error in getDailyDevotionImage:', error);
    return '/images/background.jpg'; // Fallback to local image
  }
}

/**
 * Generate attribution text for an Unsplash image
 */
export function getUnsplashAttribution(image: UnsplashImage): string {
  return `Photo by ${image.user.name} on Unsplash`;
} 