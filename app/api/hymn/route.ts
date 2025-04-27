import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { isBrowser } from '@/lib/utils/environment';

// Check if we're in a build environment
const isBuildEnv = !isBrowser && process.env.NEXT_PUBLIC_IS_NETLIFY_BUILD === 'true';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
});

// Mock hymn response for build time
const mockHymn = {
  title: "Amazing Grace",
  author: "John Newton",
  content: "Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.\n\n'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed.\n\nThrough many dangers, toils and snares,\nI have already come;\n'Tis grace hath brought me safe thus far,\nAnd grace will lead me home.",
  year: "1779"
};

// Function to safely handle API routes during build time
const safelyHandleRequest = async (handler: () => Promise<Response>): Promise<Response> => {
  // If we're in build environment, return a mock response
  if (isBuildEnv) {
    console.log('[BUILD] Returning mock response for hymn API during build');
    return new Response(JSON.stringify(mockHymn), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
  
  // Otherwise, proceed with normal handler
  return await handler();
};

export async function POST(req: Request) {
  return safelyHandleRequest(async () => {
    try {
      // Parse request body
      const { passage, reflection } = await req.json();
      
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
            content: `You are a hymn expert. Your purpose is to suggest a hymn that matches 
            the themes or message of a given Bible passage. Choose a real, well-known classic 
            Christian hymn that would complement the passage's message.
            
            Format your response as valid JSON with the following structure:
            {
              "title": "Hymn Title",
              "author": "Hymn Author",
              "content": "Full hymn lyrics with proper line breaks",
              "year": "Year composed (if known)"
            }
            
            Provide at least 3 verses of the hymn, properly formatted with line breaks.
            Choose hymns that have stood the test of time and would be recognizable to most Christians.`
          },
          {
            role: "user",
            content: `Bible passage: "${passage}"
            ${reflection ? `Reflection: "${reflection}"` : ''}
            
            Please suggest a hymn that connects with the themes of this passage and provide the full details.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });
      
      // Extract the generated hymn
      const hymnText = response.choices[0]?.message?.content?.trim() || "{}";
      
      try {
        const hymn = JSON.parse(hymnText);
        return NextResponse.json(hymn);
      } catch (jsonError) {
        console.error('Error parsing hymn JSON:', jsonError, hymnText);
        return NextResponse.json(
          { error: 'Failed to parse hymn data' },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('Error generating hymn:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate hymn' },
        { status: 500 }
      );
    }
  });
} 