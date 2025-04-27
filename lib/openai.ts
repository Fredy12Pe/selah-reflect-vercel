import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Allow client-side usage
});

/**
 * Get AI reflection response for a Bible verse and user question
 * @param verse The Bible verse to reflect on
 * @param userQuestion The user's question about the verse
 * @returns The AI-generated reflection
 */
export async function getBibleReflection(verse: string, userQuestion: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a knowledgeable biblical scholar and spiritual guide. 
          Provide thoughtful, reverent reflections on scripture that are biblically sound, 
          historically informed, and spiritually meaningful. Maintain a respectful, 
          pastoral tone. Your responses should be 2-3 paragraphs at most.`
        },
        {
          role: "user",
          content: `Scripture reference: ${verse}\n\nQuestion: ${userQuestion}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    // Return the generated text
    return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a reflection at this time.";
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("Failed to generate reflection. Please try again later.");
  }
} 