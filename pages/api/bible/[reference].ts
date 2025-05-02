import { NextApiRequest, NextApiResponse } from 'next';

// Import dotenv to ensure .env.local is loaded
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}

// Log all possible ESV API key environment variables for debugging
function logESVAPIKeyStatus() {
  console.log('[API] Checking ESV API key environment variables:');
  console.log('- ESV_API_KEY:', process.env.ESV_API_KEY ? '✅ Present' : '❌ Missing');
  console.log('- NEXT_PUBLIC_ESV_API_KEY:', process.env.NEXT_PUBLIC_ESV_API_KEY ? '✅ Present' : '❌ Missing');
  console.log('- ESV_BIBLE_API_KEY:', process.env.ESV_BIBLE_API_KEY ? '✅ Present' : '❌ Missing');
  console.log('- NEXT_PUBLIC_ESV_BIBLE_API_KEY:', process.env.NEXT_PUBLIC_ESV_BIBLE_API_KEY ? '✅ Present' : '❌ Missing');
}

const ESV_API_BASE_URL = 'https://api.esv.org/v3/passage/text';
const BIBLE_API_BASE_URL = 'https://bible-api.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log the API key status for debugging
  logESVAPIKeyStatus();

  const { reference } = req.query;
  
  if (!reference || typeof reference !== 'string') {
    return res.status(400).json({ error: 'Bible reference is required' });
  }
  
  // Sanitize the reference to make it more API-friendly
  const sanitizedRef = reference
    .replace(/\s*\(ESV\)/i, '')  // Remove "(ESV)" suffix that might cause issues
    .trim();
    
  console.log(`[API] Fetching Bible verse for reference: ${sanitizedRef} (original: ${reference})`);
  
  try {
    // Try ESV API first
    try {
      // Check all possible environment variable names for the ESV API key
      const esvApiKey = process.env.ESV_API_KEY || 
                        process.env.NEXT_PUBLIC_ESV_API_KEY || 
                        process.env.ESV_BIBLE_API_KEY || 
                        process.env.NEXT_PUBLIC_ESV_BIBLE_API_KEY;

      if (!esvApiKey) {
        console.error('[API] ESV API key is not configured in any environment variable');
        throw new Error('ESV API key is not configured');
      }
      
      if (esvApiKey === 'YOUR_ESV_API_KEY' || esvApiKey === 'test_key_for_demo_purposes') {
        console.error('[API] Invalid ESV API key found:', esvApiKey);
        throw new Error('Invalid ESV API key');
      }

      console.log('[API] Using ESV API key:', esvApiKey.substring(0, 5) + '...');
      
      // Set a reasonable timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(
        `${ESV_API_BASE_URL}/?q=${encodeURIComponent(sanitizedRef)}&include-passage-references=true&include-verse-numbers=true&include-footnotes=false`,
        {
          headers: {
            'Authorization': `Token ${esvApiKey}`
          },
          // Add timeout to avoid hanging requests
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`[API] ESV API error: ${response.status} ${response.statusText}`);
        
        // Add specific error details for different status codes
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication error: Your ESV API key appears to be invalid or unauthorized. Status: ${response.status}`);
        } else if (response.status === 404) {
          throw new Error(`Reference not found: The ESV API couldn't find the reference "${sanitizedRef}"`);
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded: The ESV API is being called too frequently. Please try again later.`);
        } else {
          throw new Error(`ESV API error: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      
      if (!data.passages || data.passages.length === 0) {
        console.error('[API] ESV API returned no passages for reference:', sanitizedRef);
        throw new Error('No verses found');
      }
      
      // Process ESV data into standard format
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
      
      // If we couldn't extract verses, use the whole text
      if (verses.length === 0) {
        verses.push({
          verse: 1,
          text: text.replace(/\[\d+\]/g, '').trim() // Strip verse numbers
        });
      }
      
      const result = {
        source: 'esv',
        reference: data.passage_meta[0]?.canonical || sanitizedRef,
        text: text,
        verses: verses,
      };
      
      return res.status(200).json(result);
    } catch (esvError: any) {
      console.log('[API] ESV API failed, falling back to bible-api.com:', esvError);
      // Include the error in the logs for debugging
      console.error('[API] ESV API error details:', esvError.message);
      // Fall back to bible-api.com
    }
    
    // Fallback to bible-api.com
    console.log('[API] Attempting to use fallback API (bible-api.com)');
    
    // Set a reasonable timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(
      `${BIBLE_API_BASE_URL}/${encodeURIComponent(sanitizedRef)}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Bible API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.text) {
      throw new Error('Bible API returned invalid data');
    }
    
    // Create a standard result format
    const result = {
      source: 'bible-api',
      reference: data.reference || sanitizedRef,
      text: data.text,
      verses: Array.isArray(data.verses) && data.verses.length > 0 
        ? data.verses 
        : [{ verse: 1, text: data.text }],
    };
    
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[API] Error fetching Bible verse:', error);
    
    // Determine if it's a network error
    const isNetworkError = error.message && (
      error.message.includes('network') || 
      error.message.includes('abort') ||
      error.message.includes('fetch')
    );
    
    // Create a more helpful fallback response for the client
    const fallbackResponse = {
      reference: sanitizedRef,
      source: 'fallback',
      text: `${sanitizedRef}`,
      error: error.message || 'Unknown error',
      isNetworkError: isNetworkError,
      verses: [{ 
        verse: 1, 
        text: `Could not load verse: ${sanitizedRef}. Please use the provided scripture text instead.` 
      }]
    };
    
    return res.status(200).json(fallbackResponse);
  }
} 