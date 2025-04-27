"use client";

import { useState, useEffect } from "react";
import { getVerse, TRANSLATIONS } from "@/lib/services/bible";

interface BibleVerseDisplayProps {
  reference?: string;
  translation?: keyof typeof TRANSLATIONS;
}

export default function BibleVerseDisplay({
  reference = "John 3:16",
  translation = "ESV",
}: BibleVerseDisplayProps) {
  const [verse, setVerse] = useState<{
    reference: string;
    text: string;
    translation: string;
  } | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVerse() {
      try {
        setLoading(true);
        const verseData = await getVerse(reference, TRANSLATIONS[translation]);
        setVerse(verseData);
        setError("");
      } catch (err) {
        setError("Failed to load verse. Please try again later.");
        console.error("Error fetching verse:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVerse();
  }, [reference, translation]);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        <div className="relative z-1 p-6 sm:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/20 rounded w-3/4"></div>
            <div className="h-4 bg-white/20 rounded w-full"></div>
            <div className="h-4 bg-white/20 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        <div className="relative z-1 p-6 sm:p-8">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!verse) {
    return null;
  }

  // Remove HTML tags from the verse text
  const cleanText = verse.text.replace(/<\/?[^>]+(>|$)/g, "");

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative z-1 p-6 sm:p-8 space-y-6">
        <h2 className="text-white text-4xl font-bold tracking-tight">
          {verse.reference}
        </h2>
        <p className="text-white/90 text-xl leading-relaxed font-light">
          {cleanText}
        </p>
        <p className="text-white/70 text-sm">{translation}</p>
      </div>
    </div>
  );
}
