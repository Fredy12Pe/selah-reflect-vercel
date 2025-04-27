import { GoogleGenerativeAI } from "@google/generative-ai";

// Get the API key from environment variables
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
               process.env.GEMINI_API_KEY;

// Initialize the API client if the key is available
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function getReflectionResponse(verse: string, userQuestion: string) {
  if (!genAI) {
    console.error("Gemini API key is not configured");
    throw new Error("AI service is not available. Please check your environment configuration.");
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Based on the scripture: ${verse}, answer this question: ${userQuestion}. 
      Please provide a spiritually grounded, Biblically faithful response.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating AI content:", error);
    throw new Error("Failed to generate AI reflection. Please try again later.");
  }
}

export async function getResources(verse: string) {
  if (!genAI) {
    console.error("Gemini API key is not configured");
    throw new Error("AI service is not available. Please check your environment configuration.");
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `What are 2-3 relevant podcasts, YouTube videos, or articles to help reflect on ${verse}?`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating AI resources:", error);
    throw new Error("Failed to generate resources. Please try again later.");
  }
} 