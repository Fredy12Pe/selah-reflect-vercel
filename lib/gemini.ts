import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getReflectionResponse(verse: string, userQuestion: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `Based on the scripture: ${verse}, answer this question: ${userQuestion}. 
    Please provide a spiritually grounded, Biblically faithful response.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function getResources(verse: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `What are 2-3 relevant podcasts, YouTube videos, or articles to help reflect on ${verse}?`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
} 