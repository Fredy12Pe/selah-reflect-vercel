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
    console.log('[BUILD] Returning mock response for reflection API during build');
    return new Response(JSON.stringify({ 
      reflection: "This is a mock reflection response for build-time rendering."
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
  
  // Otherwise, proceed with normal handler
  return await handler();
};

/**
 * Handle POST requests to generate AI reflections
 */
export async function POST(req: Request) {
  return safelyHandleRequest(async () => {
    try {
      // Parse request
      const { verse, question } = await req.json();

      // Validate inputs
      if (!verse || !question) {
        return NextResponse.json(
          { error: "Missing required fields: verse and/or question" },
          { status: 400 }
        );
      }

      // Make request to OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a thoughtful Christian devotional assistant. 
            Your purpose is to help users reflect on Bible verses in a way that is:
            1. Biblically sound and theologically careful
            2. Thoughtful and reflective rather than preachy
            3. Personal and applicable to daily life
            4. Brief (about 150-250 words)
            
            Base your reflection specifically on the verse provided.`
          },
          {
            role: "user",
            content: `Bible verse: "${verse}"\n\nReflection question: ${question}\n\nPlease provide a thoughtful Christian reflection on this verse that addresses the question.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      // Extract and return the reflection
      const reflection = response.choices[0]?.message?.content?.trim() || "";

      return NextResponse.json({ reflection });
    } catch (error: any) {
      console.error("Error generating reflection:", error);
      return NextResponse.json(
        { error: error.message || "Failed to generate reflection" },
        { status: 500 }
      );
    }
  });
} 