import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { isBrowser, shouldSkipFirebaseInit } from '@/lib/utils/environment';

// Check if we're in a build environment
const isBuildEnv = !isBrowser && process.env.NEXT_PUBLIC_IS_NETLIFY_BUILD === 'true';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

interface ResourceItem {
  type: 'commentary' | 'video' | 'podcast' | 'book';
  title: string;
  description: string;
  url?: string;
  author?: string;
}

// List of reliable resource domains that are known to work
const RELIABLE_DOMAINS = [
  'biblegateway.com',
  'biblehub.com',
  'blueletterbible.org',
  'bible.org',
  'youtube.com',
  'youtu.be',
  'amazon.com',
  'christianbook.com',
  'goodreads.com',
  'desiringgod.org',
  'thegospelcoalition.org',
  'ligonier.org',
  'logos.com',
  'bibleproject.com',
  'spotify.com',
  'apple.com/apple-podcasts',
  'podcasts.apple.com',
  'crossway.org',
  'ivpress.com',
  'gotquestions.org',
  'openbible.info',
  'archive.org'
];

// Highly reliable specific URLs that are guaranteed to work
const GUARANTEED_RESOURCES = {
  commentary: [
    {
      title: 'Bible Hub Commentaries',
      author: 'Various Biblical Scholars',
      description: 'Comprehensive collection of free Bible commentaries from various scholars and traditions.',
      url: 'https://biblehub.com/commentaries/',
      type: 'commentary'
    },
    {
      title: 'Blue Letter Bible Study Tools',
      author: 'Various Contributors',
      description: 'Interactive tools for in-depth Bible study including commentaries, lexical aids, and cross-references.',
      url: 'https://www.blueletterbible.org/study.cfm',
      type: 'commentary'
    },
    {
      title: 'Bible Gateway Commentaries',
      author: 'Various',
      description: 'Selection of study resources and commentaries on Bible passages.',
      url: 'https://www.biblegateway.com/resources/commentaries/',
      type: 'commentary'
    }
  ],
  video: [
    {
      title: 'BibleProject',
      author: 'Tim Mackie & Jon Collins',
      description: 'High-quality videos exploring biblical themes and passages.',
      url: 'https://bibleproject.com/explore',
      type: 'video'
    },
    {
      title: 'The Bible on YouTube',
      author: 'Various Contributors',
      description: 'Bible study videos and teachings from various sources and perspectives.',
      url: 'https://www.youtube.com/results?search_query=bible+study',
      type: 'video'
    }
  ],
  podcast: [
    {
      title: 'BibleProject Podcast',
      author: 'Tim Mackie & Jon Collins',
      description: 'In-depth conversations about biblical theology and themes.',
      url: 'https://bibleproject.com/podcasts/the-bible-project-podcast/',
      type: 'podcast'
    },
    {
      title: 'Bible Study Podcasts',
      author: 'Various',
      description: 'Collection of Bible study podcasts available on Apple Podcasts.',
      url: 'https://podcasts.apple.com/us/genre/podcasts-religion-spirituality-christianity/id1439',
      type: 'podcast'
    }
  ],
  book: [
    {
      title: 'Bible Commentaries on Amazon',
      author: 'Various',
      description: 'Collection of Bible commentaries and study resources available for purchase.',
      url: 'https://www.amazon.com/s?k=bible+commentary',
      type: 'book'
    },
    {
      title: 'Christian Books',
      author: 'Various',
      description: 'Wide selection of biblical resources, commentaries, and study materials.',
      url: 'https://www.christianbook.com/page/bible-studies/bible-commentaries',
      type: 'book'
    }
  ]
};

// Mock resources for build time
const mockResources = {
  commentaries: [
    {
      title: "Matthew Henry's Commentary",
      author: "Matthew Henry",
      description: "A mock commentary entry for build-time rendering",
      link: "#"
    }
  ],
  videos: [
    {
      title: "Bible Project Overview",
      author: "Bible Project",
      description: "A mock video resource for build-time rendering",
      link: "#"
    }
  ],
  books: [
    {
      title: "Mere Christianity",
      author: "C.S. Lewis",
      description: "A mock book resource for build-time rendering",
      link: "#"
    }
  ],
  podcasts: [
    {
      title: "The Bible Recap",
      author: "D-Group",
      description: "A mock podcast resource for build-time rendering",
      link: "#"
    }
  ]
};

/**
 * Check if a URL is likely to be valid based on domain
 */
function isLikelyValidUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  
  try {
    const domain = new URL(url).hostname;
    return RELIABLE_DOMAINS.some(validDomain => domain.includes(validDomain));
  } catch (e) {
    return false;
  }
}

/**
 * Get guaranteed working resources for a specific type and verse
 */
function getGuaranteedResources(type: 'commentary' | 'video' | 'podcast' | 'book', verse: string): ResourceItem[] {
  const baseResources = GUARANTEED_RESOURCES[type] || [];
  
  // For commentaries, try to create a specific URL for the verse if possible
  if (type === 'commentary') {
    // Extract book, chapter, and verse for Bible Hub URL format
    let url = '';
    try {
      // Basic parsing for common formats like "Luke 24:36-44"
      const match = verse.match(/(\w+)\s+(\d+):(\d+)(-\d+)?/);
      if (match) {
        const [_, book, chapter, verseNum] = match;
        url = `https://biblehub.com/commentaries/${book.toLowerCase()}/${chapter}.htm`;
      }
    } catch (e) {
      url = 'https://biblehub.com/commentaries/';
    }
    
    if (url && url !== 'https://biblehub.com/commentaries/') {
      // Add a specific commentary for this verse
      const specificResource: ResourceItem = {
        title: `${verse} Commentary`,
        author: 'Various Biblical Scholars',
        description: `Commentary collection specifically for ${verse} with multiple scholarly perspectives.`,
        url,
        type: 'commentary'
      };
      
      return [
        specificResource,
        ...baseResources as ResourceItem[]
      ];
    }
  }
  
  return baseResources as ResourceItem[];
}

// Function to safely handle API routes during build time
const safelyHandleRequest = async (handler: () => Promise<Response>): Promise<Response> => {
  // If we're in build environment, return a mock response
  if (isBuildEnv) {
    console.log('[BUILD] Returning mock response for resources API during build');
    return new Response(JSON.stringify(mockResources), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
  
  // Otherwise, proceed with normal handler
  return await handler();
};

/**
 * Handle POST requests to generate scripture resources
 */
export async function POST(req: Request) {
  return safelyHandleRequest(async () => {
    try {
      // Parse request body
      const { passage } = await req.json();
      
      // Validate inputs
      if (!passage) {
        return NextResponse.json(
          { error: 'Missing required field: passage' },
          { status: 400 }
        );
      }
      
      // Make request to OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a Bible resource expert. Your purpose is to suggest high-quality Christian resources
            related to a given Bible passage. For each resource category, provide 1-3 relevant, real resources that 
            would help someone understand the passage better. Include title, author, a brief description, and a link 
            (use '#' if no specific link is available).
            
            FORMAT YOUR RESPONSE AS VALID JSON with these categories:
            {
              "commentaries": [{"title": "...", "author": "...", "description": "...", "link": "..."}],
              "videos": [{"title": "...", "author": "...", "description": "...", "link": "..."}],
              "books": [{"title": "...", "author": "...", "description": "...", "link": "..."}],
              "podcasts": [{"title": "...", "author": "...", "description": "...", "link": "..."}]
            }
            
            For videos, prioritize resources from The Bible Project, GotQuestions, and similar reputable channels.
            For commentaries, include classic works (Matthew Henry, etc.) and modern scholarly resources.
            For books, suggest titles that provide deeper theological understanding of the passage's themes.
            For podcasts, suggest episodes or series that address the passage's context or application.`
          },
          {
            role: "user",
            content: `Bible passage: "${passage}"
            
            Please provide a structured JSON response with resource recommendations for this passage.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });
      
      // Extract the generated resources
      const resourcesText = response.choices[0]?.message?.content?.trim() || "{}";
      
      try {
        const resources = JSON.parse(resourcesText);
        return NextResponse.json(resources);
      } catch (jsonError) {
        console.error('Error parsing resources JSON:', jsonError, resourcesText);
        return NextResponse.json(
          { error: 'Failed to parse resources data' },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('Error generating resources:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate resources' },
        { status: 500 }
      );
    }
  });
} 