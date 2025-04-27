/**
 * Image Utility Functions
 * 
 * Provides functions for working with images in both client and server components.
 */

/**
 * Generates a deterministic Unsplash source URL based on date and query
 * This doesn't require an API key and works in both client and server components
 * 
 * @param date ISO date string (YYYY-MM-DD) to get a consistent image for the day
 * @param query Search query terms
 * @returns URL string for an Unsplash image
 */
export function getUnsplashSourceUrl(
  date: string, 
  query: string = 'landscape mountains forest nature'
): string {
  // Generate a numeric hash from the date
  const dateHash = date.replace(/-/g, '');
  
  // For Unsplash Source, the format should be:
  // https://source.unsplash.com/random/1600x900/?nature,water
  // The query params need to be comma-separated without spaces for the URL parameters
  const formattedQuery = query.replace(/ /g, ',');
  
  // Create the Unsplash source URL with correct format
  return `https://source.unsplash.com/random/1600x900/?${formattedQuery}&sig=${dateHash}`;
}

/**
 * Determines if an image URL is from Unsplash
 */
export function isUnsplashImage(url: string): boolean {
  return url.includes('unsplash.com');
}

/**
 * Creates a fallback image URL when the primary one isn't available
 */
export function getFallbackImageUrl(imageType: string): string {
  switch (imageType) {
    case 'devotion':
      return '/images/background.jpg';
    case 'hymn':
      return '/hymn-bg.jpg';
    case 'resources':
      return '/resources-bg.jpg';
    default:
      return '/images/background.jpg';
  }
}

/**
 * Gets image quality parameter based on image type
 */
export function getImageQuality(imageType: string): number {
  switch (imageType) {
    case 'devotion':
      return 90;
    case 'thumbnail':
      return 75;
    default:
      return 85;
  }
} 