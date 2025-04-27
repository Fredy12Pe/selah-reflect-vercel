"use client";

import React, { useState } from "react";
import { getReflectionResponse } from "@/lib/gemini";

interface ReflectWithAIProps {
  verse: string;
  onSaveReflection?: (reflection: string) => void;
}

export default function ReflectWithAI({
  verse,
  onSaveReflection,
}: ReflectWithAIProps) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const aiResponse = await getReflectionResponse(verse, question);
      setResponse(aiResponse);
    } catch (err) {
      setError("Failed to get AI reflection. Please try again.");
      console.error("AI reflection error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Reflect with AI</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about today's scripture..."
          className="input-field"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="btn-primary w-full"
        >
          {isLoading ? "Thinking..." : "Get AI Reflection"}
        </button>
      </form>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {response && (
        <div className="card space-y-4">
          <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
          {onSaveReflection && (
            <button
              onClick={() => onSaveReflection(response)}
              className="text-primary hover:text-primary/80"
            >
              Save to Journal
            </button>
          )}
        </div>
      )}
    </div>
  );
}
