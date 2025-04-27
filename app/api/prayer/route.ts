import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { isBrowser } from '@/lib/utils/environment';

// Check if we're in a build environment
const isBuildEnv = !isBrowser && process.env.NEXT_PUBLIC_IS_NETLIFY_BUILD === 'true';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
});

// Function to safely handle API routes during build time
const safelyHandleRequest = async (handler: () => Promise<Response>): Promise<Response> => {
  // If we're in build environment, return a mock response
  if (isBuildEnv) {
    console.log('[BUILD] Returning mock response for prayer API during build');
    return new Response(JSON.stringify({ 
      prayer: "This is a mock prayer response for build-time rendering."
    }), {
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
      const { verse, reflection } = await req.json();
      
      // Validate inputs
      if (!verse) {
        return NextResponse.json(
          { error: 'Missing required field: verse' },
          { status: 400 }
        );
      }
      
      // Make request to OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a reverent prayer assistant. Your purpose is to create sincere, 
            thoughtful prayers based on Bible verses and personal reflections. The prayers should be:
            1. Respectful and reverent
            2. Personally meaningful
            3. Connected to the verse and reflection provided
            4. Brief (about 100-150 words)`
          },
          {
            role: "user",
            content: `Bible verse: "${verse}"
            ${reflection ? `\n\nPersonal reflection: ${reflection}` : ''}
            
            Please write a thoughtful prayer based on this verse${reflection ? ' and reflection' : ''}.`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });
      
      // Extract and return the generated prayer
      const prayer = response.choices[0]?.message?.content?.trim() || "";
      
      return NextResponse.json({ prayer });
    } catch (error: any) {
      console.error('Error generating prayer:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate prayer' },
        { status: 500 }
      );
    }
  });
} 