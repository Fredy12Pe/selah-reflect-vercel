declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(options: { model: string }): GenerativeModel;
  }

  export interface GenerativeModel {
    generateContent(prompt: string | GenerateContentPrompt): Promise<GenerateContentResult>;
  }

  export interface GenerateContentPrompt {
    parts: Array<{
      text?: string;
      [key: string]: any;
    }>;
  }

  export interface GenerateContentResult {
    response: {
      candidates: Array<{
        content: {
          parts: Array<{
            text: string;
          }>;
        };
      }>;
      text: () => string;
    };
  }
} 